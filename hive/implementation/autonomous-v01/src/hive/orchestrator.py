"""Durable, bounded local executor. Model outputs have no execution authority."""
from __future__ import annotations

import contextlib
import hashlib
import json
import math
import os
import signal
import subprocess
import sys
import tempfile
import time
from pathlib import Path

from . import __version__
from .checkpoint_manager import Checkpoints
from .experiment_runner import execute
from .failure_triage import triage
from .learning_policy import Policy
from .metric_engine import utility
from .storage import Store
from .verifier import verify


DEFAULT_CONFIG = {
    "endpoint": "http://127.0.0.1:11434", "model": "myr5-hold-local:latest",
    "timeout_s": 120, "max_tokens": 128, "seed": 42,
    "max_requests": 120, "max_total_tokens": 15360, "max_wall_s": 2700,
    "max_storage_bytes": 268435456, "max_cycles": 240,
    "max_retries": 2, "concurrency": 1,
    "routes": ["local_direct", "local_tool"], "allow_fixtures": False,
}


def config_hash(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False).encode()).hexdigest()


def load_config(path=None):
    config = dict(DEFAULT_CONFIG)
    if path:
        supplied = json.loads(Path(path).read_text(encoding="utf-8-sig"))
        unknown = set(supplied) - set(config)
        if unknown:
            raise ValueError(f"Unknown config fields: {sorted(unknown)}")
        config.update(supplied)
    for key in ("timeout_s", "max_tokens", "max_requests", "max_total_tokens", "max_wall_s", "max_storage_bytes", "max_cycles"):
        v = config[key]
        if isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v) or v <= 0:
            raise ValueError(f"{key} must be finite and positive")
    for key in ("max_tokens", "max_requests", "max_total_tokens", "max_storage_bytes", "max_cycles", "max_retries"):
        if type(config[key]) is not int:
            raise ValueError(f"{key} must be an integer")
    if config["concurrency"] != 1 or not 0 <= config["max_retries"] <= 2:
        raise ValueError("v0.1 supports one worker and at most two retries")
    if not isinstance(config["allow_fixtures"], bool):
        raise ValueError("allow_fixtures must be boolean")
    if config["allow_fixtures"]:
        raise ValueError("Fixture adapters are test-only and forbidden in mission config")
    if not config["routes"] or any(r not in {"local_direct", "local_tool", "tool"} for r in config["routes"]):
        raise ValueError("Invalid production routes")
    return config


def code_version():
    repo = Path(__file__).resolve().parents[2]
    try:
        commit = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=repo, text=True, stderr=subprocess.DEVNULL).strip()
    except (OSError, subprocess.CalledProcessError):
        commit = "unversioned"
    digest = hashlib.sha256()
    for path in sorted(Path(__file__).parent.rglob("*.py")):
        digest.update(path.relative_to(Path(__file__).parent).as_posix().encode())
        digest.update(path.read_bytes())
    return {"version": __version__, "commit": commit, "source_sha256": digest.hexdigest()}


