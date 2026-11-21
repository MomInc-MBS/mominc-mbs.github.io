# Capability Registry

## Video mission engineering alpha — 21 November 2026

Added local MP4/MOV plus SRT intake, deterministic caption normalization, optional pinned local-model cue selection, independent source/time checks, durable development feedback and atomic output reconciliation. Creative quality, audio alignment and an arbitrary-code sandbox are not claimed.

[Source, results, demo and limitations](/hive/notes/WORKING/).

## Latest executed increment: adaptive controller v0.2

**IMPLEMENTED / MEASURED; experimental checkpoints only.** The new controller
completed 30 real local-model calls. Direct model 3/6 → learned router 5/6;
it rejected a 4/6 regression, retained its checkpoint, then continued to
deterministic tools at 6/6. All 36 observations and decisions reverified in a
fresh process with zero new calls. Current v0.2.1 passed 136 tests and both CLI journeys; one Windows symlink
test was skipped. The measured run retains its v0.2.0 source snapshot.

[Executable controller, source, results and limits](/hive/notes/CONTROLLER/).
Last verified: **21 November 2026 UTC**. Repeated validation supports only this
finite selection experiment; broad learning and strong-baseline superiority
remain unproven. Earlier records below retain their original scope.


## Added capabilities: autonomous local prototype v0.1

Real local-model adapters, development-only learned routing, durable job recovery,
immutable artifacts and bounded automatic follow-up are implemented and exercised
in the [separate prototype](/hive/notes/PROTOTYPE/). Its 52 tests include fail-closed
verification, promotion controls and synthetic rollback. These capabilities do not
turn the earlier caption pilot into a model experiment. Model-weight training and
general compounding improvement remain unimplemented or unproven.

Last verified for this update: **21 November 2026 UTC**.

## Earlier caption-pilot inventory

**MEASURED local inventory; operational registry separate from the research graph.**

| Capability | Observed readiness | Contract / limit |
|---|---|---|
| CPU | AMD Ryzen 7 5800 8-Core Processor, 8 cores / 16 threads | CPU pilot, concurrency 1 |
| System RAM | 63.9 GiB | Worker peak working set measured on Windows; no hard process-tree memory sandbox |
| GPU | NVIDIA GeForce RTX 5070 Ti, 16303 MiB, 6358 MiB, 17 % | Point-in-time shared studio load, not per-task attribution |
| Python | Python 3.11.9 | Standard library engine |
| ffprobe | ffprobe version 9.0-full_build-www.gyan.dev Copyright (c) 2007-2026 the FFmpeg developers | Read-only SRT probe; 64 KiB input; 2-second tool timeout |
| Node | v24.19.0 | Existing site/test tooling only |
| Ollama | Service responded; one downloaded 9B Q4 model; no loaded models | Model+tools arm excluded; inference, startup and model quality unmeasured |
| LM Studio | Model endpoint unavailable during audit | Excluded; no service started or model swapped |
| Laya | Health endpoint unavailable | Routing remains transparent heuristic; no learned selector claimed |
| Studio Brain / Ruflo | Context and routing calls responded | Existing studio context only; not wired into pilot memory or model training |

The three baseline configurations are `rules`, `probe`, and `combined`. They are all deterministic software configurations. They satisfy a comparable three-configuration tool pilot; they do **not** stand in for the plan's proposed single-model and specialist-model arms. Candidate `probe-guard` validates semantics before conditionally invoking ffprobe.

[Executable capability registry](/hive/evidence/caption-pilot-1/capabilities.json) records adapter/version, supported task, health, required permissions, dependencies, budgets and source hash. [Hardware/software observations](/hive/evidence/caption-pilot-1/inventory.json) records the verification time. Local service addresses, process identities and private file paths are intentionally absent from the public artifacts.

## Archived experiments

The preserved `HIVE_Reproducible_Experiments.zip` contains 31 entries: learning, representation and scheduling simulation runners plus results/analyzers. Its pinned NumPy 2.3.5 / matplotlib 3.10.8 environment was not present (local NumPy 2.4.6; matplotlib absent). The archive reports Python 3.12.14; this run uses 3.11.9. It was inspected, not rerun or modified. Those are CPU simulations, not hardware scheduling or model-serving benchmarks.

## Resource limits and unknowns

Episodes record wall time, worker CPU time, worker peak RSS, tool calls, failures and retries. Wall time includes interpreter launch and tool startup. Separate model startup, per-tool process-tree CPU/RAM, VRAM per episode, queue wait and contention are unmeasured. A four-writer SQLite test establishes only small event-store concurrency, not agent/GPU scalability.


Last verified: **2026-11-21T04:27:34.3337389Z**. Evidence is a local CPU/tool pilot on synthetic fixtures. No production HIVE runtime, trained weights, or compounding-learning result is claimed.
