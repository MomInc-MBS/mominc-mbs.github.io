"""C4 exit evidence: signed admission of the C3 candidate, then reuse on fresh inputs through the real console server and the CLI.

  python scripts/c4_demo.py [--source "D:/MOM Rig/mom-station/agents"] [--out build/c-series/c4-run]

Copies build/c-series/c3-run/store (never modifies it), runs `hive_admission init` (real key at the default location, outside the
repo) and `admit` (real evaluator re-run, 1 container run), then submits inventory_diff goals WITHOUT allow_discovery on fresh
snapshots. Zero model calls anywhere. Writes <out>/summary.json with pass/fail per check."""
from __future__ import annotations
import argparse, hashlib, json, os, re, shutil, subprocess, sys, tempfile, time, urllib.error, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
PORT = 8784
EXP = "d-563f4dc928c28acb7944"
TEXT = "Compare these two inventories and show what was added, removed or changed"


def sha(b): return hashlib.sha256(b).hexdigest()


def py(*a, **kw):
    return subprocess.run([sys.executable, *a], cwd=ROOT, capture_output=True, text=True, env=dict(os.environ, PYTHONPATH=str(ROOT / "src")), **kw)


def jout(p):
    try:
        return json.loads(p.stdout)
    except ValueError:
        return {"exit": p.returncode, "stderr": p.stderr[-400:]}


class Server:
    def __init__(self, store, inputs):
        self.p = subprocess.Popen([sys.executable, "-m", "hive", "--store", str(store), "operator", "launch", "--allowed-root", str(inputs), "--port", str(PORT), "--no-browser"],
                                  cwd=ROOT, env=dict(os.environ, PYTHONPATH=str(ROOT / "src"), PYTHONUNBUFFERED="1"), stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        while True:
            line = self.p.stdout.readline()
            if not line:
                raise SystemExit("server exited")
            m = re.search(r"#token=(\S+)", line)
            if m:
                self.token = m.group(1)
                break

    def call(self, path, body=None):
        req = urllib.request.Request(f"http://127.0.0.1:{PORT}{path}", data=None if body is None else json.dumps(body).encode(),
                                     headers={"Authorization": "Bearer " + self.token, **({} if body is None else {"Content-Type": "application/json"})})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                d = r.read()
                return r.status, (json.loads(d) if r.headers.get_content_type() == "application/json" else d)
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read())

    def goal(self, sources, timeout=300, **kw):
        st, r = self.call("/api/operator/goal", {"goal": TEXT, "sources": sources, "deliverable": "inventory_diff", **kw})
        if st != 202:
            return st, r, None
        t0 = time.time()
        while time.time() - t0 < timeout:
            s = self.call("/api/operator")[1]
            g = next((x for x in s["goals"] if x["goal_id"] == r["goal_id"]), None)
            if g and g["state"] not in ("RUNNING", "PLANNING", "SUBMITTED") and not s["active"]:
                return st, r, g
            time.sleep(0.5)
        raise SystemExit("goal timed out")

    def download(self, art):
        st, data = self.call("/api/artifact?ref=" + urllib.request.quote(art["ref"]))
        return st == 200 and sha(data) == art["sha256"], data

    def counters(self): return self.call("/api/operator")[1]["counters"]
    def kill(self): self.p.kill(); self.p.wait()


