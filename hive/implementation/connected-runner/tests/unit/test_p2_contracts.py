"""Contract/partition boundaries, without provider calls or private data."""
import copy
from dataclasses import FrozenInstanceError
import json

import pytest

from hive.contracts import TaskContractV1, OutcomeFeedbackV1, feedback_partition_key, record_hash


def fixture():
    task = {"id": "contract-dev", "category": "math", "split": "development",
            "evaluator": "math_exact", "source_group": "synthetic-group",
            "allowed_tools": ["multiply"], "input": {"a": 4, "b": 7},
            "prompt": "PRIVATE_PROMPT_SENTINEL", "expected": {"answer": "PRIVATE_LABEL_SENTINEL"},
            "success_criteria": "PRIVATE_CRITERIA_SENTINEL"}
    config = {"timeout_s": 30, "max_requests": 0, "max_total_tokens": 0,
              "max_tokens": 0, "max_cycles": 5, "max_storage_bytes": 4096, "max_wall_s": 60}
    context = {"declared_source_group": task["source_group"], "evaluator": "math_exact",
               "verifier_sha256": {"verifier.py": "a" * 64}}
    return task, config, context


def contract(**updates):
    task, config, context = fixture()
    task.update(updates)
    context["declared_source_group"] = task.get("source_group")
    return TaskContractV1.from_task(task, config, permitted_routes=["tool", "local_direct"],
                                  source_context=context, exact_tool_required=True)


def feedback(**updates):
    kwargs = dict(task_contract_hash="c", job_id="j", evidence_ref="e", decision_ref="d",
                  partition_key="p", route="tool", split="development", valid=True,
                  passed=True, quality=1, feedback_eligible=True,
                  charged_cost={"requests": 0, "tokens_reserved": 0, "elapsed_s": .25})
    kwargs.update(updates)
    return OutcomeFeedbackV1(**kwargs)


def test_contract_contains_static_outcome_without_prompt_input_or_labels():
    item = contract()
    record = item.to_record()
    text = json.dumps(record)
    assert not any(secret in text for secret in (
        "PRIVATE_PROMPT_SENTINEL", "PRIVATE_LABEL_SENTINEL", "PRIVATE_CRITERIA_SENTINEL"))
    assert not any(key in record for key in ("expected", "prompt", "input", "success_criteria"))
    assert record["outcome"] == "Produce the independently verified exact arithmetic result."
    assert record["source_attribution"] == "declared"
    assert record["budget_limits"]["max_requests"] == record["budget_limits"]["max_tokens"] == 0
    assert record["declared_deadline_utc"] is None
    assert record["source_sensitivity"] == "unclassified"


def test_task_scoped_source_is_not_an_independence_attestation():
    record = contract(source_group=None).to_record()
    assert record["source_group"] == "task:contract-dev"
    assert record["source_attribution"] == "task_scoped"


def test_stable_json_hash_and_deep_immutable_containers():
    task, config, context = fixture()
    item = TaskContractV1.from_task(task, config, permitted_routes=["local_direct", "tool"],
                                  source_context=context, exact_tool_required=True)
    before = item.to_record()
    context["verifier_sha256"]["verifier.py"] = "b" * 64
    config["max_cycles"] = 99
    assert item.to_record() == before
    assert record_hash(json.loads(json.dumps(before))) == record_hash(before)
    assert record_hash({"a": 1, "b": 2}) == record_hash({"b": 2, "a": 1})
    with pytest.raises(TypeError):
        item.verifier_hashes["new"] = "c" * 64
    with pytest.raises(FrozenInstanceError):
        item.source_group = "changed"
    before["verifier_hashes"]["verifier.py"] = "d" * 64
    assert item.to_record()["verifier_hashes"]["verifier.py"] == "a" * 64


@pytest.mark.parametrize("metadata", [
    {"source_sensitivity": "public"}, {"source_sensitivity": None},
    {"deadline": "tomorrow"}, {"deadline_utc": "2030-01-01T00:00:00Z"},
    {"declared_deadline_utc": 123}, {"source_group": ""},
    {"allowed_tools": "multiply"}, {"allowed_tools": ["multiply", "multiply"]},
    {"split": "unknown"}, {"evaluator": {}},
])
def test_unsupported_or_malformed_task_metadata_fails_closed(metadata):
    with pytest.raises(ValueError):
        contract(**metadata)


