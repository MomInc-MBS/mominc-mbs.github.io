# Terra independent verification — 2026-11-21

Target: D:/Repos/hive-ai, build/working-prototype; baseline commit 6a044bb7adb5f8a082a5d298148461031fd9b506. This is a working-tree assessment, not a release certification. No inference or private holdout use.

- R1: not independently assessed here; overseer owns doctor and identity.
- R2: partial. Code mission under construction. Initial review found verifier command not bound to pinned verifier, budget charged only after execution, directory entries rejected, missing source hash on replay. Owner fixing; no acceptance until retested.
- R3: partial. `tests/integration/test_readiness_mechanism.py` executes a verified synthetic failure, subsequent distinct task on candidate route, fresh-process checkpoint reload and parent restore. Fixture route and synthetic test-only approvals mean this is a mechanism demonstration, not production approval or real adaptation proof.
- R4: partial. Existing video integrity and interruption checks plus synthetic sandbox failures; live Docker controls probe and timeout-cleanup receipts are `terra-docker-controls.json` and `terra-docker-timeout.json`. Code crash/replay fault matrix remains incomplete.
- R5: partial. Independent tests verify generic positive/negative artifact provenance, replay, forged verdict/job/budget rejection for all eleven. H02 and H04–H10 have additional mechanism checks; these do not establish all specified full scenario behaviors. Active changes require final rerun.
- R6: unmet. Proxy fixture arms are not actual fixed model/team baselines or demonstrated matched-budget study.
- R7: unmet. No independent end-to-end proof sealed evaluator exposure boundaries for new runner; development fixture expected values are deliberately public.
- R8: not independently assessed here; clean installed package and replay remain overseer checks.

Evidence at time of run: `python -m pytest tests/adversarial/test_pressure_readiness.py tests/adversarial/test_code_isolation.py tests/integration/test_readiness_mechanism.py -q`: 22 passed in 54.91s. Source changed after run; these are interim results, not final source verification. Existing video/recovery checks plus mechanism: 14 passed, 1 skipped (Windows symlink privilege unavailable). Fixture outcomes do not count as real task acceptance, Level A, Level B, or scientific generalization.

Docker engineering probe used pinned python:3.11-slim image sha256:07d4824036af339fa1b6ef769cc99d9c10a141769538b52b3b597c84f7a7b535. Observed zero effective capabilities, no network route, cgroup memory 134217728, process limit 32, unwritable /work. A 2-second timeout killed a 60-second sleep and reported verified removal. This is partial control verification, not proof against all container escapes.

Verdict: NOT_READY on this assessment. Level A unaccepted; Level B untested. Reassess after integrated changes stabilize and full independent adversarial/replay tests and release checks complete.

## Additional independent targeted checks

- Real code mission via pinned Docker: valid candidate + replay, pre/post evidence-commit child death recovery, and Windows store junction denial: 4 passed. Recovery reruns bounded execution on same job, charges two cycles, and does not duplicate feedback; it is not a claim of exactly-once execution.
- In-flight STOP and pre-dispatch STOP/restart: 2 passed; no fake success or budget reset.
- Real code mission false-success, os._exit(0), and attempted evaluator/secret access: 3 passed. Synthetic curated archive extraction independently excludes evaluator and secret fixture.
- Pressure H01/H03/H11 named behavior integrity probes and forgery: 3 passed; H05/H08 report replay and independent feedback reconstruction: 2 passed; H04/H10 forged control rejection: 2 passed. Synthetic and research untested.
- These were targeted runs during active integration; a final single frozen-source suite is still required. Historical intermediate failures were fixed and rechecked; do not treat this file as a final overall readiness certification.

## Independent historical R3 reconstruction

`terra-r3-historical-reconstruction.json` records independent zero-inference reconstruction: all 43 retained artifacts hashed; both training events reverified; their updates reproduce exact candidate hash `3048d1ad59d20d043d13a8924326a5b87b19e07e095e6e3e6101591e10bacd1d`. Fresh processes choose tool with parent hash `4c52bbf808ac17c7873ecb0cc44f979d3e968ee23ff4ad6344bd2d186fac78a8`, local_direct with candidate, tool when parent reloaded. Historical candidate executed local_direct on distinct inventory-compare and failed; incumbent tool passed. Frozen candidate choice artifact records choice while actual execution governance receipt records incumbent because the candidate route was requested explicitly. Prior report records candidate rejected and no production promotion. Synthetic test separately executes a route after restore. Composite evidence supports experimental route-selection mechanism but no beneficial-learning claim and no new real execution after restore.

A real Docker host-death test passed: 60-second workload capped at 4 seconds; kill the HIVE host process, observe container gone within deadline (5.63 seconds total). No inference used.

## Final-source independent assessment (full-suite result pending)

