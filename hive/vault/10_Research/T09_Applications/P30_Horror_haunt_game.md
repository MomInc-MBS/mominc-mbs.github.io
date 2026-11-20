---
id: "P30"
title: "Horror haunt game"
type: "research_path"
status: "proposed"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/research_path
---

# Horror haunt game

**Parent topic:** [Daily application laboratories](T09_Applications.md)  
**Status:** research path; implementation and outcomes remain to be tested.

## Question

Can modular perception, state, planning, and recovery improve a repeatable encounter?

## Retained branches

| Branch | Candidate mechanism | Current status |
|---|---|---|
| P30.A | Scripted director baseline | Retained for comparison |
| P30.B | Specialist planner over a verified scene state | Retained for comparison |
| P30.C | Predictive director with candidate actions | Retained for comparison |

## Prototype to build

Reuse mapping and encounter handoffs. Provide recorded or simulated rooms before live integration. Track units, coordinate frames, occlusion, confidence, and state transitions.

## Measurement and failure condition

Measure spatial correctness, encounter completion, prediction error, latency, and recovery after stale maps or failed tools. Keep phone measurements separate from desktop simulation.

## Adjacent research avenues

Scene graphs; robotics planning; active perception; procedural scenarios.

Create a new path when one of these changes the mechanism or test; otherwise link new evidence here.

## Experiments and decisions

[Measure the actual computer and concurrent workload](../../40_Experiments/E02_Hardware_Workload_Baseline.md) · [Compare generalists, independent specialists, adapters and hybrids](../../40_Experiments/E03_Expert_Architecture_Comparison.md) · [Compare typed messages, precise prose and learned representations](../../40_Experiments/E07_Communication_Representations.md)  
[Independent models or shared components](../../30_Decisions/D01_Independent_models_or_shared_components.md) · [Language or native representation](../../30_Decisions/D06_Language_or_native_representation.md)

## Previous methods

[Video, studio interaction, and horror testbeds](../../51_Prior_Methods/H10-Application-Testbeds.md) · [SOL, Grok, and Nemotron implementation workflow](../../51_Prior_Methods/H09-SOL-Coding-Handoff.md)

## Biological or physical inspiration

[Dedicated reflexes and operational supervision](../../20_Metaphors/M06-reflex-supervision.md) · [Falling, balance, and predictive recovery](../../20_Metaphors/M08-internal-model-recovery.md)

## Sources to start from

Use the primary sources on the linked history and metaphor pages; add task-specific evidence before making a performance claim.

## Continue through the graph

[Topic-based research-agent workflow](../../70_Local_Build/B05_Research_Agent_Workflow.md) · [Evidence, disagreements, and research state](../../04_Evidence_and_Disagreement.md) · [Topic-first research map](../../03_Research_Map.md)

## Cross-topic connection

[Deterministic and nonlanguage experts](../T02_Specialists/P08_Deterministic_and_nonlanguage_experts.md)

## Cross-topic connection

[State estimation and world models](../T08_Prediction/P25_State_estimation_and_world_models.md)
