"""Real loopback HTTP journeys with mocked workers; never real inference."""
import hashlib
import http.client
import json
import sys
import threading
import time
import types

import pytest

from hive.checkpoint_manager import Checkpoints
from hive.console import Console, MAX_BODY, create_console_server
from hive.storage import Store


@pytest.fixture
def console_server(tmp_path):
    inputs = tmp_path / "inputs"
    inputs.mkdir()
    (inputs / "inventory.csv").write_text("item,quantity\nbolt,3\n", encoding="utf-8")
    server = create_console_server(tmp_path / "store", allowed_root=inputs, port=0)
    thread = threading.Thread(target=server.serve_forever, kwargs={"poll_interval": .01}, daemon=True)
    thread.start()
    yield server
    server.shutdown()
    server.server_close()
    thread.join(2)


def request(server, method, path, value=None, *, authenticated=True, headers=None, raw=None):
    connection = http.client.HTTPConnection("127.0.0.1", server.server_port, timeout=2)
    hdr = {"Host": "127.0.0.1:" + str(server.server_port)}
    if authenticated:
        hdr["Authorization"] = "Bearer " + server.console.token
    if value is not None:
        raw = json.dumps(value)
        hdr["Content-Type"] = "application/json"
    hdr.update(headers or {})
    connection.request(method, path, body=raw, headers=hdr)
    response = connection.getresponse()
    body = response.read()
    connection.close()
    return response.status, body, dict(response.getheaders())


def submission(**extra):
    return {"id": "inventory-001", "family": "inventory", "source": "inventory.csv",
            "source_group": "operator-dev", "schema_id": "grouped_inventory_v1", "route": "tool", **extra}


def wait_worker(server):
    server.console.thread.join(3)
    assert not server.console.thread.is_alive()


def test_http_origin_host_token_and_no_credential_logging(console_server, capsys):
    server = console_server
    assert server.server_address[0] == "127.0.0.1"
    assert request(server, "GET", "/api/status", authenticated=False)[0] == 403
    assert request(server, "GET", "/api/status", headers={"Origin": "http://evil.example"})[0] == 403
    assert request(server, "GET", "/api/status", headers={"Origin": "null"})[0] == 403
    assert request(server, "GET", "/api/status", headers={"Host": "evil.example:" + str(server.server_port)})[0] == 403
    assert request(server, "GET", "/api/status", headers={"Sec-Fetch-Site": "cross-site"})[0] == 403
    code, body, headers = request(server, "GET", "/", authenticated=False)
    assert code == 200
    assert server.console.token.encode() not in body
    assert "frame-ancestors 'none'" in headers["Content-Security-Policy"]
    assert request(server, "POST", "/api/control", {"action": "stop"}, authenticated=False)[0] == 403
    assert request(server, "GET", "/console.js", authenticated=False)[0] == 200
    assert request(server, "GET", "/console.css", authenticated=False)[0] == 200
    assert server.console.token not in capsys.readouterr().out
    assert request(server, "GET", "/api/status?token=" + server.console.token, authenticated=False)[0] == 403


def test_submission_paths_body_limits_and_approval_proposal(console_server, tmp_path):
    server = console_server
    outside = tmp_path / "secret.json"
    outside.write_text('{"secret":"never expose"}')
    assert request(server, "POST", "/api/submit", submission(source="../secret.json"))[0] == 400
    assert request(server, "POST", "/api/submit", submission(source=str(outside)))[0] == 400
    assert request(server, "POST", "/api/submit", raw="x" * (MAX_BODY + 1), headers={"Content-Type": "application/json"})[0] == 413
    assert request(server, "POST", "/api/submit", submission(executor_config={"max_requests": 500}))[0] == 400
    code, data, _ = request(server, "POST", "/api/prepare", submission())
    assert code == 200
    proposal = json.loads(data)
    assert proposal["approved"] is False
    assert len(proposal["tasks"][0]["manifest_sha256"]) == 64
    assert "never expose" not in data.decode()
    status = json.loads(request(server, "GET", "/api/status")[1])
    assert status["allocation"]["max_requests"] == 0
    assert not status["approved_local_inference"]
    with pytest.raises(ValueError, match="127.0.0.1"):
        create_console_server(tmp_path / "bad", allowed_root=server.console.allowed_root, host="0.0.0.0", port=0)


