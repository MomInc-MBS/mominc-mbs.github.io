---
id: "LC033"
title: "Databricks DBRX"
type: "legacy_catalog_entry"
status: "historical_import_not_reverified"
evidence_status: "historical_import_not_reverified"
implementation_status: "not_assessed"
created: "2026-11-20"
tags:
  - hive
  - hive/legacy_catalog_entry
---

# Databricks DBRX

**Status:** historical import; current project condition and numerical claims are not reverified here.  
**Original catalog category:** MoE/Modular LLM  
**Original catalog label:** Failed — a prior classification, not this plan's experimental verdict.

## Prior description

Databricks' open-weight, fine-grained mixture-of-experts LLM with 132B total / 36B active parameters, released in March 2024 as a general-purpose enterprise model.

## Research lead carried forward

Copy DBRX's fine-grained MoE efficiency lesson (many small experts, few active) for cost-effective routing, but avoid betting HIVE on a single monolithic foundation model that can be superseded within a year — build the orchestration, evaluation and migration layer instead.

This is a historical suggestion to investigate. Adoption requires current primary evidence, a working interface, and a workload comparison.

## Original source trail

- [Original report source 1](https://www.databricks.com/company/newsroom/press-releases/databricks-launches-dbrx-new-standard-efficient-open-source-models)
- [Original report source 2](https://en.wikipedia.org/wiki/DBRX)
- [Original report source 3](https://docs.databricks.com/aws/en/release-notes/product/2025/april)
- [Original report source 4](https://docs.databricks.com/gcp/en/machine-learning/retired-models-policy#retired)

## Recheck before use

- Current maintainer/release state and exact source revision.
- Model, code, data, and downstream license terms.
- Local setup and supported invocation.
- Mechanism relevant to HIVE, with a competing approach.
- Reproducible evidence for the task rather than popularity or funding.

## Links

[HIVE 100 similar projects report](../50_Source_History/R05_HIVE_100_similar_projects_report.md) · [Specialist structure](../10_Research/T02_Specialists/T02_Specialists.md) · [Inherited assumptions and disputed conclusions](../51_Prior_Methods/H11-Inherited-Claims-to-Recheck.md) · [Prior 100-project research catalog](00_Catalog_Index.md)
