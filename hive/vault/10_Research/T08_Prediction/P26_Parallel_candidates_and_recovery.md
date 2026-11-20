---
id: "P26"
title: "Parallel candidates and recovery"
type: "research_path"
status: "proposed"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/research_path
---

# Parallel candidates and recovery

**Parent topic:** [Prediction and alternative intelligence](T08_Prediction.md)  
**Status:** research path; implementation and outcomes remain to be tested.

## Question

When is exploring several possible solutions useful?

## Retained branches

| Branch | Candidate mechanism | Current status |
|---|---|---|
| P26.A | One trajectory with its full budget | Retained for comparison |
| P26.B | Several candidates plus verifier | Retained for comparison |
| P26.C | Adaptive branching only at uncertain steps | Retained for comparison |

## Prototype to build

Generate alternatives at explicit decision points, estimate their feasibility, execute the best validated option, and reuse observations after failure. Preserve failed candidates.

## Measurement and failure condition

Use equal total compute and end-to-end deadlines. More candidates need not help when they share the same mistaken assumptions.

## Adjacent research avenues

Search; planning; counterfactual reasoning; portfolio algorithms.

Create a new path when one of these changes the mechanism or test; otherwise link new evidence here.

## Experiments and decisions

[Compare generalists, independent specialists, adapters and hybrids](../../40_Experiments/E03_Expert_Architecture_Comparison.md) · [Test whether dreaming adds value beyond verified replay](../../40_Experiments/E05_Dreaming_vs_Replay.md)  
[Central or distributed control](../../30_Decisions/D05_Central_or_distributed_control.md) · [What constitutes verification](../../30_Decisions/D11_What_constitutes_verification.md)

## Previous methods

[Earlier architecture choices and open alternatives](../../51_Prior_Methods/H08-Architecture-Proposals.md) · [Video, studio interaction, and horror testbeds](../../51_Prior_Methods/H10-Application-Testbeds.md)

## Biological or physical inspiration

[Falling, balance, and predictive recovery](../../20_Metaphors/M08-internal-model-recovery.md) · [Printed pneumatic robots and structure doing computation](../../20_Metaphors/M10-fluidic-structure.md)

## Sources to start from

Use the primary sources on the linked history and metaphor pages; add task-specific evidence before making a performance claim.

## Continue through the graph

[Topic-based research-agent workflow](../../70_Local_Build/B05_Research_Agent_Workflow.md) · [Evidence, disagreements, and research state](../../04_Evidence_and_Disagreement.md) · [Topic-first research map](../../03_Research_Map.md)

## Cross-topic connection

[Dreaming and curriculum](../T01_Learning/P03_Dreaming_and_curriculum.md)
