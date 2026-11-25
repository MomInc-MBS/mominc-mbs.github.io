# M2 evaluation protocol: `m2-local-model-two-effects-v1` (Gate F)

- **Status:** frozen at commit time. Its identity (sha256 of these exact bytes, EOL-normalized to LF, plus the commit) is recorded **outside** this file, in `docs/BUILD_CHECKPOINT_M2_0.md`. No M2 candidate has run and no model call has been made.
- **Freeze is not an inference go.** Approving this protocol does **not** authorise running the campaign. M2-2 and later need Ian's separate operator-approval file (§13). Building the harness (M2-1) uses a deterministic stub model server and makes no real-model call.
- **Runtime base:** `build/working-prototype` @ `5c901a91f8e5389b46a01259b0165ee456381c40` (M1 accepted; M1 evidence under `build/m1/` and `src/hive/m1_views.py` stay byte-unchanged).
- **Master:** `HIVE_Master_Evolution_Build_Path_FINAL_Claude_Nemotron_2026-11-23.md` (v0, 85,231 B). Execution supplement: `docs/HIVE_POST_M0_BUILD_PATH_20261123.md` §10.1. M1 precedent: `docs/M1_PROTOCOL.md`, `docs/M1_REPORT.md`.
- **Decision vector (unchanged):** `D1=D D2=C D3=C D4=E D5=A D6=B D7=B D8=C D9=C D10=C D11=C`. D7=B: M2 is two distinct effects in a fixed-weight local-model campaign.
- **Narrow claim M2 may make:** a fixed-weight local model (weights never trained or modified), proposing declarative step lists over M1's pinned inventory plus one declared-preparation view (`to_json`), produced two distinct effects the starting inventory does not produce: (R) an existing capability (`parse_whole`) repurposed, through the new view, to drive file-format conversion, and (C) a composition of existing capabilities for a multi-file batch merge. Each was verified by an independently authored oracle on fresh held-out data, beat its declared comparators, was reused after a restart, and was rolled back. Nothing broader: no claim about search difficulty, real-world data, other models or generality.

## 1. Effects, novelty and distinctness

