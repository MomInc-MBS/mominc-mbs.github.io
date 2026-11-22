"""One bounded current-baseline inference; never replenish the fixed store."""
import argparse
import json
import os
from pathlib import Path
import subprocess
import sys


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    args = parser.parse_args()
    repo = Path(__file__).resolve().parents[1]
    source = args.source.resolve()
    sys.path.insert(0, str(source / 'src'))
    from hive.orchestrator import Executor, code_version, config_hash, DEFAULT_CONFIG
    from hive.model_registry import discover
    from hive.storage import Store
    expected_source = '024e33a80265718014a42d2a8d4609663ed74f327a36043b18285810d67c2731'
    expected_digest = 'a45646773d1ee8a6c1557c7de09a68e78a74f2990c4174a1408f65e777db150c'
    build = code_version()
    if build['source_sha256'] != expected_source:
        raise ValueError('WP0 requires the frozen caf9ace source archive')
    # The archive is nested in a newer checkout; its parent Git HEAD is not its source identity.
    build['commit'] = 'caf9ace1ab41d5909f60ee6c2ed6fd60cb7ba345'
    config = dict(DEFAULT_CONFIG, max_requests=1, max_total_tokens=128,
                  max_wall_s=60, timeout_s=60, max_storage_bytes=67108864,
                  max_cycles=4, max_retries=0, routes=['local_direct'])
    runtime = discover(config['endpoint'])
    model = next((m for m in runtime['models'] if m['id'] == config['model']), None)
    if not model or model['digest'] != expected_digest:
        raise ValueError('Pinned local model unavailable or changed')
    root = repo / '.hive' / 'prototype-wp0'
    config_path = root / 'config.json'
    root.mkdir(parents=True, exist_ok=True)
    if config_path.exists() and json.loads(config_path.read_text()) != config:
        raise ValueError('WP0 config changed')
    config_path.write_text(json.dumps(config, indent=2), encoding='utf-8')
    task = json.loads((source / 'benchmarks/development/example.json').read_text())
    task.update(id='prototype-wp0-current-source-smoke',
                success_criteria='Fresh pinned local inference; exact product; restart re-verification.')
    ex = Executor(root, config)
    try:
        prior = ex.store.get('wp0_report')
        if prior:
            print(json.dumps(prior, indent=2))
            return
        job = ex.store.enqueue_once('prototype-wp0-smoke', {'task': task,
                    'route': 'local_direct', 'allow_retry': False, 'retry_count': 0})
        if not ex.store.get('wp0_stop_checked'):
            if (root / 'STOP').exists():
                raise ValueError('Existing STOP requires explicit operator resume')
            (root / 'STOP').write_text('WP0 deliberate preflight STOP', encoding='utf-8')
            assert ex.loop() == [] and ex._budget()['requests'] == 0
            ex.store.set('wp0_stop_checked', True)
            # The documented demo explicitly includes this one STOP/resume check.
            (root / 'STOP').unlink()
        if (root / 'STOP').exists():
            raise ValueError('Operator STOP remains active; explicitly resume before continuing')
        result = ex.store.get_job(job).get('result')
        if not result:
            ex.loop(1)
            result = ex.store.get_job(job).get('result')
        if not result or not result.get('evidence_ref'):
            raise ValueError('No completed result; budget/store preserved, no automatic reset')
        evidence = ex.store.read_artifact(result['evidence_ref'])
        assert evidence['result']['model_digest'] == expected_digest
        before = ex._budget()
        fresh = subprocess.run([sys.executable, '-m', 'hive', '--store', str(root),
                                'review', '--run', job],
                    env=dict(os.environ, PYTHONPATH=str(source / 'src')),
                    capture_output=True, text=True, timeout=20)
        assert fresh.returncode == 0, fresh.stderr
        restored = json.loads(fresh.stdout)
        assert restored['verification'] == evidence['verification']
        assert before == ex._budget()
        report = {'work_package': 'WP0', 'scope': 'synthetic arithmetic runtime smoke; not real-workload acceptance',
                  'build': build, 'baseline_commit': 'caf9ace1ab41d5909f60ee6c2ed6fd60cb7ba345',
                  'model_digest': expected_digest, 'config_hash': config_hash(config),
                  'config': config, 'store': '.hive/prototype-wp0', 'job_id': job,
                  'verification': evidence['verification'], 'evidence_ref': result['evidence_ref'],
                  'result': evidence['result'], 'budget': before, 'stop_prevented_calls': True,
                  'fresh_process_reverified': True, 'replay_new_calls': 0,
                  'decision': 'pass' if evidence['verification']['passed'] else 'fail',
                  'policy_deployed': False}
        target = repo / 'experiments/results/prototype-wp0-smoke.json'
        if target.exists():
            raise ValueError('Refusing to overwrite an earlier smoke report')
        target.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
        ex.store.set('wp0_report', report)
        print(json.dumps(report, indent=2))
    finally:
        ex.close()


if __name__ == '__main__':
    main()
