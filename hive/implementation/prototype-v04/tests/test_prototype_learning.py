import hashlib
import json
import os
import subprocess
import sys
from pathlib import Path

import pytest

from hive.prototype_learning import prepare_prototype_learning, run_prototype_learning


def _sha(data):
    return hashlib.sha256(data).hexdigest()


def _inventory(root, mission_id, group, row):
    source = ("id,group,bytes\n" + row + "\n").encode("utf-8")
    relative = mission_id + ".csv"
    (root / relative).write_bytes(source)
    return {
        "version": 1,
        "id": mission_id,
        "source_group": group,
        "allowed_root": str(root),
        "input_path": relative,
        "input_sha256": _sha(source),
        "source_format": "csv",
        "task_type": "inventory",
        "schema_id": "grouped_inventory_v1",
        "synthetic_fixture": {"synthetic": True, "source_note": "learning-loop unit fixture"},
    }


def _plan(tmp_path):
    allowed = tmp_path / "allowed"
    allowed.mkdir()
    return {
        "version": 1,
        "id": "inventory-tie-learning",
        "development": _inventory(allowed, "dev-source", "dev-group", "d,alpha,3"),
        "comparison": [
            _inventory(allowed, "compare-a", "compare-group-a", "a,alpha,7"),
            _inventory(allowed, "compare-b", "compare-group-b", "b,beta,11"),
        ],
        "subsequent": _inventory(allowed, "subsequent-source", "subsequent-group", "s,gamma,13"),
    }


def test_prepare_returns_exact_approval_manifests_and_disjoint_sources(tmp_path):
    plan = _plan(tmp_path)
    prepared = prepare_prototype_learning(plan)
    assert prepared["plan"] == plan
    assert len(prepared["required_approval_manifests"]) == 4
    assert prepared["required_approval_tasks"] == [
        {"id": manifest["id"], "manifest_sha256": __import__("hive.prototype_approval", fromlist=["manifest_fingerprint"]).manifest_fingerprint(manifest)}
        for manifest in prepared["required_approval_manifests"]
    ]
    assert len(set(prepared["source_groups"])) == 4
    assert len(set(prepared["input_sha256"])) == 4


def test_synthetic_tool_ties_are_rejected_and_exact_replay_spends_nothing(tmp_path):
    plan = _plan(tmp_path)
    store_path = tmp_path / "store"
    first = run_prototype_learning(plan, store_path)

    assert first["status"] == "REJECTED"
    assert first["candidate_procedure"] == "baseline_v1"
    assert first["selected_procedure"] == "baseline_v1"
    assert first["decision"]["accepted"] is False
    assert first["beneficial_learning"] is False
    assert first["production_promoted"] is False
    assert first["decision"]["p0_changed"] is False
    assert first["subsequent_task_id"] == plan["subsequent"]["id"]
    assert first["executed_subsequent_procedure"] == first["selected_procedure_for_future"] == "baseline_v1"
    assert first["provenance_limitations"]
    arms = {arm["name"]: arm for arm in first["comparison_arms"]}
    assert {"P0", "candidate", "strongest_tool", "fixed_specialist", "fixed_team", "learning_disabled"} <= set(arms)
    assert arms["P0"]["status"] == "REVIEW_PENDING"
    assert arms["candidate"]["aliases"] == ["P0", "fixed_specialist", "learning_disabled"]
    assert arms["strongest_tool"]["aliases"] == ["P0", "candidate", "learning_disabled"]
    assert arms["fixed_team"]["aliases"] == ["P0", "candidate", "strongest_tool"]
    assert first["budget"]["requests"] == first["budget"]["tokens_actual"] == 0
    assert first["budget"]["cycles"] == 4

    replay = run_prototype_learning(plan, store_path)
    assert replay == first
    assert replay["budget"] == first["budget"]
    assert replay["development"]["job_ids"] == first["development"]["job_ids"]


def test_source_reuse_and_frozen_plan_changes_are_rejected_before_work(tmp_path):
    plan = _plan(tmp_path)
    duplicate_source = dict(plan["comparison"][1], source_group=plan["comparison"][0]["source_group"])
    with pytest.raises(ValueError, match="source groups must be pairwise disjoint"):
        prepare_prototype_learning({**plan, "comparison": [plan["comparison"][0], duplicate_source]})

    store_path = tmp_path / "store"
    run_prototype_learning(plan, store_path)
    changed = json.loads(json.dumps(plan))
    changed["comparison"][0]["source_group"] = "changed-group"
    with pytest.raises(ValueError, match="frozen"):
        run_prototype_learning(changed, store_path)


