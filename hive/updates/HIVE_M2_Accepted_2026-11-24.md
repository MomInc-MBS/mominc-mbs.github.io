---
id: HIVE-M2-ACCEPTED-2026-11-24
schema_version: "1.0"
title: "HIVE M2 Accepted: A Local Model Found Two New Effects — 24 November 2026"
date: 2026-11-24
status: "measured-engineering-result; verified on synthetic data; no generality claim"
project: HIVE
artifact_type: evidence_report
priority: high
---

# M2 accepted: a local model found two new effects (24 Nov 2026)

This follows the [M1 note](/hive/notes/M1/). M2 is the first milestone where a real local model proposed the workflows. The independent reviewer accepted both effects. The result is **verified on synthetic data**. It is narrow, and the limits are listed below.

## What M2 tested

- **Protocol:** `m2-local-model-two-effects-v1`, commit `d4b71d2`. Protocol file sha256 `9767b209…`.
- **Model:** `openai/gpt-oss-20b` on LM Studio, localhost, one slot, `Reasoning: low`. The weights were fixed. The weight sha256 matched before the first call, after the last call and after the reuse run.
- **Task:** the model proposed step lists over M1's pinned inventory plus one declared preparation step, `to_json`. Each proposal was checked, retained, reused after a restart, and rolled back.
- **Approval:** Ian approved live inference on 24 Nov.

## The two effects

- **R, `row-convert-v1`:** the file validator from M1, `parse_whole`, was reused as the front end for converting CSV or JSON files into canonical JSON. Nominee: `[parse_whole, to_json]`.
- **C, `batch-merge-v1`:** merging a batch of files, with each whole bad file quarantined. Nominee: `[each(parse_whole), aggregate]`.

## Results

| Check | R | C |
|---|---:|---:|
| Held-out final set (F-final, 60 cases) | 60/60 vs 0/60 for the old workflows | 60/60 vs 30/60 for the strongest old workflow |
| Reuse after restart (20 fresh cases) | 20/20 vs 0/20 | 20/20 vs 10/20 |
| Campaign B reproduction | same digest, 20/20 | same digest, 20/20 |
| Rollback | back to `W_strict`; 3 cases failed as expected | same |
| Integrity | rejected-variant, forged, tampered and stale receipts all refused | same |

Cross-checks: the M1 workflow scored 0/60 on both new sets, and each new nominee scored 0/60 on the other's data. A random legal search hit a correct workflow at draw 3 for R and draw 1 for C.

## Bounds used

- Model calls: 50 of 64.
- Tokens: about 220k of 900k.
- Container runs: 23 of 160.
- Infrastructure retries: 0.

## Claim

With the weights unchanged, gpt-oss-20b at `Reasoning: low`, proposing step lists over M1's pinned inventory plus one declared preparation view (`to_json`), produced on its first proposal in each of four campaigns two distinct effects the starting inventory does not produce: (R) M1's whole-file validator `parse_whole` reused as the parsing and rejection front end of CSV/JSON-to-canonical-JSON conversion, and (C) a two-step composition, `[each(parse_whole), aggregate]`, that merges a multi-file batch with whole-file quarantine. On fresh held-out synthetic data each passed an independently written oracle (R 60/60 vs 0/60; C 60/60 vs 30/60 for the strongest old workflow). Each was reused after a restart (20/20 vs 0/20 and 10/20), reproduced by a second campaign, and rolled back.

## Limitations

- **Tiny search space.** 7 type-legal lists for R (3 correct) and 3 for C (2 correct). Random legal search finds a hit by draw 3. This shows the propose, verify, retain, reuse pipeline with a real local model. It is not search skill, and there is no claim that the model beats random search.
- **Type-forced discovery for R.** Any use of `to_json` from a `Source` must follow `parse_whole`, and the prompt's output spec matches the description of `to_json`. The discovery is close to a type-forced reading of the prompt. `to_json` is new preparation, approved by the owner.
- **Comparators pass 0 by construction.** R's comparators pass 0 by construction, and C's strongest old workflow passes only clean batches. The margin and McNemar values mostly confirm the effect exists. The per-category raw counts are the substantive evidence.
- **C is M1 without `split_rows`.** C's nominee is M1's retained workflow minus `split_rows`. The reviewer ruled the file-level quarantine over a list of sources a distinct use.
- **The conductor knew both answers.** One model, one prompt family, synthetic data only.
- **B reuse is a cache hit.** Campaign B's reuse result is a cache hit on the identical digest. Reproduction means B independently proposed the same workflow.
- **Trust limits are unchanged.** An unkeyed store writer can forge records (SQ-1). Private holdouts sit under the same OS user.
- No claim is made about generality.

## Disclosed deviations (non-blocking)

- The loaded context length (32,768) was set but not logged per campaign. Only the model id and weight sha are evidenced.
- Accepted evidence holds `{final_pass, n, p}`. Transcript hashes and model sha are in the nominee files.
- Restart checks the manifest sha, which covers the oracle hashes, rather than re-hashing oracle files.
- Arm 2 resolves through a store lookup with a digest assertion, not a separate selection path.
- The integration proof read the public selection set with the known solutions before any model call. The model never saw it.
- Harness code is not pinned in the manifest. Git shows it unchanged between freeze and evidence.

## Regression gate

Full suite at the acceptance boundary: 1014 passed, 3 skipped, 0 failed. M1 evidence is unchanged. Two test-isolation faults were found and fixed before the run, with no change to M2 behaviour.

## Versions and cost

- Runtime commit: `1799c58`. Protocol commit: `d4b71d2`.
- Coding agents at list price this session: about $21, including about $1.5 of pre-M2 work. Cumulative: about $85 of the $120 ceiling.
- The local model and 23 container runs cost $0.

## Next

No further work is authorised. Registered ideas: a larger inventory where search matters, a second model, and real data.

Publication grants no runtime authority, promotes no policy and expands no budget. Private evaluator material and per-case held-out labels and results are not published.
