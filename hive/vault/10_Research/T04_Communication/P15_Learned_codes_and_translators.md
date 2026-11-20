---
id: "P15"
title: "Learned codes and translators"
type: "research_path"
status: "proposed"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/research_path
---

# Learned codes and translators

**Parent topic:** [Representations and communication](T04_Communication.md)  
**Status:** research path; implementation and outcomes remain to be tested.

## Question

Can learned communication improve efficiency without breaking compatibility?

## Retained branches

| Branch | Candidate mechanism | Current status |
|---|---|---|
| P15.A | Explicit domain representation | Retained for comparison |
| P15.B | Aligned representation with a trained bridge | Retained for comparison |
| P15.C | Private learned protocol in a bounded joint task | Retained for comparison |

## Prototype to build

Give every representation and translator a version. Train bridges using paired data; test new combinations and encoder changes. Maintain a readable diagnostic view.

## Measurement and failure condition

Measure downstream correctness after drift and participant replacement, not only reconstruction error. Keep private codes separate from authorization boundaries.

## Adjacent research avenues

Emergent communication; representation alignment; protocol learning.

Create a new path when one of these changes the mechanism or test; otherwise link new evidence here.

## Experiments and decisions

[Compare typed messages, precise prose and learned representations](../../40_Experiments/E07_Communication_Representations.md)  
[Language or native representation](../../30_Decisions/D06_Language_or_native_representation.md) · [How far self-improvement may reach](../../30_Decisions/D09_How_far_self_improvement_may_reach.md)

## Previous methods

[Representation precision and communication cost](../../51_Prior_Methods/H05-Representation-Precision.md) · [Private representations and translator drift](../../51_Prior_Methods/H06-Translator-Drift.md) · [Typed messages, authority, and semantic errors](../../51_Prior_Methods/H07-Message-Boundaries.md)

## Biological or physical inspiration

[Domain signals and learned communication codes](../../20_Metaphors/M11-communication-codes.md)

## Sources to start from

Use the primary sources on the linked history and metaphor pages; add task-specific evidence before making a performance claim.

## Continue through the graph

[Topic-based research-agent workflow](../../70_Local_Build/B05_Research_Agent_Workflow.md) · [Evidence, disagreements, and research state](../../04_Evidence_and_Disagreement.md) · [Topic-first research map](../../03_Research_Map.md)

## Cross-topic connection

[Shared backbone and adapters](../T02_Specialists/P06_Shared_backbone_and_adapters.md)
