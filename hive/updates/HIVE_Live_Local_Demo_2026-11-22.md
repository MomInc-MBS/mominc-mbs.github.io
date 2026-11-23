---
id: HIVE-LIVE-DEMO-2026-11-22
schema_version: "1.0"
title: "HIVE First Live Local-Model Demo — 22 November 2026"
date: 2026-11-22
status: "measured-engineering-result; candidate rejected; grants no further authority"
project: HIVE
artifact_type: evidence_report
priority: high
---

# HIVE v0.4 — first live local-model demo, 22 November 2026

**Result: O5 PASS. Candidate REJECTED. P0 unchanged. Replay made zero model calls.** 5 of the 24 approved requests were used (73 of 3,072 tokens, 7 cycles).

This is the first run of the v0.4 prototype with real local-model inference. It followed the owner's chat approval of the small finite allocation proposed on [the operational prototype page](/hive/notes/OPERATIONAL/): 24 requests, 128 generated tokens each, 3,072 tokens in total, one worker, one pinned local classification model.

## What ran

| Step | Result |
|---|---|
| Doctor | Exit 0; model and Docker healthy |
| Development data mission | VERIFIED |
| Python label mission (Docker) | COMPLETED; patch VERIFIED |
| Model-backed combined mission | COMPLETED; data, Python, review and report stages all VERIFIED |
| Classification learning comparison | **REJECTED**: the candidate was identical to P0, quality tied, and it did not beat the fixed team. P0 unchanged |
| Subsequent distinct task | **FAILED** `check_failed`: the model output was shape-valid but wrong, and the independent verifier caught it |
| STOP / resume | Exit 0 |
| Fresh-process replay of all four | Identical statuses; counters unchanged |

Store totals after the run: **5 requests, 73 tokens, 7 cycles**. Before and after replay the totals were identical (5 / 73 / 7), so replay spent nothing.

## Gate reading

- **O5 now PASS**: a new authorized local dispatch with receipts. O1–O10 engineering gates all have evidence.
- The release label is not yet relabeled OPERATIONAL_PROTOTYPE_DEMONSTRATED. Independent review of this run is still pending.
- The failed subsequent task is kept as a result. It shows the independent verifier doing its job on a plausible but wrong model answer.

## What this does not show

- **No beneficial learning (R1).** The candidate tied P0 and was rejected.
- **Level A not accepted (R2).** It still needs six unused data sources and six unused Python snapshots, with at least 10 of 12 accepted.
- **Level B untested.** It needs at least 24 source-disjoint held-out tasks.
- **No promotion.** P0 remains the governing policy and P2 stays quarantined.
- The run used first-party development inputs, not an untouched research corpus.

## Owner decisions recorded the same day

- Local-model calls: approved, limited to the small proposal above.
- Compare external regimes, then take pieces; keep HIVE's own kernel. See [the decision record](/hive/notes/DIRECTION/).
- Compounding budget "max" is read as the full approved allocation per phase. Anything beyond it needs a new approval file.
- Public benchmark: yes; the choice is delegated to the overseer and must be attemptable by the local model.
- Name: no answer, so it stays HIVE.

## Next actions

1. Independent review of this run, then decide on the release relabel.
2. Level A needs 12 unused, approved sources from the owner.
3. See [the unified integration campaign](/hive/notes/UNIFIED/) for what was built afterwards, with zero further model calls.

Source revision: `f5fbb1a` of the HIVE repository. Private evaluator stores and per-case holdout labels and results are not published.
