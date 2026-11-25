"""Slice E: preregistered, independent comparison of a repair candidate (v0.4.x). Tool-only, zero model requests.

Reuses the existing machinery instead of a new framework: ExperimentDriver (pinned fetch + frozen-check run + diagnosis),
experiment_verify (frozen verifier), metric_engine.paired_summary (paired uncertainty) and review_gate.evaluate (promotion
contract; it can only ever say QUARANTINE/REJECT here: n<24 and no independent reviewer). A candidate is DATA (a rule from the
driver's diagnosis) run by this fixed interpreter; it has no write access to the evaluator, which is hash-checked before/after.

Arms: P0 (incumbent, unchanged), deterministic tool baselines (strongest chosen by a rule frozen in the plan), a fixed-specialist
route (N/A: no model route is approved), a learning-disabled control, and the candidate(s). Partitions are materialised, hashed
and written to partitions.frozen.json BEFORE any arm runs. Variants are ENGINEERED (seeded mutations of the pinned bases).
"""
from __future__ import annotations

import copy
import csv
import hashlib
import inspect
import io
import json
import os
import random
import re
import statistics
import subprocess
import sys
import tempfile
import textwrap
import time
from functools import partial
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable

from . import experiment_tool, experiment_verify
from .experiment_driver import DEFAULT_ALLOWLIST, ExperimentDriver, ExperimentError, _sha
from .metric_engine import paired_summary
from .storage import Store
from .review_gate import evaluate as review_gate_evaluate

SCHEMA = "hive-ooda-compare-v1"
STEPS = ("earlier_tasks", "development", "test", "next_source")
HELD_OUT = ("test", "next_source")
SCORED = ("development", "test", "next_source")  # `earlier_tasks` only guards regression
KINDS = ("REAL_PINNED", "ENGINEERED")  # never "unseen" / Level A: those labels are not available here


