"""Operator Prototype: run M2's retained, verified capabilities on owner inputs through one normal task path.

intake (allowed root, immutable input copies) -> registry resolve + evidence check -> container execution of the
retained genome -> independent oracle in a separate process -> exported outputs + report.  Zero model calls.
The registry is an append-only chain per operation in the operator store; imports come from a capability bundle
exported from the M2 evidence store and pinned in configs/operator_policy.json (trust anchor = the M2 report pins).
Scope stays trusted_local_experiment; nothing here is production-approved."""
from __future__ import annotations

import base64, csv, hashlib, io, json, os, shutil, subprocess, sys, tempfile, time
from datetime import datetime, timezone
from pathlib import Path

from . import m2_workflow as W
from .storage import Store, _json

ROOT = Path(__file__).resolve().parents[2]
POLICY_PATH = ROOT / "configs" / "operator_policy.json"
BUNDLE_PATH = ROOT / "build" / "operator" / "capabilities_m2.json"
BUNDLE_SCHEMA = "hive-operator-capability-bundle-v1"
SCOPE = "trusted_local_experiment"
MAX_FILE = 2 * 1024 * 1024
TERMINAL = {"VERIFIED", "REJECTED"}  # only these replay; failures/pending re-run on resubmission


class Refused(ValueError):
    """A controlled, operator-readable refusal (unsupported input, no eligible capability, stale evidence...)."""


def _sha(b): return hashlib.sha256(b if isinstance(b, bytes) else b.encode()).hexdigest()
def _now(): return datetime.now(timezone.utc).isoformat(timespec="seconds")
def load_policy(): return json.loads(POLICY_PATH.read_text(encoding="utf-8"))
def evaluator_path(pol=None): return ROOT / (pol or load_policy())["evaluator"]["path"]
def evaluator_pin(pol=None): return W._pin(evaluator_path(pol))


# ---------------------------------------------------------------- contract (derived from structured_verifier + oracle)
CONTRACT = {
    "convert": [
        "One .csv or .json file, UTF-8 without a byte-order mark, at most 2 MiB.",
        "CSV: header exactly id,group,bytes; every row has 3 fields.",
        "JSON: an array of objects with exactly the keys id, group, bytes.",
        "1 to 256 rows; id unique non-empty text (max 128 chars); group non-empty text (max 128).",
        "bytes: integer 0..1,000,000,000 (CSV: canonical decimal, no sign, no leading zeros).",
        "Any bad row rejects the whole file (no row salvage). Output: canonical JSON rows sorted by key.",
    ],
    "merge": [
        "2 to 20 .csv/.json files, same per-file rules as Convert, at most 2 MiB in total.",
        "Each invalid file is quarantined whole with the reason of its first failing row; valid files are merged.",
        "Output: per-group count and bytes over accepted files, plus the quarantine list.",
    ],
}


def contract(): return {op: {"label": load_policy()["operations"][op]["label"], "rules": rules} for op, rules in CONTRACT.items()}


def _fmt(name):
    ext = Path(name).suffix.lower()
    if ext not in (".csv", ".json"):
        raise Refused(f"{name}: unsupported file type {ext or '(none)'}; use .csv or .json")
    return ext[1:]


def intake_check(op, files):
    """files: [(name, bytes)]. Raises Refused for inputs outside the operation's declared envelope (not row content:
    row validity is the capability's job and is reported as a verified rejection/quarantine)."""
    pol = load_policy()
    if op not in pol["operations"]:
        raise Refused(f"unsupported operation {op!r}")
    lo, hi = (1, 1) if op == "convert" else pol["batch_files"]
    if not lo <= len(files) <= hi:
        raise Refused(f"{op} needs {lo if lo == hi else f'{lo} to {hi}'} file(s), got {len(files)}")
    if sum(len(d) for _, d in files) > pol["max_total_bytes"]:
        raise Refused("inputs exceed 2 MiB in total")
    for name, data in files:
        _fmt(name)
        if len(data) > MAX_FILE:
            raise Refused(f"{name}: exceeds the 2 MiB limit")
        if data.startswith(b"\xef\xbb\xbf"):
            raise Refused(f"{name}: UTF-8 byte-order mark is not supported; save as UTF-8 without BOM")
        try:
            data.decode("utf-8")
        except UnicodeDecodeError:
            raise Refused(f"{name}: not valid UTF-8") from None


