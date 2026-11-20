---
id: "B08"
title: "Proposed repository and interfaces"
type: "build"
status: "proposed"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/build
---

# Proposed repository and interfaces

## Suggested boundaries

Adapt these to an existing repository; do not reorganize a working project without a reason.

| Area | Content |
|---|---|
| docs/research | This vault and source/decision records |
| contracts | Schemas and compatibility checks |
| runtime | Scheduler, task state, admission, cancellation |
| capabilities | Manifests and executor adapters |
| memory | Scoped stores and provenance |
| supervisors | Health monitoring and bounded repairs |
| learning | Candidate training, replay, dreams, consolidation |
| evaluation | Fixtures, metrics, comparison harness |
| integrations | Studio Brain, Graphify, Ruflo, media, audio, game |
| registry | Artifact versions and deployment pointers |
| runs | Immutable run manifests, raw outputs, summaries |

## Interfaces to implement

| Proposed interface | Meaning |
|---|---|
| capability.discover | Return verified available capabilities |
| task.submit / cancel / inspect | Durable execution control |
| memory.query / propose / supersede | Evidence-preserving knowledge operations |
| research.query / link / export | Typed research graph operations |
| candidate.create / evaluate | Controlled experimental update |
| release.promote / rollback | Switch exact compatible artifact versions |
| workload.measure | Collect application and resource traces |

These are design contracts, not commands known to exist in the user's installed tools.

## Included support files

- AGENTS.md: local implementation and research rules.
- tools/validate_vault.py: check generated links, node IDs, edge references, Canvas file references, and preserved source hashes.
- schemas/research_node.schema.json and research_edge.schema.json.
- schemas/capability_manifest.schema.json and experiment_record.schema.json.
- 99_Data/research_graph.json: portable node/edge export.
- Templates for research paths, source claims, experiments, decisions, and run records.

## Definition of the first completed release

One existing daily workflow improves under measured conditions; its repeated corrections produce a checked durable improvement; old behavior is retained within declared limits; the user can trace the change to source, history, experiment, and artifact; and competing research paths remain accessible.
