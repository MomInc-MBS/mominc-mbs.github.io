"""Preregistered outcome-matrix experiment and explicitly labelled policy replay."""
from __future__ import annotations
import copy
import json
import os
import random
import statistics
import subprocess
import sys
import time
from pathlib import Path

from .checkpoint_manager import Checkpoints
from .learning_policy import Policy
from .metric_engine import DEFAULT_WEIGHTS, paired_summary
from .model_registry import discover
from .objective_analysis import compare_objectives, prior_sensitivity
from .orchestrator import Executor, code_version, config_hash, worker_lock
from .review_gate import evaluate
from .task_spec import CATEGORIES, load_tasks
from .storage import Store


def consume_holdout(tasks, campaign_ref, ledger_root):
    """Repository ledger blocks reuse across mission stores; same campaign may resume."""
    with worker_lock(ledger_root):
        ledger = Store(ledger_root)
        try:
            for task in tasks:
                prior = ledger.get("consumed:" + task["id"])
                if prior is not None and prior != campaign_ref:
                    raise ValueError("This holdout was consumed by another campaign; predeclare a fresh suite")
            for task in tasks:
                ledger.set("consumed:" + task["id"], campaign_ref)
        finally:
            ledger.close()


def _policy(state, mode):
    value = copy.deepcopy(state)
    value["mode"] = mode
    return Policy(state=value)


def matrix_summary(rows, policy_state, seed):
    """Replay frozen decisions on shared outcomes; no learning from this matrix."""
    policies = {m: _policy(policy_state, m) for m in ("fixed", "greedy", "ucb", "random")}
    output = {m: [] for m in (*policies, "fixed_tool", "fixed_team", "learning_off")}
    selected = {m: [] for m in output}
    costs = {m: {"tokens": 0, "latency_s": 0.0, "model_calls": 0} for m in output}
    by_category = {m: {} for m in output}
    critical = {m: True for m in output}
    for row in rows:
        category = row["category"]
        for mode in output:
            route = (policies[mode].choose(category, ["local_direct", "local_tool"]) if mode in policies
                     else "local_direct" if mode == "learning_off" else "tool")
            item = row["routes"][route]
            q = item["quality"] if item["valid"] else 0
            output[mode].append(q)
            selected[mode].append(route)
            by_category[mode].setdefault(category, []).append(q)
            if row["critical"] and not q:
                critical[mode] = False
            costs[mode]["tokens"] += item["tokens"]
            costs[mode]["latency_s"] += item["latency_s"]
            costs[mode]["model_calls"] += int(route.startswith("local_"))
            if mode == "fixed_team":
                # Predeclared one-model + exact-tool team; the exact tool is final.
                # No ground-truth-conditioned routing or cherry-picked winner.
                direct = row["routes"]["local_direct"]
                costs[mode]["tokens"] += direct["tokens"]
                costs[mode]["latency_s"] += direct["latency_s"]
                costs[mode]["model_calls"] += 1
    return {
        "method": "frozen-policy offline replay on a shared, counterbalanced outcome matrix",
        "size": len(rows),
        "scores": {m: statistics.mean(v) for m, v in output.items()},
        "costs": costs,
        "paired_ucb_vs_fixed": paired_summary(output["ucb"], output["fixed"], seed),
        "learning_ablation": paired_summary(output["ucb"], output["learning_off"], seed),
        "by_category": {m: {c: statistics.mean(q) for c, q in vals.items()} for m, vals in by_category.items()},
        "critical_passed": critical,
        "selection_counts": {m: {r: selected[m].count(r) for r in set(selected[m])} for m in selected},
        "valid_evaluations": sum(item["valid"] for row in rows for item in row["routes"].values()),
        "expected_evaluations": len(rows) * 3,
        "objective_comparison": compare_objectives([dict(item, route=route) for row in rows for route, item in row["routes"].items()]),
    }


