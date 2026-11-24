---
id: HIVE-ISOLATION-LINEAGE-2026-11-23
schema_version: "1.0"
title: "HIVE Evaluator Isolation and Lineage Start — 23 November 2026"
date: 2026-11-23
status: "measured-engineering-result; tool-only; no learning claim; no generated candidate run"
project: HIVE
artifact_type: evidence_report
priority: high
---

# HIVE evaluator isolation and lineage start — 23 November 2026

This follows the [autonomous experiment checkpoint](/hive/notes/V04X/), which named FR-2 evaluator isolation as the next task. Two quarantine items are now lifted and a lineage store has been started. The runtime made **0 model calls**.

Full suite at `6127776`: 856 passed, 3 skipped, 0 failed (34 min).

## FR-2 lifted: candidates run in a separate process

Candidates now run in a separate process, and the whole process tree is killed on timeout or at the end of the run. Scoring stays in the parent. The reviewer's scorer-rewrite probe, which earlier made a candidate report a perfect score, now scores honestly. The experiment decision and the result hash are unchanged from before the change.

## FR-8 lifted: generated and code candidates need a container

Generated or code candidates must run in a pinned, network-less, read-only container. The container backend is recorded in the candidate's hash, so a candidate cannot claim a weaker backend afterwards. Only built-in data-rule sources may still run in-process. An independent review found no escape. Its two findings were fixed and retested.

**Residuals:**
- Only Windows with Docker Desktop has been tested as a host.
- A container is a shared-kernel boundary, not a virtual machine.

## P2 lineage started

Candidate records are content-addressed on the existing store, with parent links and a tamper check. There is no promotion path. Compare runs now register their candidates in the lineage store without changing their results.

## Not claimed

- No learning has been shown.
- No evolutionary benefit has been shown.
- No generated candidates have run yet.
- The owner definitions D7 to D11 are still pending.

## Cost

HIVE runtime: 0 model requests, $0. This session's agent engineering was about $11.60 at list price (cumulative about $52); the actual provider charge is unknown.

Publication grants no runtime authority, promotes no policy and expands no budget. Private evaluator material and held-out details are not published.
