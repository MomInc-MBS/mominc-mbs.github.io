"""A durable integration mission over the existing Executor, not a second runtime.

Comparisons never grant production authority. A losing candidate is a complete,
useful integration result, while a winning one waits for independent approval.
"""
from __future__ import annotations

import json
from pathlib import Path

from .adaptive_metrics import assess_candidate
from .learning_policy import Policy
from .metric_engine import utility
from .orchestrator import Executor, code_version, config_hash, inspect_evidence, load_config, worker_lock
from .verifier import _task_ok


def load_manifest(path):
    path = Path(path)
    if path.stat().st_size > 131072:
        raise ValueError("Integration manifest exceeds 128 KiB")
    manifest = json.loads(path.read_text(encoding="utf-8-sig"))
    if (manifest.get("version") != 1 or not isinstance(manifest.get("id"), str) or
        manifest.get("controls") != ["incumbent", "candidate", "strongest_fixed", "learning_disabled"]):
        raise ValueError("Unsupported integration contract or missing controls")
    tasks = manifest.get("tasks", {})
    groups = [manifest.get(name) for name in ("train", "comparison", "subsequent")]
    if not all(isinstance(group, list) and group for group in groups):
        raise ValueError("Separate training, comparison and subsequent inputs required")
    ids = [key for group in groups for key in group]
    if len(ids) != len(set(ids)) or set(ids) != set(tasks):
        raise ValueError("Training, comparison and subsequent tasks must be disjoint")
    for key, task in tasks.items():
        if (not _task_ok(task) or task["id"] != key or task["split"] != "development" or
            task.get("contract_version") != 1 or not task.get("success_criteria") or
            not isinstance(task.get("permissions", {}).get("routes"), list)):
            raise ValueError("Each integration task needs a versioned, scoped development contract")
    return manifest


def _snapshot(store, kind, policy, evidence):
    ref = store.put_artifact({"kind": "experimental-policy-snapshot-v1", "name": kind,
                              "policy": policy, "policy_hash": config_hash(policy),
                              "evidence": evidence, "production_approved": False})
    store.set("experimental_snapshot:" + ref, True)
    return ref


def restore_experimental(store, ref):
    """Restore candidate learning state only; never modify the governing policy."""
    with worker_lock(store.root / ".integration-control"):
        return _restore_experimental(store, ref)


def _restore_experimental(store, ref):
    if store.get("experimental_snapshot:" + ref) is not True:
        raise ValueError("Unknown experimental snapshot")
    value = store.read_artifact(ref)
    if (value.get("kind") != "experimental-policy-snapshot-v1" or
        value.get("production_approved") is not False or
        config_hash(value["policy"]) != value["policy_hash"]):
        raise ValueError("Invalid experimental snapshot")
    Policy(state=value["policy"])
    active = store.get("governing_policy")
    store.set("policy", value["policy"])
    receipt = {"experimental_only": True, "restored": ref,
               "candidate_hash": value["policy_hash"], "governing_hash": config_hash(active)}
    store.set("last_experimental_rollback", receipt)
    return receipt


def _row(evidence):
    return {"task_id": evidence["task"]["id"], "category": evidence["task"]["category"],
            "critical": evidence["task"]["critical"], "valid": evidence["verification"]["valid"],
            "passed": evidence["verification"]["passed"], "utility": evidence["utility"],
            "latency_s": evidence["result"]["latency_s"], "tokens": evidence["result"]["tokens"]}


