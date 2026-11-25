"""Restricted CSV/JSON mission adapter on HIVE's shared Executor."""
from __future__ import annotations

import hashlib
import json
import os
import re
import stat
import uuid
from pathlib import Path, PurePath

from .orchestrator import DEFAULT_CONFIG, Executor, code_version, config_hash, inspect_evidence, worker_lock
from .storage import Store
from .structured_verifier import (CLASSIFICATION_SCHEMA, INVENTORY_SCHEMA, SCHEMA_VERSION,
                                  StructuredMissionError, field_verdicts, inventory_result,
                                  output_matches, parse_oracle, parse_output, parse_source, sha256,
                                  validate_labels)

_MISSION_KEY_PREFIX = "structured_mission:"
_MISSION_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$")
_HASH = re.compile(r"^[0-9a-f]{64}$")
_MAX_MANIFEST_BYTES = 64 * 1024
_ALLOWED_FIELDS = {"version", "id", "mission_id", "source_group", "allowed_root", "input_path",
                   "input_sha256", "source_format", "task_type", "schema_id", "labels",
                   "oracle_path", "oracle_sha256", "synthetic_fixture", "procedure"}


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
            raise StructuredMissionError("mission path contains a symlink or reparse point")


def _load_manifest(value):
    if isinstance(value, dict):
        manifest = value
    else:
        path = Path(value)
        if path.stat().st_size > _MAX_MANIFEST_BYTES:
            raise StructuredMissionError("manifest exceeds 64 KiB")
        try:
            manifest = json.loads(path.read_text(encoding="utf-8-sig"))
        except (OSError, UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise StructuredMissionError("manifest must be readable UTF-8 JSON") from exc
    if not isinstance(manifest, dict) or set(manifest) - _ALLOWED_FIELDS:
        raise StructuredMissionError("manifest has unknown fields or is not an object")
    return dict(manifest)


def _safe_root(value: str) -> Path:
    if not isinstance(value, str) or not value:
        raise StructuredMissionError("allowed_root must be an explicit absolute directory")
    root = Path(value)
    if not root.is_absolute():
        raise StructuredMissionError("allowed_root must be absolute")
    _reject_store_reparse(root)
    try:
        resolved = root.resolve(strict=True)
    except OSError as exc:
        raise StructuredMissionError("allowed_root must already exist") from exc
    if not resolved.is_dir():
        raise StructuredMissionError("allowed_root must be a directory")
    return resolved


def _safe_member(root: Path, relative: str, label: str) -> Path:
    if not isinstance(relative, str) or not relative or "\x00" in relative:
        raise StructuredMissionError(f"{label} path is required")
    candidate_name = PurePath(relative)
    if candidate_name.is_absolute() or candidate_name.drive or any(part in ("..", "") for part in candidate_name.parts):
        raise StructuredMissionError(f"{label} path must stay beneath allowed_root")
    candidate = root.joinpath(*candidate_name.parts)
    _reject_store_reparse(candidate)
    try:
        resolved = candidate.resolve(strict=True)
    except OSError as exc:
        raise StructuredMissionError(f"{label} file does not exist") from exc
    if not resolved.is_relative_to(root) or not resolved.is_file():
        raise StructuredMissionError(f"{label} file must be a regular file under allowed_root")
    return resolved


def _read_pinned(path: Path, expected: str, label: str, limit: int) -> bytes:
    if not isinstance(expected, str) or not _HASH.fullmatch(expected):
        raise StructuredMissionError(f"{label}_sha256 must be 64 lowercase hexadecimal characters")
    if path.stat().st_size > limit:
        raise StructuredMissionError(f"{label} exceeds its {limit}-byte limit")
    data = path.read_bytes()
    if len(data) > limit:
        raise StructuredMissionError(f"{label} exceeds its {limit}-byte limit")
    if sha256(data) != expected:
        raise StructuredMissionError(f"{label} bytes do not match the pinned SHA-256")
    return data


def _validate_manifest(manifest: dict):
    if type(manifest.get("version")) is not int or manifest["version"] != 1:
        raise StructuredMissionError("manifest version must be integer 1")
    mission_id = manifest.get("id", manifest.get("mission_id"))
    if (not isinstance(mission_id, str) or not _MISSION_ID.fullmatch(mission_id)
            or ("id" in manifest and "mission_id" in manifest and manifest["id"] != manifest["mission_id"])):
        raise StructuredMissionError("manifest id must be a safe 1 to 64 character identifier")
    source_group = manifest.get("source_group")
    if not isinstance(source_group, str) or not source_group.strip() or len(source_group) > 128:
        raise StructuredMissionError("source_group is required")
    task_type = manifest.get("task_type")
    schema_id = manifest.get("schema_id")
    expected_schema = INVENTORY_SCHEMA if task_type == "inventory" else CLASSIFICATION_SCHEMA if task_type == "classification" else None
    if schema_id != expected_schema:
        raise StructuredMissionError("task_type and schema_id do not select a supported fixed schema")
    procedure = manifest.get("procedure", "baseline_v1")
    if procedure not in {"baseline_v1", "labels_json_recovery_v1"}:
        raise StructuredMissionError("procedure must be baseline_v1 or labels_json_recovery_v1")
    if procedure == "labels_json_recovery_v1" and task_type != "classification":
        raise StructuredMissionError("labels_json_recovery_v1 is only valid for classification")
    source_format = manifest.get("source_format")
    if source_format not in ("csv", "json"):
        raise StructuredMissionError("source_format must be csv or json")
    if ("oracle_path" in manifest) != ("oracle_sha256" in manifest):
        raise StructuredMissionError("oracle_path and oracle_sha256 must be supplied together")
    synthetic = manifest.get("synthetic_fixture", False)
    if synthetic is not False and (not isinstance(synthetic, dict) or synthetic.get("synthetic") is not True
                                   or set(synthetic) - {"synthetic", "source_note"}):
        raise StructuredMissionError("synthetic_fixture must explicitly set synthetic=true")
    return mission_id, source_group.strip(), task_type, schema_id, source_format, bool(synthetic), procedure


def _task(manifest: dict, mission_id: str, source_group: str, source_sha: str,
          task_type: str, schema_id: str, procedure: str, rows: list[dict], expected: dict | None):
    if task_type == "inventory":
        prompt = "Use summarize_inventory to compute the exact row count and byte total for every group. Return JSON with only the groups object."
        tool_names = ["summarize_inventory"]
        schemas = {"summarize_inventory": {"rows": "supplied rows"}}
        category = "structured_data"
        input_value = {"rows": rows, "allowed_tools": tool_names, "tool_schemas": schemas}
        expected_value = expected if expected is not None else inventory_result(rows)
        permissions = {"version": 1, "routes": ["tool"]}
        evaluator = "grouped_inventory_v1"
    else:
        labels = validate_labels(manifest.get("labels"), rows)
        prompt = "Classify every supplied text item using one of the allowed labels. Return JSON with a labels object keyed by item ID."
        if procedure == "labels_json_recovery_v1":
            prompt += " Return exactly one JSON object matching {\"labels\":{\"<id>\":\"<allowed-label>\"}}. Include every ID exactly once; no commentary or extra keys."
        tool_names, schemas = [], {}
        category = "text_classification"
        input_value = {"items": rows, "labels": {label: label for label in labels},
                       "allowed_tools": tool_names, "tool_schemas": schemas}
        expected_value = expected if expected is not None else {"labels": {}}
        permissions = {"version": 1, "routes": ["local_direct"]}
        evaluator = "independent_labels_v1"
    task = {"id": f"structured-{mission_id}", "category": category, "split": "validation",
            "prompt": prompt, "input": input_value, "expected": expected_value,
            "critical": False, "evaluator": evaluator, "allowed_tools": tool_names,
            "tool_schemas": schemas, "permissions": permissions, "source_group": source_group,
            "source_sha256": source_sha, "input_sha256": source_sha,
            "success_criteria": "Independent schema and field-level verification of all rows."}
    task["procedure"] = procedure
    return task


def mission_task_hash(manifest_path_or_dict) -> str:
    """Return the canonical HIVE task hash used by the prototype approval contract."""
    manifest = _load_manifest(manifest_path_or_dict)
    mission_id, source_group, task_type, schema_id, source_format, _, procedure = _validate_manifest(manifest)
    root = _safe_root(manifest.get("allowed_root"))
    source = _safe_member(root, manifest.get("input_path"), "input")
    source_bytes = _read_pinned(source, manifest.get("input_sha256"), "input", 2 * 1024 * 1024)
    source_sha = sha256(source_bytes)
    rows = parse_source(source_bytes, source_format, schema_id)
    expected = None
    if "oracle_path" in manifest:
        oracle = _safe_member(root, manifest["oracle_path"], "oracle")
        expected = parse_oracle(_read_pinned(oracle, manifest["oracle_sha256"], "oracle", 64 * 1024),
                                schema_id, rows, manifest.get("labels"))
    elif task_type == "classification":
        # The pending task is intentionally not dispatchable until an objective oracle exists.
        expected = {"labels": {}}
    return config_hash(_task(manifest, mission_id, source_group, source_sha, task_type, schema_id,
                             procedure, rows, expected))


def _json_bytes(value) -> bytes:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False).encode("utf-8")


