# Sol final scoped adversarial review

Reviewed repository `D:/Repos/hive-ai`, branch `build/working-prototype`, runtime
commit `28239aba838fa7f6b2d04719ec75d629d1b14308`, source SHA256
`c73866989d9c03253af8eb199b0c93509adbc50b92bcab7e0a29fde15db0d9d2`.
Documentation and verification-script changes were present outside that frozen
runtime. This review substitutes a bounded independent source review for the
incomplete Grok lane; it does not represent a Grok result.

Scope: governor, executor, integration controller, CLI recovery/rollback, finite
tool dispatch, Ollama identity checks, and artifact storage. Read-only inspection,
one deterministic isolated temporary-store reproducer, and the three focused
post-fix recovery tests below; no inference, full suite, private evaluator reads,
production approval, or nested workers.

## Historical finding: interrupted time debit lost after explicit resume

`src/hive/cli.py:121` calls `Store.recover()` directly. It requeues dead-owner
work without reconciling the executor's persisted `inflight` reservation.
`src/hive/orchestrator.py:136` subsequently charges that reservation only when
its own recovery call recovers a job. After CLI resume that list is empty.
The next dispatch at `src/hive/orchestrator.py:325` overwrites `inflight`.

Reproducer performed without model calls: create a RUNNING development job with
an absent owner PID, budget `{requests:1, tokens_reserved:128, tokens_actual:0,
wall_s:0, cycles:1}`, and `inflight={job:<id>, reserved_wall_s:120}`. Close the
executor; invoke `hive --store <temporary-store> resume`; reopen the executor and
call `recover()`.

Observed: resume returned the recovered ID, the next recovery returned `[]`,
the job was QUEUED, `wall_s` stayed zero, and `inflight` still contained 120.
Requests and generated-token reservations were preserved. Interrupted execution
time can nevertheless escape the intended conservative debit. This blocks a
claim that every crash plus explicit-resume combination preserves all budget
accounting. The already completed six-call mission and its recorded totals are
not changed by this finding.

Minimal repair: reconcile dead-owner recovery and its outstanding time debit
through one shared operation used by both CLI resume and Executor recovery;
commit requeue, debit and reservation clearing atomically, retaining protection
for a live owner. Add a focused crash -> explicit resume -> restart regression.
Any runtime repair needs a new runtime identity and its own verification; do not
silently resume the frozen experiment using changed source.

### Post-fix independent disposition

Resolved in the subsequent hardened working tree, inspected independently after
the parent patch. Its runtime source SHA256 is
`6ee9ae14b32ec6c9972bba693bb45395af5998516c4bc9de19dd5bbb5f550c99`.
At inspection HEAD remained `28239aba838fa7f6b2d04719ec75d629d1b14308` with
uncommitted recovery hardening; that HEAD alone does not identify the new source.

`Store.recover()` now requeues interrupted work, charges the matching conservative
time reservation and clears `inflight` in the same SQLite transaction.
`Executor.recover()` delegates to that shared operation, so CLI resume and worker
restart use the same accounting. The patch also settles a QUEUED, ownerless
reservation left by the historical CLI path, once. Live-owner work does not meet
the recovered-job or ownerless-queued condition.

Independent focused command, run from this repository:

```text
python -m pytest -q tests/integration/test_resume_accounting.py
...                                                                      [100%]
3 passed in 2.86s
```

The tests cover real dead-subprocess ownership plus repeated CLI resume and the
exhausted-wall barrier; injected failure after the debit write, proving atomic
rollback of debit/requeue/clear and successful later recovery; and idempotent
settlement of the legacy ownerless reservation. No inference was requested.
The inspected patch resolves the reproduced counterexample. This does not
extend the evidence to arbitrary external side effects or all possible faults.

Keep the original six-call run attached to source `c7386698...` and its frozen
source archive. The new source has focused hardening evidence, not a new real
model run. Refusing to replay the old mission under the changed runtime is the
correct identity behavior; no calls, budgets, or approvals are replenished.

## Checks supported by source inspection

- Governor validates task permissions and finite tool scope before ranking.
  Requested comparison routes are rechecked before reservation/dispatch.
- Model output reaches JSON parsing and allowlisted built-ins; it receives no
  shell, arbitrary file-write, database-write, or promotion authority. Tool
  arguments must match the supplied task inputs.
- Candidate feedback is separate from governing P0. Comparisons disable
  learning; the integration reports rejection or awaiting independent approval
  and does not promote a candidate. Experimental rollback leaves governing P0
  unchanged. CLI rollback acquires the root worker lock and integration lock.
- Earlier evidence-substitution and initialization findings are addressed:
  completed replay binds job/spec/task/route/evidence/source/config, checks
  utility and comparisons, and reconstructs the candidate from feedback refs;
  initial mission state is committed in one SQLite transaction.
- Configuration/source identities are frozen, requests/tokens are reserved
  before inference, and the local model is checked against its mission digest.

## Limits and disposition

No additional blocking permission, model-output authority, candidate-promotion,
or completed-report substitution issue was identified in this bounded review.
This is not a global security certification. Internal Python/SQLite APIs and the
local model endpoint assume a trusted caller and machine owner; the model has
no authority to alter those resources. Concurrent unrelated operator work in an
integration store is outside the demonstrated single-mission workflow.

The source supports the rejected-candidate interpretation of the completed
demonstration. Terra's separate objective receipts remain the acceptance
evidence; this review does not independently reproduce the six inference calls
or grant Level A, Level B, useful adaptive gain, frontier-model benefit, or
production policy authority. The recovery-accounting finding is resolved for
the hardened source and focused cases above; it remains a historical limitation
of the original measured source. No open blocker from this scoped review remains
in the inspected hardened patch.
