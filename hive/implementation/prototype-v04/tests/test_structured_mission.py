import hashlib
import json
from pathlib import Path

import pytest

from hive.structured_data import mission_task_hash, run_structured_mission
from hive.structured_verifier import StructuredMissionError


def _sha(data):
    return hashlib.sha256(data).hexdigest()


def _inventory(tmp_path):
    allowed = tmp_path / "input"
    allowed.mkdir()
    source = b"id,group,bytes\na,photos,7\nb,photos,11\nc,logs,3\n"
    (allowed / "rows.csv").write_bytes(source)
    return allowed, source, {"version": 1, "id": "fixture-inventory", "source_group": "synthetic-fixture",
        "allowed_root": str(allowed), "input_path": "rows.csv", "input_sha256": _sha(source),
        "source_format": "csv", "task_type": "inventory", "schema_id": "grouped_inventory_v1",
        "synthetic_fixture": {"synthetic": True, "source_note": "unit test fixture"}}


def _read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def test_tool_inventory_emits_exact_downstream_artifacts_and_replays(tmp_path):
    allowed, source, manifest = _inventory(tmp_path)
    store = tmp_path / "store"
    result = run_structured_mission(manifest, store)
    assert result["status"] == "REVIEW_PENDING"
    assert result["synthetic"] is True
    assert result["reviewer_state"] == "synthetic_only"
    assert result["machine_verdict"]["valid"] is True
    assert result["machine_verdict"]["passed"] is True
    assert result["budget"]["requests"] == 0
    assert result["budget"]["tokens_reserved"] == result["budget"]["tokens_actual"] == 0
    assert (allowed / "rows.csv").read_bytes() == source
    data = _read_json(result["named_outputs"]["data.json"])
    assert data["rows"] == [
        {"id": "a", "group": "photos", "bytes": 7},
        {"id": "b", "group": "photos", "bytes": 11},
        {"id": "c", "group": "logs", "bytes": 3},
    ]
    assert data["normalized"] == {"groups": {"logs": {"count": 1, "bytes": 3},
                                                  "photos": {"count": 2, "bytes": 18}}}
    assert result["identity"]["source_group"] == "synthetic-fixture"
    assert result["identity"]["input_sha256"] == _sha(source)
    assert mission_task_hash(manifest) == result["identity"]["task_hash"]
    assert result["identity"]["evidence_ref"].startswith("artifacts/")
    replay = run_structured_mission(manifest, store)
    assert replay == result
    assert replay["budget"] == result["budget"]


def test_classification_without_independent_oracle_stays_pending_without_jobs(tmp_path):
    allowed = tmp_path / "input"
    allowed.mkdir()
    source = b'id,text\n1,"invoice was charged twice"\n2,"parcel never arrived"\n'
    (allowed / "items.csv").write_bytes(source)
    manifest = {"version": 1, "id": "fixture-labels", "source_group": "synthetic-fixture",
        "allowed_root": str(allowed), "input_path": "items.csv", "input_sha256": _sha(source),
        "source_format": "csv", "task_type": "classification", "schema_id": "independent_labels_v1",
        "labels": ["billing", "shipping"],
        "synthetic_fixture": {"synthetic": True, "source_note": "unit test fixture"}}
    result = run_structured_mission(manifest, tmp_path / "store")
    assert result["status"] == "REVIEW_PENDING"
    assert result["job_ids"] == []
    assert result["budget"]["requests"] == 0
    assert result["reviewer_state"] == "awaiting_independent_oracle"
    assert result["machine_verdict"]["passed"] is False
    assert _read_json(result["named_outputs"]["data.json"])["normalized"] is None


class _FakeAdapter:
    def __init__(self, output):
        self.output = output
        self.prompt = None

    def generate(self, model, prompt, **kwargs):
        self.prompt = prompt
        return self.output, model, "fixture-model-digest", 5


