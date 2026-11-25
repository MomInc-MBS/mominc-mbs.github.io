"""Operator Prototype: registry selection, evidence refusals, intake contract, replay, rollback, recovery, adapter.
Docker-free: run_isolated is replaced by in-process execution of the SAME retained genome body (the container path
itself is exercised by scripts/operator_demo.py)."""
import json
from pathlib import Path

import pytest

from hive import experiment_compare as EC
from hive import m2_workflow as W
from hive import operator_runtime as O
from hive.storage import Store

GOOD = b"id,group,bytes\na.txt,docs,10\nb.png,img,2048\nc.md,docs,5\n"
BAD = b"id,group,bytes\nx,g,01\ny,g,2\n"
JS = json.dumps([{"id": "q", "group": "img", "bytes": 7}]).encode()


@pytest.fixture
def runs(monkeypatch):
    calls = []

    def fake(src, text, checks, timeout=None, max_out=None, *, backend, operator_class):
        assert backend == "container" and operator_class == "generated"
        calls.append(1)
        ns = {}
        exec(compile(src, "<genome>", "exec"), ns)
        return ns["apply"](text, checks)
    monkeypatch.setattr(EC, "run_isolated", fake)
    return calls


@pytest.fixture
def root(tmp_path):
    s = Store(tmp_path / "s")
    assert O.import_bundle(s) == {"convert": "imported", "merge": "imported"}
    assert O.import_bundle(s) == {"convert": "already imported", "merge": "already imported"}
    s.close()
    return tmp_path / "s"


def test_fresh_convert_verified_then_replay(root, runs):
    r = O.run_task(root, "convert", [("good.csv", GOOD)])
    assert r["state"] == "VERIFIED" and r["verification"]["verdict"] == "PASS" and r["capability"]["steps"] == ["parse_whole", "to_json"]
    out = json.loads((root / r["artifacts"][0]["ref"]).read_text())
    assert out == [{"bytes": 10, "group": "docs", "id": "a.txt"}, {"bytes": 2048, "group": "img", "id": "b.png"}, {"bytes": 5, "group": "docs", "id": "c.md"}]
    again = O.run_task(root, "convert", [("good.csv", GOOD)])
    assert again["mode"] == "saved_result_replay" and again["artifacts"] == r["artifacts"] and len(runs) == 1
    c = O.status(root)["counters"]
    assert (c["executions"], c["container_runs"], c["replays"], c["model_calls"], c["proposal_calls"]) == (1, 1, 1, 0, 0)


def test_merge_quarantines_whole_file_no_salvage(root, runs):
    r = O.run_task(root, "merge", [("good.csv", GOOD), ("bad.csv", BAD), ("j.json", JS)])
    assert r["state"] == "VERIFIED"
    files = {f["file"]: f for f in r["summary"]["files"]}
    assert files["bad.csv"]["status"] == "quarantined" and "canonical" in files["bad.csv"]["reason"]
    merged = json.loads((root / next(a["ref"] for a in r["artifacts"] if a["name"] == "merged.json")).read_text())
    assert merged["groups"] == {"docs": {"bytes": 15, "count": 2}, "img": {"bytes": 2055, "count": 2}}  # bad.csv's valid row y is NOT salvaged


def test_convert_rejects_whole_file(root, runs):
    r = O.run_task(root, "convert", [("bad.csv", BAD)])
    assert r["state"] == "REJECTED" and r["verification"]["verdict"] == "PASS" and "canonical" in r["summary"]["verdict"]
    assert [a["name"] for a in r["artifacts"]] == ["report.json"]


@pytest.mark.parametrize("op,files,msg", [
    ("convert", [("a.txt", GOOD)], "unsupported file type"),
    ("convert", [("a.csv", b"\xef\xbb\xbf" + GOOD)], "byte-order mark"),
    ("convert", [("a.csv", b"\xff\xfe")], "not valid UTF-8"),
    ("merge", [("a.csv", GOOD)], "2 to 20"),
    ("convert", [("a.csv", GOOD), ("b.csv", GOOD)], "needs 1"),
])
def test_unsupported_inputs_refused(root, runs, op, files, msg):
    with pytest.raises(O.Refused, match=msg):
        O.run_task(root, op, files)
    assert not runs


