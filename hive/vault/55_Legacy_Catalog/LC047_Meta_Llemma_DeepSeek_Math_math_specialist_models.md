---
id: "LC047"
title: "Meta Llemma / DeepSeek-Math (math specialist models)"
type: "legacy_catalog_entry"
status: "historical_import_not_reverified"
evidence_status: "historical_import_not_reverified"
implementation_status: "not_assessed"
created: "2026-11-20"
tags:
  - hive
  - hive/legacy_catalog_entry
---

# Meta Llemma / DeepSeek-Math (math specialist models)

**Status:** historical import; current project condition and numerical claims are not reverified here.  
**Original catalog category:** Specialist/Adapter  
**Original catalog label:** Succeeded — a prior classification, not this plan's experimental verdict.

## Prior description

Open math-specialist language models created by continued pretraining on large math corpora — Llemma (EleutherAI/Princeton, built on Meta's Code Llama, not a Meta model) and DeepSeekMath (DeepSeek, 7B, later V2) — for competition math and formal theorem proving.

## Research lead carried forward

Copy domain continued-pretraining plus a verifiable reward/self-verification loop, but avoid shipping a narrow standalone specialist that a general reasoning model will absorb — build the verifier as a reusable HIVE capability instead.

This is a historical suggestion to investigate. Adoption requires current primary evidence, a working interface, and a workload comparison.

## Original source trail

- [Original report source 1](https://arxiv.org/abs/2310.10631)
- [Original report source 2](https://arxiv.org/abs/2402.03300)
- [Original report source 3](https://arxiv.org/abs/2511.22570)
- [Original report source 4](https://github.com/deepseek-ai/DeepSeek-Math)

## Recheck before use

- Current maintainer/release state and exact source revision.
- Model, code, data, and downstream license terms.
- Local setup and supported invocation.
- Mechanism relevant to HIVE, with a competing approach.
- Reproducible evidence for the task rather than popularity or funding.

## Links

[HIVE 100 similar projects report](../50_Source_History/R05_HIVE_100_similar_projects_report.md) · [Specialist structure](../10_Research/T02_Specialists/T02_Specialists.md) · [Inherited assumptions and disputed conclusions](../51_Prior_Methods/H11-Inherited-Claims-to-Recheck.md) · [Prior 100-project research catalog](00_Catalog_Index.md)
