"""Unit tests for HIVE context governance enforcement library."""
from __future__ import annotations

import os
import tempfile
from pathlib import Path

import pytest

from hive.context_policy import ContextPolicy, DispatchBlocked, PolicyError


def _write_policy(root: Path, text: str) -> Path:
    p = root / "agent_context_policy.yaml"
    p.write_text(text, encoding="utf-8")
    return p


def _base_policy() -> str:
    return """
policy_version: 1
mode: enforce
context:
  hard_dispatch_ratio: 0.80
  max_nested_dispatch_depth: 3
  max_task_packet_tokens: 6000
  min_relevance_threshold: 0.30
  max_uncompressed_tool_result_tokens: 2000
budget:
  default_task_usd: 1.00
  default_run_usd: 10.00
  default_daily_usd: 25.00
  verification_reserve_ratio: 0.20
  dry_run: false
  emergency_stop_on_exhaustion: true
feature_flags:
  context_governance_enabled: true
  preflight_gate_required: true
models:
  ollama-myr5-hold-local:
    provider: ollama
    endpoint: http://127.0.0.1:11434
    context_window_tokens: 8192
    output_reserve_tokens: 512
    input_price_per_1k_tokens: 0.002
    output_price_per_1k_tokens: 0.002
    rate_limit_requests_per_minute: 60
    default_available: true
    verified: true
  local-tool:
    provider: deterministic
    context_window_tokens: 0
    output_reserve_tokens: 0
    input_price_per_1k_tokens: 0.0
    output_price_per_1k_tokens: 0.0
    rate_limit_requests_per_minute: 1000
    default_available: true
    verified: true
"""


def test_load_policy_and_snapshot(tmp_path):
    policy_path = _write_policy(tmp_path, _base_policy())
    pol = ContextPolicy(policy_path=policy_path, store_root=tmp_path / ".hive")
    snap = pol.snapshot()
    assert snap["schema_version"] == "hive-context-governance-v1"
    assert snap["mode"] == "enforce"
    assert snap["dry_run"] is False
    assert "ollama-myr5-hold-local" in snap["models"]
    assert snap["models"]["ollama-myr5-hold-local"]["context_window_tokens"] == 8192
    assert snap["models"]["ollama-myr5-hold-local"]["verified"] is True


def test_unknown_model_is_blocked(tmp_path):
    pol = ContextPolicy(policy_path=_write_policy(tmp_path, _base_policy()), store_root=tmp_path / ".hive")
    receipt = pol.preflight(task_id="t1", model_name="no-such-model", requested_tokens=100)
    assert receipt["eligible"] is False
    assert any("unknown" in r.lower() for r in receipt["reasons"])
    assert receipt["checks"]["model_configured"] is False


def test_context_over_hard_ratio_is_blocked(tmp_path):
    pol = ContextPolicy(policy_path=_write_policy(tmp_path, _base_policy()), store_root=tmp_path / ".hive")
    # 8192 * 0.80 = 6553.6; request 7000 -> over hard ratio
    receipt = pol.preflight(task_id="t1", model_name="ollama-myr5-hold-local", requested_tokens=7000)
    assert receipt["eligible"] is False
    assert receipt["checks"]["context_within_limit"] is False
    assert any("hard dispatch ratio" in r for r in receipt["reasons"])


def test_context_within_limit_is_eligible(tmp_path):
    pol = ContextPolicy(policy_path=_write_policy(tmp_path, _base_policy()), store_root=tmp_path / ".hive")
    receipt = pol.preflight(task_id="t1", model_name="ollama-myr5-hold-local", requested_tokens=1000)
    assert receipt["eligible"] is True
    assert receipt["checks"]["gate_passed"] is True


def test_nested_depth_exceeds_max_is_blocked(tmp_path):
    pol = ContextPolicy(policy_path=_write_policy(tmp_path, _base_policy()), store_root=tmp_path / ".hive")
    receipt = pol.preflight(task_id="t1", model_name="ollama-myr5-hold-local",
                            requested_tokens=100, nested_depth=5)
    assert receipt["eligible"] is False
    assert receipt["checks"]["depth_within_limit"] is False