def _h(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def _rows(text):
    return list(csv.reader(io.StringIO(text, newline="")))


def _dump(rows, eol):
    buf = io.StringIO()
    csv.writer(buf, lineterminator=eol).writerows(rows)
    return buf.getvalue()


# ---- seeded ENGINEERED mutations (deterministic; disclosed in the plan) -------------------------------------------
def mutate(text: str, spec: dict) -> str:
    rows, eol = _rows(text), "\r\n" if "\r\n" in text else "\n"
    rng, op = random.Random(spec["seed"]), spec["op"]
    body = list(range(1, len(rows)))
    if op in ("inject_article", "inject_compliant_article"):
        arts = ("The", "A", "An") if op == "inject_article" else ("the", "a", "an")
        for i in rng.sample(body, spec["count"]):
            rows[i][0] += f" ({rng.choice(arts)})"
    elif op == "inject_duplicate_key":  # defect no repair rule can fix
        i, j = rng.sample(body, 2)
        rows[j][1] = rows[i][1]
    else:
        raise ExperimentError(f"unknown mutation op {op!r}")
    return _dump(rows, eol)


# ---- procedures: text -> text.  P0 = unchanged incumbent; baselines/candidates only rewrite text --------------------
def identity(text, checks):
    return text


def scrub_lowercase(text, checks):
    return re.sub(checks["forbid_pattern"], lambda m: m.group(0).lower(), text)


def scrub_delete(text, checks):
    return re.sub(r"[ \t]*(?:" + checks["forbid_pattern"] + ")", "", text)


# tool_profile_only = the existing csv_profile_v1 tool: it profiles and emits the data unchanged (same output as P0).
BASELINES: dict[str, Callable] = {"tool_profile_only": identity, "tool_scrub_delete": scrub_delete, "tool_scrub_lowercase": scrub_lowercase}


# FR-2: candidates are SOURCE TEXT defining `apply(text, checks) -> str`. They run in a separate `python -I` process (its own process
# tree: Job Object on Windows, process group on POSIX) that reads (source, text, checks copy) from a file and writes only output text to
# a file; there are no pipes a grandchild could hold open. Scoring/verifier/collateral/dedup stay in the parent.
_RUNNER = ("import sys,json\n"
           "d=json.load(open(sys.argv[1],encoding='utf-8'));sys.stdout=sys.stderr=open(__import__('os').devnull,'w')\n"
           "g={'__name__':'candidate'};exec(compile(d['source'],'candidate','exec'),g)\n"
           "o=json.dumps({'out':g['apply'](d['text'],d['checks'])})\n"
           "open(sys.argv[2],'w',encoding='utf-8').write(o)\n")
TIMEOUT_S, MAX_OUT = 10, 1 << 20


def _new_job():
    """Windows: Job Object that kills every process in it when its handle closes (stdlib ctypes). Returns (assign, close) or None."""
    import ctypes
    from ctypes import wintypes as w
    k = ctypes.WinDLL("kernel32", use_last_error=True)
    k.CreateJobObjectW.restype = w.HANDLE
    k.CreateJobObjectW.argtypes = [ctypes.c_void_p, w.LPCWSTR]
    k.SetInformationJobObject.argtypes = [w.HANDLE, ctypes.c_int, ctypes.c_void_p, w.DWORD]
    k.AssignProcessToJobObject.argtypes = [w.HANDLE, w.HANDLE]
    k.CloseHandle.argtypes = [w.HANDLE]

    class Basic(ctypes.Structure):
        _fields_ = [("a", ctypes.c_int64), ("b", ctypes.c_int64), ("LimitFlags", w.DWORD), ("c", ctypes.c_size_t), ("d", ctypes.c_size_t),
                    ("e", w.DWORD), ("f", ctypes.c_size_t), ("g", w.DWORD), ("h", w.DWORD)]

    class Ext(ctypes.Structure):
        _fields_ = [("Basic", Basic), ("io", ctypes.c_uint64 * 6), ("p", ctypes.c_size_t), ("j", ctypes.c_size_t), ("pk", ctypes.c_size_t), ("pj", ctypes.c_size_t)]

    job = k.CreateJobObjectW(None, None)
    info = Ext()
    info.Basic.LimitFlags = 0x2000  # JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE
    if not job or not k.SetInformationJobObject(job, 9, ctypes.byref(info), ctypes.sizeof(info)):
        raise OSError("cannot create job object")
    return (lambda p: k.AssignProcessToJobObject(job, int(p._handle))), (lambda: k.CloseHandle(job))


# Container transport: the JSON result goes to a dup of fd 1 (made before the candidate can silence stdout); the parent reads it
# through DockerIsolation's stdout cap. No writable mount exists, so there is no host disk/symlink channel.
_CRUNNER = _RUNNER.replace("sys.stdout=sys.stderr=", "w=__import__('os').fdopen(__import__('os').dup(1),'w',encoding='utf-8');sys.stdout=sys.stderr=", 1)
_CRUNNER = _CRUNNER.replace("open(sys.argv[2],'w',encoding='utf-8').write(o)", "w.write(o);w.flush()")


def _run_container(source, text, checks, timeout, max_out):
    """FR-8: DockerIsolation (no network, ro root, cap-drop ALL, pids/mem limits, non-root); only in.json is mounted (ro).
    No hive package inside. Fails closed (SandboxUnavailable)."""
    from .adapters.isolation import DockerIsolation, PINNED_IMAGE
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        (Path(tmp) / "in.json").write_text(json.dumps({"source": source, "text": text, "checks": checks}), encoding="utf-8")
        cap = max_out + 64
        res = DockerIsolation().execute({
            "repo_copy": tmp, "image": PINNED_IMAGE,
            "limits": {"memory_mb": 128, "cpu_count": 1, "pids": 32, "timeout_s": timeout, "output_bytes": cap},
            "command": ["python", "-I", "-c", _CRUNNER, "/work/in.json"]})
        stdout = res.receipt["stdout"]
        if len(stdout) >= cap:
            raise RuntimeError(f"candidate output exceeds {max_out} bytes")
        if res.receipt["timed_out_or_output_capped"]:
            raise RuntimeError(f"candidate timed out after {timeout}s")
        if res.state != "passed":
            raise RuntimeError(f"candidate process failed (exit {res.receipt['exit_code']})")
        try:
            out = json.loads(stdout).get("out")
        except ValueError:
            raise RuntimeError("candidate output is not valid JSON") from None
        if not isinstance(out, str):
            raise RuntimeError("candidate returned non-text")
        return out


def run_isolated(source: str, text: str, checks: dict, timeout=TIMEOUT_S, max_out=MAX_OUT, *, backend="process", operator_class="data_rule") -> str:
    from .lineage import CONTAINER_OPERATORS
    if operator_class in CONTAINER_OPERATORS and backend != "container":
        raise RuntimeError(f"operator class {operator_class!r} must run with backend='container' (FR-8); refusing {backend!r}")
    if backend == "container":
        return _run_container(source, text, checks, timeout, max_out)
    if backend != "process":
        raise ValueError(f"unknown backend {backend!r}")
    env = {k: os.environ[k] for k in ("SYSTEMROOT",) if k in os.environ}  # minimal env (Windows needs SYSTEMROOT)
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as cwd:
        inp, outp = os.path.join(cwd, "in.json"), os.path.join(cwd, "out.json")
        Path(inp).write_text(json.dumps({"source": source, "text": text, "checks": checks}), encoding="utf-8")
        win = os.name == "nt"
        job = _new_job() if win else None
        p = subprocess.Popen([sys.executable, "-I", "-c", _RUNNER, inp, outp], stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL,
                             stderr=subprocess.DEVNULL, env=env, cwd=cwd, start_new_session=not win)
        try:
            if job:
                job[0](p)
            try:
                p.wait(timeout)
            except subprocess.TimeoutExpired:
                raise RuntimeError(f"candidate timed out after {timeout}s") from None
        finally:  # kill the whole tree whatever happened: no orphan may outlive the arm
            if job:
                p.kill()
                job[1]()
            else:
                try:
                    os.killpg(p.pid, 9)
                except OSError:
                    pass
            p.wait()
        if p.returncode != 0:
            raise RuntimeError(f"candidate process failed (exit {p.returncode})")
        if os.path.getsize(outp) > max_out + 64:  # JSON escaping adds a little; cap is on the order of max_out bytes
            raise RuntimeError(f"candidate output exceeds {max_out} bytes")
        out = json.loads(Path(outp).read_text(encoding="utf-8")).get("out")
        if not isinstance(out, str):
            raise RuntimeError("candidate returned non-text")
        return out


def _scrub_lowercase_source():
    return "import re\n" + textwrap.dedent(inspect.getsource(scrub_lowercase)).replace("def scrub_lowercase", "def apply")


@dataclass
class Candidate:
    id: str
    apply: str  # source text defining apply(text, checks); executed only by run_isolated
    rule: str
    provenance: dict
    parent_hash: str
    operator_class: str = "data_rule"  # generated/code classes are forced onto the container backend (see run_isolated)
    status: str = "QUARANTINED"
    record: dict = field(default_factory=dict)

    @property
    def backend(self):
        # FR-9: the class is caller-declared, so the process backend is earned by source identity, not by label.
        return "process" if self.operator_class == "data_rule" and self.apply in _builtin_sources() else "container"


def _builtin_sources():
    return {_scrub_lowercase_source()}


def make_candidate(diagnosis: dict | None, p0_hash: str, learning: bool = True) -> Candidate | None:
    """Candidate from the driver's diagnosis. learning=False is the learning-disabled control: no diagnosis input -> no rule."""
    rep = (diagnosis or {}).get("proposed_repair") if learning else None
    if not rep:
        return None
    pre = "lowercase matches of "
    if rep.get("status") != "PROPOSED_QUARANTINED_NOT_APPLIED" or not str(rep.get("rule", "")).startswith(pre):
        raise ExperimentError("diagnosis repair is not an unapplied quarantined lowercase rule; refusing to interpret it")
    return Candidate("C1-lowercase-forbidden-article", _scrub_lowercase_source(), rep["rule"],
                     {"source": "driver diagnosis", "failure_class": diagnosis["class"], "experiment_id": diagnosis["experiment_id"],
                      "diagnosis_sha256": _sha(diagnosis), "cells_changed_claimed": rep["cells_changed"]}, p0_hash)


# ---- evaluator ---------------------------------------------------------------------------------------------------
def collateral(item_text: str, out_text: str, checks: dict) -> list:
    """Evaluator-side: an arm may only change cells that violate the forbidden style; anything else is damage."""
    a, b = _rows(item_text), _rows(out_text)
    if len(a) != len(b) or any(len(x) != len(y) for x, y in zip(a, b)):
        return ["shape changed"]
    bad = re.compile(checks["forbid_pattern"])
    return [f"cell ({i},{j}) changed though not violating" for i, (x, y) in enumerate(zip(a, b)) for j, (c, d) in enumerate(zip(x, y))
            if c != d and not bad.search(c)][:5]


def cells_changed(a: str, b: str) -> int:
    ra, rb = _rows(a), _rows(b)
    return sum(c != d for x, y in zip(ra, rb) for c, d in zip(x, y)) + abs(len(ra) - len(rb))


class _Scorer:
    def __init__(self):
        self.cache, self.hits = {}, 0

    def score(self, item, proc, label):
        t0 = time.perf_counter_ns()
        try:
            out = proc(item["text"], copy.deepcopy(item["checks"]))  # an arm cannot mutate evaluator state
            err = None
        except Exception as exc:  # a crashing candidate is a failed arm, never a crash of the evaluator
            out, err = None, f"{type(exc).__name__}: {exc}"[:200]
        ns = time.perf_counter_ns() - t0
        if out is None or not isinstance(out, str):
            return {"passed": False, "out_sha256": None, "failures": [err or "arm returned no text"], "cells_changed": None, "runtime_ns": ns}
        key = (item["sha256"], _h(out.encode()), _sha([item["checks"], item["expected"], item["verifier"]]))  # de-duplicate identical executions (same input + same output)
        if key in self.cache:
            self.hits += 1
            res = self.cache[key]
        else:
            same = out == item["text"]
            v = experiment_verify.VERIFIERS[item["verifier"]](out.encode(), item["checks"], experiment_tool.csv_profile_v1(out),
                                                              item["expected"] if same and item["expected"] else None)
            dmg = [] if same else collateral(item["text"], out, item["checks"])
            res = {"passed": v["verdict"] == "pass" and not dmg, "out_sha256": key[1], "failures": v["failures"] + dmg,
                   "cells_changed": cells_changed(item["text"], out)}
            self.cache[key] = res
        return {**res, "runtime_ns": ns}


# ---- run ---------------------------------------------------------------------------------------------------------
def _guarded_files(plan_path, plan, root):
    here = Path(__file__).resolve().parent
    files = [here / n for n in ("experiment_verify.py", "experiment_tool.py", "experiment_compare.py", "metric_engine.py", "review_gate.py")]
    files += [Path(plan_path)] + [Path(plan_path).parent / v for v in plan["manifests"].values()]
    return {Path(f).name: _h(Path(f).read_bytes()) for f in files}


def _load_items(plan, plan_dir, driver, out):
    bases, fetch = {}, {}
    for key, rel in plan["manifests"].items():
        m = json.loads((plan_dir / rel).read_text(encoding="utf-8-sig"))
        res = driver.run(m)
        r = res.get("receipt")
        if not r:
            raise ExperimentError(f"base experiment {m['experiment_id']} did not finish: {res.get('status')}")
        s, repo = m["source"], driver.workdir / m["experiment_id"] / "repo"
        # Zero git/network here: reuse the observation the hermetic driver fetched and stored (FINAL_REVIEW #1).
        st = Store(driver.root)
        try:
            raw = st.read_artifact(r["artifacts"]["observation_ref"])["text"].encode("utf-8")
        finally:
            st.close()
        if _h(raw) != m["expected"]["sha256"]:
            raise ExperimentError(f"base {key}: fetched bytes differ from frozen sha256")
        bases[key] = {"m": m, "text": raw.decode("utf-8"), "driver_verdict": res["status"], "receipt": r}
        objs = [f.stat().st_size for f in (repo / "objects").rglob("*") if f.is_file()] if (repo / "objects").is_dir() else []
        fetch[key] = {"experiment_id": m["experiment_id"], "driver_verdict": res["status"], "net_calls": r["net_calls"],
                      "fetch_attempts": r["fetch_attempts"], "model_dispatches": r["model_dispatches"], "consumption_unchanged": r["consumption_unchanged"],
                      "blob_bytes": len(raw), "repo_object_bytes": sum(objs), "receipt_body_sha256": r["receipt_body_sha256"]}
    parts, seen = {p: [] for p in STEPS}, {}
    for part in STEPS:
        for spec in plan["partitions"].get(part, []):
            if spec["kind"] not in KINDS or spec["id"] in seen:
                raise ExperimentError(f"bad kind or duplicate id: {spec['id']} ({spec['kind']}); allowed {KINDS}")
            b = bases[spec["base"]]
            if spec["kind"] == "ENGINEERED":
                text, mut = mutate(b["text"], spec["mutation"]), spec["mutation"]
            else:
                text, mut = b["text"], None
            item = {"id": spec["id"], "kind": spec["kind"], "partition": part, "base": spec["base"], "mutation": mut, "text": text,
                    "sha256": _h(text.encode()), "bytes": len(text.encode()), "checks": b["m"]["checks"], "verifier": b["m"]["verifier"],
                    "expected": b["m"]["expected"] if spec["kind"] == "REAL_PINNED" else None}
            seen[spec["id"]] = item
            parts[part].append(item)
    # disjointness: a held-out input must not be byte-identical to an earlier/development input (aliases within a partition are recorded)
    guard = {it["sha256"] for p in ("earlier_tasks", "development") for it in parts[p]}
    clash = [it["id"] for p in HELD_OUT for it in parts[p] if it["sha256"] in guard]
    if clash:
        raise ExperimentError(f"held-out items duplicate earlier/development inputs: {clash}")
    return bases, fetch, parts


def _freeze(parts, out, plan_sha256):
    desc = {p: [{k: it[k] for k in ("id", "kind", "base", "mutation", "sha256", "bytes")} for it in items] for p, items in parts.items()}
    hashes = {p: _sha(d) for p, d in desc.items()}
    frozen = {"schema": SCHEMA, "plan_sha256": plan_sha256, "partitions": desc, "partition_sha256": hashes, "freeze_sha256": _sha(hashes),
              "note": "ENGINEERED variants are seeded mutations of the two pinned sources; they are NOT unseen research data and NOT Level A."}
    prev = out / "partitions.frozen.json"
    if prev.exists():
        old = json.loads(prev.read_text(encoding="utf-8"))
        if (old.get("freeze_sha256"), old.get("plan_sha256")) != (frozen["freeze_sha256"], plan_sha256):
            raise ExperimentError("partitions.frozen.json exists with a different plan or partitions; use a new --out (preregistration is immutable)")
        return old
    prev.write_text(json.dumps(frozen, indent=2, ensure_ascii=False), encoding="utf-8")
    return frozen


def _summ(res_by_item, items):
    r = [res_by_item[i["id"]] for i in items]
    ns = [x["runtime_ns"] for x in r]
    return {"passed": sum(x["passed"] for x in r), "n": len(r), "cells_changed": sum(x["cells_changed"] or 0 for x in r),
            "median_runtime_us": round(statistics.median(ns) / 1000, 1) if ns else None}


def run_compare(plan_path, out_dir, *, allowlist=DEFAULT_ALLOWLIST, transport=None, extra_candidates=(), lineage_store=None) -> dict:
    t_start = time.perf_counter()
    plan_path, out = Path(plan_path), Path(out_dir)
    plan_dir = plan_path.parent
    plan = json.loads(plan_path.read_text(encoding="utf-8-sig"))
    out.mkdir(parents=True, exist_ok=True)
    guard0 = _guarded_files(plan_path, plan, out)
    driver = ExperimentDriver(out / "store", allowlist_path=allowlist, transport=transport)
    bases, fetch, parts = _load_items(plan, plan_dir, driver, out)
    frozen = _freeze(parts, out, _h(plan_path.read_bytes()))  # <- partitions + hashes are on disk before any arm executes
    items = {i["id"]: i for p in parts.values() for i in p}
    all_items = [i for p in STEPS for i in parts[p]]
    p0_desc = {"procedure": "identity (incumbent P0: observe + csv_profile_v1 tool + frozen verifier, no repair)",
               "tool_module_sha256": guard0["experiment_tool.py"], "verifier_module_sha256": guard0["experiment_verify.py"]}
    p0_hash = _sha(p0_desc)
    cand_src = bases[plan["candidate_source"]]["receipt"].get("diagnosis")
    cands = [c for c in (make_candidate(cand_src, p0_hash),) if c] + list(extra_candidates)
    scorer = _Scorer()
    # fixed arms run on every item (no abort): P0, learning-disabled control, each deterministic baseline
    arm_procs = {"P0": identity, "learning_off": identity,
                 **{n: BASELINES[n] for n in plan["baselines"]}}
    results = {a: {i["id"]: scorer.score(i, p, a) for i in all_items} for a, p in arm_procs.items()}
    # P0 must reproduce the driver's own verdict on the real sources (same frozen verifier)
    p0_matches_driver = {i["id"]: (results["P0"][i["id"]]["passed"] == (bases[i["base"]]["driver_verdict"] == "ACCEPT"))
                         for i in all_items if i["kind"] == "REAL_PINNED"}
    # strongest applicable deterministic baseline: rule frozen in the plan = most passes on scored partitions, then fewest cells changed, then plan order
    scored = [i for p in SCORED for i in parts[p]]
    rank = lambda n: (-sum(results[n][i["id"]]["passed"] for i in scored), sum(results[n][i["id"]]["cells_changed"] or 0 for i in scored), plan["baselines"].index(n))
    strongest = min(plan["baselines"], key=rank)
    # candidate search: step-by-step, regression vs P0 re-checked on EVERYTHING seen so far after every step
    cand_out, held = [], [i for p in HELD_OUT for i in parts[p]]
    q = lambda arm, its: q_for(results[arm], its)
    for c in cands:
        res, steps, seen, aborted = {}, [], [], None
        for part in STEPS:
            for it in parts[part]:
                res[it["id"]] = scorer.score(it, partial(run_isolated, c.apply, backend=c.backend, operator_class=c.operator_class), c.id)
            seen += parts[part]
            reg = [it["id"] for it in seen if res[it["id"]]["passed"] < results["P0"][it["id"]]["passed"]]
            steps.append({"step": part, "items": len(parts[part]), "regressions_vs_P0": reg, "ok": not reg})
            if reg:
                aborted = part
                break
        rec = {"candidate": c.id, "rule": c.rule, "provenance": c.provenance, "parent_hash": c.parent_hash,
               "candidate_hash": _sha({"rule": c.rule, "provenance": c.provenance, "parent": c.parent_hash}),
               "steps": steps, "aborted_at": aborted, "state": "QUARANTINED", "promoted": False}
        if aborted:
            rec.update(decision="REJECT_REGRESSION", reason=f"worse than P0 on {steps[-1]['regressions_vs_P0']} at step {aborted}; later partitions not evaluated")
        else:
            rec["outputs"] = {k: v for k, v in res.items()}
            same = {n: all(res[i["id"]]["out_sha256"] == results[n][i["id"]]["out_sha256"] for i in all_items) for n in results}
            rec["identical_output_to"] = [n for n, s in same.items() if s]
            cq, bq, pq, lq = q_for(res, held), q(strongest, held), q("P0", held), q("learning_off", held)
            loses = [i["id"] for i in held if res[i["id"]]["passed"] < results[strongest][i["id"]]["passed"]]
            ps = paired_summary(cq, bq)
            gain = sum(cq) - sum(bq)
            beats = gain > 0 and not loses and sum(cq) > sum(pq) and sum(cq) > sum(lq)
            gate = review_gate_evaluate({
                "provenance_valid": bool(c.provenance.get("diagnosis_sha256")) and bool(c.parent_hash),
                "critical_passed": all(res[i["id"]]["passed"] for i in parts["earlier_tasks"]), "reviewer_independent": None,  # not yet established (None = missing evidence -> QUARANTINE, not a failure)
                "holdout_locked": True, "holdout_unused_for_learning": not any(i["base"] == plan["candidate_source"] for i in held), "no_regression": True, "within_budget": True,
                "fresh_process_reproduced": None, "ablation_passed": sum(cq) > sum(lq), "author_id": c.id, "reviewer_id": None,
                "paired_summary": ps})
            rec.update(held_out_passes={"candidate": sum(cq), "strongest_baseline": sum(bq), "P0": sum(pq), "learning_off": sum(lq), "n": len(held)},
                       paired_vs_strongest=ps, losses_vs_strongest=loses, review_gate=gate,
                       decision=("REJECT_GATE" if beats and gate["decision"] == "REJECT" else "QUARANTINE_FOR_REVIEW" if beats else "REJECT_NO_GAIN"),
                       reason=(f"beats strongest baseline on held-out items (tiny n) but the review gate rejects the evidence: {gate['reasons']}; negative result kept"
                               if beats and gate["decision"] == "REJECT" else
                               "beats strongest baseline on held-out items (tiny n); still quarantined, needs independent reviewer + owner"
                               if beats else f"does not strictly beat strongest baseline '{strongest}' (gain {gain:+.0f}, losses {len(loses)}); tie/worse = reject, negative result kept"))
            if gate["decision"] == "PROMOTE":  # impossible by construction here; belt and braces against any auto-promotion
                rec["review_gate"] = {**gate, "decision": "QUARANTINE", "reasons": ["automatic promotion is not permitted in this run"]}
        cand_out.append(rec)
    guard1 = _guarded_files(plan_path, plan, out)
    if guard1 != guard0:
        raise ExperimentError("evaluator/frozen inputs changed during the comparison: " + str([k for k in guard0 if guard0[k] != guard1[k]]))
    if _freeze_hash(parts) != frozen["freeze_sha256"]:
        raise ExperimentError("partitions changed after freeze")
    sig = {a: tuple(r[i["id"]]["out_sha256"] for i in all_items) for a, r in results.items()}
    for c in cand_out:
        if "outputs" in c:
            sig[c["candidate"]] = tuple(c["outputs"][i["id"]]["out_sha256"] for i in all_items)
    aliases = [sorted(a for a in sig if sig[a] == s) for s in dict.fromkeys(sig.values())]  # groups of arms with identical output on every item
    aliases = [g for g in aliases if len(g) > 1]
    table = {a: {p: _summ(results[a], parts[p]) for p in STEPS} for a in results}
    for c in cand_out:
        if "outputs" in c:
            table[c["candidate"]] = {p: _summ(c["outputs"], parts[p]) for p in STEPS}
    core = {"schema": SCHEMA, "compare_id": plan["compare_id"], "partition_freeze_sha256": frozen["freeze_sha256"], "strongest_baseline": strongest,
            "strongest_rule": plan["strongest_baseline_rule"], "candidates": [{k: v for k, v in c.items() if k != "outputs"} for c in cand_out],
            "per_item": {a: {i: {k: v for k, v in r.items() if k != "runtime_ns"} for i, r in rs.items()} for a, rs in results.items()}}
    for c in cand_out:
        if "outputs" in c:
            core["per_item"][c["candidate"]] = {i: {k: v for k, v in r.items() if k != "runtime_ns"} for i, r in c["outputs"].items()}
    tot = lambda k: sum(f[k] for f in fetch.values())
    receipt = {**core, "result_sha256": _sha(core), "evaluator_sha256": guard0, "evaluator_unchanged_by_hash": True,
               "partition_sha256": frozen["partition_sha256"], "partition_labels": {i["id"]: i["kind"] for i in all_items},
               "arms": {"P0": "incumbent, unchanged", "learning_off": "candidate generator with the diagnosis/learning input removed (no rule produced)",
                        "deterministic_baselines": plan["baselines"],
                        "fixed_specialist_route": {"status": "N/A", "reason": "no model route is approved or executed (0 model requests, MODEL_ROUTE is shadow-only); the only deterministic specialist, csv_profile_v1, emits data unchanged = P0"},
                        "candidates": [c.id for c in cands]},
               "aliases": aliases, "input_aliases": {i["id"]: o["id"] for n, i in enumerate(all_items) for o in all_items[:n] if o["sha256"] == i["sha256"]},
               "dedup_executions_skipped": scorer.hits, "p0_reproduces_driver_verdict_on_real_items": p0_matches_driver,
               "table": table, "base_experiments": fetch,
               "requests": {"model_requests": 0, "generated_tokens": 0, "network_requests": tot("net_calls"), "fetched_blob_bytes": tot("blob_bytes"),
                            "repo_object_bytes_on_disk": tot("repo_object_bytes"), "all_base_consumption_unchanged": all(f["consumption_unchanged"] for f in fetch.values())},
               "runtime_total_s": round(time.perf_counter() - t_start, 3), "held_out_n": len(held),
               "uncertainty": f"n={len(held)} held-out ENGINEERED items; pass/fail outcomes; the paired bootstrap interval is degenerate-narrow and carries no population claim",
               "promotion": "NOT PROMOTED: no automatic promotion; every candidate stays QUARANTINED"}
    receipt["receipt_body_sha256"] = _sha(receipt)
    (out / "receipt.json").write_text(json.dumps(receipt, indent=2, ensure_ascii=False), encoding="utf-8")
    (out / "candidates.json").write_text(json.dumps([{k: v for k, v in c.items() if k != "outputs"} for c in cand_out], indent=2), encoding="utf-8")
    (out / "REPORT.md").write_text(_report(receipt, cand_out, parts), encoding="utf-8")
    if lineage_store is not None:  # separate file + store; the receipt and its result_sha256 are never touched
        _register_lineage(lineage_store, out, p0_desc, cands, cand_out, _sha(guard0))
    return receipt


def _register_lineage(store, out, p0_desc, cands, cand_out, ev_sha):
    from . import lineage
    p0 = lineage.register(store, "identity", [], {}, ev_sha, {"root": "P0", "p0": p0_desc})
    entries = {}
    for c, rec in zip(cands, cand_out):
        h = lineage.register(store, c.apply, [p0], {"class": c.operator_class, "improver_version": "1"}, ev_sha,
                             {**c.provenance, "candidate": c.id, "compare_candidate_hash": rec["candidate_hash"]}, backend=c.backend)
        lineage.record_result(store, h, "ACCEPTED" if rec["decision"] == "QUARANTINE_FOR_REVIEW" else "REJECTED", rec.get("held_out_passes"))
        entries[c.id] = {"lineage_hash": h, "candidate_hash": rec["candidate_hash"], "decision": rec["decision"]}
    (out / "lineage.json").write_text(json.dumps({"p0": p0, "evaluator_sha256": ev_sha, "candidates": entries}, indent=2), encoding="utf-8")


def q_for(res, items):
    return [1.0 if res[i["id"]]["passed"] else 0.0 for i in items]


def _freeze_hash(parts):
    desc = {p: [{k: it[k] for k in ("id", "kind", "base", "mutation", "sha256", "bytes")} for it in items] for p, items in parts.items()}
    return _sha({p: _sha(d) for p, d in desc.items()})


def _report(r, cands, parts):
    L = [f"# Slice E comparison {r['compare_id']}", "",
         "Tool-only (0 model requests). ENGINEERED variants are seeded mutations of two pinned sources: NOT unseen data, NOT Level A. **n is tiny.**", "",
         "## Decision"]
    for c in cands:
        L.append(f"- `{c['candidate']}`: **{c['decision']}** (state QUARANTINED, promoted false) - {c['reason']}")
        if "review_gate" in c:
            L.append(f"  - review_gate: {c['review_gate']['decision']}: {'; '.join(c['review_gate']['reasons'])}")
    if not cands:
        L.append("- no candidate produced")
    L += ["", f"Strongest deterministic baseline: `{r['strongest_baseline']}` (rule: {r['strongest_rule']})", "",
          "## Results (passed/n per partition; cells changed; median procedure runtime us)", "",
          "| arm | " + " | ".join(STEPS) + " |", "|---|" + "---|" * len(STEPS)]
    for a, row in r["table"].items():
        L.append(f"| {a} | " + " | ".join(f"{row[p]['passed']}/{row[p]['n']}; {row[p]['cells_changed']}c; {row[p]['median_runtime_us']}" for p in STEPS) + " |")
    L += ["", "## Arms", f"- fixed-specialist route: {r['arms']['fixed_specialist_route']['status']} - {r['arms']['fixed_specialist_route']['reason']}",
          f"- learning-disabled control: {r['arms']['learning_off']}", f"- aliases (identical outputs on every item): {json.dumps(r['aliases'])}",
          f"- executions de-duplicated: {r['dedup_executions_skipped']}; input aliases: {json.dumps(r['input_aliases'])}", "", "## Partitions (frozen before any arm ran)"]
    L += [f"- `{p}` `{h[:16]}`: " + ", ".join(f"{i['id']}[{i['kind']}]" for i in parts[p]) for p, h in r["partition_sha256"].items()]
    L += [f"- freeze `{r['partition_freeze_sha256']}`", "", "## Candidate search (regression vs P0 re-checked after every step)"]
    for c in cands:
        L.append(f"- `{c['candidate']}` parent `{c['parent_hash'][:16]}` hash `{c['candidate_hash'][:16]}`: " + ", ".join(f"{s['step']}:{'ok' if s['ok'] else 'REGRESSION ' + str(s['regressions_vs_P0'])}" for s in c["steps"]))
    q = r["requests"]
    L += ["", "## Costs and uncertainty", f"- model requests {q['model_requests']}, generated tokens {q['generated_tokens']}, network requests {q['network_requests']}, "
          f"fetched blob bytes {q['fetched_blob_bytes']}, repo object bytes on disk {q['repo_object_bytes_on_disk']}, total runtime {r['runtime_total_s']}s",
          f"- {r['uncertainty']}", f"- evaluator + frozen inputs unchanged by hash: {r['evaluator_unchanged_by_hash']}; result sha256 `{r['result_sha256']}`", f"- {r['promotion']}"]
    return "\n".join(L) + "\n"
