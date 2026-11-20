---
id: "E02"
title: "Measure the actual computer and concurrent workload"
type: "experiment"
status: "proposed_not_run"
evidence_status: "hypothesis"
implementation_status: "not_run"
created: "2026-11-20"
tags:
  - hive
  - hive/experiment
---

# Measure the actual computer and concurrent workload

> **Status: proposed; not run.** Starting inventory is user-reported RTX 5070 Ti, 64 GB DDR4, OBS, filters, videos, overlays and three cameras. Verify exact hardware and installed software locally.

## Hypothesis

The useful HIVE operating point changes materially between an idle PC and the user's real streaming workload.

## Arms

| Workload | Purpose |
|---|---|
| Idle operating system | Reference resource envelope |
| Normal OBS/camera scene | Real daily contention |
| OBS plus model inference | Serving capacity |
| OBS plus inference and background learning | Interference and scheduling limit |

## Procedure

1. Record device identity, usable VRAM/RAM, drivers, OS, power settings, disk and available runtimes.
2. Replay the same representative scene and audio sequence; record both cold-load and warm behavior.
3. Sweep model size, context, batch size and active workers within measured headroom.
4. Increase one resource consumer at a time; checkpoint interrupted learning jobs.
5. Retain the full latency/resource frontier instead of choosing a model by size alone.

## Measures and falsifier

- Peak/resident VRAM and RAM; model load time; throughput; p50/p95/p99 response latency.
- Audio underruns; first audible response; interruption recovery; OBS render/encode lag and dropped frames.
- Learning wall time, sustained temperature/power where measurable, and disk growth.
- **Falsifier:** a supposedly viable configuration misses the predeclared live-service limits repeatedly.
- **Revisit:** workload, driver, model, quantization, context or available hardware changes.

## Runs and outputs

- Pilot: a short scene replay and one learning micro-batch per candidate.
- Confirmation: three workload orders × five runs; stochastic seeds apply to generated tasks, not hardware facts. Extend only when variance warrants it.
- Save: verified inventory, scene/config hashes, timestamped telemetry, inference traces and feasible operating envelopes.

## Related research paths

[Local supervisors and intervention learning](../10_Research/T03_Coordination/P12_Local_supervisors_and_intervention_learning.md) · [Admission and residency](../10_Research/T07_Resources/P23_Admission_and_residency.md) · [Video production and posting](../10_Research/T09_Applications/P28_Video_production_and_posting.md) · [Live calls and supervisor streaming](../10_Research/T09_Applications/P29_Live_calls_and_supervisor_streaming.md) · [Horror haunt game](../10_Research/T09_Applications/P30_Horror_haunt_game.md)

## Related decisions

[Open design decisions](../05_Open_Decisions.md)
