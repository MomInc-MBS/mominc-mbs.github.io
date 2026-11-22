# Current state - test-readiness build, 21 November 2026

**READY_FOR_PRESSURE_TESTS**. The shared video and isolated Python code controller, all eleven
pressure fixtures, independent fault checks and reproducible public evidence are
implemented. This campaign used **zero new model calls**. Level A remains
**not accepted: 0 attempted, 0 accepted**. Level B is **UNTESTED**. No policy or
model weights were promoted.

| Reproducible item | Observed value | Command or receipt |
|---|---|---|
| Actual checkout | `D:/Repos/hive-ai`, `build/working-prototype` | `git status --short`; `git rev-parse HEAD` |
| Frozen measured runtime | `0.3.0.dev4`, commit `b66efb0ba074bf8c6f6a8c0f0bc4761aa3e65739` | `experiments/results/readiness-20261121/doctor-final.json` |
| Runtime source SHA-256 | `e711d1c3e7eb4dbd23b95f3027f5d97627b1f6880a2c252e2cefea8c522e817b` | `python -m hive doctor --offline` |
| Baseline | `6a044bb7adb5f8a082a5d298148461031fd9b506`; 252 passed, 2 explained skips | `build/readiness-baseline.json` |
| Frozen source tests | 342 passed, 2 skipped, 0 failed | `experiments/results/readiness-20261121/final-tests.xml` |
| Tester Army journeys | 7 passed | `experiments/results/readiness-20261121/e2e/report.json` |
| Operator workflow | Video, real Docker code and combined DAG complete; fresh-process replay unchanged | `experiments/results/readiness-20261121/operator-demo.json` |
| Pressure CLI | 11 fixtures, 38 public commands, 0 model calls | `experiments/results/readiness-20261121/cli-commands.json` |
| Prior allocations | 30 and 6 calls remain spent; ledgers unchanged | `experiments/results/readiness-20261121/budget-final.json` |
| Exact gate verdicts | R1-R8 with independent assessment | `build/readiness-report.json`; `build/coverage-matrix.csv` |

The measured runtime was frozen before tests. Later packaging commits add
documentation, receipts, a bounded CLI-test output buffer and offline replay helper
correction with the same runtime bytes; `SNAPSHOT_MANIFEST.json`
names the packaged commit. The live publication target is
https://mominc.online/hive/notes/READINESS/; its external publication manifest
records the deployed snapshot and ZIP hash.

Docker enforcement was checked with the digest-pinned Linux image. The adapter
supports narrow Python function tasks, not arbitrary repository commands or
languages. Paired real development arms were exercised with a fake specialist;
fixture/team passes do not measure model quality. Historical real feedback
changed a later executed route, but that candidate failed and P0 was retained.
No beneficial transfer or Disney/AWS replication is claimed. CPU/GPU utilization
is unknown; no physical-phone check is claimed. A crash between terminal stage
persistence and finish-ref linking stops safely and needs journal reconciliation.

`docs/RUN_HIVE.md` has exact commands and prerequisites. `docs/NEXT_WORK_ITEM.md`
and `experiments/plans/readiness-level-a.json` identify the external next action:
six unused approved video sources and six independent code snapshots, bounded
permissions/resources, independent evaluators and editorial decisions. Level B
requires a separate approved sealed study. The supplied primary directive and
research documents are retained with their attribution and original limits.

# Historical state — integrated framework build, 21 November 2026

Ian authorized immediate execution of `INTEGRATION_DIRECTIVE.md` at 23:38 UTC,
superseding the 23:40 UTC schedule; that scheduled trigger was deleted.
The ambition is a framework that can benefit even frontier models. That remains
an evaluation target, not an established capability claim.

## Latest source hardening

The latest runtime SHA256 is
`6ee9ae14b32ec6c9972bba693bb45395af5998516c4bc9de19dd5bbb5f550c99`.
After the real run, Sol found that CLI `resume` could requeue an interrupted
job before charging reserved execution time. `Store.recover` now debits time,
clears the reservation and requeues in one transaction, including legacy
ownerless queued reservations. A live-owned job is left alone. Sol independently
passed three regressions, including transaction failure and repeated resume.
The complete suite passed **252 tests, two Windows symlink skips, in 151.39
seconds** (`integration-tests-final.xml`). No additional real inference ran on
this hardened source; the measured mission below remains pinned to `28239ab`.
All **four Tester Army CLI journeys** passed again on this source in 12.09
seconds (`experiments/results/integration-cli-e2e-final/report.json`). The
hardening receipt at `experiments/results/integration-smoke/20261121-hardening/verification.json`
binds those checks, confirms changed-source refusal on the historical store,
and verifies exact frozen-source replay with the six-call budget unchanged.

`python scripts/replay_integration_export.py` checks all eleven historical jobs
and 43 exported artifacts offline, reconstructing P1 and its rejection. It prints
both the original execution identity and the current verifier identity. This is
evidence replay, not a new model run or independent scientific replication.
See `INTEGRATION_REVIEW.md` and `reviews/integration-sol-final-20261121.md`.

## Verified integration startup

