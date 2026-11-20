---
id: "LC078"
title: "Self-Refine"
type: "legacy_catalog_entry"
status: "historical_import_not_reverified"
evidence_status: "historical_import_not_reverified"
implementation_status: "not_assessed"
created: "2026-11-20"
tags:
  - hive
  - hive/legacy_catalog_entry
---

# Self-Refine

**Status:** historical import; current project condition and numerical claims are not reverified here.  
**Original catalog category:** Memory/Verification/Self-improvement  
**Original catalog label:** Succeeded — a prior classification, not this plan's experimental verdict.

## Prior description

A training-free method in which a single LLM generates a draft, critiques its own output, and iteratively refines it using that feedback.

## Research lead carried forward

Copy the cheap generate-feedback-refine loop with bounded iterations, but ground feedback with an external verifier and a hard stopping rule rather than trusting same-model self-critique alone.

This is a historical suggestion to investigate. Adoption requires current primary evidence, a working interface, and a workload comparison.

## Original source trail

- [Original report source 1](https://arxiv.org/abs/2303.17651)
- [Original report source 2](https://github.com/madaan/self-refine)
- [Original report source 3](https://selfrefine.info/)
- [Original report source 4](https://backpropagation.ai/posts/ai-agent-collaboration-icml-iclr-neurips-survey/)

## Recheck before use

- Current maintainer/release state and exact source revision.
- Model, code, data, and downstream license terms.
- Local setup and supported invocation.
- Mechanism relevant to HIVE, with a competing approach.
- Reproducible evidence for the task rather than popularity or funding.

## Links

[HIVE 100 similar projects report](../50_Source_History/R05_HIVE_100_similar_projects_report.md) · [Memory, evidence, and knowledge graphs](../10_Research/T05_Memory/T05_Memory.md) · [Inherited assumptions and disputed conclusions](../51_Prior_Methods/H11-Inherited-Claims-to-Recheck.md) · [Prior 100-project research catalog](00_Catalog_Index.md)
