---
id: "P02"
title: "Sleep consolidation"
type: "research_path"
status: "proposed"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/research_path
---

# Sleep consolidation

**Parent topic:** [Learning lifecycle](T01_Learning.md)  
**Status:** research path; implementation and outcomes remain to be tested.

## Question

Does offline consolidation create retained capability beyond equal-cost replay?

## Retained branches

| Branch | Candidate mechanism | Current status |
|---|---|---|
| P02.A | Interleaved verified replay | Retained for comparison |
| P02.B | Blocked replay with the same examples | Retained for comparison |
| P02.C | Expansion plus distillation, with dreaming evaluated separately | Retained for comparison |

## Prototype to build

Implement a candidate-only consolidation worker. Snapshot the serving version, train or compact a candidate, evaluate retention, then publish a version manifest if it passes. Keep the old artifact available.

## Measurement and failure condition

Measure both fixed-budget outcomes and growth-versus-quality curves. A failed blocked-replay result applies to that schedule; it cannot decide the expansion/distillation hypothesis.

## Adjacent research avenues

Complementary learning systems; compression; elastic capacity; optimizer timescales.

Create a new path when one of these changes the mechanism or test; otherwise link new evidence here.

## Experiments and decisions

[Test sleep, replay order, expansion and distillation independently](../../40_Experiments/E04_Sleep_Factorial.md) · [Test bounded memory, correction, retention and removal](../../40_Experiments/E08_Bounded_Growth_Corrections_Unlearning.md)  
[Where learning should persist](../../30_Decisions/D02_Where_learning_should_persist.md) · [When HIVE should sleep](../../30_Decisions/D03_When_HIVE_should_sleep.md) · [Growth, compression, and scale](../../30_Decisions/D08_Growth_compression_and_scale.md)

## Previous methods

[Replay ordering and the reopened sleep branch](../../51_Prior_Methods/H03-Replay-and-Sleep.md) · [Earlier architecture choices and open alternatives](../../51_Prior_Methods/H08-Architecture-Proposals.md)

## Biological or physical inspiration

[Sleep replay and consolidation](../../20_Metaphors/M01-sleep-replay.md) · [Selective downscaling and capacity recovery](../../20_Metaphors/M02-sleep-scaling.md) · [Sleep clearance: preserve a live disagreement](../../20_Metaphors/M12-clearance-disagreement.md)

## Sources to start from

[The sleep framework: A new way for LLMs to retain knowledge in continual learning](../../60_Sources/S01_The_sleep_framework_A_new_way_for_LLMs_to_retain_knowledge_in_continual_learning.md) · [Language Models Need Sleep: Learning to Self-Modify and Consolidate Memories](../../60_Sources/S02_Language_Models_Need_Sleep_Learning_to_Self_Modify_and_Consolidate_Memories.md) · [Introducing Nested Learning: A new ML paradigm for continual learning](../../60_Sources/S03_Introducing_Nested_Learning_A_new_ML_paradigm_for_continual_learning.md) · [Independent implementation: everrete/llm-sleep](../../60_Sources/S07_Independent_implementation_everrete_llm_sleep.md) · [Do Language Models Need Sleep? Offline Recurrence for Improved Online Inference](../../60_Sources/S08_Do_Language_Models_Need_Sleep_Offline_Recurrence_for_Improved_Online_Inference.md)

## Continue through the graph

[Topic-based research-agent workflow](../../70_Local_Build/B05_Research_Agent_Workflow.md) · [Evidence, disagreements, and research state](../../04_Evidence_and_Disagreement.md) · [Topic-first research map](../../03_Research_Map.md)

## Cross-topic connection

[Sleep without interrupting service](../T07_Resources/P24_Sleep_without_interrupting_service.md)
