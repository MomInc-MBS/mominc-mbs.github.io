---
id: "P22"
title: "Logical expert scale"
type: "research_path"
status: "proposed"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/research_path
---

# Logical expert scale

**Parent topic:** [Resources and scale](T07_Resources.md)  
**Status:** research path; implementation and outcomes remain to be tested.

## Question

What happens at 100, 1000, and 10000 available capabilities?

## Retained branches

| Branch | Candidate mechanism | Current status |
|---|---|---|
| P22.A | Many registry records with a measured active set | Retained for comparison |
| P22.B | Resident cached specialist pools | Retained for comparison |
| P22.C | Time-multiplexed model or adapter execution | Retained for comparison |

## Prototype to build

Scale registry metadata first, then realistic loading and contention traces. Keep simulation results separate from trials with actual models. Discover active concurrency on the real machine.

## Measurement and failure condition

Measure lookup, scheduling, queueing, cold starts, disk, RAM, VRAM, and success. A registered count is not a count of simultaneously running networks.

## Adjacent research avenues

Sparse activation; hierarchical indexes; queueing theory.

Create a new path when one of these changes the mechanism or test; otherwise link new evidence here.

## Experiments and decisions

[Scale 100, 1,000 and 10,000 logical experts with measured active workers](../../40_Experiments/E10_Logical_Expert_Registry_Scaling.md)  
[Growth, compression, and scale](../../30_Decisions/D08_Growth_compression_and_scale.md)

## Previous methods

[Scheduling, selective activation, and graph topology](../../51_Prior_Methods/H04-Scheduling-and-Graphs.md) · [Model size, resource budgets, and larger hive scales](../../51_Prior_Methods/H12-Capacity-and-Scale.md)

## Biological or physical inspiration

[Slow feedback and resource homeostasis](../../20_Metaphors/M07-homeostatic-feedback.md) · [Selective downscaling and capacity recovery](../../20_Metaphors/M02-sleep-scaling.md)

## Sources to start from

[vLLM LoRA adapters](../../60_Sources/S13_vLLM_LoRA_adapters.md)

## Continue through the graph

[Topic-based research-agent workflow](../../70_Local_Build/B05_Research_Agent_Workflow.md) · [Evidence, disagreements, and research state](../../04_Evidence_and_Disagreement.md) · [Topic-first research map](../../03_Research_Map.md)

## Cross-topic connection

[Communities and local recruitment](../T03_Coordination/P10_Communities_and_local_recruitment.md)
