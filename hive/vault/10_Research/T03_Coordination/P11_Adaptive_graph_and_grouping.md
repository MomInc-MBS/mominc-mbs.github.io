---
id: "P11"
title: "Adaptive graph and grouping"
type: "research_path"
status: "proposed"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/research_path
---

# Adaptive graph and grouping

**Parent topic:** [Coordination and supervision](T03_Coordination.md)  
**Status:** research path; implementation and outcomes remain to be tested.

## Question

Should HIVE change connections and specialist boundaries?

## Retained branches

| Branch | Candidate mechanism | Current status |
|---|---|---|
| P11.A | Fixed graph with learned routing | Retained for comparison |
| P11.B | Traffic-driven graph changes | Retained for comparison |
| P11.C | Interference- and outcome-driven regrouping | Retained for comparison |

## Prototype to build

Propose topology changes from measured transfer and traffic. Evaluate a candidate graph against a frozen task trace; version its configuration separately from model weights.

## Measurement and failure condition

Require gains on held-out compositions and include graph maintenance costs. High traffic alone cannot establish that a route is useful or true.

## Adjacent research avenues

Fungal transport; community detection; causal modularity; graph optimization.

Create a new path when one of these changes the mechanism or test; otherwise link new evidence here.

## Experiments and decisions

[Use measured interference to test regrouping and routing](../../40_Experiments/E06_Interference_Driven_Regrouping.md) · [Scale 100, 1,000 and 10,000 logical experts with measured active workers](../../40_Experiments/E10_Logical_Expert_Registry_Scaling.md)  
[Central or distributed control](../../30_Decisions/D05_Central_or_distributed_control.md) · [How specialists should be grouped](../../30_Decisions/D07_How_specialists_should_be_grouped.md)

## Previous methods

[Scheduling, selective activation, and graph topology](../../51_Prior_Methods/H04-Scheduling-and-Graphs.md) · [SOL, Grok, and Nemotron implementation workflow](../../51_Prior_Methods/H09-SOL-Coding-Handoff.md)

## Biological or physical inspiration

[Ant task allocation across timescales](../../20_Metaphors/M04-ant-task-allocation.md) · [Fungal transport and Physarum network design](../../20_Metaphors/M05-adaptive-transport-graphs.md) · [Dedicated reflexes and operational supervision](../../20_Metaphors/M06-reflex-supervision.md)

## Sources to start from

Use the primary sources on the linked history and metaphor pages; add task-specific evidence before making a performance claim.

## Continue through the graph

[Topic-based research-agent workflow](../../70_Local_Build/B05_Research_Agent_Workflow.md) · [Evidence, disagreements, and research state](../../04_Evidence_and_Disagreement.md) · [Topic-first research map](../../03_Research_Map.md)

## Cross-topic connection

[Independent specialists](../T02_Specialists/P05_Independent_specialists.md)
