"""Bounded repository repair missions through HIVE's shared Executor pipeline."""
from __future__ import annotations

import hashlib
import json
import os
import stat
import tempfile
import difflib
import uuid
from pathlib import Path, PurePosixPath

from .adapters.isolation import DockerIsolation, FixtureIsolation, SandboxUnavailable, StopRequested
from .code_verifier import (MissionValidationError, _git, extract_clean_snapshot,
                            validate_manifest, verify_code_task_output)
from .orchestrator import DEFAULT_CONFIG, Executor, code_version, config_hash, inspect_evidence, worker_lock
from .storage import Store
from .verifier import verify


def _reject_store_reparse(path: Path) -> None:
    absolute = path.absolute()
    probe = Path(absolute.anchor)
    for part in absolute.parts[1:]:
        probe = probe / part
        if not probe.exists() and not probe.is_symlink():
            continue
        try:
            reparse = bool(probe.lstat().st_file_attributes & getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400))
        except (AttributeError, OSError):
            reparse = probe.is_symlink()
        if reparse:
            raise MissionValidationError("mission store contains a symlink or reparse point")


def _event(store: Store, key: str, payload: dict) -> str:
    ref = store.put_artifact(payload)
    state = store.get(key)
    refs = list(state.get("events", []))
    if ref not in refs:
        refs.append(ref)
    state["events"] = refs
    state["last_event"] = ref
    store.set(key, state)
    return ref


def _code_task(manifest: dict, patch: dict, operation_key: str) -> dict:
    return {"id": f"code-{manifest['id']}-{patch['id']}", "category": "code_mission",
            "split": "development", "prompt": "Run the pinned isolated code function contract.",
            "input": {"manifest": manifest, "patch_id": patch["id"], "operation_key": operation_key},
            "expected": {}, "critical": False, "evaluator": "code_mission_v1",
            "allowed_tools": ["isolated_code"],
            "tool_schemas": {"isolated_code": {"manifest_id": "string", "patch_id": "string"}},
            "permissions": {"version": 1, "routes": ["tool"]}}


def execute_code_task(task: dict, config: dict) -> dict:
    """Trusted deterministic action invoked only by Executor route=tool."""
    manifest = task["input"]["manifest"]
    validated = validate_manifest(manifest)
    patch = next(item for item in validated["patches"] if item["id"] == task["input"]["patch_id"])
    operation_key = task["input"]["operation_key"]
    adapter = config.get("isolation_adapter") or DockerIsolation()
    if not isinstance(adapter, (DockerIsolation, FixtureIsolation)):
        raise MissionValidationError("unsupported code mission sandbox adapter")
    expected = {**validated, "patch": patch, "operation_key": operation_key}
    if isinstance(adapter, FixtureIsolation):
        fixture = manifest.get("synthetic_fixture")
        if not isinstance(fixture, dict) or fixture.get("synthetic") is not True:
            raise MissionValidationError("FixtureIsolation requires an explicit synthetic_fixture manifest record")
        isolated = adapter.execute({"fixture_result": fixture})
        receipt = dict(isolated.receipt)
        receipt.update(operation_key=operation_key, source_sha256=validated["source_sha256"],
                       verifier_sha256=validated["verifier_sha256"], patch_sha256=patch["sha256"])
        # Fixture mode is evidence about controller mechanics only. It never
        # verifies that a repository patch works.
        return {"receipt": receipt, "synthetic": True}

    with tempfile.TemporaryDirectory(prefix="hive-code-worker-") as temp_name:
        clean = Path(temp_name) / "worker"
        extract_clean_snapshot(validated, clean)
        target = clean.joinpath(*PurePosixPath(patch["path"]).parts)
        if target.is_symlink() or not target.is_file():
            raise MissionValidationError("patch target in clean worker mount is not a regular file")
        target.write_text(patch["content"], encoding="utf-8", newline="")
        target.chmod(0o644)
        request = {"repo_copy": str(clean), "command": validated["command"],
                   "image": validated["image"], "limits": validated["limits"],
                   "stop_check": lambda: ((Path(config.get("_store_root", ".")) / "STOP").exists()
                                           or (config.get("_cancel_file") and Path(config["_cancel_file"]).exists()))}
        isolated = adapter.execute(request)
    receipt = dict(isolated.receipt)
    if receipt.get("stopped") is True:
        raise StopRequested("STOP interrupted the isolated code task")
    receipt.update(operation_key=operation_key, source_sha256=validated["source_sha256"],
                   verifier_sha256=validated["verifier_sha256"], patch_sha256=patch["sha256"],
                   suite_sha256=validated["suite_sha256"])
    return {"receipt": receipt, "synthetic": False}


