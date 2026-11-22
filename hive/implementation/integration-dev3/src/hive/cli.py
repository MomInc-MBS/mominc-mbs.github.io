"""HIVE CLI: all commands are local; no external action tools are exposed."""
from __future__ import annotations
import argparse
import json
import os
import platform
import sys
from collections import Counter
from pathlib import Path

from .checkpoint_manager import Checkpoints
from .learning_policy import Policy
from .model_registry import discover
from .orchestrator import Executor, code_version, config_hash, inspect_evidence, load_config, worker_lock
from .storage import Store, _alive
from .task_spec import load_tasks
from .verifier import verify


def parser():
    p = argparse.ArgumentParser(prog="hive")
    p.add_argument("--store", default=".hive", help="Durable local state directory")
    sub = p.add_subparsers(dest="command", required=True)
    doctor = sub.add_parser("doctor"); doctor.add_argument("--config")
    tasks = sub.add_parser("tasks"); tasks.add_argument("--seed", type=int, default=42)
    run = sub.add_parser("run")
    task_input = run.add_mutually_exclusive_group(required=True)
    task_input.add_argument("--task"); task_input.add_argument("--task-file")
    run.add_argument("--config")
    run.add_argument("--route", choices=["auto", "local_direct", "local_tool", "tool"], default="auto")
    run.add_argument("--enqueue-only", action="store_true")
    video = sub.add_parser("video", help="Run a bounded, resumable video subtitle and clip mission")
    video.add_argument("--mission", required=True); video.add_argument("--config")
    loop = sub.add_parser("loop"); loop.add_argument("--config"); loop.add_argument("--limit", type=int)
    sub.add_parser("status"); sub.add_parser("stop"); sub.add_parser("resume")
    review = sub.add_parser("review", aliases=["inspect"]); review.add_argument("--run", required=True)
    compare = sub.add_parser("compare"); compare.add_argument("--a", required=True); compare.add_argument("--b", required=True)
    rollback = sub.add_parser("rollback")
    rollback_target = rollback.add_mutually_exclusive_group(required=True)
    rollback_target.add_argument("--checkpoint")
    rollback_target.add_argument("--experimental", metavar="ARTIFACT_REF")
    experiment = sub.add_parser("experiment"); experiment.add_argument("--config"); experiment.add_argument("--output")
    adaptive = sub.add_parser("adaptive", help="Execute bounded, persistent adaptive experiment rounds")
    adaptive.add_argument("--config"); adaptive.add_argument("--output")
    adaptive.add_argument("--rounds", type=int, default=3)
    adaptive.add_argument("--seed", type=int, default=20261121)
    integration = sub.add_parser("integration", help="Run the bounded governed integration mission")
    integration.add_argument("--manifest", required=True); integration.add_argument("--config"); integration.add_argument("--output")
    reproduce = sub.add_parser("reproduce"); reproduce.add_argument("--index", required=True)
    return p


