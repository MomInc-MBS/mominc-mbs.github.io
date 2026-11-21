# Change / Release History

## Video mission engineering alpha — 21 November 2026

Published v0.3.0.dev2 engineering source, 235-test evidence, 3 CLI journeys, clean-ZIP smoke and the full working-prototype plan. A 28.32-second excerpt from a 39:13.75 studio stream completed two objective jobs (captions and clip proposals) using one local-model call and 17 generated tokens. Fresh-process replay and STOP/resume used zero additional calls. The source had prior editing exposure; editorial acceptance is pending and it does not count toward unused A2 tasks. Earlier packages and rejected/quarantined decisions remain preserved.

[Source, results, demo and limitations](/hive/notes/WORKING/).

## Latest executed increment: adaptive controller v0.2

**IMPLEMENTED / MEASURED; experimental checkpoints only.** The new controller
completed 30 real local-model calls. Direct model 3/6 → learned router 5/6;
it rejected a 4/6 regression, retained its checkpoint, then continued to
deterministic tools at 6/6. All 36 observations and decisions reverified in a
fresh process with zero new calls. Current v0.2.1 passed 136 tests and both CLI journeys; one Windows symlink
test was skipped. The measured run retains its v0.2.0 source snapshot.

[Executable controller, source, results and limits](/hive/notes/CONTROLLER/).
Last verified: **21 November 2026 UTC**. Repeated validation supports only this
finite selection experiment; broad learning and strong-baseline superiority
remain unproven. Earlier records below retain their original scope.


## 2026-11-20 local / 2026-11-21 UTC ? autonomous prototype v0.1

Ian requested live repository updates for completed progress and experiments.
Published the exact source snapshot `9c6c331`, downloadable ZIP, full public
experiment evidence and [prototype milestone](/hive/notes/PROTOTYPE/), linked from
implementation status, the experiment registry, search and graph. 52 runtime tests,
the CLI journey and six fresh-inference checks pass. The learned candidate remains
QUARANTINED; the prior caption-pilot rejection remains intact. Private evaluator
stores and per-case holdout outputs are not published. Workers are stopped after
118/120 local calls; the next broader experiment requires a new bounded mission.

Last verified for this update: **21 November 2026 UTC**.

## 2026-11-20 local / 2026-11-21 UTC — empirical pilot

**Website publication approved by Ian. Experimental candidate remains undeployed.** Base `60b1412`; release through [PR #46](https://github.com/MomInc-MBS/mominc-mbs.github.io/pull/46).

- Added `tools/hive_engine/`: D1–D5 decisions, append-only trace store, capability contracts, caption adapters, frozen fixtures, independent checker, failure-derived proposal, curated export, replay, memory and local stage/rollback.
- Added eight requested reports under `hive/implementation/`, seven navigable evidence views, the exact supplied change plan, and sanitized synthetic artifacts under `hive/evidence/caption-pilot-1/`.
- Extended the existing static builder, navigation, full-text search and research graph. Preserved the purple/gold theme, old sources and all archive bytes.
- Initial regression checks exposed non-finite budget handling, a concatenated-cue edge case and a mutable fixture-rubric reference. These were corrected before the first recorded pilot.
- Initial pilot: candidate rejected; review identified its equivalence to an existing composition. The next engineering revision performs semantic validation before invoking ffprobe and records skipped calls. The same exposed fixture holdout was retained for regression comparison; no fresh-generalization claim.
- Review tightened the externally pinned fixture digest, explicit fixture bootstrap, code/candidate hash checks, record contracts and full replay evidence. No gates or reference labels were weakened to obtain acceptance.
- Final measured candidate: **REJECTED**. Approval absent; no deployed experimental policy, weights, permissions or production runtime changes.

## Reproducible checks

```sh
python -m tools.hive_engine.test_engine
python -m tools.hive_engine.pilot --out .hive-local/run-new
python -m tools.hive_engine.verify .hive-local/run-new
python tools/check_hive.py
python tools/gen_game_packs.py
```

Runtime regression result: 13 tests, 0 failures, 0 errors. Evidence inspector: 576 episodes with attributable verifications and output hashes. The test-only release record and restored execution are in [test-results.json](/hive/evidence/caption-pilot-1/test-results.json). No experimental runtime release was created.

Website QA passed at 1440, 1024, 900, 390 and 320 CSS pixels: all seven evidence views, mobile navigation, search, graph, original diagrams/equations, and reading without JavaScript. There were no page errors or failed requests. These are browser/emulated-phone checks, not a physical-phone test. The vault validator reported zero errors; the static checker verified 313 HTML pages, over 22,800 local links and all 19 original archives. Required game-pack regeneration produced no asset-content changes. The first build refused a colliding `EXPERIMENTS` ID; the measured registry now uses additive `RUNS`, preserving the old experiment-design index.

[Staged browser regression report](/hive/evidence/caption-pilot-1/website-checks.json)

The supplied change plan explicitly requires approval for production-impacting changes and prohibits autonomous promotion of experimental policies/weights. Ian approved the tested static website update with “Publish the website update.” This authorizes publication of the documentation and evidence through PR #46; the rejected candidate, experimental policies, weights and permissions remain undeployed. Local test approvals never authorize production.


Last verified: **2026-11-21T04:27:34.3337389Z**. Evidence is a local CPU/tool pilot on synthetic fixtures. No production HIVE runtime, trained weights, or compounding-learning result is claimed.