def _atomic_output(root: Path, relative: str, content: bytes, limit: int) -> str:
    target = root / relative
    parent = target.parent
    _reject_store_reparse(parent)
    parent.mkdir(parents=True, exist_ok=True)
    _reject_store_reparse(target)
    if target.exists():
        if target.read_bytes() != content:
            raise RuntimeError("immutable mission output already exists with different content")
        return str(target)
    if (root / "STOP").exists():
        raise RuntimeError("STOP prevents mission output commit")
    current = sum(path.stat().st_size for path in root.rglob("*") if path.is_file())
    if current + len(content) > limit:
        raise RuntimeError("mission artifact storage budget prevents output commit")
    temp = parent / ("." + target.name + "." + uuid.uuid4().hex + ".tmp")
    with temp.open("xb") as handle:
        handle.write(content)
        handle.flush()
        os.fsync(handle.fileno())
    os.replace(temp, target)
    return str(target)


def _write_named_outputs(root: Path, manifest: dict, validated: dict, state: dict, store: Store, limit: int) -> dict:
    target_dir = Path("output") / "code" / manifest["id"]
    reports = {}
    trace = []
    for patch_id, record in state.get("patches", {}).items():
        patch = next(p for p in validated["patches"] if p["id"] == patch_id)
        original = _git(Path(validated["repo_path"]), "show", f"{validated['revision']}:{patch['path']}", binary=True).decode("utf-8", errors="replace")
        diff = "\n".join(difflib.unified_diff(original.splitlines(), patch["content"].splitlines(),
                                                  fromfile="a/" + patch["path"], tofile="b/" + patch["path"], lineterm="")) + "\n"
        job = store.get_job(record["job_id"])
        result = job.get("result") or {}
        evidence = store.read_artifact(result["evidence_ref"]) if result.get("evidence_ref") else {}
        output = json.loads((evidence.get("result") or {}).get("output") or "{}")
        test_report = {"job_id": job["id"], "patch_id": patch_id, "operation_key": record["operation_key"],
                       "source_sha256": validated["source_sha256"], "verifier_sha256": validated["verifier_sha256"],
                       "suite_sha256": validated["suite_sha256"], "receipt": output.get("receipt"),
                       "verification": evidence.get("verification"), "synthetic": output.get("synthetic", False)}
        verdict = {"mission_id": manifest["id"], "patch_id": patch_id,
                   "status": "SYNTHETIC_ONLY" if output.get("synthetic") and result.get("passed") else
                             ("VERIFIED" if result.get("passed") else "FAILED"),
                   "verification": evidence.get("verification"), "evidence_ref": result.get("evidence_ref")}
        reports[patch_id] = {
            "patch.diff": _atomic_output(root, (target_dir / patch_id / "patch.diff").as_posix(), diff.encode("utf-8"), limit),
            "test-report.json": _atomic_output(root, (target_dir / patch_id / "test-report.json").as_posix(),
                                                json.dumps(test_report, ensure_ascii=False, sort_keys=True, indent=2).encode("utf-8"), limit),
            "verdict.json": _atomic_output(root, (target_dir / patch_id / "verdict.json").as_posix(),
                                           json.dumps(verdict, ensure_ascii=False, sort_keys=True, indent=2).encode("utf-8"), limit)}
        for index, row in enumerate(job.get("history", [])):
            trace.append({"patch_id": patch_id, "job_id": job["id"], "event_index": index, **row})
    reports["trace.jsonl"] = _atomic_output(root, (target_dir / "trace.jsonl").as_posix(),
                                              ("".join(json.dumps(row, sort_keys=True, ensure_ascii=False) + "\n" for row in trace)).encode("utf-8"),
                                              limit)
    return reports


def _named_output_hashes(outputs: dict) -> dict:
    hashes = {}
    for key, value in outputs.items():
        if isinstance(value, dict):
            hashes[key] = {name: hashlib.sha256(Path(path).read_bytes()).hexdigest()
                           for name, path in value.items()}
        else:
            hashes[key] = hashlib.sha256(Path(value).read_bytes()).hexdigest()
    return hashes