**Starting inventory (novelty baseline):** M1's views (`identity`, `parse_whole`, `split_rows`, `aggregate`) and combinator `each`, with M1's pins, plus **one new preparation view, `to_json`** (§3). `to_json` is new code, not a view of an existing function; like `each` in M1 it is declared preparation and counts as nothing discovered. The inventory also includes the workflows registered before M2 (M0 text workflows, `W_strict`, M1's accepted workflow). None emits converted bytes or a file-level batch merge.

| | Effect R: `row-convert-v1` (repurposing) | Effect C: `batch-merge-v1` (composition) |
|---|---|---|
| Input | one `grouped_inventory_v1` file (CSV or JSON), type `Source` | a batch of 2 to 6 `grouped_inventory_v1` files, type `List[Source]` |
| Target type | `Source` (canonical JSON bytes) | `Report` |
| Output | `{"converted":<canonical JSON text of the file's rows>,"quarantined":[]}`, or `{"error":"source_rejected"}` if the file has any defect | `reconciled_inventory_v1` over the rows of fully valid files; `quarantined` lists whole invalid files |
| Existing capability | `parse_whole`, built as a validator feeding `aggregate`, now drives format conversion when paired with `to_json`. | `each` + `parse_whole` + `aggregate`, composed at file granularity. |
| Expected nominee (known to the conductor, never shown to the model) | `[parse_whole, to_json]` | `[each(parse_whole), aggregate]` |

**Novelty rule.** An effect is newly available only if (a) no starting-inventory workflow passes the effect's oracle on ≥ 10% of the defective units of F-dev (files for R, batches for C), under the §2 wrong-type rule, and (b) the nominee passes the oracle on F-final. Rule (a) is also applied to the effect's arm 3 under the same projection. For R, the old inventory (without `to_json`) has exactly 3 type-legal lists, `[identity]`, `[identity, identity]` and `[identity, identity, identity]`; all behave as `[identity]`, which returns the original bytes: it passes 0 invalid files because their expected output is `{"error":"source_rejected"}`, and 0 valid files because CSV bytes are not JSON and every JSON file is non-canonical (§2). An effect whose arm 3 passes ≥ 10% of the defective units of F-dev is not newly available. Wrappers, renames and parameter changes never qualify. Two effects are **distinct** only if all of these hold (the Opus reviewer rules on them, §11):
1. Oracle output schemas differ (`{"converted","quarantined"}` or `source_rejected` vs `reconciled_inventory_v1` with file-level quarantine).
2. Input and target types differ (`Source` → `Source` vs `List[Source]` → `Report`).
3. Nominees share only `parse_whole`. R's (`[parse_whole, to_json]`) uses the new view and no `each`; C's (`[each(parse_whole), aggregate]`) uses `each` and `aggregate` and no `to_json`. C's quarantine unit (a file) and input type (`List[Source]`) differ from M1's (a row; `Source`) and from R's (one file in, one converted file or a rejection out).
4. Cross-check: each nominee passes ≤ 10% of the other effect's F-final cases, and M1's workflow passes ≤ 10% of both M2 F-final partitions. Note: this holds automatically under the wrong-type rule; the C-vs-M1 separation rests on arm 3 failing every defective batch. The cross-check reads are part of the F-final episode and are logged in the exposure log.

**Disclosed weaknesses.** (i) **`to_json` is new preparation.** R's claim is only that the model discovers its pairing with the existing `parse_whole`, whose built purpose was validating rows for `aggregate`. The reviewer rules whether that is a repurposing of an existing capability; a ruling against means R is not accepted. (ii) **Residual risk:** R and C both use `parse_whole` as a whole-file gate, and C's nominee is a strict sub-sequence of M1's retained workflow without `split_rows`. The reviewer must rule that single-file conversion and a multi-file merge with file-level quarantine are distinct uses (condition 3). (iii) **Known-solution disclosure:** the conductor knows both solutions. They appear nowhere in the prompts (§4), and the discovery claim is only that the model proposed them unaided under the pinned prompts. (iv) R's comparators pass 0 files by construction, so its benefit test mostly confirms the effect exists. (v) Only `parse_whole` (directly or under `each`) produces `List[Row]`, so from a `Source` input any use of `to_json` must follow it. R's discovery is the choice to use the new view; the repurposing is real (`parse_whole`'s validation and CSV integer normalisation make the conversion correct, and its whole-file error, routed through the uniform harness failure channel, supplies the rejection), but it is not a search result.

## 2. Task contracts

