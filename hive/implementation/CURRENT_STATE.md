# Implementation Status

## v0.3 foundation: fresh E0 completed, E1 draft

The experimental source adds frozen benchmark manifests and durable one-use exposure. The newly approved E0 ran the exact published v0.2.1 code: 30 real calls, 36 verified outputs, no extra calls on replay. It exposed a stale status reason, now repaired and synthetically tested in v0.3. The foundation passes 217 tests (one skip) and both CLI journeys. No policy is deployed and broad learning remains unproven. [Inspect the checkpoint, all arms, source and next work](/hive/notes/V03/).

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


## Latest milestone: autonomous local prototype v0.1

**IMPLEMENTED / MEASURED; learned policy QUARANTINED.** A separate local HIVE
prototype now exercises real Ollama inference, verified feedback routing, durable
failure follow-up, crash recovery and checkpoint rollback. It passed 52 tests,
a CLI journey, and six fresh-inference reproduction cases. No real candidate has
been promoted; broad improvement remains unproven.

[Read the complete milestone, comparisons, source and limitations](/hive/notes/PROTOTYPE/).
Last verified for this update: **21 November 2026 UTC**. The earlier CPU caption
pilot below retains its own scope, dates and rejected candidate.

## Earlier caption-pilot record

[Implementation status](/hive/notes/STATUS/) · [Experiment registry](/hive/notes/RUNS/) · [Capability registry](/hive/notes/CAPABILITIES/) · [Learning progress](/hive/notes/LEARNING/) · [Decision ledger](/hive/notes/LEDGER/) · [Known gaps](/hive/notes/GAPS/) · [Change / release history](/hive/notes/RELEASES/)

**IMPLEMENTED / MEASURED, narrow local pilot.** The first empirical engine now executes caption-validation tasks, records evidence, proposes a bounded procedure from development failures, compares it with a frozen control, rejects it when benefit is absent, and tests local version rollback. The public site remains a static reference.

## Confirmed target and existing work

Release base: `MomInc-MBS/mominc-mbs.github.io`, main `60b1412e6ee401faccc94500b9f6a6d6dd97ebea`. Working branch: `feature/hive-empirical-engine-20261120`. Target URL: `https://mominc.online/hive/`.

At inspection the site contained 288 searchable research pages, 2,413 typed edges, preserved framework 0.2, coder directions 0.4 and the adaptive addendum. `tools/build_hive.py` and `tools/check_hive.py` built/verified that reference. No operational HIVE learning controller or real-model benchmark was found in the inspected HIVE checkout or bounded local discovery. This is a scoped search, not a claim about every disk.

The original ZIP and all vault source bytes, including 19 archived originals, remain unchanged. Archived NumPy simulations are preserved as archival evidence; none are relabeled as GPU or real-model measurements.

## What runs

| Component | Status | Executable evidence |
|---|---|---|
| Episode/event store and provenance | IMPLEMENTED, tested | `core.py:Store`; append-only SQLite, hash chain, 576 episodes verified |
| Caption workflow and ffprobe adapter | IMPLEMENTED, MEASURED | `captions.py`; 48 development + 24 held-out tasks across three controls and one candidate, plus full replay |
| D1–D5 policies | IMPLEMENTED, partial calibration | `core.py`; hard eligibility, logged routing, mandatory verification, priority heuristic, independent release gates |
| Development-only proposal / curated export | IMPLEMENTED, tested | `pilot.py:propose`, `curated_dataset`; frozen lineage and rubric |
| Local stage/rollback | IMPLEMENTED, test-only | [test-results.json](/hive/evidence/caption-pilot-1/test-results.json); explicit bound test approval and restored execution |
| Partitioned memory corrections | IMPLEMENTED, tested | `core.py`; expiry, conflicts, access, supersession and rollback revision |
| Real-model arms, learned router, parameter training | PLANNED / unavailable for this run | No model loaded; no inference or neural weight updates executed |
| Production promotion | NOT DEPLOYED | Candidate rejected; no operator approval; no production deployment function |

## Evidence conventions

**HYPOTHESIS** means an untested proposition. **SPECIFIED** means a contract exists. **IMPLEMENTED** requires executable code exercised by a check. **MEASURED** requires a named run and its scope. **REPLICATED** requires an independently described repeat; this pilot reports same-machine deterministic replay, not independent scientific replication. **REJECTED** records a candidate or hypothesis that failed its declared gate. A page may have several dimensions; old archival labels retain their original meaning.

## Reproduce

Download and extract [the complete source and fixed fixtures](/hive/evidence/caption-pilot-1/reproduce.zip). With Python 3.11+ and ffprobe 9.0 on PATH:

```sh
python -m tools.hive_engine.test_engine
python -m tools.hive_engine.pilot --out run-new
python -m tools.hive_engine.verify run-new
```

Use a new output directory each time. The runner requires the committed dataset and independently pinned digest; it never silently generates a replacement. An explicit bootstrap command exists for reproducing the supplied fixtures, and verifies the fixed digest. No third-party Python package is required for the runtime.

[Trace integrity result](/hive/evidence/caption-pilot-1/integrity.json) · [Portable record schema](/hive/evidence/caption-pilot-1/records.schema.json) · [Supplied architecture change plan](/hive/notes/GAPPLAN/)


Last verified: **2026-11-21T04:27:34.3337389Z**. Evidence is a local CPU/tool pilot on synthetic fixtures. No production HIVE runtime, trained weights, or compounding-learning result is claimed.
