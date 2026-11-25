# P2 development counterexamples

This is a map to executable engineering checks, not a claim of Level A/B
acceptance. H01-H11 retain their original test IDs and definitions. The current
run's exact outcomes and failures are indexed in `CURRENT_STATE.md`.

| Counterexample from the handoff | Existing or new executable check |
|---|---|
| Exact result versus plausible model guess | Historical inventory rejection in `replay_integration_export.py`; v4 eligibility controls in `test_p2_exact_abstention.py` |
| Changed or ambiguous ground truth | `test_integration_acceptance.py::test_tampered_source_size_cannot_match_stale_output`; `test_p2_exact_tool.py` ambiguous-claim checks |
| Missing or false verifier | P2 availability/canary tests; `test_grok_counterexamples.py::test_malformed_verifier_cannot_update_policy`; v4 partition feedback checks |
| Tool unavailable or permission withdrawn | `p2_abstention_comparison.py`; new v4 exact-tool abstention tests |
| Stale or cross-specialist/source memory | `test_p2_contracts.py` partition identities and `test_p2_partition_feedback.py`; H05 contamination fixture |
| Failed resumption | `test_readiness_mechanism.py`; `test_resume_accounting.py`; H11 replay |
| Duplicate side effect | `test_shared_mission.py::test_dag_running_stage_recovers_without_extra_dispatch`; `test_video_integrity.py` reconciled output checks |
| False-positive acceptance | `test_code_isolation.py::test_real_mission_rejects_false_success_and_evaluator_leak`; `test_v03_evaluation_boundary.py` |
| Budget exhaustion or STOP | `test_governed_run.py`; `test_adaptive.py`; `test_code_isolation.py` STOP/cycle/restart checks |
| Exposed holdout | `test_v03_evaluation_boundary.py` one-use/source-alias tests; `test_campaign.py::test_holdout_ledger_prevents_cross_campaign_reuse` |
| Worse candidate than incumbent | `test_p2_exact_tool.py::test_p2_regression_counterexample_cannot_pass_candidate_gate`; `test_adaptive_integrity.py` |
| Policy/contract receipt rebound or downgraded | `test_p2_replay.py`; v4 replay/contract tests |

Tool outages and model availability in the decision comparison are explicitly
injected development conditions. No model answer is generated or assigned a
quality score. The existing six-input tool comparison runs real deterministic
outputs through unchanged controls and the candidate; ties cannot pass the
quality-improvement gate. Real specialist/team arms remain blocked by zero new
inference allocation.

The finite controller does not claim exactly-once arbitrary external effects,
general code solving, source-independent learning or weight training. Completed
operation receipts prevent duplicate completed work; interrupted deterministic
work may be retried with its cost charged. Irreversible external actions remain
outside this experiment.
