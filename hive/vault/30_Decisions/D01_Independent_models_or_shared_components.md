---
id: "D01"
title: "Independent models or shared components"
type: "decision"
status: "open_with_provisional_default"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/decision
---

# Independent models or shared components

## Decision question

Independent models or shared components?

## Alternatives retained

| Alternative | Evidence state | Action |
|---|---|---|
| Independent models | Compare linked source/history conditions; no universal winner declared | Preserve and test |
| Shared backbone and adapters | Compare linked source/history conditions; no universal winner declared | Preserve and test |
| Hybrid by measured interference | Compare linked source/history conditions; no universal winner declared | Preserve and test |

## Provisional build default

Begin with common contracts so all three can run as comparison arms. Reuse an already working runtime for the baseline; it does not decide the winner.

## Decision and reopening rule

Prefer a branch per task family only after retained quality, loading cost, and active memory are measured.

## Discriminating experiment

[Compare generalists, independent specialists, adapters and hybrids](../40_Experiments/E03_Expert_Architecture_Comparison.md)

## Research paths

[Independent specialists](../10_Research/T02_Specialists/P05_Independent_specialists.md) · [Shared backbone and adapters](../10_Research/T02_Specialists/P06_Shared_backbone_and_adapters.md)

## Evidence update record

- **2026-11-20:** alternatives registered; prototype default proposed.
- **Result required:** exact run, configuration, comparison, uncertainty, and supported scope.
- **Next revision:** append the change and rationale; preserve the previous decision.

[Open design decisions](../05_Open_Decisions.md) · [Evidence, disagreements, and research state](../04_Evidence_and_Disagreement.md)
