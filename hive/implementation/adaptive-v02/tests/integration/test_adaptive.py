"""Synthetic controller integration checks; these do not invoke a model."""
import os
from pathlib import Path
import subprocess
import sys

import pytest

from hive.adaptive import run_adaptive
from hive.experiment_runner import execute
from hive.orchestrator import DEFAULT_CONFIG
from hive.storage import Store


@pytest.fixture
def synthetic(monkeypatch):
    calls = []

    def fake_execute(task, route, config):
        calls.append((task["id"], task["split"], route))
        result = execute(task, "tool", config)
        if route.startswith("local_"):
            result.update(model=config["model"], model_digest="synthetic-v1", backend="synthetic")
        return result

    monkeypatch.setattr("hive.orchestrator.execute", fake_execute)
    return calls


def test_completed_run_restarts_without_more_execution(tmp_path, synthetic):
    config = dict(DEFAULT_CONFIG, model="synthetic")
    first = run_adaptive(tmp_path, config, rounds=2, seed=20261121)
    count = len(synthetic)
    assert count > 0
    store = Store(tmp_path)
    try:
        state_before = store.get("adaptive_campaign")
        budget_before = store.get("budget")
    finally:
        store.close()
    assert run_adaptive(tmp_path, config, rounds=2, seed=20261121) == first
    assert len(synthetic) == count
    store = Store(tmp_path)
    try:
        assert store.get("adaptive_campaign") == state_before
        assert store.get("budget") == budget_before
        assert store.get("current_checkpoint") is None
        assert all(j["spec"]["task"]["split"] != "holdout" for j in store.jobs())
    finally:
        store.close()


@pytest.mark.parametrize("change", ["config", "seed", "rounds"])
def test_completed_run_rejects_changed_plan(tmp_path, synthetic, change):
    config = dict(DEFAULT_CONFIG, model="synthetic")
    run_adaptive(tmp_path, config, rounds=2, seed=20261121)
    kwargs = {"rounds": 2, "seed": 20261121}
    if change == "config":
        config = dict(config, max_requests=config["max_requests"] + 1)
    elif change == "seed":
        kwargs["seed"] += 1
    else:
        kwargs["rounds"] += 1
    before = len(synthetic)
    with pytest.raises((ValueError, RuntimeError)):
        run_adaptive(tmp_path, config, **kwargs)
    assert len(synthetic) == before


def test_stop_survives_restart_without_execution(tmp_path, synthetic):
    (tmp_path / "STOP").touch()
    config = dict(DEFAULT_CONFIG, model="synthetic")
    for _ in range(2):
        try:
            run_adaptive(tmp_path, config, rounds=2)
        except RuntimeError:
            pass  # A stopped mission may report the barrier as an exception.
    assert synthetic == []
    assert (tmp_path / "STOP").exists()


def test_budget_exhaustion_survives_restart(tmp_path, synthetic):
    config = dict(DEFAULT_CONFIG, model="synthetic", max_cycles=3)
    for _ in range(2):
        try:
            run_adaptive(tmp_path, config, rounds=2)
        except RuntimeError:
            pass
    assert len(synthetic) == 3
    store = Store(tmp_path)
    try:
        assert store.get("budget")["cycles"] == 3
    finally:
        store.close()


def test_default_schedule_is_executable(tmp_path, synthetic):
    report = run_adaptive(tmp_path, dict(DEFAULT_CONFIG, model="synthetic"))
    assert len(report["candidates"]) == 3
    assert all(not candidate["promote_eligible"] for candidate in report["candidates"])


def test_process_death_resumes_completed_jobs_without_reexecution(tmp_path):
    """The test adapter is synthetic and the first interpreter exits abruptly."""
    script = r'''
import os, sqlite3, sys
from pathlib import Path
from hive.adaptive import run_adaptive
from hive.experiment_runner import execute
from hive.orchestrator import DEFAULT_CONFIG, Executor
import hive.orchestrator as orchestrator
root, crash = Path(sys.argv[1]), sys.argv[2] == "crash"
def fake(task, route, config):
    with sqlite3.connect(root / "hive.sqlite3") as db:
        job_id = db.execute("SELECT id FROM jobs WHERE state = 'RUNNING'").fetchone()[0]
    with (root / "synthetic-calls.txt").open("a", encoding="utf-8") as f:
        f.write(job_id + "\n")
    result = execute(task, "tool", config)
    if route.startswith("local_"):
        result.update(model=config["model"], model_digest="synthetic-v1", backend="synthetic")
    return result
orchestrator.execute = fake
original = Executor.run_one
n = [0]
def crash_after_completed(self):
    if crash and n[0] == 5: os._exit(23)
    result = original(self)
    n[0] += 1
    return result
Executor.run_one = crash_after_completed
run_adaptive(root, dict(DEFAULT_CONFIG, model="synthetic"), rounds=2, seed=20261121)
'''
    env = dict(os.environ, PYTHONPATH=str(Path(__file__).resolve().parents[2] / "src"))
    crashed = subprocess.run([sys.executable, "-c", script, str(tmp_path), "crash"], env=env, capture_output=True, text=True)
    assert crashed.returncode == 23, crashed.stderr
    before = (tmp_path / "synthetic-calls.txt").read_text().splitlines()
    resumed = subprocess.run([sys.executable, "-c", script, str(tmp_path), "resume"], env=env, capture_output=True, text=True)
    assert resumed.returncode == 0, resumed.stderr
    all_calls = (tmp_path / "synthetic-calls.txt").read_text().splitlines()
    # Completed job keys must not be repeated after recovery.
    assert all_calls[:len(before)] == before
    assert not set(before) & set(all_calls[len(before):])
    again = subprocess.run([sys.executable, "-c", script, str(tmp_path), "resume"], env=env, capture_output=True, text=True)
    assert again.returncode == 0, again.stderr
    assert (tmp_path / "synthetic-calls.txt").read_text().splitlines() == all_calls
