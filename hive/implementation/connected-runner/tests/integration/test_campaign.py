import json
from pathlib import Path

import pytest

from hive.experiment_runner import execute
from hive.lab import consume_holdout, run_campaign
from hive.orchestrator import DEFAULT_CONFIG
from hive.storage import Store
from hive.task_spec import load_tasks


def test_full_synthetic_campaign_restores_and_is_idempotent(tmp_path, monkeypatch):
    """Harness verification, explicitly not real-model scientific evidence."""
    monkeypatch.setattr("hive.lab.discover", lambda *_: {"available": True, "models": [{"id": "fixture", "digest": "fixture-v1"}]})
    monkeypatch.setattr("hive.model_registry.discover", lambda *_: {"available": True, "models": [{"id": "fixture", "digest": "fixture-v1"}]})
    real_consume = consume_holdout
    monkeypatch.setattr("hive.lab.consume_holdout", lambda tasks, ref, _: real_consume(tasks, ref, tmp_path / "ledger"))
    def simulated(task, route, config):
        result = execute(task, "tool", config)
        if route.startswith("local_"):
            result.update(model="fixture", model_digest="fixture-v1", backend="test-double")
        return result
    monkeypatch.setattr("hive.orchestrator.execute", simulated)
    config = dict(DEFAULT_CONFIG, model="fixture")
    first = run_campaign(tmp_path / "state", config)
    assert first["budget"]["requests"] == 108
    assert first["verification"]["saved_outputs_reproduced"] is True
    assert first["decision"]["decision"] != "PROMOTE"
    assert first["splits"]["holdout"]["paired_ucb_vs_fixed"]["n"] == 24
    second = run_campaign(tmp_path / "state", config)
    assert second == first
    store = Store(tmp_path / "state")
    assert store.get("budget")["requests"] == 108
    assert store.get("policy")["counts"] == store.get("frozen_candidate")["counts"]
    store.close()


def test_holdout_ledger_prevents_cross_campaign_reuse(tmp_path):
    tasks = load_tasks("holdout", 789)
    consume_holdout(tasks, "campaign-a", tmp_path)
    consume_holdout(tasks, "campaign-a", tmp_path)  # legitimate same-campaign resume
    with pytest.raises(ValueError, match="consumed"):
        consume_holdout(tasks, "campaign-b", tmp_path)
