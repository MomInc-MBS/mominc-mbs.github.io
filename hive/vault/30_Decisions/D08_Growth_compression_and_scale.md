---
id: "D08"
title: "Growth, compression, and scale"
type: "decision"
status: "open_with_provisional_default"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/decision
---

# Growth, compression, and scale

## Decision question

Growth, compression, and scale?

## Alternatives retained

| Alternative | Evidence state | Action |
|---|---|---|
| Expand until a declared cap | Compare linked source/history conditions; no universal winner declared | Preserve and test |
| Compress or merge at the cap | Compare linked source/history conditions; no universal winner declared | Preserve and test |
| Archive and retrieve | Compare linked source/history conditions; no universal winner declared | Preserve and test |
| Hybrid | Compare linked source/history conditions; no universal winner declared | Preserve and test |

## Provisional build default

Maintain distinct registered, resident, active, and trainable counts. Record peak and lifetime storage, including rollback copies.

## Decision and reopening rule

No numerical expert cap is architecture law. Retain 100/1000/10000 registry experiments and discover actual concurrency empirically.

## Discriminating experiment

[Scale 100, 1,000 and 10,000 logical experts with measured active workers](../40_Experiments/E10_Logical_Expert_Registry_Scaling.md)

## Research paths

[Logical expert scale](../10_Research/T07_Resources/P22_Logical_expert_scale.md) · [Admission and residency](../10_Research/T07_Resources/P23_Admission_and_residency.md)

## Evidence update record

- **2026-11-20:** alternatives registered; prototype default proposed.
- **Result required:** exact run, configuration, comparison, uncertainty, and supported scope.
- **Next revision:** append the change and rationale; preserve the previous decision.

[Open design decisions](../05_Open_Decisions.md) · [Evidence, disagreements, and research state](../04_Evidence_and_Disagreement.md)
