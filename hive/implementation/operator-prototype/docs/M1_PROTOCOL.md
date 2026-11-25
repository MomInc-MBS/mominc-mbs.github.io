# M1 evaluation protocol: `m1-row-reconcile-v1` (Gate D)

- **Status:** frozen at commit time. Its identity (sha256 of these exact bytes plus the commit) is recorded **outside** this file, in `docs/BUILD_CHECKPOINT_M1_0.md`. No M1 candidate has run.
- **Supersedes:** `docs/M1_PROTOCOL_DRAFT.md` (kept as history). Where they differ, this file governs; each change is listed in §12.
- **Runtime base:** `build/working-prototype` @ `c31fb698eb6838b049ba35d0a384ba441ccb8038` (parent `fe06e4eb87dfb01047edb590f8df4cceaad194af`).
- **Master:** `HIVE_Master_Evolution_Build_Path_FINAL_Claude_Nemotron_2026-11-23.md` (v0, 85,231 B; owner library, not on disk). Execution supplement: `docs/HIVE_POST_M0_BUILD_PATH_20261123.md`.
- **Decision vector (unchanged):** `D1=D D2=C D3=C D4=E D5=A D6=B D7=B D8=C D9=C D10=C D11=C`.
- **Narrow claim M1 may make:** legal composition over a pinned inventory of thin views of existing functions produced one effect the starting inventory does not produce (row-level quarantine reconciliation of `grouped_inventory_v1` sources), verified by an independently authored oracle, with measured held-out benefit over the existing workflow, retained and reused after restart, and rolled back. Nothing broader.

## 1. Family decision (resolves the draft's §1 open condition)

**Selected route: thin views of existing functions plus one generic list combinator. The family is narrowed to what that can express.** Each of the draft's five sub-steps was checked against source (`src/hive/structured_verifier.py` @ base):

| Draft sub-step | Existing source | Verdict |
|---|---|---|
| `parse_rows` | `_csv_rows` (CSV), `_json_bytes` (JSON), plus the header and array checks already in `parse_source` | **View**, kept as `split_rows`. It cuts a source into one-row sources and does not validate rows. |
| `validate_row` | The per-row checks inside `parse_source` | **No view.** No primitive validates a row on its own. Per-row validation is reachable only by composing `parse_whole` under the generic `each` combinator. |
| `aggregate` | `inventory_result` | **View**, kept as `aggregate`. |
| `normalize_header` | None: `parse_source` requires the exact CSV header `id,group,bytes`, in that order | **New logic, so dropped.** CSV header variance is out of the family. |
| `dedupe_conflicts` (abstention) | None: uniqueness is a whole-source check | **New logic, so dropped.** Duplicate ids are excluded from every partition. Abstention is registered for later (§11). |

**Review history.** Round 1 proposed a `check_rows` view: a per-row loop, a catch, and a table mapping messages to codes. The independent reviewer ruled it BLOCKING because the view itself implemented the target effect, so it was removed. Now no primitive and no harness rule is specific to this task:

- Reasons are the raw existing `parse_source` messages, so there is no mapping table.
- Per-element error capture lives in `each`, which works the same way for every primitive.
- Errors captured by `each` are surfaced identically for every workflow.

**What counts as preparation rather than discovery (review round 2).** `each` is new protocol-authored code, not a view of an existing function. It catches this domain's own error class, `StructuredMissionError`. The harness error channel also supplies the reporting half of the output (`quarantined` with indexes). Both are declared preparation and count toward nothing discovered. The only thing M1 claims was found by search is **per-row isolation**: applying the existing whole-source validator to each row separately by composing `split_rows`, `each(parse_whole)` and `aggregate`.

Following the draft's rule, the dropped sub-steps are not hand-coded. The fallback family is not used, because the narrowed family has a real gap that legal composition can close.

**Starting inventory (the novelty baseline):** the base functions at the runtime base, plus the workflows registered before M1. None of them produces a partial report. The M0 text workflows and the structured-mission path (`parse_source` → `inventory_result`) both reject the whole source on any bad row.

