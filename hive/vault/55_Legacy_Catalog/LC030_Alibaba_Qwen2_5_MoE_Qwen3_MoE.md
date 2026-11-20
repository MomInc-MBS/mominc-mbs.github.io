---
id: "LC030"
title: "Alibaba Qwen2.5-MoE / Qwen3-MoE"
type: "legacy_catalog_entry"
status: "historical_import_not_reverified"
evidence_status: "historical_import_not_reverified"
implementation_status: "not_assessed"
created: "2026-11-20"
tags:
  - hive
  - hive/legacy_catalog_entry
---

# Alibaba Qwen2.5-MoE / Qwen3-MoE

**Status:** historical import; current project condition and numerical claims are not reverified here.  
**Original catalog category:** MoE/Modular LLM  
**Original catalog label:** Succeeded — a prior classification, not this plan's experimental verdict.

## Prior description

Alibaba's Qwen mixture-of-experts LLMs — hosted-only Qwen2.5-Max in the Qwen2.5 generation, then open-weight Qwen3-30B-A3B (30B total/3B active) and Qwen3-235B-A22B (235B total/22B active, 128 experts, 8 active per token).

## Research lead carried forward

Copy sparse MoE routing (large total capacity, small active cost per token) plus a permissive license and a full size ladder to become the default base others build on; avoid treating any single checkpoint as permanent — plan for rapid supersession within the same lineage.

This is a historical suggestion to investigate. Adoption requires current primary evidence, a working interface, and a workload comparison.

## Original source trail

- [Original report source 1](https://qwenlm.github.io/blog/qwen2.5/)
- [Original report source 2](https://www.tellworld.net/models/qwen3)
- [Original report source 3](https://siliconangle.com/2025/01/29/alibaba-unveils-qwen-2-5-max-ai-model-saying-outperforms-deepseek-v3/)
- [Original report source 4](https://metaprompt.ai/posts/chinese-open-weight-models-by-the-numbers)

## Recheck before use

- Current maintainer/release state and exact source revision.
- Model, code, data, and downstream license terms.
- Local setup and supported invocation.
- Mechanism relevant to HIVE, with a competing approach.
- Reproducible evidence for the task rather than popularity or funding.

## Links

[HIVE 100 similar projects report](../50_Source_History/R05_HIVE_100_similar_projects_report.md) · [Specialist structure](../10_Research/T02_Specialists/T02_Specialists.md) · [Inherited assumptions and disputed conclusions](../51_Prior_Methods/H11-Inherited-Claims-to-Recheck.md) · [Prior 100-project research catalog](00_Catalog_Index.md)