- Repository `D:/Repos/hive-ai`, branch `build/working-prototype`, clean source
  commit `2347e6add52542ef5516f680ac77b06e10f08ba2` before this build.
- The live dev2 publication manifest matches that commit and runtime digest
  `e8dc974bf4e71f44879bd0a5dfe4194f09d97cd29c9c19c77be11a6be0a6631c`.
- Current baseline: **235 passed, 2 skipped in 92.41 seconds**; receipt
  `experiments/results/integration-smoke/20261121-start/baseline-tests.xml`.
  Both skips concern Windows symbolic-link creation. Python 3.11.9.
- Loopback Ollama is available with installed `myr5-hold-local:latest`, manifest
  `a45646773d1ee8a6c1557c7de09a68e78a74f2990c4174a1408f65e777db150c`.
  No model was loaded at startup; GPU free memory was 9,778 MiB. No active model
  is replaced, and no download or external inference endpoint is authorized.
- New integration mission only: **six local requests, 768 reserved output
  tokens, 180 active seconds, 24 cycles, 64 MiB artifacts, zero automatic
  retries**, one local inference globally. Old missions retain their spent
  budgets. No production policy promotion is authorized.
- Inputs are a frozen inventory of this repository's baseline source bytes and
  actual requirements from Ian's supplied directive. Terra independently labeled
  the excerpts; ambiguous item d1 is preserved but excluded before execution.
- Sol owns read-only contract review; Luna owns shared governor/CLI integration;
  Terra owns independent verifier/fault checks; Astra owns mission composition,
  evidence and publication. Ruflo suggested generic architect/balanced-worker
  routing; the actual models follow the explicitly named Sol/Luna/Terra roles.
  Laya was down and its fallback remained advisory.
- Publication target is `MomInc-MBS/mominc-mbs.github.io`, `main`,
  https://mominc.online/hive/. Existing unrelated `tv/mbs-channels.js` edits in
  that checkout will be preserved. Publishing evidence does not promote policy.

## Executed integration result

Runtime **0.3.0.dev3**, frozen implementation commit
`28239aba838fa7f6b2d04719ec75d629d1b14308`, runtime SHA256
`c73866989d9c03253af8eb199b0c93509adbc50b92bcab7e0a29fde15db0d9d2`.
That frozen-source suite passed **249 tests, two Windows symlink skips**, and
**four Tester Army CLI journeys**. Earlier failing attempts remain in
`experiments/results/integration-smoke/20261121-start/`; its suite is `integration-tests-r3.xml`.

The real mission completed eleven jobs through the shared executor. Mission A
aggregated actual baseline source-file sizes with the deterministic tool and
passed an independent reduction. Mission B classified three supplied directive
excerpts with the pinned real local model and matched all independent labels.
The model's request excludes expected answers. Source inventory and directive
inputs are development evidence, not unused Level A/B acceptance cases.

Verified feedback changed the candidate's actual choice from the tool to an
untried local route on a separate inventory task. That candidate returned
42,073 bytes; the correct total is 41,907. All three fixed controls selected
the tool and passed. Every classification comparison arm disagreed on d5
(`limits` versus the independently frozen `routing` label); labels and failures
remain unchanged. The candidate was **REJECTED** for a critical inventory
regression. A subsequent, separate inventory task retained the governing tool
route and passed with 71,415 bytes. This shows a functioning experimental loop,
not useful learning or frontier-model benefit.

Actual resource use: **six local requests, 147 generated tokens, 768 reserved
tokens, 18.578 active seconds, eleven cycles**. The six-call allocation is spent;
no retry, budget refill or automatic production promotion occurred. Two new
processes replayed the completed report; STOP/resume and restoration of the
initial/candidate experimental snapshots preserved the governing hash and
spent zero further requests. Prompt-token usage is not exposed by the adapter.

Evidence:

- `experiments/results/integration-smoke/20261121-run/report.json`
- `experiments/results/adaptation-demo/20261121-verification/verification.json`
- `experiments/results/adaptation-demo/20261121-complete-receipts/verification.json`
  additionally indexes all frozen comparison choices and failure/triage reports;
  this export repeated the no-spend checks without altering the original batch.
- The same directory's hash-named artifacts and `events.json`
- `experiments/results/integration-cli-e2e/report.json`

Terra independently accepted **INTEGRATED_PROTOTYPE_DEMONSTRATED** on the valid
rejected-candidate path after replaying all eleven jobs and passing sixteen
focused recovery tests. See `experiments/results/adaptation-demo/20261121-terra/review.md`.
The scope is the current finite read-only flow. Restoration covered experimental
candidate state; production-policy rollback was not exercised and governing P0
never changed. Adaptation remains unvalidated.

Independent acceptance and external-review dispositions are recorded separately;
the executable report intentionally retains its at-run `FRAMEWORK_WIRED` and
`independent_acceptance=pending` fields. Never rewrite historical receipts to
give them a later approval. Level A and Level B remain unaccepted. The historical
records below remain attributed to their original sources.

# Historical working-prototype audit, 21 November 2026

## New engineering candidate: v0.3.0.dev2