def _write_report(path, value):
    if path:
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        if path.exists():
            # A replay produces the same immutable report; never replace another run.
            if json.loads(path.read_text(encoding="utf-8")) != value:
                raise ValueError("Refusing to overwrite different integration evidence")
        else:
            path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def _job(executor, manifest, name, stage, route=None, learn=False, policy_hash=None):
    task = manifest["tasks"][name]
    key = f"integration:{stage}:{name}"
    spec = {"task": task, "route": route, "learn_feedback": learn, "allow_retry": False,
            "retry_count": 0, "hypothesis": f"integration/{stage}",
            "comparison_policy_hash": policy_hash}
    job_id = executor.store.enqueue_once(key, spec)
    job = executor.store.get_job(job_id)
    if job["spec"] != spec:
        raise ValueError("Persisted mission job no longer matches its frozen stage contract")
    if (job.get("result") or {}).get("evidence_ref"):
        return job_id, _validated_evidence(executor, job_id, task, route)
    # Only this mission's bounded jobs may be dispatched from this store.
    for pending in executor.store.jobs():
        if pending["state"] == "QUEUED" and not pending["spec"].get("hypothesis", "").startswith("integration/"):
            raise ValueError("Integration store contains unrelated queued work")
    result = executor.loop(1)
    job = executor.store.get_job(job_id)
    if not (job.get("result") or {}).get("evidence_ref"):
        reason = (job.get("result") or {}).get("reason") or executor.store.get("stop_reason")
        return job_id, {"blocked": True, "reason": reason, "execution": result}
    return job_id, _validated_evidence(executor, job_id, task, route)


def _validated_evidence(executor, job_id, task, route, expected_ref=None):
    store = executor.store
    job = store.get_job(job_id)
    ref = (job.get("result") or {}).get("evidence_ref")
    if expected_ref is not None and ref != expected_ref:
        raise ValueError("Completed job evidence reference changed")
    evidence = inspect_evidence(store, job_id)
    if evidence.get("job_id") != job_id or evidence.get("task") != task:
        raise ValueError("Job and task evidence binding mismatch")
    if route is not None and evidence["route"] != route:
        raise ValueError("Executed route differs from frozen comparison choice")
    if evidence["build"]["source_sha256"] != store.get("integration_identity")["source_sha256"]:
        raise ValueError("Evidence source differs from frozen mission")
    observed = dict(evidence["config"])
    if config_hash(observed) != evidence["config_hash"]:
        raise ValueError("Execution configuration hash mismatch")
    if not 0 < observed["timeout_s"] <= executor.config["timeout_s"]:
        raise ValueError("Execution timeout exceeded mission cap")
    observed["timeout_s"] = executor.config["timeout_s"]
    observed.pop("_expected_model_digest", None)
    if observed != executor.config:
        raise ValueError("Execution configuration differs from mission")
    verdict, result = evidence["verification"], evidence["result"]
    if utility(verdict["quality"], verdict["unsupported"], result["latency_s"], result["tokens"]) != evidence["utility"]:
        raise ValueError("Evidence utility does not reproduce")
    decision = store.read_artifact(evidence["decision_ref"])
    if (decision["task_hash"] != config_hash(task) or decision["selected_route"] != evidence["route"] or
        decision["config_hash"] != config_hash(executor.config) or
        decision["source_hash"] != evidence["build"]["source_sha256"]):
        raise ValueError("Governance receipt does not bind this execution")
    return evidence


def _replay(executor, report):
    rows = {name: [] for name in ("incumbent", "candidate", "strongest_fixed", "learning_disabled")}
    for entry in report["execution_index"]:
        job = executor.store.get_job(entry["job"])
        if config_hash(job["spec"]) != entry["spec_hash"]:
            raise ValueError("Completed job specification changed")
        evidence = _validated_evidence(executor, entry["job"], entry["task"], entry["route"], entry["evidence_ref"])
        control = job["spec"]["hypothesis"].removeprefix("integration/comparison/")
        if control in rows:
            rows[control].append(_row(evidence))
    candidate = executor.store.read_artifact(report["candidate_snapshot"])
    if candidate["policy_hash"] != report["candidate_hash"] or config_hash(candidate["policy"]) != report["candidate_hash"]:
        raise ValueError("Frozen candidate hash changed")
    _check_candidate_feedback(executor, candidate)
    if _comparisons(rows) != report["comparisons"]:
        raise ValueError("Comparison assessment does not reproduce")
    if config_hash(executor.store.get("governing_policy")) != report["governing_hash"]:
        raise ValueError("Governing policy changed since the recorded mission")
    return report


