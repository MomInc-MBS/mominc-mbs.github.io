"""Synthetic adversarial checks; no real model or holdout is used."""
import json

import pytest

from hive.adaptive import run_adaptive
from hive.experiment_runner import execute
from hive.orchestrator import DEFAULT_CONFIG
from hive.storage import Store


@pytest.fixture
def synthetic(monkeypatch):
    calls = []

    def fake(task, route, config):
        calls.append((task["id"], route))
        result = execute(task, "tool", config)
        if route.startswith("local_"):
            result.update(model=config["model"], model_digest="synthetic-v1", backend="synthetic")
        return result

    monkeypatch.setattr("hive.orchestrator.execute", fake)
    return calls


def test_corrupted_saved_evidence_is_not_reused(tmp_path, synthetic):
    config = dict(DEFAULT_CONFIG, model="synthetic")
    report = run_adaptive(tmp_path, config, rounds=2)
    (tmp_path / report["baseline"]["validation_refs"][0]).write_text("{}", encoding="utf-8")
    count = len(synthetic)
    with pytest.raises((ValueError, RuntimeError)):
        run_adaptive(tmp_path, config, rounds=2)
    assert len(synthetic) == count


def test_substituted_valid_artifact_for_wrong_task_is_rejected(tmp_path, synthetic):
    config = dict(DEFAULT_CONFIG, model="synthetic")
    run_adaptive(tmp_path, config, rounds=2)
    store = Store(tmp_path)
    try:
        state = store.get("adaptive_campaign")
        validation = state["progress"]["rows"]["validation"]
        rows = list(validation.values())
        rows[0]["baseline"]["evidence_ref"] = rows[1]["baseline"]["evidence_ref"]
        store.set("adaptive_campaign", state)
    finally:
        store.close()
    count = len(synthetic)
    with pytest.raises((ValueError, RuntimeError)):
        run_adaptive(tmp_path, config, rounds=2)
    assert len(synthetic) == count


def test_valid_evidence_from_other_job_is_rejected(tmp_path, synthetic):
    config = dict(DEFAULT_CONFIG, model="synthetic")
    run_adaptive(tmp_path, config, rounds=2)
    store = Store(tmp_path)
    try:
        state = store.get("adaptive_campaign")
        row = next(iter(state["progress"]["rows"]["validation"].values()))
        # Same task can have multiple independently executed jobs; the evidence
        # must belong to the job named in the stored baseline entry.
        row["baseline"]["evidence_ref"] = row["learned_greedy"]["evidence_ref"]
        store.set("adaptive_campaign", state)
    finally:
        store.close()
    with pytest.raises((ValueError, RuntimeError)):
        run_adaptive(tmp_path, config, rounds=2)


@pytest.mark.parametrize("phase", ["baseline", "learned_greedy"])
def test_paused_resume_rejects_substituted_evidence(tmp_path, synthetic, monkeypatch, phase):
    import hive.orchestrator as orchestrator
    fake = orchestrator.execute
    def stop_during_candidate(task, route, config):
        result = fake(task, route, config)
        if len(synthetic) == 20:
            (tmp_path / "STOP").touch()
        return result
    monkeypatch.setattr(orchestrator, "execute", stop_during_candidate)
    config = dict(DEFAULT_CONFIG, model="synthetic")
    try:
        run_adaptive(tmp_path, config, rounds=2)
    except RuntimeError:
        pass
    assert (tmp_path / "STOP").exists()
    store = Store(tmp_path)
    try:
        state = store.get("adaptive_campaign")
        rows = list(state["progress"]["rows"]["validation"].values())
        if phase == "baseline":
            rows[0]["baseline"]["evidence_ref"] = rows[1]["baseline"]["evidence_ref"]
        else:
            row = next(r for r in rows if "learned_greedy" in r)
            row["learned_greedy"]["evidence_ref"] = row["baseline"]["evidence_ref"]
        store.set("adaptive_campaign", state)
    finally:
        store.close()
    (tmp_path / "STOP").unlink()
    before = len(synthetic)
    with pytest.raises((ValueError, RuntimeError)):
        run_adaptive(tmp_path, config, rounds=2)
    assert len(synthetic) == before


def test_changed_source_rejected_before_any_new_calls(tmp_path, synthetic, monkeypatch):
    config = dict(DEFAULT_CONFIG, model="synthetic")
    run_adaptive(tmp_path, config, rounds=2)
    from hive import adaptive
    original = adaptive.code_version
    monkeypatch.setattr(adaptive, "code_version", lambda: dict(original(), source_sha256="changed"))
    count = len(synthetic)
    with pytest.raises((ValueError, RuntimeError)):
        run_adaptive(tmp_path, config, rounds=2)
    assert len(synthetic) == count


