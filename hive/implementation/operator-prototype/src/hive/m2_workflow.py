"""M2 workflows (protocol §2, §3, §8, §9): two effects (R row-convert, C batch-merge) over the M2 inventory.
Reuses M1's helpers (hashing, pins, case loading); adds the C envelope decode, the R/C output projections,
the static wrong-type rule, per-effect selection chains and receipts."""
from __future__ import annotations
import base64, hashlib, inspect, json
from pathlib import Path
from . import lineage, m1_views as V1, m1_workflow as W1, m2_views as V, structured_verifier as SV
from .run_state import RunStates
from .storage import _json

ROOT = Path(__file__).resolve().parents[2]
POLICY_PATH = ROOT / "configs" / "m2_campaign_policy.json"
PROTOCOL_PATH = ROOT / "docs" / "M2_PROTOCOL.md"
MANIFEST_PATH = ROOT / "build" / "m2" / "evaluation_manifest.json"
M1_MANIFEST_PATH = ROOT / "build" / "m1" / "evaluation_manifest.json"
PROMPT_DIR = ROOT / "configs" / "m2_prompts"
OP = {"class": "generated", "kind": "declarative_workflow"}
W_STRICT = ["parse_whole", "aggregate"]
WRONG_TYPE = '{"error":"wrong_type"}'
EFFECTS = ("R", "C")
EXPECTED_COUNTS = {"symbols": 10, "lists": 1110, "legal": {"R": 7, "C": 3}}
STATS = {"docker_runs": 0}
PolicyViolation = W1.PolicyViolation
_sha, _pin, load_cases, canonical_digest = W1._sha, W1._pin, W1.load_cases, W1.canonical_digest


def load_policy(): return json.loads(POLICY_PATH.read_text(encoding="utf-8"))
def policy_sha(): return _pin(POLICY_PATH)
def protocol_sha(): return _pin(PROTOCOL_PATH)
def manifest_sha(): return _sha(MANIFEST_PATH.read_bytes())
def inventory(): return V.inventory()
def etypes(effect, pol=None): e = (pol or load_policy())["effects"][effect]; return e["in"], e["out"]
def prompt_hashes(pol=None): return {n: _pin(PROMPT_DIR / n) for n in (pol or load_policy())["prompt_files"]}


def verify_m1_pins():
    """Problems comparing the live M1 inventory pins with M1's frozen evaluation manifest (drift blocks the freeze)."""
    want = json.loads(M1_MANIFEST_PATH.read_text(encoding="utf-8"))["inventory"]
    have = V1.inventory()
    return [f"M1 pin drift: {k}" for k in sorted(set(want) | set(have)) if want.get(k) != have.get(k)]


def space_counts(pol=None):
    pol = pol or load_policy()
    return {"symbols": len(V.symbols()), "lists": len(V.all_lists()),
            "legal": {e: len(V.enumerate_legal(*etypes(e, pol))) for e in EFFECTS}}


def scan_prompts(pol=None):
    """Forbidden-token hits in the committed prompt files (protocol §4: any hit blocks the freeze)."""
    pol, hits = pol or load_policy(), []
    for n in pol["prompt_files"]:
        t = (PROMPT_DIR / n).read_text(encoding="utf-8")
        for tok in pol["prompt_forbidden"]:
            if (tok in t) if tok == "M1" else (tok.lower() in t.lower()):
                hits.append(f"{n}: {tok}")
    return hits


def validate(steps, effect, pol=None):
    why = V.type_check(steps, *etypes(effect, pol))
    if why:
        raise PolicyViolation(why)


def static_types(steps):
    """(in_type, out_type) of a stored workflow, checking only adjacency."""
    first = cur = None
    for s in steps:
        t = V.symbol_type(s)
        if t is None or (cur is not None and t[0] != cur):
            raise PolicyViolation(f"ill-typed workflow at {s!r}")
        first = t[0] if cur is None else first
        cur = t[1]
    return first, cur


def is_wrong_type(steps, effect, pol=None): return static_types(steps) != etypes(effect, pol)


