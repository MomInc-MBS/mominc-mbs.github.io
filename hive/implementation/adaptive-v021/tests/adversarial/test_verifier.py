"""Adversarial checks for independent verifier schema and failure feedback."""
import json
from hive.task_spec import load_tasks
from hive.verifier import verify


def test_wrong_claim_success_or_extra_answer_fields_never_pass():
    task=load_tasks("development",count_per_category=1)[0]
    good=json.loads(json.dumps(task["expected"]))
    good["success"]=True
    checked=verify(task,{"output":json.dumps(good)})
    assert checked["valid"] and not checked["passed"] and checked["quality"]==0


def test_invalid_json_model_attempt_is_usable_but_runtime_failure_is_not():
    task=load_tasks("development",count_per_category=1)[0]
    malformed=verify(task,{"output":"not-json","failure_category":"MODEL"})
    assert malformed["valid"] and malformed["quality"]==0
    env=verify(task,{"output":"{}","error":"timeout","failure_category":"ENVIRONMENT"})
    assert not env["valid"]


def test_hallucination_requires_all_fields_and_penalizes_unsupported_claims():
    task=next(t for t in load_tasks("development",count_per_category=4) if t["category"]=="hallucination" and t["expected"]["supported"] is False)
    incomplete=verify(task,{"output":"{\"supported\":false}"})
    assert incomplete["valid"] and not incomplete["passed"]
    fabricated=verify(task,{"output":"{\"answer\":\"fabricated\",\"supported\":true,\"ambiguous\":false}"})
    assert fabricated["unsupported"]==1 and not fabricated["passed"]


def test_malformed_task_evidence_is_invalid():
    task=load_tasks("development",count_per_category=1)[0]
    del task["expected"]
    checked=verify(task,{"output":"{}"})
    assert not checked["valid"] and checked["quality"]==0


def test_non_model_failures_are_not_policy_feedback():
    task=load_tasks("development",count_per_category=1)[0]
    for category in ("ENVIRONMENT","IMPLEMENTATION","EVALUATION","PERMISSIONS"):
        checked=verify(task,{"output":json.dumps(task["expected"]),"failure_category":category})
        assert not checked["valid"] and checked["quality"]==0
