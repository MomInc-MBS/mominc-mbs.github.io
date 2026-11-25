"""Dispatch gate: every real Ollama request passes preflight and lands in the usage ledger.

HTTP is mocked at the adapter transport / post_json layer; no model is called.
"""
from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import patch

import pytest
import yaml

from hive.adapters.ollama import OllamaAdapter
from hive.checkpoint_manager import Checkpoints
from hive.context_policy import DispatchBlocked
from hive.dispatch_gate import LEDGER_NAME, DispatchGate, use_gate
from hive.experiment_runner import execute
from hive.metric_engine import paired_summary
from hive.orchestrator import DEFAULT_CONFIG, Executor
from hive.review_gate import REQUIRED_FLAGS
from hive.storage import Store
from hive.task_spec import load_tasks
from hive.usage_ledger import UsageLedger, UsageRecord

REAL_POLICY = Path(__file__).resolve().parents[1] / "configs" / "agent_context_policy.yaml"
LOCAL = "ollama-myr5-hold-local"
MODEL = "myr5-hold-local:latest"
CATALOG = {"available": True, "models": [{"id": MODEL, "digest": "sha256:pin"}]}


def _response(**extra):
    return {"model": MODEL, "message": {"content": '{"answer": 1}'}, "eval_count": 5, **extra}


def _paid_policy(tmp_path, run_usd=1.0):
    raw = yaml.safe_load(REAL_POLICY.read_text(encoding="utf-8"))
    raw["budget"]["default_run_usd"] = run_usd
    raw["models"][LOCAL]["input_price_per_1k_tokens"] = 0.002
    raw["pricing"][LOCAL] = {"fresh_input": 2.0, "cached_read": 0.0, "cache_write": 0.0, "output": 2.0}
    path = tmp_path / "policy.yaml"
    path.write_text(yaml.safe_dump(raw), encoding="utf-8")
    return path


def _adapter(gate, calls):
    def transport(url, payload, timeout):
        calls.append(payload)
        return _response(prompt_eval_count=11)
    return OllamaAdapter(transport=transport, gate=gate, task_id="t-1")


def _ledger(root):
    return UsageLedger(Path(root) / LEDGER_NAME, yaml.safe_load(REAL_POLICY.read_text(encoding="utf-8"))["pricing"])


def test_usage_recorded_measured_from_response_counts(tmp_path):
    calls = []
    with patch("hive.model_registry.discover", return_value=CATALOG):
        _adapter(DispatchGate(tmp_path), calls).generate(MODEL, "{}", max_tokens=16)
    entries = _entries(tmp_path)
    assert len(calls) == 1 and len(entries) == 1
    assert entries[0]["measured"] is True and entries[0]["source"] == "ollama_response"
    assert entries[0]["fresh_input_tokens"] == 11 and entries[0]["output_tokens"] == 5
    assert entries[0]["model"] == LOCAL and entries[0]["task_id"] == "t-1"
    assert _ledger(tmp_path).verify_chain()


def test_usage_estimated_when_prompt_count_missing(tmp_path):
    transport = lambda url, payload, timeout: _response()  # noqa: E731 - no prompt_eval_count
    with patch("hive.model_registry.discover", return_value=CATALOG):
        OllamaAdapter(transport=transport, gate=DispatchGate(tmp_path)).generate(MODEL, "x" * 40)
    entry = _entries(tmp_path)[0]
    assert entry["measured"] is False and entry["source"] == "estimate" and entry["fresh_input_tokens"] == 11


def test_emergency_stop_blocks_before_any_request(tmp_path):
    (tmp_path / "STOP").write_text("stop\n")
    calls = []
    with patch("hive.model_registry.discover", return_value=CATALOG) as discover:
        with pytest.raises(DispatchBlocked, match="emergency stop"):
            _adapter(DispatchGate(tmp_path), calls).generate(MODEL, "{}")
    assert calls == [] and not discover.called and not (tmp_path / LEDGER_NAME).exists()


def test_exhausted_budget_blocks_before_any_request(tmp_path):
    policy = _paid_policy(tmp_path, run_usd=1.0)
    ledger = UsageLedger(tmp_path / LEDGER_NAME, yaml.safe_load(policy.read_text())["pricing"])
    ledger.record(UsageRecord("old", None, "t0", LOCAL, 1_000_000, 0, 0, 0, 1.0, True, "ollama_response"))  # $2 > $1
    calls = []
    with patch("hive.model_registry.discover", return_value=CATALOG):
        with pytest.raises(DispatchBlocked, match="emergency stop|run ceiling"):
            _adapter(DispatchGate(tmp_path, policy_path=policy), calls).generate(MODEL, "{}")
    # Seeding prior ledger spend trips the policy's budget-exhaustion emergency stop.
    assert calls == [] and len(ledger._read_lines()) == 1 and (tmp_path / "STOP").exists()


