---
id: "P16"
title: "Memory compartments and promotion"
type: "research_path"
status: "proposed"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/research_path
---

# Memory compartments and promotion

**Parent topic:** [Memory, evidence, and knowledge graphs](T05_Memory.md)  
**Status:** research path; implementation and outcomes remain to be tested.

## Question

What belongs in immediate, episodic, semantic, procedural, and parametric memory?

## Retained branches

| Branch | Candidate mechanism | Current status |
|---|---|---|
| P16.A | One retrieval store with typed records | Retained for comparison |
| P16.B | Separate stores by ownership and timescale | Retained for comparison |
| P16.C | Hybrid store with explicit promotion rules | Retained for comparison |

## Prototype to build

Define who may write each record type. Promote checked observations into stable knowledge; promote repeatable procedures into executable skills; train parameters only through a tracked experiment.

## Measurement and failure condition

Test retrieval contamination, conflicting dates, rare-case recall, and persistence. Count all indexes and retained rollback artifacts.

## Adjacent research avenues

Database normalization; complementary memory; lifecycle management.

Create a new path when one of these changes the mechanism or test; otherwise link new evidence here.

## Experiments and decisions

[Test bounded memory, correction, retention and removal](../../40_Experiments/E08_Bounded_Growth_Corrections_Unlearning.md)  
[Where learning should persist](../../30_Decisions/D02_Where_learning_should_persist.md) · [Knowledge and runtime storage](../../30_Decisions/D10_Knowledge_and_runtime_storage.md)

## Previous methods

[Prior HIVE corpus and evidence lineage](../../51_Prior_Methods/H01-Corpus-Lineage.md) · [Earlier architecture choices and open alternatives](../../51_Prior_Methods/H08-Architecture-Proposals.md)

## Biological or physical inspiration

[Sleep replay and consolidation](../../20_Metaphors/M01-sleep-replay.md) · [Immune discrimination and memory admission](../../20_Metaphors/M03-immune-admission.md)

## Sources to start from

[Titans + MIRAS: Helping AI have long-term memory](../../60_Sources/S04_Titans_MIRAS_Helping_AI_have_long_term_memory.md)

## Continue through the graph

[Topic-based research-agent workflow](../../70_Local_Build/B05_Research_Agent_Workflow.md) · [Evidence, disagreements, and research state](../../04_Evidence_and_Disagreement.md) · [Topic-first research map](../../03_Research_Map.md)

## Cross-topic connection

[Learning and intentional forgetting](../T01_Learning/P04_Learning_and_intentional_forgetting.md)
