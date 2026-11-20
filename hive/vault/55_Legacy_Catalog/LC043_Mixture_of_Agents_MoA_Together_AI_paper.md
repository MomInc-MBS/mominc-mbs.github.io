---
id: "LC043"
title: "Mixture-of-Agents (MoA, Together AI paper)"
type: "legacy_catalog_entry"
status: "historical_import_not_reverified"
evidence_status: "historical_import_not_reverified"
implementation_status: "not_assessed"
created: "2026-11-20"
tags:
  - hive
  - hive/legacy_catalog_entry
---

# Mixture-of-Agents (MoA, Together AI paper)

**Status:** historical import; current project condition and numerical claims are not reverified here.  
**Original catalog category:** Multi-agent framework  
**Original catalog label:** Succeeded — a prior classification, not this plan's experimental verdict.

## Prior description

A layered inference-time method in which multiple LLM proposers independently answer a prompt and aggregator LLMs synthesize their outputs into a single improved response, with no fine-tuning.

## Research lead carried forward

Copy MoA's layered proposer-aggregator synthesis for high-value, checkable outputs where quality justifies extra calls, but avoid it as a default interactive path because of its latency and token cost.

This is a historical suggestion to investigate. Adoption requires current primary evidence, a working interface, and a workload comparison.

## Original source trail

- [Original report source 1](https://arxiv.org/abs/2406.04692)
- [Original report source 2](https://github.com/togethercomputer/MoA)
- [Original report source 3](https://docs.together.ai/docs/mixture-of-agents)
- [Original report source 4](https://www.together.ai/blog/together-moa?format=webp)

## Recheck before use

- Current maintainer/release state and exact source revision.
- Model, code, data, and downstream license terms.
- Local setup and supported invocation.
- Mechanism relevant to HIVE, with a competing approach.
- Reproducible evidence for the task rather than popularity or funding.

## Links

[HIVE 100 similar projects report](../50_Source_History/R05_HIVE_100_similar_projects_report.md) · [Coordination and supervision](../10_Research/T03_Coordination/T03_Coordination.md) · [Inherited assumptions and disputed conclusions](../51_Prior_Methods/H11-Inherited-Claims-to-Recheck.md) · [Prior 100-project research catalog](00_Catalog_Index.md)
