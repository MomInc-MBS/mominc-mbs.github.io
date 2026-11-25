"""C3 capability-gap discovery: one frozen, bounded experiment per gap, judged by an independent evaluator process.

Proposer side only. This module never reads the private acceptance cases or their answers (it passes a directory NAME to
evaluator/c3/gen_private.py and evaluator/c3/evaluate.py, which run as separate `python -I` processes) and never produces a verdict:
it launches the evaluator and re-checks the hashes of the receipt it wrote. A passing candidate is NOT registered or executed
in goals here; admission is the next gate (C4)."""
from __future__ import annotations

import contextlib
import importlib.util
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

from . import experiment_compare as EC
from . import m2_model as M
from . import model_dispatch as MD
from . import m2_workflow as W
from . import operator_runtime as O
from .operator_runtime import Refused, _json, _now, _sha, _txn
from .storage import Store, _alive

ROOT = O.ROOT
EVAL_DIR = ROOT / "evaluator" / "c3"
APPROVAL = "build/c-series/c3_inference_approval.json"
PRIVATE = ROOT / ".hive" / "c3-private"  # only ever handed to the evaluator-side scripts as an argument
KEY, LEDGER = "operator/discovery/", "operator/discovery_ledger"
SCHEMA, RECEIPT_SCHEMA = "hive-c3-frozen-v1", "hive-c3-evaluation-receipt-v1"
TERMINAL = {"CANDIDATE_PASSED", "NO_QUALIFYING_CANDIDATE", "BUDGET_EXHAUSTED", "STOPPED", "MODEL_UNAVAILABLE"}
BUDGET = {"calls": 6, "proposals": 3, "container_runs": 12, "in_tokens": 36000, "out_tokens": 6000, "wall_s": 900, "max_tokens_per_call": 2000}
APPROVAL_CAPS = {"model_calls": 6, "proposals": 3, "container_runs": 12, "input_tokens": 36000, "output_tokens": 6000, "wall_minutes": 15}
PIN_FILES = ["evaluate.py", "oracle.py", "harness.py", "gen_private.py", "gen_public.py"]
SYSTEM = ("Reasoning: low\nYou write one pure Python 3 function. Reply with exactly one ```python code block that defines "
          "`def run(env: dict) -> str` and nothing after it. Use only the json module (`import json`); no file, network, os or sys access.")


_BARE = ("oracle", "gen_public", "gen_private", "harness", "evaluate", "baseline_script")


@contextlib.contextmanager
def c3_scope():
    """evaluator/c3 modules import each other by bare name (also at call time in evaluate()), and evaluator/m1 + m2
    reuse those names: hide cached bare modules inside the scope and restore them after, so neither family ever sees
    the other's (the pinned evaluator files stay unchanged). In-process calls into evaluate() must run in this scope."""
    saved, path = {n: sys.modules.pop(n) for n in _BARE if n in sys.modules}, list(sys.path)
    sys.path.insert(0, str(EVAL_DIR))
    try:
        yield
    finally:
        sys.path[:] = path  # the c3 modules also insert their own folder; drop that too
        for n in _BARE:
            sys.modules.pop(n, None)
        sys.modules.update(saved)


def _load(name):
    with c3_scope():
        spec = importlib.util.spec_from_file_location("c3_" + name, EVAL_DIR / f"{name}.py")
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        return mod


def evaluator_pin():
    return _sha("".join(f"{n}:{_sha((EVAL_DIR / n).read_bytes().replace(bytes([13, 10]), bytes([10])))}\n" for n in PIN_FILES))


def _read_lf(path):
    return Path(path).read_bytes().decode("utf-8").replace("\r\n", "\n")


def _write_lf(path, text):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_bytes(text.encode("utf-8"))


def pol():
    """The M2 client policy, narrowed to the C3 budget; the M2 policy file itself is untouched."""
    p = W.load_policy()
    p.update(max_model_calls=BUDGET["calls"], max_tokens_total=BUDGET["in_tokens"] + BUDGET["out_tokens"], transport_retries=0, call_timeout_s=240,
             approval_path=APPROVAL, approval_caps=APPROVAL_CAPS)
    p["sampling"] = dict(p["sampling"], temperature=0.2, max_tokens=BUDGET["max_tokens_per_call"])
    return p


def _keys(store):
    return [r["key"] for r in store.db.execute("SELECT key FROM kv WHERE key LIKE ?", (KEY + "%",)).fetchall()]