**The effect M1 targets:** given a source whose rows are partly invalid, output the aggregate over exactly the valid rows **and** list every invalid row with its reason. Only the composition split → `each(parse_whole)` → aggregate produces it.

**Known-solution disclosure.** While designing this protocol, the conductor confirmed that this composition exists in the legal space; that is how the gap was shown to be closable. The search proposer (§3.2) is native type-directed enumeration and does not use that knowledge. The discovery claim is therefore narrow: an automated legal search over a fixed, pinned inventory found and registered the composition, and the result was independently verified. It is **not** a claim that the solution was unknown to humans or hard to find.

## 2. Task contract

- **Input:** one source file, given as a `format ∈ {csv, json}` and its bytes. The generator guarantees source-level validity:
  - UTF-8 with no BOM;
  - CSV: the exact header `id,group,bytes`, exactly three fields in every row, no blank lines;
  - JSON: an array, no duplicate object keys, no non-finite or overflowing numbers;
  - 1 to 60 rows, and at least 2 rows in any file that has a defect;
  - no two rows share an `id` (among rows whose `id` is a string).
- **Row defects in scope.** Each defect produces exactly one existing `parse_source` message. When several apply, the earliest in this list wins, which matches the order of `parse_source`'s checks:
  1. The JSON row is not an object, or its key set is not exactly `{id, group, bytes}` → `source row does not match the pinned schema`
  2. `id` is not a string, is empty, or is longer than 128 characters → `row IDs must be unique nonempty strings of at most 128 characters`
  3. `group` is not a string, is empty, or is longer than 128 characters → `inventory groups must be nonempty strings of at most 128 characters`
  4. A CSV `bytes` value does not match `0|[1-9][0-9]{0,9}` → `bytes must be a canonical nonnegative decimal integer`
  5. `bytes` is not of exact type `int` in `[0, 10^9]`. This covers JSON floats, booleans, strings and out-of-range values, and canonical CSV values above `10^9` → `bytes must be an integer between 0 and 1,000,000,000`
- **Output (`reconciled_inventory_v1`):** canonical JSON with sorted keys, separators `,` and `:`, and `ensure_ascii=True`:
  `{"groups": {<group>: {"bytes": int, "count": int}}, "quarantined": [{"index": int, "reason": <exact message>}]}`
  - `groups` covers exactly the valid rows. It is an empty object if there are none.
  - `index` is the row's 0-based position among the parsed data rows (CSV: counting after the header; JSON: array position). Entries are in ascending order.
  - Every row is counted exactly once: `sum(count) + len(quarantined) == rows`.
- **Whole-source failure:** any error that `each` does not capture makes the output `{"error": "source_rejected"}`. That output fails every case.
- **Pass unit:** one source file. A case passes only if the output is byte-for-byte equal to the oracle's canonical output.

## 3. Inventory and legal search space (pinned before search)

Packet M1-1A implements the views in one new module. Each view's pin is the sha256 of its `inspect.getsource` text **plus** the pins of the base functions it wraps. Adding a primitive or combinator after search starts invalidates the episode.

| Primitive | Type | Exact behaviour (a view may add only type adaptation and input checks) |
|---|---|---|
| `identity` | Source → Source | Returns its input unchanged. |
| `parse_whole` | Source → Rows | Calls `parse_source(bytes, format, "grouped_inventory_v1")`. |
| `split_rows` | Source → List[Source] | **CSV:** `_csv_rows` plus the existing exact-header check, then each row is re-emitted as a one-row CSV source: the header line plus that row's raw field strings, written with `csv.writer(lineterminator="\n")`. **JSON:** `_json_bytes` plus the existing array check, then each element is re-emitted as `json.dumps([element], ensure_ascii=True)`. Values are never inspected. |
| `aggregate` | Rows → Report | Calls `inventory_result(rows)`. |

**Generic combinator `each(p)`.** For any primitive `p: X → Y`, `each(p)` has type List[X] → List[Y], flattened when `Y` is itself a list type. It applies `p` to each element in order. If `p` raises `StructuredMissionError` on element *i*, the pair `(i, str(error))` goes to the error channel and that element contributes nothing. Any other exception is a whole-source failure. `each` contains no task-specific logic and is pinned the same way as a primitive.

