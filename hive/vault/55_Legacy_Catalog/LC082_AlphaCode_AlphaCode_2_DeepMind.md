---
id: "LC082"
title: "AlphaCode / AlphaCode 2 (DeepMind)"
type: "legacy_catalog_entry"
status: "historical_import_not_reverified"
evidence_status: "historical_import_not_reverified"
implementation_status: "not_assessed"
created: "2026-11-20"
tags:
  - hive
  - hive/legacy_catalog_entry
---

# AlphaCode / AlphaCode 2 (DeepMind)

**Status:** historical import; current project condition and numerical claims are not reverified here.  
**Original catalog category:** Specialist/Adapter  
**Original catalog label:** Succeeded — a prior classification, not this plan's experimental verdict.

## Prior description

DeepMind's competitive-programming code-generation system that samples many candidate programs from a fine-tuned transformer (Gemini Pro in AlphaCode 2) and filters, clusters, and reranks them by executing tests to submit only the best few.

## Research lead carried forward

Copy the sample-generate, execute, cluster-by-behaviour, and rerank loop with a cheap deterministic verifier, but avoid brute-force massive sampling without a strict cost/sample budget.

This is a historical suggestion to investigate. Adoption requires current primary evidence, a working interface, and a workload comparison.

## Original source trail

- [Original report source 1](https://deepmind.google/blog/competitive-programming-with-alphacode/)
- [Original report source 2](https://storage.googleapis.com/deepmind-media/AlphaCode2/AlphaCode2_Tech_Report.pdf?ref=blog.mlq.ai)
- [Original report source 3](https://techcrunch.com/2023/12/06/deepmind-unveils-alphacode-2-powered-by-gemini/)

## Recheck before use

- Current maintainer/release state and exact source revision.
- Model, code, data, and downstream license terms.
- Local setup and supported invocation.
- Mechanism relevant to HIVE, with a competing approach.
- Reproducible evidence for the task rather than popularity or funding.

## Links

[HIVE 100 similar projects report](../50_Source_History/R05_HIVE_100_similar_projects_report.md) · [Specialist structure](../10_Research/T02_Specialists/T02_Specialists.md) · [Inherited assumptions and disputed conclusions](../51_Prior_Methods/H11-Inherited-Claims-to-Recheck.md) · [Prior 100-project research catalog](00_Catalog_Index.md)
