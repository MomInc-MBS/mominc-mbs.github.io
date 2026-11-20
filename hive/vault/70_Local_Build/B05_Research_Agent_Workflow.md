---
id: "B05"
title: "Topic-based research-agent workflow"
type: "build"
status: "proposed"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/build
---

# Topic-based research-agent workflow

## One bounded research ticket

| Field | Requirement |
|---|---|
| Topic and path | Existing node or justified new node |
| Question | Specific mechanism and outcome |
| Scope | Workloads, models, resource assumptions, date window |
| History | Prior HIVE source/method links |
| Search lanes | Direct, competing, boundary, adjacent, implementation |
| Budget | Time, source count, tool calls, or compute cap |
| Outputs | Source cards, claims, unresolved questions, experiment proposal |
| Review | Independent source check and link validation |

## Source collection

Prefer original papers, author repositories, official documentation, released artifacts, and direct measurements. Use commentary as a lead to its underlying source.

Record preprint version and repository commit. A newly published blog may describe older research; store both dates.

## Expansion rule

For each path, ask:

- What other mechanism could produce the same result?
- Under what conditions would this approach fail?
- Which field studies the same constraint?
- Which variable have we held fixed without evidence?
- What can be implemented with existing local software?
- What result would change our mind?

Create a separate linked path when the mechanism, assumptions, or discriminating experiment meaningfully differ. Otherwise add evidence to the existing page.

## Stopping rule

End a research pass when it produces a reviewable decision or a clearly specified evidence gap with a next action. More notes are not the success metric.

## Synthesis rule

Keep original claims, interpretation, and recommended experiment separate. A reviewer checks source accuracy; the lead decides implementation priority. Neither deletes alternatives to make the graph appear conclusive.

## Update rule

A new source adds a versioned claim or revision. It may supersede a conclusion for named conditions. Retain the previous conclusion and the evidence that changed it.