### 3.1 Error channel (a harness invariant, identical for every workflow and every arm)

Errors captured by `each` are never dropped: the harness writes them to `quarantined` in index order. A workflow that does not use `each` always has `quarantined = []`. Errors raised outside `each` are whole-source failures.

### 3.2 Composition rules and proposer

- A workflow is a linear list of 1 to **3** steps. Each step is a primitive or `each(<primitive>)`; `each` cannot be nested. Each step's output type must equal the next step's input type. The first input is `Source` and the last output must be `Report`. Any other list is refused before execution.
- The grammar has no parameters, constants, loops or conditionals. The canonical digest is the sha256 of the canonical JSON step list. Duplicate digests are refused.
- **Types:** `Rows = List[Row]` is a list type, so `each(parse_whole)` flattens to `Rows`. `Report` and `Row` are not list types. `identity` is typed Source → Source only, not generic.
- **Space size:** there are 8 symbols (4 primitives and their 4 `each` forms), so there are 8 + 64 + 512 = 584 lists of length 3 or less. **Exactly 3 of them type-check:** `[parse_whole, aggregate]`, `[identity, parse_whole, aggregate]` and `[split_rows, each(parse_whole), aggregate]`.
- **Proposer (arm 5):** native deterministic type-directed enumeration. It submits only lists that type-check, ordered by length and then lexicographically by step names. It uses no models and no data. It submits all three, so at least 2 distinct variants are evaluated.
- **Disclosure:** the space of lists that type-check is tiny, so M1 makes **no** claim that guided search beats random search (§5).

### 3.3 Forbidden surfaces

Candidates and proposers cannot touch the evaluator, oracles, generators, F-sel/F-final/F-reuse cases or answers, receipts, the usage ledger, this protocol, `configs/m1_campaign_policy.json`, the store's acceptance records, or anything in the M0 policy's `frozen_outside_surface`. Execution uses the existing container backend (FR-8). 0 model calls and 0 network calls during search and evaluation.

## 4. Data partitions (evaluator-authored synthetic; $0; no network; no Level A)

| Partition | Generator family | n (files) | Format mix | Clean / defective | Access |
|---|---|---:|---|---|---|
| F-dev | G1–G2 | 24 | 24 CSV | 6 / 18 | Proposer sees cases and per-case feedback. |
| F-sel | G3 | 20 | 20 JSON | 4 / 16 | Score only. Every read logged. |
| F-final | G4–G5 | **60** | 30 CSV / 30 JSON | 12 / 48 | Evaluator only. Read once by the nominee and the arms. |
| F-reuse | G6 | 20 | 10 CSV / 10 JSON | 4 / 16 | Evaluator only. Used only after restart (§8). |

- **Defective file:** has at least 2 rows, and 1 to 50% of its rows are defective (at least one). Across each partition's defective files, each applicable defect category from §2 makes up at least 10% of the defective rows. Category 1 applies only to JSON, and category 4 only to CSV.
- **Shift:** G4–G6 use group vocabularies, id formats and seed spaces disjoint from G1–G3. G6 additionally uses longer files (40 to 60 rows), shuffled JSON key order and a defect rate of 20 to 50%. A fresh seed alone is not claimed as shift.
- **Independence unit:** the source file. Seeds, generators and expected outputs for F-final and F-reuse stay in the evaluator's private area and are committed by hash only.
- **Exposure log:** every read of F-sel, F-final or F-reuse is appended to `build/m1/exposure.jsonl` (who, partition, case count, purpose).

## 5. Arms and comparisons (roles fixed now)

| # | Arm | Role |
|---|---|---|
| 1 | Incumbent `W_strict` = `[parse_whole, aggregate]` (the existing structured-mission behaviour) | Benefit comparator. Also the M1 rollback target. |
| 2 | Learning-disabled control: the selection with retained skills disabled (resolves to `W_strict`) | Benefit comparator; reuse comparator in §8. |
| 3 | Strongest fixed workflow without `each`: the better of `W_strict` and `[identity, parse_whole, aggregate]` on F-sel, ties broken as in §7 | Benefit comparator. |
| 4 | Matched simple search: 20 draws, uniform over all 584 symbol lists (not type-directed), seed fixed in the policy file | **Search-efficiency report only:** proposals until the first workflow that passes ≥ 90% of F-dev, or "none in 20". Its draws are counted separately and do not use arm 5's 20-proposal cap. Expected hit chance is 1 − (583/584)^20 ≈ 3.4%. Not a benefit comparator, because the type-checked space has only 3 workflows. |
| 5 | Bounded-search nominee | The candidate. |

