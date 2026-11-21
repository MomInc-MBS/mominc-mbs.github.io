# Runtime v2 decisions and verification log

## Reconnaissance

- Recovered the existing pilot through Ian's studio-brain context, inspected the actual source and supplied architecture plan, and ran the original 13 tests successfully.
- Found the router recorded but unused for dispatch; release functions recorded state but did not control execution; the evidence audit checked record presence without recomputing verdicts.
- Confirmed the previous pilot was published by the existing workflow at main `7477ea8`; branched this work as `feature/hive-runtime-v2-20261120`. The unrelated AR checkout was left alone.
- Preserved research/fixtures/previous evidence by hash snapshot. Read historical ZIP methods and reproduction instructions; did not rerun or rewrite its original output files.
- Rechecked hardware and services. No loaded local model; retained the CPU workflow. Ruflo returned heuristic routing, Laya was unavailable; one bounded inexpensive Codex worker audited code and wrote focused tests. No model/service swaps or added inference spend.

## Implementation

- Added task-driven runtime dispatch, software/model adapter protocol, fixed isolated worker, separate live checker, independent artifact auditor, frozen dataset enrollment, experiment runner and active local policy governor.
- Reused the existing store, policy helpers, caption implementation, frozen corpus and dev-only bounded proposal. Kept the original pilot and reports intact.
- Added contract tests over a real loopback HTTP test server and subprocess; this establishes the model transport only, not inference quality.
- Initial full run `runtime-v2-run-001` completed 576 episodes and rejected the candidate. It used baseline-only rollback rehearsal and predates final release controls; retained locally as superseded engineering evidence, never presented as the final release proof.
- Independent review identified evaluation override, repeated activation, candidate-specific rollback and executable-identity gaps. Fixed them: enrolled task membership, original-parent gate, exact-candidate isolated activation/restart/rollback audit, frozen binary/version and source identities, and sequential active-policy provenance.
- Initial local suite: 29 tests passed, including existing memory/eligibility contracts. Positive release tests deliberately inject synthetic adapter failures and are test mechanics only, not learning evidence.
- Reconciled Ian's additive learning-acceleration update; preserved its exact bytes. Audited 14 upstream projects and exact versions; only Optuna 5.1.0 installed, in its own CPU environment with a hash lock.
- Added experiment/metric/budget/lineage contracts, recipe adapters, development-only optional TPE proposal process, equal-budget controls, resumable trials and conservative effect reconciliation. Existing core and original fixtures remain independent of optimizer dependencies.
- Independent review caught budget scope, interrupted-call accounting and audit provenance weaknesses before the benchmark. Fixed all six findings and added recovery/selection/source checks. Full suite: 38 tests passed in 31.032 seconds, including the actual optional Optuna process.
- Run 002 remains local superseded engineering evidence. Run 003 freezes the final runtime plus learning-acceleration source set. The search comparison runs separately to avoid benchmark contention.

## Commands

```sh
python -m unittest tools.hive_engine.test_engine tools.hive_engine.test_runtime tools.hive_engine.test_governor tools.hive_engine.test_search -v
python -m tools.hive_engine.cycle --out .hive-local/runtime-v2-run-003
python -m tools.hive_engine.audit .hive-local/runtime-v2-run-003/state
python tools/check_hive.py
python hive/vault/tools/validate_vault.py
```

The original static reference check covers 313 pages and 22,806 local links. Its immutable-source check required keeping the supplied vault navigation/graph/report unchanged, so the RUNTIME2 node and four edges use a separately validated overlay. All 696 snapshotted original files are preserved. No website HTML/JS/CSS/assets or game manifests changed. Final measured runtime and search results are in `RESULTS.md` and `SEARCH_RESULTS.md`. No production deployment is part of this extension.