def _atomic_output(root: Path, relative: str, content: bytes, limit: int) -> str:
    target = root / relative
    parent = target.parent
    _reject_store_reparse(parent)
    parent.mkdir(parents=True, exist_ok=True)
    _reject_store_reparse(target)
    if target.exists():
        if target.read_bytes() != content:
            raise RuntimeError("immutable structured mission output already exists with different content")
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


def _hash_outputs(named_outputs):
    return {name: sha256(Path(path).read_bytes()) for name, path in named_outputs.items()}


def _validate_outputs(root: Path, state: dict):
    outputs = state.get("named_outputs", {})
    hashes = state.get("named_output_hashes", {})
    if set(outputs) != set(hashes):
        raise StructuredMissionError("saved output names and hashes differ")
    for name, path_text in outputs.items():
        path = Path(path_text)
        _reject_store_reparse(path)
        if not path.is_relative_to(root) or not path.is_file() or sha256(path.read_bytes()) != hashes[name]:
            raise StructuredMissionError("saved structured mission output failed hash replay")


def _make_outputs(root: Path, manifest: dict, mission_id: str, source: Path, source_bytes: bytes,
                  source_sha: str, rows: list[dict], normalized: dict | None, verdict: dict,
                  trace: list[dict], limit: int):
    output_dir = Path("output") / "structured" / mission_id
    names = {"source": _atomic_output(root, (output_dir / ("source." + manifest["source_format"])).as_posix(),
                                      source_bytes, limit)}
    data_record = {"schema_version": SCHEMA_VERSION, "mission_id": mission_id,
                   "source_group": manifest["source_group"], "source_sha256": source_sha,
                   "schema_id": manifest["schema_id"], "rows": rows,
                   "normalized": normalized, "result": normalized}
    if isinstance(normalized, dict):
        if "groups" in normalized:
            data_record["groups"] = normalized["groups"]
        if "labels" in normalized:
            data_record["labels"] = normalized["labels"]
    names["data.json"] = _atomic_output(root, (output_dir / "data.json").as_posix(), _json_bytes(data_record), limit)
    names["verdict.json"] = _atomic_output(root, (output_dir / "verdict.json").as_posix(), _json_bytes(verdict), limit)
    names["trace.jsonl"] = _atomic_output(root, (output_dir / "trace.jsonl").as_posix(),
        b"".join(_json_bytes(row) + b"\n" for row in trace), limit)
    return names


