# Current state — adaptive controller v0.2

Current executable: [v0.2.1 review fixes](ADAPTIVE_V021.md), **136 tests passed,
one skipped**, both CLI journeys passed. Grok's budget-restart and delayed identity
checks are fixed. The measured run below remains bound to its v0.2.0 source.

The latest executed increment is [adaptive controller v0.2](ADAPTIVE_V02.md):
30 real local-model calls, learned routing 3/6 → 5/6, a rejected 4/6 alternative,
then a 6/6 deterministic-tool incumbent. All decisions remain experimental.
122 runtime tests and both CLI journeys passed; fresh-process verification spent
zero new model calls. Source/results are published at https://mominc.online/hive/.

## Preserved v0.1 record

Verified 2026-11-20, D:/Repos/hive-ai, build/autonomous-v0.1, base 2e14c0e.
No remote or live deployment URL. The separate AR-Party-Horror project was untouched.

## Implemented and exercised

- Local task-file/benchmark CLI; declared success criteria; Ollama registry and
  real Qwen 9B Q4_K_M adapter; six finite deterministic evaluator categories.
- Immutable SHA256 evidence, SQLite job transitions, owner generations, atomic
  successor deduplication, dead-process recovery, persisted feedback/checkpoints.
- Bounded foreground/hidden background worker; stop/resume/status; conservative
  token reservations; frozen mission config; one local inference across stores.
- Fixed, random, greedy and UCB routing, Beta reliability, cost-aware utility,
  constrained/lexicographic/Pareto diagnostics, prior sensitivity, ablation.
- Development-only learning, frozen candidate, distinct validation/holdout suites,
  repo-level one-use holdout ledger, repeatable saved-output verification.
- Fail-closed evidence gates; approved checkpoint selection and automatic rollback
  on verified critical regression. Positive promotion/rollback is tested with
  clearly synthetic controlled fixtures; no real candidate has been promoted.

52 pytest tests pass, including child-process crash/restart, stale ownership,
false evidence, resource guards, experiment replay, independent review findings,
and rollback. Tester Army tools-only CLI journey passes. A hidden real worker
completed its queued task, recorded status, and exited on empty queue.
A clean Git archive also ran the task-file CLI, reverified in a new process, and
restored status with zero model calls. Its runtime hash matches the campaign.

## Actual experiment

One preregistered campaign: 18 development, 12 validation and 24 held-out tasks;
162 observations, 108 local-model calls. Held-out policy replay: fixed direct
12/24; greedy/UCB 23/24; random 16/24; deterministic tool and fixed team 24/24.
Paired UCB-minus-direct delta 0.4583, descriptive 95% bootstrap [0.25, 0.6667].
These are six correlated synthetic families, not independent broad capability
samples. The deterministic baseline dominates; UCB's exploration bonus is not
distinguished from greedy here.

All 162 saved outputs reproduce under deterministic verification in a fresh
process. Six preregistered critical cases also reproduced with fresh real model
inference (6/6, unchanged policy). A real development-model failure automatically
queued a deterministic tool follow-up, which passed without manual reprompting.

Independent Grok code review and NVIDIA Nemotron mathematical critique completed;
Grok's separate experiment review recommends QUARANTINE. The candidate remains
experimental, with no champion installed. Its critique preceded the six-case live
reproduction; that later pass does not resolve the broader benchmark limitations.

## Runtime and resources

Python 3.11.9, pytest 9.1.1, Windows; RTX 5070 Ti 16,303 MiB. Ollama loopback
11434, `myr5-hold-local:latest`, manifest digest
`a45646773d1ee8a6c1557c7de09a68e78a74f2990c4174a1408f65e777db150c`.
LM Studio was unavailable; no model download/swap was required. Normal editable
package installation succeeded; the no-build-isolation attempt lacked wheel.

This build used 118 local-model requests of its 120-request allowance: 108 main
campaign, 6 live reproduction, 1 real failure demo, 1 vertical slice, 1 initial
runtime probe, 1 earlier integration diagnostic. The next full comparison cannot
fit the two remaining requests. Workers are stopped; queued research is not a
claim of ongoing background inference. Application budgets do not impose OS-level
CPU/GPU memory quotas on the separately running Ollama service.

## Explicit limits and next work

This is a local policy-adaptation laboratory. It does not fine-tune weights,
autonomously rewrite arbitrary repositories, execute model-generated code, provide
a distributed service, or establish general improvement. Memory learning,
workflow learning and LLM-verifier calibration remain separate queued experiments.
The trusted local operator can access evaluator files; CLI/model isolation is
logical, not a multi-user security boundary. Candidate promotion requires trusted
independent evidence review; the executor has no unilateral promotion authority.

Next: predeclare broader independent families and a fresh holdout, challenge tool
correctness with negative controls, and compare frozen policies under a new bounded
mission. See NEXT_ACTIONS.md. All evidence paths are in EXPERIMENT_LOG.md.
