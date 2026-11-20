---
id: "H02"
title: "Specialist grouping, sharing, and interference"
type: "prior_method"
status: "prior_artifact_reviewed"
evidence_status: "prior_artifact_reviewed"
implementation_status: "historical_record"
created: "2026-11-20"
tags:
  - hive
  - hive/prior_method
---

# Specialist grouping, sharing, and interference

## Actually tried

**360 archived NumPy MLP training runs:** five seeds; three parameter budgets; four organizations; three replay schedules; two synthetic rule regimes. Every run used 360 optimizer updates and 11,520 sample presentations.

At approximately 4,096 total parameters with interleaved replay:

| Organization | Shared rules | Conflicting rules |
|---|---:|---:|
| One generalist | 91.03% | 74.47% |
| Two mixed pairs | 89.59% | 66.11% |
| Two compatible pairs | 89.80% | 83.88% |
| Four isolated experts | 87.00% | 88.98% |

**Retain both findings:** isolation protects conflicting skills; sharing can improve transfer when rules overlap. Regrouping the same two experts improved conflicting-task accuracy by 17.76 percentage points. Its descriptive five-seed 95% interval was ±6.75 points, without multiple-comparison correction.

## Boundary

- Grouping and domain routing were supplied by the generator, not discovered by HIVE.
- These were independent tiny networks, not pretrained LLMs or shared-backbone adapters.
- No result establishes a universal best specialist count.

## New path

Measure a transfer/interference matrix after each candidate update. Compare topic-defined groups, learned groups, independent experts, and shared adapters. Topic-first research organization should not force identical neural sharing boundaries.

See [replay](H03-Replay-and-Sleep.md) and [capacity](H12-Capacity-and-Scale.md).

## Recovered source documents

[HIVE_Simulation_Findings_and_Starting_Plan](../50_Source_History/R15_HIVE_Simulation_Findings_and_Starting_Plan.md) · [HIVE_Reproducible_Experiments](../50_Source_History/R14_HIVE_Reproducible_Experiments.md)

## Current research connections

[Specialist structure](../10_Research/T02_Specialists/T02_Specialists.md) · [Previous research and attempted methods](../06_Previous_Work.md)
