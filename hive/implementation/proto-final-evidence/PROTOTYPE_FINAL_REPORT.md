# HIVE prototype continuation: final status (27 Nov 2026)

Plan: `HIVE_Routing_to_Working_Prototype_Build_Plan_2026-11-27` (owner go). Checkout `C:/hive-work/cmp`, branch `build/prototype` (local only, no remote).
Started at `dcf529d`, which is newer than the plan's published `6b561fd`. Evidence for everything below is in `build/prototype-final/`.

**Verdict: the product gate is NOT met.** 7 of 12 goals were accepted, below the 10 the gate needs. Workflow C (image audit) is blocked because no
`image.asset-match` passed contract 2.0.0. The genuine improvement and rollback gate is also unmet. Both are stated directly under items 6, 7 and 10.

## 1. Commit and checkout
- Final tested commit: `ee175b5 (code = 94558c2 + one test fix)`, branch `build/prototype`, checkout `C:/hive-work/cmp`.
- Commits this session, in order:
  - `3aa42a7` P0 ledger
  - `149a178` P1 revocation, routing and fallback
  - `17602de` P3 image contract 2.0.0
  - `4a08166` acceptance manifest freeze + P2
  - `fa1c88f` **regression fix**: restore `evaluator/g2/evaluate.py`
  - `2247d3f` two-release planner
  - `94558c2` P4/P5 evidence

## 2. Owner decisions as implemented
- **Default route.** An omitted `--model` now means `auto` (`model-route-v1`, `src/hive/model_choice.py`).
  - A retained capability is used first, with zero calls.
  - An explicit `--model <id>` stays authoritative, and its frozen protocol is unchanged.
  - Receipts carry selected and rejected backends with reason codes, the evidence sha and the store id.
- **Fallback.** `classify_failure` decides retryability. Retryable: transport failure, model not loaded or unreachable, context does not fit.
  - Everything else stops, including any Refused (approval or data policy), model-identity or integrity failures, STOP, budget, sealed results, and any unknown failure.
  - An auto-routed goal gets at most one alternate backend. It uses an existing experiment slot (≤3 per gap) with calls=1 and proposals=1, inside the same ledgers.
  - Pinned models never fall back. Unusable-reply fallback is not implemented: discovery has no clean per-experiment signal for it.
- **Revocation scope.**
  - Each store has a `store_uuid` in its kv.
  - New entries carry `scope` store|global plus store_uuid, statement_sha and impl_sha256. `hive_admission.py revoke --global` is the explicit emergency path.
  - Legacy unscoped entries keep their global meaning, and the list is append-only.
  - A copied store keeps its identity and lineage, so it can never resurrect a revoked capability.
  - Tests: `tests/test_revocation_scope.py`.
- **Kept unchanged:** the incumbent recipe and selector. Cooperation and masking stay off.

## 3. Ledger concurrency
- **Diagnosis.** The failure was lock **starvation**, not lost writes. The suite log shows 3 of 4 writers raising `TimeoutError`: an unfair 10 ms
  `msvcrt` poll lost to one writer re-acquiring in a tight loop. The chain stayed intact, and failures raised before any write.
- **Fix.** On Windows, a kernel-queued `LockFileEx` overlapped wait with the same timeout and fail-closed errors.
- **Proof.** The new starvation repro fails on the old code and passes 3/3 on the new. Child exit codes are now checked.
  The targeted gate gave 626 passed / 0 failed (`targeted-p01d.log`). Details: `P0_LEDGER.md`.

## 4. Capabilities and compositions
Store `C:/hive-work/demo/proto1`, a copy of `s8` that keeps its lineage. **Four valid capabilities; the five-capability gate is unmet.**

| Capability | Status |
|---|---|
| site.ref-check | learned (local) |
| site.release-diff | learned (local) |
| site.ref-extract | learned (hosted). Sealed-final acceptance: fresh hidden 24/24, 0 calls |
| site.ref-resolve | learned (hosted). Same as extract: 24/24, 0 calls |
| image.asset-match | v1 revoked store-locally (fails the real-image contract); no v2 |

**Compositions: 2 of the required 3.**
- **A** (raw site → pack → extract → resolve → check): VERIFIED and byte-identical to the sealed evaluator answers.
- **B** (two raw releases → two pack-manifest steps → release-diff): VERIFIED.
  - The planner needed a 2-line fix plus a types entry (`2247d3f`).
  - B produces the change report only. Linking changes to affected broken references is not a supported deliverable.
- **C**: blocked.

## 5. Open-source acquisition (image)
- **Contract 2.0.0** (owner rules):
  - Transparency counts: composite over white and black.
  - Real-like synthetic families.
  - THRESH 0.70 with RMS distance, set before any scoring.
  - An owner-approved sealed real holdout: 47 fresh site pictures in 3 cases, labelled by an independent agent and approved by Ian.
    APPROVAL sha `1cb5a483…`. Single use across all stores.
- **Campaign 1** (local gpt-oss): photohash ×2 and benhoyt/dhash ×3 → `CANDIDATES_EXHAUSTED`. **16 calls**, more than the plan's 9:
  I launched the existing driver without capping its 16-call budget.
