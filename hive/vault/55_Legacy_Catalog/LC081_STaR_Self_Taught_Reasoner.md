---
id: "LC081"
title: "STaR (Self-Taught Reasoner)"
type: "legacy_catalog_entry"
status: "historical_import_not_reverified"
evidence_status: "historical_import_not_reverified"
implementation_status: "not_assessed"
created: "2026-11-20"
tags:
  - hive
  - hive/legacy_catalog_entry
---

# STaR (Self-Taught Reasoner)

**Status:** historical import; current project condition and numerical claims are not reverified here.  
**Original catalog category:** Memory/Verification/Self-improvement  
**Original catalog label:** Succeeded — a prior classification, not this plan's experimental verdict.

## Prior description

A 2022 Stanford method that bootstraps LLM reasoning by iteratively generating chain-of-thought rationales, rationalizing wrong answers using the known correct answer, and fine-tuning only on rationales that yield correct answers.

## Research lead carried forward

Copy STaR's grounded self-improvement loop — generate attempts, keep only those verified against ground truth, retrain, repeat — but add a verifier/process check, since answer-only filtering lets spurious rationales slip through.

This is a historical suggestion to investigate. Adoption requires current primary evidence, a working interface, and a workload comparison.

## Original source trail

- [Original report source 1](https://arxiv.org/abs/2203.14465)
- [Original report source 2](https://github.com/ezelikman/STaR)
- [Original report source 3](https://ar5iv.labs.arxiv.org/html/2403.09629)
- [Original report source 4](https://github.com/goku2130/research-wiki/blob/HEAD/topics/self-improvement-and-self-play.md)

## Recheck before use

- Current maintainer/release state and exact source revision.
- Model, code, data, and downstream license terms.
- Local setup and supported invocation.
- Mechanism relevant to HIVE, with a competing approach.
- Reproducible evidence for the task rather than popularity or funding.

## Links

[HIVE 100 similar projects report](../50_Source_History/R05_HIVE_100_similar_projects_report.md) · [Memory, evidence, and knowledge graphs](../10_Research/T05_Memory/T05_Memory.md) · [Inherited assumptions and disputed conclusions](../51_Prior_Methods/H11-Inherited-Claims-to-Recheck.md) · [Prior 100-project research catalog](00_Catalog_Index.md)
