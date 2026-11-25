import json
import pytest
from hive.storage import Store
from hive.checkpoint_manager import Checkpoints
from hive.failure_triage import triage

def _promote_reviewed(checkpoints, ref):
    from hive.review_gate import REQUIRED_FLAGS
    from hive.metric_engine import paired_summary
    checkpoints.record_review(ref, {**dict.fromkeys(REQUIRED_FLAGS, True), "author_id": "builder", "reviewer_id": "independent",
                                    "paired_summary": paired_summary([1] * 24, [0] * 24)})
    checkpoints.promote(ref)


def test_artifacts_and_checkpoints(tmp_path):
    store = Store(tmp_path)
    ref = store.put_artifact({'x': 1})
    assert store.read_artifact(ref) == {'x': 1}
    with pytest.raises(ValueError): store.read_artifact('../escape')
    cp = Checkpoints(store)
    unapproved = cp.save({'v': 1}, {}, False)
    with pytest.raises(ValueError): _promote_reviewed(cp, unapproved)
    approved = cp.save({'v': 2}, {'test': True}, True)
    _promote_reviewed(cp, approved)
    assert cp.current()['policy'] == {'v': 2}
    (tmp_path / approved).write_text('{}')
    with pytest.raises(ValueError): cp.current()
    store.close()

def test_claim_transition_and_stale_guard(tmp_path):
    s = Store(tmp_path); job_id = s.enqueue({'x': 1}); claim = s.claim('worker')
    assert claim['id'] == job_id
    assert s.recover() == []
    with pytest.raises(PermissionError): s.transition(job_id, 'VERIFYING', owner='worker', generation=claim['generation'] - 1)
    s.transition(job_id, 'VERIFYING', owner='worker', generation=claim['generation'])
    s.transition(job_id, 'REVIEWING', owner='worker', generation=claim['generation'])
    s.finish(job_id, 'REJECTED', {'ok': False}, 'worker', claim['generation'])
    assert s.get_job(job_id)['result'] == {'ok': False}
    s.close()

def test_triage_is_finite_and_changes_strategy():
    spec = {}
    strategies = []
    for i in range(4):
        report = triage({'id':'x', 'spec':spec}, 'MODEL', 'bad')
        assert report['retry_count'] == i
        if report['next_spec'] is None:
            assert report['state'] == 'BLOCKED'; break
        spec = report['next_spec']; strategies.append(spec['strategy'])
    assert len(set(strategies)) == 3
