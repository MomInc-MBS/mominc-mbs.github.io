---
id: "P20"
title: "Critics and calibrated uncertainty"
type: "research_path"
status: "proposed"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/research_path
---

# Critics and calibrated uncertainty

**Parent topic:** [Verification and contamination](T06_Verification.md)  
**Status:** research path; implementation and outcomes remain to be tested.

## Question

When does another model add useful checking?

## Retained branches

| Branch | Candidate mechanism | Current status |
|---|---|---|
| P20.A | Same-family critic | Retained for comparison |
| P20.B | Different mechanism or evidence source | Retained for comparison |
| P20.C | Deterministic checker plus targeted escalation | Retained for comparison |

## Prototype to build

Measure agreement separately from correctness. Use held-out known-answer tasks to calibrate abstention. Log checker cost and shared dependencies.

## Measurement and failure condition

Correlated errors that survive both workers defeat a consensus-only design. Compare against spending the same budget on one better answer or external verification.

## Adjacent research avenues

Ensembles; calibration; selective prediction; common-mode failures.

Create a new path when one of these changes the mechanism or test; otherwise link new evidence here.

## Experiments and decisions

[Compare generalists, independent specialists, adapters and hybrids](../../40_Experiments/E03_Expert_Architecture_Comparison.md) · [Test whether dreaming adds value beyond verified replay](../../40_Experiments/E05_Dreaming_vs_Replay.md)  
[What constitutes verification](../../30_Decisions/D11_What_constitutes_verification.md)

## Previous methods

[Typed messages, authority, and semantic errors](../../51_Prior_Methods/H07-Message-Boundaries.md) · [Inherited assumptions and disputed conclusions](../../51_Prior_Methods/H11-Inherited-Claims-to-Recheck.md)

## Biological or physical inspiration

[Immune discrimination and memory admission](../../20_Metaphors/M03-immune-admission.md)

## Sources to start from

Use the primary sources on the linked history and metaphor pages; add task-specific evidence before making a performance claim.

## Continue through the graph

[Topic-based research-agent workflow](../../70_Local_Build/B05_Research_Agent_Workflow.md) · [Evidence, disagreements, and research state](../../04_Evidence_and_Disagreement.md) · [Topic-first research map](../../03_Research_Map.md)

## Cross-topic connection

[Dreaming and curriculum](../T01_Learning/P03_Dreaming_and_curriculum.md)

## Cross-topic connection

[Controller and routing](../T03_Coordination/P09_Controller_and_routing.md)
