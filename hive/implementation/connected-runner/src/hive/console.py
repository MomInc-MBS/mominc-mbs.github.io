"""Thin authenticated loopback operator console; no browser execution authority."""
from __future__ import annotations

import copy
import hashlib
import hmac
import json
import re
import secrets
import stat
import threading
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

from .checkpoint_manager import Checkpoints
from .orchestrator import config_hash, worker_lock
from .prototype_approval import load_prototype_config, manifest_fingerprint
from .storage import Store

MAX_BODY = 32 * 1024
MAX_SOURCE = 2 * 1024 * 1024
_ID = re.compile(r"[A-Za-z0-9_.-]{1,100}\Z")


def _no_reparse(path):
    path = Path(path).absolute()
    probe = Path(path.anchor)
    for part in path.parts[1:]:
        probe /= part
        if probe.exists() or probe.is_symlink():
            info = probe.lstat()
            if stat.S_ISLNK(info.st_mode) or getattr(info, "st_file_attributes", 0) & 0x400:
                raise ValueError("symlinks and reparse points are forbidden")


def _under(root, raw, *, file=True):
    if not isinstance(raw, str) or not raw or "\x00" in raw:
        raise ValueError("a permitted relative path is required")
    value = Path(raw)
    candidate = value if value.is_absolute() else root / value
    _no_reparse(candidate)
    candidate = candidate.resolve(strict=True)
    if not candidate.is_relative_to(root) or (file and not candidate.is_file()):
        raise ValueError("path is outside the permitted source directory")
    return candidate


def _bounded_read(path):
    if path.stat().st_size > MAX_SOURCE:
        raise ValueError("source exceeds the 2 MiB console limit")
    with path.open("rb") as handle:
        data = handle.read(MAX_SOURCE + 1)
    if len(data) > MAX_SOURCE:
        raise ValueError("source exceeds the 2 MiB console limit")
    return data


def _project(value):
    """Allowlist status fields; never serialize task inputs, answers, or evaluator records."""
    fields = {"status", "state", "stage", "stage_id", "family", "attempts", "job_id", "job_ids", "mission_id",
              "identity", "budget", "field_verdicts", "reviewer_state", "verification", "passed", "valid", "quality",
              "policy_hash", "model", "model_digest", "source_sha256", "input_sha256", "schema_id", "source_group",
              "error", "reason", "failure", "classification", "selected_route", "route", "stages", "patches",
              "result", "requests", "tokens_reserved", "tokens_actual", "wall_s", "cycles", "critical_regression",
              "machine_verdict", "prompt_sha256", "verifier_sha256", "policy_sha256", "runtime", "version", "commit",
              "source_sha256", "task_hash", "config_hash", "mission_identity", "source_schema", "evaluator", "synthetic",
              "prior_policy", "hypothesis", "source_groups", "comparison_arms", "name", "aliases", "decision",
              "subsequent_task_id", "beneficial_learning", "production_promoted", "candidate_ref"}
    if isinstance(value, dict):
        result = {}
        for key, item in value.items():
            if key not in fields:
                continue
            if key in {"stages", "patches"} and isinstance(item, dict):
                result[key] = {name: _project(record) for name, record in list(item.items())[:100]}
            elif key == "field_verdicts":
                # Field verdicts contain boolean checks only, never expected answers.
                def booleans(record):
                    if isinstance(record, dict):
                        return {name: booleans(child) for name, child in list(record.items())[:300]}
                    return record if type(record) is bool else None
                result[key] = booleans(item)
            else:
                result[key] = _project(item)
        return result
    if isinstance(value, list):
        return [_project(item) for item in value[:200]]
    if isinstance(value, str):
        return value[:2000]
    return value


def _safe_error(exc):
    """Only controlled validation messages cross the local API boundary."""
    if isinstance(exc, ValueError) and (type(exc) is ValueError or type(exc).__module__.startswith("hive.")):
        message = str(exc)
        if not any(marker in message for marker in ("{", "[", "Traceback", "\\", ":/")):
            return message[:400]
    return type(exc).__name__ + ": operation failed; inspect the local store"


