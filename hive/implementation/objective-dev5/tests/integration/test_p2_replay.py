"""P2 caller-level eligibility and saved-receipt counterexamples; no inference."""
import copy
import json
import os
from pathlib import Path
import subprocess
import sys

import pytest
import hive.orchestrator as runtime
from hive.learning_policy import Policy
from hive.task_spec import _task


def prepared(tmp_path):
    ex = runtime.Executor(tmp_path, dict(runtime.DEFAULT_CONFIG, routes=['tool'],
        max_requests=0, max_total_tokens=0, max_retries=0))
    # Explicit experimental store only; no production checkpoint is promoted.
    ex.store.set('governing_policy', Policy(version=3).snapshot())
    task = _task('development', 'math', 1, 88004)
    task['source_group'] = 'synthetic-p2-caller-check'
    return ex, task


@pytest.mark.parametrize('fault', ['missing', 'false_accept'])
def test_unavailable_verifier_blocks_before_dispatch_or_reservation(tmp_path, monkeypatch, fault):
    ex, task = prepared(tmp_path)
    calls = []
    def broken(*args):
        if fault == 'missing':
            raise RuntimeError('verifier unavailable')
        return {'valid': True, 'passed': True}
    monkeypatch.setattr(runtime, 'verify', broken)
    monkeypatch.setattr(runtime, 'execute', lambda *args: calls.append(args))
    job = ex.enqueue(task)
    assert ex.loop(1)[0]['passed'] is False
    receipt = ex.store.read_artifact(ex.store.get_job(job)['result']['decision_ref'])
    assert receipt['selected_route'] is None
    assert not calls and ex._budget()['cycles'] == 0 and ex._budget()['requests'] == 0
    assert any('verifier unavailable' in reason for row in receipt['alternatives'] for reason in row['reasons'])
    ex.close()


@pytest.mark.parametrize('mutation', ['corrupt', 'missing', 'mismatched', 'source_context', 'downgrade', 'strip_all'])
def test_saved_p2_receipt_rejects_corruption_and_rebinding(tmp_path, mutation):
    ex, task = prepared(tmp_path)
    job = ex.enqueue(task)
    assert ex.loop(1)[0]['passed'] is True
    evidence = runtime.inspect_evidence(ex.store, job)
    decision_path = tmp_path / evidence['decision_ref']
    if mutation == 'corrupt':
        decision_path.write_text('{}', encoding='utf-8')
    elif mutation == 'missing':
        decision_path.unlink()
    else:
        forged = copy.deepcopy(evidence)
        forged.pop('evidence_ref', None)
        changed = copy.deepcopy(forged['decision'])
        if mutation == 'mismatched':
            changed['selected_route'] = 'local_direct'
        elif mutation == 'source_context':
            changed['route_attribution']['source_context']['input_sha256'] = '0' * 64
        elif mutation == 'downgrade':
            changed.pop('policy_version')
        else:
            for key in ('policy_version', 'route_attribution', 'route_source'):
                changed.pop(key)
        forged['decision'] = changed
        forged['decision_ref'] = ex.store.put_artifact(changed)
        result = ex.store.get_job(job)['result']
        result['evidence_ref'] = ex.store.put_artifact(forged)
        ex.store.db.execute('UPDATE jobs SET result=? WHERE id=?', (json.dumps(result), job))
    with pytest.raises((ValueError, OSError)):
        runtime.inspect_evidence(ex.store, job)
    ex.close()


def test_p2_evidence_and_source_context_replay_in_fresh_process(tmp_path):
    ex, task = prepared(tmp_path)
    job = ex.enqueue(task)
    assert ex.loop(1)[0]['passed'] is True
    evidence = runtime.inspect_evidence(ex.store, job)
    context = evidence['decision']['route_attribution']['source_context']
    assert context['declared_source_group'] == task['source_group']
    assert context['input_sha256'] == runtime.config_hash(task['input'])
    before = ex._budget()
    ex.close()
    code = ('import json,sys; from hive.orchestrator import Executor,inspect_evidence; '
            'x=Executor(sys.argv[1]); e=inspect_evidence(x.store,sys.argv[2]); '
            'print(json.dumps([e["decision"]["route_attribution"]["source_context"],x._budget()])); x.close()')
    env = dict(os.environ, PYTHONPATH=str(Path(__file__).resolve().parents[2] / 'src'))
    result = subprocess.run([sys.executable, '-c', code, str(tmp_path), job],
        env=env, text=True, capture_output=True, check=True)
    assert json.loads(result.stdout) == [context, before]


def test_h11_accepts_parent_relative_store_without_hiding_failure(tmp_path, monkeypatch):
    from hive.pressure import _code_gauntlet
    child = tmp_path / 'child'
    child.mkdir()
    monkeypatch.chdir(child)
    runs = _code_gauntlet(Path('../pressure'))
    assert len(runs) == 2
    assert all(v['verification']['passed'] for v in runs[0]['mission_report']['patches'].values())
    assert all(not v['verification']['passed'] for v in runs[1]['mission_report']['patches'].values())
