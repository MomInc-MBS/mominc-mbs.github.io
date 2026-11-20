---
id: "LC032"
title: "OLMoE (Allen Institute for AI)"
type: "legacy_catalog_entry"
status: "historical_import_not_reverified"
evidence_status: "historical_import_not_reverified"
implementation_status: "not_assessed"
created: "2026-11-20"
tags:
  - hive
  - hive/legacy_catalog_entry
---

# OLMoE (Allen Institute for AI)

**Status:** historical import; current project condition and numerical claims are not reverified here.  
**Original catalog category:** MoE/Modular LLM  
**Original catalog label:** Succeeded — a prior classification, not this plan's experimental verdict.

## Prior description

OLMoE is Ai2's fully open sparse mixture-of-experts language model (7B total / ~1B active parameters per token) released with its weights, training data, code, logs, and 244 checkpoints.

## Research lead carried forward

Copy OLMoE's sparse top-k expert routing plus full openness (weights, data, code, logs, checkpoints) for reproducible, cheap-to-run specialists — but avoid treating one small MoE as a durable product, since Ai2 itself moved on to newer dense backbones.

This is a historical suggestion to investigate. Adoption requires current primary evidence, a working interface, and a workload comparison.

## Original source trail

- [Original report source 1](https://arxiv.org/html/2409.02060v1)
- [Original report source 2](https://en.wikipedia.org/wiki/Allen_Institute_for_AI)
- [Original report source 3](https://huggingface.co/collections/allenai/olmoe-january-2025)
- [Original report source 4](https://www.llmobile.news/ticker/olmoe/)

## Recheck before use

- Current maintainer/release state and exact source revision.
- Model, code, data, and downstream license terms.
- Local setup and supported invocation.
- Mechanism relevant to HIVE, with a competing approach.
- Reproducible evidence for the task rather than popularity or funding.

## Links

[HIVE 100 similar projects report](../50_Source_History/R05_HIVE_100_similar_projects_report.md) · [Specialist structure](../10_Research/T02_Specialists/T02_Specialists.md) · [Inherited assumptions and disputed conclusions](../51_Prior_Methods/H11-Inherited-Claims-to-Recheck.md) · [Prior 100-project research catalog](00_Catalog_Index.md)