@pytest.mark.parametrize("output,shape_valid,passed", [
    ('{"labels":{"1":"billing","2":"shipping"}}', True, True),
    ('{"labels":{"1":"billing","2":"unknown"},"note":"extra"}', False, False),
])
def test_classification_uses_host_oracle_and_synthetic_model_never_verifies(tmp_path, monkeypatch,
                                                                            output, shape_valid, passed):
    import hive.prototype_approval as approval

    allowed = tmp_path / "input"
    allowed.mkdir()
    source = b'id,text\n1,"invoice was charged twice"\n2,"parcel never arrived"\n'
    oracle = b'{"labels":{"1":"billing","2":"shipping"}}'
    (allowed / "items.csv").write_bytes(source)
    (allowed / "expected.json").write_bytes(oracle)
    manifest = {"version": 1, "id": "fixture-classifier", "source_group": "synthetic-fixture",
        "allowed_root": str(allowed), "input_path": "items.csv", "input_sha256": _sha(source),
        "source_format": "csv", "task_type": "classification", "schema_id": "independent_labels_v1",
        "labels": ["billing", "shipping"], "oracle_path": "expected.json", "oracle_sha256": _sha(oracle),
        "synthetic_fixture": {"synthetic": True, "source_note": "mock model only"}}
    adapter = _FakeAdapter(output)
    config = {**approval.DEFAULT_CONFIG, "routes": ["tool", "local_direct"], "model": "fixture-model",
        "max_requests": 1, "max_tokens": 16, "max_total_tokens": 16, "max_cycles": 1,
        "max_retries": 0, "allow_fixtures": True, "adapter": adapter,
        "_prototype_approval": {"approved": True, "synthetic_test": True},
        "_shared_mission": True}
    monkeypatch.setattr(approval, "authorize_mission", lambda cfg, store, mission: cfg)
    result = run_structured_mission(manifest, tmp_path / "store", executor_config=config)
    assert result["status"] == "REVIEW_PENDING"
    assert result["synthetic"] is True
    assert result["budget"]["requests"] == 1
    assert result["machine_verdict"]["passed"] is passed
    assert result["schema_verdict"]["shape_valid"] is shape_valid
    assert result["identity"]["source_sha256"] == _sha(source)
    assert result["identity"]["model_digest"].startswith("test-adapter:")
    assert '"expected"' not in adapter.prompt
    assert "expected.json" not in adapter.prompt
    if passed:
        assert result["failure_reason"] is None
    else:
        assert result["failure_reason"]
        from hive.storage import Store
        durable = Store(tmp_path / "store")
        try:
            key = "structured_mission:" + manifest["id"]
            state = durable.get(key)
            state["result"]["machine_verdict"]["passed"] = True
            durable.set(key, state)
        finally:
            durable.close()
        with pytest.raises(StructuredMissionError, match="verdict failed independent replay"):
            run_structured_mission(manifest, tmp_path / "store", executor_config=config)
    assert result["reviewer_state"] == "synthetic_only"


def test_changed_input_hash_and_path_traversal_are_rejected(tmp_path):
    allowed, source, manifest = _inventory(tmp_path)
    changed = dict(manifest, input_sha256="0" * 64)
    with pytest.raises(StructuredMissionError, match="pinned SHA-256"):
        run_structured_mission(changed, tmp_path / "store-a")
    traversal = dict(manifest, input_path="../outside.csv")
    with pytest.raises(StructuredMissionError, match="beneath allowed_root"):
        run_structured_mission(traversal, tmp_path / "store-b")


def test_changed_executor_identity_cannot_replay_same_mission_id(tmp_path):
    _, _, manifest = _inventory(tmp_path)
    store = tmp_path / "store"
    run_structured_mission(manifest, store)
    with pytest.raises(StructuredMissionError, match="bound to changed source/config/verifier"):
        run_structured_mission(manifest, store, executor_config={"max_wall_s": 59})


def test_schema_contract_is_valid_json_and_alias_identity_is_checked():
    schema_path = Path(__file__).resolve().parents[1] / "schemas" / "structured-task-v1.json"
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    assert schema["properties"]["procedure"]["enum"] == ["baseline_v1", "labels_json_recovery_v1"]
    manifest = {"version": 1, "id": "same", "mission_id": "other"}
    with pytest.raises(StructuredMissionError, match="safe 1 to 64 character"):
        from hive.structured_data import _validate_manifest
        _validate_manifest(manifest)


