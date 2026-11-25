"""Slice E: preregistered candidate comparison. Network-free (fake transport), zero model requests."""
from __future__ import annotations

import json
import sys
import time
from pathlib import Path

import pytest

from exp_fakes import FakeTransport, allowlist, make_fixture, manifest
from hive import experiment_compare
from hive.experiment_compare import Candidate, make_candidate, mutate, run_compare
from hive.experiment_driver import ExperimentError

SCRUB = "import re\ndef _scrub(text, checks):\n    return re.sub(checks['forbid_pattern'], lambda m: m.group(0).lower(), text)\n"
GOOD6 = "Name,Code\n" + "".join(f"Country{n},{c}\n" for n, c in enumerate(["AA", "BB", "CC", "DD", "EE", "FF"]))
BAD6 = GOOD6.replace("Country1,BB", "Country1 (The),BB")


class Multi(FakeTransport):  # one transport serving both fixture repos by commit
    def __init__(self, fixtures):
        super().__init__(fixtures[0])
        self.fxs = {f["commit"]: f for f in fixtures}

    def fetch(self, url, commit, repo_dir, *a, **k):
        self.fixture = self.fxs[commit]
        return super().fetch(url, commit, repo_dir, *a, **k)


def _plan(tmp, baselines=("tool_profile_only", "tool_scrub_delete", "tool_scrub_lowercase"), **part_over):
    fx_ok, fx_bad = make_fixture(tmp / "ok", GOOD6), make_fixture(tmp / "bad", BAD6)
    al = allowlist([fx_ok, fx_bad], tmp / "allow.json")
    chk = {"header": ["Name", "Code"], "rows": 6}
    (tmp / "ok.json").write_text(json.dumps(manifest(fx_ok, "exp-ok", checks=chk)))
    (tmp / "bad.json").write_text(json.dumps(manifest(fx_bad, "exp-bad", checks=chk)))
    art = lambda i, s, base, op="inject_article", n=1: {"id": i, "kind": "ENGINEERED", "base": base, "mutation": {"op": op, "seed": s, "count": n}}
    parts = {"earlier_tasks": [{"id": "real-ok", "kind": "REAL_PINNED", "base": "ok"}],
             "development": [{"id": "real-bad", "kind": "REAL_PINNED", "base": "bad"}, art("dev-1", 1, "ok")],
             "test": [art("test-1", 2, "ok", n=2), art("test-2", 3, "ok", "inject_compliant_article", 2)],
             "next_source": [art("next-1", 4, "bad", n=2), art("next-2", 5, "ok", n=3)], **part_over}
    plan = {"version": 1, "compare_id": "cmp-test", "manifests": {"ok": "ok.json", "bad": "bad.json"}, "candidate_source": "bad",
            "baselines": list(baselines), "strongest_baseline_rule": "most passes, fewest cells, plan order", "partitions": parts}
    (tmp / "plan.json").write_text(json.dumps(plan))
    return tmp / "plan.json", al, Multi([fx_ok, fx_bad])


def _run(tmp, **kw):
    plan, al, tr = _plan(tmp, **kw.pop("plan_kw", {}))
    r = run_compare(plan, tmp / "out", allowlist=al, transport=tr, **kw)
    return r, tr


def test_tied_candidate_is_rejected_and_negative_result_kept(tmp_path):
    r, tr = _run(tmp_path)
    c = r["candidates"][0]
    assert c["decision"] == "REJECT_NO_GAIN" and c["state"] == "QUARANTINED" and c["promoted"] is False
    assert r["strongest_baseline"] in ("tool_scrub_delete", "tool_scrub_lowercase")
    grp = lambda a: next(g for g in r["aliases"] if a in g)
    assert {"C1-lowercase-forbidden-article", "tool_scrub_lowercase"} <= set(grp("tool_scrub_lowercase"))  # candidate == existing tool: de-duplicated alias
    assert {"P0", "learning_off", "tool_profile_only"} <= set(grp("P0"))
    assert r["requests"]["model_requests"] == 0 and r["requests"]["network_requests"] == tr.calls == 2
    assert r["arms"]["fixed_specialist_route"]["status"] == "N/A" and r["evaluator_unchanged_by_hash"]
    assert all(r["p0_reproduces_driver_verdict_on_real_items"].values())
    assert (tmp_path / "out" / "REPORT.md").exists() and json.loads((tmp_path / "out" / "candidates.json").read_text())[0]["decision"] == "REJECT_NO_GAIN"
    assert c["review_gate"]["decision"] != "PROMOTE" and c["parent_hash"] and c["candidate_hash"]


def test_partitions_frozen_before_arms_and_labelled(tmp_path):
    r, _ = _run(tmp_path)
    fz = json.loads((tmp_path / "out" / "partitions.frozen.json").read_text())
    assert fz["freeze_sha256"] == r["partition_freeze_sha256"] and set(fz["partition_sha256"]) == {"earlier_tasks", "development", "test", "next_source"}
    assert set(r["partition_labels"].values()) == {"REAL_PINNED", "ENGINEERED"} and "unseen" not in json.dumps(fz["partitions"]).lower()


