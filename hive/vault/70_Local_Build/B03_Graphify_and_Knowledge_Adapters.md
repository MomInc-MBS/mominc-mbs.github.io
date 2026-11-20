---
id: "B03"
title: "Graphify and knowledge adapters"
type: "build"
status: "proposed"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/build
---

# Graphify and knowledge adapters

## Responsibilities

| Surface | Owns | Must not silently imply |
|---|---|---|
| Obsidian | Authored research notes, decisions, navigation | A linked claim is true |
| Graphify | Derived code/document relationships for retrieval | An inferred relation is evidence |
| Studio Brain | Existing vault retrieval interface | Every retrieved note is current |
| Runtime event store | Executed tasks and outcomes | A proposed experiment was run |
| Model registry | Exact serving and candidate artifacts | A note edit retrained a model |

Graphify's official source describes deterministic AST code analysis and model-assisted semantic processing for some document/media inputs. Check the locally installed revision and provider configuration: [Graphify official repository](../60_Sources/S09_Graphify_official_repository.md).

## Adapter contract to implement

| Operation | Required result |
|---|---|
| inventory | Supported formats, version, entrypoint, provider/locality |
| ingest(snapshot) | Input hashes, index revision, skipped/error records |
| query(question, filters) | Node IDs, source paths, locators, relation type, derivation |
| neighbors(node_id) | Typed edges with provenance |
| invalidate(source_hash) | Stale derived records identified |
| export(snapshot) | Rebuildable nodes and edges |

These are HIVE interface requirements, not claims that Graphify exposes commands with these names.

## Initial workflow

- Inspect D:/External Tools/graphify and its checked-out instructions.
- Smoke-test on a small source subset.
- Confirm whether document processing can run through a configured local model.
- If it cannot, keep raw-note and deterministic code paths usable while recording the semantic path as unavailable.
- Preserve Graphify's extracted/inferred distinction and HIVE's claim status separately.
- Compare retrieval against simple filename/text search and direct links.
- Rebuild after source changes; never trust a stale index without its source revision.

## First graph questions

- Which prior experiment actually tested this claim?
- Which result challenges the preferred method?
- Which metaphor motivated this implementation?
- Which code modules implement the mechanism?
- Which task and resource assumptions would reopen the decision?
