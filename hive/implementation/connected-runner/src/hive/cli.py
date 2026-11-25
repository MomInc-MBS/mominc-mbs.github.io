"""HIVE CLI: all commands are local; no external action tools are exposed."""
from __future__ import annotations
import argparse
import json
import os
import sys
from collections import Counter
from pathlib import Path

from .checkpoint_manager import Checkpoints
from .context_policy import ContextPolicy, DispatchBlocked
from .learning_policy import Policy
from .memory_store import MemoryStore
from .orchestrator import Executor, code_version, config_hash, inspect_evidence, load_config, worker_lock
from .storage import Store, _alive
from .task_packet import TaskPacketCompiler
from .task_spec import load_tasks
from .verifier import verify


def parser():
    p = argparse.ArgumentParser(prog="hive")
    p.add_argument("--store", default=".hive", help="Durable local state directory")
    sub = p.add_subparsers(dest="command", required=True)
    doctor = sub.add_parser("doctor"); doctor.add_argument("--config")
    doctor.add_argument("--offline", action="store_true", help="Do not contact endpoints or sandbox daemon")
    tasks = sub.add_parser("tasks"); tasks.add_argument("--seed", type=int, default=42)
    run = sub.add_parser("run")
    task_input = run.add_mutually_exclusive_group(required=True)
    task_input.add_argument("--task"); task_input.add_argument("--task-file")
    run.add_argument("--config")
    run.add_argument("--route", choices=["auto", "local_direct", "local_tool", "tool"], default="auto")
    run.add_argument("--enqueue-only", action="store_true")
    video = sub.add_parser("video", help="Run a bounded, resumable video subtitle and clip mission")
    video.add_argument("--mission", required=True); video.add_argument("--config")
    data = sub.add_parser("data", help="Run a pinned CSV/JSON structured-data mission")
    data.add_argument("--manifest", required=True)
    data.add_argument("--approval", help="Separate finite operator approval for local inference")
    learn = sub.add_parser("learn", help="Run a frozen, source-disjoint quarantined candidate comparison")
    learn.add_argument("--plan", required=True)
    learn.add_argument("--approval")
    console = sub.add_parser("console", help="Start the authenticated local operator console")
    console.add_argument("--allowed-root", required=True)
    console.add_argument("--port", type=int, default=8765)
    console.add_argument("--approval")
    op = sub.add_parser("operator", help="Operator Prototype: retained M2 capabilities on owner inputs (zero model calls)")
    op_cmd = op.add_subparsers(dest="op_command", required=True)
    op_launch = op_cmd.add_parser("launch", help="Import the accepted capabilities (idempotent) and open the console")
    op_launch.add_argument("--allowed-root", required=True); op_launch.add_argument("--port", type=int, default=8765)
    op_launch.add_argument("--no-browser", action="store_true")
    op_cmd.add_parser("import"); op_cmd.add_parser("status"); op_cmd.add_parser("readiness"); op_cmd.add_parser("export-bundle")
    op_run = op_cmd.add_parser("run"); op_run.add_argument("op", choices=["convert", "merge"]); op_run.add_argument("sources", nargs="+")
    op_run.add_argument("--allowed-root", required=True)
    op_goal = op_cmd.add_parser("goal", help="Submit a goal; a typed plan is built from registered capabilities and executed")
    op_goal.add_argument("text"); op_goal.add_argument("sources", nargs="+"); op_goal.add_argument("--allowed-root", required=True)
    op_goal.add_argument("--deliverable", choices=["canonical_rows", "group_summary", "inventory_diff"])
    op_goal.add_argument("--allow-discovery", action="store_true", help="Let an unresolved typed gap open ONE bounded C3 discovery experiment")
    op_disc = op_cmd.add_parser("discover", help="C3 capability-gap discovery experiments").add_subparsers(dest="disc_command", required=True)
    op_disc.add_parser("run", help="Run or resume one frozen experiment to a terminal state").add_argument("exp_id")
    op_disc.add_parser("list")
    for name in ("rollback", "reselect", "revoke"):
        op_cmd.add_parser(name).add_argument("op", choices=["convert", "merge"])
    op_snap = op_cmd.add_parser("snapshot-dir", help="Preparation adapter inventory-snapshot-v1: folder -> id,group,bytes CSV")
    op_snap.add_argument("directory"); op_snap.add_argument("--out", required=True); op_snap.add_argument("--group-by", choices=["top", "ext"], default="top")
    op_snap.add_argument("--format", choices=["csv", "json"], default="csv")
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
    mission = sub.add_parser("mission", help="Run a governed video or isolated code mission")
    mission_commands = mission.add_subparsers(dest="mission_command", required=True)
    mission_run = mission_commands.add_parser("run")
    mission_run.add_argument("--manifest", required=True)
    mission_run.add_argument("--config")
    mission_run.add_argument("--approval")
    mission_run.add_argument("--allowed-root")
    pressure = sub.add_parser("pressure", help="H01-H11 engineering pressure fixtures and evidence")
    pressure_commands = pressure.add_subparsers(dest="pressure_command", required=True)
    pressure_commands.add_parser("list")
    pressure_validate = pressure_commands.add_parser("validate")
    pressure_validate.add_argument("--manifest", required=True)
    pressure_run = pressure_commands.add_parser("run")
    pressure_run.add_argument("--test", required=True)
    pressure_run.add_argument("--manifest")
    pressure_run.add_argument("--mode", choices=("fixture", "real"), default="fixture")
    pressure_run.add_argument("--output")
    pressure_compare = pressure_commands.add_parser("compare")
    pressure_compare.add_argument("--reports", nargs="+", required=True)
    pressure_compare.add_argument("--output")
    pressure_report = pressure_commands.add_parser("report")
    pressure_report.add_argument("--root")
    pressure_report.add_argument("--output")
    queue = sub.add_parser("queue", help="Inspect the durable authorized engineering backlog")
    queue_commands = queue.add_subparsers(dest="queue_command", required=True)
    queue_commands.add_parser("status")
    queue_init = queue_commands.add_parser("init")
    queue_init.add_argument("--manifest", required=True)
    ooda = sub.add_parser("ooda", help="Durable OODA experiment on a pinned allowlisted Git source (tool-only, zero model calls)")
    ooda_commands = ooda.add_subparsers(dest="ooda_command", required=True)
    ooda_run = ooda_commands.add_parser("run", help="Run or resume/replay one experiment from a frozen manifest")
    ooda_run.add_argument("--manifest", required=True)
    ooda_run.add_argument("--allowlist", help="Override the frozen source allowlist (default configs/experiment_sources.allowlist.json)")
    ooda_run.add_argument("--report-dir", help="Write receipt.json and REPORT.md here")
    ooda_verify = ooda_commands.add_parser("verify", help="Recompute every hash link of a finished experiment (no network)")
    ooda_verify.add_argument("--experiment-id", required=True)
    ooda_verify.add_argument("--manifest", help="Anchor the check: the operator's manifest file must equal the frozen manifest and the frozen allowlist must be the canonical one")
    ooda_cmp = ooda_commands.add_parser("compare", help="Slice E: preregistered P0/baseline/learning-off/candidate comparison (tool-only; writes <out>/receipt.json + REPORT.md)")
    ooda_cmp.add_argument("--plan", required=True)
    ooda_cmp.add_argument("--out", required=True)
    ooda_cmp.add_argument("--allowlist", help="Override the frozen source allowlist")
    reproduce = sub.add_parser("reproduce"); reproduce.add_argument("--index", required=True)
    context = sub.add_parser("context", help="Context governance report and controls")
    context_commands = context.add_subparsers(dest="context_command", required=True)
    context_report = context_commands.add_parser("report")
    context_stop = context_commands.add_parser("emergency-stop")
    context_stop.add_argument("--reason", default="operator emergency stop")
    context_clear = context_commands.add_parser("clear-emergency-stop")
    context_decide = context_commands.add_parser("decide", help="Deterministic governance decision (no model calls)")
    context_decide.add_argument("--kind", required=True)
    context_decide.add_argument("--json", dest="payload", default="{}", help="Decision payload as a JSON object")
    return p


