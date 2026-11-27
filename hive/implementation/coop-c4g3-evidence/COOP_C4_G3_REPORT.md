# Cooperative inference C4 / G3: sealed-final routing screen (26 Nov 2026)

Handoff: `HIVE_Cooperative_Inference_C4_G3_Build_and_Test_Path_2026-11-26.md`. Branch `build/prototype` (local only), `7a6cd17` -> `8829dc7`.
**Outcome: hosted Nemotron produced correct sealed-final artifacts on both unresolved capabilities (4/4 campaigns); local gpt-oss 2/4 (resolve only). Recorded as a G3 routing lead. Nothing admitted, routed or made default.** Development screen, n = 2 campaigns per cell, two capability families: not a powered accuracy study.

## 1. State, changed symbols, frozen versions
| Commit | Package | Change |
|---|---|---|
| `c9f612a` | P0+P2 | `build/coop/continuation_manifest.json` (coop-continuation-v1); `coop.py` `pool_select`, `agreement_v1`, `diff_cases`, construct-check helpers, `VARIANTS` (S0-v1..S3-v1); `scripts/coop_replay.py`; `evaluator/coop/replay_judge.py` |
| `a57d38e` | P1, P3 mocks, P4 driver | `discovery.SEALED` = `public_feedback_sealed_final_v1` (`open_experiment(policy=)`, end state `PUBLIC_CANDIDATE_FROZEN`, prompt view `decoded-public-v1`); `g3_qualify.acquire_gap(policy=)` / `_sealed_campaign` (receipt `hive-sealed-final-receipt-v1`); `evaluator/coop/sealed_final.py` prepare/score; `scripts/backend_screen.py` (`backend_screen_v1`); `m2_model` timeout/cancelled statuses; contract v2 (spec + 2 public cases) for `site.ref-extract`, `site.ref-resolve` |
| `12b1ba4` | P3 live | `scripts/resource_profile.py` (stdlib OBS WebSocket v5 + nvidia-smi sampler, `admission()`; StartStream refused in code); `scripts/probe_backends.py`; profile `build/coop/resource/admission-profile-v1.json` |
| `8829dc7` | P4 live | screen evidence `build/coop/screen/`; `--admission` reads the profile's `admission` block |
Default state: `coop=None`, `policy=None` -> frozen dict, `exp_id` and prompt bytes byte-identical to `7a6cd17` (pinned test). The default route is unchanged.

## 2. Ledger
| Ledger | Start | Used here | End | Notes |
|---|---|---|---|---|
| HIVE calls | 489 | probes 6 (3 local + 3 hosted) + screen 42 (30 local + 12 hosted) + reserve 0 | **537 / 576** | 39 left; P0-P2 used 0 |
| Output tokens | 453,112 recorded (pilot) | probes 8,701; screen 37,170 | | in-tokens are recorded for every call (none missing) |
| Container runs | | replay 67; probes 6; screen 22 | | replay re-executed stored candidates only |
| Hosted NIM $ | $1.34 measured + $0.42 estimated | ~$0.89 measured (probes $0.147) | **$2.64 of the cumulative $5** | $2.36 left under the same approval |
| Coding agents | ~$313 (estimate) | $19.35 list, this session (Opus conductor + 6 Sonnet workers + 1 Sonnet review) | **~$332 of $400** | $350 alert, $50 reserve |
| GPU | | device-level nvidia-smi every 2 s | | per-process GPU-seconds NOT measured |

## 3. Offline selector replay (0 HIVE calls; `build/coop/replay/REPLAY_REPORT.md`)
142 coop pools; S0 reproduces all 142 from stored records (recorded `dev_ms`, recorded agreement; recomputed differential inputs match `diff_inputs_sha` in all 24 executed pools). 127 pools have no correct candidate.
| Variant | Correct selections | Loss pools recovered (of 3) | Regressions | Ineligible winners |
|---|---|---|---|---|
| S0 existing | 12 | 0 | - | 0 |
| S1 all executable voters | 12 | 0 | 0 | 0 |
| S2 + public construct-check `coop-construct-check-v1` | 13 | 1 (resolve diverse3 r3) | 0 | 0 |
| S3 S1 + S2 | 13 | 1 | 0 | 0 |
Gate (recover both named losses, 0 regressions): **not met -> keep S0.** The check maskrand3 r6 losses (2 pools) are not separable by public evidence. After review, S2/S3 rank a candidate with no valid check receipt below any valid one; no receipt was invalid and no selection changed. Per-pool labels stay in `C:/hive-work/eval-private/coop-replay/`.

