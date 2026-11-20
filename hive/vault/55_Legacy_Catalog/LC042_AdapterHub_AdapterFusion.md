---
id: "LC042"
title: "AdapterHub / AdapterFusion"
type: "legacy_catalog_entry"
status: "historical_import_not_reverified"
evidence_status: "historical_import_not_reverified"
implementation_status: "not_assessed"
created: "2026-11-20"
tags:
  - hive
  - hive/legacy_catalog_entry
---

# AdapterHub / AdapterFusion

**Status:** historical import; current project condition and numerical claims are not reverified here.  
**Original catalog category:** Specialist/Adapter  
**Original catalog label:** In Progress — a prior classification, not this plan's experimental verdict.

## Prior description

AdapterHub is a framework and shared hub for parameter-efficient adapters that plug small trainable modules into frozen Transformers, and AdapterFusion is its two-stage method for combining multiple task-specific adapters via a learned fusion layer.

## Research lead carried forward

Copy frozen, swappable specialist modules plus an explicit, saveable composition/fusion layer, but avoid AdapterFusion's per-combination fusion-training cost and tight coupling to one upstream framework version.

This is a historical suggestion to investigate. Adoption requires current primary evidence, a working interface, and a workload comparison.

## Original source trail

- [Original report source 1](https://github.com/adapter-hub/adapters)
- [Original report source 2](https://pypi.org/project/adapters/1.3.0)
- [Original report source 3](https://adapterhub.ml/blog/2020/11/adapting-transformers-with-adapterhub/)
- [Original report source 4](https://ar5iv.labs.arxiv.org/html/2005.00247)

## Recheck before use

- Current maintainer/release state and exact source revision.
- Model, code, data, and downstream license terms.
- Local setup and supported invocation.
- Mechanism relevant to HIVE, with a competing approach.
- Reproducible evidence for the task rather than popularity or funding.

## Links

[HIVE 100 similar projects report](../50_Source_History/R05_HIVE_100_similar_projects_report.md) · [Specialist structure](../10_Research/T02_Specialists/T02_Specialists.md) · [Inherited assumptions and disputed conclusions](../51_Prior_Methods/H11-Inherited-Claims-to-Recheck.md) · [Prior 100-project research catalog](00_Catalog_Index.md)
