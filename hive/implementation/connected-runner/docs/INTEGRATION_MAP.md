# HIVE integrated flow

The `hive integration --manifest <manifest> --config <config>` command composes
the existing execution path. The recorded allocation is spent. The default
public inspection path is `python scripts/replay_integration_export.py`; see
the runbook before starting a new allocation or replaying a private store.

| Box | Existing/reused implementation | Current integration |
| --- | --- | --- |
| Task intake | `cli.py`, `task_spec.request_view` | Version 1 mission/task/permission contracts; frozen real file inventory and directive excerpts |
| Governor | `orchestrator.Executor`, new `governor.py` | Eligibility before explicit/automatic/retry selection; explainable per-route receipt |
| Registry/adapters | `model_registry.discover`, `adapters/ollama.py` | Installed model identity checked and pinned before reservation; no model download |
| Execution | `experiment_runner.execute`, `Executor.loop` | Same tool/model execution, resource ledger, global inference lock and job lifecycle |
| Evidence | `storage.Store` | SHA256 artifacts, SQLite events, input/output/config/source identities |
| Independent verifier | `verifier.verify`, `data_tasks.verify_output` | Separate inventory reduction; independently authored development labels |
| Feedback | Existing transactional `Policy.observe` path | Only verified development verdicts; idempotent job feedback; comparison learning disabled |
| Candidate comparison | `integration.py`, `adaptive_metrics.assess_candidate` | Frozen P1 vs unchanged P0, strongest applicable fixed route and learning-disabled control |
| Persistence | `Store`, `Checkpoints`, `integration.py` | Active P0 separate from candidate; reload, explicit experimental snapshot restore, production gates preserved |
| Operator | Existing CLI plus `integration`, `inspect`, experimental rollback | run/status/inspect/stop/resume/rollback use the existing durable store |

All these boxes are **WORKING in the scoped development flow**, with executed
receipts in `experiments/results/integration-smoke/20261121-run/report.json` and
`experiments/results/adaptation-demo/20261121-verification/`. The real missions
contain no stub model. Independent acceptance is a separate dated decision.
Production adaptation remains **PARTIAL**: candidate rejection is demonstrated,
while a beneficial independently approved promotion is not. Arbitrary isolated
repository execution and remote frontier-model adapters are **MISSING**.

The real model run used frozen commit `28239ab`, runtime SHA256
`c73866989d9c03253af8eb199b0c93509adbc50b92bcab7e0a29fde15db0d9d2`.
The latest runtime SHA256
`6ee9ae14b32ec6c9972bba693bb45395af5998516c4bc9de19dd5bbb5f550c99`
adds independently checked atomic interrupted-time settlement in `Store.recover`.
Its 252-test suite passed; no additional real model calls were made. Public
artifact replay names both source identities instead of changing the old run.

## Authority and replaceable boundaries

Model adapters return bounded text, model identity/digest, and measured output
tokens. They do not receive filesystem or execution authority. Task inputs,
allowed routes/tools, verifier contracts and resource reservations belong to the
controller. Today the real model adapter is Ollama; support for remote frontier
models is not claimed. The controller and artifact/verifier/policy contracts do
not depend on model size or neural architecture.

`config.routes` historically defines the policy search options. Explicit version
1 task permissions define the new execution allowlist. Legacy finite tasks retain
their existing built-in routes; a model's output cannot add one. Unapproved
candidate feedback cannot become the governing policy. The normal incumbent is
an explicit fixed baseline until a separately approved checkpoint exists.

Comparison is a controlled development experiment. The candidate is frozen after
training; all comparison arms use the same tasks, permissions, caps, executor and
verifier. Strict quality improvement and no critical regression are necessary.
An experimental comparison never itself provides independent production approval.
Experimental rollback restores candidate state only and records the unchanged
governing hash. Existing approved-checkpoint rollback remains a separate path.

## Frontier usefulness is the next hypothesis

The claim to test is that the same strong model, given the same task budget,
produces more independently accepted outcomes with HIVE's scoped tools,
persistent evidence, feedback and recovery than without them. A fair future
study must freeze the model/version, compare its strongest simple tool baseline,
include learning-disabled HIVE, use unused independently curated tasks and
account for the controller's cost. This integration smoke cannot establish that
claim. Level A and B remain governed by `PROTOTYPE_ACCEPTANCE.md`.