The benefit comparator is **the strongest of arms 1–3 on F-final**. Report every arm, every exclusion and every denominator.

## 6. Oracle

- Authored by a separate evaluator worker from §2 alone. It must **not** import or call `parse_source`, `_csv_rows`, `_json_bytes`, `inventory_result`, `summarize_inventory`, or any M1 view. It may use the standard library's `csv` and `json` modules only for reading bytes.
- It computes the expected canonical output directly from each case's generator record (the generator knows which rows it corrupted and how). Separately, it re-derives reasons from the bytes, and the two must agree for every case before the case is admitted.
- **Validation fixtures** (separate from all partitions): at least 12 hand-checked cases, covering each defect category, the precedence order, an all-invalid file, an all-valid file, and boundary values (`0`, `10^9`, `10^9 + 1`, `"01"`, 128- and 129-character ids and groups, JSON `true`, JSON `1.0`). Plus at least 3 deliberately wrong outputs (a dropped row, a wrong reason, a wrong sum), all of which the oracle must reject. Failures found while building are recorded before they are fixed.
- A second model's approval is not oracle independence.

## 7. Selection, exposure and retries

- **Search feedback:** F-dev per-case results only.
- **Nomination:** among workflows that pass ≥ 90% of F-dev, choose the highest F-sel pass rate; ties go to fewer steps, then to the lexicographically smallest digest. **One** nominee. It becomes immutable (digest, source, inventory pins) when nominated and before F-final is opened.
- **No eligible nominee:** M1 is FAILED for this family (§10).
- **F-final:** one evaluation episode. Retries are allowed only for identified infrastructure failures (container failed to start, or timed out with no output), on identical bytes, at most 2 per case. Every retry is logged.
- **Invalidation:** any F-final/F-reuse read by a proposer, any edit after F-final opens, any inventory or oracle change after search starts, or pin drift. The holdout is then retired and a new claim needs a fresh family version.

## 8. Lifecycle (on the actual nominee)

1. Register `W_strict` as the M1 experimental incumbent and the nominee as its child in the existing lineage store (experimental scope only). M0's P0 and its `select, rollback` history are left untouched.
2. Select the nominee through the existing parent-written ACCEPTED `evidence_refs` path.
3. End the process. In a new process, reopen the store; verify lineage, the protocol/oracle/inventory pins and the accepted evidence refs; resolve the selection from stored state.
4. Run F-reuse (n = 20) through HIVE with the resolved selection, then the learning-disabled control (arm 2) on the same 20 cases.
5. Append a rollback to `W_strict`; verify that the selection resolves to `W_strict`; run 3 F-reuse cases and confirm `W_strict` output; confirm that selecting any rejected variant is refused.
6. Keep the full history. Any later reselection is a separate recorded action.

## 9. Decision rule

- **Benefit:** nominee F-final pass rate ≥ (strongest of arms 1–3 on F-final) + **Δ = 20 percentage points**, **and** an exact one-sided McNemar test (sign test on discordant paired files) against that arm gives p < 0.05.
- **Reuse:** on F-reuse after restart, the nominee passes ≥ 18/20 and beats arm 2 by ≥ Δ with exact McNemar p < 0.05.
- **Regression tolerance 0:** the M0 tasks T1/T2 and the existing structured-mission tests stay green, verified at the acceptance boundary on the recorded revision.
- **What the benefit test certifies:** arms 1–3 pass exactly the clean files (20% by construction), so Δ and McNemar mostly confirm the clean/defective mix plus the nominee's exact correctness on defective files. The substantive evidence is the nominee's raw F-final and F-reuse pass counts by defect category. No claim about the real-world frequency of defective sources is made.
- **Ties:** equal quality at lower cost is an efficiency note only, never a capability claim.
- **Integrity checks (all must hold):** refusal of unknown primitives, depth > 3 and duplicate digests; refusal of type-failing lists; oracle rejection of the wrong-output fixtures; refusal to select a failed candidate; rejection of stale pins and tampered receipts; and rejection of the forged self-consistent receipt (existing M0 regression).

