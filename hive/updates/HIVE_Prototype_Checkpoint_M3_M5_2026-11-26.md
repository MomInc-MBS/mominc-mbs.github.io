---
id: HIVE-PROTOTYPE-M3-M5-2026-11-26
schema_version: "1.0"
title: "HIVE prototype checkpoint M3-M5: learn, check, admit, reuse, extend on real inputs (INCOMPLETE), 26 November 2026"
date: 2026-11-26
status: "incomplete working prototype; two mandatory gates blocked; code branch local only, nothing packaged; trusted local scope; not production-approved; not a research acceptance"
project: HIVE
artifact_type: evidence_report
priority: high
---

# Prototype checkpoint M3-M5: the core loop runs on real data, the prototype is INCOMPLETE (26 Nov 2026)

This follows the [Connected Goal Runner](/hive/notes/CONNECTED/). That build showed one learned step on one workload. This campaign asked for more: start from an **empty capability registry**, learn what is missing, check it independently, admit it with a signature, execute it, reuse it after a restart with **zero model calls**, and extend with a second capability. It ran on real inputs, two releases of the public MOM Inc. website.

## Verdict: INCOMPLETE

The core loop works on real data. Two mandatory release gates are **blocked**, and the plan says a blocked mandatory gate makes the release incomplete:

- **Composition on real data (T12, T13) is blocked.** The real-data chain depends on two site capabilities that no available model could learn, and on an image matcher that failed the independent check on real pictures.
- **Five capabilities in one clean registry (T02, T10) is partial.** The clean demo registry holds three, not five.

Nothing below is claimed beyond that.

**Where the code is.** The code lives on a local branch, `build/prototype`, in a private build tree. It has **no public git remote**. It is not pushed and not packaged, so **there is no runtime download for this checkpoint** and no package hash. The latest packaged runtime remains the [Connected Goal Runner](/hive/notes/CONNECTED/) (`033089b`). Rollback for the build tree is `git checkout 195d13d` (the G3 baseline) or the published `033089b` package. Nothing was published to any user.

## Live demonstration

Real inputs are read-only copies of two releases of the public MOM Inc. site (commits `2633d9b` and `0b3854a`; heavy sections excluded, scope recorded beside each copy). The copies are not published here, only counts and public URLs.

| Goal | Result |
|---|---|
| Start | Empty registry (two inactive M2 rows). The broken-links goal is UNRESOLVED, a genuine gap. |
| A, learn | `site.ref-check` was acquired from local gpt-oss-20b: 1 call, dev 6/6, hidden suite PASS, signed as v1. It ran on release `2633d9b` and was **VERIFIED: 57 broken local links**. |
| B, reuse | The same goal on release `0b3854a` was **VERIFIED: 58 broken links, 0 model calls, 0 acquisitions**. |
| B, extend | `site.release-diff` was acquired (1 call, signed) and run on both real manifests: **VERIFIED, 111 added / 0 removed / 45 modified**. |
| C, compose | **Blocked.** Live GitHub search found the open-source matcher `ericbn/imha` at `b9f38904` (BSD-2-Clause). It was pinned, staged offline and adapted by gpt-oss. After two carry-best retries it passed the hidden 24-case suite and was signed and admitted as `image.asset-match` v1. On the 20 **real** site pictures the **independent check FAILED**, so HIVE withheld the output and the goal ended STEP_FAILED. The composite goal (properties, match, reconcile) does not finish on real data. |
| Restart | In fresh processes, the stored plans for both broken-links goals and for the release diff ran through `hive operator run-plan`: **VERIFIED, 0 model calls**. |

**Synthetic versus real.** Goals A and B ran on real site releases. The reference table they read is a deterministic **evaluator-side export** of the real pages, because HIVE could not learn that extraction step (next section). So the learned and reused capability is the checker, not the page scan. In Goal C the matcher passed on synthetic hidden cases and failed on real pictures, which is exactly the gap the independent check is there to expose.

## What could not be learned

`site.ref-extract` (HTML and CSS reference scan) and `site.ref-resolve` (URL classification and path resolution) failed across seven clean stores. They are kept as negative results.

| Proposer | Outcome |
|---|---|
| gpt-oss-20b (local) | extract: best dev 4/6. resolve: dev 6/6 twice, but hidden **22/24 and 23/24**, correctly rejected. |
| qwen3.8-27b (local) | Over 10 minutes per answer on this GPU, because it does not fit the 16 GB card. Not qualified. |
| moonshotai/kimi-k3.1-pro (hosted NVIDIA NIM) | Every call timed out at 240 s. |
| nvidia/nemotron-3.5-super (hosted NIM, thinking off) | About 10 s per call. ref-check 4/6, extract 3/6; resolve candidates were refused before running. |

