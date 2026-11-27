# Cooperative inference: C0-C3 slice and development pilot (26 Nov 2026)

Plan: `HIVE_Cooperative_Inference_Research_and_Build_Plan_2026-11-26.md` (owner handoff). Branch `build/prototype`, local only.
Status: **vertical slice built, off by default. Development pilot result: no recipe beats the incumbent; masking is negative. Nothing promoted.**
This is development/feasibility evidence (n = 3 campaigns per cell, one model, three task families). It is not a sealed final evaluation and supports no percentage-point claim.

## 1. What was built
| Commit | Change |
|---|---|
| `57f6a94` | C1/C2 cooperative round. `open_experiment(coop=sample3\|diverse3)` freezes the recipe into the protocol; `coop=None` keeps the frozen dict and `exp_id` byte-identical (pinned by test). One round per experiment: prompt built once, 3 gated and charged calls (no branch sees another), dev check of each distinct candidate, differential agreement on public `gen_public.case` inputs (expected values discarded), pure `coop.select` (dev pass > agreement > dev_ms > sha, never reads `acceptance`), hidden gate for the selected candidate only. Typed per-candidate fields on the existing experiment record (recipe_id, branch, seed, temperature, parent_sha, latency, out_tokens, failure_category, agreement, selected). Caps and approvals unchanged. C0 map `docs/COOP_C0_MAP.md`. |
| `04fe137` | C3 masking arms. `maskpos3`: intact branch plus two complementary halves of the spec's eligible noun/verb words blanked (`___`). `maskrand3`: count-matched random words. Masks built offline with an isolated nltk 3.9.1 tagger venv (`scripts/coop_masks.py`, `build/coop/masks/*.json`; HIVE runtime stays stdlib-only), checked against spec and frozen hashes before any call. Only the spec text is masked (worked cases, feedback and best body intact). Protected: code, quotes, digit/symbol tokens, ALL-CAPS, negations, quantifiers, modals. Realized rate 17-18% of spec words per masked branch. |
| `12f42f0`, `fbc2ddb` | Pilot script `--order interleaved` and `--first-repeat`. |
Tests: targeted 97 passed / 1 skipped (`57f6a94`), 73 passed / 1 skipped (`04fe137`, the skip is the nltk-only test, verified in the venv). Full suite not rerun.

## 2. Pilot setup
`scripts/coop_pilot.py` through `scripts/g3_qualify.acquire_gap` (the existing campaign driver). Local `openai/gpt-oss-20b` (LM Studio, 32k, the pinned M2 weights), $0 runtime. One fresh store per (capability, recipe, repeat); campaign = up to 3 experiments with carry-best, each experiment `EXP_BUDGET` (3 calls, 3 proposals, 10 container runs, 6000 output tokens). Incumbent = the existing sequential loop (temperature 0.2, feedback between calls). Co-op recipes: temperature 0.7.
- Batch 1 (`57f6a94`): 3 caps x {incumbent, sample3, diverse3} x repeats 1-3, grouped order. 27 runs.
- Batch 2 (`04fe137`): 3 caps x {maskpos3, maskrand3} x repeats 1-3, grouped. 18 runs.
- Batch 3 (`fbc2ddb`): resolve + check x {sample3, maskpos3, maskrand3} x repeats 4-6, **interleaved** (same-time control). 18 runs.
- Coverage: `evaluator/coop/coverage.py` judged every distinct candidate on its experiment's sealed hidden set afterwards, into `C:/hive-work/eval-private/coop-cov-*` only. Nothing from it reached a runtime selector.
Evidence: `C:/hive-work/demo/coop-pilot-{57f6a94,04fe137,c3x-fbc2ddb}/rows.jsonl` + stores; coverage under `C:/hive-work/eval-private/`.

