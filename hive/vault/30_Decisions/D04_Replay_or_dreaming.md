---
id: "D04"
title: "Replay or dreaming"
type: "decision"
status: "open_with_provisional_default"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/decision
---

# Replay or dreaming

## Decision question

Replay or dreaming?

## Alternatives retained

| Alternative | Evidence state | Action |
|---|---|---|
| Verified real replay | Compare linked source/history conditions; no universal winner declared | Preserve and test |
| Random synthetic replay | Compare linked source/history conditions; no universal winner declared | Preserve and test |
| Filtered novel combinations | Compare linked source/history conditions; no universal winner declared | Preserve and test |

## Provisional build default

Establish verified replay first and implement dream generation as a separately budgeted candidate.

## Decision and reopening rule

Retain the dream branch even after a failed run; change its priority only with the task, checker, and implementation conditions attached.

## Discriminating experiment

[Test whether dreaming adds value beyond verified replay](../40_Experiments/E05_Dreaming_vs_Replay.md)

## Research paths

[Dreaming and curriculum](../10_Research/T01_Learning/P03_Dreaming_and_curriculum.md) · [Executable verification](../10_Research/T06_Verification/P19_Executable_verification.md)

## Evidence update record

- **2026-11-20:** alternatives registered; prototype default proposed.
- **Result required:** exact run, configuration, comparison, uncertainty, and supported scope.
- **Next revision:** append the change and rationale; preserve the previous decision.

[Open design decisions](../05_Open_Decisions.md) · [Evidence, disagreements, and research state](../04_Evidence_and_Disagreement.md)
