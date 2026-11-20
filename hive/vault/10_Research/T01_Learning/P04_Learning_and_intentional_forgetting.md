---
id: "P04"
title: "Learning and intentional forgetting"
type: "research_path"
status: "proposed"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/research_path
---

# Learning and intentional forgetting

**Parent topic:** [Learning lifecycle](T01_Learning.md)  
**Status:** research path; implementation and outcomes remain to be tested.

## Question

Can HIVE acquire a correction while retaining unrelated skills?

## Retained branches

| Branch | Candidate mechanism | Current status |
|---|---|---|
| P04.A | Retrieval edits with versioned facts | Retained for comparison |
| P04.B | Adapter or head updates | Retained for comparison |
| P04.C | Independent parameter updates with replay | Retained for comparison |
| P04.D | Targeted unlearning as a separate problem | Retained for comparison |

## Prototype to build

Use a dated rule A, an unrelated task B, then a replacement rule A-prime. Ask both current-state and historical-state questions. Separate deleting a note from changing learned behavior.

## Measurement and failure condition

Measure correction uptake, old-task accuracy, false resurrection of outdated rules, and storage. Do not equate retention with treating every old fact as current.

## Adjacent research avenues

Concept drift; truth maintenance; machine unlearning; temporal databases.

Create a new path when one of these changes the mechanism or test; otherwise link new evidence here.

## Experiments and decisions

[Test bounded memory, correction, retention and removal](../../40_Experiments/E08_Bounded_Growth_Corrections_Unlearning.md)  
[Where learning should persist](../../30_Decisions/D02_Where_learning_should_persist.md) · [How far self-improvement may reach](../../30_Decisions/D09_How_far_self_improvement_may_reach.md)

## Previous methods

[Replay ordering and the reopened sleep branch](../../51_Prior_Methods/H03-Replay-and-Sleep.md) · [Earlier architecture choices and open alternatives](../../51_Prior_Methods/H08-Architecture-Proposals.md)

## Biological or physical inspiration

[Sleep replay and consolidation](../../20_Metaphors/M01-sleep-replay.md) · [Selective downscaling and capacity recovery](../../20_Metaphors/M02-sleep-scaling.md) · [Sleep clearance: preserve a live disagreement](../../20_Metaphors/M12-clearance-disagreement.md)

## Sources to start from

[Sleep-time Compute: Beyond Inference Scaling at Test-time](../../60_Sources/S05_Sleep_time_Compute_Beyond_Inference_Scaling_at_Test_time.md) · [Self-Adapting Language Models](../../60_Sources/S06_Self_Adapting_Language_Models.md)

## Continue through the graph

[Topic-based research-agent workflow](../../70_Local_Build/B05_Research_Agent_Workflow.md) · [Evidence, disagreements, and research state](../../04_Evidence_and_Disagreement.md) · [Topic-first research map](../../03_Research_Map.md)

## Cross-topic connection

[Memory compartments and promotion](../T05_Memory/P16_Memory_compartments_and_promotion.md)