def test_stop_remains_responsive_shared_store_replay_and_resume(console_server, monkeypatch):
    server = console_server
    entered = threading.Event()
    calls = []
    model_calls = []
    def worker(manifest, root, executor_config):
        calls.append((manifest["id"], str(root)))
        assert executor_config["max_requests"] == 0
        assert executor_config["routes"] == ["tool"]
        store = Store(root)  # Connection intentionally created inside the worker thread.
        try:
            result = store.get("mock-complete:" + manifest["id"])
            if result:
                return result
            entered.set()
            until = time.monotonic() + 2
            while not (root / "STOP").exists() and time.monotonic() < until:
                time.sleep(.01)
            if (root / "STOP").exists():
                return {"status": "STOPPED"}
            result = {"status": "VERIFIED", "reviewer_state": "INDEPENDENT_EXACT", "job_ids": []}
            store.set("mock-complete:" + manifest["id"], result)
            store.set("budget", {"requests": len(model_calls), "cycles": 1})
            return result
        finally:
            store.close()
    monkeypatch.setitem(sys.modules, "hive.structured_data", types.SimpleNamespace(run_structured_mission=worker))
    assert request(server, "POST", "/api/submit", submission())[0] == 202
    assert entered.wait(1)
    started = time.monotonic()
    assert request(server, "POST", "/api/control", {"action": "stop"})[0] == 200
    assert time.monotonic() - started < 1
    wait_worker(server)
    assert server.console.status()["missions"][0]["state"] == "STOPPED"
    assert request(server, "POST", "/api/submit", submission())[0] == 400
    assert request(server, "POST", "/api/control", {"action": "resume"})[0] == 200
    # Freeze a completed worker receipt to test replay and counters with no model calls.
    with server.console.store() as store:
        store.set("mock-complete:inventory-001", {"status": "VERIFIED"})
        store.set("budget", {"requests": 0, "cycles": 1})
    for _ in range(2):
        assert request(server, "POST", "/api/submit", submission())[0] == 202
        wait_worker(server)
    assert len({root for _, root in calls}) == 1
    assert not model_calls
    assert server.console.status()["budget"] == {"requests": 0, "cycles": 1}
    fresh = Console(server.console.root, server.console.allowed_root)
    assert fresh.status()["missions"][0]["state"] == "VERIFIED"
    assert fresh.status()["budget"] == {"requests": 0, "cycles": 1}


def test_only_hashed_named_outputs_download_and_evaluator_redaction(console_server, tmp_path):
    server = console_server
    output = server.console.root / "output" / "data" / "result.json"
    output.parent.mkdir(parents=True)
    output.write_text('{"rows":[]}', encoding="utf-8")
    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    secret = tmp_path / "evaluator.json"
    secret.write_text('{"hidden_labels":["private-answer"]}')
    with server.console.store() as store:
        store.set("console_mission:inventory-001", {"work": server.console._manifest(submission()), "state": "VERIFIED",
                    "result": {"status": "VERIFIED", "oracle": {"hidden_labels": ["private-answer"]},
                               "named_outputs": {"data.json": str(output), "bad.json": str(secret)},
                               "named_output_hashes": {"data.json": digest, "bad.json": hashlib.sha256(secret.read_bytes()).hexdigest()}}})
    state = request(server, "GET", "/api/status")[1]
    assert b"private-answer" not in state
    refs = json.loads(state)["missions"][0]["artifacts"]
    assert len(refs) == 1
    assert request(server, "GET", "/api/artifact?ref=" + refs[0]["ref"])[0] == 200
    assert request(server, "GET", "/api/artifact?ref=../evaluator.json")[0] == 400
    assert request(server, "GET", "/api/artifact?ref=artifacts/" + "a" * 64 + ".json")[0] == 400
    output.write_text("changed")
    assert request(server, "GET", "/api/artifact?ref=" + refs[0]["ref"])[0] == 400


def test_approved_rollback_only_and_budget_preserved(console_server):
    server = console_server
    with server.console.store() as store:
        rejected = Checkpoints(store).save({"version": 1}, [], approved=False)
        approved = Checkpoints(store).save({"version": 1}, [], approved=True)
        store.set("budget", {"requests": 0, "cycles": 7})
    assert request(server, "POST", "/api/control", {"action": "rollback", "checkpoint": rejected})[0] == 400
    assert request(server, "POST", "/api/control", {"action": "rollback", "checkpoint": approved})[0] == 200
    state = server.console.status()
    assert state["current_checkpoint"] == approved
    assert state["budget"] == {"requests": 0, "cycles": 7}
    assert state["approved_checkpoints"] == [approved]


