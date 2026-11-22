"""Integrated mission boundaries with an explicitly simulated local subject."""
import json
from pathlib import Path

import pytest

from hive.experiment_runner import execute
from hive.integration import run_integration, restore_experimental
from hive.orchestrator import config_hash, worker_lock
from hive.storage import Store

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "experiments/manifests/integration-20261121.json"
CONFIG = ROOT / "configs/integration-20261121.json"


@pytest.fixture
def simulated(monkeypatch):
    calls = []
    def run(task, route, config):
        calls.append((task["id"], route))
        if route == "tool":
            return execute(task, route, config)
        return {"output": json.dumps(task["expected"]), "raw_model_output": json.dumps(task["expected"]),
                "latency_s": 0.1, "tokens": 10, "model": config["model"],
                "model_digest": "synthetic-integration-v1", "backend": "synthetic",
                "request": {}, "error": None, "failure_category": None}
    monkeypatch.setattr("hive.orchestrator.execute", run)
    monkeypatch.setattr("hive.model_registry.discover", lambda *_: {"available": True,
        "models": [{"id": "myr5-hold-local:latest", "digest": "synthetic-integration-v1"}]})
    return calls


def test_shared_missions_reject_tie_restore_and_replay_without_calls(tmp_path, simulated):
    report = run_integration(tmp_path, MANIFEST, CONFIG)
    assert report["functional_missions_passed"]
    assert report["candidate_decision"] == "REJECTED"
    assert not report["production_policy_promoted"]
    assert report["budget"]["requests"] == 6
    count = len(simulated)
    store = Store(tmp_path)
    with worker_lock(tmp_path):
        restored = restore_experimental(store, report["initial_snapshot"])
        assert restored["candidate_hash"] != report["candidate_hash"]
        assert restored["governing_hash"] == report["governing_hash"]
        restore_experimental(store, report["candidate_snapshot"])
    store.close()
    replayed = run_integration(tmp_path, MANIFEST, CONFIG)
    assert replayed["replayed"] and replayed["additional_model_calls"] == 0
    assert len(simulated) == count


def test_valid_other_job_artifact_cannot_substitute_for_completed_evidence(tmp_path, simulated):
    report = run_integration(tmp_path, MANIFEST, CONFIG)
    store = Store(tmp_path)
    target, other = report["jobs"][:2]
    result = store.get_job(target)["result"]
    result["evidence_ref"] = store.get_job(other)["result"]["evidence_ref"]
    store.db.execute("UPDATE jobs SET result=? WHERE id=?", (json.dumps(result), target))
    store.close()
    count = len(simulated)
    with pytest.raises(ValueError, match="reference changed"):
        run_integration(tmp_path, MANIFEST, CONFIG)
    assert len(simulated) == count


def test_stop_and_initialization_crash_preserve_budget_and_atomic_state(tmp_path, simulated, monkeypatch):
    original = Store.set
    def crash(self, key, value):
        original(self, key, value)
        if key == "integration_identity":
            raise RuntimeError("injected initialization crash")
    monkeypatch.setattr(Store, "set", crash)
    with pytest.raises(RuntimeError, match="injected"):
        run_integration(tmp_path, MANIFEST, CONFIG)
    store = Store(tmp_path)
    assert store.get("integration_identity") is None
    store.close()
    monkeypatch.setattr(Store, "set", original)
    (tmp_path / "STOP").touch()
    paused = run_integration(tmp_path, MANIFEST, CONFIG)
    assert paused["status"] == "BLOCKED" and not simulated
    (tmp_path / "STOP").unlink()
    completed = run_integration(tmp_path, MANIFEST, CONFIG)
    assert completed["functional_missions_passed"]
    assert completed["budget"]["requests"] == 6
