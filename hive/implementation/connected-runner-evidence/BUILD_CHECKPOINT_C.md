# HIVE checkpoint: Connected Goal Runner (Gates C1–C6), 24–25 Nov 2026

Build prompt: `HIVE_Next_Build_Connected_Learning_Runtime` (24 Nov 2026). Repo `D:/Repos/hive-ai`, branch
`build/working-prototype` (local only, no git remote). Scope stays `trusted_local_experiment`; nothing is production-approved.

## 1. Commits and state
- Baseline: `c7683fe` (Operator Prototype). Tree clean except old untracked build logs (`build/prototype-v04/*`, `build/m0/*`, `integrations/search_*`), left untouched.
- `20ce8f5` C1+C2 · `0e2770c` C3 · `c371dd5` C4 · `2286acf` gitattributes · `7a1a28c` C5 · `965aedd` C6 · `033089b` full-suite isolation fix (final code, packaged) · this checkpoint commit.
- New: `src/hive/goal_runner.py`, `discovery.py`, `capability_registry.py`, `model_dispatch.py`; `configs/capability_types.json`, `admission_signers`, `model_dispatch.json`; `evaluator/c3/*`; `scripts/goal_demo.py`, `c4_demo.py`, `c6_acceptance.py`, `hive_admission.py`; `docs/ADMISSION_AUTHORITY.md`; tests `test_goal_runner`, `test_discovery`, `test_capability_admission`, `test_model_dispatch`.
- Changed: `operator_runtime.recover` (also interrupts goals), console/API/HTML (goal form, goals + discoveries, goal downloads), CLI (`operator goal`, `discover`), `export_snapshot.py` allowlist, `OPERATOR_RUNBOOK.md`, `test_console.py` wait 3 s to 15 s (measured 4.1 s under load; it failed the same way at `c7683fe`).

## 2. Gates
| Gate | Result | Evidence |
|---|---|---|
| C1 goal + contract | PASS | `build/c-series/c12-demo/summary.json` 8/8 (real console + docker); convert/merge goals VERIFIED, 0 model calls, old explicit-op interface still works |
| C2 typed planning | PASS | same demo: folders → [snapshot, snapshot, merge] with no manual workflow; a revoked capability never executes; replay labelled; restart keeps provenance; `test_goal_runner` |
| C3 discovery | PASS | `build/c-series/c3-run/summary.json`: real goal → minimal gap `canonical_rows×2 → inventory_diff` → experiment `d-563f4dc928c28acb7944` CANDIDATE_PASSED, independent evaluator 24/24; exhaustion path stub-tested (`test_discovery`) and live in C6 (0-call budget) |
| C4 admission + rollback | PASS (rollback: fixture) | `build/c-series/c4-run/summary.json` 14/14: signed admission, restart, fresh real inputs VERIFIED with no regeneration, tamper/unsigned/revoke refused. Two-version working rollback is proven only by an explicit test fixture; with one live version, rollback refuses with a clear UNAVAILABLE |
| C5 model dispatch | PASS | `build/c-series/c5-run/summary.json`: active mode, requested `local/unmeasured-model` → routed/executed/endpoint-reported `openai/gpt-oss-20b` (`switch_executed` true); model unloaded → MODEL_UNAVAILABLE (P0) with 0 calls |
| C6 connected acceptance | PASS | `build/c-series/c6-run/summary.json`, all 13 steps PASS on a fresh store with fresh real inputs (below); `operator_demo.py` 9/9 |

C6 journey: goal with discovery → contract + plan [convert, convert] + gap → experiment CANDIDATE_PASSED → signed admission v1 → original goal VERIFIED via [convert, convert, inventory-diff] → console restart → a different unused pair, submitted without discovery, VERIFIED as `retained_capability_execution` with 0 model/proposal calls and no new experiment → STOP, kill/INTERRUPTED/resubmit, revoke (UNRESOLVED, 0 container runs), 0-call budget BUDGET_EXHAUSTED, one-version rollback refused clearly.

## 3. Launch and package
- Launch: `scripts\hive-operator.cmd <inputs folder> [port]` (console). CLI: `python -m hive --store .hive\operator operator goal "TEXT" SOURCES... --allowed-root R [--deliverable T] [--allow-discovery]`; `operator discover run <exp>`; `python scripts\hive_admission.py init|admit|revoke|rollback`. Runbook: `docs/OPERATOR_RUNBOOK.md`.
- Package: `build/c-series/package/HIVE_Connected_Runner_033089b.zip`, SHA-256 `4dcc31a5fc91706d4e9a4183c6168b0cbca063dfb6e43069204ae0aa5ebd69ee`, manifest `source_commit` 033089b5…, `tracked_dirty` false, 1179 files.
- Clean launch: extracted to `D:/tmp/hive-pkg2`, `operator import` OK, readiness `runtime_commit` = 033089b, executor and evaluator ready, and the package contains no keys, private cases or sqlite stores. The C6 worker also ran one convert goal VERIFIED from an extracted tree with `--no-browser` (`clean_launch.json`; that was the 7a1a28c+edits build, whose content is committed). The plain launcher opens a browser that holds the session token, so headless checks need `--no-browser`.