def fresh_inputs(src, dest):
    """Two inventory CSVs from a copy of a real folder never used before. AFTER = copy with known adds/removes/resizes; trees deleted."""
    from hive import operator_runtime as O
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as t:
        a, b = Path(t) / "before", Path(t) / "after"
        shutil.copytree(src, a)
        shutil.copytree(a, b)
        files = sorted(p for p in b.rglob("*") if p.is_file() and not p.name.startswith("."))
        removed, resized = files[3:5], files[10:12]
        for p in removed: p.unlink()
        for p in resized: p.write_bytes(p.read_bytes() + b"\n" * 37)
        added = [b / "personas" / "c4_new_a.json", b / "c4_new_b.json", b / "c4_extra" / "c4_new_c.json"]
        for p, n in zip(added, (11, 22, 33)):
            p.parent.mkdir(parents=True, exist_ok=True); p.write_bytes(b"x" * n)
        rel = lambda ps, base: sorted(p.relative_to(base).as_posix() for p in ps)
        dest.mkdir(parents=True)
        (dest / "before.csv").write_bytes(O.snapshot_dir(a))
        (dest / "after.csv").write_bytes(O.snapshot_dir(b))
        n_before = len([1 for _ in a.rglob("*") if _.is_file() and not _.name.startswith(".")])
        return {"added": rel(added, b), "removed": rel(removed, b), "changed": rel(resized, b), "before_rows": n_before}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", default="D:/MOM Rig/mom-station/agents"); ap.add_argument("--out", default=str(ROOT / "build/c-series/c4-run"))
    a = ap.parse_args()
    out = Path(a.out)
    if out.exists(): shutil.rmtree(out)
    store, inputs = out / "store", out / "inputs"
    shutil.copytree(ROOT / "build/c-series/c3-run/store", store)
    J, checks = {}, {}

    # 1-2. authority: real key outside the repo, real admission (evaluator re-run in its own process)
    ini = jout(py("scripts/hive_admission.py", "init"))
    checks["1_init_key_outside_repo"] = bool(ini.get("fingerprint")) and ROOT not in Path(ini["key"]).parents
    J["authority"] = {"fingerprint": ini.get("fingerprint"), "signers": ini.get("signers"), "key_location": str(Path(ini["key"]).parent) if ini.get("key") else None}
    p = py("scripts/hive_admission.py", "admit", "--store", str(store), "--exp", EXP)
    adm = jout(p)
    J["admission"] = adm
    checks["2_admit_with_rerun"] = p.returncode == 0 and adm.get("version") == 1 and bool(adm.get("rerun_receipt_sha256"))
    if not checks["2_admit_with_rerun"]:
        return finish(out, checks, J)

    # 3. fresh inputs from a folder never used before
    edits = fresh_inputs(a.source, inputs)
    J["inputs"] = {"source": a.source, "edits": edits, "before_sha256": sha((inputs / "before.csv").read_bytes()), "after_sha256": sha((inputs / "after.csv").read_bytes())}
    (inputs / "after2.csv").write_bytes((inputs / "after.csv").read_bytes() + b"c4_new_d.json,personas,44\n")
    exp0 = len(json.loads(py("-m", "hive", "--store", str(store), "operator", "discover", "list").stdout))

    # 4. NEW process: console server (restart after admission), API goal without allow_discovery
    s1 = Server(store, inputs)
    c0 = s1.counters()
    st, r, g = s1.goal(["before.csv", "after.csv"])
    ok, data = s1.download(next(x for x in g["deliverable_artifacts"] if x["name"] == "diff.json")) if g and g["state"] == "VERIFIED" else (False, b"")
    diff = json.loads(data) if ok else {}
    c1 = s1.counters()
    match = ok and sorted(x["id"] for x in diff["added"]) == edits["added"] and sorted(x["id"] for x in diff["removed"]) == edits["removed"] \
        and sorted(x["id"] for x in diff["changed"]) == edits["changed"] and diff["unchanged"] == edits["before_rows"] - len(edits["removed"]) - len(edits["changed"])
    J["api_goal"] = {"state": g and g["state"], "plan": g and g["plan"], "steps": g and [(x["op"], x["state"], x["mode"], x["verdict"], x.get("capability")) for x in g["steps"]],
                     "download_sha_ok": ok, "diff_counts": {k: (len(v) if isinstance(v, list) else v) for k, v in diff.items()}, "usage": g and g["usage"]}
    checks["3_api_plan_has_no_gap"] = bool(g) and g["plan"] == ["convert(input:0)", "convert(input:1)", "inventory-diff(step:s1,step:s2)"]
    checks["4_api_verified_new_inputs"] = bool(g) and g["state"] == "VERIFIED" and g["steps"][-1]["mode"] == "retained_capability_execution" and g["steps"][-1]["verdict"] == "PASS"
    checks["5_diff_download_sha_matches"] = ok
    checks["6_diff_matches_known_edits"] = bool(match)
    checks["7_zero_model_calls_api"] = c1["model_calls"] == c0["model_calls"] == 0 and c1["proposal_calls"] == 0 and g["usage"]["container_runs"] == 3
    s1.kill()

    # 5. CLI, different new inputs (after2.csv), real process
    cli = ["-m", "hive", "--store", str(store), "operator", "goal", TEXT, "before.csv", "after2.csv", "--allowed-root", str(inputs), "--deliverable", "inventory_diff"]
    p = py(*cli)
    cg = jout(p)
    d2 = next((x for x in cg.get("deliverable", []) if x["name"] == "diff.json"), None)
    d2data = (store / d2["ref"]).read_bytes() if d2 else b""
    J["cli_goal"] = {"exit": p.returncode, "state": cg.get("state"), "plan": [x["op"] for x in (cg.get("plan") or {}).get("steps", [])], "usage": cg.get("usage"),
                     "mode": cg.get("steps", [{}])[-1].get("mode") if cg.get("steps") else None}
    checks["8_cli_verified_new_inputs"] = cg.get("state") == "VERIFIED" and J["cli_goal"]["mode"] == "retained_capability_execution" and bool(d2) and sha(d2data) == d2["sha256"] \
        and "c4_new_d.json" in [x["id"] for x in json.loads(d2data)["added"]] and cg["usage"]["model_calls"] == 0 and cg["usage"]["proposal_calls"] == 0

    # 6. restart server again: same goal as the first -> replay labelled, no container
    s2 = Server(store, inputs)
    c2 = s2.counters()
    st, r, g2 = s2.goal(["before.csv", "after.csv"])
    c3 = s2.counters()
    J["replay"] = {"state": g2 and g2["state"], "mode": g2 and g2["mode"], "step_mode": g2 and g2["steps"][-1]["mode"], "container_runs_delta": c3["container_runs"] - c2["container_runs"]}
    checks["9_same_goal_replay_labelled"] = bool(g2) and g2["state"] == "VERIFIED" and g2["mode"] == "saved_result_replay" and g2["steps"][-1]["mode"] == "saved_result_replay" \
        and c3["container_runs"] == c2["container_runs"]

    # 7. corrupt a COPY of the statement -> refused, nothing executed
    bad = out / "store-corrupt"
    shutil.copytree(store, bad)
    from hive.storage import Store
    from hive import capability_registry as CR
    s = Store(bad); ref = CR.history(s, "inventory-diff")[-1]["statement_ref"]; s.close()
    pth = bad / ref
    pth.write_bytes(pth.read_bytes().replace(b'"cap_id":"inventory-diff"', b'"cap_id":"inventory-dxff"', 1))
    p = py(*[x if x != str(store) else str(bad) for x in cli])
    bg = jout(p)
    J["corrupt_copy"] = {"state": bg.get("state"), "reason": bg.get("reason"), "excluded": (bg.get("plan") or {}).get("excluded"), "container_runs": (bg.get("usage") or {}).get("container_runs")}
    checks["10_corrupt_statement_refused"] = bg.get("state") == "UNRESOLVED" and any("refused" in x["reason"] for x in (bg.get("plan") or {}).get("excluded", [])) \
        and "inventory-diff" not in [x["op"] for x in (bg.get("plan") or {}).get("steps", [])]
    shutil.rmtree(bad, ignore_errors=True)

    # 8. revoke -> goal UNRESOLVED without execution or discovery
    p = py("scripts/hive_admission.py", "revoke", "--store", str(store), "--cap", "inventory-diff", "--version", "1", "--reason", "c4 demo revoke")
    J["revoke"] = jout(p)
    (inputs / "after3.csv").write_bytes((inputs / "after.csv").read_bytes() + b"c4_new_e.json,personas,55\n")
    c4 = s2.counters()
    st, r, g3 = s2.goal(["before.csv", "after3.csv"])
    c5 = s2.counters()
    s2.kill()
    exp1 = len(json.loads(py("-m", "hive", "--store", str(store), "operator", "discover", "list").stdout))
    J["after_revoke"] = {"state": g3 and g3["state"], "reason": g3 and g3["reason"], "plan": g3 and g3["plan"], "excluded": g3 and g3["excluded"], "experiments_before": exp0, "experiments_after": exp1}
    checks["11_revoke_unresolved_no_execution"] = p.returncode == 0 and bool(g3) and g3["state"] == "UNRESOLVED" and c5["container_runs"] == c4["container_runs"] \
        and g3["plan"] == [] and not g3.get("experiment_id")
    checks["12_no_new_experiment_opened"] = exp0 == exp1 == 1
    checks["13_zero_model_calls_total"] = c5["model_calls"] == 0 and c5["proposal_calls"] == 0
    J["counters_final"] = c5
    # c3-run must be untouched
    dirty = subprocess.run(["git", "status", "--porcelain", "build/c-series/c3-run", "evaluator/c3"], cwd=ROOT, capture_output=True, text=True).stdout.strip()
    checks["14_c3_run_and_evaluator_untouched"] = dirty == ""
    return finish(out, checks, J)


def finish(out, checks, J):
    checks = dict(sorted(checks.items()))
    (out / "summary.json").write_text(json.dumps({"checks": checks, "all_pass": all(checks.values()), "details": J}, indent=1, default=str), encoding="utf-8", newline="\n")
    print(json.dumps(checks, indent=1))
    return 0 if all(checks.values()) else 1


if __name__ == "__main__":
    sys.exit(main())
