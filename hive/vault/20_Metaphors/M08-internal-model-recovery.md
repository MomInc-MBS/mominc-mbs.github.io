---
id: "M08"
title: "Falling, balance, and predictive recovery"
type: "metaphor"
status: "software_translation_proposed"
evidence_status: "primary_observation_linked"
implementation_status: "software_translation_proposed"
created: "2026-11-20"
tags:
  - hive
  - hive/metaphor
---

# Falling, balance, and predictive recovery

- **Observed mechanism:** Wolpert and colleagues tested human sensorimotor state estimation and reported results supporting an internal-model account of movement estimation.
- **Software translation — proposal:** Translate the falling-and-standing example into explicit state, hazards, candidate actions, predicted next states, and a goal test. Generate alternatives, evaluate consequences, observe what actually happened, and replan when the prediction fails.
- **Competing branches:** Reactive next-step choice; short-horizon planning; search over candidate workflows; a learned policy with deterministic constraints. Compare candidate breadth with the extra computation it requires.
- **Falsifiable experiment:** In a game or reversible workflow simulator, change hazards and introduce failed tools. Measure completed goals, repeated errors, prediction accuracy, recovery time, and total work. Planning loses support when simulator error makes it less reliable than the reactive control.
- **Analogy limit:** A plausible predicted outcome is not an observation. An internal model must expose uncertainty and be checked against subsequent state changes.
- **Adjacent avenues:** Model-predictive control, state estimation, causal models, active inference, and partially observed decision processes.

## Primary source trail

[An Internal Model for Sensorimotor Integration](../60_Sources/S26_An_Internal_Model_for_Sensorimotor_Integration.md)

## Research connections

[Prediction and alternative intelligence](../10_Research/T08_Prediction/T08_Prediction.md) · [Daily application laboratories](../10_Research/T09_Applications/T09_Applications.md) · [Biology and physical translation](../10_Research/T10_Research/P33_Biology_and_physical_translation.md)
