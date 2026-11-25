# M2 report: fixed-weight local-model campaign, two distinct effects (24 Nov 2026)

**Outcome: ACCEPTED (both effects, joint)**, ruled by the designated independent Opus reviewer under protocol §10–§11. The reviewer's two certification conditions are met below: the regression gate and the cost record.

## Identity

- Protocol `m2-local-model-two-effects-v1`, `docs/M2_PROTOCOL.md`, blob sha256 `9767b209264d7e871aa46ded4a2413b53d7be3c5c2f3f5aea25fcdf300ea1cf0`, commit `d4b71d2`. Checkpoint `docs/BUILD_CHECKPOINT_M2_0.md`.
- Evaluation manifest `build/m2/evaluation_manifest.json` frozen at `85c69b9` before any model call. Evidence commit `1a04418`.
- Research subject: `openai/gpt-oss-20b`, weights sha256 `65d06d31…cde53ab`, LM Studio on localhost, one slot, `Reasoning: low`. The weight sha matched before the first call, after the last call and after the reuse run.
- Operator approval: `build/m2/operator_inference_approval.json` (Ian, 24 Nov: "1 and then go on campaign").

## Results

| | R `row-convert-v1` (repurposing) | C `batch-merge-v1` (composition) |
|---|---|---|
| Nominee (from gpt-oss, round 1 of campaign A) | `[parse_whole, to_json]` | `[each(parse_whole), aggregate]` |
| F-final (60, held out) | **60/60** vs 0/60 for W_strict, skill-disabled and strongest old workflow (Δ 100, p 8.7e-19) | **60/60** vs 30/60 strongest old workflow (row-level M1-style), 0/60 W_strict (Δ 50, p 9.3e-10) |
| Reuse after restart (20, fresh) | **20/20** vs 0/20 (p 9.5e-7) | **20/20** vs 10/20 (p 9.8e-4) |
| Campaign B reproduction | same digest, 20/20 on F-reuse | same digest, 20/20 on F-reuse |
| Cross-checks | M1 workflow 0/60; C nominee 0/60 on R data | M1 workflow 0/60; R nominee 0/60 on C data |
| Rollback | resolves to W_strict; 3 cases all `wrong_type`, 0 container runs | same |
| Integrity | rejected-variant, forged, tampered and stale receipts all refused | same |

Random legal search (arm 4) hits a correct workflow at draw 3 (R) and draw 1 (C); over all 1,110 lists, 0 of 20 draws were type-legal.

Bounds used: 50 of 64 model calls, 219,559 of 900,000 tokens, 23 of 160 container runs, 0 infrastructure retries.

## Claim (reviewer-approved wording)

With weights unchanged (sha-verified before, after and post-reuse), gpt-oss-20b at `Reasoning: low`, proposing step lists over M1's pinned inventory plus one declared-preparation view (`to_json`), produced on its first proposal in each of four campaigns two distinct effects the starting inventory does not produce: (R) M1's whole-file validator `parse_whole` reused as the parsing and rejection front end of CSV/JSON-to-canonical-JSON conversion, and (C) a two-step composition, `[each(parse_whole), aggregate]`, that merges a multi-file batch with whole-file quarantine. On fresh held-out synthetic data each passed an independently written oracle (R 60/60 vs 0/60; C 60/60 vs 30/60 for the strongest old workflow). Each was reused after a restart (20/20 vs 0/20 and 10/20), reproduced by a second campaign, and rolled back.

## Limitations (must accompany the claim)

- Tiny search space: 7 type-legal lists for R (3 correct), 3 for C (2 correct). Random legal search finds a hit by draw 3. This shows the propose → verify → retain → reuse pipeline with a real local model, not search skill. No claim that the model beats random search.
- For R, any use of `to_json` from a `Source` must follow `parse_whole`, and the prompt's output spec matches `to_json`'s description. The "discovery" is close to a type-forced reading of the prompt. `to_json` is new preparation, owner-approved (option 1).
- R's comparators pass 0 by construction and C's strongest old workflow passes only clean batches; Δ and McNemar mostly confirm the effect exists. The per-category raw counts are the substantive evidence.
- C's nominee is M1's retained workflow without `split_rows`; the reviewer ruled the file-level quarantine over `List[Source]` a distinct use.
- The conductor knew both answers. One model, one prompt family, synthetic data only.
- Campaign B's F-reuse result is a cache hit on the identical digest: reproduction means B independently proposed the same workflow.
- Trust limits unchanged: an unkeyed store writer can forge records (SQ-1); private holdouts sit under the same OS user.

## Non-blocking deviations (disclosed)

1. Loaded context length (32,768) was set by the conductor but not logged per campaign; only model id and weight sha are evidenced.
2. ACCEPTED evidence holds `{final_pass, n, p}`; transcript hash and model sha live in `nominee_*.json`, prompt hashes in genome provenance.
3. Restart verifies the manifest sha (which covers oracle hashes) rather than re-hashing oracle files directly.
4. Arm 2 resolves through a store lookup of the root with a digest assertion, not a separate selection path.
5. The integration proof read public F-sel with the known solutions before any model call (logged; the model was never exposed).
6. Harness code is not pinned in the manifest; git shows it unchanged between freeze and evidence.

## Regression gate

Full suite at the acceptance boundary: **1014 passed, 3 skipped, 0 failed** (42 min). M1 evidence under `build/m1` unchanged since `5c901a9`. Two test-isolation faults found and fixed before the run (no M2 behaviour change): `test_m2_evaluator` collided with `evaluator/m1` bare module names in a shared process; `test_stub_end_to_end` asserted the real store did not exist, now asserts stub runs leave it unchanged.

## Cost

Coding agents, list price, this session (includes about $1.5 of pre-M2 work: the pin fix and the M1 site page): conductor $6.08 + subagents $15.17 = **$21.25**. M2 ≈ $20 against its $20 reservation (at cap). Cumulative ≈ **$85 of $120**. Runtime: 50 local model calls, $0; 23 container runs, $0.

## Next

Publish M2 to the site with the claim and limitations above. Later work (registered, not authorised): larger inventory where search matters, a second model, real data.
