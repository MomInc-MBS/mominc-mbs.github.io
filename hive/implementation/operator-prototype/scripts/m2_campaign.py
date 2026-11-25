"""M2 campaign driver (protocol m2-local-model-two-effects-v1). One stage per invocation:
  preflight | freeze-manifest | prove | smoke | campaign [--campaign A-R|A-C|B-R|B-C|all] [--stub-url URL] | arm4 | final [--effect R|C] | lifecycle | weights
Real-model stages (smoke, campaign) need build/m2/operator_inference_approval.json (§13). Stub runs (--stub-url) write only under build/m2/stub.
Holdout data (F-sel, F-final, F-reuse) is read only by the stage that needs it, and every read is logged to exposure.jsonl."""
import argparse, copy, importlib.util, json, os, random, shutil, subprocess, sys, time
from fractions import Fraction
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
from hive import lineage, m2_model as M, m2_views as V, m2_workflow as W  # noqa: E402
from hive.storage import Store  # noqa: E402

_spec = importlib.util.spec_from_file_location("m1c", ROOT / "scripts" / "m1_campaign.py")
m1c = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(m1c)  # reuse M1's mcnemar_p / nominate / rank_key
OUT, DATA, STUB, T0 = ROOT / "build" / "m2", ROOT / "build" / "m2" / "data", None, time.time()


class Stop(RuntimeError): """Wall-time bound reached: checkpoint, resume later."""


def configure(out=None, data=None, stub_url=None):
    """Resolve paths. Stub runs never write outside build/m2/stub (or an explicit M2_OUT used by tests)."""
    global OUT, DATA, STUB
    STUB = stub_url or os.environ.get("M2_STUB_URL")
    OUT = Path(out or os.environ.get("M2_OUT") or (ROOT / "build" / "m2" / ("stub" if STUB else "")))
    DATA = Path(data or os.environ.get("M2_DATA") or ROOT / "build" / "m2" / "data")
    OUT.mkdir(parents=True, exist_ok=True)
    if os.environ.get("M2_MANIFEST"): W.MANIFEST_PATH = Path(os.environ["M2_MANIFEST"])
    elif STUB and not W.MANIFEST_PATH.exists():  # stub runs get a stub manifest beside their records, never the real one
        W.MANIFEST_PATH = OUT / "evaluation_manifest.json"
        pol = W.load_policy()
        W.MANIFEST_PATH.write_text(json.dumps({"schema": pol["manifest_schema"], "protocol": {"blob_sha256": W.protocol_sha()}, "policy": {"blob_sha256": W.policy_sha()},
                                               "inventory": W.inventory(), "prompts": W.prompt_hashes(pol), "stub": True}, indent=1, sort_keys=True), encoding="utf-8", newline="\n")


# ---- io ----
def jlog(name, rec):
    with open(OUT / name, "a", encoding="utf-8", newline="\n") as f: f.write(json.dumps(rec, sort_keys=True) + "\n")


def wjson(name, obj, exclusive=False):
    with open(OUT / name, "x" if exclusive else "w", encoding="utf-8", newline="\n") as f: f.write(json.dumps(obj, indent=1, sort_keys=True) + "\n")


def rjson(name, default=None):
    p = OUT / name
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else default


