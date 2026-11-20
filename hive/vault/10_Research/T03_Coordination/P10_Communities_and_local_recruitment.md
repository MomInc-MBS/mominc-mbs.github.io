---
id: "P10"
title: "Communities and local recruitment"
type: "research_path"
status: "proposed"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/research_path
---

# Communities and local recruitment

**Parent topic:** [Coordination and supervision](T03_Coordination.md)  
**Status:** research path; implementation and outcomes remain to be tested.

## Question

Can local coordination reduce central monitoring?

## Retained branches

| Branch | Candidate mechanism | Current status |
|---|---|---|
| P10.A | Central task allocation | Retained for comparison |
| P10.B | Community managers with bounded recruitment | Retained for comparison |
| P10.C | Blackboard tasks claimed by eligible workers | Retained for comparison |

## Prototype to build

Keep one task identity, lease, deadline, cancellation state, and output owner. Let communities request work through the same budget service. Preserve a direct path for large numerical payloads.

## Measurement and failure condition

Inject bursts, worker loss, and a misleading popular route. Compare completion, duplicate work, starvation, and total messages.

## Adjacent research avenues

Ant task allocation; stigmergy; actor systems; distributed scheduling.

Create a new path when one of these changes the mechanism or test; otherwise link new evidence here.

## Experiments and decisions

[Scale 100, 1,000 and 10,000 logical experts with measured active workers](../../40_Experiments/E10_Logical_Expert_Registry_Scaling.md) · [Compare whole-system and per-specialist sleep during real service](../../40_Experiments/E09_Sleep_Scheduling_With_Live_Workloads.md)  
[Central or distributed control](../../30_Decisions/D05_Central_or_distributed_control.md)

## Previous methods

[Scheduling, selective activation, and graph topology](../../51_Prior_Methods/H04-Scheduling-and-Graphs.md) · [SOL, Grok, and Nemotron implementation workflow](../../51_Prior_Methods/H09-SOL-Coding-Handoff.md)

## Biological or physical inspiration

[Ant task allocation across timescales](../../20_Metaphors/M04-ant-task-allocation.md) · [Fungal transport and Physarum network design](../../20_Metaphors/M05-adaptive-transport-graphs.md) · [Dedicated reflexes and operational supervision](../../20_Metaphors/M06-reflex-supervision.md)

## Sources to start from

Use the primary sources on the linked history and metaphor pages; add task-specific evidence before making a performance claim.

## Continue through the graph

[Topic-based research-agent workflow](../../70_Local_Build/B05_Research_Agent_Workflow.md) · [Evidence, disagreements, and research state](../../04_Evidence_and_Disagreement.md) · [Topic-first research map](../../03_Research_Map.md)

## Cross-topic connection

[Logical expert scale](../T07_Resources/P22_Logical_expert_scale.md)
