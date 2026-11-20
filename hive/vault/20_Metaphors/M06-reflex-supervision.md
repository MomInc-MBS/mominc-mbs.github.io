---
id: "M06"
title: "Dedicated reflexes and operational supervision"
type: "metaphor"
status: "software_translation_proposed"
evidence_status: "primary_observation_linked"
implementation_status: "software_translation_proposed"
created: "2026-11-20"
tags:
  - hive
  - hive/metaphor
---

# Dedicated reflexes and operational supervision

- **Observed mechanism:** Ijspeert and colleagues implemented a spinal-cord model in a salamander robot and investigated switching between locomotion patterns.
- **Software translation — proposal:** Put timeouts, leases, stalled-worker detection, queue handling, audio playback state, and bounded recovery into dependable processes that run outside the main model conversation. Escalate only events requiring interpretation.
- **Competing branches:** LLM-centered supervision; deterministic state-machine supervision; deterministic monitoring with a learned escalation policy. An additional supervisor model remains an experimental option rather than the automatic solution.
- **Falsifiable experiment:** Stop a worker, delay a response, drop a message, and repeat a tool error in a controlled environment. Measure detection and recovery latency, false interventions, work lost, and foreground task quality. Reject the extra supervisor if it adds delay without improving reliable recovery.
- **Analogy limit:** A rhythmic or reflex controller does not provide general reasoning. Its value comes from solving a bounded operational task predictably, with explicit states and recovery limits.
- **Adjacent avenues:** Real-time systems, control theory, behavior trees, watchdog processes, and fault-tolerant job orchestration.

## Primary source trail

[From swimming to walking with a salamander robot driven by a spinal cord model](../60_Sources/S24_From_swimming_to_walking_with_a_salamander_robot_driven_by_a_spinal_cord_model.md)

## Research connections

[Coordination and supervision](../10_Research/T03_Coordination/T03_Coordination.md) · [Daily application laboratories](../10_Research/T09_Applications/T09_Applications.md) · [Biology and physical translation](../10_Research/T10_Research/P33_Biology_and_physical_translation.md)
