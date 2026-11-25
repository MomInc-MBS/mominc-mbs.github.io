import copy
import json

import pytest

from hive.orchestrator import DEFAULT_CONFIG
from hive.prototype_approval import authorize_mission, load_prototype_config, manifest_fingerprint


def proposal(tmp_path):
    inputs = tmp_path / "inputs"
    inputs.mkdir()
    manifest = {"id": "real-source", "allowed_root": str(inputs), "input_sha256": "a" * 64}
    value = {"schema_version": 1, "approved": True, "approved_by": "test operator",
             "budget_id": "test-allocation", "store_root": str(tmp_path / "store"),
             "allowed_root": str(inputs), "model_digest": "b" * 64,
             "executor_config": {**DEFAULT_CONFIG, "routes": ["tool", "local_direct"],
                 "max_requests": 24, "max_total_tokens": 3072, "max_wall_s": 900,
                 "max_storage_bytes": 67108864, "max_cycles": 100},
             "tasks": [{"id": manifest["id"], "manifest_sha256": manifest_fingerprint(manifest)}]}
    return manifest, value


def load(tmp_path, value, root=None):
    path = tmp_path / "approval.json"
    path.write_text(json.dumps(value))
    return load_prototype_config(path, root or value["store_root"], value["allowed_root"])


def test_absence_and_proposal_never_authorize_dispatch(tmp_path):
    manifest, value = proposal(tmp_path)
    config = load_prototype_config(None, value["store_root"], value["allowed_root"])
    assert config["max_requests"] == config["max_total_tokens"] == 0
    with pytest.raises(ValueError, match="separate explicit"):
        authorize_mission(config, value["store_root"], manifest)
    value["approved"] = False
    with pytest.raises(ValueError, match="separate explicit"):
        load(tmp_path, value)


def test_approval_cannot_be_rebound_to_another_task_or_store(tmp_path):
    manifest, value = proposal(tmp_path)
    config = load(tmp_path, value)
    authorize_mission(config, value["store_root"], manifest)
    with pytest.raises(ValueError, match="not been approved"):
        authorize_mission(config, value["store_root"], {**manifest, "input_sha256": "c" * 64})
    with pytest.raises(ValueError, match="different store_root"):
        load(tmp_path, value, tmp_path / "fresh-budget")
    changed = copy.deepcopy(config)
    changed["max_requests"] += 1
    with pytest.raises(ValueError, match="differs"):
        authorize_mission(changed, value["store_root"], manifest)


@pytest.mark.parametrize("field,value", [("max_requests", 25), ("max_tokens", 129), ("max_wall_s", float("inf")),
                                         ("allow_fixtures", True), ("concurrency", 2)])
def test_operator_file_does_not_bypass_prototype_hard_limits(tmp_path, field, value):
    _, approval = proposal(tmp_path)
    approval["executor_config"][field] = value
    with pytest.raises(ValueError):
        load(tmp_path, approval)