def main(argv=None):
    args = parser().parse_args(argv)
    store = None
    try:
        if args.command == "doctor":
            config = load_config(args.config)
            output = {"runtime": discover(config["endpoint"]), "python": sys.version, "platform": platform.platform(),
                      "build": code_version(), "config_hash": config_hash(config), "budgets": config}
        elif args.command == "tasks":
            output = [{"id": t["id"], "category": t["category"]} for t in load_tasks("development", args.seed)]
        elif args.command == "video":
            from .video_mission import run_mission
            output = run_mission(args.store, args.mission, args.config)
        elif args.command in ("run", "loop"):
            config = load_config(args.config)
            executor = Executor(args.store, config)
            try:
                if args.command == "run":
                    if args.task_file:
                        path = Path(args.task_file)
                        if path.stat().st_size > 65536:
                            raise ValueError("Task file exceeds 64 KiB")
                        task = json.loads(path.read_text(encoding="utf-8-sig"))
                        required = {"id", "category", "split", "prompt", "input", "expected", "critical", "evaluator", "allowed_tools", "tool_schemas"}
                        if not isinstance(task, dict) or not required <= task.keys() or task["split"] != "development":
                            raise ValueError("Task file must be a complete development task contract")
                        if not isinstance(task.get("success_criteria"), str) or not task["success_criteria"].strip():
                            raise ValueError("User task must declare success_criteria before execution")
                    else:
                        tasks = load_tasks("development", config["seed"])
                        task = next((t for t in tasks if t["id"] == args.task), None)
                    if task is None:
                        raise ValueError("Unknown development task; run 'hive tasks'. Holdout only runs in preregistered campaigns.")
                    job_id = executor.enqueue(task, None if args.route == "auto" else args.route)
                    output = {"queued": job_id} if args.enqueue_only else {"queued": job_id, "results": executor.loop(1)}
                else:
                    if args.limit is not None and args.limit <= 0:
                        raise ValueError("limit must be positive")
                    output = {"results": executor.loop(args.limit), "stop_reason": executor.store.get("stop_reason")}
            finally:
                executor.close()
        elif args.command == "experiment":
            from .lab import run_campaign
            output = run_campaign(args.store, load_config(args.config), args.output)
        elif args.command == "adaptive":
            from .adaptive import run_adaptive
            output = run_adaptive(args.store, load_config(args.config), rounds=args.rounds,
                                  seed=args.seed, output_path=args.output)
        elif args.command == "integration":
            from .integration import run_integration
            output = run_integration(args.store, args.manifest, args.config, args.output)
        else:
            store = Store(args.store)
            if args.command == "status":
                worker = store.get("worker")
                if worker and worker["status"] == "running" and not _alive(worker["pid"]):
                    worker = {**worker, "status": "abandoned"}
                output = {"jobs": dict(Counter(j["state"] for j in store.jobs())), "budget": store.get("budget"),
                          "worker": worker, "stop_reason": store.get("stop_reason"), "champion": store.get("current_checkpoint"),
                          "campaign": store.get("campaign"), "next_research": store.get("next_research"),
                          "adaptive": store.get("adaptive_campaign"),
                          "kill_switch": (Path(args.store) / "STOP").exists(), "policy_hash": config_hash(store.get("policy"))}
            elif args.command == "stop":
                (Path(args.store) / "STOP").write_text("Operator stop requested\n", encoding="utf-8")
                output = {"stopped": "No new dispatch; in-flight call completes within timeout"}
            elif args.command == "resume":
                with worker_lock(args.store):
                    (Path(args.store) / "STOP").unlink(missing_ok=True)
                    recovered = store.recover()
                    for job in store.jobs():
                        if job["state"] == "RETRY_READY":
                            store.transition(job["id"], "QUEUED", {"reason": "explicit resume"})
                output = {"recovered": recovered, "note": "Rerun the original loop/adaptive command with the same config; budgets persist"}
            elif args.command in ("review", "inspect"):
                output = inspect_evidence(store, args.run)
            elif args.command == "compare":
                a, b = inspect_evidence(store, args.a), inspect_evidence(store, args.b)
                if a.get("sealed") or b.get("sealed"):
                    raise ValueError("Holdout details are sealed")
                if a["task"] != b["task"]:
                    raise ValueError("Paired comparison requires the exact same task")
                output = {"quality_delta": a["verification"]["quality"] - b["verification"]["quality"],
                          "utility_delta": a["utility"] - b["utility"], "n": 1, "status": "descriptive only"}
            elif args.command == "rollback":
                with worker_lock(args.store):
                    if args.experimental:
                        from .integration import restore_experimental
                        output = restore_experimental(store, args.experimental)
                    else:
                        Checkpoints(store).rollback(args.checkpoint)
                        output = {"checkpoint": args.checkpoint, "rolled_back": True}
            elif args.command == "reproduce":
                index = store.read_artifact(args.index)
                for ref in index["refs"]:
                    ev = store.read_artifact(ref)
                    if verify(ev["task"], ev["result"]) != ev["verification"]:
                        raise ValueError("Deterministic verification does not reproduce")
                state = store.get("frozen_candidate")
                if config_hash(Policy(state=state).snapshot()) != index["candidate_hash"]:
                    raise ValueError("Restored policy differs")
                output = {"verified_artifacts": len(index["refs"]), "policy_restored": True}
        print(json.dumps(output, indent=2, allow_nan=False))
        return 0
    except (ValueError, KeyError, OSError, RuntimeError) as exc:
        print(json.dumps({"error": f"{type(exc).__name__}: {exc}"}), file=sys.stderr)
        return 2
    finally:
        if store:
            store.close()
