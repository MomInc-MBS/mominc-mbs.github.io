---
id: "LC037"
title: "Meta Llama 4 Maverick (MoE)"
type: "legacy_catalog_entry"
status: "historical_import_not_reverified"
evidence_status: "historical_import_not_reverified"
implementation_status: "not_assessed"
created: "2026-11-20"
tags:
  - hive
  - hive/legacy_catalog_entry
---

# Meta Llama 4 Maverick (MoE)

**Status:** historical import; current project condition and numerical claims are not reverified here.  
**Original catalog category:** MoE/Modular LLM  
**Original catalog label:** Failed — a prior classification, not this plan's experimental verdict.

## Prior description

Meta's open-weight, natively multimodal Mixture-of-Experts LLM with 17B active parameters out of 400B total across 128 experts and a 1M-token context window.

## Research lead carried forward

Copy Maverick's MoE efficiency idea — activating only a small expert subset per token — but avoid shipping a flagship once and letting it stagnate; HIVE needs continuous iteration and a hosted path, or it will be superseded the same way.

This is a historical suggestion to investigate. Adoption requires current primary evidence, a working interface, and a workload comparison.

## Original source trail

- [Original report source 1](https://ai.meta.com/blog/llama-4-multimodal-intelligence/)
- [Original report source 2](https://www.frankx.ai/blog/llama-4-analysis-2026)
- [Original report source 3](https://www.spheron.network/blog/meta-shut-down-the-llama-api-self-hosting-llama-is-now-offic/)
- [Original report source 4](https://codersera.com/blog/llama-4-complete-guide-2026/)

## Recheck before use

- Current maintainer/release state and exact source revision.
- Model, code, data, and downstream license terms.
- Local setup and supported invocation.
- Mechanism relevant to HIVE, with a competing approach.
- Reproducible evidence for the task rather than popularity or funding.

## Links

[HIVE 100 similar projects report](../50_Source_History/R05_HIVE_100_similar_projects_report.md) · [Specialist structure](../10_Research/T02_Specialists/T02_Specialists.md) · [Inherited assumptions and disputed conclusions](../51_Prior_Methods/H11-Inherited-Claims-to-Recheck.md) · [Prior 100-project research catalog](00_Catalog_Index.md)
