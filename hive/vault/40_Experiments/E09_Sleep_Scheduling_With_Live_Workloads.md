---
id: "E09"
title: "Compare whole-system and per-specialist sleep during real service"
type: "experiment"
status: "proposed_not_run"
evidence_status: "hypothesis"
implementation_status: "not_run"
created: "2026-11-20"
tags:
  - hive
  - hive/experiment
---

# Compare whole-system and per-specialist sleep during real service

> **Status: proposed; not run.** Treat global sleep, staggered sleep and idle-only consolidation as live branches.

## Hypothesis

Staggered or workload-aware consolidation can preserve live-call and OBS quality while still producing useful learning.

## Arms

| Arm | Schedule |
|---|---|
| A | Global sleep during a declared maintenance interval |
| B | Per-specialist sleep with a frozen serving replica or alternate route |
| C | Idle-only learning triggered by measured resource headroom |
| D | Continuous low-priority learning |
| E | Frozen serving system with no learning, as service reference |

## Procedure

1. Replay the same call/OBS workload and incoming learning stream.
2. Include interruptions, rapid turn-taking, scene transitions and camera/filter load.
3. Define serving limits and learning freshness targets before each run.
4. Checkpoint learning jobs before preemption; promote only versioned candidates that pass evaluation.
5. Measure stale knowledge and deferred learning as well as foreground responsiveness.

## Measures and falsifier

- First audible response, p95/p99 response latency, barge-in recovery and audio gaps.
- OBS render/encode lag, dropped frames, VRAM/RAM peaks and service availability.
- Consolidation throughput, queue age, knowledge freshness and retention after resuming.
- **Falsifier:** scheduling meets latency only by indefinitely starving learning, or learning repeatedly disrupts service limits.
- **Revisit:** changed workload, hardware, replica cost or learning duration.

## Runs and outputs

- Pilot: recorded workload with injected interruptions.
- Confirmation: three workload orders × five runs; use task seeds where stochastic and retain real-time telemetry.
- Save scheduler decisions, interrupted/resumed checkpoint IDs, audio/OBS metrics and learning queue history.
- A per-specialist schedule is a HIVE engineering hypothesis, not an established Google result.

## Related research paths

[Communities and local recruitment](../10_Research/T03_Coordination/P10_Communities_and_local_recruitment.md) · [Local supervisors and intervention learning](../10_Research/T03_Coordination/P12_Local_supervisors_and_intervention_learning.md) · [Admission and residency](../10_Research/T07_Resources/P23_Admission_and_residency.md) · [Sleep without interrupting service](../10_Research/T07_Resources/P24_Sleep_without_interrupting_service.md) · [Live calls and supervisor streaming](../10_Research/T09_Applications/P29_Live_calls_and_supervisor_streaming.md) · [Biology and physical translation](../10_Research/T10_Research/P33_Biology_and_physical_translation.md)

## Related decisions

[When HIVE should sleep](../30_Decisions/D03_When_HIVE_should_sleep.md)
