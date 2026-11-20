---
id: "T02"
title: "Specialist structure"
type: "topic"
status: "active_research"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/topic
---

# Specialist structure

## Central question

Which functions should share parameters, and which need independent learning?

## Separate research paths

| Path | Question | Main experiment |
|---|---|---|
| [Independent specialists](P05_Independent_specialists.md) | When does independent ownership prevent interference enough to justify extra models? | [Compare generalists, independent specialists, adapters and hybrids](../../40_Experiments/E03_Expert_Architecture_Comparison.md) · [Use measured interference to test regrouping and routing](../../40_Experiments/E06_Interference_Driven_Regrouping.md) |
| [Shared backbone and adapters](P06_Shared_backbone_and_adapters.md) | How much specialization can a compatible base support without harmful coupling? | [Compare generalists, independent specialists, adapters and hybrids](../../40_Experiments/E03_Expert_Architecture_Comparison.md) · [Test bounded memory, correction, retention and removal](../../40_Experiments/E08_Bounded_Growth_Corrections_Unlearning.md) |
| [Internal experts and expandable memory](P07_Internal_experts_and_expandable_memory.md) | What can sparse experts inside a model contribute to HIVE's learning? | [Compare generalists, independent specialists, adapters and hybrids](../../40_Experiments/E03_Expert_Architecture_Comparison.md) · [Test sleep, replay order, expansion and distillation independently](../../40_Experiments/E04_Sleep_Factorial.md) · [Test bounded memory, correction, retention and removal](../../40_Experiments/E08_Bounded_Growth_Corrections_Unlearning.md) |
| [Deterministic and nonlanguage experts](P08_Deterministic_and_nonlanguage_experts.md) | What is the smallest mechanism that reliably performs a bounded job? | [Compare generalists, independent specialists, adapters and hybrids](../../40_Experiments/E03_Expert_Architecture_Comparison.md) · [Compare typed messages, precise prose and learned representations](../../40_Experiments/E07_Communication_Representations.md) |

## Adjacent research avenues

[Causal modularity](F01_Causal_modularity.md)

## Research contract

Apply the direct, competing, boundary, adjacent, implementation, and history lanes in [Topic-based research-agent workflow](../../70_Local_Build/B05_Research_Agent_Workflow.md). Retain alternatives on [Open design decisions](../../05_Open_Decisions.md) and distinguish evidence from proposed translation using [Evidence, disagreements, and research state](../../04_Evidence_and_Disagreement.md).