def _validate_named_outputs(root: Path, manifest: dict, state: dict) -> dict:
    outputs = state.get("named_outputs")
    hashes = state.get("named_output_hashes")
    if not outputs:
        return {}
    if not isinstance(outputs, dict) or not isinstance(hashes, dict):
        raise MissionValidationError("saved code mission output receipt is malformed")
    root = root.resolve(strict=True)
    base = root / "output" / "code" / manifest["id"]
    patch_ids = set(state.get("patches", {}))
    expected_names = {patch_id: {name for name in ("patch.diff", "test-report.json", "verdict.json")}
                      for patch_id in patch_ids}
    expected_names["trace.jsonl"] = None
    if set(outputs) != set(expected_names) or set(hashes) != set(expected_names):
        raise MissionValidationError("saved code mission output list does not match its patches")
    validated_hashes = {}
    for key, names in expected_names.items():
        files = outputs[key] if names is not None else {"trace.jsonl": outputs[key]}
        file_hashes = hashes[key] if names is not None else {"trace.jsonl": hashes[key]}
        if (not isinstance(files, dict) or set(files) != names if names is not None else
                not isinstance(files, dict) or set(files) != {"trace.jsonl"}):
            raise MissionValidationError("saved code mission output names are invalid")
        if not isinstance(file_hashes, dict) or set(file_hashes) != set(files):
            raise MissionValidationError("saved code mission output hashes are incomplete")
        checked = {}
        for name, raw_path in files.items():
            expected_path = base / key / name if names is not None else base / "trace.jsonl"
            candidate = Path(raw_path)
            _reject_store_reparse(candidate)
            if (not candidate.is_absolute() or os.path.normcase(str(candidate.absolute())) !=
                    os.path.normcase(str(expected_path.absolute())) or not candidate.is_file()):
                raise MissionValidationError("saved code mission output path escaped its private store location")
            try:
                mode = candidate.lstat().st_mode
            except OSError as exc:
                raise MissionValidationError("saved code mission output file is unavailable") from exc
            if not stat.S_ISREG(mode):
                raise MissionValidationError("saved code mission output is not a regular file")
            digest = hashlib.sha256(candidate.read_bytes()).hexdigest()
            if file_hashes[name] != digest:
                raise MissionValidationError("saved code mission output hash does not reproduce")
            checked[name] = digest
        validated_hashes[key] = checked if names is not None else checked["trace.jsonl"]
    return validated_hashes


def _replay_mission(store: Store, state: dict, manifest: dict) -> dict:
    validated = validate_manifest(manifest)
    _validate_named_outputs(store.root, manifest, state)
    results = {}
    for patch_id, record in state.get("patches", {}).items():
        patch = next((p for p in validated["patches"] if p["id"] == patch_id), None)
        if patch is None:
            raise MissionValidationError("saved code mission references an unknown patch")
        operation_key = config_hash({"identity": state["identity"], "patch_id": patch["id"],
                                     "patch_sha256": patch["sha256"]})
        if record.get("operation_key") != operation_key:
            raise MissionValidationError("saved code mission operation key does not match its pinned patch")
        expected_task = _code_task(manifest, patch, operation_key)
        job = store.get_job(record["job_id"])
        spec = job.get("spec") or {}
        if (spec.get("task") != expected_task or spec.get("route") != "tool"
                or spec.get("mission_id") != manifest["id"]
                or spec.get("operation_key") != operation_key):
            raise MissionValidationError("saved code mission job does not match its pinned task/operation")
        if job["state"] not in {"BLOCKED", "REJECTED"}:
            results[patch_id] = {"state": job["state"], "job_id": job["id"]}
            continue
        job_result = job.get("result") or {}
        ref = job_result.get("evidence_ref")
        if not ref:
            results[patch_id] = {"state": "BLOCKED_SANDBOX", "job_id": job["id"]}
            continue
        bundle = inspect_evidence(store, job["id"])
        if (bundle.get("job_id") != job["id"]
                or bundle.get("task") != expected_task or bundle.get("route") != "tool"):
            raise MissionValidationError("saved code mission evidence is not bound to its scheduled job")
        replay = verify(bundle["task"], bundle["result"])
        if replay != bundle.get("verification"):
            raise MissionValidationError("saved code mission evidence failed independent replay")
        output = json.loads(bundle["result"].get("output") or "{}")
        synthetic = output.get("synthetic") is True
        results[patch_id] = {"state": "SYNTHETIC_ONLY" if synthetic and replay.get("passed") else
                             ("VERIFIED" if replay.get("passed") else "FAILED"),
                             "job_id": job["id"], "evidence_ref": ref,
                             "verification": replay, "patch_sha256": patch["sha256"],
                             "operation_key": record["operation_key"]}
    status = state["state"]
    return {"mission_id": state["id"], "status": status, "patches": results,
            "source_sha256": validated["source_sha256"], "runtime": state["runtime"],
            "manifest_ref": state["manifest_ref"], "event_refs": list(state.get("events", [])),
            "budget": store.get("budget"), "synthetic": state.get("synthetic", False),
            "named_outputs": dict(state.get("named_outputs", {})),
            "named_output_hashes": dict(state.get("named_output_hashes", {}))}


