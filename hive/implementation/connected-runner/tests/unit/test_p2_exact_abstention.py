"""P2 v4 exact work must use its deterministic tool or abstain."""
import copy
import json

import pytest

from hive import orchestrator
from hive.learning_policy import Policy
from hive.task_spec import _task


def _run(tmp_path, task, route=None, *, route_checks=None, monkeypatch):
    executor = orchestrator.Executor(tmp_path, {**orchestrator.DEFAULT_CONFIG,
        "routes": ["local_direct"], "max_tokens": 16})
    executor.store.set("governing_policy", Policy(mode="fixed", version=4).snapshot())
    executor.enqueue(task, route=route)
    if route_checks is not None:
        monkeypatch.setattr(executor, "_route_checks", lambda *_a, **_k: route_checks)
    monkeypatch.setattr(orchestrator, "execute", lambda *_a, **_k: pytest.fail("route dispatched"))
    result = executor.run_one()
    return executor, result


@pytest.mark.parametrize("case", ["permission", "scope", "verifier", "tool_unavailable", "explicit_model"])
def test_executor_abstains_without_reserving_or_dispatching_exact_task(tmp_path, monkeypatch, case):
    task = _task("development", "math", 1, 908)
    task["permissions"] = {"version": 1, "routes": ["local_direct", "tool"]}
    route = None
    checks = {}
    if case == "permission":
        task["permissions"]["routes"] = ["local_direct"]
    elif case == "scope":
        task["allowed_tools"] = []
        task["input"]["allowed_tools"] = []
        task["tool_schemas"] = {}
        task["input"]["tool_schemas"] = {}
    elif case == "verifier":
        checks["tool"] = "independent verifier unavailable: ValueError"
    elif case == "tool_unavailable":
        checks["tool"] = "configured tool unavailable"
    elif case == "explicit_model":
        route = "local_direct"
    executor, result = _run(tmp_path, task, route, route_checks=checks, monkeypatch=monkeypatch)
    try:
        assert result["passed"] is False
        assert executor._budget()["requests"] == 0
        assert executor._budget()["tokens_reserved"] == 0
        receipt = executor.store.read_artifact(result["decision_ref"])
        assert receipt["policy_version"] == 4
        assert receipt["selected_route"] is None
        assert "P2 v4 exact categories require the deterministic tool" in next(
            reason for row in receipt["alternatives"] if row["route"] == "local_direct"
            for reason in row["reasons"])
    finally:
        executor.close()


def test_v4_uses_tool_when_eligible_and_nonexact_requires_model(tmp_path, monkeypatch):
    task = _task("development", "math", 2, 909)
    task["permissions"] = {"version": 1, "routes": ["tool", "local_direct"]}
    executor = orchestrator.Executor(tmp_path / "tool", {**orchestrator.DEFAULT_CONFIG,
        "routes": ["local_direct"], "max_tokens": 16})
    executor.store.set("governing_policy", Policy(mode="fixed", version=4).snapshot())
    decision = executor._decision(task, None, Policy(mode="fixed", version=4))
    assert decision["selected"] == "tool"
    assert decision["receipt"]["route_source"] == "p2_exact_tool_preference"
    executor.close()

    classification = {"id": "labels", "category": "text_classification", "split": "development",
        "prompt": "Classify with independent labels.",
        "input": {"items": [{"id": "x", "text": "ambiguous"}], "labels": {"a": "A", "b": "B"}},
        "expected": {"labels": {"x": "a"}}, "critical": False,
        "evaluator": "independent_labels_v1", "allowed_tools": [], "tool_schemas": {},
        "permissions": {"version": 1, "routes": ["local_direct"]}}
    executor, result = _run(tmp_path / "classification", classification,
        route_checks={"local_direct": "configured local model is unavailable"}, monkeypatch=monkeypatch)
    try:
        assert result["passed"] is False
        receipt = executor.store.read_artifact(result["decision_ref"])
        assert receipt["selected_route"] is None
        assert "tool" not in receipt["eligible_routes"]
    finally:
        executor.close()


def test_policy_versions_one_to_three_keep_historical_exact_route_behavior():
    for version in (1, 2, 3):
        policy = Policy(mode="fixed", version=version)
        assert policy.choose("math", ["local_direct", "tool"]) == ("local_direct" if version == 1 else "tool")
        snapshot = policy.snapshot()
        assert Policy(state=copy.deepcopy(snapshot)).snapshot() == snapshot
    with pytest.raises(ValueError, match="require the deterministic tool"):
        Policy(version=4).choose("math", ["local_direct"])


def test_v4_replay_accepts_bound_receipt_and_rejects_downgraded_event(tmp_path, monkeypatch):
    task = _task("development", "math", 1, 910)
    task["permissions"] = {"version": 1, "routes": ["tool", "local_direct"]}
    executor = orchestrator.Executor(tmp_path, {**orchestrator.DEFAULT_CONFIG,
        "routes": ["local_direct"], "max_tokens": 16})
    executor.store.set("governing_policy", Policy(mode="fixed", version=4).snapshot())
    executor.enqueue(task)
    result = executor.run_one()
    assert result["route"] == "tool"
    evidence = orchestrator.inspect_evidence(executor.store, result["id"])
    assert evidence["decision"]["policy_version"] == 4

    event = executor.store.db.execute(
        "SELECT seq, detail FROM events WHERE job_id=? AND state='VERIFYING' ORDER BY seq DESC LIMIT 1",
        (result["id"],)).fetchone()
    downgraded = json.loads(event["detail"])
    downgraded["policy_version"] = 3
    executor.store.db.execute("UPDATE events SET detail=? WHERE seq=?",
        (json.dumps(downgraded, separators=(",", ":")), event["seq"]))
    with pytest.raises(ValueError, match="does not bind saved execution"):
        orchestrator.inspect_evidence(executor.store, result["id"])
    executor.close()
