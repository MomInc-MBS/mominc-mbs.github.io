---
id: "LC034"
title: "xAI Grok-1 MoE"
type: "legacy_catalog_entry"
status: "historical_import_not_reverified"
evidence_status: "historical_import_not_reverified"
implementation_status: "not_assessed"
created: "2026-11-20"
tags:
  - hive
  - hive/legacy_catalog_entry
---

# xAI Grok-1 MoE

**Status:** historical import; current project condition and numerical claims are not reverified here.  
**Original catalog category:** MoE/Modular LLM  
**Original catalog label:** Failed — a prior classification, not this plan's experimental verdict.

## Prior description

xAI's first large language model, a 314-billion-parameter Mixture-of-Experts model whose raw base weights and architecture were open-released under Apache 2.0.

## Research lead carried forward

Copy sparse MoE routing to activate only a fraction of experts per token, but avoid shipping a frozen, untuned base checkpoint with no serving stack or maintenance plan.

This is a historical suggestion to investigate. Adoption requires current primary evidence, a working interface, and a workload comparison.

## Original source trail

- [Original report source 1](https://github.com/xai-org/grok-1)
- [Original report source 2](https://en.wikipedia.org/wiki/Grok_AI)
- [Original report source 3](http://x.ai/blog/grok-os?ref=tinyalternatives)
- [Original report source 4](https://techcrunch.com/2024/03/17/xai-open-sources-base-model-of-grok-but-without-any-training-code/)

## Recheck before use

- Current maintainer/release state and exact source revision.
- Model, code, data, and downstream license terms.
- Local setup and supported invocation.
- Mechanism relevant to HIVE, with a competing approach.
- Reproducible evidence for the task rather than popularity or funding.

## Links

[HIVE 100 similar projects report](../50_Source_History/R05_HIVE_100_similar_projects_report.md) · [Specialist structure](../10_Research/T02_Specialists/T02_Specialists.md) · [Inherited assumptions and disputed conclusions](../51_Prior_Methods/H11-Inherited-Claims-to-Recheck.md) · [Prior 100-project research catalog](00_Catalog_Index.md)
