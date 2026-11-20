---
id: "LC040"
title: "Baidu ERNIE MoE"
type: "legacy_catalog_entry"
status: "historical_import_not_reverified"
evidence_status: "historical_import_not_reverified"
implementation_status: "not_assessed"
created: "2026-11-20"
tags:
  - hive
  - hive/legacy_catalog_entry
---

# Baidu ERNIE MoE

**Status:** historical import; current project condition and numerical claims are not reverified here.  
**Original catalog category:** MoE/Modular LLM  
**Original catalog label:** In Progress — a prior classification, not this plan's experimental verdict.

## Prior description

Baidu's ERNIE family of sparse Mixture-of-Experts foundation models, in which a router activates only a small subset of experts per token to deliver large-model capability at much lower inference cost.

## Research lead carried forward

Copy sparse MoE routing with a small active-parameter budget and a base-checkpoint-first release for domain adaptation, but avoid Baidu's split open/closed tiering and region-restricted licensing that fragment adoption.

This is a historical suggestion to investigate. Adoption requires current primary evidence, a working interface, and a workload comparison.

## Original source trail

- [Original report source 1](https://huggingface.co/baidu/ERNIE-5.5-Flash-Base)
- [Original report source 2](https://www.tellworld.net/news/ernie-4-5-open-source-2025)
- [Original report source 3](https://nextomoro.com/ernie/)

## Recheck before use

- Current maintainer/release state and exact source revision.
- Model, code, data, and downstream license terms.
- Local setup and supported invocation.
- Mechanism relevant to HIVE, with a competing approach.
- Reproducible evidence for the task rather than popularity or funding.

## Links

[HIVE 100 similar projects report](../50_Source_History/R05_HIVE_100_similar_projects_report.md) · [Specialist structure](../10_Research/T02_Specialists/T02_Specialists.md) · [Inherited assumptions and disputed conclusions](../51_Prior_Methods/H11-Inherited-Claims-to-Recheck.md) · [Prior 100-project research catalog](00_Catalog_Index.md)
