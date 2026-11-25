"""Run synthetic objective tasks through HIVE's existing bounded engines.

Preparation never starts Docker or a model runtime. A full run needs the pinned
Docker image and executes only deterministic tool routes with zero model caps.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import time

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from readiness_demo import IMAGE, sha, write  # Reuse existing demo serialization/hash helpers.


def load_plan(path: Path) -> dict:
    plan = json.loads(path.read_text(encoding="utf-8-sig"))
    if (plan.get("version") != 1 or len(plan.get("code_tasks", [])) != 6
            or len(plan.get("structured_data_tasks", [])) != 6
            or plan.get("model_calls_authorized") != 0):
        raise ValueError("objective plan must contain six tasks per family and authorize zero model calls")
    return plan


def _git(repo: Path, *args: str, env: dict) -> bytes:
    return subprocess.run(["git", "-C", str(repo), *args], env=env, stdin=subprocess.DEVNULL,
                          check=True, capture_output=True, timeout=20).stdout


def _snapshot(task: dict, root: Path) -> dict:
    repo = root / "sources" / task["id"]
    repo.mkdir(parents=True, exist_ok=False)
    (repo / "app.py").write_text(task["buggy"], encoding="utf-8", newline="\n")
    cases_path = repo / "verifier.json"
    write(cases_path, task["cases"])
    env = dict(os.environ, GIT_AUTHOR_DATE="2026-11-21T00:00:00Z",
               GIT_COMMITTER_DATE="2026-11-21T00:00:00Z")
    _git(repo, "init", "--quiet", env=env)
    _git(repo, "config", "core.hooksPath", str(repo / ".git" / "disabled-hooks"), env=env)
    _git(repo, "config", "core.autocrlf", "false", env=env)
    _git(repo, "config", "commit.gpgsign", "false", env=env)
    _git(repo, "config", "user.name", "HIVE synthetic objective fixture", env=env)
    _git(repo, "config", "user.email", "fixture@example.invalid", env=env)
    _git(repo, "add", "app.py", "verifier.json", env=env)
    _git(repo, "commit", "--quiet", "-m", "Frozen synthetic objective source", env=env)
    revision = _git(repo, "rev-parse", "HEAD", env=env).decode().strip()
    archive = _git(repo, "archive", "--format=tar", revision, env=env)
    patch = task["candidate"]
    manifest = {
        "schema_version": 1, "id": task["id"],
        "repo": {"path": str(repo), "revision": revision, "source_sha256": sha(archive)},
        "worker_files": ["app.py"], "allowlist": ["app.py"],
        "patches": [{"id": "objective-candidate", "path": "app.py", "content": patch,
                     "sha256": sha(patch.encode("utf-8"))}],
        "verifier": {"protocol": "json_function_v1", "path": "verifier.json",
                     "sha256": sha(cases_path.read_bytes()), "module": "app",
                     "function": task["function"], "cases": task["cases"]},
        "image": {"reference": "python:3.11-slim", "digest": IMAGE},
        "limits": {"timeout_s": 15, "memory_mb": 128, "cpu_count": 1,
                   "pids": 32, "output_bytes": 8192},
        "network": "none", "mounts": "read_only_source_clean_copy",
    }
    manifest_path = root / "manifests" / f"{task['id']}.json"
    write(manifest_path, manifest)
    return {"manifest": str(manifest_path), "manifest_hash": sha(manifest_path.read_bytes()),
            "source_sha256": manifest["repo"]["source_sha256"],
            "revision": revision, "verifier_sha256": manifest["verifier"]["sha256"],
            "patch_sha256": manifest["patches"][0]["sha256"]}


def build_tasks(plan: dict) -> list[dict]:
    from hive.governor import validate_task
    from hive.orchestrator import config_hash
    result = []
    for item in plan["structured_data_tasks"]:
        if "rows_generator" in item:
            pattern = item["rows_generator"]
            rows = [{"id": f"{pattern['id_prefix']}{index:03d}", "group": pattern["group"],
                     "bytes": pattern["bytes"]} for index in range(pattern["count"])]
        else:
            rows = item["rows"]
        task = {"id": item["id"], "category": "structured_data", "split": "development",
                "prompt": "Compute exact inventory count and byte totals by supplied group.",
                "input": {"rows": rows, "allowed_tools": ["summarize_inventory"],
                          "tool_schemas": {"summarize_inventory": {"rows": "supplied rows"}}},
                "expected": {"groups": item["expected"]}, "critical": False,
                "evaluator": "grouped_inventory_v1", "allowed_tools": ["summarize_inventory"],
                "tool_schemas": {"summarize_inventory": {"rows": "supplied rows"}},
                "permissions": {"version": 1, "routes": ["tool"]},
                "success_criteria": "Exact independent count and byte totals for every group."}
        error = validate_task(task)
        if error:
            raise ValueError(f"invalid structured-data plan task {item['id']}: {error}")
        result.append({"kind": "structured_data", "id": task["id"], "task": task,
                       "input_hash": config_hash(task["input"]), "task_hash": config_hash(task)})
    return result


def prepare(plan_path: Path, work: Path) -> dict:
    from hive.code_verifier import validate_manifest
    from hive.orchestrator import DEFAULT_CONFIG, code_version, config_hash
    plan = load_plan(plan_path)
    plan_hash = sha(plan_path.read_bytes())
    index_path = work / "inputs.json"
    if index_path.exists():
        existing = json.loads(index_path.read_text(encoding="utf-8"))
        if existing.get("plan_sha256") != plan_hash:
            raise ValueError("prepared work is bound to another plan")
        from hive.orchestrator import code_version, config_hash
        current_runtime = code_version()
        config_path = Path(existing.get("config", ""))
        if (existing.get("runtime") != current_runtime or not config_path.is_file()
                or existing.get("config_sha256") != sha(config_path.read_bytes())
                or existing.get("runner_sha256") != sha(Path(__file__).resolve().read_bytes())):
            raise ValueError("prepared work is bound to changed runtime, runner, or executor config bytes")
        frozen_config = json.loads(config_path.read_text(encoding="utf-8"))
        if config_hash(frozen_config) != existing.get("config_hash"):
            raise ValueError("prepared executor config identity does not reproduce")
        return existing
    if work.exists() and any(work.iterdir()):
        raise ValueError("objective work directory must be empty or contain its matching inputs.json")
    work.mkdir(parents=True, exist_ok=True)
    code = []
    for item in plan["code_tasks"]:
        row = _snapshot(item, work)
        manifest = json.loads(Path(row["manifest"]).read_text(encoding="utf-8"))
        checked = validate_manifest(manifest)
        if checked["worker_files"] != ["app.py"] or checked["verifier_path"] in checked["worker_files"]:
            raise ValueError("unexpected worker mount scope")
        row.update({"id": item["id"], "input_hash": config_hash(item["cases"]),
                    "task_hash": config_hash({"manifest": manifest, "patch_id": "objective-candidate"}),
                    "patch_ids": ["objective-candidate"]})
        code.append(row)
    data = build_tasks(plan)
    for row in data:
        row["source_sha256"] = code_version()["source_sha256"]
    config = {**DEFAULT_CONFIG, "routes": ["tool"], "max_requests": 0,
              "max_total_tokens": 0, "max_tokens": 0, "max_cycles": 1,
              "max_wall_s": 60, "max_storage_bytes": 16777216,
              "max_retries": 0, "concurrency": 1}
    config_path = work / "executor-config.json"
    write(config_path, config)
    config_sha = sha(config_path.read_bytes())
    frozen_config_hash = config_hash(config)
    for row in code:
        row["config_hash"] = frozen_config_hash
    for row in data:
        row["config_hash"] = frozen_config_hash
    index = {"protocol": "objective-smoke-v1", "plan": str(plan_path.resolve()),
             "plan_sha256": plan_hash, "runtime": code_version(), "config": str(config_path),
             "config_sha256": config_sha, "config_hash": frozen_config_hash,
             "runner_sha256": sha(Path(__file__).resolve().read_bytes()),
             "code_tasks": code, "structured_data_tasks": data,
             "scope": plan["scope"], "model_calls_authorized": 0}
    write(index_path, index)
    return index


def _json_hash(value: object) -> str:
    return sha(json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False,
                          allow_nan=False).encode("utf-8"))


def _run_code(row: dict, work: Path, config: dict) -> dict:
    from hive.code_mission import run_code_mission
    from hive.orchestrator import config_hash
    start = time.monotonic()
    costs = _costs({})
    try:
        result = run_code_mission(row["manifest"], work / "stores" / row["id"],
                                  executor_config=config)
        patches = result.get("patches", {})
        errors = []
        if result.get("status") != "VERIFIED":
            errors.append(result.get("block_reason") or f"mission status: {result.get('status')}")
        if result.get("synthetic") is not False:
            errors.append("code result was synthetic or did not identify execution mode")
        if set(patches) != set(row["patch_ids"]):
            errors.append("code mission patch set differs from the frozen plan")
        for patch_id, patch_result in patches.items():
            verification = patch_result.get("verification", {})
            if (patch_result.get("state") != "VERIFIED" or verification.get("valid") is not True
                    or verification.get("passed") is not True or verification.get("synthetic") is not False):
                errors.append(f"patch {patch_id} rejected: {verification.get('reason', patch_result.get('state'))}")
        output_hash = _json_hash(result)
        budget = result.get("budget") or {}
        costs = _costs(budget)
        if any(value is None for value in costs.values()):
            errors.append("budget fields incomplete; costs unknown")
        elif costs["requests"] != 0 or costs["tokens_reserved"] != 0 or costs["tokens_actual"] != 0:
            errors.append("unexpected model usage in tool-only code mission")
        passes = not errors
    except Exception as exc:
        result, passes, output_hash, budget = {}, False, None, {}
        costs = _costs({})
        errors = [f"{type(exc).__name__}: {exc}"]
    return {"id": row["id"], "kind": "code_mission", "input_hash": row["input_hash"],
            "source_sha256": row["source_sha256"], "config_hash": config_hash(config),
            "output_hash": output_hash, "verifier_passed": passes, "replayed": False,
            "costs": costs, "failures": errors,
            "status": result.get("status"), "_result": result, "_seconds": time.monotonic() - start}


def _run_data(row: dict, work: Path, config: dict) -> dict:
    from hive.orchestrator import Executor, config_hash
    task = row["task"]
    store_path = work / "stores" / row["id"]
    start = time.monotonic()
    executor = None
    try:
        executor = Executor(store_path, config)
        enqueue_key = f"objective-smoke:{row['id']}:{row['task_hash']}:{config_hash(config)}"
        job_id = executor.store.enqueue_once(enqueue_key,
                    {"task": task, "route": "tool", "hypothesis": "Synthetic objective smoke",
                     "retry_count": 0, "allow_retry": False, "learn_feedback": False})
        executor.loop(1)
        job = executor.store.get_job(job_id)
        result = job.get("result") or {}
        bundle = executor.store.read_artifact(result["evidence_ref"]) if result.get("evidence_ref") else {}
        verification = bundle.get("verification", {})
        output_hash = _json_hash(bundle.get("result")) if bundle.get("result") is not None else None
        budget = executor._budget()
        costs = _costs(budget)
        costs_known = all(value is not None for value in costs.values())
        passed = (costs_known and costs["requests"] == 0 and costs["tokens_reserved"] == 0
                  and costs["tokens_actual"] == 0
                  and verification.get("valid") is True and verification.get("passed") is True)
        failures = []
        if not costs_known:
            failures.append("budget fields incomplete; costs unknown")
        elif costs["requests"] != 0 or costs["tokens_reserved"] != 0 or costs["tokens_actual"] != 0:
            failures.append("unexpected model usage in tool-only structured-data task")
        if verification.get("valid") is not True or verification.get("passed") is not True:
            failures.append(verification.get("reason", "verification failed"))
        return {"id": row["id"], "kind": "structured_data", "input_hash": row["input_hash"],
                "source_sha256": row["source_sha256"], "config_hash": config_hash(config), "task_hash": row["task_hash"],
                "output_hash": output_hash, "verifier_passed": passed,
                "replayed": False,
                "costs": costs,
                "failures": failures,
                "status": job.get("state"), "job_id": job_id, "_seconds": time.monotonic() - start}
    except Exception as exc:
        return {"id": row["id"], "kind": "structured_data", "input_hash": row["input_hash"],
                "source_sha256": row["source_sha256"], "config_hash": config_hash(config),
                "task_hash": row["task_hash"], "output_hash": None, "verifier_passed": False,
                "replayed": False, "costs": _costs({}),
                "failures": [f"{type(exc).__name__}: {exc}"], "status": "FAILED",
                "job_id": None, "_seconds": time.monotonic() - start}
    finally:
        if executor is not None:
            executor.close()


def _fresh_replay(work: Path) -> dict:
    """Called in a child Python process: replay code receipts and data evidence."""
    from hive.code_mission import run_code_mission
    from hive.orchestrator import Executor, code_version, config_hash, inspect_evidence
    index = json.loads((work / "inputs.json").read_text(encoding="utf-8"))
    config = json.loads(Path(index["config"]).read_text(encoding="utf-8"))
    replay = {}
    identity_errors = []
    if (code_version() != index.get("runtime")
            or sha(Path(index["config"]).read_bytes()) != index.get("config_sha256")
            or config_hash(config) != index.get("config_hash")
            or sha(Path(__file__).resolve().read_bytes()) != index.get("runner_sha256")):
        identity_errors.append("fresh replay runtime/runner/config differs from prepared identity")
    for row in index["code_tasks"]:
        try:
            if identity_errors:
                raise ValueError(identity_errors[0])
            result = run_code_mission(row["manifest"], work / "stores" / row["id"], executor_config=config)
            replay[row["id"]] = {"output_hash": _json_hash(result), "status": result.get("status"),
                                 "costs": _costs(result.get("budget") or {}), "errors": []}
        except Exception as exc:
            replay[row["id"]] = {"errors": [f"{type(exc).__name__}: {exc}"]}
    replay.update(_fresh_data_replay(work, index=index, config=config,
                                     identity_errors=identity_errors))
    return replay


def _fresh_data_replay(work: Path, *, index: dict | None = None,
                       config: dict | None = None, identity_errors: list | None = None) -> dict:
    """Replay saved structured-data evidence in a fresh process or test call."""
    from hive.orchestrator import Executor, code_version, config_hash, inspect_evidence
    index = index or json.loads((work / "inputs.json").read_text(encoding="utf-8"))
    config = config or json.loads(Path(index["config"]).read_text(encoding="utf-8"))
    identity_errors = list(identity_errors or [])
    if (code_version() != index.get("runtime")
            or sha(Path(index["config"]).read_bytes()) != index.get("config_sha256")
            or config_hash(config) != index.get("config_hash")
            or sha(Path(__file__).resolve().read_bytes()) != index.get("runner_sha256")):
        identity_errors.append("fresh replay runtime/runner/config differs from prepared identity")
    replay = {}
    for row in index["structured_data_tasks"]:
        executor = None
        try:
            executor = Executor(work / "stores" / row["id"], config)
            if identity_errors:
                raise ValueError(identity_errors[0])
            jobs = executor.store.jobs()
            if len(jobs) != 1:
                raise ValueError(f"expected one saved job, found {len(jobs)}")
            evidence = inspect_evidence(executor.store, jobs[0]["id"])
            budget = executor._budget()
            effective = evidence.get("config")
            effective_timeout = effective.get("timeout_s") if isinstance(effective, dict) else None
            auth_config = dict(config)
            effective_config = dict(effective) if isinstance(effective, dict) else {}
            auth_config.pop("timeout_s", None)
            effective_config.pop("timeout_s", None)
            timeout_limit = min(float(config.get("timeout_s", 0)), float(config.get("max_wall_s", 0)))
            mission_hash = executor.store.get("mission_config_hash")
            if (evidence.get("task") != row["task"]
                    or evidence.get("job_id") != jobs[0]["id"]
                    or evidence.get("config_hash") != config_hash(effective)
                    or effective_config != auth_config
                    or not isinstance(effective_timeout, (int, float))
                    or isinstance(effective_timeout, bool)
                    or not (0 < effective_timeout <= timeout_limit)
                    or (mission_hash is not None and mission_hash != row["config_hash"])
                    or evidence.get("build", {}).get("source_sha256") != row.get("source_sha256")
                    or index.get("runtime", {}).get("source_sha256") != row.get("source_sha256")):
                raise ValueError("saved objective evidence does not match the frozen task/config identity")
            replay[row["id"]] = {"output_hash": _json_hash(evidence["result"]),
                                 "status": jobs[0]["state"], "costs": _costs(budget), "errors": []}
        except Exception as exc:
            replay[row["id"]] = {"errors": [f"{type(exc).__name__}: {exc}"]}
        finally:
            if executor is not None:
                executor.close()
    return replay


def _costs(budget: dict) -> dict:
    return {key: budget.get(key) for key in
            ("requests", "tokens_reserved", "tokens_actual", "cycles", "wall_s")}


def _report_success(report: dict) -> bool:
    tasks = report.get("tasks", [])
    return (report.get("task_count") == 12 and len(tasks) == 12
            and report.get("actual_model_requests") == 0
            and all(row.get("costs", {}).get(key) == 0 for row in tasks
                    for key in ("requests", "tokens_reserved", "tokens_actual"))
            and all(row.get("verifier_passed") is True for row in tasks)
            and all(row.get("replayed") is True for row in tasks)
            and report.get("all_verifiers_passed") is True
            and report.get("all_replayed_with_equal_budget") is True
            and not report.get("replay_child_errors")
            and report.get("negative_verifier_probe", {}).get("valid") is True
            and report.get("negative_verifier_probe", {}).get("passed") is False
            and not report.get("negative_verifier_probe", {}).get("failures"))


def run(plan_path: Path, work: Path) -> dict:
    from hive.verifier import verify
    index = prepare(plan_path, work)
    config = json.loads(Path(index["config"]).read_text(encoding="utf-8"))
    tasks = []
    for row in index["code_tasks"]:
        tasks.append(_run_code(row, work, config))
    for row in index["structured_data_tasks"]:
        tasks.append(_run_data(row, work, config))
    try:
        probe_task = index["structured_data_tasks"][0]["task"]
        wrong = verify(probe_task, {"output": json.dumps({"groups": {}}, separators=(",", ":"))})
        negative_probe = {"kind": "structured_data_wrong_output", "valid": wrong["valid"],
                          "passed": wrong["passed"], "reason": wrong["reason"]}
        if not (negative_probe["valid"] is True and negative_probe["passed"] is False):
            negative_probe["failures"] = ["wrong objective output was not rejected"]
    except Exception as exc:
        negative_probe = {"kind": "structured_data_wrong_output", "valid": False,
                          "passed": None, "reason": "negative probe execution failed",
                          "failures": [f"{type(exc).__name__}: {exc}"]}
    try:
        replay_process = subprocess.run([sys.executable, str(Path(__file__).resolve()), "--replay",
                                         "--work", str(work)], cwd=REPO,
                                        env=dict(os.environ, PYTHONPATH=str(REPO / "src")),
                                        capture_output=True, text=True, timeout=240)
        if replay_process.returncode:
            replay = {}
            replay_errors = [replay_process.stderr.strip() or f"replay child exited {replay_process.returncode}"]
        else:
            replay = json.loads(replay_process.stdout)
            replay_errors = []
    except Exception as exc:
        replay = {}
        replay_errors = [f"{type(exc).__name__}: {exc}"]
    for task in tasks:
        saved = replay.get(task["id"], {})
        costs_known = all(value is not None for value in task["costs"].values())
        equal = (costs_known and saved.get("output_hash") == task["output_hash"]
                 and saved.get("costs") == task["costs"])
        task["replayed"] = bool(equal and not saved.get("errors"))
        task["replay_failures"] = saved.get("errors", []) or (replay_errors if not saved else [])
        if not task["replayed"]:
            task["failures"].append("fresh-process replay or budget equality failed")
    # Do not embed full payloads or internal run objects in the compact report.
    compact = [{key: value for key, value in row.items() if not key.startswith("_")}
               for row in tasks]
    report = {"protocol": "objective-smoke-v1", "scope": index["scope"],
              "classification": "SYNTHETIC_DEVELOPMENT_PIPELINE_SMOKE",
              "runner_sha256": index["runner_sha256"],
              "learning_gain_claim": False, "model_calls_authorized": 0,
              "actual_model_requests": (sum(row["costs"]["requests"] for row in compact)
                                         if all(row["costs"]["requests"] is not None for row in compact)
                                         else None),
              "task_count": len(compact), "tasks": compact,
              "negative_verifier_probe": negative_probe,
              "replay_child_errors": replay_errors,
              "all_verifiers_passed": all(row["verifier_passed"] for row in compact),
              "all_replayed_with_equal_budget": all(row["replayed"] for row in compact),
              "report_sha256_excludes_self": True}
    report["passed"] = _report_success(report)
    report["report_sha256"] = _json_hash(report)
    report_path = work / "report.json"
    write(report_path, report)
    return {"report": str(report_path), "tasks": len(compact),
            "all_verifiers_passed": report["all_verifiers_passed"],
              "all_replayed_with_equal_budget": report["all_replayed_with_equal_budget"],
              "passed": report["passed"],
              "actual_model_requests": report["actual_model_requests"]}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--plan", type=Path, default=REPO / "experiments/plans/objective-smoke.json")
    parser.add_argument("--work", type=Path, default=REPO / ".hive/objective-smoke")
    parser.add_argument("--prepare-only", action="store_true")
    parser.add_argument("--replay", action="store_true", help=argparse.SUPPRESS)
    parser.add_argument("--replay-data", action="store_true", help=argparse.SUPPRESS)
    args = parser.parse_args()
    work = args.work.absolute()
    sys.path.insert(0, str(REPO / "src"))
    if args.replay:
        print(json.dumps(_fresh_replay(work), ensure_ascii=False, sort_keys=True))
    elif args.replay_data:
        print(json.dumps(_fresh_data_replay(work), ensure_ascii=False, sort_keys=True))
    elif args.prepare_only:
        index = prepare(args.plan.resolve(), work)
        print(json.dumps({"prepared": str(work / "inputs.json"), "tasks": 12,
                          "model_calls_authorized": 0, "source_fixtures": 6,
                          "docker_started": False, "plan_sha256": index["plan_sha256"]}, indent=2))
    else:
        summary = run(args.plan.resolve(), work)
        print(json.dumps(summary, indent=2))
        if not summary["passed"]:
            raise SystemExit(1)


if __name__ == "__main__":
    main()