- **R input:** one source file: `format ∈ {csv, json}` and bytes. UTF-8, no BOM; CSV has the exact header `id,group,bytes` and three fields per row; JSON is an array with no duplicate keys or non-finite numbers; 1 to 60 rows (≥ 2 if defective); no duplicate `id`s. Defects are exactly M1 §2's categories 1 to 5 (messages and precedence as there). Every JSON file, valid or invalid, in every partition is **non-canonical**: its bytes differ from `json.dumps(<its own array>, sort_keys=True, separators=(",",":"), ensure_ascii=True)` (extra whitespace, unsorted keys or literal non-ASCII characters).
- **R output (`row_convert_v1`):** canonical JSON (sorted keys, separators `,` `:`, `ensure_ascii=True`). **Valid file:** `{"converted":T,"quarantined":[]}`, where `T` is the UTF-8 text of `json.dumps(rows, sort_keys=True, separators=(",",":"), ensure_ascii=True)`, `rows` are the file's data rows in input order as `{"bytes":int,"group":str,"id":str}` (CSV `bytes` as an integer), and the format is JSON whatever the input format. **Invalid file (any defect):** `{"error":"source_rejected"}`; the reason is not part of the output. Harness projection (declared preparation, the same for every workflow): a final `Source` gives `converted` = its bytes decoded as UTF-8; the M1 error channel writes `quarantined` for every workflow, and without `each` it is `[]`; any failure outside `each` gives `{"error":"source_rejected"}`. Whole-file rejection was chosen over per-row quarantine so that R stays a single-file, single-output effect; a row-quarantine variant would be a swapped-terminal copy of M1's row effect. That variant still exists in the legal space as a decoy and passes the valid files only. Any workflow whose static input or last output type differs from the effect's input or target type is not executed under that effect. Its output is `{"error":"wrong_type"}` on every case, and it passes 0 cases. This applies to arms 1 and 2, to M1's workflow in the §1 cross-check, and to novelty rule (a). It is a legality check shared by both effects, not a ranking rule among legal workflows.
- **C input:** a JSON envelope `{"files":[{"format":"csv"|"json","text":<the file's UTF-8 text>}, …]}` with 2 to 6 files. The harness decodes it, in order, to a `List[Source]` (declared preparation, identical for every workflow). Each file obeys R's source rules with 1 to 30 rows (≥ 2 if it has a defect). Ids are unique within a file and may repeat across files. A file is **valid** if its rows have no defect, and **invalid** otherwise.
- **C output (`batch_merge_v1`):** canonical JSON as above, in the `reconciled_inventory_v1` shape: `groups` aggregates exactly the rows of valid files (count and bytes per group). `quarantined` lists each invalid file as `{"index":<0-based file position>,"reason":<exact parse_source message for that file's first failing row>}`, in ascending order. A clean batch has `quarantined = []`. Every file appears exactly once, either in `groups` or in `quarantined`. The M1 error channel (M1 §3.1) writes `quarantined` for every workflow; without `each`, `quarantined = []`. A failure outside `each` gives `{"error":"source_rejected"}`. The §2 wrong-type rule applies equally.
- **Pass unit:** one source file (R) or one batch (C); byte-for-byte equality with the oracle's canonical output.

## 3. Inventory and legal search space (pinned before any campaign)

- **Inventory:** M1's `identity`, `parse_whole`, `split_rows`, `aggregate` and `each(·)`, with M1's pins, plus **`to_json`**: type `List[Row]` → `Source`; it returns `{"format":"json","bytes":json.dumps(rows, sort_keys=True, separators=(",",":"), ensure_ascii=True).encode("utf-8")}` for its input rows in order. It uses the standard library only, inspects no values and applies no filtering. Its pin is the sha256 of its `inspect.getsource` (it wraps no base function) and is added to the inventory pin set. M1's pins and `to_json`'s pin are verified at M2-1; any drift blocks the freeze of the manifest. `to_json` lives in the new `src/hive/m2_views.py`, which extends M1's `TYPES`, `PRIMS` and `run_workflow` by import. `src/hive/m2_workflow.py` adds only the C envelope decode, R's projection and the wrong-type check, reusing M1's `canonical_output`. `m1_views.py` is not edited.
- **Grammar:** M1 §3.2 unchanged: 1 to 3 linear steps; each step is a primitive or `each(primitive)`; no nesting, parameters, loops or conditionals; adjacent types must match; the first input type is the effect's input type; the last output must equal its target type; duplicate digests are refused.
- **Space:** 10 symbols (5 primitives and their `each` forms), so 1,110 lists of length ≤ 3. For R (`Source` → `Source`), exactly **7** type-check: `[identity]`, `[identity, identity]`, `[identity, identity, identity]` (all behave as `[identity]`); `[parse_whole, to_json]`, `[identity, parse_whole, to_json]`, `[parse_whole, to_json, identity]` (all behave as the nominee); and `[split_rows, each(parse_whole), to_json]` (row-quarantine decoy, passes the valid files only). For C (`List[Source]` → `Report`), exactly **3** type-check, unchanged by `to_json` because nothing from `List[Source]` reaches `Report` through it within 3 steps: `[each(parse_whole), aggregate]`, `[each(identity), each(parse_whole), aggregate]` (behave as the nominee) and `[each(split_rows), each(parse_whole), aggregate]` (the fixed arm). The harness recomputes these counts at M2-1, and a mismatch blocks the freeze of the manifest.
- **Forbidden surfaces:** the model and the candidates cannot touch the evaluator, oracles, generators, F-sel/F-final/F-reuse cases or answers, receipts, the usage ledger, this protocol, `configs/m2_campaign_policy.json`, `configs/m2_prompts/`, the store's acceptance records, or the M0 policy's `frozen_outside_surface`. The model's output is text, parsed only as a declarative step list, and never executed. Candidates run in the existing container backend with network off.

