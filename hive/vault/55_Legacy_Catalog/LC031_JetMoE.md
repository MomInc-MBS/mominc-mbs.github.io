---
id: "LC031"
title: "JetMoE"
type: "legacy_catalog_entry"
status: "historical_import_not_reverified"
evidence_status: "historical_import_not_reverified"
implementation_status: "not_assessed"
created: "2026-11-20"
tags:
  - hive
  - hive/legacy_catalog_entry
---

# JetMoE

**Status:** historical import; current project condition and numerical claims are not reverified here.  
**Original catalog category:** MoE/Modular LLM  
**Original catalog label:** Stalled/Abandoned — a prior classification, not this plan's experimental verdict.

## Prior description

JetMoE-8B is an open-source sparsely-gated Mixture-of-Experts LLM from MyShell and MIT that applies sparse activation to both attention heads and feedforward layers, activating only 2.2B of its 8B parameters per token.

## Research lead carried forward

Copy JetMoE's sparse activation of both attention and feedforward experts to cut inference cost ~70%, but avoid depending on a one-off paper model as a foundation — pin or fork it, since upstream maintenance has stopped.

This is a historical suggestion to investigate. Adoption requires current primary evidence, a working interface, and a workload comparison.

## Original source trail

- [Original report source 1](https://arxiv.org/html/2404.07413v1/)
- [Original report source 2](https://github.com/myshell-ai/JetMoE)
- [Original report source 3](https://huggingface.co/jetmoe/jetmoe-8b-chat)
- [Original report source 4](https://awesome.ecosyste.ms/projects/github.com%2Fmyshell-ai%2FJetMoE)

## Recheck before use

- Current maintainer/release state and exact source revision.
- Model, code, data, and downstream license terms.
- Local setup and supported invocation.
- Mechanism relevant to HIVE, with a competing approach.
- Reproducible evidence for the task rather than popularity or funding.

## Links

[HIVE 100 similar projects report](../50_Source_History/R05_HIVE_100_similar_projects_report.md) · [Specialist structure](../10_Research/T02_Specialists/T02_Specialists.md) · [Inherited assumptions and disputed conclusions](../51_Prior_Methods/H11-Inherited-Claims-to-Recheck.md) · [Prior 100-project research catalog](00_Catalog_Index.md)
