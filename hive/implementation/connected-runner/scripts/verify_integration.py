"""Fresh-process replay, STOP/resume, experimental rollback, and public receipts."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
from hive.storage import Store


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--store", required=True)
    parser.add_argument("--report", required=True)
    parser.add_argument("--manifest", default="experiments/manifests/integration-20261121.json")
    parser.add_argument("--config", default="configs/integration-20261121.json")
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    report = json.loads(Path(args.report).read_text(encoding="utf-8"))
    target = Path(args.output)
    if target.exists():
        raise ValueError("Use a new verification evidence directory; historical results are immutable")
    target.mkdir(parents=True)
    commands = []
    def cli(*command):
        argv = [sys.executable, "-m", "hive", "--store", args.store, *command]
        start = time.monotonic()
        done = subprocess.run(argv, cwd=ROOT, env=dict(os.environ, PYTHONPATH=str(ROOT / "src")),
                              capture_output=True, text=True, encoding="utf-8", timeout=60)
        commands.append({"argv": argv, "returncode": done.returncode, "stdout": done.stdout,
                         "stderr": done.stderr, "elapsed_s": time.monotonic() - start})
        if done.returncode:
            raise RuntimeError(done.stderr)
        return json.loads(done.stdout)
    before = cli("status")
    replay = cli("integration", "--manifest", args.manifest, "--config", args.config)
    assert replay["replayed"] and replay["additional_model_calls"] == 0
    cli("stop")
    stopped = cli("status")
    assert stopped["kill_switch"] is True
    cli("resume")
    restored = cli("rollback", "--experimental", report["initial_snapshot"])
    assert restored["candidate_hash"] != report["candidate_hash"]
    assert restored["governing_hash"] == report["governing_hash"]
    candidate = cli("rollback", "--experimental", report["candidate_snapshot"])
    assert candidate["candidate_hash"] == report["candidate_hash"]
    second = cli("integration", "--manifest", args.manifest, "--config", args.config)
    after = cli("status")
    assert second["replayed"] and after["budget"] == before["budget"]
    assert after["champion"] is None and after["kill_switch"] is False
    store = Store(args.store)
    try:
        refs = {report["initial_snapshot"], report["candidate_snapshot"], store.get("integration_report"),
                store.get("integration_manifest")}
        for entry in report["execution_index"]:
            refs.add(entry["evidence_ref"])
            evidence = store.read_artifact(entry["evidence_ref"])
            refs.add(evidence["decision_ref"])
            result = store.get_job(entry["job"])["result"]
            refs.add(result["report_ref"])
            if result.get("failure"):
                refs.add(result["failure"]["artifact_ref"])
            feedback = store.get("feedback:" + entry["job"])
            if feedback:
                refs.add(feedback)
        for decision in report["comparison_decisions"]:
            if decision["control"] in ("candidate", "strongest_fixed"):
                refs.add(store.get("integration_choice:" + decision["control"] + ":" + decision["task_id"]))
        for ref in list(refs):
            record = store.read_artifact(ref)
            if record.get("kind") == "experimental-policy-snapshot-v1":
                refs.update(record["evidence"])
        digests = {}
        for ref in sorted(refs):
            value = store.read_artifact(ref)
            data = (store.root / ref).read_bytes()
            destination = target / ref
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(data)
            digests[ref] = hashlib.sha256(data).hexdigest()
        events = [dict(row) for row in store.db.execute("SELECT * FROM events ORDER BY seq")]
        (target / "events.json").write_text(json.dumps(events, indent=2), encoding="utf-8")
    finally:
        store.close()
    receipt = {"fresh_process_replays": 2, "stop_resume_verified": True,
               "experimental_restore_verified": True, "production_promotion": False,
               "candidate_hash": report["candidate_hash"], "governing_hash": report["governing_hash"],
               "budget_before": before["budget"], "budget_after": after["budget"],
               "new_model_calls": after["budget"]["requests"] - before["budget"]["requests"],
               "identity": report["identity"], "artifact_sha256": digests, "commands": commands}
    (target / "verification.json").write_text(json.dumps(receipt, indent=2), encoding="utf-8")
    print(json.dumps({key: value for key, value in receipt.items() if key not in ("commands", "artifact_sha256")}, indent=2))


if __name__ == "__main__":
    main()
