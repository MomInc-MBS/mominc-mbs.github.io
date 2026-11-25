"""M0 declarative-workflow candidates over the existing lineage/run_isolated/Store paths. No new DB, no new primitives."""
from __future__ import annotations
import hashlib, inspect, json, textwrap
from pathlib import Path
from . import experiment_compare as EC, lineage, m0_oracle as O
from .run_state import RunStates
from .storage import _json

POLICY_PATH = Path(__file__).resolve().parents[2] / "configs" / "m0_campaign_policy.json"
SEL, CAMP, OP = "experiment/m0/selection", "experiment/m0/campaign", {"class": "generated", "kind": "declarative_workflow"}
STATS = {"docker_runs": 0}


class PolicyViolation(ValueError):
    pass


def _sha(s): return hashlib.sha256(s if isinstance(s, bytes) else s.encode()).hexdigest()
def load_policy(): return json.loads(POLICY_PATH.read_text(encoding="utf-8"))
def _pin(path): return _sha(path.read_bytes().replace(b"\r\n", b"\n"))  # EOL-independent: a CRLF checkout pins the same as the LF blob
def policy_sha(): return _pin(POLICY_PATH)
def inventory(): return {n: _sha(inspect.getsource(getattr(EC, n))) for n in ("identity", "scrub_lowercase", "scrub_delete")}


def validate(steps, policy):
    inv = inventory()
    if not isinstance(steps, list) or not policy["min_steps"] <= len(steps) <= policy["max_steps"]:
        raise PolicyViolation(f"steps must be a list of {policy['min_steps']}..{policy['max_steps']}")
    for s in steps:
        if s not in inv or s not in policy["inventory"]:
            raise PolicyViolation(f"unknown primitive {s!r}")


def canonical_digest(steps): return _sha(_json(steps))


def compile_source(steps):
    body = "".join(textwrap.dedent(inspect.getsource(getattr(EC, n))) + "\n\n" for n in dict.fromkeys(steps))
    calls = "".join(f"    text = {n}(text, checks)\n" for n in steps)
    return "import re\n\n" + body + "def apply(text, checks):\n" + calls + "    return text\n"


def register_p0(store):
    return lineage.register(store, compile_source(["identity"]), [], {}, O.oracle_sha(), {"root": "P0"})


def _refuse(store, steps, reason):
    camp = store.get(CAMP)
    ref = store.put_artifact({"kind": "m0_refusal", "steps": steps, "reason": reason})
    camp["refusals"].append(ref); store.set(CAMP, camp)
    return ref


def propose(store, p0, steps):
    """Returns ('registered', genome_hash) or ('refused', artifact_ref). Refusals happen before any execution."""
    pol = load_policy()
    camp = store.get(CAMP) or {"digests": [], "proposals": 0, "refusals": []}
    store.set(CAMP, camp)
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
            "limits": {"timeout_s": EC.TIMEOUT_S, "max_out": EC.MAX_OUT}, "protocol_id": O.PROTOCOL_ID,
            "evaluator_version": O.VERSION, "evaluator_sha256": O.oracle_sha(), "parent": p0}
    return "registered", lineage.register(store, compile_source(steps), [p0], OP, O.oracle_sha(), prov, backend="container")


def execute(store, h, task):
    src = store.read_artifact(lineage.get(store, h)["body_ref"])["text"]
    STATS["docker_runs"] += 1
    return EC.run_isolated(src, O.TASKS[task]["input"], O.CHECKS, backend="container", operator_class="generated")


def receipt(store, h, task, output):
    g = lineage.get(store, h)
    r = {"kind": "m0_receipt", "candidate_hash": h, "parent_hash": (g["parent_hashes"] or [None])[0], "task": task,
         "protocol_sha": O.protocol_sha(), "oracle_sha": O.oracle_sha(), "input_sha": O.sha(O.TASKS[task]["input"]),
         "output_sha": O.sha(output), "verdict": O.judge(task, output)}
    r["receipt_sha"] = _sha(_json(r))
    return r, store.put_artifact(r)


def verify_receipt(store, r):
    """Returns problems; empty = receipt is intact, current and bound to a real genome."""
    bad = []
    try:
        body = {k: v for k, v in r.items() if k != "receipt_sha"}
        if _sha(_json(body)) != r.get("receipt_sha"): bad.append("receipt_sha mismatch (tampered)")
        if r["oracle_sha"] != O.oracle_sha(): bad.append("stale oracle_sha")
        if r["protocol_sha"] != O.protocol_sha(): bad.append("stale protocol_sha")
        t = O.TASKS[r["task"]]
        if r["input_sha"] != O.sha(t["input"]): bad.append("input_sha mismatch")
        if r["verdict"] != ("PASS" if r["output_sha"] == O.sha(t["expected"]) else "FAIL"): bad.append("verdict does not follow output_sha")
        g = lineage.get(store, r["candidate_hash"])
        if (g["parent_hashes"] or [None])[0] != r["parent_hash"]: bad.append("parent_hash mismatch")
    except (KeyError, ValueError, TypeError) as e:
        bad.append(f"malformed/unbound receipt: {type(e).__name__}: {e}")
    return bad


# ---- experimental selection: append-only event chain; kv pointer is the only mutable cell, all under experiment/m0/ ----
def _event(store, typ, target, why):
    prev = store.get(SEL)
    ev = {"kind": "m0_selection_event", "type": typ, "target": target, "why": why, "prev": prev}
    ref = store.put_artifact(ev); store.set(SEL, ref)
    return ref


def select(store, h, receipt_dict):
    probs = verify_receipt(store, receipt_dict)
    if probs or receipt_dict["verdict"] != "PASS" or receipt_dict["candidate_hash"] != h: raise PolicyViolation(f"select refused: {probs or 'verdict/candidate'}")
    rs = RunStates(store)
    if rs.resume(h)["state"] != "ACCEPTED": raise PolicyViolation("select refused: candidate not ACCEPTED")
    # A self-consistent forged receipt (recomputed receipt_sha) passes verify_receipt; binding to the parent-written
    # ACCEPTED evidence_refs (content-addressed artifacts) is what makes the receipt authoritative.
    refs = [e["payload"].get("evidence_refs", []) for e in rs.events(h) if e["to_state"] == "ACCEPTED"][0]
    if not any(store.read_artifact(ref) == receipt_dict for ref in refs):
        raise PolicyViolation("select refused: receipt is not the recorded ACCEPTED evidence")
    return _event(store, "select", h, receipt_dict["receipt_sha"])


def rollback(store, to_hash, why="rollback"):
    if store.get("lineage/genome/" + to_hash) is None: raise PolicyViolation("unknown rollback target")
    return _event(store, "rollback", to_hash, why)


def history(store):
    out, ref = [], store.get(SEL)
    while ref:
        ev = store.read_artifact(ref); out.append(ev); ref = ev["prev"]
    return out[::-1]


def selected(store, p0):
    h = history(store)
    return h[-1]["target"] if h else p0
