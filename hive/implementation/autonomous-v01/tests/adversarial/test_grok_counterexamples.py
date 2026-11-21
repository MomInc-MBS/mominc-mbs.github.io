import copy

import pytest

from hive.checkpoint_manager import Checkpoints
from hive.experiment_runner import execute
from hive.learning_policy import Policy
from hive.orchestrator import DEFAULT_CONFIG, Executor
from hive.review_gate import REQUIRED_FLAGS, evaluate
from hive.metric_engine import paired_summary
from hive.storage import Store
from hive.task_spec import load_tasks


def test_malformed_verifier_cannot_update_policy(tmp_path, monkeypatch):
    monkeypatch.setattr("hive.orchestrator.verify", lambda *_: {"valid": 1, "passed": "false", "quality": 1, "unsupported": 0})
    ex = Executor(tmp_path)
    job = ex.enqueue(load_tasks("development")[0], "tool")
    assert ex.loop(1)[0]["passed"] is False
    assert ex.store.get("policy") is None
    assert ex.store.get_job(job)["state"] == "REJECTED"
    ex.close()


def test_successor_is_idempotent_and_invalid_tasks_do_not_stall(tmp_path):
    ex = Executor(tmp_path)
    spec = {"task": load_tasks("development")[0], "route": "tool"}
    a = ex.store.enqueue_once("parent", spec)
    b = ex.store.enqueue_once("parent", spec)
    assert a == b and len(ex.store.jobs()) == 1
    invalid = ex.store.enqueue({"task": {}})
    assert len(ex.loop()) == 2
    assert ex.store.get_job(invalid)["state"] == "BLOCKED"
    assert ex.loop() == []
    ex.close()


def test_unowned_transition_and_string_approval_rejected(tmp_path):
    s = Store(tmp_path)
    job = s.enqueue({"task": {}})
    with pytest.raises(ValueError, match="claim"):
        s.transition(job, "RUNNING")
    with pytest.raises(ValueError, match="boolean"):
        Checkpoints(s).save({}, {}, approved="false")
    assert s.get_job(job)["state"] == "QUEUED"
    s.close()


def test_review_identity_is_canonicalized():
    evidence = {**dict.fromkeys(REQUIRED_FLAGS, True), "author_id": "SOL", "reviewer_id": "sol ",
                "paired_summary": paired_summary([1] * 24, [0] * 24)}
    assert evaluate(evidence)["decision"] == "REJECT"


def test_implausible_resource_usage_is_not_learning_feedback(tmp_path, monkeypatch):
    def poisoned(task, route, config):
        result = execute(task, "tool", config)
        result["tokens"] = 10**9
        return result
    monkeypatch.setattr("hive.orchestrator.execute", poisoned)
    ex = Executor(tmp_path)
    ex.enqueue(load_tasks("development")[0], "tool")
    result = ex.loop(1)[0]
    assert result["passed"] is False
    assert ex.store.get("policy") is None
    artifact = ex.store.read_artifact(result["evidence_ref"])
    assert artifact["result"]["tokens"] <= DEFAULT_CONFIG["max_tokens"]
    ex.close()


def test_unknown_split_rejected_before_dispatch(tmp_path, monkeypatch):
    def forbidden(*_):
        raise AssertionError("must not dispatch")
    monkeypatch.setattr("hive.orchestrator.execute", forbidden)
    ex = Executor(tmp_path)
    task = copy.deepcopy(load_tasks("holdout")[0]); task["split"] = "Holdout"
    ex.enqueue(task, "tool")
    assert ex.loop(1)[0]["passed"] is False
    ex.close()
