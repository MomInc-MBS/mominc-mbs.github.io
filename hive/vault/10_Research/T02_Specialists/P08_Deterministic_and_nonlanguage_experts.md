---
id: "P08"
title: "Deterministic and nonlanguage experts"
type: "research_path"
status: "proposed"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/research_path
---

# Deterministic and nonlanguage experts

**Parent topic:** [Specialist structure](T02_Specialists.md)  
**Status:** research path; implementation and outcomes remain to be tested.

## Question

What is the smallest mechanism that reliably performs a bounded job?

## Retained branches

| Branch | Candidate mechanism | Current status |
|---|---|---|
| P08.A | Calculator, parser, solver, or state machine | Retained for comparison |
| P08.B | Small classifier or trained head | Retained for comparison |
| P08.C | Language-model specialist | Retained for comparison |

## Prototype to build

Build a uniform capability envelope so exact programs and neural models can compete on the same task. Candidate examples: media probing, geometry constraints, schema conversion, scheduling, and arithmetic.

## Measurement and failure condition

Measure whole-task success and maintenance when interfaces change. A program that is fast but fails outside its narrow contract must abstain or escalate.

## Adjacent research avenues

Constraint programming; compilers; finite-state transducers; morphological computation.

Create a new path when one of these changes the mechanism or test; otherwise link new evidence here.

## Experiments and decisions

[Compare generalists, independent specialists, adapters and hybrids](../../40_Experiments/E03_Expert_Architecture_Comparison.md) · [Compare typed messages, precise prose and learned representations](../../40_Experiments/E07_Communication_Representations.md)  
[Independent models or shared components](../../30_Decisions/D01_Independent_models_or_shared_components.md) · [What constitutes verification](../../30_Decisions/D11_What_constitutes_verification.md)

## Previous methods

[Specialist grouping, sharing, and interference](../../51_Prior_Methods/H02-Specialist-Grouping.md) · [Model size, resource budgets, and larger hive scales](../../51_Prior_Methods/H12-Capacity-and-Scale.md)

## Biological or physical inspiration

[Protected specialization and expandable capacity](../../20_Metaphors/M09-protected-specialization.md) · [Printed pneumatic robots and structure doing computation](../../20_Metaphors/M10-fluidic-structure.md)

## Sources to start from

Use the primary sources on the linked history and metaphor pages; add task-specific evidence before making a performance claim.

## Continue through the graph

[Topic-based research-agent workflow](../../70_Local_Build/B05_Research_Agent_Workflow.md) · [Evidence, disagreements, and research state](../../04_Evidence_and_Disagreement.md) · [Topic-first research map](../../03_Research_Map.md)

## Cross-topic connection

[Horror haunt game](../T09_Applications/P30_Horror_haunt_game.md)
