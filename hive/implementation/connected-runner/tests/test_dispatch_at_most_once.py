"""A logical model request reaches the model at most once, even across a crash between transport and finish.

Real subprocesses; the fake Ollama transport counts calls in a file, so the count survives a hard kill.
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path
from unittest.mock import patch

from hive.orchestrator import DEFAULT_CONFIG, Executor
from hive.task_spec import load_tasks
from test_dispatch_gate import CATALOG, _response

WORKER = str(Path(__file__).with_name("_amo_worker.py"))


def _run(root, counter, mode):
    return subprocess.run([sys.executable, WORKER, str(root), str(counter), mode], capture_output=True, text=True, timeout=120)


def _calls(counter):
    return len(Path(counter).read_text().splitlines()) if Path(counter).exists() else 0


def test_crash_after_transport_is_never_redispatched_after_restart(tmp_path):
    root, counter = tmp_path / "store", tmp_path / "calls.txt"
    ex = Executor(root, dict(DEFAULT_CONFIG, routes=["local_direct"], max_retries=0))
    job = ex.enqueue(load_tasks("development")[0], "local_direct")
    ex.close()

    dead = _run(root, counter, "die")  # the request left, then the worker died before finish
    assert dead.returncode == 3 and _calls(counter) == 1

    live = _run(root, counter, "ok")  # restart: would re-dispatch under g2 without the guard
    assert live.returncode == 0, live.stderr
    out = json.loads(live.stdout.strip().splitlines()[-1])
    assert _calls(counter) == 1  # still exactly one request reached the model
    assert out["job"] == job and out["out"]["passed"] is False and "NEEDS_RECONCILIATION" in out["out"]["failure"]

    ex = Executor(root, dict(DEFAULT_CONFIG, routes=["local_direct"], max_retries=0))
    try:
        stored = ex.store.get_job(job)
        assert stored["state"] == "BLOCKED" and stored["result"]["needs_reconciliation"] == [f"{job}:g1:model_dispatch"]
        info = ex.runs.resume(job)
        assert info["state"] == "FAILED" and info["terminal"]  # terminal: no auto-retry, operator must re-enqueue
        assert info["effects_unknown"] == [f"{job}:g1:model_dispatch"]  # kept visible for the operator
    finally:
        ex.close()


def test_resolved_earlier_dispatch_does_not_block_a_normal_retry(tmp_path):
    """Failure BEFORE transport (effect receipted as blocked, reservation aborted) must still retry/dispatch."""
    ex = Executor(tmp_path, dict(DEFAULT_CONFIG, routes=["local_direct"], max_retries=0))
    try:
        job = ex.enqueue(load_tasks("development")[0], "local_direct")
        claimed = ex.store.claim(ex.owner)
        ex.runs.transition(job, "ADMITTED", f"{job}:g1:admitted"); ex.runs.transition(job, "RUNNING", f"{job}:g1:running")
        ex.runs.effect_begin(job, f"{job}:g1:model_dispatch")
        ex.runs.effect_receipt(job, f"{job}:g1:model_dispatch", "blocked:" + "0" * 64)  # what the DispatchBlocked path writes
        ex.store.transition(job, "RETRY_READY", {"reason": "transient"}, ex.owner, claimed["generation"])
        ex.runs.transition(job, "PAUSED", f"{job}:g1:paused")
        ex.store.transition(job, "QUEUED")  # what a resume does for RETRY_READY jobs
        with patch("hive.model_registry.discover", return_value=CATALOG), \
             patch("hive.adapters.ollama.post_json", return_value=_response(prompt_eval_count=7)) as post:
            outcome = ex.run_one()
        assert post.call_count == 1 and outcome["id"] == job
        info = ex.runs.resume(job)
        assert info["effects_unknown"] == [] and f"{job}:g2:model_dispatch" in info["effects_done"]
    finally:
        ex.close()


def test_crash_after_receipt_before_finish_is_never_redispatched(tmp_path):
    """R_REVIEW #1: the receipt is durable but finish never ran; recovery must still not call the model again."""
    root, counter = tmp_path / "store", tmp_path / "calls.txt"
    ex = Executor(root, dict(DEFAULT_CONFIG, routes=["local_direct"], max_retries=0))
    job = ex.enqueue(load_tasks("development")[0], "local_direct")
    ex.close()

    dead = _run(root, counter, "die_after_receipt")
    assert dead.returncode == 4 and _calls(counter) == 1

    live = _run(root, counter, "ok")
    assert live.returncode == 0, live.stderr
    out = json.loads(live.stdout.strip().splitlines()[-1])
    assert _calls(counter) == 1
    assert out["job"] == job and "NEEDS_RECONCILIATION" in out["out"]["failure"]
