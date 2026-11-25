import json
import os
from pathlib import Path
import subprocess
import sys

import pytest


REPO = Path(__file__).resolve().parents[2]


def _runner_module():
    sys.path.insert(0, str(REPO / "scripts"))
    import objective_smoke
    return objective_smoke


def test_prepare_freezes_twelve_zero_model_synthetic_tasks_without_docker(tmp_path, monkeypatch):
    work = tmp_path / "objective"
    result = subprocess.run([sys.executable, str(REPO / "scripts/objective_smoke.py"),
                             "--prepare-only", "--work", str(work)], cwd=REPO,
                           env=dict(os.environ, PYTHONPATH=str(REPO / "src")),
                           capture_output=True, text=True, timeout=90)
    assert result.returncode == 0, result.stderr
    summary = json.loads(result.stdout)
    assert summary["tasks"] == 12
    assert summary["model_calls_authorized"] == 0
    assert summary["docker_started"] is False

    index = json.loads((work / "inputs.json").read_text(encoding="utf-8"))
    config = json.loads(Path(index["config"]).read_text(encoding="utf-8"))
    assert config["routes"] == ["tool"]
    assert config["max_requests"] == config["max_total_tokens"] == config["max_tokens"] == 0
    assert len(index["code_tasks"]) == len(index["structured_data_tasks"]) == 6
    assert all(row["source_sha256"] and row["config_hash"] for row in index["code_tasks"])
    assert all(row["source_sha256"] and row["config_hash"] for row in index["structured_data_tasks"])
    from hive.code_verifier import validate_manifest
    for row in index["code_tasks"]:
        manifest = json.loads(Path(row["manifest"]).read_text(encoding="utf-8"))
        checked = validate_manifest(manifest)
        assert checked["worker_files"] == ["app.py"]
        assert checked["verifier_path"] not in checked["worker_files"]
        assert len(checked["expected_cases"]) >= 2
    boundary = next(row["task"] for row in index["structured_data_tasks"]
                    if row["id"] == "data-row-count-boundary-256")
    assert len(boundary["input"]["rows"]) == 256

    runner = _runner_module()
    from hive import orchestrator
    runtime = orchestrator.code_version()
    monkeypatch.setattr(orchestrator, "code_version",
                        lambda: {**runtime, "source_sha256": "changed-runtime"})
    with pytest.raises(ValueError, match="changed runtime"):
        runner.prepare(Path(index["plan"]), work)
    monkeypatch.undo()
    config_path = Path(index["config"])
    config_path.write_text(config_path.read_text(encoding="utf-8").replace('"max_cycles": 1', '"max_cycles": 2'),
                           encoding="utf-8")
    with pytest.raises(ValueError, match="config bytes"):
        runner.prepare(Path(index["plan"]), work)


def test_wrong_structured_output_is_valid_but_rejected(tmp_path):
    from hive.verifier import verify
    path = REPO / "experiments/plans/objective-smoke.json"
    plan = json.loads(path.read_text(encoding="utf-8"))
    item = plan["structured_data_tasks"][0]
    task = {"id": item["id"], "category": "structured_data", "split": "development",
            "prompt": "Count rows and sum bytes by group.",
            "input": {"rows": item["rows"], "allowed_tools": ["summarize_inventory"],
                      "tool_schemas": {"summarize_inventory": {"rows": "supplied rows"}}},
            "expected": {"groups": item["expected"]}, "critical": False,
            "evaluator": "grouped_inventory_v1", "allowed_tools": ["summarize_inventory"],
            "tool_schemas": {"summarize_inventory": {"rows": "supplied rows"}},
            "permissions": {"version": 1, "routes": ["tool"]}}
    result = verify(task, {"output": '{"groups":{}}'})
    assert result["valid"] is True
    assert result["passed"] is False


