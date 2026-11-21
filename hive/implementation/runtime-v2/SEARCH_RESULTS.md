# Equal-budget recipe search results

**No verified improvement established. Every candidate is rejected for operational promotion.**

Run `recipe-search-001`: 60 retained trials; 2592 independently audited task episodes. Optuna 5.1.0, three fixed seeds, four development trials plus one evaluation per arm/seed. All four arms had the same 216-call / 240-second ceiling per seed; the aggregate ceiling was 2,592 calls / 2,880 seconds. Measured cost includes the repeated baseline trials and proposal overhead, not just the chosen recipe.

| Arm | Evaluation correct | Mean execution ms | Total trial wall s | Adapter calls | Dev trials below 100% | Noncompleted trials |
|---|---:|---:|---:|---:|---:|---:|
| static | 72/72 | 130.24 | 104.45 | 648 | 0/12 | 0 |
| heuristic | 72/72 | 140.28 | 115.01 | 648 | 0/12 | 0 |
| random | 72/72 | 134.24 | 125.11 | 648 | 4/12 | 0 |
| optuna | 72/72 | 164.63 | 136.32 | 648 | 5/12 | 0 |

The 72 evaluation calls per arm repeat the same 24 exposed synthetic fixtures across three seeds; they are not 72 independent new examples. All development trials, including inferior recipes, are retained in results.json and the raw event/SQLite archive. Candidate selection uses development data only. Independent audit verifies selection chronology, lineage, frozen task order, artifact verdicts, source/lock identity, partial-trial accounting and the final decisions.

The rules control already solves this small rubric perfectly. Four TPE trials per seed are a wiring and budget test, not a powered optimizer comparison. Differences in latency reflect a short serial experiment on a shared PC; no confidence interval, causal sample-efficiency improvement or broader transfer claim is supported. Fresh holdout, novel-family retention and candidate-specific recovery gates remain false. The existing runtime separately proves rejection and exact-candidate restart/rollback.

Per-task execution latency includes admission through adapter completion; verification is separate. Total trial wall time includes proposal subprocesses, execution, verification, persistence and audit. Worker CPU/RSS exclude ffprobe descendants and Optuna proposal CPU/RSS; hard memory limits are unproven. No model inference, GPU allocation, paid requests, external actions or neural training occurred.

Measured worker CPU across all trials: 286.38 seconds. Maximum worker RSS: 23.13 MiB. These are partial resource observations, not total experiment CPU/RAM.

## Reproduction and evidence

[Experiment and limits](LEARNING_ACCELERATION.md) · [raw results](../../evidence/recipe-search-v1/results.json) · [frozen spec](../../evidence/recipe-search-v1/experiment.json) · [audit](../../evidence/recipe-search-v1/audit.json) · [source and full trial archive](../../evidence/recipe-search-v1/reproduce.zip)

Extract the ZIP and run `python -m tools.hive_engine.search --audit evidence` without installing Optuna. To execute new trials, create the isolated environment from the hash lock as documented in LEARNING_ACCELERATION.md. Exact recipes and decisions replay from stored metrics; wall-time measurements depend on the machine.
