---
id: "M07"
title: "Slow feedback and resource homeostasis"
type: "metaphor"
status: "software_translation_proposed"
evidence_status: "primary_observation_linked"
implementation_status: "software_translation_proposed"
created: "2026-11-20"
tags:
  - hive
  - hive/metaphor
---

# Slow feedback and resource homeostasis

- **Observed mechanism:** Yi and colleagues analyzed integral feedback in a bacterial chemotaxis model as a mechanism for robust adaptation.
- **Software translation — proposal:** Monitor task deadlines, queue growth, available GPU memory, and foreground application load. A slower budget controller adjusts concurrent jobs, model residency, and offline training activity while fast processes handle immediate deadlines.
- **Competing branches:** Static allocation; threshold rules; proportional or integral feedback; predictive scheduling. The endocrine analogy suggests broadcast modulation across timescales, but each signal still needs a defined scope, delay, and response rule.
- **Falsifiable experiment:** Replay measured changes in OBS, media-processing, and audio workloads. Compare deadline failures, useful throughput, repeated loading, and oscillation. Reject an adaptive policy if its response to changing demand is less stable or less effective than a fixed allocation.
- **Analogy limit:** Biological hormones are not a ready-made software protocol. Feedback can destabilize a system when delay, saturation, or coupled controllers are ignored.
- **Adjacent avenues:** Control stability, backpressure, admission control, queueing, thermal management, and adaptive resource scheduling.

## Primary source trail

[Robust perfect adaptation in bacterial chemotaxis through integral feedback control](../60_Sources/S25_Robust_perfect_adaptation_in_bacterial_chemotaxis_through_integral_feedback_control.md)

## Research connections

[Resources and scale](../10_Research/T07_Resources/T07_Resources.md) · [Biology and physical translation](../10_Research/T10_Research/P33_Biology_and_physical_translation.md)
