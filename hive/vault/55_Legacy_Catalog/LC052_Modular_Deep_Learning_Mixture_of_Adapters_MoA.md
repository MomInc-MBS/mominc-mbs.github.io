---
id: "LC052"
title: "Modular Deep Learning / Mixture-of-Adapters (MoA)"
type: "legacy_catalog_entry"
status: "historical_import_not_reverified"
evidence_status: "historical_import_not_reverified"
implementation_status: "not_assessed"
created: "2026-11-20"
tags:
  - hive
  - hive/legacy_catalog_entry
---

# Modular Deep Learning / Mixture-of-Adapters (MoA)

**Status:** historical import; current project condition and numerical claims are not reverified here.  
**Original catalog category:** MoE/Modular LLM  
**Original catalog label:** In Progress — a prior classification, not this plan's experimental verdict.

## Prior description

A research programme in which a frozen foundation model is adapted by composing small, swappable specialist adapter modules — Mixture-of-Adapters (MoA) routes tokens to heterogeneous LoRA, parallel-adapter and prompt-tuning experts instead of retraining the whole model.

## Research lead carried forward

Copy the pattern HIVE needs most — a frozen backbone plus swappable, heterogeneous specialist adapters selected by a router — but avoid inventing bespoke routing and composition from scratch, since that fragmentation is exactly what has kept this line academic rather than productised.

This is a historical suggestion to investigate. Adoption requires current primary evidence, a working interface, and a workload comparison.

## Original source trail

- [Original report source 1](https://aclanthology.org/2026.acl-long.965/)
- [Original report source 2](https://ar5iv.labs.arxiv.org/html/2506.05928)
- [Original report source 3](https://www.ruder.io/modular-deep-learning/)
- [Original report source 4](https://openaccess.thecvf.com/content/CVPR2025/papers/Wang_Self-Expansion_of_Pre-trained_Models_with_Mixture_of_Adapters_for_Continual_CVPR_2025_paper.pdf)

## Recheck before use

- Current maintainer/release state and exact source revision.
- Model, code, data, and downstream license terms.
- Local setup and supported invocation.
- Mechanism relevant to HIVE, with a competing approach.
- Reproducible evidence for the task rather than popularity or funding.

## Links

[HIVE 100 similar projects report](../50_Source_History/R05_HIVE_100_similar_projects_report.md) · [Specialist structure](../10_Research/T02_Specialists/T02_Specialists.md) · [Inherited assumptions and disputed conclusions](../51_Prior_Methods/H11-Inherited-Claims-to-Recheck.md) · [Prior 100-project research catalog](00_Catalog_Index.md)