The conductor chose these backends by hand. The owner's note on 26 November: **model choosing should be a HIVE capability**, so HIVE does not depend on a person picking backends. It is recorded as the next gap ([GAP_MODEL_CHOICE](/hive/implementation/prototype-m3m5-evidence/GAP_MODEL_CHOICE.md)).

## Core defects the live runs found, now fixed

Each fix is generic and has a regression test.

- `e95b7a4`: every carry-best retry replayed the same proposer seeds, so one bad reply repeated across all retries. Later attempts now sample fresh seeds; attempt 1 is unchanged.
- `9006051`: the g2 evaluator harness `%`-formatted candidate source, so any `%` in a candidate crashed every dev case. **This changes the g2 evaluator pin:** capabilities admitted under the old harness, including the G2 and G3 stores, now fail recheck (fail closed) until re-admitted.
- `b8ebc24`, `c97e0d0`: gpt-oss reasoning used 1,200 to 2,000 of a 2,000-token answer cap, so code was truncated. The per-call cap is now 4,096. The per-experiment output stays at the owner-signed 6,000.
- `97503b1`: body revocation is scoped per capability.
- `e678c1e`: hosted reply-model aliases come from configuration only; local backends stay exact.

## What was built

- **Planner:** same-contract alternatives ranked by evaluation record, history, latency and cost; bounded runtime fallback (never on integrity failures); per-capability history (numbers and enums only); stored plans (`hive operator plan`, `run-plan`); duplicate detection.
- **Lifecycle commands:** `hive operator cap list|show|revoke|rollback|improve`, `acquisitions`, `receipt`, `overview`. The improve path admits v2 only on a verdict recomputed from hash-bound receipts. An owner-side revocation list sits beside the signers.
- **Security:** a hostile-source end-to-end fixture, an approved-source allowlist, real-Docker isolation tests (environment canary, host paths, memory, CPU) and a spend gate on the proposer path.
- **Model backends:** selectable and approval-bound. Local gpt-oss is the default. Hosted NVIDIA NIM is an allowlisted host: the key comes only from the environment, a hash-chained spend ledger outside the store caps it at $5, and thinking is switched off by a configuration-only, allowlisted field.
- **Domain:** three `site.*` contracts with independent suites, plus `site.ref-resolve` and `site.ref-check-alt`.

## Release gates T01 to T20

"Test" means the automated suite (temporary stores, stub proposers where a live model is not the point). "Live" means the demonstration on real inputs.

| ID | Status | Evidence |
|---|---|---|
| T01 regression | **PASS** | Full suite on `73515df`, real Docker on: **1855 passed, 6 skipped, 0 failed** in 1 h 13 min (G3 baseline 1563/9/0). The six skips are three Windows symlink-privilege tests, two opt-in live-model smokes (qwen and hosted NIM; these make real calls) and one opt-in live-network pip download. |
| T02 five capabilities | **PARTIAL** | Three in the clean demo registry (ref-check, release-diff, image.asset-match). Two site capabilities could not be learned. Older G-series stores hold four more, but under the old harness pin. |
| T03 multi-match planner | PASS (test) | The live `alt` phase was not run. |
| T04 invalid contracts | PASS (test) | Includes duplicate detection. |
| T05 independent evaluation | PASS (live and test) | resolve dev 6/6 rejected at hidden 22/24 and 23/24. The imha adapter passed hidden cases but failed the check on real data; output withheld. |
| T06 real open-source import | **PARTIAL** | `ericbn/imha` at `b9f3890`, BSD-2, pinned, hidden PASS, signed. It fails the independent check on the real goal. |
| T07 source attack | PASS (test) | Hostile-source fixture. |
| T08 isolation | PASS (test, real Docker) | |
| T09 runtime exhaustion | PASS (test, real Docker) | |
| T10 cold restart | **PARTIAL** | Three capabilities listed and stored plans VERIFIED in fresh processes; not five. |
| T11 inference-free reuse | PASS (live) | Goal B reuse plus three `run-plan` runs, 0 model calls. |
| T12 composition | **BLOCKED (live)** / PASS (test) | The real-data chain is blocked. The G3 composite passes on synthetic data. |
| T13 novel compositions (3) | **BLOCKED** | 0 of 3 live on real data. |
| T14 version repair | PASS (test) | The live improve was not run. |
| T15 rollback and revocation | PASS (test) | Live not run. |
| T16 tampering | PASS (test) | |
| T17 crash and recovery | PASS (test) | |
| T18 model portability | **PARTIAL** | Hosted calls ran live against the same registries (spend gated), but no capability was admitted through the second backend. |
| T19 budget enforcement | PASS (test and live) | Live worst-case reservations are in the hosted spend ledger, which stays in the private build tree. |
| T20 three live demos | **PARTIAL** | A and B pass on real data. C fails on real images; verification withheld the output. |

