---
id: "H04"
title: "Scheduling, selective activation, and graph topology"
type: "prior_method"
status: "prior_artifact_reviewed"
evidence_status: "prior_artifact_reviewed"
implementation_status: "historical_record"
created: "2026-11-20"
tags:
  - hive
  - hive/prior_method
---

# Scheduling, selective activation, and graph topology

## Actually tried

The archived discrete-event study contains **1,440 runs and 345,600 simulated task requests**. It varied 4/8/16 workers, four graph topologies, selective versus broadcast activation, locality, load, and assumed communication costs. All workers shared one serial accelerator and four CPU message-service lanes.

| Workers available | Selective accelerator work/task | Broadcast work/task |
|---|---:|---:|
| 4 | 2.50 units | 4.01 units |
| 8 | 2.47 units | 8.00 units |
| 16 | 2.50 units | 16.00 units |

## What survives

- Available connections and activated workers are different variables.
- A central scheduler can coexist with direct data exchange.
- At low communication cost, the shared accelerator dominated latency; additional forwarding mattered more as message cost increased.

## Boundary

Costs were assumed normalized units, not measured GPU timings. Broadcast was defined to await every peer without adding answer-quality benefit. Finite traces were drained after arrival stopped; overloaded results are not steady-state capacity estimates. Loading, KV caches, batching, graph maintenance, and learned routing were absent.

## New path

Replay measured local service traces through the scheduler. Separately compare 100/1,000/10,000 registered capabilities, active worker counts, and residency policies. Preserve direct mesh, hub, community-tree, and bridge alternatives.

## Recovered source documents

[HIVE_Simulation_Findings_and_Starting_Plan](../50_Source_History/R15_HIVE_Simulation_Findings_and_Starting_Plan.md) · [HIVE_Reproducible_Experiments](../50_Source_History/R14_HIVE_Reproducible_Experiments.md)

## Current research connections

[Coordination and supervision](../10_Research/T03_Coordination/T03_Coordination.md) · [Resources and scale](../10_Research/T07_Resources/T07_Resources.md) · [Previous research and attempted methods](../06_Previous_Work.md)
