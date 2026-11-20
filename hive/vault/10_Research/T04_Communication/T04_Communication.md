---
id: "T04"
title: "Representations and communication"
type: "topic"
status: "active_research"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/topic
---

# Representations and communication

## Central question

What information should move between components, in which representation?

## Separate research paths

| Path | Question | Main experiment |
|---|---|---|
| [Typed channels](P13_Typed_channels.md) | Which errors can contracts prevent before a model interprets a payload? | [Compare typed messages, precise prose and learned representations](../../40_Experiments/E07_Communication_Representations.md) |
| [Domain-native representations](P14_Domain_native_representations.md) | Which representation preserves the information a downstream task needs? | [Compare typed messages, precise prose and learned representations](../../40_Experiments/E07_Communication_Representations.md) |
| [Learned codes and translators](P15_Learned_codes_and_translators.md) | Can learned communication improve efficiency without breaking compatibility? | [Compare typed messages, precise prose and learned representations](../../40_Experiments/E07_Communication_Representations.md) |

## Research contract

Apply the direct, competing, boundary, adjacent, implementation, and history lanes in [Topic-based research-agent workflow](../../70_Local_Build/B05_Research_Agent_Workflow.md). Retain alternatives on [Open design decisions](../../05_Open_Decisions.md) and distinguish evidence from proposed translation using [Evidence, disagreements, and research state](../../04_Evidence_and_Disagreement.md).
