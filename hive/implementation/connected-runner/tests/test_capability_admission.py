"""C4: signed capability admission, restart reuse, rollback. Real ssh-keygen; containers faked except one real-docker test.
Fixture = a copy of the committed C3 run store (experiment d-563f4dc928c28acb7944, CANDIDATE_PASSED); the committed c3-run is never touched."""
import copy
import json
import shutil
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import hive_admission as H  # noqa: E402
from hive import capability_registry as CR  # noqa: E402
from hive import discovery as D  # noqa: E402
from hive import experiment_compare as EC  # noqa: E402
from hive import goal_runner as G  # noqa: E402
from hive import operator_runtime as O  # noqa: E402
from hive.adapters import isolation as ISO  # noqa: E402
from hive.operator_runtime import Refused  # noqa: E402
from hive.storage import Store  # noqa: E402

SRC = ROOT / "build" / "c-series" / "c3-run" / "store"
EXP = "d-563f4dc928c28acb7944"
BEFORE = b"id,group,bytes\na.txt,docs,10\nb.png,img,2048\nc.md,docs,5\nd.md,docs,7\n"
AFTER = b"id,group,bytes\na.txt,docs,10\nb.png,img,4096\ne.md,docs,9\nd.md,docs,7\n"
pytestmark = pytest.mark.skipif(not SRC.exists() or not CR.keygen(), reason="C3 store or ssh-keygen unavailable")


@pytest.fixture
def auth(tmp_path, monkeypatch):
    info = H.init(str(tmp_path / "keys"), str(tmp_path / "signers"))
    monkeypatch.setattr(CR, "SIGNERS", Path(info["signers"]))
    return Path(info["key"])


@pytest.fixture
def store(tmp_path):
    root = tmp_path / "store"
    shutil.copytree(SRC, root)
    return root


@pytest.fixture
def runs(monkeypatch):
    calls = []

    def fake(src, text, checks, timeout=None, max_out=None, *, backend, operator_class):
        calls.append(1)
        ns = {}
        exec(compile(src, "<genome>", "exec"), ns)
        return ns["apply"](text, checks)
    monkeypatch.setattr(EC, "run_isolated", fake)
    return calls


def rerun_fake(store):
    """Stand-in for the separate evaluator process: hands back the receipt the C3 evaluator already wrote (hash-identical per case)."""
    def f(rec, out, body_path):
        p = Path(store) / "discovery" / rec["exp_id"] / rec["receipt"]["path"]
        return json.loads(p.read_text(encoding="utf-8")), p
    return f


def admit(store, key, **kw):
    return H.admit(store, EXP, key, rerun=rerun_fake(store), **kw)


def goal(store, before=BEFORE, after=AFTER, allow=False):
    ins = [("before.csv", "file", before), ("after.csv", "file", after)]
    c = G.make_contract("compare before and after", ins, deliverable="inventory_diff", allow_discovery=allow)
    return G.run_goal(store, c, ins)


def counters(store):
    s = Store(store)
    try:
        return O._counters(s)
    finally:
        s.close()


def chain(store):
    s = Store(store)
    try:
        return CR.history(s, "inventory-diff")
    finally:
        s.close()


def eligible(store):
    s = Store(store)
    try:
        return CR.eligible_discovered(s)
    finally:
        s.close()


def expected_diff():
    import importlib.util
    spec = importlib.util.spec_from_file_location("o", ROOT / "evaluator" / "c3" / "oracle.py")
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    rows = lambda b: json.dumps([dict(zip(("id", "group", "bytes"), (r.split(",")[0], r.split(",")[1], int(r.split(",")[2])))) for r in b.decode().splitlines()[1:]])
    return m.expected({"files": [{"format": "json", "text": rows(BEFORE)}, {"format": "json", "text": rows(AFTER)}]})


def forge(store, mutate, keep_sig=True):
    """Replace the head admit event by one whose statement was altered (artifact re-hashed, signature kept): an attacker with write access."""
    s = Store(store)
    try:
        ev = CR.history(s, "inventory-diff")[-1]
        st = s.read_artifact(ev["statement_ref"])
        mutate(st)
        e = {k: v for k, v in ev.items() if k != "ref"}
        e["statement_ref"] = s.put_artifact(st)
        s.set(CR.CHAIN + "inventory-diff", s.put_artifact(e))
    finally:
        s.close()


def assert_refused(store, runs, why=None):
    ok, ex = eligible(store)
    assert "inventory-diff" not in ok and ex and (why is None or why in ex[0]["reason"]), ex
    n = len(runs)
    r = goal(store)
    assert r["state"] == "UNRESOLVED" and "inventory-diff" not in [x["op"] for x in (r["plan"] or {}).get("steps", [])]
    assert len(runs) == n  # nothing executed


