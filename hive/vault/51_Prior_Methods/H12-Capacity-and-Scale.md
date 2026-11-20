---
id: "H12"
title: "Model size, resource budgets, and larger hive scales"
type: "prior_method"
status: "prior_artifact_reviewed"
evidence_status: "prior_artifact_reviewed"
implementation_status: "historical_record"
created: "2026-11-20"
tags:
  - hive
  - hive/prior_method
---

# Model size, resource budgets, and larger hive scales

## Actually measured versus proposed

| Quantity | Archived evidence |
|---|---|
| Neural capacities | Approximately 1,024 / 4,096 / 8,192 total MLP parameters |
| Neural organizations | One, two, or four independent networks |
| Scheduling scale | 4, 8, or 16 workers |
| 100/1,000/10,000 experts | Not measured in recovered studies |
| RTX 5070 Ti throughput/training | Not measured in recovered studies |

At the middle neural budget, four experts stored 4,056 parameters and activated 1,014 per example; the generalist stored and activated 4,096. Estimated matrix MACs excluded several runtime costs. This does not imply a fourfold GPU speedup.

## Historical starting candidates

The simulation report suggested two 0.6B language cores plus a 1.7B reference. The later v0.1 plan proposed a 1.7B controller and 0.6B specialist adapters. Neither is a demonstrated optimum. Downloaded GGUF models in the software inventory are different assets and need serving checks; GGUF presence does not establish a trainable checkpoint.

## New path

Sweep registered, trained, loaded, and executing counts separately. Measure both dedicated-research and OBS-sharing profiles. The prior 12 GiB GPU ceiling and 32 GiB interactive RAM allowance are starting policies, not measured requirements or immutable limits. Choose resource allocations from observed headroom and task performance.

## Recovered source documents

[HIVE_Simulation_Findings_and_Starting_Plan](../50_Source_History/R15_HIVE_Simulation_Findings_and_Starting_Plan.md) · [HIVE_Reproducible_Experiments](../50_Source_History/R14_HIVE_Reproducible_Experiments.md) · [HIVE_v0_1_Training_and_Build_Plan](../50_Source_History/R17_HIVE_v0_1_Training_and_Build_Plan.md) · [HIVE_SOL_Execution_Handoff](../50_Source_History/R16_HIVE_SOL_Execution_Handoff.md) · [Ian-AI-Generation-and-Game-Design-Software](../50_Source_History/R18_Ian_AI_Generation_and_Game_Design_Software.md)

## Current research connections

[Specialist structure](../10_Research/T02_Specialists/T02_Specialists.md) · [Resources and scale](../10_Research/T07_Resources/T07_Resources.md) · [Previous research and attempted methods](../06_Previous_Work.md)
