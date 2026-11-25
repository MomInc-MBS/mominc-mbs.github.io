"""Typed, deterministic decision gateway.

One pure entry point, ``decide(request, policy)``, for the six governance
decisions HIVE makes before acting. Same request + same ContextPolicy state
produce a byte-identical ``Decision`` JSON. No randomness, no model calls, no
network or filesystem access beyond what ``ContextPolicy`` already does
(emergency-stop flag). Model/free text in a payload is never interpreted: only
typed fields drive an outcome.

Reuses ``ContextPolicy`` (models, budgets, preflight), ``TaskPacketCompiler``
(relevance threshold / token cap) and ``governor.route_scope_reason`` (P2 exact
tool scope). ``Decision.enforce()`` raises the existing ``DispatchBlocked``.
"""
from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from enum import Enum
from typing import Any, Mapping
from urllib.parse import urlparse

from .context_policy import ContextPolicy, DispatchBlocked, PolicyError
from .governor import P2_EXACT_TOOL_CATEGORIES, route_scope_reason
from .task_packet import PacketItem, TaskPacketCompiler, _count_tokens

SCHEMA_VERSION = "hive-decision-gateway-v1"
# Outcomes that mean "do not proceed"; ``enforce`` raises DispatchBlocked on these.
REFUSALS = frozenset({"BLOCKED", "DENY", "ABSTAIN"})
# ponytail: default evidence threshold is 1 verified item; set routing.min_escalation_evidence to raise it.
DEFAULT_MIN_EVIDENCE = 1
_LOCAL_HOSTS = frozenset({"127.0.0.1", "localhost", "::1"})


class DecisionKind(str, Enum):
    CONTEXT_SELECT = "CONTEXT_SELECT"
    MODEL_ROUTE = "MODEL_ROUTE"
    TOOL_SELECT = "TOOL_SELECT"
    PERMISSION_CHECK = "PERMISSION_CHECK"
    CACHE_REUSE_OR_REBUILD = "CACHE_REUSE_OR_REBUILD"
    ESCALATE_OR_ABSTAIN = "ESCALATE_OR_ABSTAIN"


def _canonical(value: Any) -> str:
    try:
        return json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"request must be canonical JSON (no NaN, no non-JSON types): {exc}") from exc


@dataclass(frozen=True)
class DecisionRequest:
    kind: DecisionKind
    payload: Mapping[str, Any]

    @classmethod
    def from_mapping(cls, request: "DecisionRequest | Mapping[str, Any]") -> "DecisionRequest":
        if isinstance(request, DecisionRequest):
            return request
        if not isinstance(request, Mapping) or "kind" not in request:
            raise ValueError("request must be a mapping with a 'kind'")
        raw = request["kind"]
        try:
            kind = raw if isinstance(raw, DecisionKind) else DecisionKind(raw)
        except ValueError:
            raise ValueError(f"unknown decision kind: {str(raw)[:64]!r}") from None
        return cls(kind, {k: v for k, v in request.items() if k != "kind"})

    def sha256(self) -> str:
        return hashlib.sha256(_canonical({"kind": self.kind.value, "payload": self.payload}).encode()).hexdigest()


@dataclass(frozen=True)
class Decision:
    kind: DecisionKind
    outcome: str
    reasons: tuple[str, ...]
    inputs_sha256: str
    policy_version: int
    evidence: tuple[str, ...] = ()

    def as_dict(self) -> dict[str, Any]:
        return {"schema_version": SCHEMA_VERSION, "kind": self.kind.value, "outcome": self.outcome,
                "reasons": list(self.reasons), "inputs_sha256": self.inputs_sha256,
                "policy_version": self.policy_version, "evidence": list(self.evidence)}

    def to_json(self) -> str:
        return _canonical(self.as_dict())

    def sha256(self) -> str:
        return hashlib.sha256(self.to_json().encode()).hexdigest()

    def enforce(self) -> "Decision":
        if self.outcome in REFUSALS:
            raise DispatchBlocked(f"{self.kind.value} {self.outcome}: " + "; ".join(self.reasons))
        return self


# ---- payload helpers ------------------------------------------------------

def _field(payload: Mapping[str, Any], key: str, types: tuple, what: str) -> Any:
    value = payload.get(key)
    if isinstance(value, bool) or not isinstance(value, types):
        raise ValueError(f"{key} must be {what}")
    return value


def _str_list(payload: Mapping[str, Any], key: str) -> list[str]:
    value = payload.get(key)
    if not isinstance(value, list) or not all(isinstance(x, str) and x for x in value):
        raise ValueError(f"{key} must be a list of non-empty strings")
    return value


def _num(payload: Mapping[str, Any], key: str, default: float | None) -> float | None:
    if key not in payload:
        return default
    value = payload[key]
    if isinstance(value, bool) or not isinstance(value, (int, float)) or value < 0:
        raise ValueError(f"{key} must be a number >= 0")
    return float(value)