def test_stop_before_dispatch_commits_no_final_output_and_resumes(tmp_path):
    _, _, manifest = _inventory(tmp_path)
    store = tmp_path / "store"
    store.mkdir()
    (store / "STOP").touch()
    stopped = run_structured_mission(manifest, store)
    assert stopped["status"] == "STOPPED" and stopped["named_outputs"] == {}
    assert stopped["budget"]["requests"] == stopped["budget"]["cycles"] == 0
    (store / "STOP").unlink()
    result = run_structured_mission(manifest, store)
    assert result["machine_verdict"]["passed"] and result["budget"]["cycles"] == 1


def test_stop_during_output_commit_resumes_verified_receipt_without_dispatch(tmp_path, monkeypatch):
    import hive.structured_data as module
    _, _, manifest = _inventory(tmp_path)
    store = tmp_path / "store"
    original = module._atomic_output
    def stop_after_source(*args, **kwargs):
        value = original(*args, **kwargs)
        if str(args[1]).endswith("source.csv"):
            (store / "STOP").touch()
        return value
    monkeypatch.setattr(module, "_atomic_output", stop_after_source)
    stopped = run_structured_mission(manifest, store)
    assert stopped["status"] == "STOPPED" and stopped["budget"]["cycles"] == 1
    (store / "STOP").unlink()
    monkeypatch.setattr(module, "_atomic_output", original)
    result = run_structured_mission(manifest, store)
    assert result["machine_verdict"]["passed"]
    assert result["budget"] == stopped["budget"]


def test_crashed_model_reservation_cannot_silently_dispatch_again(tmp_path, monkeypatch):
    import hive.prototype_approval as approval
    import hive.storage as storage
    allowed = tmp_path / "input"
    allowed.mkdir()
    source = b'[{"id":"a","text":"invoice"}]'
    oracle = b'{"labels":{"a":"billing"}}'
    (allowed / "source.json").write_bytes(source)
    (allowed / "oracle.json").write_bytes(oracle)
    manifest = {"version": 1, "id": "interrupted-classification", "source_group": "mock-only",
        "allowed_root": str(allowed), "input_path": "source.json", "input_sha256": _sha(source),
        "source_format": "json", "task_type": "classification", "schema_id": "independent_labels_v1",
        "labels": ["billing", "shipping"], "oracle_path": "oracle.json", "oracle_sha256": _sha(oracle),
        "synthetic_fixture": {"synthetic": True}}
    class InterruptedAdapter:
        calls = 0
        def generate(self, *args, **kwargs):
            self.calls += 1
            raise KeyboardInterrupt("simulated process death after reservation")
    adapter = InterruptedAdapter()
    config = {**approval.DEFAULT_CONFIG, "routes": ["tool", "local_direct"],
        "adapter": adapter, "allow_fixtures": True, "max_requests": 3, "max_tokens": 16,
        "max_total_tokens": 48, "max_cycles": 3, "max_retries": 0,
        "_prototype_approval": {"approved": True, "synthetic_test": True}, "_shared_mission": True}
    monkeypatch.setattr(approval, "authorize_mission", lambda cfg, *_: cfg)
    with pytest.raises(KeyboardInterrupt):
        run_structured_mission(manifest, tmp_path / "store", executor_config=config)
    monkeypatch.setattr(storage, "_alive", lambda pid: False)
    resumed = run_structured_mission(manifest, tmp_path / "store", executor_config=config)
    assert resumed["status"] == "STOPPED" and adapter.calls == 1
    assert resumed["budget"]["requests"] == 1 and resumed["budget"]["tokens_reserved"] == 16
    assert "reconciliation" in resumed["failure_reason"]


