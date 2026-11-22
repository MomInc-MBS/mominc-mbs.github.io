"""Read-only-runtime decision probes. Synthetic development tasks; no dispatch."""
import copy
import json
import sys
from pathlib import Path

import hive.orchestrator as runtime
from hive.learning_policy import Policy
from hive.task_spec import _task


class NoInferenceAdapter:
    def generate(self, *args, **kwargs):
        raise AssertionError("Probe must never dispatch inference")


root = Path(__file__).resolve().parent
rows = []
original_verify = runtime.verify
for name, version, change, requested in [
    ("exact_tool_available", 3, "none", None),
    ("exact_tool_permission_absent", 3, "permission", None),
    ("exact_tool_scope_absent", 3, "scope", None),
    ("exact_tool_scope_absent_explicit_model", 3, "scope", "local_direct"),
    ("missing_verifier", 3, "verifier", None),
    ("model_budget_exhausted_exact_tool_available", 3, "budget", None),
    ("all_routes_budget_or_scope_blocked", 3, "budget_scope", None),
    ("legacy_v1_exact_tool_scope_absent", 1, "scope", None),
    ("legacy_v2_exact_tool_scope_absent", 2, "scope", None),
    ("model_required_classification", 3, "classification", None),
]:
    ex = runtime.Executor(root / "probe-stores" / name,
        dict(runtime.DEFAULT_CONFIG, routes=["tool", "local_direct"],
             max_requests=1, max_total_tokens=128, max_retries=0,
             allow_fixtures=True, adapter=NoInferenceAdapter()))
    task = _task("development", "math", 1, 20261121)
    task["source_group"] = "synthetic-sol-decision-probe"
    if change == "permission":
        task["permissions"] = {"version": 1, "routes": ["local_direct"]}
    if change in ("scope", "budget_scope"):
        task["allowed_tools"] = []
        task["input"]["allowed_tools"] = []
        task["tool_schemas"] = {}
        task["input"]["tool_schemas"] = {}
    if change in ("budget", "budget_scope"):
        ex.store.set("budget", {"requests": 1, "tokens_reserved": 128,
                               "tokens_actual": 0, "wall_s": 0., "cycles": 0})
    if change == "classification":
        task = {"id": "synthetic-sol-classification", "category": "text_classification",
            "split": "development", "prompt": "Classify using frozen development labels.",
            "input": {"items": [{"id": "x", "text": "example"}],
                      "labels": {"a": "A", "b": "B"}},
            "expected": {"labels": {"x": "a"}}, "critical": False,
            "evaluator": "independent_labels_v1", "allowed_tools": [], "tool_schemas": {},
            "permissions": {"version": 1, "routes": ["local_direct"]}}
    if change == "verifier":
        def unavailable(*args):
            raise RuntimeError("synthetic missing verifier")
        runtime.verify = unavailable
    before = copy.deepcopy(ex._budget())
    try:
        decision = ex._decision(task, requested, Policy(version=version))
    finally:
        runtime.verify = original_verify
    after = ex._budget()
    assert before == after, "Decision probe must not reserve resources"
    rows.append({"name": name, "policy_version": version, "requested_route": requested,
                 "decision": decision, "budget_before": before, "budget_after": after})
    ex.close()

by_name = {row["name"]: row for row in rows}
for name in ("exact_tool_permission_absent", "exact_tool_scope_absent",
             "exact_tool_scope_absent_explicit_model"):
    assert by_name[name]["decision"]["selected"] == "local_direct"
assert by_name["exact_tool_available"]["decision"]["selected"] == "tool"
assert by_name["missing_verifier"]["decision"]["selected"] is None
assert by_name["all_routes_budget_or_scope_blocked"]["decision"]["selected"] is None
assert by_name["model_required_classification"]["decision"]["selected"] == "local_direct"
result = {"classification": "synthetic development mechanical decision probe",
          "runtime": runtime.code_version(), "hive_model_calls": 0, "dispatches": 0,
          "cases": rows}
(root / "policy-probe-results.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"case_count": len(rows), "selected_routes": {
    row["name"]: row["decision"]["selected"] for row in rows}, "hive_model_calls": 0}))
