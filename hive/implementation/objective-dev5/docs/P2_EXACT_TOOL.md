# P2 exact-tool preference (experimental)

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
