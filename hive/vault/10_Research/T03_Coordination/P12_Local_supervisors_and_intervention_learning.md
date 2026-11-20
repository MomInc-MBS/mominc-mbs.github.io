---
id: "P12"
title: "Local supervisors and intervention learning"
type: "research_path"
status: "proposed"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/research_path
---

# Local supervisors and intervention learning

**Parent topic:** [Coordination and supervision](T03_Coordination.md)  
**Status:** research path; implementation and outcomes remain to be tested.

## Question

How does a repeated human fix become a dependable local capability?

## Retained branches

| Branch | Candidate mechanism | Current status |
|---|---|---|
| P12.A | Deterministic watchdog and recovery rule | Retained for comparison |
| P12.B | Small learned failure classifier | Retained for comparison |
| P12.C | General planner handling every incident | Retained for comparison |

## Prototype to build

Turn a corrected stall into a failure signature, a bounded repair, a replay test, and an escalation condition. The supervisor observes tool health without using the main planner's context for every heartbeat.

## Measurement and failure condition

Measure recovery time, false interventions, repeated incidents, and human interventions per completed task. Preserve failed repairs as result records.

## Adjacent research avenues

Reflex control; supervisory control; fault diagnosis; reliability engineering.

Create a new path when one of these changes the mechanism or test; otherwise link new evidence here.

## Experiments and decisions

[Measure the actual computer and concurrent workload](../../40_Experiments/E02_Hardware_Workload_Baseline.md) · [Compare whole-system and per-specialist sleep during real service](../../40_Experiments/E09_Sleep_Scheduling_With_Live_Workloads.md)  
[Central or distributed control](../../30_Decisions/D05_Central_or_distributed_control.md) · [How far self-improvement may reach](../../30_Decisions/D09_How_far_self_improvement_may_reach.md)

## Previous methods

[Scheduling, selective activation, and graph topology](../../51_Prior_Methods/H04-Scheduling-and-Graphs.md) · [SOL, Grok, and Nemotron implementation workflow](../../51_Prior_Methods/H09-SOL-Coding-Handoff.md)

## Biological or physical inspiration

[Ant task allocation across timescales](../../20_Metaphors/M04-ant-task-allocation.md) · [Fungal transport and Physarum network design](../../20_Metaphors/M05-adaptive-transport-graphs.md) · [Dedicated reflexes and operational supervision](../../20_Metaphors/M06-reflex-supervision.md)

## Sources to start from

Use the primary sources on the linked history and metaphor pages; add task-specific evidence before making a performance claim.

## Continue through the graph

[Topic-based research-agent workflow](../../70_Local_Build/B05_Research_Agent_Workflow.md) · [Evidence, disagreements, and research state](../../04_Evidence_and_Disagreement.md) · [Topic-first research map](../../03_Research_Map.md)

## Cross-topic connection

[Live calls and supervisor streaming](../T09_Applications/P29_Live_calls_and_supervisor_streaming.md)
