"""Goal -> validated task contract -> typed plan from registered capabilities -> step-by-step execution through run_task.

Deterministic only (parser deterministic-v1): zero model calls. Instructions are read from the goal text alone, never from
input file contents. The explicit-operation interface in operator_runtime is unchanged and is what every registry step uses."""
from __future__ import annotations

import json, os, re, subprocess, sys, tempfile, time
from collections import deque
from datetime import datetime, timedelta, timezone
from pathlib import Path

from . import operator_runtime as O
from .operator_runtime import Refused, _json, _now, _sha, _txn
from .storage import Store

TYPES_PATH = O.ROOT / "configs" / "capability_types.json"
CONTRACT_SCHEMA, PLAN_SCHEMA = "hive-task-contract-v1", "hive-typed-plan-v1"
PARSER = "deterministic-v1"
KEYWORDS = [("canonical_rows", r"convert|canonical|normali[sz]"),
            ("group_summary", r"merge|combine|summar|per group|total"),
            ("inventory_diff", r"compare|diff|reconcil|changes between|added|removed")]
NAME = re.compile(r"[A-Za-z0-9._ -]{1,128}")
STEP_OK = "VERIFIED"


def types(): return json.loads(TYPES_PATH.read_text(encoding="utf-8"))


def _sub(T, t, want):
    while t:
        if t == want:
            return True
        t = T["types"][t]["subtype_of"]
    return False


# ---------------------------------------------------------------- C1 contract
def load_inputs(allowed_root, sources, listed=None):
    """Relative paths under the allowed root -> [(name, 'file'|'folder', bytes|path)]. Raises ValueError/Refused."""
    from .console import _bounded_read, _under
    root = Path(allowed_root).resolve(strict=True)
    if not isinstance(sources, list) or not 1 <= len(sources) <= 20 or len(set(map(str, sources))) != len(sources):
        raise Refused("select 1 to 20 distinct permitted files or folders")
    out = []
    for raw in sources:
        try:
            p = _under(root, raw, file=False)
        except OSError:
            raise Refused("source not found under the permitted folder") from None
        rel = p.relative_to(root)
        if any(part.startswith(".") for part in rel.parts):
            raise Refused("hidden paths are not permitted")
        if p.is_dir():
            out.append((p.name, "folder", p))
        else:
            if listed is not None and rel.as_posix() not in listed:
                raise Refused("select a listed permitted CSV/JSON file")
            out.append((p.name, "file", _bounded_read(p)))
    return out


def make_contract(goal_text, inputs, *, deliverable=None, budget=None, allow_discovery=False):
    """Normalise a goal into a versioned contract, or a NEEDS_CLARIFICATION dict. Raises Refused for malformed input."""
    T = types()
    if not isinstance(goal_text, str) or not goal_text.strip() or len(goal_text) > 2000:
        raise Refused("a goal of 1 to 2000 characters is required")
    if deliverable is not None and deliverable not in T["deliverables"]:
        raise Refused(f"unsupported deliverable {str(deliverable)[:40]!r}; supported: {', '.join(T['deliverables'])}")
    if deliverable is None:
        hits = [d for d, rx in KEYWORDS if re.search(rx, goal_text.lower())]
        if len(hits) != 1:
            return {"state": "NEEDS_CLARIFICATION", "reason": "goal matched " + (", ".join(hits) if hits else "no deliverable"),
                    "supported_deliverables": {d: T["types"][d]["description"] for d in T["deliverables"]}}
        deliverable = hits[0]
    if not isinstance(inputs, (list, tuple)) or not 1 <= len(inputs) <= 20:
        raise Refused("1 to 20 inputs are required")
    pol, total, ins = O.load_policy(), 0, []
    for name, kind, data in inputs:
        if not isinstance(name, str) or not NAME.fullmatch(name):
            raise Refused(f"bad input name {str(name)[:40]!r}")
        if kind == "folder":
            data = O.snapshot_dir(data)  # may raise Refused (empty/too large); hash of the snapshot taken at intake
        elif kind == "file":
            if not isinstance(data, bytes):
                raise Refused(f"{name}: file content required")
            O._fmt(name)
            if len(data) > O.MAX_FILE:
                raise Refused(f"{name}: exceeds the 2 MiB limit")
        else:
            raise Refused(f"bad input kind {str(kind)[:20]!r}")
        total += len(data)
        ins.append({"name": name, "type": "folder" if kind == "folder" else "inventory_file", "sha256": _sha(data), "bytes": len(data)})
    if total > pol["max_total_bytes"]:
        raise Refused("inputs exceed 2 MiB in total")
    dflt, b = T["default_budget"], dict(T["default_budget"])
    for k, v in (budget or {}).items():
        if k not in dflt or not isinstance(v, int) or isinstance(v, bool) or not 0 <= v <= dflt[k]:
            raise Refused(f"budget {k!r} may only be lowered (0..{dflt.get(k)})")
        b[k] = v
    core = {"schema": CONTRACT_SCHEMA, "goal_text": goal_text, "goal_sha256": _sha(goal_text), "deliverable": deliverable,
            "output_schema": {"type": deliverable, "description": T["types"][deliverable]["description"]}, "inputs": ins,
            "success_criteria": ["every registry step independently verified PASS by its pinned oracle", "deliverable type matches",
                                 "no model calls"],
            "allowed_operations": sorted(T["capabilities"]),
            "permissions": {"network": False, "model_calls": 0, "discovery": bool(allow_discovery), "side_effects": "write verified outputs under store output/ only"},
            "budget": b, "parser": PARSER}
    now = datetime.now(timezone.utc)
    return dict(core, contract_id="g-" + _sha(_json(core))[:20], created_at=now.isoformat(timespec="seconds"),
                deadline=(now + timedelta(seconds=b["wall_s"])).isoformat(timespec="seconds"))


