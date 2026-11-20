---
id: "B07"
title: "Learning and release contracts"
type: "build"
status: "proposed"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/build
---

# Learning and release contracts

## Candidate types

| Candidate | Changed artifact | Required retained behavior |
|---|---|---|
| Memory consolidation | Versioned external records/index | Source lineage and corrections preserved |
| Procedural learning | Tool, rule, or workflow | Repeated failure fixed without unrelated regressions |
| Routing learning | Selector policy/model | Calibrated choices and bounded overhead |
| Parametric learning | Head, adapter, or model checkpoint | New skill plus old-task retention |
| Graph learning | Community or routing configuration | Useful composition under held-out tasks |
| Protocol learning | Representation/translator | Compatible downstream behavior |

## Candidate sequence

1. Snapshot serving artifacts and task fixtures.
2. Declare the changed component and hypothesis.
3. Generate or select training material with provenance.
4. Run the bounded candidate update.
5. Evaluate new-task gains, retained tasks, costs, and interface compatibility.
6. Preserve the result whether it passes or fails.
7. Promote the exact tested artifact set when the declared gates pass.
8. Roll back to a compatible known version if serving checks regress.

## Data and capacity accounting

Count all weights, adapters, replay records, embeddings, indexes, external archives, provenance, and rollback copies when claiming bounded total storage.

A bounded RAM/VRAM experiment may allow persistent storage growth, but must report it and use a different claim. See [Test bounded memory, correction, retention and removal](../40_Experiments/E08_Bounded_Growth_Corrections_Unlearning.md).

## Foreground isolation

Training operates on a candidate artifact, not a live mutable serving checkpoint. The user-facing worker can keep running through another compatible artifact only if resource admission and workload tests permit it.

## Scope of self-improvement

The foundation can learn memory and procedures early. Router, adapter, backbone, graph, and protocol changes have independent experimental paths. This preserves the stronger HIVE goal while making each improvement attributable and reversible.
