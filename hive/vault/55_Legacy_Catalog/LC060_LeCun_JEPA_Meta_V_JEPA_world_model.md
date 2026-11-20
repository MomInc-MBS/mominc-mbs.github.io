---
id: "LC060"
title: "LeCun JEPA / Meta V-JEPA world model"
type: "legacy_catalog_entry"
status: "historical_import_not_reverified"
evidence_status: "historical_import_not_reverified"
implementation_status: "not_assessed"
created: "2026-11-20"
tags:
  - hive
  - hive/legacy_catalog_entry
---

# LeCun JEPA / Meta V-JEPA world model

**Status:** historical import; current project condition and numerical claims are not reverified here.  
**Original catalog category:** Cognitive architecture/AGI  
**Original catalog label:** In Progress — a prior classification, not this plan's experimental verdict.

## Prior description

A self-supervised world-model architecture proposed by Yann LeCun in which an encoder and predictor forecast future observations in abstract latent representation space instead of generating pixels or tokens, embodied in Meta's open V-JEPA 2 video model and its action-conditioned robot-planning variant V-JEPA 2-AC.

## Research lead carried forward

Copy JEPA's latent-space prediction idea — predict abstract state, not pixels or tokens — for cheap, fast world-model planning in HIVE agents, but avoid betting the whole system on it until physical-reasoning benchmarks improve.

This is a historical suggestion to investigate. Adoption requires current primary evidence, a working interface, and a workload comparison.

## Original source trail

- [Original report source 1](https://ai.meta.com/blog/v-jepa-2-world-model-benchmarks/)
- [Original report source 2](https://arxiv.org/abs/2506.09985)
- [Original report source 3](https://github.com/facebookresearch/vjepa2)
- [Original report source 4](https://quantumzeitgeist.com/world-models-lecun-post-llm/)

## Recheck before use

- Current maintainer/release state and exact source revision.
- Model, code, data, and downstream license terms.
- Local setup and supported invocation.
- Mechanism relevant to HIVE, with a competing approach.
- Reproducible evidence for the task rather than popularity or funding.

## Links

[HIVE 100 similar projects report](../50_Source_History/R05_HIVE_100_similar_projects_report.md) · [Coordination and supervision](../10_Research/T03_Coordination/T03_Coordination.md) · [Inherited assumptions and disputed conclusions](../51_Prior_Methods/H11-Inherited-Claims-to-Recheck.md) · [Prior 100-project research catalog](00_Catalog_Index.md)