def prepare(store_root, allowed_root, goal, sources, deliverable=None, budget=None, listed=None, allow_discovery=False):
    """load_inputs + make_contract; a malformed submission is counted as a refusal before anything runs."""
    try:
        inputs = load_inputs(allowed_root, sources, listed)
        return make_contract(goal, inputs, deliverable=deliverable, budget=budget, allow_discovery=allow_discovery), inputs
    except ValueError as e:
        O.note_refusal(store_root, "goal", e)
        raise


# ---------------------------------------------------------------- C2 planner
def eligible_caps(store):
    """(eligible {op: type row + genome}, excluded [{op, reason}]). Registry ops must resolve() OK right now."""
    ok, ex = {}, []
    for op, c in types()["capabilities"].items():
        if c["kind"] == "registry":
            try:
                ok[op] = dict(c, genome=O.resolve(store, op)["genome"])
            except Refused as e:
                ex.append({"op": op, "reason": str(e)})
        else:
            ok[op] = dict(c)
    from . import capability_registry as CR  # C4: admitted discovered capabilities, types from the verified signed statement
    dok, dex = CR.eligible_discovered(store)
    ok.update(dok)
    return ok, ex + dex


def plan_goal(store, contract):
    """Bounded BFS (fewest steps, op-name tie-break) from the input types to a single item of the deliverable type that
    consumes every input. steps == [] means no plan."""
    T, (ok, ex) = types(), eligible_caps(store)
    goal, maxs = contract["deliverable"], contract["budget"]["max_steps"]
    start = tuple((i["type"], f"input:{n}") for n, i in enumerate(contract["inputs"]))
    steps = []
    queue = deque([(start, ())])
    while queue:
        items, path = queue.popleft()
        if path and len(items) == 1 and items[0][0] == goal:
            steps = list(path)
            break
        if len(path) >= maxs:
            continue
        for op in sorted(ok):
            c = ok[op]
            lo, hi = c["arity"]
            match = [x for x in items if _sub(T, x[0], c["in"])]
            take = match[:1] if hi == 1 else match[:hi]  # ponytail: arity-1 ops take the first match; symmetric orders are not explored
            if len(take) < lo:
                continue
            sid = f"s{len(path) + 1}"
            step = {"step_id": sid, "op": op, "kind": c["kind"], "capability": op, "inputs": [x[1] for x in take],
                    "expected_output": c["out"], "verifier": c["verifier"],
                    "allowance": {"container_runs": 1 if c["kind"] in ("registry", "discovered") else 0, "timeout_s": O.load_policy()["container_timeout_s"]},
                    "after": [x[1][5:] for x in take if x[1].startswith("step:")]}
            step.update({"adapter": c["adapter"]} if c["kind"] == "builtin_adapter" else {"genome": c["genome"]})
            if c["kind"] == "discovered":
                step.update(version=c["version"], statement_sha=c["statement_sha"])
            queue.append((tuple(x for x in items if x not in take) + ((c["out"], "step:" + sid),), path + (step,)))
    return {"schema": PLAN_SCHEMA, "steps": steps, "excluded": ex}


