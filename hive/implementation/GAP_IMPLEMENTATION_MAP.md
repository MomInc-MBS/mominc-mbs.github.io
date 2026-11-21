# Known Gaps

## Updated gap scope: autonomous local prototype v0.1

Real local inference and feedback-driven routing now have evidence in the
[separate autonomous prototype](/hive/notes/PROTOTYPE/). The earlier caption-only
inventory below remains historical to that pilot. Open gaps include independent
new task families, strong-baseline superiority, memory/workflow/verifier ablations,
OS-enforced compute limits, and stronger evaluator isolation. The learned policy
remains quarantined. No general self-improvement or model-weight training is claimed.

Last verified for this update: **21 November 2026 UTC**.

## Earlier caption-pilot gap map

Every gap remains owned by the HIVE implementation maintainer; promotion authority remains Ian/operator. **Partial means partial, not complete.**

| Gap | Priority | Status | Files / evidence | Deciding experiment / dependency |
|---|---|---|---|---|
| G01 | P0 | IMPLEMENTED narrow cycle; improvement unproven | core.py / pilot.py / test_engine.py | Real-world held-out candidate gain |
| G02 | P0 | PARTIAL: five logged policies; heuristics uncalibrated | core.py; RoutingDecision / ExperimentPriority events | Calibrate success/cost/risk on new workloads |
| G03 | P0 | PARTIAL: real deterministic tool benchmark | pilot.py; capabilities.json; events.jsonl | Safe verified local-model arms |
| G04 | P0 | PLANNED: no compounding result | learning-curves.json; null learning-speed metric | Successive distributions and unchanged controls |
| G05 | P1 | PARTIAL: checker/tool ablation measured | EXPERIMENT_REGISTRY.json | Independent real-task counterfactual study |
| G06 | P1 | PARTIAL: constrained static router | core.py:route | Quality dataset before learned routing / exploration |
| G07 | P1 | IMPLEMENTED development-only curated export | pilot.py:curated_dataset; curated-dev.json | Real consented provenance-reviewed training data |
| G08 | P1 | IMPLEMENTED scoped capability registry | capabilities.json; captions.py | Model/service health and compatibility adapters |
| G09 | P1 | PARTIAL: actual worker resources and budgets | Episode.resources; concurrency test | Process-tree/VRAM/load/queue scheduling measurements |
| G10 | P1 | IMPLEMENTED local memory contracts | core.py:memory_add / memory_retrieve; tests | Integrate only with explicitly authorized partition owners |
| G11 | P1 | PARTIAL: reference-label error accounting | Verification records; false accepts/rejects | Independent human labels and probabilistic checker calibration |
| G12 | P2 | SPECIFIED and ranked heuristically | ARCHITECTURE_DECISIONS.md; ExperimentPriority | Measured research value against a deciding experiment |


## Phase gates

- Phase 0: inspected source/services/hardware/archive; a deterministic non-destructive baseline runs.
- Phase 1: task/registry/event/checker/benchmark pipeline implemented and exercised for three tool configurations. Model configurations excluded, not simulated.
- Phase 2: failure-to-procedure-to-evaluation-to-rejection cycle exercised. No accepted improvement or production release.
- Phase 3: static routing and tool/checker ablations exist. Learned organization superiority, model ensembles and bounded contextual exploration remain evidence-gated research.
- Phase 4: memory provenance/expiry/correction/rollback tests exist. Retrieval versus fine-tuning, isolated/shared adapters, replay/distillation/pruning, checkpoint swapping and forgetting remain unmeasured. No training checkpoint is available or justified for this workload.

Sleep-inspired consolidation is retained as a future testable deduplication/replay job, not a mechanism validated by this pilot. Real streaming and horror-game transfer remain follow-on work after a representative video-workflow result. Existing 100/1,000/10,000 logical-expert research paths and competing organizations remain intact.

## First-release checklist

- Checked local capability inventory, executed caption workflow and compared three deterministic configurations.
- Recorded task, capability, config, episode, verifier, failure, candidate and experiment contracts; release/memory contracts exercised in tests.
- Generated a bounded procedure from development failure evidence; froze rubric/splits; compared regressions and retained rejection evidence.
- Tested version restore and prior-config execution; kept production approval separate.
- **Not achieved:** accepted best-baseline improvement, real-model operation, compounding learning, independent fresh holdout generalization, hard hostile-code isolation, process-tree resource attribution.

[Exact supplied plan](/hive/notes/GAPPLAN/) remains the full specification; this map prevents deferred conditional work from being mistaken for delivered capability.


Last verified: **2026-11-21T04:27:34.3337389Z**. Evidence is a local CPU/tool pilot on synthetic fixtures. No production HIVE runtime, trained weights, or compounding-learning result is claimed.
