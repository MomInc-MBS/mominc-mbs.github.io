---
id: "P06"
title: "Shared backbone and adapters"
type: "research_path"
status: "proposed"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/research_path
---

# Shared backbone and adapters

**Parent topic:** [Specialist structure](T02_Specialists.md)  
**Status:** research path; implementation and outcomes remain to be tested.

## Question

How much specialization can a compatible base support without harmful coupling?

## Retained branches

| Branch | Candidate mechanism | Current status |
|---|---|---|
| P06.A | One adapter per capability | Retained for comparison |
| P06.B | Composed compatible adapters | Retained for comparison |
| P06.C | Separate bases for incompatible objectives | Retained for comparison |

## Prototype to build

Record base checkpoint hash, tokenizer, target modules, adapter rank, quantization, runtime version, and a canary task. Test the actual serving engine's load and unload behavior.

## Measurement and failure condition

Measure cold/warm latency, memory, quality, and interference after base updates. A hot-swap claim fails if it unexpectedly reloads the entire base, restarts the worker, exceeds its declared interruption budget, or accepts an incompatible adapter. Measure adapter-loading cost separately.

## Adjacent research avenues

Low-rank subspaces; adapter merging; efficient multi-tenant inference.

Create a new path when one of these changes the mechanism or test; otherwise link new evidence here.

## Experiments and decisions

[Compare generalists, independent specialists, adapters and hybrids](../../40_Experiments/E03_Expert_Architecture_Comparison.md) · [Test bounded memory, correction, retention and removal](../../40_Experiments/E08_Bounded_Growth_Corrections_Unlearning.md)  
[Independent models or shared components](../../30_Decisions/D01_Independent_models_or_shared_components.md) · [How far self-improvement may reach](../../30_Decisions/D09_How_far_self_improvement_may_reach.md)

## Previous methods

[Specialist grouping, sharing, and interference](../../51_Prior_Methods/H02-Specialist-Grouping.md) · [Model size, resource budgets, and larger hive scales](../../51_Prior_Methods/H12-Capacity-and-Scale.md)

## Biological or physical inspiration

[Protected specialization and expandable capacity](../../20_Metaphors/M09-protected-specialization.md) · [Printed pneumatic robots and structure doing computation](../../20_Metaphors/M10-fluidic-structure.md)

## Sources to start from

[LoRA implementation and paper](../../60_Sources/S12_LoRA_implementation_and_paper.md) · [vLLM LoRA adapters](../../60_Sources/S13_vLLM_LoRA_adapters.md)

## Continue through the graph

[Topic-based research-agent workflow](../../70_Local_Build/B05_Research_Agent_Workflow.md) · [Evidence, disagreements, and research state](../../04_Evidence_and_Disagreement.md) · [Topic-first research map](../../03_Research_Map.md)

## Cross-topic connection

[Learned codes and translators](../T04_Communication/P15_Learned_codes_and_translators.md)