def explain_rejection(name, data):
    """Diagnostic only (the host contract parser); never used as the verifier."""
    from .structured_verifier import INVENTORY_SCHEMA, StructuredMissionError, parse_source
    try:
        parse_source(data, _fmt(name), INVENTORY_SCHEMA)
    except (StructuredMissionError, Refused) as e:
        return str(e)
    return None


# ---------------------------------------------------------------- capability bundle (export from evidence, import into operator store)
def _closure(store, h):
    out, todo = [], [h]
    while todo:
        c = todo.pop()
        if c not in out:
            out.append(c)
            todo += W.lineage.get(store, c)["parent_hashes"]
    return out


def export_bundle(evidence_dir=None, out=BUNDLE_PATH):
    """Read a COPY of the M2 evidence store; for each pinned accepted capability prove ACCEPTED state, recorded
    evidence, intact receipt and lineage; write a self-contained bundle (content-addressed artifacts)."""
    pol = load_policy()
    evidence_dir = Path(evidence_dir or ROOT / pol["evidence"]["evidence_store"])
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        shutil.copytree(evidence_dir, Path(tmp) / "s")
        s = Store(Path(tmp) / "s")
        try:
            arts, caps = {}, {}
            for op, spec in sorted(pol["operations"].items()):
                h, rsha = spec["accepted"]["genome"], spec["accepted"]["receipt_sha"]
                if W.RunStates(s).resume(h)["state"] != "ACCEPTED":
                    raise Refused(f"{op}: genome is not ACCEPTED in the evidence store")
                refs = W._accepted_refs(s, h)[0]
                rec = [(x, s.read_artifact(x)) for x in refs]
                hit = [(x, r) for x, r in rec if isinstance(r, dict) and r.get("receipt_sha") == rsha]
                if not hit:
                    raise Refused(f"{op}: pinned receipt is not the recorded ACCEPTED evidence")
                rref, r = hit[0]
                probs = W.verify_receipt(s, r) + W.lineage.verify_lineage(s, h)
                if probs:
                    raise Refused(f"{op}: evidence does not verify: {probs}")
                for g in _closure(s, h):
                    gref = s.get("lineage/genome/" + g)
                    grec = s.read_artifact(gref)
                    arts[gref] = grec
                    arts[grec["body_ref"]] = s.read_artifact(grec["body_ref"])
                arts[rref], arts[r["outputs_ref"]] = r, s.read_artifact(r["outputs_ref"])
                caps[op] = {"effect": spec["effect"], "capability": spec["capability"], "genome": h, "steps": W.steps_of(s, h),
                            "receipt_ref": rref, "receipt_sha": rsha, "pass_count": r["pass_count"], "n": r["n"], "partition": r["partition"]}
        finally:
            s.close()
    bundle = {"schema": BUNDLE_SCHEMA, "evidence": pol["evidence"], "baseline_genome": pol["baseline_genome"],
              "capabilities": caps, "artifacts": arts}
    out = Path(out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(bundle, sort_keys=True, indent=1) + "\n", encoding="utf-8", newline="\n")
    return {"path": str(out), "sha256": _sha(out.read_bytes()), "capabilities": {k: v["genome"] for k, v in caps.items()}}


def _reg(op): return "operator/registry/" + op


class _txn:
    """BEGIN IMMEDIATE around a read-modify-write so concurrent processes (CLI + console) cannot orphan chain events."""
    def __init__(self, store): self.db = store.db
    def __enter__(self): self.db.execute("BEGIN IMMEDIATE")
    def __exit__(self, et, *_): self.db.execute("ROLLBACK" if et else "COMMIT")


def _event(store, op, typ, target, **extra):
    with _txn(store):
        prev = store.get(_reg(op))
        ref = store.put_artifact({"kind": "operator_registry_event", "op": op, "type": typ, "target": target, "at": _now(), "prev": prev, **extra})
        store.set(_reg(op), ref)
    return ref


