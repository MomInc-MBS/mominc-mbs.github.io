---
id: "LC028"
title: "Google GLaM"
type: "legacy_catalog_entry"
status: "historical_import_not_reverified"
evidence_status: "historical_import_not_reverified"
implementation_status: "not_assessed"
created: "2026-11-20"
tags:
  - hive
  - hive/legacy_catalog_entry
---

# Google GLaM

**Status:** historical import; current project condition and numerical claims are not reverified here.  
**Original catalog category:** MoE/Modular LLM  
**Original catalog label:** Failed — a prior classification, not this plan's experimental verdict.

## Prior description

Google's Generalist Language Model (GLaM) is a sparsely activated mixture-of-experts language-model family whose largest model has 1.2 trillion parameters but activates only about 97 billion per token.

## Research lead carried forward

Copy GLaM's sparse top-2 expert routing — activate a small subset per token to scale capacity without proportional compute — but avoid building a named model that is research-only with no product, API, or maintenance path.

This is a historical suggestion to investigate. Adoption requires current primary evidence, a working interface, and a workload comparison.

## Original source trail

- [Original report source 1](https://arxiv.org/abs/2112.06905v2)
- [Original report source 2](https://en.wikipedia.org/wiki/List_of_large_language_models)
- [Original report source 3](https://theaidatabase.com/m/glam-google.html)

## Recheck before use

- Current maintainer/release state and exact source revision.
- Model, code, data, and downstream license terms.
- Local setup and supported invocation.
- Mechanism relevant to HIVE, with a competing approach.
- Reproducible evidence for the task rather than popularity or funding.

## Links

[HIVE 100 similar projects report](../50_Source_History/R05_HIVE_100_similar_projects_report.md) · [Specialist structure](../10_Research/T02_Specialists/T02_Specialists.md) · [Inherited assumptions and disputed conclusions](../51_Prior_Methods/H11-Inherited-Claims-to-Recheck.md) · [Prior 100-project research catalog](00_Catalog_Index.md)