def test_combined_form_builds_registered_dag_without_serving_verifier(console_server):
    server = console_server
    manifest = {"schema_version": 1, "id": "registered-code", "repo": {"path": str(server.console.allowed_root)},
                "verifier": {"cases": [{"expected": "private-answer"}]}}
    (server.console.allowed_root / "code.json").write_text(json.dumps(manifest))
    data = submission(family="combined", code_manifest="code.json", data_type="inventory")
    work = server.console._manifest(data)
    assert [stage["family"] for stage in work["manifest"]["stages"]] == ["structured_data", "code", "review", "report"]
    assert work["manifest"]["stages"][1]["input_from"]["pointer"] == "/rows"
    code, body, _ = request(server, "POST", "/api/prepare", data)
    assert code == 200
    assert b"private-answer" not in body
    assert len(json.loads(body)["tasks"]) == 3


def test_symlink_source_refused(console_server, tmp_path):
    outside = tmp_path / "outside.csv"
    outside.write_text("private,1")
    link = console_server.console.allowed_root / "escape.csv"
    try:
        link.symlink_to(outside)
    except OSError:
        pytest.skip("symlinks require Windows developer privileges")
    assert request(console_server, "POST", "/api/submit", submission(source="escape.csv"))[0] == 400


def test_real_exact_inventory_http_artifacts_and_restart_zero_requests(console_server):
    """Actual existing Executor/tool/verifier, no adapter mocks and no model endpoint."""
    server = console_server
    source = server.console.allowed_root / "inventory.csv"
    source.write_text("id,group,bytes\na,hardware,12\nb,hardware,7\nc,software,3\n", encoding="utf-8")
    source_hash = hashlib.sha256(source.read_bytes()).hexdigest()
    assert request(server, "POST", "/api/submit", submission())[0] == 202
    wait_worker(server)
    state = server.console.status()
    mission = state["missions"][0]
    assert mission["state"] == "VERIFIED", mission
    assert mission["result"]["machine_verdict"]["passed"] is True
    assert mission["result"]["identity"]["input_sha256"] == source_hash
    artifact = next(ref for ref in mission["artifacts"] if ref["name"] == "data.json")
    code, body, _ = request(server, "GET", "/api/artifact?ref=" + artifact["ref"])
    assert code == 200
    data = json.loads(body)
    assert data["normalized"]["groups"]["hardware"] == {"bytes": 19, "count": 2}
    before = state["budget"]
    assert before["requests"] == 0
    assert request(server, "POST", "/api/submit", submission())[0] == 202
    wait_worker(server)
    assert server.console.status()["budget"] == before
    fresh = Console(server.console.root, server.console.allowed_root)
    assert fresh.status()["budget"] == before
    assert hashlib.sha256(source.read_bytes()).hexdigest() == source_hash


def test_host_only_oracle_reference_hash_never_contents(console_server):
    server = console_server
    private = server.console.allowed_root / "private"
    private.mkdir()
    oracle = private / "labels-oracle.json"
    oracle.write_text('{"labels":{"a":"hidden-label"}}')
    (server.console.allowed_root / "classification.json").write_text('[{"id":"a","text":"A public sentence"}]')
    listing = json.loads(request(server, "GET", "/api/oracles")[1])
    assert listing["oracles"] == [{"path": "private/labels-oracle.json", "sha256": hashlib.sha256(oracle.read_bytes()).hexdigest()}]
    assert b"hidden-label" not in request(server, "GET", "/api/oracles")[1]
    assert all(row["path"] != "private/labels-oracle.json" for row in server.console.sources())
    work = server.console._manifest(submission(family="classification", source="classification.json", schema_id="independent_labels_v1",
                                             labels=["yes", "no"], route="local_direct", oracle="private/labels-oracle.json"))
    assert work["manifest"]["oracle_sha256"] == hashlib.sha256(oracle.read_bytes()).hexdigest()
    assert request(server, "GET", "/api/artifact?ref=private/labels-oracle.json")[0] == 400
    assert request(server, "POST", "/api/submit", submission(source="private/labels-oracle.json"))[0] == 400