def expose(partition, effect, count, purpose):
    jlog("exposure.jsonl", {"ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "who": "m2_campaign", "partition": partition, "effect": effect, "action": "read", "count": count, "purpose": purpose})


def dpath(part, effect):
    tried = [d / n for d in (DATA, ROOT / ".hive" / "m2-private") for n in (f"{part}_{effect}.jsonl", f"{effect}/{part}.jsonl", f"{part}.{effect}.jsonl")]
    for p in tried:
        if p.exists(): return p
    raise SystemExit("no data file for %s/%s; tried: %s" % (part, effect, ", ".join(str(t) for t in tried)))


def load_part(part, effect):
    """(cases, sha256). When the evaluation manifest records partition hashes, the file bytes must match them."""
    cases, sha = W.load_cases(dpath(part, effect))
    try: want = (json.loads(W.MANIFEST_PATH.read_text(encoding="utf-8")).get("partitions") or {}).get(f"{part}_{effect}.jsonl")
    except (OSError, ValueError): want = None
    if want and want != sha: raise M.Invalidated(f"partition {part}_{effect} sha differs from the evaluation manifest")
    return cases, sha


def is_defective(c):
    k = c["counts"]  # R: defective = number of defective rows; C: invalid_files = number of invalid files
    return bool(k["invalid_files"] if "invalid_files" in k else k["defective"])


def by_cat(cases, verdicts):
    """Pass counts by first-failure category (R: counts.cats keys; C: counts.first_cats of the batch); clean units under 'clean'."""
    out = {}
    for c, v in zip(cases, verdicts):
        k = c["counts"]
        cats = sorted(str(x) for x in (k["first_cats"] if "first_cats" in k else k.get("cats", {}))) if is_defective(c) else []
        for x in (sorted(set(cats)) or ["clean"]):
            t = out.setdefault(x, [0, 0]); t[0] += v; t[1] += 1
    return out


def trunc(s, n=600): return s if len(s) <= n else s[:n] + "...[truncated]"


# ---- stores, counters, cache ----
def store(): return Store(OUT / "store")


def runs(): return rjson("docker_runs.json", {"total": 0})


def batch(s, h, effect, cases, psha):
    """One workflow on one partition batch. Wrong-type: 0 runs. Identical (digest, partition) results are reused; real runs count toward the cap."""
    if not W.needs_container(s, h, effect): return W.execute_batch(s, h, effect, cases)
    key = f"{effect}|{W.canonical_digest(W.steps_of(s, h))}|{psha}"
    cache = rjson("eval_cache.json", {})
    if key in cache: return cache[key]
    t, cap = runs(), W.load_policy()["max_container_runs"]
    if t["total"] >= cap: raise M.CapReached(f"container run cap {cap} reached")
    t["total"] += 1; wjson("docker_runs.json", t)
    cache[key] = W.execute_batch(s, h, effect, cases); wjson("eval_cache.json", cache)
    return cache[key]


def init_store():
    """Fresh store with W_strict as root and the fixed arm-3 / M1 comparators (all children of root). Idempotent."""
    st = rjson("state.json")
    if st: return st
    if (OUT / "store").exists(): shutil.rmtree(OUT / "store")
    s, pol = store(), W.load_policy()
    root = W.register_root(s)
    st = {"root": root, "arm3": {e: W.register(s, root, pol["arm3"][e], effect=e, arm=3) for e in W.EFFECTS}, "m1": W.register(s, root, pol["m1_workflow"], arm="m1_workflow")}
    s.close(); wjson("state.json", st)
    return st


def pins_now():
    pol = W.load_policy()
    return {"policy": W.policy_sha(), "protocol": W.protocol_sha(), "prompts": W.prompt_hashes(pol), "inventory": W.inventory()}


def check_pins():
    """§8 invalidation: any edit to inventory, prompts, policy or protocol after the first model call."""
    rec = rjson("pins_at_first_call.json")
    if rec is None: wjson("pins_at_first_call.json", pins_now())
    elif rec != pins_now(): raise M.Invalidated("pin drift after the first model call (inventory, prompts, policy or protocol)")


# ---- prompts ----
def prompt_text(name): return (W.PROMPT_DIR / name).read_text(encoding="utf-8").replace("\r\n", "\n")


def pick_examples(dev):
    """First 3 F-dev cases in file order if they are 1 valid + 2 defective; otherwise the first valid and the first two defective (shown in file order)."""
    first3 = dev[:3]
    if sum(is_defective(c) for c in first3) == 2: return first3
    want = [c for c in dev if not is_defective(c)][:1] + [c for c in dev if is_defective(c)][:2]
    return [c for c in dev if c in want]


def render_example(effect, i, c):
    if effect == "R":
        return f"Example {i} (format {c['format']})\nInput:\n{__import__('base64').b64decode(c['source']).decode('utf-8')}\nExpected output:\n{c['expected']}\n"
    return f"Example {i}\nInput:\n{json.dumps(W.case_env('C', c), ensure_ascii=False)}\nExpected output:\n{c['expected']}\n"


def render_history(row):
    tpl = prompt_text("history.txt")
    fails = "".join(f"- case {f['case_id']}: actual {trunc(f['actual'])} ; expected {trunc(f['expected'])}\n" for f in row.get("failures", []))
    return tpl.replace("<<N>>", str(row["round"])).replace("<<STEPS>>", json.dumps(row["steps"]) if row.get("steps") else "(none)").replace("<<OUTCOME>>", row["outcome"]).replace("<<FAILURES>>", fails.rstrip("\n")).rstrip("\n") + "\n"


def build_prompt(effect, dev, rows, log=None):
    pol = W.load_policy()
    head = prompt_text(f"propose_{effect}.txt").replace("<<EXAMPLES>>", "\n".join(render_example(effect, i + 1, c) for i, c in enumerate(pick_examples(dev))).rstrip("\n"))
    hist = [render_history(r) for r in rows[-pol["history_rows"]:]]
    return M.assemble(prompt_text("system.txt").rstrip("\n"), head, hist, prompt_text("contract.txt").rstrip("\n"), pol["prompt_max_bytes"], log)


def preflight():
    pol = W.load_policy()
    counts = W.space_counts(pol)
    rep = {"counts": counts, "counts_ok": counts == W.EXPECTED_COUNTS, "m1_pin_problems": W.verify_m1_pins(), "prompt_scan_hits": W.scan_prompts(pol), "prompt_hashes": W.prompt_hashes(pol),
           "inventory": W.inventory(), "policy_sha": W.policy_sha(), "protocol_sha": W.protocol_sha(), "manifest_problems": M.manifest_problems(pol),
           "approval_problems": M.approval_problems(None, pol), "base_prompt_bytes": {}}
    for e in W.EFFECTS:
        try:
            dev, _ = load_part("f_dev", e); rep["base_prompt_bytes"][e] = build_prompt(e, dev, [])[2]
        except SystemExit as x: rep["base_prompt_bytes"][e] = str(x)
        except M.PromptTooLarge as x: rep["base_prompt_bytes"][e] = f"BLOCKS: {x}"
    rep["ready_to_freeze"] = bool(rep["counts_ok"] and not rep["m1_pin_problems"] and not rep["prompt_scan_hits"] and all(isinstance(v, int) for v in rep["base_prompt_bytes"].values()))
    wjson("preflight.json", rep)
    return rep


# ---- model ----
def make_model():
    return M.Model(OUT, stub=bool(STUB), endpoint=STUB or None)


def first_call_checks(model):
    if not (OUT / "weight_checks.jsonl").exists():
        model.list_models(); model.check_weights("before_first_call")
    check_pins()


def smoke(model):
    first_call_checks(model)
    pol, res = W.load_policy(), []
    for i in (1, 2):
        r = model.call("smoke", [{"role": "system", "content": prompt_text("system.txt").rstrip("\n")}, {"role": "user", "content": prompt_text("smoke.txt").rstrip("\n")}], M.smoke_seed(i, pol))
        res.append({"i": i, "status": r["status"], "content": r["content"], "ok": r["content"].strip() == '{"smoke":"ok"}'})
    wjson("smoke_result.json", res)
    return res


# ---- campaigns (M2-2) ----
def run_campaign(name, model):
    cam, effect = name.split("-")
    pol, nomf = W.load_policy(), OUT / f"nominee_{name}.json"
    if nomf.exists(): raise SystemExit(f"{nomf.name} exists: the nominee is immutable; campaign refused")
    first_call_checks(model)
    st = init_store(); s = store()
    dev, dsha = load_part("f_dev", effect); sel, ssha = load_part("f_sel", effect)
    tp = OUT / f"transcript_{name}.jsonl"
    rows = [json.loads(l) for l in tp.read_text(encoding="utf-8").splitlines() if l.strip()] if tp.exists() else []
    seen = {r["digest"] for r in rows if r.get("digest")}
    t_start = time.time()
    for rnd in range(len(rows) + 1, pol["proposals_per_campaign"] + 1):
        if time.time() - t_start > pol["wall_hours_per_campaign"] * 3600: raise Stop(f"campaign {name} wall-time bound reached")
        drops = []
        system, user, size = build_prompt(effect, dev, rows, drops.append)
        r = model.call("proposal", [{"role": "system", "content": system}, {"role": "user", "content": user}], M.seed_for(cam, effect, rnd, pol), name, rnd)
        row = {"campaign": name, "round": rnd, "seed": r["seed"], "prompt_bytes": size, "prompt_sha": W._sha(system + "\n" + user), "history_drops": drops, "call_status": r["status"],
               "attempts": r["attempts"], "usage": r["usage"], "content": r["content"], "steps": None, "digest": None, "genome": None}
        steps = M.parse_reply(r["content"]) if r["status"] == "ok" else None
        if r["status"] != "ok": row["outcome"] = "transport_failure: no reply received"
        elif steps is None: row["outcome"] = 'refused: the reply had no valid {"steps": [...]} object'
        else:
            row["steps"] = steps; why = V.type_check(steps, *W.etypes(effect, pol))
            d = W.canonical_digest(steps)
            if why: row["outcome"] = "refused: " + why
            elif d in seen: row["outcome"] = f"refused: duplicate of an earlier proposal in this session ({d[:12]})"
            else:
                seen.add(d); row["digest"] = d
                h = W.register(s, st["root"], steps, effect=effect, campaign=name, round=rnd); row["genome"] = h
                outs = batch(s, h, effect, dev, dsha); rc, ref = W.receipt(s, h, effect, "F-dev", dev, dsha, outs)
                row.update(dev_pass=rc["pass_count"], dev_n=len(dev), dev_receipt=ref, outcome=f"F-dev passes {rc['pass_count']} of {len(dev)}",
                           failures=[{"case_id": c["case_id"], "actual": o, "expected": c["expected"]} for c, o, v in zip(dev, outs, rc["verdicts"]) if not v][:3])
                if Fraction(rc["pass_count"], len(dev)) >= Fraction(str(pol["nomination"]["dev_min_pass_rate"])):
                    expose("F-sel", effect, len(sel), f"{name} round {rnd}: score-only evaluation of {d[:12]}")
                    so = batch(s, h, effect, sel, ssha); sc, sref = W.receipt(s, h, effect, "F-sel", sel, ssha, so)
                    row.update(sel_pass=sc["pass_count"], sel_n=len(sel), sel_receipt=sref)
        with open(tp, "a", encoding="utf-8", newline="\n") as f: f.write(json.dumps(row, sort_keys=True) + "\n")
        rows.append(row)
    # nomination (§8): eligible = F-dev >= 90%; highest F-sel, then fewer steps, then smallest digest
    cands = [{"digest": r["digest"], "hash": r["genome"], "steps": r["steps"], "dev_pass": r["dev_pass"], "dev_n": r["dev_n"], "sel_pass": r.get("sel_pass"), "sel_n": r.get("sel_n"),
              "dev_receipt": r["dev_receipt"], "sel_receipt": r.get("sel_receipt")} for r in rows if r.get("genome")]
    nom = m1c.nominate(cands, pol["nomination"]["dev_min_pass_rate"])
    for c in cands:
        if c is not nom: lineage.record_result(s, c["hash"], "REJECTED", {"dev": c["dev_pass"], "sel": c["sel_pass"]}, [c["sel_receipt"] or c["dev_receipt"]])
    steps_h = lambda x: x["steps"]
    rec = {"campaign": name, "effect": effect, "digest": nom["digest"] if nom else None, "genome_hash": nom["hash"] if nom else None, "steps": steps_h(nom) if nom else None,
           "failed": None if nom else "no eligible nominee", "dev": [nom["dev_pass"], nom["dev_n"]] if nom else None, "sel": [nom["sel_pass"], nom["sel_n"]] if nom else None,
           "source_sha256": W._sha(s.read_artifact(lineage.get(s, nom["hash"])["body_ref"])["text"]) if nom else None, "inventory": W.inventory(), "policy_sha256": W.policy_sha(),
           "protocol_sha256": W.protocol_sha(), "manifest_sha256": W.manifest_sha(), "prompt_sha256": W.prompt_hashes(pol), "transcript_sha256": W._sha((OUT / tp.name).read_bytes()),
           "model_sha256": pol["model"]["sha256"], "candidates": cands, "proposals": len(rows), "distinct_legal_digests": len(cands),
           "stats": {"valid_proposals": sum(1 for r in rows if r.get("steps")), "invalid_or_failed": sum(1 for r in rows if not r.get("steps")), "tokens": sum(r["usage"].get("total_tokens", 0) for r in rows if r.get("usage"))}}
    wjson(f"nominee_{name}.json", rec, exclusive=True)
    s.close()
    return rec


def run_campaigns(model, which):
    pol = W.load_policy()
    names = pol["campaign_order"] if which == "all" else [which]
    out = {}
    for n in names:
        if (OUT / f"nominee_{n}.json").exists():
            out[n] = "already nominated"; continue
        out[n] = {k: v for k, v in run_campaign(n, model).items() if k in ("digest", "dev", "sel", "failed", "proposals")}
    if all((OUT / f"nominee_{n}.json").exists() for n in pol["campaign_order"]) and not (OUT / "after_campaigns.done").exists():
        model.check_weights("after_last_call"); (OUT / "after_campaigns.done").write_text("ok\n")
    return out


# ---- arm 4 (report only) ----
def arm4():
    pol, st = W.load_policy(), init_store()
    s, res = store(), {}
    for e in W.EFFECTS:
        dev, dsha = load_part("f_dev", e); res[e] = {}
        for label, universe in (("type_legal", V.enumerate_legal(*W.etypes(e, pol))), ("all_1110", V.all_lists())):
            rng, draws, first, genomes = random.Random(pol["random_search_arm_seed"]), [], None, {}
            for i in range(pol["random_search_draws"]):
                steps = rng.choice(universe); why = V.type_check(steps, *W.etypes(e, pol))
                d = {"draw": i + 1, "steps": steps, "type_checks": why is None, "refusal": why, "dev_pass": None, "hit_90": False}
                if why is None:
                    dg = W.canonical_digest(steps)
                    if dg not in genomes: genomes[dg] = W.register(s, st["root"], steps, effect=e, arm=4, universe=label)
                    outs = batch(s, genomes[dg], e, dev, dsha); k = sum(o == c["expected"] for o, c in zip(outs, dev))
                    d.update(dev_pass=k, dev_n=len(dev), digest=dg, hit_90=Fraction(k, len(dev)) >= Fraction("0.9"))
                    if d["hit_90"] and first is None: first = i + 1
                draws.append(d)
            res[e][label] = {"universe": len(universe), "draws": draws, "legal_draws": sum(d["type_checks"] for d in draws), "first_hit_at": first}
    wjson("arm4.json", res); s.close()
    return {e: {k: {"legal_draws": v["legal_draws"], "first_hit_at": v["first_hit_at"]} for k, v in res[e].items()} for e in res}


# ---- F-final (M2-3) ----
def decide(nominee_v, comp_v, n, delta):
    b = sum(x and not y for x, y in zip(nominee_v, comp_v)); c = sum(y and not x for x, y in zip(nominee_v, comp_v))
    p = m1c.mcnemar_p(b, c)
    return {"b": b, "c": c, "p_one_sided": p, "delta_points": round((sum(nominee_v) - sum(comp_v)) * 100 / n, 2), "delta_ok": (sum(nominee_v) - sum(comp_v)) * 100 >= delta * n, "p_ok": p < 0.05}


def final_effect(e, infra_retry=False):
    pol, st = W.load_policy(), rjson("state.json")
    name, fname = f"nominee_A-{e}.json", f"final_result_{e}.json"
    nom = rjson(name)
    if nom is None: raise SystemExit(f"{name} missing: run the campaign stage first (F-final is not opened before nomination)")
    if not nom.get("digest"):
        wjson(fname, {"effect": e, "outcome": "FAILED", "why": "no eligible A nominee"}); return {"effect": e, "outcome": "FAILED"}
    cases, psha = load_part("f_final", e); n = len(cases)
    retries = 0
    if (OUT / fname).exists():
        prev = rjson(fname)
        if not (infra_retry and prev.get("infra_failure") and prev["partition_sha"] == psha and prev.get("infra_retries", 0) < pol["final_infra_retries_per_case"]):
            raise SystemExit(f"{fname} exists: the holdout is retired (only an identical-bytes --infra-retry after an infra failure is allowed)")
        retries = prev["infra_retries"] + 1
    s = store(); root, hn = st["root"], nom["genome_hash"]
    resolved = W.selected(s, e, retained=False)
    assert W.steps_of(s, resolved) == W.W_STRICT and W.canonical_digest(W.steps_of(s, resolved)) == W.canonical_digest(W.W_STRICT), "arm 2 must resolve to W_strict through the store"
    expose("F-final", e, n, "final: nominee, arms 1-3, cross-checks, single episode")
    arms = {"nominee": hn, "arm1_W_strict": root, "arm2_disabled": resolved, "arm3_strongest_old": st["arm3"][e]}
    rec, ver = {}, {}
    for a, h in arms.items():
        try: outs = batch(s, h, e, cases, psha)
        except M.CapReached: raise
        except Exception as x:  # container start failure / timeout with no output: infra failure, retry on identical bytes
            wjson(fname, {"effect": e, "infra_failure": True, "error": f"{type(x).__name__}: {x}", "workflow": h, "partition_sha": psha, "infra_retries": retries}); s.close()
            raise SystemExit(f"infra failure on {a}; logged")
        rec[a] = W.receipt(s, h, e, "F-final", cases, psha, outs); ver[a] = rec[a][0]["verdicts"]
    comp = max(("arm1_W_strict", "arm2_disabled", "arm3_strongest_old"), key=lambda a: sum(ver[a]))
    dec = decide(ver["nominee"], ver[comp], n, pol["decision"]["delta_points"])
    other = rjson(f"nominee_A-{'C' if e == 'R' else 'R'}.json") or {}
    cross = {}
    for label, h in (("other_effect_nominee", other.get("genome_hash")), ("m1_workflow", st["m1"])):
        if h:
            r, _ = W.receipt(s, h, e, "F-final-cross", cases, psha, W.execute_batch(s, h, e, cases))
            cross[label] = {"pass": r["pass_count"], "n": n, "ok": r["pass_count"] * 10 <= n * 1}  # <= 10%, under the wrong-type rule
    dev, dsha = load_part("f_dev", e); nov = {}
    for label, h in (("W_strict", root), ("arm3", st["arm3"][e]), ("m1_workflow", st["m1"])):
        o = batch(s, h, e, dev, dsha); d_ok = [x == c["expected"] for x, c in zip(o, dev) if is_defective(c)]
        nov[label] = {"defective_units": len(d_ok), "passed": sum(d_ok), "ok": sum(d_ok) * 10 < len(d_ok)}
    benefit = dec["delta_ok"] and dec["p_ok"]
    res = {"effect": e, "infra_failure": False, "partition_sha": psha, "n": n, "infra_retries": retries, "passes": {a: sum(v) for a, v in ver.items()},
           "per_category": {a: by_cat(cases, ver[a]) for a in arms}, "comparator": comp, "decision": dec, "benefit": benefit, "cross_checks": cross, "novelty_rule_a_F_dev": nov,
           "novelty_rule_b_nominee_pass_rate": sum(ver["nominee"]) / n, "outcome": "ACCEPTED" if benefit else "REJECTED",
           "nominee_receipt_ref": rec["nominee"][1], "receipt_refs": {a: rec[a][1] for a in arms}}
    lineage.record_result(s, hn, res["outcome"], {"final_pass": sum(ver["nominee"]), "n": n, "p": dec["p_one_sided"]}, [rec["nominee"][1]])
    wjson(fname, res); s.close()
    return res


# ---- lifecycle (M2-4): select -> restart -> F-reuse -> rollback ----
def restart_phase():
    st, s, pol = rjson("state.json"), store(), W.load_policy()
    out = {"pid": os.getpid(), "effects": {}}
    for e in [e for e in W.EFFECTS if rjson(f"final_result_{e}.json", {}).get("outcome") == "ACCEPTED"]:
        cases, psha = load_part("f_reuse", e)
        expose("F-reuse", e, len(cases), "lifecycle after restart: A selection, B nominee, retained-skill-disabled control, arm 3")
        sel, g = W.selected(s, e), lineage.get(s, W.selected(s, e))
        nA, nB = rjson(f"nominee_A-{e}.json"), rjson(f"nominee_B-{e}.json", {})
        ctl = W.selected(s, e, retained=False)
        pins = (g["provenance"]["inventory"] == W.inventory() and g["provenance"]["policy_sha256"] == W.policy_sha() and g["provenance"]["protocol_sha256"] == W.protocol_sha()
                and g["provenance"]["prompt_sha256"] == W.prompt_hashes(pol))
        info = {"selected": sel, "verify_selected_problems": W.verify_selected(s, e), "pins_intact": pins,
                "source_matches_steps": s.read_artifact(g["body_ref"])["text"] == W.compile_source(g["provenance"]["steps"]), "manifest_sha_ok": W.manifest_sha() == nA["manifest_sha256"],
                "control_is_W_strict": W.steps_of(s, ctl) == W.W_STRICT}
        for label, h in (("A", sel), ("B", nB.get("genome_hash")), ("control", ctl), ("arm3", st["arm3"][e])):
            if h:
                r, ref = W.receipt(s, h, e, "F-reuse", cases, psha, batch(s, h, e, cases, psha))
                info[label] = {"receipt": r, "ref": ref, "problems": W.verify_receipt(s, r, dpath("f_reuse", e)), "digest": W.canonical_digest(W.steps_of(s, h))}
        out["effects"][e] = info
    if not STUB and (OUT / "weight_checks.jsonl").exists():
        sha = M.weight_sha(pol["model"]["file"]); out["weight_after_reuse"] = {"sha256": sha, "ok": sha == pol["model"]["sha256"]}
        jlog("weight_checks.jsonl", {"label": "after_F_reuse", "sha256": sha, "expected": pol["model"]["sha256"], "ok": sha == pol["model"]["sha256"]})
    wjson("restart_result.json", out); s.close()


def _reseal(r):
    r["receipt_sha"] = W._sha(W._json({k: v for k, v in r.items() if k != "receipt_sha"})); return r


def _refused(fn):
    try: fn()
    except W.PolicyViolation as x: return str(x)
    return None


def lifecycle():
    pol, st = W.load_policy(), rjson("state.json")
    acc = [e for e in W.EFFECTS if rjson(f"final_result_{e}.json", {}).get("outcome") == "ACCEPTED"]
    if not acc: raise SystemExit("no effect ACCEPTED at F-final: select refused, lifecycle not run")
    s, res = store(), {"effects": {}}
    for e in acc:
        fr, nom = rjson(f"final_result_{e}.json"), rjson(f"nominee_A-{e}.json")
        res["effects"][e] = {"root_is_parent": lineage.get(s, nom["genome_hash"])["parent_hashes"] == [st["root"]], "lineage_problems_at_select": lineage.verify_lineage(s, nom["genome_hash"]),
                             "select_event": W.select(s, e, nom["genome_hash"], s.read_artifact(fr["nominee_receipt_ref"]))}
    s.close()
    env = dict(os.environ, M2_OUT=str(OUT), M2_DATA=str(DATA), M2_MANIFEST=str(W.MANIFEST_PATH), **({"M2_STUB_URL": STUB} if STUB else {}))
    subprocess.run([sys.executable, str(Path(__file__).resolve()), "restart"], check=True, env=env)  # new process: everything resolved from stored state
    rr, s = rjson("restart_result.json"), store()
    res["restart_pid_differs"] = rr["pid"] != os.getpid()
    for e in acc:
        info, cases = rr["effects"][e], load_part("f_reuse", e)[0]
        A, C3, A3 = info["A"]["receipt"], info["control"]["receipt"], info["arm3"]["receipt"]
        comp = C3 if C3["pass_count"] >= A3["pass_count"] else A3
        d = decide(A["verdicts"], comp["verdicts"], len(cases), pol["decision"]["delta_points"])
        B = info.get("B")
        reuse = {"A_pass": A["pass_count"], "control_pass": C3["pass_count"], "arm3_pass": A3["pass_count"], "n": len(cases), "decision": d,
                 "pass": A["pass_count"] >= pol["decision"]["reuse_min_pass"] and d["delta_ok"] and d["p_ok"],
                 "per_category": {k: by_cat(cases, info[k]["receipt"]["verdicts"]) for k in ("A", "control", "arm3")},
                 "B_reproduction": None if not B else {"pass": B["receipt"]["pass_count"], "n": len(cases), "digest": B["digest"], "ok": B["receipt"]["pass_count"] >= pol["decision"]["b_reuse_min_pass"]}}
        before = runs()["total"]
        res["effects"][e]["rollback_event"] = W.rollback(s, e, st["root"], "M2 lifecycle rollback to W_strict")
        three = cases[:3]; r3, _ = W.receipt(s, st["root"], e, "F-reuse-3", three, "n/a", W.execute_batch(s, st["root"], e, three))
        outs3 = s.read_artifact(r3["outputs_ref"])["outputs"]
        nom = rjson(f"nominee_A-{e}.json"); fr = rjson(f"final_result_{e}.json"); fin = s.read_artifact(fr["nominee_receipt_ref"])
        rej = next((r for r in (json.loads(l) for l in (OUT / f"transcript_A-{e}.jsonl").read_text(encoding="utf-8").splitlines()) if r.get("genome") and r["genome"] != nom["genome_hash"]), None)
        forged, tampered = _reseal({**copy.deepcopy(fin), "partition": "F-final-forged"}), {**copy.deepcopy(fin), "pass_count": fin["n"] - 1}
        stale = _reseal({**copy.deepcopy(fin), "policy_sha": "0" * 64})
        rb = {"resolves_to_W_strict": W.selected(s, e) == st["root"], "history": [x["type"] for x in W.history(s, e)], "three_case_outputs_all_wrong_type": outs3 == [W.WRONG_TYPE] * len(three),
              "container_runs_added": runs()["total"] - before, "verify_selected_problems": W.verify_selected(s, e)}
        integ = {"select_rejected_variant_refused": _refused(lambda: W.select(s, e, rej["genome"], s.read_artifact(rej["sel_receipt"] if rej.get("sel_receipt") else rej["dev_receipt"]))) if rej else "no rejected variant to test",
                 "forged_select_refused": _refused(lambda: W.select(s, e, nom["genome_hash"], forged)), "tampered_problems": W.verify_receipt(s, tampered), "tampered_select_refused": _refused(lambda: W.select(s, e, nom["genome_hash"], tampered)),
                 "stale_problems": W.verify_receipt(s, stale), "stale_select_refused": _refused(lambda: W.select(s, e, nom["genome_hash"], stale))}
        ok = bool(res["effects"][e]["root_is_parent"] and not res["effects"][e]["lineage_problems_at_select"] and res["restart_pid_differs"] and not info["verify_selected_problems"] and info["pins_intact"]
                  and info["source_matches_steps"] and info["manifest_sha_ok"] and info["control_is_W_strict"] and info["selected"] == nom["genome_hash"] and reuse["pass"]
                  and not any(info[k]["problems"] for k in ("A", "control", "arm3")) and rb["resolves_to_W_strict"] and rb["three_case_outputs_all_wrong_type"] and rb["container_runs_added"] == 0
                  and integ["select_rejected_variant_refused"] and integ["forged_select_refused"] and integ["tampered_problems"] and integ["tampered_select_refused"] and integ["stale_problems"] and integ["stale_select_refused"])
        res["effects"][e].update(restart={k: info[k] for k in ("selected", "verify_selected_problems", "pins_intact", "source_matches_steps", "manifest_sha_ok", "control_is_W_strict")}, reuse=reuse, rollback=rb, integrity=integ, all_ok=ok)
        if info.get("B"):
            lineage.record_result(s, rjson(f"nominee_B-{e}.json")["genome_hash"], "ACCEPTED" if reuse["B_reproduction"]["ok"] else "REJECTED", {"reuse_pass": info["B"]["receipt"]["pass_count"]}, [info["B"]["ref"]])
    res["weight_after_reuse"] = rr.get("weight_after_reuse"); res["docker_runs_total"] = runs()["total"]
    res["all_ok"] = all(v["all_ok"] for v in res["effects"].values())
    wjson("lifecycle_result.json", res); s.close()
    return res


# ---- manifest freeze, evaluator exposure, integration proof ----
PARTS = [f"{p}_{e}.jsonl" for p in ("f_dev", "f_sel", "f_final", "f_reuse") for e in W.EFFECTS]


def log_evaluator_writes():
    """Append the evaluator's 8 partition writes to exposure.jsonl (once, before any harness read entry)."""
    p = OUT / "exposure.jsonl"
    if p.exists() and "m2_evaluator" in p.read_text(encoding="utf-8"): return 0
    for n in PARTS:
        part, e = n[:-6].rsplit("_", 1)
        n_cases = dpath(part, e).read_bytes().count(b"\n")  # bytes only: private partitions are never parsed here
        jlog("exposure.jsonl", {"ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "who": "m2_evaluator", "partition": part, "effect": e, "action": "write", "count": n_cases, "purpose": "evaluator wrote partition (M2-1E)"})
    return len(PARTS)


def freeze_manifest():
    """Write build/m2/evaluation_manifest.json (refuses to overwrite). Hashes raw bytes only; private files are never parsed beyond load_cases' line count."""
    pol, path = W.load_policy(), W.MANIFEST_PATH
    if path.exists(): raise SystemExit(f"{path} exists: the manifest is frozen; refusing to overwrite")
    log_evaluator_writes()
    ev = sorted((ROOT / "evaluator" / "m2").glob("*.py"))
    m = {"schema": pol["manifest_schema"], "frozen": True, "protocol": {"id": pol["protocol"], "path": pol["protocol_path"], "commit": pol["protocol_commit"], "blob_sha256": W.protocol_sha()},
         "policy": {"path": "configs/m2_campaign_policy.json", "blob_sha256": W.policy_sha()}, "inventory": W.inventory(), "prompts": W.prompt_hashes(pol),
         "model": {"id": pol["model"]["id"], "file_sha256": pol["model"]["sha256"]}, "partitions": {n: W._sha(dpath(*n[:-6].rsplit("_", 1)).read_bytes()) for n in PARTS},
         "evaluator": {f.name: W._sha(f.read_bytes()) for f in ev}, "counts": W.space_counts(pol), "frozen_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    path.write_bytes((json.dumps(m, indent=1, sort_keys=True) + chr(10)).encode("utf-8")) if not path.exists() else None
    return {"manifest": str(path), "manifest_sha256": W.manifest_sha(), "problems": M.manifest_problems(pol)}


def prove():
    """Integration proof: expected nominees and fixed arms through the harness projection in the container, byte-for-byte against each case's `expected`.
    Public F-dev and F-sel only; separate scratch store, not counted against the M2-2 container cap."""
    import tempfile
    log_evaluator_writes(); pol = W.load_policy()
    d = Path(tempfile.mkdtemp(prefix="m2proof-")); s = Store(d / "store"); root = W.register_root(s)
    flows = {"R": {"nominee": ["parse_whole", "to_json"], "arm3_identity": pol["arm3"]["R"], "row_quarantine_variant": ["split_rows", "each(parse_whole)", "to_json"], "W_strict": W.W_STRICT},
             "C": {"nominee": ["each(parse_whole)", "aggregate"], "arm3_row_level": pol["arm3"]["C"], "M1_workflow": pol["m1_workflow"], "W_strict": W.W_STRICT}}
    res = {}
    for e, wf in flows.items():
        res[e] = {}
        for part in ("f_dev", "f_sel"):
            cases, _ = load_part(part, e)
            if part == "f_sel": expose("F-sel", e, len(cases), "integration proof: expected nominees and arms, score only")
            else: expose("F-dev", e, len(cases), "integration proof")
            for label, steps in wf.items():
                h = root if steps == W.W_STRICT else W.register(s, root, steps, effect=e, arm="proof", label=label, part=part)
                outs = W.execute_batch(s, h, e, cases)
                bad = [{"case_id": c["case_id"], "actual": trunc(o, 300), "expected": trunc(c["expected"], 300)} for c, o in zip(cases, outs) if o != c["expected"]]
                dm = [o == c["expected"] for c, o in zip(cases, outs)]
                res[e].setdefault(label, {})[part] = {"pass": sum(dm), "n": len(cases), "defective_passed": sum(v for v, c in zip(dm, cases) if is_defective(c)),
                                                      "defective_n": sum(is_defective(c) for c in cases), "mismatches": bad[:3] if label == "nominee" else len(bad)}
    s.close(); shutil.rmtree(d, ignore_errors=True)
    wjson("integration_proof.json", res)
    return res


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("stage", choices=["preflight", "smoke", "campaign", "arm4", "final", "lifecycle", "restart", "weights", "freeze-manifest", "prove"])
    ap.add_argument("--campaign", default="all"); ap.add_argument("--effect", choices=["R", "C"]); ap.add_argument("--stub-url"); ap.add_argument("--infra-retry", action="store_true")
    ap.add_argument("--out"); ap.add_argument("--data"); ap.add_argument("--label", default="manual")
    a = ap.parse_args(argv); configure(a.out, a.data, a.stub_url)
    try:
        if a.stage == "preflight": r = preflight()
        elif a.stage == "smoke": r = smoke(make_model())
        elif a.stage == "campaign": r = run_campaigns(make_model(), a.campaign)
        elif a.stage == "arm4": r = arm4()
        elif a.stage == "freeze-manifest": r = freeze_manifest()
        elif a.stage == "prove": r = prove()
        elif a.stage == "final": r = {e: final_effect(e, a.infra_retry) for e in ([a.effect] if a.effect else W.EFFECTS)}
        elif a.stage == "lifecycle": r = lifecycle()
        elif a.stage == "restart": restart_phase(); return 0
        else: r = {"sha256": make_model().check_weights(a.label)}
    except M.CapReached as x:
        wjson("stopped.json", {"outcome": "INCONCLUSIVE", "reason": str(x), "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}); print("STOP INCONCLUSIVE:", x); return 3
    except M.Invalidated as x:
        wjson("stopped.json", {"outcome": "INVALIDATED", "reason": str(x), "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}); print("STOP INVALIDATED:", x); return 4
    except (M.Refused, Stop) as x:
        print("REFUSED/STOPPED:", x); return 2
    print(json.dumps(r, indent=1, default=str)[:6000]); return 0


if __name__ == "__main__":
    sys.exit(main())
