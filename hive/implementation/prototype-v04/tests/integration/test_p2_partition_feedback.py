"""Opt-in v4 contract and partitioned feedback integration checks."""
import copy
import json

import pytest

from hive import orchestrator
from hive.learning_policy import Policy
from hive.task_spec import _task


def _executor(path, *, memory_enabled=True):
    ex = orchestrator.Executor(path, {**orchestrator.DEFAULT_CONFIG, "routes": ["tool"],
        "max_retries": 0, "max_tokens": 16})
    governing = Policy(mode="fixed", version=4, memory_enabled=memory_enabled).snapshot()
    ex.store.set("governing_policy", governing)
    return ex, governing


def make_task(seed, *, split="development", source="source-a", routes=None):
    task = _task_base(split, seed)
    task["source_group"] = source
    task["permissions"] = {"version": 1, "routes": routes or ["tool"]}
    return task


def _task_base(split, seed):
    return _task(split, "math", 1, seed)


def _run(ex, task):
    job = ex.store.enqueue({"task": task, "route": None, "learn_feedback": True})
    outcome = ex.run_one(job)
    if outcome and outcome.get("evidence_ref"):
        evidence = ex.store.read_artifact(outcome["evidence_ref"])
        outcome["decision_ref"] = evidence["decision_ref"]
    return job, outcome


def test_partition_keys_isolate_source_and_permission_contracts(tmp_path):
    ex, _ = _executor(tmp_path)
    try:
        _, first = _run(ex, make_task(101, source="source-a", routes=["tool"]))
        _, second = _run(ex, make_task(102, source="source-b", routes=["tool"]))
        _, third = _run(ex, make_task(103, source="source-a", routes=["tool", "local_direct"]))
        assert first["passed"] and second["passed"] and third["passed"]
        decisions = [ex.store.read_artifact(x["decision_ref"]) for x in (first, second, third)]
        keys = [d["partition_keys"]["tool"] for d in decisions]
        assert len(set(keys)) == 3
        assert decisions[0]["task_contract"]["source_group"] == "source-a"
        assert decisions[0]["task_contract"]["permission_hash"] != decisions[2]["task_contract"]["permission_hash"]
        candidate = Policy(state=ex.store.get("policy"))
        assert all(key in candidate.partitions for key in keys)
        assert candidate.counts == {}
    finally:
        ex.close()


@pytest.mark.parametrize("output,valid,expected_n", [
    ('{"answer": 0}', True, 1),
    ("not-json", False, 0),
])
def test_wrong_or_invalid_tool_output_never_adds_positive_unverified_memory(
        tmp_path, monkeypatch, output, valid, expected_n):
    ex, _ = _executor(tmp_path)
    monkeypatch.setattr(orchestrator, "execute", lambda *_a, **_k: {
        "output": output, "latency_s": 0.01, "tokens": 0, "model": None,
        "request": {}, "error": None, "failure_category": None})
    try:
        job, result = _run(ex, make_task(111))
        feedback_ref = ex.store.get("feedback:" + job)
        feedback = ex.store.read_artifact(feedback_ref)
        assert feedback["valid"] is valid
        assert feedback["passed"] is False and feedback["quality"] == 0
        assert feedback["feedback_eligible"] is valid
        candidate = Policy(state=ex.store.get("policy"))
        partition = feedback["partition_key"]
        row = candidate.partitions.get(partition, {}).get("math", {}).get("tool")
        assert (row["n"] if row else 0) == expected_n
        assert not (row and row["successes"])
    finally:
        ex.close()


def test_memory_off_logs_feedback_without_partition_updates(tmp_path):
    ex, _ = _executor(tmp_path, memory_enabled=False)
    try:
        job, result = _run(ex, make_task(121))
        assert result["passed"] is True
        feedback = ex.store.read_artifact(ex.store.get("feedback:" + job))
        assert feedback["valid"] and feedback["passed"]
        assert feedback["feedback_eligible"] is False
        candidate = Policy(state=ex.store.get("policy"))
        assert candidate.memory_enabled is False and candidate.partitions == {}
        assert "memory_enabled" in ex.store.get("governing_policy")
    finally:
        ex.close()


def test_memory_off_governing_policy_cannot_train_a_stale_enabled_candidate(tmp_path):
    ex, _ = _executor(tmp_path, memory_enabled=False)
    try:
        ex.store.set("policy", Policy(version=4, memory_enabled=True).snapshot())
        job, result = _run(ex, make_task(122))
        assert result["passed"]
        assert ex.store.read_artifact(ex.store.get("feedback:" + job))["feedback_eligible"] is False
        assert Policy(state=ex.store.get("policy")).partitions == {}
    finally:
        ex.close()