def test_dag_stop_during_child_resumes_same_attempt_and_budget(tmp_path, monkeypatch):
    import hive.structured_data as module
    from hive.mission import run_mission_manifest
    _, _, child = _inventory(tmp_path)
    store = tmp_path / "dag-store"
    manifest = {"schema_version": 1, "id": "stop-resume-dag", "stages": [
        {"id": "data", "family": "structured_data", "manifest": child},
        {"id": "review", "family": "review", "depends_on": ["data"]}]}
    original = module._atomic_output
    def stop_after_source(*args, **kwargs):
        value = original(*args, **kwargs)
        if str(args[1]).endswith("source.csv"):
            (store / "STOP").touch()
        return value
    monkeypatch.setattr(module, "_atomic_output", stop_after_source)
    stopped = run_mission_manifest(manifest, store)
    assert stopped["status"] == "STOPPED"
    assert stopped["stages"]["data"]["attempts"] == 1
    (store / "STOP").unlink()
    monkeypatch.setattr(module, "_atomic_output", original)
    resumed = run_mission_manifest(manifest, store)
    assert resumed["status"] == "FAILED"  # fixture evidence cannot satisfy real review
    assert resumed["stages"]["data"]["attempts"] == 1
    assert resumed["budget"] == stopped["budget"]


def test_saved_verdict_tamper_cannot_upgrade_independent_evidence(tmp_path):
    from hive.storage import Store
    _, _, manifest = _inventory(tmp_path)
    root = tmp_path / "store"
    result = run_structured_mission(manifest, root)
    assert result["status"] == "REVIEW_PENDING"
    store = Store(root)
    try:
        row = store.db.execute("SELECT key FROM kv WHERE key LIKE 'structured_mission:%'").fetchone()
        state = store.get(row["key"])
        state["status"] = state["result"]["status"] = "VERIFIED"
        state["result"]["reviewer_state"] = "deterministic_exact_verified"
        store.set(row["key"], state)
        before = store.get("budget")
    finally:
        store.close()
    with pytest.raises(StructuredMissionError, match="verdict failed independent replay"):
        run_structured_mission(manifest, root)
    store = Store(root)
    try:
        assert store.get("budget") == before
    finally:
        store.close()


@pytest.mark.parametrize("signal,stage_id", [("STOP", "data"), ("STOP", "report"), ("CANCEL", "report")])
def test_completed_dag_replay_honors_interrupt_and_resumes_without_spend(tmp_path, monkeypatch, signal, stage_id):
    import hive.mission as mission
    from hive.orchestrator import Executor
    source = Path(mission.__file__).read_bytes()
    allowed = tmp_path / "inputs"
    allowed.mkdir()
    raw = json.dumps([{"id": "src/hive/mission.py", "group": "source", "bytes": len(source)}]).encode()
    (allowed / "source.json").write_bytes(raw)
    child = {"version": 1, "id": "cached-source", "source_group": "actual-source-metadata",
             "allowed_root": str(allowed), "input_path": "source.json", "input_sha256": _sha(raw),
             "source_format": "json", "task_type": "inventory", "schema_id": "grouped_inventory_v1"}
    manifest = {"schema_version": 1, "id": "cached-dag", "require_real_verification": True, "stages": [
        {"id": "data", "family": "structured_data", "manifest": child},
        {"id": "review", "family": "review", "depends_on": ["data"]},
        {"id": "report", "family": "report", "depends_on": ["review"]}]}
    root = tmp_path / "store"
    completed = mission.run_mission_manifest(manifest, root)
    assert completed["status"] == "COMPLETED"
    assert completed["budget"]["cycles"] == 1 and completed["budget"]["requests"] == 0
    original = mission._run_stage
    signal_file = root / ("STOP" if signal == "STOP" else manifest["id"] + ".CANCEL")
    def interrupt_after_replay(stage, *args):
        result = original(stage, *args)
        if stage["id"] == stage_id:
            signal_file.touch()
        return result
    def refuse_dispatch(*args, **kwargs):
        raise AssertionError("Completed replay must not dispatch again")
    monkeypatch.setattr(Executor, "run_one", refuse_dispatch)
    monkeypatch.setattr(mission, "_run_stage", interrupt_after_replay)
    interrupted = mission.run_mission_manifest(manifest, root)
    assert interrupted["status"] == ("STOPPED" if signal == "STOP" else "CANCELLED")
    assert interrupted["stages"] == completed["stages"]
    assert interrupted["budget"] == completed["budget"]
    signal_file.unlink()
    monkeypatch.setattr(mission, "_run_stage", original)
    resumed = mission.run_mission_manifest(manifest, root)
    assert resumed["status"] == ("COMPLETED" if signal == "STOP" else "CANCELLED")
    assert resumed["stages"] == completed["stages"]
    assert resumed["budget"] == completed["budget"]
