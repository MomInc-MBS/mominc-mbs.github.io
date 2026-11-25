import json
import os
import subprocess
import sys
from pathlib import Path

import pytest

from hive.checkpoint_manager import Checkpoints
from hive.learning_policy import Policy
from hive.orchestrator import DEFAULT_CONFIG, Executor, config_hash, inspect_evidence, worker_lock
from hive.storage import Store
from hive.task_spec import load_tasks


def cfg(**kwargs):
    return dict(DEFAULT_CONFIG, **kwargs)

def _promote_reviewed(checkpoints, ref):
    from hive.review_gate import REQUIRED_FLAGS
    from hive.metric_engine import paired_summary
    checkpoints.record_review(ref, {**dict.fromkeys(REQUIRED_FLAGS, True), "author_id": "builder", "reviewer_id": "independent",
                                    "paired_summary": paired_summary([1] * 24, [0] * 24)})
    checkpoints.promote(ref)


def test_false_completion_queues_repair_and_survives_new_executor(tmp_path):
    config = cfg(allow_fixtures=True)
    first = Executor(tmp_path, config)
    task = load_tasks("development")[0]
    bad_id = first.enqueue(task, "fixture_bad")
    result = first.loop(1)[0]
    assert result["passed"] is False
    pending = [j for j in first.store.jobs() if j["state"] == "QUEUED"]
    assert len(pending) == 1
    assert pending[0]["spec"]["route"] == "tool"
    assert result["failure"]["evidence_paths"]
    first.close()
    second = Executor(tmp_path, config)
    repaired = second.loop()[0]
    assert repaired["passed"] is True
    assert second.store.get_job(bad_id)["state"] == "REJECTED"
    assert second.store.get("policy")["counts"][task["category"]]["fixture_bad"]["n"] == 1
    assert second.store.get("policy")["counts"][task["category"]]["tool"]["successes"] == 1
    second.close()


def test_real_cli_subprocess_restores_status(tmp_path):
    env = dict(os.environ, PYTHONPATH=str(Path(__file__).resolve().parents[2] / "src"))
    task = load_tasks("development")[0]["id"]
    first = subprocess.run([sys.executable, "-m", "hive", "--store", str(tmp_path), "run", "--task", task, "--route", "tool"], env=env, capture_output=True, text=True)
    assert first.returncode == 0, first.stderr
    assert json.loads(first.stdout)["results"][0]["passed"] is True
    second = subprocess.run([sys.executable, "-m", "hive", "--store", str(tmp_path), "status"], env=env, capture_output=True, text=True)
    assert second.returncode == 0, second.stderr
    assert json.loads(second.stdout)["budget"]["cycles"] == 1


def test_budget_persists_and_configuration_cannot_reset_it(tmp_path, monkeypatch):
    from hive.experiment_runner import execute
    calls = []
    def fake(task, route, config):
        calls.append(route)
        return execute(task, "tool", config)
    monkeypatch.setattr("hive.orchestrator.execute", fake)
    config = cfg(max_requests=1)
    ex = Executor(tmp_path, config)
    task = load_tasks("development")[0]
    ex.enqueue(task, "local_direct")
    ex.enqueue(task, "local_direct")
    assert len(ex.loop()) == 1
    assert calls == ["local_direct"]
    assert ex.store.get("budget")["requests"] == 1
    assert ex.store.get("budget")["tokens_reserved"] == config["max_tokens"]
    ex.close()
    changed = Executor(tmp_path, cfg(max_requests=2))
    with pytest.raises(ValueError, match="immutable"):
        changed.loop()
    changed.close()


def test_holdout_does_not_update_feedback_and_is_sealed(tmp_path):
    ex = Executor(tmp_path, cfg())
    before = ex.store.get("policy")
    job_id = ex.enqueue(load_tasks("holdout")[0], "tool")
    ex.loop(1)
    assert ex.store.get("policy") == before
    assert inspect_evidence(ex.store, job_id)["sealed"] is True
    ex.close()


def test_approved_policy_drives_route_and_regression_rolls_back(tmp_path):
    ex = Executor(tmp_path, cfg(allow_fixtures=True, routes=["fixture_bad", "tool"]))
    good = Policy("greedy")
    good.observe("math", "tool", 1, 1)
    bad = Policy("greedy")
    bad.observe("math", "fixture_bad", 1, 1)
    checkpoints = Checkpoints(ex.store)
    first = checkpoints.save(good.snapshot(), {"synthetic_test_approval": True}, approved=True)
    second = checkpoints.save(bad.snapshot(), {"synthetic_test_approval": True}, approved=True)
    _promote_reviewed(checkpoints, first)
    _promote_reviewed(checkpoints, second)
    job = ex.enqueue(load_tasks("development")[0])
    outcome = ex.loop(1)[0]
    assert outcome["route"] == "fixture_bad" and outcome["passed"] is False
    assert ex.store.get_job(job)["result"]["automatic_rollback"] == first
    assert ex.store.get("current_checkpoint") == first
    assert config_hash(checkpoints.current()["policy"]) == config_hash(good.snapshot())
    ex.close()


def test_kill_switch_preserves_queue_and_worker_lock(tmp_path):
    ex = Executor(tmp_path, cfg())
    ex.enqueue(load_tasks("development")[0], "tool")
    (tmp_path / "STOP").touch()
    assert ex.loop() == []
    assert ex.store.jobs()[0]["state"] == "QUEUED"
    with worker_lock(tmp_path):
        with pytest.raises(RuntimeError, match="Another"):
            with worker_lock(tmp_path):
                pass
    ex.close()