@pytest.mark.parametrize("split", ["validation", "holdout"])
def test_non_development_split_never_creates_feedback_or_partitions(tmp_path, split):
    ex, _ = _executor(tmp_path)
    try:
        _, result = _run(ex, make_task(131, split=split))
        assert result["passed"] is True
        assert not any(key.startswith("feedback:") for key in
                       [row[0] for row in ex.store.db.execute("SELECT key FROM kv")])
        assert not ex.store.get("policy")
        if split == "holdout":
            assert orchestrator.inspect_evidence(ex.store, result["id"])["sealed"] is True
    finally:
        ex.close()


def test_feedback_is_idempotent_candidate_stays_separate_and_contract_tamper_fails(tmp_path):
    ex, governing = _executor(tmp_path)
    try:
        job, result = _run(ex, make_task(141))
        feedback_ref = ex.store.get("feedback:" + job)
        before = Policy(state=ex.store.get("policy")).snapshot()
        # A completed job cannot be claimed/recounted on retry.
        assert ex.run_one(job) is None
        assert ex.store.get("feedback:" + job) == feedback_ref
        assert Policy(state=ex.store.get("policy")).snapshot() == before
        assert Policy(state=ex.store.get("governing_policy")).snapshot() == Policy(state=governing).snapshot()
        skill_ref = ex.store.get("route_skill:" + ex.store.read_artifact(feedback_ref)["partition_key"] + ":math:tool")
        assert skill_ref and ex.store.read_artifact(skill_ref)["supporting_feedback_refs"] == [feedback_ref]
        evidence = orchestrator.inspect_evidence(ex.store, job)
        forged = copy.deepcopy(evidence)
        forged["decision"]["task_contract"]["source_group"] = "forged-source"
        forged["decision"]["task_contract_hash"] = "0" * 64
        decision_ref = ex.store.put_artifact(forged["decision"])
        forged["decision_ref"] = decision_ref
        result_record = ex.store.get_job(job)["result"]
        result_record["evidence_ref"] = ex.store.put_artifact(forged)
        ex.store.db.execute("UPDATE jobs SET result=? WHERE id=?", (json.dumps(result_record), job))
        with pytest.raises(ValueError, match="bind saved execution|contract replay"):
            orchestrator.inspect_evidence(ex.store, job)
    finally:
        ex.close()


@pytest.mark.parametrize("governing_version", [1, 3])
def test_rollback_archives_v4_candidate_before_legacy_feedback(tmp_path, governing_version):
    ex, _ = _executor(tmp_path)
    try:
        archived = Policy(version=4).snapshot()
        ex.store.set("policy", archived)
        ex.store.set("governing_policy", Policy(mode="fixed", version=governing_version).snapshot())
        job, outcome = _run(ex, make_task(151))
        assert outcome["passed"] and ex.store.get_job(job)["state"] == "BLOCKED"
        assert Policy(state=ex.store.get("quarantined_v4_candidate")).snapshot() == archived
        assert ex.store.get("policy")["version"] == governing_version
        assert orchestrator.inspect_evidence(ex.store, job)["verification"]["passed"]
    finally:
        ex.close()


@pytest.mark.parametrize("field,value", [
    ("evidence_ref", "artifacts/" + "0" * 64 + ".json"),
    ("decision_ref", "artifacts/" + "0" * 64 + ".json"),
    ("quality", 0), ("partition_key", "forged"), ("task_contract_hash", "0" * 64),
])
def test_rebound_feedback_is_rejected(tmp_path, field, value):
    ex, _ = _executor(tmp_path)
    try:
        job, _ = _run(ex, make_task(152))
        feedback = ex.store.read_artifact(ex.store.get("feedback:" + job))
        feedback[field] = value
        if field == "quality":
            feedback["passed"] = False
        ex.store.set("feedback:" + job, ex.store.put_artifact(feedback))
        with pytest.raises(ValueError, match="feedback replay"):
            orchestrator.inspect_evidence(ex.store, job)
    finally:
        ex.close()


def test_missing_feedback_is_rejected(tmp_path):
    ex, _ = _executor(tmp_path)
    try:
        job, _ = _run(ex, make_task(153))
        ex.store.set("feedback:" + job, None)
        with pytest.raises(ValueError, match="feedback replay"):
            orchestrator.inspect_evidence(ex.store, job)
    finally:
        ex.close()


def test_mission_field_outside_task_contract_cannot_be_rebound(tmp_path):
    ex, _ = _executor(tmp_path)
    try:
        job, _ = _run(ex, make_task(154))
        result = ex.store.get_job(job)["result"]
        evidence = ex.store.read_artifact(result["evidence_ref"])
        evidence["mission_config"]["endpoint"] = "http://127.0.0.1:1"
        result["evidence_ref"] = ex.store.put_artifact(evidence)
        ex.store.db.execute("UPDATE jobs SET result=? WHERE id=?", (json.dumps(result), job))
        with pytest.raises(ValueError, match="configuration binding"):
            orchestrator.inspect_evidence(ex.store, job)
    finally:
        ex.close()


