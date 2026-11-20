---
id: "B02"
title: "Vault import and historical preservation"
type: "build"
status: "proposed"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/build
---

# Vault import and historical preservation

## Preferred first import

Open this package as a separate Obsidian vault. This preserves existing notes and gives the local agents a bounded area to work in.

To integrate into the existing vault:

1. Confirm its current path and take a normal local backup or versioned snapshot.
2. Create a new HIVE research subfolder without replacing unrelated notes.
3. Copy the package's content into that subfolder.
4. Keep relative Markdown links intact.
5. Prefix file-node paths inside the Canvas with the subfolder path, because Canvas paths are relative to the containing vault root.
6. Run the included validator against the package root; then verify Canvas navigation in Obsidian.

## Original evidence

The 19 recovered originals are copied without changing their bytes. [Recovered original documents](../90_Archive/00_Archive_Index.md) records original names, safe archive names, and SHA-256 hashes. The long project catalog has separate navigation cards while its complete source remains preserved.

Historical note content may contain old citations or platform-specific links that no longer resolve. Its wrapper records that fact; the new plan's generated internal links are checked separately.

## Ongoing imports

| Step | Output |
|---|---|
| Preserve original | Immutable bytes and hash |
| Extract text | Derived file with tool/version and extraction limits |
| Identify claim | Scoped proposition and exact source locator |
| Link history | Earlier method, decision, or experiment |
| Add interpretation | Separate current note, never silently rewrite the original |
| Admit to graph | Explicit relationship and evidence status |

Do not train on every imported note. Historical plans, failed proposals, synthetic examples, and accepted observations have different roles.

## Source history pages

Every recovered document has its own wrapper page with links to relevant methods, topics, and the original file. This is the first navigation layer; the method pages explain what changed across documents.
