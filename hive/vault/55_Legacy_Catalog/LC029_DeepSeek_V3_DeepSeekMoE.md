---
id: "LC029"
title: "DeepSeek-V3 / DeepSeekMoE"
type: "legacy_catalog_entry"
status: "historical_import_not_reverified"
evidence_status: "historical_import_not_reverified"
implementation_status: "not_assessed"
created: "2026-11-20"
tags:
  - hive
  - hive/legacy_catalog_entry
---

# DeepSeek-V3 / DeepSeekMoE

**Status:** historical import; current project condition and numerical claims are not reverified here.  
**Original catalog category:** MoE/Modular LLM  
**Original catalog label:** Succeeded — a prior classification, not this plan's experimental verdict.

## Prior description

DeepSeek-V3 is a 671B-parameter open-weights Mixture-of-Experts LLM (37B active per token) built on the DeepSeekMoE architecture, released by DeepSeek in December 2024.

## Research lead carried forward

Copy DeepSeekMoE's lesson: use fine-grained, sparsely-activated specialists with a shared expert and auxiliary-loss-free routing so HIVE can scale capability without activating (or paying for) the whole system per task.

This is a historical suggestion to investigate. Adoption requires current primary evidence, a working interface, and a workload comparison.

## Original source trail

- [Original report source 1](https://www.tellworld.net/models/deepseek-v3)
- [Original report source 2](https://deepseekai.guide/reviews/deepseek-v3-review/)
- [Original report source 3](https://www.beri.net/tools/deepseek-v3)
- [Original report source 4](https://arxiv.org/abs/2412.19437)

## Recheck before use

- Current maintainer/release state and exact source revision.
- Model, code, data, and downstream license terms.
- Local setup and supported invocation.
- Mechanism relevant to HIVE, with a competing approach.
- Reproducible evidence for the task rather than popularity or funding.

## Links

[HIVE 100 similar projects report](../50_Source_History/R05_HIVE_100_similar_projects_report.md) · [Specialist structure](../10_Research/T02_Specialists/T02_Specialists.md) · [Inherited assumptions and disputed conclusions](../51_Prior_Methods/H11-Inherited-Claims-to-Recheck.md) · [Prior 100-project research catalog](00_Catalog_Index.md)