class Console:
    def __init__(self, store_path, allowed_root, approval_path=None):
        _no_reparse(store_path)
        _no_reparse(allowed_root)
        self.root = Path(store_path).resolve()
        self.allowed_root = Path(allowed_root).resolve(strict=True)
        if not self.allowed_root.is_dir():
            raise ValueError("allowed_root must be a directory")
        if self.root == self.allowed_root or self.root.is_relative_to(self.allowed_root):
            raise ValueError("the durable store must be outside allowed_root")
        self.config = load_prototype_config(approval_path, self.root, self.allowed_root)
        self.approval_hash = config_hash(self.config.get("_prototype_approval")) if approval_path else None
        self.token = secrets.token_urlsafe(32)
        self.lock = threading.Lock()
        self.thread = None
        self.active_id = None
        with self.store() as store:
            identity = {"config_hash": config_hash(self.config), "approval_sha256": self.approval_hash,
                        "allowed_root": str(self.allowed_root)}
            old = store.get("console_allocation")
            if old is not None and old != identity:
                raise ValueError("this store is bound to its original console allocation; caps cannot be replaced")
            store.set("console_allocation", identity)
        from . import operator_runtime
        self.op = operator_runtime
        operator_runtime.recover(self.root)
        from . import discovery
        discovery.recover(self.root)

    def store(self):
        # New connection in the requesting thread, never a shared SQLite connection.
        from contextlib import contextmanager
        @contextmanager
        def connection():
            store = Store(self.root)
            try:
                yield store
            finally:
                store.close()
        return connection()

    def sources(self):
        result = []
        for path in self.allowed_root.rglob("*"):
            if len(result) >= 300:
                break
            rel = path.relative_to(self.allowed_root)
            if any(part.startswith(".") or part.lower() in {"holdout", "oracle", "oracles", "private", "verifier", "evaluators"} for part in rel.parts) or any(marker in path.stem.lower() for marker in ("oracle", "verifier", "holdout")):
                continue
            if path.suffix.lower() not in {".csv", ".json"} or not path.is_file() or path.is_relative_to(self.root):
                continue
            try:
                _under(self.allowed_root, str(path))
                if path.stat().st_size <= MAX_SOURCE:
                    kind, registered_id = "source", None
                    if path.suffix.lower() == ".json":
                        data = json.loads(_bounded_read(path).decode("utf-8-sig"))
                        if isinstance(data, dict) and data.get("version") == 1 and data.get("task_type") in {"inventory", "classification"}:
                            kind, registered_id = "data", data.get("id")
                        if isinstance(data, dict) and data.get("schema_version") == 1:
                            if "repo" in data and "verifier" in data:
                                kind = "code"
                            elif "stages" in data or data.get("family") == "code" and "manifest" in data:
                                kind = "combined"
                            registered_id = data.get("id")
                    result.append({"path": rel.as_posix(), "kind": kind, "bytes": path.stat().st_size,
                                   "id": registered_id})
            except (ValueError, OSError, UnicodeError):
                continue
        return sorted(result, key=lambda row: row["path"])

    def oracles(self):
        """References only: these host-side files never have a download endpoint."""
        result = []
        for path in self.allowed_root.rglob("*.json"):
            rel = path.relative_to(self.allowed_root)
            if len(result) >= 100:
                break
            if ("oracle" not in path.stem.lower() and not any(part.lower() in {"private", "oracle", "oracles"} for part in rel.parts[:-1])):
                continue
            try:
                checked = _under(self.allowed_root, str(path))
                if checked.stat().st_size <= 65536:
                    result.append({"path": rel.as_posix(), "sha256": hashlib.sha256(_bounded_read(checked)).hexdigest()})
            except (OSError, ValueError):
                continue
        return sorted(result, key=lambda row: row["path"])

    def _manifest(self, request):
        if not isinstance(request, dict) or set(request) - {"id", "family", "source", "schema_id", "source_group", "labels", "route", "code_manifest", "data_type", "case_id", "pointer", "argument", "oracle"}:
            raise ValueError("unsupported submission fields")
        mission_id, family = request.get("id"), request.get("family")
        if not isinstance(mission_id, str) or not _ID.fullmatch(mission_id):
            raise ValueError("mission id must contain 1..100 letters, digits, dots, underscores or hyphens")
        source = _under(self.allowed_root, request.get("source"))
        if not any(row["path"] == source.relative_to(self.allowed_root).as_posix() for row in self.sources()):
            raise ValueError("select a registered permitted source")
        raw = _bounded_read(source)
        if family == "registered":
            registered = next((row for row in self.sources() if row["path"] == source.relative_to(self.allowed_root).as_posix()), {})
            if registered.get("kind") not in {"data", "code", "combined"}:
                raise ValueError("choose a registered structured, Python or combined manifest")
            manifest = json.loads(raw.decode("utf-8-sig"))
            if manifest.get("id") != mission_id:
                raise ValueError("use the registered manifest's mission id")
            self._check_registered(manifest, source.parent)
            if registered["kind"] == "combined":
                from .mission import _normalize
                _normalize(manifest, source)
            return {"id": mission_id, "family": registered["kind"], "manifest": manifest, "manifest_path": str(source)}
        if family in {"inventory", "classification", "combined"}:
            if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]{0,58}" if family == "combined" else r"[A-Za-z0-9][A-Za-z0-9_.-]{0,63}", mission_id):
                raise ValueError("data mission IDs need 1..64 safe characters (59 for combined)")
            data_type = request.get("data_type", "inventory") if family == "combined" else family
            if data_type not in {"inventory", "classification"}:
                raise ValueError("unsupported structured task type")
            if source.suffix.lower() not in {".csv", ".json"}:
                raise ValueError("structured source must be CSV or JSON")
            schema = request.get("schema_id")
            expected_schema = "grouped_inventory_v1" if data_type == "inventory" else "independent_labels_v1"
            if schema != expected_schema:
                raise ValueError("choose the supported family schema")
            group = request.get("source_group")
            if not isinstance(group, str) or not _ID.fullmatch(group):
                raise ValueError("a source group is required")
            manifest = {"version": 1, "id": mission_id, "source_group": group,
                        "input_path": source.relative_to(self.allowed_root).as_posix(), "input_sha256": hashlib.sha256(raw).hexdigest(),
                        "allowed_root": str(self.allowed_root), "task_type": data_type, "schema_id": schema, "source_format": source.suffix.lower()[1:]}
            route = request.get("route", "tool" if data_type == "inventory" else "local_direct")
            if data_type == "inventory" and route != "tool":
                raise ValueError("exact inventory uses the deterministic tool")
            if data_type == "classification":
                if route != "local_direct":
                    raise ValueError("classification uses only the pinned local_direct route")
                labels = request.get("labels")
                if not isinstance(labels, list) or not 2 <= len(labels) <= 50 or any(not isinstance(x, str) or not x.strip() or len(x) > 100 for x in labels) or len(set(labels)) != len(labels):
                    raise ValueError("classification needs 2..50 unique short labels")
                manifest["labels"] = labels
                if request.get("oracle"):
                    oracle = next((row for row in self.oracles() if row["path"] == request["oracle"]), None)
                    if oracle is None:
                        raise ValueError("choose a registered host-only oracle reference")
                    manifest.update(oracle_path=oracle["path"], oracle_sha256=oracle["sha256"])
            if family == "combined":
                code_path = _under(self.allowed_root, request.get("code_manifest"))
                registered = next((row for row in self.sources() if row["path"] == code_path.relative_to(self.allowed_root).as_posix()), {})
                if registered.get("kind") != "code":
                    raise ValueError("combined mission requires a registered Python manifest")
                code = json.loads(_bounded_read(code_path).decode("utf-8-sig"))
                self._check_registered(code, code_path.parent)
                manifest["id"] = mission_id + "-data"
                case_id = request.get("case_id", "source-rows")
                pointer = request.get("pointer", "/rows")
                argument = request.get("argument", 0)
                if not isinstance(case_id, str) or not _ID.fullmatch(case_id) or not isinstance(pointer, str) or len(pointer) > 200 or type(argument) is not int or not 0 <= argument <= 20:
                    raise ValueError("invalid declared Python input binding")
                dag = {"schema_version": 1, "id": mission_id, "stages": [
                    {"id": "data", "family": "structured_data", "manifest": manifest, "depends_on": []},
                    {"id": "python", "family": "code", "manifest": code, "depends_on": ["data"],
                     "input_from": {"stage": "data", "artifact": "data.json", "pointer": pointer,
                                    "case_id": case_id, "argument": argument}},
                    {"id": "review", "family": "review", "depends_on": ["data", "python"]},
                    {"id": "report", "family": "report", "depends_on": ["review"]}]}
                return {"id": mission_id, "family": "combined", "manifest": dag}
            return {"id": mission_id, "family": "data", "manifest": manifest}
        if family not in {"code", "combined"}:
            raise ValueError("unsupported task family")
        registered = next((row for row in self.sources() if row["path"] == source.relative_to(self.allowed_root).as_posix()), {})
        if registered.get("kind") != family:
            raise ValueError("choose a registered manifest for this family")
        manifest = json.loads(raw.decode("utf-8-sig"))
        if manifest.get("id") != mission_id:
            raise ValueError("use the registered manifest's mission id")
        self._check_registered(manifest, source.parent)
        return {"id": mission_id, "family": family, "manifest": manifest, "manifest_path": str(source)}

    def _check_registered(self, manifest, base):
        if not isinstance(manifest, dict):
            raise ValueError("invalid registered manifest")
        if "allowed_root" in manifest:
            _no_reparse(manifest["allowed_root"])
            if Path(manifest["allowed_root"]).resolve() != self.allowed_root:
                raise ValueError("registered manifest is bound to a different permitted source root")
        if "repo" in manifest:
            _under(self.allowed_root, manifest["repo"].get("path"), file=False)
        if "input_path" in manifest:
            _under(self.allowed_root, manifest["input_path"])
        if manifest.get("family") == "code" and "manifest" in manifest:
            child = manifest["manifest"]
            if isinstance(child, str):
                path = _under(self.allowed_root, str(base / child))
                child = json.loads(_bounded_read(path).decode("utf-8-sig"))
                self._check_registered(child, path.parent)
            else:
                self._check_registered(child, base)
        for stage in manifest.get("stages", []):
            if stage.get("family") in {"review", "report"}:
                if stage.get("manifest") is not None:
                    raise ValueError("review and report stages cannot contain an execution manifest")
                continue
            if stage.get("family") not in {"data", "structured_data", "code"}:
                raise ValueError("console registered missions allow data, code, review and report stages")
            child = stage.get("manifest")
            if isinstance(child, str):
                path = _under(self.allowed_root, str(base / child))
                child = json.loads(_bounded_read(path).decode("utf-8-sig"))
                self._check_registered(child, path.parent)
            else:
                self._check_registered(child, base)

    def submit(self, request):
        work = self._manifest(request)
        with self.lock:
            if self.thread and self.thread.is_alive():
                raise ValueError("one mission is already active")
            if (self.root / "STOP").exists():
                raise ValueError("console is paused; resume within the original allocation first")
            with self.store() as store:
                saved = store.get("console_mission:" + work["id"])
                if saved and saved["work"] != work:
                    raise ValueError("mission id is already bound to a different submission")
                store.set("console_mission:" + work["id"], saved or {"work": work, "state": "QUEUED"})
            self.active_id = work["id"]
            self.thread = threading.Thread(target=self._run, args=(work,), name="hive-console-mission", daemon=True)
            self.thread.start()
        return {"mission_id": work["id"], "state": "QUEUED"}

    def _run(self, work):
        key = "console_mission:" + work["id"]
        with self.store() as store:
            record = store.get(key)
            record.update(state="RUNNING", error=None)
            store.set(key, record)
        try:
            if work["family"] == "data":
                from .structured_data import run_structured_mission
                result = run_structured_mission(work["manifest"], self.root, executor_config=copy.deepcopy(self.config))
            elif work["family"] == "code":
                from .code_mission import run_code_mission
                result = run_code_mission(work["manifest"], self.root, executor_config=copy.deepcopy(self.config))
            else:
                from .mission import run_mission_manifest
                result = run_mission_manifest(work["manifest"], self.root, executor_config=copy.deepcopy(self.config))
            with self.store() as store:
                record = store.get(key)
                record.update(state=result.get("status", "UNKNOWN"), result=result)
                store.set(key, record)
        except Exception as exc:
            with self.store() as store:
                record = store.get(key)
                # Detailed host exceptions stay local; API never returns paths/labels from arbitrary errors.
                record.update(state="FAILED", error=_safe_error(exc))
                store.set(key, record)

    # ---- Operator Prototype: retained capabilities through the registry, container executor and independent oracle
    def op_status(self):
        st = self.op.status(self.root)
        import time
        cached = getattr(self, "_readiness", None)
        if not cached or time.monotonic() - cached[0] > 30:  # readiness spawns git/docker; poll at most every 30 s
            cached = self._readiness = (time.monotonic(), self.op.readiness(self.root))
        from . import goal_runner
        with self.store() as store:
            st["goals"] = goal_runner.goals(store)
            from . import discovery
            st["discoveries"] = discovery.discoveries(store)
        st.update(readiness=cached[1], contract=self.op.contract(),
                  active=bool(self.thread and self.thread.is_alive()), active_task=self.active_id)
        return st

    def op_submit(self, request):
        if not isinstance(request, dict) or set(request) - {"op", "sources"}:
            raise ValueError("unsupported submission fields")
        op, paths = request.get("op"), request.get("sources")
        if op not in self.op.load_policy()["operations"]:
            self.op.note_refusal(self.root, op, "unsupported operation")
            raise ValueError("choose a supported operation")
        if not isinstance(paths, list) or not 1 <= len(paths) <= 20 or len(set(paths)) != len(paths):
            raise ValueError("select 1 to 20 distinct permitted files")
        listed = {row["path"] for row in self.sources() if row["kind"] == "source"}
        files = []
        for raw in paths:
            path = _under(self.allowed_root, raw)
            if path.relative_to(self.allowed_root).as_posix() not in listed:
                raise ValueError("select a listed permitted CSV/JSON file")
            files.append((path.name, _bounded_read(path)))
        try:
            self.op.intake_check(op, files)  # Refused is a ValueError with an operator-readable reason
        except self.op.Refused as exc:
            self.op.note_refusal(self.root, op, exc)
            raise
        tid = self.op.task_id(op, files)
        with self.lock:
            if self.thread and self.thread.is_alive():
                raise ValueError("one task is already active")
            self.active_id = tid
            self.thread = threading.Thread(target=self._op_run, args=(op, files), name="hive-operator-task", daemon=True)
            self.thread.start()
        return {"task_id": tid, "state": "SUBMITTED"}

    def op_goal(self, request):
        """A goal enters the same single-task slot as op_submit; the plan comes from registered capabilities."""
        if not isinstance(request, dict) or set(request) - {"goal", "sources", "deliverable", "budget", "allow_discovery"}:
            raise ValueError("unsupported goal fields")
        from . import goal_runner
        listed = {row["path"] for row in self.sources() if row["kind"] == "source"}
        contract, inputs = goal_runner.prepare(self.root, self.allowed_root, request.get("goal"), request.get("sources"),
                                               request.get("deliverable") or None, request.get("budget"), listed,
                                               request.get("allow_discovery") is True)
        if contract.get("state") == "NEEDS_CLARIFICATION":
            return contract
        with self.lock:
            if self.thread and self.thread.is_alive():
                raise ValueError("one task is already active")
            self.active_id = contract["contract_id"]
            self.thread = threading.Thread(target=self._goal_run, args=(contract, inputs), name="hive-operator-goal", daemon=True)
            self.thread.start()
        return {"goal_id": contract["contract_id"], "state": "SUBMITTED"}

    def op_discover(self, request):
        """Run (or resume) one frozen C3 experiment in the single task slot."""
        if not isinstance(request, dict) or set(request) != {"exp_id"} or not isinstance(request["exp_id"], str):
            raise ValueError("an exp_id is required")
        with self.store() as store:
            if not store.get("operator/discovery/" + request["exp_id"]):
                raise ValueError("unknown experiment")
        with self.lock:
            if self.thread and self.thread.is_alive():
                raise ValueError("one task is already active")
            self.active_id = request["exp_id"]
            self.thread = threading.Thread(target=self._discover_run, args=(request["exp_id"],), name="hive-operator-discovery", daemon=True)
            self.thread.start()
        return {"exp_id": request["exp_id"], "state": "SUBMITTED"}

    def _discover_run(self, exp_id):
        from . import discovery
        try:
            discovery.run_experiment(self.root, exp_id)
        except Exception as exc:
            with self.store() as store:
                log = store.get("operator/log", [])
                log.append({"task_id": exp_id, "op": "discovery", "mode": "error", "state": "FAILED", "reason": _safe_error(exc)})
                store.set("operator/log", log[-500:])

    def _goal_run(self, contract, inputs):
        from . import goal_runner
        try:
            goal_runner.run_goal(self.root, contract, inputs)
        except Exception as exc:
            with self.store() as store:
                log = store.get("operator/log", [])
                log.append({"task_id": self.active_id, "op": "goal", "mode": "error", "state": "FAILED", "reason": _safe_error(exc)})
                store.set("operator/log", log[-500:])

    def _op_run(self, op, files):
        try:
            self.op.run_task(self.root, op, files)
        except Exception as exc:  # recorded in the task log by run_task where it can be; never crash the server
            with self.store() as store:
                log = store.get("operator/log", [])
                log.append({"task_id": self.active_id, "op": op, "mode": "error", "state": "FAILED", "reason": _safe_error(exc)})
                store.set("operator/log", log[-500:])

    def op_control(self, action, op):
        if action not in {"rollback", "reselect", "revoke"} or op not in self.op.load_policy()["operations"]:
            raise ValueError("unknown operator control")
        with self.lock:
            if self.thread and self.thread.is_alive():
                raise ValueError("wait for the active task to finish")
            with self.store() as store:
                return {"event": getattr(self.op, action)(store, op), "action": action, "op": op}

    def control(self, action, checkpoint=None):
        if action in {"stop", "pause"}:
            (self.root / "STOP").write_text("Operator console " + action + "\n", encoding="utf-8")
            return {"state": "STOP_REQUESTED", "note": "No new dispatch. In-flight inference ends within its original timeout."}
        if action not in {"resume", "rollback"}:
            raise ValueError("unknown control")
        with self.lock:
            if self.thread and self.thread.is_alive():
                raise ValueError("wait for the active worker to stop before resuming or restoring")
            with worker_lock(self.root), self.store() as store:
                if action == "rollback":
                    Checkpoints(store).rollback(checkpoint)
                    return {"restored": checkpoint}
                (self.root / "STOP").unlink(missing_ok=True)
                recovered = store.recover()
                for job in store.jobs():
                    if job["state"] == "RETRY_READY":
                        store.transition(job["id"], "QUEUED", {"reason": "explicit console resume"})
                return {"state": "RESUMED", "recovered": recovered, "note": "Submit the identical mission again; original caps persist."}

    def status(self):
        with self.store() as store:
            missions = []
            for row in store.db.execute("SELECT key FROM kv WHERE key LIKE 'console_mission:%' ORDER BY key").fetchall():
                record = store.get(row["key"])
                work = record["work"]
                result = record.get("result", {})
                missions.append({"id": work["id"], "family": work["family"], "state": record["state"],
                                 "source": Path(work.get("manifest_path") or work["manifest"].get("input_path", "")).name,
                                 "error": record.get("error"), "result": _project(result),
                                 "artifacts": self._output_refs(result)})
            jobs = []
            for job in store.jobs():
                if job["spec"].get("task", {}).get("split") == "holdout":
                    continue
                jobs.append({"job_id": job["id"], "state": job["state"],
                             "route": job["spec"].get("route"), "verdict": _project(job.get("result") or {}),
                             "history": [event["state"] for event in job["history"]]})
            checkpoints = []
            for row in store.db.execute("SELECT key FROM kv WHERE key LIKE 'checkpoint:%'").fetchall():
                ref = row["key"][len("checkpoint:"):]
                try:
                    Checkpoints(store)._load(ref)
                    checkpoints.append(ref)
                except (ValueError, OSError):
                    continue
            # Candidate records expose aggregate public fields only, never per-case evidence.
            learning = []
            for key in ("prototype_learning", "adaptive_campaign", "integration_report", "frozen_candidate"):
                record = store.get(key)
                if isinstance(record, dict):
                    learning.append({"name": key, "state": record.get("status", record.get("state", "EXPERIMENTAL")),
                                     "summary": _project(record)})
            return {"kill_switch": (self.root / "STOP").exists(), "active": bool(self.thread and self.thread.is_alive()),
                    "missions": missions, "jobs": jobs[-100:], "budget": store.get("budget", {}),
                    "allocation": {key: self.config[key] for key in ("routes", "max_requests", "max_total_tokens", "max_tokens", "max_wall_s", "max_cycles", "max_storage_bytes", "model")},
                    "model_digest": self.config.get("_expected_model_digest"), "policy_hash": config_hash(store.get("policy")),
                    "approved_local_inference": self.approval_hash is not None,
                    "approved_checkpoints": checkpoints, "current_checkpoint": store.get("current_checkpoint"),
                    "learning": learning, "p2_state": "QUARANTINED"}

    def _output_refs(self, result):
        found = []
        def walk(value, hashes, prefix=""):
            if not isinstance(value, dict):
                return
            for name, item in value.items():
                digest = hashes.get(name) if isinstance(hashes, dict) else None
                if isinstance(item, dict):
                    walk(item, digest, prefix + name + "/")
                elif isinstance(item, str) and isinstance(digest, str) and re.fullmatch(r"[a-f0-9]{64}", digest):
                    try:
                        path = _under(self.root / "output", item)
                        if path.stat().st_size > MAX_SOURCE:
                            continue
                        found.append({"name": prefix + name, "ref": path.relative_to(self.root).as_posix(), "sha256": digest})
                    except (OSError, ValueError):
                        continue
        walk(result.get("named_outputs", {}), result.get("named_output_hashes", {}))
        for stage in result.get("stages", {}).values():
            if isinstance(stage, dict) and isinstance(stage.get("result"), dict):
                found.extend(self._output_refs(stage["result"]))
        return found

    def artifact(self, ref):
        allowed = [artifact for mission in self.status()["missions"] for artifact in mission["artifacts"] if artifact["ref"] == ref]
        from . import goal_runner
        hit = self.op.task_artifact(self.root, ref) or goal_runner.goal_artifact(self.root, ref)
        allowed += [hit] if hit else []
        if not allowed:
            raise ValueError("artifact is not an allowlisted generated output")
        path = _under(self.root / "output", str(self.root / ref))
        data = _bounded_read(path)
        if any(hashlib.sha256(data).hexdigest() != item["sha256"] for item in allowed):
            raise ValueError("artifact digest mismatch")
        return data, path.name

    def health(self):
        """Explicit read-only discovery: never loads weights or generates output."""
        from .diagnostics import doctor
        from .adapters.isolation import DockerIsolation, SandboxUnavailable
        report = doctor(self.config, self.root, offline=False)
        runtime = report.get("runtime") or {}
        selected = next((row for row in runtime.get("models", []) if row.get("id") == self.config["model"]), {})
        sandbox = report.get("sandbox") or {}
        images, seen = [], set()
        for row in self.sources():
            if row["kind"] != "code" or len(images) >= 3:
                continue
            manifest = json.loads(_bounded_read(_under(self.allowed_root, row["path"])).decode("utf-8-sig"))
            image = manifest.get("image")
            if not isinstance(image, dict) or not isinstance(image.get("reference"), str) or not re.fullmatch(r"sha256:[0-9a-f]{64}", str(image.get("digest"))):
                continue
            identity = (image["reference"], image["digest"])
            if identity in seen:
                continue
            seen.add(identity)
            try:
                DockerIsolation().inspect(image)
                available = True
            except SandboxUnavailable:
                available = False
            images.append({"reference": image["reference"], "digest": image["digest"], "available": available})
        expected_digest = self.config.get("_expected_model_digest")
        return {"measured_at": datetime.now(timezone.utc).isoformat(), "new_model_calls": 0,
                "runtime_available": runtime.get("available") is True,
                "model": {"id": self.config["model"], "available": selected.get("available") is True,
                          "digest": selected.get("digest"), "approved_digest": expected_digest,
                          "matches_approved_digest": selected.get("digest") == expected_digest if expected_digest else None,
                          "loaded": any(row.get("name") == self.config["model"] for row in (report.get("running_runtime") or {}).get("models", []))},
                "docker": {key: sandbox.get(key) for key in ("status", "daemon_available", "server_version", "os", "enforcement_verified")},
                "registered_pinned_images": images,
                "note": "Read-only measurement. Availability grants no execution authority; isolation enforcement requires a task receipt."}


