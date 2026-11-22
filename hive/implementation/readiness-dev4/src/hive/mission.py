"""Shared durable mission manifest controller for video and isolated code DAGs."""
from __future__ import annotations

import hashlib
import json
import os
import re
import stat
import time
from pathlib import Path

from .orchestrator import code_version, config_hash, load_config
from .storage import Store


class MissionManifestError(ValueError):
    pass


def _event(store: Store, key: str, value: dict) -> str:
    ref = store.put_artifact(value)
    state = store.get(key)
    refs = list(state.get("event_refs", []))
    if ref not in refs:
        refs.append(ref)
    state["event_refs"] = refs
    state["last_event_ref"] = ref
    store.set(key, state)
    return ref


def _reject_reparse(path: Path) -> None:
    absolute = path.absolute()
    probe = Path(absolute.anchor)
    for part in absolute.parts[1:]:
        probe = probe / part
        if not probe.exists() and not probe.is_symlink():
            continue
        try:
            flag = bool(probe.lstat().st_file_attributes & getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400))
        except (AttributeError, OSError):
            flag = probe.is_symlink()
        if flag:
            raise MissionManifestError("mission store contains a symlink or reparse point")


def _video_input(root: Path, mission_id: str, stage_id: str, manifest: dict) -> Path:
    directory = root / "mission-inputs"
    _reject_reparse(directory)
    directory.mkdir(parents=True, exist_ok=True)
    target = directory / f"{mission_id}-{stage_id}.json"
    _reject_reparse(target)
    data = (json.dumps(manifest, sort_keys=True, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    if target.exists():
        if target.read_bytes() != data:
            raise MissionManifestError("persisted video stage input changed")
    else:
        with target.open("xb") as handle:
            handle.write(data)
            handle.flush()
            os.fsync(handle.fileno())
    return target


def _normalize(value: dict, manifest_file: Path) -> dict:
    if not isinstance(value, dict) or value.get("schema_version") != 1:
        raise MissionManifestError("mission manifest schema_version 1 is required")
    if not isinstance(value.get("id"), str) or not re.fullmatch(r"[A-Za-z0-9_.-]{1,100}", value["id"]):
        raise MissionManifestError("mission id must be a stable identifier")
    stages = value.get("stages")
    if stages is None and value.get("family") in {"code", "video"}:
        stages = [{"id": value["family"], "family": value["family"],
                   "manifest": value.get("manifest"), "depends_on": [], "max_retries": 0}]
    if not isinstance(stages, list) or not stages or len(stages) > 32:
        raise MissionManifestError("mission needs 1..32 stages")
    normalized, seen = [], set()
    for stage in stages:
        if not isinstance(stage, dict):
            raise MissionManifestError("mission stage must be an object")
        stage_id, family = stage.get("id"), stage.get("family")
        if not isinstance(stage_id, str) or not re.fullmatch(r"[A-Za-z0-9_.-]{1,80}", stage_id) or stage_id in seen:
            raise MissionManifestError("stage IDs must be unique stable identifiers")
        seen.add(stage_id)
        if family not in {"code", "video"}:
            raise MissionManifestError("stage family must be code or video")
        raw_path = stage.get("manifest")
        if isinstance(raw_path, str):
            candidate = Path(raw_path)
            path = (candidate if candidate.is_absolute() else manifest_file.parent / candidate).resolve(strict=True)
            stage_manifest = json.loads(path.read_text(encoding="utf-8-sig"))
            manifest_ref = str(path)
        elif isinstance(raw_path, dict):
            stage_manifest = raw_path
            manifest_ref = None
        else:
            raise MissionManifestError("each stage requires a manifest path or object")
        if not isinstance(stage_manifest, dict):
            raise MissionManifestError("stage manifest must be an object")
        if family == "code" and (stage_manifest.get("id") is None or stage_manifest.get("schema_version") != 1):
            raise MissionManifestError("code stage manifest is malformed")
        if family == "video" and not isinstance(stage_manifest, dict):
            raise MissionManifestError("video stage manifest is malformed")
        depends = stage.get("depends_on", [])
        if not isinstance(depends, list) or not all(isinstance(x, str) for x in depends) or len(set(depends)) != len(depends):
            raise MissionManifestError("depends_on must be a unique array of stage IDs")
        retries = stage.get("max_retries", 0)
        if type(retries) is not int or not 0 <= retries <= 2:
            raise MissionManifestError("max_retries must be an integer from zero to two")
        normalized.append({"id": stage_id, "family": family, "manifest": stage_manifest,
                           "manifest_ref": manifest_ref, "depends_on": depends,
                           "max_retries": retries})
    ids = {stage["id"] for stage in normalized}
    if any(dep not in ids for stage in normalized for dep in stage["depends_on"]):
        raise MissionManifestError("stage prerequisite references an unknown stage")
    _topological(normalized)
    return {"schema_version": 1, "id": value["id"], "stages": normalized}


def _topological(stages: list[dict]) -> list[str]:
    by_id = {row["id"]: row for row in stages}
    pending = {key: set(row["depends_on"]) for key, row in by_id.items()}
    result = []
    while pending:
        ready = sorted(key for key, deps in pending.items() if not deps)
        if not ready:
            raise MissionManifestError("mission stage dependency graph contains a cycle")
        for key in ready:
            result.append(key)
            pending.pop(key)
            for deps in pending.values():
                deps.discard(key)
    return result


def _stage_success(family: str, result: dict) -> bool:
    if family == "code":
        return result.get("status") in {"VERIFIED", "SYNTHETIC_ONLY"}
    return result.get("status") == "objective_verified"


def run_mission_manifest(manifest_path, store_path, config_path=None, *, isolation=None) -> dict:
    """Execute a persisted video/code DAG using one shared HIVE store.

    Stage calls remain owned by their existing mission engines. This controller
    persists prerequisites, attempts, cancellation, output references, and replay
    state without introducing a second job ledger.
    """
    manifest_file = Path(manifest_path).resolve(strict=True)
    raw = json.loads(manifest_file.read_text(encoding="utf-8-sig"))
    normalized = _normalize(raw, manifest_file)
    config = load_config(config_path) if config_path else None
    root = Path(store_path).absolute()
    _reject_reparse(root)
    root.mkdir(parents=True, exist_ok=True)
    store = Store(root)
    key = "mission_dag:" + normalized["id"]
    config_identity = config_hash(config) if config is not None else "video-default-tool"
    identity = hashlib.sha256(json.dumps({"manifest": normalized, "config": config_identity,
                                         "runtime": code_version()},
                                         sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()).hexdigest()
    try:
        previous = store.get(key)
        if previous and previous.get("identity") != identity:
            raise MissionManifestError("mission id is already bound to changed manifest/config; use a fresh store")
        if not previous:
            manifest_ref = store.put_artifact({"manifest": normalized, "identity": identity})
            previous = {"id": normalized["id"], "identity": identity, "manifest_ref": manifest_ref,
                        "state": "RUNNING", "stages": {}, "event_refs": [], "created": time.time()}
            store.set(key, previous)
            _event(store, key, {"event": "MISSION_ACCEPTED", "identity": identity, "manifest_ref": manifest_ref})
        by_id = {row["id"]: row for row in normalized["stages"]}
        order = _topological(normalized["stages"])
        for stage_id in order:
            if (root / "STOP").exists():
                previous = store.get(key)
                previous["state"] = "STOPPED"
                store.set(key, previous)
                _event(store, key, {"event": "MISSION_STOPPED", "stage_id": stage_id})
                break
            cancel_file = root / (normalized["id"] + ".CANCEL")
            if cancel_file.exists():
                previous = store.get(key)
                previous["state"] = "CANCELLED"
                store.set(key, previous)
                _event(store, key, {"event": "MISSION_CANCELLED", "stage_id": stage_id})
                break
            current = store.get(key)
            stage_state = current["stages"].get(stage_id, {})
            terminal = stage_state.get("state") in {"VERIFIED", "SYNTHETIC_ONLY", "OBJECTIVE_VERIFIED_REVIEW_PENDING", "FAILED", "BLOCKED_DEPENDENCY", "BLOCKED_SANDBOX"}
            if stage_state.get("state") == "CANCELLED":
                continue
            if stage_state.get("state") == "BLOCKED_DEPENDENCY" or (terminal and not stage_state.get("result")):
                continue
            if stage_state.get("state") == "RUNNING":
                # Resume the interrupted attempt without charging an extra retry.
                stage_state["attempts"] = max(0, int(stage_state.get("attempts", 0)) - 1)
            if terminal:
                # Re-enter the underlying engine so it validates its durable
                # receipt/source identity before the DAG accepts a cached result.
                # The engine may report the current shared-store budget, which
                # includes later stages; keep the completed stage receipt frozen.
                stage = by_id[stage_id]
                try:
                    finish_ref = stage_state.get("finish_event_ref")
                    if not isinstance(finish_ref, str):
                        raise MissionManifestError("cached stage has no immutable finish receipt")
                    frozen_event = store.read_artifact(finish_ref)
                    if (frozen_event.get("event") != "STAGE_FINISHED"
                            or frozen_event.get("stage_id") != stage_id
                            or frozen_event.get("state") != stage_state.get("state")
                            or frozen_event.get("result") != stage_state.get("result")):
                        raise MissionManifestError("cached stage receipt does not match its immutable finish event")
                    if stage["family"] == "code":
                        from .code_mission import run_code_mission
                        code_config = dict(config or {})
                        code_config["_cancel_file"] = str(root / (normalized["id"] + ".CANCEL"))
                        result = run_code_mission(stage["manifest"], root, executor_config=code_config, isolation=isolation)
                        replayed_state = result.get("status", "FAILED")
                    else:
                        from .video_mission import run_mission as run_video_mission
                        temp_manifest = _video_input(root, normalized["id"], stage_id, stage["manifest"])
                        result = run_video_mission(root, temp_manifest, config_path) if config_path else run_video_mission(root, temp_manifest)
                        replayed_state = "OBJECTIVE_VERIFIED_REVIEW_PENDING" if result.get("status") == "objective_verified" else "FAILED"
                    if replayed_state != stage_state.get("state"):
                        raise MissionManifestError("cached stage replay disagrees with its frozen terminal state")
                    def stable_result(value):
                        stable = dict(value)
                        stable.pop("budget", None)
                        return stable
                    if stable_result(result) != stable_result(stage_state["result"]):
                        raise MissionManifestError("cached stage replay disagrees with its frozen completion receipt")
                except Exception as exc:
                    raise MissionManifestError(f"cached stage replay failed validation: {type(exc).__name__}: {exc}") from exc
                continue
            dependencies = [current["stages"].get(dep, {}) for dep in by_id[stage_id]["depends_on"]]
            if any(dep.get("state") not in {"VERIFIED", "SYNTHETIC_ONLY", "OBJECTIVE_VERIFIED_REVIEW_PENDING"} for dep in dependencies):
                stage_state = {"state": "BLOCKED_DEPENDENCY", "attempts": stage_state.get("attempts", 0)}
                current["stages"][stage_id] = stage_state
                store.set(key, current)
                _event(store, key, {"event": "STAGE_BLOCKED_DEPENDENCY", "stage_id": stage_id})
                continue
            stage = by_id[stage_id]
            attempts = int(stage_state.get("attempts", 0))
            result = None
            while attempts <= stage["max_retries"]:
                attempts += 1
                stage_state.update(state="RUNNING", attempts=attempts, started=time.time())
                current["stages"][stage_id] = stage_state
                current["state"] = "RUNNING"
                store.set(key, current)
                _event(store, key, {"event": "STAGE_STARTED", "stage_id": stage_id,
                                    "family": stage["family"], "attempt": attempts})
                try:
                    if stage["family"] == "code":
                        from .code_mission import run_code_mission
                        code_config = dict(config or {})
                        code_config["_cancel_file"] = str(root / (normalized["id"] + ".CANCEL"))
                        result = run_code_mission(stage["manifest"], root, executor_config=code_config, isolation=isolation)
                        code_state = result.get("status")
                        stage_status = code_state if code_state in {"VERIFIED", "FAILED", "BLOCKED_SANDBOX", "SYNTHETIC_ONLY"} else "STOPPED"
                    else:
                        from .video_mission import run_mission as run_video_mission
                        temp_manifest = _video_input(root, normalized["id"], stage_id, stage["manifest"])
                        video_config = config_path
                        if video_config:
                            result = run_video_mission(root, temp_manifest, video_config)
                        else:
                            result = run_video_mission(root, temp_manifest)
                        stage_status = "OBJECTIVE_VERIFIED_REVIEW_PENDING" if result.get("status") == "objective_verified" else "FAILED"
                    stage_state.update(state=stage_status, result=result, finished=time.time())
                    current = store.get(key)
                    current["stages"][stage_id] = stage_state
                    store.set(key, current)
                    finish_ref = _event(store, key, {"event": "STAGE_FINISHED", "stage_id": stage_id,
                                                      "state": stage_status, "result": result})
                    current = store.get(key)
                    current["stages"][stage_id]["finish_event_ref"] = finish_ref
                    store.set(key, current)
                    break
                except Exception as exc:
                    stage_state.update(state="RETRY_READY", attempts=attempts,
                                       failure=f"{type(exc).__name__}: {exc}")
                    current = store.get(key)
                    current["stages"][stage_id] = stage_state
                    store.set(key, current)
                    _event(store, key, {"event": "STAGE_EXCEPTION", "stage_id": stage_id,
                                        "attempt": attempts, "failure": stage_state["failure"]})
                    if attempts > stage["max_retries"]:
                        stage_state["state"] = "FAILED"
                        current["stages"][stage_id] = stage_state
                        store.set(key, current)
                        break
            if stage_state.get("state") == "STOPPED":
                break

        current = store.get(key)
        all_states = [item.get("state") for item in current["stages"].values()]
        if current["state"] not in {"STOPPED", "CANCELLED"}:
            if any(state in {"FAILED", "BLOCKED_SANDBOX", "BLOCKED_DEPENDENCY"} for state in all_states):
                current["state"] = "FAILED"
            elif all(stage_id in current["stages"] and current["stages"][stage_id].get("state") in
                     {"VERIFIED", "SYNTHETIC_ONLY", "OBJECTIVE_VERIFIED_REVIEW_PENDING"} for stage_id in by_id):
                current["state"] = "COMPLETED"
            else:
                current["state"] = "RUNNING"
            store.set(key, current)
        _event(store, key, {"event": "MISSION_STATE", "state": current["state"]})
        return {"mission_id": current["id"], "status": current["state"],
                "stages": current["stages"], "manifest_ref": current["manifest_ref"],
                "event_refs": list(current.get("event_refs", [])),
                "budget": store.get("budget")}
    finally:
        store.close()