def _check_candidate_feedback(executor, candidate):
    initial = executor.store.read_artifact(executor.store.get("integration_initial_snapshot"))
    reconstructed = Policy(state=initial["policy"])
    for ref in candidate["evidence"]:
        evidence = executor.store.read_artifact(ref)
        task, verdict = evidence["task"], evidence["verification"]
        from .verifier import verify
        if (task["split"] != "development" or not verdict["valid"] or
            verify(task, evidence["result"]) != verdict or
            executor.store.get("feedback:" + evidence["job_id"]) != ref):
            raise ValueError("Candidate feedback provenance is invalid")
        reconstructed.observe(task["category"], evidence["route"], verdict["quality"], evidence["utility"])
    if config_hash(reconstructed.snapshot()) != candidate["policy_hash"]:
        raise ValueError("Candidate is not reproduced by attributable feedback")


def _comparisons(rows):
    results = {}
    for control in ("incumbent", "strongest_fixed", "learning_disabled"):
        try:
            results[control] = assess_candidate(rows[control], rows["candidate"])
        except ValueError as exc:
            results[control] = {"accepted": False, "valid": False, "reasons": [str(exc)]}
    return results


def run_integration(root, manifest_path, config_path=None, output_path=None):
    with worker_lock(Path(root) / ".integration-control"):
        return _run_integration(root, manifest_path, config_path, output_path)