## 4. Receipts (redacted to ids/hashes)
- C3 candidate `e5765a1c…e88c` (gpt-oss-20b, 1 call); evaluator receipt `92c1bdf8…86d7` 24/24.
- C4 admission statement `5883be35…89e6`; admission re-run receipt `b0b92cc3…da34`; signer `SHA256:Yk7d2kF/AEKCd7Fi+CZJa0XxBOnkOZ10aX8khS9gkVc` (key at `%USERPROFILE%\.hive-admission`, outside repo and store).
- C5 call `d-b2769ad497fdfd734980:1`. Full ids for C6 are in its summary.

## 5. Models, baselines, usage, resources
- Model: only local `openai/gpt-oss-20b` (LM Studio, M2-pinned weights). Real calls this build: C3 1, C5 2 (one accidental, within the 2-call cap; LM Studio auto-loads listed models, fixed by checking `/api/v0` load state), C6 1. Each successful proposal was ≈1339 in / 350 out tokens, 10–14 s. Paid inference $0.
- Baselines on the 24 private cases: unchanged HIVE 0/24 (no capability), hand-written scripted diff 24/24, candidate 24/24. Matched-budget search over the M2 views: not expressible (no view produces inventory_diff). **The candidate ties the scripted baseline: this is mechanism evidence, not a learning advantage.**
- VRAM 16.3 GB card: ≈3.2–7.8 GB idle (OBS etc.) → peak 15.2–15.3 GB loaded → ≈3.2 GB after unload. Experiments: 33–39 s wall, 3 container runs each.
- Coding-agent cost (list price, from session transcripts via `scripts/agent_usage_tally.py` + subagents): this session ≈ $18.5 (conductor Opus ≈ $9.4; Sonnet workers C1/2 $2.48, C3 $2.75, C4 $1.54, C5 $1.16, C6 $1.12). Cumulative HIVE ≈ $116.5 of the $120 owner ceiling. The session stopped at that boundary.

## 6. Tests, regressions, limits
- Targeted: goal_runner + operator_runtime + console 66 passed / 1 skipped; discovery 16; capability_admission 20 (1 real docker); model_dispatch + route_shadow 47; goal_runner + discovery 43 after C4.
- Full suite at 965aedd: 1092 passed / 22 failed / 3 skipped (2h18m on a loaded PC; log `build/c-series/full-suite-965aedd.log`). 21 failures were a test-isolation fault: evaluator/c3 and evaluator/m1+m2 share bare module names. This was fixed in `033089b` without changing any pinned evaluator file. With poisoned modules planted, the c3 suites pass 45/45 and the planted modules are restored; a cross-run with the M2 suites passes 144. The 22nd failure, `test_cross_process_adversarial::test_simultaneous_writers_keep_one_gapless_chain` (ledger lock timeout), also fails on baseline `c7683fe` today: environment, not a regression.
- Full suite at 033089b (final code): **1114 passed / 3 skipped / 0 failed** in 1h10m, Docker up (`build/c-series/full-suite.log`, EXIT=0). The ledger-lock test passed this time; its earlier failure was load-related.
- Security limits: admission trust = the committed `configs/admission_signers` public key + a private key file readable by the same Windows user. Candidate code (container, no network or files) and the store writer cannot mint admissions; the owner/admin account can. A forged or unsigned event fails the whole capability chain closed (a denial-of-capability, not a forgery). Receipts are integrity-hashed, not signed; admission re-runs the evaluator instead of trusting them.
- Behaviour change: an unqualified requested model is now refused even in shadow mode.
- Known gaps: wall-time budget is checked before each step, not during one; the planner explores only the first match for single-input capabilities; snapshot intermediates are not downloadable; the cap id `inventory-diff` is hardcoded in admission; ssh-keygen tested via the Git-bash build only.

## 7. What this is and is not
- **Operational execution:** goals run through the normal console via typed plans over registered capabilities, with independent verification. Demonstrated.
- **Workflow learning (connected mechanism):** a real gap → bounded local-model proposal → independent evaluation → signed admission → reuse on distinct unused inputs after restart. Demonstrated once on one workload, tying a simple scripted baseline.
- **Level A / Level B acceptance:** NOT run. **Neural weight learning:** none; model weights unchanged.

## 8. Next smallest milestone (evidence-based)
A second, harder real gap where a scripted baseline is not trivially perfect (e.g. a fuzzy-match or schema-drift reconciliation on real MOM production folders), run through the same C6 path to see whether discovery ever beats the strongest baseline. Then a live two-version rollback (a v2 admitted from a second experiment). Both need the owner to raise the $120 coding-agent ceiling; the local model costs $0.
