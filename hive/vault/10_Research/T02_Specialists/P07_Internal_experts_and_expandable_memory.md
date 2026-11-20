---
id: "P07"
title: "Internal experts and expandable memory"
type: "research_path"
status: "proposed"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/research_path
---

# Internal experts and expandable memory

**Parent topic:** [Specialist structure](T02_Specialists.md)  
**Status:** research path; implementation and outcomes remain to be tested.

## Question

What can sparse experts inside a model contribute to HIVE's learning?

## Retained branches

| Branch | Candidate mechanism | Current status |
|---|---|---|
| P07.A | Fixed sparse expert set | Retained for comparison |
| P07.B | Preallocated capacity progressively enabled | Retained for comparison |
| P07.C | Growing specialist modules with an explicit cap | Retained for comparison |

## Prototype to build

Treat internal neural experts as a model implementation, and external tool/model agents as runtime capabilities. Define the interface between those levels before comparing them.

## Measurement and failure condition

Track total stored parameters, active computation, routing errors, and added capacity per cycle. Increased capacity must be reported when it explains improvement.

## Adjacent research avenues

Mixture of experts; dynamic architectures; capacity allocation.

Create a new path when one of these changes the mechanism or test; otherwise link new evidence here.

## Experiments and decisions

[Compare generalists, independent specialists, adapters and hybrids](../../40_Experiments/E03_Expert_Architecture_Comparison.md) · [Test sleep, replay order, expansion and distillation independently](../../40_Experiments/E04_Sleep_Factorial.md) · [Test bounded memory, correction, retention and removal](../../40_Experiments/E08_Bounded_Growth_Corrections_Unlearning.md)  
[Independent models or shared components](../../30_Decisions/D01_Independent_models_or_shared_components.md) · [Growth, compression, and scale](../../30_Decisions/D08_Growth_compression_and_scale.md)

## Previous methods

[Specialist grouping, sharing, and interference](../../51_Prior_Methods/H02-Specialist-Grouping.md) · [Model size, resource budgets, and larger hive scales](../../51_Prior_Methods/H12-Capacity-and-Scale.md)

## Biological or physical inspiration

[Protected specialization and expandable capacity](../../20_Metaphors/M09-protected-specialization.md) · [Printed pneumatic robots and structure doing computation](../../20_Metaphors/M10-fluidic-structure.md)

## Sources to start from

[Language Models Need Sleep: Learning to Self-Modify and Consolidate Memories](../../60_Sources/S02_Language_Models_Need_Sleep_Learning_to_Self_Modify_and_Consolidate_Memories.md) · [Introducing Nested Learning: A new ML paradigm for continual learning](../../60_Sources/S03_Introducing_Nested_Learning_A_new_ML_paradigm_for_continual_learning.md)

## Continue through the graph

[Topic-based research-agent workflow](../../70_Local_Build/B05_Research_Agent_Workflow.md) · [Evidence, disagreements, and research state](../../04_Evidence_and_Disagreement.md) · [Topic-first research map](../../03_Research_Map.md)