def test_unknown_model_endpoint_blocks(tmp_path):
    calls = []
    adapter = OllamaAdapter("http://127.0.0.1:9", transport=lambda *a: calls.append(a), gate=DispatchGate(tmp_path))
    with pytest.raises(DispatchBlocked, match="unknown or unconfigured model"):
        adapter.generate("mystery:1", "{}")
    assert calls == []


def test_execute_propagates_block_instead_of_scoring_it_as_model_failure(tmp_path):
    (tmp_path / "STOP").write_text("stop\n")
    task = load_tasks("development")[0]
    with patch("hive.adapters.ollama.post_json") as post, use_gate(DispatchGate(tmp_path)):
        with pytest.raises(DispatchBlocked):
            execute(task, "local_direct", {"model": MODEL})
    post.assert_not_called()


def test_execute_default_adapter_records_usage_via_active_gate(tmp_path):
    task = load_tasks("development")[0]
    with patch("hive.model_registry.discover", return_value=CATALOG), \
         patch("hive.adapters.ollama.post_json", return_value=_response(prompt_eval_count=9)), \
         use_gate(DispatchGate(tmp_path)):
        result = execute(task, "local_direct", {"model": MODEL})
    assert result["backend"] == "ollama" and result["tokens"] == 5
    assert _ledger(tmp_path).totals()["fresh_input_tokens"] == 9


def test_replay_and_tool_routes_make_no_dispatch_and_write_no_usage(tmp_path):
    ex = Executor(tmp_path, dict(DEFAULT_CONFIG, routes=["tool"]))
    try:
        ex.enqueue(load_tasks("development")[0])
        assert ex.loop(1)[0]["route"] == "tool"
        assert not (tmp_path / LEDGER_NAME).exists()
        assert ex.gate._policy is None  # policy never even loaded
    finally:
        ex.close()


def test_executor_local_dispatch_records_usage(tmp_path):
    ex = Executor(tmp_path, dict(DEFAULT_CONFIG, routes=["local_direct"], max_retries=0))
    try:
        ex.enqueue(load_tasks("development")[0], "local_direct")
        with patch("hive.model_registry.discover", return_value=CATALOG), \
             patch("hive.adapters.ollama.post_json", return_value=_response(prompt_eval_count=7)):
            ex.loop(1)
        assert ex.store.get("budget")["requests"] == 1
    finally:
        ex.close()
    assert _ledger(tmp_path).totals()["fresh_input_tokens"] == 7


def test_executor_blocked_dispatch_blocks_job_and_releases_reservation(tmp_path):
    ex = Executor(tmp_path, dict(DEFAULT_CONFIG, routes=["local_direct"], max_retries=0))
    ex.gate = DispatchGate(tmp_path, policy_path=_paid_policy(tmp_path, run_usd=1.0))
    UsageLedger(tmp_path / LEDGER_NAME, ex.gate._ensure()[0].pricing).record(
        UsageRecord("old", None, "t0", LOCAL, 1_000_000, 0, 0, 0, 1.0, True, "ollama_response"))
    try:
        job = ex.enqueue(load_tasks("development")[0], "local_direct")
        with patch("hive.model_registry.discover", return_value=CATALOG), \
             patch("hive.adapters.ollama.post_json") as post:
            outcome = ex.loop(1)[0]
        post.assert_not_called()
        assert outcome["passed"] is False and "preflight gate blocked" in outcome["failure"]
        assert ex.store.get_job(job)["state"] == "BLOCKED"
        assert ex.store.get("budget")["requests"] == 0 and ex.store.get("budget")["cycles"] == 0
    finally:
        ex.close()


# ---- checkpoint promotion requires a passing review_gate verdict -------------

def _evidence(**over):
    return {**dict.fromkeys(REQUIRED_FLAGS, True), "author_id": "builder", "reviewer_id": "independent",
            "paired_summary": paired_summary([1] * 24, [0] * 24), **over}


def test_promote_denied_without_review_and_after_failed_review(tmp_path):
    store = Store(tmp_path)
    try:
        cp = Checkpoints(store)
        ref = cp.save({"v": 1}, {"claim": "approved"}, approved=True)
        with pytest.raises(ValueError, match="review_gate"):
            cp.promote(ref)
        assert cp.record_review(ref, _evidence(reviewer_id="builder"))["decision"] == "REJECT"
        with pytest.raises(ValueError, match="review_gate"):
            cp.promote(ref)
        assert store.get("current_checkpoint") is None
        assert cp.record_review(ref, _evidence())["decision"] == "PROMOTE"
        cp.promote(ref)
        assert store.get("current_checkpoint") == ref
    finally:
        store.close()