def experiments(store, gap_key=None):
    rows = [store.get(k) for k in _keys(store)]
    return sorted((r for r in rows if gap_key in (None, r["gap_key"])), key=lambda r: r["opened_at"])


def discoveries(store):
    return [{"exp_id": e["exp_id"], "gap_key": e["gap_key"], "state": e["state"], "reason": e.get("reason"), "ledger": e["ledger"],
             "candidate_sha256": e.get("candidate_sha256"), "report": e.get("report"), "baselines": e["baselines"]} for e in experiments(store)[-20:]]


def _zero(): return {"calls": 0, "proposals": 0, "container_runs": 0, "in_tokens": 0, "out_tokens": 0, "wall_s": 0.0, "estimated_tokens": False}


# ---------------------------------------------------------------- frozen protocol
def open_experiment(store, gap_key, *, private_dir=None, seed=None, budget=None):
    """Freeze the protocol, make the acceptance set (hash only comes back) and persist the experiment BEFORE any generation.
    Refuses when the gap has an open or passed experiment, has had 2 already, or is not a gap with a missing step. Never opens gaps."""
    gap = store.get(gap_key)
    if not gap or not gap.get("missing_step"):
        raise Refused("not a gap with a minimal missing step")

    def check():
        prior = experiments(store, gap_key)
        if any(e["state"] not in TERMINAL or e["state"] == "CANDIDATE_PASSED" for e in prior):
            raise Refused("this gap already has an open or passed experiment")
        if len(prior) >= 2:
            raise Refused("retry depth reached: at most 2 experiments per gap")
        return len(prior) + 1
    check()
    from . import goal_runner as G
    out = gap["missing_step"]["out"]
    dev = _load("gen_public").cases()
    try:
        p = subprocess.run([sys.executable, "-I", str(EVAL_DIR / "gen_private.py"), "--out", str(private_dir or PRIVATE)] + (["--seed", str(seed)] if seed is not None else []),
                           capture_output=True, text=True, timeout=120, check=True)
        acc = json.loads(p.stdout.strip().splitlines()[-1])
    except (OSError, subprocess.SubprocessError, ValueError, IndexError):
        raise Refused("the acceptance set could not be generated") from None
    base = _read_lf(EVAL_DIR / "baseline_script.py")
    ms = gap["missing_step"]
    frozen = {"schema": SCHEMA, "gap": {"key": gap_key, "signature": ms, "partial_plan": gap.get("partial_plan")},
              "behaviour_spec": G.types()["types"][out]["behaviour_spec"],
              "io_envelope": {"input": "env {\"files\":[{\"format\":\"json\",\"text\":BEFORE},{\"format\":\"json\",\"text\":AFTER}]} (input:0 = before, input:1 = after)",
                              "candidate": "def run(env: dict) -> str"},
              "output_canonical_form": "json.dumps(obj, sort_keys=True, separators=(',', ':'))",
              "dev_set_sha256": _sha(_json(dev)), "acceptance": {"set_sha256": acc["set_sha256"], "n": acc["n"], "note": "hash only; cases and answers stay in .hive/c3-private"},
              "evaluator": {"path": "evaluator/c3/evaluate.py", "pin": evaluator_pin()},
              "baselines": {"unchanged_hive": "no capability for the gap: expected 0/n (measured by the planner refusing)",
                            "scripted": {"path": "evaluator/c3/baseline_script.py", "sha256": _sha(base), "label": "hand-written, evaluated like a candidate"},
                            "matched_budget_m2_views_search": "not expressible: no M2 view produces inventory_diff (views: identity, parse_whole, split_rows, aggregate, to_json, each); not run"},
              "budget": dict(BUDGET, **(budget or {})), "proposer": {"model": "openai/gpt-oss-20b", "approval": APPROVAL, "sampling": "temperature 0.2, max_tokens 2000, Reasoning: low"},
              "admission_criteria": ["static check clean", "perfect on the 6 public dev cases", "independent evaluator PASS on every acceptance case (pass_count == n)",
                                     "receipt hashes re-checked against this frozen protocol", "within budget", "registration/execution is NOT part of C3 (admission gate C4)"],
              "attempt": None}
    with _txn(store):
        frozen["attempt"] = check()
        sha = _sha(_json(frozen))
        rec = {"exp_id": "d-" + sha[:20], "frozen_sha": sha, "frozen": frozen, "gap_key": gap_key, "state": "OPEN", "opened_at": _now(), "pid": None,
               "ledger": _zero(), "proposals": [], "calls": [], "baselines": {}, "feedback": "", "stages": [{"stage": "frozen", "at": _now()}]}
        store.set(KEY + rec["exp_id"], rec)
        if not store.get(LEDGER):
            store.set(LEDGER, _zero())
    return rec


