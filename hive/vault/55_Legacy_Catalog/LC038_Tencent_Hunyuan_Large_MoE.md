---
id: "LC038"
title: "Tencent Hunyuan-Large (MoE)"
type: "legacy_catalog_entry"
status: "historical_import_not_reverified"
evidence_status: "historical_import_not_reverified"
implementation_status: "not_assessed"
created: "2026-11-20"
tags:
  - hive
  - hive/legacy_catalog_entry
---

# Tencent Hunyuan-Large (MoE)

**Status:** historical import; current project condition and numerical claims are not reverified here.  
**Original catalog category:** MoE/Modular LLM  
**Original catalog label:** Failed — a prior classification, not this plan's experimental verdict.

## Prior description

Tencent's open-weight 389B-parameter Mixture-of-Experts language model (52B parameters activated per token), released in November 2024 as the largest open Transformer-based MoE model at the time.

## Research lead carried forward

Copy its sparse-MoE economics (huge total capacity, only ~13% of parameters active per token) and open-weights distribution, but avoid betting HIVE's core on a single giant checkpoint — plan for generational supersession and keep routing/abstraction layers model-swappable.

This is a historical suggestion to investigate. Adoption requires current primary evidence, a working interface, and a workload comparison.

## Original source trail

- [Original report source 1](https://arxiv.org/abs/2411.02265)
- [Original report source 2](https://huggingface.co/tencent/Tencent-Hunyuan-Large)
- [Original report source 3](https://www.avocolab.com/ai-models/tencent)
- [Original report source 4](https://www.tellworld.net/news/hunyuan-large-2024)

## Recheck before use

- Current maintainer/release state and exact source revision.
- Model, code, data, and downstream license terms.
- Local setup and supported invocation.
- Mechanism relevant to HIVE, with a competing approach.
- Reproducible evidence for the task rather than popularity or funding.

## Links

[HIVE 100 similar projects report](../50_Source_History/R05_HIVE_100_similar_projects_report.md) · [Specialist structure](../10_Research/T02_Specialists/T02_Specialists.md) · [Inherited assumptions and disputed conclusions](../51_Prior_Methods/H11-Inherited-Claims-to-Recheck.md) · [Prior 100-project research catalog](00_Catalog_Index.md)
