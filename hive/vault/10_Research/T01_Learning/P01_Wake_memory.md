---
id: "P01"
title: "Wake memory"
type: "research_path"
status: "proposed"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/research_path
---

# Wake memory

**Parent topic:** [Learning lifecycle](T01_Learning.md)  
**Status:** research path; implementation and outcomes remain to be tested.

## Question

What should survive a task before any training happens?

## Retained branches

| Branch | Candidate mechanism | Current status |
|---|---|---|
| P01.A | Bounded chronological episodes with source pointers | Retained for comparison |
| P01.B | Retrieval summaries with recoverable originals | Retained for comparison |
| P01.C | Fast trainable memory in a separately measured branch | Retained for comparison |

## Prototype to build

Capture observations, tool outputs, corrections, and outcomes as events. Record the exact component version and whether a record is observed, inferred, or synthetic. Keep working state distinct from a durable claim.

## Measurement and failure condition

Test recall after restart and after distractor tasks. Reject a summary policy that loses correction dates or source identity despite saving bytes.

## Adjacent research avenues

Streaming databases; cache replacement; fast-weight associative memory.

Create a new path when one of these changes the mechanism or test; otherwise link new evidence here.

## Experiments and decisions

[Test bounded memory, correction, retention and removal](../../40_Experiments/E08_Bounded_Growth_Corrections_Unlearning.md)  
[Where learning should persist](../../30_Decisions/D02_Where_learning_should_persist.md)

## Previous methods

[Replay ordering and the reopened sleep branch](../../51_Prior_Methods/H03-Replay-and-Sleep.md) · [Earlier architecture choices and open alternatives](../../51_Prior_Methods/H08-Architecture-Proposals.md)

## Biological or physical inspiration

[Sleep replay and consolidation](../../20_Metaphors/M01-sleep-replay.md) · [Selective downscaling and capacity recovery](../../20_Metaphors/M02-sleep-scaling.md) · [Sleep clearance: preserve a live disagreement](../../20_Metaphors/M12-clearance-disagreement.md)

## Sources to start from

[Titans + MIRAS: Helping AI have long-term memory](../../60_Sources/S04_Titans_MIRAS_Helping_AI_have_long_term_memory.md)

## Continue through the graph

[Topic-based research-agent workflow](../../70_Local_Build/B05_Research_Agent_Workflow.md) · [Evidence, disagreements, and research state](../../04_Evidence_and_Disagreement.md) · [Topic-first research map](../../03_Research_Map.md)
