---
id: "LC027"
title: "Google Switch Transformer"
type: "legacy_catalog_entry"
status: "historical_import_not_reverified"
evidence_status: "historical_import_not_reverified"
implementation_status: "not_assessed"
created: "2026-11-20"
tags:
  - hive
  - hive/legacy_catalog_entry
---

# Google Switch Transformer

**Status:** historical import; current project condition and numerical claims are not reverified here.  
**Original catalog category:** MoE/Modular LLM  
**Original catalog label:** Succeeded — a prior classification, not this plan's experimental verdict.

## Prior description

A Google Brain sparse Mixture-of-Experts Transformer that routes each token to exactly one expert, scaling to 1.6 trillion parameters at near-constant per-token compute.

## Research lead carried forward

Copy its lesson that the simplest possible routing (top-1, one expert per token) beats cleverer multi-expert schemes on stability, communication cost, and scaling — but avoid assuming experts specialize semantically, since later analyses show routing correlates more with syntax/position than topic.

This is a historical suggestion to investigate. Adoption requires current primary evidence, a working interface, and a workload comparison.

## Original source trail

- [Original report source 1](https://arxiv.org/abs/2101.03961)
- [Original report source 2](https://www.jmlr.org/papers/v23/21-0998.html)
- [Original report source 3](https://www.hpcwire.com/bigdatawire/2021/02/08/googles-new-switch-transformer-model-achieves-1-6-trillion-parameters-efficiency-gains/)

## Recheck before use

- Current maintainer/release state and exact source revision.
- Model, code, data, and downstream license terms.
- Local setup and supported invocation.
- Mechanism relevant to HIVE, with a competing approach.
- Reproducible evidence for the task rather than popularity or funding.

## Links

[HIVE 100 similar projects report](../50_Source_History/R05_HIVE_100_similar_projects_report.md) · [Specialist structure](../10_Research/T02_Specialists/T02_Specialists.md) · [Inherited assumptions and disputed conclusions](../51_Prior_Methods/H11-Inherited-Claims-to-Recheck.md) · [Prior 100-project research catalog](00_Catalog_Index.md)
