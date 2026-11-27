# P1 contract audit: site.ref-extract, site.ref-resolve (aggregate and structural only)

Evidence: pilot stores `C:/hive-work/demo/coop-pilot-{57f6a94,04fe137,c3x-fbc2ddb}`; evaluator coverage `C:/hive-work/eval-private/coop-cov-*` (coverage.py); no model calls. No hidden case content is reproduced here.

## 1. Rendered packet (real request, extract incumbent r1, attempt 1)
`request_body` is saved in `model/model_calls.jsonl`; its sha256 equals `request_sha256` (verified for extract and resolve). Extract: system 414 chars, user 11.7k chars, 3615 prompt tokens. Resolve: user 20.7k chars, 6021 tokens.

| Item | Finding |
|---|---|
| Raw input | NOT shown. `prompt()` replaces every `data` base64 with `<base64 N chars>` (`discovery._show`). The proposer sees the input only as a length. |
| Signature, imports | `def run(env: dict) -> str`; base64, json, re. Consistent with contract and static check. |
| Reference binding / output schema | Full spec text and output canonical form present. No contradiction found. |
| Worked cases | extract 7, resolve 8. Expected output shown whole (no truncation since 39ede89). Extract expected rows carry the raws, so the input is only partly inferable; ERROR cases show no cause. |
| Public feedback / carried body | Carried parent body (cap 6000 chars) and "failed X of N hidden cases" feedback present; nothing cut in the sampled packet. |
| Impossible interface | None. An authored body written from spec + public cases alone passes all hidden sets (24/24, tests/test_coop_oracle_sanity.py). |

## 2. Verdict
- **site.ref-extract: contract defect YES (moderate).** (a) Inputs invisible: a parsing task is posed with the parsed text withheld. (b) Spec says rows are in "source order" but lists `<style>` bodies as a separate step 4; the dev split cannot tell source order from "style-body rows after all tag rows" (a variant of the authored body that defers style rows still passes 7/7 public cases).
- **site.ref-resolve: contract defect YES (minor, dev-split).** The spec never says that characters outside %-escapes pass through unchanged; no public case has a raw with a literal non-ASCII character. Class logic is otherwise fully specified and the models get it right.

## 3. Why dev-perfect candidates fail hidden (structural; cases failed, across all dev-perfect candidates)
Dev-perfect candidates: extract 4 (all 57f6a94; 0 in 04fe137, 0 runs in c3x), resolve 42 (37 fail hidden, 5 pass: 2 of 9 runs in 57f6a94, 0 of 6 in 04fe137, 1 of 9 in c3x).

| Cap | Category | Failed cases | Reading |
|---|---|---|---|
| extract | row order within a page (style-body rows not at the `<style>` tag position) | 25 of 36 (3 candidates) | spec ambiguity + dev split lacks "style body before another referencing tag" |
| extract | missing css-url rows | 11 of 36 (1 candidate) | model logic |
| resolve | literal non-ASCII character in raw (mangled by decode) | 123 of 123 (37 candidates) | spec silent + dev split lacks the kind |

All resolve class assignments were correct in every failure; only targets differed, only on that one kind. No error-class failures. Extract failures are never about the ERROR classes.

Extract overall: only 4 of 95 judged candidates (57f6a94 + 04fe137) reach dev-perfect: consistent with the invisible-input defect plus model limit. Resolve: mostly a dev-split coverage defect, not capability.

## 4. Existing route
`site.ref-extract` and `site.ref-resolve` already exist as operator-authored registered capabilities (`hive operator cap author`, bodies `build/g1/authored/`, docs/CHECKPOINT_M3M5_G0_G1.md). The G1 raw-folder goal runs VERIFIED with 0 model calls. That is a valid product route and is not model learning; learned-route work on these two caps measures only the spec/dev-split gaps above.

## 5. Suggested fixes (not applied)
Show decoded input text in worked cases; state "source order includes style bodies at their tag position" and "other characters are kept as written"; add one public case for each of the two hidden-only kinds.
