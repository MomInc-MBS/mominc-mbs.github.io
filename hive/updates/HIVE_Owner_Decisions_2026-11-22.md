---
id: HIVE-OWNER-DECISIONS-2026-11-22
schema_version: "1.0"
title: "HIVE Owner Decisions — 22 November 2026"
date: 2026-11-22
status: "owner-decision-record; grants no runtime authority by itself"
project: HIVE
artifact_type: decision_record
priority: high
---

# HIVE — Owner decisions, 22 November 2026

**Purpose:** Record the decisions Ian Myers gave on 22 November 2026 in response to [the integrated design map](/hive/notes/WHOLE/). Where an answer was a plain "yes" to a question with several options, the reading taken is stated and marked **[READING]** so it can be corrected.

**This page grants no runtime authority.** The runtime accepts live inference only from a separate operator approval file created locally; publishing a decision here does not create one.

## Decided

| # | Question | Decision | Consequence |
|---|---|---|---|
| 1 | Publish the external landscape and design map | Yes | Merged to main on 22 November 2026. |
| 2 | Compounding experiment next | Yes | The two-phase protocol becomes the next experiment. Design it so Level A tasks can serve as phase one. |
| 3 | Approve new local-model calls | Yes **[READING]** | Read as: the existing written O5 proposal (8 tasks, at most 24 requests, 128 generated tokens each, 3,072 total, one request at a time, 1,800 active seconds, 64 MiB). A budget for the compounding experiment is agreed in principle; its numbers are not yet written. The operator still has to create the approval file locally. |
| 4 | No-regression condition inside candidate search | Yes | Add to the candidate loop. The review gate already requires `no_regression` at the end; this moves the check earlier as well. |
| 5 | Regimes: borrow, keep or merge | Yes **[READING]** | Read as: write the one-page comparison first, then take specific pieces while keeping HIVE's structure. |
| 6 | Git registry for non-parameter artifacts | Yes | Alongside the existing manifest, which records the commit. |
| 7 | Evaluator outside the candidate workspace; seeded variants | Yes | Required before any promotion is claimed. |
| 8 | External candidate generator behind the gate | Yes | After 4 and 7 are in place. |
| 9 | Report on a public benchmark | Yes | The benchmark is not yet chosen. It must be one a local model can attempt. |
| 10 | Execution kernel | Compare in detail | See [the kernel comparison](/hive/notes/KERNELS/). A measured comparison on one mission is still unrun. |
| 11 | Self-editing of the improvement mechanism | Not now, but lay the base now | See [the base for later self-improvement](/hive/notes/METABASE/). [D09](/hive/notes/D09/) stays open as research. |
| 12 | Ungated skill edits | Decline; take the file format only | No ungated lane. |
| 13 | Open skill file format for procedures | Yes | One existing procedure should round-trip through the format. |
| 14 | When parameter training starts | After a non-parameter promotion succeeds | Needs its own approval when the time comes. |

## Not yet decided

- 15. The name (keep, add a qualifier, or rename).
- 16. Individual catalog pages for the new external systems.
- 17. Whether earlier chat-only research will be supplied for merging.
- The compounding experiment's inference budget.
- The public benchmark.

## Order that follows from these decisions

1. Operator creates the local approval for the existing O5 proposal.
2. Compounding experiment specified with frozen task sets and a written budget.
3. No-regression condition in the candidate loop.
4. Regimes comparison note.
5. Git registry; evaluator isolation with seeded variants.
6. The mutability manifest from [the base for later self-improvement](/hive/notes/METABASE/), because it is cheapest before more learned artifacts exist.
7. External candidate generator; skill file format.
8. Public benchmark chosen and run.

Earlier pages keep their original text. Where this record differs from a proposal on [the integrated design map](/hive/notes/WHOLE/), this record governs.