## 4. Research subject, prompts and sampling (pinned)

| Item | Value |
|---|---|
| Model | `gpt-oss-20b`, model string `openai/gpt-oss-20b` (from `lms ls`; M2-1 confirms it against `GET /v1/models`; pinned here and in the approval file), `D:/LMStudio/models/lmstudio-community/gpt-oss-20b-GGUF/gpt-oss-20b-MXFP4.gguf`, 12,109,565,632 bytes, sha256 `65d06d31a3977d553cb3af137b5c26b5f1e9297a6aaa29ae7caa98788cde53ab` |
| Serving | LM Studio OpenAI-compatible `POST http://localhost:1234/v1/chat/completions`, single slot, context 32768 (the known-good config on this 16 GB GPU). The loaded model id and context are logged per campaign. A different file, quantization or id invalidates the run. |
| Weights | Never trained, fine-tuned, merged or edited. The file sha256 is verified **before the first call and after the last call** of the whole run, and again after F-reuse. Any mismatch means INVALIDATED. |
| Sampling | `temperature 0.7`, `top_p 0.95`, `top_k 40`, `max_tokens 6000`, `stream false`, `n 1`, `repeat_penalty 1.0`, `frequency_penalty 0`, `presence_penalty 0` sent explicitly, no tools, no `response_format`. `seed = 2026110000 + 1000·campaign + 100·effect + round`, with campaign A=1 or B=2, effect R=1 or C=2, and round ≥ 1; smoke seeds are `2026110000 + 9000 + i` for i = 1, 2. |
| System text | Begins `Reasoning: low`. |
| Output contract | The harness reads only `choices[0].message.content`, never `reasoning_content`. It scans every `{` position p in that text and keeps the last p where `json.JSONDecoder().raw_decode(content, p)` returns a dict with keys exactly `{"steps"}` and `steps` a list of 1 to 3 strings. If there is none, the proposal is invalid. No other extraction, stripping or fence removal is allowed. The `steps` strings are matched byte-for-byte against the inventory symbols, with no case, whitespace or alias normalization. The harness never edits a proposal. Anything else is an invalid proposal, and it counts. A "repair" means only the model's next proposal after a refusal shown in history; it uses a round. |
| Per-call limits | Prompt size is measured as UTF-8 bytes ≤ 28,000, checked before the call. If over, the oldest history rows are dropped one at a time, each drop logged in the transcript. If the base prompt with no history is over, M2-1 blocks the manifest freeze. Timeout 300 s, ≤ 2 identical-bytes retries after an HTTP or transport failure (retries count as calls). A round whose call fails after 2 retries still consumes the proposal and is recorded `transport_failure`. Request bodies are logged. |

**Prompt files (to be committed in M2-1A):** `configs/m2_prompts/system.txt`, `propose_R.txt`, `propose_C.txt`, `history.txt`, `contract.txt` (the tool contract) and `smoke.txt`. Their sha256 values are recorded in the evaluation manifest. This protocol pins **content rules, not hashes**:
1. A proposal prompt contains only the symbol table (name, type, one-line behaviour from §3), the grammar rules, the effect's task text, the five defect messages spelled out in full in precedence order, the input and target types, the output contract, and the first 3 F-dev cases (one valid or clean, two defective) with inputs and expected outputs. The task text is the §2 input and output bullets for that effect (for C, preceded by R's input bullet as the per-file source rules), with every sentence removed that begins "Harness projection", "The M1 error channel", "Whole-file rejection was chosen", "That variant still exists", "Any workflow whose static input", "Its output is", "This applies to", "It is a legality check" or "The §2 wrong-type rule", and with these substitutions: "Defects are exactly M1 §2's categories 1 to 5 (messages and precedence as there)" → "Each defective row has one of the five defects listed below; when several apply, the earliest listed wins"; "exact parse_source message" → "exact message from the list above"; "canonical JSON as above" → "canonical JSON (sorted keys, separators `,` `:`, `ensure_ascii=True`)"; "R's source rules" → "the per-file source rules above". M2-1 scans every committed prompt file for `M1`, `parse_source`, `decoy`, `quarantine variant` and `wrong_type`; any hit blocks the manifest freeze.
2. It contains **no** step list that solves either task, no hint such as "validate each file", "split into rows" or "parse then serialize", no M1 identity or result, no mention of F-sel, F-final or F-reuse, and no evaluator internals.
3. Each round is a fresh single-turn message containing the history of the last ≤ 6 rounds of the same campaign. A history row holds the submitted steps and an outcome: the refusal reason, or `F-dev passes k of 24` and up to 3 failing F-dev cases (actual vs expected, with the 600-character truncation applied to each actual and each expected output separately).
4. The model never sees F-sel scores.
5. The 2 smoke calls use `smoke.txt`, a non-proposal prompt (it asks for a fixed JSON reply). A smoke call cannot be nominated, is logged in `model_calls.jsonl` as `kind: smoke`, and is excluded from every campaign transcript and proposal count.

