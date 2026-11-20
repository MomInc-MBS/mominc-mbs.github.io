---
id: "LC044"
title: "FrugalGPT / LLM routing (Stanford)"
type: "legacy_catalog_entry"
status: "historical_import_not_reverified"
evidence_status: "historical_import_not_reverified"
implementation_status: "not_assessed"
created: "2026-11-20"
tags:
  - hive
  - hive/legacy_catalog_entry
---

# FrugalGPT / LLM routing (Stanford)

**Status:** historical import; current project condition and numerical claims are not reverified here.  
**Original catalog category:** Orchestration/Enterprise  
**Original catalog label:** Stalled/Abandoned — a prior classification, not this plan's experimental verdict.

## Prior description

Stanford's FrugalGPT is a cost-aware LLM cascade that tries cheap models first and escalates to expensive ones only when a learned scorer judges the answer unreliable.

## Research lead carried forward

Copy the cheap-first, quality-gated cascade with a hard per-task budget, but avoid maintaining a bespoke scorer — use a modern learned router or commercial routing and validate savings in shadow mode on HIVE's own traffic.

This is a historical suggestion to investigate. Adoption requires current primary evidence, a working interface, and a workload comparison.

## Original source trail

- [Original report source 1](https://arxiv.org/abs/2305.05176)
- [Original report source 2](https://github.com/stanford-futuredata/FrugalGPT)
- [Original report source 3](https://zylos.ai/research/2026-05-06-ai-agent-multi-model-orchestration-runtime-selection/)

## Recheck before use

- Current maintainer/release state and exact source revision.
- Model, code, data, and downstream license terms.
- Local setup and supported invocation.
- Mechanism relevant to HIVE, with a competing approach.
- Reproducible evidence for the task rather than popularity or funding.

## Links

[HIVE 100 similar projects report](../50_Source_History/R05_HIVE_100_similar_projects_report.md) · [Coordination and supervision](../10_Research/T03_Coordination/T03_Coordination.md) · [Inherited assumptions and disputed conclusions](../51_Prior_Methods/H11-Inherited-Claims-to-Recheck.md) · [Prior 100-project research catalog](00_Catalog_Index.md)