def history(store, op):
    out, ref = [], store.get(_reg(op))
    while ref:
        ev = store.read_artifact(ref)
        out.append(dict(ev, ref=ref))
        ref = ev["prev"]
    return out[::-1]


def import_bundle(store, path=BUNDLE_PATH):
    """Idempotent. Every artifact must re-hash to its own reference; capabilities must match the policy pins."""
    pol, raw = load_policy(), Path(path).read_bytes()
    b = json.loads(raw)
    if b.get("schema") != BUNDLE_SCHEMA:
        raise Refused("not a HIVE operator capability bundle")
    for op, cap in b["capabilities"].items():  # validate everything before writing anything
        spec = pol["operations"].get(op)
        if not spec or spec["accepted"] != {"genome": cap["genome"], "receipt_sha": cap["receipt_sha"]}:
            raise Refused(f"{op}: bundle capability does not match the accepted pins in operator_policy.json")
    for ref, val in b["artifacts"].items():
        if "artifacts/" + _sha(_json(val).encode("utf-8")) + ".json" != ref:
            raise Refused(f"bundle artifact {ref} does not match its content hash")
    for val in b["artifacts"].values():
        store.put_artifact(val)
    for ref, val in b["artifacts"].items():
        if isinstance(val, dict) and val.get("kind") == "genome":
            store.set("lineage/genome/" + ref[len("artifacts/"):-len(".json")], ref)
    done = {}
    for op, cap in sorted(b["capabilities"].items()):
        if any(e["type"] == "import" and e["target"] == cap["genome"] and e.get("receipt_sha") == cap["receipt_sha"] for e in history(store, op)):
            done[op] = "already imported"
            continue
        _event(store, op, "import", cap["genome"], capability=cap["capability"], effect=cap["effect"], receipt_ref=cap["receipt_ref"],
               receipt_sha=cap["receipt_sha"], scope=SCOPE, production_approved=False, bundle_sha256=_sha(raw),
               accepted={"pass_count": cap["pass_count"], "n": cap["n"], "partition": cap["partition"], **pol["evidence"]})
        done[op] = "imported"
    return done


# ---------------------------------------------------------------- resolve (normal registry selection + evidence policy)
def _verify_genome(store, h):
    for c in [h] + W.lineage.ancestors_of(store, h):
        rec = W.lineage.get(store, c)
        if W.lineage._hash(rec) != c:
            raise Refused(f"genome {c[:12]} does not recompute from its fields (tampered)")
        store.read_artifact(rec["body_ref"])  # re-hashes the body file


def resolve(store, op):
    """The eligible retained capability for op, or Refused. Re-verifies evidence every time (stale/tampered/revoked/
    rejected/incompatible entries are refused under the current pins)."""
    pol = load_policy()
    spec = pol["operations"].get(op)
    if spec is None:
        raise Refused(f"unsupported operation {op!r}")
    hist = history(store, op)
    if not hist:
        raise Refused("no retained capability imported for this operation (run: hive operator import)")
    revoked = {e["target"] for e in hist if e["type"] == "revoke"}
    cur = [e for e in hist if e["type"] in ("import", "select", "rollback")][-1]
    h = cur["target"]
    if h in revoked:
        raise Refused(f"selected version {h[:12]} is revoked")
    try:
        _verify_genome(store, h)
        steps = W.steps_of(store, h)
    except (KeyError, ValueError) as e:
        raise Refused(f"selected version {h[:12]} is missing or damaged: {e}") from None
    imports = [e for e in hist if e["type"] == "import" and e["target"] == h]
    entry = next((e for e in reversed(imports) if e.get("receipt_sha") == spec["accepted"]["receipt_sha"]), imports[-1] if imports else None)
    if entry is None:
        raise Refused(f"selected version {h[:12]} ({'+'.join(steps)}) has no accepted evidence for {op}; "
                      f"it cannot perform this operation (selected by {cur['type']})")
    if entry.get("scope") not in pol["allowed_scopes"]:
        raise Refused(f"capability scope {entry.get('scope')!r} is not allowed by the current policy")
    if spec["accepted"] != {"genome": h, "receipt_sha": entry["receipt_sha"]}:
        raise Refused("capability is not the version accepted by the current policy pins")
    try:
        r = store.read_artifact(entry["receipt_ref"])
    except (OSError, ValueError) as e:
        raise Refused(f"evidence check failed: receipt unreadable or tampered ({e})") from None
    probs = W.verify_receipt(store, r)
    if r.get("receipt_sha") != entry["receipt_sha"] or r.get("candidate_hash") != h or r.get("effect") != spec["effect"]:
        probs.append("receipt does not belong to this capability")
    if probs:
        raise Refused(f"evidence check failed: {'; '.join(probs)}")
    if W.is_wrong_type(steps, spec["effect"]):
        raise Refused("selected version is incompatible with this operation's types")
    return {"op": op, "effect": spec["effect"], "capability": spec["capability"], "genome": h, "steps": steps,
            "receipt_sha": entry["receipt_sha"], "accepted": entry["accepted"], "scope": entry["scope"],
            "production_approved": False, "selected_by": cur["type"], "registry_event": cur["ref"]}