def validate_plan(store, contract, plan):
    """Independent re-check of a plan (not of the search). Returns a list of problems; empty means valid."""
    T, (ok, _) = types(), eligible_caps(store)
    steps = plan.get("steps") or []
    if not steps:
        return ["empty plan"]
    by = {s["step_id"]: s for s in steps if isinstance(s, dict) and "step_id" in s}
    order = {s["step_id"]: n for n, s in enumerate(steps)}
    if len(by) != len(steps) or len(order) != len(steps):
        return ["duplicate or missing step ids"]
    if len(steps) > contract["budget"]["max_steps"]:
        return [f"{len(steps)} steps exceeds the budget of {contract['budget']['max_steps']}"]
    done, consumed = {}, []

    def ref_type(ref, path):
        kind, _, k = str(ref).partition(":")
        if kind == "input" and k.isdigit() and int(k) < len(contract["inputs"]):
            return contract["inputs"][int(k)]["type"]
        if kind == "step" and k in by:
            return check(k, path)
        raise ValueError(f"unknown reference {ref!r}")

    def check(sid, path=()):
        if sid in path:
            raise ValueError(f"cycle through {sid}")
        if sid in done:
            return done[sid]
        s, c = by[sid], T["capabilities"].get(by[sid].get("op")) or ok.get(by[sid].get("op"))
        if c is None:
            raise ValueError(f"{sid}: unknown capability {s.get('op')!r}")
        if s["op"] not in ok:
            raise ValueError(f"{sid}: capability {s['op']} is not eligible (revoked, damaged or unpinned)")
        if c["kind"] in ("registry", "discovered") and s.get("genome") != ok[s["op"]]["genome"]:
            raise ValueError(f"{sid}: plan genome is not the currently eligible one")
        lo, hi = c["arity"]
        if not lo <= len(s["inputs"]) <= hi:
            raise ValueError(f"{sid}: {s['op']} takes {lo} to {hi} inputs, got {len(s['inputs'])}")
        for dep in s.get("after", []):
            if dep not in by:
                raise ValueError(f"{sid}: unknown dependency {dep!r}")
            check(dep, path + (sid,))
        for ref in s["inputs"]:
            t = ref_type(ref, path + (sid,))
            if not _sub(T, t, c["in"]):
                raise ValueError(f"{sid}: {t} is not accepted as {c['in']}")
            if str(ref).startswith("step:") and order[ref[5:]] >= order[sid]:
                raise ValueError(f"{sid}: depends on a later step")
            consumed.append(ref)
        done[sid] = c["out"]
        if s.get("expected_output") != c["out"]:
            raise ValueError(f"{sid}: expected_output does not match the type table")
        return c["out"]

    try:
        for sid in by:
            check(sid)
        if len(set(consumed)) != len(consumed):
            raise ValueError("an input or step output is used twice")
        left = [("input:%d" % n) for n in range(len(contract["inputs"]))] + ["step:" + s for s in by]
        left = [r for r in left if r not in consumed]
        if len(left) != 1:
            raise ValueError(f"plan leaves {len(left)} unconsumed items; exactly one deliverable is required")
        if (done[left[0][5:]] if left[0].startswith("step:") else contract["inputs"][int(left[0][6:])]["type"]) != contract["deliverable"]:
            raise ValueError("final output type does not match the deliverable")
    except (ValueError, KeyError, TypeError) as e:
        return [str(e)]
    return []


def missing_step(store, contract):
    """C3: the smallest typed step that is missing, or None. Only when no eligible capability produces the deliverable at all.
    Each input is normalised as far as eligible single-input capabilities go (greedy, op-name order, no type revisited); if every
    input ends at the same type T the gap is (T, arity=#inputs, ordered, out=deliverable) and the normalising steps are the partial plan."""
    T, (ok, _) = types(), eligible_caps(store)
    if any(c["out"] == contract["deliverable"] for c in ok.values()):
        return None
    ends, partial = [], []
    for n, i in enumerate(contract["inputs"]):
        t, ref, seen = i["type"], f"input:{n}", {i["type"]}
        while True:
            op = next((o for o in sorted(ok) if ok[o]["arity"] == [1, 1] and _sub(T, t, ok[o]["in"]) and ok[o]["out"] not in seen), None)
            if op is None:
                break
            partial.append({"step_id": f"s{len(partial) + 1}", "op": op, "inputs": [ref], "expected_output": ok[op]["out"]})
            t, ref = ok[op]["out"], "step:" + partial[-1]["step_id"]
            seen.add(t)
        ends.append(t)
    if len(set(ends)) != 1:
        return None
    return {"in": ends[0], "arity": len(ends), "ordered": True, "out": contract["deliverable"]}, partial