- **Campaign 2** (hosted Nemotron, capped at 9): 3 repos rejected at staging (too large, or compiled/sdist only); simhash-cluster failed → `CANDIDATES_EXHAUSTED`.
  4 calls, $0.126.
- **The sealed key was never opened.** No candidate reached it.

## 6. Restart, improvement, rollback, revocation
- **Fresh-process reuse.** Each goal ran in a new process: A1–A3 and B1–B4 VERIFIED, 0 model calls, 0 new experiments.
- **Revocation** (`scripts/p4_lifecycle.py`, `p4-lifecycle/P4_LIFECYCLE.json`): **PASS**, 0 calls.
  1. Store `lc1` (own uuid) admitted release-diff through the operator-authored route.
  2. Plan 1 ran VERIFIED.
  3. A store-scoped revoke followed.
  4. Plan 2 → `PLAN_INVALID` (unknown capability).
  5. proto1, the same goal → VERIFIED.

  Run-plan 1 exited with code 2 although its state was VERIFIED (recorded as-is). Two failed tries are kept (`P4_LIFECYCLE-try1/2.json`: relative path, author label).
  An earlier attempt on `s12-lifecycle` was void: its plan never resolved because of old extract/resolve pins. The ref-check revoke recorded there is harmless.
- **Genuine improvement + rollback: UNMET.** No capability has a valid v1 with a real weakness and a qualifying v2.
  The best candidate weakness is real: learned `site.ref-extract` fails its independent check on release `fd6d09b` (A4). No improvement campaign was run (budget).

## 7. Acceptance (manifest `ACCEPTANCE_MANIFEST.json`)
The manifest was frozen minutes **after** campaign 1's process started and **before** any result was read.

| Goal | Result | Calls |
|---|---|---|
| A1 2633d9b | VERIFIED, evaluator byte match. 1st try UNRESOLVED: I had copied an old-format scope file; the release folder was unchanged | 0 |
| A2 0b3854a | VERIFIED, evaluator byte match | 0 |
| A3 e3fcce6 (new process) | VERIFIED, evaluator byte match | 0 |
| A4 fd6d09b (unseen) | **STEP_FAILED**: ref-extract independent check FAIL, output withheld | 0 |
| B1–B4 | VERIFIED. 1st tries UNRESOLVED: the planner gap, fixed in `2247d3f` | 0 |
| C1–C4 | **NOT RUN**: image.asset-match not admitted (blocked) | — |

- Accepted: **7/12**. Every workflow needs a fresh-process success; A and B have one, C does not. The gate is not met.
- An earlier full A/B run under the broken evaluator pin is kept in `p5-pinbroken/`.
- Regression: full suite on `94558c2`: **2055 passed, 1 failed, 7 skipped** (2:00:28, real Docker; `full-suite-94558c2.log`). The one failure was `test_revocation_scope` timing: A and B admitted byte-identical statements in the same second, so B correctly counted as A's lineage. The test was fixed in `ee175b5` and the targeted rerun gave 28/28 three times.

## 8. Ledgers (start → end)
- **HIVE model calls:** 537 → **557** of 576. Campaign 1 used 16 and campaign 2 used 4. Integration probes, acceptance and lifecycle used 0. **19 remain.**
- **Hosted NIM:** $2.64 → **$2.768** of $5 (hosted ledger reconciled, 0 outstanding reservations).
- **Coding:** ~$339.9 → **~$382** of $400. This session's measured list price is **$42.09**. The $350 alert was crossed and reported mid-session.
- **Plan §6 token caps** (12k input per request, 120k total including cache reads) could not be met: Claude Code's own instructions exceed 12k per request,
  so spending was governed by measured dollars instead, and the conflict was reported.

## 9. Package
`build/prototype-final/package/HIVE_Prototype_ee175b5.zip`, sha256 `ce13bb46baff0d8d8dfd7bf5dc287608a160b1af479916fb5e9547775327a0f0`, 6.5 MB, 2,423 files.
- Made by `git archive` of `ee175b5`, with no stores and no keys. The secret screen's 3 hits are verified fakes: a detector regex, a review note and a test fixture.
- Clean-folder proof (`HIVE_Prototype_ee175b5.json`): fresh-store `cap list` exit 0. Goal e3fcce6 on a copy of the demo store: VERIFIED and evaluator byte match, 0 calls.
- Launch notes: `package/LAUNCH.md`.
- Not published: updating the website or publishing the archive needs a separate go.

## 10. Unmet mandatory gates
1. Five valid capabilities: 4 of 5. image.asset-match is missing.
2. Three real compositions: 2 of 3. Workflow C is missing.
3. Genuine improvement + signed rollback: not demonstrated.
4. Product gate (≥10/12 with a fresh success in every workflow): 7/12.

Also open: the A4 transfer failure of learned ref-extract on `fd6d09b`.

**Regression introduced and fixed this session.** `17602de` edited `evaluator/g2/evaluate.py`, a pin file for every g2 capability, which invalidated the
existing ref-check and release-diff admissions. `fa1c88f` restored it byte-for-byte.
