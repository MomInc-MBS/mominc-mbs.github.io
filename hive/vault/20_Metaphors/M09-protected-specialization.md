---
id: "M09"
title: "Protected specialization and expandable capacity"
type: "metaphor"
status: "software_translation_proposed"
evidence_status: "primary_observation_linked"
implementation_status: "software_translation_proposed"
created: "2026-11-20"
tags:
  - hive
  - hive/metaphor
---

# Protected specialization and expandable capacity

- **Observed precedent:** Progressive Neural Networks retain previously trained columns while adding new capacity and lateral connections for subsequent tasks.
- **Software translation — proposal:** Register specialist versions separately from their deployment state. Retain old skill implementations while creating candidates, then measure whether shared features, independent models, or low-rank adapters transfer useful knowledge at acceptable cost.
- **Competing branches:** Frozen experts plus new specialists; shared backbone with adapters; separate models; shared trainable parameters with retention constraints; periodic consolidation of duplicate skills. Keep structural growth distinct from increases in simultaneous active compute.
- **Falsifiable experiment:** Use sequential tasks with both overlap and conflict. Measure old-task retention, new-task learning speed, transfer, storage, memory residency, routing errors, and loading time. Expansion loses its efficiency claim if comparable retention is obtained by a smaller matched-budget alternative.
- **Analogy limit:** Preserving an expert does not guarantee the router will still select it. Developmental specialization is inspiration here; the cited study establishes a software architecture, not biological equivalence.
- **Adjacent avenues:** Modular transfer, adapters, conditional computation, architectural growth, distillation, and lifelong learning.

## Primary source trail

[Progressive Neural Networks](../60_Sources/S27_Progressive_Neural_Networks.md)

## Research connections

[Specialist structure](../10_Research/T02_Specialists/T02_Specialists.md) · [Biology and physical translation](../10_Research/T10_Research/P33_Biology_and_physical_translation.md)
