"""M1 campaign (protocol m1-row-reconcile-v1): phases search | final --cases PATH | lifecycle --cases PATH.
`final` and `lifecycle` take a path to a private partition file; only the conductor runs them on real F-final/F-reuse."""
import argparse, copy, json, os, random, shutil, subprocess, sys, time
from fractions import Fraction
from itertools import product
from math import comb
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
from hive import lineage, m1_views as V, m1_workflow as W  # noqa: E402
from hive.storage import Store  # noqa: E402

OUT = Path(os.environ.get("M1_OUT", ROOT / "build" / "m1"))
DATA = Path(os.environ.get("M1_DATA", OUT / "data"))
T0 = time.time()


# ---- pure helpers (unit-tested) ----
def mcnemar_p(b, c):
    """Exact one-sided McNemar: P(X >= b), X ~ Bin(b+c, 1/2); b = nominee-only passes, c = comparator-only passes."""
    n = b + c
    return sum(comb(n, k) for k in range(b, n + 1)) / 2 ** n if n else 1.0


def rank_key(c):  # sel_pass_rate desc, steps asc, digest asc
    return (-Fraction(c["sel_pass"], c["sel_n"]), len(c["steps"]), c["digest"])


def nominate(cands, dev_min=0.9):
    ok = [c for c in cands if Fraction(c["dev_pass"], c["dev_n"]) >= Fraction(str(dev_min))]
    return min(ok, key=rank_key) if ok else None


def arm3_pick(a, b):
    return min((a, b), key=rank_key)


def by_cat(cases, verdicts):
    out = {}
    for c, v in zip(cases, verdicts):
        for k in (sorted(c["counts"]["cats"]) or ["clean"]):
            t = out.setdefault(k, [0, 0]); t[0] += v; t[1] += 1
    return out


# ---- io ----
def jlog(path, rec):
    with open(path, "a", encoding="utf-8", newline="\n") as f: f.write(json.dumps(rec, sort_keys=True) + "\n")


