"""MODEL_ROUTE wired into the dispatch path in SHADOW mode: proposed vs executed, evidence, reason codes.

No model inference: HTTP is mocked at the adapter transport / registry discovery, as in test_dispatch_gate.
"""
from __future__ import annotations

import json
from unittest.mock import patch

import pytest
import yaml

from hive.adapters.ollama import OllamaAdapter
from hive.context_policy import DispatchBlocked
from hive.dispatch_gate import LEDGER_NAME, DispatchGate
from hive.model_route import APPROVAL_NAME, LOG_NAME
from hive.usage_ledger import UsageLedger, UsageRecord
from test_dispatch_gate import CATALOG, LOCAL, MODEL, REAL_POLICY, _response

ALT = "ollama-alt-cheap"
PIN = "a" * 64
ENDPOINT = "http://127.0.0.1:11434"
GOOD_Q = {"measured": True, "pass_rate": 0.92, "samples": 12, "evidence": "eval/run-7"}


def _policy(tmp_path, route=None, run_usd=1.0, alt_price=0.0005, alt_available=True):
    raw = yaml.safe_load(REAL_POLICY.read_text(encoding="utf-8"))
    raw["budget"]["default_run_usd"] = run_usd
    raw["models"][LOCAL]["input_price_per_1k_tokens"] = 0.002
    raw["pricing"][LOCAL] = {"fresh_input": 2.0, "cached_read": 0.0, "cache_write": 0.0, "output": 2.0}
    raw["models"][ALT] = {**raw["models"][LOCAL], "endpoint": "http://127.0.0.1:11435",
                          "input_price_per_1k_tokens": alt_price, "default_available": alt_available}
    raw["pricing"][ALT] = dict(raw["pricing"][LOCAL])
    if route is not None:
        raw["routing"]["model_route"] = route
    path = tmp_path / "policy.yaml"
    path.write_text(yaml.safe_dump(raw), encoding="utf-8")
    return path


def _route(**over):
    cfg = {"candidates": [ALT], "pinned_digests": {LOCAL: PIN, ALT: PIN}, "min_quality": 0.8, "min_samples": 5,
           "quality": {LOCAL: GOOD_Q, ALT: GOOD_Q}}
    cfg.update(over)
    return cfg


def _begin(root, policy, prompt="x" * 400, **kw):
    gate = kw.pop("gate", None) or DispatchGate(root, policy_path=policy, run_id="run-1")
    return gate.begin(task_id="t-1", model=LOCAL, endpoint=ENDPOINT, prompt=prompt, max_tokens=16, **kw)


def _log(root):
    path = root / LOG_NAME
    return [json.loads(x) for x in path.read_text().splitlines()] if path.exists() else []


def test_shadow_proposes_cheaper_model_but_executes_the_request_unchanged(tmp_path):
    policy = _policy(tmp_path, _route())
    seen = []

    def transport(url, payload, timeout):
        seen.append(payload["model"])
        return _response(prompt_eval_count=11)

    with patch("hive.model_registry.discover", return_value=CATALOG):
        OllamaAdapter(transport=transport, gate=DispatchGate(tmp_path, policy_path=policy), task_id="t-1").generate(
            MODEL, "x" * 400, max_tokens=16)
    assert seen == [MODEL]  # the request that left the process is the one that was asked for
    (row,) = _log(tmp_path)
    assert row["mode"] == "shadow" and row["proposed_model"] == ALT and row["executed_model"] == LOCAL
    assert row["switch_allowed"] is False and row["switch_executed"] is False
    assert row["decision"]["kind"] == "MODEL_ROUTE" and ALT in row["evidence"]
    assert any(e.startswith("estimated_cost_usd[proposed]") for e in row["evidence"])
    assert {"SWITCH_NOT_EXECUTED", "NO_APPROVAL"} <= set(row["reason_codes"])
    assert row["order"] == ["role", "allowlist_digest", "preflight", "approval", "accounting"]
    assert row["reservation_id"]  # the executed request is the one accounted in the usage ledger
    usage = [json.loads(x) for x in (tmp_path / LEDGER_NAME).read_text().splitlines()]
    assert [u["model"] for u in usage if u.get("kind") not in ("reservation", "release")] == [LOCAL]
    assert UsageLedger(tmp_path / LOG_NAME, {}).verify_chain()


