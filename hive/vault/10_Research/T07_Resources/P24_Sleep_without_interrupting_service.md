---
id: "P24"
title: "Sleep without interrupting service"
type: "research_path"
status: "proposed"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/research_path
---

# Sleep without interrupting service

**Parent topic:** [Resources and scale](T07_Resources.md)  
**Status:** research path; implementation and outcomes remain to be tested.

## Question

Can one specialist consolidate while another handles live work?

## Retained branches

| Branch | Candidate mechanism | Current status |
|---|---|---|
| P24.A | Whole-system maintenance window | Retained for comparison |
| P24.B | Per-specialist candidate training | Retained for comparison |
| P24.C | Idle-only training with preemption | Retained for comparison |

## Prototype to build

Keep the serving artifact immutable during a task. Schedule consolidation under the same resource manager. Publish model, adapter, translator, and protocol compatibility together.

## Measurement and failure condition

Compare service quality and retained learning under identical foreground traces. Staggered sleep is an engineering hypothesis to test, not a property assumed from Google.

## Adjacent research avenues

Rolling updates; workload-aware scheduling; multi-timescale control.

Create a new path when one of these changes the mechanism or test; otherwise link new evidence here.

## Experiments and decisions

[Compare whole-system and per-specialist sleep during real service](../../40_Experiments/E09_Sleep_Scheduling_With_Live_Workloads.md)  
[When HIVE should sleep](../../30_Decisions/D03_When_HIVE_should_sleep.md)

## Previous methods

[Scheduling, selective activation, and graph topology](../../51_Prior_Methods/H04-Scheduling-and-Graphs.md) · [Model size, resource budgets, and larger hive scales](../../51_Prior_Methods/H12-Capacity-and-Scale.md)

## Biological or physical inspiration

[Slow feedback and resource homeostasis](../../20_Metaphors/M07-homeostatic-feedback.md) · [Selective downscaling and capacity recovery](../../20_Metaphors/M02-sleep-scaling.md)

## Sources to start from

[The sleep framework: A new way for LLMs to retain knowledge in continual learning](../../60_Sources/S01_The_sleep_framework_A_new_way_for_LLMs_to_retain_knowledge_in_continual_learning.md)

## Continue through the graph

[Topic-based research-agent workflow](../../70_Local_Build/B05_Research_Agent_Workflow.md) · [Evidence, disagreements, and research state](../../04_Evidence_and_Disagreement.md) · [Topic-first research map](../../03_Research_Map.md)

## Cross-topic connection

[Sleep consolidation](../T01_Learning/P02_Sleep_consolidation.md)