def test_valid_admission_runs_on_new_inputs(auth, store, runs):
    out = admit(store, auth)
    assert out["version"] == 1
    ok, _ = eligible(store)
    assert ok["inventory-diff"]["version"] == 1 and ok["inventory-diff"]["in"] == "canonical_rows" and ok["inventory-diff"]["out"] == "inventory_diff"
    r = goal(store)
    assert r["state"] == "VERIFIED", r["reason"]
    assert [x["op"] for x in r["plan"]["steps"]] == ["convert", "convert", "inventory-diff"]
    last = r["steps"][-1]
    assert last["mode"] == "retained_capability_execution" and last["verdict"] == "PASS" and last["capability"]["version"] == 1
    assert r["usage"] == {"container_runs": 3, "model_calls": 0, "proposal_calls": 0} and len(runs) == 3
    diff = (Path(store) / next(a["ref"] for a in r["deliverable"] if a["name"] == "diff.json")).read_text(encoding="utf-8")
    assert diff == expected_diff() and G.goal_artifact(store, r["deliverable"][0]["ref"])
    assert len(D.experiments(Store(store))) == 1  # no discovery opened
    # statement carries the spec'd fields
    st = Store(store).read_artifact(chain(store)[-1]["statement_ref"])
    assert st["schema"] == "hive-capability-admission-v1" and st["arity"] == [2, 2] and st["env"]["network"] == "none" and st["lineage"]["prev_version_statement_sha"] is None
    assert st["evaluation"]["admission_rerun_receipt_sha256"] and st["authority"]["principal"] == "hive-admission"


def test_restart_and_same_inputs_replay(auth, store, runs):
    admit(store, auth)
    assert goal(store)["state"] == "VERIFIED"
    n = len(runs)
    again = goal(store)  # fresh Store handles inside run_goal = restart
    assert again["state"] == "VERIFIED" and again["mode"] == "saved_result_replay" and again["steps"][-1]["mode"] == "saved_result_replay" and len(runs) == n
    other = goal(store, after=AFTER + b"z.md,docs,1\n")
    assert other["state"] == "VERIFIED" and other["steps"][-1]["mode"] == "retained_capability_execution" and len(runs) == n + 2


@pytest.mark.parametrize("name", ["statement_artifact", "statement_forged", "body_vs_hash", "signature", "wrong_key", "signers_changed", "pin", "image_digest", "unsigned"])
def test_corrupt_or_unauthorized_refused(auth, store, runs, tmp_path, monkeypatch, name):
    if name == "wrong_key":
        other = H.init(str(tmp_path / "k2"), str(tmp_path / "s2"))
        admit(store, Path(other["key"]))  # signed by a key the runtime does not trust
    else:
        admit(store, auth)
    assert name == "wrong_key" or eligible(store)[0]
    if name == "statement_artifact":
        ev = chain(store)[-1]
        (Path(store) / ev["statement_ref"]).write_bytes((Path(store) / ev["statement_ref"]).read_bytes().replace(b"inventory_diff", b"inventory_dxff"))
    elif name == "statement_forged":
        forge(store, lambda st: st["limits"].update(timeout_s=999))
    elif name == "body_vs_hash":  # the authority itself signs an inconsistent statement: still refused on use
        s = Store(store)
        ev = CR.history(s, "inventory-diff")[-1]
        st = s.read_artifact(ev["statement_ref"])
        st["body"] += "\n# x\n"
        e = {k: v for k, v in ev.items() if k != "ref"}
        e.update(statement_ref=s.put_artifact(st), statement_sha=H._sha(CR.canon(st)), signature=CR.sign(CR.canon(st), auth))
        s.set(CR.CHAIN + "inventory-diff", s.put_artifact(e))
        s.close()
    elif name == "signature":
        s = Store(store)
        ev = CR.history(s, "inventory-diff")[-1]
        e = {k: v for k, v in ev.items() if k != "ref"}
        e["signature"] = e["signature"].replace("A", "B", 3)
        s.set(CR.CHAIN + "inventory-diff", s.put_artifact(e))
        s.close()
    elif name == "signers_changed":
        other = H.init(str(tmp_path / "k3"), str(tmp_path / "s3"))
        monkeypatch.setattr(CR, "SIGNERS", Path(other["signers"]))
    elif name == "pin":
        monkeypatch.setattr(D, "evaluator_pin", lambda: "0" * 64)
    elif name == "image_digest":
        monkeypatch.setitem(ISO.PINNED_IMAGE, "digest", "sha256:" + "0" * 64)
    elif name == "unsigned":  # event written by the ordinary runtime writer without the authority
        ev = chain(store)[-1]
        s = Store(store)
        s.set(CR.CHAIN + "inventory-diff", s.put_artifact({k: v for k, v in ev.items() if k not in ("ref", "signature")} | {"prev": ev["prev"]}))
        s.close()
    assert_refused(store, runs)


def test_unauthorized_admit_without_authority(auth, store, runs):
    s = Store(store)
    CR.append(s, "inventory-diff", "admit", statement={"schema": CR.SCHEMA, "cap_id": "inventory-diff", "version": 1}, statement_sha="0", signature="")
    s.close()
    assert_refused(store, runs, "unauthorized")


