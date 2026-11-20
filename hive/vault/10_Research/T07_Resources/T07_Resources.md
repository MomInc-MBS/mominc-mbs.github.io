---
id: "T07"
title: "Resources and scale"
type: "topic"
status: "active_research"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/topic
---

# Resources and scale

## Central question

How many capabilities can exist, reside, run, and learn under measured budgets?

## Separate research paths

| Path | Question | Main experiment |
|---|---|---|
| [Logical expert scale](P22_Logical_expert_scale.md) | What happens at 100, 1000, and 10000 available capabilities? | [Scale 100, 1,000 and 10,000 logical experts with measured active workers](../../40_Experiments/E10_Logical_Expert_Registry_Scaling.md) |
| [Admission and residency](P23_Admission_and_residency.md) | How should HIVE share compute with OBS and other foreground software? | [Measure the actual computer and concurrent workload](../../40_Experiments/E02_Hardware_Workload_Baseline.md) · [Compare whole-system and per-specialist sleep during real service](../../40_Experiments/E09_Sleep_Scheduling_With_Live_Workloads.md) · [Scale 100, 1,000 and 10,000 logical experts with measured active workers](../../40_Experiments/E10_Logical_Expert_Registry_Scaling.md) |
| [Sleep without interrupting service](P24_Sleep_without_interrupting_service.md) | Can one specialist consolidate while another handles live work? | [Compare whole-system and per-specialist sleep during real service](../../40_Experiments/E09_Sleep_Scheduling_With_Live_Workloads.md) |

## Adjacent research avenues

[Economic resource allocation](F04_Economic_resource_allocation.md)

## Research contract

Apply the direct, competing, boundary, adjacent, implementation, and history lanes in [Topic-based research-agent workflow](../../70_Local_Build/B05_Research_Agent_Workflow.md). Retain alternatives on [Open design decisions](../../05_Open_Decisions.md) and distinguish evidence from proposed translation using [Evidence, disagreements, and research state](../../04_Evidence_and_Disagreement.md).
