"""Integrity, real transport and positive/negative local release mechanism tests.

Positive acceptance uses explicitly injected synthetic failures, never learning evidence.
"""
import hashlib
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import tempfile
import threading
import unittest
from unittest.mock import patch

from . import adapters, audit, checker, cycle, evaluation, fixtures, governor, runtime
from .core import canonical, digest
from .pilot import write


GOOD = b'1\n00:00:00,100 --> 00:00:01,000\nhello\n'


class GovernorTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)

    def runtime_episode(self, **changes):
        sample = self.root/'input.srt'
        sample.write_bytes(GOOD)
        app = runtime.Runtime(self.root/'state')
        self.addCleanup(app.close)
        app.run(runtime.task_for(sample) | changes, self.root)
        return app

    def test_audit_recomputes_verdict_even_when_chain_is_rebuilt(self):
        app = self.runtime_episode()
        self.assertEqual(1, audit.check(app.root)['verified'])
        path = app.root/'events.jsonl'
        events = [json.loads(line) for line in path.read_text().splitlines()]
        previous = '0'*64
        for event in events:
            if event['kind'] == 'RuntimeVerification':
                event['payload']['result'] = False
            event['previous'] = previous
            event['hash'] = digest({k: event[k] for k in ('kind', 'payload', 'previous')})
            previous = event['hash']
        path.write_text('\n'.join(canonical(e) for e in events)+'\n', encoding='utf-8')
        with self.assertRaisesRegex(ValueError, 'fabricated verification'):
            audit.check(app.root)

    def test_input_tamper_and_failed_input_audit(self):
        app = self.runtime_episode(input_hash='0'*64)
        self.assertEqual(1, audit.check(app.root)['verified'])
        good = runtime.task_for(self.root/'input.srt')
        ep = app.run(good, self.root)
        (app.root/ep['input_ref']).write_bytes(b'corrupted')
        with self.assertRaisesRegex(ValueError, 'input mismatch'):
            audit.check(app.root)

    def test_known_holdout_cannot_be_blessed_fresh(self):
        app = runtime.Runtime(self.root/'state')
        self.addCleanup(app.close)
        with self.assertRaisesRegex(ValueError, 'relabeled fresh'):
            evaluation.enroll(app, Path(__file__).with_name('data'), fixtures.FROZEN_SHA256, 'test operator')

    def test_busy_admission_and_bounded_worker_timeout(self):
        app = runtime.Runtime(self.root/'state')
        self.addCleanup(app.close)
        sample = self.root/'input.srt'
        sample.write_bytes(GOOD)
        with runtime.exclusive(app.root):
            with self.assertRaisesRegex(RuntimeError, 'busy'):
                app.run(runtime.task_for(sample), self.root)
        result = adapters.isolated({'kind': 'caption', 'config': 'rules', 'executable': None}, GOOD, .000001)
        self.assertEqual('timeout', result['error'])

    def test_binary_identity_changes_when_executable_bytes_change(self):
        executable = self.root/'unavailable-tool.exe'
        executable.write_bytes(b'first invalid executable')
        adapter = adapters.CaptionAdapter('probe', executable=str(executable))
        before = adapter.manifest()['provenance']['tool']['binary_sha256']
        executable.write_bytes(b'a different invalid executable')
        after = adapter.manifest()['provenance']['tool']['binary_sha256']
        self.assertNotEqual(before, after)
        self.assertEqual('unavailable', adapter.health())

    def test_model_protocol_over_real_loopback_and_isolated_worker(self):
        calls = []
        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *_):
                pass
            def do_GET(self):
                calls.append(self.path)
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b'{"models":[{"name":"contract-fixture"}]}')
            def do_POST(self):
                calls.append(self.path)
                request = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
                if request['model'] != 'contract-fixture' or request['stream'] is not False:
                    self.send_error(400)
                    return
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b'{"message":{"content":"{\\"valid\\":true}"}}')
        server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        thread = threading.Thread(target=lambda: server.serve_forever(poll_interval=.05), daemon=True)
        thread.start()
        try:
            adapter = adapters.OllamaAdapter('http://127.0.0.1:'+str(server.server_port), 'contract-fixture')
            self.assertEqual('ready', adapter.health())
            result = adapter.execute(GOOD, 3)
            self.assertIsNone(result['error'])
            self.assertTrue(result['output']['valid'])
            self.assertIn('/api/chat', calls)
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)

    def test_evidence_bound_acceptance_restart_and_rollback_mechanism(self):
        # Deliberately faulty test doubles create a positive gate branch. These
        # are NOT a comparison with the real best baseline or a learning result.
        class Injected(adapters.CaptionAdapter):
            def health(self):
                return 'ready'
            def manifest(self):
                cap = super().manifest()
                cap['provenance'] = {'scope': 'synthetic unit-test fault injection'}
                return cap
            def execute(self, data, timeout):
                valid = checker.reference(data) if self.config == 'probe-guard' else True
                return {'output': {'valid': valid}, 'error': None, 'wall_seconds': 0, 'resources': {}}
        dataset = self.root/'data'
        dataset.mkdir()
        tasks, labels = [], {}
        for split in ('dev', 'holdout'):
            for n in range(4):
                key = split+str(n)
                sample = dataset/(key+'.srt')
                good = n % 2 == 0
                sample.write_bytes(GOOD.replace(b'hello', key.encode()) if good else b'invalid '+key.encode())
                task = runtime.task_for(sample, key, split) | {'source_group': key, 'family': 'injected'}
                tasks.append(task)
                labels[key] = {'valid': good, 'label_source': 'explicit unit-test fixture'}
        manifest = {'tasks': tasks, 'labels': labels, 'criteria': fixtures.CRITERIA, 'version': 'test-only', 'seed': 1}
        write(dataset/'manifest.json', manifest)
        factory = lambda: adapters.Registry([Injected(c) for c in ('rules', 'probe', 'combined', 'probe-guard')])
        with patch('tools.hive_engine.runtime.default_registry', side_effect=factory):
            result = cycle.run(self.root/'run', dataset, digest(manifest), 'test-only: synthetic injected failures')
            self.assertEqual('eligible-for-local-staging', result['decision'])
            app = runtime.Runtime(self.root/'run'/'state')
            candidate = app.store.records('RuntimeCandidate')[0]
            with self.assertRaisesRegex(ValueError, 'promotion rejected'):
                governor.promote(app, 'forged', 'test-only')
            release = governor.promote(app, digest(candidate), 'test-only explicit local authority')
            with self.assertRaisesRegex(ValueError, 'parent is no longer active'):
                governor.promote(app, digest(candidate), 'test-only duplicate must fail')
            app.close()
            app = runtime.Runtime(self.root/'run'/'state')
            try:
                task = tasks[1]
                self.assertTrue(app.run(task, dataset)['passed'])
                with self.assertRaises(ValueError):
                    governor.rollback(app, 'stale-release')
                governor.rollback(app, release['release_id'])
                self.assertEqual(runtime.BASELINE, app.active_policy)
                self.assertFalse(app.run(task, dataset)['passed'])
                self.assertTrue(audit.check(app.root)['ok'])
            finally:
                app.close()


if __name__ == '__main__':
    unittest.main()
