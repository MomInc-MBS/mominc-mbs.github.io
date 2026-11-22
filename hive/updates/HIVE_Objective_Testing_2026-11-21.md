# Objective testing and P2 repair - dev5

The next HIVE tests use exact Python and structured-data answers, following Ian's request to switch away from visual judgments. This is a verified engineering supplement to the unchanged dev4 baseline.

## What ran

Six narrow Python function tasks ran in digest-pinned Docker. Six structured-data tasks computed exact counts and byte totals. The final run passed **12 of 12 objective checks and 12 of 12 fresh-process replays**, with unchanged budgets and zero new HIVE model calls. The code patches are fixed examples: this tests execution and verification, not autonomous code-solving ability.

| Check | Result |
|---|---|
| Frozen dev5 runtime regression | 356 passed, 2 known Windows symlink skips |
| Objective runner checks | 6 passed |
| Tester Army CLI journeys | 7 passed |
| Final objective tasks | 12 exact passes; 12 restart replays |
| Public artifact replay | 42 jobs, 160 hashed files |
| Matched P2 vs strongest tool | Six ties, zero quality improvement |
| Genuine Level A | Not accepted; zero attempts |
| Level B | Untested |

Terra independently checked the Python case values, data totals, source snapshots, artifacts and budgets. Sol reviewed P2 provenance and historical policy compatibility. Review limits are recorded in their reports. No visual/editorial reviewer is needed for this prospective objective campaign.

## Failures stay in the record

The first twelve-task run produced correct outputs but failed six data replay checks. The runner confused the authorized configuration with the shorter timeout HIVE correctly enforced. A runner-only repair validates both; a second bounded attempt passed. All 24 task executions remain recorded, alongside 18 comparison jobs. The source plan and expected answers were unchanged between attempts.

The dev4 reproduction also found a parent-relative store-path failure in H11. Dev5 repairs it while preserving reparse-point checks and the failed receipts. Independent review caught a P2 version-marker downgrade bypass; replay now binds to recorded execution provenance. Original reviews, failures and corrections remain available.

## Policy decision and next gate

**P2 remains quarantined.** Its exact-category route choices match existing v2. New attribution, verifier availability checks and replay binding improve inspectability; the matched comparison shows no quality gain. The default policy remains unchanged. Specialist/model-team arms require a new finite inference allocation and were not given substitute quality scores.

These public synthetic examples are not six independent real repositories or fresh acceptance sources. Genuine acceptance still needs approved unused structured-data groups and Python snapshots, frozen independent expected outputs, and a bounded allocation. No policy promotion or sealed study is approved. Old inference allocations remain spent.

## Download and reproduce

- [Download objective-testing dev5 source and evidence](/hive/downloads/HIVE_Objective_Testing_v0_3_0_dev5.zip)
- [Publication identity and ZIP hash](/hive/implementation/objective-dev5-publication.json)
- [Clean extracted-ZIP verification](/hive/implementation/objective-dev5-clean-zip-smoke.json)
- [Run the objective checks](/hive/implementation/objective-dev5/docs/OBJECTIVE_TESTING.md)
- [Measured state](/hive/implementation/objective-dev5/docs/CURRENT_STATE.md)
- [Comparison and decision](/hive/implementation/objective-dev5/experiments/results/next-loop-20261121/decision.md)
- [Independent verdict](/hive/implementation/objective-dev5/experiments/results/next-loop-20261121/independent-verdict.json)
- [Terra's output review](/hive/implementation/objective-dev5/experiments/results/next-loop-20261121/terra-objective-final-review.md)
- [Sol's P2 review](/hive/implementation/objective-dev5/experiments/results/next-loop-20261121/sol-p2-final-review.md)
- [Complete evidence manifest](/hive/implementation/objective-dev5/experiments/results/next-loop-20261121/manifest.json)
- [Frozen dev4 baseline](/hive/notes/READINESS/)

```powershell
$env:PYTHONPATH = "$PWD\src"
python scripts/replay_objective_exports.py
# Git and pinned Docker image required; no model calls:
python scripts/objective_smoke.py
```

Runtime: `0.3.0.dev5`, measured commit `5719c4ace14a1c437bf8f935b8666773b0e37493`. Runtime SHA-256: `2d05d4f2b541ae00cf2b6e281c75907a37036d2ed89da0e58726361050e9c38c`. Packaging commit: `a1b8fb6ee9a856be90bf0573f5af208438395c2a`. ZIP SHA-256: `b6f9050c3aff751d5660cda2d23e8703cf67299e07f654c71300cf920eeb8e00`.
