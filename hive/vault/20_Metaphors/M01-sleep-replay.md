---
id: "M01"
title: "Sleep replay and consolidation"
type: "metaphor"
status: "software_translation_proposed"
evidence_status: "primary_observation_linked"
implementation_status: "software_translation_proposed"
created: "2026-11-20"
tags:
  - hive
  - hive/metaphor
---

# Sleep replay and consolidation

- **Observed mechanism:** Wilson and McNaughton found increased sleep reactivation among hippocampal cells that had been active together during spatial behavior in rats.
- **Software translation — proposal:** Keep verified experiences in an episodic buffer. During an idle interval, replay selected examples into a candidate specialist, then compare it with the unchanged version. Keep retrieval updates, router updates, and parameter training separately measurable.
- **Competing branches:** Real-example replay; synthetic replay; retrieval-only consolidation; improved routing without parameter changes. Synthetic replay has a research precedent, but that does not establish reliability for HIVE.
- **Falsifiable experiment:** Feed each branch the same changing task sequence. Match examples and compute; measure new-task learning, old-task retention, rare-case preservation, and elapsed time. Reject the claim of beneficial consolidation if retained performance does not improve beyond the matched control.
- **Analogy limit:** A rest interval is not itself a learning mechanism. Generated dreams require independent checks before becoming training data.
- **Adjacent avenues:** Continual learning, experience replay, distillation, curriculum design, and selective rehearsal.

## Primary source trail

[Reactivation of hippocampal ensemble memories during sleep](../60_Sources/S16_Reactivation_of_hippocampal_ensemble_memories_during_sleep.md) · [Continual Learning with Deep Generative Replay](../60_Sources/S17_Continual_Learning_with_Deep_Generative_Replay.md)

## Research connections

[Learning lifecycle](../10_Research/T01_Learning/T01_Learning.md) · [Memory, evidence, and knowledge graphs](../10_Research/T05_Memory/T05_Memory.md) · [Biology and physical translation](../10_Research/T10_Research/P33_Biology_and_physical_translation.md)
