---
id: "D05"
title: "Central or distributed control"
type: "decision"
status: "open_with_provisional_default"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/decision
---

# Central or distributed control

## Decision question

Central or distributed control?

## Alternatives retained

| Alternative | Evidence state | Action |
|---|---|---|
| Deterministic central scheduler | Compare linked source/history conditions; no universal winner declared | Preserve and test |
| Hierarchical communities | Compare linked source/history conditions; no universal winner declared | Preserve and test |
| Decentralized recruitment | Compare linked source/history conditions; no universal winner declared | Preserve and test |

## Provisional build default

Keep the control contract stable and allow approved direct data transfers; compare topology independently of activation policy.

## Decision and reopening rule

Adopt additional hierarchy only when measured coordination, ownership, or fault behavior justifies it.

## Discriminating experiment

[Scale 100, 1,000 and 10,000 logical experts with measured active workers](../40_Experiments/E10_Logical_Expert_Registry_Scaling.md)

## Research paths

[Controller and routing](../10_Research/T03_Coordination/P09_Controller_and_routing.md) · [Communities and local recruitment](../10_Research/T03_Coordination/P10_Communities_and_local_recruitment.md)

## Evidence update record

- **2026-11-20:** alternatives registered; prototype default proposed.
- **Result required:** exact run, configuration, comparison, uncertainty, and supported scope.
- **Next revision:** append the change and rationale; preserve the previous decision.

[Open design decisions](../05_Open_Decisions.md) · [Evidence, disagreements, and research state](../04_Evidence_and_Disagreement.md)
