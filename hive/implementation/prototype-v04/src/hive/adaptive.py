"""Bounded, resumable adaptive routing experiments.

This module keeps candidate decisions experimental. It never writes or promotes an
approved checkpoint and never allows validation evidence to update the policy.
"""
from __future__ import annotations

import copy
import json
import os
import signal
import threading
import time
from pathlib import Path

from .failure_triage import triage
from .learning_policy import Policy
from .metric_engine import utility
from .orchestrator import Executor, code_version, config_hash, worker_lock
from .storage import Store
from .task_spec import CATEGORIES, load_tasks
from .verifier import verify


_VERSION = 1
_CAMPAIGN_KEY = "adaptive_campaign"


class _AdaptivePaused(RuntimeError):
    """Ordinary STOP or budget barrier; evidence remains resumable."""


def _candidate_rows(store, refs):
    rows = []
    for task_id, ref in refs.items():
        bundle = store.read_artifact(ref)
        task, verification, result = bundle["task"], bundle["verification"], bundle["result"]
        rows.append({
            "task_id": task_id,
            "category": task["category"],
            "valid": verification["valid"],
            "passed": verification["passed"],
            "critical": task["critical"],
            "utility": bundle["utility"],
            "latency_s": result["latency_s"],
            "tokens": result["tokens"],
        })
    return rows


def _phase_entry(store, state, phase, task, route, executor, hypothesis):
    key = f"adaptive:{state['manifest_hash']}:{phase}:{task['id']}:{route}"
    job_id = store.enqueue_once(key, {
        "task": task, "route": route, "allow_retry": False, "retry_count": 0,
        "learn_feedback": False,
        "hypothesis": hypothesis,
    })
    job = store.get_job(job_id)
    if job["result"] and job["result"].get("evidence_ref"):
        ref = job["result"]["evidence_ref"]
        return job_id, ref
    barrier = executor.barrier(route)
    if barrier:
        store.set("stop_reason", barrier)
        state.update(state="PAUSED", stop_reason=barrier, paused_phase=phase)
        store.set(_CAMPAIGN_KEY, state)
        raise _AdaptivePaused(barrier)
    outcome = executor.run_one()
    if outcome is None:
        reason = store.get("stop_reason") or "executor stopped before scheduled job"
        state.update(state="PAUSED", stop_reason=reason, paused_phase=phase)
        store.set(_CAMPAIGN_KEY, state)
        raise _AdaptivePaused(reason)
    if outcome["id"] != job_id:
        raise RuntimeError("Adaptive job order changed; refusing to attach unrelated evidence")
    if not outcome.get("evidence_ref"):
        raise RuntimeError(f"Adaptive job {job_id} finished without evidence")
    return job_id, outcome["evidence_ref"]


def _save_progress(store, state, phase, rows, budget):
    state["progress"] = {"phase": phase, "rows": rows, "budget": budget}
    store.set(_CAMPAIGN_KEY, state)


def _learning_state(store):
    keys = ("policy", "learning_environment", "stale_policy")
    return {key: {"present": store.get(key) is not None, "value": store.get(key)} for key in keys}


def _restore_learning_state(store, snapshot):
    for key, item in snapshot.items():
        if item["present"]:
            store.set(key, item["value"])
        else:
            store.db.execute("DELETE FROM kv WHERE key=?", (key,))


def _diagnose_candidate(store, candidate, exc, refs):
    reason = f"{type(exc).__name__}: {exc}"
    fake_job = {"id": f"adaptive-{candidate}", "spec": {"retry_count": 0}}
    diagnosis = triage(fake_job, "EVALUATION", reason, list(refs.values()))
    diagnosis["next_spec"] = None
    diagnosis["state"] = "QUARANTINED"
    return store.put_artifact(diagnosis), reason


