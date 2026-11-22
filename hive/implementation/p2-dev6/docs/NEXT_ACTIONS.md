# Next actions

## E0 executed: latest checkpoint

Ian approved the prepared caps. The pinned v0.2.1 mission completed 30 calls, 1008 generated tokens, 23.125 active seconds and 36 verified observations; replay used zero calls. Top-level stop reason was stale after completion; the separate v0.3 repair has a synthetic regression. See `experiments/results/v03-e0-decision.json` and [current scope](V03_FOUNDATION.md). No new inference remains authorized. E1 source inventory, evaluator integration and separate budget are still pending. Earlier preparation entries below are historical.

## v0.3 next bounded mission

The E0 plan and its spent budget are preserved under `experiments/plans/v03-e0.json`. Next: implement the zero-inference E1 adapter/curation checks and source inventory. The E1 design remains draft and its larger budgets are not authorized. See [checkpoint](V03_FOUNDATION.md).

The newer [v0.2 controller](ADAPTIVE_V02.md) has executed its bounded candidate
schedule, continued after an observed regression and retained verified results.
Its mission used 30/48 local requests; the original v0.1 mission below remains
separate. Next research needs unseen families and a meaningful strong baseline,
not a broader claim from the six reused validation templates.

## Preserved v0.1 follow-up queue

Current mission is stopped at its completed prototype checkpoint. The real
candidate is QUARANTINED; the deterministic tool baseline dominates this suite.
No production deployment or model-weight training is authorized by these results.

1. **SOL, P1 — new preregistration.** Hypothesis: a frozen learned router retains
   its advantage over direct model on new task families, and can detect a specified
   incorrect-tool negative control. Falsify on any critical regression or failure
   to beat the strongest applicable fixed baseline at comparable actual cost.
   Use fresh independent families and holdout; never tune on consumed holdout
   cases, outputs or individual failure details. Define cluster-level uncertainty.
2. **LUNA, P1 — stronger task fixtures.** Expand finite patch repair to isolated
   real repository fixtures only with a reviewed execution sandbox. Add evidence
   retrieval and verification cases where deterministic tools are not sufficient.
3. **ASTRA, P1 — new bounded mission.** The current build used 118/120 requests;
   a full 108-request comparison exceeds its remaining allowance. Keep the queued
   research proposal durable; do not silently replenish budgets or launch a daemon.
4. **TERRA, P1 — stronger service limits if required.** The existing Ollama service
   owns its GPU/CPU allocation. OS-isolated resource enforcement and stronger
   evaluator access isolation are requirements before arbitrary code or multi-user
   access, not implemented guarantees of this single-user prototype.
5. **SOL, P2 — separate mechanisms.** Preregister memory retrieval, workflow change
   and verifier-calibration ablations individually. Model-weight training stays
   deferred until data quality, broad holdout and forgetting tests justify it.

Resume an unfinished recorded campaign using the same store/source/config.
Inspect completed results with `hive --store .hive/campaign-v01 status`.
The old seed-42 holdout remains consumed; creating another store does not reset it.
