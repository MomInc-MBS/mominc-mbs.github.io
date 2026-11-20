---
id: "E10"
title: "Scale 100, 1,000 and 10,000 logical experts with measured active workers"
type: "experiment"
status: "proposed_not_run"
evidence_status: "hypothesis"
implementation_status: "not_run"
created: "2026-11-20"
tags:
  - hive
  - hive/experiment
---

# Scale 100, 1,000 and 10,000 logical experts with measured active workers

> **Status: proposed; not run.** Expert registry size, available parameter sets and simultaneously running models are different quantities.

## Hypothesis

A large catalog of specialized roles/modules can remain useful with a smaller, dynamically scheduled active set; indexing, routing and coordination may become the bottlenecks.

## Arms

| Dimension | Values to retain |
|---|---|
| Logical expert registry | 100 / 1,000 / 10,000 entries |
| Active workers | Sweep from measured hardware feasibility; no fixed two-model cap |
| Representation | Prompts/tools / adapters / independent checkpoints / hybrid |
| Routing | Flat lookup / hierarchical routing / retrieval-assisted selection |
| Scheduling | Resident / queued / cached loading / mixed |

## Procedure

1. Benchmark registry/index operations with synthetic entries and explicit simulated task costs.
2. Separately run real models at measured active-worker counts.
3. Populate meaningful distinct specialists for capability tests; duplicated labels do not create new expertise.
4. Measure warm and cold selection, loading, fanout, contention and failure recovery.
5. Calibrate the simulation against measured runs; mark extrapolations beyond observed conditions.

## Measures and falsifier

- Route quality and search time; cache hit rate; queue wait; loading cost; useful concurrency.
- Task success per total cost; duplicated work; cascade failures; RAM/VRAM/disk footprint.
- **Falsifier:** larger catalogs add noise/overhead without improved held-out task coverage, or simulated gains fail in real runs.
- **Revisit:** better indexing, distinct expert training, hardware changes or new task diversity.

## Runs and outputs

- Pilot: synthetic scheduling sweep and a small calibrated real-model run.
- Confirmation: three task orders × five seeds per selected configuration; expand with variance/power needs.
- Save registry manifest, distinct capability coverage, actual active counts, simulation assumptions and real runtime traces.
- Report orchestration scalability separately from intelligence or model-capability improvement.

## Related research paths

[Communities and local recruitment](../10_Research/T03_Coordination/P10_Communities_and_local_recruitment.md) · [Adaptive graph and grouping](../10_Research/T03_Coordination/P11_Adaptive_graph_and_grouping.md) · [Logical expert scale](../10_Research/T07_Resources/P22_Logical_expert_scale.md) · [Admission and residency](../10_Research/T07_Resources/P23_Admission_and_residency.md)

## Related decisions

[Central or distributed control](../30_Decisions/D05_Central_or_distributed_control.md) · [Growth, compression, and scale](../30_Decisions/D08_Growth_compression_and_scale.md)