def _path_parts(path: Any) -> tuple[str, ...] | None:
    """Lexical normalisation only (no filesystem). None = unusable, fail closed."""
    if not isinstance(path, str) or not path or "\0" in path:
        return None
    s = path.replace("\\", "/")
    if not (s.startswith("/") or re.match(r"^[A-Za-z]:/", s)):
        return None
    parts = [p for p in s.split("/") if p not in ("", ".")]
    if ".." in parts:
        return None
    return tuple(p.casefold() for p in parts)


# ---- the gateway ----------------------------------------------------------

class DecisionGateway:
    def __init__(self, policy: ContextPolicy):
        self.policy = policy

    def decide(self, request: "DecisionRequest | Mapping[str, Any]") -> Decision:
        req = DecisionRequest.from_mapping(request)
        outcome, reasons, evidence = getattr(self, "_" + req.kind.value.lower())(req.payload)
        return Decision(req.kind, outcome, tuple(reasons), req.sha256(),
                        int(self.policy.snapshot()["policy_version"]), tuple(evidence))

    # CONTEXT_SELECT: delegate threshold / cap / fail-closed fit to TaskPacketCompiler.
    def _context_select(self, p):
        task_id = _field(p, "task_id", (str,), "a string")
        user_input = _field(p, "user_input", (str,), "a string")
        raw = p.get("candidates")
        if not isinstance(raw, list):
            raise ValueError("candidates must be a list")
        max_tokens = p.get("max_tokens")
        if max_tokens is not None:
            max_tokens = int(_field(p, "max_tokens", (int,), "a positive integer"))
            if max_tokens <= 0:
                raise ValueError("max_tokens must be a positive integer")
        items, seen, reasons = [], set(), []
        for c in raw:
            if not isinstance(c, dict) or not isinstance(c.get("id"), str) or not isinstance(c.get("content"), str):
                raise ValueError("each candidate needs string id and content")
            rel = c.get("relevance")
            if isinstance(rel, bool) or not isinstance(rel, (int, float)) or not 0 <= rel <= 1:
                raise ValueError("each candidate needs relevance in [0, 1]")
            if c["id"] in seen:
                reasons.append(f"duplicate candidate id {c['id']} ignored")
                continue
            seen.add(c["id"])
            if c.get("verified") is not True:  # fail closed: only verified memory is eligible
                reasons.append(f"candidate {c['id']} excluded: not verified")
                continue
            # Tokens are recomputed here; a caller-supplied count would let a payload dodge the cap.
            items.append(PacketItem(id=c["id"], source="memory", content=c["content"],
                                    tokens=_count_tokens(c["content"]), relevance=float(rel),
                                    verified=True, timestamp=0.0))
        try:
            packet = TaskPacketCompiler(self.policy).compile(
                task_id=task_id, user_input=user_input, relevant_memory=items, max_tokens=max_tokens)
        except RuntimeError as exc:
            return "BLOCKED", reasons + [str(exc)], ()
        picked = sorted((it for it in packet.items if it.source == "memory"),
                        key=lambda it: (-it.relevance, it.id))
        reasons.append(f"selected {len(picked)} of {len(raw)} candidates within {packet.hard_cap_tokens} tokens")
        return "SELECTED", reasons, [it.id for it in picked]

    # MODEL_ROUTE: policy-permitted + within remaining budget, else BLOCKED.
    def _model_route(self, p):
        task_id = _field(p, "task_id", (str,), "a string")
        candidates = _str_list(p, "candidates")
        tokens = int(_field(p, "requested_tokens", (int,), "an integer >= 0"))
        if tokens < 0:
            raise ValueError("requested_tokens must be an integer >= 0")
        depth = int(p.get("nested_depth", 0)) if isinstance(p.get("nested_depth", 0), int) else -1
        if depth < 0:
            raise ValueError("nested_depth must be an integer >= 0")
        explicit_cost = _num(p, "estimated_cost_usd", None)
        has_reason = isinstance(p.get("reason"), str) and bool(p["reason"].strip())
        need_reason = bool(self.policy.routing_cfg.get("require_reason_for_non_local_model", False))
        remaining = self.policy.remaining_budget()
        ok, blocked = [], []
        for name in dict.fromkeys(candidates):
            try:
                spec = self.policy.model(name)
            except PolicyError:
                blocked.append(f"{name}: not in policy")
                continue
            cost = explicit_cost if explicit_cost is not None else spec.cost_usd(tokens, spec.output_reserve_tokens)
            gate = self.policy.preflight(task_id=task_id, model_name=name, nested_depth=depth,
                                         requested_tokens=tokens, estimated_cost_usd=cost)
            if not gate["eligible"]:
                blocked.extend(f"{name}: {r}" for r in gate["reasons"])
            elif need_reason and urlparse(spec.endpoint).hostname not in _LOCAL_HOSTS and not has_reason:
                blocked.append(f"{name}: non-local model requires a reason")
            elif cost > remaining["task_usd_remaining"] or cost > remaining["daily_usd_remaining"]:
                blocked.append(f"{name}: estimated ${cost:.6f} exceeds remaining task/daily budget")
            else:
                ok.append((cost, name))
        if not ok:
            return "BLOCKED", blocked or ["no candidates"], ()
        cost, name = min(ok)
        return name, [f"lowest estimated cost ${cost:.6f} among {len(ok)} eligible"] + blocked, [name]

    # TOOL_SELECT: mirror P2 v4 exact-tool-or-abstain via governor.route_scope_reason.
    def _tool_select(self, p):
        task = p.get("task")
        tools = p.get("tools")
        if not isinstance(task, dict) or not isinstance(task.get("category"), str):
            raise ValueError("task must be a mapping with a category")
        if not isinstance(tools, list) or not all(isinstance(t, dict) and isinstance(t.get("name"), str) for t in tools):
            raise ValueError("tools must be a list of {name, deterministic}")
        allowed = task.get("allowed_tools", [])
        if not isinstance(allowed, list):
            raise ValueError("task.allowed_tools must be a list")
        exact = task["category"] in P2_EXACT_TOOL_CATEGORIES
        eligible = []
        for t in tools:
            name, det = t["name"], t.get("deterministic") is True
            if name not in allowed:
                continue
            if exact:
                # Granting only this tool satisfies the route-scope gate iff it is the required built-in.
                if det and route_scope_reason({**task, "allowed_tools": [name]}, "tool") is None:
                    eligible.append((0, name))
            else:
                eligible.append((0 if det else 1, name))
        if not eligible:
            kind = "exact deterministic" if exact else "granted"
            return "ABSTAIN", [f"no eligible {kind} tool for category {task['category']}"], ()
        _, name = min(eligible)
        return name, [("exact task: required deterministic tool" if exact else "preferred deterministic tool") + f" {name}"], [name]

    # PERMISSION_CHECK: unknown/malformed tool or path => DENY.
    def _permission_check(self, p):
        if self.policy.is_emergency_stopped():
            return "DENY", ["emergency stop is active"], ()
        tool, allowed = p.get("tool"), p.get("allowed_tools")
        if not isinstance(tool, str) or not isinstance(allowed, list) or tool not in allowed:
            return "DENY", ["tool unknown or not granted"], ()
        path = _path_parts(p.get("path"))
        if path is None:
            return "DENY", ["path missing, relative, or contains traversal"], ()
        roots = p.get("allowed_roots")
        for root in roots if isinstance(roots, list) else []:
            parts = _path_parts(root)
            if parts and path[:len(parts)] == parts:
                return "ALLOW", [f"tool {tool} granted; path under allowed root"], [tool]
        return "DENY", ["path outside allowed roots"], ()

    # CACHE_REUSE_OR_REBUILD: reuse only on exact source digest + policy_version match.
    def _cache_reuse_or_rebuild(self, p):
        digest, cached = p.get("source_sha256"), p.get("cached")
        if not isinstance(digest, str) or not digest:
            raise ValueError("source_sha256 must be a non-empty string")
        if not isinstance(cached, dict):
            return "REBUILD", ["no cached entry"], ()
        if cached.get("source_sha256") != digest:
            return "REBUILD", ["source digest changed"], ()
        if cached.get("policy_version") != self.policy.snapshot()["policy_version"] or isinstance(cached.get("policy_version"), bool):
            return "REBUILD", ["policy_version mismatch"], ()
        return "REUSE", ["source digest and policy_version match"], [digest]

    # ESCALATE_OR_ABSTAIN: escalate only on enough verified evidence (+ reason if policy requires).
    def _escalate_or_abstain(self, p):
        threshold = self.policy.routing_cfg.get("min_escalation_evidence", DEFAULT_MIN_EVIDENCE)
        if isinstance(threshold, bool) or not isinstance(threshold, int) or threshold < 1:
            return "ABSTAIN", ["policy evidence threshold invalid; failing closed"], ()
        raw = p.get("evidence")
        refs = sorted({e["ref"] for e in raw if isinstance(e, dict) and e.get("verified") is True
                       and isinstance(e.get("ref"), str) and e["ref"]} if isinstance(raw, list) else ())
        if len(refs) < threshold:
            return "ABSTAIN", [f"{len(refs)} verified evidence < required {threshold}"], refs
        if (self.policy.routing_cfg.get("require_reason_for_frontier_escalation", True)
                and not (isinstance(p.get("reason"), str) and p["reason"].strip())):
            return "ABSTAIN", ["escalation requires a reason"], refs
        return "ESCALATE", [f"{len(refs)} verified evidence >= required {threshold}"], refs


def decide(request: "DecisionRequest | Mapping[str, Any]", policy: ContextPolicy) -> Decision:
    return DecisionGateway(policy).decide(request)
