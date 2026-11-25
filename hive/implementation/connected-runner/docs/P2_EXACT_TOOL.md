# P2 exact-tool requirement and isolated feedback (experimental)

The current candidate is opt-in **P2 revision v4**, included in runtime dev6.
P0/v1, v2 and the published dev5 P2/v3 behavior remain available. The governing
default is unchanged. The historical v3 description follows below.

For the existing exact categories, v4 allows only the eligible deterministic
tool. Removing its permission, grant or availability causes abstention; an
explicit model request cannot bypass this requirement. Model-required
classification retains its permitted model path, subject to its existing
identity, verifier and resource checks. No fallback authorization is inferred
from a model's confidence or availability.

The existing Executor derives a typed TaskContract before selection, containing
the outcome, permitted tools/routes, source attribution, label sensitivity,
verifier hashes, timeout and immutable resource caps. It contains no expected
answer, input payload or prompt. Source groups remain declared provenance, not
proof of independence. Absolute deadlines and classified-source declarations
are currently unsupported and are rejected rather than silently ignored.

Decisions bind that contract and identify eligible/rejected routes, reasons,
reserved resources and either compatible verified partition statistics or
unmeasured confidence. Replay reconstructs the contract from the original
mission configuration, separately from the shorter effective execution timeout.

Valid development verdicts produce immutable outcome-feedback and route-skill
records. Partition keys bind source, split, route, permissions, verifier and
model/tool runtime identity. Wrong answers contribute zero successes; invalid
verdicts, validation and holdout data do not train. The v4 memory-off flag is
frozen in its snapshot and prevents memory influence and updates. No private
agent memory is imported. Exact source matching is conservative isolation,
not evidence of transfer to new sources.

Supported snapshots always contain the memory flag. A manually incomplete v4
state currently defaults a missing flag to enabled; strict rejection of that
malformed trusted-state input remains a hardening gap. Approved hashed snapshots
cannot lose the flag without changing identity. Feedback elapsed time includes
verification/artifact work and is recorded diagnostic data, not independently
reproduced proof of a deadline or the separate wall-budget accounting.

Updates remain in the experimental candidate snapshot. They do not change the
frozen governing snapshot or its next decision. Existing checkpoint, comparison
and human promotion gates remain responsible for any later adoption. This
cycle changes controller policy and evidence handling; model weights stay fixed.

Replay checks the saved feedback against its job, decision, contract, partition,
independent verdict, pinned learning gates and resource counts. It validates
both original mission and effective execution configuration hashes without
instantiating recorded adapters. It does not independently reconstruct every
historical route-skill aggregate. The public comparison export checks that its
feedback-disabled arms leave those aggregates unchanged.

If a process dies after v4 feedback was committed, recovery can finish from
that verified observation without redispatch or double learning, while settling
known token charges once. Existing STOP and resource barriers still apply. If
the last cycle or other cap is exhausted, the job stays queued with its stop
reason and needs operator reconciliation; the controller does not raise caps
or clear STOP to finish metadata. Legacy-policy rollback archives a stale v4
candidate before accepting legacy feedback. These bounded checks do not prove
exactly-once arbitrary external actions.

Run the bounded engineering comparisons with fresh output directories:

```powershell
python scripts/p2_abstention_comparison.py --work .hive/p2-negative-demo --output .hive/p2-negative-demo.json
python scripts/p2_tool_comparison.py --policy-version 4 --work .hive/p2-output-demo --output .hive/p2-output-demo.json
```

The first uses explicit non-inference availability/fault fixtures and executes
real rejection paths. It measures no model output quality. The second runs the
same six public data inputs through the strongest tool, frozen learning-disabled
controller and candidate; it records charged budgets and observed time through
saved-output inspection. Model/team arms remain blocked without a new finite
allocation. `P2_VERIFICATION_MATRIX.md` maps the required counterexamples.

## Historical P2 v3 contract, preserved

P2 is an opt-in, quarantined policy identity (`Policy(version=3)`). It applies
after route governance has filtered permissions, tool scope, pinned model
availability, verifier/runtime checks, and resource barriers. For the existing
exact built-in categories, it prefers `tool` only when that route remains
eligible. If it is unavailable, P2 keeps the eligible policy choice (including
a permitted pinned specialist) or abstains when nothing is eligible.

P2 does not treat repository patch application or video clip selection as an
exact answer computation. `code_mission` and `video_clips` are not in its exact
category set. Model-required text classification remains on a permitted local
model route and abstains when that route fails its gates. Every tool output
still passes the existing independent verifier; changing an output does not
change evaluator labels or make a failed result pass.

The execution decision receipt records policy version and route attribution
(`p2_exact_tool_preference`, `policy_selection`, `explicit_request`, or
`abstention`) alongside task, source, configuration, and policy hashes and the
eligible routes. Historical P0/v1 and v2 selection behavior and snapshots remain
unchanged. Existing wrong labels and receipts are preserved.

P2 is not the governing default and this change does not promote it. The
development-fixture checks establish routing and rejection mechanics only;
they are not a quality comparison, learning gain, or acceptance result. The matched six-task development comparison now records six ties against the
strongest tool, with zero HIVE model requests. Independent reviews accepted the
bounded mechanics and rejected any inference of quality gain; P2 remains
quarantined. See `experiments/results/next-loop-20261121/comparison.json`.

Schema v3 deliberately reuses v2's exact-category choices. Its increment is
source-bound auditability and availability checks, not a demonstrated change in
quality. Attribution distinguishes the runtime hash from a computed input hash,
a declared source group (not an attestation of independence), evaluator name and
verifier file hashes. The P2 caller checks evaluator files and a missing-output
rejection canary before any reservation. This establishes availability and one
negative check; failures during later verification still fail closed.

Fresh-process replay dereferences the hashed decision receipt, checks its embedded
copy and task/route/runtime identities, and recomputes input/evaluator attribution.
Missing, changed or rebound P2 decision receipts are rejected. These additions are
limited to schema v3 so historical v1/v2 evidence can still be reproduced.
