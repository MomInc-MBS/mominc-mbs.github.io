# Integration review and dispositions

Review date: 21 November 2026 Las Vegas (22 November UTC).
Measured runtime SHA256: `c73866989d9c03253af8eb199b0c93509adbc50b92bcab7e0a29fde15db0d9d2`.
Measured implementation commit: `28239aba838fa7f6b2d04719ec75d629d1b14308`.
Later hardened runtime SHA256: `6ee9ae14b32ec6c9972bba693bb45395af5998516c4bc9de19dd5bbb5f550c99`.
Reviews do not grant production authority or replenish inference allocations.

## NVIDIA/Nemotron statistical perspective

Completed through the OpenCode provider configured with
`nvidia/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`, medium variant.
The provider returned no separate `executedModel` override. Scope was read-only;
the reviewer reported partial reads and failed to verify the target Git branch
from its inherited `D:/` directory. Root independently verified the correct
repository/branch and checked each claim. This is a limited external critique,
not a complete methodological acceptance or replication.

Preserved final findings:

1. Add a `split` parameter/holdout mode to `Policy.observe` for learning-disabled control.
2. Add a holdout split to the manifest for unbiased comparison.
3. Add an `approve` method to the policy for independent approval.
4. Extend policy snapshots with selected routes/decision data.
5. The frontier-gain claim is unsupported.

Dispositions, checked against frozen source:

| Finding | Disposition and evidence |
| --- | --- |
| 1 | Factual correction: `Policy.observe(..., valid=True, split='development')` already rejects non-development feedback. `integration._job` passes `learn_feedback=False` for every comparison/control and subsequent task. The candidate hash is checked after comparison; learning-disabled selects unchanged fixed P0. No additional policy mode is needed for this control. |
| 2 | Valid limit for a future performance claim; not a missing requirement of the separate-development integration demonstration. `load_manifest` requires disjoint training/comparison/subsequent tasks, all explicitly development. No holdout, Level A/B, or unbiased generalization claim is made. Do not rename exposed tasks as holdouts. |
| 3 | Approval belongs outside the mutable learning policy. Existing `Checkpoints`/review gates handle approved authority; the integration reports `AWAITING_INDEPENDENT_APPROVAL` at most and never promotes. Actual P1 failed and was rejected. Adding self-approval to `Policy` would weaken this separation. |
| 4 | Context is already preserved separately: immutable governance artifacts, each execution's `decision_ref`, frozen comparison choices, `comparison_decisions`, task/spec/source/config hashes and the execution index. Keeping these references beside the candidate snapshot avoids confusing execution history with policy parameters. |
| 5 | Accepted. The result supports a scoped executable integration/recovery demonstration only. It shows a candidate regression, not useful adaptive gain, model-weight learning, general intelligence, or benefit to frontier models. |

The rejected candidate's quality delta was -0.5 on two development comparison
tasks against each fixed control. This is descriptive, not a population estimate.
The three controls overlap in route choice because the strongest applicable
inventory route is the tool and the classification contract permits only the
installed local model. They are explicitly executed controls, not evidence of
three independent statistical samples. Future frontier comparisons require a
strong model's independently chosen best simple baseline and full cost accounting.

## Independent verification

Terra's separate receipts and acceptance decision are under
`experiments/results/adaptation-demo/20261121-terra/`. Terra accepted the bounded
`INTEGRATED_PROTOTYPE_DEMONSTRATED` gate on the valid rejected-candidate path,
including sixteen passing focused recovery checks. The reviewer independently
authored the labels before model execution, reproduced all eleven evidence
bundles and P1 from feedback, and tested corrupted evidence/candidates in an
isolated backup with no added model calls. Recovery claims apply to the current
finite read-only tool/model flow. Arbitrary external side effects require their
own isolation and idempotency acceptance before being added.

## Recovery review and resolved blocker

Sol reproduced a real interruption-accounting bug: CLI `resume` requeued a
dead-owner job through `Store.recover` before `Executor.recover` could debit
its reserved wall time. Repeated dispatch could overwrite the uncharged
reservation. The completed real mission had no such interrupted job, so its
recorded outputs and spend are unaffected.

The latest source settles reserved time, clears the reservation and requeues
atomically in `Store.recover`, also covering legacy ownerless queued
reservations. Sol independently passed all three added regressions: repeated
CLI resume, an injected transaction failure, and the legacy orphan case. The
complete hardened-source suite passed 252 tests with two Windows symlink skips.
The measured six-call source remains archived separately; no new inference was
performed or attributed to the hardened source. Full finding, reproducer and
disposition: `reviews/integration-sol-final-20261121.md`.

The configured Grok review produced no substantive output during its bounded
review window. Cancellation was requested after about nineteen minutes; it is
recorded as incomplete, not a completed independent review. Sol performed the
adversarial recovery review above. No consensus or provider label grants
production approval, Level A/B acceptance, or a larger inference allocation.
