"""M0 campaign: one deterministic offline lifecycle through real lineage/container/Store paths. Mechanism demo, not discovery."""
import copy, json, os, shutil, subprocess, sys, time
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
from hive import lineage, m0_oracle as O, workflow_candidate as W  # noqa: E402
from hive.experiment_compare import Candidate  # noqa: E402
from hive.run_state import RunStates  # noqa: E402
from hive.storage import Store  # noqa: E402

OUT = ROOT / "build" / "m0"
VALID, FAILS = ["scrub_delete", "scrub_lowercase"], ["scrub_lowercase"]


def restart_phase():
    s = Store(OUT / "store"); p0 = json.loads((OUT / "state.json").read_text())["p0"]
    sel = W.selected(s, p0); g = lineage.get(s, sel)
    src = s.read_artifact(g["body_ref"])["text"]
    out = W.execute(s, sel, "T2"); r, ref = W.receipt(s, sel, "T2", out)
    res = {"pid": os.getpid(), "selected": sel, "lineage_problems": lineage.verify_lineage(s, sel),
           "pins_intact": g["provenance"]["inventory"] == W.inventory() and g["provenance"]["policy_sha256"] == W.policy_sha(),
           "source_matches_steps": src == W.compile_source(g["provenance"]["steps"]), "receipt": r, "receipt_ref": ref,
           "receipt_problems": W.verify_receipt(s, r), "docker_runs": W.STATS["docker_runs"]}
    (OUT / "restart_result.json").write_text(json.dumps(res, indent=1), encoding="utf-8", newline="\n")


