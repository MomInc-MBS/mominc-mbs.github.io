# REVIEW_P1: security review of 60a2474..0e9e0d3

Reviewer: independent (read-only on src/tests/configs). Threat model as briefed: the attacker writes store and goal records and controls proposer
output. The attacker cannot write the signing key, configs/ or evaluator files.

## Verdict: BLOCK

One new HIGH (H1, stored plans). One pre-existing HIGH (H2) sits on every execution path, and the new run-plan and fallback paths inherit it.
Both let a store writer write files outside `output/goal/<id>/`, including into `configs/` and the evaluator and holdout folders, which the threat
model says the attacker cannot write. H2 also turns forged store bytes into a VERIFIED deliverable without any execution or independent check.
Fix H1 and H2 before acceptance. The MEDIUM findings break stated invariants (integrity fails closed, the improvement gate, the source deny list),
but each still ends in admitted, rechecked code or needs the key holder.

Proofs of concept: 7 docker-free tests, all PASS on 0e9e0d3 (`7 passed in 19.32s`). They are in the appendix and were not committed.
Existing targeted tests: `test_p_planner.py test_p_model.py test_p_sec_hostile.py` gave 40 passed, 1 skipped. `test_p_improve.py test_p_cli.py` gave
27 passed. Docker tests were not run, because another batch is using Docker.

---

## Findings

### H1 (HIGH, new in 019c8a3): run-plan trusts store-written step fields that validate_plan never checks, including the output file names

- `goal_runner.py:704-718` (`run_plan`) loads `rec["plan"]` from the store record. `goal_runner.py:670-684` (`_refresh_stored`) deep-copies that
  plan. `validate_plan` (`goal_runner.py:388-461`) re-checks only op eligibility, the genome or statement pin, arity and types, references and the
  final type.
- Not re-checked, and used at run time:
  - `report_name` (`:543`): written by `O._write(outdir / name, ...)` at `:550` and `:583`. `operator_runtime.py:388` `_write` has no containment
    check and creates parent directories.
  - `step_id`: used as a file name at `:523` (`outdir / (step_id + ".csv")`) and `:554` / `:587`.
  - `kind`: the dispatch at `:805-815`. A registry, builtin or discovered op can be sent down another kind's path, for example a `snapshot` step
    with `kind: "discovered"` that then falls back through a forged ranking.
  - `ranking.alternatives`: the runtime fallback list at `:627`. See M1.
  - `allowance` and `estimate`: the up-front budget check at `:780-785`.
  - The contract artifact at `:712`. It is read from the store, `contract_id` is not recomputed, and the `make_contract` budget clamp
    (`:117-121`, budget may only be lowered) is not re-applied. Any `budget.max_steps` / `container_runs` / `wall_s` is therefore accepted.
- Exploit (PoC `test_poc_stored_plan_report_name_escapes_output_dir`): `plan_only`, then the store writer sets
  `plan.steps[0].report_name = "../../../../outside/admission_signers"`, then `run_plan` runs. The goal ends VERIFIED and the report JSON is
  written outside the store's output folder. In a real install the same write lands on `configs/admission_signers`, `evaluator/...`,
  `.hive/c3-private/...` or `src/hive/*.py`: DoS of every admitted capability, a changed evaluator, or changed holdouts. Combined with H2, the
  attacker also chooses the bytes, for example their own signer line in `configs/admission_signers`. They can then sign admissions, which gets
  arbitrary code admitted.
- Fix (minimal):
  - In `_refresh_stored`, rebuild every step from trusted data. Keep only `step_id, op, inputs, after, statement_sha` from the stored plan.
  - Require `step_id` to match `^s\d{1,2}$`.
  - Recompute `kind/adapter/expected_output/allowance` from `eligible_caps`.
  - Set `report_name = "report.json" if last else sid + ".report.json"`.
  - Drop the stored `ranking` and recompute it with `_collapse(store, ok)`.
  - In `run_plan`, re-run the `make_contract` field checks on the stored contract and require `"g-" + sha(core)[:20] == goal_id`.
  - Defence in depth: one helper `_out(outdir, name)` that refuses any name that is not a plain basename (`Path(name).name == name`, no `..`).
    Use it for every `O._write` in goal_runner.

### H2 (HIGH, pre-existing; answers Q2 "no"; inherited by fallback and run-plan): a forged saved-result record yields VERIFIED with attacker bytes and an arbitrary write

- `goal_runner.py:544-554`: if `operator/capuse/<tid>` exists and every `store_root / a["ref"]` file hashes to `a["sha256"]`, the step is
  VERIFIED (`mode=saved_result_replay`). No container runs and `CC.verify` is never called.
