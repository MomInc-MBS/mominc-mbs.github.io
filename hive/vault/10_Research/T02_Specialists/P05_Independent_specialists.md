---
id: "P05"
title: "Independent specialists"
type: "research_path"
status: "proposed"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/research_path
---

# Independent specialists

**Parent topic:** [Specialist structure](T02_Specialists.md)  
**Status:** research path; implementation and outcomes remain to be tested.

## Question

When does independent ownership prevent interference enough to justify extra models?

## Retained branches

| Branch | Candidate mechanism | Current status |
|---|---|---|
| P05.A | Independent whole small models | Retained for comparison |
| P05.B | Shared encoder with private heads | Retained for comparison |
| P05.C | Private adapters over a shared base | Retained for comparison |

## Prototype to build

Define one bounded task family and its input/output contract per specialist. Measure cross-task interference before deciding a boundary. Count every resident and stored copy.

## Measurement and failure condition

Compare against a generalist with equal tool and memory access. Independence earns adoption through retention or task gains after loading, routing, and maintenance costs.

## Adjacent research avenues

Modular learning; progressive networks; transfer matrices.

Create a new path when one of these changes the mechanism or test; otherwise link new evidence here.

## Experiments and decisions

[Compare generalists, independent specialists, adapters and hybrids](../../40_Experiments/E03_Expert_Architecture_Comparison.md) · [Use measured interference to test regrouping and routing](../../40_Experiments/E06_Interference_Driven_Regrouping.md)  
[Independent models or shared components](../../30_Decisions/D01_Independent_models_or_shared_components.md) · [How specialists should be grouped](../../30_Decisions/D07_How_specialists_should_be_grouped.md)

## Previous methods

[Specialist grouping, sharing, and interference](../../51_Prior_Methods/H02-Specialist-Grouping.md) · [Model size, resource budgets, and larger hive scales](../../51_Prior_Methods/H12-Capacity-and-Scale.md)

## Biological or physical inspiration

[Protected specialization and expandable capacity](../../20_Metaphors/M09-protected-specialization.md) · [Printed pneumatic robots and structure doing computation](../../20_Metaphors/M10-fluidic-structure.md)

## Sources to start from

[LoRA implementation and paper](../../60_Sources/S12_LoRA_implementation_and_paper.md)

## Continue through the graph

[Topic-based research-agent workflow](../../70_Local_Build/B05_Research_Agent_Workflow.md) · [Evidence, disagreements, and research state](../../04_Evidence_and_Disagreement.md) · [Topic-first research map](../../03_Research_Map.md)

## Cross-topic connection

[Adaptive graph and grouping](../T03_Coordination/P11_Adaptive_graph_and_grouping.md)