# ---------------------------------------------------------------- budget
def _save(store, rec): store.set(KEY + rec["exp_id"], rec)


def _spend(store, rec, **kw):
    """Add to the experiment ledger and the global ledger together (one transaction), and persist."""
    with _txn(store):
        g = store.get(LEDGER) or _zero()
        for k, v in kw.items():
            g[k] = g.get(k, 0) + v
            rec["ledger"][k] = rec["ledger"].get(k, 0) + v
        store.set(LEDGER, g)
        _save(store, rec)


def _left(store, rec, k):
    g = store.get(LEDGER) or _zero()
    return min(rec["frozen"]["budget"][k] - rec["ledger"][k], BUDGET[k] - g[k])


class _End(Exception):
    def __init__(self, state, reason):
        super().__init__(reason)
        self.state, self.reason = state, reason


def _gate(store, rec, clock, stop_path, **need):
    """Checked BEFORE every call/run: STOP, wall, then every needed allowance. Raises _End; never lets a limit be crossed."""
    now = time.monotonic()
    _spend(store, rec, wall_s=now - clock[0])
    clock[0] = now
    if Path(stop_path).exists():
        raise _End("STOPPED", "STOP is set; nothing further ran")
    if _left(store, rec, "wall_s") <= 0:
        raise _End("BUDGET_EXHAUSTED", "wall_s exhausted")
    for k, n in need.items():
        if _left(store, rec, k) < n:
            raise _End("BUDGET_EXHAUSTED", f"{k} exhausted (need {n}, {_left(store, rec, k)} left)")


# ---------------------------------------------------------------- proposals
def prompt(rec, dev):
    """Frozen behaviour spec + public dev cases + the previous candidate's dev failures. Nothing else."""
    ex = "\n".join(f"- {c['name']}\n  input: {json.dumps(c['env'], separators=(',', ':'))}\n  expected: {c['expected']}" for c in dev)
    user = f"{rec['frozen']['behaviour_spec']}\n\nWorked cases (input env -> expected return value):\n{ex}\n"
    if rec["feedback"]:
        user += f"\nYour previous candidate failed on the cases above (truncated):\n{rec['feedback']}\n"
    return [{"role": "system", "content": SYSTEM}, {"role": "user", "content": user}]


def extract_code(content):
    blocks = re.findall(r"```(?:python|py)?[ \t]*\n(.*?)```", content or "", re.S)
    body = next((b for b in reversed(blocks) if "def run" in b), None)
    if body is None and "```" not in (content or "") and "def run" in (content or ""):
        body = content
    return body.strip("\n") + "\n" if body else None


def _dev_run(body, dev, harness):
    out = json.loads(EC.run_isolated(harness.wrap(body), json.dumps([c["env"] for c in dev]), {}, timeout=60, backend="container", operator_class="generated"))
    fails = [f"case {c['name']}: expected {c['expected'][:300]} got {str(o)[:300]}" for c, o in zip(dev, out) if o != c["expected"]]
    return {"n": len(dev), "pass_count": len(dev) - len(fails)}, "\n".join(fails[:3])[:1500]


# ---------------------------------------------------------------- evaluator
def _launch(args):
    return subprocess.run([sys.executable, "-I", str(EVAL_DIR / "evaluate.py")] + args, capture_output=True, text=True, timeout=400)


def receipt_problems(rec, r, cand_sha, label):
    """Re-check a receipt the evaluator wrote. Discovery cannot make or change a verdict; it only refuses receipts that do not match."""
    fz, bad = rec["frozen"], []
    want = {"schema": RECEIPT_SCHEMA, "label": label, "exp_id": rec["exp_id"], "frozen_sha": rec["frozen_sha"], "candidate_sha256": cand_sha,
            "acceptance_set_sha256": fz["acceptance"]["set_sha256"], "n": fz["acceptance"]["n"]}
    bad += [k for k, v in want.items() if r.get(k) != v]
    if (r.get("evaluator") or {}).get("pin") != fz["evaluator"]["pin"]:
        bad.append("evaluator pin")
    if r.get("verdict") != ("PASS" if r.get("pass_count") == r.get("n") else "FAIL"):
        bad.append("verdict")
    if r.get("receipt_sha256") != _sha(json.dumps({k: v for k, v in r.items() if k != "receipt_sha256"}, sort_keys=True, separators=(",", ":"))):
        bad.append("receipt_sha256")
    return bad


