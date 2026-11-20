---
id: "LC099"
title: "Amazon Bedrock Agents / multi-agent collaboration"
type: "legacy_catalog_entry"
status: "historical_import_not_reverified"
evidence_status: "historical_import_not_reverified"
implementation_status: "not_assessed"
created: "2026-11-20"
tags:
  - hive
  - hive/legacy_catalog_entry
---

# Amazon Bedrock Agents / multi-agent collaboration

**Status:** historical import; current project condition and numerical claims are not reverified here.  
**Original catalog category:** Orchestration/Enterprise  
**Original catalog label:** Failed — a prior classification, not this plan's experimental verdict.

## Prior description

Amazon Bedrock Agents' multi-agent collaboration is a managed AWS service in which a supervisor agent decomposes complex tasks and delegates them to up to 10 specialized collaborator agents with their own tools, knowledge bases, and guardrails.

## Research lead carried forward

Copy the supervisor/collaborator specialization, per-agent tools/guardrails, and observability pattern, but avoid depending on a vendor-owned managed orchestration loop that can be frozen and superseded — HIVE should own its orchestration loop and treat the platform as runtime, memory, and identity only.

This is a historical suggestion to investigate. Adoption requires current primary evidence, a working interface, and a workload comparison.

## Original source trail

- [Original report source 1](https://aws.amazon.com/blogs/machine-learning/amazon-bedrock-announces-general-availability-of-multi-agent-collaboration/)
- [Original report source 2](https://docs.aws.amazon.com/bedrock/latest/userguide/agents-classic-maintenance-mode.html)
- [Original report source 3](https://aws.amazon.com/blogs/machine-learning/design-multi-agent-orchestration-with-reasoning-using-amazon-bedrock-and-open-source-frameworks/)
- [Original report source 4](https://aws.amazon.com/about-aws/whats-new/2025/03/amazon-bedrock-multi-agent-collaboration/)

## Recheck before use

- Current maintainer/release state and exact source revision.
- Model, code, data, and downstream license terms.
- Local setup and supported invocation.
- Mechanism relevant to HIVE, with a competing approach.
- Reproducible evidence for the task rather than popularity or funding.

## Links

[HIVE 100 similar projects report](../50_Source_History/R05_HIVE_100_similar_projects_report.md) · [Coordination and supervision](../10_Research/T03_Coordination/T03_Coordination.md) · [Inherited assumptions and disputed conclusions](../51_Prior_Methods/H11-Inherited-Claims-to-Recheck.md) · [Prior 100-project research catalog](00_Catalog_Index.md)
