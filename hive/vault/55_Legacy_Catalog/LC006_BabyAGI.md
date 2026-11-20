---
id: "LC006"
title: "BabyAGI"
type: "legacy_catalog_entry"
status: "historical_import_not_reverified"
evidence_status: "historical_import_not_reverified"
implementation_status: "not_assessed"
created: "2026-11-20"
tags:
  - hive
  - hive/legacy_catalog_entry
---

# BabyAGI

**Status:** historical import; current project condition and numerical claims are not reverified here.  
**Original catalog category:** Multi-agent framework  
**Original catalog label:** Stalled/Abandoned — a prior classification, not this plan's experimental verdict.

## Prior description

An open-source experimental autonomous-agent framework by Yohei Nakajima, originally a ~140-line Python script looping task creation, execution, and reprioritization with GPT-4 and a vector store, later rebuilt as a 'self-building' function framework.

## Research lead carried forward

Copy BabyAGI's canonical create-prioritize-execute loop as the minimal agent primitive, but avoid its fatal flaw: unbounded self-generated task loops with no verification, cost budget, or termination condition.

This is a historical suggestion to investigate. Adoption requires current primary evidence, a working interface, and a workload comparison.

## Original source trail

- [Original report source 1](https://github.com/yoheinakajima/babyagi)
- [Original report source 2](https://www.promptquorum.com/power-local-llm/babyagi-review-autonomous-agent)
- [Original report source 3](https://www.agentichistory.org/faq.html)
- [Original report source 4](https://github.com/fyodoriv/minsky/blob/HEAD/competitors/babyagi.md)

## Recheck before use

- Current maintainer/release state and exact source revision.
- Model, code, data, and downstream license terms.
- Local setup and supported invocation.
- Mechanism relevant to HIVE, with a competing approach.
- Reproducible evidence for the task rather than popularity or funding.

## Links

[HIVE 100 similar projects report](../50_Source_History/R05_HIVE_100_similar_projects_report.md) · [Coordination and supervision](../10_Research/T03_Coordination/T03_Coordination.md) · [Inherited assumptions and disputed conclusions](../51_Prior_Methods/H11-Inherited-Claims-to-Recheck.md) · [Prior 100-project research catalog](00_Catalog_Index.md)