def test_default_config_has_no_measured_quality_so_nothing_is_eligible(tmp_path):
    ticket = _begin(tmp_path, _policy(tmp_path))  # real policy shape: no model_route section at all
    (row,) = _log(tmp_path)
    assert ticket["model"] == LOCAL and row["executed_model"] == LOCAL and row["proposed_model"] is None
    assert "QUALITY_UNMEASURED" in row["reason_codes"] and "NO_ELIGIBLE_MODEL" in row["reason_codes"]
    assert row["mode"] == "shadow" and row["switch_executed"] is False


@pytest.mark.parametrize("quality, code", [
    ({LOCAL: GOOD_Q}, "QUALITY_UNMEASURED"),  # cheaper model has no measurement: not "cheap enough"
    ({LOCAL: GOOD_Q, ALT: {"measured": False, "pass_rate": 1.0, "samples": 99, "evidence": "e"}}, "QUALITY_UNMEASURED"),
    ({LOCAL: GOOD_Q, ALT: {"measured": True, "pass_rate": 1.0, "samples": 99}}, "QUALITY_UNMEASURED"),  # no evidence
    ({LOCAL: GOOD_Q, ALT: {**GOOD_Q, "pass_rate": 0.5}}, "QUALITY_BELOW_THRESHOLD"),
    ({LOCAL: GOOD_Q, ALT: {**GOOD_Q, "samples": 2}}, "QUALITY_BELOW_THRESHOLD"),
])
def test_unmeasured_or_weak_quality_is_ineligible(tmp_path, quality, code):
    _begin(tmp_path, _policy(tmp_path, _route(quality=quality)))
    (row,) = _log(tmp_path)
    assert code in row["candidates"][ALT] and row["proposed_model"] == LOCAL  # only the measured model qualifies


def test_unknown_unavailable_and_unpinned_models_are_ineligible(tmp_path):
    policy = _policy(tmp_path, _route(candidates=["ghost-model", ALT], pinned_digests={LOCAL: PIN}), alt_available=False)
    ticket = _begin(tmp_path, policy)
    (row,) = _log(tmp_path)
    assert row["candidates"]["ghost-model"] == ["UNKNOWN_MODEL"]
    assert {"MODEL_UNAVAILABLE", "NO_PINNED_DIGEST"} <= set(row["candidates"][ALT])
    assert row["proposed_model"] == LOCAL and ticket["model"] == LOCAL


def test_gateway_failure_is_logged_and_never_blocks_dispatch(tmp_path):
    policy = _policy(tmp_path, _route())
    with patch("hive.model_route.DecisionGateway.decide", side_effect=RuntimeError("gateway down")):
        ticket = _begin(tmp_path, policy)
    (row,) = _log(tmp_path)
    assert ticket["model"] == LOCAL and ticket["reservation_id"]  # dispatch proceeded, accounted
    assert row["proposed_model"] is None and row["executed_model"] == LOCAL
    assert "GATEWAY_ERROR" in row["reason_codes"] and "gateway down" in " ".join(row["evidence"])


def test_route_log_failure_never_blocks_dispatch(tmp_path):
    policy = _policy(tmp_path, _route())
    (tmp_path / (LOG_NAME + ".lock")).mkdir()  # the shadow log is unusable
    ticket = _begin(tmp_path, policy)
    assert ticket["model"] == LOCAL and "log_error" in ticket["route_shadow"] and not (tmp_path / LOG_NAME).exists()


def test_route_budget_exhaustion_blocks_the_candidate_not_the_request(tmp_path):
    policy = _policy(tmp_path, _route(), alt_price=50.0)  # est ~$5 for the cheap-quality alt: over the $1 ceiling
    ticket = _begin(tmp_path, policy)
    (row,) = _log(tmp_path)
    assert ticket["model"] == LOCAL and row["proposed_model"] == LOCAL
    assert any(ALT in e and "exceeds" in e for e in row["evidence"])


