"""M1 declarative workflows (protocol §3.2): typed validation, enumeration, container compile, M0-style propose/refuse."""
from __future__ import annotations
import base64, hashlib, inspect, json, re
from itertools import product
from pathlib import Path
from . import experiment_compare as EC, lineage, m1_views as V, structured_verifier as SV
from .run_state import RunStates
from .storage import _json

ROOT = Path(__file__).resolve().parents[2]
POLICY_PATH = ROOT / "configs" / "m1_campaign_policy.json"
PROTOCOL_PATH = ROOT / "docs" / "M1_PROTOCOL.md"
MANIFEST_PATH = ROOT / "build" / "m1" / "evaluation_manifest.json"
SEL = "experiment/m1/selection"
CAMP = "experiment/m1/campaign"
OP = {"class": "generated", "kind": "declarative_workflow"}
W_STRICT = ["parse_whole", "aggregate"]
STATS = {"docker_runs": 0}
_EACH = re.compile(r"each\(([a-z_]+)\)")


class PolicyViolation(ValueError):
    pass


def _sha(s): return hashlib.sha256(s if isinstance(s, bytes) else s.encode()).hexdigest()
def load_policy(): return json.loads(POLICY_PATH.read_text(encoding="utf-8"))
def _pin(path): return _sha(path.read_bytes().replace(b"\r\n", b"\n"))  # EOL-independent: a CRLF checkout pins the same as the LF blob
def policy_sha(): return _pin(POLICY_PATH)
def protocol_sha(): return _pin(PROTOCOL_PATH)
def manifest_sha(): return _sha(MANIFEST_PATH.read_bytes())
def canonical_digest(steps): return _sha(_json(steps))
def inventory(): return V.inventory()


def symbol_type(sym):
    """(in_type, out_type) of a symbol, or raise PolicyViolation (unknown, nested each, each of unknown)."""
    if not isinstance(sym, str):
        raise PolicyViolation(f"step must be a string, got {sym!r}")
    if sym in V.TYPES:
        return V.TYPES[sym]
    m = _EACH.fullmatch(sym)
    if m and m.group(1) in V.TYPES:
        return V.each_type(m.group(1))
    raise PolicyViolation(f"unknown or too deep symbol {sym!r}")


def validate(steps, policy=None):
    policy = policy or load_policy()
    if not isinstance(steps, list) or not policy["min_steps"] <= len(steps) <= policy["max_steps"]:
        raise PolicyViolation(f"steps must be a list of {policy['min_steps']}..{policy['max_steps']}")
    cur = policy["input_type"]
    for s in steps:
        i, o = symbol_type(s)
        if i != cur:
            raise PolicyViolation(f"type error at {s!r}: expected {i}, have {cur}")
        cur = o
    if cur != policy["output_type"]:
        raise PolicyViolation(f"workflow ends in {cur}, must end in {policy['output_type']}")


def symbols():
    return list(V.TYPES) + [f"each({n})" for n in V.TYPES]


def enumerate_legal(policy=None):
    policy = policy or load_policy()
    out = []
    for n in range(policy["min_steps"], policy["max_steps"] + 1):
        for steps in product(symbols(), repeat=n):
            try:
                validate(list(steps), policy)
            except PolicyViolation:
                continue
            out.append(list(steps))
    return sorted(out, key=lambda s: (len(s), s))  # ponytail: brute force over all 584 lists (spec-sized); prune by type if the space grows


def compile_source(steps):
    def body(mod):
        keep = [l for l in inspect.getsource(mod).splitlines()
                if not l.startswith("from __future__") and not l.rstrip().endswith("# inline-strip")]
        return "\n".join(keep) + "\n\n"
    return ("from __future__ import annotations\nimport base64, csv, hashlib, io, json, re\n\n" + body(SV) + body(V)
            + f"STEPS = {steps!r}\n\ndef apply(text, checks):\n    return container_apply(STEPS, text)\n")


def envelope(fmt, data):
    return json.dumps({"format": fmt, "source_b64": base64.b64encode(data).decode("ascii")})