def test_real_executor_data_evidence_replays_with_budget_clamped_timeout(tmp_path):
    runner = _runner_module()
    plan_path = REPO / "experiments/plans/objective-smoke.json"
    work = tmp_path / "objective"
    index = runner.prepare(plan_path, work)
    config = json.loads(Path(index["config"]).read_text(encoding="utf-8"))
    initial = []
    for row in index["structured_data_tasks"]:
        result = runner._run_data(row, work, config)
        assert result["verifier_passed"] is True, result["failures"]
        assert result["costs"]["requests"] == 0
        initial.append(result)

    # Executor records an effective timeout bounded by remaining wall budget.
    # A subprocess exercises the same replay path used by the smoke runner.
    child = subprocess.run([sys.executable, str(REPO / "scripts/objective_smoke.py"),
                            "--replay-data", "--work", str(work)], cwd=REPO,
                           env=dict(os.environ, PYTHONPATH=str(REPO / "src")),
                           capture_output=True, text=True, timeout=60)
    assert child.returncode == 0, child.stderr
    replay = json.loads(child.stdout)
    assert len(replay) == len(initial) == 6
    for result in initial:
        saved = replay[result["id"]]
        assert saved["errors"] == []
        assert saved["output_hash"] == result["output_hash"]
        assert saved["costs"] == result["costs"]


def test_runner_records_code_exceptions_and_unknown_costs(monkeypatch, tmp_path):
    import hive.code_mission
    runner = _runner_module()
    monkeypatch.setattr(hive.code_mission, "run_code_mission",
                        lambda *args, **kwargs: (_ for _ in ()).throw(RuntimeError("synthetic failure")))
    row = {"id": "fixture", "manifest": "unused", "input_hash": "input",
           "source_sha256": "source", "patch_ids": ["patch"]}
    result = runner._run_code(row, tmp_path, {})
    assert result["verifier_passed"] is False
    assert result["costs"] == {"requests": None, "tokens_reserved": None,
                              "tokens_actual": None, "cycles": None, "wall_s": None}
    assert "synthetic failure" in result["failures"][0]


def test_code_result_needs_the_exact_verified_real_patch_set(monkeypatch, tmp_path):
    import hive.code_mission
    runner = _runner_module()
    valid = {"status": "VERIFIED", "synthetic": False,
             "patches": {"patch": {"state": "VERIFIED", "verification": {
                 "valid": True, "passed": True, "synthetic": False}}},
             "budget": {"requests": 0, "tokens_reserved": 0, "tokens_actual": 0,
                        "cycles": 1, "wall_s": 1.0}}
    monkeypatch.setattr(hive.code_mission, "run_code_mission", lambda *args, **kwargs: valid)
    row = {"id": "fixture", "manifest": "unused", "input_hash": "input",
           "source_sha256": "source", "patch_ids": ["patch"]}
    result = runner._run_code(row, tmp_path, {})
    assert result["verifier_passed"] is True
    valid["patches"]["extra"] = valid["patches"]["patch"]
    result = runner._run_code(row, tmp_path, {})
    assert result["verifier_passed"] is False
    assert any("patch set differs" in failure for failure in result["failures"])


def test_report_gate_and_cli_reject_incomplete_or_failed_smokes(monkeypatch, capsys, tmp_path):
    runner = _runner_module()
    tasks = [{"verifier_passed": True, "replayed": True,
              "costs": {"requests": 0, "tokens_reserved": 0, "tokens_actual": 0}}
             for _ in range(12)]
    report = {"task_count": 12, "tasks": tasks, "actual_model_requests": 0,
              "all_verifiers_passed": True, "all_replayed_with_equal_budget": True,
              "replay_child_errors": [],
              "negative_verifier_probe": {"valid": True, "passed": False}}
    assert runner._report_success(report) is True
    report["tasks"] = tasks[:-1]
    assert runner._report_success(report) is False
    report["tasks"] = tasks
    report["actual_model_requests"] = 1
    assert runner._report_success(report) is False
    report["actual_model_requests"] = 0
    report["replay_child_errors"] = ["replay timed out"]
    assert runner._report_success(report) is False
    report["replay_child_errors"] = []
    monkeypatch.setattr(sys, "argv", ["objective_smoke.py", "--work", str(tmp_path)])
    monkeypatch.setattr(runner, "run", lambda *args, **kwargs: {"passed": False, "report": "failed"})
    with pytest.raises(SystemExit) as exc:
        runner.main()
    assert exc.value.code == 1
    assert json.loads(capsys.readouterr().out)["passed"] is False
