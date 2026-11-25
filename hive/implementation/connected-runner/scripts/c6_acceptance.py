"""C6 acceptance: ONE connected journey through the normal console (real docker, real server, local gpt-oss-20b for the one discovery call).

  python scripts/c6_acceptance.py [--out build/c-series/c6-run]

Fresh scratch store; fresh read-only copies of real folders (D:/MOM Rig/social-ops subtrees) are snapshotted then deleted.
Uses the EXISTING admission key (%USERPROFILE%/.hive-admission). Writes <out>/summary.json with PASS/FAIL/INCOMPLETE per step."""
from __future__ import annotations
import argparse, hashlib, json, os, re, shutil, subprocess, sys, tempfile, threading, time, urllib.error, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
PORT = 8786
TEXT = "Compare before and after inventories: what was added, removed or changed"
SRC = Path("D:/MOM Rig/social-ops")
MODEL = "openai/gpt-oss-20b"


def sha(b): return hashlib.sha256(b).hexdigest()


def env(): return dict(os.environ, PYTHONPATH=str(ROOT / "src"), PYTHONUNBUFFERED="1")


def py(*a, **kw):
    return subprocess.run([sys.executable, *a], cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace", env=env(), **kw)


def jout(p):
    try:
        return json.loads(p.stdout)
    except ValueError:
        return {"exit": p.returncode, "stderr": p.stderr[-500:], "stdout": p.stdout[-300:]}


def vram():
    return int(subprocess.run(["nvidia-smi", "--query-gpu=memory.used", "--format=csv,noheader,nounits"], capture_output=True, text=True).stdout.strip().splitlines()[0])


class Sampler(threading.Thread):
    def __init__(self): super().__init__(daemon=True); self.stop = False; self.peak = 0
    def run(self):
        while not self.stop:
            try: self.peak = max(self.peak, vram())
            except Exception: pass
            time.sleep(1.5)


class Server:
    def __init__(self, store, inputs, log):
        self.log = Path(log); self.log.write_bytes(b"")
        fh = open(self.log, "ab")
        self.p = subprocess.Popen([sys.executable, "-m", "hive", "--store", str(store), "operator", "launch", "--allowed-root", str(inputs), "--port", str(PORT), "--no-browser"],
                                  cwd=ROOT, env=env(), stdout=fh, stderr=subprocess.STDOUT, creationflags=0x00000008 | 0x00000200, close_fds=True)
        for _ in range(240):
            m = re.search(r"#token=(\S+)", self.log.read_text(errors="replace"))
            if m: self.token = m.group(1); return
            time.sleep(0.5)
        raise SystemExit("server did not start")

    def call(self, path, body=None):
        req = urllib.request.Request(f"http://127.0.0.1:{PORT}{path}", data=None if body is None else json.dumps(body).encode(),
                                     headers={"Authorization": "Bearer " + self.token, **({} if body is None else {"Content-Type": "application/json"})})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                d = r.read()
                return r.status, (json.loads(d) if r.headers.get_content_type() == "application/json" else d)
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read())

    def submit(self, sources, **kw):
        return self.call("/api/operator/goal", {"goal": TEXT, "sources": sources, "deliverable": "inventory_diff", **kw})

    def goal_rec(self, gid):
        return next((x for x in self.call("/api/operator")[1]["goals"] if x["goal_id"] == gid), None)

    def goal(self, sources, timeout=300, **kw):
        st, r = self.submit(sources, **kw)
        if st != 202 or "goal_id" not in r: return st, r, None
        t0 = time.time()
        while time.time() - t0 < timeout:
            s = self.call("/api/operator")[1]
            g = next((x for x in s["goals"] if x["goal_id"] == r["goal_id"]), None)
            if g and g["state"] not in ("RUNNING", "PLANNING", "SUBMITTED") and not s["active"]: return st, r, g
            time.sleep(0.4)
        raise SystemExit("goal timed out")

    def download(self, art):
        st, data = self.call("/api/artifact?ref=" + urllib.request.quote(art["ref"]))
        return st == 200 and sha(data) == art["sha256"], data

    def counters(self): return self.call("/api/operator")[1]["counters"]

    def kill(self):
        subprocess.run(["taskkill", "/F", "/T", "/PID", str(self.p.pid)], capture_output=True)
        try: self.p.wait(timeout=20)
        except Exception: pass
        time.sleep(1)


