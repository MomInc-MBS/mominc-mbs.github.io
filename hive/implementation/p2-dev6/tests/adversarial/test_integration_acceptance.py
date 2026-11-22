"""Independent black-box checks for the integrated data verifier.

These fixtures are synthetic; no model calls or held-out cases are involved.
"""
import copy
import json

import pytest

from hive.verifier import verify


@pytest.fixture
def inventory():
    return {
        "id": "inventory", "category": "structured_data", "split": "development",
        "prompt": "Summarize the rows", "critical": True,
        "input": {"rows": [{"id": "a", "group": "core", "bytes": 1},
                           {"id": "b", "group": "core", "bytes": 2}]},
        "expected": {"groups": {"core": {"count": 2, "bytes": 3}}},
        "evaluator": "grouped_inventory_v1", "allowed_tools": ["summarize_inventory"],
        "tool_schemas": {"summarize_inventory": {"rows": "supplied rows"}},
    }


@pytest.fixture
def classification():
    return {
        "id": "classify", "category": "text_classification", "split": "development",
        "prompt": "Classify the items", "critical": True,
        "input": {"items": [{"id": "a", "text": "Keep a receipt"}],
                  "labels": {"evidence": "Record a receipt", "recovery": "Restart"}},
        "expected": {"labels": {"a": "evidence"}},
        "evaluator": "independent_labels_v1", "allowed_tools": [], "tool_schemas": {},
    }


def verdict(task, output):
    return verify(task, {"output": json.dumps(output), "tokens": 0, "latency_s": 0})


def test_wrong_classification_and_extra_claims_are_rejected(classification):
    assert verdict(classification, {"labels": {"a": "evidence"}})["passed"]
    assert not verdict(classification, {"labels": {"a": "recovery"}})["passed"]
    assert not verdict(classification, {"labels": {"a": "evidence"}, "verified": True})["passed"]


def test_tampered_source_size_cannot_match_stale_output(inventory):
    output = copy.deepcopy(inventory["expected"])
    assert verdict(inventory, output)["passed"]
    inventory["input"]["rows"][0]["bytes"] = 2
    assert not verdict(inventory, output)["passed"]
    # Updating the answer alone cannot hide an inconsistent frozen expected value.
    assert not verdict(inventory, {"groups": {"core": {"count": 2, "bytes": 4}}})["passed"]


@pytest.mark.parametrize("field", ["count", "bytes"])
def test_boolean_inventory_values_are_not_integers(inventory, field):
    output = copy.deepcopy(inventory["expected"])
    output["groups"]["core"][field] = True
    assert not verdict(inventory, output)["passed"]


def test_boolean_source_bytes_and_unknown_evaluator_fail_closed(inventory):
    output = copy.deepcopy(inventory["expected"])
    inventory["input"]["rows"][0]["bytes"] = True
    assert not verdict(inventory, output)["valid"]
    inventory["input"]["rows"][0]["bytes"] = 1
    inventory["evaluator"] = "unrecognized_v1"
    assert not verdict(inventory, output)["valid"]


def test_inventory_extra_claim_is_rejected(inventory):
    output = copy.deepcopy(inventory["expected"])
    output["approved"] = True
    assert not verdict(inventory, output)["passed"]