@contextlib.contextmanager
def worker_lock(root):
    """OS advisory lock is released by the kernel on process death."""
    root = Path(root)
    root.mkdir(parents=True, exist_ok=True)
    with os.fdopen(os.open(root / "worker.lock", os.O_RDWR | os.O_CREAT), "r+b") as handle:
        if os.fstat(handle.fileno()).st_size == 0:
            handle.write(b"0")
            handle.flush()
        handle.seek(0)
        try:
            if os.name == "nt":
                import msvcrt
                msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
            else:
                import fcntl
                fcntl.flock(handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError as exc:
            raise RuntimeError("Another HIVE executor owns this store") from exc
        try:
            yield
        finally:
            handle.seek(0)
            if os.name == "nt":
                msvcrt.locking(handle.fileno(), msvcrt.LK_UNLCK, 1)
            else:
                fcntl.flock(handle.fileno(), fcntl.LOCK_UN)


class Executor:
    def __init__(self, root, config=None):
        self.root = Path(root)
        self.store = Store(self.root)
        self.config = dict(DEFAULT_CONFIG if config is None else config)
        self.owner = f"worker-{os.getpid()}"
        self.stopping = False

    def close(self):
        self.store.close()

    def recover(self):
        recovered = self.store.recover()
        inflight = self.store.get("inflight")
        if recovered and inflight:
            b = self._budget()
            b["wall_s"] += inflight["reserved_wall_s"]
            self.store.set("budget", b)
            self.store.set("inflight", None)
        return recovered

    def _budget(self):
        return self.store.get("budget", {"requests": 0, "tokens_reserved": 0, "tokens_actual": 0, "wall_s": 0.0, "cycles": 0})

    def barrier(self, route=None):
        if self.stopping or (self.root / "STOP").exists():
            return "kill switch"
        b = self._budget()
        if b["wall_s"] >= self.config["max_wall_s"]:
            return "mission wall-time budget exhausted"
        if b["cycles"] >= self.config["max_cycles"]:
            return "mission cycle budget exhausted"
        if sum(p.stat().st_size for p in self.root.rglob("*") if p.is_file()) >= self.config["max_storage_bytes"]:
            return "artifact storage budget exhausted"
        if route and route.startswith("local_"):
            if b["requests"] >= self.config["max_requests"]:
                return "model request budget exhausted"
            if b["tokens_reserved"] + self.config["max_tokens"] > self.config["max_total_tokens"]:
                return "generated-token reservation budget exhausted"
        return None

    def enqueue(self, task, route=None, hypothesis="Verify task with independent evidence", retry_count=0):
        return self.store.enqueue({"task": task, "route": route, "hypothesis": hypothesis, "retry_count": retry_count})

    def _report(self, job, bundle, decision, failure=None):
        # Public reports contain no holdout prompts, answers or individual failures.
        task = job["spec"]["task"]
        private = task["split"] == "holdout"
        report = {
            "cycle_id": job["id"], "build": bundle["build"], "config_hash": bundle["config_hash"],
            "hypothesis": "sealed predeclared holdout evaluation" if private else job["spec"].get("hypothesis", "task verification"),
            "change": f"route={bundle['route']}", "models_tools": bundle["result"].get("model"),
            "test_suite": {"split": task["split"], "size": 1, "seed": self.config["seed"]},
            "baseline": None, "candidate": None if private else bundle["verification"],
            "difference_uncertainty": "Single task; no superiority claim.",
            "verification": "sealed holdout evidence" if private else bundle["evidence_ref"],
            "failure_classification": "sealed" if private else (failure or {}).get("failure_category"),
            "decision": decision, "rollback_checkpoint": self.store.get("current_checkpoint"),
            "next_experiment": "Use only aggregate promotion decision; do not tune from holdout" if private else (failure or {}).get("next_test_that_discriminates_hypotheses", "Compare frozen policy on unseen tasks"),
            "resource_use": self._budget(),
        }
        ref = self.store.put_artifact(report)
        reports = self.root / "reports"
        reports.mkdir(exist_ok=True)
        (reports / f"{job['id']}.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
        return ref

    def run_one(self):
        configured = self.store.get("mission_config_hash")
        if configured is not None and configured != config_hash(self.config):
            raise ValueError("Mission configuration is immutable; existing budgets cannot be reset by changing config")
        if configured is None:
            self.store.set("mission_config_hash", config_hash(self.config))
        barrier = self.barrier()
        if barrier:
            self.store.set("stop_reason", barrier)
            return None
        job = self.store.claim(self.owner)
        if job is None:
            self.store.set("stop_reason", "no eligible work")
            return None
        spec = job["spec"]
        task = spec.get("task")
        if not isinstance(task, dict) or task.get("split") not in {"development", "validation", "holdout"} or task.get("category") not in {"math", "code_repair", "tool_routing", "coordination", "hallucination", "adaptation"}:
            self.store.finish(job["id"], "BLOCKED", {"failure_category": "EVALUATION", "reason": "invalid task contract; correct schema before requeue"}, self.owner, job["generation"])
            return {"id": job["id"], "passed": False, "failure": "invalid task contract"}
        policy = Policy(state=self.store.get("policy"), seed=self.config["seed"])
        champion = Checkpoints(self.store).current()
        selection_policy = Policy(state=champion["policy"]) if champion else policy
        route = spec.get("route") or selection_policy.choose(task["category"], self.config["routes"])
        barrier = self.barrier(route)
        if barrier:
            self.store.transition(job["id"], "RETRY_READY", {"reason": barrier}, self.owner, job["generation"])
            self.store.set("stop_reason", barrier)
            return None
        start = time.monotonic()
        b = self._budget()
        # Reserve before dispatch. Interrupted calls still count against the mission.
        if route.startswith("local_"):
            b["requests"] += 1
            b["tokens_reserved"] += self.config["max_tokens"]
        b["cycles"] += 1
        self.store.set("budget", b)
        run_config = dict(self.config)
        remaining_wall = self.config["max_wall_s"] - b["wall_s"]
        run_config["timeout_s"] = min(run_config["timeout_s"], remaining_wall)
        self.store.set("inflight", {"job": job["id"], "reserved_wall_s": run_config["timeout_s"]})
        try:
            if route.startswith("local_"):
                # One GPU inference across HIVE stores, not merely one per queue.
                with worker_lock(Path(tempfile.gettempdir()) / "hive-local-inference"):
                    result = execute(task, route, run_config)
            else:
                result = execute(task, route, run_config)
        except Exception as exc:
            result = {"output": "", "latency_s": time.monotonic() - start, "tokens": 0,
                      "model": run_config["model"], "request": {}, "error": f"{type(exc).__name__}: {exc}",
                      "failure_category": "IMPLEMENTATION"}
        self.store.transition(job["id"], "VERIFYING", owner=self.owner, generation=job["generation"])
        try:
            verification = verify(task, result)
            if (not isinstance(verification, dict) or type(verification.get("valid")) is not bool
                or type(verification.get("passed")) is not bool
                or type(verification.get("quality")) is not int or verification["quality"] not in (0, 1)
                or type(verification.get("unsupported")) is not int or verification["unsupported"] not in (0, 1)
                or verification["quality"] != int(verification["passed"])
                or (verification["passed"] and not verification["valid"])):
                raise ValueError("Malformed verifier verdict rejected")
            if (type(result.get("tokens")) is not int or not 0 <= result["tokens"] <= self.config["max_tokens"]
                or not isinstance(result.get("latency_s"), (int, float)) or not math.isfinite(result["latency_s"])
                or result["latency_s"] < 0):
                raise ValueError("Malformed or over-budget resource evidence rejected")
        except Exception as exc:
            verification = {"valid": False, "passed": False, "quality": 0, "unsupported": 1,
                            "reason": f"Verifier exception: {type(exc).__name__}: {exc}", "evaluator": "failed"}
            result["failure_category"] = "EVALUATION"
            result["tokens"] = min(self.config["max_tokens"], max(0, result.get("tokens", 0))) if type(result.get("tokens")) is int else 0
            result["latency_s"] = time.monotonic() - start
        score = utility(verification["quality"], verification["unsupported"], result.get("latency_s", 0), result.get("tokens", 0))
        bundle = {"job_id": job["id"], "task": task, "route": route, "config": run_config,
                  "config_hash": config_hash(run_config), "result": result, "verification": verification,
                  "utility": score, "build": code_version()}
        ref = self.store.put_artifact(bundle)
        bundle["evidence_ref"] = ref
        self.store.transition(job["id"], "REVIEWING", {"evidence_ref": ref}, self.owner, job["generation"])
        # Verified outcome does not itself promote a policy.
        if task["split"] == "development" and verification["valid"]:
            # Atomic idempotent feedback prevents a crash replay counting twice.
            self.store.db.execute("BEGIN IMMEDIATE")
            try:
                if not self.store.get("feedback:" + job["id"]):
                    if route.startswith("local_"):
                        environment = {"model": result.get("model"), "digest": result.get("model_digest"), "endpoint": self.config["endpoint"]}
                        previous_environment = self.store.get("learning_environment")
                        if previous_environment is not None and previous_environment != environment:
                            self.store.set("stale_policy", policy.snapshot())
                            policy = Policy(seed=self.config["seed"])
                        self.store.set("learning_environment", environment)
                    policy.observe(task["category"], route, verification["quality"], score, valid=True, split="development")
                    self.store.set("policy", policy.snapshot())
                    self.store.set("feedback:" + job["id"], ref)
                self.store.db.execute("COMMIT")
            except BaseException:
                self.store.db.execute("ROLLBACK")
                raise
        b = self._budget()
        b["tokens_actual"] += max(0, result.get("tokens", 0))
        b["wall_s"] += time.monotonic() - start
        self.store.set("budget", b)
        self.store.set("inflight", None)
        failure = None
        if not verification["passed"]:
            category = result.get("failure_category") or ("MODEL" if verification["valid"] else "EVALUATION")
            failure = triage(job, category, verification["reason"], [ref])
            # Holdout diagnostics are never sent into candidate generation or retries.
            next_spec = failure.get("next_spec") if task["split"] == "development" else None
            if next_spec and spec.get("allow_retry", True) and spec.get("retry_count", 0) < self.config["max_retries"]:
                next_spec = dict(next_spec)
                next_spec.update(task=task, retry_count=spec.get("retry_count", 0) + 1)
                next_spec["route"] = "tool" if route != "tool" else "local_tool"
                next_spec["hypothesis"] = failure.get("next_test_that_discriminates_hypotheses", "Compare independent tool route")
                failure["next_job_id"] = self.store.enqueue_once("retry:" + job["id"], next_spec)
            failure["artifact_ref"] = self.store.put_artifact(failure)
        report_ref = self._report(job, bundle, "REJECT" if not verification["passed"] else "QUARANTINE", failure)
        result_record = {"evidence_ref": ref, "report_ref": report_ref,
                         "passed": verification["passed"], "valid": verification["valid"], "failure": failure}
        if champion and not spec.get("route") and task.get("critical") and verification["valid"] and not verification["passed"]:
            previous_checkpoint = self.store.get("previous_checkpoint")
            if previous_checkpoint:
                Checkpoints(self.store).rollback(previous_checkpoint)
                result_record["automatic_rollback"] = previous_checkpoint
        # The job was reviewed; successful individual observations stay experimental.
        self.store.finish(job["id"], "REJECTED" if not verification["passed"] else "BLOCKED", result_record, self.owner, job["generation"])
        return {"id": job["id"], "route": route, "passed": verification["passed"], "evidence_ref": ref, "failure": failure}

    def loop(self, limit=None):
        results = []
        with worker_lock(self.root):
            recovered = self.recover()
            self.store.set("worker", {"pid": os.getpid(), "started": time.time(), "status": "running"})
            previous = {}
            if __import__("threading").current_thread() is __import__("threading").main_thread():
                for sig in (signal.SIGINT, signal.SIGTERM):
                    previous[sig] = signal.signal(sig, lambda *_: setattr(self, "stopping", True))
            try:
                for _ in range(limit or self.config["max_cycles"]):
                    result = self.run_one()
                    if result is None:
                        break
                    results.append(result)
                else:
                    self.store.set("stop_reason", "requested cycle limit reached")
            finally:
                self.store.set("worker", {"pid": os.getpid(), "status": "stopped", "finished": time.time()})
                for sig, handler in previous.items():
                    signal.signal(sig, handler)
        return results


def inspect_evidence(store, job_id, allow_holdout=False):
    job = store.get_job(job_id)
    result = job.get("result") or {}
    ref = result.get("evidence_ref")
    if not ref:
        raise ValueError("Job has no completed evidence")
    evidence = store.read_artifact(ref)
    if evidence["task"]["split"] == "holdout" and not allow_holdout:
        return {"id": job_id, "sealed": True, "message": "Holdout details excluded from development review"}
    # Rerun deterministic verifier against the immutable output before showing it.
    checked = verify(evidence["task"], evidence["result"])
    if checked != evidence["verification"]:
        raise ValueError("Recorded evaluator evidence does not reproduce")
    return evidence