- The attacker can compute `tid` (`:540`): it is the sha of statement_sha, pin and input shas. `a["ref"]` may be absolute or contain `..`.
  `a["name"]` is written as `outdir / a["name"]` (`:549-550`). The `relative_to` at `:551` is lexical and does not stop the write.
- Exploit (PoC `test_poc_forged_saved_result_is_verified_and_writes_anywhere`): the attacker writes a capuse record with
  `name="../../../../outside/pwn.txt"`, `ref="evil.bin"` and the sha of the payload. A normal `run_goal` then returns VERIFIED with
  `container_runs == 0`, and the attacker's bytes are written outside the output folder. This also works for every fallback alternative
  (`_attempt` goes through the same function) and for run-plan.
- Fix (minimal):
  - On replay, take the names from the contract (`artifact_name`, `rn`), not from the record.
  - Require each `ref` to resolve under `store_root/output/` (`resolve().is_relative_to(...)`).
  - Re-run `CC.verify(c, env, saved_output)` before marking the step VERIFIED. The oracle is cheap and runs in its own process, so VERIFIED again
    always follows an independent check.

### M1 (MEDIUM, new): runtime fallback alternatives are not interface-checked; a stored ranking can swap in an admitted capability of another type

- `goal_runner.py:627` builds `tries` from `step["ranking"]["alternatives"]`. `_alt_step` (`:594-597`) and `_run_discovered` (`:534-537`) check
  only that the alternative resolves and that its statement_sha matches. They do not check that it has the same input types, arity or output
  type as the step. `_refresh_stored` (`:679`) has the same gap.
- PoC `test_poc_stored_ranking_falls_back_to_other_interface`: the primary fails with EXECUTION and the stored ranking names
  `cap-other-interface` (interval_text -> group_summary). That capability runs, its own oracle passes, and the goal is VERIFIED for
  `merged_intervals` with an output admission typed as `group_summary`. The code that ran is admitted, so this is not unadmitted execution. It
  is a type-confused deliverable, and it lets a store writer choose which admitted code runs.
- Fix: in `_discovered` and `_refresh_stored`, accept an alternative only when it appears in a freshly computed `_collapse(store, eligible)` group
  of the step's op. Do not use the stored list.

### M2 (MEDIUM, new): integrity failures are not always fail-closed

- `goal_runner.py:565-567`: the generic `except Exception` labels every in-run error EXECUTION or TIMEOUT, and both are in `RECOVERABLE` (`:591`).
  That includes `SandboxUnavailable("BLOCKED_SANDBOX: daemon or exact image ID could not be verified")` and "timed out container cleanup could not
  be verified" (`adapters/isolation.py:163-223`), plus any `Refused` raised by `load_module` or `exec_args` inside that `try`. PoC
  `test_poc_sandbox_integrity_failure_falls_back`: the goal falls back and ends VERIFIED, with no `integrity_failure` recorded. After an
  unverified cleanup it starts another container straight away.
- `goal_runner.py:677-683`: in run-plan, a TAMPERED primary is "not in ok" because `eligible_discovered` lists `refused:` entries as excluded. It
  is substituted silently with reason `UNAVAILABLE`. The runtime test `test_tampered_preferred_fails_closed` covers only `run_goal`.
- `goal_runner.py:607`: a store writer who deletes a chain head (`capability_registry.py:156`, "nothing admitted") also gets UNAVAILABLE and a
  fallback, even though the plan had pinned an admitted statement.
- Fix:
  - Classify by allowlist. Only the candidate's own timeout or non-zero exit counts as EXECUTION or TIMEOUT. `SandboxUnavailable`, `Refused`
    and anything else becomes INTEGRITY or OTHER, which is not recoverable.
  - In `_refresh_stored`, substitute only when the primary is excluded as Unavailable with a signed revoke in its chain. Any `refused:`
    exclusion means PLAN_INVALID plus `integrity_failure`.
  - Treat "nothing admitted" for a pinned statement_sha as INTEGRITY.

### M3 (MEDIUM, new in 41bb11e): admission trusts the mutable `improve_eval` record; an improvement can be admitted without beating its objective

- `scripts/hive_admission.py:132-137` checks `rec["improve_eval"].objective.met` and `regression.new_passes_all` as stored booleans.
  `improve_eval` is outside `frozen` (`discovery.py:655`), so the frozen_sha re-check does not cover it.
- PoC `test_poc_forged_improve_eval_admits_without_meeting_objective`: an FC improvement ends REJECTED (correct but not better). The store writer
  sets `state=CANDIDATE_PASSED`, `candidate_sha256`, `receipt` and `improve_eval.met=true`. `H.admit` then signs v2 and v2 becomes active.
  `cap list` shows such a record as "candidate, awaiting signed admission" (`cap_cli.py:86-91`), which invites the key holder to admit it.
