# Measured runtime v2 results

**Decision: rejected. Autonomous learning is not established.**

Run `runtime-v2-run-003`: 576 episodes independently audited; 72 tasks × four arms × two executions. The complete run took 177.75 seconds. The exact candidate was exercised in an isolated test runtime, reopened, rolled back, and the restored baseline executed after another restart.

| Configuration | Development correct | Evaluation correct | Evaluation mean execution ms |
|---|---:|---:|---:|
| rules | 48/48 | 24/24 | 131.02 |
| probe | 16/48 | 8/24 | 169.01 |
| combined | 48/48 | 24/24 | 168.37 |
| probe-guard | 48/48 | 24/24 | 145.70 |

The evaluation split contains the original 24 synthetic fixtures and was previously exposed. It is regression evidence, not a fresh blinded test. The controls were selected on development data. The candidate was frozen before evaluation, and all 288 output/status replays matched.

The candidate corrected ffprobe false acceptance, but it did not beat the best simple rules control. Benefit and holdout-integrity gates failed; retention, safety, unchanged memory, measured budgets, replay and candidate-bound rollback gates passed. The operational policy remains the original baseline.

Execution latency measures admission through adapter completion; verifier time is recorded separately. SQLite trace/export persistence is excluded from that per-task cost. Total experiment time above includes the full loop. CPU and peak RAM cover the worker only; hard memory quotas, ffprobe child/GPU attribution and model inference remain unproven.

Mean worker CPU: 0.11127 seconds; maximum worker RSS: 23.07 MiB. No model inference, model loading or neural training occurred.

## Validation and artifacts

- 38 tests passed: original contracts plus routing, transport, freeze, tamper, release, rollback and optional search checks.
- Positive acceptance tests use explicitly injected synthetic adapter faults; they prove the release mechanism, not learning superiority.
- A separate live-task CLI submission selected rules, completed, independently verified and persisted experience.
- Existing archived pilot re-audited: 576/576 episodes verified. Static site: 313 pages / 22,806 links passed. Vault: zero errors.
- All 696 snapshotted research, fixture and prior-evidence files remain byte-identical. New research links use a separately validated overlay; see preservation.json.

[Machine-readable results](../../evidence/runtime-v2/results.json) · [Audit](../../evidence/runtime-v2/audit.json) · [Rollback proof](../../evidence/runtime-v2/rollback-proof.json) · [Complete source and evidence ZIP](../../evidence/runtime-v2/reproduce.zip)

Unzip the archive in a new directory. `python -m tools.hive_engine.audit evidence/state` checks the saved run. `python -m tools.hive_engine.cycle --out rerun-new` produces a fresh execution of the frozen regression set. The executable binary/version must match for evidence-bound promotion; timing varies with machine load.

## Still unproven

No real-model quality benchmark, fresh representative held-out improvement, learned contextual router, compounding/sample-efficiency gain, weight update, hard hostile-code sandbox or production HIVE runtime is established. The next deciding experiment needs independently held real caption/media examples and a development failure that a bounded candidate can improve against the best unchanged baseline.
