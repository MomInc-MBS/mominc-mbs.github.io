"""Regression gates: python -m tools.hive_engine.test_engine"""
import hashlib
import json
from pathlib import Path
import sqlite3
import subprocess
import tempfile
import threading
import time
import unittest
from unittest.mock import patch

from . import captions, fixtures, pilot
from .verify import validate_record, check
from .core import (Store, digest, eligibility, route, verification_value, experiment_priority,
                   promotion_gate, promote, rollback, memory_add, memory_retrieve)


class EngineTests(unittest.TestCase):
    artifacts = {}
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.manifest = fixtures.create(self.root/'data')
        self.store = Store(self.root/'events.sqlite')
        self.addCleanup(self.store.close)

    def test_eligibility_fails_closed(self):
        task = self.manifest['tasks'][0]
        cap = pilot.capabilities('ffprobe')[1]
        self.assertTrue(eligibility(task, cap)['eligible'])
        for change in [dict(permissions=[]), dict(task_type='delete'), dict(resource_budget={}),
                       dict(resource_budget={'wall_seconds':float('nan')})]:
            self.assertFalse(eligibility(task | change, cap)['eligible'])
        for change in [dict(health='offline'), dict(safe=False), dict(requirements={'wall_seconds':-1})]:
            self.assertFalse(eligibility(task, cap | change)['eligible'])

    def test_router_replays_and_never_buys_authority(self):
        task = self.manifest['tasks'][0] | {'permissions':['read-fixture']}
        caps = pilot.capabilities('ffprobe')[:3]
        estimates = {c['capability_id']:dict(p=1, cost=0, latency=0, risk=0) for c in caps}
        weights = dict(value=1, cost=1, latency=1, risk=1)
        result = route(task,caps,estimates,weights)
        self.assertEqual('rules',result['selected'])
        self.assertEqual(result,route(task,caps,estimates,weights))
        self.assertTrue(verification_value(True,0,100)['run'])
        self.assertFalse(verification_value(False,0,100)['run'])
        with self.assertRaises(ValueError): experiment_priority(.5,1,0,0,0,.2)

    def test_append_only_chain_and_tamper(self):
        self.store.append('observed', {'a':1})
        self.store.append('observed', {'a':2})
        self.store.verify()
        with self.assertRaises(sqlite3.IntegrityError): self.store.db.execute('DELETE FROM events')
        self.store.db.rollback()
        with self.assertRaises(sqlite3.IntegrityError): self.store.db.execute("UPDATE events SET payload='{}'")
        self.store.db.rollback()
        self.store.db.execute("INSERT INTO events(kind,payload,previous,hash) VALUES('forged','{}','bad','bad')")
        self.store.db.commit()
        with self.assertRaises(ValueError): self.store.verify()

    def test_concurrent_event_writers(self):
        errors = []
        def worker(i):
            s = Store(self.root/'events.sqlite')
            try:
                for j in range(5): s.append('load', {'worker':i,'n':j})
            except Exception as e: errors.append(e)
            finally: s.close()
        threads = [threading.Thread(target=worker,args=(i,)) for i in range(4)]
        for t in threads:t.start()
        for t in threads:t.join()
        self.assertFalse(errors)
        self.assertEqual(20,len(self.store.records('load')))
        self.store.verify()

    def test_freeze_and_source_split(self):
        root = self.root/'data'
        checksum = digest(self.manifest)
        fixtures.load(root,checksum)
        task = self.manifest['tasks'][0]
        (root/task['input_ref']).write_bytes(b'altered')
        with self.assertRaises(ValueError): fixtures.load(root,checksum)
        self.manifest['criteria']['min_quality_gain']=0
        (root/'manifest.json').write_text(json.dumps(self.manifest))
        with self.assertRaises(ValueError): fixtures.load(root,checksum)

    def test_reference_labels_are_independent(self):
        for actual, expected, good in [(True,True,True),(False,False,True),(True,False,False),(False,True,False)]:
            self.assertEqual(good,pilot.evaluate({'valid':actual},{'valid':expected},None))
        for output in [{}, {'valid':1}, {'valid':'true'}]:
            self.assertFalse(pilot.evaluate(output,{'valid':True},None))
        self.assertFalse(pilot.evaluate({'valid':True},{'valid':True},'timeout'))

    def test_parser_adversarial_and_standard_encodings(self):
        good=b'1\n00:00:00,100 --> 00:00:01,000\ncafe\n'
        self.assertTrue(captions.validate(good)['valid'])
        self.assertTrue(captions.validate(b'\xef\xbb\xbf'+good.replace(b'\n',b'\r\n'))['valid'])
        invalid=[b'',b'\xff',b'\x00'+good, good.replace(b'00,100',b'61,100'),
                 good.replace(b'01,000',b'00,050'),good.replace(b'1\n',b'2\n',1),
                 good.replace(b'cafe',b' '),good.replace(b'-->',b'=>'),good+good]
        for data in invalid:self.assertFalse(captions.validate(data)['valid'],repr(data))
        with self.assertRaises(ValueError): captions.validate(b'x'*65537)

    def test_tool_failure_modes_are_bounded(self):
        path=self.root/'data'/self.manifest['tasks'][0]['input_ref']
        with self.assertRaises(FileNotFoundError): captions.probe(path,str(self.root/'absent.exe'))
        with patch('subprocess.run',side_effect=subprocess.TimeoutExpired('ffprobe',.01)):
            with self.assertRaises(subprocess.TimeoutExpired): captions.probe(path,'ffprobe',.01)
        fake=subprocess.CompletedProcess([],0,b'{"packets":"bad"}',b'')
        with patch('subprocess.run',return_value=fake):
            with self.assertRaises(ValueError): captions.probe(path,'ffprobe')
        outcome=pilot.invoke('rules',path,'ffprobe',.00001)
        self.assertEqual('timeout',outcome['error'])

    def test_trace_output_and_reproducibility(self):
        tasks=self.manifest['tasks'][:6]
        rows=pilot.benchmark(self.store,tasks,self.manifest['labels'],self.root/'data',self.root,'rules',pilot.capabilities(None)[0],None)
        self.assertTrue(all(r['passed'] for r in rows))
        for e in self.store.records('Episode'):
            self.assertEqual(digest(json.loads((self.root/e['output_refs'][0]).read_text())),e['output_hash'])
            self.assertIn('wall_seconds',e['timings'])
            rerun=pilot.invoke('rules',self.root/'data'/next(t['input_ref'] for t in tasks if t['task_id']==e['task_id']),'ffprobe',3)
            self.assertEqual(rows[[t['task_id'] for t in tasks].index(e['task_id'])]['actual'],rerun['output']['valid'])
            validate_record('Episode',e)
        with self.assertRaises(ValueError): validate_record('Episode',{'episode_id':'incomplete'})

    def test_no_holdout_training_or_export(self):
        with self.assertRaises(ValueError): pilot.propose([dict(split_id='holdout')])
        for split in ('dev','holdout'):
            self.store.append('Episode',dict(episode_id=split,split_id=split,status='completed',input_hash='a',output_refs=['b'],config_hash='c'))
            self.store.append('Verification',dict(episode_id=split,result=True,label_source='reference'))
        data=pilot.curated_dataset(self.store)
        self.assertEqual(['dev'],[r['episode_ref'] for r in data])

    def test_promotion_independent_gates_and_approval(self):
        evidence=dict(quality_delta=.1,cost_reduction=0,regressions=0,safety_passed=True,memory_passed=True,
                      budgets_passed=True,reproducible=True,holdout_clean=True,rollback_tested=True)
        gate=promotion_gate(evidence,fixtures.CRITERIA)
        self.assertTrue(gate['eligible'])
        for key,value in dict(quality_delta=0,regressions=1,safety_passed=False,memory_passed=False,
                              budgets_passed=False,reproducible=False,holdout_clean=False,rollback_tested=False).items():
            self.assertFalse(promotion_gate(evidence | {key:value},fixtures.CRITERIA)['eligible'],key)
        candidate=dict(candidate_id='probe-guard',parent_version='rules',scope='local-staging')
        with self.assertRaises(ValueError):promote(self.store,candidate,gate,{})
        approval=dict(authority='operator',approval_ref='unit-test-only',candidate_hash=digest(candidate),gate_hash=digest(gate))
        with self.assertRaises(ValueError):promote(self.store,candidate | {'scope':'production'},gate,approval)
        release=promote(self.store,candidate,gate,approval)
        restored=rollback(self.store,release)
        self.assertEqual('rules',restored['deployed_version'])
        path=self.root/'data'/self.manifest['tasks'][0]['input_ref']
        self.assertEqual(captions.validate(path.read_bytes()) | {'tool_calls':0},captions.execute(restored['deployed_version'],path,'ffprobe'))
        self.artifacts['rollback'] = dict(releases=self.store.records('Release'), restored_output=captions.execute(restored['deployed_version'],path,'ffprobe'),
                                          test_only=True)
        for record in self.store.records('Release'): validate_record('Release',record)

    def test_candidate_skips_tool_for_invalid_caption(self):
        task=next(t for t in self.manifest['tasks'] if t['family']=='overlap')
        with patch('tools.hive_engine.captions.probe', side_effect=AssertionError('must not call tool')):
            result=captions.execute('probe-guard',self.root/'data'/task['input_ref'],'ffprobe')
        self.assertFalse(result['valid'])
        self.assertEqual(0,result['tool_calls'])

    def test_memory_partition_conflict_expiry_correction_rollback(self):
        item=dict(memory_id='one',partition='validated_facts',key='caption-rule',content_ref='original',source_refs=['test'],
                  confidence=1,validation_status='validated',created_at=1,expires_at=100,supersedes=None,access_policy=['operator'])
        memory_add(self.store,item)
        self.assertEqual([],memory_retrieve(self.store,'validated_facts','outsider',2)['items'])
        self.assertEqual([],memory_retrieve(self.store,'raw_observations','operator',2)['items'])
        memory_add(self.store,item | dict(memory_id='conflict',content_ref='different'))
        self.assertEqual(['caption-rule'],memory_retrieve(self.store,'validated_facts','operator',2)['conflicts'])
        self.store.append('MemoryInvalidation',dict(memory_id='conflict',source_refs=['independent-correction']))
        memory_add(self.store,item | dict(memory_id='corrected',content_ref='new',supersedes='one'))
        self.assertEqual('new',memory_retrieve(self.store,'validated_facts','operator',2)['items'][0]['content_ref'])
        # A rollback is a new attributed revision, never deletion of prior evidence.
        memory_add(self.store,item | dict(memory_id='restored',supersedes='corrected',source_refs=['rollback-to-one']))
        self.assertEqual('original',memory_retrieve(self.store,'validated_facts','operator',2)['items'][0]['content_ref'])
        self.assertEqual([],memory_retrieve(self.store,'validated_facts','operator',101)['items'])
        with self.assertRaises(ValueError):memory_add(self.store,item | dict(memory_id='cross',partition='raw_observations',supersedes='one'))


if __name__=='__main__':
    suite=unittest.defaultTestLoader.loadTestsFromTestCase(EngineTests)
    start=time.perf_counter()
    result=unittest.TextTestRunner(verbosity=2).run(suite)
    pilot.write(pilot.HERE/'test-results.json',dict(ok=result.wasSuccessful(),tests=result.testsRun,
                  failures=len(result.failures),errors=len(result.errors),elapsed_seconds=time.perf_counter()-start,
                  code_hashes={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in pilot.HERE.glob('*.py')},
                  artifacts=EngineTests.artifacts,
                  scope='Local regression gates; stage/rollback uses a labeled test-only approval, never production.'))
    raise SystemExit(not result.wasSuccessful())