- The latency objective cannot be re-checked at all. `dev_ms` is one wall-clock container run including startup (`discovery.py:546-548`,
  `:622-625`) and it is stored in the record. Timing noise or resubmitting equivalent code can "meet" it (see L3).
- Fix:
  - In `_recheck`, recompute `met` from the on-disk receipts. Load `receipt-previous_version-<sha(base_body)[:12]>.json`, run
    `receipt_problems(rec, prev, sha(base_body), "previous_version")`, then call `objective_result(...)`.
  - Require `sha(imp.base_body) == imp.base_impl_sha256 == cur.statement.impl_sha256`.
  - For `latency_ms`, have the authority time both bodies itself (k runs, median, margin), or refuse latency objectives at admission.
  - Re-validate `check_objective(imp["objective"])` before signing it into the statement.

### M4 (MEDIUM, pre-existing; relevant to Q1): admission does not bind versions; revoked code comes back by re-admission

- `scripts/hive_admission.py:60-101` never refuses an `exp_id` that already has an admit event. It never refuses a body whose `impl_sha256`
  belongs to a revoked version. It does not require `frozen.improve` when the capability already has an admitted version. The improve gates
  (objective, staleness) therefore apply only if the record declares itself an improvement. `frozen` is self-hashed, not authenticated, and
  `run_experiment` (`discovery.py:473`) does not re-apply the `open_experiment` gating.
- PoC `test_poc_readmit_revoked_experiment`: revoke v1, then `admit --exp <the original exp>`. This produces v2 with the same `impl_sha256`, and
  it becomes active.
- Fix: in `admit`, refuse when the chain already holds an admit with this `exp_id` or an `impl_sha256` that has been revoked. When
  `CR.versions(s, cap)` is non-empty, require `fz.improve` and run the M3 checks.

### M5 (MEDIUM, new control, bypassable): the source allowlist checks a label, not the URL that is actually fetched

- Deny always wins (`acq_github.py:103`, checked before allow), and the gate runs both at search (`:149-151`) and at the card (`acq_card.py:305`).
  However, `acquire.py:275-282` clones `repo["url"]` taken from the store-written `rec["search"]["candidates"]`, while the card and
  `admissible` see only the store-written `full_name`. The host check at the card is hard-coded to `github.com`.
- `repo_intel.resolve_ref` / `clone_pinned` (`repo_intel.py:67-90,290-305`) accept any `https://` host and any local directory. A store writer
  can therefore set `{full_name: "allowed/repo", url: "https://evil.example/x.git"}`, or a local path, and pass both the deny list and the hosts
  list. The licence, static, staging, sandbox, hidden-suite and signed-admission gates still apply.
- Fix: in `_inspect`, require `FULL_NAME.match(full_name)` and use `url = f"https://github.com/{full_name}"`, refusing a stored URL that differs.
  Record the cloned URL and host in the card, and call `source_refusal(card["repo"], policy, card["host"])`.

### L1 (LOW, new): cap_history rows are validated on write, not on read

- `cap_history.py:30-39` and `goal_runner.py:196`: a store-written row `{"v":1,"status":"OK","ms":"slow"}` raises TypeError in `plan_goal` for the
  whole interface group (PoC `test_poc_forged_history_row_breaks_planning`). `run_goal` then leaves the goal in PLANNING (DoS). NaN, negative or
  boolean values only reorder admitted, rechecked alternatives.
- Free text cannot reach prompts or policy: `stats` returns numbers only, and a string crashes the ranking before it could enter a `reason`.
- Fix: in `rows()`, drop any row that fails the same checks as `record()`.

### L2 (LOW, new): improvement experiments bypass the global discovery ledger

- `discovery.py:210-212`: `_left` for `improve` uses only the frozen per-experiment budget. The comment says "the run's own ledger caps the sum",
  but an improvement has no run ledger. Spend is bounded by 2 experiments per base version, and every new version needs the key holder.
- Fix: also apply `BUDGET[k] - g[k]` for improvements, or keep a per-capability improvement ledger.

### L3 (LOW, new): the latency objective is noise-sensitive

- `discovery.py:423` compares one timing against one timing with no margin, so `met` can flip on noise. Fix: median of k runs and a relative
  margin. The M3 fix also needs this.

### L4 (LOW, new): the qwen DRAFT approval is inert only by file name

- `m2_model.py:101-123` (`approval_problems`) does not reject a `status` field or "DRAFT" values. The approver string "DRAFT - pending the owner" passes
  the non-empty check, so renaming `qwen3.8-27b.approval.DRAFT.json` to `.approval.json` without editing it would activate the backend wherever
  `Model(backend="qwen/...")` is used.