def make_pair(src, inputs, prefix, tag):
    """BEFORE/AFTER snapshots from a NEW copy of a real subtree; AFTER has known adds/removes/resizes; trees deleted."""
    from hive import operator_runtime as O
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as t:
        a, b = Path(t) / "before", Path(t) / "after"
        shutil.copytree(src, a); shutil.copytree(a, b)
        files = sorted(p for p in b.rglob("*") if p.is_file() and not p.name.startswith("."))
        removed, resized = files[1:3], files[5:7]
        for p in removed: p.unlink()
        for p in resized: p.write_bytes(p.read_bytes() + b"\n" * 41)
        added = [b / f"{tag}_new_a.json", b / f"{tag}_dir" / f"{tag}_new_b.json"]
        for p, n in zip(added, (13, 29)):
            p.parent.mkdir(parents=True, exist_ok=True); p.write_bytes(b"x" * n)
        rel = lambda ps: sorted(p.relative_to(b).as_posix() for p in ps)
        (inputs / f"{prefix}before.csv").write_bytes(O.snapshot_dir(a)); (inputs / f"{prefix}after.csv").write_bytes(O.snapshot_dir(b))
        n_before = len([1 for x in a.rglob("*") if x.is_file() and not x.name.startswith(".")])
        return {"source": str(src), "added": rel(added), "removed": rel(removed), "changed": rel(resized), "before_rows": n_before}


def variant(inputs, prefix, n):
    (inputs / f"{prefix}after{n}.csv").write_bytes((inputs / f"{prefix}after.csv").read_bytes() + f"c6_var{n}.json,top,{n}0\n".encode())
    return f"{prefix}after{n}.csv"


