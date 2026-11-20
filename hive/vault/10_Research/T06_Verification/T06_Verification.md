---
id: "T06"
title: "Verification and contamination"
type: "topic"
status: "active_research"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/topic
---

# Verification and contamination

## Central question

What warrants accepting an answer, a memory, a training example, or a release?

## Separate research paths

| Path | Question | Main experiment |
|---|---|---|
| [Executable verification](P19_Executable_verification.md) | Which outcomes can be checked independently? | [Compare generalists, independent specialists, adapters and hybrids](../../40_Experiments/E03_Expert_Architecture_Comparison.md) · [Test whether dreaming adds value beyond verified replay](../../40_Experiments/E05_Dreaming_vs_Replay.md) |
| [Critics and calibrated uncertainty](P20_Critics_and_calibrated_uncertainty.md) | When does another model add useful checking? | [Compare generalists, independent specialists, adapters and hybrids](../../40_Experiments/E03_Expert_Architecture_Comparison.md) · [Test whether dreaming adds value beyond verified replay](../../40_Experiments/E05_Dreaming_vs_Replay.md) |
| [Contamination and boundaries](P21_Contamination_and_boundaries.md) | Which failures spread through memory, protocols, or training? | [Compare typed messages, precise prose and learned representations](../../40_Experiments/E07_Communication_Representations.md) · [Test bounded memory, correction, retention and removal](../../40_Experiments/E08_Bounded_Growth_Corrections_Unlearning.md) |

## Adjacent research avenues

[Metamorphic and compositional testing](F05_Metamorphic_and_compositional_testing.md)

## Research contract

Apply the direct, competing, boundary, adjacent, implementation, and history lanes in [Topic-based research-agent workflow](../../70_Local_Build/B05_Research_Agent_Workflow.md). Retain alternatives on [Open design decisions](../../05_Open_Decisions.md) and distinguish evidence from proposed translation using [Evidence, disagreements, and research state](../../04_Evidence_and_Disagreement.md).
