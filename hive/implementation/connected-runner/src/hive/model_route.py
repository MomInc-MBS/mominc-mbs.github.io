"""MODEL_ROUTE at dispatch, SHADOW mode only (directive v0.4.x 2C).

``DispatchGate.begin`` calls ``shadow_route`` once per real dispatch. It asks the existing DecisionGateway which
model it *would* route to and appends a hash-chained record (proposed vs executed model, evidence, reason codes) to
``model-route-log.jsonl``. It never changes the executed model and never blocks a dispatch: any failure is logged
and swallowed. Order, stopping a candidate at its first failure:

  1 role deny         (already enforced by the gate before this runs; a block is logged as ROLE_DENIED)
  2 allowlist/digest  model in policy, marked available, pinned digest, verifier-measured quality >= threshold
  3 context preflight DecisionGateway MODEL_ROUTE (ContextPolicy.preflight + remaining budget)
  4 finite approval   operator file model-route-approval.json, only when the proposal differs from the request
  5 usage accounting  the executed request's reservation/usage record in the UsageLedger (unchanged)

Unmeasured quality is ineligible, never "cheap enough". ``mode`` canary/active is a recognised but separate,
reviewed toggle: this build never executes a switch in any mode (``switch_executed`` is always false).
Config: ``routing.model_route`` in the policy: mode (default "shadow"), candidates, pinned_digests,
quality {model: {measured, pass_rate, samples, evidence}}, min_quality, min_samples.
"""
from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any

from .decision_gateway import DecisionGateway
from .usage_ledger import UsageLedger

LOG_NAME = "model-route-log.jsonl"
APPROVAL_NAME = "model-route-approval.json"
SCHEMA = "hive-model-route-shadow-v1"
MODES = ("shadow", "canary", "active")
ORDER = ("role", "allowlist_digest", "preflight", "approval", "accounting")
_SHA = re.compile(r"[0-9a-f]{64}")


def _quality_code(entry: Any, min_quality: float, min_samples: int) -> str | None:
    if not isinstance(entry, dict) or entry.get("measured") is not True or not entry.get("evidence"):
        return "QUALITY_UNMEASURED"
    rate, n = entry.get("pass_rate"), entry.get("samples")
    if isinstance(rate, bool) or not isinstance(rate, (int, float)) or type(n) is not int:
        return "QUALITY_UNMEASURED"
    return None if rate >= min_quality and n >= min_samples else "QUALITY_BELOW_THRESHOLD"


def _approval(root: Path, pins: dict, name: str, log: UsageLedger) -> str | None:
    """None = approved for switching to ``name``; else a reason code. Finite: bounded switch count."""
    try:
        raw = json.loads((root / APPROVAL_NAME).read_text(encoding="utf-8-sig"))
    except FileNotFoundError:
        return "NO_APPROVAL"
    except (OSError, ValueError):
        return "APPROVAL_INVALID"
    if not isinstance(raw, dict):
        return "APPROVAL_INVALID"
    limit, models = raw.get("max_switches"), raw.get("models")
    if (raw.get("schema_version") != 1 or raw.get("approved") is not True or not str(raw.get("approved_by", "")).strip()
            or type(limit) is not int or not 1 <= limit <= 1000 or not isinstance(models, dict)):
        return "APPROVAL_INVALID"
    if models.get(name) is None or models.get(name) != pins.get(name):
        return "APPROVAL_DIGEST_MISMATCH"
    used = sum(1 for r in log._iter_all() if r.get("switch_executed") is True)
    return "APPROVAL_EXHAUSTED" if used >= limit else None