def test_review_verdict_is_per_checkpoint(tmp_path):
    store = Store(tmp_path)
    try:
        cp = Checkpoints(store)
        reviewed, other = cp.save({"v": 1}, {}, approved=True), cp.save({"v": 2}, {}, approved=True)
        cp.record_review(reviewed, _evidence())
        with pytest.raises(ValueError, match="review_gate"):
            cp.promote(other)
    finally:
        store.close()


def test_rollback_to_previously_promoted_works_but_unpromoted_refused(tmp_path):
    store = Store(tmp_path)
    try:
        cp = Checkpoints(store)
        first, second, never = (cp.save({"v": n}, {}, approved=True) for n in (1, 2, 3))
        for ref in (first, second):
            cp.record_review(ref, _evidence())
            cp.promote(ref)
        cp.rollback(first)
        assert store.get("current_checkpoint") == first and cp.current()["policy"] == {"v": 1}
        with pytest.raises(ValueError, match="never promoted"):
            cp.rollback(never)
        assert store.get("current_checkpoint") == first
    finally:
        store.close()


# ---- ledger gap: a request that reached the transport is always recorded ------

def _entries(root):
    path = Path(root) / LEDGER_NAME
    rows = [json.loads(line) for line in path.read_text().splitlines()] if path.exists() else []
    return [r for r in rows if r.get("kind") not in ("reservation", "release")]  # usage records only


@pytest.mark.parametrize("bad", [
    {"model": "other:1", "message": {"content": "{}"}, "eval_count": 5, "prompt_eval_count": 8},  # wrong model id
    {"model": MODEL, "message": {"content": "{}"}, "eval_count": -1, "prompt_eval_count": 8},     # bad eval_count
    {"model": MODEL, "message": {"content": "{}"}, "prompt_eval_count": 8},                       # missing eval_count
    {"model": MODEL, "message": "nope", "eval_count": 5},                                          # malformed message
])
def test_validation_failure_after_transport_still_records_usage(tmp_path, bad):
    adapter = OllamaAdapter(transport=lambda *a: bad, gate=DispatchGate(tmp_path), task_id="t-bad")
    with patch("hive.model_registry.discover", return_value=CATALOG), pytest.raises(RuntimeError):
        adapter.generate(MODEL, "x" * 40)
    (entry,) = _entries(tmp_path)
    assert entry["task_id"] == "t-bad" and entry["model"] == LOCAL
    if bad.get("prompt_eval_count") == 8 and bad.get("eval_count") == 5:
        assert entry["measured"] is True and entry["fresh_input_tokens"] == 8  # counts present -> measured
    else:
        assert entry["measured"] is False and entry["source"] == "estimate" and entry["fresh_input_tokens"] == 11
    assert _ledger(tmp_path).verify_chain()


def test_transport_exception_records_estimate(tmp_path):
    def boom(*a):
        raise TimeoutError("socket timeout")
    adapter = OllamaAdapter(transport=boom, gate=DispatchGate(tmp_path))
    with patch("hive.model_registry.discover", return_value=CATALOG), pytest.raises(TimeoutError):
        adapter.generate(MODEL, "x" * 40)
    (entry,) = _entries(tmp_path)
    assert entry["measured"] is False and entry["source"] == "estimate" and entry["output_tokens"] == 0


def test_pre_transport_failure_records_nothing(tmp_path):
    calls = []
    adapter = OllamaAdapter(transport=lambda *a: calls.append(a), gate=DispatchGate(tmp_path))
    with patch("hive.model_registry.discover", return_value={"available": False}), pytest.raises(RuntimeError):
        adapter.generate(MODEL, "{}")  # catalog check fails before the request leaves
    with patch("hive.model_registry.discover", return_value=CATALOG), pytest.raises(RuntimeError, match="no discovered"):
        adapter.generate("unlisted:1", "{}")  # preflight passes, but no manifest digest: stops before the request
    assert calls == [] and _entries(tmp_path) == []


def test_preflight_block_records_nothing_even_with_transport_set(tmp_path):
    (tmp_path / "STOP").write_text("stop\n")
    calls = []
    adapter = OllamaAdapter(transport=lambda *a: calls.append(a), gate=DispatchGate(tmp_path))
    with patch("hive.model_registry.discover", return_value=CATALOG), pytest.raises(DispatchBlocked):
        adapter.generate(MODEL, "{}")
    assert calls == [] and _entries(tmp_path) == []


# ---- promotion is intentionally impossible in production today ---------------

