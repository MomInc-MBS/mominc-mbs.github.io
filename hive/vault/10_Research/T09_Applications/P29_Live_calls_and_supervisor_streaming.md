---
id: "P29"
title: "Live calls and supervisor streaming"
type: "research_path"
status: "proposed"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/research_path
---

# Live calls and supervisor streaming

**Parent topic:** [Daily application laboratories](T09_Applications.md)  
**Status:** research path; implementation and outcomes remain to be tested.

## Question

Can HIVE keep conversation responsive under the user's actual streaming load?

## Retained branches

| Branch | Candidate mechanism | Current status |
|---|---|---|
| P29.A | Measured existing speech chain | Retained for comparison |
| P29.B | Warm dedicated audio path with lightweight supervision | Retained for comparison |
| P29.C | Adaptive specialist selection outside the immediate audio loop | Retained for comparison |

## Prototype to build

Use recorded sessions first. Measure input timing, first useful response, silence, interruption recovery, and OBS frame performance. Keep slow research or training jobs under admission control.

## Measurement and failure condition

Report p50/p95 and failure cases, not just model tokens per second. Keep transcript/character memory separate from ground-truth observations.

## Adjacent research avenues

Turn-taking; audio scheduling; real-time systems; asynchronous planning.

Create a new path when one of these changes the mechanism or test; otherwise link new evidence here.

## Experiments and decisions

[Measure the actual computer and concurrent workload](../../40_Experiments/E02_Hardware_Workload_Baseline.md) · [Compare whole-system and per-specialist sleep during real service](../../40_Experiments/E09_Sleep_Scheduling_With_Live_Workloads.md)  
[When HIVE should sleep](../../30_Decisions/D03_When_HIVE_should_sleep.md) · [Central or distributed control](../../30_Decisions/D05_Central_or_distributed_control.md)

## Previous methods

[Video, studio interaction, and horror testbeds](../../51_Prior_Methods/H10-Application-Testbeds.md) · [SOL, Grok, and Nemotron implementation workflow](../../51_Prior_Methods/H09-SOL-Coding-Handoff.md)

## Biological or physical inspiration

[Dedicated reflexes and operational supervision](../../20_Metaphors/M06-reflex-supervision.md) · [Falling, balance, and predictive recovery](../../20_Metaphors/M08-internal-model-recovery.md)

## Sources to start from

Use the primary sources on the linked history and metaphor pages; add task-specific evidence before making a performance claim.

## Continue through the graph

[Topic-based research-agent workflow](../../70_Local_Build/B05_Research_Agent_Workflow.md) · [Evidence, disagreements, and research state](../../04_Evidence_and_Disagreement.md) · [Topic-first research map](../../03_Research_Map.md)

## Cross-topic connection

[Local supervisors and intervention learning](../T03_Coordination/P12_Local_supervisors_and_intervention_learning.md)

## Cross-topic connection

[Admission and residency](../T07_Resources/P23_Admission_and_residency.md)