def test_exhausted_budget_blocks_dispatch_and_logs_dispatch_blocked(tmp_path):
    policy = _policy(tmp_path, _route(), run_usd=1.0)
    ledger = UsageLedger(tmp_path / LEDGER_NAME, yaml.safe_load(policy.read_text())["pricing"])
    ledger.record(UsageRecord("old", None, "t0", LOCAL, 1_000_000, 0, 0, 0, 1.0, True, "ollama_response"))  # $2 > $1
    with pytest.raises(DispatchBlocked):
        _begin(tmp_path, policy)
    (row,) = _log(tmp_path)
    assert "DISPATCH_BLOCKED" in row["reason_codes"] and row["executed_model"] is None and row["proposed_model"] is None


@pytest.mark.parametrize("role", ["reviewer", "verifier", "nobody"])
def test_role_denial_is_logged_before_any_candidate_is_evaluated(tmp_path, role):
    with pytest.raises(DispatchBlocked, match="may not dispatch"):
        _begin(tmp_path, _policy(tmp_path, _route()), role=role)
    (row,) = _log(tmp_path)
    assert row["reason_codes"][0] == "ROLE_DENIED" and row["candidates"] == {} and row["order"] == ["role"]
    assert row["executed_model"] is None and not (tmp_path / LEDGER_NAME).exists()


def test_replayed_request_is_flagged_and_never_switch_eligible(tmp_path):
    policy = _policy(tmp_path, _route())
    _begin(tmp_path, policy)
    _begin(tmp_path, policy)  # same run, task, model and prompt
    first, second = _log(tmp_path)
    assert first["replay"] is False and second["replay"] is True and "REPLAY" in second["reason_codes"]
    assert second["switch_allowed"] is False and second["request_key"] == first["request_key"]


def _approval(tmp_path, **over):
    body = {"schema_version": 1, "approved": True, "approved_by": "ian", "max_switches": 2, "models": {ALT: PIN}}
    body.update(over)
    (tmp_path / APPROVAL_NAME).write_text(json.dumps(body), encoding="utf-8")


@pytest.mark.parametrize("mode", ["shadow", "canary", "active", "yolo"])
@pytest.mark.parametrize("approval, code", [
    (None, "NO_APPROVAL"),
    ({"approved": False}, "APPROVAL_INVALID"),
    ({"max_switches": 0}, "APPROVAL_INVALID"),
    ({"models": {ALT: "b" * 64}}, "APPROVAL_DIGEST_MISMATCH"),
    ({}, "ok"),
])
def test_switching_is_unauthorized_in_every_mode_and_approval_state(tmp_path, mode, approval, code):
    policy = _policy(tmp_path, _route(mode=mode))
    if approval is not None:
        _approval(tmp_path, **approval)
    ticket = _begin(tmp_path, policy)
    (row,) = _log(tmp_path)
    assert row["proposed_model"] == ALT and row["approval"] == code
    assert ticket["model"] == LOCAL == row["executed_model"]  # executed route unchanged, always
    assert row["switch_allowed"] is False and row["switch_executed"] is False
    if mode == "yolo":
        assert row["mode"] == "shadow" and "BAD_MODE" in row["reason_codes"]
    elif mode != "shadow":
        assert row["mode"] == mode and "SWITCH_TOGGLE_NOT_EXECUTED" in row["reason_codes"]


def test_finite_approval_is_exhausted_by_prior_switches(tmp_path):
    policy = _policy(tmp_path, _route())
    _approval(tmp_path, max_switches=1)
    UsageLedger(tmp_path / LOG_NAME, {}).append({"switch_executed": True, "request_key": "earlier"})
    _begin(tmp_path, policy)
    row = _log(tmp_path)[-1]
    assert row["approval"] == "APPROVAL_EXHAUSTED"


def test_no_production_code_can_execute_a_switch():
    import inspect

    from hive import dispatch_gate, model_route
    for module in (dispatch_gate, model_route):
        text = inspect.getsource(module)
        assert '"switch_executed": True' not in text and "switch_executed'] = True" not in text
