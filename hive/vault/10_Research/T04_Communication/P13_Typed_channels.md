---
id: "P13"
title: "Typed channels"
type: "research_path"
status: "proposed"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/research_path
---

# Typed channels

**Parent topic:** [Representations and communication](T04_Communication.md)  
**Status:** research path; implementation and outcomes remain to be tested.

## Question

Which errors can contracts prevent before a model interprets a payload?

## Retained branches

| Branch | Candidate mechanism | Current status |
|---|---|---|
| P13.A | Typed envelope with domain payload | Retained for comparison |
| P13.B | Precise bounded language in an envelope | Retained for comparison |
| P13.C | Strict formal representation where appropriate | Retained for comparison |

## Prototype to build

Retain Control, Task, Evidence, and Teaching channels. Include version, units, producer, timestamps, artifact hash, and permitted operation. Keep untrusted text in data fields.

## Measurement and failure condition

Inject unit, schema, namespace, and authority errors. Separately measure semantic errors that valid syntax cannot catch.

## Adjacent research avenues

Type systems; dimensional analysis; protocol evolution.

Create a new path when one of these changes the mechanism or test; otherwise link new evidence here.

## Experiments and decisions

[Compare typed messages, precise prose and learned representations](../../40_Experiments/E07_Communication_Representations.md)  
[Language or native representation](../../30_Decisions/D06_Language_or_native_representation.md) · [What constitutes verification](../../30_Decisions/D11_What_constitutes_verification.md)

## Previous methods

[Representation precision and communication cost](../../51_Prior_Methods/H05-Representation-Precision.md) · [Private representations and translator drift](../../51_Prior_Methods/H06-Translator-Drift.md) · [Typed messages, authority, and semantic errors](../../51_Prior_Methods/H07-Message-Boundaries.md)

## Biological or physical inspiration

[Domain signals and learned communication codes](../../20_Metaphors/M11-communication-codes.md)

## Sources to start from

Use the primary sources on the linked history and metaphor pages; add task-specific evidence before making a performance claim.

## Continue through the graph

[Topic-based research-agent workflow](../../70_Local_Build/B05_Research_Agent_Workflow.md) · [Evidence, disagreements, and research state](../../04_Evidence_and_Disagreement.md) · [Topic-first research map](../../03_Research_Map.md)

## Cross-topic connection

[Contamination and boundaries](../T06_Verification/P21_Contamination_and_boundaries.md)