def _evaluate(rec, outdir, body_path, label, private_dir, baseline_receipt=None):
    body = _read_lf(body_path)
    cand = _sha(body)
    out = Path(outdir) / f"receipt-{label}-{cand[:12]}.json"
    out.unlink(missing_ok=True)
    args = ["--exp", rec["exp_id"], "--frozen-sha", rec["frozen_sha"], "--candidate-file", str(body_path), "--candidate-sha", cand, "--private", str(private_dir or PRIVATE),
            "--set", rec["frozen"]["acceptance"]["set_sha256"], "--out", str(out), "--label", label] + (["--baseline-receipt", str(baseline_receipt)] if baseline_receipt else [])
    p = _launch(args)
    if not out.exists():
        raise RuntimeError(f"evaluator produced no receipt (exit {p.returncode}): {(p.stderr or p.stdout)[-200:]}")
    r = json.loads(out.read_text(encoding="utf-8"))
    bad = receipt_problems(rec, r, cand, label)
    if bad:
        raise RuntimeError("receipt rejected: " + ", ".join(bad))
    return r, out


def _summ(r): return {k: r[k] for k in ("pass_count", "n", "verdict", "receipt_sha256", "candidate_sha256")}


# ---------------------------------------------------------------- run
def run_experiment(store_root, exp_id, *, stop_path=None, stub_endpoint=None, private_dir=None, requested_model=None, dispatch_cfg=None):
    """Run or resume one experiment to a terminal state. Budget is the frozen one, minus whatever the ledgers already show spent."""
    store_root = Path(store_root)
    stop_path = Path(stop_path or store_root / "STOP")
    s = Store(store_root)
    try:
        rec = s.get(KEY + exp_id)
        if not rec:
            raise Refused("unknown experiment")
        if rec["state"] in TERMINAL:
            return rec
        if rec["state"] == "RUNNING" and isinstance(rec.get("pid"), int) and rec["pid"] != os.getpid() and _alive(rec["pid"]):
            raise Refused("experiment is running in another process")
        rec.update(state="RUNNING", pid=os.getpid(), reason=None)
        rec["stages"].append({"stage": "resume" if rec["ledger"]["calls"] or rec["baselines"] else "start", "at": _now()})
        _save(s, rec)
        clock, outdir = [time.monotonic()], store_root / "discovery" / exp_id
        try:
            _loop(s, rec, outdir, clock, stop_path, stub_endpoint, private_dir, requested_model, dispatch_cfg)
        except _End as e:
            rec.update(state=e.state, reason=e.reason)
        except M.CapReached as e:
            rec.update(state="BUDGET_EXHAUSTED", reason=f"model client cap: {e}")
        except (M.Refused, M.Invalidated, RuntimeError, OSError, ValueError, subprocess.SubprocessError) as e:
            rec.update(state="INTERRUPTED", reason=f"{type(e).__name__}: {str(e)[:300]} (resumable; the ledger is kept)")
        rec["stages"].append({"stage": rec["state"].lower(), "at": _now()})
        _spend(s, rec, wall_s=time.monotonic() - clock[0])
        if rec["state"] in TERMINAL:
            rec["completed_at"] = _now()
            _save(s, rec)
            with _txn(s):  # the gap stays OPEN; no candidate is promoted
                g = s.get(rec["gap_key"])
                g["discovery"] = {"experiment": exp_id, "state": rec["state"], "reason": rec.get("reason"), "ledger": rec["ledger"], "at": _now()}
                s.set(rec["gap_key"], g)
        _save(s, rec)
        return rec
    finally:
        s.close()


