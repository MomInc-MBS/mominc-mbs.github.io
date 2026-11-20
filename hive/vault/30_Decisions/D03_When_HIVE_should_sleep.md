---
id: "D03"
title: "When HIVE should sleep"
type: "decision"
status: "open_with_provisional_default"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/decision
---

# When HIVE should sleep

## Decision question

When HIVE should sleep?

## Alternatives retained

| Alternative | Evidence state | Action |
|---|---|---|
| Whole-system maintenance | Compare linked source/history conditions; no universal winner declared | Preserve and test |
| Staggered specialist consolidation | Compare linked source/history conditions; no universal winner declared | Preserve and test |
| Continuous or idle-only updates | Compare linked source/history conditions; no universal winner declared | Preserve and test |

## Provisional build default

Use workload-triggered maintenance in the first candidate; retain scheduled and continuous arms for comparison.

## Decision and reopening rule

Reopen when foreground workloads, loading time, or training demand change. No fixed biological clock is imposed.

## Discriminating experiment

[Compare whole-system and per-specialist sleep during real service](../40_Experiments/E09_Sleep_Scheduling_With_Live_Workloads.md)

## Research paths

[Sleep consolidation](../10_Research/T01_Learning/P02_Sleep_consolidation.md) · [Sleep without interrupting service](../10_Research/T07_Resources/P24_Sleep_without_interrupting_service.md)

## Evidence update record

- **2026-11-20:** alternatives registered; prototype default proposed.
- **Result required:** exact run, configuration, comparison, uncertainty, and supported scope.
- **Next revision:** append the change and rationale; preserve the previous decision.

[Open design decisions](../05_Open_Decisions.md) · [Evidence, disagreements, and research state](../04_Evidence_and_Disagreement.md)
