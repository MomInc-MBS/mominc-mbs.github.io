# Autonomous local prototype — v0.1

**IMPLEMENTED / MEASURED. Learned candidate QUARANTINED.** HIVE now has a local
Python/SQLite executor that calls a real local model, verifies its outputs,
retains evidence across restarts, and changes routing from development feedback.
This is a separate experiment from the earlier [caption pilot](/hive/notes/BASELINE/).
It demonstrates policy adaptation within a small synthetic suite, not general
superiority or model-weight training. The public website remains a static record.

Last verified: **21 November 2026 UTC (20 November locally)**.
Source commit: `9c6c33170d0d94bb0aecbbadc2842ad7731136de` in the local HIVE repo.
The [publication manifest](/hive/implementation/autonomous-v01-publication.json)
binds the exported files and download to that commit.

## What runs

- A task declares measurable success criteria before execution. The CLI selects
  a model/tool route, records requests, outputs and resource usage, and checks the
  result with an independent deterministic verifier.
- A durable SQLite queue retains ownership, history, feedback and checkpoints.
  A real failed development task automatically queued a successful tool follow-up.
  Process-crash recovery, stop/resume, stale-owner rejection and rollback are tested.
- Fixed, random, greedy and UCB policies are compared. Beta reliability and
  cost-aware utility update only from valid development observations. Alternative
  objectives and prior sensitivity are descriptive diagnostics.
- The candidate freezes before validation. Holdout IDs are consumed before
  dispatch; validation and holdout outputs never update the policy. Promotion
  requires trusted independent evidence review. No real candidate was promoted.

## Recorded experiment

One real Ollama model: `myr5-hold-local:latest`, Qwen 9B Q4_K_M, on an RTX 5070 Ti.
Exact model digest:
`a45646773d1ee8a6c1557c7de09a68e78a74f2990c4174a1408f65e777db150c`.
The preregistered matrix contains **18 development, 12 validation and 24 held-out
tasks**, six synthetic families, three routes, 108 model calls and 162 observations.
The policies below replay shared outcomes; they are not separate online deployments.

| Policy | Held-out verified passes |
|---|---:|
| Fixed direct model | 12/24 |
| Learning disabled | 12/24 |
| Seeded random | 16/24 |
| Greedy | 23/24 |
| UCB | 23/24 |
| Deterministic tools | 24/24 |
| Fixed model-plus-tool team | 24/24 |

The UCB-minus-direct quality difference is 0.4583; the descriptive paired 95%
bootstrap interval is [0.25, 0.6667]. The rows share six family templates, so this
interval cannot establish broad statistical superiority. Greedy ties UCB;
deterministic tools outperform both. The learning-disabled comparison supports a
within-suite contribution from learned routing, not an advantage over the best tool.

The campaign generated 3,725 tokens. Selected UCB outcomes used 586 tokens and
7.657 seconds, versus 1,053 tokens and 11.784 seconds for fixed direct, with 24
model calls each. Tool-only used no model tokens; its near-zero recorded latency
is below clock resolution, not physically zero compute cost. Equal per-call caps
do not imply equal realized cost. Validation and per-category aggregates are in
the [full comparison](/hive/implementation/autonomous-v01/experiments/results/C5-policy-comparison.json).

## Verification and decision

**52 pytest tests passed**, plus the tools-only CLI end-to-end journey and a clean
Git-archive task/review/status check. All 162 saved outputs reverified in a fresh
process. A separate six-case fresh-inference check matched all six original
verified scores with an unchanged policy. These are different reproduction checks.

Grok supplied adversarial code review and an independent experiment review;
the configured NVIDIA Nemotron reviewer supplied mathematical critique.
Recommendations were assessed against evidence, not treated as proof. Review
findings produced fail-closed and recovery regression tests. The experiment
review recommends **QUARANTINE**. Its packet preceded the later six-case inference
check; that pass does not resolve the stronger-baseline or correlated-template limits.

Positive promotion and regression rollback are exercised with explicitly synthetic
test approvals. They do not authorize a real policy release. Website publication
publishes source and evidence; it does not install the experimental policy.

## Source, evidence and reproduction

- [Complete source ZIP](/hive/downloads/HIVE_Autonomous_Local_v0.1_9c6c331.zip)
- [Run instructions](/hive/implementation/autonomous-v01/README.md)
- [Build and experiment log](/hive/implementation/autonomous-v01/docs/EXPERIMENT_LOG.md)
- [Review findings and dispositions](/hive/implementation/autonomous-v01/docs/REVIEW_DECISIONS.md)
- [Six fresh-inference checks](/hive/implementation/autonomous-v01/experiments/results/C6-live-reproduction.json)
- [Final governance decision](/hive/implementation/autonomous-v01/experiments/results/governance-decision.json)
- [Next experiments](/hive/implementation/autonomous-v01/docs/NEXT_ACTIONS.md)

Extract the ZIP and follow its README. Python 3.11+ runs the core without runtime
dependencies; pytest is needed for tests. Real inference requires local Ollama
and the installed model. Nothing downloads a model automatically. The ZIP exports
committed source and public evidence only: private evaluator stores, holdout labels
and per-case holdout outputs are excluded. A new local campaign creates new evidence;
it cannot reconstruct the original private holdout artifacts from public aggregates.

## Limits and next action

The build used **118 of its 120 local-model requests**, including probes and the
six fresh checks. Workers are stopped. A full new comparison exceeds the remaining
two requests. Next: preregister independent task families and a fresh holdout,
including an incorrect-tool control, under a new bounded mission.

The code-repair evaluator uses finite patch fixtures, not arbitrary repository
editing. Memory learning, workflow learning and verifier calibration remain
separate queued experiments. No weights were trained. Application budgets do not
enforce OS CPU/GPU quotas on Ollama. Holdout separation is a trusted-local logical
boundary, not protection against the filesystem owner. Repeated improvement across
independent experiments remains unproven.

## Ongoing publication

Ian requested live repository updates as completed work and experiments progress.
Each verified milestone will publish its source revision, evidence, failures,
decision, limitations and next action here. Publishing a report does not promote
a candidate, replenish an inference budget or imply a worker is still running.