def _verified_evidence(store, ref, task, route, config, build, *, job_id=None, persist_binding=True):
    """Revalidate persisted evidence before resume or assessment."""
    if job_id is not None:
        job = store.get_job(job_id)
        if (job.get("spec", {}).get("task") != task or job.get("spec", {}).get("route") != route
                or job.get("result", {}).get("evidence_ref") != ref):
            raise ValueError("Adaptive evidence reference is not bound to its recorded job")
    bundle = store.read_artifact(ref)
    if job_id is not None and bundle.get("job_id") != job_id:
        raise ValueError("Adaptive evidence bundle belongs to a different job")
    if bundle.get("task") != task or bundle.get("route") != route:
        raise ValueError("Persisted adaptive evidence does not match the preregistered task and route")
    if bundle.get("build", {}).get("source_sha256") != build.get("source_sha256"):
        raise ValueError("Persisted adaptive evidence was produced by a different source build")
    run_config = bundle.get("config")
    if not isinstance(run_config, dict):
        raise ValueError("Persisted adaptive evidence has no run configuration")
    if bundle.get("config_hash") != config_hash(run_config):
        raise ValueError("Persisted adaptive evidence run configuration hash mismatch")
    for key, value in config.items():
        if key == "timeout_s":
            if run_config.get(key, 0) > value or run_config.get(key, 0) <= 0:
                raise ValueError("Persisted adaptive evidence exceeds configured timeout")
        elif run_config.get(key) != value:
            raise ValueError("Persisted adaptive evidence configuration mismatch")
    result = bundle.get("result", {})
    checked = verify(task, result)
    if checked != bundle.get("verification"):
        raise ValueError("Persisted adaptive verifier evidence does not reproduce")
    expected_utility = utility(checked["quality"], checked["unsupported"], result["latency_s"], result["tokens"])
    if bundle.get("utility") != expected_utility:
        raise ValueError("Persisted adaptive utility does not reproduce")
    if route.startswith("local_") and (checked.get("valid") is True or result.get("model_digest")):
        binding = {"model": result.get("model"), "model_digest": result.get("model_digest")}
        if binding["model"] != config.get("model") or not isinstance(binding["model_digest"], str) or not binding["model_digest"]:
            raise ValueError("Successful local evidence lacks the configured model identity")
        previous_binding = store.get("adaptive_model_binding")
        if previous_binding is not None and previous_binding != binding:
            raise ValueError("Configured local model identity changed during the adaptive campaign")
        if previous_binding is None and persist_binding:
            store.set("adaptive_model_binding", binding)
    return bundle


def _verify_completed_state(store, state, report, config, build, seed, rounds):
    rows = state.get("progress", {}).get("rows", {})
    development = rows.get("development", {})
    validation = rows.get("validation", {})
    expected_dev = load_tasks("development", seed, 1)
    expected_val = load_tasks("validation", seed, 1)
    for task in expected_dev:
        recorded = development.get(task["id"], {})
        for route in ("local_direct", "local_tool"):
            item = recorded.get(route)
            if not item:
                raise ValueError("Completed adaptive run is missing development evidence")
            _verified_evidence(store, item["evidence_ref"], task, route, config, build,
                               job_id=item["job_id"], persist_binding=False)
    schedule = ["learned_greedy", "fixed_local_tool", "fixed_tool"][:rounds]
    routes = report.get("development", {}).get("routes", {})
    for task in expected_val:
        recorded = validation.get(task["id"], {})
        base = recorded.get("baseline")
        if not base:
            raise ValueError("Completed adaptive run is missing baseline validation evidence")
        _verified_evidence(store, base["evidence_ref"], task, "local_direct", config, build,
                           job_id=base["job_id"], persist_binding=False)
        for name in schedule:
            item = recorded.get(name)
            if not item:
                raise ValueError("Completed adaptive run is missing candidate validation evidence")
            route = routes[task["category"]] if name == "learned_greedy" else "local_tool" if name == "fixed_local_tool" else "tool"
            _verified_evidence(store, item["evidence_ref"], task, route, config, build,
                               job_id=item["job_id"], persist_binding=False)
    for candidate in report.get("candidates", []):
        ref = candidate.get("artifact_ref")
        if ref:
            item = store.read_artifact(ref)
            if item.get("candidate") != candidate.get("candidate") or item.get("promote_eligible") is not False:
                raise ValueError("Completed adaptive candidate artifact is inconsistent")
    if report.get("candidates") != state.get("candidate_results") or len(report["candidates"]) != rounds:
        raise ValueError("Completed report differs from the recorded candidate decisions")
    _verify_decisions(store, state, validation, schedule)