def register_w_strict(store):
    prov = {"root": "P0", "incumbent": "W_strict", "steps": W_STRICT, "digest": canonical_digest(W_STRICT)}
    h = lineage.register(store, compile_source(W_STRICT), [], {}, protocol_sha(), prov)
    # W_strict is the root, so it is NOT re-registered through propose(): its digest is pre-seeded here and it counts as proposal 1.
    store.set(CAMP, {"digests": [canonical_digest(W_STRICT)], "proposals": 1, "refusals": []})
    return h


def _refuse(store, steps, reason):
    camp = store.get(CAMP)
    ref = store.put_artifact({"kind": "m1_refusal", "steps": steps, "reason": reason})
    camp["refusals"].append(ref); store.set(CAMP, camp)
    return ref


def propose(store, parent, steps):
    """Returns ('registered', genome_hash) or ('refused', artifact_ref). Refusals happen before any execution."""
    pol = load_policy()
    camp = store.get(CAMP) or {"digests": [], "proposals": 0, "refusals": []}
    camp["proposals"] += 1; store.set(CAMP, camp)
    try:
        if camp["proposals"] > pol["max_proposals"]: raise PolicyViolation("max_proposals exceeded")
        validate(steps, pol)
        d = canonical_digest(steps)
        if d in camp["digests"]: raise PolicyViolation(f"duplicate digest {d[:12]}")
    except PolicyViolation as e:
        return "refused", _refuse(store, steps, str(e))
    camp["digests"].append(d); store.set(CAMP, camp)
    prov = {"steps": steps, "digest": d, "inventory": inventory(), "policy_sha256": policy_sha(), "backend": "container",
            "limits": {"timeout_s": EC.TIMEOUT_S, "max_out": EC.MAX_OUT}, "protocol": pol["protocol"],
            "protocol_sha256": protocol_sha(), "parent": parent}
    return "registered", lineage.register(store, compile_source(steps), [parent], OP, protocol_sha(), prov, backend="container")


def execute(store, h, fmt, data):
    src = store.read_artifact(lineage.get(store, h)["body_ref"])["text"]
    STATS["docker_runs"] += 1
    return EC.run_isolated(src, envelope(fmt, data), {}, backend="container", operator_class="generated")


def execute_batch(store, h, cases):
    """One container run = this workflow on one partition batch. cases: dicts with format + source (base64). Returns list of outputs."""
    src = store.read_artifact(lineage.get(store, h)["body_ref"])["text"]
    env = json.dumps([{"format": c["format"], "source_b64": c["source"]} for c in cases])
    STATS["docker_runs"] += 1
    out = json.loads(EC.run_isolated(src, env, {}, timeout=load_policy()["max_container_run_seconds"], backend="container", operator_class="generated"))
    if not (isinstance(out, list) and len(out) == len(cases) and all(isinstance(o, str) for o in out)):
        raise PolicyViolation("batch output is not a list of one string per case")
    return out


def load_cases(path):
    raw = Path(path).read_bytes()
    return [json.loads(l) for l in raw.decode("utf-8").splitlines() if l.strip()], _sha(raw)


# ---- receipts: one per (candidate, partition) ----
def receipt(store, h, partition, cases, partition_sha, outputs):
    g = lineage.get(store, h)
    ver = [o == c["expected"] for o, c in zip(outputs, cases)]
    r = {"kind": "m1_receipt", "candidate_hash": h, "parent_hash": (g["parent_hashes"] or [None])[0], "partition": partition,
         "partition_sha": partition_sha, "protocol_sha": protocol_sha(), "policy_sha": policy_sha(), "manifest_sha": manifest_sha(),
         "inventory": inventory(), "case_ids": [c["case_id"] for c in cases], "expected_sha": [_sha(c["expected"]) for c in cases],
         "outputs_sha": _sha(_json(outputs)), "outputs_ref": store.put_artifact({"kind": "m1_outputs", "outputs": outputs}),
         "verdicts": ver, "pass_count": sum(ver), "n": len(ver)}
    r["receipt_sha"] = _sha(_json(r))
    return r, store.put_artifact(r)


