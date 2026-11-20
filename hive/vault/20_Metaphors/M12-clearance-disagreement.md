---
id: "M12"
title: "Sleep clearance: preserve a live disagreement"
type: "metaphor"
status: "software_translation_proposed"
evidence_status: "primary_observation_linked"
implementation_status: "software_translation_proposed"
created: "2026-11-20"
tags:
  - hive
  - hive/metaphor
---

# Sleep clearance: preserve a live disagreement

- **Evidence A:** Hauglund and colleagues linked norepinephrine-driven vascular oscillations with cerebrospinal-fluid transport and clearance during mouse NREM sleep.
- **Evidence B:** Miao and colleagues reported reduced clearance during sleep and anesthesia using fluorescent-dye measurements in male mice.
- **Measurement dispute:** Tracers, delivery, assays, and sleep conditions differ. Hauglund also measured radiotracer clearance; the disagreement cannot be reduced to inflow versus outflow alone. Preserve both studies and their methods.
- **Software translation — proposal:** Treat cleanup as several processes: stopping intake, moving records, removing duplicates, compressing storage, and deleting obsolete state. Measure each separately rather than calling all of them clearance.
- **Competing branches:** Scheduled cleanup; continuous cleanup; workload-triggered cleanup; preservation with extra capacity.
- **Falsifiable experiment:** Track incoming, retained, moved, and removed records under identical workloads. Compare correctness, storage, latency, and recoverability. Faster movement alone does not demonstrate useful removal.
- **Analogy limit:** Conflicting biological findings do not establish which maintenance schedule software needs.
- **Adjacent avenues:** Conservation equations, measurement validity, garbage collection, data lifecycle management, and replication design.

## Primary source trail

[Norepinephrine-mediated slow vasomotion drives glymphatic clearance during sleep](../60_Sources/S31_Norepinephrine_mediated_slow_vasomotion_drives_glymphatic_clearance_during_sleep.md) · [Brain clearance is reduced during sleep and anesthesia](../60_Sources/S32_Brain_clearance_is_reduced_during_sleep_and_anesthesia.md)

## Research connections

[Learning lifecycle](../10_Research/T01_Learning/T01_Learning.md) · [Research method and discovery](../10_Research/T10_Research/T10_Research.md) · [Biology and physical translation](../10_Research/T10_Research/P33_Biology_and_physical_translation.md)
