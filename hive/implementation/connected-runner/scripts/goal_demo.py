"""C1/C2 acceptance: goals through the real console server (real docker), fresh copies of the operator inputs.

  python scripts/goal_demo.py [--inputs D:/HIVE-operator-inputs] [--out build/c-series/c12-demo]

Writes <out>/summary.json with pass/fail per check, sha256-verified downloads and the operator counters."""
from __future__ import annotations
import argparse, hashlib, json, os, re, shutil, subprocess, sys, time, urllib.request, urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PORT = 8783


def sha(b): return hashlib.sha256(b).hexdigest()


class Server:
    def __init__(self, store, inputs):
        self.log = open(Path(store).parent / "server.log", "ab")
        self.p = subprocess.Popen([sys.executable, "-m", "hive", "--store", str(store), "operator", "launch", "--allowed-root", str(inputs),
                                   "--port", str(PORT), "--no-browser"], cwd=ROOT, env=dict(os.environ, PYTHONPATH=str(ROOT / "src"), PYTHONUNBUFFERED="1"),
                                  stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
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

    def goal(self, text, sources, timeout=300, **kw):
        st, r = self.call("/api/operator/goal", {"goal": text, "sources": sources, **kw})
        if st != 202 or "goal_id" not in r:
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

    def kill(self):
        self.p.kill(); self.p.wait()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--inputs", default="D:/HIVE-operator-inputs"); ap.add_argument("--out", default=str(ROOT / "build/c-series/c12-demo"))
    a = ap.parse_args()
    out = Path(a.out)
    if out.exists(): shutil.rmtree(out)
    work, store = out / "inputs", out / "store"
    shutil.copytree(a.inputs, work)
    for d, n in (("folderA", 4), ("folderB", 6)):  # small real folders for the composition journey
        (work / d).mkdir()
        for i in range(n):
            (work / d / f"file{i}.{'txt' if i % 2 else 'md'}").write_bytes(b"demo " * (i + 1))
    store.mkdir(parents=True)
    J, checks = {}, {}
    s1 = Server(store, work)
    c0 = s1.call("/api/operator")[1]["counters"]

    st, r, g = s1.goal("Convert this inventory to canonical JSON", ["docs-inventory.csv"])
    ok, data = s1.download(g["deliverable_artifacts"][0]) if g["state"] == "VERIFIED" else (False, b"")
    J["convert"] = {"state": g["state"], "plan": g["plan"], "steps": [(x["op"], x["state"], x["mode"], x["verdict"]) for x in g["steps"]], "download_sha_ok": ok, "rows": len(json.loads(data)) if ok else None}
    checks["1_convert_goal"] = g["state"] == "VERIFIED" and g["plan"] == ["convert(input:0)"] and ok

    st, r, g = s1.goal("Merge these into a summary per group", ["docs-inventory.csv", "configs-inventory.csv", "scripts-inventory.json"])
    ok, data = s1.download(next(x for x in g["deliverable_artifacts"] if x["name"] == "merged.json")) if g["state"] == "VERIFIED" else (False, b"")
    J["merge"] = {"state": g["state"], "plan": g["plan"], "download_sha_ok": ok, "groups": len(json.loads(data)["groups"]) if ok else None}
    checks["2_merge_goal"] = g["state"] == "VERIFIED" and len(g["plan"]) == 1 and g["plan"][0].startswith("merge") and ok

    st, r, gc = s1.goal("Combine these two folders into one total per group", ["folderA", "folderB"])
    ok, data = s1.download(next(x for x in gc["deliverable_artifacts"] if x["name"] == "merged.json")) if gc["state"] == "VERIFIED" else (False, b"")
    J["composition"] = {"state": gc["state"], "plan": gc["plan"], "steps": [(x["op"], x["state"], x["mode"], x["verdict"]) for x in gc["steps"]], "download_sha_ok": ok,
                        "counts": sum(v["count"] for v in json.loads(data)["groups"].values()) if ok else None}
    checks["3_folders_compose_merge"] = gc["state"] == "VERIFIED" and [x["op"] for x in gc["steps"]] == ["snapshot", "snapshot", "merge"] and ok and J["composition"]["counts"] == 10

    # 7 (before restart so counters line up). old explicit interface still works
    st, r = s1.call("/api/operator/submit", {"op": "convert", "sources": ["scripts-inventory.json"]})
    t0 = time.time()
    while time.time() - t0 < 120:
        s = s1.call("/api/operator")[1]
        t = next((x for x in s["tasks"] if x["task_id"] == r.get("task_id")), None)
        if t and t["state"] != "RUNNING" and not s["active"]:
            break
        time.sleep(0.5)
    J["explicit_op"] = {"http": st, "state": t["state"]}
    checks["7_old_explicit_op_works"] = st == 202 and t["state"] == "VERIFIED"

    # 6. restart server, same goal -> replay identified
    goals_before = len(s1.call("/api/operator")[1]["goals"])
    counters_pre = s1.call("/api/operator")[1]["counters"]
    s1.kill()
    s2 = Server(store, work)
    persisted = len(s2.call("/api/operator")[1]["goals"]) >= goals_before
    st, r, g2 = s2.goal("Merge these into a summary per group", ["docs-inventory.csv", "configs-inventory.csv", "scripts-inventory.json"])
    cn = s2.call("/api/operator")[1]["counters"]
    J["restart_replay"] = {"goals_persisted": persisted, "state": g2["state"], "mode": g2["mode"], "replayed_steps": g2["replayed_steps"],
                           "container_runs_delta": cn["container_runs"] - counters_pre["container_runs"]}
    checks["6_restart_same_goal_replays"] = persisted and g2["state"] == "VERIFIED" and g2["mode"] == "saved_result_replay" and cn["container_runs"] == counters_pre["container_runs"]
    # 4. revoke merge: refused without execution (a fresh merge goal on different inputs, so no saved result is involved)
    before = s2.call("/api/operator")[1]["counters"]
    J["revoke_http"] = s2.call("/api/operator/control", {"action": "revoke", "op": "merge"})[0]
    st, r, gr = s2.goal("Merge these into a summary per group", ["docs-inventory.csv", "evaluator-inventory.csv"])
    after = s2.call("/api/operator")[1]["counters"]
    # reselect path demonstrated on convert (a revoked version cannot be revived by re-select by design)
    s2.call("/api/operator/control", {"action": "rollback", "op": "convert"})
    st, r, gx = s2.goal("Convert this inventory to canonical JSON", ["evaluator-inventory.csv"])
    s2.call("/api/operator/control", {"action": "reselect", "op": "convert"})
    st, r, gy = s2.goal("Convert this inventory to canonical JSON", ["evaluator-inventory.csv"])
    J["revoked_then_reselect"] = {"merge_state": gr["state"], "merge_reason": gr["reason"], "container_runs_delta": after["container_runs"] - before["container_runs"],
                                  "excluded": gr["excluded"], "convert_after_rollback": gx["state"], "convert_after_reselect": gy["state"]}
    checks["4_revoked_refused_then_reselect"] = (gr["state"] == "UNRESOLVED" and after["container_runs"] == before["container_runs"] and gx["state"] == "UNRESOLVED"
                                                 and gy["state"] == "VERIFIED")

    # 5. inventory_diff -> gap
    st, r, gd = s2.goal("Compare these two inventories and show what was added or removed", ["docs-inventory.csv", "configs-inventory.csv"])
    J["diff"] = {"state": gd["state"], "reason": gd["reason"], "gap_ref": gd["gap_ref"]}
    checks["5_inventory_diff_gap"] = gd["state"] == "UNRESOLVED" and bool(gd["gap_ref"]) and gd["steps"] == []

    final = s2.call("/api/operator")[1]["counters"]
    J["counters"] = {"start": c0, "final": final}
    checks["model_calls_zero"] = final["model_calls"] == 0 and final["proposal_calls"] == 0
    s2.kill()
    checks = dict(sorted(checks.items()))
    (out / "summary.json").write_text(json.dumps({"checks": checks, "all_pass": all(checks.values()), "journeys": J}, indent=1, default=str), encoding="utf-8", newline="\n")
    print(json.dumps(checks, indent=1))
    return 0 if all(checks.values()) else 1


if __name__ == "__main__":
    sys.exit(main())
