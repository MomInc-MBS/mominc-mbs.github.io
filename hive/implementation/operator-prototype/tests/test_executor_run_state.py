"""Executor job lifecycle is mirrored into RunStates; effects wrap the real model dispatch.

Model calls are mocked at the adapter transport (post_json) and registry discovery, as in test_dispatch_gate.
"""
from __future__ import annotations

from unittest.mock import patch

import pytest

from hive.dispatch_gate import LEDGER_NAME, DispatchGate
from hive.orchestrator import DEFAULT_CONFIG, Executor
from hive.task_spec import load_tasks
from hive.usage_ledger import UsageLedger, UsageRecord
from test_dispatch_gate import CATALOG, LOCAL, _paid_policy, _response


def _states(ex, job):
    return [e["to_state"] for e in ex.runs.events(job)]


def _local_executor(tmp_path, **over):
    return Executor(tmp_path, dict(DEFAULT_CONFIG, routes=["local_direct"], max_retries=0, **over))


def test_tool_route_walks_full_lifecycle_without_effects(tmp_path):
    ex = Executor(tmp_path, dict(DEFAULT_CONFIG, routes=["tool"]))
    try:
        job = ex.enqueue(load_tasks("development")[0])
        outcome = ex.loop(1)[0]
        assert _states(ex, job) == ["ADMITTED", "RUNNING", "CHECKPOINTED", "VERIFYING",
                                    "ACCEPTED" if outcome["passed"] else "REJECTED"]
        assert [e["event_id"] for e in ex.runs.events(job)][0] == f"{job}:g1:admitted"
        info = ex.runs.resume(job)
        assert info["terminal"] and info["effects_done"] == [] and info["effects_unknown"] == []
    finally:
        ex.close()


def test_local_dispatch_is_wrapped_in_effect_begin_and_receipt(tmp_path):
    ex = _local_executor(tmp_path)
    try:
        job = ex.enqueue(load_tasks("development")[0], "local_direct")
        with patch("hive.model_registry.discover", return_value=CATALOG), \
             patch("hive.adapters.ollama.post_json", return_value=_response(prompt_eval_count=7)):
            outcome = ex.loop(1)[0]
        info = ex.runs.resume(job)
        assert info["effects_done"] == [f"{job}:g1:model_dispatch"] and info["effects_unknown"] == []
        assert info["state"] == ("ACCEPTED" if outcome["passed"] else "REJECTED")
        assert ex.store.get_job(job)["state"] in ("BLOCKED", "REJECTED")  # outcome mapping unchanged
    finally:
        ex.close()


def test_crash_during_dispatch_leaves_an_unknown_effect_for_resume(tmp_path):
    ex = _local_executor(tmp_path)
    try:
        job = ex.enqueue(load_tasks("development")[0], "local_direct")
        with patch("hive.model_registry.discover", return_value=CATALOG), \
             patch("hive.adapters.ollama.post_json", side_effect=KeyboardInterrupt), \
             pytest.raises(KeyboardInterrupt):
            ex.run_one()
        info = ex.runs.resume(job)
        assert info["state"] == "RUNNING" and not info["terminal"]
        assert info["effects_unknown"] == [f"{job}:g1:model_dispatch"] and info["effects_done"] == []
    finally:
        ex.close()


def test_preflight_block_fails_the_run_and_resolves_the_effect(tmp_path):
    ex = _local_executor(tmp_path)
    ex.gate = DispatchGate(tmp_path, policy_path=_paid_policy(tmp_path, run_usd=1.0))
    UsageLedger(tmp_path / LEDGER_NAME, ex.gate._ensure()[0].pricing).record(
        UsageRecord("old", None, "t0", LOCAL, 1_000_000, 0, 0, 0, 1.0, True, "ollama_response"))
    try:
        job = ex.enqueue(load_tasks("development")[0], "local_direct")
        with patch("hive.model_registry.discover", return_value=CATALOG), patch("hive.adapters.ollama.post_json") as post:
            outcome = ex.loop(1)[0]
        post.assert_not_called()
        assert ex.store.get_job(job)["state"] == "BLOCKED" and outcome["passed"] is False
        events = ex.runs.events(job)
        assert [e["to_state"] for e in events] == ["ADMITTED", "RUNNING", "FAILED"]
        assert "preflight gate blocked" in events[-1]["payload"]["reason"]
        assert ex.runs.resume(job)["effects_unknown"] == []  # nothing was sent, so nothing is unknown
    finally:
        ex.close()


def test_transient_budget_wait_pauses_and_the_next_claim_resumes(tmp_path):
    ex = _local_executor(tmp_path, max_requests=0)
    try:
        job = ex.enqueue(load_tasks("development")[0], "local_direct")
        with patch("hive.model_registry.discover", return_value=CATALOG):
            assert ex.run_one() is None
        assert ex.store.get_job(job)["state"] == "RETRY_READY"
        assert _states(ex, job) == ["ADMITTED", "RUNNING", "PAUSED"]
        assert ex.runs.events(job)[-1]["payload"]["reason"] == "model request budget exhausted"
        ex.store.transition(job, "QUEUED")  # what a resume does for RETRY_READY jobs
        with patch("hive.model_registry.discover", return_value=CATALOG):
            ex.run_one()
        assert _states(ex, job)[:5] == ["ADMITTED", "RUNNING", "PAUSED", "RUNNING", "PAUSED"]
        assert ex.runs.events(job)[3]["event_id"] == f"{job}:g2:running"
    finally:
        ex.close()


def test_reclaim_after_a_lost_worker_pauses_then_runs_idempotently(tmp_path):
    ex = Executor(tmp_path, dict(DEFAULT_CONFIG, routes=["tool"]))
    try:
        job = {"id": "j-lost", "generation": 1}
        ex._admit(job)
        ex._rs(job, "CHECKPOINTED", "checkpointed")  # worker died here
        job2 = {"id": "j-lost", "generation": 2}
        ex._admit(job2)
        assert _states(ex, "j-lost") == ["ADMITTED", "RUNNING", "CHECKPOINTED", "PAUSED", "RUNNING"]
        ex._admit(job2)  # the same claim replayed writes nothing new (event ids carry job + generation)
        assert _states(ex, "j-lost") == ["ADMITTED", "RUNNING", "CHECKPOINTED", "PAUSED", "RUNNING"]
    finally:
        ex.close()