def shadow_route(*, policy, store_root, run_id, task_id, requested, prompt, est_in, reservation_id=None,
                 blocked=None) -> dict[str, Any]:
    """Log what MODEL_ROUTE would do. Returns the record; never raises, never alters the executed route."""
    root = Path(store_root)
    key = hashlib.sha256("\x1f".join([run_id, task_id, str(requested), hashlib.sha256(prompt.encode()).hexdigest()]).encode()).hexdigest()
    rec: dict[str, Any] = {"schema": SCHEMA, "request_key": key, "run_id": run_id, "task_id": task_id,
                           "mode": "shadow", "order": [], "requested_model": requested, "proposed_model": None,
                           "executed_model": None if blocked else requested, "candidates": {}, "evidence": [],
                           "reason_codes": [], "decision": None, "approval": "not_required", "replay": False,
                           "switch_allowed": False, "switch_executed": False, "reservation_id": reservation_id}
    log = UsageLedger(root / LOG_NAME, {})
    try:
        cfg = policy.routing_cfg.get("model_route") or {}
        mode = cfg.get("mode", "shadow")
        rec["mode"] = mode if mode in MODES else "shadow"
        if mode not in MODES:
            rec["reason_codes"].append("BAD_MODE")
        if rec["mode"] != "shadow":
            rec["reason_codes"].append("SWITCH_TOGGLE_NOT_EXECUTED")  # recognised, but no build executes a switch
        if blocked is not None:  # the executed route was refused before any request: nothing to route
            denied = "may not dispatch" in blocked  # "role check unavailable" is a config failure, not a denial
            rec["order"].append("role" if denied else "preflight")
            rec["reason_codes"].append("ROLE_DENIED" if denied else "DISPATCH_BLOCKED")
            rec["evidence"].append(blocked[:300])
        else:
            _route(policy, cfg, root, rec, task_id, requested, est_in, log)
    except Exception as exc:  # gateway or config failure: executed route is unaffected
        rec["proposed_model"] = None
        rec["reason_codes"].append("GATEWAY_ERROR")
        rec["evidence"].append(f"{type(exc).__name__}: {exc}"[:300])
    rec["reason_codes"] = list(dict.fromkeys(rec["reason_codes"]))
    try:
        log.append(dict(rec))
    except Exception as exc:  # evidence could not be written; still never block the dispatch
        rec["log_error"] = f"{type(exc).__name__}: {exc}"[:200]
    return rec


def _route(policy, cfg, root, rec, task_id, requested, est_in, log):
    prior = any(r.get("request_key") == rec["request_key"] for r in log._iter_all())
    rec["replay"] = prior
    if prior:
        rec["reason_codes"].append("REPLAY")
    rec["order"] += ["role"]  # the gate has already passed this request's role check
    pins = cfg.get("pinned_digests") or {}
    quality = cfg.get("quality") or {}
    min_q = float(cfg.get("min_quality", 0.8))
    min_n = int(cfg.get("min_samples", 5))
    names = list(dict.fromkeys([requested, *(cfg.get("candidates") or [])]))
    rec["order"].append("allowlist_digest")
    eligible = []
    for name in names:
        codes = []
        spec = policy.models.get(name)
        if spec is None:
            codes.append("UNKNOWN_MODEL")
        else:
            if not spec.default_available:
                codes.append("MODEL_UNAVAILABLE")
            if not _SHA.fullmatch(str(pins.get(name, ""))):
                codes.append("NO_PINNED_DIGEST")
            q = _quality_code(quality.get(name), min_q, min_n)
            if q:
                codes.append(q)
        rec["candidates"][name] = codes
        if not codes:
            eligible.append(name)
    rec["order"].append("preflight")
    if eligible:
        decision = DecisionGateway(policy).decide({"kind": "MODEL_ROUTE", "task_id": task_id, "candidates": eligible,
                                                   "requested_tokens": est_in})
        rec["decision"] = decision.as_dict()
        rec["evidence"] += [*decision.evidence, *decision.reasons]
        if decision.outcome == "BLOCKED":
            rec["reason_codes"].append("ROUTE_BLOCKED")
        else:
            rec["proposed_model"] = decision.outcome
    for name, codes in rec["candidates"].items():
        rec["reason_codes"] += codes
    if not eligible:
        rec["reason_codes"].append("NO_ELIGIBLE_MODEL")
    proposed = rec["proposed_model"]
    rec["order"].append("approval")
    if proposed and proposed != requested:
        rec["approval"] = _approval(root, pins, proposed, log) or "ok"
        if rec["approval"] != "ok":
            rec["reason_codes"].append(rec["approval"])
        elif rec["mode"] == "shadow":
            rec["reason_codes"].append("SHADOW_NO_SWITCH")
        # switch_allowed stays False: no mode executes a switch in this build.
        rec["reason_codes"].append("SWITCH_NOT_EXECUTED")
    rec["order"].append("accounting")  # the executed request is reserved/recorded by the UsageLedger as before
    for tag, name in (("proposed", proposed), ("executed", requested)):
        spec = policy.models.get(name) if name else None
        if spec is not None:
            rec["evidence"].append(f"estimated_cost_usd[{tag}]={spec.cost_usd(est_in, spec.output_reserve_tokens):.6f}")