def test_receipt_mismatch_rejected_and_never_eligible(auth, store, runs):
    p = Path(store) / "discovery" / EXP / next((Path(store) / "discovery" / EXP).glob("receipt-candidate-*.json")).name
    r = json.loads(p.read_text(encoding="utf-8"))
    r["pass_count"] = 23
    p.write_text(json.dumps(r, sort_keys=True, indent=1), encoding="utf-8")
    with pytest.raises(Refused):
        admit(store, auth)
    assert [e["type"] for e in chain(store)] == ["rejected"] and chain(store)[0]["reason"]
    assert not eligible(store)[0] and goal(store)["state"] == "UNRESOLVED"


def test_evaluator_pin_changed_blocks_admit(auth, store, monkeypatch):
    monkeypatch.setattr(D, "evaluator_pin", lambda: "0" * 64)
    with pytest.raises(Refused):
        admit(store, auth)
    assert not eligible(store)[0]


def test_interrupted_promotion_leaves_nothing(auth, store, runs, monkeypatch):
    orig = CR.append

    def boom():
        raise RuntimeError("crash between statement artifact and event")
    monkeypatch.setattr(CR, "append", lambda *a, **k: orig(*a, between=boom, **k))
    with pytest.raises(RuntimeError):
        admit(store, auth)
    assert chain(store) == [] and not eligible(store)[0]
    monkeypatch.setattr(CR, "append", orig)
    assert admit(store, auth)["version"] == 1 and eligible(store)[0]  # recovery: orphan artifact is harmless


def test_revoke_removes_the_step_without_discovery(auth, store, runs):
    admit(store, auth)
    assert goal(store)["state"] == "VERIFIED"
    H.revoke(store, "inventory-diff", 1, "test revoke", auth)
    n, exps = len(runs), len(D.experiments(Store(store)))
    r = goal(store)
    assert r["state"] == "UNRESOLVED" and len(runs) == n and len(D.experiments(Store(store))) == exps and not r.get("experiment_id")
    assert "no eligible version" in str(eligible(store)[1])


def v2_fixture(store, auth):
    """Explicit fixture: v2 = the scripted baseline body, admitted with the test key (the authority path for real v2 needs a second experiment)."""
    s = Store(store)
    ev = CR.history(s, "inventory-diff")[-1]
    st = copy.deepcopy(s.read_artifact(ev["statement_ref"]))
    body = D._read_lf(Path(store) / "discovery" / EXP / "baseline.py")
    st.update(version=2, body=body, impl_sha256=H._sha(body))
    st["lineage"] = dict(st["lineage"], prev_version_statement_sha=ev["statement_sha"])
    CR.append(s, "inventory-diff", "admit", statement=st, statement_sha=H._sha(CR.canon(st)), signature=CR.sign(CR.canon(st), auth))
    s.close()
    return st


def test_rollback_to_v1_and_execute(auth, store, runs):
    admit(store, auth)
    v1 = chain(store)[-1]["statement_sha"]
    v2_fixture(store, auth)
    r2 = goal(store)
    assert r2["state"] == "VERIFIED" and r2["steps"][-1]["capability"]["version"] == 2
    out = H.rollback(store, "inventory-diff", auth)
    assert (out["from_version"], out["to_version"]) == (2, 1)
    r1 = goal(store, after=AFTER + b"y.md,docs,3\n")
    assert r1["state"] == "VERIFIED" and r1["steps"][-1]["capability"]["version"] == 1 and r1["steps"][-1]["capability"]["statement_sha"] == v1
    with pytest.raises(CR.Unavailable, match="no earlier admitted"):
        H.rollback(store, "inventory-diff", auth)


def test_rollback_with_one_version_is_unavailable(auth, store):
    admit(store, auth)
    with pytest.raises(CR.Unavailable, match="no earlier admitted, unrevoked version"):
        H.rollback(store, "inventory-diff", auth)
    assert eligible(store)[0]["inventory-diff"]["version"] == 1  # still the same working version


def test_key_must_be_outside_repo_and_store(store):
    with pytest.raises(Refused):
        H.init(str(ROOT / "build" / "keys"), None)
    with pytest.raises(Refused):
        H.admit(store, EXP, Path(store) / "k")


def _docker_ok():
    try:
        ISO.DockerIsolation().inspect(ISO.PINNED_IMAGE)
        return True
    except Exception:
        return False


@pytest.mark.skipif(not _docker_ok() or not (ROOT / ".hive" / "c3-private").exists(), reason="Docker/pinned image or private acceptance set unavailable")
def test_real_container_end_to_end(auth, store):
    out = H.admit(store, EXP, auth)  # real evaluator process + 1 container run
    assert out["version"] == 1
    r = goal(store)
    assert r["state"] == "VERIFIED" and r["steps"][-1]["verdict"] == "PASS" and r["usage"]["container_runs"] == 3 and r["usage"]["model_calls"] == 0