## 4. Evidence boundary and resource admission
- Contract audit `build/coop/P1_CONTRACT_AUDIT.md`: both caps had defects. Resolve: all 123 hidden-case failures of 37 dev-perfect pilot candidates were one kind the spec never stated (literal non-ASCII kept as written). Extract: inputs shown only as `<base64 N chars>`, and an ambiguous style-body order (25 of 36 failures). Contract v2 states both rules, adds one public case per kind, and shows decoded public text under the policy only. This fix was informed by development hidden failures (disclosed); the screen used fresh hidden manifests. Known-correct authored bodies pass public + 24/24 private (`tests/test_coop_oracle_sanity.py`); wrong/empty/malformed/constant fail.
- Containment tests (`tests/test_sealed_final.py`): sentinel in private grading data never reaches requests, store records, feedback or carry-best, including after resume; final receipt hash predates scoring; scoring never generates; both backends of a block share one manifest hash with distinct exp_ids; caps hold at experiment and campaign boundaries; restart does not replenish or double-dispatch.
- Resource profile (`build/coop/resource/`), OBS scene "Full shot" (face cam, c922 + chroma key, SplitCam feed, MOM Three overlay), NVENC 6000 kbps 1080p30 local recording (no stream), gpt-oss resident:
| Phase | Render skipped | Output skipped | VRAM peak / free min (MiB) | Encoder latency max | OBS CPU max |
|---|---|---|---|---|---|
| A preview, no inference | 0 / 3,599 | - | 13,049 / 3,254 | - | 5.0% |
| B recording, no inference | 0 / 3,532 | 0 / 3,529 | 13,414 / 2,889 | 1.49 ms | 4.9% |
| C recording + 3 local calls (GPU 93%) | 0 | 0 / 3,209 | 13,414 / 2,889 | 1.35 ms | 5.4% |
| Whole session incl. screen | 0 / 32,524 | 0 / 32,521 | 13,405 at end | | |
Frozen admission thresholds: free VRAM >= 2,048 MiB, used <= 14,250, render/output skip <= 0.5%, OBS CPU <= 15%, RAM available >= 4,096 MiB, encoder latency <= 5 ms; unknown field = stop. Every block passed. (First launch stopped before any reservation because the whole profile document was passed in; fail-closed, 0 calls.) System RAM available was only ~8 GB of 64 GB (LM Studio llama-server 19 GB, WSL 7 GB, Voicebox 7 GB, qemu 6 GB).

## 5. Backend screen (`build/coop/screen/`; stores `C:/hive-work/demo/backend-screen-12b1ba4`)
Recipe `incumbent_public_v1` = the sequential loop on the sealed-final policy, temperature 0.2 on both, EXP_BUDGET unchanged, 2 repeats per cell, 4 paired blocks, order alternating local-first / hosted-first.
| Block | Backend | Sealed final | Coverage (correct / distinct candidates) | Calls | Out tokens | Short refusal / stub replies |
|---|---|---|---|---|---|---|
| extract r1 | hosted | **PASS** | 1 / 3 | 4 | 7,915 | 0 |
| extract r1 | local | FAIL | 0 / 1 | 9 | 354 | 9 of 9 |
| extract r2 | hosted | **PASS** | 1 / 3 | 4 | 7,911 | 0 |
| extract r2 | local | FAIL | 0 / 5 | 9 | 7,757 | 4 of 9 |
| resolve r1 | hosted | **PASS** | 1 / 3 | 3 | 3,797 | 0 |
| resolve r1 | local | **PASS** | 1 / 4 | 5 | 3,081 | 2 of 5 |
| resolve r2 | hosted | **PASS** | 1 / 1 | 1 | 1,091 | 0 |
| resolve r2 | local | **PASS** | 2 / 6 | 7 | 5,264 | 2 of 7 |
Totals: hosted 4/4 final, 12 calls; local 2/4 final, 30 calls. Short (< 100 token) local replies: extract 13 of 18, resolve 4 of 12 (the `8829dc7` commit message says 14 of 18 for extract: a miscount). All 8 finals frozen before scoring; 0 incomplete pairs; returned model ids = requested local id and the pinned hosted alias `private/nvidia/nemotron-3.5-super-120b-a12b`. Probes on `site.ref-check` (not a screen cap): local dev 6/6 in 3 calls; hosted dev 2/6 in 3 calls.
Reading: this is the first correct extract artifact in HIVE's learned path (pilot coverage was 0/15). Local extract was dominated by refusals ("I'm sorry, but I can't provide that") and a constant-ERROR stub; whether the decoded-input view raises gpt-oss refusals is an open hypothesis, not tested. Pilot and screen are not comparable before/after: contract v2 changed for both backends at once.

## 6. Tests
Targeted during the work: replay 32 passed / 1 skipped; sealed-final + discovery + hosted + dispatch 141 passed / 2 skipped; contract v2 + oracle sanity + G1/G3 suites 136 passed; resource profile 27 passed; sealed-final + replay rerun 18 passed.
Full suite once on `8829dc7`, network/model calls off: 1961 passed / 5 failed / 7 skipped. The 4 v2-related failures are fixed; the 5th is a load flake that passes alone (section 9).

## 7. Separate decisions
| Decision | Status |
|---|---|
| Selector repair | Not met: S0 kept; S2 kept as a versioned experimental option only |
| Nemotron provider technical qualification | **Qualified** (connectivity, pinned reply id, usage accounting, timeout/cancel/missing-usage mocks, admission under OBS). Explicit route only |
| Recipe / capability admission | None. The sealed policy never admits. The hosted extract/resolve finals still need the existing independent acceptance contract (signed admission + recheck) |
| Default routing | Unchanged (local incumbent; no automatic hosted route) |
| Persistence | Nothing admitted, so no registry change; evidence and receipts retained |

