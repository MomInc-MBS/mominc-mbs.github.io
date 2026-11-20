---
id: "P25"
title: "State estimation and world models"
type: "research_path"
status: "proposed"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/research_path
---

# State estimation and world models

**Parent topic:** [Prediction and alternative intelligence](T08_Prediction.md)  
**Status:** research path; implementation and outcomes remain to be tested.

## Question

Can HIVE predict consequences well enough to improve decisions?

## Retained branches

| Branch | Candidate mechanism | Current status |
|---|---|---|
| P25.A | Reactive observation-to-action policy | Retained for comparison |
| P25.B | Explicit state plus short-horizon simulator | Retained for comparison |
| P25.C | Learned predictive model with uncertainty | Retained for comparison |

## Prototype to build

Start with reversible production workflows and haunt-game states. Record predicted and observed transitions. Replan when the predicted state diverges.

## Measurement and failure condition

Compare goal completion, hazard avoidance, recovery, and total work under model mismatch. Forecast quality must be evaluated outside the training scenarios.

## Adjacent research avenues

Sensorimotor internal models; model predictive control; digital twins.

Create a new path when one of these changes the mechanism or test; otherwise link new evidence here.

## Experiments and decisions

[Compare generalists, independent specialists, adapters and hybrids](../../40_Experiments/E03_Expert_Architecture_Comparison.md)  
[Independent models or shared components](../../30_Decisions/D01_Independent_models_or_shared_components.md) · [What constitutes verification](../../30_Decisions/D11_What_constitutes_verification.md)

## Previous methods

[Earlier architecture choices and open alternatives](../../51_Prior_Methods/H08-Architecture-Proposals.md) · [Video, studio interaction, and horror testbeds](../../51_Prior_Methods/H10-Application-Testbeds.md)

## Biological or physical inspiration

[Falling, balance, and predictive recovery](../../20_Metaphors/M08-internal-model-recovery.md) · [Printed pneumatic robots and structure doing computation](../../20_Metaphors/M10-fluidic-structure.md)

## Sources to start from

Use the primary sources on the linked history and metaphor pages; add task-specific evidence before making a performance claim.

## Continue through the graph

[Topic-based research-agent workflow](../../70_Local_Build/B05_Research_Agent_Workflow.md) · [Evidence, disagreements, and research state](../../04_Evidence_and_Disagreement.md) · [Topic-first research map](../../03_Research_Map.md)

## Cross-topic connection

[Domain-native representations](../T04_Communication/P14_Domain_native_representations.md)

## Cross-topic connection

[Horror haunt game](../T09_Applications/P30_Horror_haunt_game.md)