## 5. Data partitions (evaluator-authored synthetic; $0; no network)

Both effects use the same sizes. "Valid/invalid" means a valid/invalid file for R and a clean/defective batch for C (defective: at least one invalid file). Cells are n = valid + invalid, per format. For C a batch is all-CSV or all-JSON.

| Partition | Generator | n per effect | CSV valid / invalid | JSON valid / invalid | Access |
|---|---|---:|---|---|---|
| F-dev | G7 | 24 | 6 / 6 | 6 / 6 | Shown to the model through §4 rule 3. |
| F-sel | G7 | 20 | 5 / 5 | 5 / 5 | Score only; the harness reads it, the model never does. Every read is logged. |
| F-final | G8 | **60** | 15 / 15 | 15 / 15 | Evaluator only. Read once by each nominee and the arms. |
| F-reuse | G9 | 20 | 5 / 5 | 5 / 5 | Evaluator only. Used only after restart (§9). |

- **Defective files and batches:** an invalid file has at least 2 rows, and 1 to 50% of its rows are defective (at least one). A defective C batch has at least 1 valid file and invalid files making up at most half of the batch, rounded down, and at least one. Every applicable defect category (1 to 5, where 1 is JSON-only and 4 is CSV-only) is the first-failure category of at least one invalid file in each partition, and of at least 10% of the invalid files in F-final. At least 20% of invalid files have two or more defective rows of different categories. At least 20% of defective C batches have two or more invalid files with different first-failure categories. Every JSON file (R and C) is checked against the non-canonical rule in §2, and the generator records which of its three forms each JSON file uses.
- **Sizes:** R files have 1 to 30 rows (G7), 1 to 60 (G8) and 40 to 60 (G9). C batches have 2 to 4 files of 3 to 15 rows (G7), 2 to 6 files of 3 to 30 rows (G8) and 5 to 6 files of 20 to 30 rows (G9).
- **Shift:** G8 and G9 use group vocabularies and id formats and seed spaces disjoint from G7 and from M1's G1 to G6. G9 additionally uses longer files, shuffled JSON key order, and a defect rate of 20 to 50% of rows per invalid file and 33 to 50% of invalid files per defective batch. A fresh seed alone is not claimed as shift.
- **Independence unit:** the source file for R and the batch for C. Seeds, generators and expected outputs for F-final and F-reuse stay in the evaluator's private area and are committed by hash only. **Exposure log:** `build/m2/exposure.jsonl` records every read of F-sel, F-final and F-reuse (who, partition, count, purpose).

## 6. Arms and comparisons (roles fixed now)

Per effect (R and C), on the same cases:

