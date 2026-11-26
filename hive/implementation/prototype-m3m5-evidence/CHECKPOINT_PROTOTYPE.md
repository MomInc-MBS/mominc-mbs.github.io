# HIVE prototype campaign M3–M5: checkpoint (26 Nov 2026)

Plan: `docs/PROTOTYPE_PLAN_M3_M5.md`. Preflight gap audit: `docs/PROTOTYPE_PREFLIGHT.md`. Branch `build/prototype` (worktree `local-build/cmp`). It is local only: not pushed and not published.
Baseline `195d13d` (G3), campaign head: see the git log (`60a2474..HEAD`, 30 commits).

## Verdict: INCOMPLETE working prototype
The core loop runs on real data from an empty registry:
- learn a missing capability;
- independent check;
- signed admission;
- execute;
- reuse after restart with 0 model calls;
- extend with a second capability.

Two mandatory gates are blocked, for reasons recorded below: composition on real data (T12/T13), and five capabilities in one clean registry (T02/T10). The plan says a blocked mandatory test makes the release incomplete. It is labelled that way and nothing below is claimed beyond the evidence.

## Live demonstration (clean store `local-demo/s8`, evidence `local-demo/o8`)
Real inputs come from two releases of the public MOM Inc site, read-only copies in `operator-inputs/mom-site/` (2633d9b and 0b3854a; heavy sections excluded, see `*.SCOPE.json`).

| Goal | Result |
|---|---|
| init | Empty registry (2 inactive M2 rows). The broken-links goal is UNRESOLVED: a genuine gap. |
| A, learn | `site.ref-check` was acquired by local gpt-oss-20b: 1 call, dev 6/6, hidden suite PASS, signed v1. It ran on release 2633d9b and was **VERIFIED: 57 broken local links**. |
| B, reuse | The same goal on release 0b3854a was **VERIFIED: 58 broken links, 0 model calls, 0 acquisitions**. |
| B, extend | `site.release-diff` was acquired (1 call, signed) and run on both real manifests: **VERIFIED, 111 added / 0 removed / 45 modified**. |
| C, compose | Live GitHub search found `ericbn/imha` @ `b9f38904`, BSD-2. It was pinned, staged offline and adapted by gpt-oss. After two carry-best retries it passed the hidden 24-case suite and was signed and admitted as `image.asset-match` v1. On the 20 **real** site pictures the independent check FAILED, so HIVE withheld the output and the goal ended STEP_FAILED. The composite goal (properties + match + reconcile) therefore does not finish on real data. |
| restart | In fresh processes, the stored plans for both broken-links goals and the release diff ran via `hive operator run-plan`: **VERIFIED, 0 model calls**. |

The reference-table input for Goal A/B is a deterministic **evaluator-side export** of the real pages (`scripts/export_site_inputs.py` plus the ref-extract oracle). HIVE could not learn that step (next section).

## What could not be learned (kept as negative results)
`site.ref-extract` (HTML/CSS reference scan) and `site.ref-resolve` (URL classification and path resolution) failed across seven clean stores (evidence `local-demo/o1`–`o7`):

| Proposer | Outcome |
|---|---|
| gpt-oss-20b (local) | extract best dev 4/6; resolve dev 6/6 twice but hidden **22/24, 23/24**, correctly rejected |
| qwen3.8-27b (local) | over 10 min per answer on this GPU (it does not fit the 16 GB card); not qualified |
| moonshotai/kimi-k3.1-pro (NIM) | every call timed out at 240 s |
| nvidia/nemotron-3.5-super (NIM, thinking off) | about 10 s per call; ref-check 4/6, extract 3/6, resolve candidates refused before running |

The owner's note (26 Nov): *model choosing should be a HIVE capability*, so HIVE should not depend on the conductor picking backends by hand. It is filed as the next gap in `docs/GAP_MODEL_CHOICE.md`.

## Core defects found by the live runs and fixed (generic, each with a regression test)
- `e95b7a4`: every carry-best retry replayed the same proposer seeds, so a stub reply repeated across all retries. Later experiments now sample fresh seeds; attempt 1 is unchanged.
- `9006051`: `evaluator/g2/harness.py` `wrap_dev` %-formatted the candidate source, so any `%` in a candidate crashed every dev case. This changes the g2 evaluator pin: capabilities admitted under the old harness, including the G2/G3 stores, now fail recheck (fail closed) until they are re-admitted.
- `b8ebc24` + `c97e0d0`: gpt-oss reasoning used 1,200–2,000 of the 2,000-token answer cap, so the code was truncated. The per-call cap is now 4,096. The per-experiment output stays at the owner-signed 6,000 (`docs/PROPOSER_BUDGET_CHANGE.md`).
- `97503b1`: body revocation is scoped per capability.
- `e678c1e`: hosted reply-model aliases come from config only; local backends stay exact.

## Built in this campaign
- **Planner:** same-contract alternatives ranked by evaluation record, history, latency and cost; bounded runtime fallback (never on integrity failures); per-capability history (numbers and enums only); stored plans (`hive operator plan` / `run-plan`); duplicate detection.
- **Lifecycle CLI:** `hive operator cap list|show|revoke|rollback|improve`, `acquisitions`, `receipt`, `overview`. The improve path admits v2 only on a verdict recomputed from hash-bound receipts. There is an owner-side revocation list, `configs/capability_revocations.json`.
- **Security:**
  - hostile-source end-to-end fixture;
  - approved-source allowlist;
  - real-Docker isolation tests (env canary, host paths, memory, CPU);
  - spend gate on the proposer path.