def create_console_server(store_path, *, allowed_root, host="127.0.0.1", port=8765, approval_path=None):
    """Create a server without starting a browser or performing model health calls."""
    if host != "127.0.0.1":
        raise ValueError("console binds only to 127.0.0.1")
    console = Console(store_path, allowed_root, approval_path)

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass  # Request URLs and credentials never enter access logs.

        def reply(self, status, value, content_type="application/json; charset=utf-8", filename=None):
            body = value if isinstance(value, bytes) else json.dumps(value, allow_nan=False).encode()
            self.send_response(status)
            for key, item in {"Content-Type": content_type, "Content-Length": str(len(body)), "Cache-Control": "no-store",
                              "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer",
                              "Content-Security-Policy": "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"}.items():
                self.send_header(key, item)
            if filename:
                self.send_header("Content-Disposition", 'attachment; filename="' + re.sub(r"[^A-Za-z0-9_.-]", "_", filename) + '"')
            self.end_headers()
            self.wfile.write(body)

        def authorized(self, api):
            expected_host = f"127.0.0.1:{self.server.server_port}"
            if self.headers.get_all("Host") != [expected_host]:
                return False
            origin = self.headers.get("Origin")
            if origin is not None and origin != "http://" + expected_host:
                return False
            if self.headers.get("Sec-Fetch-Site") not in {None, "same-origin", "none"}:
                return False
            token = self.headers.get("Authorization", "")
            return not api or hmac.compare_digest(token, "Bearer " + console.token)

        def do_GET(self):
            parsed = urlsplit(self.path)
            api = parsed.path.startswith("/api/")
            if not self.authorized(api):
                return self.reply(403, {"error": "local authentication required"})
            try:
                if parsed.path in {"/", "/console.js", "/console.css"}:
                    html = Path(__file__).with_name("console.html").read_text(encoding="utf-8")
                    if parsed.path == "/":
                        body, mime = html.encode(), "text/html; charset=utf-8"
                    elif parsed.path == "/console.js":
                        body, mime = html.split("<!--SCRIPT-->")[1].encode(), "text/javascript; charset=utf-8"
                    else:
                        body, mime = html.split("<!--STYLE-->")[1].split("<!--SCRIPT-->")[0].encode(), "text/css; charset=utf-8"
                    if parsed.path == "/":
                        body = html.split("<!--STYLE-->")[0].encode()
                    return self.reply(200, body, mime)
                if parsed.path == "/api/status":
                    return self.reply(200, console.status())
                if parsed.path == "/api/health":
                    return self.reply(200, console.health())
                if parsed.path == "/api/sources":
                    return self.reply(200, {"sources": console.sources()})
                if parsed.path == "/api/operator":
                    return self.reply(200, console.op_status())
                if parsed.path == "/api/oracles":
                    return self.reply(200, {"oracles": console.oracles()})
                if parsed.path == "/api/artifact":
                    query = parse_qs(parsed.query)
                    data, filename = console.artifact(query.get("ref", [None])[0])
                    return self.reply(200, data, "application/octet-stream", filename)
                self.reply(404, {"error": "unknown endpoint"})
            except (ValueError, OSError, KeyError, TypeError):
                self.reply(400, {"error": "request refused; invalid or changed local reference"})

        def do_POST(self):
            if not self.authorized(True):
                return self.reply(403, {"error": "local authentication required"})
            try:
                if self.headers.get("Content-Type", "").split(";")[0] != "application/json" or self.headers.get("Transfer-Encoding"):
                    raise ValueError("JSON body required")
                lengths = self.headers.get_all("Content-Length") or []
                if len(lengths) != 1 or not lengths[0].isdigit() or not 0 < int(lengths[0]) <= MAX_BODY:
                    return self.reply(413, {"error": "bounded Content-Length required (32 KiB maximum)"})
                self.connection.settimeout(5)
                value = json.loads(self.rfile.read(int(lengths[0])))
                if not isinstance(value, dict):
                    raise ValueError("object required")
                if self.path == "/api/prepare":
                    work = console._manifest(value)
                    tasks = [{"id": work["id"], "manifest_sha256": manifest_fingerprint(work["manifest"])}]
                    if work["family"] == "combined":
                        tasks.extend({"id": stage["manifest"]["id"], "manifest_sha256": manifest_fingerprint(stage["manifest"])} for stage in work["manifest"]["stages"] if "manifest" in stage)
                    return self.reply(200, {"id": work["id"], "tasks": tasks, "approved": False})
                if self.path == "/api/submit":
                    return self.reply(202, console.submit(value))
                if self.path == "/api/operator/submit":
                    return self.reply(202, console.op_submit(value))
                if self.path == "/api/operator/goal":
                    return self.reply(202, console.op_goal(value))
                if self.path == "/api/operator/discover":
                    return self.reply(202, console.op_discover(value))
                if self.path == "/api/operator/control" and set(value) <= {"action", "op"}:
                    return self.reply(200, console.op_control(value.get("action"), value.get("op")))
                if self.path == "/api/control" and set(value) <= {"action", "checkpoint"}:
                    return self.reply(200, console.control(value.get("action"), value.get("checkpoint")))
                self.reply(404, {"error": "unknown endpoint"})
            except (ValueError, OSError, KeyError, TypeError) as exc:
                self.reply(400, {"error": _safe_error(exc)})

    class ExclusiveServer(ThreadingHTTPServer):
        allow_reuse_address = False  # Windows SO_REUSEADDR would let two servers share the port
        def server_bind(self):
            import socket
            if hasattr(socket, "SO_EXCLUSIVEADDRUSE"):
                self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
            super().server_bind()

    server = ExclusiveServer((host, port), Handler)
    server.daemon_threads = True
    server.timeout = 1
    server.console = console
    server.browser_url = f"http://127.0.0.1:{server.server_port}/#token={console.token}"
    return server


def serve_console(store_path, *, allowed_root, host="127.0.0.1", port=8765, approval_path=None, open_browser=True):
    """Serve until interrupted. Only a local browser receives the random session token."""
    import webbrowser
    server = create_console_server(store_path, allowed_root=allowed_root, host=host, port=port, approval_path=approval_path)
    print(f"HIVE console listening at http://127.0.0.1:{server.server_port}/", flush=True)
    if open_browser:
        webbrowser.open(server.browser_url)
    else:
        print("Open this authenticated local URL: " + server.browser_url, flush=True)
    try:
        server.serve_forever(poll_interval=0.2)
    except KeyboardInterrupt:
        server.console.control("stop")
    finally:
        server.server_close()