def test_classification_pending_and_oracle_without_approval_fail_closed(console_server):
    server = console_server
    (server.console.allowed_root / "classification.json").write_text('[{"id":"a","text":"A public sentence"}]')
    data = submission(id="classify-pending", family="classification", source="classification.json",
                      schema_id="independent_labels_v1", labels=["yes", "no"], route="local_direct")
    assert request(server, "POST", "/api/submit", data)[0] == 202
    wait_worker(server)
    assert server.console.status()["missions"][0]["state"] == "REVIEW_PENDING"
    private = server.console.allowed_root / "private"
    private.mkdir()
    (private / "oracle.json").write_text('{"labels":{"a":"yes"}}')
    data.update(id="classify-approved-required", oracle="private/oracle.json")
    assert request(server, "POST", "/api/submit", data)[0] == 202
    wait_worker(server)
    state = server.console.status()
    failed = next(m for m in state["missions"] if m["id"] == "classify-approved-required")
    assert failed["state"] == "FAILED"
    assert "approval" in failed["error"].lower()
    assert not state["jobs"]
    assert state["budget"].get("requests", 0) == 0


def test_health_is_explicit_read_only_and_redacted(console_server, monkeypatch):
    from hive import diagnostics
    from hive.adapters.isolation import DockerIsolation
    server = console_server
    calls = []
    digest = "a" * 64
    def doctor(config, root, *, offline):
        calls.append((root, offline))
        return {"runtime": {"available": True, "models": [{"id": config["model"], "digest": digest, "available": True}]},
                "running_runtime": {"models": []}, "sandbox": {"status": "PRESENT_UNVERIFIED", "daemon_available": True,
                    "server_version": "test", "os": "linux", "error": "private-host-path"},
                "budgets": {"secret": "never-serve"}, "new_model_calls": 0}
    monkeypatch.setattr(diagnostics, "doctor", doctor)
    monkeypatch.setattr(DockerIsolation, "inspect", lambda self, image: {"available": True})
    manifest = {"schema_version": 1, "id": "code-health", "repo": {"path": str(server.console.allowed_root)},
                "verifier": {}, "image": {"reference": "python:3.11-slim", "digest": "sha256:" + digest}}
    (server.console.allowed_root / "code.json").write_text(json.dumps(manifest))
    request(server, "GET", "/api/status")
    assert not calls
    assert request(server, "GET", "/api/health", authenticated=False)[0] == 403
    code, body, _ = request(server, "GET", "/api/health")
    assert code == 200
    health = json.loads(body)
    assert health["model"]["available"] is True
    assert health["model"]["digest"] == digest
    assert health["registered_pinned_images"][0]["available"] is True
    assert health["new_model_calls"] == 0
    assert health["measured_at"]
    assert len(calls) == 1 and calls[0][1] is False
    assert b"never-serve" not in body and b"private-host-path" not in body


def test_registered_manifests_preserve_approval_identity_and_terminal_stages(console_server):
    from hive.prototype_approval import manifest_fingerprint
    server = console_server
    root = server.console.allowed_root
    data = server.console._manifest(submission())["manifest"]
    (root / "registered-data.json").write_text(json.dumps(data))
    registered = server.console._manifest({"id": data["id"], "family": "registered", "source": "registered-data.json"})
    assert registered["family"] == "data"
    assert registered["manifest"] == data
    assert manifest_fingerprint(registered["manifest"]) == manifest_fingerprint(data)
    code = {"schema_version": 1, "id": "registered-python", "repo": {"path": str(root)}, "verifier": {}}
    dag = {"schema_version": 1, "id": "registered-combined", "stages": [
        {"id": "data", "family": "structured_data", "manifest": data},
        {"id": "python", "family": "code", "manifest": code, "depends_on": ["data"]},
        {"id": "review", "family": "review", "depends_on": ["data", "python"]},
        {"id": "report", "family": "report", "depends_on": ["review"]}]}
    (root / "registered-combined.json").write_text(json.dumps(dag))
    work = server.console._manifest({"id": dag["id"], "family": "registered", "source": "registered-combined.json"})
    assert work["manifest"] == dag
    assert work["family"] == "combined"
    assert request(server, "POST", "/api/prepare", {"id": dag["id"], "family": "registered", "source": "registered-combined.json"})[0] == 200
    wrapper = {"schema_version": 1, "id": "python-standalone", "family": "code", "manifest": code,
               "require_real_verification": True}
    (root / "python-standalone.json").write_text(json.dumps(wrapper))
    wrapped = server.console._manifest({"id": wrapper["id"], "family": "registered", "source": "python-standalone.json"})
    assert wrapped["family"] == "combined" and wrapped["manifest"] == wrapper
    escaped = {**data, "allowed_root": str(root.parent)}
    (root / "escaped-data.json").write_text(json.dumps(escaped))
    with pytest.raises(ValueError, match="different permitted source root"):
        server.console._manifest({"id": escaped["id"], "family": "registered", "source": "escaped-data.json"})