def test_comparison_count_is_bounded():
    with pytest.raises(ValueError, match="1 to 10"):
        prepare_prototype_learning({"version": 1, "id": "bad", "development": {},
                                    "comparison": [], "subsequent": {}})


def test_stop_during_first_output_resumes_without_refilling_budget(tmp_path, monkeypatch):
    import hive.structured_data as structured

    plan = _plan(tmp_path)
    store_path = tmp_path / "store"
    original = structured._atomic_output

    def stop_after_source(*args, **kwargs):
        result = original(*args, **kwargs)
        if str(args[1]).endswith("source.csv"):
            (store_path / "STOP").touch()
        return result

    monkeypatch.setattr(structured, "_atomic_output", stop_after_source)
    stopped = run_prototype_learning(plan, store_path)
    assert stopped["status"] == "STOPPED"
    assert stopped["budget"]["cycles"] == 1
    assert stopped["budget"]["requests"] == 0

    (store_path / "STOP").unlink()
    monkeypatch.setattr(structured, "_atomic_output", original)
    resumed = run_prototype_learning(plan, store_path)
    assert resumed["status"] == "REJECTED"
    assert resumed["budget"]["cycles"] == 4
    assert resumed["budget"]["requests"] == resumed["budget"]["tokens_actual"] == 0
    assert resumed["development"]["job_ids"] == stopped["development"]["job_ids"]


def test_real_source_inventory_learning_replays_across_processes_without_extra_spend(tmp_path):
    repo = Path(__file__).resolve().parents[1]
    allowed = tmp_path / "real-inputs"
    allowed.mkdir()
    source_files = [
        repo / "src" / "hive" / "structured_data.py",
        repo / "src" / "hive" / "structured_verifier.py",
        repo / "src" / "hive" / "data_tasks.py",
        repo / "src" / "hive" / "prototype_approval.py",
    ]
    manifests = []
    for index, source_file in enumerate(source_files):
        relative_source = source_file.relative_to(repo).as_posix()
        rows = [{"id": relative_source, "group": "source", "bytes": len(source_file.read_bytes())}]
        source_bytes = json.dumps(rows, separators=(",", ":"), sort_keys=True).encode("utf-8")
        input_path = f"real-source-{index}.json"
        (allowed / input_path).write_bytes(source_bytes)
        manifests.append({
            "version": 1,
            "id": f"real-source-{index}",
            "source_group": f"real-source-group-{index}",
            "allowed_root": str(allowed),
            "input_path": input_path,
            "input_sha256": _sha(source_bytes),
            "source_format": "json",
            "task_type": "inventory",
            "schema_id": "grouped_inventory_v1",
        })
    plan = {"version": 1, "id": "real-source-tie-learning",
            "development": manifests[0], "comparison": manifests[1:3],
            "subsequent": manifests[3]}
    plan_path = tmp_path / "real-learning-plan.json"
    plan_path.write_text(json.dumps(plan, sort_keys=True), encoding="utf-8")
    store_path = tmp_path / "real-store"

    first = run_prototype_learning(plan_path, store_path)
    assert first["status"] == "REJECTED"
    assert first["decision"]["accepted"] is False
    assert first["development"]["status"] == "VERIFIED"
    assert first["subsequent"]["status"] == "VERIFIED"
    assert all(row["P0"]["status"] == "VERIFIED" and row["candidate"]["status"] == "VERIFIED"
               and row["fixed_team"]["status"] == "VERIFIED" for row in first["comparison_detail"])
    assert first["budget"]["cycles"] == 4
    assert first["budget"]["requests"] == first["budget"]["tokens_actual"] == 0

    script = ("import json,sys; from pathlib import Path; "
              f"sys.path.insert(0, {str(repo / 'src')!r}); "
              "from hive.prototype_learning import run_prototype_learning; "
              "print(json.dumps(run_prototype_learning(sys.argv[1], sys.argv[2]), sort_keys=True))")
    environment = os.environ.copy()
    environment["PYTHONDONTWRITEBYTECODE"] = "1"
    completed = subprocess.run([sys.executable, "-c", script, str(plan_path), str(store_path)],
                               cwd=repo, env=environment, capture_output=True, text=True, check=True)
    replay = json.loads(completed.stdout)
    assert replay == first
    assert replay["budget"] == first["budget"]
