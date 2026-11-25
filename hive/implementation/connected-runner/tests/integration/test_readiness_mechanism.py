"""Synthetic mechanism check; test-only approvals do not authorize production."""
import json
import os
import subprocess
import sys
from pathlib import Path

from hive.checkpoint_manager import Checkpoints
from hive.learning_policy import Policy
from hive.orchestrator import DEFAULT_CONFIG, Executor, config_hash, inspect_evidence
from hive.task_spec import load_tasks

def _promote_reviewed(checkpoints, ref):
    from hive.review_gate import REQUIRED_FLAGS
    from hive.metric_engine import paired_summary
    checkpoints.record_review(ref, {**dict.fromkeys(REQUIRED_FLAGS, True), "author_id": "builder", "reviewer_id": "independent",
                                    "paired_summary": paired_summary([1] * 24, [0] * 24)})
    checkpoints.promote(ref)


def test_verified_feedback_drives_executed_route_restart_and_restore(tmp_path):
    config = dict(DEFAULT_CONFIG, allow_fixtures=True, routes=['fixture_bad', 'tool'], max_retries=0)
    ex = Executor(tmp_path, config)
    tasks = [t for t in load_tasks('development') if t['category'] == 'math']
    assert len(tasks) >= 3
    parent = Policy('greedy')
    parent.observe('math', 'fixture_bad', 1, 1)
    checkpoints = Checkpoints(ex.store)
    parent_ref = checkpoints.save(parent.snapshot(), {'test_only': True}, approved=True)
    _promote_reviewed(checkpoints, parent_ref)
    before_job = ex.enqueue(tasks[0])
    before = ex.loop(1)[0]
    assert before['route'] == 'fixture_bad' and not before['passed']
    # This independently re-verifies the execution artifact; a claimed reward is insufficient.
    evidence = inspect_evidence(ex.store, before_job)
    assert not evidence['verification']['passed']
    candidate = ex.store.get('policy')
    assert candidate['counts']['math']['fixture_bad']['n'] == 1
    candidate_ref = checkpoints.save(candidate, {'test_only': True, 'feedback_job': before_job}, approved=True)
    _promote_reviewed(checkpoints, candidate_ref)
    after_job = ex.enqueue(tasks[1])
    after = ex.loop(1)[0]
    assert after['route'] == 'tool' and after['passed']
    assert inspect_evidence(ex.store, after_job)['route'] == 'tool'
    candidate_hash = config_hash(candidate)
    ex.close()
    env = dict(os.environ, PYTHONPATH=str(Path(__file__).resolve().parents[2] / 'src'))
    code = '''import json,sys\nfrom hive.storage import Store\nfrom hive.checkpoint_manager import Checkpoints\nfrom hive.learning_policy import Policy\nfrom hive.orchestrator import config_hash\ns=Store(sys.argv[1]); p=Checkpoints(s).current()["policy"]; print(json.dumps([config_hash(p),Policy(state=p).choose("math",["tool","fixture_bad"])])); s.close()'''
    process = subprocess.run([sys.executable, '-c', code, str(tmp_path)], env=env, capture_output=True, text=True, check=True)
    assert json.loads(process.stdout) == [candidate_hash, 'tool']
    ex = Executor(tmp_path, config)
    Checkpoints(ex.store).rollback(parent_ref)
    restored_job = ex.enqueue(tasks[2])
    restored = ex.loop(1)[0]
    assert restored['route'] == 'fixture_bad' and not restored['passed']
    assert inspect_evidence(ex.store, restored_job)['route'] == 'fixture_bad'
    ex.close()


@__import__('pytest').mark.parametrize('mutation',['job_id','task_id'])
def test_video_replay_rejects_foreign_job_evidence(tmp_path,mutation):
    import json
    from unittest.mock import patch
    import pytest
    from hive.video_mission import run_mission
    from hive.storage import Store
    source=tmp_path/'source';source.mkdir();(source/'video.mp4').write_bytes(b'synthetic')
    (source/'captions.srt').write_text('1\n00:00:00,000 --> 00:00:01,000\nFirst\n\n2\n00:00:01,100 --> 00:00:02,000\nSecond\n',encoding='utf-8')
    manifest=tmp_path/'manifest.json';manifest.write_text(json.dumps({'allowed_root':str(source),'media':'video.mp4','subtitles':'captions.srt'}))
    root=tmp_path/'store'
    with patch('hive.video_mission._probe',return_value=3.0):
        run_mission(root,manifest)
        store=Store(root)
        try:
            job=next(j for j in store.jobs() if j['spec']['task']['category']=='video_captions')
            evidence=store.read_artifact(job['result']['evidence_ref'])
            if mutation=='job_id': evidence['job_id']='wrong-job'
            else: evidence['task']['id']='different-task'
            ref=store.put_artifact(evidence);result=job['result'];result['evidence_ref']=ref
            store.db.execute('UPDATE jobs SET result=? WHERE id=?',(json.dumps(result),job['id']))
        finally: store.close()
        with pytest.raises(ValueError): run_mission(root,manifest)


def test_video_feedback_transaction_crash_replays_once(tmp_path):
    import json, os, subprocess, sys
    from pathlib import Path
    from unittest.mock import patch
    from hive.storage import Store
    from hive.video_mission import run_mission
    source=tmp_path/'source';source.mkdir();(source/'video.mp4').write_bytes(b'synthetic')
    (source/'captions.srt').write_text('1\n00:00:00,000 --> 00:00:01,000\nFirst\n\n2\n00:00:01,100 --> 00:00:02,000\nSecond\n',encoding='utf-8')
    manifest=tmp_path/'manifest.json';manifest.write_text(json.dumps({'allowed_root':str(source),'media':'video.mp4','subtitles':'captions.srt'}))
    root=tmp_path/'store'
    script=r'''import os,sys
from unittest.mock import patch
from hive.storage import Store
from hive.video_mission import run_mission
original=Store.set
def kill(self,key,value):
    original(self,key,value)
    if key.startswith('feedback:'): os._exit(81)
Store.set=kill
with patch('hive.video_mission._probe',return_value=3.0):run_mission(sys.argv[1],sys.argv[2])'''
    env=dict(os.environ,PYTHONPATH=str(Path('src').resolve()))
    child=subprocess.run([sys.executable,'-c',script,str(root),str(manifest)],env=env,capture_output=True,text=True)
    assert child.returncode==81, child.stderr
    store=Store(root)
    try:
        assert store.db.execute("SELECT count(*) FROM kv WHERE key LIKE 'feedback:%'").fetchone()[0]==0
        assert not (store.get('policy') or {}).get('counts')
    finally: store.close()
    with patch('hive.video_mission._probe',return_value=3.0):
        result=run_mission(root,manifest);assert result['status']=='objective_verified'
        store=Store(root)
        try:
            budget=store.get('budget');jobs=[j['id'] for j in store.jobs()]
            assert store.db.execute("SELECT count(*) FROM kv WHERE key LIKE 'feedback:%'").fetchone()[0]==2
        finally:store.close()
        run_mission(root,manifest)
    store=Store(root)
    try:
        assert store.get('budget')==budget and [j['id'] for j in store.jobs()]==jobs
        assert store.db.execute("SELECT count(*) FROM kv WHERE key LIKE 'feedback:%'").fetchone()[0]==2
    finally:store.close()