def expose(partition, count, purpose):
    jlog(OUT / "exposure.jsonl", {"ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "who": "m1_campaign", "partition": partition, "action": "read", "count": count, "purpose": purpose})


def attempt(**kw):
    kw.update(ts=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), wall_s=round(time.time() - T0, 1), model_calls=0, network_calls=0, docker_runs_total=_runs()["total"])
    jlog(OUT / "candidate_attempts.jsonl", kw)


def _runs():
    p = OUT / "docker_runs.json"
    return json.loads(p.read_text()) if p.exists() else {"total": 0}


def batch(store, h, cases):
    """Counted container run (campaign cap from policy). Counter persists across phases/processes."""
    t = _runs(); cap = W.load_policy()["max_container_runs"]
    if t["total"] >= cap: raise W.PolicyViolation(f"container run cap {cap} reached")
    t["total"] += 1; (OUT / "docker_runs.json").write_text(json.dumps(t))
    return W.execute_batch(store, h, cases)


def wjson(name, obj, exclusive=False):
    with open(OUT / name, "x" if exclusive else "w", encoding="utf-8", newline="\n") as f: f.write(json.dumps(obj, indent=1, sort_keys=True) + "\n")


def rjson(name): return json.loads((OUT / name).read_text(encoding="utf-8"))


# ---- search ----
def search():
    if (OUT / "nominee.json").exists(): raise SystemExit("nominee.json exists: the nominee is immutable; search refused")
    pol = W.load_policy()
    for n in ("candidate_attempts.jsonl", "docker_runs.json", "state.json"): (OUT / n).unlink(missing_ok=True)
    if (OUT / "store").exists(): shutil.rmtree(OUT / "store")
    dev, dev_sha = W.load_cases(DATA / "f_dev.jsonl"); sel, sel_sha = W.load_cases(DATA / "f_sel.jsonl")
    s = Store(OUT / "store"); root = W.register_w_strict(s)
    d_strict = W.canonical_digest(W.W_STRICT)
    variants, steps_of = {d_strict: root}, {d_strict: W.W_STRICT}
    attempt(kind="proposal", seq=1, steps=W.W_STRICT, digest=d_strict, outcome="registered_as_root", genome=root, proposer="native_enumeration",
            note="W_strict is the lineage root; same digest, not double-registered; counts as proposal 1")
    for steps in W.enumerate_legal(pol):
        d = W.canonical_digest(steps)
        if d in variants: continue
        k, v = W.propose(s, root, steps)
        assert k == "registered", v
        variants[d], steps_of[d] = v, steps
        attempt(kind="proposal", seq=s.get(W.CAMP)["proposals"], steps=steps, digest=d, outcome="registered", genome=v, parent=root, proposer="native_enumeration")
    for label, steps in (("unknown_primitive", ["rm_rf"]), ("depth_4", ["identity"] * 4), ("type_failing", ["aggregate", "parse_whole"]), ("duplicate", W.W_STRICT)):
        k, ref = W.propose(s, root, steps); assert k == "refused"
        attempt(kind="proposal", seq=s.get(W.CAMP)["proposals"], steps=steps, outcome="refused", reason=s.read_artifact(ref)["reason"], label=label, artifact=ref, proposer="integrity_preflight")
    # arm 5 evaluation: every registered legal variant on F-dev then F-sel (one container run each)
    res, receipts = {}, {}
    for d, h in variants.items():
        res[d], receipts[d] = {}, {}
        for part, cases, psha in (("F-dev", dev, dev_sha), ("F-sel", sel, sel_sha)):
            if part == "F-sel": expose("F-sel", len(cases), f"search: score-only evaluation of {d[:12]}")
            outs = batch(s, h, cases); r, ref = W.receipt(s, h, part, cases, psha, outs)
            res[d][part], receipts[d][part] = r["pass_count"], ref
            attempt(kind="evaluation", digest=d, genome=h, partition=part, pass_count=r["pass_count"], n=r["n"], receipt=ref, verdicts=dict(zip(r["case_ids"], r["verdicts"])) if part == "F-dev" else "score_only")
    cands = [{"digest": d, "hash": variants[d], "steps": steps_of[d], "dev_pass": res[d]["F-dev"], "dev_n": len(dev), "sel_pass": res[d]["F-sel"], "sel_n": len(sel)} for d in variants]
    # arm 4: 20 seeded uniform draws over all 584 lists; NOT submitted; legal draws reuse arm-5 F-dev results (no extra runs)
    rng = random.Random(pol["random_search_arm_seed"])
    universe = [list(t) for n in range(1, pol["max_steps"] + 1) for t in product(W.symbols(), repeat=n)]
    assert len(universe) == 584
    draws, first = [], None
    for i in range(20):
        steps = rng.choice(universe)
        try: W.validate(steps, pol); legal = True
        except W.PolicyViolation: legal = False
        d = W.canonical_digest(steps) if legal else None
        dp = res[d]["F-dev"] if legal else None
        hit = bool(legal and Fraction(dp, len(dev)) >= Fraction("0.9"))
        if hit and first is None: first = i + 1
        draws.append({"draw": i + 1, "steps": steps, "type_checks": legal, "digest": d, "dev_pass": dp, "dev_n": len(dev) if legal else None, "hit_90": hit})
        attempt(kind="arm4_draw", **draws[-1])
    arm4 = {"seed": pol["random_search_arm_seed"], "draws": 20, "universe": len(universe), "legal_draws": sum(d["type_checks"] for d in draws),
            "first_hit_at": first, "result": f"first >=90% F-dev at draw {first}" if first else "none in 20", "draws_detail": draws}
    # nominate (§7) and arm 3 identity
    by_d = {c["digest"]: c for c in cands}
    a3 = arm3_pick(by_d[d_strict], by_d[W.canonical_digest(["identity", "parse_whole", "aggregate"])])
    nom = nominate(cands, pol["nomination"]["dev_min_pass_rate"])
    for c in cands:
        if c is not nom and c["hash"] != root:
            lineage.record_result(s, c["hash"], "REJECTED", {"dev": c["dev_pass"], "sel": c["sel_pass"]}, [receipts[c["digest"]]["F-sel"]])
    src = s.read_artifact(lineage.get(s, nom["hash"])["body_ref"])["text"] if nom else None
    nominee = {"digest": nom["digest"], "genome_hash": nom["hash"], "steps": nom["steps"], "source_sha256": W._sha(src), "dev": [nom["dev_pass"], nom["dev_n"]],
               "sel": [nom["sel_pass"], nom["sel_n"]]} if nom else {"digest": None, "failed": "no workflow passed >=90% of F-dev (M1 FAILED for this family)"}
    nominee.update(inventory=V.inventory(), rule="F-dev >= 90%, highest F-sel, ties fewer steps then smaller digest", policy_sha256=W.policy_sha(), protocol_sha256=W.protocol_sha(),
                   manifest_sha256=W.manifest_sha(), arm3={"digest": a3["digest"], "genome_hash": a3["hash"], "steps": a3["steps"], "sel": [a3["sel_pass"], a3["sel_n"]]},
                   arm4=arm4, candidates=cands, root=root)
    wjson("nominee.json", nominee, exclusive=True)
    wjson("state.json", {"root": root, "variants": variants, "steps": steps_of, "receipts": receipts, "nominee": nom["hash"] if nom else None})
    camp = s.get(W.CAMP)
    summary = {"proposals": camp["proposals"], "refusals": len(camp["refusals"]), "docker_runs": _runs()["total"], "nominee": nominee["digest"], "cands": cands, "arm4": {k: v for k, v in arm4.items() if k != "draws_detail"}}
    s.close(); return summary


# ---- final ----
def final(cases_path, infra_retry=False):
    nom, st = rjson("nominee.json"), rjson("state.json")
    if not nom.get("digest"): raise SystemExit("no nominee: M1 FAILED for this family")
    cases, psha = W.load_cases(cases_path); n = len(cases)
    retries = 0
    if (OUT / "final_result.json").exists():
        prev = rjson("final_result.json")
        if not (infra_retry and prev.get("infra_failure") and prev["partition_sha"] == psha and prev.get("infra_retries", 0) < 2):
            raise SystemExit("final_result.json exists: the holdout is retired (only an identical-bytes --infra-retry after an infra failure is allowed)")
        retries = prev.get("infra_retries", 0) + 1
    root, hn, h3 = st["root"], nom["genome_hash"], nom["arm3"]["genome_hash"]
    s = Store(OUT / "store")
    expose("F-final", n, "final: nominee and arms 1-3 (distinct workflows), single episode")
    rec, outs_of = {}, {}
    for h in dict.fromkeys([hn, root, h3]):
        try: outs = batch(s, h, cases)
        except Exception as e:  # container failed to start / timed out with no output = infra failure; retry on identical bytes
            wjson("final_result.json", {"infra_failure": True, "error": f"{type(e).__name__}: {e}", "workflow": h, "partition_sha": psha, "infra_retries": retries})
            s.close(); raise SystemExit(f"infra failure on {h[:12]}; logged")
        rec[h] = W.receipt(s, h, "F-final", cases, psha, outs)
    arms = {"arm1_W_strict": root, "arm2_disabled": root, "arm3_strongest_no_each": h3, "nominee": hn}
    ver = {a: rec[h][0]["verdicts"] for a, h in arms.items()}
    comp = max(("arm1_W_strict", "arm3_strongest_no_each"), key=lambda a: sum(ver[a]))
    b = sum(x and not y for x, y in zip(ver["nominee"], ver[comp])); c = sum(y and not x for x, y in zip(ver["nominee"], ver[comp]))
    p, np_, cp = mcnemar_p(b, c), sum(ver["nominee"]), sum(ver[comp])
    delta_ok, benefit = (np_ - cp) * 100 >= 20 * n, None
    benefit = delta_ok and p < 0.05
    res = {"infra_failure": False, "partition_sha": psha, "n": n, "infra_retries": retries, "passes": {a: sum(v) for a, v in ver.items()},
           "per_category": {a: by_cat(cases, ver[a]) for a in arms}, "comparator": comp, "comparator_pass": cp, "nominee_pass": np_,
           "delta_points": round((np_ - cp) * 100 / n, 2), "delta_ok": delta_ok, "mcnemar": {"b_nominee_only": b, "c_comparator_only": c, "p_one_sided": p},
           "benefit": benefit, "outcome": "ACCEPTED" if benefit else "REJECTED", "nominee_receipt_ref": rec[hn][1], "receipt_refs": {a: rec[h][1] for a, h in arms.items()}}
    lineage.record_result(s, hn, res["outcome"], {"final_pass": np_, "n": n, "comparator_pass": cp, "p": p}, [rec[hn][1]])
    wjson("final_result.json", res); s.close(); return res


# ---- lifecycle ----
def restart_phase(cases_path):
    st = rjson("state.json"); s = Store(OUT / "store"); root = st["root"]
    sel = W.selected(s, root); g = lineage.get(s, sel); cases, psha = W.load_cases(cases_path)
    pins = (g["provenance"].get("inventory") == V.inventory() and g["provenance"].get("policy_sha256") == W.policy_sha()
            and g["provenance"].get("protocol_sha256") == W.protocol_sha())
    pre = {"pid": os.getpid(), "selected": sel, "verify_selected_problems": W.verify_selected(s, root), "pins_intact": pins,
           "source_matches_steps": s.read_artifact(g["body_ref"])["text"] == W.compile_source(g["provenance"]["steps"]), "manifest_sha_ok": W.manifest_sha() == rjson("nominee.json")["manifest_sha256"]}
    r1, ref1 = W.receipt(s, sel, "F-reuse", cases, psha, batch(s, sel, cases))   # selection resolved from stored state
    r2, ref2 = W.receipt(s, root, "F-reuse", cases, psha, batch(s, root, cases))  # learning-disabled control = W_strict
    pre.update(selected_receipt=r1, selected_ref=ref1, control_receipt=r2, control_ref=ref2, selected_receipt_problems=W.verify_receipt(s, r1, cases_path),
               control_receipt_problems=W.verify_receipt(s, r2, cases_path))
    wjson("restart_result.json", pre); s.close()


def _reseal(r):
    r["receipt_sha"] = W._sha(W._json({k: v for k, v in r.items() if k != "receipt_sha"})); return r


def _refused(fn):
    try: fn()
    except W.PolicyViolation as e: return str(e)
    return None


def lifecycle(cases_path):
    nom, st, fr = rjson("nominee.json"), rjson("state.json"), rjson("final_result.json")
    if fr.get("outcome") != "ACCEPTED": raise SystemExit(f"nominee is {fr.get('outcome')}: select refused, lifecycle not run")
    cases, psha = W.load_cases(cases_path); root, hn = st["root"], st["nominee"]
    s = Store(OUT / "store")
    expose("F-reuse", len(cases), "lifecycle: restart reuse of selected nominee and learning-disabled control")
    out = {"root_is_parent": lineage.get(s, hn)["parent_hashes"] == [root], "lineage_problems_at_select": lineage.verify_lineage(s, hn)}
    fin = s.read_artifact(fr["nominee_receipt_ref"])
    out["select_event"] = W.select(s, hn, fin)
    s.close()
    subprocess.run([sys.executable, str(Path(__file__).resolve()), "--restart", "--cases", str(cases_path)], check=True)
    rr = rjson("restart_result.json"); r1, r2 = rr["selected_receipt"], rr["control_receipt"]
    b = sum(x and not y for x, y in zip(r1["verdicts"], r2["verdicts"])); c = sum(y and not x for x, y in zip(r1["verdicts"], r2["verdicts"]))
    p, n = mcnemar_p(b, c), len(cases)
    out["restart"] = {k: rr[k] for k in ("pid", "selected", "verify_selected_problems", "pins_intact", "source_matches_steps", "manifest_sha_ok", "selected_receipt_problems", "control_receipt_problems")}
    out["restart"].update(parent_pid=os.getpid(), new_process=rr["pid"] != os.getpid(), resolved_nominee=rr["selected"] == hn)
    reuse = {"nominee_pass": r1["pass_count"], "control_pass": r2["pass_count"], "n": n, "mcnemar": {"b": b, "c": c, "p_one_sided": p}, "per_category": {"nominee": by_cat(cases, r1["verdicts"]), "control": by_cat(cases, r2["verdicts"])}}
    reuse["pass"] = r1["pass_count"] >= W.load_policy()["decision"]["reuse_min_pass"] and (r1["pass_count"] - r2["pass_count"]) * 100 >= 20 * n and p < 0.05
    out["reuse"] = reuse
    s = Store(OUT / "store")
    out["rollback_event"] = W.rollback(s, root, "M1 lifecycle rollback to W_strict")
    after = W.selected(s, root); three = cases[:3]
    r3, _ = W.receipt(s, root, "F-reuse-3", three, psha, batch(s, root, three))
    out["rollback"] = {"resolves_to_W_strict": after == root, "history": [e["type"] for e in W.history(s)], "three_case_outputs_equal_control": s.read_artifact(r3["outputs_ref"])["outputs"] == s.read_artifact(r2["outputs_ref"])["outputs"][:3],
                       "three_case_pass": r3["pass_count"], "verify_selected_problems": W.verify_selected(s, root)}
    rej_d = W.canonical_digest(["identity", "parse_whole", "aggregate"]); rej = st["variants"][rej_d]
    rej_r = s.read_artifact(st["receipts"][rej_d]["F-sel"])
    forged = _reseal({**copy.deepcopy(fin), "partition": "F-final-forged"})
    tampered = {**copy.deepcopy(fin), "pass_count": fin["n"] - 1}
    stale = _reseal({**copy.deepcopy(fin), "policy_sha": "0" * 64})
    out["integrity"] = {"select_rejected_variant_refused": _refused(lambda: W.select(s, rej, rej_r)),
                        "forged_self_consistent_verify_problems": W.verify_receipt(s, forged), "forged_select_refused": _refused(lambda: W.select(s, hn, forged)),
                        "tampered_problems": W.verify_receipt(s, tampered), "tampered_select_refused": _refused(lambda: W.select(s, hn, tampered)),
                        "stale_problems": W.verify_receipt(s, stale), "stale_select_refused": _refused(lambda: W.select(s, hn, stale))}
    i = out["integrity"]
    out["all_ok"] = bool(out["root_is_parent"] and not out["lineage_problems_at_select"] and out["restart"]["new_process"] and out["restart"]["resolved_nominee"]
                         and not out["restart"]["verify_selected_problems"] and out["restart"]["pins_intact"] and out["restart"]["source_matches_steps"] and reuse["pass"]
                         and out["rollback"]["resolves_to_W_strict"] and out["rollback"]["three_case_outputs_equal_control"]
                         and i["select_rejected_variant_refused"] and i["forged_select_refused"] and i["tampered_problems"] and i["tampered_select_refused"] and i["stale_problems"] and i["stale_select_refused"])
    out["docker_runs_total"] = _runs()["total"]
    wjson("restart_reuse_rollback.json", out); s.close(); return out


if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("phase", nargs="?", choices=["search", "final", "lifecycle"]); ap.add_argument("--cases"); ap.add_argument("--infra-retry", action="store_true"); ap.add_argument("--restart", action="store_true")
    a = ap.parse_args()
    if a.restart: restart_phase(a.cases)
    elif a.phase == "search": print(json.dumps(search(), indent=1))
    elif a.phase in ("final", "lifecycle") and a.cases: print(json.dumps((final(a.cases, a.infra_retry) if a.phase == "final" else lifecycle(a.cases)), indent=1, default=str)[:3000])
    else: ap.error("phase search, or final/lifecycle with --cases PATH")