def _run_integration(root, manifest_path, config_path=None, output_path=None):
    manifest = load_manifest(manifest_path)
    config = load_config(config_path)
    executor = Executor(root, config)
    store = executor.store
    try:
        identity = {"manifest_hash": config_hash(manifest), "config_hash": config_hash(config),
                    "source_sha256": code_version()["source_sha256"]}
        old = store.get("integration_identity")
        if old is not None and old != identity:
            raise ValueError("Frozen integration identity changed; no spending or budget reset permitted")
        if old is None:
            if store.jobs() or store.get("budget"):
                raise ValueError("Integration needs its own explicitly bounded mission store")
            store.db.execute("BEGIN IMMEDIATE")
            try:
                store.set("integration_identity", identity)
                store.set("integration_manifest", store.put_artifact(manifest))
                initial = Policy(seed=config["seed"]).snapshot()
                store.set("policy", initial)
                store.set("integration_initial_snapshot", _snapshot(store, "P0-candidate-before-feedback", initial, []))
                store.db.execute("COMMIT")
            except BaseException:
                store.db.execute("ROLLBACK")
                raise
        saved = store.get("integration_report")
        if saved:
            report = _replay(executor, store.read_artifact(saved))
            _write_report(output_path, report)
            return {**report, "replayed": True, "additional_model_calls": 0}
        jobs = []
        training = []
        for name in manifest["train"]:
            job_id, evidence = _job(executor, manifest, name, "training", learn=True)
            jobs.append(job_id)
            if evidence.get("blocked"):
                return {"status": "BLOCKED", "stage": "training", "job": job_id, **evidence}
            training.append({"job": job_id, "route": evidence["route"], "passed": evidence["verification"]["passed"],
                             "input_hash": config_hash(evidence["task"]["input"]),
                             "output_hash": config_hash(evidence["result"]["output"]),
                             "model": evidence["result"]["model"], "digest": evidence["result"]["model_digest"]})
        candidate_ref = store.get("integration_candidate_snapshot")
        if candidate_ref is None:
            candidate_ref = _snapshot(store, "P1-from-verified-feedback", store.get("policy"),
                                      [store.get("feedback:" + job_id) for job_id in jobs if store.get("feedback:" + job_id)])
            store.set("integration_candidate_snapshot", candidate_ref)
        candidate_record = store.read_artifact(candidate_ref)
        _check_candidate_feedback(executor, candidate_record)
        candidate = Policy(state=candidate_record["policy"])
        active = store.get("governing_policy")
        active_hash = config_hash(active)
        rows = {key: [] for key in manifest["controls"]}
        decisions = []
        for name in manifest["comparison"]:
            task = manifest["tasks"][name]
            for control in manifest["controls"]:
                policy_hash = candidate_record["policy_hash"] if control == "candidate" else active_hash
                policy = candidate if control == "candidate" else Policy(mode="fixed", seed=config["seed"])
                route = None
                if control in ("candidate", "strongest_fixed"):
                    choice_key = "integration_choice:" + control + ":" + name
                    choice_ref = store.get(choice_key)
                    if choice_ref is None:
                        selected = executor._decision(task, None, policy)
                        if selected["selected"] is None:
                            return {"status": "BLOCKED", "stage": "comparison/" + control, "reason": "no eligible route"}
                        choice_ref = store.put_artifact({"policy_hash": policy_hash, "decision": selected["receipt"]})
                        store.set(choice_key, choice_ref)
                    choice = store.read_artifact(choice_ref)
                    if choice["policy_hash"] != policy_hash or choice["decision"]["task_hash"] != config_hash(task):
                        raise ValueError("Frozen comparison choice changed")
                    route = choice["decision"]["selected_route"]
                job_id, evidence = _job(executor, manifest, name, "comparison/" + control,
                                        route=route, learn=False, policy_hash=policy_hash)
                jobs.append(job_id)
                if evidence.get("blocked"):
                    return {"status": "BLOCKED", "stage": "comparison/" + control, "job": job_id, **evidence}
                rows[control].append(_row(evidence))
                decisions.append({"control": control, "job": job_id, "task_id": name,
                                  "policy_hash": policy_hash, "route": evidence["route"],
                                  "passed": evidence["verification"]["passed"]})
        if config_hash(store.get("policy")) != candidate_record["policy_hash"]:
            raise ValueError("Comparison leaked into candidate feedback")
        comparisons = _comparisons(rows)
        eligible = all(result["accepted"] for result in comparisons.values())
        decision = "AWAITING_INDEPENDENT_APPROVAL" if eligible else "REJECTED"
        if config_hash(store.get("governing_policy")) != active_hash:
            raise ValueError("Comparison changed the governing policy without approval")
        subsequent = []
        for name in manifest["subsequent"]:
            job_id, evidence = _job(executor, manifest, name, "subsequent", learn=False)
            jobs.append(job_id)
            if evidence.get("blocked"):
                return {"status": "BLOCKED", "stage": "subsequent", "job": job_id, **evidence}
            subsequent.append({"job": job_id, "route": evidence["route"],
                               "passed": evidence["verification"]["passed"], "governing_hash": active_hash})
        completed = all(item["passed"] for item in training + subsequent)
        report = {"status": "FRAMEWORK_WIRED", "functional_missions_passed": completed,
                  "independent_acceptance": "pending", "identity": identity, "build": code_version(),
                  "training": training, "candidate_decision": decision, "comparisons": comparisons,
                  "comparison_decisions": decisions, "subsequent": subsequent, "jobs": jobs,
                  "candidate_snapshot": candidate_ref, "candidate_hash": candidate_record["policy_hash"],
                  "initial_snapshot": store.get("integration_initial_snapshot"),
                  "execution_index": [{"job": job_id, "spec_hash": config_hash(store.get_job(job_id)["spec"]),
                                       "task": store.get_job(job_id)["spec"]["task"],
                                       "route": store.read_artifact(store.get_job(job_id)["result"]["evidence_ref"])["route"],
                                       "evidence_ref": store.get_job(job_id)["result"]["evidence_ref"]} for job_id in jobs],
                  "governing_hash": active_hash, "budget": executor._budget(),
                  "production_policy_promoted": False, "adaptation_validated": False,
                  "level_a": "not_accepted", "level_b": "not_accepted",
                  "limits": ["Small development demonstration; no held-out performance claim.",
                             "Model classification agreement with independently supplied labels, not universal semantic truth.",
                             "Rejected candidate leaves governing P0 unchanged.",
                             "No frontier-model comparison or neural weight training."]}
        store.set("integration_report", store.put_artifact(report))
        _write_report(output_path, report)
        return report
    finally:
        executor.close()
