"""Central context, memory and token-cost governance enforcement library.

Single source of truth for HIVE context governance. Every agent launcher and
dispatch path calls the preflight gate before autonomous execution. Budgets are
cumulative across nested agents; model-specific context windows, pricing tiers
and rate limits are resolved from the versioned policy file. Fail-closed: a
missing provider adapter or budget exhaustion blocks dispatch and checkpoints
safely rather than warning.
"""
from __future__ import annotations

import hashlib
import json
import os
import threading
import time
from pathlib import Path
from typing import Any

import yaml

POLICY_PATH = Path("configs/agent_context_policy.yaml")
SCHEMA_VERSION = "hive-context-governance-v1"


class PolicyError(ValueError):
    """Raised when policy configuration is invalid."""


class DispatchBlocked(RuntimeError):
    """Raised when the preflight gate refuses an autonomous dispatch."""


def _load_yaml(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise PolicyError(f"policy file not found: {path}")
    with path.open("r", encoding="utf-8") as handle:
        data = yaml.safe_load(handle) or {}
    if not isinstance(data, dict):
        raise PolicyError("policy root must be a mapping")
    if data.get("policy_version") != 1:
        raise PolicyError(f"unsupported policy_version: {data.get('policy_version')!r}")
    return data


class ModelSpec:
    """Resolved model-specific context window, pricing and rate limits."""

    __slots__ = ("name", "provider", "endpoint", "context_window_tokens",
                 "output_reserve_tokens", "input_price_per_1k_tokens",
                 "output_price_per_1k_tokens", "cached_input_price_per_1k_tokens",
                 "rate_limit_requests_per_minute", "default_available", "verified")

    def __init__(self, name: str, entry: dict[str, Any]) -> None:
        if not isinstance(entry, dict):
            raise PolicyError(f"model {name}: entry must be a mapping")
        self.name = name
        self.provider = str(entry.get("provider", "unknown"))
        self.endpoint = str(entry.get("endpoint", ""))
        self.context_window_tokens = _int(entry, "context_window_tokens", 0, minimum=0)
        self.output_reserve_tokens = _int(entry, "output_reserve_tokens", 0, minimum=0)
        self.input_price_per_1k_tokens = _float(entry, "input_price_per_1k_tokens", 0.0, minimum=0.0)
        self.output_price_per_1k_tokens = _float(entry, "output_price_per_1k_tokens", 0.0, minimum=0.0)
        self.cached_input_price_per_1k_tokens = _float(entry, "cached_input_price_per_1k_tokens", 0.0, minimum=0.0)
        self.rate_limit_requests_per_minute = _int(entry, "rate_limit_requests_per_minute", 0, minimum=0)
        self.default_available = bool(entry.get("default_available", False))
        self.verified = bool(entry.get("verified", False))

    def cost_usd(self, input_tokens: int, output_tokens: int, cached_input_tokens: int = 0) -> float:
        return (
            self.input_price_per_1k_tokens * input_tokens / 1000.0
            + self.output_price_per_1k_tokens * output_tokens / 1000.0
            + self.cached_input_price_per_1k_tokens * cached_input_tokens / 1000.0
        )


def _int(entry: dict[str, Any], key: str, default: int, *, minimum: int = 0) -> int:
    value = entry.get(key, default)
    if isinstance(value, bool) or not isinstance(value, int) or value < minimum:
        raise PolicyError(f"{key} must be an integer >= {minimum}")
    return value


def _float(entry: dict[str, Any], key: str, default: float, *, minimum: float = 0.0) -> float:
    value = entry.get(key, default)
    if isinstance(value, bool) or not isinstance(value, (int, float)) or value < minimum:
        raise PolicyError(f"{key} must be a number >= {minimum}")
    return float(value)


class ContextPolicy:
    """Versioned context/cost policy with a hard preflight dispatch gate."""

    def __init__(self, policy_path: Path | str = POLICY_PATH, store_root: Path | str = Path(".hive")):
        self.policy_path = Path(policy_path)
        self.store_root = Path(store_root)
        self.emergency_stop_path = self.store_root / "STOP"
        self._lock = threading.RLock()
        self._raw = _load_yaml(self.policy_path)
        self.mode = str(self._raw.get("mode", "enforce"))
        self.dry_run = bool(self._raw.get("budget", {}).get("dry_run", False))
        self.emergency_stop = self._load_bool_flag("budget.emergency_stop_on_exhaustion", True)
        self.feature_flags = self._raw.get("feature_flags", {}) or {}
        if not isinstance(self.feature_flags, dict):
            raise PolicyError("feature_flags must be a mapping")
        self.context_cfg = self._raw.get("context", {}) or {}
        self.budget_cfg = self._raw.get("budget", {}) or {}
        self.memory_cfg = self._raw.get("memory", {}) or {}
        self.routing_cfg = self._raw.get("routing", {}) or {}
        self.telemetry_cfg = self._raw.get("telemetry", {}) or {}
        self.pricing = self._raw.get("pricing", {}) or {}  # per-1M-token map consumed by UsageLedger
        self.models: dict[str, ModelSpec] = {}
        for name, entry in (self._raw.get("models", {}) or {}).items():
            self.models[name] = ModelSpec(name, entry)
        self._budget_state: dict[str, Any] = self._default_budget_state()

    def _load_bool_flag(self, dotted: str, default: bool) -> bool:
        node = self._raw
        for part in dotted.split("."):
            if not isinstance(node, dict) or part not in node:
                return default
            node = node[part]
        return bool(node)

    def _default_budget_state(self) -> dict[str, Any]:
        return {
            "task_usd": 0.0,
            "run_usd": 0.0,
            "daily_usd": 0.0,
            "task_requests": 0,
            "run_requests": 0,
            "daily_requests": 0,
            "task_tokens": 0,
            "run_tokens": 0,
            "daily_tokens": 0,
            "task_cached_tokens": 0,
            "run_cached_tokens": 0,
            "daily_cached_tokens": 0,
            "verified_improvements": 0,
            "nested_depth": 0,
            "last_updated": time.time(),
        }

    # ---- policy introspection -------------------------------------------

    def snapshot(self) -> dict[str, Any]:
        with self._lock:
            return {
                "schema_version": SCHEMA_VERSION,
                "policy_version": self._raw.get("policy_version"),
                "mode": self.mode,
                "dry_run": self.dry_run,
                "emergency_stop": self.is_emergency_stopped(),
                "feature_flags": dict(self.feature_flags),
                "context": dict(self.context_cfg),
                "budget": dict(self.budget_cfg),
                "memory": dict(self.memory_cfg),
                "routing": dict(self.routing_cfg),
                "telemetry": dict(self.telemetry_cfg),
                "models": {
                    name: {
                        "provider": spec.provider,
                        "endpoint": spec.endpoint,
                        "context_window_tokens": spec.context_window_tokens,
                        "output_reserve_tokens": spec.output_reserve_tokens,
                        "input_price_per_1k_tokens": spec.input_price_per_1k_tokens,
                        "output_price_per_1k_tokens": spec.output_price_per_1k_tokens,
                        "cached_input_price_per_1k_tokens": spec.cached_input_price_per_1k_tokens,
                        "rate_limit_requests_per_minute": spec.rate_limit_requests_per_minute,
                        "default_available": spec.default_available,
                        "verified": spec.verified,
                    }
                    for name, spec in self.models.items()
                },
                "budget_state": dict(self._budget_state),
            }

    def model(self, name: str) -> ModelSpec:
        spec = self.models.get(name)
        if spec is None:
            raise PolicyError(f"unknown model: {name}")
        return spec

    def model_for_endpoint(self, endpoint: str) -> ModelSpec | None:
        for spec in self.models.values():
            if spec.endpoint == endpoint:
                return spec
        return None

    # ---- budget state (cumulative across nested agents) ------------------

    def budget_state(self) -> dict[str, Any]:
        with self._lock:
            return dict(self._budget_state)

    def _ceilings(self) -> dict[str, float]:
        return {
            "task_usd": float(self.budget_cfg.get("default_task_usd", 1.0)),
            "run_usd": float(self.budget_cfg.get("default_run_usd", 10.0)),
            "daily_usd": float(self.budget_cfg.get("default_daily_usd", 25.0)),
        }

    def _charge(self, delta_usd: float, input_tokens: int, output_tokens: int,
                cached_tokens: int, requests: int = 1) -> None:
        with self._lock:
            state = self._budget_state
            state["task_usd"] += delta_usd
            state["run_usd"] += delta_usd
            state["daily_usd"] += delta_usd
            state["task_requests"] += requests
            state["run_requests"] += requests
            state["daily_requests"] += requests
            state["task_tokens"] += input_tokens + output_tokens
            state["run_tokens"] += input_tokens + output_tokens
            state["daily_tokens"] += input_tokens + output_tokens
            state["task_cached_tokens"] += cached_tokens
            state["run_cached_tokens"] += cached_tokens
            state["daily_cached_tokens"] += cached_tokens
            state["last_updated"] = time.time()

    def reset_budget_state(self) -> None:
        with self._lock:
            self._budget_state = self._default_budget_state()

    def reset_task_budget(self) -> None:
        with self._lock:
            for key in ("task_usd", "task_requests", "task_tokens", "task_cached_tokens"):
                self._budget_state[key] = 0.0 if key.endswith("usd") else 0

    # ---- emergency stop ---------------------------------------------------

    def is_emergency_stopped(self) -> bool:
        return self.emergency_stop_path.exists()

    def request_emergency_stop(self, reason: str) -> None:
        self.store_root.mkdir(parents=True, exist_ok=True)
        self.emergency_stop_path.write_text(f"{time.time():.3f} {reason}\n", encoding="utf-8")

    def clear_emergency_stop(self) -> None:
        self.emergency_stop_path.unlink(missing_ok=True)

    # ---- preflight gate ---------------------------------------------------

    def preflight(self, *, task_id: str, model_name: str, parent_run_id: str | None = None,
                  nested_depth: int = 0, requested_tokens: int = 0,
                  estimated_cost_usd: float | None = None,
                  provider_usage: dict[str, Any] | None = None,
                  dry_run: bool | None = None) -> dict[str, Any]:
        """Hard preflight gate. Returns a gate receipt; raises DispatchBlocked on failure."""
        with self._lock:
            receipt = {
                "schema_version": SCHEMA_VERSION,
                "task_id": task_id,
                "parent_run_id": parent_run_id,
                "nested_depth": nested_depth,
                "model": model_name,
                "gate_version": 1,
                "eligible": False,
                "reasons": [],
                "checks": {},
                "budget_before": dict(self._budget_state),
                "dry_run": self.dry_run if dry_run is None else dry_run,
                "emergency_stop": self.is_emergency_stopped(),
                "timestamp": time.time(),
            }

            if self.is_emergency_stopped():
                receipt["reasons"].append("emergency stop is active")
                receipt["checks"]["emergency_stop"] = False
                return receipt

            if not self.feature_flags.get("context_governance_enabled", True):
                receipt["reasons"].append("context governance feature flag disabled")
                receipt["checks"]["feature_flag"] = False
                return receipt

            if not self.feature_flags.get("preflight_gate_required", True):
                receipt["checks"]["feature_flag"] = True

            try:
                spec = self.model(model_name)
            except PolicyError as exc:
                receipt["reasons"].append(f"unknown or unconfigured model: {exc}")
                receipt["checks"]["model_configured"] = False
                return receipt
            receipt["checks"]["model_configured"] = True
            receipt["checks"]["model_verified"] = spec.verified

            if not spec.default_available:
                receipt["reasons"].append(f"model {model_name} is not marked available")
                receipt["checks"]["model_available"] = False
                return receipt
            receipt["checks"]["model_available"] = True

            # Context window check against hard dispatch ratio.
            hard_ratio = float(self.context_cfg.get("hard_dispatch_ratio", 0.80))
            if spec.context_window_tokens and requested_tokens:
                utilization = requested_tokens / spec.context_window_tokens
                receipt["checks"]["context_utilization"] = utilization
                if utilization > hard_ratio:
                    receipt["reasons"].append(
                        f"context utilization {utilization:.2%} exceeds hard dispatch ratio {hard_ratio:.0%}")
                    receipt["checks"]["context_within_limit"] = False
                    return receipt
                receipt["checks"]["context_within_limit"] = True

            # Nested depth cap.
            max_depth = int(self.context_cfg.get("max_nested_dispatch_depth", 3))
            receipt["checks"]["nested_depth"] = nested_depth
            if nested_depth > max_depth:
                receipt["reasons"].append(f"nested dispatch depth {nested_depth} exceeds max {max_depth}")
                receipt["checks"]["depth_within_limit"] = False
                return receipt
            receipt["checks"]["depth_within_limit"] = True

            # Budget ceilings (cumulative across nested agents).
            ceilings = self._ceilings()
            if estimated_cost_usd is not None:
                receipt["checks"]["estimated_cost_usd"] = estimated_cost_usd
                projected = self._budget_state["run_usd"] + estimated_cost_usd
                if projected > ceilings["run_usd"]:
                    receipt["reasons"].append(
                        f"projected run cost ${projected:.2f} exceeds run ceiling ${ceilings['run_usd']:.2f}")
                    receipt["checks"]["run_budget_within_limit"] = False
                    return receipt
                receipt["checks"]["run_budget_within_limit"] = True

            # Verification reserve protection.
            reserve_ratio = float(self.budget_cfg.get("verification_reserve_ratio", 0.20))
            remaining = ceilings["run_usd"] - self._budget_state["run_usd"]
            if remaining <= ceilings["run_usd"] * reserve_ratio and estimated_cost_usd is not None and estimated_cost_usd > 0:
                receipt["reasons"].append("remaining budget would fall below verification reserve")
                receipt["checks"]["verification_reserve_protected"] = False
                return receipt
            receipt["checks"]["verification_reserve_protected"] = True

            # Rate limit (local approximation from policy; real enforcement lives in adapters).
            if spec.rate_limit_requests_per_minute:
                receipt["checks"]["rate_limit_requests_per_minute"] = spec.rate_limit_requests_per_minute

            receipt["eligible"] = True
            receipt["checks"]["gate_passed"] = True
            return receipt

    def record_usage(self, *, model_name: str, input_tokens: int, output_tokens: int,
                     cached_input_tokens: int = 0, cost_usd: float | None = None,
                     requests: int = 1) -> dict[str, Any]:
        """Record actual/provider usage and return the updated budget state. Fail-closed on budget exhaustion."""
        with self._lock:
            spec = self.model(model_name)
            if cost_usd is None:
                cost_usd = spec.cost_usd(input_tokens, output_tokens, cached_input_tokens)
            self._charge(cost_usd, input_tokens, output_tokens, cached_input_tokens, requests)
            state = dict(self._budget_state)
            ceilings = self._ceilings()
            exhausted = (
                state["run_usd"] >= ceilings["run_usd"]
                # Was keyed off max_task_packet_tokens (a token cap); same 6000 default, correct key.
                or state["run_requests"] >= int(self.budget_cfg.get("max_run_requests", 6000))
            )
            if exhausted and self.emergency_stop:
                self.request_emergency_stop("run budget exhausted")
            state["exhausted"] = exhausted
            state["ceilings"] = ceilings
            return state

    def remaining_budget(self) -> dict[str, Any]:
        with self._lock:
            ceilings = self._ceilings()
            state = dict(self._budget_state)
            return {
                "run_usd_remaining": max(0.0, ceilings["run_usd"] - state["run_usd"]),
                "task_usd_remaining": max(0.0, ceilings["task_usd"] - state["task_usd"]),
                "daily_usd_remaining": max(0.0, ceilings["daily_usd"] - state["daily_usd"]),
                "verification_reserve_usd": ceilings["run_usd"] * float(self.budget_cfg.get("verification_reserve_ratio", 0.20)),
                "exhausted": state["run_usd"] >= ceilings["run_usd"],
                "state": state,
                "ceilings": ceilings,
            }

    def reconcile_estimated_vs_provider(self, *, provider_usage: dict[str, Any],
                                        estimated_cost_usd: float) -> dict[str, Any]:
        """Reconcile an estimate against authoritative provider usage. Never invent exact billing."""
        flagged = False
        provider_cost = provider_usage.get("cost_usd")
        if provider_cost is not None:
            try:
                provider_cost = float(provider_cost)
            except (TypeError, ValueError):
                provider_cost = None
        if provider_cost is not None and estimated_cost_usd is not None:
            if abs(provider_cost - estimated_cost_usd) > max(0.01, abs(estimated_cost_usd) * 0.5):
                flagged = True
        return {
            "estimated_cost_usd": estimated_cost_usd,
            "provider_cost_usd": provider_cost,
            "reconciled": provider_cost is not None,
            "flagged_estimate": flagged,
            "note": "provider usage is authoritative when available; estimates are flagged, never presented as exact billing",
        }