@pytest.mark.parametrize("field,value", [
    ("timeout_s", float("nan")), ("timeout_s", 0), ("max_requests", True),
    ("max_requests", -1), ("max_total_tokens", 1.5), ("max_tokens", 129),
    ("max_wall_s", float("inf")), ("max_cycles", 0), ("max_storage_bytes", -1),
    ("max_requests", 10**1000),
])
def test_invalid_resource_caps_rejected(field, value):
    task, config, context = fixture()
    config[field] = value
    with pytest.raises(ValueError):
        TaskContractV1.from_task(task, config, permitted_routes=["tool"],
                                source_context=context, exact_tool_required=True)


def test_code_timeout_is_stricter_than_declared_timeout_and_static():
    task, config, context = fixture()
    task.update(category="code_mission", evaluator="code_mission_v1",
                input={"manifest": {"limits": {"timeout_s": 7}}})
    context["evaluator"] = "code_mission_v1"
    item = TaskContractV1.from_task(task, config, permitted_routes=["tool"],
                                  source_context=context, exact_tool_required=False)
    assert item.declared_timeout_s == 30 and item.execution_timeout_s == 7
    assert "remaining" not in json.dumps(item.to_record())


@pytest.mark.parametrize("mutation", ["source", "actions", "routes", "permission", "verifier", "split"])
def test_partition_changes_with_source_permission_and_verifier_context(mutation):
    record = contract().to_record()
    changed = copy.deepcopy(record)
    if mutation == "source":
        changed["source_group"] = "other-group"
    elif mutation == "actions":
        changed["actions"] = ["add"]
    elif mutation == "routes":
        changed["permitted_routes"] = ["tool"]
    elif mutation == "permission":
        changed["permission_hash"] = "different"
    elif mutation == "verifier":
        changed["verifier_hashes"]["verifier.py"] = "b" * 64
    else:
        changed["split"] = "holdout"
    def key(value):
        return feedback_partition_key(value, "tool", model_identity=None, runtime_source_hash="runtime-a")
    assert key(record) != key(changed)


def test_model_and_runtime_identity_partition_and_permission_gate():
    record = contract().to_record()
    def key(route="local_direct", digest="model-a", runtime="runtime-a"):
        return feedback_partition_key(record, route, model_identity={"model": "pinned", "digest": digest},
                                      runtime_source_hash=runtime)
    assert key() != key(digest="model-b")
    assert key() != key(runtime="runtime-b")
    assert key("tool") != key("tool", runtime="runtime-b")
    with pytest.raises(ValueError):
        key("local_tool")
    with pytest.raises(ValueError):
        feedback_partition_key(record, "local_direct", model_identity=None, runtime_source_hash="r")


@pytest.mark.parametrize("updates", [
    {"valid": False}, {"passed": False}, {"quality": True}, {"quality": 0},
    {"feedback_eligible": 1}, {"split": "holdout"}, {"split": "validation"},
    {"valid": False, "passed": False, "quality": 0},
    {"charged_cost": {"requests": -1}}, {"charged_cost": {"elapsed_s": float("inf")}},
    {"charged_cost": {"requests": .5}},
    {"charged_cost": {"requests": True}}, {"failure_category": "invented"},
])
def test_invalid_or_sealed_positive_learning_is_refused(updates):
    with pytest.raises(ValueError):
        feedback(**updates)


def test_verified_wrong_answer_is_zero_quality_and_sealed_results_cannot_train():
    wrong = feedback(passed=False, quality=0, failure_category="MODEL")
    assert wrong.feedback_eligible and wrong.to_record()["quality"] == 0
    sealed = feedback(split="holdout", feedback_eligible=False)
    assert sealed.passed and not sealed.feedback_eligible
    invalid = feedback(valid=False, passed=False, quality=0, feedback_eligible=False)
    assert not invalid.feedback_eligible
    source = {"requests": 0, "elapsed_s": 1.0}
    item = feedback(charged_cost=source)
    source["requests"] = 99
    assert item.to_record()["charged_cost"]["requests"] == 0
    assert record_hash(item.to_record()) == record_hash(json.loads(json.dumps(item.to_record())))
