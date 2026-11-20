---
id: "D06"
title: "Language or native representation"
type: "decision"
status: "open_with_provisional_default"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/decision
---

# Language or native representation

## Decision question

Language or native representation?

## Alternatives retained

| Alternative | Evidence state | Action |
|---|---|---|
| Precise bounded natural language | Compare linked source/history conditions; no universal winner declared | Preserve and test |
| Typed numerical or symbolic payload | Compare linked source/history conditions; no universal winner declared | Preserve and test |
| Learned representation with a translator | Compare linked source/history conditions; no universal winner declared | Preserve and test |

## Provisional build default

Use the representation the consumer can interpret and verify; keep meaning, units, and provenance explicit.

## Decision and reopening rule

Compare information loss and whole-task cost. Do not impose a universal ban on language or claim arbitrary embeddings are compatible.

## Discriminating experiment

[Compare typed messages, precise prose and learned representations](../40_Experiments/E07_Communication_Representations.md)

## Research paths

[Typed channels](../10_Research/T04_Communication/P13_Typed_channels.md) · [Learned codes and translators](../10_Research/T04_Communication/P15_Learned_codes_and_translators.md)

## Evidence update record

- **2026-11-20:** alternatives registered; prototype default proposed.
- **Result required:** exact run, configuration, comparison, uncertainty, and supported scope.
- **Next revision:** append the change and rationale; preserve the previous decision.

[Open design decisions](../05_Open_Decisions.md) · [Evidence, disagreements, and research state](../04_Evidence_and_Disagreement.md)