def check_diff(diff, e, extra=()):
    ids = lambda k: sorted(x["id"] for x in diff[k])
    return ids("added") == sorted(e["added"] + list(extra)) and ids("removed") == e["removed"] and ids("changed") == e["changed"]


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--out", default=str(ROOT / "build/c-series/c6-run")); a = ap.parse_args()
    out = Path(a.out)
    if out.exists(): shutil.rmtree(out)
    store, inputs = out / "store", out / "inputs"
    store.mkdir(parents=True); inputs.mkdir()
    S, J = {}, {}   # step -> PASS/FAIL/INCOMPLETE ; details

    def step(n, ok, **d):
        S[n] = "PASS" if ok is True else "INCOMPLETE" if ok is None else "FAIL"; J[n] = d
        print(n, S[n], flush=True)

    t_start = time.time()
    e1 = make_pair(SRC / "skills", inputs, "", "c6a")
    e2 = make_pair(SRC / "contracts", inputs, "p2", "c6b")
    J["inputs"] = {"pair1": e1, "pair2": e2, "pair1_before_sha256": sha((inputs / "before.csv").read_bytes()), "pair1_after_sha256": sha((inputs / "after.csv").read_bytes())}
    s = Server(store, inputs, out / "server1.log")
    st, r, g = s.goal(["before.csv", "after.csv"], allow_discovery=True)
    step("1_submit_goal_discovery", bool(g) and g["state"] == "DISCOVERY_QUEUED" and bool(g.get("experiment_id")), http=st, goal_id=r.get("goal_id"), state=g and g["state"], experiment_id=g and g.get("experiment_id"))
    step("2_contract_plan_gap", bool(g) and g.get("missing_step", {}).get("out") == "inventory_diff" and [x["op"] for x in g["partial_plan"]] == ["convert", "convert"],
         missing_step=g and g.get("missing_step"), partial_plan=g and [x["op"] for x in g["partial_plan"]], gap_ref=g and g.get("gap_ref"), contract_ref=g and g.get("contract_ref"))
    exp = g["experiment_id"]; s.kill()

    # 3. real experiment: load model, run, unload later
    v = {"before": vram()}
    ld = subprocess.run(["lms", "load", MODEL, "--context-length", "32768", "--gpu", "max"], capture_output=True, text=True, timeout=600)
    v["after_load"] = vram(); smp = Sampler(); smp.start()
    disc_cfg = json.loads((ROOT / "configs/model_dispatch.json").read_text())["classes"]["c3-proposal"]
    t0 = time.time(); p = py("-m", "hive", "--store", str(store), "operator", "discover", "run", exp, timeout=1200); wall = time.time() - t0
    smp.stop = True; time.sleep(1); v["peak"] = max(smp.peak, v["after_load"])
    dr = jout(p)
    lst = jout(py("-m", "hive", "--store", str(store), "operator", "discover", "list"))
    rec = next((x for x in lst if x["exp_id"] == exp), {}) if isinstance(lst, list) else {}
    step("3_experiment_runs", p.returncode == 0 and rec.get("state") == "CANDIDATE_PASSED", state=rec.get("state"), dispatch_mode=disc_cfg, wall_s=round(wall, 1), run_out=dr if "exit" in dr else {k: dr.get(k) for k in list(dr)[:8]},
         usage=rec.get("usage") or rec.get("spent"), budget=rec.get("budget"), lms_load_rc=ld.returncode)
    # 4. admission
    if rec.get("state") == "CANDIDATE_PASSED":
        pa = py("scripts/hive_admission.py", "admit", "--store", str(store), "--exp", exp); adm = jout(pa)
        step("4_signed_admission", pa.returncode == 0 and adm.get("version") == 1 and bool(adm.get("rerun_receipt_sha256")), admission=adm)
    else:
        step("4_signed_admission", None, why="no CANDIDATE_PASSED; not faked")
    J["vram_mib"] = v
    if S["4_signed_admission"] != "PASS":
        return finish(out, S, J, t_start)

    # 5. resubmit original goal
    s = Server(store, inputs, out / "server2.log"); c0 = s.counters()
    st, r, g5 = s.goal(["before.csv", "after.csv"], allow_discovery=True)
    ok, data = s.download(next(x for x in g5["deliverable_artifacts"] if x["name"] == "diff.json")) if g5 and g5["state"] == "VERIFIED" else (False, b"")
    diff = json.loads(data) if ok else {}
    step("5_resubmit_original_verified", bool(g5) and g5["state"] == "VERIFIED" and g5["plan"] == ["convert(input:0)", "convert(input:1)", "inventory-diff(step:s1,step:s2)"] and ok and check_diff(diff, e1),
         state=g5 and g5["state"], plan=g5 and g5["plan"], steps=g5 and [(x["op"], x["mode"], x["verdict"]) for x in g5["steps"]], download_sha_ok=ok, diff_counts={k: len(v) for k, v in diff.items() if isinstance(v, list)}, usage=g5 and g5["usage"])
    # 6. restart
    s.kill(); s = Server(store, inputs, out / "server3.log")
    step("6_restart_console", s.call("/api/operator")[0] == 200, note="killed process tree, relaunched on same store")

    # 7-8. different pair, no allow_discovery
    n_exp0 = len(jout(py("-m", "hive", "--store", str(store), "operator", "discover", "list")))
    c7 = s.counters()
    st, r, g7 = s.goal(["p2before.csv", "p2after.csv"])
    c8 = s.counters()
    ok7, d7 = s.download(next(x for x in g7["deliverable_artifacts"] if x["name"] == "diff.json")) if g7 and g7["state"] == "VERIFIED" else (False, b"")
    diff7 = json.loads(d7) if ok7 else {}
    n_exp1 = len(jout(py("-m", "hive", "--store", str(store), "operator", "discover", "list")))
    step("7_new_pair_without_discovery", bool(g7) and g7["state"] == "VERIFIED", state=g7 and g7["state"], plan=g7 and g7["plan"], inputs=e2["source"])
    step("8_retained_capability_exec", bool(g7) and g7["steps"][-1]["mode"] == "retained_capability_execution" and g7["steps"][-1]["verdict"] == "PASS" and c8["model_calls"] == 0 and c8["proposal_calls"] == 0
         and n_exp0 == n_exp1 and ok7 and check_diff(diff7, e2) and diff7.get("unchanged") == e2["before_rows"] - len(e2["removed"]) - len(e2["changed"]),
         last_step_mode=g7 and g7["steps"][-1]["mode"], model_calls=c8["model_calls"], proposal_calls=c8["proposal_calls"], experiments_before=n_exp0, experiments_after=n_exp1,
         container_runs_delta=c8["container_runs"] - c7["container_runs"], download_sha_ok=ok7, independent_check="diff ids == known edits (added/removed/changed) and unchanged count")

    # 9. controls
    C = {}
    v1, v2, v3, v4 = (variant(inputs, "p2", n) for n in (1, 2, 3, 4))
    # a. STOP
    s.call("/api/control", {"action": "stop"})
    st, r, gs = s.goal(["p2before.csv", v1])
    C["stop_state"] = gs and gs["state"]; C["stop_reason"] = gs and gs.get("reason")
    s.call("/api/control", {"action": "resume"})
    st, r, gs2 = s.goal(["p2before.csv", v1])
    C["after_clear_state"] = gs2 and gs2["state"]
    ctl_ok = C["stop_state"] == "STOPPED" and C["after_clear_state"] == "VERIFIED"
    # b. crash mid-goal
    st, r = s.submit(["p2before.csv", v2]); gid = r.get("goal_id"); seen = None
    for _ in range(300):
        g = s.goal_rec(gid)
        if g and g["state"] == "RUNNING": seen = g["state"]; break
        time.sleep(0.05)
    s.kill(); s = Server(store, inputs, out / "server4.log")
    gi = s.goal_rec(gid); C["crash_seen_running"] = seen; C["after_restart_state"] = gi and gi["state"]
    st, r, gc = s.goal(["p2before.csv", v2]); C["crash_resubmit_state"] = gc and gc["state"]
    crash_ok = seen == "RUNNING" and C["after_restart_state"] == "INTERRUPTED" and C["crash_resubmit_state"] == "VERIFIED"
    # c. rollback with one version
    pr = py("scripts/hive_admission.py", "rollback", "--store", str(store), "--cap", "inventory-diff")
    C["rollback"] = {"exit": pr.returncode, "stderr": pr.stderr.strip()[-300:], "stdout": pr.stdout.strip()[-200:]}
    rb_ok = pr.returncode != 0 and "ok" in pr.stderr.lower() or pr.returncode != 0
    # d. revoke
    pv = py("scripts/hive_admission.py", "revoke", "--store", str(store), "--cap", "inventory-diff", "--version", "1", "--reason", "c6 acceptance revoke")
    cr0 = s.counters(); st, r, gr = s.goal(["p2before.csv", v3]); cr1 = s.counters()
    C["revoke"] = {"exit": pv.returncode, "state": gr and gr["state"], "plan": gr and gr["plan"], "container_runs_delta": cr1["container_runs"] - cr0["container_runs"], "excluded": gr and gr.get("excluded")}
    rv_ok = pv.returncode == 0 and bool(gr) and gr["state"] == "UNRESOLVED" and C["revoke"]["container_runs_delta"] == 0 and gr["plan"] == [] and not gr.get("experiment_id")
    s.kill()
    # e. budget exhaustion on a fresh scratch store: gap via a goal without discovery, then an experiment with a 0-call budget
    bstore = out / "store-budget"; bstore.mkdir()
    pg = jout(py("-m", "hive", "--store", str(bstore), "operator", "goal", TEXT, "p2before.csv", v4, "--allowed-root", str(inputs), "--deliverable", "inventory_diff"))
    bud = {}
    try:
        from hive import discovery as D
        from hive.storage import Store
        bs = Store(bstore)
        bexp = D.open_experiment(bs, pg["gap_ref"], budget={"calls": 0})
        bs.close()
        bid = bexp["exp_id"] if isinstance(bexp, dict) else bexp
        pb = py("-m", "hive", "--store", str(bstore), "operator", "discover", "run", bid, timeout=300)
        bl = jout(py("-m", "hive", "--store", str(bstore), "operator", "discover", "list"))
        brec = next((x for x in bl if x["exp_id"] == bid), {}) if isinstance(bl, list) else {}
        bud = {"label": "fresh scratch store, 0-call budget, model loaded", "exp_id": bid, "state": brec.get("state"), "usage": brec.get("usage") or brec.get("spent"), "run_exit": pb.returncode}
    except Exception as ex:
        bud = {"error": repr(ex)[:300], "gap": pg.get("gap_ref"), "goal_state": pg.get("state")}
    C["budget"] = bud
    bud_ok = bud.get("state") in ("BUDGET_EXHAUSTED", "MODEL_UNAVAILABLE") and (bud.get("usage") or {}).get("calls", 0) == 0
    step("9a_stop_set_clear_resubmit", ctl_ok, stop_state=C["stop_state"], after_clear=C["after_clear_state"])
    step("9b_crash_recovery", crash_ok if seen else None, seen_running=seen, after_restart=C["after_restart_state"], resubmit=C["crash_resubmit_state"])
    step("9c_rollback_one_version_unavailable", rb_ok, **C["rollback"], two_version_working_rollback="tests (C4 two-version fixture); not exercised live")
    step("9d_revoke_unresolved_no_execution", rv_ok, **C["revoke"])
    step("9e_budget_exhaustion", bud_ok, **bud)
    # counters/usage
    subprocess.run(["lms", "unload", "--all"], capture_output=True, text=True, timeout=120)
    time.sleep(3); v["after_unload"] = vram()
    return finish(out, S, J, t_start)


def finish(out, S, J, t0):
    J["wall_s_total"] = round(time.time() - t0, 1)
    subprocess.run(["lms", "unload", "--all"], capture_output=True, text=True)
    (out / "summary.json").write_text(json.dumps({"steps": dict(sorted(S.items())), "all_pass": all(v == "PASS" for v in S.values()), "details": J}, indent=1, default=str), encoding="utf-8", newline="\n")
    print(json.dumps(dict(sorted(S.items())), indent=1))
    return 0 if all(v == "PASS" for v in S.values()) else 1


if __name__ == "__main__":
    sys.exit(main())
