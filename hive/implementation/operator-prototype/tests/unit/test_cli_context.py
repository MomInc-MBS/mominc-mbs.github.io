"""CLI integration tests for HIVE context governance commands."""
from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path("D:/Repos/hive-ai")
HIVE_PYTHON = [sys.executable, "-m", "hive"]


def hive(store: str, *args):
    env = dict(os.environ, PYTHONPATH=str(REPO_ROOT / "src"))
    out = subprocess.run(HIVE_PYTHON + ["--store", store, *args],
                         capture_output=True, text=True, env=env, cwd=str(REPO_ROOT))
    if out.returncode != 0:
        raise AssertionError(f"hive {' '.join(args)} failed: {out.stderr}")
    return json.loads(out.stdout)


def test_context_report_returns_snapshot(tmp_path):
    out = hive(str(tmp_path), "context", "report")
    assert out["schema_version"] == "hive-context-governance-v1"
    assert out["mode"] == "enforce"
    assert "models" in out
    assert "budget_state" in out


def test_context_emergency_stop_then_report(tmp_path):
    hive(str(tmp_path), "context", "emergency-stop", "--reason", "test stop")
    snap = hive(str(tmp_path), "context", "report")
    hive(str(tmp_path), "context", "clear-emergency-stop")
    snap2 = hive(str(tmp_path), "context", "report")
    assert snap["emergency_stop"] is True
    assert snap2["emergency_stop"] is False


def test_preflight_allows_tool_route_run(tmp_path):
    tasks = hive(str(tmp_path), "tasks")
    task_id = tasks[0]["id"]
    queued = hive(str(tmp_path), "run", "--task", task_id, "--route", "tool", "--enqueue-only")
    assert isinstance(queued["queued"], str)
    assert queued["preflight"]["eligible"] is True
    assert queued["preflight"]["checks"]["gate_passed"] is True