def main(argv=None):
    args = parser().parse_args(argv)
    store = None
    try:
        if args.command == "doctor":
            config = load_config(args.config)
            from .diagnostics import doctor
            output = doctor(config, args.store, offline=args.offline)
        elif args.command == "tasks":
            output = [{"id": t["id"], "category": t["category"]} for t in load_tasks("development", args.seed)]
        elif args.command == "video":
            from .video_mission import run_mission
            output = run_mission(args.store, args.mission, args.config)
        elif args.command == "data":
            from .structured_data import run_structured_mission
            from .prototype_approval import load_prototype_config
            manifest = json.loads(Path(args.manifest).read_text(encoding="utf-8-sig"))
            config = load_prototype_config(args.approval, args.store, manifest["allowed_root"])
            output = run_structured_mission(manifest, args.store, executor_config=config)
        elif args.command == "console":
            from .console import serve_console
            serve_console(args.store, allowed_root=args.allowed_root, port=args.port, approval_path=args.approval)
            return 0
        elif args.command == "operator":
            from . import operator_runtime as O
            c = args.op_command
            if c == "launch":
                from .console import serve_console
                s = Store(args.store); print(json.dumps({"import": O.import_bundle(s)})); s.close()
                serve_console(args.store, allowed_root=args.allowed_root, port=args.port, open_browser=not args.no_browser)
                return 0
            if c == "export-bundle":
                output = O.export_bundle()
            elif c in ("import", "rollback", "reselect", "revoke"):
                s = Store(args.store)
                try:
                    output = O.import_bundle(s) if c == "import" else {"event": getattr(O, c)(s, args.op)}
                finally:
                    s.close()
            elif c == "status":
                output = O.status(args.store)
            elif c == "readiness":
                output = O.readiness(args.store)
            elif c == "goal":
                from . import goal_runner as G
                contract, inputs = G.prepare(args.store, args.allowed_root, args.text, args.sources, args.deliverable, allow_discovery=args.allow_discovery)
                output = contract if contract.get("state") == "NEEDS_CLARIFICATION" else G.run_goal(args.store, contract, inputs)
            elif c == "discover":
                from . import discovery as D
                if args.disc_command == "list":
                    s = Store(args.store); output = D.discoveries(s); s.close()
                else:
                    D.recover(args.store)
                    output = D.run_experiment(args.store, args.exp_id)
            elif c == "snapshot-dir":
                data = O.snapshot_dir(args.directory, args.group_by, args.format)
                Path(args.out).write_bytes(data)
                output = {"adapter": O.ADAPTER, "out": args.out, "format": args.format, "sha256": O._sha(data)}
            else:
                from .console import _bounded_read, _under
                root = Path(args.allowed_root).resolve(strict=True)
                files = [(p.name, _bounded_read(p)) for p in (_under(root, x) for x in args.sources)]
                output = O.run_task(args.store, args.op, files)
        elif args.command == "learn":
            from .prototype_learning import prepare_prototype_learning, run_prototype_learning
            from .prototype_approval import load_prototype_config
            prepared = prepare_prototype_learning(args.plan)
            config = load_prototype_config(args.approval, args.store, prepared["plan"]["development"]["allowed_root"])
            output = run_prototype_learning(prepared["plan"], args.store, executor_config=config)
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
                    policy = ContextPolicy(store_root=Path(args.store))
                    model_name = config.get("model", "local-tool")
                    if model_name not in policy.models:
                        resolved = policy.model_for_endpoint(config.get("endpoint", ""))
                        if resolved is not None:
                            model_name = resolved.name
                    model = policy.model(model_name)
                    prompt_text = task.get("prompt", "") or ""
                    if not isinstance(prompt_text, str):
                        prompt_text = json.dumps(prompt_text)
                    input_text = task.get("input", "") or ""
                    if not isinstance(input_text, str):
                        input_text = json.dumps(input_text)
                    requested_tokens = len((prompt_text + input_text).encode("utf-8")) // 4 + 1
                    gate = policy.preflight(
                        task_id=task["id"],
                        model_name=model_name,
                        nested_depth=0,
                        requested_tokens=requested_tokens,
                        dry_run=policy.dry_run,
                    )
                    if not gate["eligible"]:
                        raise DispatchBlocked(
                            f"preflight gate blocked dispatch for {task['id']}: "
                            + "; ".join(gate["reasons"])
                        )
                    job_id = executor.enqueue(task, None if args.route == "auto" else args.route)
                    output = {"queued": job_id, "preflight": gate} if args.enqueue_only else {"queued": job_id, "preflight": gate, "results": executor.loop(1)}
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
        elif args.command == "mission":
            from .mission import run_mission_manifest
            config = None
            if args.approval:
                if args.config or not args.allowed_root:
                    raise ValueError("--approval requires --allowed-root and cannot combine with --config")
                from .prototype_approval import load_prototype_config
                config = load_prototype_config(args.approval, args.store, args.allowed_root)
            output = run_mission_manifest(args.manifest, args.store, config_path=args.config, executor_config=config)
        elif args.command == "queue":
            from .work_queue import BuildQueue
            store = Store(args.store)
            queue = BuildQueue(store)
            output = (queue.initialize(json.loads(Path(args.manifest).read_text(encoding="utf-8-sig")))
                      if args.queue_command == "init" else queue.status())
        elif args.command == "ooda":
            from .experiment_driver import DEFAULT_ALLOWLIST, ExperimentDriver
            if args.ooda_command == "compare":
                from .experiment_compare import run_compare
                r = run_compare(args.plan, args.out, allowlist=getattr(args, "allowlist", None) or DEFAULT_ALLOWLIST, lineage_store=Store(args.store))
                print(json.dumps({"compare_id": r["compare_id"], "decisions": {c["candidate"]: c["decision"] for c in r["candidates"]},
                                  "strongest_baseline": r["strongest_baseline"], "requests": r["requests"], "result_sha256": r["result_sha256"]}, indent=2))
                return 0
            driver = ExperimentDriver(args.store, allowlist_path=getattr(args, "allowlist", None) or DEFAULT_ALLOWLIST)
            if args.ooda_command == "verify":
                output = driver.verify(args.experiment_id, manifest=args.manifest)
                print(json.dumps(output, indent=2, allow_nan=False))
                return 0 if output["ok"] else 1
            output = driver.run(args.manifest, report_dir=args.report_dir)
            print(json.dumps(output, indent=2, allow_nan=False))
            return {"ACCEPT": 0, "STOPPED": 3, "BLOCKED_PREFLIGHT": 3}.get(output["status"], 1)
        elif args.command == "pressure":
            from . import pressure
            if args.pressure_command == "list":
                output = pressure.list_tests()
            elif args.pressure_command == "validate":
                output = pressure.validate(json.loads(Path(args.manifest).read_text(encoding="utf-8-sig")))
            elif args.pressure_command == "run":
                manifest = json.loads(Path(args.manifest).read_text(encoding="utf-8-sig")) if args.manifest else None
                output = pressure.run(args.test, manifest, root=args.store, mode=args.mode)
            elif args.pressure_command == "compare":
                output = pressure.compare([json.loads(Path(path).read_text(encoding="utf-8-sig")) for path in args.reports])
            else:
                output = pressure.report(args.root or args.store)
            if getattr(args, "output", None):
                from .integration import _write_report
                _write_report(args.output, output)
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
            elif args.command == "context":
                policy = ContextPolicy(store_root=Path(args.store))
                if args.context_command == "report":
                    output = policy.snapshot()
                elif args.context_command == "emergency-stop":
                    policy.request_emergency_stop(args.reason)
                    output = {"emergency_stop": True, "reason": args.reason}
                elif args.context_command == "clear-emergency-stop":
                    policy.clear_emergency_stop()
                    output = {"emergency_stop": False, "cleared": True}
                elif args.context_command == "decide":
                    from .decision_gateway import decide
                    payload = json.loads(args.payload)
                    if not isinstance(payload, dict):
                        raise ValueError("--json must be a JSON object")
                    output = decide({**payload, "kind": args.kind}, policy).as_dict()
        print(json.dumps(output, indent=2, allow_nan=False))
        return 0
    except (ValueError, KeyError, OSError, RuntimeError) as exc:
        print(json.dumps({"error": f"{type(exc).__name__}: {exc}"}), file=sys.stderr)
        return 2
    finally:
        if store:
            store.close()
