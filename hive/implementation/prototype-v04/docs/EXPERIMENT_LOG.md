# Experiment and build log

## E0 executed: latest checkpoint

Ian approved the prepared caps. The pinned v0.2.1 mission completed 30 calls, 1008 generated tokens, 23.125 active seconds and 36 verified observations; replay used zero calls. Top-level stop reason was stale after completion; the separate v0.3 repair has a synthetic regression. See `experiments/results/v03-e0-decision.json` and [current scope](V03_FOUNDATION.md). No new inference remains authorized. E1 source inventory, evaluator integration and separate budget are still pending. Earlier preparation entries below are historical.

## 2026-11-21: v0.3 foundation / E0 prepared

Verified the published v0.2.1 ZIP and source, 136 baseline tests/one skip and two CLI journeys. Zero new model calls. E0: prepared awaiting explicit budget approval; E1: draft, not frozen or funded. Registry reuse counterexamples and independent-review dispositions are retained in [the checkpoint](V03_FOUNDATION.md).

Source snapshot for the main campaign and final runtime:
`25f1ce8593ce11c2b70905c41d1348349f82d81aa86c7e4becf718a6f8dc5d9c`.
Build artifacts record base git commit `2e14c0e` plus source and config hashes;
the resulting implementation is committed on build/autonomous-v0.1. Config:
`928145c3151de1356b033764aa476a879803de291b9d13c17e7bf5a08082cc7a`.

### HIVE Cycle BUILD-01
- **Build/version:** 0.1.0, source snapshot above; original docs preserved.
- **Hypothesis:** A standard-library local pipeline can retain evidence, learn
  verified routing, reject false claims and recover without manual reprompting.
- **Change:** Python/SQLite modules, CLI, finite tools, bounded worker and gates.
- **Local models/tools:** Python 3.11.9, pytest 9.1.1, e2e 0.21.1; requested
  Sol/Luna/Terra workers, actual Grok and NVIDIA design reviews.
- **Test suite:** 52 pytest tests; one tools-only end-to-end journey; no UI/device.
- **Baseline:** Documentation only, no executable implementation.
- **Candidate:** Tests pass, hidden worker startup/status/exit verified.
- **Difference/uncertainty:** Functional prototype; no general capability claim.
- **Verification:** [pytest](../experiments/results/pytest-final.txt),
  [e2e](../experiments/results/e2e/report.json),
  [background status](../experiments/results/C3-background-worker.json),
  [clean archive CLI check](../experiments/results/release-smoke.json),
  [code review](../experiments/results/grok-code-review.json).
- **Failure classification:** ENVIRONMENT, IMPLEMENTATION, EVALUATION; repaired
  reproductions and dispositions in FAILURE_REGISTER.md / REVIEW_DECISIONS.md.
- **Decision:** Accept implementation checkpoint; experimental policies quarantined.
- **Rollback checkpoint:** Git base 2e14c0e; synthetic checkpoint regression tests.
- **Next experiment:** SOL: broaden independent families and strongest baselines.
- **Resource use / remaining budget:** 118/120 real local calls across this build;
  two remain. No unbounded worker remains active.

### HIVE Cycle C1 — real vertical slice
- **Build/version:** Exact commit/source/config hashes inside linked evidence.
- **Hypothesis:** Local Qwen emits a verifiable arithmetic answer through the CLI.
- **Change:** Real Ollama adapter and independent numeric check.
- **Local models/tools:** Qwen 9B Q4_K_M, exact digest in evidence; local Python verifier.
- **Test suite:** One development task, seed 42.
- **Baseline:** Initial runtime probe 17+26 returned 43; no harness evidence then.
- **Candidate:** Full pipeline returned 728 for 26×28, passed, 8 generated tokens.
- **Difference/uncertainty:** Integration proof, n=1, no statistical comparison.
- **Verification:** [C1 evidence](../experiments/results/C1-real-model.json);
  separate `hive review` process restored and reverified it.
- **Failure classification:** None.
- **Decision:** QUARANTINE as individual observation; no policy promotion.
- **Rollback checkpoint:** None installed.
- **Next experiment:** ASTRA: full preregistered comparison.
- **Resource use / remaining budget:** One harness call, 0.313 seconds measured inference.

### HIVE Cycle 7373f7796d0d — policy comparison
- **Build/version:** Snapshot/config hashes above; [manifest](../experiments/manifests/C5-manifest.json).
- **Hypothesis:** Verified development feedback improves held-out routing against
  fixed direct model under equal per-call limits.
