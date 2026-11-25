"""Operator Prototype acceptance journeys through the real launch command and the console HTTP API.

  python scripts/operator_demo.py --inputs D:/HIVE-operator-inputs --store .hive/operator-demo --out build/operator/demo

Real first-party inputs: folder snapshots of this repository (adapter inventory-snapshot-v1, engineering preparation).
Independent reference: PowerShell Get-ChildItem listings of the same folders (a different tool, no HIVE code).
Derived defective copies are named DERIVED-*. Every journey writes its receipt to --out/journeys.json."""
from __future__ import annotations
import argparse, csv, hashlib, io, json, os, re, shutil, subprocess, sys, time, urllib.request, urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
from hive import operator_runtime as O  # noqa: E402  (adapter + bundle only; journeys go through HTTP)

PORT = 8781
FOLDERS = {"docs-inventory.csv": ("docs", "ext", "csv"), "configs-inventory.csv": ("configs", "ext", "csv"),
           "scripts-inventory.json": ("scripts", "ext", "json"), "evaluator-inventory.csv": ("evaluator", "top", "csv")}


def sha(b): return hashlib.sha256(b).hexdigest()


def ps_listing(folder):
    """Independent reference: PowerShell's own recursive listing (relative path, extension, size)."""
    cmd = (f"$b=(Resolve-Path '{folder}').Path; Get-ChildItem -LiteralPath $b -Recurse -File | "
           "Where-Object { $_.FullName.Substring($b.Length+1) -notmatch '(^|\\\\)\\.' } | "
           "ForEach-Object { [pscustomobject]@{id=$_.FullName.Substring($b.Length+1).Replace('\\','/'); ext=$_.Extension.ToLower(); bytes=$_.Length} } | ConvertTo-Json -Compress")
    out = subprocess.run(["powershell", "-NoProfile", "-Command", cmd], capture_output=True, text=True, timeout=120).stdout
    rows = json.loads(out)
    return rows if isinstance(rows, list) else [rows]


def ref_rows(listing, group_by):
    g = (lambda r: (r["id"].split("/")[0] if "/" in r["id"] else ".")) if group_by == "top" else (lambda r: r["ext"] or "(none)")
    return sorted(({"id": r["id"], "group": g(r), "bytes": r["bytes"]} for r in listing), key=lambda r: r["id"])