Runtime SHA256: `e8dc974bf4e71f44879bd0a5dfe4194f09d97cd29c9c19c77be11a6be0a6631c`. The file-based `video` mission reuses the existing controller for caption normalization, clip selection, verifier-backed development feedback and reconciled output recovery. **235 tests passed, 2 skipped**, plus **3 CLI journeys** on these runtime bytes. Both skips require Windows symbolic-link creation; Windows junction controls passed. `prototype-dev2-summary.json` and `prototype-dev2-tests.xml` record the scope.

This is an **engineering alpha**, with Level A unaccepted and Level B inconclusive/not run. A 28.32-second excerpt from a 39:13.75 studio stream completed two objective jobs (captions and clip proposals) using one local-model call and 17 generated tokens. Fresh-process replay and STOP/resume used zero additional calls. The source had prior editing exposure; editorial acceptance is pending and it does not count toward unused A2 tasks. Runtime bytes match the frozen clean source `7983ae0`; see `prototype-real-video-demo.json`. The independent original-SRT check confirms chosen text/times; the persisted development policy hash reloads correctly and next proposes `tool` after using `local_direct`. That next route was not executed. WP0's separate one-call real-model receipt below stays attributed to the audited v0.3.0.dev1 source. No policy is promoted. Final external review and clean-package verification are recorded with publication evidence.

## WP0 observed baseline

- Release/version: **0.3.0.dev1**, matching the live `v03-foundation-publication.json`.
- Git SHA: `caf9ace1ab41d5909f60ee6c2ed6fd60cb7ba345`; audited branch `build/v0.3`, clean before audit outputs.
- Working branch: `build/working-prototype`; rollback branch `checkpoint/pre-prototype-caf9ace`. No existing edits discarded.
- Runtime source SHA256: `024e33a80265718014a42d2a8d4609663ed74f327a36043b18285810d67c2731`.
- Smoke config hash: `a7eabd4e25cd8b2b3bc30f878645ec87e5dc1759316dde2be8421222d9b35eec`.
- Model: `myr5-hold-local:latest`, digest `a45646773d1ee8a6c1557c7de09a68e78a74f2990c4174a1408f65e777db150c`; existing Ollama loopback, no model replacement/download.
- Test runner: Python 3.11.9 / pytest; `python -m pytest -q --junitxml=experiments/results/prototype-wp0-baseline-tests.xml`: **217 passed, 0 failed, 1 skipped** in 84.82 seconds. The skip is Windows symlink availability.
- Last fresh real-model run: `prototype-wp0-current-source-smoke`, job `eb1057f4e7174f3b8f5aeb9276c00ada`; one call, eight generated tokens, 128 reserved, 4.110 active seconds. Exact-product verification passed; new-process review reproduced with zero further calls. This is a runtime smoke on synthetic arithmetic, not a real-workload acceptance task.
- `upstream_status=verified`: PowerShell HTTP fetch succeeded for v0.2.1 and v0.3 manifests after the web fetch service failed. Current public ZIP SHA256 `8db57c9fad3302eb2ee54d27f5abf6aca7f3e6292b7b13eb3d0b77b5a0557108` is manifest-reported, not independently re-downloaded in this audit.
- New local-request ceiling: four total, divided into the now-spent one-call WP0 allocation and up to three calls in the new video mission. Prior E0 remains closed at 30 calls. No carryover/refill.
- Decision: **continue** into the first real file-based mission; synthetic runtime checks do not waive real-task gates.

Evidence: `experiments/results/prototype-wp0-baseline-tests.xml`, `experiments/results/prototype-wp0-smoke.json`; pinned source locally at `.hive/prototype-wp0-source/`. The smoke source hash matches the live current source, rather than the older v0.2.1 archive.

Known unproven claims: genuine multi-family utility, full video workflow acceptance, isolated repository repair, Level A's 12 operator-approved tasks/10 accepted outputs, stronger-baseline adaptive benefit, chronological transfer and retention. Prompt-input token accounting is not exposed by the current adapter; it must not be invented. No policy was promoted.

Next gate: independently checked video mission outputs, forced recovery, verified development feedback and operator editorial review and unused multi-family intake. See `NEXT_WORK_ITEM.md` and `PROTOTYPE_ACCEPTANCE.md`.

## Historical checkpoint below (preserved)

# Current state — v0.3 experimental foundation

## E0 executed: latest checkpoint

Ian approved the prepared caps. The pinned v0.2.1 mission completed 30 calls, 1008 generated tokens, 23.125 active seconds and 36 verified observations; replay used zero calls. Top-level stop reason was stale after completion; the separate v0.3 repair has a synthetic regression. See `experiments/results/v03-e0-decision.json` and [current scope](V03_FOUNDATION.md). No new inference remains authorized. E1 source inventory, evaluator integration and separate budget are still pending. Earlier preparation entries below are historical.

## Historical preparation checkpoint, superseded by completed E0 above

Additive runtime `0.3.0.dev1` on `build/v0.3`: frozen source/exposure registry, synthetic adversarial controls, pinned E0 preparation and draft E1 design. No new real inference; E0 cap approval is pending. The full research milestone remains incomplete. See [verified scope and next work](V03_FOUNDATION.md).

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
