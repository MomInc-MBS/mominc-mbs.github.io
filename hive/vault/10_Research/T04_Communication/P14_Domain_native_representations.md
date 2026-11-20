---
id: "P14"
title: "Domain-native representations"
type: "research_path"
status: "proposed"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/research_path
---

# Domain-native representations

**Parent topic:** [Representations and communication](T04_Communication.md)  
**Status:** research path; implementation and outcomes remain to be tested.

## Question

Which representation preserves the information a downstream task needs?

## Retained branches

| Branch | Candidate mechanism | Current status |
|---|---|---|
| P14.A | Numerical geometry or scene graph | Retained for comparison |
| P14.B | Precise natural-language description | Retained for comparison |
| P14.C | Encoder features with a tested consumer | Retained for comparison |

## Prototype to build

Use audio features for timing, geometry for collision, and tool schemas for invocation where useful. Retain source artifacts and conversion versions so transformations can be checked.

## Measurement and failure condition

Compare quality, payload size, translation cost, and robustness near decision boundaries. Do not attribute losses from quantization to language itself.

## Adjacent research avenues

Information bottlenecks; signal processing; sufficient statistics.

Create a new path when one of these changes the mechanism or test; otherwise link new evidence here.

## Experiments and decisions

[Compare typed messages, precise prose and learned representations](../../40_Experiments/E07_Communication_Representations.md)  
[Language or native representation](../../30_Decisions/D06_Language_or_native_representation.md)

## Previous methods

[Representation precision and communication cost](../../51_Prior_Methods/H05-Representation-Precision.md) · [Private representations and translator drift](../../51_Prior_Methods/H06-Translator-Drift.md) · [Typed messages, authority, and semantic errors](../../51_Prior_Methods/H07-Message-Boundaries.md)

## Biological or physical inspiration

[Domain signals and learned communication codes](../../20_Metaphors/M11-communication-codes.md)

## Sources to start from

Use the primary sources on the linked history and metaphor pages; add task-specific evidence before making a performance claim.

## Continue through the graph

[Topic-based research-agent workflow](../../70_Local_Build/B05_Research_Agent_Workflow.md) · [Evidence, disagreements, and research state](../../04_Evidence_and_Disagreement.md) · [Topic-first research map](../../03_Research_Map.md)

## Cross-topic connection

[State estimation and world models](../T08_Prediction/P25_State_estimation_and_world_models.md)

## Cross-topic connection

[NCM and dynamical specialists](../T08_Prediction/P27_NCM_and_dynamical_specialists.md)