def rollback(store, op, why="operator rollback"):
    """Select the permitted previous version (the one selected before the current one; else the M2 baseline)."""
    hist = history(store, op)
    sel = [e for e in hist if e["type"] in ("import", "select", "rollback")]
    if not sel:
        raise Refused("nothing to roll back")
    # Distinct forward versions in order (import/select), and how many rollbacks follow the last forward event.
    # Each rollback steps one further back; past the first version it lands on the M2 baseline (never forward).
    forward = []
    for e in sel:
        if e["type"] != "rollback" and (not forward or forward[-1] != e["target"]):
            forward.append(e["target"])
    trailing = next((i for i, e in enumerate(reversed(sel)) if e["type"] != "rollback"), len(sel))
    back = trailing + 1
    prev = forward[-1 - back] if back < len(forward) else load_policy()["baseline_genome"]
    if store.get("lineage/genome/" + prev) is None:
        raise Refused("rollback target is not in the store")
    return _event(store, op, "rollback", prev, why=why)


def reselect(store, op):
    """Re-select the accepted imported version (after a rollback). resolve() re-verifies it on use."""
    imp = [e for e in history(store, op) if e["type"] == "import"]
    if not imp:
        raise Refused("no imported version to select")
    return _event(store, op, "select", imp[-1]["target"], why="operator re-select of the accepted version")


def revoke(store, op, why="operator revoke"):
    return _event(store, op, "revoke", resolve_target(store, op), why=why)


def resolve_target(store, op):
    sel = [e for e in history(store, op) if e["type"] in ("import", "select", "rollback")]
    if not sel:
        raise Refused("nothing selected")
    return sel[-1]["target"]


# ---------------------------------------------------------------- independent verification (separate process, oracle only)
_VERIFY = r"""
import importlib.util, json, sys
spec = importlib.util.spec_from_file_location("hive_operator_oracle", sys.argv[1]); o = importlib.util.module_from_spec(spec); spec.loader.exec_module(o)
job = json.load(open(sys.argv[2], encoding="utf-8"))
try:
    if job["op"] == "convert":
        f = job["files"][0]; exp = o.r_from_bytes(f["format"], f["text"].encode("utf-8"))
    else:
        exp = o.c_from_envelope(json.dumps({"files": job["files"]}).encode("utf-8"))
    res = {"verdict": "PASS" if exp == job["output"] else "FAIL", "expected_sha256": __import__("hashlib").sha256(exp.encode()).hexdigest()}
except Exception as e:
    res = {"verdict": "UNVERIFIABLE", "reason": type(e).__name__ + ": " + str(e)[:200]}
print(json.dumps(res))
"""


def independent_verify(op, files, output, pol=None):
    pol = pol or load_policy()
    path = evaluator_path(pol)
    ident = {"evaluator": pol["evaluator"]["path"], "pin": evaluator_pin(pol), "process": "separate python -I"}
    if ident["pin"] != pol["evaluator"]["pin"]:
        return dict(ident, verdict="UNVERIFIABLE", reason="evaluator file differs from its policy pin")
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        job = Path(tmp) / "job.json"
        job.write_text(json.dumps({"op": op, "files": files, "output": output}), encoding="utf-8")
        try:
            p = subprocess.run([sys.executable, "-I", "-c", _VERIFY, str(path), str(job)], capture_output=True, text=True, timeout=60, cwd=tmp)
        except (subprocess.TimeoutExpired, OSError) as e:
            return dict(ident, verdict="UNVERIFIABLE", reason=f"evaluator process did not complete: {type(e).__name__}")
    try:
        return dict(ident, **json.loads(p.stdout.strip().splitlines()[-1]))
    except (ValueError, IndexError):
        return dict(ident, verdict="UNVERIFIABLE", reason=f"evaluator process failed (exit {p.returncode})")


