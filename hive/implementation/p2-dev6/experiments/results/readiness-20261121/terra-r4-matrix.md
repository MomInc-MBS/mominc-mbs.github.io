# R4 independent fault mapping — 2026-11-21

| Fault | Code path | Video path |
|---|---|---|
| Wrong job/task | `test_code_replay_rejects_other_mission_job`, `test_code_replay_rejects_changed_job_spec` | `test_video_replay_rejects_foreign_job_evidence` (job ID and task ID) |
| Corrupt output | `test_code_replay_rejects_corrupt_named_output` (verdict, trace, escaped output path) | `test_changed_source_and_corrupted_output_fail_closed`, `test_dag_replay_rejects_corrupt_video_output` |
| STOP/cancel | `test_code_stop_before_dispatch_survives_restart`, `test_code_stop_inflight_kills_worker_and_does_not_fake_success` | `test_stop_and_cycle_limit_prevent_output`, `test_stop_blocks_recreation_of_missing_cached_output`, DAG STOP/CANCEL pre-dispatch |
| Kill/recovery | `test_code_crash_evidence_commit_recovers_without_fake_completion` (before/after), `test_docker_worker_dies_after_host_process_is_killed` | `test_subprocess_death_after_claim_recovers_budget_and_feedback`, `test_subprocess_death_after_rename_reconciles_same_output` |
| Feedback crash | Not applicable: code dispatch explicitly disables learning; code crash test asserts zero feedback markers. | `test_video_feedback_transaction_crash_replays_once` kills during feedback transaction; rollback and one-time replay checked. |
| Budget/restart | `test_code_cycle_exhaustion_survives_restart_without_refill`, code crash charged 1?2 cycles | `test_stop_and_cycle_limit_prevent_output`, `test_cli_resume_charges_interruption_once_before_any_new_dispatch` |
| Isolation/input | Path traversal, secret/verifier patch, gitlink, repo/store junction, fake success, protected files, real Docker watchdog/caps | Path escape, symlink where OS permits, input/output junction, source/output identity |

Tests are engineering fault injections, not real Level A acceptance. Independent focused tests passed while source was changing; full frozen-source suite required for final result. A replay may repeat bounded deterministic execution after an interrupted attempt; it does not claim exactly-once execution.