def record_gap(store, contract, plan, missing=None):
    """Open (or re-hit) the typed gap for C3. Discovery is NOT started here. `missing` = missing_step() result or None."""
    ins = sorted(i["type"] for i in contract["inputs"])
    key = "operator/gap/" + _sha(_json([contract["deliverable"], ins] + ([missing[0]] if missing else [])))[:16]
    ok, _ = eligible_caps(store)
    with _txn(store):
        g = store.get(key) or {"unmet_type": contract["deliverable"], "desired_behavior": contract["output_schema"]["description"],
                               "input_types": ins, "goal_ids": [], "count": 0, "allowed_tools": ["registry capabilities", "builtin adapters"],
                               "success_criteria": contract["success_criteria"], "status": "OPEN", "discovery": "not started (C3)"}
        if missing:
            g["missing_step"], g["partial_plan"] = missing
        g["capability_inventory"] = {"eligible": {op: {"in": c["in"], "out": c["out"], "arity": c["arity"], "kind": c["kind"]} for op, c in ok.items()},
                                     "excluded": plan.get("excluded", [])}
        g["count"] += 1
        if contract["contract_id"] not in g["goal_ids"]:
            g["goal_ids"].append(contract["contract_id"])
        store.set(key, g)
    return key


# ---------------------------------------------------------------- execution
def _step_snapshot(store_root, contract, inputs, step, rec):
    n = int(step["inputs"][0][6:])
    try:
        data = O.snapshot_dir(inputs[n][2])
        if _sha(data) != contract["inputs"][n]["sha256"]:
            raise Refused("folder content changed since the contract was made")
        O.intake_check("convert", [(step["step_id"] + ".csv", data)])
        bad = O.explain_rejection(step["step_id"] + ".csv", data)
        if bad:
            raise Refused(bad)
    except (Refused, OSError) as e:
        rec.update(state="REFUSED", reason=str(e)[:300], verdict="FAIL")
        return None
    name = step["step_id"] + ".csv"
    O._write(Path(store_root) / "output" / "goal" / contract["contract_id"] / name, data)
    rec.update(state=STEP_OK, verdict="PASS", mode="builtin_adapter", artifacts=[{"name": name, "ref": f"output/goal/{contract['contract_id']}/{name}", "sha256": _sha(data)}])
    return name, data


_VERIFY_DIFF = r"""
import importlib.util, json, sys
spec = importlib.util.spec_from_file_location("hive_c4_oracle", sys.argv[1]); o = importlib.util.module_from_spec(spec); spec.loader.exec_module(o)
job = json.load(open(sys.argv[2], encoding="utf-8"))
try:
    exp = o.expected(job["env"])
    res = {"verdict": "PASS" if exp == job["output"] else "FAIL", "expected_sha256": __import__("hashlib").sha256(exp.encode()).hexdigest()}
except Exception as e:
    res = {"verdict": "UNVERIFIABLE", "reason": type(e).__name__ + ": " + str(e)[:200]}
print(json.dumps(res))
"""


def _verify_diff(st, env, output):
    """Independent output check: evaluator/c3/oracle.py in a separate `python -I` process (mirrors operator_runtime.independent_verify)."""
    from . import discovery as D
    ident = {"evaluator": st["verifier"]["path"], "pin": D.evaluator_pin(), "process": "separate python -I"}
    if ident["pin"] != st["verifier"]["pin"]:
        return dict(ident, verdict="UNVERIFIABLE", reason="evaluator differs from the admitted pin")
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        job = Path(tmp) / "job.json"
        job.write_text(json.dumps({"env": env, "output": output}), encoding="utf-8")
        try:
            p = subprocess.run([sys.executable, "-I", "-c", _VERIFY_DIFF, str(O.ROOT / st["verifier"]["path"]), str(job)], capture_output=True, text=True, timeout=60, cwd=tmp)
        except (subprocess.TimeoutExpired, OSError) as e:
            return dict(ident, verdict="UNVERIFIABLE", reason=f"evaluator process did not complete: {type(e).__name__}")
    try:
        return dict(ident, **json.loads(p.stdout.strip().splitlines()[-1]))
    except (ValueError, IndexError):
        return dict(ident, verdict="UNVERIFIABLE", reason=f"evaluator process failed (exit {p.returncode})")


