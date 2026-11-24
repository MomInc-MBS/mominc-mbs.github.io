---
id: HIVE-V04X-CHECKPOINT-2026-11-23
schema_version: "1.0"
title: "HIVE v0.4.x Autonomous Experiment Checkpoint — 23 November 2026"
date: 2026-11-23
status: "measured-engineering-result; tool-only; negative result kept; no learning claim; Level A not run"
project: HIVE
artifact_type: evidence_report
priority: high
---

# HIVE v0.4.x autonomous experiment checkpoint — 23 November 2026

**Label: `ENGINEERING_AUTONOMOUS_EXPERIMENT_DEMONSTRATED`.** Acceptance gates A1 to A9 are recorded as passing, with independent review of the new experiment and one test flake disclosed. Last code commit `89a1118`; checkpoint commit `2e23f05`. The runtime made **zero model calls** and spent $0 on inference.

This builds on the [unified integration campaign](/hive/notes/UNIFIED/) (689 tests at `25f19b2`) and the [live local-model demo](/hive/notes/LIVEDEMO/).

## What this label means

A tool-only experiment loop ran end to end on a real pinned public source: it proposed a candidate, evaluated it against baselines, and recorded an honest decision. It survived STOP, restart and replay with no duplicate effects, and the log is hash-linked. This is an engineering result about the loop. It is not evidence that the system learns.

**Not earned:** `BENEFICIAL_LEARNING_DEMONSTRATED`, `LEVEL_A_ACCEPTED`, `LEVEL_B_ACCEPTED`.

## Tests

On `89a1118` the full suite gave **821 passed, 3 skipped, 1 failed** in about 53 minutes. The one failure is a code-isolation test that hit a 20 second subprocess timeout while the machine was under full-suite load. The file passed 27 of 27 three times in a row when run alone, so it is recorded as a **load-sensitive flake, not fixed**. The 3 skips pre-date this campaign.

## The experiment result: a negative one

| Arm | Held-out passes (n=7) |
|---|---|
| Candidate (lowercase forbidden article) | 5 |
| Strongest deterministic baseline (preregistered rule) | 5 |
| P0 (incumbent, unchanged) | 1 |
| Learning-disabled control | 1 |
| Fixed-specialist route | N/A: no approved model route |

**Decision: `REJECT_NO_GAIN`.** The candidate ties the strongest baseline, stays quarantined, and nothing was promoted. It ties because a plain regex tool makes the same repair. The result is kept as a negative result.

Limits: the held-out items are engineered variants of the candidate's own source, so the gate reports that the held-out set was not unused for learning, and n=7 supports no population claim. The run used 0 model calls and 4 network requests to allowlisted pinned GitHub sources.

## Quarantine summary

Open items are tracked with a compensating control and a lift condition each. In one line apiece:

- **FR-2, evaluator isolation: open, and the next task.** Candidates still run in the evaluator's process, so a generated or learned candidate could in principle alter its own score. This must be fixed before any generated, learned or code candidate is run.
- **FR-3:** the held-out items are not independent of the candidate's source.
- **FR-5, FR-6, FR-7: quarantined.** Low-severity review findings, each with a compensating control.

## Level A

The owner approved **Option A only (tool-only, no model calls)** for the Level A source set. **It has not been run.** Before it can run, the three JSON/YAML sources need verifiers, and the six Python snapshots need adapters and private oracles; the three CSV sources already pass their profile check. Level A will use a separate store and must never share candidates or partitions with the evolutionary campaign. Level B is untested.

## What is next

1. **FR-2 evaluator isolation:** run candidates in a separate subprocess and score in the parent, then lift FR-2.
2. **Lineage design:** a one-page design mapped onto the existing store and artifacts, before any code.
3. **Sensory and embodied research branch (reference only):** the owner set those research plans as reference only until the core structure is proven (P4). A small replay foundation exists but is parked. No hardware, motion, model calls or training.

## Cost

HIVE runtime: 0 model requests, $0. Agent engineering for the campaign was about $40 at list price, estimated from local transcripts; the actual provider charge is unknown.

Source revision: HIVE repository checkpoint `2e23f05` (code `89a1118`). Publication grants no runtime authority, promotes no policy and expands no budget. Private evaluator stores and per-case held-out labels and results are not published.