- **Model backends:** selectable and approval-bound. Local gpt-oss is the default. Hosted NVIDIA NIM is an allowlisted host: the key comes only from the environment, a hash-chained spend ledger outside the store (`the local spend-ledger directory/`) caps it at $5, and thinking is switched off by a config-only, allowlisted field.
- **Domain:** three `site.*` contracts with independent suites plus `site.ref-resolve` and `site.ref-check-alt` (`docs/PROTOTYPE_DOMAIN.md`). The demo driver is `scripts/prototype_demo.py`.

## Release gates T01–T20
"Test" means the automated suite (temp stores, stub proposers where a live model is not the point). "Live" means the demo on real inputs.

| ID | Status | Evidence |
|---|---|---|
| T01 regression | **PASS** | full suite on `73515df`, real Docker on: **1855 passed / 6 skipped / 0 failed** in 1 h 13 min (`build/prototype/full-suite.log`; G3 baseline was 1563/9/0). Skips: 3 Windows symlink-privilege tests, 2 opt-in live-model smokes (qwen, NIM; these make real calls), 1 opt-in live-network pip download (HIVE_LIVE_NET) |
| T02 five genuine capabilities | **PARTIAL** | 3 in the clean demo registry (ref-check, release-diff, image.asset-match). 2 site capabilities could not be learned (above). G-series stores hold 4 more, but under the old harness pin. |
| T03 multi-match planner | PASS (test) | `tests/test_p_planner.py`. The live `alt` phase was not run. |
| T04 invalid contracts | PASS (test) | `tests/test_capcontract.py`, `test_p_planner.py` (duplicates) |
| T05 independent evaluation | PASS (live + test) | resolve dev 6/6 rejected at hidden 22/24 and 23/24; the imha adapter passed hidden cases but failed the check on real data, output withheld |
| T06 real open-source import | **PARTIAL** | `ericbn/imha` @ b9f3890, BSD-2, pinned, hidden PASS, signed. It fails the independent check on the real goal. G2 `benhoyt/dhash` passed on synthetic inputs (old pin). |
| T07 source attack | PASS (test) | `tests/test_p_sec_hostile.py` |
| T08 isolation | PASS (test, real Docker) | `tests/test_p_sec_docker.py` |
| T09 runtime exhaustion | PASS (test, real Docker) | the same file plus `test_experiment_container.py` |
| T10 cold restart | **PARTIAL** | 3 capabilities listed and stored plans VERIFIED in fresh processes (`o8/evidence/restart-manual/`); not five |
| T11 inference-free reuse | PASS (live) | Goal B reuse plus 3 `run-plan` runs, 0 model calls |
| T12 composition | **BLOCKED (live)** / PASS (test) | the real-data chain is blocked by the extract/resolve and image-match outcomes; G3 composite on synthetic data; edge checks in `test_g3_planner.py` |
| T13 novel compositions (3) | **BLOCKED** | 0 of 3 live on real data |
| T14 version repair | PASS (test) | `tests/test_p_improve.py`, `test_p_fix_admission*.py`. The live improve was not run. |
| T15 rollback and revocation | PASS (test) | the same files plus `test_p_fix_admission2.py`. Live not run. |
| T16 tampering | PASS (test) | existing tests plus `test_p_fix_runner*.py` |
| T17 crash/recovery | PASS (test) | existing tests |
| T18 model portability | **PARTIAL** | hosted NIM calls ran live against the same registries (s5–s7, spend gated), but no capability was admitted through the second backend |
| T19 budget enforcement | PASS (test + live) | `test_p_model.py`, `test_p_fix_hosted.py`; live worst-case reservations in `the local spend-ledger directory/hosted-ledger.jsonl` |
| T20 three live demos | **PARTIAL** | A and B pass on real data; C fails on real images (verification withheld the output) |

## Independent reviews (Opus)
- P1 BLOCK (2 high, 5 medium);
- P2 BLOCK (1 new high);
- P3 ACCEPT;
- P4 (hosted backend) ACCEPT WITH FIXES;
- P5 re-check: F1–F5 fixed, F6 partial.

Reports are in `build/prototype/REVIEW_P1.md`, `REVIEW_P2.md` and `REVIEW_P4.md`. Open low items:
- rewinding the chain head past a never-revoked later version brings back an older signed version;
- `raw_output.json` is written even on failed checks (never served);
- the hosted port is not restricted;
- stored feedback text reaches an operator-chosen hosted run;
- N5–N8 nits.

## Cost
- Coding agents this session: **$83.86** list price (conductor plus subagents, `agent_usage_tally`).
- Hosted NIM: **$1.75** booked in the hosted ledger. These are worst-case estimates at a conservative price table; the actual NIM billing may be free-tier. About 10 conductor diagnostic NIM calls are not in the ledger, under $1 at the same table.
- Local inference: $0.
- Cumulative project spend is about **$286 of $400**.

## Owner actions
- Publication to the site is not automatic. Say if you want this checkpoint published.
- Optional: give HIVE its own NVIDIA key with a provider-side spend limit (the reviewer's recommendation).
- `build/c-series/c3_inference_approval.json` caps output at 6,000 tokens per experiment. Re-sign it only if you want a larger total.

## Next milestone (recommended)
1. HIVE chooses its proposer model from measured outcomes (`docs/GAP_MODEL_CHOICE.md`).
2. OSS discovery stability: search results moved between G2 and today, and `benhoyt/dhash` dropped out. Keep a pinned catalogue of inspected-and-good sources, so a capability can be re-acquired from a known source.
3. Real-data validation inside the acquisition gate: the imha adapter passed synthetic hidden cases but failed real images. Add an owner-approved real-sample check before admission.

## Rollback
`git checkout 195d13d` (G3) or use the published `033089b` package. Nothing was published.
