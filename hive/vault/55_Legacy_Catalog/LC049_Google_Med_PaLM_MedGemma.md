---
id: "LC049"
title: "Google Med-PaLM / MedGemma"
type: "legacy_catalog_entry"
status: "historical_import_not_reverified"
evidence_status: "historical_import_not_reverified"
implementation_status: "not_assessed"
created: "2026-11-20"
tags:
  - hive
  - hive/legacy_catalog_entry
---

# Google Med-PaLM / MedGemma

**Status:** historical import; current project condition and numerical claims are not reverified here.  
**Original catalog category:** Specialist/Adapter  
**Original catalog label:** In Progress — a prior classification, not this plan's experimental verdict.

## Prior description

Google's medical specialist LLM lineage — Med-PaLM/Med-PaLM 2 as closed research models, succeeded by MedGemma, an open-weight Gemma 3-based family (4B multimodal and 27B text/multimodal) for medical text and image comprehension.

## Research lead carried forward

Copy the specialist-adapter pattern — domain-tune a strong general base, ship small open weights that run on-prem, and gate claims with benchmarks plus per-use-case validation — and avoid a closed, expensive single-purpose API that frontier general models can supersede.

This is a historical suggestion to investigate. Adoption requires current primary evidence, a working interface, and a workload comparison.

## Original source trail

- [Original report source 1](https://developers.google.com/health-ai-developer-foundations/medgemma/model-card)
- [Original report source 2](https://cloud.google.com/vertex-ai/generative-ai/docs/release-notes)
- [Original report source 3](https://history.itlibra.com/en/events/med-palm-2022)
- [Original report source 4](https://news.longevitydocs.org/technology/medgemma-open-medical-ai-model-nature-medicine)

## Recheck before use

- Current maintainer/release state and exact source revision.
- Model, code, data, and downstream license terms.
- Local setup and supported invocation.
- Mechanism relevant to HIVE, with a competing approach.
- Reproducible evidence for the task rather than popularity or funding.

## Links

[HIVE 100 similar projects report](../50_Source_History/R05_HIVE_100_similar_projects_report.md) · [Specialist structure](../10_Research/T02_Specialists/T02_Specialists.md) · [Inherited assumptions and disputed conclusions](../51_Prior_Methods/H11-Inherited-Claims-to-Recheck.md) · [Prior 100-project research catalog](00_Catalog_Index.md)