def _approval_config(config: dict, store_root: Path, manifest: dict):
    """Classification inference only enters through the console's approval contract."""
    try:
        from .prototype_approval import authorize_mission
    except ImportError as exc:
        raise StructuredMissionError("prototype approval module is unavailable; classification is fail-closed") from exc
    try:
        authorized = authorize_mission(config, store_root, manifest)
    except Exception as exc:
        raise StructuredMissionError(f"classification approval rejected: {type(exc).__name__}: {exc}") from exc
    if not isinstance(authorized, dict):
        raise StructuredMissionError("classification approval did not return a pinned executor config")
    return authorized


def _empty_budget():
    return {"requests": 0, "tokens_reserved": 0, "tokens_actual": 0, "wall_s": 0.0, "cycles": 0}


def _schema_verdict(schema_id: str, rows: list[dict], actual, allowed_labels=None):
    if not isinstance(actual, dict):
        return {"valid_json_object": False, "shape_valid": False, "reason": "output is not a JSON object"}
    if schema_id == INVENTORY_SCHEMA:
        groups = actual.get("groups")
        shape = (set(actual) == {"groups"} and isinstance(groups, dict)
                 and all(isinstance(group, str) and isinstance(record, dict)
                         and set(record) == {"count", "bytes"}
                         and type(record["count"]) is int and record["count"] >= 0
                         and type(record["bytes"]) is int and record["bytes"] >= 0
                         for group, record in groups.items()))
    else:
        labels = actual.get("labels")
        shape = (set(actual) == {"labels"} and isinstance(labels, dict)
                 and set(labels) == {row["id"] for row in rows}
                 and all(isinstance(value, str) and value in set(allowed_labels or [])
                         for value in labels.values()))
    return {"valid_json_object": True, "shape_valid": bool(shape),
            "reason": "shape_valid" if shape else "invalid_schema_shape"}


