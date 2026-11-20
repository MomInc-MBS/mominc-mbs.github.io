---
id: "P03"
title: "Dreaming and curriculum"
type: "research_path"
status: "proposed"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/research_path
---

# Dreaming and curriculum

**Parent topic:** [Learning lifecycle](T01_Learning.md)  
**Status:** research path; implementation and outcomes remain to be tested.

## Question

Can new combinations generate useful practice beyond recycling known examples?

## Retained branches

| Branch | Candidate mechanism | Current status |
|---|---|---|
| P03.A | Verified real replay | Retained for comparison |
| P03.B | Unfiltered synthetic practice as an experimental control | Retained for comparison |
| P03.C | Novel specialist combinations with independent filtering | Retained for comparison |

## Prototype to build

Generate candidate tasks from observed failures, boundary cases, and unusual capability combinations. Preserve generator, seed, checker, rejected samples, and selection cost. Start with executable tasks whose outcomes can be checked.

## Measurement and failure condition

Compare retained gains per total generation-and-training budget. If extra real examples match the gain more cheaply, prefer them for that workload while retaining the dream branch.

## Adjacent research avenues

Active learning; novelty search; curriculum learning; procedural generation.

Create a new path when one of these changes the mechanism or test; otherwise link new evidence here.

## Experiments and decisions

[Test whether dreaming adds value beyond verified replay](../../40_Experiments/E05_Dreaming_vs_Replay.md)  
[Replay or dreaming](../../30_Decisions/D04_Replay_or_dreaming.md) · [What constitutes verification](../../30_Decisions/D11_What_constitutes_verification.md)

## Previous methods

[Replay ordering and the reopened sleep branch](../../51_Prior_Methods/H03-Replay-and-Sleep.md) · [Earlier architecture choices and open alternatives](../../51_Prior_Methods/H08-Architecture-Proposals.md)

## Biological or physical inspiration

[Sleep replay and consolidation](../../20_Metaphors/M01-sleep-replay.md) · [Selective downscaling and capacity recovery](../../20_Metaphors/M02-sleep-scaling.md) · [Sleep clearance: preserve a live disagreement](../../20_Metaphors/M12-clearance-disagreement.md)

## Sources to start from

[Language Models Need Sleep: Learning to Self-Modify and Consolidate Memories](../../60_Sources/S02_Language_Models_Need_Sleep_Learning_to_Self_Modify_and_Consolidate_Memories.md) · [Self-Adapting Language Models](../../60_Sources/S06_Self_Adapting_Language_Models.md)

## Continue through the graph

[Topic-based research-agent workflow](../../70_Local_Build/B05_Research_Agent_Workflow.md) · [Evidence, disagreements, and research state](../../04_Evidence_and_Disagreement.md) · [Topic-first research map](../../03_Research_Map.md)

## Cross-topic connection

[Critics and calibrated uncertainty](../T06_Verification/P20_Critics_and_calibrated_uncertainty.md)

## Cross-topic connection

[Parallel candidates and recovery](../T08_Prediction/P26_Parallel_candidates_and_recovery.md)
