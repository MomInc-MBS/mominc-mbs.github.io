---
id: "P18"
title: "Obsidian and Graphify"
type: "research_path"
status: "proposed"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/research_path
---

# Obsidian and Graphify

**Parent topic:** [Memory, evidence, and knowledge graphs](T05_Memory.md)  
**Status:** research path; implementation and outcomes remain to be tested.

## Question

How should the human research vault connect to a machine-queryable graph?

## Retained branches

| Branch | Candidate mechanism | Current status |
|---|---|---|
| P18.A | Markdown notes and explicit typed edges | Retained for comparison |
| P18.B | Graphify-derived relationships with provenance | Retained for comparison |
| P18.C | A future database adapter if measured queries require it | Retained for comparison |

## Prototype to build

Use Obsidian for authored notes and navigation. Keep Graphify output as a rebuildable index. Store measured runs separately. Preserve stable IDs when titles or folders change.

## Measurement and failure condition

Test source-to-claim-to-experiment navigation, stale-index detection, duplicate merging, and round-trip export. An inferred edge is a discovery lead, not an accepted fact.

## Adjacent research avenues

Knowledge graphs; code dependency analysis; document retrieval.

Create a new path when one of these changes the mechanism or test; otherwise link new evidence here.

## Experiments and decisions

[Reproduce prior simulations and separate estimates from measurements](../../40_Experiments/E01_Reproduce_Prior_Work.md)  
[Knowledge and runtime storage](../../30_Decisions/D10_Knowledge_and_runtime_storage.md)

## Previous methods

[Prior HIVE corpus and evidence lineage](../../51_Prior_Methods/H01-Corpus-Lineage.md) · [Earlier architecture choices and open alternatives](../../51_Prior_Methods/H08-Architecture-Proposals.md)

## Biological or physical inspiration

[Sleep replay and consolidation](../../20_Metaphors/M01-sleep-replay.md) · [Immune discrimination and memory admission](../../20_Metaphors/M03-immune-admission.md)

## Sources to start from

[Graphify official repository](../../60_Sources/S09_Graphify_official_repository.md) · [Obsidian Graph view](../../60_Sources/S10_Obsidian_Graph_view.md) · [JSON Canvas specification](../../60_Sources/S11_JSON_Canvas_specification.md)

## Continue through the graph

[Topic-based research-agent workflow](../../70_Local_Build/B05_Research_Agent_Workflow.md) · [Evidence, disagreements, and research state](../../04_Evidence_and_Disagreement.md) · [Topic-first research map](../../03_Research_Map.md)

## Cross-topic connection

[Research-system improvement](../T10_Research/P34_Research_system_improvement.md)