def test_unknown_operation_records_opportunity_no_discovery(root, runs):
    with pytest.raises(O.Refused, match="opportunity"):
        O.run_task(root, "dedupe", [("a.csv", GOOD)])
    st = O.status(root)
    assert st["opportunities"][0]["status"] == "MISSING_CAPABILITY" and st["counters"]["proposal_calls"] == 0 and not runs


def _state(root, op="convert"):
    return O.run_task(root, op, [("good.csv", GOOD)])


def test_revoked_refused(root, runs):
    s = Store(root); O.revoke(s, "convert"); s.close()
    r = _state(root)
    assert r["state"] == "NO_ELIGIBLE_CAPABILITY" and "revoked" in r["reason"] and not runs


def test_stale_pin_refused(root, runs, monkeypatch):
    monkeypatch.setattr(W, "protocol_sha", lambda: "0" * 64)
    r = _state(root)
    assert r["state"] == "NO_ELIGIBLE_CAPABILITY" and "stale protocol_sha" in r["reason"] and not runs


def test_tampered_receipt_refused(root, runs):
    s = Store(root)
    ev = [e for e in O.history(s, "convert") if e["type"] == "import"][0]
    s.close()
    p = root / ev["receipt_ref"]
    rec = json.loads(p.read_text())
    rec["pass_count"] = 59
    p.write_text(json.dumps(rec, sort_keys=True, separators=(",", ":")))
    r = _state(root)
    assert r["state"] == "NO_ELIGIBLE_CAPABILITY" and not runs


def test_scope_not_allowed_refused(root, runs, monkeypatch):
    pol = O.load_policy()
    pol["allowed_scopes"] = []
    monkeypatch.setattr(O, "load_policy", lambda: pol)
    r = _state(root)
    assert r["state"] == "NO_ELIGIBLE_CAPABILITY" and "scope" in r["reason"] and not runs


def test_bundle_tamper_refused(tmp_path):
    b = json.loads(O.BUNDLE_PATH.read_text())
    ref = next(iter(b["artifacts"]))
    b["artifacts"][ref] = {"forged": True}
    p = tmp_path / "b.json"; p.write_text(json.dumps(b))
    s = Store(tmp_path / "s")
    with pytest.raises(O.Refused, match="content hash"):
        O.import_bundle(s, p)
    s.close()


def test_bundle_capability_not_pinned_refused(tmp_path):
    b = json.loads(O.BUNDLE_PATH.read_text())
    b["capabilities"]["convert"]["genome"] = b["baseline_genome"]
    p = tmp_path / "b.json"; p.write_text(json.dumps(b))
    s = Store(tmp_path / "s")
    with pytest.raises(O.Refused, match="accepted pins"):
        O.import_bundle(s, p)
    s.close()


def test_rollback_then_reselect(root, runs):
    s = Store(root); O.rollback(s, "convert"); s.close()
    r = _state(root)
    assert r["state"] == "NO_ELIGIBLE_CAPABILITY" and "parse_whole+aggregate" in r["reason"] and not runs
    s = Store(root); O.reselect(s, "convert"); hist = [e["type"] for e in O.history(s, "convert")]; s.close()
    assert hist == ["import", "rollback", "select"]
    assert _state(root)["state"] == "VERIFIED" and len(runs) == 1


def test_stop_then_recover(root, runs):
    (root / "STOP").write_text("x")
    assert _state(root)["state"] == "STOPPED" and not runs
    (root / "STOP").unlink()
    s = Store(root)
    tid = O.task_id("convert", [("good.csv", GOOD)])
    rec = s.get("operator/task/" + tid); rec["state"] = "RUNNING"; s.set("operator/task/" + tid, rec); s.close()
    assert O.recover(root) == 1
    assert O.status(root)["tasks"][0]["state"] == "INTERRUPTED"
    assert _state(root)["state"] == "VERIFIED" and len(runs) == 1


