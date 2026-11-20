---
id: "D11"
title: "What constitutes verification"
type: "decision"
status: "open_with_provisional_default"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/decision
---

# What constitutes verification

## Decision question

What constitutes verification?

## Alternatives retained

| Alternative | Evidence state | Action |
|---|---|---|
| Executable or measured evidence | Compare linked source/history conditions; no universal winner declared | Preserve and test |
| Source-backed review | Compare linked source/history conditions; no universal winner declared | Preserve and test |
| Calibrated model checking | Compare linked source/history conditions; no universal winner declared | Preserve and test |
| Layered combination | Compare linked source/history conditions; no universal winner declared | Preserve and test |

## Provisional build default

Attach a checker and its limits to each task. Use several mechanisms when they catch different failures.

## Decision and reopening rule

Do not treat model agreement, valid JSON, or source count as proof. Preserve false rejections as well as false acceptances.

## Discriminating experiment

[Test whether dreaming adds value beyond verified replay](../40_Experiments/E05_Dreaming_vs_Replay.md)

## Research paths

[Executable verification](../10_Research/T06_Verification/P19_Executable_verification.md) · [Critics and calibrated uncertainty](../10_Research/T06_Verification/P20_Critics_and_calibrated_uncertainty.md)

## Evidence update record

- **2026-11-20:** alternatives registered; prototype default proposed.
- **Result required:** exact run, configuration, comparison, uncertainty, and supported scope.
- **Next revision:** append the change and rationale; preserve the previous decision.

[Open design decisions](../05_Open_Decisions.md) · [Evidence, disagreements, and research state](../04_Evidence_and_Disagreement.md)