def test_candidate_that_beats_a_weak_baseline_is_still_quarantined_never_promoted(tmp_path):
    r, _ = _run(tmp_path, plan_kw={"baselines": ["tool_profile_only"]})
    c = r["candidates"][0]
    # FINAL_REVIEW #3: held-out items derived from the candidate's own learning source cannot support a gain claim
    assert c["decision"] == "REJECT_GATE" and c["promoted"] is False and c["state"] == "QUARANTINED"
    assert c["review_gate"]["decision"] == "REJECT" and "holdout_unused_for_learning" in json.dumps(c["review_gate"]["reasons"])
    assert c["paired_vs_strongest"]["delta"] > 0 and "tiny n" in c["reason"] and "n=" in r["uncertainty"]


def test_compare_makes_no_git_or_network_calls_beyond_the_driver(tmp_path):
    """FINAL_REVIEW #1: base text comes from the driver's stored observation, so transport calls == receipts' net_calls."""
    r, t = _run(tmp_path)
    assert t.calls == r["requests"]["network_requests"] == sum(b["net_calls"] for b in r["base_experiments"].values())


def test_preregistration_is_immutable(tmp_path):
    plan, al, tr = _plan(tmp_path)
    run_compare(plan, tmp_path / "out", allowlist=al, transport=tr)
    p = json.loads(Path(plan).read_text(encoding="utf-8"))
    p["baselines"] = p["baselines"][:1]  # edit the plan after the first run, same --out
    Path(plan).write_text(json.dumps(p), encoding="utf-8")
    with pytest.raises(Exception, match="preregistration is immutable"):
        run_compare(plan, tmp_path / "out", allowlist=al, transport=tr)


def test_regressing_candidate_rejected_mid_search_later_partitions_not_run(tmp_path):
    evil = SCRUB + '''
def apply(text, checks):  # fine on earlier + development; damages a compliant cell on test-2 (P0 passes it: a true regression)
    t = _scrub(text, checks)
    return t.replace("Country0", "COUNTRY0") if any(a in text for a in ("(the)", "(a)", "(an)")) else t
'''
    r, _ = _run(tmp_path, extra_candidates=[Candidate("C-evil", evil, "x", {"diagnosis_sha256": "d", "experiment_id": "exp-bad"}, "p")])
    ev = next(x for x in r["candidates"] if x["candidate"] == "C-evil")
    assert ev["decision"] == "REJECT_REGRESSION" and ev["aborted_at"] == "test" and ev["promoted"] is False
    assert [s["step"] for s in ev["steps"]] == ["earlier_tasks", "development", "test"]  # next_source never evaluated
    assert [s["ok"] for s in ev["steps"]] == [True, True, False] and ev["steps"][-1]["regressions_vs_P0"]


def test_regression_on_earlier_task_stops_at_first_step(tmp_path):
    breaks_earlier = "def apply(text, checks):\n    return text.replace('Country0', 'COUNTRY0')\n"  # corrupts the real earlier (passing) source
    r, _ = _run(tmp_path, extra_candidates=[Candidate("C-early", breaks_earlier, "x", {"diagnosis_sha256": "d"}, "p")])
    ev = next(x for x in r["candidates"] if x["candidate"] == "C-early")
    assert ev["decision"] == "REJECT_REGRESSION" and ev["aborted_at"] == "earlier_tasks" and [s["step"] for s in ev["steps"]] == ["earlier_tasks"]


def test_crashing_candidate_fails_closed(tmp_path):
    assert _only_own_arm_fails(tmp_path, "def apply(text, checks):\n    raise RuntimeError('x')\n")


def test_hanging_candidate_fails_only_its_own_arm(tmp_path, monkeypatch):
    monkeypatch.setattr(experiment_compare.run_isolated, "__defaults__", (1, experiment_compare.MAX_OUT))  # 1 s timeout
    assert _only_own_arm_fails(tmp_path, "def apply(text, checks):\n    while True: pass\n")


def test_oversized_output_candidate_fails_only_its_own_arm(tmp_path):
    assert _only_own_arm_fails(tmp_path, "def apply(text, checks):\n    return text * 200000\n")


def _in_process(src):  # pre-FR-2 code takes a callable run in the evaluator process: same probe, so it fails on the score, not a TypeError
    def apply(text, checks):
        g = {}
        exec(src, g)
        return g["apply"](text, checks)
    return apply


def test_grandchild_holding_inherited_stdout_cannot_stall_or_outlive_the_arm(tmp_path):
    late = tmp_path / "late.txt"
    child = f"import time;time.sleep(5);open({str(late)!r},'w').write('x')"
    src = ("import subprocess, sys, time\n"
           f"subprocess.Popen([sys.executable, '-c', {child!r}], stdout=1, stderr=2)\n"
           "def apply(text, checks):\n    time.sleep(60)\n")
    t0 = time.time()
    with pytest.raises(RuntimeError, match="timed out"):
        experiment_compare.run_isolated(src, "a,b\n", {}, timeout=1)
    assert time.time() - t0 < 4
    time.sleep(7)
    assert not late.exists()  # the orphan was killed with the tree