class Server:
    def __init__(self, store, inputs, log):
        self.p = subprocess.Popen([sys.executable, "-m", "hive", "--store", str(store), "operator", "launch", "--allowed-root", str(inputs),
                                   "--port", str(PORT), "--no-browser"], cwd=ROOT, env=dict(os.environ, PYTHONPATH=str(ROOT / "src"), PYTHONUNBUFFERED="1"),
                                  stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        import atexit; atexit.register(lambda: self.p.poll() is None and self.p.kill())
        self.lines = []
        while True:
            line = self.p.stdout.readline()
            if not line:
                raise SystemExit("server exited: " + "".join(self.lines))
            self.lines.append(line)
            m = re.search(r"#token=(\S+)", line)
            if m:
                self.token = m.group(1)
                break
        log.append({"server_pid": self.p.pid, "startup": [re.sub(r"#token=\S+", "#token=<redacted>", l.strip()) for l in self.lines]})

    def call(self, path, body=None):
        req = urllib.request.Request(f"http://127.0.0.1:{PORT}{path}", data=None if body is None else json.dumps(body).encode(),
                                     headers={"Authorization": "Bearer " + self.token, **({} if body is None else {"Content-Type": "application/json"})})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                data = r.read()
                return r.status, (json.loads(data) if r.headers.get_content_type() == "application/json" else data)
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read())

    def wait(self, tid, timeout=240, prior=None):
        """prior = the task record before resubmission; a rerun must produce a record with a new last stage."""
        t0 = time.time()
        while time.time() - t0 < timeout:
            st = self.call("/api/operator")[1]
            task = next((t for t in st["tasks"] if t["task_id"] == tid), None)
            fresh = prior is None or (task and task["stages"][-1] != prior["stages"][-1])
            if task and fresh and task["state"] != "RUNNING" and not st["active"]:
                return task, st
            time.sleep(0.5)
        raise SystemExit(f"task {tid} did not finish")

    def kill(self):
        self.p.kill(); self.p.wait()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--inputs", required=True); ap.add_argument("--store", required=True); ap.add_argument("--out", required=True)
    a = ap.parse_args()
    inputs, store, out = Path(a.inputs), Path(a.store), Path(a.out)
    for p in (store,):
        if p.exists(): shutil.rmtree(p)
    inputs.mkdir(parents=True, exist_ok=True); out.mkdir(parents=True, exist_ok=True)
    (inputs / "notes.txt").write_text("not a supported input\n", encoding="utf-8")
    J, refs, provenance = {}, {}, {}

    # ---- engineering preparation: real folder snapshots + independent PowerShell references
    for name, (folder, grp, fmt) in FOLDERS.items():
        data = O.snapshot_dir(ROOT / folder, grp, fmt)
        listing = ps_listing(ROOT / folder)
        (inputs / name).write_bytes(data)
        refs[name] = ref_rows(listing, grp)
        provenance[name] = {"source_folder": folder, "adapter": O.ADAPTER, "group_by": grp, "format": fmt, "sha256": sha(data),
                            "kind": "first-party repository folder snapshot", "prior_model_exposure": "none (no model used)"}
    defect = (inputs / "configs-inventory.csv").read_text(encoding="utf-8").splitlines()
    defect[2] = ",".join(defect[2].split(",")[:-1] + ["-5"])  # one negative size in a copy
    (inputs / "DERIVED-defect-configs-inventory.csv").write_bytes(("\n".join(defect) + "\n").encode())
    provenance["DERIVED-defect-configs-inventory.csv"] = {"derived_from": "configs-inventory.csv", "change": "row 2 bytes -> -5", "label": "derived test input"}
    (inputs / "BOM-docs-inventory.csv").write_bytes(b"\xef\xbb\xbf" + (inputs / "docs-inventory.csv").read_bytes())
    provenance["BOM-docs-inventory.csv"] = {"derived_from": "docs-inventory.csv", "change": "UTF-8 BOM prepended", "label": "derived unsupported input"}
    (out / "provenance.json").write_text(json.dumps(provenance, indent=1, sort_keys=True), encoding="utf-8")
    (out / "reference.json").write_text(json.dumps(refs, indent=1, sort_keys=True), encoding="utf-8")
    log = []

    def check_convert(task, srv, name):
        st, data = srv.call("/api/artifact?ref=" + urllib.request.quote(next(x["ref"] for x in task["artifacts"] if x["name"] == "converted.json")))
        got = sorted(json.loads(data), key=lambda r: r["id"])
        return {"download_status": st, "downloaded_sha256": sha(data), "matches_powershell_reference": got == refs[name], "rows": len(got)}

    s1 = Server(store, inputs, log)
    J["readiness"] = s1.call("/api/operator")[1]["readiness"]
    c0 = s1.call("/api/operator")[1]["counters"]

    # 1. fresh conversion
    st, r = s1.call("/api/operator/submit", {"op": "convert", "sources": ["docs-inventory.csv"]})
    t1, s = s1.wait(r["task_id"])
    J["fresh_conversion"] = {"http": st, "task_id": t1["task_id"], "state": t1["state"], "summary": t1["summary"], "capability": t1["capability"]["capability"],
                             "genome": t1["capability"]["genome"], "selected_by": t1["capability"]["selected_by"], "verification": t1["verification"],
                             "usage": t1["usage"], "counters_before": c0, "counters_after": s["counters"], **check_convert(t1, s1, "docs-inventory.csv")}

    # 2. mixed batch with whole-file quarantine
    batch = ["docs-inventory.csv", "DERIVED-defect-configs-inventory.csv", "scripts-inventory.json", "evaluator-inventory.csv"]
    st, r = s1.call("/api/operator/submit", {"op": "merge", "sources": batch})
    t2, s = s1.wait(r["task_id"])
    _, data = s1.call("/api/artifact?ref=" + urllib.request.quote(next(x["ref"] for x in t2["artifacts"] if x["name"] == "merged.json")))
    merged = json.loads(data)
    want = {}
    for name in ("docs-inventory.csv", "scripts-inventory.json", "evaluator-inventory.csv"):
        for row in refs[name]:
            g = want.setdefault(row["group"], {"bytes": 0, "count": 0}); g["bytes"] += row["bytes"]; g["count"] += 1
    J["mixed_batch"] = {"task_id": t2["task_id"], "state": t2["state"], "summary": t2["summary"], "verification": t2["verification"],
                        "groups_match_powershell_reference_over_accepted_files": merged["groups"] == want,
                        "quarantined_exactly_derived_file": [f["file"] for f in merged["files"] if f["status"] == "quarantined"] == ["DERIVED-defect-configs-inventory.csv"],
                        }

    # 3. unsupported inputs: precise refusal, nothing fabricated
    J["unsupported"] = {"bom": s1.call("/api/operator/submit", {"op": "convert", "sources": ["BOM-docs-inventory.csv"]}),
                        "merge_one_file": s1.call("/api/operator/submit", {"op": "merge", "sources": ["docs-inventory.csv"]}),
                        "unknown_operation": s1.call("/api/operator/submit", {"op": "dedupe", "sources": ["docs-inventory.csv"]}),
                        "outside_allowed_root": s1.call("/api/operator/submit", {"op": "convert", "sources": [str(ROOT / "README.md")]}),
                        "unlisted_file_type": s1.call("/api/operator/submit", {"op": "convert", "sources": ["notes.txt"]}),
                        "counters": s1.call("/api/operator")[1]["counters"]}

    # 4. STOP and resume: nothing executes while stopped; resubmission executes once
    s1.call("/api/control", {"action": "stop"})
    st, r = s1.call("/api/operator/submit", {"op": "convert", "sources": ["configs-inventory.csv"]})
    ts, s = s1.wait(r["task_id"])
    stopped = {"state": ts["state"], "executions": s["counters"]["executions"]}
    s1.call("/api/control", {"action": "resume"})
    st, r = s1.call("/api/operator/submit", {"op": "convert", "sources": ["configs-inventory.csv"]})
    ts2, s = s1.wait(r["task_id"], prior=ts)
    J["stop_resume"] = {"while_stopped": stopped, "after_resume": {"state": ts2["state"], "same_task_id": ts2["task_id"] == ts["task_id"],
                        "executions": s["counters"]["executions"], "stages": [x["stage"] for x in ts2["stages"]]}, **check_convert(ts2, s1, "configs-inventory.csv")}

    # 5. crash mid-task -> restart -> INTERRUPTED -> resubmit executes exactly once
    st, r = s1.call("/api/operator/submit", {"op": "convert", "sources": ["scripts-inventory.json"]})
    time.sleep(1.0)
    mid = next(t for t in s1.call("/api/operator")[1]["tasks"] if t["task_id"] == r["task_id"])["state"]
    s1.kill()

    # 6. full process restart against the same durable state
    s2 = Server(store, inputs, log)
    st2 = s2.call("/api/operator")[1]
    it = next(t for t in st2["tasks"] if t["task_id"] == r["task_id"])
    c_before = st2["counters"]
    st, r2 = s2.call("/api/operator/submit", {"op": "convert", "sources": ["scripts-inventory.json"]})
    t3, s = s2.wait(r2["task_id"], prior=it)
    J["crash_recovery"] = {"state_when_killed": mid, "state_after_restart": it["state"], "resubmitted_state": t3["state"],
                           "executions_delta": s["counters"]["executions"] - c_before["executions"], **check_convert(t3, s2, "scripts-inventory.json")}

    c_before = s["counters"]
    st, r = s2.call("/api/operator/submit", {"op": "convert", "sources": ["evaluator-inventory.csv"]})
    t4, s = s2.wait(r["task_id"])
    J["restart_distinct_input"] = {"new_server_pid": s2.p.pid, "state": t4["state"], "mode": t4["mode"], "selected_by": t4["capability"]["selected_by"],
                                   "genome": t4["capability"]["genome"], "verification": t4["verification"]["verdict"],
                                   "counters_before": c_before, "counters_after": s["counters"],
                                   "executions_delta": s["counters"]["executions"] - c_before["executions"],
                                   "proposal_or_model_calls": s["counters"]["proposal_calls"] + s["counters"]["model_calls"],
                                   **check_convert(t4, s2, "evaluator-inventory.csv")}

    # 7. exact-task replay: same artifact, no new execution
    c_before = s["counters"]
    st, r = s2.call("/api/operator/submit", {"op": "convert", "sources": ["docs-inventory.csv"]})
    time.sleep(1.5)
    tr, s = s2.wait(r["task_id"])
    J["saved_result_replay"] = {"task_id": r["task_id"], "same_task_as_fresh": r["task_id"] == t1["task_id"],
                                "counters_before": c_before, "counters_after": s["counters"],
                                "executions_unchanged": s["counters"]["executions"] == c_before["executions"] and s["counters"]["container_runs"] == c_before["container_runs"],
                                "replays_delta": s["counters"]["replays"] - c_before["replays"],
                                "same_artifacts": tr["artifacts"] == t1["artifacts"], "log_tail": s["log"][-1]}

    # 8. rollback -> previous permitted version refuses honestly; re-select restores; history preserved
    rb = s2.call("/api/operator/control", {"action": "rollback", "op": "convert"})
    c_before = s2.call("/api/operator")[1]["counters"]
    (inputs / "src-hive-inventory.csv").write_bytes(O.snapshot_dir(ROOT / "src" / "hive", "ext"))
    st, r = s2.call("/api/operator/submit", {"op": "convert", "sources": ["src-hive-inventory.csv"]})
    trb, s = s2.wait(r["task_id"])
    rs = s2.call("/api/operator/control", {"action": "reselect", "op": "convert"})
    st, r = s2.call("/api/operator/submit", {"op": "convert", "sources": ["src-hive-inventory.csv"]})
    trs, s3 = s2.wait(r["task_id"], prior=trb)
    J["rollback"] = {"rollback_http": rb[0], "after_rollback": {"state": trb["state"], "reason": trb.get("reason"),
                     "container_runs_delta": s["counters"]["container_runs"] - c_before["container_runs"]},
                     "reselect_http": rs[0], "after_reselect": {"state": trs["state"], "verification": trs["verification"]["verdict"]},
                     "registry_history": [{k: e[k] for k in ("type", "target")} for e in s3["capabilities"]["convert"]["history"]]}
    # 9. revoke (end to end): the earlier verified merge is NOT replayed; nothing executes
    c_before = s3["counters"]
    rv = s2.call("/api/operator/control", {"action": "revoke", "op": "merge"})
    st, r = s2.call("/api/operator/submit", {"op": "merge", "sources": batch})
    trv, s4 = s2.wait(r["task_id"], prior=t2)
    J["revoke"] = {"revoke_http": rv[0], "same_task_as_mixed_batch": r["task_id"] == t2["task_id"], "state": trv["state"], "reason": trv.get("reason"),
                   "mode": trv.get("mode"), "prior_attempt_state": (trv.get("prior_attempts") or [{}])[0].get("state"),
                   "executions_delta": s4["counters"]["executions"] - c_before["executions"],
                   "container_runs_delta": s4["counters"]["container_runs"] - c_before["container_runs"]}
    J["final_counters"] = s4["counters"]
    s2.kill()
    J["servers"] = log
    (out / "journeys.json").write_text(json.dumps(J, indent=1, sort_keys=True, default=str), encoding="utf-8")
    checks = {
        "fresh_conversion": J["fresh_conversion"]["state"] == "VERIFIED" and J["fresh_conversion"]["matches_powershell_reference"],
        "mixed_batch": J["mixed_batch"]["state"] == "VERIFIED" and J["mixed_batch"]["groups_match_powershell_reference_over_accepted_files"] and J["mixed_batch"]["quarantined_exactly_derived_file"],
        "unsupported": all(J["unsupported"][k][0] == 400 for k in ("bom", "merge_one_file", "unknown_operation", "outside_allowed_root", "unlisted_file_type"))
                       and J["unsupported"]["counters"]["executions"] == J["fresh_conversion"]["counters_after"]["executions"] + 1,
        "stop_resume": J["stop_resume"]["while_stopped"]["state"] == "STOPPED" and J["stop_resume"]["after_resume"]["state"] == "VERIFIED",
        "crash_recovery": J["crash_recovery"]["state_when_killed"] == "RUNNING" and J["crash_recovery"]["state_after_restart"] == "INTERRUPTED" and J["crash_recovery"]["resubmitted_state"] == "VERIFIED",
        "restart_distinct_input": J["restart_distinct_input"]["state"] == "VERIFIED" and J["restart_distinct_input"]["executions_delta"] == 1 and J["restart_distinct_input"]["proposal_or_model_calls"] == 0 and J["restart_distinct_input"]["matches_powershell_reference"],
        "saved_result_replay": J["saved_result_replay"]["executions_unchanged"] and J["saved_result_replay"]["replays_delta"] == 1 and J["saved_result_replay"]["same_artifacts"],
        "revoke_blocks_replay": J["revoke"]["state"] == "NO_ELIGIBLE_CAPABILITY" and J["revoke"]["mode"] != "saved_result_replay" and J["revoke"]["executions_delta"] == 0 and J["revoke"]["container_runs_delta"] == 0,
        "rollback": J["rollback"]["after_rollback"]["state"] == "NO_ELIGIBLE_CAPABILITY" and J["rollback"]["after_rollback"]["container_runs_delta"] == 0 and J["rollback"]["after_reselect"]["state"] == "VERIFIED",
    }
    (out / "checks.json").write_text(json.dumps(checks, indent=1), encoding="utf-8")
    print(json.dumps(checks, indent=1))
    return 0 if all(checks.values()) else 1


if __name__ == "__main__":
    sys.exit(main())