def test_rejected_candidate_does_not_prevent_next_scheduled_candidate(tmp_path, synthetic, monkeypatch):
    import hive.adaptive_metrics as metrics
    original = metrics.assess_candidate
    attempted = []
    def assess(baseline, candidate):
        attempted.append((baseline, candidate))
        if len(attempted) == 1:
            raise ValueError("synthetic failed assessment")
        return original(baseline, candidate)
    monkeypatch.setattr(metrics, "assess_candidate", assess)
    report = run_adaptive(tmp_path, dict(DEFAULT_CONFIG, model="synthetic"), rounds=2)
    # A separate fixed-baseline descriptive comparison may also be computed.
    assert len(attempted) >= 2
    assert report["candidates"][0]["accepted"] is False
    assert len(report["candidates"]) == 2
    assert all(c["promote_eligible"] is False for c in report["candidates"])
    for baseline, candidate in attempted:
        assert {r["task_id"] for r in baseline} == {r["task_id"] for r in candidate}
    store = Store(tmp_path)
    try:
        policy = store.read_artifact(report["development"]["policy_artifact"])["policy"]
        trained = sum(v["n"] for bucket in policy["counts"].values() for v in bucket.values())
        development = [j for j in store.jobs() if j["spec"]["task"]["split"] == "development"]
        assert trained == len(development)
        assert store.get("policy") is None
        assert store.get("current_checkpoint") is None
    finally:
        store.close()


def test_candidate_assessed_before_next_and_compared_to_experimental_incumbent(tmp_path, synthetic, monkeypatch):
    import hive.adaptive_metrics as metrics
    original = metrics.assess_candidate
    assessed = []
    def assess(baseline, candidate):
        assessed.append((baseline, candidate, len(synthetic)))
        result = original(baseline, candidate)
        # Synthetic test forces an experimental acceptance to exercise the next comparison.
        result["accepted"] = len(assessed) == 1
        return result
    monkeypatch.setattr(metrics, "assess_candidate", assess)
    run_adaptive(tmp_path, dict(DEFAULT_CONFIG, model="synthetic"), rounds=2)
    # The first and second assessments can describe the same first candidate
    # against the incumbent and original fixed baseline respectively.
    second_candidate = next(item for item in assessed if item[2] > assessed[0][2])
    assert {r["task_id"]: r for r in second_candidate[0]} == {r["task_id"]: r for r in assessed[0][1]}


def test_quality_tie_with_better_utility_does_not_accept():
    from hive.adaptive_metrics import assess_candidate
    row = dict(task_id="a", category="math", valid=True, passed=True,
               critical=True, utility=0.1, latency_s=1.0, tokens=1)
    result = assess_candidate([row], [dict(row, utility=0.9)])
    assert result["accepted"] is False
    assert result["promote_eligible"] is False


def test_crash_during_incumbent_update_rolls_back_and_resumes(tmp_path, monkeypatch):
    """Synthetic first candidate improves; crash immediately after one KV write."""
    calls = []
    def fake(task, route, config):
        calls.append((task["id"], route))
        result = execute(task, "tool", config)
        if route.startswith("local_"):
            result.update(model=config["model"], model_digest="synthetic-v1", backend="synthetic")
        if route == "local_direct":
            result["output"] = "{}"
        return result
    monkeypatch.setattr("hive.orchestrator.execute", fake)
    original_set = Store.set
    class SimulatedDeath(BaseException):
        pass
    def crash_after_write(self, key, value):
        original_set(self, key, value)
        if key == "adaptive_incumbent_refs":
            raise SimulatedDeath()
    monkeypatch.setattr(Store, "set", crash_after_write)
    config = dict(DEFAULT_CONFIG, model="synthetic")
    with pytest.raises(SimulatedDeath):
        run_adaptive(tmp_path, config, rounds=1)
    before = len(calls)
    monkeypatch.setattr(Store, "set", original_set)
    report = run_adaptive(tmp_path, config, rounds=1)
    assert report["candidates"][0]["accepted"] is True
    assert len(calls) == before
    assert run_adaptive(tmp_path, config, rounds=1) == report
    assert len(calls) == before


def test_paused_after_assessment_rejects_replaced_job_evidence(tmp_path, synthetic, monkeypatch):
    original_set = Store.set
    def stop_after_decision(self, key, value):
        original_set(self, key, value)
        if key == "adaptive_campaign" and value.get("candidate_results"):
            (tmp_path / "STOP").touch()
    monkeypatch.setattr(Store, "set", stop_after_decision)
    config = dict(DEFAULT_CONFIG, model="synthetic")
    paused = run_adaptive(tmp_path, config, rounds=2)
    assert paused["state"] == "PAUSED"
    monkeypatch.setattr(Store, "set", original_set)
    store = Store(tmp_path)
    try:
        state = store.get("adaptive_campaign")
        assert len(state["candidate_results"]) == 1
        row = next(iter(state["progress"]["rows"]["validation"].values()))
        job = store.get_job(row["learned_greedy"]["job_id"])
        result = job["result"]
        result["evidence_ref"] = row["baseline"]["evidence_ref"]
        store.db.execute("UPDATE jobs SET result=? WHERE id=?", (json.dumps(result), job["id"]))
    finally:
        store.close()
    (tmp_path / "STOP").unlink()
    before = len(synthetic)
    with pytest.raises((ValueError, RuntimeError)):
        run_adaptive(tmp_path, config, rounds=2)
    assert len(synthetic) == before