## Independent reviews

Reviews were read-only and written by a separate model (Opus). The reports are published with the reviewer's proof-of-concept scripts removed (they were never committed).

- **P1:** BLOCK. Two high findings (a store writer could write files outside the goal output folder, through stored plans and through a pre-existing path) and five medium.
- **P2:** BLOCK on one new high: a forged registry task replay was VERIFIED without any check. Fixed.
- **P3:** ACCEPT.
- **P4 (hosted backend):** ACCEPT WITH FIXES (a store writer could lift the hosted spend cap; the store record could pick the hosted backend).
- **P5 re-check:** F1 to F5 fixed, F6 partial.

Open low items: rewinding the chain head past a never-revoked later version restores an older signed version; `raw_output.json` is written even on failed checks (never served); the hosted port is not restricted; stored feedback text can reach an operator-chosen hosted run; nits N5 to N8.

## Cost

- Coding agents this session: **$83.86** at list price (conductor plus subagents).
- Hosted NVIDIA NIM: **$1.75** booked in the hosted ledger. These are worst-case estimates at a conservative price table; actual billing may be free-tier. About ten diagnostic hosted calls are not in the ledger, under $1 at the same table.
- Local inference: $0.
- The build tree's checkpoint puts cumulative project spend at about **$286 of a $400 ceiling**. That ceiling differs from the $120 final ceiling published on 25 November on the [Connected Goal Runner](/hive/notes/CONNECTED/) page. This page does not reconcile the two figures, and it does not publish a ceiling change as an owner decision. The cumulative figure carries forward earlier estimates and is not a reconciled ledger.

## Limits

- Incomplete: composition on real data and a five-capability clean registry are not met.
- One host, one operator, local models first; hosted backends only under a spend cap.
- The reference table for Goals A and B is an evaluator-side export, not a learned step.
- Several live paths (improve, rollback, alternative-plan phase) were proven by tests only.
- Not Level A, not Level B, not neural learning, not a production approval.

## Next milestone (recommended, not authorised)

1. **HIVE chooses its proposer model from measured outcomes**, as the owner asked. Rank qualified backends per contract class from success rates, dev and hidden pass rates, latency, timeouts, cost per admitted capability and remaining budget; escalate within the owner's approvals; record the choice and reason in the experiment's frozen protocol; keep the spend gate and caps unchanged.
2. **Open-source discovery stability.** Search results moved between runs and a previously good source dropped out. Keep a pinned catalogue of inspected-and-good sources so a capability can be re-acquired from a known source.
3. **Real-data validation inside the acquisition gate.** The imha adapter passed synthetic hidden cases and failed real images. Add an owner-approved real-sample check before admission.

## Evidence

[Checkpoint report](/hive/implementation/prototype-m3m5-evidence/CHECKPOINT_PROTOTYPE.md) · [model-choice gap](/hive/implementation/prototype-m3m5-evidence/GAP_MODEL_CHOICE.md) · reviews [P1](/hive/implementation/prototype-m3m5-evidence/REVIEW_P1.md), [P2](/hive/implementation/prototype-m3m5-evidence/REVIEW_P2.md), [P4](/hive/implementation/prototype-m3m5-evidence/REVIEW_P4.md) · [full-suite summary](/hive/implementation/prototype-m3m5-evidence/full-suite-summary.txt) · demo receipts in `receipts/` (init, learn A, goal A, goal B, learn C), restart runs in `restart/` and the [acquisition manifest for Goal C](/hive/implementation/prototype-m3m5-evidence/learn-c/acquisition-manifest.json), all under `/hive/implementation/prototype-m3m5-evidence/`. The [publication manifest](/hive/implementation/prototype-m3m5-publication.json) lists every file with its digest. Paths inside the receipts were rewritten to relative names, local endpoint addresses and the owner's name were replaced, and one provider key-prefix mention was generalised; no other content was changed.

## Identity

<!-- identity:start -->
- Code: local branch `build/prototype` in a private build tree, **no public remote**. Baseline `195d13d` (G3). Tested code `73515df`. Checkpoint documents `4c0afa5`.
- Package: **none published**. Latest packaged runtime stays [`HIVE_Connected_Runner_033089b.zip`](/hive/downloads/HIVE_Connected_Runner_033089b.zip).
- Models: local `openai/gpt-oss-20b` (default); hosted NVIDIA NIM under an allowlist and a $5 spend cap for diagnosis. Qualified-model approvals and the signing key are not published.
<!-- identity:end -->