| # | Arm | Role |
|---|---|---|
| 1 | Incumbent `W_strict` = `[parse_whole, aggregate]`, under the effect's contract | Benefit comparator. By §2 it is a wrong-type workflow and passes 0 cases; this is stated, not hidden. Also the rollback target. |
| 2 | Retained-skill-disabled control: the selection resolved through the lineage store's selection path with the retained-skill flag off. The harness may not hardcode `W_strict`; it asserts the resolved digest equals `W_strict`'s. | Benefit and reuse comparator. |
| 3 | Strongest old-inventory workflow, pinned now: R = `[identity]` (the best of the 3 old-inventory type-legal lists, all identical in behaviour; it returns the original bytes and passes 0 files), C = `[each(split_rows), each(parse_whole), aggregate]` (row-level quarantine across files, so it passes only the clean batches) | Benefit comparator: the strongest existing behaviour without the effect. |
| 4 | Random search, seed `20261124`: 20 uniform draws, with replacement, over the type-legal lists (7 for R, 3 for C), and 20 uniform draws over all 1,110 lists. **All 20 draws of each run**, whether or not one hits. | **Report only:** draws until the first F-dev ≥ 90% workflow. Type-failing draws are recorded as preflight refusals with 0 container runs; legal draws run on F-dev only, one container run per distinct digest (repeats reuse the result), and these runs count toward the 160-run cap (§12). Not a comparator, since 3 of 7 (R) and 2 of 3 (C) legal lists are correct, and **no claim that the model beats random search is made.** |
| 5 | Model nominee (campaign A) | The candidate. |
| 6 | Model replicate nominee (campaign B), chosen by the §8 rule | Reproduction (§10): scored on F-reuse only, never on F-final. |

The benefit comparator is the strongest of arms 1 to 3 on F-final. Report every arm, exclusion and denominator.

## 7. Oracle

- Authored by a separate evaluator worker, one oracle per effect, from §2 alone (`evaluator/m2/`). It must **not** import or call `parse_source`, `_csv_rows`, `_json_bytes`, `inventory_result`, `summarize_inventory`, or any M1/M2 view; the standard library `csv` and `json` read bytes only.
- It computes expected output from the generator record and independently re-derives it from the bytes; the two must agree before a case is admitted.
- **Validation fixtures** (outside all partitions): at least 12 hand-checked cases per effect, covering every defect category (for R also a valid CSV file, a valid JSON file with whitespace, unsorted keys and `café`, and a JSON file that is already canonical, which is a fixture only and never enters a partition), precedence, first-failing-row order, an all-invalid and an all-valid file (for C, an all-valid batch and a batch with an invalid first, middle and last file), and the boundaries (`0`, `10^9`, `10^9+1`, `"01"`, 128/129-character ids and groups, JSON `true` and `1.0`). Plus at least 4 deliberately wrong outputs per effect (wrong reason, wrong index, dropped row or file, wrong converted text or sum), all rejected. Failures found while building are recorded before they are fixed. A second model's approval is not oracle independence, and gpt-oss never authors or checks an oracle.

## 8. Selection, exposure and retries

- **Campaigns:** four, run sequentially: A-R, A-C, B-R, B-C. Each runs exactly **12 proposal rounds**. A proposal is one model call result; invalid, duplicate and repaired resubmissions count. Each round gets history feedback (§4). Duplicate refusal is per campaign. Each campaign starts with an empty digest set, and a B proposal equal to an A digest is evaluated normally. Duplicates within a campaign are refused before execution and fed back.
- **Eligibility:** a proposal is eligible if it passes ≥ 90% of F-dev (≥ 22 of 24).
- **Nomination (per campaign, same rule):** among eligible workflows, the highest F-sel pass rate; ties go to fewer steps, then the lexicographically smallest digest. **One nominee per effect and campaign.** The A nominee is immutable (digest, source, inventory pins, prompt hashes, transcript hash) when nominated and before F-final opens; the B nominee is fixed the same way before F-reuse opens. No eligible A nominee means that effect is FAILED; no eligible B nominee means it is INCONCLUSIVE.
- **F-final:** one evaluation episode per effect, for the A nominee and the arms. Retries only for identified infrastructure failures (container start failure, or timeout with no output) on identical bytes, at most 2 per case, each logged.
- **Invalidation:** the model or a prompt receiving any F-sel/F-final/F-reuse content; an F-final read before A nomination; any edit to inventory, oracle, prompts or policy after the first model call; a weight-hash mismatch; a call to any host other than `localhost:1234`; or pin drift. The affected holdout is then retired, and a new claim needs a new protocol version.
- **Fresh confirmation:** F-final and F-reuse are the fresh inputs. The B nominee's F-reuse result shows the model's proposal reproduces on them.
- **Stores:** records produced against the stub server never enter the M2-2 store. M2-2 starts a fresh store (`build/m2/store`, empty at start); stub records stay under `build/m2/stub/`.

