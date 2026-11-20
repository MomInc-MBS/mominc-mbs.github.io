---
id: "P09"
title: "Controller and routing"
type: "research_path"
status: "proposed"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/research_path
---

# Controller and routing

**Parent topic:** [Coordination and supervision](T03_Coordination.md)  
**Status:** research path; implementation and outcomes remain to be tested.

## Question

Which decisions require a learned controller?

## Retained branches

| Branch | Candidate mechanism | Current status |
|---|---|---|
| P09.A | Rules and calibrated classifier | Retained for comparison |
| P09.B | Pinned LAYA decision engine | Retained for comparison |
| P09.C | Small language-model planner | Retained for comparison |
| P09.D | Hybrid with a challenger only for uncertain cases | Retained for comparison |

## Prototype to build

Represent actions explicitly: select, compose, retry, cancel, request evidence, abstain, and escalate. Log the selected capability and alternatives considered without requiring private chain-of-thought.

## Measurement and failure condition

Measure routing accuracy, end-to-end success, false confidence, and controller overhead. Oracle routing is a diagnostic upper bound, not a production baseline.

## Adjacent research avenues

Contextual bandits; selective prediction; hierarchical control.

Create a new path when one of these changes the mechanism or test; otherwise link new evidence here.

## Experiments and decisions

[Compare generalists, independent specialists, adapters and hybrids](../../40_Experiments/E03_Expert_Architecture_Comparison.md) · [Use measured interference to test regrouping and routing](../../40_Experiments/E06_Interference_Driven_Regrouping.md)  
[Central or distributed control](../../30_Decisions/D05_Central_or_distributed_control.md) · [How specialists should be grouped](../../30_Decisions/D07_How_specialists_should_be_grouped.md)

## Previous methods

[Scheduling, selective activation, and graph topology](../../51_Prior_Methods/H04-Scheduling-and-Graphs.md) · [SOL, Grok, and Nemotron implementation workflow](../../51_Prior_Methods/H09-SOL-Coding-Handoff.md)

## Biological or physical inspiration

[Ant task allocation across timescales](../../20_Metaphors/M04-ant-task-allocation.md) · [Fungal transport and Physarum network design](../../20_Metaphors/M05-adaptive-transport-graphs.md) · [Dedicated reflexes and operational supervision](../../20_Metaphors/M06-reflex-supervision.md)

## Sources to start from

[LAYA decision engine](../../60_Sources/S14_LAYA_decision_engine.md)

## Continue through the graph

[Topic-based research-agent workflow](../../70_Local_Build/B05_Research_Agent_Workflow.md) · [Evidence, disagreements, and research state](../../04_Evidence_and_Disagreement.md) · [Topic-first research map](../../03_Research_Map.md)

## Cross-topic connection

[Critics and calibrated uncertainty](../T06_Verification/P20_Critics_and_calibrated_uncertainty.md)
