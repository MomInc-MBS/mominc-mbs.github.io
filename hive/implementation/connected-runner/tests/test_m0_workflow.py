import copy, shutil
import pytest
from hive import lineage, m0_oracle as O, workflow_candidate as W
from hive.experiment_compare import Candidate, run_isolated
from hive.storage import Store


@pytest.fixture
def s(tmp_path):
    st = Store(tmp_path); st.p0 = W.register_p0(st); yield st; st.close()


def accepted(s, steps=("scrub_delete",)):
    kind, h = W.propose(s, s.p0, list(steps)); assert kind == "registered"
    r, ref = W.receipt(s, h, "T1", O.TASKS["T1"]["expected"])  # synthetic output; docker covered by e2e test
    lineage.record_result(s, h, "ACCEPTED", None, [ref])
    return h, r


def test_policy_refusals(s):
    assert W.propose(s, s.p0, ["rm_rf"])[0] == "refused"
    assert W.propose(s, s.p0, ["identity"] * 4)[0] == "refused"
    assert W.propose(s, s.p0, [])[0] == "refused"
    assert W.propose(s, s.p0, ["identity"])[0] == "registered"
    assert W.propose(s, s.p0, ["identity"])[0] == "refused"  # duplicate digest
    with pytest.raises(W.PolicyViolation): W.validate(["nope"], W.load_policy())


def test_max_proposals(s):
    n = W.load_policy()["max_proposals"]
    for _ in range(n): W.propose(s, s.p0, ["rm_rf"])
    assert W.propose(s, s.p0, ["identity"])[0] == "refused"
    assert "max_proposals" in s.read_artifact(s.get(W.CAMP)["refusals"][-1])["reason"]


def test_generated_never_process_backend():
    assert Candidate("c", W.compile_source(["identity"]), "r", {}, "p", operator_class="data_rule").backend == "container"
    with pytest.raises(RuntimeError, match="container"):
        run_isolated(W.compile_source(["identity"]), "x", O.CHECKS, backend="process", operator_class="generated")


def test_tampered_and_stale_receipt(s):
    h, r = accepted(s)
    assert W.verify_receipt(s, r) == []
    t = copy.deepcopy(r); t["verdict"] = "FAIL"
    assert W.verify_receipt(s, t)
    st = copy.deepcopy(r); st["oracle_sha"] = "0" * 64
    assert any("stale" in p for p in W.verify_receipt(s, st))
    assert W.verify_receipt(s, {"candidate_hash": "x"})  # malformed
    with pytest.raises(W.PolicyViolation): W.select(s, h, t)


def test_rollback_appends_and_restores(s):
    h, r = accepted(s)
    W.select(s, h, r); assert W.selected(s, s.p0) == h
    W.rollback(s, s.p0)
    assert W.selected(s, s.p0) == s.p0 and [e["type"] for e in W.history(s)] == ["select", "rollback"]
    assert lineage.get(s, h) and lineage.verify_lineage(s, h) == []  # nothing deleted


def test_select_requires_accepted_pass(s):
    kind, h = W.propose(s, s.p0, ["scrub_lowercase"])
    r, _ = W.receipt(s, h, "T1", "wrong output")
    with pytest.raises(W.PolicyViolation): W.select(s, h, r)


def test_selection_only_writes_experiment_keys(s):
    h, r = accepted(s)
    before = {k for (k,) in s.db.execute("SELECT key FROM kv")}
    W.select(s, h, r); W.rollback(s, s.p0)
    new = {k for (k,) in s.db.execute("SELECT key FROM kv")} - before
    assert new == {W.SEL}
    assert lineage.ancestors_of(s, h) == [s.p0] and lineage.get(s, s.p0)["parent_hashes"] == []


def test_end_to_end_container(s):
    import subprocess
    try: subprocess.run(["docker", "info"], check=True, capture_output=True, timeout=30)
    except Exception: pytest.skip("docker unavailable")
    kind, h = W.propose(s, s.p0, ["scrub_delete", "scrub_lowercase"])
    out = W.execute(s, h, "T1"); r, _ = W.receipt(s, h, "T1", out)
    assert r["verdict"] == "PASS" and W.verify_receipt(s, r) == []
    assert W.execute(s, s.p0, "T2") == O.TASKS["T2"]["input"]  # P0 = identity


def test_forged_self_consistent_receipt_refused(s):
    """Forger recomputes receipt_sha with output_sha = expected: verify_receipt passes, select must still refuse."""
    import hashlib
    from hive.storage import _json
    h, r = accepted(s)
    f = {k: v for k, v in r.items() if k != "receipt_sha"}
    f["task"] = "T2"; f["input_sha"] = O.sha(O.TASKS["T2"]["input"]); f["output_sha"] = O.sha(O.TASKS["T2"]["expected"])
    f["receipt_sha"] = hashlib.sha256(_json(f).encode()).hexdigest()
    assert W.verify_receipt(s, f) == []
    with pytest.raises(W.PolicyViolation): W.select(s, h, f)