## 3. Results (selected-answer success = the candidate HIVE itself chose passed the hidden gate)
| cap | recipe | batch | passed | coverage (any candidate passes) | dev-perfect candidates | calls (sum) | hidden-gate tries per run |
|---|---|---|---|---|---|---|---|
| ref-extract | incumbent | 1 | 0/3 | 0/3 | 1 | 27 | 1,0,0 |
| ref-extract | sample3 | 1 | 0/3 | 0/3 | 2 | 27 | 0,0,2 |
| ref-extract | diverse3 | 1 | 0/3 | 0/3 | 1 | 27 | 0,1,0 |
| ref-resolve | incumbent | 1 | **1/3** | 1/3 | 10 | 25 | **5,1,4** |
| ref-resolve | sample3 | 1 | 0/3 | 0/3 | 8 | 27 | 1,2,1 |
| ref-resolve | diverse3 | 1 | 0/3 | **1/3** | 10 | 27 | 2,1,2 |
| ref-check | incumbent | 1 | 2/3 | 2/3 | 2 | 12 | 1,1,0 |
| ref-check | sample3 | 1 | **3/3** | 3/3 | 4 | **9** | 1,1,1 |
| ref-check | diverse3 | 1 | 2/3 | 2/3 | 6 | 15 | 1,2,1 |
| ref-resolve | sample3 | 3 | 1/3 | 1/3 | 9 | 23 | |
| ref-resolve | maskpos3 | 3 | 0/3 | 0/3 | 2 | 27 | |
| ref-resolve | maskrand3 | 3 | 0/3 | 0/3 | 0 | 27 | |
| ref-check | sample3 | 3 | 2/3 | 2/3 | 10 | 15 | |
| ref-check | maskpos3 | 3 | 2/3 | 2/3 | 4 | 18 | |
| ref-check | maskrand3 | 3 | 1/3 | 2/3 | 9 | 21 | |
Batch 2 (masking, grouped order) passed 1/18 in total but is confounded by a refusal surge (section 4.3); batch 3 is the masking comparison of record.

## 4. Findings
1. **Coverage, not selection, is the binding limit.** In 63 runs the selector lost a generated correct candidate twice (resolve diverse3 r3, check maskrand3 r6); everywhere else coverage equals selected success. `site.ref-extract` produced no correct candidate in any recipe (0/15 coverage).
2. **Two-voter agreement cannot break a tie.** The resolve diverse3 r3 loss: two dev-perfect candidates differed on 1 of 8 differential inputs, so both scored agreement 7, and the sha tie-break picked the 21/24 one over the 24/24 one. Agreement needs at least 3 voters, or a check that can decide a disagreement (see section 6).
3. **Refusals burn calls.** gpt-oss answered "I'm sorry, but I can't help with that" on 0-56% of calls depending on cap and time. The diverse3 "Method" line had 0/69 refusals in batch 1, against 6/63 for sample3. In batch 2 the intact branch 0, input-identical to sample3's branch 0, refused 17/54. In the interleaved batch 3 it was back to 0-3 per cell, so batch 2 was a period effect on the server (cause unproven).
4. **Seeds do not make LM Studio reproducible.** Byte-identical requests with the same seed at temperature 0.7 gave different replies in 8 of 9 pairs. Repeats are fresh samples, not replays.
5. **The incumbent's resolve pass used more hidden-gate tries.** The existing loop gates every dev-perfect proposal, up to 9 per campaign, and each try returns a pass count (the known leak). The co-op round gates one candidate per experiment, at most 3 per campaign. At equal hidden-gate access the incumbent's resolve advantage is not established.
6. **Masking (the owner's noun/verb proposal) is negative here.** In the same-time batch 3, masking cut dev-perfect resolve candidates from 9 (sample3) to 2 (noun/verb) and 0 (random), and neither masked arm passed resolve. On check it was 2/3 vs 2/3 vs 1/3. Noun/verb vs count-matched random: no reliable difference at this size. Recorded as a limit: do not use spec masking for code-acquisition prompts.

## 5. Costs
- Runtime: 489 local model calls (batch 1 196, batch 2 162, batch 3 131), within the plan's 576-call pilot envelope; $0 paid. Wall time about 2.3 h for the three pilot batches plus about 50 min of coverage container runs. GPU-seconds and peak VRAM were not instrumented (unknown; gpt-oss resident at 12.1 GB, OBS not running).
- Deviation: the plan's resource-admission profile (numeric VRAM/RAM/tool fields measured with OBS and cameras on) was not frozen before the pilot. It ran inside the existing local-campaign envelope (one resident model, one experiment at a time).
- Coding agents: $13.72 list price this session (Opus conductor + 3 Sonnet workers, `agent_usage_tally` over session + subagents). Cumulative about $313 of the $400 ceiling (estimate; owner billing reconciliation still open).

## 6. Decision and smallest next steps
- Default stays `incumbent`; the co-op recipes stay available behind `coop=`. No recipe qualified, so nothing is registered or routed by default.
- Next bounded task (0 model calls): replay selection offline on the stored candidates with (a) every non-static candidate of the round as an agreement voter and (b) the public generator's construction answers on the disagreeing inputs, declared as a separate check type and credited to the check, not to the ensemble. Pass only if it recovers the lost candidates without picking any wrong one.
- Then G3 (model routing): coverage is the limit, so the next real lever is a second qualified backend on extract/resolve (hosted Nemotron under the active <=$5 NIM approval), compared at equal hidden-gate access.
- Prompt fix to test as its own arm: an explicit method line against refusals (0/69 vs 6/63 here, not yet a controlled test).
- Token-level pooling (C7) stays parked.

## Rollback
`git checkout 8fdc061` (before this slice). The feature is off by default; old stores and exp_ids are unaffected.
