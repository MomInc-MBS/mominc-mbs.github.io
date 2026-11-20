---
id: "P23"
title: "Admission and residency"
type: "research_path"
status: "proposed"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/research_path
---

# Admission and residency

**Parent topic:** [Resources and scale](T07_Resources.md)  
**Status:** research path; implementation and outcomes remain to be tested.

## Question

How should HIVE share compute with OBS and other foreground software?

## Retained branches

| Branch | Candidate mechanism | Current status |
|---|---|---|
| P23.A | Static reservation | Retained for comparison |
| P23.B | Threshold admission with hysteresis | Retained for comparison |
| P23.C | Measured feedback or predictive admission | Retained for comparison |

## Prototype to build

Observe the normal stream workload before choosing limits. Account for weights, caches, activations, driver/runtime allocation, other apps, and recovery headroom.

## Measurement and failure condition

Track p95 audio/task latency, frame drops, memory peaks, loading churn, and oscillation. Total system RAM is not interchangeable with VRAM.

## Adjacent research avenues

Homeostatic control; cache economics; operating systems.

Create a new path when one of these changes the mechanism or test; otherwise link new evidence here.

## Experiments and decisions

[Measure the actual computer and concurrent workload](../../40_Experiments/E02_Hardware_Workload_Baseline.md) · [Compare whole-system and per-specialist sleep during real service](../../40_Experiments/E09_Sleep_Scheduling_With_Live_Workloads.md) · [Scale 100, 1,000 and 10,000 logical experts with measured active workers](../../40_Experiments/E10_Logical_Expert_Registry_Scaling.md)  
[When HIVE should sleep](../../30_Decisions/D03_When_HIVE_should_sleep.md) · [Growth, compression, and scale](../../30_Decisions/D08_Growth_compression_and_scale.md)

## Previous methods

[Scheduling, selective activation, and graph topology](../../51_Prior_Methods/H04-Scheduling-and-Graphs.md) · [Model size, resource budgets, and larger hive scales](../../51_Prior_Methods/H12-Capacity-and-Scale.md)

## Biological or physical inspiration

[Slow feedback and resource homeostasis](../../20_Metaphors/M07-homeostatic-feedback.md) · [Selective downscaling and capacity recovery](../../20_Metaphors/M02-sleep-scaling.md)

## Sources to start from

Use the primary sources on the linked history and metaphor pages; add task-specific evidence before making a performance claim.

## Continue through the graph

[Topic-based research-agent workflow](../../70_Local_Build/B05_Research_Agent_Workflow.md) · [Evidence, disagreements, and research state](../../04_Evidence_and_Disagreement.md) · [Topic-first research map](../../03_Research_Map.md)

## Cross-topic connection

[Live calls and supervisor streaming](../T09_Applications/P29_Live_calls_and_supervisor_streaming.md)