## 9. Lifecycle (on the actual nominees)

1. Register `W_strict` as the incumbent in the fresh M2-2 store before F-final opens, and both A nominees as children in the existing lineage store (experimental scope, M1's lineage untouched). Select each through the parent-written ACCEPTED `evidence_refs` path, and store the transcript hash, model sha and prompt hashes in the evidence.
2. End the process. In a new process, reopen the store and verify lineage, protocol, oracle, inventory and prompt pins, and the evidence refs. Resolve each selection from stored state.
3. Run F-reuse (n = 20 per effect) through HIVE with the resolved A selections, then the B nominees, then the retained-skill-disabled control (arm 2), then arm 3 on the same cases. Re-verify the weight sha.
4. Append a rollback to `W_strict` for each effect; verify that the selection resolves to `W_strict`; run 3 F-reuse cases per effect and confirm each case yields exactly `{"error":"wrong_type"}` with 0 container runs, and that the selection resolves to `W_strict`'s digest. Confirm that selecting any rejected variant is refused. Keep the full history.

## 10. Decision rule (applied per effect, then jointly)

- **Benefit:** the A nominee's F-final pass rate ≥ (strongest of arms 1 to 3) + **Δ = 20 points**, and exact one-sided McNemar p < 0.05 against that arm.
- **Reuse:** the A nominee on F-reuse after restart: ≥ 18/20 and ≥ Δ above the stronger of arm 2 and arm 3 on the same F-reuse cases (arm 3 is run on F-reuse once per effect), with exact McNemar p < 0.05.
- **Reproduction:** the B nominee passes ≥ 18/20 on F-reuse (fresh inputs). Report its behaviour class and digest.
- **Distinctness:** §1 conditions 1 to 4, with the reviewer's ruling.
- **Model integrity:** weight sha equal at all three checks; every call logged with request bytes, response bytes, seed, usage, latency and model id; the transcript replays offline through the harness to the same digests; 0 calls outside localhost.
- **Regression tolerance 0:** M0 T1/T2, the structured-mission tests, the M1 tests and the M1 evidence hashes (`build/m1/**`) are unchanged, verified at the acceptance boundary on the recorded revision.
- **What this certifies:** arms 1 and 2 pass 0 cases, R's arm 3 passes 0 files, and C's arm 3 passes only the clean half, all by construction, so Δ and McNemar mostly confirm the effect's presence. The substantive evidence is raw pass counts by defect category and the proposal statistics. Report model statistics (valid-proposal rate, rounds to the first eligible proposal, behaviour classes, tokens) as descriptive only.
- **Ties:** equal quality at lower cost is an efficiency note, never a capability claim.
- **Integrity checks (all hold):** refusal of unknown primitives, depth > 3, duplicate and type-failing proposals before execution; oracle rejection of every wrong-output fixture; refusal to select a failed candidate; rejection of stale pins and tampered or forged receipts (M0/M1 regressions).

## 11. Outcomes

| Result | Condition |
|---|---|
| **ACCEPTED** | Both effects satisfy §10 in full, with ≥ 2 distinct legal digests evaluated on F-dev in campaign A for each effect, all §9 lifecycle steps pass, and cost accounting is complete. The claim is stated in the narrow-claim wording only. |
| **FAILED** | A decisive requirement was tested and missed for either effect (including no eligible A nominee, benefit or reuse missed, or distinctness ruled against). Candidates and negative evidence are kept. |
| **INCONCLUSIVE** | Evidence cannot decide within these limits: p ≥ 0.05, fewer than 2 distinct legal digests, no eligible B nominee or a B nominee under 18/20, or **any cap reached, including the 64-call cap before all four campaigns finish**. No promotion. |
| **INVALIDATED** | A §8 invalidation trigger, evidence corruption or protocol drift. Kept; restart only after remediation under a new protocol version. |

Per-effect results are reported separately. One effect accepted and the other not never makes M2 ACCEPTED. **Designated reviewer:** a separate Opus session that did not author the harness, prompts, generators or oracles. It receives this protocol, the evaluation manifest, the transcripts and the receipt bundle, and rules on §1 distinctness.

## 12. Bounds and cost

| Bound | Value |
|---|---|
| Proposals | 12 per campaign; 48 in total (4 campaigns) |
| Model calls (whole M2) | ≤ 64, including 2 unscored smoke calls and infrastructure retries; 0 calls to any other host. Reaching the cap ends the run as INCONCLUSIVE (§11). |
| Tokens | Prompt ≤ 28,000 UTF-8 bytes and output ≤ 6,000 tokens per call. The cap is 900,000 tokens in total, counted as the sum of `usage.prompt_tokens` + `usage.completion_tokens` over all calls, including smoke calls and retries (local inference costs $0). 50 calls at up to about 14k tokens each stay under it; reaching the cap ends the run as INCONCLUSIVE (§11). |
| Wall time | ≤ 4 h per campaign, ≤ 12 h for M2-2; stop and checkpoint on reaching it |
| Concurrency | 1 model call (single slot); ≤ 2 container experiments |
| Workflow depth | ≤ 3; repairs are only the model's next proposal after a refusal, counted in the 12 |
| Container runs | ≤ 160, counting model proposals, arms 1 to 4, final, cross-checks, reuse (including arm 3 on F-reuse, once per effect) and rollback runs. One run evaluates one workflow on one partition batch, ≤ 120 s each; identical (digest, partition) results are reused, not rerun. |
| Runtime model cost | $0 (local). Electricity and GPU time are recorded, not billed. |
| Monetary (coding agents, list price, charged once against the $120 owner ceiling) | M2-0 ≤ $4; M2-1E ≤ $5; M2-1A ≤ $6; M2-2 ≤ $2; M2-3 + M2-4 ≤ $3. **M2 total ≤ $20**, a maximum reservation within the moving cap (≈ $64.0 cumulative per `docs/M1_REPORT.md`, 24 Nov 2026, so at most about $84 of the $120). The hard ceiling is unchanged. |

Cost is reported with discovery (campaigns) separate from execution (final, reuse), and engineering separate from runtime. Hitting a cap stops the packet. There is no automatic renewal and no paid fallback. A coding agent's output never stands in for a model proposal: every nominee must trace to a logged gpt-oss response.

## 13. Authorisation and stop conditions

- **Operator approval is required before any real model call.** Ian's separate go is recorded as `build/m2/operator_inference_approval.json`, with fields: `schema` (`hive-m2-operator-approval-v1`), `approver`, `approved_at`, `protocol_blob_sha256` (LF-normalised), `protocol_commit`, `model_id` (`openai/gpt-oss-20b`), `model_file_sha256`, `endpoint`, the caps from §12, and `statement` (his words, quoted). The harness refuses to call the model if the file is missing, if any field disagrees with the committed pins, or if the evaluation manifest is not frozen.
- Approving this protocol never creates that file. M2-0 and M2-1 run only against the stub server.
- **Stop at once** (checkpoint, no retry) on a weight mismatch, a cap, an invalidation trigger, or an unexpected model id.

## 14. Limits and registered for later

- The type-legal space is 7 lists for R and 3 for C, with 3 of 7 correct for R and 2 of 3 for C, so M2 shows the pipeline (a local model proposes, the harness verifies, the skill is retained and reused). It does not show search skill.
- One model, one prompt family and synthetic data only. gpt-oss at `Reasoning: low` is the research subject, not a general result. The trust limit is unchanged: an unkeyed store writer can forge records (SQ-1), and the private holdouts sit in a gitignored folder under the same OS user.
- Registered for later (not M2): CSV header normalization, duplicate-id abstention, a new view that is not a thin adapter, other models, and larger or learned inventories.
