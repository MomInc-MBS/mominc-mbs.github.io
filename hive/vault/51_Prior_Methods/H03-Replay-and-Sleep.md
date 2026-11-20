---
id: "H03"
title: "Replay ordering and the reopened sleep branch"
type: "prior_method"
status: "prior_artifact_reviewed"
evidence_status: "prior_artifact_reviewed"
implementation_status: "historical_record"
created: "2026-11-20"
tags:
  - hive
  - hive/prior_method
---

# Replay ordering and the reopened sleep branch

## Actually tried

The archived experiment changed **the order of the same minibatches**. It used a bounded 256-record replay store and an equal presentation budget.

| Conflicting-task generalist, ~4K parameters | Final accuracy |
|---|---:|
| Current data only | 54.31% |
| Interleaved old/new replay | 74.47% |
| Current block, then old-data block | 62.64% |

Interleaved replay exceeded blocked replay by 11.84 percentage points; descriptive five-seed 95% interval ±5.78 points.

## What this result means

The old-data-only tail could overwrite recent conflicting learning. Fully isolated experts produced identical interleaved/blocked results because updates did not cross their parameter boundaries. Replay also consumed budget otherwise available for fresh examples.

## What it did not test

- Expanded specialist memory or additional low-rank experts.
- Upward knowledge distillation.
- Generative dreaming or curated synthetic practice.
- A learned consolidation controller or biological REM.

**Keep the negative replay result and the new Google Sleep evidence together.** They test different mechanisms; the old experiment cannot reject the larger sleep hypothesis.

## New path

Compare matched-budget interleaving, mixed-data offline consolidation, expansion alone, distillation alone, and the full sleep recipe. Add dreaming as a separate ablation. Count extra parameters, examples, training compute, and serving disruption.

## Recovered source documents

[HIVE_Simulation_Findings_and_Starting_Plan](../50_Source_History/R15_HIVE_Simulation_Findings_and_Starting_Plan.md) · [HIVE_Reproducible_Experiments](../50_Source_History/R14_HIVE_Reproducible_Experiments.md)

## Current research connections

[Learning lifecycle](../10_Research/T01_Learning/T01_Learning.md) · [Previous research and attempted methods](../06_Previous_Work.md)