def verify_receipt(store, r, cases_path=None):
    """Returns problems; empty = intact, current, bound to a real genome, verdicts follow outputs. cases_path also pins partition bytes."""
    bad = []
    try:
        if _sha(_json({k: v for k, v in r.items() if k != "receipt_sha"})) != r.get("receipt_sha"): bad.append("receipt_sha mismatch (tampered)")
        for k, cur in (("protocol_sha", protocol_sha()), ("policy_sha", policy_sha()), ("manifest_sha", manifest_sha()), ("inventory", inventory())):
            if r[k] != cur: bad.append(f"stale {k}")
        g = lineage.get(store, r["candidate_hash"])
        if (g["parent_hashes"] or [None])[0] != r["parent_hash"]: bad.append("parent_hash mismatch")
        outs = store.read_artifact(r["outputs_ref"])["outputs"]
        if _sha(_json(outs)) != r["outputs_sha"]: bad.append("outputs_sha mismatch")
        n = len(r["case_ids"])
        if not (len(outs) == len(r["expected_sha"]) == len(r["verdicts"]) == n == r["n"]): bad.append("length mismatch")
        elif r["verdicts"] != [_sha(o) == e for o, e in zip(outs, r["expected_sha"])]: bad.append("verdicts do not follow outputs")
        if r["pass_count"] != sum(r["verdicts"]): bad.append("pass_count mismatch")
        if cases_path is not None:
            cases, psha = load_cases(cases_path)
            if r["partition_sha"] != psha: bad.append("partition_sha mismatch")
            if r["case_ids"] != [c["case_id"] for c in cases] or r["expected_sha"] != [_sha(c["expected"]) for c in cases]: bad.append("cases/expected mismatch")
    except (KeyError, ValueError, TypeError) as e:
        bad.append(f"malformed/unbound receipt: {type(e).__name__}: {e}")
    return bad


# ---- experimental selection: append-only chain, kv pointer under experiment/m1/ only ----
def _event(store, typ, target, why):
    prev = store.get(SEL)
    ref = store.put_artifact({"kind": "m1_selection_event", "type": typ, "target": target, "why": why, "prev": prev}); store.set(SEL, ref)
    return ref


def select(store, h, r, cases_path=None):
    probs = verify_receipt(store, r, cases_path)
    if probs or r["candidate_hash"] != h: raise PolicyViolation(f"select refused: {probs or 'candidate mismatch'}")
    rs = RunStates(store)
    if rs.resume(h)["state"] != "ACCEPTED": raise PolicyViolation("select refused: candidate not ACCEPTED")
    # a self-consistent forged receipt passes verify_receipt; only the parent-written ACCEPTED evidence_refs make a receipt authoritative
    refs = [e["payload"].get("evidence_refs", []) for e in rs.events(h) if e["to_state"] == "ACCEPTED"][0]
    if not any(store.read_artifact(ref) == r for ref in refs): raise PolicyViolation("select refused: receipt is not the recorded ACCEPTED evidence")
    return _event(store, "select", h, r["receipt_sha"])


def rollback(store, to_hash, why="rollback"):
    if store.get("lineage/genome/" + to_hash) is None: raise PolicyViolation("unknown rollback target")
    return _event(store, "rollback", to_hash, why)


def history(store):
    out, ref = [], store.get(SEL)
    while ref:
        ev = store.read_artifact(ref); out.append(ev); ref = ev["prev"]
    return out[::-1]


def selected(store, root):
    h = history(store)
    return h[-1]["target"] if h else root


def verify_selected(store, root):
    """Problems with the current selection: lineage, and (for a select event) the recorded ACCEPTED evidence + receipt integrity."""
    sel, probs = selected(store, root), []
    probs += lineage.verify_lineage(store, sel)
    h = history(store)
    if h and h[-1]["type"] == "select":
        refs = [e["payload"].get("evidence_refs", []) for e in RunStates(store).events(sel) if e["to_state"] == "ACCEPTED"]
        recs = [store.read_artifact(x) for x in (refs[0] if refs else [])]
        ok = [r for r in recs if r.get("receipt_sha") == h[-1]["why"]]
        if not ok: probs.append("selection evidence not in ACCEPTED evidence_refs")
        else: probs += verify_receipt(store, ok[0])
    return probs