# ---------------------------------------------------------------- tasks
def _counters(store): return store.get("operator/counters", {"executions": 0, "container_runs": 0, "model_calls": 0, "proposal_calls": 0, "replays": 0, "refusals": 0})


def _bump(store, **kw):
    with _txn(store):
        c = _counters(store)
        for k, v in kw.items():
            c[k] = c.get(k, 0) + v
        store.set("operator/counters", c)


def _log(store, entry):
    with _txn(store):
        log = store.get("operator/log", [])
        log.append(dict(entry, at=_now()))
        store.set("operator/log", log[-500:])


def note_refusal(store_root, op, reason):
    """Count and log an intake refusal raised before run_task (console/CLI pre-checks)."""
    s = Store(store_root)
    try:
        _bump(s, refusals=1)
        _log(s, {"task_id": None, "op": str(op)[:40], "mode": "refused", "state": "UNSUPPORTED", "reason": str(reason)[:300]})
    finally:
        s.close()


def _replayable(store, op, saved):
    """Replay only while the saved result's capability is still the eligible one and the evaluator pin is unchanged
    (a revoke, rollback, re-pin or evaluator change forces a fresh run through resolve())."""
    try:
        cap = resolve(store, op)
    except Refused:
        return False
    return cap["genome"] == saved.get("capability", {}).get("genome") and saved.get("verification", {}).get("pin") == evaluator_pin()


def task_id(op, files):
    """Identity = operation + ordered (file name, sha256). Batch order is part of the task (it fixes quarantine indexes)."""
    return "t-" + _sha(_json({"op": op, "inputs": [{"name": Path(n).name, "sha256": _sha(d)} for n, d in files]}))[:20]


def _stage(store, key, rec, stage, **detail):
    rec["stages"].append({"stage": stage, "at": _now(), **detail})
    store.set(key, rec)


def _write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_bytes(data)
    os.replace(tmp, path)


