# Decision Ledger

| Decision | Alternatives retained | Evidence / confidence | Revisit trigger |
|---|---|---|---|
| Use standard-library SQLite + JSON artifacts | Major graph DB, distributed event bus | Append-only/concurrent tests; high for this small local workload | Measured write/contention or retrieval bottleneck |
| Keep runtime capability registry separate from research graph | Research pages as execution authority | Registry executable IDs and hashes; high | New supported operational component |
| Start CPU deterministic caption validation | Local-model plus tool, specialist groups | Model unavailable/occupied hardware; real ffprobe available; high | Existing safe loaded model and useful model-specific task |
| Keep strongest simple control | Probe-only control, combined tools | Rules wins development selection and held-out comparison; scoped high | Source-disjoint real captions expose a rule limitation |
| Reject current candidate promotion | Accept correction versus weak tool-only arm | Equal best quality, no sufficient cost benefit; high in synthetic pilot | Practical held-out benefit under unchanged gates |
| Freeze/record trusted procedure choices | Arbitrary generated code, autonomous permissions | Bounded adapter subprocess; high for pilot, no hostile isolation | OS sandbox/Job Objects needed for untrusted extensions |
| Procedures before weights | Retrieval, isolated/shared adapters, core model update | No justified trainable checkpoint or task gain; medium | Real workflow failures justify a controlled learning study |

Reviewer: implementation agent plus separate read-only requirements/code review. Approval authority: Ian/operator; review is not deployment approval.

## Research queue tied to decisions

1. Hypothesis: real captions expose failures the fixed rules miss. Experiment: independent labeled video/SRT sample with frozen source-disjoint holdout. Decision: whether another procedure/model earns its cost.
2. Hypothesis: contextual routing reduces cost without quality loss. Experiment: varied task conditions, static controls, logged eligible alternatives and bounded exploration. Decision: whether to replace static selection.
3. Hypothesis: retrieval resolves recurring corrections before fine-tuning is needed. Experiment: compare no-memory, retrieval and reusable-procedure arms; only then test a compatible isolated adapter. Decision: whether parameter training is warranted.
4. Hypothesis: consolidation reduces stale/conflicting memory errors. Experiment: versioned deduplication/replay job, counterfactual retrieval and rollback. Decision: whether to schedule a sleep-inspired job.

`core.py:experiment_priority` records probability, future gain, cost, risk, scarce usage and uncertainty. Its initial values are explicitly heuristic, not calibrated probabilities. Competing designs stay visible and can reopen after contradictory evidence.


Last verified: **2026-11-21T04:27:34.3337389Z**. Evidence is a local CPU/tool pilot on synthetic fixtures. No production HIVE runtime, trained weights, or compounding-learning result is claimed.