def run_code_mission(manifest_path, store_path, *, executor_config=None, isolation=None) -> dict:
    """Run all concrete patch candidates through governance, executor, verifier and review.

    Production uses a digest-pinned Docker adapter. Passing `FixtureIsolation`
    explicitly creates synthetic zero-command evidence that cannot become a
    verified code result.
    """
    if isinstance(manifest_path, dict):
        manifest = manifest_path
    else:
        manifest_file = Path(manifest_path).resolve(strict=True)
        manifest = json.loads(manifest_file.read_text(encoding="utf-8-sig"))
    validated = validate_manifest(manifest)
    sandbox = isolation if isolation is not None else DockerIsolation()
    if not isinstance(sandbox, (DockerIsolation, FixtureIsolation)):
        raise MissionValidationError("custom code execution adapters are forbidden")
    synthetic = isinstance(sandbox, FixtureIsolation)
    if synthetic and not (isinstance(manifest.get("synthetic_fixture"), dict)
                          and manifest["synthetic_fixture"].get("synthetic") is True):
        raise MissionValidationError("fixture mode must be explicit in the manifest")

    root = Path(store_path).absolute()
    _reject_store_reparse(root)
    root = root.resolve()
    root.mkdir(parents=True, exist_ok=True)
    config = dict(DEFAULT_CONFIG)
    if executor_config is not None:
        config.update(executor_config)
    # The code mission has no model route; the shared video default uses the
    # same deterministic tool-only configuration.
    config["routes"] = ["tool"]
    config["isolation_adapter"] = sandbox
    config["_store_root"] = str(root)
    config.setdefault("_cancel_file", str(root / (manifest["id"] + ".CANCEL")))
    executor = Executor(root, config)
    mission_key = "mission:" + manifest["id"]
    identity = config_hash({"manifest": manifest, "source_sha256": validated["source_sha256"],
                            "runtime": code_version(), "executor_config": {k: v for k, v in config.items()
                                                                                if k not in ("isolation_adapter", "_store_root", "_cancel_file")},
                            "sandbox": type(sandbox).__qualname__})
    try:
        with worker_lock(root):
            executor.recover()
            state = executor.store.get(mission_key)
            if state and state.get("identity") != identity:
                raise MissionValidationError("mission id is already bound to changed source/config/runtime; use a fresh store")
            if not state:
                manifest_ref = executor.store.put_artifact({"manifest": manifest, "identity": identity,
                                                            "source_sha256": validated["source_sha256"],
                                                            "verifier_sha256": validated["verifier_sha256"],
                                                            "suite_sha256": validated["suite_sha256"]})
                state = {"id": manifest["id"], "identity": identity, "state": "RUNNING",
                         "runtime": code_version(), "manifest_ref": manifest_ref,
                         "source_sha256": validated["source_sha256"], "synthetic": synthetic, "patches": {}, "events": []}
                executor.store.set(mission_key, state)
                _event(executor.store, mission_key, {"event": "MISSION_ACCEPTED", "identity": identity,
                                                     "manifest_ref": manifest_ref,
                                                     "source_sha256": validated["source_sha256"]})
            if state["state"] in {"VERIFIED", "FAILED", "BLOCKED_SANDBOX", "SYNTHETIC_ONLY"}:
                if not state.get("named_outputs") and state.get("patches"):
                    outputs = _write_named_outputs(root, manifest, validated, state, executor.store,
                                                   config["max_storage_bytes"])
                    state["named_outputs"] = outputs
                    state["named_output_hashes"] = _named_output_hashes(outputs)
                    executor.store.set(mission_key, state)
                return _replay_mission(executor.store, state, manifest)
            if not synthetic:
                try:
                    sandbox_identity = sandbox.inspect(validated["image"])
                except SandboxUnavailable as exc:
                    state.update(state="BLOCKED_SANDBOX", block_reason=str(exc))
                    executor.store.set(mission_key, state)
                    _event(executor.store, mission_key, {"event": "BLOCKED_SANDBOX", "reason": str(exc)})
                    return _replay_mission(executor.store, executor.store.get(mission_key), manifest)
                state["sandbox_identity"] = sandbox_identity
                executor.store.set(mission_key, state)

            for patch in validated["patches"]:
                if (root / "STOP").exists():
                    state.update(state="STOPPED", stop_reason="STOP observed before dispatch")
                    executor.store.set(mission_key, state)
                    _event(executor.store, mission_key, {"event": "MISSION_STOPPED", "patch_id": patch["id"]})
                    return _replay_mission(executor.store, executor.store.get(mission_key), manifest)
                operation_key = config_hash({"identity": identity, "patch_id": patch["id"], "patch_sha256": patch["sha256"]})
                enqueue_key = "code-mission:" + manifest["id"] + ":" + operation_key
                if patch["id"] not in state["patches"]:
                    task = _code_task(manifest, patch, operation_key)
                    job_id = executor.store.enqueue_once(enqueue_key,
                                                         {"task": task, "route": "tool", "retry_count": 0,
                                                          "allow_retry": False, "learn_feedback": False,
                                                          "mission_id": manifest["id"], "operation_key": operation_key})
                    state["patches"][patch["id"]] = {"job_id": job_id, "operation_key": operation_key,
                                                     "state": "QUEUED"}
                    executor.store.set(mission_key, state)
                    _event(executor.store, mission_key, {"event": "PATCH_QUEUED", "patch_id": patch["id"],
                                                         "job_id": job_id, "operation_key": operation_key,
                                                         "patch_sha256": patch["sha256"]})
                job_id = state["patches"][patch["id"]]["job_id"]
                job = executor.store.get_job(job_id)
                if job["state"] == "RETRY_READY":
                    executor.store.transition(job_id, "QUEUED", {"resumed_after_stop": True})
                job = executor.store.get_job(job_id)
                if job["state"] == "QUEUED":
                    if executor.barrier("tool"):
                        state.update(state="STOPPED", stop_reason=executor.barrier("tool"))
                        executor.store.set(mission_key, state)
                        _event(executor.store, mission_key, {"event": "MISSION_BUDGET_STOP", "reason": state["stop_reason"]})
                        return _replay_mission(executor.store, executor.store.get(mission_key), manifest)
                    run = executor.run_one(job_id=job_id)
                    if run is None:
                        return _replay_mission(executor.store, executor.store.get(mission_key), manifest)
                job = executor.store.get_job(job_id)
                if job["state"] == "RETRY_READY":
                    state.update(state="STOPPED", stop_reason="STOP interrupted isolated execution")
                    executor.store.set(mission_key, state)
                    _event(executor.store, mission_key, {"event": "PATCH_STOPPED", "patch_id": patch["id"],
                                                         "job_id": job_id, "operation_key": operation_key})
                    return _replay_mission(executor.store, executor.store.get(mission_key), manifest)
                if job["state"] == "BLOCKED" and (job.get("result") or {}).get("failure_category") == "SANDBOX":
                    state.update(state="BLOCKED_SANDBOX", block_reason=(job.get("result") or {}).get("reason"))
                    executor.store.set(mission_key, state)
                    _event(executor.store, mission_key, {"event": "BLOCKED_SANDBOX", "job_id": job_id})
                    return _replay_mission(executor.store, executor.store.get(mission_key), manifest)

            state = executor.store.get(mission_key)
            outcomes = [executor.store.get_job(row["job_id"]) for row in state["patches"].values()]
            if any(job["state"] not in {"BLOCKED", "REJECTED"} for job in outcomes):
                state["state"] = "STOPPED"
            else:
                state["state"] = "SYNTHETIC_ONLY" if synthetic else (
                    "VERIFIED" if all((job.get("result") or {}).get("passed") is True for job in outcomes) else "FAILED")
                if synthetic and not all((job.get("result") or {}).get("passed") is True for job in outcomes):
                    state["state"] = "FAILED"
            executor.store.set(mission_key, state)
            _event(executor.store, mission_key, {"event": "MISSION_FINISHED", "state": state["state"],
                                                 "job_ids": [job["id"] for job in outcomes]})
            state = executor.store.get(mission_key)
            outputs = _write_named_outputs(root, manifest, validated, state, executor.store,
                                           config["max_storage_bytes"])
            state["named_outputs"] = outputs
            state["named_output_hashes"] = _named_output_hashes(outputs)
            executor.store.set(mission_key, state)
            return _replay_mission(executor.store, executor.store.get(mission_key), manifest)
    finally:
        executor.close()