def run_task(store_root, op, files, *, stop_path=None):
    """files: [(display name, bytes)]. Returns the task record. Same op+inputs => saved-result replay (no execution)."""
    store_root = Path(store_root)
    stop_path = Path(stop_path or store_root / "STOP")
    pol = load_policy()
    s = Store(store_root)
    try:
        if op not in pol["operations"]:
            s.set("operator/opportunity/" + _sha(op)[:16], {"requested_op": op[:100], "at": _now(), "status": "MISSING_CAPABILITY",
                                                             "note": "no discovery allocation is open; recorded only"})
            _bump(s, refusals=1)
            raise Refused(f"unsupported operation {op!r}: no retained capability; recorded as a missing-capability opportunity (no discovery run)")
        tid = task_id(op, files)
        key = "operator/task/" + tid
        saved = s.get(key)
        if saved and saved["state"] in TERMINAL and _replayable(s, op, saved):
            _bump(s, replays=1)
            _log(s, {"task_id": tid, "op": op, "mode": "saved_result_replay", "state": saved["state"]})
            return dict(saved, mode="saved_result_replay", replayed_at=_now())
        try:
            intake_check(op, files)
        except Refused as e:
            _bump(s, refusals=1)
            _log(s, {"task_id": tid, "op": op, "mode": "refused", "state": "UNSUPPORTED", "reason": str(e)})
            raise
        inputs = []
        for n, d in files:
            ref = s.put_artifact({"kind": "operator_input", "name": Path(n).name, "b64": base64.b64encode(d).decode()})
            inputs.append({"name": Path(n).name, "format": _fmt(n), "bytes": len(d), "sha256": _sha(d), "input_ref": ref})
        prior = [{k: saved.get(k) for k in ("state", "submitted_at", "reason")}] + saved.get("prior_attempts", [])[:9] if saved else []
        rec = {"task_id": tid, "op": op, "inputs": inputs, "state": "RUNNING", "stages": [], "submitted_at": _now(), "mode": "retained_capability_reuse",
               "pid": os.getpid(), "prior_attempts": prior}
        _stage(s, key, rec, "intake", detail="immutable input copies stored")
        if stop_path.exists():
            rec["state"] = "STOPPED"
            _stage(s, key, rec, "stopped", detail="STOP is set; nothing executed")
            _log(s, {"task_id": tid, "op": op, "mode": "stopped", "state": "STOPPED"})
            return rec
        try:
            cap = resolve(s, op)
        except Refused as e:
            rec.update(state="NO_ELIGIBLE_CAPABILITY", reason=str(e))
            _stage(s, key, rec, "selection_refused", reason=str(e))
            _bump(s, refusals=1)
            _log(s, {"task_id": tid, "op": op, "mode": "refused", "state": rec["state"], "reason": str(e)})
            return rec
        rec["capability"] = cap
        _stage(s, key, rec, "selected", capability=cap["capability"], genome=cap["genome"], steps=cap["steps"])
        texts = [{"format": i["format"], "text": d.decode("utf-8")} for i, (_, d) in zip(inputs, files)]
        env = {"format": texts[0]["format"], "source_b64": base64.b64encode(files[0][1]).decode()} if op == "convert" else {"files": texts}
        body = s.read_artifact(W.lineage.get(s, cap["genome"])["body_ref"])["text"]
        _stage(s, key, rec, "executing", backend="container (pinned python:3.11-slim, no network)")
        from . import experiment_compare as EC
        t0 = time.monotonic()
        _bump(s, container_runs=1)  # counted at start: an interrupted run is still a run
        try:
            out = EC.run_isolated(body, json.dumps(env), {}, timeout=pol["container_timeout_s"], backend="container", operator_class="generated")
        except Exception as e:
            _bump(s, executions=1)
            rec.update(state="EXECUTION_FAILED", reason=f"{type(e).__name__}: {str(e)[:300]}")
            _stage(s, key, rec, "execution_failed", reason=rec["reason"])
            _log(s, {"task_id": tid, "op": op, "mode": "retained_capability_reuse", "state": rec["state"]})
            return rec
        exec_s = round(time.monotonic() - t0, 3)
        _bump(s, executions=1)
        _stage(s, key, rec, "executed", wall_s=exec_s, output_sha256=_sha(out))
        if stop_path.exists():  # STOP arrived during the bounded container run: discard, export nothing
            rec["state"] = "STOPPED"
            _stage(s, key, rec, "stopped_after_execution", detail="STOP set during execution; output discarded, nothing exported")
            _log(s, {"task_id": tid, "op": op, "mode": "stopped", "state": "STOPPED"})
            return rec
        t1 = time.monotonic()
        ver = independent_verify(op, texts, out, pol)
        ver["wall_s"] = round(time.monotonic() - t1, 3)
        _stage(s, key, rec, "verified", verdict=ver["verdict"])
        rec.update(_finish(store_root, tid, op, inputs, files, out, ver))
        rec["verification"], rec["usage"] = ver, {"execution_wall_s": exec_s, "verify_wall_s": ver["wall_s"], "container_runs": 1, "model_calls": 0, "proposal_calls": 0}
        rec["completed_at"] = _now()
        _stage(s, key, rec, "done", state=rec["state"])
        _log(s, {"task_id": tid, "op": op, "mode": "retained_capability_reuse", "state": rec["state"], "genome": cap["genome"]})
        return rec
    finally:
        s.close()