def _pending_result(manifest: dict, identity: str, runtime: dict, source_sha: str, verifier_sha: str,
                    prompt_sha: str, reason: str):
    return {"status": "REVIEW_PENDING", "job_ids": [], "named_outputs": {}, "named_output_hashes": {},
            "machine_verdict": {"valid": False, "passed": False, "reason": reason},
            "field_verdicts": {}, "reviewer_state": "awaiting_independent_oracle",
            "identity": {"mission_id": manifest.get("id", manifest.get("mission_id")),
                         "source_sha256": source_sha, "model": None, "model_digest": None,
                         "prompt_sha256": prompt_sha, "verifier_sha256": verifier_sha,
                         "policy_sha256": None, "runtime": runtime, "mission_identity": identity},
            "budget": _empty_budget()}


def run_structured_mission(manifest_path_or_dict, store_path, *, executor_config=None) -> dict:
    """Run one fixed-schema source through HIVE and emit immutable named artifacts."""
    manifest = _load_manifest(manifest_path_or_dict)
    mission_id, source_group, task_type, schema_id, source_format, synthetic, procedure = _validate_manifest(manifest)
    root_allowed = _safe_root(manifest.get("allowed_root"))
    source = _safe_member(root_allowed, manifest.get("input_path"), "input")
    source_bytes = _read_pinned(source, manifest.get("input_sha256"), "input", 2 * 1024 * 1024)
    source_sha = sha256(source_bytes)
    rows = parse_source(source_bytes, source_format, schema_id)
    oracle_bytes = None
    expected = None
    if "oracle_path" in manifest:
        oracle_path = _safe_member(root_allowed, manifest["oracle_path"], "oracle")
        oracle_bytes = _read_pinned(oracle_path, manifest["oracle_sha256"], "oracle", 64 * 1024)
        expected = parse_oracle(oracle_bytes, schema_id, rows, manifest.get("labels"))
    elif task_type == "classification":
        validate_labels(manifest.get("labels"), rows)
    else:
        # Inventory has an exact host-side oracle computed from pinned source bytes.
        expected = inventory_result(rows)

    store_root = Path(store_path).absolute()
    _reject_store_reparse(store_root)
    store_root.mkdir(parents=True, exist_ok=True)
    _reject_store_reparse(store_root)
    store_root = store_root.resolve()
    if store_root == root_allowed or store_root.is_relative_to(root_allowed):
        raise StructuredMissionError("mission store must be outside the source allowed_root")

    task = _task(manifest, mission_id, source_group, source_sha, task_type, schema_id,
                 procedure, rows, expected)
    task_hash = config_hash(task)
    base_config = dict(DEFAULT_CONFIG)
    base_config.update(executor_config or {})
    approval_record = None
    if task_type == "inventory":
        # The v4 governor admits only its exact tool route for grouped inventory.
        if not base_config.get("_shared_mission"):
            base_config.update(routes=["tool"], max_requests=0, max_total_tokens=0, max_tokens=0,
                               max_retries=0, max_cycles=min(int(base_config.get("max_cycles", 1)), 1))
        config = base_config
    elif expected is None:
        config = {**base_config, "routes": [], "max_requests": 0, "max_total_tokens": 0, "max_tokens": 0}
    else:
        config = _approval_config(base_config, store_root, manifest)
        approval_record = config.get("_prototype_approval")
        if not isinstance(approval_record, dict):
            raise StructuredMissionError("classification approval record is missing")

    identity_payload = {"manifest": manifest, "source_sha256": source_sha,
                        "oracle_sha256": sha256(oracle_bytes) if oracle_bytes is not None else None,
                        "task_hash": task_hash, "executor_config_hash": config_hash({k: v for k, v in config.items()
                            if not k.startswith("_") and k not in {"_prototype_approval"}}),
                        "approval": approval_record, "runtime": code_version(),
                        "schema_version": SCHEMA_VERSION}
    identity = config_hash(identity_payload)
    verifier_sha = config_hash({name: sha256(Path(__file__).with_name(name).read_bytes())
                                for name in ("structured_verifier.py", "data_tasks.py", "verifier.py")})
    prompt_sha = sha256(task["prompt"].encode("utf-8"))
    mission_key = _MISSION_KEY_PREFIX + mission_id
    executor = Executor(store_root, config)
    try:
        with worker_lock(store_root):
            executor.recover()
            state = executor.store.get(mission_key)
            if state and state.get("identity") != identity:
                raise StructuredMissionError("mission id is bound to changed source/config/verifier; use a fresh store")
            if state and state.get("status") in {"VERIFIED", "REVIEW_PENDING", "FAILED"}:
                _validate_outputs(store_root, state)
                result = dict(state["result"])
                if (result.get("status") != state["status"]
                        or result.get("named_outputs") != state.get("named_outputs")
                        or result.get("named_output_hashes") != state.get("named_output_hashes")
                        or result.get("synthetic") is not synthetic):
                    raise StructuredMissionError("saved structured result disagrees with its receipt")
                if state.get("job_id"):
                    _replay_job(executor, task, state)
                    checked_status, checked_verdict, checked_actual, checked_fields, checked_reviewer = _result_for_job(
                        executor, task, state["job_id"], schema_id, rows, expected, synthetic)
                    if (result.get("status") != checked_status or result.get("machine_verdict") != checked_verdict
                            or result.get("field_verdicts") != checked_fields
                            or result.get("reviewer_state") != checked_reviewer
                            or result.get("schema_verdict") != _schema_verdict(schema_id, rows, checked_actual, manifest.get("labels"))
                            or result.get("job_ids") != [state["job_id"]]):
                        raise StructuredMissionError("saved structured verdict failed independent replay")
                elif expected is not None or result.get("status") != "REVIEW_PENDING" or result.get("job_ids"):
                    raise StructuredMissionError("saved structured result has no independent execution")
                return result

            if not state:
                state = {"mission_id": mission_id, "identity": identity, "task_hash": task_hash,
                         "source_sha256": source_sha, "status": "RUNNING", "job_id": None,
                         "named_outputs": {}, "named_output_hashes": {}}
                executor.store.set(mission_key, state)

            def stopped(reason, current_job=None):
                # No final artifacts are committed on a partial execution. A
                # later resume can finish the same immutable output names.
                result = {"status": "STOPPED", "job_ids": [current_job] if current_job else [],
                          "named_outputs": {}, "named_output_hashes": {},
                          "machine_verdict": {"valid": False, "passed": False, "reason": reason},
                          "field_verdicts": {}, "reviewer_state": "operator_reconciliation",
                          "failure_reason": reason, "synthetic": synthetic,
                          "identity": {"mission_id": mission_id, "source_group": source_group,
                              "input_sha256": source_sha, "source_sha256": source_sha,
                              "mission_identity": identity, "runtime": code_version()},
                          "budget": executor.store.get("budget", _empty_budget())}
                state.update(status="STOPPED", result=result, job_id=current_job)
                executor.store.set(mission_key, state)
                return result

            if (store_root / "STOP").exists():
                return stopped("STOP observed before dispatch", state.get("job_id"))

            trace = []
            job_id = state.get("job_id")
            if expected is None:
                status = "REVIEW_PENDING"
                machine_verdict = {"valid": False, "passed": False,
                                   "reason": "independent oracle required before classification"}
                actual = None
                field_results = {}
                reviewer_state = "awaiting_independent_oracle"
            else:
                route = "tool" if task_type == "inventory" else "local_direct"
                enqueue_key = f"structured:{mission_id}:{identity}:{task_hash}"
                job_id = job_id or executor.store.enqueue_once(enqueue_key,
                    {"task": task, "route": route, "hypothesis": "Independently verify structured mission output",
                     "retry_count": 0, "allow_retry": False, "learn_feedback": False,
                     "mission_id": mission_id, "operation_key": identity})
                state["job_id"] = job_id
                executor.store.set(mission_key, state)
                job = executor.store.get_job(job_id)
                if job["state"] == "RETRY_READY" and not (store_root / "STOP").exists():
                    executor.store.transition(job_id, "QUEUED", {"resumed_after_stop": True})
                    job = executor.store.get_job(job_id)
                if job["state"] == "QUEUED":
                    if route == "local_direct" and any(event["state"] == "RUNNING" for event in job["history"]):
                        # An interrupted request has already spent its reservation.
                        # Without a completed receipt we cannot infer its output,
                        # and allow_retry=False forbids silently spending again.
                        return stopped("Interrupted model attempt needs operator reconciliation; no redispatch", job_id)
                    if (store_root / "STOP").exists():
                        status = "STOPPED"
                        machine_verdict = {"valid": False, "passed": False, "reason": "STOP observed before dispatch"}
                        actual, field_results, reviewer_state = None, {}, "operator_stop"
                    else:
                        executor.run_one(job_id=job_id)
                        job = executor.store.get_job(job_id)
                        if job["state"] == "RETRY_READY":
                            status = "STOPPED"
                            machine_verdict = {"valid": False, "passed": False, "reason": "executor stopped or budget exhausted"}
                            actual, field_results, reviewer_state = None, {}, "operator_stop_or_budget"
                        else:
                            status, machine_verdict, actual, field_results, reviewer_state = _result_for_job(
                                executor, task, job_id, schema_id, rows, expected, synthetic)
                elif job["state"] in {"BLOCKED", "REJECTED"}:
                    status, machine_verdict, actual, field_results, reviewer_state = _result_for_job(
                        executor, task, job_id, schema_id, rows, expected, synthetic)
                else:
                    status = "STOPPED"
                    machine_verdict = {"valid": False, "passed": False, "reason": f"job state {job['state']} is not terminal"}
                    actual, field_results, reviewer_state = None, {}, "incomplete_job"
                if job_id:
                    trace = [{"index": index, "state": item["state"], "detail": item["detail"]}
                             for index, item in enumerate(executor.store.get_job(job_id)["history"])]

            if source.read_bytes() != source_bytes:
                raise StructuredMissionError("source bytes changed during the mission")
            if status == "STOPPED" or (store_root / "STOP").exists():
                return stopped(machine_verdict.get("reason", "STOP observed before output commit"), job_id)
            schema_result = _schema_verdict(schema_id, rows, actual, manifest.get("labels"))
            normalized = actual if machine_verdict.get("passed") else None
            verdict = {"mission_id": mission_id, "status": status, "identity": identity,
                       "source_group": source_group, "source_sha256": source_sha,
                       "oracle_sha256": sha256(oracle_bytes) if oracle_bytes is not None else None,
                       "task_hash": task_hash, "job_id": job_id, "machine_verdict": machine_verdict,
                       "field_verdicts": field_results, "schema_verdict": schema_result,
                       "reviewer_state": reviewer_state,
                       "synthetic": synthetic}
            try:
                names = _make_outputs(store_root, manifest, mission_id, source, source_bytes, source_sha,
                                      rows, normalized, verdict, trace, config["max_storage_bytes"])
            except RuntimeError as exc:
                if (store_root / "STOP").exists() or "budget" in str(exc).lower():
                    return stopped(str(exc), job_id)
                raise
            hashes = _hash_outputs(names)
            budget = executor.store.get("budget", _empty_budget())
            evidence_identity = None
            policy_sha = None
            model, model_digest = None, None
            if job_id and executor.store.get_job(job_id)["state"] in {"BLOCKED", "REJECTED"}:
                evidence = inspect_evidence(executor.store, job_id)
                policy_sha = config_hash(evidence.get("decision", {}))
                model_identity = evidence.get("decision", {}).get("model_identity") or {}
                model, model_digest = model_identity.get("model"), model_identity.get("digest")
                evidence_identity = executor.store.get_job(job_id)["result"]["evidence_ref"]
            result = {"status": status, "job_ids": [job_id] if job_id else [],
                      "named_outputs": names, "named_output_hashes": hashes,
                      "machine_verdict": machine_verdict, "field_verdicts": field_results,
                      "schema_verdict": schema_result,
                      "failure_reason": None if machine_verdict.get("passed") else machine_verdict.get("reason"),
                      "reviewer_state": reviewer_state,
                      "identity": {"mission_id": mission_id, "source_group": source_group,
                          "source_sha256": source_sha, "input_sha256": source_sha,
                          "oracle_sha256": sha256(oracle_bytes) if oracle_bytes is not None else None,
                          "model": model, "model_digest": model_digest, "prompt_sha256": prompt_sha,
                          "verifier_sha256": verifier_sha, "policy_sha256": policy_sha,
                          "runtime": code_version(), "task_hash": task_hash,
                          "config_hash": config_hash({k: v for k, v in config.items() if not k.startswith("_")}),
                          "mission_identity": identity, "evidence_ref": evidence_identity},
                      "budget": budget, "synthetic": synthetic}
            state.update(status=status, result=result, named_outputs=names, named_output_hashes=hashes,
                         job_id=job_id, machine_verdict=machine_verdict, field_verdicts=field_results,
                         reviewer_state=reviewer_state)
            executor.store.set(mission_key, state)
            return result
    finally:
        executor.close()


