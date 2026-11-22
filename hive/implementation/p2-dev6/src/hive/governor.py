"""Eligibility-first route governance for the bounded executor."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

from .verifier import _task_ok
from .contracts import PolicyDecisionV1, record_hash


POLICY_VERSION = "hive-governor-p0-v1"
TASK_PERMISSION_VERSION = 1
ROUTES = ("tool", "local_direct", "local_tool")
BASELINE_SCORE_VERSION = "fixed-prior-cost-v1"
P2_EXACT_TOOL_CATEGORIES = frozenset({"math", "structured_data", "tool_routing", "coordination",
                                     "hallucination", "adaptation", "code_repair", "video_captions"})


def p2_source_context(task):
    """Bind task input and evaluator bytes; a declared group is not a freshness attestation."""
    package = Path(__file__).parent
    names = ["verifier.py", "task_spec.py"]
    if task["category"] in ("structured_data", "text_classification"):
        names.append("data_tasks.py")
    elif task["category"] == "code_mission":
        names.append("code_verifier.py")
    return {"declared_source_group": task.get("source_group"),
            "input_sha256": hashlib.sha256(json.dumps(task["input"], sort_keys=True,
                separators=(",", ":"), allow_nan=False).encode()).hexdigest(),
            "evaluator": task["evaluator"],
            "verifier_sha256": {name: hashlib.sha256((package / name).read_bytes()).hexdigest()
                                for name in names}}


def validate_task(task):
    """Use the evaluator's contract validator as the single task schema authority."""
    if not isinstance(task, dict) or not _task_ok(task):
        return "unsupported or malformed task/evaluator contract"
    permissions = task.get("permissions")
    if permissions is not None:
        if (not isinstance(permissions, dict) or set(permissions) != {"version", "routes"}
                or type(permissions.get("version")) is not int
                or permissions["version"] != TASK_PERMISSION_VERSION
                or not isinstance(permissions.get("routes"), list)
                or any(type(route) is not str or route not in ROUTES for route in permissions["routes"])
                or len(set(permissions["routes"])) != len(permissions["routes"])):
            return "invalid task permissions contract; expected version 1 and a unique supported routes list"
    return None


def task_routes(task, allow_fixtures=False):
    permissions = task.get("permissions")
    if permissions is not None:
        return set(permissions["routes"])
    return set(ROUTES) | ({"fixture_bad"} if allow_fixtures else set())


def route_scope_reason(task, route, allow_fixtures=False):
    if route == "fixture_bad":
        return None if allow_fixtures else "fixture route is disabled"
    if route not in ROUTES:
        return "unsupported route"
    if task.get('category') == 'code_mission' and route != 'tool':
        return 'isolated code mission accepts only its scoped deterministic adapter'
    if task.get("category") == "text_classification" and route != "local_direct":
        return "task has no deterministic built-in tool for this route"
    if route == "local_tool" and not task.get("allowed_tools"):
        return "task grants no tools for model-assisted execution"
    tools_by_category = {
        "math": "multiply", "code_repair": "run_patch_fixtures", "tool_routing": "add",
        "coordination": "partition_tasks", "hallucination": "lookup_record",
        "adaptation": "infer_constant", "video_captions": "normalize_srt",
        "structured_data": "summarize_inventory",
        "code_mission": "isolated_code",
    }
    required_tool = tools_by_category.get(task.get("category"))
    if route in ("tool", "local_tool") and required_tool and required_tool not in task.get("allowed_tools", []):
        return f"task scope does not grant required built-in tool {required_tool}"
    if route == "local_tool" and not required_tool:
        return "task has no supported built-in tool for model-assisted execution"
    return None


def prior_summary(policy, category, route, partition_key=None):
    """Expose observations only; an unseen route has no estimated score."""
    if getattr(policy, "version", None) == 4:
        bucket = (getattr(policy, "partitions", {}).get(partition_key, {}).get(category, {}).get(route)
                  if getattr(policy, "memory_enabled", False) and partition_key else None)
    else:
        bucket = getattr(policy, "counts", {}).get(category, {}).get(route)
    if not bucket or not bucket.get("n"):
        return {"observations": 0, "quality_rate": None, "mean_utility": None}
    n = bucket["n"]
    return {"observations": n, "quality_rate": bucket["successes"] / n,
            "mean_utility": bucket["utility_sum"] / n}


