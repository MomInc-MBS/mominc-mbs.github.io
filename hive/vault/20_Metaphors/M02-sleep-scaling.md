---
id: "M02"
title: "Selective downscaling and capacity recovery"
type: "metaphor"
status: "software_translation_proposed"
evidence_status: "primary_observation_linked"
implementation_status: "software_translation_proposed"
created: "2026-11-20"
tags:
  - hive
  - hive/metaphor
---

# Selective downscaling and capacity recovery

- **Observed mechanism:** De Vivo and colleagues found structural changes consistent with selective synaptic scaling across sleep and wake in mouse cortex, with some synapses spared.
- **Software translation — proposal:** Separate capacity recovery from rehearsal. Candidate maintenance jobs may deduplicate examples, compress redundant procedures, reduce adapter rank, or retire unused cached objects while preserving their history and recovery path.
- **Competing branches:** Importance-aware compression; frequency-based pruning; preserving rare examples; unrestricted storage growth. Keep each policy explicit so a smaller footprint cannot hide the loss of useful capability.
- **Falsifiable experiment:** Fill a bounded memory with repeated tasks and deliberately rare, important cases. Compare retained accuracy, storage, relearning cost, and adaptation to the next task. A compression policy fails its stated purpose if its storage advantage disappears when lost capability is restored.
- **Analogy limit:** Weight magnitude is not a direct measure of knowledge importance. Blindly scaling neural weights does not reproduce biological synaptic regulation.
- **Adjacent avenues:** Cache eviction, model compression, continual-learning regularization, minimum-description-length objectives, and information bottlenecks.

## Primary source trail

[Ultrastructural evidence for synaptic scaling across the wake/sleep cycle](../60_Sources/S18_Ultrastructural_evidence_for_synaptic_scaling_across_the_wake_sleep_cycle.md)

## Research connections

[Learning lifecycle](../10_Research/T01_Learning/T01_Learning.md) · [Resources and scale](../10_Research/T07_Resources/T07_Resources.md) · [Biology and physical translation](../10_Research/T10_Research/P33_Biology_and_physical_translation.md)