def _result_for_job(executor: Executor, task: dict, job_id: str, schema_id: str,
                    rows: list[dict], expected: dict, synthetic: bool):
    job = executor.store.get_job(job_id)
    if job["state"] not in {"BLOCKED", "REJECTED"}:
        return "STOPPED", {"valid": False, "passed": False, "reason": "job is not complete"}, None, {}, "incomplete_job"
    job_result = job.get("result") or {}
    if not job_result.get("evidence_ref"):
        failure = job_result.get("failure") or {}
        reason = failure.get("reason") or job_result.get("reason") or "executor blocked before evidence"
        return "FAILED", {"valid": False, "passed": False, "reason": reason}, None, {}, "machine_blocked"
    evidence = inspect_evidence(executor.store, job_id)
    if evidence.get("task") != task or evidence.get("route") != job["spec"].get("route"):
        raise StructuredMissionError("saved evidence does not match the pinned structured task")
    from .verifier import verify
    replayed = verify(task, evidence["result"])
    if replayed != evidence.get("verification"):
        raise StructuredMissionError("saved verifier evidence does not reproduce")
    actual = parse_output(evidence["result"].get("output"))
    passed = replayed.get("valid") is True and replayed.get("passed") is True and output_matches(schema_id, rows, expected, actual)
    fields = field_verdicts(schema_id, rows, expected, actual)
    if synthetic:
        status, reviewer = "REVIEW_PENDING", "synthetic_only"
    elif passed:
        status, reviewer = "VERIFIED", "independent_oracle_verified" if schema_id == CLASSIFICATION_SCHEMA else "deterministic_exact_verified"
    else:
        status, reviewer = "FAILED", "machine_rejected"
    reason = "passed" if passed else (replayed.get("reason") if not replayed.get("passed")
                                       else "field_check_failed")
    verdict = {"valid": bool(replayed.get("valid")), "passed": bool(passed),
               "reason": reason,
               "evaluator": replayed.get("evaluator"), "evidence_ref": job_result.get("evidence_ref")}
    return status, verdict, actual, fields, reviewer


def _replay_job(executor: Executor, task: dict, state: dict):
    job_id = state["job_id"]
    job = executor.store.get_job(job_id)
    expected_route = "tool" if task["category"] == "structured_data" else "local_direct"
    spec = job.get("spec") or {}
    if (spec.get("task") != task or spec.get("route") != expected_route
            or spec.get("mission_id") != state["mission_id"] or spec.get("operation_key") != state["identity"]):
        raise StructuredMissionError("saved job no longer matches its pinned mission task")
    if job["state"] in {"BLOCKED", "REJECTED"} and (job.get("result") or {}).get("evidence_ref"):
        bundle = inspect_evidence(executor.store, job_id)
        if bundle.get("task") != task or bundle.get("route") != expected_route:
            raise StructuredMissionError("saved evidence failed mission identity replay")
