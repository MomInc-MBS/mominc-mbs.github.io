---
id: "P21"
title: "Contamination and boundaries"
type: "research_path"
status: "proposed"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/research_path
---

# Contamination and boundaries

**Parent topic:** [Verification and contamination](T06_Verification.md)  
**Status:** research path; implementation and outcomes remain to be tested.

## Question

Which failures spread through memory, protocols, or training?

## Retained branches

| Branch | Candidate mechanism | Current status |
|---|---|---|
| P21.A | Scoped writes and typed boundaries | Retained for comparison |
| P21.B | Learned anomaly detection | Retained for comparison |
| P21.C | Quarantine and later admission | Retained for comparison |

## Prototype to build

Distinguish false facts, wrong units, unauthorized writes, stale representations, and harmful training examples. Create targeted fault injections for each.

## Measurement and failure condition

Measure containment and legitimate information flow. Private terminology must not be credited with enforcing permissions.

## Adjacent research avenues

Immune-inspired detection; capability systems; fault isolation.

Create a new path when one of these changes the mechanism or test; otherwise link new evidence here.

## Experiments and decisions

[Compare typed messages, precise prose and learned representations](../../40_Experiments/E07_Communication_Representations.md) · [Test bounded memory, correction, retention and removal](../../40_Experiments/E08_Bounded_Growth_Corrections_Unlearning.md)  
[Language or native representation](../../30_Decisions/D06_Language_or_native_representation.md) · [What constitutes verification](../../30_Decisions/D11_What_constitutes_verification.md)

## Previous methods

[Typed messages, authority, and semantic errors](../../51_Prior_Methods/H07-Message-Boundaries.md) · [Inherited assumptions and disputed conclusions](../../51_Prior_Methods/H11-Inherited-Claims-to-Recheck.md)

## Biological or physical inspiration

[Immune discrimination and memory admission](../../20_Metaphors/M03-immune-admission.md)

## Sources to start from

Use the primary sources on the linked history and metaphor pages; add task-specific evidence before making a performance claim.

## Continue through the graph

[Topic-based research-agent workflow](../../70_Local_Build/B05_Research_Agent_Workflow.md) · [Evidence, disagreements, and research state](../../04_Evidence_and_Disagreement.md) · [Topic-first research map](../../03_Research_Map.md)

## Cross-topic connection

[Typed channels](../T04_Communication/P13_Typed_channels.md)
