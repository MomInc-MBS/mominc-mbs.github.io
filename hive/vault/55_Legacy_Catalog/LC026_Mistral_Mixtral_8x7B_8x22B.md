---
id: "LC026"
title: "Mistral Mixtral 8x7B / 8x22B"
type: "legacy_catalog_entry"
status: "historical_import_not_reverified"
evidence_status: "historical_import_not_reverified"
implementation_status: "not_assessed"
created: "2026-11-20"
tags:
  - hive
  - hive/legacy_catalog_entry
---

# Mistral Mixtral 8x7B / 8x22B

**Status:** historical import; current project condition and numerical claims are not reverified here.  
**Original catalog category:** MoE/Modular LLM  
**Original catalog label:** Succeeded — a prior classification, not this plan's experimental verdict.

## Prior description

Mistral AI's Apache 2.0 open-weight sparse mixture-of-experts LLMs — Mixtral 8x7B (46.7B total parameters, 12.9B active per token) and Mixtral 8x22B (141B total, 39B active) — routing each token to 2 of 8 experts.

## Research lead carried forward

Copy sparse expert routing — small active cost per task with specialist experts — but design experts as replaceable, versioned modules so HIVE is not locked to a single frozen checkpoint when a better model supersedes it.

This is a historical suggestion to investigate. Adoption requires current primary evidence, a working interface, and a workload comparison.

## Original source trail

- [Original report source 1](https://docs.mistral.ai/models/mixtral-8x7b-0-1)
- [Original report source 2](https://docs.mistral.ai/models/mixtral-8x22b-0-1-0-3)
- [Original report source 3](https://huggingface.co/docs/transformers/v5.1.0/model_doc/mixtral)
- [Original report source 4](https://tools8020.com/blog/mistral-ai-statistics/)

## Recheck before use

- Current maintainer/release state and exact source revision.
- Model, code, data, and downstream license terms.
- Local setup and supported invocation.
- Mechanism relevant to HIVE, with a competing approach.
- Reproducible evidence for the task rather than popularity or funding.

## Links

[HIVE 100 similar projects report](../50_Source_History/R05_HIVE_100_similar_projects_report.md) · [Specialist structure](../10_Research/T02_Specialists/T02_Specialists.md) · [Inherited assumptions and disputed conclusions](../51_Prior_Methods/H11-Inherited-Claims-to-Recheck.md) · [Prior 100-project research catalog](00_Catalog_Index.md)
