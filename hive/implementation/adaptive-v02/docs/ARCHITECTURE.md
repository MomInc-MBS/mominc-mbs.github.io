# Executable architecture v0.1

Target: D:/Repos/hive-ai, build/autonomous-v0.1. No live deployment.

The task contract separates prompts from evaluator-only answers. The runner
produces evidence, the deterministic verifier measures it, and the store records
immutable artifacts. The orchestrator enforces budgets and state transitions.
Policy updates accept valid development feedback only. Validation and locked
holdout results never update policy; the orchestrator owns access separation.

Policy is a category-bucketed finite route selector, not model weight training.
Snapshots include the complete random generator state and observed counters.
A restored random policy produces the same subsequent choices. Route lists must
already be feasible, or callers may pass a mapping of route names to boolean
feasibility. Ties use supplied route order. Fixed selects the first route.

The independent review gate is a pure fail-closed function. Its required evidence
keys are documented in src/hive/review_gate.py. Caller-provided flags alone are
not proof: the orchestrator must validate artifact hashes, evaluator provenance,
reviewer identity, separate locked holdout evaluation, and actual fresh-process
reproduction before setting them. A favorable utility never overrides hard gates.
Missing evidence quarantines; explicit gate failure rejects. Promotion does not
itself train a policy. Only approved checkpoints can become champion, preserving
rollback independently of selection state.

v0.1 intentionally uses finite routes, deterministic tools and code-patch choices.
It does not execute model-authored code, train model weights, run a distributed
runtime, or promise continued work after the bounded local executor exits.
