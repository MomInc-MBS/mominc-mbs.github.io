---
id: "B06"
title: "Benchmark and measurement plan"
type: "build"
status: "proposed"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/build
---

# Benchmark and measurement plan

## The three application laboratories

| Laboratory | Frozen first task set | Quality | Operational measures |
|---|---|---|---|
| Video | Existing media jobs and recorded failures | Valid artifacts, correct metadata/queue state | Completion time, repeat failures, human corrections |
| Calls and streaming | Recorded interactions under normal OBS load | Correct relevant response and recovery | First useful response, silence, p50/p95, interruptions, dropped frames |
| Horror haunt | Reproducible room/scene and encounter states | Spatial correctness, goal completion, recovery | Frame/step latency, map drift sensitivity, prediction error |

Use one lab as the initial vertical slice while keeping the others available as transfer tests. The first choice follows measured availability, not an invented assumption about which app is already integrated.

## Comparison discipline

- Baselines receive equivalent tools, evidence, retrieval, feedback, and fallback access.
- Equal token counts do not imply equal computation.
- Record training, verification, routing, translation, discarded candidates, and model loading.
- Separate fixed-capacity results from growth-allowed results.
- Use chronological corrections and delayed retention tests.
- Keep final task compositions and seeds separate from development.
- Preserve timeouts, nonattainment, and failed runs.

## Pilot versus confirmatory evaluation

Use a small smoke test to find instrumentation and interface faults. Then estimate variance and select meaningful sample sizes. Five seeds and three task orderings are a starting design from prior planning, not a universal statistical guarantee.

Set quality, latency, retention, and intervention targets before the confirmatory run. Evaluate average and worst protected task performance.

## Required run artifact

Code commit; environment lock; model/base/adapter hashes; data and split hashes; source labels; configuration; hardware; actual resource traces; seeds/orders; timestamps; raw outputs; checks; errors; metrics; and interpretation.

No benchmark score enters an accepted conclusion without the corresponding run record or an explicit author-reported label.
