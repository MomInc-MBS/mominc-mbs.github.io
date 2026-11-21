# Independent review decisions

## NVIDIA / Nemotron — completed design critique

Configured provider/model: OpenCode `nvidia/nvidia/nemotron-3.5-lightning-30b-a3b`.
The delegated task completed and returned a critique; T3 did not separately report
an executed-model identifier. This is a remote design review, not local inference
or an executed experimental validation.

[Review receipt](t3-thread://v2/50b34497-15f3-472e-bf5c-62b0014ba111/thread:delegated-task:command%3Amcp%3Acf2e38a5-5627-4e31-a545-1e5c5d187a3e%3Adelegate-task%3A7146849f-5f0f-40c3-b842-ed3d28206cf0)

Accepted concerns: small samples/prior sensitivity, related task families,
exploration cost, separate cost/quality reporting, stale reliability and drift,
and the limits of shared-outcome offline replay. The report labels replay,
correlation, and lack of independent live reproduction. These limit promotion.

Rejected proposed criteria: equal-evidence reviewers need not agree only at
chance; deterministic verification should reproduce. Paired binary quality
differences are bounded [-1,1], so a Pareto heavy-tail test does not model this
quality statistic. Freezing a candidate before validation is a protection against
selection leakage, not evidence of overfitting. We retain one-use holdouts and do
not reopen them for policy tuning. Proposed numeric thresholds and asymptotic
rates were unsupported and are not adopted as requirements.

Executed countercheck: quality utility is linear/monotonic at fixed costs,
covered in tests/regression/test_review_gates.py. Objective and prior comparisons
are descriptive diagnostics, never replacements for hard evidence gates.

## Grok — completed code review

[Review receipt](t3-thread://v2/50b34497-15f3-472e-bf5c-62b0014ba111/thread:delegated-task:command%3Amcp%3Acf2e38a5-5627-4e31-a545-1e5c5d187a3e%3Adelegate-task%3A6407e753-83e7-4c54-9e99-7ef18aebc0c0)

Configured provider/model: Grok `grok-4.7-build-fast`. Completed read-only review;
no tests were run by the reviewer. ASTRA reproduced findings with regressions.

Fixed: verifier flags now require actual booleans and coherent numeric scores;
learning updates are idempotent by job; retries use an atomic once-only successor;
malformed task contracts finish with a classified blocker; unowned RUNNING
transitions are forbidden; approval requires an actual boolean; reviewer identity
comparison trims/casefolds; over-budget token evidence is rejected and cannot train;
production config forbids fixture adapters; checkpoint restoration controls actual
selection and verified critical regression restores the previous champion.
`resume` explicitly requeues RETRY_READY; mission budget increases cannot silently
override the frozen configuration. Tests are in
tests/adversarial/test_grok_counterexamples.py and tests/integration/test_pipeline.py.

Qualified holdout finding: the evaluator must retain labels to reproduce checks.
The single-user evaluator SQLite/artifact store is trusted; CLI development views,
public reports, model requests and learning inputs are separated. Unknown split
names are rejected, public holdout reports have fixed generic text, and a
repo-level consumption ledger prevents accidental cross-campaign reuse. This is
not an OS security boundary. A stronger multi-user evaluator service remains out
of scope; the README states the limitation.

Accepted gate limitation: a pure mathematical gate cannot authenticate its caller.
The campaign produces actual matched observations and fresh-process saved-output
verification, but marks independent experiment approval and fresh live inference
reproduction absent in its initial decision. The later six-case live reproduction
is recorded separately; independent approval remains absent. Model output cannot
grant promotion. Synthetic approvals exercise storage/rollback only.

## Grok — completed independent experiment review

[Review receipt](t3-thread://v2/50b34497-15f3-472e-bf5c-62b0014ba111/thread:delegated-task:command%3Amcp%3Acf2e38a5-5627-4e31-a545-1e5c5d187a3e%3Adelegate-task%3Aaf36013c-14cf-4120-b9b1-9a10b3710662)

Configured provider/model: Grok `grok-4.7-build-fast`. The reviewer recommends
QUARANTINE, explicitly withholding lab-route and production approval. The original
packet demonstrated deterministic saved-output replay, not fresh inference.
The reviewer accepted only descriptive, within-suite policy adaptation: the
candidate beats fixed direct and the learning-disabled ablation, ties greedy,
and loses to deterministic tools. Related templates cannot establish broad
superiority. The reviewer did not execute tests.

ASTRA disposition: retain QUARANTINE. The subsequent preregistered six-case
fresh-inference check passed all six scores with unchanged policy; it addresses
the narrow reproduction gap without overriding the reviewer or curing template
correlation. Its result is in experiments/results/C6-live-reproduction.json.
Validation scores, per-category aggregates, and zero model-token cost for the
tool-only baseline are included in C5-policy-comparison.json; they were omitted
from the short review packet. No holdout-specific failures are fed into learning.

Next falsifiable test: a new preregistered suite with independent families,
fresh holdout and an incorrect-tool negative control, under a new bounded mission.
A gain limited to the deliberately broken tool condition would not establish
general adaptation. No frozen prompts, weights or policy were changed after
holdout, and the consumed holdout is not reopened for tuning.

## Runtime promotion boundary

Code/design review is separate from a signed approval of experiment evidence.
An individual verified task never promotes a routing policy. The mathematical
gate fails closed on missing provenance, incomplete regression evidence,
insufficient/ambiguous improvement, non-independent review, or missing fresh
process reproduction. Synthetic promotion/rollback tests demonstrate mechanisms;
they do not establish a learned policy's superiority.
