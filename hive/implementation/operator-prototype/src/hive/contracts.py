"""Typed audit records for opt-in P2 revisions; no execution authority."""
from __future__ import annotations

from dataclasses import dataclass, field
import hashlib
import json
import math
from types import MappingProxyType
from typing import Any, Mapping, TypedDict


def record_hash(record: Mapping[str, Any]) -> str:
    """Hash a JSON record canonically; reject NaN and non-JSON objects."""
    encoded = json.dumps(record, sort_keys=True, separators=(",", ":"), allow_nan=False)
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest()


def _text(value: Any, name: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{name} must be a nonempty string")
    return value


def _number(value: Any, name: str, *, minimum=0, integer=False):
    if (type(value) not in ((int,) if integer else (int, float))
            or value > 2**63 - 1 or not math.isfinite(value) or value < minimum):
        raise ValueError(f"{name} must be finite and at least {minimum}")
    return value


def _strings(values: Any, name: str) -> tuple[str, ...]:
    if not isinstance(values, (list, tuple, set, frozenset)):
        raise ValueError(f"{name} must be a collection of strings")
    items = tuple(_text(value, name) for value in values)
    if len(set(items)) != len(items):
        raise ValueError(f"{name} must contain unique values")
    return tuple(sorted(items))


_OUTCOMES = {
    "math_exact": "Produce the independently verified exact arithmetic result.",
    "finite_patch_fixtures": "Produce a finite patch passing independent fixtures.",
    "tool_route_exact": "Produce the independently verified tool operation result.",
    "coordination_partition": "Partition the supplied task set exactly once.",
    "unsupported_claim": "Return only independently supported claims or abstain.",
    "adaptation_rule": "Produce the independently verified constant rule.",
    "video_captions_v1": "Produce independently verified normalized captions.",
    "video_clips_v1": "Produce a structurally verified clip selection requiring separate editorial acceptance.",
    "grouped_inventory_v1": "Produce independently verified grouped inventory totals.",
    "independent_labels_v1": "Produce independently verified classification labels.",
    "code_mission_v1": "Produce a scoped code patch passing the pinned independent verifier.",
}
_ROUTES = frozenset({"tool", "local_direct", "local_tool", "fixture_bad"})
_INTEGER_CAPS = ("max_requests", "max_total_tokens", "max_tokens", "max_cycles", "max_storage_bytes")


@dataclass(frozen=True)
class TaskContractV1:
    task_id: str
    task_hash: str
    outcome: str
    family: str
    tags: tuple[str, ...]
    split: str
    actions: tuple[str, ...]
    permitted_routes: tuple[str, ...]
    permission_hash: str
    source_group: str
    source_attribution: str
    source_sensitivity: str
    label_sensitivity: str
    verifier_id: str
    verifier_hashes: Mapping[str, str]
    exact_tool_required: bool
    declared_timeout_s: float
    execution_timeout_s: float
    budget_limits: Mapping[str, int | float]
    declared_deadline_utc: None = None
    schema_version: int = field(default=1, init=False)

    def __post_init__(self):
        # Copy before freezing: caller-owned containers cannot mutate the receipt.
        object.__setattr__(self, "verifier_hashes", MappingProxyType(dict(self.verifier_hashes)))
        object.__setattr__(self, "budget_limits", MappingProxyType(dict(self.budget_limits)))

    @classmethod
    def from_task(cls, task, config, *, permitted_routes, source_context, exact_tool_required):
        if not isinstance(task, dict) or not isinstance(config, dict) or not isinstance(source_context, dict):
            raise ValueError("task, config and source_context must be records")
        task_id = _text(task.get("id"), "task id")
        family = _text(task.get("category"), "category")
        evaluator = task.get("evaluator")
        if not isinstance(evaluator, str) or evaluator not in _OUTCOMES or source_context.get("evaluator") != evaluator:
            raise ValueError("unsupported or mismatched evaluator")
        split = task.get("split")
        if split not in ("development", "validation", "holdout"):
            raise ValueError("unsupported task split")
        if type(exact_tool_required) is not bool:
            raise ValueError("exact_tool_required must be boolean")
        if task.get("source_sensitivity", "unclassified") != "unclassified":
            raise ValueError("source_sensitivity declaration is not supported")
        if any(task.get(key) is not None for key in ("deadline", "deadline_utc", "declared_deadline_utc")):
            raise ValueError("deadline declarations are not supported")
        actions = _strings(task.get("allowed_tools"), "allowed tools")
        routes = _strings(permitted_routes, "permitted routes")
        if any(route not in _ROUTES for route in routes):
            raise ValueError("unsupported permitted route")
        group = task.get("source_group")
        if group is not None:
            group = _text(group, "source group")
        if source_context.get("declared_source_group") != group:
            raise ValueError("source context does not match declared source group")
        hashes = source_context.get("verifier_sha256")
        if (not isinstance(hashes, dict) or not hashes
                or any(not isinstance(name, str) or not name or not isinstance(value, str)
                       or len(value) != 64 or any(c not in "0123456789abcdef" for c in value)
                       for name, value in hashes.items())):
            raise ValueError("verifier hashes must be nonempty SHA-256 records")
        limits = {}
        for key in _INTEGER_CAPS:
            minimum = 1 if key in ("max_cycles", "max_storage_bytes") else 0
            limits[key] = _number(config.get(key), key, minimum=minimum, integer=True)
        if limits["max_tokens"] > 128:
            raise ValueError("max_tokens exceeds the supported per-request cap")
        limits["max_wall_s"] = _number(config.get("max_wall_s"), "max_wall_s", minimum=0.000001)
        timeout = _number(config.get("timeout_s"), "timeout_s", minimum=0.000001)
        effective_timeout = timeout
        if family == "code_mission":
            try:
                code_timeout = task["input"]["manifest"]["limits"]["timeout_s"]
            except (KeyError, TypeError) as exc:
                raise ValueError("code task needs a pinned execution timeout") from exc
            code_timeout = _number(code_timeout, "code timeout_s", minimum=1, integer=True)
            if code_timeout > 900:
                raise ValueError("code timeout exceeds the supported cap")
            effective_timeout = min(timeout, code_timeout)
        return cls(task_id=task_id, task_hash=record_hash(task), outcome=_OUTCOMES[evaluator],
            family=family, tags=(family,), split=split, actions=actions,
            permitted_routes=routes, permission_hash=record_hash({"routes": list(routes), "tools": list(actions)}),
            source_group=group if group is not None else "task:" + task_id,
            source_attribution="declared" if group is not None else "task_scoped",
            source_sensitivity="unclassified",
            label_sensitivity="development_only" if split == "development" else "sealed",
            verifier_id=evaluator, verifier_hashes=hashes, exact_tool_required=exact_tool_required,
            declared_timeout_s=timeout, execution_timeout_s=effective_timeout, budget_limits=limits)

    def to_record(self) -> dict[str, Any]:
        return {name: (dict(value) if isinstance(value, Mapping) else list(value) if isinstance(value, tuple) else value)
                for name in self.__dataclass_fields__ for value in (getattr(self, name),)}


def feedback_partition_key(contract_record, route, *, model_identity, runtime_source_hash):
    """Isolate route experience by source, permission, verifier and executable identity."""
    if not isinstance(contract_record, dict) or contract_record.get("schema_version") != 1:
        raise ValueError("TaskContractV1 record required")
    _text(route, "route")
    if route not in contract_record.get("permitted_routes", []):
        raise ValueError("route is outside the task contract")
    _text(runtime_source_hash, "runtime source hash")
    if route.startswith("local_"):
        if not isinstance(model_identity, dict):
            raise ValueError("model route needs pinned identity")
        _text(model_identity.get("model"), "model identity")
        _text(model_identity.get("digest"), "model digest")
        identity = dict(model_identity)
    else:
        identity = {"tool_runtime_source_hash": runtime_source_hash}
    keys = ("split", "source_group", "source_attribution", "actions", "permitted_routes",
            "permission_hash", "verifier_id", "verifier_hashes", "source_sensitivity", "label_sensitivity")
    if any(key not in contract_record for key in keys):
        raise ValueError("incomplete task contract")
    return record_hash({**{key: contract_record[key] for key in keys}, "route": route,
                        "identity": identity, "runtime_source_hash": runtime_source_hash})


@dataclass(frozen=True)
class OutcomeFeedbackV1:
    task_contract_hash: str
    job_id: str
    evidence_ref: str
    decision_ref: str
    partition_key: str
    route: str
    split: str
    valid: bool
    passed: bool
    quality: int
    feedback_eligible: bool
    charged_cost: Mapping[str, int | float]
    failure_category: str | None = None
    schema_version: int = field(default=1, init=False)

    def __post_init__(self):
        for name in ("task_contract_hash", "job_id", "evidence_ref", "decision_ref", "partition_key", "route"):
            _text(getattr(self, name), name)
        if self.split not in ("development", "validation", "holdout"):
            raise ValueError("unsupported feedback split")
        if any(type(value) is not bool for value in (self.valid, self.passed, self.feedback_eligible)):
            raise ValueError("verdict and eligibility fields must be boolean")
        if type(self.quality) is not int or self.quality not in (0, 1) or self.quality != int(self.passed):
            raise ValueError("quality must equal independently passed verdict")
        if self.passed and not self.valid:
            raise ValueError("invalid verification cannot pass")
        if self.feedback_eligible and (self.split != "development" or not self.valid):
            raise ValueError("only valid development feedback may train")
        if not isinstance(self.charged_cost, Mapping) or not self.charged_cost:
            raise ValueError("charged_cost must be a nonempty numeric record")
        count_fields = {"requests", "model_calls", "cycles", "tokens", "tokens_reserved", "tokens_actual", "storage_bytes"}
        costs = {_text(key, "cost name"): _number(value, key, integer=key in count_fields)
                 for key, value in self.charged_cost.items()}
        if self.failure_category is not None:
            if self.failure_category not in {"ENVIRONMENT", "IMPLEMENTATION", "MATHEMATICAL", "MODEL", "EVALUATION", "EXPERIMENTAL", "PERMISSIONS", "GOVERNANCE", "SANDBOX", "STOP"}:
                raise ValueError("unknown failure taxonomy")
        object.__setattr__(self, "charged_cost", MappingProxyType(costs))

    def to_record(self) -> dict[str, Any]:
        return {name: (dict(value) if isinstance(value, Mapping) else value)
                for name in self.__dataclass_fields__ for value in (getattr(self, name),)}


class PolicyDecisionV1(TypedDict, total=False):
    version: str
    policy_version: int
    task_hash: str
    source_hash: str
    config_hash: str
    policy_hash: str
    requested_route: str | None
    eligible_routes: list[str]
    selected_route: str | None
    alternatives: list[dict[str, Any]]
    route_source: str
    route_attribution: dict[str, Any]
    model_identity: dict[str, Any]
    task_contract: dict[str, Any]
    task_contract_hash: str
    confidence_provenance: dict[str, Any]
    memory_enabled: bool
    candidate_memory_enabled: bool
    feedback_eligible_if_valid: bool
    error: str
