"""Finite, source-bound operator approval for the local v0.4 interface.

Creating a proposal never grants inference. Approval is an operator-owned file;
the interface can read it but cannot create an approved allocation.
"""
from __future__ import annotations

import json
import math
import re
from pathlib import Path

from .adapters.ollama import _loopback
from .code_mission import _reject_store_reparse
from .orchestrator import DEFAULT_CONFIG, config_hash


def _path(value):
    path = Path(value).absolute()
    _reject_store_reparse(path)
    return path.resolve()


def manifest_fingerprint(manifest):
    """Hash the complete operator contract, including its verifier and schema."""
    return config_hash(manifest)


def tool_config():
    return {**DEFAULT_CONFIG, "routes": ["tool"], "max_requests": 0,
            "max_total_tokens": 0, "max_wall_s": 900, "max_cycles": 100,
            "max_storage_bytes": 67108864, "max_retries": 0,
            "_shared_mission": True}


def _validate_approval(value, store_path, allowed_root):
    if not isinstance(value, dict) or value.get("schema_version") != 1 or value.get("approved") is not True:
        raise ValueError("Live inference requires a separate explicit operator approval")
    if not isinstance(value.get("budget_id"), str) or not re.fullmatch(r"[A-Za-z0-9_.-]{1,100}", value["budget_id"]):
        raise ValueError("Approval needs a stable budget_id")
    for key, target in (("store_root", store_path), ("allowed_root", allowed_root)):
        if not isinstance(value.get(key), str) or _path(value[key]) != _path(target):
            raise ValueError("Approval is bound to a different " + key)
    if not isinstance(value.get("approved_by"), str) or not value["approved_by"].strip():
        raise ValueError("Approval must identify the operator")
    if not isinstance(value.get("model_digest"), str) or not re.fullmatch(r"[0-9a-f]{64}", value["model_digest"]):
        raise ValueError("Approval must pin the installed local model digest")
    supplied = value.get("executor_config")
    if not isinstance(supplied, dict) or set(supplied) != set(DEFAULT_CONFIG):
        raise ValueError("Approval must explicitly state every executor configuration field")
    limits = {"max_requests": 24, "max_tokens": 128, "max_total_tokens": 3072,
              "max_cycles": 100, "max_storage_bytes": 67108864}
    for key, ceiling in limits.items():
        if type(supplied[key]) is not int or not 1 <= supplied[key] <= ceiling:
            raise ValueError("Prototype approval exceeds finite " + key + " ceiling")
    for key, ceiling in (("max_wall_s", 1800), ("timeout_s", 120)):
        number = supplied[key]
        if isinstance(number, bool) or not isinstance(number, (int, float)) or not math.isfinite(number) or not 0 < number <= ceiling:
            raise ValueError("Prototype approval has invalid " + key)
    if (supplied["concurrency"] != 1 or type(supplied["concurrency"]) is not int
            or type(supplied["max_retries"]) is not int or not 0 <= supplied["max_retries"] <= 2
            or supplied["allow_fixtures"] is not False or type(supplied["seed"]) is not int
            or supplied["routes"] != ["tool", "local_direct"]
            or not isinstance(supplied["model"], str) or not supplied["model"].strip()):
        raise ValueError("Approval requires one worker, explicit tool/local routes, and no fixtures")
    _loopback(supplied["endpoint"])
    tasks = value.get("tasks")
    if not isinstance(tasks, list) or not 1 <= len(tasks) <= 24:
        raise ValueError("Approval needs a finite list of frozen task manifests")
    seen = set()
    for row in tasks:
        if (not isinstance(row, dict) or set(row) != {"id", "manifest_sha256"}
                or not isinstance(row["id"], str) or row["id"] in seen
                or not re.fullmatch(r"[0-9a-f]{64}", str(row["manifest_sha256"]))):
            raise ValueError("Approval task identities must be unique and hash-pinned")
        seen.add(row["id"])
    return dict(supplied)


def load_prototype_config(approval_path, store_path, allowed_root):
    _path(store_path)
    _path(allowed_root)
    if approval_path is None:
        return tool_config()
    path = _path(approval_path)
    if path.stat().st_size > 65536:
        raise ValueError("Approval exceeds 64 KiB")
    approval = json.loads(path.read_text(encoding="utf-8-sig"))
    config = _validate_approval(approval, store_path, allowed_root)
    config.update(_prototype_approval=approval,
                  _expected_model_digest=approval["model_digest"], _shared_mission=True)
    return config


def authorize_mission(config, store_path, manifest):
    """Called before a model task is queued; repeated calls never refill a ledger."""
    approval = config.get("_prototype_approval")
    approved = _validate_approval(approval, store_path, manifest.get("allowed_root"))
    if any(config.get(key) != expected for key, expected in approved.items()):
        raise ValueError("Executor configuration differs from its operator approval")
    if config.get("_expected_model_digest") != approval["model_digest"]:
        raise ValueError("Approved model digest is not pinned")
    task_id = manifest.get("id", manifest.get("mission_id"))
    if {"id": task_id, "manifest_sha256": manifest_fingerprint(manifest)} not in approval["tasks"]:
        raise ValueError("Task/source/schema/verifier contract has not been approved")
    from .storage import Store
    store = Store(_path(store_path))
    try:
        identity = config_hash(approval)
        previous = store.get("prototype_allocation")
        if previous and previous != {"budget_id": approval["budget_id"], "approval_sha256": identity}:
            raise ValueError("Store is already bound to another finite approval")
        if not previous:
            store.set("prototype_allocation", {"budget_id": approval["budget_id"], "approval_sha256": identity})
        store.put_artifact({"kind": "prototype-operator-approval-v1", "approval": approval})
    finally:
        store.close()
    return config