## 8. Rollback, blocker, next gate
Rollback: omit `policy=`/`coop=` (legacy path byte-identical); targeted `git revert` of `8829dc7 12b1ba4 a57d38e c9f612a` if a patch rollback is needed. Restart/revocation receipt: not applicable (nothing admitted).
Next gate (needs owner go): put the 4 hosted sealed-final artifacts through the existing signed admission path, then C5 (restart, fresh input through the operator path, independent verification, revocation/rollback). Budget left: 39 HIVE calls, $2.36 NIM, ~$18 coding before the $350 alert. Separately reopenable: a frozen refusal comparison (decoded vs placeholder view on local gpt-oss). Masking and C7 stay parked; no mixed-backend claim (one stronger backend winning is not evidence that mixing helps).

## 8b. Admission + C5 (owner go, 26 Nov; 0 model calls; `build/coop/c5/`)
- New sealed-final acceptance route `discovery.open_sealed_acceptance`. It verifies the frozen campaign receipt (sha recompute, body sha, sealed campaign record and frozen_sha, read-only sqlite), then runs the body through the standard authored-route gates: a fresh private hidden set, scripted baseline, static, dev, and separate-process hidden gate. `hive_admission._recheck` is unchanged. The signed statement keeps route "learned" and adds `sealed_final` provenance (campaign exp_id, receipt sha, model `nvidia/nemotron-3.5-super-vl-120b-a12b`). Tests: `tests/test_sealed_acceptance.py` (tamper, wrong body, non-sealed campaign, failing body not admitted, 0 model dispatches); together with authored, admission and sealed-final tests, 38 passed.
- Both r1 hosted finals passed a **second, fresh hidden set 24/24** (extract and resolve).
- **Store `C:/hive-work/demo/c5l-c9681d6` (learned first):**
  - Each cap was admitted as v1, route learned (statements `21d2c66b…` extract, `360bfa17…` resolve).
  - A fresh-process ordinary operator goal on the unseen real release `0b3854a` VERIFIED via retained execution of the learned v1, with 0 new experiments and 0 model calls.
  - The output is byte-identical to the human-authored body run separately and to the release's own export (`raw-reference-table-0b3854a.json`, `reference-table-0b3854a.json`).
  - Not a cache: the 2633d9b input gives a different, VERIFIED output.
  - Signed revoke (`be6c02fa…`, `03da7547…`): the next goal is UNRESOLVED ("no typed plan from the eligible capabilities"), with 0 capability runs and 0 calls.
- **Store `C:/hive-work/demo/c5-c9681d6` (authored v1 first, the existing route):** reuse VERIFIED with the same byte-identical comparisons. Admitting the learned body as v2 was **refused by the existing chain rule** ("only an explicit improvement can add another version", and v1 already passes everything). It is kept, not bypassed, so signed rollback to a previous version is not demonstrated (no learned v2 exists over v1).
- Finding (pre-existing, not changed): `hive_admission.revoke` writes one global `capability_revocations.json` keyed by cap id + version, so a revoke in one store would revoke the same version number in every store. For this test the revocation list was a scratch copy (`D:/tmp/c5l-signers`, signed with the real key); `configs/` is untouched. A store-scoped revocation list is the fix if this matters.
- Decisions: the hosted extract/resolve are **admitted as learned capabilities in the C5 store only**. Default routing and the repo/demo operator stores are unchanged.

## 9. Full-suite receipt
Run once on `8829dc7`, `HIVE_REAL_DOCKER=1`, no live model/network (`build/coop/suite/run-full-final.cmd`, log `build/coop/suite/full-suite-final.log`): **1961 passed, 5 failed, 7 skipped in 1:29:06.**
- Skips (7): 3 symlink privilege, nltk-only mask test (runs in the tagger venv), and 3 opt-in live tests (`HIVE_LIVE_NET`, `HIVE_LIVE_NIM`, `HIVE_LIVE_MODEL`).
- `test_coop.py::test_committed_masks_structure[extract, resolve]`: the parked C3 mask files were built for the v1 spec text. Rebuilt offline with the isolated tagger (`scripts/coop_masks.py`).
- `test_p_site.py::test_split_capabilities_fit_one_small_proposal[extract, resolve]`: the v2 specs are 2,674 / 2,642 chars against a 2,600 cap. The cap is raised to 2,700 rather than rewording, because the screen's sealed finals are frozen against these exact spec bytes.
- `test_usage_ledger.py::test_concurrent_processes_chain` (25 of 100 rows under full-suite load): passes alone (1 passed); `usage_ledger.py` is untouched. This is the known load flake.
- Re-run of the affected files after the fixes: `tests/test_p_site.py tests/test_coop.py tests/test_contract_v2.py tests/test_coop_oracle_sanity.py` gave 98 passed, 1 skipped (nltk-only). The full suite was not rerun.
Live screen evidence is bound to `8829dc7`. The fix commit changes only the mask JSON and one test bound, not the spec, prompts or runtime.