- Today it is fully inert:
  - discovery executes only `qualified` (measured) models (`model_dispatch.py:49-65`);
  - discovery builds `Model` with the gpt-oss `APPROVAL` (`discovery.py:572`), so any other id fails the model_id, sha and endpoint checks;
  - `backend=` has no caller in src.
- Fix: refuse when `status` is present or any field contains "DRAFT". Better, sign approvals or keep them under configs/.

### L5 (LOW, new): spend gate gaps

The gate itself works:
- the reservation comes before every HTTP attempt (`m2_model.py:236` before `:241`);
- a torn tail or unparseable line gives `ValueError` and then `BudgetRefused` (`:214-215`);
- a missing price for a non-stub model gives `BudgetRefused` (`_price_table`).

Gaps:
- `budget_usd` defaults to None and nothing configures it (`:209`), so a priced backend runs uncapped.
- The ledger lives in the store per experiment (`discovery/<exp>/model/usage-ledger.jsonl`), so a store writer can truncate it.
- A parseable but malformed line raises `KeyError`, which escapes `_reserve` uncaught. That is still before HTTP, but it crashes
  `run_experiment`.
- Fix: refuse when any price is above 0 and `budget_usd is None`. Catch `KeyError`/`TypeError` in `_reserve`. Keep the ledger outside the store.

### L6 (LOW): small holdout leak and an unvalidated `frozen.improve` on resume

- `discovery.py:421` feeds the previous version's hidden-holdout pass count back to the proposer ("…(24/24 passed)").
- `prompt()` (`:262-265`) inserts `frozen.improve.base_body` and `objective.value` without re-validating them. A store-written experiment can put
  6 000 chars of free text into the prompt.
- Fix: drop the counts from the feedback, and in `_loop` re-run `check_objective` and require `base_body` to equal the signed statement body.

---

## Answers to the nine questions

1. **Improve bypass.**
   - Only the explicit `cap improve` path reaches `open_experiment(improve=...)`: `discovery.py:427-446` <- `acquire.py:597` <- `cap_cli.py:186`
     <- `cli.py:244`. Nothing automatic does.
   - A store writer can still forge any experiment record (pre-existing; M4).
   - The proposer cannot see the seed or the private fixtures. The seed comes from `SystemRandom` in `gen_private`, only `set_sha256` and `n` are
     frozen, and the prompt carries the spec, the dev cases, the admitted body and the objective text. The aggregate leak is L6.
   - An improvement can be admitted without beating its objective (M3, PoC). A stale or non-active base is refused (`hive_admission.py:141-145`),
     but that check is skipped if the record omits `improve` (M4).
   - The objective is constrained to an enum or a number at open (`discovery.py:400-410`), but it is not re-validated at prompt or sign time (L6).
2. **Fallback.**
   - No unadmitted, revoked or unrechecked code executes: every attempt goes through `resolve_discovered` and its statement_sha pin
     (`goal_runner.py:534-537`).
   - Integrity is not always fail-closed (M2, PoC). Alternatives are not interface-checked (M1, PoC).
   - Fallback is bounded: `MAX_FALLBACKS=2` per goal, including run-plan substitutions, and the container budget and deadline are checked before
     each try (`:630`).
   - VERIFIED is not always after an independent check: the replay path (H2, PoC).
3. **Stored plans.** No, they are not fully re-derived (H1, PoC; M1). The capability, version, evaluator and permissions/resources at run time
   still come from the signed statement. File names, kind, fallbacks and the contract budget come from the store.
4. **cap_history.** It only reorders alternatives that are admitted, rechecked and of the same interface, or it crashes planning (L1). No free
   text reaches prompts, policy or ranking.
5. **find_duplicate.** No. It only returns capabilities that pass `resolve_discovered` (`capability_registry.py:213-229`), and DUPLICATE executes
   nothing.
6. **Model backends.** No unqualified, non-loopback or unpinned backend is selectable by config or store edit (`m2_model.py:35-51`, `:144-149`,
   `:101-123`). Weight bytes are hashed only when the caller runs `check_weights`. The DRAFT is inert, but renaming it would activate it (L4).
7. **Spend gate.** The reservation comes before HTTP, and a torn ledger or missing price fails closed. The gaps are L5.
8. **Source allowlist.** Deny wins, and the gate runs at search and at the card. It can be bypassed through the store-written URL (M5).
9. **Genericity.** PASS. A grep of `src/hive` finds no `site.*` or task identifiers; the only hit is the `site-packages` path in acq_stage.
   The d96b510 site capabilities ship no adapter (`adapter_ref: null`) and no solution reachable by the proposer. Hidden cases are random-seeded
   into gitignored `.hive/c3-private`. `oracle.py` and `baseline.py` are evaluator-side only.

---

## Appendix omitted

The reviewer's proof-of-concept scripts are not published. They were never committed to the build branch.