# ---- container side: R/C projections (declared preparation, identical for every workflow) ----
def project_R(steps, src):
    try:
        value, errors = run_workflow(steps, src)
        out = {"converted": value["bytes"].decode("utf-8"), "quarantined": [{"index": i, "reason": r} for i, r in sorted(errors, key=lambda e: e[0])]}
    except Exception:
        out = {"error": "source_rejected"}
    return json.dumps(out, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def project_C(steps, files):
    srcs = [make_source(f["format"], f["text"].encode("utf-8")) for f in files]
    try:
        report, errors = run_workflow(steps, srcs)
        out = dict(report)
        out["quarantined"] = [{"index": i, "reason": r} for i, r in sorted(errors, key=lambda e: e[0])]
    except Exception:
        out = {"error": "source_rejected"}
    return json.dumps(out, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def container_apply(steps, text):
    env = json.loads(text)
    one = lambda e: project_C(steps, e["files"]) if "files" in e else project_R(steps, make_source(e["format"], base64.b64decode(e["source_b64"])))
    return json.dumps([one(e) for e in env]) if isinstance(env, list) else one(env)


run_workflow, make_source = V.run_workflow, V.make_source


def compile_source(steps):
    def body(mod):
        keep = [l for l in inspect.getsource(mod).splitlines() if not l.startswith("from __future__") and not l.rstrip().endswith("# inline-strip")]
        return "\n".join(keep) + "\n\n"
    tail = "".join(inspect.getsource(f) + "\n\n" for f in (project_R, project_C, container_apply))
    return ("from __future__ import annotations\nimport base64, csv, hashlib, io, json, re\n\n" + body(SV) + body(V1) + body(V) + tail
            + f"STEPS = {steps!r}\n\ndef apply(text, checks):\n    return container_apply(STEPS, text)\n")


def case_env(effect, c):
    """Container envelope for a case. R: {format, source_b64}. C: `source` is base64 of the JSON envelope {"files":[{format,text}...]}, decoded here (never byte-matched)."""
    if effect == "R":
        return {"format": c["format"], "source_b64": c["source"]}
    return {"files": json.loads(base64.b64decode(c["source"]).decode("utf-8"))["files"]}


# ---- store: root, registration, execution ----
def register_root(store):
    prov = {"root": "P0", "incumbent": "W_strict", "steps": W_STRICT, "digest": canonical_digest(W_STRICT)}
    h = lineage.register(store, compile_source(W_STRICT), [], {}, protocol_sha(), prov)
    store.set("experiment/m2/root", h)
    return h


def register(store, parent, steps, **tag):
    """Register a child genome (container backend). tag (effect, campaign, arm...) is part of provenance, so each campaign gets its own genome."""
    pol = load_policy()
    prov = {"steps": steps, "digest": canonical_digest(steps), "inventory": inventory(), "policy_sha256": policy_sha(), "backend": "container",
            "protocol": pol["protocol"], "protocol_sha256": protocol_sha(), "prompt_sha256": prompt_hashes(pol), "parent": parent, **tag}
    return lineage.register(store, compile_source(steps), [parent], OP, protocol_sha(), prov, backend="container")


def steps_of(store, h): return lineage.get(store, h)["provenance"]["steps"]
def needs_container(store, h, effect): return not is_wrong_type(steps_of(store, h), effect)


def execute_batch(store, h, effect, cases):
    """Outputs for cases. Wrong-type workflows are never executed: every case yields {"error":"wrong_type"} with 0 container runs."""
    if not needs_container(store, h, effect):
        return [WRONG_TYPE] * len(cases)
    from . import experiment_compare as EC
    src = store.read_artifact(lineage.get(store, h)["body_ref"])["text"]
    STATS["docker_runs"] += 1
    out = json.loads(EC.run_isolated(src, json.dumps([case_env(effect, c) for c in cases]), {}, timeout=load_policy()["max_container_run_seconds"],
                                     backend="container", operator_class="generated"))
    if not (isinstance(out, list) and len(out) == len(cases) and all(isinstance(o, str) for o in out)):
        raise PolicyViolation("batch output is not a list of one string per case")
    return out


# ---- receipts ----
def receipt(store, h, effect, partition, cases, partition_sha, outputs):
    g = lineage.get(store, h)
    ver = [o == c["expected"] for o, c in zip(outputs, cases)]
    r = {"kind": "m2_receipt", "effect": effect, "candidate_hash": h, "parent_hash": (g["parent_hashes"] or [None])[0], "partition": partition,
         "partition_sha": partition_sha, "protocol_sha": protocol_sha(), "policy_sha": policy_sha(), "manifest_sha": manifest_sha(),
         "inventory": inventory(), "prompt_sha": prompt_hashes(), "case_ids": [c["case_id"] for c in cases], "expected_sha": [_sha(c["expected"]) for c in cases],
         "outputs_sha": _sha(_json(outputs)), "outputs_ref": store.put_artifact({"kind": "m2_outputs", "outputs": outputs}),
         "verdicts": ver, "pass_count": sum(ver), "n": len(ver)}
    r["receipt_sha"] = _sha(_json(r))
    return r, store.put_artifact(r)


def verify_receipt(store, r, cases_path=None):
    """Problems; empty = intact, current, bound to a real genome, verdicts follow outputs."""
    bad = []
    try:
        if _sha(_json({k: v for k, v in r.items() if k != "receipt_sha"})) != r.get("receipt_sha"):
            bad.append("receipt_sha mismatch (tampered)")
        for k, cur in (("protocol_sha", protocol_sha()), ("policy_sha", policy_sha()), ("manifest_sha", manifest_sha()), ("inventory", inventory()), ("prompt_sha", prompt_hashes())):
            if r[k] != cur:
                bad.append(f"stale {k}")
        g = lineage.get(store, r["candidate_hash"])
        if (g["parent_hashes"] or [None])[0] != r["parent_hash"]:
            bad.append("parent_hash mismatch")
        outs = store.read_artifact(r["outputs_ref"])["outputs"]
        if _sha(_json(outs)) != r["outputs_sha"]:
            bad.append("outputs_sha mismatch")
        n = len(r["case_ids"])
        if not (len(outs) == len(r["expected_sha"]) == len(r["verdicts"]) == n == r["n"]):
            bad.append("length mismatch")
        elif r["verdicts"] != [_sha(o) == e for o, e in zip(outs, r["expected_sha"])]:
            bad.append("verdicts do not follow outputs")
        if r["pass_count"] != sum(r["verdicts"]):
            bad.append("pass_count mismatch")
        if cases_path is not None:
            cases, psha = load_cases(cases_path)
            if r["partition_sha"] != psha:
                bad.append("partition_sha mismatch")
            if r["case_ids"] != [c["case_id"] for c in cases] or r["expected_sha"] != [_sha(c["expected"]) for c in cases]:
                bad.append("cases/expected mismatch")
    except (KeyError, ValueError, TypeError, OSError) as e:
        bad.append(f"malformed/unbound receipt: {type(e).__name__}: {e}")
    return bad


# ---- per-effect experimental selection: append-only chain under experiment/m2/selection/<effect> ----
def _key(effect): return "experiment/m2/selection/" + effect


def _event(store, effect, typ, target, why):
    prev = store.get(_key(effect))
    ref = store.put_artifact({"kind": "m2_selection_event", "effect": effect, "type": typ, "target": target, "why": why, "prev": prev})
    store.set(_key(effect), ref)
    return ref


def _accepted_refs(store, h):
    return [e["payload"].get("evidence_refs", []) for e in RunStates(store).events(h) if e["to_state"] == "ACCEPTED"]


def select(store, effect, h, r, cases_path=None):
    probs = verify_receipt(store, r, cases_path)
    if probs or r["candidate_hash"] != h or r.get("effect") != effect:
        raise PolicyViolation(f"select refused: {probs or 'candidate/effect mismatch'}")
    if RunStates(store).resume(h)["state"] != "ACCEPTED":
        raise PolicyViolation("select refused: candidate not ACCEPTED")
    refs = _accepted_refs(store, h)[0]  # only the parent-written ACCEPTED evidence_refs make a receipt authoritative
    if not any(store.read_artifact(ref) == r for ref in refs):
        raise PolicyViolation("select refused: receipt is not the recorded ACCEPTED evidence")
    return _event(store, effect, "select", h, r["receipt_sha"])


def rollback(store, effect, to_hash, why="rollback"):
    if store.get("lineage/genome/" + to_hash) is None:
        raise PolicyViolation("unknown rollback target")
    return _event(store, effect, "rollback", to_hash, why)


def history(store, effect):
    out, ref = [], store.get(_key(effect))
    while ref:
        ev = store.read_artifact(ref); out.append(ev); ref = ev["prev"]
    return out[::-1]


def selected(store, effect, retained=True):
    """Resolve the selection from stored state. retained=False is the retained-skill-disabled control: the incumbent root, still resolved via the store."""
    root, h = store.get("experiment/m2/root"), history(store, effect)
    return h[-1]["target"] if (h and retained) else root


def verify_selected(store, effect):
    sel, probs = selected(store, effect), []
    probs += lineage.verify_lineage(store, sel)
    h = history(store, effect)
    if h and h[-1]["type"] == "select":
        refs = _accepted_refs(store, sel)
        recs = [store.read_artifact(x) for x in (refs[0] if refs else [])]
        ok = [r for r in recs if r.get("receipt_sha") == h[-1]["why"]]
        probs += verify_receipt(store, ok[0]) if ok else ["selection evidence not in ACCEPTED evidence_refs"]
    return probs