def test_budget_ceiling_blocks_dispatch(tmp_path):
    pol = ContextPolicy(policy_path=_write_policy(tmp_path, _base_policy()), store_root=tmp_path / ".hive")
    # consume nearly all run budget
    pol.record_usage(model_name="ollama-myr5-hold-local", input_tokens=1000, output_tokens=1000,
                     cost_usd=9.9)
    receipt = pol.preflight(task_id="t2", model_name="ollama-myr5-hold-local",
                            requested_tokens=100, estimated_cost_usd=0.5)
    assert receipt["eligible"] is False
    assert receipt["checks"]["run_budget_within_limit"] is False


def test_emergency_stop_blocks_all_dispatch(tmp_path):
    pol = ContextPolicy(policy_path=_write_policy(tmp_path, _base_policy()), store_root=tmp_path / ".hive")
    pol.request_emergency_stop("test stop")
    receipt = pol.preflight(task_id="t1", model_name="ollama-myr5-hold-local", requested_tokens=100)
    assert receipt["eligible"] is False
    assert receipt["emergency_stop"] is True
    pol.clear_emergency_stop()
    receipt = pol.preflight(task_id="t1", model_name="ollama-myr5-hold-local", requested_tokens=100)
    assert receipt["emergency_stop"] is False


def test_record_usage_charges_budget(tmp_path):
    pol = ContextPolicy(policy_path=_write_policy(tmp_path, _base_policy()), store_root=tmp_path / ".hive")
    state = pol.record_usage(model_name="ollama-myr5-hold-local", input_tokens=1000,
                             output_tokens=1000, requests=1)
    assert state["run_usd"] > 0
    assert state["run_tokens"] == 2000
    assert state["run_requests"] == 1


def test_remaining_budget_shape(tmp_path):
    pol = ContextPolicy(policy_path=_write_policy(tmp_path, _base_policy()), store_root=tmp_path / ".hive")
    rem = pol.remaining_budget()
    assert "run_usd_remaining" in rem
    assert "ceilings" in rem
    assert rem["ceilings"]["run_usd"] == 10.0


def test_reconcile_estimated_vs_provider_flags_large_delta(tmp_path):
    pol = ContextPolicy(policy_path=_write_policy(tmp_path, _base_policy()), store_root=tmp_path / ".hive")
    out = pol.reconcile_estimated_vs_provider(provider_usage={"cost_usd": 5.0}, estimated_cost_usd=1.0)
    assert out["flagged_estimate"] is True
    assert out["reconciled"] is True


def test_dispatch_blocked_raised_when_ineligible(tmp_path):
    pol = ContextPolicy(policy_path=_write_policy(tmp_path, _base_policy()), store_root=tmp_path / ".hive")
    receipt = pol.preflight(task_id="t1", model_name="no-such-model", requested_tokens=100)
    assert not receipt["eligible"]
    with pytest.raises(DispatchBlocked):
        if not receipt["eligible"]:
            raise DispatchBlocked("blocked")


def test_policy_error_on_bad_version(tmp_path):
    bad = _base_policy().replace("policy_version: 1", "policy_version: 2")
    with pytest.raises(PolicyError):
        ContextPolicy(policy_path=_write_policy(tmp_path, bad), store_root=tmp_path / ".hive")


def test_model_cost_calculation(tmp_path):
    pol = ContextPolicy(policy_path=_write_policy(tmp_path, _base_policy()), store_root=tmp_path / ".hive")
    spec = pol.model("ollama-myr5-hold-local")
    cost = spec.cost_usd(input_tokens=1000, output_tokens=500)
    assert abs(cost - (0.002 * 1000 / 1000 + 0.002 * 500 / 1000)) < 1e-9