def test_candidate_cannot_rewrite_the_scorer_and_self_report_7_of_7(tmp_path):
    """Reviewer's probe (FR-2): the old in-process candidate patched experiment_verify.VERIFIERS to always pass."""
    probe = ("try:\n    import hive.experiment_verify as v\n"
             "    for k in list(v.VERIFIERS): v.VERIFIERS[k] = lambda raw, checks, prof, exp=None: {'verdict': 'pass', 'failures': []}\n"
             "except Exception:\n    pass\n"
             "def apply(text, checks):  # still-violating edit: output is new (not cached from P0) so it must be re-verified\n"
             "    import re\n    return re.sub(r'\\((The|A)\\)', '(An)', text)\n")
    r, _ = _run(tmp_path, extra_candidates=[Candidate("C-probe", probe if hasattr(experiment_compare, "run_isolated") else _in_process(probe), "x", {"diagnosis_sha256": "d"}, "p")])
    c = next(x for x in r["candidates"] if x["candidate"] == "C-probe")
    hp = c["held_out_passes"]  # an honest score: identical output to P0 earns exactly P0's held-out passes
    assert hp["candidate"] == hp["P0"] and c["decision"] == "REJECT_NO_GAIN" and r["evaluator_unchanged_by_hash"]


def _only_own_arm_fails(tmp, src):
    r, _ = _run(tmp, extra_candidates=[Candidate("C-bad", src, "x", {"diagnosis_sha256": "d"}, "p")])
    bad = next(x for x in r["candidates"] if x["candidate"] == "C-bad")
    c1 = next(x for x in r["candidates"] if x["candidate"] == "C1-lowercase-forbidden-article")
    return bad["decision"] == "REJECT_REGRESSION" and c1["decision"] == "REJECT_NO_GAIN" and all(r["p0_reproduces_driver_verdict_on_real_items"].values())


def test_heldout_input_duplicating_development_is_refused_and_bad_labels_refused(tmp_path):
    dup = {"id": "dup", "kind": "REAL_PINNED", "base": "bad"}
    plan, al, tr = _plan(tmp_path / "a", test=[dup])
    with pytest.raises(ExperimentError, match="duplicate"):
        run_compare(plan, tmp_path / "a" / "out", allowlist=al, transport=tr)
    plan, al, tr = _plan(tmp_path / "b", test=[{"id": "u", "kind": "UNSEEN", "base": "ok"}])
    with pytest.raises(ExperimentError, match="kind"):
        run_compare(plan, tmp_path / "b" / "out", allowlist=al, transport=tr)


def test_learning_off_makes_no_candidate_and_mutations_are_deterministic():
    diag = {"class": "VERIFICATION_FAILED", "experiment_id": "e", "proposed_repair": {"status": "PROPOSED_QUARANTINED_NOT_APPLIED",
            "rule": "lowercase matches of x", "cells_changed": 1}}
    assert make_candidate(diag, "p", learning=False) is None and make_candidate(diag, "p").parent_hash == "p"
    assert mutate(GOOD6, {"op": "inject_article", "seed": 7, "count": 2}) == mutate(GOOD6, {"op": "inject_article", "seed": 7, "count": 2}) != GOOD6
    with pytest.raises(ExperimentError):
        make_candidate({**diag, "proposed_repair": {**diag["proposed_repair"], "status": "APPLIED"}}, "p")


def test_rerun_replays_with_same_result_hash_and_no_new_requests(tmp_path):
    r1, tr = _run(tmp_path)
    n = tr.calls
    r2 = run_compare(tmp_path / "plan.json", tmp_path / "out", allowlist=tmp_path / "allow.json", transport=tr)
    assert tr.calls == n and r2["result_sha256"] == r1["result_sha256"]


def test_lineage_hook_registers_idempotent_and_receipt_unchanged(tmp_path):
    from hive import lineage as L
    from hive.storage import Store
    plan, al, tr = _plan(tmp_path)
    base = run_compare(plan, tmp_path / "plain", allowlist=al, transport=tr)
    s = Store(tmp_path / "ls")
    r1 = run_compare(plan, tmp_path / "o1", allowlist=al, transport=tr, lineage_store=s)
    r2 = run_compare(plan, tmp_path / "o2", allowlist=al, transport=tr, lineage_store=s)  # rerun, same store
    assert r1["result_sha256"] == r2["result_sha256"] == base["result_sha256"]
    l1, l2 = (json.loads((tmp_path / o / "lineage.json").read_text()) for o in ("o1", "o2"))
    assert l1 == l2 and l1["candidates"]
    for e in l1["candidates"].values():
        assert L.verify_lineage(s, e["lineage_hash"]) == [] and L.children_of(s, l1["p0"]) == [e["lineage_hash"]]