def _verify_decisions(store, state, validation, schedule):
    """Reproduce saved decisions in order, without trusting mutable acceptance flags."""
    from .adaptive_metrics import assess_candidate
    results = state.get("candidate_results", [])
    if [r.get("candidate") for r in results] != schedule[:len(results)]:
        raise ValueError("Persisted candidate decisions are not a schedule prefix")
    baseline_refs = {tid: v["baseline"]["evidence_ref"] for tid, v in validation.items()}
    baseline_rows = _candidate_rows(store, baseline_refs)
    incumbent_refs = baseline_refs
    incumbent = {"candidate": "baseline", "artifact_ref": None}
    for result in results:
        name = result["candidate"]
        refs = {tid: v[name]["evidence_ref"] for tid, v in validation.items()}
        if result.get("promote_eligible") is not False:
            raise ValueError("Experimental decision cannot grant promotion")
        if result.get("assessment") is not None:
            candidate_rows = _candidate_rows(store, refs)
            assessment = assess_candidate(_candidate_rows(store, incumbent_refs), candidate_rows)
            baseline_assessment = assess_candidate(baseline_rows, candidate_rows)
            if (result.get("assessment") != assessment or result.get("accepted") is not assessment["accepted"]
                    or result.get("baseline_comparison") != baseline_assessment):
                raise ValueError("Persisted candidate decision does not reproduce from verified evidence")
            saved = store.read_artifact(result["artifact_ref"])
            if (saved.get("candidate") != name or saved.get("assessment") != assessment
                    or saved.get("baseline_comparison") != baseline_assessment
                    or set(saved.get("candidate_refs", [])) != set(refs.values())
                    or set(saved.get("incumbent_refs", [])) != set(incumbent_refs.values())
                    or saved.get("promote_eligible") is not False or saved.get("approved") is not False):
                raise ValueError("Persisted candidate checkpoint is inconsistent")
        elif result.get("accepted") is not False or not result.get("diagnosis_ref"):
            raise ValueError("A failed assessment requires rejection and diagnosis")
        if result.get("diagnosis_ref"):
            store.read_artifact(result["diagnosis_ref"])
        if result["accepted"]:
            incumbent_refs = refs
            incumbent = {"candidate": name, "artifact_ref": result["artifact_ref"]}
    if (store.get("adaptive_incumbent_refs", baseline_refs) != incumbent_refs
            or store.get("experimental_incumbent", incumbent) != incumbent
            or state.get("experimental_incumbent", incumbent) != incumbent):
        raise ValueError("Persisted experimental incumbent differs from verified decisions")
    return incumbent_refs


def run_adaptive(root, config, *, rounds=3, seed=20261121, output_path=None) -> dict:
    # Keep ownership through pause/error records and policy/worker cleanup.
    with worker_lock(root):
        return _run_adaptive_locked(root, config, rounds=rounds, seed=seed, output_path=output_path)