- **Change:** Category-bucketed learned policy, frozen after development; fixed,
  greedy, UCB, random, fixed-tool, fixed-team and learning-disabled comparisons.
- **Local models/tools:** One actual Qwen model/digest, finite allowlisted tools.
- **Test suite:** Development 18, validation 12, locked holdout 24; seed 42;
  counterbalanced three-route outcome matrix, 162 verified observations.
- **Baseline:** Holdout fixed direct 12/24; random 16/24; fixed tool/team 24/24.
- **Candidate:** Greedy/UCB 23/24; learning off 12/24.
- **Difference/uncertainty:** UCB-minus-direct +0.4583; descriptive paired 95%
  bootstrap [0.25, 0.6667], n=24, effect size 0.9005. Six correlated families;
  not general statistical superiority. No evidence UCB beats greedy or tool-only.
- **Verification:** [aggregate report](../experiments/results/C5-policy-comparison.json),
  [public development evidence](../experiments/results/development-evidence.jsonl),
  [fresh-process evaluator result](../experiments/results/C5-fresh-process-verification.json).
  All 162 immutable outputs and frozen policy restore successfully. Holdout details
  remain in `.hive/campaign-v01`, excluded from development/training/public export.
- **Failure classification:** EXPERIMENTAL limitations; correct/incorrect outcomes
  counted independently. No critical/category regression against fixed direct.
- **Decision:** REJECT promotion at initial gate; final governance QUARANTINE.
- **Rollback checkpoint:** Unapproved experimental checkpoint retained; no champion.
- **Next experiment:** SOL: independent new families and tool correctness controls.
- **Resource use / remaining budget:** 108 calls, 3,725 actual generated tokens,
  13,824 reserved; 78.948 seconds active execution. Candidate selected outcomes
  586 tokens/7.657 seconds; direct 1,053 tokens/11.784 seconds, 24 calls each.
  Tool-only uses no model tokens; reported near-zero timings are below clock
  resolution, not a claim of physically zero compute cost.

### HIVE Cycle C6 — live fresh-process reproduction
- **Build/version:** Same frozen runtime and candidate hash; plan persisted before calls.
- **Hypothesis:** First critical case per category retains route and verified score
  after process restart, with the identical model, prompts and policy.
- **Change:** Fresh interpreter and fresh inference; no policy updates.
- **Local models/tools:** Same real Qwen digest, six selected local routes.
- **Test suite:** Six predefined critical held-out cases; all six categories.
- **Baseline:** Stored outcomes from the fixed original candidate.
- **Candidate:** 6/6 scores match; 6/6 pass; policy hash unchanged.
- **Difference/uncertainty:** Reproducibility diagnostic, n=6; not a new superiority test.
- **Verification:** [live reproduction](../experiments/results/C6-live-reproduction.json).
- **Failure classification:** None in reproducibility; broader evaluation remains limited.
- **Decision:** QUARANTINE. Later live success does not cure template correlation or
  deterministic baseline dominance identified by the independent reviewer.
- **Rollback checkpoint:** Original unapproved snapshot preserved.
- **Next experiment:** Same broader preregistered hypothesis, SOL.
- **Resource use / remaining budget:** Six calls, 145 generated tokens; campaign
  cumulative 114 calls, 3,870 tokens, 82.323 seconds active execution.

### HIVE Cycle C3 — real failure drives automatic repair
- **Build/version:** Same frozen runtime/config; exact artifacts in failure-demo store.
- **Hypothesis:** A recorded development failure repeats and queues a useful
  alternative tool route without a human reprompt.
- **Change:** Run the failing direct route through the durable executor.
- **Local models/tools:** Real Qwen direct attempt, deterministic-tool successor.
- **Test suite:** One previously observed development case; no holdout use.
- **Baseline:** Direct model fails independently checked output requirements.
- **Candidate:** Automatically queued tool follow-up passes; history and feedback retained.
- **Difference/uncertainty:** Functional recovery proof, two attempts, not population gain.
- **Verification:** [C3 real recovery](../experiments/results/C3-real-failure-recovery.json).
- **Failure classification:** MODEL, with hypotheses, evidence and queued next action.
- **Decision:** Failed attempt REJECTED; verified successor retained experimentally.
- **Rollback checkpoint:** No champion changed.
- **Next experiment:** Keep recovery regressions; broader scientific work stays queued.
- **Resource use / remaining budget:** One local call, 15 generated tokens, 0.906
  seconds active execution; entire build 118/120 calls including earlier diagnostics.
