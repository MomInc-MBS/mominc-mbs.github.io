"""A bounded, quarantined adaptation experiment over structured missions."""
from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path

from .adaptive_metrics import assess_candidate
from .orchestrator import code_version, config_hash, inspect_evidence, worker_lock
from .storage import Store
from .structured_data import mission_task_hash, run_structured_mission
from .verifier import verify

_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$")
_PLAN_FIELDS = {"version", "id", "development", "comparison", "subsequent"}


def _load_json(value, name):
    if isinstance(value, dict):
        return dict(value)
    path = Path(value)
    if path.stat().st_size > 256 * 1024:
        raise ValueError(f"{name} exceeds 256 KiB")
    try:
        result = json.loads(path.read_text(encoding="utf-8-sig"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ValueError(f"{name} must be readable UTF-8 JSON") from exc
    if not isinstance(result, dict):
        raise ValueError(f"{name} must be a JSON object")
    return result


def _load_manifest(value):
    manifest = _load_json(value, "structured manifest")
    if manifest.get("procedure", "baseline_v1") != "baseline_v1":
        raise ValueError("input manifests must start with baseline_v1; recovery is derived only after training feedback")
    # The mission adapter performs strict source/schema/path/hash validation.
    mission_task_hash(manifest)
    return manifest


def _derived_id(manifest_id: str, suffix: str) -> str:
    digest = hashlib.sha256((manifest_id + ":" + suffix).encode()).hexdigest()[:8]
    return manifest_id[:54] + "-" + suffix[:1] + digest


def _recovery_manifest(manifest: dict) -> dict:
    value = dict(manifest)
    value["id"] = _derived_id(manifest["id"], "recovery")
    value["procedure"] = "labels_json_recovery_v1"
    return value


def _normalize_plan(value):
    plan = _load_json(value, "prototype learning plan")
    if set(plan) - _PLAN_FIELDS or type(plan.get("version")) is not int or plan["version"] != 1:
        raise ValueError("unsupported prototype learning plan")
    if not isinstance(plan.get("id"), str) or not _ID.fullmatch(plan["id"]):
        raise ValueError("learning plan id must contain 1 to 64 safe characters")
    if not isinstance(plan.get("comparison"), list) or not 1 <= len(plan["comparison"]) <= 10:
        raise ValueError("plan needs 1 to 10 distinct comparison manifests")
    development = _load_manifest(plan.get("development"))
    comparison = [_load_manifest(item) for item in plan["comparison"]]
    subsequent = _load_manifest(plan.get("subsequent"))
    manifests = [development, *comparison, subsequent]
    if len({item["id"] for item in manifests}) != len(manifests):
        raise ValueError("development, comparison, and subsequent mission IDs must be unique")
    if len({item["source_group"] for item in manifests}) != len(manifests):
        raise ValueError("development, comparison, and subsequent source groups must be pairwise disjoint")
    if len({item["input_sha256"] for item in manifests}) != len(manifests):
        raise ValueError("development, comparison, and subsequent input hashes must be pairwise disjoint")
    family = (development["task_type"], development["schema_id"])
    if any((item["task_type"], item["schema_id"]) != family for item in manifests[1:]):
        raise ValueError("all plan manifests must use the same fixed task and schema")
    normalized = {"version": 1, "id": plan["id"], "development": development,
                  "comparison": comparison, "subsequent": subsequent}
    return normalized


def prepare_prototype_learning(plan_path_or_dict) -> dict:
    """Return frozen manifests and the exact central approval fingerprints they need."""
    plan = _normalize_plan(plan_path_or_dict)
    variants = [plan["development"], *plan["comparison"], plan["subsequent"]]
    if plan["development"]["task_type"] == "classification":
        variants.extend(_recovery_manifest(item) for item in [*plan["comparison"], plan["subsequent"]])
    from .prototype_approval import manifest_fingerprint
    approval_tasks = [{"id": item["id"], "manifest_sha256": manifest_fingerprint(item)} for item in variants]
    if len({item["id"] for item in variants}) != len(variants):
        raise ValueError("derived recovery manifest IDs collide; choose shorter base mission IDs")
    return {"schema_version": 1, "plan": plan, "plan_sha256": config_hash(plan),
            "required_approval_manifests": variants, "required_approval_tasks": approval_tasks,
            "source_groups": [item["source_group"] for item in [plan["development"], *plan["comparison"], plan["subsequent"]]],
            "input_sha256": [item["input_sha256"] for item in [plan["development"], *plan["comparison"], plan["subsequent"]]]}


def _evidence_row(store: Store, result: dict, manifest: dict):
    """Recheck saved execution and project its observed quality, including verified failures."""
    if result.get("synthetic") is True or len(result.get("job_ids", [])) != 1:
        return None
    job_id = result["job_ids"][0]
    job = store.get_job(job_id)
    evidence_ref = (job.get("result") or {}).get("evidence_ref")
    if not evidence_ref:
        return None
    evidence = inspect_evidence(store, job_id)
    if (evidence.get("job_id") != job_id
            or evidence.get("task", {}).get("source_sha256") != manifest["input_sha256"]
            or evidence.get("task", {}).get("source_group") != manifest["source_group"]):
        raise ValueError("structured learning evidence is not bound to its approved source")
    checked = verify(evidence["task"], evidence["result"])
    # inspect_evidence resolves and hashes the immutable artifact using the
    # job result's evidence_ref. The artifact cannot contain its own ref: that
    # would make its content hash self-referential.
    if checked != evidence.get("verification"):
        raise ValueError("structured learning evidence failed independent replay")
    machine = result.get("machine_verdict")
    if (not isinstance(machine, dict) or type(machine.get("valid")) is not bool
            or type(machine.get("passed")) is not bool
            or machine["valid"] != (checked.get("valid") is True)
            or machine["passed"] != (checked.get("valid") is True and checked.get("passed") is True)):
        raise ValueError("structured mission verdict disagrees with independently replayed evidence")
    # The row is a usable observation when source, execution and verifier evidence replay.
    # A verifier-invalid model output remains a recorded quality failure (passed=False).
    return {"task_id": manifest["input_sha256"], "category": evidence["task"]["category"],
            "critical": bool(evidence["task"]["critical"]), "valid": True,
            "passed": bool(checked.get("valid") is True and checked.get("passed") is True
                            and machine["passed"] is True and result.get("status") == "VERIFIED"),
            "utility": evidence["utility"], "latency_s": evidence["result"]["latency_s"],
            "tokens": evidence["result"]["tokens"], "evidence_ref": evidence_ref}


def _outcome(result, manifest):
    return {"status": result.get("status", "FAILED"),
            "quality": int(result.get("status") == "VERIFIED" and result.get("machine_verdict", {}).get("passed") is True),
            "source_group": manifest["source_group"], "input_sha256": manifest["input_sha256"],
            "job_ids": list(result.get("job_ids", [])), "failure_reason": (
                result.get("failure_reason") or result.get("machine_verdict", {}).get("reason")
                if result.get("machine_verdict", {}).get("passed") is not True else None),
            "synthetic": result.get("synthetic", False),
            "identity": result.get("identity", {}), "machine_verdict": result.get("machine_verdict", {}),
            "schema_verdict": result.get("schema_verdict", {})}


def _arm(name, status, quality=0, aliases=None, **extra):
    return {"name": name, "status": status, "quality": quality,
            "aliases": list(aliases or []), **extra}


def _run_one(manifest, store_path, executor_config):
    return run_structured_mission(manifest, store_path, executor_config=executor_config)


def run_prototype_learning(plan_path_or_dict, store_path, *, executor_config=None) -> dict:
    """Run a frozen development→comparison→subsequent procedure experiment.

    A winning procedure remains experimental; it never edits or promotes P0.
    """
    prepared = prepare_prototype_learning(plan_path_or_dict)
    plan = prepared["plan"]
    root = Path(store_path).absolute()
    root.mkdir(parents=True, exist_ok=True)
    if executor_config is None:
        # Deterministic tool-only default shares the finite store ledger across
        # all phases. Per-mission one-cycle caps would make every later source
        # look stopped even though it is within this experiment's allocation.
        from .prototype_approval import tool_config
        config = tool_config()
    else:
        config = dict(executor_config)
    identity = {"plan_sha256": prepared["plan_sha256"], "config_hash": config_hash(config),
                "runtime": code_version()}
    key = "prototype_learning"
    stage_key = "prototype_learning_stages"
    with worker_lock(root / ".prototype-learning-control"):
        store = Store(root)
        try:
            previous = store.get("prototype_learning_identity")
            if previous is not None and previous != identity:
                raise ValueError("prototype learning plan/config/runtime is frozen; use its original store")
            if previous is None:
                # Persist the entire plan and finite candidate set before dispatch.
                frozen_ref = store.put_artifact(prepared)
                store.set("prototype_learning_identity", identity)
                store.set("prototype_learning_plan", frozen_ref)
                store.set(stage_key, {})
                store.set(key, {"status": "RUNNING", "phase": "DEVELOPMENT", "source_groups": prepared["source_groups"],
                                "prior_policy": "P0", "beneficial_learning": False,
                                "production_promoted": False})
            stages = store.get(stage_key, {})
        finally:
            store.close()

        def save_stage(name: str, manifest: dict, result: dict):
            store = Store(root)
            try:
                saved_stages = store.get(stage_key, {})
                old = saved_stages.get(name)
                if old is not None:
                    same_identity = (old.get("identity", {}).get("mission_identity")
                                     == result.get("identity", {}).get("mission_identity"))
                    resumed_progress = (old.get("status") == "STOPPED"
                                        and result.get("status") != "STOPPED" and same_identity)
                    if (not same_identity or (not resumed_progress and old.get("status") != result.get("status"))
                            or (not resumed_progress and old.get("named_output_hashes") != result.get("named_output_hashes"))):
                        raise ValueError("structured mission replay changed frozen stage evidence")
                saved_stages[name] = result
                store.set(stage_key, saved_stages)
                progress = store.get(key, {})
                progress.update(status="RUNNING", phase=name, source_groups=prepared["source_groups"])
                store.set(key, progress)
            finally:
                store.close()

        def budget_snapshot():
            store = Store(root)
            try:
                return store.get("budget", {"requests": 0, "tokens_reserved": 0, "tokens_actual": 0,
                                              "wall_s": 0.0, "cycles": 0})
            finally:
                store.close()

        def stop_result(phase: str, development=None, candidate_ref=None):
            result = {"status": "STOPPED", "phase": phase, "candidate_ref": candidate_ref,
                      "prior_policy": "P0", "hypothesis": "No adaptation claim while the frozen mission is incomplete.",
                      "source_groups": prepared["source_groups"], "comparison_arms": [],
                      "decision": {"accepted": False, "reasons": ["STOP interrupted the bounded experiment"]},
                      "development": _outcome(development, plan["development"]) if development else None,
                      "subsequent_task_id": None, "beneficial_learning": False,
                      "production_promoted": False, "budget": budget_snapshot()}
            store = Store(root)
            try:
                store.set(key, result)
            finally:
                store.close()
            return result

        def run_or_replay(name: str, manifest: dict):
            result = _run_one(manifest, root, config)
            save_stage(name, manifest, result)
            return result

        development_manifest = plan["development"]
        development = run_or_replay("development", development_manifest)
        if development.get("status") == "STOPPED":
            return stop_result("DEVELOPMENT", development)

        procedure = "baseline_v1"
        hypothesis = "No verified schema-recovery intervention has been established; retain P0 behavior."
        development_observation = None
        store = Store(root)
        try:
            stage_map = store.get(stage_key, {})
            if development.get("status") != "REVIEW_PENDING" or development.get("synthetic") is not True:
                development_observation = _evidence_row(store, development, development_manifest)
            governing = store.get("governing_policy")
            prior_policy_hash = config_hash(governing) if governing is not None else config_hash(None)
            if (development_manifest["task_type"] == "classification" and development_observation is not None
                    and development.get("synthetic") is not True
                    and development.get("schema_verdict", {}).get("shape_valid") is False):
                procedure = "labels_json_recovery_v1"
                hypothesis = ("On distinct classification sources, the fixed labels-only JSON recovery instruction "
                              "will reduce output-schema failures relative to P0 at the same model and caps; ties or regressions reject it.")
            candidate = {"schema_version": 1, "kind": "hive-structured-procedure-candidate-v1",
                         "plan_sha256": prepared["plan_sha256"], "prior_policy": "P0",
                         "prior_policy_hash": prior_policy_hash, "procedure": procedure,
                         "hypothesis": hypothesis,
                         "development": _outcome(development, development_manifest),
                         "development_evidence_ref": development.get("identity", {}).get("evidence_ref"),
                         "promoted": False}
            candidate_ref = store.put_artifact(candidate)
            saved = store.get(key, {})
            saved.update(candidate_ref=candidate_ref, procedure=procedure, hypothesis=hypothesis,
                         prior_policy_hash=prior_policy_hash,
                         development=_outcome(development, development_manifest))
            store.set(key, saved)
        finally:
            store.close()

        if (root / "STOP").exists():
            return stop_result("COMPARISON", development, candidate_ref)

        baseline_rows, candidate_rows, fixed_team_rows = [], [], []
        arms_by_name = {name: [] for name in
                        ("P0", "candidate", "strongest_tool", "fixed_specialist", "fixed_team", "learning_disabled")}
        comparison_detail = []
        for index, source_manifest in enumerate(plan["comparison"]):
            source_key = source_manifest["input_sha256"]
            baseline = run_or_replay(f"comparison:{index}:P0", source_manifest)
            if baseline.get("status") == "STOPPED":
                return stop_result("COMPARISON", development, candidate_ref)
            if procedure == "baseline_v1":
                candidate_result = baseline
                candidate_manifest = source_manifest
                candidate_aliases = ["P0", "learning_disabled", "fixed_specialist"]
            else:
                candidate_manifest = _recovery_manifest(source_manifest)
                candidate_result = run_or_replay(f"comparison:{index}:candidate", candidate_manifest)
                candidate_aliases = []
                if candidate_result.get("status") == "STOPPED":
                    return stop_result("COMPARISON", development, candidate_ref)

            if source_manifest["task_type"] == "inventory":
                team_manifest, team_result, team_aliases = source_manifest, baseline, ["P0", "candidate", "strongest_tool"]
            elif (baseline.get("status") == "FAILED" and baseline.get("schema_verdict", {}).get("shape_valid") is False
                  and baseline.get("synthetic") is not True):
                if procedure == "labels_json_recovery_v1":
                    team_manifest, team_result, team_aliases = candidate_manifest, candidate_result, ["candidate"]
                else:
                    team_manifest = _recovery_manifest(source_manifest)
                    team_result = run_or_replay(f"comparison:{index}:fixed_team", team_manifest)
                    team_aliases = []
                    if team_result.get("status") == "STOPPED":
                        return stop_result("COMPARISON", development, candidate_ref)
            else:
                team_manifest, team_result, team_aliases = source_manifest, baseline, ["P0"]

            p0_outcome = _outcome(baseline, source_manifest)
            candidate_outcome = _outcome(candidate_result, candidate_manifest)
            stage_store = Store(root)
            try:
                p0_observation = _evidence_row(stage_store, baseline, source_manifest)
                candidate_observation = _evidence_row(stage_store, candidate_result, candidate_manifest)
            finally:
                stage_store.close()
            if team_result is candidate_result:
                team_observation = candidate_observation
            elif team_result is baseline:
                team_observation = p0_observation
            else:
                team_store = Store(root)
                try:
                    team_observation = _evidence_row(team_store, team_result, team_manifest)
                finally:
                    team_store.close()
            if p0_observation is not None:
                baseline_rows.append(p0_observation)
            if candidate_observation is not None:
                candidate_rows.append(candidate_observation)
            # Keep the conditional fixed team in the denominator even when its
            # recovery call is blocked or returns review-pending evidence.
            if team_observation is None:
                arms_by_name["fixed_team"].append(({"status": team_result.get("status", "BLOCKED"),
                    "quality": 0, "source_group": source_manifest["source_group"],
                    "input_sha256": source_key, "reason": team_result.get("failure_reason")}, team_aliases))
            else:
                fixed_team_rows.append(team_observation)

            p0_aliases = []
            arms_by_name["P0"].append((p0_outcome, p0_aliases))
            arms_by_name["candidate"].append((candidate_outcome, candidate_aliases))
            if source_manifest["task_type"] == "inventory":
                tool_outcome, tool_aliases = p0_outcome, ["P0", "candidate", "learning_disabled"]
                specialist = {"status": "NOT_APPLICABLE", "quality": 0, "reason": "exact inventory is pinned to the deterministic tool"}
            else:
                tool_outcome = {"status": "NOT_APPLICABLE", "quality": 0, "reason": "classification has no permitted deterministic label tool"}
                tool_aliases = []
                specialist = p0_outcome
            arms_by_name["strongest_tool"].append((tool_outcome, tool_aliases))
            arms_by_name["fixed_specialist"].append((specialist, ["P0"] if source_manifest["task_type"] == "classification" else []))
            if team_observation is not None:
                team_outcome = _outcome(team_result, team_manifest)
                arms_by_name["fixed_team"].append((team_outcome, team_aliases))
            arms_by_name["learning_disabled"].append((p0_outcome, ["P0"]))
            comparison_detail.append({"input_sha256": source_key, "source_group": source_manifest["source_group"],
                                      "P0": p0_outcome, "candidate": candidate_outcome,
                                      "candidate_procedure": candidate_manifest.get("procedure", "baseline_v1"),
                                      "fixed_team": _outcome(team_result, team_manifest)})

        assessments = {}
        reasons = []
        if procedure == "baseline_v1":
            reasons.append("candidate is behaviorally identical to P0")
        if len(baseline_rows) != len(plan["comparison"]) or len(candidate_rows) != len(plan["comparison"]):
            reasons.append("blocked, review-pending, synthetic, or unverifiable comparison rows remain in the denominator")
            assessments["P0"] = {"accepted": False, "valid": False, "reasons": ["incomplete comparison evidence"],
                                 "planned_n": len(plan["comparison"]),
                                 "observed_n": min(len(baseline_rows), len(candidate_rows))}
        else:
            try:
                assessment = assess_candidate(baseline_rows, candidate_rows)
                assessments["P0"] = assessment
                if not assessment["accepted"]:
                    reasons.extend(assessment["reasons"])
            except ValueError as exc:
                assessments["P0"] = {"accepted": False, "valid": False,
                                     "reasons": [f"candidate assessment rejected: {exc}"],
                                     "planned_n": len(plan["comparison"])}
                reasons.extend(assessments["P0"]["reasons"])

        if len(fixed_team_rows) != len(plan["comparison"]):
            reasons.append("fixed-team comparison has blocked, review-pending, synthetic, or unverifiable rows")
            assessments["fixed_team"] = {"accepted": False, "valid": False,
                "reasons": ["incomplete fixed-team evidence"], "planned_n": len(plan["comparison"]),
                "observed_n": len(fixed_team_rows)}
        elif len(candidate_rows) == len(plan["comparison"]):
            try:
                team_assessment = assess_candidate(fixed_team_rows, candidate_rows)
                assessments["fixed_team"] = team_assessment
                if not team_assessment["accepted"]:
                    reasons.append("candidate did not strictly beat the conditional fixed-team control")
            except ValueError as exc:
                assessments["fixed_team"] = {"accepted": False, "valid": False,
                    "reasons": [f"fixed-team assessment rejected: {exc}"], "planned_n": len(plan["comparison"])}
                reasons.extend(assessments["fixed_team"]["reasons"])

        if len(plan["comparison"]) < 2:
            reasons.append("one comparison source cannot support a transferable procedure claim")
        if any(row["P0"]["synthetic"] or row["candidate"]["synthetic"] for row in comparison_detail):
            reasons.append("synthetic comparison evidence cannot satisfy a real mission")
        # A candidate is retained only when every comparison is real, verified,
        # equal-capped, and strictly better than the P0 observation.
        equal_caps = all(row["P0"]["identity"].get("config_hash") == row["candidate"]["identity"].get("config_hash")
                         for row in comparison_detail)
        if not equal_caps:
            reasons.append("comparison route configurations or caps differ")
        strict_gain = bool(assessments.get("P0", {}).get("accepted"))
        candidate_accepted = bool(procedure != "baseline_v1" and strict_gain
                                  and assessments.get("fixed_team", {}).get("accepted") is True
                                  and equal_caps and len(plan["comparison"]) >= 2
                                  and not any(row["P0"]["synthetic"] or row["candidate"]["synthetic"]
                                              for row in comparison_detail)
                                  and all(row["candidate"]["status"] in {"VERIFIED", "FAILED"}
                                          and row["P0"]["status"] in {"VERIFIED", "FAILED"}
                                          and row["fixed_team"]["status"] in {"VERIFIED", "FAILED"}
                                          for row in comparison_detail))
        if not candidate_accepted and not reasons:
            reasons.append("all applicable comparisons did not establish a strict quality gain")

        aggregate_arms = []
        for name, records in arms_by_name.items():
            outcomes = [entry[0] for entry in records]
            aliases = sorted({alias for _, row_aliases in records for alias in row_aliases})
            quality = sum(int(item.get("quality", 0)) for item in outcomes) / max(1, len(outcomes))
            statuses = [item.get("status", "FAILED") for item in outcomes]
            if all(status == "NOT_APPLICABLE" for status in statuses):
                status = "NOT_APPLICABLE"
            elif all(status == "VERIFIED" for status in statuses):
                status = "VERIFIED"
            elif all(status == "REVIEW_PENDING" for status in statuses):
                status = "REVIEW_PENDING"
            elif any(status == "BLOCKED" for status in statuses):
                status = "BLOCKED"
            else:
                status = "MIXED_OR_FAILED"
            aggregate_arms.append(_arm(name, status, quality, aliases,
                                       planned=len(plan["comparison"]),
                                       outcomes=[{"status": item.get("status"), "quality": item.get("quality"),
                                                  "source_group": item.get("source_group"),
                                                  "input_sha256": item.get("input_sha256"),
                                                  "reason": item.get("reason", item.get("failure_reason"))}
                                                 for item in outcomes]))

        selected_procedure = procedure if candidate_accepted else "baseline_v1"
        subsequent_manifest = plan["subsequent"] if selected_procedure == "baseline_v1" else _recovery_manifest(plan["subsequent"])
        subsequent = run_or_replay("subsequent", subsequent_manifest)
        executed_subsequent_procedure = subsequent_manifest.get("procedure", "baseline_v1")
        if subsequent.get("status") == "STOPPED":
            return stop_result("SUBSEQUENT", development, candidate_ref)
        if selected_procedure != "baseline_v1" and subsequent.get("status") != "VERIFIED":
            candidate_accepted = False
            reasons.append("experimental procedure failed the separately approved subsequent mission")
            selected_procedure = "baseline_v1"

        store = Store(root)
        try:
            current_governing = store.get("governing_policy")
            current_policy_hash = config_hash(current_governing) if current_governing is not None else config_hash(None)
            if current_policy_hash != prior_policy_hash:
                raise ValueError("learning comparison changed governing P0")
            report = {"schema_version": 1, "status": "EXPERIMENTAL" if candidate_accepted else "REJECTED",
                      "candidate_ref": candidate_ref, "prior_policy": "P0", "prior_policy_hash": prior_policy_hash,
                      "candidate_procedure": procedure, "selected_procedure": selected_procedure,
                      "selected_procedure_for_future": selected_procedure,
                      "executed_subsequent_procedure": executed_subsequent_procedure,
                      "hypothesis": hypothesis, "source_groups": prepared["source_groups"],
                      "comparison_arms": aggregate_arms, "comparison_detail": comparison_detail,
                      "assessment": assessments, "decision": {"accepted": candidate_accepted,
                          "reasons": list(dict.fromkeys(reasons)) if reasons else ["strict paired quality improvement demonstrated; candidate remains experimental"],
                          "p0_changed": False, "promote_eligible": False},
                      "development": _outcome(development, development_manifest),
                      "subsequent_task_id": subsequent_manifest["id"],
                      "subsequent": _outcome(subsequent, subsequent_manifest),
                      "budget": store.get("budget", {}), "plan_sha256": prepared["plan_sha256"],
                      "config_hash": config_hash(config), "current_policy_hash": current_policy_hash,
                      "provenance_limitations": [
                          "Source groups and content hashes are pairwise distinct as declared and pinned; this does not independently prove source provenance or statistical independence."],
                      "beneficial_learning": False, "production_promoted": False}
            report_ref = store.put_artifact(report)
            report["evidence_ref"] = report_ref
            store.set(key, report)
            return report
        finally:
            store.close()