def _finish(store_root, tid, op, inputs, files, out, ver):
    """Readable verdict + exported outputs. Only PASS-verified outputs are exported as results."""
    outdir, exported = store_root / "output" / "operator" / tid, {}
    passed = ver["verdict"] == "PASS"
    if not passed:  # never parse or describe unverified output as a result
        state = "VERIFICATION_FAILED" if ver["verdict"] == "FAIL" else "REVIEW_PENDING"
        summary = {"verdict": "Independent check " + ver["verdict"] + "; output withheld" + (f" ({ver['reason']})" if ver.get("reason") else "")}
        res = None
    else:
        res = json.loads(out)
    if res is None:
        pass
    elif "error" in res:
        state = "REJECTED"
        why = explain_rejection(*files[0]) if op == "convert" else None
        summary = {"verdict": "Whole input rejected" + (f": {why}" if why else ""), "accepted": 0, "quarantined": len(inputs)}
    elif op == "convert":
        state = "VERIFIED"
        rows = json.loads(res["converted"])
        summary = {"verdict": f"Converted {len(rows)} rows to canonical JSON", "rows": len(rows)}
        exported["converted.json"] = res["converted"].encode("utf-8")
    else:
        state = "VERIFIED"
        q = {x["index"]: x["reason"] for x in res["quarantined"]}
        files_report = [{"file": i["name"], "sha256": i["sha256"], "status": "quarantined" if n in q else "accepted", "reason": q.get(n)} for n, i in enumerate(inputs)]
        summary = {"verdict": f"Merged {len(inputs) - len(q)} of {len(inputs)} files; quarantined {len(q)}", "accepted": len(inputs) - len(q),
                   "quarantined": len(q), "files": files_report, "groups": len(res["groups"])}
        exported["merged.json"] = json.dumps({"groups": res["groups"], "files": files_report}, sort_keys=True, indent=1).encode("utf-8")
    report = {"task_id": tid, "op": op, "state": state, "summary": summary, "inputs": [{k: i[k] for k in ("name", "format", "bytes", "sha256")} for i in inputs],
              "output_sha256": _sha(out), "verification": {k: ver.get(k) for k in ("verdict", "evaluator", "pin", "expected_sha256", "reason")}}
    exported["report.json"] = json.dumps(report, sort_keys=True, indent=1).encode("utf-8")
    artifacts = []
    for name, data in exported.items():
        _write(outdir / name, data)
        artifacts.append({"name": name, "ref": (outdir / name).relative_to(store_root).as_posix(), "sha256": _sha(data)})
    return {"state": state, "summary": summary, "raw_output_sha256": _sha(out), "artifacts": artifacts}


def task_artifact(store_root, ref):
    """Allowlisted artifact lookup by the task id inside the ref (output/operator/<task>/<name>)."""
    parts = ref.split("/") if isinstance(ref, str) else []
    if len(parts) != 4 or parts[:2] != ["output", "operator"]:
        return None
    s = Store(store_root)
    try:
        rec = s.get("operator/task/" + parts[2]) or {}
    finally:
        s.close()
    return next((a for a in rec.get("artifacts", []) if a["ref"] == ref), None)


def recover(store_root):
    """After a crash: RUNNING tasks become INTERRUPTED (resubmitting the same inputs re-executes; no model, no side effects)."""
    s = Store(store_root)
    try:
        n = 0
        for row in s.db.execute("SELECT key FROM kv WHERE key LIKE 'operator/task/%'").fetchall():
            rec = s.get(row["key"])
            from .storage import _alive
            pid = rec.get("pid")
            owned_elsewhere = isinstance(pid, int) and pid != os.getpid() and _alive(pid)  # another live process is running it
            if rec.get("state") == "RUNNING" and not owned_elsewhere:
                rec["state"] = "INTERRUPTED"
                rec["stages"].append({"stage": "interrupted", "at": _now(), "detail": "process ended before completion; resubmit to execute"})
                s.set(row["key"], rec)
                n += 1
        return n
    finally:
        s.close()


def status(store_root):
    s = Store(store_root)
    try:
        caps = {}
        for op in load_policy()["operations"]:
            try:
                c = resolve(s, op)
                caps[op] = {"eligible": True, "capability": c["capability"], "genome": c["genome"], "steps": c["steps"], "scope": c["scope"],
                            "production_approved": False, "selected_by": c["selected_by"], "accepted": c["accepted"]}
            except Refused as e:
                caps[op] = {"eligible": False, "reason": str(e)}
            caps[op]["history"] = [{k: e.get(k) for k in ("type", "target", "at", "why")} for e in history(s, op)]
        tasks = [s.get(r["key"]) for r in s.db.execute("SELECT key FROM kv WHERE key LIKE 'operator/task/%'").fetchall()]
        tasks.sort(key=lambda t: t.get("submitted_at", ""), reverse=True)
        return {"capabilities": caps, "counters": _counters(s), "tasks": tasks[:50], "log": s.get("operator/log", [])[-50:],
                "opportunities": [s.get(r["key"]) for r in s.db.execute("SELECT key FROM kv WHERE key LIKE 'operator/opportunity/%'").fetchall()]}
    finally:
        s.close()


