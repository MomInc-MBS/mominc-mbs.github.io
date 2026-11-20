---
id: "D10"
title: "Knowledge and runtime storage"
type: "decision"
status: "open_with_provisional_default"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/decision
---

# Knowledge and runtime storage

## Decision question

Knowledge and runtime storage?

## Alternatives retained

| Alternative | Evidence state | Action |
|---|---|---|
| Obsidian notes with an explicit edge ledger | Compare linked source/history conditions; no universal winner declared | Preserve and test |
| Graphify-derived retrieval index | Compare linked source/history conditions; no universal winner declared | Preserve and test |
| Later graph/database adapters | Compare linked source/history conditions; no universal winner declared | Preserve and test |

## Provisional build default

Keep authored research in Markdown, execution records in a local event store, and derived graphs rebuildable. Use existing Studio Brain through an adapter after local checks.

## Decision and reopening rule

Change storage technology when a measured query or workload requires it; graph visual proximity is not evidence.

## Discriminating experiment

[Reproduce prior simulations and separate estimates from measurements](../40_Experiments/E01_Reproduce_Prior_Work.md)

## Research paths

[Obsidian and Graphify](../10_Research/T05_Memory/P18_Obsidian_and_Graphify.md) · [Memory compartments and promotion](../10_Research/T05_Memory/P16_Memory_compartments_and_promotion.md)

## Evidence update record

- **2026-11-20:** alternatives registered; prototype default proposed.
- **Result required:** exact run, configuration, comparison, uncertainty, and supported scope.
- **Next revision:** append the change and rationale; preserve the previous decision.

[Open design decisions](../05_Open_Decisions.md) · [Evidence, disagreements, and research state](../04_Evidence_and_Disagreement.md)