## 10. Outcomes

| Result | Condition |
|---|---|
| **ACCEPTED** | ≥ 2 distinct legal variants were evaluated on F-dev/F-sel (preflight refusals do not count), the new effect is present in the nominee and absent from the starting inventory, and §9 benefit, reuse, regression, integrity, §8 lifecycle and cost accounting all pass. Local "P4 core proven" becomes valid. |
| **FAILED** | A decisive requirement was tested and missed. Candidate and negative evidence are kept. |
| **INCONCLUSIVE** | Evidence cannot decide within these limits, for example p ≥ 0.05. No promotion. |
| **INVALIDATED** | A §7 invalidation trigger, evidence corruption or protocol drift. Kept; restart only after remediation, under a new protocol version. |

**Designated reviewer:** a separate Opus reviewer session that did not author the candidate, the views or the oracle. It receives this protocol, the evaluation manifest and the receipt bundle.

## 11. Bounds and cost

| Bound | Value |
|---|---|
| Proposals per campaign | 20 (invalid, duplicate and repaired resubmissions all count) |
| Workflow depth | ≤ 3 |
| Concurrent experiments | ≤ 2 |
| Repairs per candidate/packet | ≤ 2 |
| Container runs (whole M1 campaign) | ≤ 120; one run evaluates one workflow on one partition batch |
| Wall time per packet | ≤ 3 h; stop and checkpoint on reaching it |
| Per container run | ≤ 120 s; on timeout with no output the run is an infrastructure failure (§7) |
| Tokens | Bounded by each packet's dollar reservation, with role packets at the master's 4,000/1,000 (proposer/implementation) and 1,500/500 (reviewer) input/output ceilings where measurable. Overhead from mandatory system context is recorded, not excluded. |
| Runtime model / network calls | 0 / 0 |
| Monetary (engineering, list price, charged once against the $120 owner ceiling) | M1-0 ≤ $5; M1-1E ≤ $6; M1-1A ≤ $4; M1-2 ≤ $3; M1-3 + M1-4 ≤ $6. M1 total ≤ $24. These are maximum reservations, not forecasts. |

Cost is reported with discovery (search) separate from execution (evaluation, reuse), and engineering separate from runtime. Hitting any cap stops the packet; there is no automatic renewal and no paid fallback. Cost per verified completion is undefined if there are none.

**Registered for later, not part of M1:** CSV header normalization and duplicate-id abstention. Both need new tool logic; they are candidate targets for a later family or for M2's composition effect.

## 12. Changes from the draft

1. §1 is resolved: thin views plus one generic combinator `each`. `normalize_header` and `dedupe_conflicts` are dropped as new logic, so duplicate ids and CSV header variance are out of the family. `validate_row` has no view: per-row behaviour must come from composition (after review round 1).
2. The output schema `reconciled_inventory_v1` is fixed, with reasons given as the exact existing `parse_source` messages.
3. Arm 4 is moved from the benefit comparator to a search-efficiency report, because the legal space (3 workflows) is disclosed as trivially enumerable. The benefit comparator is the strongest of arms 1–3.
4. The draft's exact-binomial test is replaced by an exact paired McNemar test (the arms run on the same files).
5. n = 60 for F-final (draft: ≥ 40), Δ = 20 points, and F-reuse n = 20 with a ≥ 18/20 floor are fixed.
6. The rollback target for M1 is `W_strict`, not P0 (P0 is a text→text identity and does not apply to this task type).
7. Review round 2 (NON-BLOCKING) minor items are applied: `each` and the error channel are declared preparation, `Rows`/`identity` typing is pinned, arm 4 is counted outside the proposal cap, and the `each`/channel/output rules are pinned in the policy file.
