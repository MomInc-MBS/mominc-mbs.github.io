---
id: "LC036"
title: "Microsoft Phi-3.5-MoE"
type: "legacy_catalog_entry"
status: "historical_import_not_reverified"
evidence_status: "historical_import_not_reverified"
implementation_status: "not_assessed"
created: "2026-11-20"
tags:
  - hive
  - hive/legacy_catalog_entry
---

# Microsoft Phi-3.5-MoE

**Status:** historical import; current project condition and numerical claims are not reverified here.  
**Original catalog category:** MoE/Modular LLM  
**Original catalog label:** Failed — a prior classification, not this plan's experimental verdict.

## Prior description

Microsoft's open-weight Mixture-of-Experts small language model with 16 experts, 42B total parameters but only 6.6B active per token, and a 128K-token context window.

## Research lead carried forward

Copy sparse expert activation for cost-efficient specialist routing, but avoid depending on a single vendor model generation — design experts as swappable modules with a planned migration path so a deprecated generation does not strand the system.

This is a historical suggestion to investigate. Adoption requires current primary evidence, a working interface, and a workload comparison.

## Original source trail

- [Original report source 1](https://huggingface.co/microsoft/Phi-3.5-MoE-instruct)
- [Original report source 2](https://github.blog/changelog/2025-09-11-deprecated-microsoft-models-in-github-models)
- [Original report source 3](https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/announcing-the-availability-of-phi-3-5-moe-in-azure-ai-studio-and-github/4256278)
- [Original report source 4](https://seminal.ai/open-source-large-language-models/microsoft-phi-3-5-moe-instruct/)

## Recheck before use

- Current maintainer/release state and exact source revision.
- Model, code, data, and downstream license terms.
- Local setup and supported invocation.
- Mechanism relevant to HIVE, with a competing approach.
- Reproducible evidence for the task rather than popularity or funding.

## Links

[HIVE 100 similar projects report](../50_Source_History/R05_HIVE_100_similar_projects_report.md) · [Specialist structure](../10_Research/T02_Specialists/T02_Specialists.md) · [Inherited assumptions and disputed conclusions](../51_Prior_Methods/H11-Inherited-Claims-to-Recheck.md) · [Prior 100-project research catalog](00_Catalog_Index.md)