def _run_discovered(s, store_root, contract, step, files, sr, stop_path):
    """C4: run an admitted discovered capability on the step's inputs. resolve_discovered re-verifies signature, chain, body hash, harness,
    pin and image on EVERY use. Same capability statement + same inputs -> saved-result replay; otherwise one container run, then the
    independent oracle in its own process. Only PASS is exported (diff.json + report.json under output/goal/<goal_id>/)."""
    from . import capability_registry as CR, discovery as D, experiment_compare as EC
    store_root = Path(store_root)
    r = CR.resolve_discovered(s, step["op"])  # Refused -> step REFUSED, nothing executed
    st = r["statement"]
    if r["statement_sha"] != step.get("statement_sha"):
        raise Refused("the admitted version changed since the plan was made")
    env = {"files": [{"format": "json", "text": d.decode("utf-8")} for _, d in files]}
    tid = "u-" + _sha(_json({"cap": r["statement_sha"], "pin": D.evaluator_pin(), "inputs": [_sha(d) for _, d in files]}))[:20]
    sr.update(capability={"cap_id": step["op"], "version": r["version"], "statement_sha": r["statement_sha"]}, task_id=tid)
    outdir, ukey = store_root / "output" / "goal" / contract["contract_id"], "operator/capuse/" + tid
    saved = s.get(ukey)
    if saved and all((store_root / a["ref"]).is_file() and _sha((store_root / a["ref"]).read_bytes()) == a["sha256"] for a in saved["artifacts"]):
        arts = []
        for a in saved["artifacts"]:  # replay: re-export the saved verified bytes under this goal; no container, no model
            data = (store_root / a["ref"]).read_bytes()
            O._write(outdir / a["name"], data)
            arts.append(dict(a, ref=(outdir / a["name"]).relative_to(store_root).as_posix()))
        sr.update(mode="saved_result_replay", state=STEP_OK, verdict="PASS", reason=None, verification=saved["verification"], artifacts=arts)
        O._bump(s, replays=1)
        return step["step_id"] + ".json", (outdir / "diff.json").read_bytes()
    if stop_path.exists():
        sr.update(state="STOPPED", reason="STOP is set")
        return None
    O._bump(s, container_runs=1)  # counted at start: an interrupted run is still a run
    try:
        res = json.loads(EC.run_isolated(D._load("harness").wrap(st["body"]), json.dumps([env]), {}, timeout=st["limits"]["timeout_s"],
                                         max_out=st["limits"]["max_out"], backend="container", operator_class="generated"))
        out = res[0] if isinstance(res, list) and len(res) == 1 else None
    except Exception as e:
        O._bump(s, executions=1)
        sr.update(state="EXECUTION_FAILED", reason=f"{type(e).__name__}: {str(e)[:300]}")
        return None
    O._bump(s, executions=1)
    if not isinstance(out, str):
        sr.update(state="EXECUTION_FAILED", reason="the capability produced no output for these inputs")
        return None
    ver = _verify_diff(st, env, out)
    sr.update(mode="retained_capability_execution", verdict=ver["verdict"], verification=ver)
    if ver["verdict"] != "PASS":
        sr.update(state="VERIFICATION_FAILED" if ver["verdict"] == "FAIL" else "REVIEW_PENDING", reason="Independent check " + ver["verdict"] + "; output withheld")
        return None
    report = {"goal_id": contract["contract_id"], "step": step["step_id"], "capability": sr["capability"], "inputs": [{"name": n, "sha256": _sha(d)} for n, d in files],
              "output_sha256": _sha(out), "verification": {k: ver.get(k) for k in ("verdict", "evaluator", "pin", "expected_sha256")}}
    arts = []
    for name, data in (("diff.json", out.encode("utf-8")), ("report.json", json.dumps(report, sort_keys=True, indent=1).encode("utf-8"))):
        O._write(outdir / name, data)
        arts.append({"name": name, "ref": (outdir / name).relative_to(store_root).as_posix(), "sha256": _sha(data)})
    s.set(ukey, {"artifacts": arts, "verification": sr["verification"], "statement_sha": r["statement_sha"], "at": _now()})
    sr.update(state=STEP_OK, reason=None, artifacts=arts)
    return step["step_id"] + ".json", out.encode("utf-8")


