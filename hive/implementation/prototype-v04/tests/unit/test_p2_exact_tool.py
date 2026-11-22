"""Deterministic checks for the quarantined P2 route preference."""
import copy
import hashlib
import json

from hive.governor import decide, p2_source_context
from hive.learning_policy import Policy
from hive.adaptive_metrics import assess_candidate
from hive.task_spec import _task
from hive.verifier import verify


def _decision(task, policy, route_checks=None):
    return decide(task, candidates=["tool", "local_direct"], requested_route=None,
                  policy=policy, policy_hash="policy-hash", source_hash="source-hash",
                  config_hash="config-hash", task_hash=hashlib.sha256(task["id"].encode()).hexdigest(),
                  route_checks=route_checks or {}, max_tokens=128)


def test_p2_prefers_only_eligible_exact_tool_and_attributes_source():
    task = _task("development", "math", 1, 771)
    task["permissions"] = {"version": 1, "routes": ["tool", "local_direct"]}
    policy = Policy(version=3)
    decision = _decision(task, policy)
    assert decision["selected"] == "tool"
    receipt = decision["receipt"]
    assert receipt["policy_version"] == 3
    assert receipt["route_source"] == "p2_exact_tool_preference"
    assert receipt["route_attribution"] == {
        "source": "p2_exact_tool_preference", "category": "math",
        "eligible_routes": ["tool", "local_direct"], "selected_route": "tool",
        "task_hash": receipt["task_hash"], "source_hash": "source-hash",
        "config_hash": "config-hash", "policy_hash": "policy-hash",
        "source_context": p2_source_context(task)}

    blocked = _decision(task, policy, {"tool": "independent verifier unavailable"})
    assert blocked["selected"] == "local_direct"
    assert blocked["receipt"]["route_source"] == "policy_selection"
    no_route = _decision(task, policy, {"tool": "independent verifier unavailable",
                                        "local_direct": "pinned model unavailable"})
    assert no_route["selected"] is None
    assert no_route["receipt"]["route_source"] == "abstention"


def test_p2_keeps_model_required_work_and_explicit_choice_semantics():
    policy = Policy(version=3)
    classification = {"id": "ambiguous-label", "category": "text_classification",
        "split": "development", "prompt": "Classify with independent labels.",
        "input": {"items": [{"id": "x", "text": "ambiguous"}],
                  "labels": {"a": "A", "b": "B"}},
        "expected": {"labels": {"x": "a"}}, "critical": False,
        "evaluator": "independent_labels_v1", "allowed_tools": [], "tool_schemas": {},
        "permissions": {"version": 1, "routes": ["local_direct"]}}
    selected = decide(classification, candidates=["tool", "local_direct"], requested_route=None,
        policy=policy, policy_hash="p", source_hash="s", config_hash="c", task_hash="t",
        route_checks={})
    assert selected["selected"] == "local_direct"
    assert selected["receipt"]["route_source"] == "policy_selection"
    abstain = decide(classification, candidates=["tool", "local_direct"], requested_route=None,
        policy=policy, policy_hash="p", source_hash="s", config_hash="c", task_hash="t",
        route_checks={"local_direct": "pinned model unavailable"})
    assert abstain["selected"] is None
    assert abstain["receipt"]["route_source"] == "abstention"

    explicit = decide(classification, candidates=["tool", "local_direct"], requested_route="local_direct",
        policy=policy, policy_hash="p", source_hash="s", config_hash="c", task_hash="t",
        route_checks={})
    assert explicit["selected"] == "local_direct"
    assert explicit["receipt"]["route_source"] == "explicit_request"


def test_p2_exact_tool_output_still_needs_verifier_and_recovery_is_versioned():
    ambiguous = _task("development", "hallucination", 2, 773)
    assert ambiguous["expected"]["ambiguous"] is True
    abstention = verify(ambiguous, {"output": json.dumps(ambiguous["expected"])})
    assert abstention["valid"] is True and abstention["passed"] is True
    wrong = verify(ambiguous, {"output": '{"answer":"wrong","supported":true,"ambiguous":false}'})
    assert wrong["valid"] is True and wrong["passed"] is False

    before = Policy(version=3).snapshot()
    restored = Policy(state=copy.deepcopy(before))
    assert restored.snapshot() == before
    assert Policy(state=Policy(version=1).snapshot()).version == 1
    assert Policy(state=Policy(version=2).snapshot()).version == 2


def test_p2_regression_counterexample_cannot_pass_candidate_gate():
    def row(task_id, passed, critical=False):
        return {"task_id": task_id, "category": "math", "valid": True,
                "passed": passed, "critical": critical, "utility": int(passed),
                "latency_s": 1.0, "tokens": 0}
    baseline = [row("critical", True, True), row("other", False)]
    candidate = [row("critical", False, True), row("other", True)]
    verdict = assess_candidate(baseline, candidate)
    assert verdict["quality_delta"] == 0
    assert verdict["accepted"] is False
    assert verdict["critical_regression"] is True
