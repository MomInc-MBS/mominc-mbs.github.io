import copy, importlib.util, json, subprocess, sys
from pathlib import Path
import pytest
from hive import lineage, m1_workflow as W
from hive.storage import Store

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "m1_campaign.py"


def load_script(out, data):
    import os
    os.environ["M1_OUT"], os.environ["M1_DATA"] = str(out), str(data)
    spec = importlib.util.spec_from_file_location("m1c", SCRIPT); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    return m


def docker_ok():
    try:
        from hive.adapters.isolation import DockerIsolation, PINNED_IMAGE
        DockerIsolation().inspect(PINNED_IMAGE); return True
    except Exception:
        return False


@pytest.fixture
def camp(tmp_path, monkeypatch):
    rows = [json.loads(l) for l in (ROOT / "build/m1/data/f_dev.jsonl").read_text().splitlines()]
    pick = [r for r in rows if r["counts"]["defective"]][:6] + [r for r in rows if not r["counts"]["defective"]][:1]
    data = tmp_path / "data"; data.mkdir()
    for n in ("f_dev", "f_sel", "fixture"): (data / f"{n}.jsonl").write_text("".join(json.dumps(r) + "\n" for r in pick), encoding="utf-8", newline="\n")
    m = load_script(tmp_path / "out", data); m.OUT.mkdir()
    return m, data / "fixture.jsonl"


def test_mcnemar_known():
    from itertools import product  # noqa
    m = load_script(ROOT / "build" / "m1", ROOT / "build" / "m1" / "data")
    assert m.mcnemar_p(6, 0) == 1 / 64 and m.mcnemar_p(0, 0) == 1.0 and m.mcnemar_p(0, 5) == 1.0
    assert m.mcnemar_p(8, 2) == 56 / 1024 and m.mcnemar_p(1, 1) == 0.75


def test_nominate_tiebreaks():
    m = load_script(ROOT / "build" / "m1", ROOT / "build" / "m1" / "data")
    c = lambda d, steps, dp, sp: {"digest": d, "steps": steps, "dev_pass": dp, "dev_n": 10, "sel_pass": sp, "sel_n": 10}
    a, b, w = c("b", ["x", "y"], 9, 8), c("a", ["x", "y", "z"], 10, 8), c("c", ["x"], 8, 10)
    assert m.nominate([a, b, w]) is a            # w fails dev >= 90%; tie on sel -> fewer steps
    assert m.nominate([c("z", ["x"], 9, 8), c("y", ["x"], 9, 8)])["digest"] == "y"  # then smaller digest
    assert m.nominate([c("q", ["x"], 9, 5), c("r", ["x"], 9, 6)])["digest"] == "r"  # higher sel wins
    assert m.nominate([w]) is None
    assert m.arm3_pick(c("s", ["x", "y"], 0, 5), c("i", ["x", "y", "z"], 0, 5))["digest"] == "s"


@pytest.fixture
def s(tmp_path):
    st = Store(tmp_path); st.w0 = W.register_w_strict(st); yield st; st.close()


def accepted(s):
    kind, h = W.propose(s, s.w0, ["identity", "parse_whole", "aggregate"]); assert kind == "registered"
    cases = [{"case_id": "c1", "format": "csv", "source": "", "expected": "E"}, {"case_id": "c2", "format": "csv", "source": "", "expected": "F"}]
    r, ref = W.receipt(s, h, "F-final", cases, "p" * 64, ["E", "F"])  # synthetic outputs; docker covered below
    lineage.record_result(s, h, "ACCEPTED", None, [ref])
    return h, r, cases


def reseal(r):
    r["receipt_sha"] = W._sha(W._json({k: v for k, v in r.items() if k != "receipt_sha"})); return r


def test_receipt_tamper_stale_forged(s):
    h, r, _ = accepted(s)
    assert W.verify_receipt(s, r) == [] and W.select(s, h, r)
    t = copy.deepcopy(r); t["pass_count"] = 0
    assert W.verify_receipt(s, t)
    st = reseal({**copy.deepcopy(r), "policy_sha": "0" * 64}); assert any("stale" in p for p in W.verify_receipt(s, st))
    wv = reseal({**copy.deepcopy(r), "verdicts": [False, True], "pass_count": 1}); assert any("verdicts" in p for p in W.verify_receipt(s, wv))
    forged = reseal({**copy.deepcopy(r), "partition": "forged"})
    assert W.verify_receipt(s, forged) == []      # self-consistent...
    with pytest.raises(W.PolicyViolation, match="not the recorded"): W.select(s, h, forged)  # ...but not the recorded evidence


def test_select_refuses_non_accepted(s):
    h, r, cases = accepted(s)
    k, h2 = W.propose(s, s.w0, ["split_rows", "each(parse_whole)", "aggregate"])
    r2, ref2 = W.receipt(s, h2, "F-final", cases, "p" * 64, ["x", "y"])
    lineage.record_result(s, h2, "REJECTED", None, [ref2])
    with pytest.raises(W.PolicyViolation, match="not ACCEPTED"): W.select(s, h2, r2)
    W.select(s, h, r); W.rollback(s, s.w0)
    assert W.selected(s, s.w0) == s.w0 and [e["type"] for e in W.history(s)] == ["select", "rollback"]


@pytest.mark.skipif(not docker_ok(), reason="Docker/pinned image unavailable")
def test_search_final_lifecycle_fixture(camp, monkeypatch):
    m, fixture = camp
    sm = m.search()
    assert sm["nominee"] and sm["docker_runs"] == 6 and sm["proposals"] == 7
    with pytest.raises(SystemExit): m.search()                     # nominee immutable
    fr = m.final(fixture)
    assert fr["outcome"] == "ACCEPTED" and fr["passes"]["nominee"] == 7 and fr["passes"]["arm1_W_strict"] == 1 and fr["mcnemar"]["p_one_sided"] == 1 / 64
    with pytest.raises(SystemExit): m.final(fixture)               # holdout retired
    pol = m.W.load_policy(); pol["decision"] = {**pol["decision"], "reuse_min_pass": 6}  # fixture has n=7, not 20
    monkeypatch.setattr(m.W, "load_policy", lambda: pol)
    lc = m.lifecycle(fixture)
    assert lc["all_ok"], lc
    assert lc["restart"]["new_process"] and lc["rollback"]["history"] == ["select", "rollback"]


def test_policy_pin_is_eol_independent(tmp_path):
    """A CRLF checkout of the policy must pin the same sha as the LF blob (M1 report open item)."""
    lf = W.POLICY_PATH.read_bytes().replace(b"\r\n", b"\n")
    crlf = tmp_path / "p.json"; crlf.write_bytes(lf.replace(b"\n", b"\r\n"))
    assert W._pin(crlf) == W._sha(lf) == W.policy_sha()
