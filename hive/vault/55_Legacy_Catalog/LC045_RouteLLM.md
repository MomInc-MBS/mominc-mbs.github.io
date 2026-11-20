---
id: "LC045"
title: "RouteLLM"
type: "legacy_catalog_entry"
status: "historical_import_not_reverified"
evidence_status: "historical_import_not_reverified"
implementation_status: "not_assessed"
created: "2026-11-20"
tags:
  - hive
  - hive/legacy_catalog_entry
---

# RouteLLM

**Status:** historical import; current project condition and numerical claims are not reverified here.  
**Original catalog category:** Orchestration/Enterprise  
**Original catalog label:** Stalled/Abandoned — a prior classification, not this plan's experimental verdict.

## Prior description

An open-source LMSYS/UC Berkeley framework that trains lightweight routers on Chatbot Arena preference data to send each query to a cheap weak model or an expensive strong model via an OpenAI-compatible API.

## Research lead carried forward

Copy its preference-trained, threshold-calibrated strong/weak routing for cost savings, but avoid shipping a frozen learned router — retrain continuously or use explicit tiers with fallbacks so new models do not silently invalidate routing.

This is a historical suggestion to investigate. Adoption requires current primary evidence, a working interface, and a workload comparison.

## Original source trail

- [Original report source 1](https://github.com/lm-sys/RouteLLM)
- [Original report source 2](https://www.lmsys.org/blog/2024-07-01-routellm/)
- [Original report source 3](https://arxiv.org/abs/2406.18665)
- [Original report source 4](https://www.routeplane.app/blog/2026-07-model-router-graveyard/)

## Recheck before use

- Current maintainer/release state and exact source revision.
- Model, code, data, and downstream license terms.
- Local setup and supported invocation.
- Mechanism relevant to HIVE, with a competing approach.
- Reproducible evidence for the task rather than popularity or funding.

## Links

[HIVE 100 similar projects report](../50_Source_History/R05_HIVE_100_similar_projects_report.md) · [Coordination and supervision](../10_Research/T03_Coordination/T03_Coordination.md) · [Inherited assumptions and disputed conclusions](../51_Prior_Methods/H11-Inherited-Claims-to-Recheck.md) · [Prior 100-project research catalog](00_Catalog_Index.md)
