---
id: HIVE-M1-ACCEPTED-2026-11-24
schema_version: "1.0"
title: "HIVE M1 Accepted: First Verified Evolutionary Benefit — 24 November 2026"
date: 2026-11-24
status: "measured-engineering-result; verified on synthetic data; no generality claim"
project: HIVE
artifact_type: evidence_report
priority: high
---

# M1 accepted: first verified evolutionary benefit — 24 November 2026

This follows the [evaluator isolation note](/hive/notes/ISOLATION/). M1 is the first milestone where a registered workflow beat the existing one on held-out data. The result is **verified on synthetic data**. It is a narrow result, and the limits are listed below.

The runtime made **0 model calls** and 0 network calls.

## What M1 tested

- **Protocol:** `m1-row-reconcile-v1`, frozen at `af4b8d6`. Protocol file sha256 `6517f2e6…`.
- **Question:** can deterministic, type-directed search find a workflow that handles bad rows in synthetic inventory files, when the existing workflow cannot?
- **Search:** a pinned set of thin views (`identity`, `parse_whole`, `split_rows`, `aggregate`) plus a generic `each` combinator.
- **Nominee:** `[split_rows, each(parse_whole), aggregate]`. It was locked before the held-out set was opened.
- **Incumbent:** `W_strict` = `[parse_whole, aggregate]`.

## Results

| Check | Nominee | Control | Test |
|---|---:|---:|---|
| Held-out final set (F-final, 60 cases) | 60/60 | 12/60 | exact McNemar, p = 3.6e-15 |
| Reuse after restart in a new process (F-reuse, 20 cases) | 20/20 | 4/20 | exact McNemar, p = 1.5e-5 |
| Random search (20 draws) | none type-check | | |

The incumbent passed only the 12 clean files. The margin mostly confirms the clean and defective mix, plus the nominee's exact correctness on defective files.

## Lifecycle checks

- After a restart, the selection resolved to the nominee from stored state.
- Rollback to `W_strict` worked, and three post-rollback cases matched the control.
- Selecting a rejected variant, forged or stale receipts, and invalid proposals were all refused.
- The independent oracle rejected all five wrong-output fixtures.

## Regression gate

Full suite: 900 passed, 3 skipped, 1 failed. The one failure was a test-isolation fault: a test read a process-wide Docker counter that an earlier test had already raised. It was not an M1 behaviour fault. The test was fixed and a targeted rerun passed 45. The full suite was not rerun.

## Versions and cost

- Runtime commit: `755aa6f`.
- Follow-up fix `5c901a9`: policy pins now hash line-ending-normalized bytes, so a fresh Windows checkout no longer fails the stale-pin check.
- M1 cost: about $9.42 against a $24 cap. Cumulative: about $64 of the $120 ceiling.
- Runtime: 11 container runs, $0.

## Limitations

- **Synthetic data only.** No real-world data was used.
- **Tiny search space.** Only 3 workflows type-check, out of 584 lists. This is disclosed. No claim is made about search skill.
- **The designers already knew the solution.** `each` and the error channel were declared preparation, not discovery.
- **Arm 2 is hardcoded** to `W_strict` rather than reached through a skill-off path. The result is the same.
- **An unkeyed store writer can forge records** (SQ-1). M1 ran as a trusted-local experiment.
- **The private holdout is owned by the same OS user** as the runtime. It is a gitignored folder, not a separate trust boundary.
- **Open findings are unchanged from M0.**
- No claim is made about generality, and none is made about intelligence.

## Next

Freeze the M2 protocol for a fixed-weight local-model campaign (gpt-oss-20b) with two distinct effects. The campaign itself waits for a separate inference go.

Publication grants no runtime authority, promotes no policy and expands no budget. Private evaluator material and per-case held-out labels and results are not published.