def _run_adaptive_locked(root, config, *, rounds=3, seed=20261121, output_path=None) -> dict:
    """Run a finite adaptive experiment, resuming by stable store keys after restart.

    One shared Executor/store is used for every phase, so the mission budget is
    charged once. Development observations train a frozen greedy router. A fresh
    validation suite is paired across the fixed baseline and each scheduled
    candidate; repeated validation is selection evidence, not held-out proof.
    """
    if type(rounds) is not int or not 1 <= rounds <= 3:
        raise ValueError("rounds must be between 1 and 3 for the finite preregistered schedule")
    if type(seed) is not int or isinstance(seed, bool):
        raise ValueError("seed must be an integer")
    executor = Executor(root, config)
    store = executor.store
    previous_handlers = {}
    worker_started = False
    learning_state_restored = False
    try:
        configured = store.get("mission_config_hash")
        expected_config = config_hash(config)
        if configured is not None and configured != expected_config:
            raise ValueError("Mission configuration is immutable; adaptive run cannot reset its budget")
        if configured is None:
            store.set("mission_config_hash", expected_config)
        previous = store.get(_CAMPAIGN_KEY)
        if previous and previous.get("state") == "ERROR":
            raise ValueError("Adaptive run stopped on recorded integrity failure: " + previous.get("stop_reason", "unknown"))
        build = code_version()
        manifest_build = build
        prior_manifest = None
        if previous:
            prior_manifest = store.read_artifact(previous["manifest_ref"])
            prior_build = prior_manifest.get("build", {})
            if (prior_build.get("source_sha256") != build.get("source_sha256")
                    or prior_build.get("version") != build.get("version")):
                raise ValueError("Adaptive source changed; preserved run cannot resume")
            # Git commits that only update evidence/docs do not change runtime identity.
            manifest_build = prior_build
        plan = {
            "version": _VERSION,
            "seed": seed,
            "rounds": rounds,
            "development": {"split": "development", "count_per_category": 1,
                            "routes": ["local_direct", "local_tool"]},
            "validation": {"split": "validation", "count_per_category": 1,
                           "candidates": ["learned_greedy", "fixed_local_tool", "fixed_tool"][:rounds]},
            "baseline": "fixed local_direct",
            "selection_label": "Repeated validation is development selection evidence, not heldout proof.",
            "max_local_requests": 12 + 6 + 6 * sum(name != "fixed_tool" for name in ["learned_greedy", "fixed_local_tool", "fixed_tool"][:rounds]),
            "hypothesis": "Verified development feedback can choose a local route that improves paired validation quality without critical regressions; utility is descriptive.",
        }
        manifest = {"plan": plan, "config": config, "build": manifest_build,
                    "config_hash": expected_config, "created": previous.get("created", time.time()) if previous else time.time()}
        manifest_hash = config_hash(manifest)
        if previous:
            old_manifest = prior_manifest
            if previous.get("manifest_hash") != manifest_hash or config_hash(old_manifest) != manifest_hash:
                raise ValueError("Adaptive plan, source, or config changed; preserved run cannot resume")
            if previous.get("state") == "FINISHED" and previous.get("report_ref"):
                report = store.read_artifact(previous["report_ref"])
                _verify_completed_state(store, previous, report, config, build, seed, rounds)
                learning_state_restored = True
                if output_path:
                    path = Path(output_path)
                    path.parent.mkdir(parents=True, exist_ok=True)
                    path.write_text(json.dumps(report, indent=2), encoding="utf-8")
                return report
            state = previous
        else:
            # Do not silently consume unrelated work from the mission queue.
            if any(j["state"] in {"QUEUED", "RUNNING", "VERIFYING", "REVIEWING"} for j in store.jobs()):
                raise ValueError("Drain existing mission work before starting adaptive evaluation")
            manifest_ref = store.put_artifact(manifest)
            state = {"manifest_ref": manifest_ref, "manifest_hash": manifest_hash,
                     "state": "RUNNING", "created": manifest["created"],
                     "learning_state_before": _learning_state(store),
                     "progress": {"phase": "preregistered", "rows": {}, "budget": executor._budget()},
                     "stages": [{"stage": "build", "status": "completed", "source": build},
                                {"stage": "preregister", "status": "completed", "plan_hash": manifest_hash}]}
            store.set(_CAMPAIGN_KEY, state)

        worker_started = True
        store.set("worker", {"pid": os.getpid(), "started": time.time(), "status": "running", "mode": "adaptive"})
        if threading.current_thread() is threading.main_thread():
            for sig in (signal.SIGINT, signal.SIGTERM):
                previous_handlers[sig] = signal.signal(sig, lambda *_: setattr(executor, "stopping", True))
        executor.recover()
        progress = state.get("progress", {"rows": {}})
        rows = progress.get("rows", {})
        dev_rows = rows.setdefault("development", {})
        validation = rows.setdefault("validation", {})
        hypothesis = plan["hypothesis"]

        state["stages"].append({"stage": "build", "status": "verified", "detail": "Using the durable Executor and finite built-in task families."})
        _save_progress(store, state, "development", rows, executor._budget())
        dev_tasks = load_tasks("development", seed, 1)
        for task in dev_tasks:
            task_row = dev_rows.setdefault(task["id"], {})
            for route in ("local_direct", "local_tool"):
                if route not in task_row:
                    job_id, ref = _phase_entry(store, state, "development", task, route, executor, hypothesis)
                    _verified_evidence(store, ref, task, route, config, build, job_id=job_id)
                    task_row[route] = {"job_id": job_id, "evidence_ref": ref}
                    _save_progress(store, state, "development", rows, executor._budget())
                else:
                    _verified_evidence(store, task_row[route]["evidence_ref"], task, route, config, build,
                                       job_id=task_row[route]["job_id"])

        # Candidate construction uses only verified development feedback.
        learned = Policy(mode="greedy", seed=seed)
        for task in dev_tasks:
            task_row = dev_rows[task["id"]]
            for route in ("local_direct", "local_tool"):
                evidence = _verified_evidence(store, task_row[route]["evidence_ref"], task, route, config, build,
                                              job_id=task_row[route]["job_id"])
                learned.observe(task["category"], route, evidence["verification"]["quality"],
                                evidence["utility"], valid=evidence["verification"]["valid"], split="development")
        policy_state = learned.snapshot()
        learned_routes = {category: learned.choose(category, ["local_direct", "local_tool"]) for category in CATEGORIES}
        learned_ref = store.put_artifact({"kind": "adaptive-experimental-policy", "mode": "greedy",
                                          "policy": policy_state, "routes": learned_routes,
                                          "development_refs": [v[r]["evidence_ref"] for v in dev_rows.values() for r in ("local_direct", "local_tool")]})
        _restore_learning_state(store, state["learning_state_before"])
        learning_state_restored = True
        state["experimental_incumbent"] = store.get("experimental_incumbent", {"candidate": "baseline", "artifact_ref": None})
        store.set("experimental_incumbent", state["experimental_incumbent"])
        state["experimental_policy_ref"] = learned_ref
        _save_progress(store, state, "validation", rows, executor._budget())

        validation_tasks = load_tasks("validation", seed, 1)
        schedule = ["learned_greedy", "fixed_local_tool", "fixed_tool"][:rounds]
        # Establish the fixed baseline first.
        for task in validation_tasks:
            task_row = validation.setdefault(task["id"], {})
            if "baseline" not in task_row:
                job_id, ref = _phase_entry(store, state, "validation_baseline", task, "local_direct", executor, hypothesis)
                _verified_evidence(store, ref, task, "local_direct", config, build, job_id=job_id)
                task_row["baseline"] = {"job_id": job_id, "evidence_ref": ref}
                _save_progress(store, state, "validation_baseline", rows, executor._budget())
            else:
                item = task_row["baseline"]
                _verified_evidence(store, item["evidence_ref"], task, "local_direct", config, build,
                                   job_id=item["job_id"])

        # Candidate test, verification, diagnosis and rollback are completed
        # before the next candidate gets any validation calls.
        from .adaptive_metrics import assess_candidate

        # Verify even fully assessed candidates before trusting their cached decisions.
        for task in validation_tasks:
            for name in schedule:
                item = validation[task["id"]].get(name)
                if item:
                    route = (learned_routes[task["category"]] if name == "learned_greedy"
                             else "local_tool" if name == "fixed_local_tool" else "tool")
                    _verified_evidence(store, item["evidence_ref"], task, route, config, build,
                                       job_id=item["job_id"])
        baseline_refs = {tid: v["baseline"]["evidence_ref"] for tid, v in validation.items()}
        baseline_rows = _candidate_rows(store, baseline_refs)
        results = list(state.get("candidate_results", []))
        incumbent_refs = _verify_decisions(store, state, validation, schedule)
        incumbent_rows = _candidate_rows(store, incumbent_refs)
        for name in schedule:
            prior_result = next((r for r in results if r.get("candidate") == name), None)
            if prior_result:
                continue
            for task in validation_tasks:
                task_row = validation[task["id"]]
                if name in task_row:
                    route = (learned_routes[task["category"]] if name == "learned_greedy"
                             else "local_tool" if name == "fixed_local_tool" else "tool")
                    item = task_row[name]
                    _verified_evidence(store, item["evidence_ref"], task, route, config, build,
                                       job_id=item["job_id"])
                    continue
                route = (learned_routes[task["category"]] if name == "learned_greedy"
                         else "local_tool" if name == "fixed_local_tool" else "tool")
                job_id, ref = _phase_entry(store, state, name, task, route, executor, hypothesis)
                _verified_evidence(store, ref, task, route, config, build, job_id=job_id)
                task_row[name] = {"job_id": job_id, "evidence_ref": ref}
                _save_progress(store, state, name, rows, executor._budget())
            candidate_refs = {tid: validation[tid][name]["evidence_ref"] for tid in validation}
            candidate_rows = _candidate_rows(store, candidate_refs)
            diagnosis_ref = None
            try:
                assessment = assess_candidate(incumbent_rows, candidate_rows)
                baseline_assessment = assess_candidate(baseline_rows, candidate_rows)
                accepted = assessment.get("accepted") is True
                decision_reason = assessment.get("reasons", [])
                state["stages"].append({"stage": "test", "candidate": name, "status": "completed", "n": assessment.get("n")})
                state["stages"].append({"stage": "verify", "candidate": name, "status": "completed", "valid_n": assessment.get("valid_n")})
                if not accepted:
                    diagnosis_ref, reason = _diagnose_candidate(store, name, ValueError("candidate assessment rejected: " + json.dumps(decision_reason)), candidate_refs)
                    state["stages"].append({"stage": "diagnose", "candidate": name, "status": "quarantined", "artifact_ref": diagnosis_ref, "reason": reason})
                snapshot = {"kind": "adaptive-candidate", "candidate": name,
                            "policy_ref": learned_ref if name == "learned_greedy" else None,
                            "routes": (learned_routes if name == "learned_greedy" else
                                       {c: "tool" for c in CATEGORIES} if name == "fixed_tool" else
                                       {c: "local_tool" for c in CATEGORIES}),
                            "assessment": assessment, "baseline_comparison": baseline_assessment,
                            "incumbent_refs": list(incumbent_refs.values()), "baseline_refs": list(baseline_refs.values()),
                            "candidate_refs": list(candidate_refs.values()), "diagnosis_ref": diagnosis_ref,
                            "promote_eligible": False, "approved": False}
                artifact_ref = store.put_artifact(snapshot)
                previous_incumbent = copy.deepcopy(state["experimental_incumbent"])
                if accepted:
                    state["experimental_incumbent"] = {"candidate": name, "artifact_ref": artifact_ref}
                    incumbent_refs = candidate_refs
                    incumbent_rows = candidate_rows
                    state["stages"].append({"stage": "improve", "candidate": name, "status": "experimental_incumbent_updated", "artifact_ref": artifact_ref})
                else:
                    # Keep the last experimental incumbent intact after regression.
                    state["experimental_incumbent"] = previous_incumbent
                    state["stages"].append({"stage": "improve", "candidate": name, "status": "rolled_back", "restored": previous_incumbent})
                results.append({"candidate": name, "accepted": accepted, "promote_eligible": False,
                                "assessment": assessment, "baseline_comparison": baseline_assessment,
                                "artifact_ref": artifact_ref, "diagnosis_ref": diagnosis_ref})
            except Exception as exc:
                diagnosis_ref, reason = _diagnose_candidate(store, name, exc, candidate_refs)
                state["stages"].append({"stage": "diagnose", "candidate": name, "status": "quarantined", "artifact_ref": diagnosis_ref, "reason": reason})
                previous_incumbent = copy.deepcopy(state["experimental_incumbent"])
                state["stages"].append({"stage": "improve", "candidate": name, "status": "rolled_back", "restored": previous_incumbent})
                results.append({"candidate": name, "accepted": False, "promote_eligible": False,
                                "assessment": None, "diagnosis_ref": diagnosis_ref, "reason": reason,
                                "candidate_refs": candidate_refs})
            state["candidate_results"] = results
            # A process death must retain all or none of an incumbent change.
            store.db.execute("BEGIN IMMEDIATE")
            try:
                store.set("adaptive_incumbent_refs", incumbent_refs)
                store.set("experimental_incumbent", state["experimental_incumbent"])
                _save_progress(store, state, "candidate_assessment", rows, executor._budget())
                store.db.execute("COMMIT")
            except BaseException:
                store.db.execute("ROLLBACK")
                raise

        state["state"] = "FINISHED"
        state["stop_reason"] = "completed finite preregistered schedule"
        report = {
            "run_id": manifest_hash[:12], "build": build, "config_hash": expected_config,
            "manifest_ref": state["manifest_ref"], "plan": plan,
            "label": "Repeated validation is development selection evidence, not heldout proof.",
            "stages": state["stages"], "development": {"feedback_rows": sum(len(v) for v in dev_rows.values()),
                                                            "policy_artifact": learned_ref, "routes": learned_routes},
            "baseline": {"route": "local_direct", "validation_refs": list(baseline_refs.values())},
            "candidates": results, "experimental_incumbent": state["experimental_incumbent"],
            "approved_checkpoint_changed": False, "current_checkpoint": store.get("current_checkpoint"),
            "budget": executor._budget(), "remaining_budget": {
                "requests": max(0, config["max_requests"] - executor._budget()["requests"]),
                "tokens_reserved": max(0, config["max_total_tokens"] - executor._budget()["tokens_reserved"]),
                "wall_s": max(0, config["max_wall_s"] - executor._budget()["wall_s"]),
                "cycles": max(0, config["max_cycles"] - executor._budget()["cycles"])},
            "next_action": "Review the aggregate report; a new run requires a fresh seed and budget.",
            "stop_reason": state["stop_reason"],
        }
        report_ref = store.put_artifact(report)
        state.update(report_ref=report_ref, budget=executor._budget())
        store.set(_CAMPAIGN_KEY, state)
        if output_path:
            path = Path(output_path)
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(json.dumps(report, indent=2), encoding="utf-8")
        return report
    except _AdaptivePaused as exc:
        state = store.get(_CAMPAIGN_KEY, {})
        state["state"] = "PAUSED"
        state["stop_reason"] = str(exc)
        store.set(_CAMPAIGN_KEY, state)
        rows = state.get("progress", {}).get("rows", {})
        validation = rows.get("validation", {})
        partial_report = {
            "run_id": state.get("manifest_hash", "")[:12],
            "build": code_version(), "config_hash": config_hash(config),
            "manifest_ref": state.get("manifest_ref"), "plan": plan,
            "label": "Repeated validation is development selection evidence, not heldout proof.",
            "state": "PAUSED", "stages": state.get("stages", []),
            "development": {"feedback_rows": sum(len(v) for v in rows.get("development", {}).values()),
                            "policy_artifact": state.get("experimental_policy_ref")},
            "baseline": {"route": "local_direct", "validation_refs": [v["baseline"]["evidence_ref"] for v in validation.values() if "baseline" in v]},
            "candidates": state.get("candidate_results", []),
            "experimental_incumbent": state.get("experimental_incumbent"),
            "approved_checkpoint_changed": False, "current_checkpoint": store.get("current_checkpoint"),
            "budget": executor._budget(),
            "remaining_budget": {"requests": max(0, config["max_requests"] - executor._budget()["requests"]),
                                 "tokens_reserved": max(0, config["max_total_tokens"] - executor._budget()["tokens_reserved"]),
                                 "wall_s": max(0, config["max_wall_s"] - executor._budget()["wall_s"]),
                                 "cycles": max(0, config["max_cycles"] - executor._budget()["cycles"])},
            "next_action": "Resume the same adaptive command with the unchanged source and config when ready.",
            "stop_reason": str(exc),
        }
        report_ref = store.put_artifact(partial_report)
        state["paused_report_ref"] = report_ref
        store.set(_CAMPAIGN_KEY, state)
        if output_path:
            path = Path(output_path)
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(json.dumps(partial_report, indent=2), encoding="utf-8")
        return partial_report
    except Exception as exc:
        # Integrity failures are terminal for this recorded run, not a still-running worker.
        if worker_started:
            failed = store.get(_CAMPAIGN_KEY, {})
            failed.update(state="ERROR", stop_reason=f"{type(exc).__name__}: {exc}")
            store.set(_CAMPAIGN_KEY, failed)
        raise
    finally:
        for sig, handler in previous_handlers.items():
            signal.signal(sig, handler)
        if worker_started:
            campaign_state = store.get(_CAMPAIGN_KEY, {})
            if campaign_state.get("stop_reason"):
                store.set("stop_reason", campaign_state["stop_reason"])
            snapshot = campaign_state.get("learning_state_before")
            if snapshot and not learning_state_restored:
                _restore_learning_state(store, snapshot)
            store.set("worker", {"pid": os.getpid(), "status": "stopped", "finished": time.time(), "mode": "adaptive"})
        executor.close()
