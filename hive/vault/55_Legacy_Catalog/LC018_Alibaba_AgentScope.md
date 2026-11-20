---
id: "LC018"
title: "Alibaba AgentScope"
type: "legacy_catalog_entry"
status: "historical_import_not_reverified"
evidence_status: "historical_import_not_reverified"
implementation_status: "not_assessed"
created: "2026-11-20"
tags:
  - hive
  - hive/legacy_catalog_entry
---

# Alibaba AgentScope

**Status:** historical import; current project condition and numerical claims are not reverified here.  
**Original catalog category:** Multi-agent framework  
**Original catalog label:** In Progress — a prior classification, not this plan's experimental verdict.

## Prior description

Alibaba Tongyi Lab's open-source (Apache 2.0), production-ready multi-agent framework built around ReAct agents, with tool/MCP/skill management, multi-agent team orchestration, sandboxed execution, observability, and a multi-tenant FastAPI agent service.

## Research lead carried forward

Copy its trust/visibility design — ReAct core, unified event bus streaming reasoning and tool calls, fine-grained permissions and human-in-the-loop, sandboxed workspaces, and multi-tenant agent service — but avoid its 1.x-to-2.0 breaking API refactor without a smoother migration path.

This is a historical suggestion to investigate. Adoption requires current primary evidence, a working interface, and a workload comparison.

## Original source trail

- [Original report source 1](https://github.com/agentscope-ai/agentscope)
- [Original report source 2](https://arxiv.org/abs/2402.14034)
- [Original report source 3](https://arxiv.org/abs/2508.16279)
- [Original report source 4](https://agentgid.com/agents/agentscope/)

## Recheck before use

- Current maintainer/release state and exact source revision.
- Model, code, data, and downstream license terms.
- Local setup and supported invocation.
- Mechanism relevant to HIVE, with a competing approach.
- Reproducible evidence for the task rather than popularity or funding.

## Links

[HIVE 100 similar projects report](../50_Source_History/R05_HIVE_100_similar_projects_report.md) · [Coordination and supervision](../10_Research/T03_Coordination/T03_Coordination.md) · [Inherited assumptions and disputed conclusions](../51_Prior_Methods/H11-Inherited-Claims-to-Recheck.md) · [Prior 100-project research catalog](00_Catalog_Index.md)