def decide(task, *, candidates, requested_route, policy, policy_hash, source_hash,
           config_hash, task_hash, route_checks, allow_fixtures=False, max_tokens=128,
           task_contract=None, partition_keys=None):
    """Filter every route through hard gates before applying fixed ordering."""
    error = validate_task(task)
    if error:
        return {"eligible": [], "selected": None, "error": error,
                "receipt": {"version": POLICY_VERSION, "task_hash": task_hash,
                            "config_hash": config_hash, "source_hash": source_hash,
                            "policy_hash": policy_hash, "requested_route": requested_route,
                            "baseline_score_version": BASELINE_SCORE_VERSION,
                            "error": error, "alternatives": []}}
    if getattr(policy, "version", None) == 4 and not isinstance(task_contract, dict):
        error = "P2 v4 task contract unavailable"
        return {"eligible": [], "selected": None, "error": error,
                "receipt": {"version": POLICY_VERSION, "policy_version": 4,
                    "task_hash": task_hash, "config_hash": config_hash, "source_hash": source_hash,
                    "policy_hash": policy_hash, "requested_route": requested_route,
                    "eligible_routes": [], "selected_route": None, "route_source": "abstention",
                    "route_attribution": {"source": "abstention", "category": task["category"],
                        "eligible_routes": [], "selected_route": None, "task_hash": task_hash,
                        "source_hash": source_hash, "config_hash": config_hash, "policy_hash": policy_hash},
                    "alternatives": [], "error": error}}
    permissions = task_routes(task, allow_fixtures)
    alternatives = []
    for route in dict.fromkeys(candidates):
        reasons = []
        if (getattr(policy, "version", None) == 4
                and task["category"] in P2_EXACT_TOOL_CATEGORIES
                and route != "tool"):
            reasons.append("P2 v4 exact categories require the deterministic tool; model routes are ineligible")
        if route not in permissions:
            reasons.append("excluded by task permissions" if task.get("permissions") is not None else "route not in supported task route set")
        scope = route_scope_reason(task, route, allow_fixtures)
        if scope:
            reasons.append(scope)
        check = route_checks.get(route)
        if check:
            reasons.append(check)
        reserved_tokens = max_tokens if route.startswith("local_") else 0
        cost_penalty = 0.25 * reserved_tokens / 128
        baseline_score = 0.5 - cost_penalty
        alternatives.append({"route": route, "eligible": not reasons, "reasons": reasons,
                             "prior": prior_summary(policy, task["category"], route,
                                                    (partition_keys or {}).get(route)),
                             "baseline_score": {"version": BASELINE_SCORE_VERSION, "score": baseline_score,
                                                "success_prior": 0.5, "reserved_tokens": reserved_tokens,
                                                "cost_penalty": cost_penalty, "latency_prior": None,
                                                "latency_status": "unmeasured"}})
    if requested_route is not None:
        selected = requested_route if any(x["route"] == requested_route and x["eligible"] for x in alternatives) else None
        if not any(x["route"] == requested_route for x in alternatives):
            alternatives.append({"route": requested_route, "eligible": False,
                                 "reasons": ["route was not a governance candidate"],
                                 "prior": prior_summary(policy, task["category"], requested_route,
                                                        (partition_keys or {}).get(requested_route))})
    else:
        eligible_rows = [x for x in alternatives if x["eligible"]]
        eligible = [x["route"] for x in eligible_rows]
        if getattr(policy, "mode", None) == "fixed":
            eligible = [x["route"] for x in sorted(eligible_rows, key=lambda row: row["baseline_score"]["score"], reverse=True)]
        selected = (policy.choose(task["category"], eligible, partition_keys=partition_keys)
                    if getattr(policy, "version", None) == 4 else policy.choose(task["category"], eligible)) if eligible else None
    # Attribute the actual decision after hard eligibility gates. The source
    # hash already binds the executor build; the receipt also carries category,
    # policy identity and the eligible routes that constrained the choice.
    if requested_route is not None:
        route_source = "explicit_request"
    elif (getattr(policy, "version", None) in (3, 4) and selected == "tool"
          and task["category"] in P2_EXACT_TOOL_CATEGORIES):
        route_source = "p2_exact_tool_preference"
    elif selected is not None:
        route_source = "policy_selection"
    else:
        route_source = "abstention"
    receipt: PolicyDecisionV1 = {"version": POLICY_VERSION, "baseline_score_version": BASELINE_SCORE_VERSION, "task_hash": task_hash,
               "config_hash": config_hash, "source_hash": source_hash,
               "policy_hash": policy_hash, "requested_route": requested_route,
               "eligible_routes": [x["route"] for x in alternatives if x["eligible"]],
               "selected_route": selected, "alternatives": alternatives}
    if getattr(policy, "version", None) in (3, 4):
        receipt.update({"policy_version": policy.version, "route_source": route_source,
                        "route_attribution": {"source": route_source, "category": task["category"],
                                              "eligible_routes": [x["route"] for x in alternatives if x["eligible"]],
                                              "selected_route": selected, "task_hash": task_hash,
                                              "source_hash": source_hash, "config_hash": config_hash,
                                              "policy_hash": policy_hash}})
        try:
            receipt["route_attribution"]["source_context"] = p2_source_context(task)
        except (OSError, ValueError, TypeError):
            receipt["route_attribution"]["source_context"] = None
    if getattr(policy, "version", None) == 4:
        receipt["memory_enabled"] = policy.memory_enabled
        receipt["task_contract"] = task_contract
        receipt["task_contract_hash"] = record_hash(task_contract)
        receipt["partition_keys"] = dict(partition_keys or {})
        receipt["confidence_provenance"] = {route: policy.confidence_provenance(
            task["category"], route, (partition_keys or {}).get(route)) for route in receipt["eligible_routes"]}
        receipt["estimated_resources"] = {row["route"]: {
            "reserved_requests": int(row["route"].startswith("local_")),
            "reserved_tokens": row.get("baseline_score", {}).get("reserved_tokens", 0),
            "reserved_cycles": 1} for row in alternatives if row.get("eligible")}
    if requested_route is not None and selected is None:
        receipt["error"] = "explicit route is not eligible"
    elif requested_route is None and selected is None:
        receipt["error"] = "no eligible route"
    return {"eligible": receipt["eligible_routes"], "selected": selected,
            "error": receipt.get("error"), "receipt": receipt}