def readiness(store_root):
    pol, out = load_policy(), {}
    out["runtime_commit"] = None
    if (ROOT / "SNAPSHOT_MANIFEST.json").exists():  # extracted package: its manifest names the exported commit
        out["runtime_commit"] = json.loads((ROOT / "SNAPSHOT_MANIFEST.json").read_text(encoding="utf-8")).get("source_commit")
    else:
        try:
            p = subprocess.run(["git", "-C", str(ROOT), "rev-parse", "--verify", "HEAD"], capture_output=True, text=True, timeout=10)
            sha = p.stdout.strip()
            out["runtime_commit"] = sha if p.returncode == 0 and len(sha) == 40 else None
        except (OSError, subprocess.SubprocessError):
            pass
    out["store"] = str(Path(store_root).resolve())
    try:
        from .adapters.isolation import DockerIsolation, PINNED_IMAGE
        DockerIsolation().inspect(PINNED_IMAGE)
        out["executor"] = {"ready": True, "backend": "docker", "image": PINNED_IMAGE["reference"] + "@" + PINNED_IMAGE["digest"][:19]}
    except Exception as e:
        out["executor"] = {"ready": False, "reason": f"{type(e).__name__}: {str(e)[:200]}"}
    pin = evaluator_pin(pol) if evaluator_path(pol).exists() else None
    out["evaluator"] = {"ready": pin == pol["evaluator"]["pin"], "path": pol["evaluator"]["path"], "pin": pin}
    out["model"] = {"required": False, "note": "retained deterministic workflows run with 0 model calls; no model is loaded"}
    out["stop"] = (Path(store_root) / "STOP").exists()
    total, used, free = shutil.disk_usage(Path(store_root).resolve().anchor)
    out["resources"] = {"disk_free_gb": round(free / 2**30, 1)}
    return out


# ---------------------------------------------------------------- engineering preparation adapter (explicit, versioned)
ADAPTER = "inventory-snapshot-v1"


def snapshot_dir(directory, group_by="top", fmt="csv"):
    """Engineering preparation, NOT a learned capability: list regular files under `directory` as id,group,bytes CSV.
    id = relative POSIX path, group = top-level folder ('.' for root files) or extension, bytes = file size.
    Skips hidden entries and symlinks. Refuses more than 256 files (the capability's row limit)."""
    base, rows = Path(directory).resolve(strict=True), []
    for dirpath, dirs, names in os.walk(base):
        dirs[:] = sorted(d for d in dirs if not d.startswith(".") and not (Path(dirpath) / d).is_symlink())
        for n in sorted(names):
            p = Path(dirpath) / n
            if n.startswith(".") or p.is_symlink() or not p.is_file():
                continue
            rel = p.relative_to(base).as_posix()
            grp = (rel.split("/")[0] if "/" in rel else ".") if group_by == "top" else (p.suffix.lower() or "(none)")
            rows.append((rel, grp, p.stat().st_size))
    if not 1 <= len(rows) <= 256:
        raise Refused(f"{len(rows)} files: the inventory capability accepts 1 to 256 rows; pick a smaller folder")
    if any(len(r[0]) > 128 or len(r[1]) > 128 for r in rows):
        raise Refused("a path or group is longer than 128 characters")
    if fmt == "json":
        return json.dumps([{"id": i, "group": g, "bytes": b} for i, g, b in rows], indent=1).encode("utf-8")
    buf = io.StringIO(newline="")
    w = csv.writer(buf, lineterminator="\n")
    w.writerow(["id", "group", "bytes"])
    w.writerows(rows)
    return buf.getvalue().encode("utf-8")