def _loop(s, rec, outdir, clock, stop_path, stub_endpoint, private_dir, requested_model=None, dispatch_cfg=None):
    harness, gen_public = _load("harness"), _load("gen_public")
    dev, B, fz = gen_public.cases(), rec["frozen"]["budget"], rec["frozen"]
    if _sha(_json(dev)) != fz["dev_set_sha256"] or evaluator_pin() != fz["evaluator"]["pin"]:
        raise _End("INTERRUPTED", "dev set or evaluator no longer matches the frozen protocol")
    outdir.mkdir(parents=True, exist_ok=True)
    # -- baselines, measured up front (the unchanged-HIVE one is the planner refusing)
    if "unchanged_hive" not in rec["baselines"]:
        from . import goal_runner as G
        sig = fz["gap"]["signature"]
        steps = G.plan_goal(s, {"deliverable": sig["out"], "budget": {"max_steps": 6}, "inputs": [{"type": "inventory_file"}] * sig["arity"]})["steps"]
        rec["baselines"]["unchanged_hive"] = {"pass_count": 0 if not steps else None, "n": fz["acceptance"]["n"], "basis": f"planner returned {len(steps)} steps for the gap"}
        _save(s, rec)
    if "scripted" not in rec["baselines"]:
        _gate(s, rec, clock, stop_path, container_runs=1)
        _spend(s, rec, container_runs=1)
        bp = outdir / "baseline.py"
        _write_lf(bp, _read_lf(EVAL_DIR / "baseline_script.py"))
        r, path = _evaluate(rec, outdir, bp, "scripted_baseline", private_dir)
        rec["baselines"]["scripted"] = dict(_summ(r), receipt_path=path.name, label="hand-written")
        _save(s, rec)
    requested, weights_ok = requested_model or fz["proposer"]["model"], False
    seen = {p["sha256"] for p in rec["proposals"]}
    while True:
        if rec["ledger"]["proposals"] >= B["proposals"]:
            raise _End("NO_QUALIFYING_CANDIDATE", f"{B['proposals']} distinct proposals evaluated, none passed")
        msgs = prompt(rec, dev)
        _gate(s, rec, clock, stop_path, calls=1, proposals=1, in_tokens=len(msgs[0]["content"] + msgs[1]["content"]) // 4 + 1, out_tokens=256)
        n = rec["ledger"]["calls"] + 1
        d = dict(MD.plan(outdir.parents[1], "c3-proposal", requested, dispatch_cfg), call_id=f"{rec['exp_id']}:{n}")
        p, ex = pol(), d["executed_model"]
        p["sampling"]["max_tokens"] = min(B["max_tokens_per_call"], _left(s, rec, "out_tokens"))
        model, why = None, "NO_EXECUTABLE_MODEL"
        if ex:  # validate identity and readiness BEFORE any call: qualified, context fits, endpoint lists it loaded
            p["model"] = dict(p["model"], id=ex)
            need = (len(msgs[0]["content"] + msgs[1]["content"]) // 4 + 1) + p["sampling"]["max_tokens"]
            try:
                if need > (d["context"].get(ex) or 0):
                    why = "CONTEXT_DOES_NOT_FIT"
                else:
                    why, model = "MODEL_NOT_LOADED", M.Model(outdir / "model", stub=bool(stub_endpoint), endpoint=stub_endpoint, pol=p, approval_path=ROOT / APPROVAL)
                    if not stub_endpoint and not weights_ok:
                        model.check_weights("c3-run")
                        weights_ok = True
                    model.list_models()
                    if MD.loaded(model.endpoint, ex) is False:
                        raise M.Invalidated(f"{ex} is listed but not loaded")
            except (M.Refused, M.Invalidated, OSError, ValueError, KeyError) as e:
                model, why = None, f"{why}: {type(e).__name__}: {str(e)[:200]}"
        if model is None:  # fallback P0: no model, no call, ledger untouched
            _dispatched(s, rec, outdir, d, error=why)
            raise _End("MODEL_UNAVAILABLE", f"fallback P0: {why}")
        _spend(s, rec, calls=1)  # counted at the start: an interrupted call is still a call
        try:
            res = model.call("c3_proposal", msgs, 2026300000 + n)
        except M.Invalidated as e:  # the endpoint reported a different model id: refused, recorded, not used
            _dispatched(s, rec, outdir, d, model, error=f"reply verification failed: {str(e)[:200]}")
            raise _End("MODEL_UNAVAILABLE", f"fallback P0: reply verification failed: {str(e)[:200]}") from None
        _dispatched(s, rec, outdir, d, model, error=None if res["status"] == "ok" else "transport_failure")
        if res["status"] != "ok":
            raise _End("MODEL_UNAVAILABLE", "fallback P0: transport_failure (no retry beyond transport_retries)")
        content, u = res["content"], res["usage"]
        est = not (u.get("prompt_tokens") is not None and u.get("completion_tokens") is not None)
        tin, tout = (len(msgs[0]["content"] + msgs[1]["content"]) // 4, len(content) // 4) if est else (int(u["prompt_tokens"]), int(u["completion_tokens"]))
        _spend(s, rec, in_tokens=tin, out_tokens=tout)
        rec["ledger"]["estimated_tokens"] = rec["ledger"]["estimated_tokens"] or est
        (outdir / f"reply-{n}.txt").write_text(content, encoding="utf-8", newline="\n")
        body = extract_code(content) if res["status"] == "ok" else None
        rec["calls"].append({"n": n, "status": res["status"], "in_tokens": tin, "out_tokens": tout, "estimated": est, "has_code": bool(body)})
        _save(s, rec)
        if not body:
            continue
        h = _sha(body)
        if h in seen:
            rec["calls"][-1]["duplicate_of"] = h
            continue
        seen.add(h)
        _spend(s, rec, proposals=1)
        prop = {"n": n, "sha256": h, "static": harness.static_problems(body), "dev": None, "acceptance": None}
        rec["proposals"].append(prop)
        _write_lf(outdir / f"cand-{h}.py", body)
        if prop["static"]:
            rec["feedback"] = "static check refused it: " + "; ".join(prop["static"])
            _save(s, rec)
            continue
        _gate(s, rec, clock, stop_path, container_runs=1)
        _spend(s, rec, container_runs=1)
        try:
            prop["dev"], rec["feedback"] = _dev_run(body, dev, harness)
        except Exception as e:  # crash/timeout/bad output: nothing passed
            prop["dev"], rec["feedback"] = {"n": len(dev), "pass_count": 0, "error": f"{type(e).__name__}: {str(e)[:200]}"}, f"it crashed or timed out: {type(e).__name__}"
        _save(s, rec)
        if prop["dev"]["pass_count"] != prop["dev"]["n"]:
            continue
        _gate(s, rec, clock, stop_path, container_runs=1)
        _spend(s, rec, container_runs=1)
        r, path = _evaluate(rec, outdir, outdir / f"cand-{h}.py", "candidate", private_dir, outdir / rec["baselines"]["scripted"]["receipt_path"])
        prop["acceptance"] = _summ(r)
        rec["feedback"] = f"it passed all dev cases but failed {r['n'] - r['pass_count']} of {r['n']} hidden acceptance cases (details withheld)"
        if r["verdict"] == "PASS":
            ties = r["pass_count"] == rec["baselines"]["scripted"]["pass_count"]
            rec.update(candidate_sha256=h, receipt=dict(_summ(r), path=path.name), report={
                "candidate_sha256": h, "evaluator_receipt_sha256": r["receipt_sha256"], "pass_count": r["pass_count"], "n": r["n"], "baselines": rec["baselines"],
                "note": ("The candidate only ties the hand-written scripted baseline: mechanism evidence, NOT a learning advantage." if ties else "Differs from the scripted baseline.")
                        + " Awaiting admission (C4); not registered, not executed in goals."})
            raise _End("CANDIDATE_PASSED", "independent evaluator PASS; awaiting admission")
        _save(s, rec)


def _dispatched(s, rec, outdir, d, model=None, error=None):
    """One append-only dispatch record (JSONL beside the model log) plus a copy on the experiment record."""
    row = (model.ledger() or [{}])[-1] if model else {}
    u = row.get("usage") or {}
    r = MD.record(outdir / "model", {k: v for k, v in d.items() if k != "context"}, reported_model=row.get("response_model"), latency_s=row.get("latency_s"),
                  tokens_in=u.get("prompt_tokens"), tokens_out=u.get("completion_tokens"), error=error, called=bool(row))
    rec.setdefault("dispatches", []).append(r)
    _save(s, rec)


def recover(store_root):
    """After a crash: RUNNING experiments (not owned by another live process) become INTERRUPTED. Resume keeps the same ledger."""
    s, n = Store(store_root), 0
    try:
        for e in experiments(s):
            pid = e.get("pid")
            if e["state"] == "RUNNING" and not (isinstance(pid, int) and pid != os.getpid() and _alive(pid)):
                e["state"] = "INTERRUPTED"
                e["stages"].append({"stage": "interrupted", "at": _now()})
                _save(s, e)
                n += 1
        return n
    finally:
        s.close()