def goal_artifact(store_root, ref):
    """Allowlisted lookup for output/goal/<goal_id>/<name> (a verified discovered-capability result of that goal)."""
    parts = ref.split("/") if isinstance(ref, str) else []
    if len(parts) != 4 or parts[:2] != ["output", "goal"]:
        return None
    s = Store(store_root)
    try:
        rec = s.get("operator/goal/" + parts[2]) or {}
    finally:
        s.close()
    return next((a for a in rec.get("deliverable") or [] if a.get("ref") == ref), None)


def run_goal(store_root, contract, inputs, *, stop_path=None):
    """Persist contract, plan, execute. inputs = the same [(name, kind, bytes|path)] the contract was made from."""
    store_root = Path(store_root)
    stop_path = Path(stop_path or store_root / "STOP")
    gid, key = contract["contract_id"], "operator/goal/" + contract["contract_id"]
    for (name, kind, data), want in zip(inputs, contract["inputs"]):  # file bytes must be the ones the contract hashed
        if kind == "file" and _sha(data) != want["sha256"]:
            raise Refused(f"{name}: content differs from the contract")
    s = Store(store_root)
    try:
        saved = s.get(key)
        prior = [{k: saved.get(k) for k in ("state", "submitted_at", "reason")}] + saved.get("prior_attempts", [])[:9] if saved else []
        ref = s.put_artifact(contract)
        rec = {"goal_id": gid, "contract_ref": ref, "state": "PLANNING", "plan": None, "steps": [], "reason": None, "stages": [],
               "submitted_at": _now(), "pid": os.getpid(), "prior_attempts": prior, "gap_ref": None, "replayed_steps": 0}
        O._stage(s, key, rec, "contract_persisted", contract_ref=ref)
        c0, t0 = O._counters(s), time.monotonic()
        plan = plan_goal(s, contract)
        problems = validate_plan(s, contract, plan) if plan["steps"] else ["no typed plan from the eligible capabilities"]
        rec["plan"] = plan
        if problems:
            ms = missing_step(s, contract)
            rec.update(state="UNRESOLVED", reason="; ".join(problems)[:400], gap_ref=record_gap(s, contract, plan, ms))
            if ms:
                rec["missing_step"], rec["partial_plan"] = ms
            if ms and contract["permissions"].get("discovery"):
                from . import discovery as D
                try:
                    rec.update(state="DISCOVERY_QUEUED", experiment_id=D.open_experiment(s, rec["gap_ref"])["exp_id"])
                except Refused as e:
                    rec["reason"] += f"; discovery not opened: {str(e)[:120]}"
            O._stage(s, key, rec, "unresolved", reason=rec["reason"], gap=rec["gap_ref"])
            return rec
        rec["state"] = "RUNNING"
        O._stage(s, key, rec, "planned", steps=[x["op"] for x in plan["steps"]])
        vals, b = {}, contract["budget"]
        for i, step in enumerate(plan["steps"]):
            c = O._counters(s)
            if stop_path.exists():
                rec.update(state="STOPPED", reason="STOP is set; nothing further ran")
                break
            if i >= b["max_steps"] or time.monotonic() - t0 > b["wall_s"] or (step["kind"] in ("registry", "discovered") and c["container_runs"] - c0["container_runs"] >= b["container_runs"]):
                # ponytail: the container budget is checked before the step, so a would-be replay is also held back
                rec.update(state="BUDGET_EXHAUSTED", reason=f"budget exhausted before step {step['step_id']}")
                break
            sr = {"step_id": step["step_id"], "op": step["op"], "kind": step["kind"], "task_id": None, "mode": None,
                  "genome": step.get("genome"), "adapter": step.get("adapter"), "state": None, "verdict": None, "reason": None, "artifacts": []}
            rec["steps"].append(sr)
            O._stage(s, key, rec, "step_start", step=step["step_id"])
            out = None
            try:
                if step["kind"] == "builtin_adapter":
                    out = _step_snapshot(store_root, contract, inputs, step, sr)
                elif step["kind"] == "discovered":
                    out = _run_discovered(s, store_root, contract, step, [vals[r] for r in step["inputs"]], sr, stop_path)
                    rec["replayed_steps"] += sr["mode"] == "saved_result_replay"
                else:
                    files = []
                    for r in step["inputs"]:
                        files.append(vals[r] if r.startswith("step:") else (inputs[int(r[6:])][0], inputs[int(r[6:])][2]))
                    t = O.run_task(store_root, step["op"], files, stop_path=stop_path)
                    sr.update(task_id=t["task_id"], mode=t["mode"], state=t["state"], verdict=(t.get("verification") or {}).get("verdict"),
                              reason=t.get("reason") or (t.get("summary") or {}).get("verdict"), artifacts=t.get("artifacts", []))
                    a = next((x for x in sr["artifacts"] if x["name"] != "report.json"), None)
                    if sr["state"] == STEP_OK and a:
                        out = (step["step_id"] + Path(a["name"]).suffix, (store_root / a["ref"]).read_bytes())
                    if t["mode"] == "saved_result_replay":
                        rec["replayed_steps"] += 1
            except (Refused, OSError, ValueError) as e:
                sr.update(state="REFUSED", reason=str(e)[:300])
            except Exception as e:  # never leave a RUNNING goal behind
                sr.update(state="ERROR", reason=f"{type(e).__name__}: {str(e)[:200]}")
            O._stage(s, key, rec, "step_done", step=step["step_id"], state=sr["state"])
            if sr["state"] != STEP_OK or out is None:
                last = i == len(plan["steps"]) - 1
                rec.update(state="STOPPED" if sr["state"] == "STOPPED" else "REJECTED" if sr["state"] == "REJECTED" and last else "STEP_FAILED",
                           reason=f"step {step['step_id']} ({step['op']}): {sr['state']}" + (f" - {sr['reason']}" if sr["reason"] else ""))
                break
            vals["step:" + step["step_id"]] = out
        else:
            regs = [x for x in rec["steps"] if x["kind"] in ("registry", "discovered")]
            rec.update(state="VERIFIED", deliverable=rec["steps"][-1]["artifacts"],
                       mode="saved_result_replay" if regs and rec["replayed_steps"] == len(regs) else "executed")
        c1 = O._counters(s)
        rec["usage"] = {"container_runs": c1["container_runs"] - c0["container_runs"], "model_calls": c1["model_calls"] - c0["model_calls"],
                        "proposal_calls": c1["proposal_calls"] - c0["proposal_calls"]}
        if rec["usage"]["model_calls"] or rec["usage"]["proposal_calls"]:  # contract permits 0; never report success past it
            rec.update(state="POLICY_VIOLATION", reason="a model/proposal call was counted during a zero-model goal", deliverable=[])
        rec["completed_at"] = _now()
        O._stage(s, key, rec, "done", state=rec["state"])
        O._log(s, {"task_id": gid, "op": "goal", "mode": rec.get("mode") or "goal", "state": rec["state"], "reason": rec["reason"]})
        return rec
    finally:
        s.close()