def test_no_production_code_promotes_or_switches_the_governing_checkpoint():
    """P2 stays quarantined: only checkpoint_manager may move current_checkpoint, and nothing calls promote().

    If you add a real promotion path, route it through Checkpoints.record_review + promote and update this test.
    """
    import re
    src = Path(__file__).resolve().parents[1] / "src" / "hive"
    pattern = re.compile(r"\.promote\(|\._switch\(|\.set\(\s*['\"](?:current|previous)_checkpoint['\"]")
    offenders = [f"{p.name}:{n}" for p in src.rglob("*.py") if p.name != "checkpoint_manager.py"
                 for n, line in enumerate(p.read_text(encoding="utf-8-sig").splitlines(), 1) if pattern.search(line)]
    assert offenders == []


def test_lab_style_unapproved_checkpoint_cannot_be_promoted_even_with_passing_review(tmp_path):
    store = Store(tmp_path)
    try:
        cp = Checkpoints(store)
        ref = cp.save({"v": 1}, {"decision": "QUARANTINE"}, approved=False)  # what lab.py saves
        with pytest.raises(ValueError, match="not approved"):
            cp.record_review(ref, _evidence())
        with pytest.raises(ValueError, match="not approved"):
            cp.promote(ref)
        assert store.get("current_checkpoint") is None
    finally:
        store.close()


# ---- role scope: only a role granted model_dispatch may start a real request --

def test_builder_may_dispatch_by_default(tmp_path):
    ticket = DispatchGate(tmp_path).begin(task_id="t", model=MODEL, endpoint="http://127.0.0.1:11434",
                                          prompt="{}", max_tokens=8)
    assert ticket["model"] == LOCAL


@pytest.mark.parametrize("role", ["reviewer", "research", "diagnostic", "verifier", "nobody", None])
def test_role_without_model_dispatch_is_denied_before_preflight(tmp_path, role):
    gate = DispatchGate(tmp_path)
    with pytest.raises(DispatchBlocked, match="may not dispatch a model"):
        gate.begin(task_id="t", model=MODEL, endpoint="http://127.0.0.1:11434", prompt="{}", max_tokens=8, role=role)
    assert not (tmp_path / LEDGER_NAME).exists()  # denied before any preflight/reservation/usage record
    (row,) = [json.loads(x) for x in (tmp_path / "model-route-log.jsonl").read_text().splitlines()]
    assert row["reason_codes"][0] == "ROLE_DENIED" and row["executed_model"] is None  # shadow log only


def test_role_deny_blocks_adapter_request_and_records_nothing(tmp_path):
    calls = []

    class ReviewerGate(DispatchGate):
        def begin(self, **kw):
            return super().begin(**kw, role="reviewer")

    adapter = OllamaAdapter(transport=lambda *a: calls.append(a), gate=ReviewerGate(tmp_path))
    with patch("hive.model_registry.discover", return_value=CATALOG), pytest.raises(DispatchBlocked):
        adapter.generate(MODEL, "{}")
    assert calls == [] and _entries(tmp_path) == []


def test_unreadable_role_config_fails_closed(tmp_path):
    from hive import dispatch_gate
    with patch.object(dispatch_gate, "ROLES_PATH", tmp_path / "missing.yaml"):
        with pytest.raises(DispatchBlocked, match="role check unavailable"):
            DispatchGate(tmp_path).begin(task_id="t", model=MODEL, endpoint="http://127.0.0.1:11434",
                                         prompt="{}", max_tokens=8)


def test_reservation_is_upper_bound_when_usage_beats_estimate(tmp_path):
    """BC_REVIEW #1: two admitted dispatches whose real usage exceeds the bytes/4 estimate must not overdraw."""
    policy = _paid_policy(tmp_path, run_usd=0.01)
    prompt = "x" * 3000
    tickets = []
    for _ in range(2):
        try:
            tickets.append(DispatchGate(tmp_path, policy_path=policy).begin(
                task_id="t-1", model=MODEL, endpoint="http://127.0.0.1:11434", prompt=prompt, max_tokens=16))
        except DispatchBlocked:
            pass
    for ticket in tickets:  # Ollama reports one token per byte: worse than the old estimate
        DispatchGate(tmp_path, policy_path=policy).finish(ticket, {"prompt_eval_count": 3000, "eval_count": 16})
    ledger = _ledger(tmp_path)
    spent = sum(e["cost_usd"] for e in _entries(tmp_path))
    assert len(tickets) == 1 and 0 < spent <= 0.01 and ledger.verify_chain()


def test_torn_ledger_tail_blocks_as_dispatch_blocked(tmp_path):
    """BC_REVIEW #2: a crashed half-written line is never glued onto; dispatch fails closed as DispatchBlocked."""
    (tmp_path / LEDGER_NAME).write_bytes(b'{"run_id":"r","task')
    calls = []
    with patch("hive.model_registry.discover", return_value=CATALOG):
        with pytest.raises(DispatchBlocked):
            _adapter(DispatchGate(tmp_path), calls).generate(MODEL, "{}")
    assert calls == [] and (tmp_path / LEDGER_NAME).read_bytes() == b'{"run_id":"r","task'