def main():
    t0 = time.time()
    if OUT.exists(): shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    s = Store(OUT / "store"); log = {}
    p0 = W.register_p0(s); (OUT / "state.json").write_text(json.dumps({"p0": p0}))
    # a. proposals
    kv, valid = W.propose(s, p0, VALID); assert kv == "registered"
    refusals = {"unknown_primitive": W.propose(s, p0, ["rm_rf"]), "four_steps": W.propose(s, p0, ["identity"] * 4),
                "duplicate": W.propose(s, p0, VALID)}
    assert all(k == "refused" for k, _ in refusals.values())
    kv, bad = W.propose(s, p0, FAILS); assert kv == "registered"
    log["refusals"] = {k: {"ref": v[1], "reason": s.read_artifact(v[1])["reason"]} for k, v in refusals.items()}
    # FR-9: a data_rule label on generated source still gets container
    fr9 = Candidate("c", W.compile_source(VALID), "r", {}, p0, operator_class="data_rule").backend
    assert fr9 == "container"
    # b. execute valid + failing through container, oracle, lineage, selection
    out = W.execute(s, valid, "T1"); r_valid, rv_ref = W.receipt(s, valid, "T1", out); assert r_valid["verdict"] == "PASS"
    assert W.verify_receipt(s, r_valid) == []
    lineage.record_result(s, valid, "ACCEPTED", {"T1": 1}, [rv_ref])
    out = W.execute(s, bad, "T1"); r_bad, rb_ref = W.receipt(s, bad, "T1", out); assert r_bad["verdict"] == "FAIL"
    lineage.record_result(s, bad, "REJECTED", {"T1": 0}, [rb_ref])
    sel_ev = W.select(s, valid, r_valid)
    # c. tamper / stale / selecting a failing candidate
    t = copy.deepcopy(r_valid); t["output_sha"] = O.sha("forged")
    tp = W.verify_receipt(s, t); assert tp
    stale = copy.deepcopy(r_valid); stale["oracle_sha"] = "0" * 64
    sp = W.verify_receipt(s, stale); assert sp
    try: W.select(s, bad, r_bad); refused_select = False
    except W.PolicyViolation: refused_select = True
    assert refused_select
    # d/e. restart in a NEW process, run T2
    keys_before = {k for (k,) in s.db.execute("SELECT key FROM kv")}
    s.close()
    subprocess.run([sys.executable, str(Path(__file__).resolve()), "--restart"], check=True)
    rr = json.loads((OUT / "restart_result.json").read_text())
    assert rr["selected"] == valid and rr["lineage_problems"] == [] and rr["pins_intact"] and rr["source_matches_steps"]
    assert rr["receipt"]["verdict"] == "PASS" and rr["receipt_problems"] == []
    # f. rollback
    s = Store(OUT / "store")
    rb_ev = W.rollback(s, p0, "M0 rollback demo")
    now = W.selected(s, p0); assert now == p0
    p0_out = W.execute(s, now, "T2"); p0_r, _ = W.receipt(s, now, "T2", p0_out)
    assert p0_out == O.TASKS["T2"]["input"] and p0_r["verdict"] == "FAIL"
    hist = W.history(s); assert [e["type"] for e in hist] == ["select", "rollback"]
    new_keys = {k for (k,) in s.db.execute("SELECT key FROM kv")} - keys_before
    assert all(k.startswith(("experiment/m0/", "lineage/")) for k in new_keys), new_keys
    states = {n: RunStates(s).resume(h)["state"] for n, h in (("p0", p0), ("valid", valid), ("failing", bad))}
    c = {"model_calls": 0, "network_calls": 0, "docker_runs": W.STATS["docker_runs"] + rr["docker_runs"],
         "proposals": s.get(W.CAMP)["proposals"], "refused": len(s.get(W.CAMP)["refusals"]), "wall_s": round(time.time() - t0, 1)}
    bundle = {"label": "M0 DEMONSTRATED MECHANISM - not discovery, not benefit", "p0": p0, "valid": valid, "failing_oracle": bad,
              "valid_steps": VALID, "states": states,
              "receipts": {"T1_valid": r_valid, "T1_failing": r_bad, "T2_after_restart": rr["receipt"], "T2_p0_after_rollback": p0_r},
              "negative_evidence": {"tampered_problems": tp, "stale_problems": sp, "select_failing_refused": refused_select, "refusals": log["refusals"]},
              "selection_events": {"select": sel_ev, "rollback": rb_ev, "history_len": len(hist), "resolves_to_p0": now == p0},
              "restart": {"new_pid": rr["pid"], "parent_pid": os.getpid(), "lineage_problems": rr["lineage_problems"], "pins_intact": rr["pins_intact"]},
              "pins": {"policy_sha256": W.policy_sha(), "oracle_sha": O.oracle_sha(), "protocol_sha": O.protocol_sha(), "inventory": W.inventory()},
              "fr9_label_backend": fr9, "lineage_verify": lineage.verify_lineage(s, valid), "counts": c}
    (OUT / "m0_receipt_bundle.json").write_text(json.dumps(bundle, indent=1, sort_keys=True), encoding="utf-8", newline="\n")
    (OUT / "REPORT.md").write_text(f"""# M0 DEMONSTRATED MECHANISM - not discovery, not benefit

Offline, deterministic, 0 model calls, 0 network calls. Docker runs: {c['docker_runs']}. Wall: {c['wall_s']}s.

| step | result |
|---|---|
| P0 root | {p0[:12]} (identity, lineage root) |
| valid {VALID} | {valid[:12]} ACCEPTED, T1 PASS on container |
| fails oracle {FAILS} | {bad[:12]} REJECTED, retained |
| refused before execution | unknown primitive, 4 steps, duplicate digest ({c['refused']} artifacts) |
| FR-9 | data_rule label on generated source -> backend `{fr9}` |
| tampered / stale receipt | rejected ({len(tp)} / {len(sp)} problems) |
| restart (new pid {rr['pid']}) | lineage verified, pins intact, selection resolved to {rr['selected'][:12]} |
| T2 (unseen input) after restart | {rr['receipt']['verdict']} through container |
| rollback | selection -> P0; P0 output == T2 input (identity), history = select, rollback |

Selection lives only under `experiment/m0/`; no production/P0/P2 key was written. M0 is mechanism only; M1 (one verified new effect) is not claimed.
""", encoding="utf-8", newline="\n")
    s.close(); print("M0 OK", json.dumps(c))


if __name__ == "__main__":
    restart_phase() if "--restart" in sys.argv else main()