def goals(store):
    """Latest 50 goal summaries for the console."""
    rows = [store.get(r["key"]) for r in store.db.execute("SELECT key FROM kv WHERE key LIKE 'operator/goal/%'").fetchall()]
    rows.sort(key=lambda g: g.get("submitted_at", ""), reverse=True)
    out = []
    for g in rows[:50]:
        exp = store.get("operator/discovery/" + g["experiment_id"]) if g.get("experiment_id") else None
        try:
            c = store.read_artifact(g["contract_ref"])
        except (OSError, ValueError, KeyError):
            c = {}
        out.append({"goal_id": g["goal_id"], "state": g["state"], "goal_text": c.get("goal_text"), "deliverable": c.get("deliverable"),
                    "inputs": [i["name"] for i in c.get("inputs", [])], "plan": [x["op"] + "(" + ",".join(x["inputs"]) + ")" for x in (g.get("plan") or {}).get("steps", [])],
                    "excluded": (g.get("plan") or {}).get("excluded", []), "steps": g.get("steps", []), "reason": g.get("reason"),
                    "gap_ref": g.get("gap_ref"), "missing_step": g.get("missing_step"), "partial_plan": g.get("partial_plan"),
                    "experiment_id": g.get("experiment_id"), "experiment_state": exp and exp["state"], "mode": g.get("mode"), "replayed_steps": g.get("replayed_steps"),
                    "deliverable_artifacts": g.get("deliverable", []), "usage": g.get("usage"), "contract_ref": g["contract_ref"]})
    return out