- Frozen source: commit `fe5f27bbd720672be8d6ea865bb52705ef1d2ea6`, runtime SHA-256 `48e459adb3881a3f5af0e9ad3fd4d1a76c38b0db0649f93c937390127b672117`, version 0.3.0.dev4. Independent pressure verifier `1a1c5aa46f7d8bc377c992e38193e43379387cb40e3758dda610ee408e78539a`; code verifier `9865b125bf1927208f8d22478a9be2e4f2eb63664988240636b47e2f435aeb82`; base verifier `1ee3853546b98d31337be7aeb5d5d0af5bb565ad34ca1ee361a84965f0886bce`.
- R1: overseer owns final doctor, runtime and budget health; independent final status pending those receipts.
- R2: integration tested within narrow scope: shared DAG fixture video + synthetic code and separately real pinned Docker pure-function code mission. Editorial acceptance and arbitrary repository test execution are not established.
- R3: composite mechanism demonstrated: distinct historical real development inputs, independent feedback/candidate reconstruction, executed changed candidate route, fresh-process rechoice, plus synthetic executed restoration. The historical changed route failed objective evaluation, stayed rejected, and used the same source commit as its training input. No beneficial transfer claim.
- R4: materially tested, not a complete family-by-family fault matrix: code and video before/after evidence/publish interruption tests, code STOP and host death, immutable replay and a shared DAG failure/dependency path. Wrong-job, corrupt, feedback crash, budget, STOP and kill have not all been independently crossed against both code and video end-to-end.
- R5: eleven bounded fixture runners and independent generic positive/negative controls exist; selected distinct mechanisms, journal identity, feedback and falsified controls independently checked. Exact full scenario coverage remains incomplete: H02 has no complete ambiguous/tool-failure/dependency/distractor mutation+repair+new-sibling campaign; H01 transfer/forgetting explicitly unmeasured; H04 is not the complete both-family matrix; H11 has synthetic media and synthetic code runner plus separate actual Docker engineering probe, not genuine work. This is not a scientific result. Treat as present/integration-tested smoke, not full exact H01-H11 contract certification.
- R6: bounded matching and forged budget/source/summary checks pass; adaptive and learning-disabled policy differences reconstruct from feedback. Fixed specialist/team are disclosed deterministic proxies. Real strongest fixed model/team comparisons are not demonstrated and this smoke cannot certify their actual execution path.
- R7: 33 existing exposure/registry controls passed; explicit worker extraction rejects tracked secret/verifier, and actual Docker worker attempted access without finding them. These are local protection mechanism tests; no decisive sealed research run or independent model-context leakage certification has been performed.
- R8: overseer owns final clean package/README/receipt replay; independent final status pending those receipts.

Independent judgment remains **NOT_READY** pending exact R4/R5/R6 coverage and final R1/R8 evidence; genuine fresh sources, budget and editorial decisions separately block Level A; Level B is UNTESTED. This is a conservative requirements assessment and does not negate the exercised infrastructure or the real R3 development route change.

### Wrong-job integrity findings on fe5f27b

Independent local temporary-store reproductions found two specific replay identity gaps, zero inference:

1. Code: complete synthetic missions A and B in one store, then change A's persisted patch record job ID to B's. `run_code_mission(A)` returned `SYNTHETIC_ONLY` containing B's job rather than rejecting the mismatched mission. Bind job specification, manifest, patch, operation key and bundle job ID to the expected A record, and invoke `inspect_evidence`.
2. Video: complete synthetic video, copy its caption evidence artifact, replace only its embedded job ID with `wrong-job`, write the new content-addressed artifact and point the caption job at it. `run_mission` returned `objective_verified` rather than rejecting. Recompute and compare expected captions/clips task/spec and inspect each bound job evidence.

These are injected corrupted-store tests, not claims that normal execution chose wrong jobs. They were communicated for correction; rerun after fix before final certification.

### Post-fix targeted update

The two wrong-job and two changed-task cases now reject as expected (4 passed). Added and passed named output corruption/trace/path checks (3), code cycle exhaustion/restart (1), video feedback transaction death/rollback/replay (1), Git submodule and Windows junction checks (2), and a Docker host-death watchdog (1). See `terra-r4-matrix.md` for mappings. Synthetic H01 transfer/retention and H02 repair/new siblings now run with journal and feedback binding; forged metric and sibling controls were rejected (2 passed). R6 paired development wiring runs all five arms with a fake specialist, accounts both team components, and independently verifies feedback, source pairing, reservations and arbitration; forged job/route/team cost/feedback/arbitration controls are rejected, and wrong specialist falls back to a verified tool. These targeted post-fix passes replace the earlier specific R4/R5/R6 gaps listed above; scientific transfer, real specialist/team performance and sealed study remain unproven. Final-source hashes and full-suite result must be added after the next commit and test run.
