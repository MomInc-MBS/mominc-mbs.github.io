---
id: HIVE-COOP-C4-G3-2026-11-26
schema_version: "1.0"
title: "Cooperative inference and G3 routing: hosted backend screen, 26 November 2026"
date: 2026-11-26
status: "development screen; nothing routed by default; hosted finals admitted in a test store only; code branch local only, nothing packaged; trusted local scope; not production-approved; not a research acceptance"
project: HIVE
artifact_type: evidence_report
priority: high
---

# Cooperative inference and G3 routing: hosted backend screen (26 Nov 2026)

This follows the [prototype checkpoint M3-M5](/hive/notes/M3M5/), which left two site capabilities, `site.ref-extract` and `site.ref-resolve`, unlearned by any model the conductor tried. This campaign asked why, whether several cooperating samples from one model help, and whether a second backend does. It is a **development screen**, not a powered accuracy study.

## Verdict

- **No cooperative recipe beat the incumbent.** The C0-C3 pilot was 63 development runs with local gpt-oss-20b. Coverage (whether any generated candidate was correct) was the limit, not selection. Masking part of the spec text was negative.
- **The specs had defects.** A contract audit found the `site.ref-extract` and `site.ref-resolve` specs omitted rules the hidden checks relied on. Contract v2 states them and was applied to both backends.
- **Selector repair was not met.** An offline replay (0 model calls) of four selector variants found no repair that recovered the lost candidates with no regressions. The existing selector is kept.
- **A hosted backend produced the first correct `site.ref-extract` artifacts.** Under a sealed-final, public-feedback-only policy, hosted Nemotron passed 4 of 4 sealed finals and local gpt-oss-20b passed 2 of 4 (resolve only).
- **Admission and a fresh-process reuse test passed in a test store.** Nothing is routed by default and nothing is packaged.

## C0-C3 pilot

Three task families, one local model, up to six repeats per cell. No recipe beat the incumbent sequential loop. Of 63 runs, the selector lost a correct generated candidate twice; everywhere else coverage equalled selected success, and `site.ref-extract` produced no correct candidate in any recipe. Two-voter agreement cannot break a tie. Masking nouns and verbs, or random words, cut dev-perfect candidates and did not help. Seeds did not make the local server reproducible. Full detail: [pilot report](/hive/implementation/coop-c4g3-evidence/COOP_PILOT_REPORT.md).

## Contract audit and selector replay

All 123 hidden-case failures of 37 dev-perfect resolve candidates were one kind of defect the spec never stated; extract showed inputs only as a length placeholder and had an ambiguous ordering rule. Contract v2 fixes both and adds one public case per kind. This fix was informed by development hidden failures, which is disclosed; the screen used fresh hidden sets. See the [contract audit](/hive/implementation/coop-c4g3-evidence/P1_CONTRACT_AUDIT.md).

The replay re-ran the stored pilot candidates through four selector variants with 0 model calls. The best variant recovered 1 of the 3 lost pools with no regressions; the gate required both named losses, so the **existing selector is kept**. See the [replay report](/hive/implementation/coop-c4g3-evidence/REPLAY_REPORT.md).

## Backend screen

Policy: sealed final, public feedback only. The recipe is the existing sequential loop at temperature 0.2 on both backends, 2 repeats per capability, four paired blocks, order alternating.

| Capability | Repeat | Hosted Nemotron | Local gpt-oss-20b |
|---|---|---|---|
| ref-extract | 1 | PASS | FAIL (9 of 9 replies short refusals or stubs) |
| ref-extract | 2 | PASS | FAIL (4 of 9) |
| ref-resolve | 1 | PASS | PASS |
| ref-resolve | 2 | PASS | PASS |

Hosted 4 of 4 sealed finals in 12 calls; local 2 of 4 in 30 calls. Local `ref-extract` was dominated by refusals; whether the decoded-input view raises refusals is an open, untested hypothesis. The pilot and screen are not comparable before and after, because contract v2 changed for both backends at once.

**Recording headroom.** The screen ran while an OBS three-camera recording was measured (local NVENC recording, no stream). Over the whole session: 0 of 32,521 output frames skipped. Every block passed the frozen admission thresholds. See the [resource profile](/hive/implementation/coop-c4g3-evidence/admission-profile-v1.json) and [probe report](/hive/implementation/coop-c4g3-evidence/probe-report.json).

## Admission and C5 (0 model calls)

- The hosted sealed finals passed a **second, fresh hidden set 24 of 24** (extract and resolve), through a new sealed-final acceptance route that verifies the frozen campaign receipt and then applies the standard authored-route gates.
- Both were **admitted as learned capabilities in a test store only**.
- A fresh-process ordinary operator goal on the unseen release `0b3854a` was **VERIFIED**, with 0 new experiments and 0 model calls. The output is **byte-identical** to the authored body run separately and to the release's own exports. It is not a cache: a different release gives a different, VERIFIED output.
- A signed revoke removed both: the next goal was UNRESOLVED with 0 capability runs.
- In a second store with the authored v1 first, admitting the learned body as v2 was **refused by the existing improvement-only chain rule**. The rule is kept, so signed rollback to a previous version is not demonstrated.
- Finding, not changed: revocation is one global list keyed by capability and version number, so a revoke in one store would also hit the same version in another. The test used a scratch copy. A store-scoped list is the fix if it matters.

See the [C5 report](/hive/implementation/coop-c4g3-evidence/C5_REPORT.md) and [learned-store report](/hive/implementation/coop-c4g3-evidence/C5_LEARNED_REPORT.json).

## Limits

- Development screen: 2 campaigns per cell and two capability families. Not a powered accuracy study.
- Hosted Nemotron is qualified as an explicit route only. **Nothing is routed by default**; the local incumbent stays the default.
- Admission was in a test store; the operator and demo stores are unchanged.
- The code is on a local branch with no public remote. **Nothing is packaged**; the latest packaged runtime stays the [Connected Goal Runner](/hive/notes/CONNECTED/).
- Not Level A, not Level B, not a production approval. No claim that mixing backends helps.

## Budget

HIVE model calls 537 of 576. Hosted NVIDIA NIM $2.64 of the $5 approval. Coding agents about $336 of the $400 ceiling (list-price estimate, not a billed ledger).

## Evidence

[Screen report](/hive/implementation/coop-c4g3-evidence/COOP_C4_G3_REPORT.md) · [pilot report](/hive/implementation/coop-c4g3-evidence/COOP_PILOT_REPORT.md) · [contract audit](/hive/implementation/coop-c4g3-evidence/P1_CONTRACT_AUDIT.md) · [replay report](/hive/implementation/coop-c4g3-evidence/REPLAY_REPORT.md) · [C5 report](/hive/implementation/coop-c4g3-evidence/C5_REPORT.md). The [publication manifest](/hive/implementation/coop-c4g3-publication.json) lists every file with its digest. One interpreter path containing the operator's account name was shortened in the copies; no other content was changed.

## Identity

<!-- identity:start -->
- Code: local branch `build/prototype` in a private build tree, **no public remote**. Source commit `6b561fd`.
- Package: **none published**. Latest packaged runtime stays [`HIVE_Connected_Runner_033089b.zip`](/hive/downloads/HIVE_Connected_Runner_033089b.zip).
- Models: local `openai/gpt-oss-20b`; hosted NVIDIA NIM Nemotron under an allowlist and a $5 spend cap. Approvals and signing keys are not published.
<!-- identity:end -->
