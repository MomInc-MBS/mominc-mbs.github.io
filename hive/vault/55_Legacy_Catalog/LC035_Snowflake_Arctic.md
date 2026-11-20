---
id: "LC035"
title: "Snowflake Arctic"
type: "legacy_catalog_entry"
status: "historical_import_not_reverified"
evidence_status: "historical_import_not_reverified"
implementation_status: "not_assessed"
created: "2026-11-20"
tags:
  - hive
  - hive/legacy_catalog_entry
---

# Snowflake Arctic

**Status:** historical import; current project condition and numerical claims are not reverified here.  
**Original catalog category:** MoE/Modular LLM  
**Original catalog label:** Succeeded — a prior classification, not this plan's experimental verdict.

## Prior description

Snowflake's open-weights, Apache 2.0 enterprise LLM family built on a dense-MoE hybrid architecture (480B total parameters, 17B active per token via 128 experts), optimized for SQL generation, coding, and instruction following.

## Research lead carried forward

Copy Arctic's playbook: ship a narrow specialist that beats generalists on one verifiable benchmark (e.g., SQL/BIRD) with open weights and recipes, and embed it inside a governed platform rather than chasing a frontier generalist.

This is a historical suggestion to investigate. Adoption requires current primary evidence, a working interface, and a workload comparison.

## Original source trail

- [Original report source 1](https://www.snowflake.com/en/news/press-releases/snowflake-launches-arctic-the-most-open-enterprise-grade-large-language-model-2/)
- [Original report source 2](https://www.snowflake.com/en/blog/engineering/arctic-text2sql-r1-sql-generation-benchmark/)
- [Original report source 3](https://www.snowflake.com/en/blog/engineering/snowflake-arctic-embed-2-multilingual/)

## Recheck before use

- Current maintainer/release state and exact source revision.
- Model, code, data, and downstream license terms.
- Local setup and supported invocation.
- Mechanism relevant to HIVE, with a competing approach.
- Reproducible evidence for the task rather than popularity or funding.

## Links

[HIVE 100 similar projects report](../50_Source_History/R05_HIVE_100_similar_projects_report.md) · [Specialist structure](../10_Research/T02_Specialists/T02_Specialists.md) · [Inherited assumptions and disputed conclusions](../51_Prior_Methods/H11-Inherited-Claims-to-Recheck.md) · [Prior 100-project research catalog](00_Catalog_Index.md)
