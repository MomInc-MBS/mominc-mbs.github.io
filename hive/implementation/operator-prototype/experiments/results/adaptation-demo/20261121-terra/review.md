# Independent integration review — 2026-11-21

Reviewer: Terra/gpt-6.1-terra. Frozen runtime commit `28239aba838fa7f6b2d04719ec75d629d1b14308`, source SHA-256 `c73866989d9c03253af8eb199b0c93509adbc50b92bcab7e0a29fde15db0d9d2`, v0.3.0.dev3.

**Decision: accept the bounded integrated prototype demonstration, including the directive's valid rejected-candidate path. Adaptation is not validated; Level A and Level B are not accepted.** This is evidence for the finite, development-only workflow, not general intelligence, frontier-model benefit, production policy promotion, or neural-weight training. Restore evidence covers experimental candidate state; the governing P0 remained unchanged and production-policy rollback was not exercised.

## Directive section 8

| Requirement | Evidence and boundary |
| --- | --- |
| Single entry and existing controller | `python -m hive --store .hive/integration-20261121 integration --manifest experiments/manifests/integration-20261121.json --config configs/integration-20261121.json` uses the shared Executor. Saved completed-run replay reproduced without dispatch. |
| Objective tool task and artifact | Inventory training and subsequent tool jobs passed independent grouped-count verification; content-addressed result and governance artifacts are recorded. |
| Real local specialist and identity | Classification training passed against independently authored development labels; saved receipt identifies Ollama, `myr5-hold-local:latest`, digest `a45646773d1ee8a6c1557c7de09a68e78a74f2990c4174a1408f65e777db150c`, request and output. This review made no calls and establishes saved receipt consistency, not a new live reproduction. |
| Shared routing, execution, evidence and verifier | Both training routes have persisted governor decisions, Executor jobs, artifact hashes and independent verifier outputs; all 11 jobs were checked. |
| Independent objective check | Inventory aggregation is recomputed from source rows. Classification is agreement with independent development labels, not universal semantic certainty. |
| Inspectable decisions and failures | Eleven job specs, artifact digests, source/config bindings, decisions and verdicts replayed. The JSON receipt records per-job hashes; inspect and status commands are documented. |
| Feedback produces candidate | P1 snapshot was reconstructed from the initial state and both verified, attributable training feedback artifacts; hash matched the frozen candidate. |
| Later task or valid rejection | P1 selected local model for inventory comparison and failed where P0's tool passed; all four classification comparison arms failed. Paired quality delta was -0.5 against each recorded control, so rejection was correct. Subsequent P0 tool task passed. No approved behavior change or useful gain is claimed. |
| Reload and rollback | Producer's two fresh-process saved-output replays, candidate snapshot restore and governing-hash check are in `../20261121-verification/verification.json`; independent copied-store replay also passed. Experimental state returned to P0 candidate snapshot and then P1; governing P0 remained unchanged. No approved production checkpoint transition or rollback was demonstrated. |
| STOP/resume and injected failure | Existing integrated initialization-crash/STOP test and finite-worker recovery/idempotence tests passed below. Independent copied-store evidence substitution and corrupt candidate were refused with unchanged budget and dispatch disabled. These checks do not prove exactly-once behavior for future arbitrary side-effect adapters. |
| Tests, identities and skips | Focused independent run: 16 passed in 87.49s. Producer reports 249 passed and two known Windows symlink skips in `../../integration-smoke/20261121-start/`; full suite was not rerun in this review. |
| Reproduction commands | `docs/HIVE_RUNBOOK.md` identifies exact mission, inspect, STOP/resume and experimental restore commands. Replaying the completed store is not new inference; a new mission requires its own explicit budget. |

## Independent checks

`python experiments/results/adaptation-demo/20261121-terra/verify.py` passed. It copied the completed idle SQLite store and artifacts to `.hive/terra-integration-check`, with a read-only source database connection. It matched 24 input row byte lengths to git blobs at `2347e6add52542ef5516f680ac77b06e10f08ba2`, matched all eight excerpts to the hash-bound directive, checked training/comparison labels and exclusion of ambiguous d1, reverified each job, reconstructed P1, independently calculated the paired quality deltas, and refused both a cross-job evidence substitution and altered candidate bytes. Dispatch was explicitly disabled during replay. Budget remained six requests, 768 reserved tokens, 147 generated tokens and 11 cycles; zero new model calls were made.

Focused run (temporary test stores under the isolated copy):

```powershell
$env:PYTHONPATH='src'
python -m pytest -q tests/integration/test_integration_mission.py tests/integration/test_recovery.py tests/adversarial/test_integration_acceptance.py tests/adversarial/test_adaptive_integrity.py::test_crash_during_incumbent_update_rolls_back_and_resumes tests/integration/test_adaptive.py::test_process_death_resumes_completed_jobs_without_reexecution tests/integration/test_pipeline.py::test_budget_persists_and_configuration_cannot_reset_it tests/integration/test_pipeline.py::test_kill_switch_preserves_queue_and_worker_lock tests/adversarial/test_video_integrity.py::test_subprocess_death_after_claim_recovers_budget_and_feedback --basetemp .hive/terra-integration-check/pytest-focused
```

Result: `16 passed in 87.49s (0:01:27)`. These use simulated subjects or tool tasks, not fresh model inference. They exercise initialization failure, STOP, dead/live leases, crash recovery, budget persistence, idempotent feedback and completed-job replay within their stated test boundaries.

SHA-256: `verify.py` `56213bb4507355a65d646defc695b21e3d1b3d6a48a53f52dba1336fbd8f8c8b`; `verification.json` `8e2f41520d8d5626cdf76fca65463fd8deface1d398138aacfb2bb98a753719e`; original mission `report.json` `96547679b27fca4bc2d5fcde57c863e9172d7330104f91338daf71653c6442d9`.

The small comparison has two development tasks and is not an unused holdout. Four repeated classification arms use the same pinned local model and same labels. The strongest fixed control here is an eligible, recorded simple control, not a proof that every possible baseline was exhausted. Existing Level A/B gates, editorial review and evidence of benefit to frontier AI remain open.
