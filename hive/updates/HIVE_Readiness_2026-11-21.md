# HIVE v0.3.0.dev4 readiness report

**READY_FOR_PRESSURE_TESTS.** The shared controller runs video and isolated Python code missions, all eleven pressure fixtures execute, and saved evidence is independently checked. This campaign made **zero new model calls**. Level A is **not accepted: 0 fresh tasks attempted, 0 accepted**. Level B is **UNTESTED**; no policy or weights are promoted.

Last verified: **21 November 2026 Las Vegas / 22 November UTC**. [Machine-readable readiness report](/hive/implementation/readiness-dev4/build/readiness-report.json), [coverage matrix](/hive/implementation/readiness-dev4/build/coverage-matrix.csv), [evidence index](/hive/implementation/readiness-dev4/build/evidence-index.json), [independent assessment](/hive/implementation/readiness-dev4/experiments/results/readiness-20261121/terra-final-verdict.md).

## What runs

The public mission CLI accepts a bounded dependency graph. A real digest-pinned Docker worker executes the narrow Python function protocol; video captions and clip plans use the same Executor, Store and budget. The operator demo runs each family and a combined code-to-video graph, then replays each in fresh processes with unchanged counters and original source bytes.

The code worker receives a curated read-only source copy. Expected answers and verifier files stay on the host. Network, root writes, privileges, memory, CPU, process count, time and output are bounded. Independent tests cover fake success, secret/verifier access, junctions, STOP, budget exhaustion, host death, interruption, wrong-job evidence and changed outputs. These are concrete controls for the pinned environment, not proof against every container vulnerability.

H01–H11 have finite generators, positive and deliberate negative controls, persisted artifacts, replay and scenario observations. H01 transfer/retention and H02 repair/sibling results are synthetic smoke measurements. The real development comparison adapter wires fixed tool, fixed specialist, a fixed two-component team, learning-off and adaptive arms with matched caps and source grouping. Its new model dispatch tests use a fake adapter. The team's fixed rule checks both verified outputs and falls back or abstains on disagreement; it is not evidence of an optimal team.

## Readiness gates

| Gate | Status | Evidence scope |
|---|---|---|
| R1 | INTEGRATION_TESTED | Actual source/model/config/verifier health and permission/budget distinction; no inference authorization. |
| R2 | INTEGRATION_TESTED | One Store and budget for actual Docker code plus video; separate and combined CLI replay; editorial pending. |
| R3 | INTEGRATION_TESTED | Historical real feedback changed a distinct later executed development route; failed candidate rejected. Independent reconstruction/reload plus synthetic executed restore; no gain claim. |
| R4 | INTEGRATION_TESTED | Both-family fault matrix, immutable replay, bounded Docker worker controls and safe stops; code learning disabled. |
| R5 | INTEGRATION_TESTED | All eleven finite synthetic scenarios, independent positive/negative checks, named mechanisms and public CLI replay; research untested. |
| R6 | INTEGRATION_TESTED | Five actual development control configurations over tool/local routes, matched caps/grouping and fixed team arbitration; tested using fake specialist, not model performance. |
| R7 | INTEGRATION_TESTED | Registry/exposure controls plus protected code-worker files; no sealed decisive study or external evaluator host claimed. |
| R8 | INTEGRATION_TESTED | Clean exported source and offline evidence replay with no private SQLite stores or unintended calls. |

## Checked source and receipts

- Frozen runtime checks: **342 passed, 2 skipped, 0 failed**. The explained skips concern Windows symbolic-link creation; real junction tests execute.
- Tester Army: **7 CLI journeys passed**, including isolated code/video and all eleven pressure commands. No physical phone test is claimed.
- Baseline archive: 252 passed, 2 explained skips. Historical replay still checks 11 jobs and 43 artifacts with zero inference.
- [Full test receipt](/hive/implementation/readiness-dev4/experiments/results/readiness-20261121/final-tests.xml), [CLI journey report](/hive/implementation/readiness-dev4/experiments/results/readiness-20261121/e2e/report.json), [operator demo](/hive/implementation/readiness-dev4/experiments/results/readiness-20261121/operator-demo.json), [fault matrix](/hive/implementation/readiness-dev4/experiments/results/readiness-20261121/terra-r4-matrix.md), [failure register](/hive/implementation/readiness-dev4/docs/READINESS_FAILURE_REGISTER.md), [clean ZIP checks](/hive/implementation/readiness-dev4-clean-zip-smoke.json).

Measured source commit: `b66efb0ba074bf8c6f6a8c0f0bc4761aa3e65739`. Runtime SHA-256: `e711d1c3e7eb4dbd23b95f3027f5d97627b1f6880a2c252e2cefea8c522e817b`. The packaged commit is `1e1bf945bd605fa511c7ceed9ecae303f77e1c56`; subsequent packaging changes contain documentation, receipts, a bounded CLI-test capture buffer and an offline replay helper correction with the same runtime bytes. [Snapshot manifest](/hive/implementation/readiness-dev4/SNAPSHOT_MANIFEST.json), [publication manifest](/hive/implementation/readiness-dev4-publication.json).

## Run the package

[Download HIVE v0.3.0.dev4](/hive/downloads/HIVE_Readiness_v0_3_0_dev4.zip) · [Operator commands](/hive/implementation/readiness-dev4/docs/RUN_HIVE.md) · [README](/hive/implementation/readiness-dev4/README.md)

ZIP SHA-256: `c3cf3e4633391efeb6f8659821fc4bdb6b112fe6dc4f5ea31bc00b531f3102ce`.

```powershell
$env:PYTHONPATH = "$PWD\src"
python -m hive doctor --offline
python scripts/replay_integration_export.py
python scripts/replay_readiness_exports.py
python scripts/readiness_demo.py --work .hive/operator-demo
```

The demo needs Git, FFmpeg/ffprobe and the pinned Docker Linux image described in the runbook. Evidence replay performs no dispatch or inference. Source snapshots exclude private SQLite stores, actual approvals, credentials and sealed research answers.

## What the evidence does not establish

Historical verified feedback changed a later executed development route, but that candidate returned the wrong inventory total and was rejected. Independent reconstruction, restart and parent restoration support the routing mechanism; they do not show beneficial transfer. The historical six-call and 30-call allocations remain spent.

Level A needs **six independent, unused approved video sources and six independent code snapshots**, scoped resources and independent acceptance decisions, including editorial review where appropriate. At least 10 of 12 genuine attempts must be accepted and all mechanical gates must pass. The generated demo and previously exposed work do not count. The code protocol currently supports narrow Python function tasks; other languages need a reviewed adapter.

Level B requires its own authorized preregistration, source-disjoint sealed tasks, strongest applicable fixed controls, learning-off comparison, retention waves, uncertainty and critical-regression checks. No transferable improvement, frontier-model benefit or Disney/AWS replication is claimed. [Exact next action](/hive/implementation/readiness-dev4/docs/NEXT_WORK_ITEM.md), [Level A inventory](/hive/implementation/readiness-dev4/experiments/plans/readiness-level-a.json), [Level B inventory](/hive/implementation/readiness-dev4/experiments/plans/readiness-level-b.json).

[Historical dev3 integration](/hive/notes/INTEGRATION/) and every earlier download retain their original evidence and limitations.