def test_recorded_adapter_config_hash_reproduces_without_instantiation():
    class Dummy:
        pass
    config = {**orchestrator.DEFAULT_CONFIG, "adapter": Dummy(), "isolation_adapter": Dummy()}
    assert orchestrator.recorded_config_hash(orchestrator.config_record(config)) == orchestrator.config_hash(config)


@pytest.mark.parametrize("memory_enabled", [False, True])
def test_feedback_eligibility_must_match_pinned_gates(tmp_path, memory_enabled):
    ex, _ = _executor(tmp_path, memory_enabled=memory_enabled)
    try:
        job, _ = _run(ex, make_task(155))
        feedback = ex.store.read_artifact(ex.store.get("feedback:" + job))
        feedback["feedback_eligible"] = not feedback["feedback_eligible"]
        ex.store.set("feedback:" + job, ex.store.put_artifact(feedback))
        with pytest.raises(ValueError, match="learning eligibility"):
            orchestrator.inspect_evidence(ex.store, job)
    finally:
        ex.close()


@pytest.mark.parametrize("crash_before_cost_settlement", [False, True])
def test_crash_after_feedback_recovers_without_redispatch_or_double_learning(tmp_path, monkeypatch, crash_before_cost_settlement):
    from hive import storage
    ex, _ = _executor(tmp_path)
    try:
        job = ex.store.enqueue({"task": make_task(156), "route": None, "learn_feedback": True})
        original_set, original_report = ex.store.set, ex._report
        if crash_before_cost_settlement:
            def crash(key, value):
                if key == "budget" and ex.store.get("feedback:" + job):
                    raise RuntimeError("crash after feedback")
                return original_set(key, value)
            monkeypatch.setattr(ex.store, "set", crash)
        else:
            monkeypatch.setattr(ex, "_report", lambda *a, **kw: (_ for _ in ()).throw(RuntimeError("crash after feedback")))
        with pytest.raises(RuntimeError, match="crash after feedback"):
            ex.run_one(job)
        feedback_ref = ex.store.get("feedback:" + job)
        evidence_ref = ex.store.read_artifact(feedback_ref)["evidence_ref"]
        candidate = ex.store.get("policy")
        monkeypatch.setattr(ex.store, "set", original_set)
        monkeypatch.setattr(ex, "_report", original_report)
        monkeypatch.setattr(storage, "_alive", lambda pid: False)
        assert ex.recover() == [job]
        before = ex._budget()
        monkeypatch.setattr(orchestrator, "execute", lambda *a, **kw: pytest.fail("completed observation redispatched"))
        result = ex.run_one(job)
        assert result["reused_verified_feedback"] and result["passed"]
        assert result["evidence_ref"] == evidence_ref
        assert ex.store.get("feedback:" + job) == feedback_ref
        assert ex.store.get("policy") == candidate
        assert ex._budget() == before
        assert orchestrator.inspect_evidence(ex.store, job)["verification"]["passed"]
        assert ex.run_one(job) is None
    finally:
        ex.close()


def test_recovered_critical_rejection_retains_checkpoint_rollback(tmp_path, monkeypatch):
    from hive import storage
    from hive.checkpoint_manager import Checkpoints
    ex, _ = _executor(tmp_path)
    try:
        checkpoints = Checkpoints(ex.store)
        previous = checkpoints.save(Policy(mode="fixed").snapshot(), {"fixture": True}, approved=True)
        candidate = checkpoints.save(Policy(mode="fixed", version=4).snapshot(), {"fixture": True}, approved=True)
        checkpoints.promote(previous)
        checkpoints.promote(candidate)
        task = make_task(157)
        task["critical"] = True
        job = ex.store.enqueue({"task": task, "route": None, "allow_retry": False})
        monkeypatch.setattr(orchestrator, "execute", lambda *a, **kw: {"output": '{"answer": -1}',
            "latency_s": 0.001, "tokens": 0, "model": "tool", "request": {}})
        report = ex._report
        monkeypatch.setattr(ex, "_report", lambda *a, **kw: (_ for _ in ()).throw(RuntimeError("crash after feedback")))
        with pytest.raises(RuntimeError, match="crash after feedback"):
            ex.run_one(job)
        monkeypatch.setattr(ex, "_report", report)
        monkeypatch.setattr(storage, "_alive", lambda pid: False)
        ex.recover()
        monkeypatch.setattr(orchestrator, "execute", lambda *a, **kw: pytest.fail("rejected observation redispatched"))
        result = ex.run_one(job)
        assert result["reused_verified_feedback"] and result["passed"] is False
        assert ex.store.get_job(job)["state"] == "REJECTED"
        assert ex.store.get_job(job)["result"]["automatic_rollback"] == previous
        assert ex.store.get("current_checkpoint") == previous
    finally:
        ex.close()
