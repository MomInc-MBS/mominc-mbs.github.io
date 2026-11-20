---
id: "E04"
title: "Test sleep, replay order, expansion and distillation independently"
type: "experiment"
status: "proposed_not_run"
evidence_status: "hypothesis"
implementation_status: "not_run"
created: "2026-11-20"
tags:
  - hive
  - hive/experiment
---

# Test sleep, replay order, expansion and distillation independently

> **Status: proposed; not run.** This design separates data schedule, added capacity and consolidation mechanisms. It is not a reproduction claim.

## Hypothesis

Consolidation improves retention beyond extra capacity, training examples, feedback or compute.

## Implementation class — declare before running

- **Paper-faithful candidate:** specified architecture, equations, tasks and implementation choices match the selected paper version; list unresolved details before claiming a reproduction.
- **Partial implementation:** named components are omitted or replaced; record every deviation.
- **HIVE analogue:** external notes, agent routing or adapter workflows imitate a mechanism at system level; evaluate their own outcomes.
- Research specification: [Google Sleep paper](https://arxiv.org/html/2606.03979v2).

## Factor A: wake-update data schedule only

| Value | Examples available during wake updates |
|---|---|
| Current-only wake | Current task only |
| Interleaved wake | Current and old examples mixed within batches |
| Blocked wake | Current and old examples in separate batches |

Offline data has a separate manifest: `none`, `verified replay`, `teacher samples`, or `filtered synthetic`. A current-only **wake** arm may rehearse offline; label that fact. A current-only **total-learning** arm cannot rehearse offline: those cells are **NA**.

## Factor B: mechanism contract

| Arm | Updated modules and operations |
|---|---|
| Ordinary updates | Update designated fast module F; no added slow capacity, consolidation or reset |
| Expansion without sleep | Unlock matched slow capacity S; train it by ordinary wake updates; no consolidation/reset/dreaming |
| Matched-capacity distillation | Fixed target adapter with matched storage/trainable capacity; same scheduled distillation budget; no hierarchical transfer/reset/dreaming |
| Sleep without dreaming | Fast F → slower S consolidation, then conditional reset; no synthetic rehearsal stage |
| Full proposed sleep | Same consolidation/reset plus the declared dreaming stage |

For parameter-learning arms, name F/S tensors, backbone freeze policy, update periods, ranks and allocated/active slots. An external-memory analogue identifies its corresponding stores instead of claiming tensor-level equivalence.

## Paper-style mechanism specification

- Snapshot the pre-update teacher; compute but defer the fast-module update.
- Build the candidate with the prospective update and added slow capacity; train only designated new parameters.
- Use GKD/on-policy distillation plus LTI semantic/edit-similarity reward; log coefficients, sampling mixture and reward-model version.
- Dreaming: extra random expert activation, generated candidates, selection, then specified refinement.

**HIVE acceptance rule:** reset temporary fast slots only after retention/new-learning checks pass and the replacement checkpoint is durable. Otherwise retain the original state. Record this gate as an implementation addition.

## Compatibility and comparisons

- Use **NA**, with a reason, when the required trainable modules, expert routing or data permissions are absent.
- A frozen retrieval baseline has no wake-update schedule; it sits outside the factorial.
- Match expansion/capacity ledgers; add reset/no-reset and objective ablations when a contrast changes several mechanisms.
- Screen cheaply; confirm selected contrasts on unseen examples/orders. Preserve all screened results.

## Measures, falsifier and outputs

- Measure before learning, after each task, after consolidation and after reset.
- Count all updates, examples generated/scored/discarded, external feedback, verifier/router fanout, wall time and total stored growth.
- Report fixed-compute and fixed-example comparisons separately; include old/new accuracy, corrections and serving delay.
- **Falsifier:** gains disappear under matched controls, or reset destroys retained knowledge. **Revisit:** implementation gaps or changed workloads.
- Pilot: one short stream. Confirmation: three task orders × five seeds by default, revised using variance/power.
- Save compatibility matrix, preregistered contrasts, module/update manifest, seeds, hashes, raw scores and deviation log.

## Related research paths

[Sleep consolidation](../10_Research/T01_Learning/P02_Sleep_consolidation.md) · [Internal experts and expandable memory](../10_Research/T02_Specialists/P07_Internal_experts_and_expandable_memory.md) · [Fair comparison and replication](../10_Research/T10_Research/P32_Fair_comparison_and_replication.md) · [Biology and physical translation](../10_Research/T10_Research/P33_Biology_and_physical_translation.md)

## Related decisions

[Open design decisions](../05_Open_Decisions.md)