def run_campaign(root, config, output_path=None):
    executor = Executor(root, config)
    store = executor.store
    try:
        with worker_lock(root):
            previous = store.get("campaign")
            if previous and previous["state"] == "FINISHED":
                return store.read_artifact(previous["report_ref"])
            if not previous and any(j["state"] == "QUEUED" and j["spec"].get("kind") is None for j in store.jobs()):  # typed side-jobs (ooda_experiment) are not the shared queue
                raise ValueError("Drain existing queue before starting a comparison")
            manifest = store.read_artifact(previous["manifest_ref"]) if previous else {
                "version": 1, "created": time.time(), "build": code_version(), "config": config,
                "hypothesis": "Development feedback changes category routing and improves held-out quality versus fixed local_direct at equal per-call token limits.",
                "primary_candidate": "ucb", "primary_baseline": "fixed local_direct", "weights": DEFAULT_WEIGHTS,
                "splits": {"development": 3, "validation": 2, "holdout": 4},
                "routes": ["local_direct", "local_tool", "tool"],
                "stopping_rule": "One fixed campaign; no extension after seeing holdout; stop at budget or kill switch.",
                "promotion": "95% paired CI lower > 0 plus all hard gates; six task families insufficient for general superiority.",
                "runtime": discover(config["endpoint"]),
            }
            expected_digest = next((m["digest"] for m in manifest["runtime"]["models"] if m["id"] == config["model"]), None)
            if not expected_digest:
                raise ValueError("Configured local model is not available with a manifest digest")
            if config_hash(manifest["config"]) != config_hash(config) or manifest["build"]["source_sha256"] != code_version()["source_sha256"]:
                raise ValueError("Campaign configuration/source changed; preserved evidence requires original version to resume")
            manifest_ref = previous["manifest_ref"] if previous else store.put_artifact(manifest)
            store.set("campaign", {"manifest_ref": manifest_ref, "state": "RUNNING"})
            executor.recover()
            summaries = {}
            all_refs = []
            frozen = store.get("frozen_candidate")
            for split, count in manifest["splits"].items():
                if split != "development" and frozen is None:
                    frozen = store.get("policy") or Policy(seed=config["seed"]).snapshot()
                    store.set("frozen_candidate", frozen)
                    store.set("frozen_candidate_hash", config_hash(frozen))
                if split == "holdout":
                    prior = store.get("holdout_consumed")
                    if prior and prior != {"manifest_ref": manifest_ref, "candidate_hash": config_hash(frozen)}:
                        raise ValueError("Holdout already consumed by a different candidate")
                    store.set("holdout_consumed", {"manifest_ref": manifest_ref, "candidate_hash": config_hash(frozen)})
                tasks = load_tasks(split, config["seed"], count)
                if split == "holdout":
                    consume_holdout(tasks, manifest_ref, Path(__file__).resolve().parents[2] / ".hive" / "holdout-ledger")
                rng = random.Random(config["seed"] + {"development": 0, "validation": 1, "holdout": 2}[split])
                rng.shuffle(tasks)
                rows = []
                for task in tasks:
                    row = {"task_id": task["id"], "category": task["category"], "critical": task["critical"], "routes": {}}
                    routes = list(manifest["routes"])
                    rng.shuffle(routes)
                    for route in routes:
                        job_id = store.enqueue_once("campaign:" + task["id"] + ":" + route,
                                                    {"task": task, "route": route, "allow_retry": False,
                                                     "retry_count": 0, "hypothesis": manifest["hypothesis"]})
                        existing = store.get_job(job_id)
                        if existing.get("result", {}) and existing["result"].get("evidence_ref"):
                            outcome = {"id": job_id, "evidence_ref": existing["result"]["evidence_ref"]}
                        else:
                            outcome = executor.run_one()
                        if outcome is None:
                            store.set("campaign", {"manifest_ref": manifest_ref, "state": "BLOCKED", "reason": store.get("stop_reason")})
                            return store.get("campaign")
                        if outcome["id"] != job_id:
                            raise RuntimeError("Comparison job order changed; quarantine campaign")
                        evidence = store.read_artifact(outcome["evidence_ref"])
                        if evidence["build"]["source_sha256"] != manifest["build"]["source_sha256"]:
                            raise RuntimeError("Source changed during campaign; quarantine evidence")
                        if route.startswith("local_") and evidence["result"].get("model_digest") != expected_digest:
                            raise RuntimeError("Model digest changed or is missing; quarantine comparison")
                        all_refs.append(outcome["evidence_ref"])
                        row["routes"][route] = {
                            "quality": evidence["verification"]["quality"], "valid": evidence["verification"]["valid"],
                            "unsupported": evidence["verification"]["unsupported"],
                            "tokens": evidence["result"]["tokens"], "latency_s": evidence["result"]["latency_s"],
                        }
                    rows.append(row)
                if split == "development":
                    # Development summary is descriptive; selection is frozen afterwards.
                    state = store.get("policy") or Policy(seed=config["seed"]).snapshot()
                else:
                    state = frozen
                    if config_hash(store.get("policy") or Policy(seed=config["seed"]).snapshot()) != config_hash(frozen):
                        raise RuntimeError("Policy changed outside development")
                summaries[split] = matrix_summary(rows, state, config["seed"])
                store.set("campaign_progress", {"completed_split": split, "budget": executor._budget()})
                if split != "holdout":
                    store.put_artifact({"split": split, "rows": rows})
            evidence_index = store.put_artifact({"refs": all_refs, "candidate_hash": config_hash(frozen)})
            # A new interpreter restores artifacts and reruns independent verifiers.
            reproduction = subprocess.run([sys.executable, "-m", "hive", "--store", str(Path(root).resolve()),
                                           "reproduce", "--index", evidence_index], capture_output=True, text=True, timeout=60,
                                          env=dict(os.environ, PYTHONPATH=str(Path(__file__).resolve().parents[1])))
            reproduced = reproduction.returncode == 0
            reproduction_record = {"returncode": reproduction.returncode, "stdout": reproduction.stdout, "stderr": reproduction.stderr,
                                   "scope": "fresh-process saved-output verification and policy restoration; no fresh model samples"}
            reproduction_ref = store.put_artifact(reproduction_record)
            held = summaries["holdout"]
            no_regression = all(held["by_category"]["ucb"][c] >= held["by_category"]["fixed"][c] for c in CATEGORIES)
            gate_input = {
                "provenance_valid": reproduced and all(s["valid_evaluations"] == s["expected_evaluations"] for s in summaries.values()),
                "critical_passed": held["critical_passed"]["ucb"],
                "reviewer_independent": False,  # Design reviews are not signed experiment approvals.
                "holdout_locked": True, "holdout_unused_for_learning": True,
                "no_regression": no_regression, "within_budget": executor.barrier() is None,
                "fresh_process_reproduced": False,  # Need independently repeated live inference for promotion.
                "ablation_passed": held["learning_ablation"]["ci_low"] > 0,
                "author_id": "hive-runtime", "reviewer_id": "pending-independent-experiment-review",
                "paired_summary": held["paired_ucb_vs_fixed"],
            }
            decision = evaluate(gate_input)
            checkpoint = Checkpoints(store).save(frozen, {"manifest_ref": manifest_ref, "index": evidence_index,
                                                       "decision": decision, "reproduction_ref": reproduction_ref}, approved=False)
            report = {
                "cycle_id": config_hash(manifest)[:12], "build": manifest["build"], "config_hash": config_hash(config),
                "hypothesis": manifest["hypothesis"], "change": "category-bucketed policy updated from verified development outcomes",
                "manifest_ref": manifest_ref, "candidate_hash": config_hash(frozen), "splits": summaries,
                "prior_sensitivity": {category: {route: prior_sensitivity(v["successes"], v["n"] - v["successes"]) for route, v in bucket.items()} for category, bucket in frozen["counts"].items()},
                "verification": {"index": evidence_index, "fresh_process": reproduction_ref, "saved_outputs_reproduced": reproduced},
                "failure_classification": "EXPERIMENTAL" if decision["decision"] != "PROMOTE" else None,
                "decision": decision, "gate_input": gate_input, "experimental_checkpoint": checkpoint,
                "rollback_checkpoint": store.get("current_checkpoint"), "budget": executor._budget(),
                "next_experiment": {"hypothesis": "A new, broader task-family suite can distinguish tool competence from simple template ceiling effects.",
                                    "owner": "SOL", "state": "QUEUED", "requires": "New predeclared suite and fresh holdout; never tune from sealed case details"},
                "limitations": ["One local model, six synthetic task families; policy learning only, no weight training.",
                                "Shared-outcome offline replay, not independent online deployment trials.",
                                "Bootstrap task units share family templates; interval is descriptive, not general superiority evidence.",
                                "Equal per-call limits; actual tokens and latency reported separately; warm-cache order counterbalanced.",
                                "Holdout is logically sealed by the API; the trusted local operator can inspect files.",
                                "Fresh process reproduces evaluation, not stochastic local inference."],
            }
            report_ref = store.put_artifact(report)
            store.set("campaign", {"manifest_ref": manifest_ref, "state": "FINISHED", "report_ref": report_ref, "decision": decision})
            store.set("next_research", report["next_experiment"])
            if output_path:
                path = Path(output_path)
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(json.dumps(report, indent=2), encoding="utf-8")
            return report
    finally:
        executor.close()
