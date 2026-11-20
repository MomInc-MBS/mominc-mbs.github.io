---
id: "HOME"
title: "HIVE framework and research vault"
type: "index"
status: "proposed"
evidence_status: "navigation"
implementation_status: "generated"
created: "2026-11-20"
tags:
  - hive
  - hive/index
---

# HIVE framework and research vault

**Prepared for Ian Myers · 20 November 2026 · Framework revision 0.2**

**Purpose:** build a persistent HIVE that assembles specialists, learns from verified experience, and improves its organization while keeping the research behind each choice inspectable.

## Start here

| Need | Open |
|---|---|
| Understand the new framework | [The proposed HIVE framework](01_Framework.md) |
| Explore topics and independent research paths | [Topic-first research map](03_Research_Map.md) |
| See what the Google evidence changes | [Google evidence and the change to HIVE](02_Google_Evidence_and_Change.md) |
| Compare unresolved design choices | [Open design decisions](05_Open_Decisions.md) |
| Review previous methods and actual results | [Previous research and attempted methods](06_Previous_Work.md) |
| Give the work to local coding agents | [Local coding-agent handoff](08_Local_Coding_Agent_Handoff.md) |
| Follow the build sequence and acceptance gates | [Local build roadmap and work packages](07_Local_Build_Roadmap.md) |
| Open the visual research map | [HIVE_Research_Map.canvas](HIVE_Research_Map.canvas) |
| Check software and readiness | [Existing software and readiness](70_Local_Build/B01_Existing_Software_and_Readiness.md) |
| Inspect sources and original documents | [Primary sources and source trail](60_Sources/00_Source_Index.md) · [Recovered original documents](90_Archive/00_Archive_Index.md) |

## What this revision changes

- Make consolidation and dreaming explicit experimental components with their own state, budgets, and acceptance tests.
- Preserve the earlier replay result and test the mechanisms that it did not cover: [Replay ordering and the reopened sleep branch](51_Prior_Methods/H03-Replay-and-Sleep.md) → [Sleep consolidation](10_Research/T01_Learning/P02_Sleep_consolidation.md) → [Test sleep, replay order, expansion and distillation independently](40_Experiments/E04_Sleep_Factorial.md).
- Keep independent specialists, shared adapters, internal experts, deterministic tools, and hybrids as live comparison paths: [Independent models or shared components](30_Decisions/D01_Independent_models_or_shared_components.md).
- Use research topics to organize knowledge; use measured transfer and interference to choose parameter-sharing boundaries: [How specialists should be grouped](30_Decisions/D07_How_specialists_should_be_grouped.md).
- Retain all original research and methods, including negative results and untested proposals.
- Build around the existing Obsidian, Studio Brain, Graphify source, Ruflo, coding harnesses, and model runtimes after local readiness checks: [Existing software and readiness](70_Local_Build/B01_Existing_Software_and_Readiness.md).

## Evidence convention

| Label | Meaning |
|---|---|
| Primary source reviewed | The cited source was inspected; its result is still the authors' result |
| Prior artifact audited | Recovered source/results were inspected; this is not a new training run |
| Historical import | Preserved prior research; current claims have not all been reverified |
| Proposed experiment | Designed here; no result is implied |
| Metaphor | Inspiration whose software translation needs a test |
| Unresolved | An evidence, implementation, or identity gap remains |

**This package is a research and implementation specification.** It contains a linked vault, source history, experiment designs, work packages, schemas, and a link/graph validator. It does not install HIVE on the PC or claim a live integrated benchmark.

## Use in Obsidian

1. Extract the ZIP and open its HIVE_Framework_Research_Vault folder as a vault.
2. Open this note, then the Canvas or Research Map.
3. Use Local Graph for a topic and follow links to experiments, history, decisions, and sources.
4. For integration into the existing vault, follow [Vault import and historical preservation](70_Local_Build/B02_Vault_Import_and_History.md); it preserves the current vault and adjusts Canvas file paths when needed.
5. Give [Local coding-agent handoff](08_Local_Coding_Agent_Handoff.md) and [AGENTS.md](AGENTS.md) to the local lead coding agent.

The design uses ordinary Markdown links and a standard JSON Canvas. No community plugin is required to read the plan. See [Obsidian Graph view](60_Sources/S10_Obsidian_Graph_view.md) and [JSON Canvas specification](60_Sources/S11_JSON_Canvas_specification.md).

## Full indexes

[Experiment index](40_Experiments/00_Experiment_Index.md) · [Biological and physical translation map](20_Metaphors/00_Metaphor_Index.md) · [Seed claims and evidence boundaries](61_Claims/00_Claim_Index.md) · [Prior 100-project research catalog](55_Legacy_Catalog/00_Catalog_Index.md) · [Reusable note templates](80_Templates/00_Templates.md) · [Package audit and validation scope](70_Local_Build/B09_Package_Audit.md)