@pytest.mark.parametrize("raw", [json.dumps({"converted": "[]", "quarantined": []}), "not json", json.dumps("str"), json.dumps({"converted": "garbage"})])
def test_verifier_disagreement_not_exported(root, monkeypatch, raw):
    monkeypatch.setattr(EC, "run_isolated", lambda *a, **k: raw)
    r = _state(root)
    assert r["state"] == "VERIFICATION_FAILED" and [a["name"] for a in r["artifacts"]] == ["report.json"]
    assert "withheld" in r["summary"]["verdict"]


def test_failed_verification_is_not_replayed(root, runs, monkeypatch):
    monkeypatch.setattr(O, "evaluator_pin", lambda pol=None: "0" * 64)  # evaluator differs from its pin -> UNVERIFIABLE
    assert _state(root)["state"] == "REVIEW_PENDING"
    monkeypatch.undo()
    monkeypatch.setattr(EC, "run_isolated", runs_fake := (lambda src, text, checks, timeout=None, max_out=None, *, backend, operator_class: (lambda ns: (exec(src, ns), ns["apply"](text, checks))[1])({})))
    r = _state(root)
    assert r["state"] == "VERIFIED" and r["mode"] == "retained_capability_reuse"


def test_verifier_timeout_is_unverifiable(root, runs, monkeypatch):
    import subprocess
    def boom(*a, **k): raise subprocess.TimeoutExpired("x", 60)
    monkeypatch.setattr(O.subprocess, "run", boom)
    r = _state(root)
    assert r["state"] == "REVIEW_PENDING" and r["verification"]["verdict"] == "UNVERIFIABLE"


def test_replay_refused_after_revoke(root, runs):
    assert _state(root)["state"] == "VERIFIED"
    s = Store(root); O.revoke(s, "convert"); s.close()
    r = _state(root)
    assert r["state"] == "NO_ELIGIBLE_CAPABILITY" and r.get("mode") != "saved_result_replay" and len(runs) == 1
    assert r["prior_attempts"][0]["state"] == "VERIFIED"


def test_stop_during_execution_discards_output(root, monkeypatch):
    def fake(src, text, checks, timeout=None, max_out=None, *, backend, operator_class):
        (root / "STOP").write_text("x")
        ns = {}; exec(src, ns); return ns["apply"](text, checks)
    monkeypatch.setattr(EC, "run_isolated", fake)
    r = _state(root)
    assert r["state"] == "STOPPED" and r["stages"][-1]["stage"] == "stopped_after_execution" and "artifacts" not in r


def test_two_rollbacks_do_not_roll_forward(root, runs):
    s = Store(root)
    O.rollback(s, "convert"); O.rollback(s, "convert")
    assert O.resolve_target(s, "convert") == O.load_policy()["baseline_genome"]
    s.close()


def test_recover_skips_task_owned_by_live_process(root, runs):
    import os, subprocess, sys
    p = subprocess.Popen([sys.executable, "-c", "import time; time.sleep(30)"])
    try:
        s = Store(root)
        tid = O.task_id("convert", [("good.csv", GOOD)])
        s.set("operator/task/" + tid, {"task_id": tid, "state": "RUNNING", "pid": p.pid, "stages": [], "submitted_at": "x"}); s.close()
        assert O.recover(root) == 0
    finally:
        p.kill(); p.wait()
    assert O.recover(root) == 1


def test_snapshot_adapter(tmp_path):
    (tmp_path / "d" / "sub").mkdir(parents=True)
    (tmp_path / "d" / "a.txt").write_bytes(b"12345")
    (tmp_path / "d" / "sub" / "b.md").write_bytes(b"1")
    (tmp_path / "d" / ".hidden").write_bytes(b"1")
    assert O.snapshot_dir(tmp_path / "d") == b"id,group,bytes\na.txt,.,5\nsub/b.md,sub,1\n"
    assert json.loads(O.snapshot_dir(tmp_path / "d", "ext", "json")) == [{"id": "a.txt", "group": ".txt", "bytes": 5}, {"id": "sub/b.md", "group": ".md", "bytes": 1}]
