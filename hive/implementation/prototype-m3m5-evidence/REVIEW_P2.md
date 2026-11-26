# REVIEW_P2: re-check of the REVIEW_P1 fixes (a62f671..afbe56a)

Reviewer: independent, read-only on src/tests/configs. Threat model as in P1: the attacker writes the store, goal and experiment records and controls
proposer output; the attacker cannot reach the signing key, configs/ or evaluator files.

## Verdict: BLOCK (on N1 alone)

Every P1 HIGH and MEDIUM is fixed, except M4, which is narrowed. The fixes are careful: stored plans are rebuilt from the registry, the replay is
re-verified by the oracle, failures are classed by allowlist, and admission re-measures the previous version. Honest plans and an honest
improvement still pass.

The block is a new HIGH, **N1**. It was there before these fixes and is the registry-op sibling of H2, which P1 missed. A forged
`operator/task/<tid>` record makes a registry step VERIFIED with no execution and no oracle. The goal then reads the forged artifact `ref` from
any path on disk. The PoC carries an outside file's content into `output/goal/<id>/` as a VERIFIED inventory diff, which the attacker can then read
from the store. The fix is about 15 lines (below). Once it lands, the verdict becomes ACCEPT WITH FIXES (N2 and N3 to fix or record as known risks).

Tests run on afbe56a (Docker-free; all used a short `--basetemp`):
- `tests/test_p_fix_runner.py tests/test_p_fix_admission.py tests/test_p_fix_model.py`: **40 passed** (98.8 s).
- `tests/test_p_planner.py test_p_improve.py test_p_model.py test_p_sec_hostile.py test_p_cli.py`: **66 passed, 1 skipped** (143 s).
- Review PoCs (appendix, not committed): **18 passed** (44.2 s). These are the 7 P1 PoCs adapted so they now assert the fix, plus variants, the new
  findings and one honest real-path admission.
- Honest stored-plan round-trip (appendix): **2 passed**. A DAG fan-out plan (H2 pictures) and a 3-step linear chain with a same-interface
  alternative both keep every run field after `_refresh_stored` and `validate_plan`: op, kind, inputs, after, expected_output, pins, report_name,
  dag and estimate.

---

## P1 findings: status

| ID | Status | Evidence (afbe56a) | PoC result |
|----|--------|--------------------|------------|
| H1 stored plan fields | **FIXED** | `goal_runner.py:767-803`: `_refresh_stored` keeps only step_id/op/inputs/pins. Kind, adapter, expected_output, verifier, allowance, after and report_name come from `ok` (`_step_from` `:744-764`). `STEP_ID` is checked at `:23`/`:776` and in `validate_plan` `:404-406`. The stored ranking is dropped and dag/estimate are recomputed (`:781`, `:799-802`). The contract id, budget clamp and fields are re-checked in `_check_stored_contract` `:806-815` (called at `:844`). Every write goes through `_goal_dir` `:27-32` + `O.contained` (`operator_runtime.py:391-399`). | The report_name escape now ends VERIFIED with no outside file. Honest round-trip passes. |
| H2 forged saved result | **FIXED** | `_cached_output` `goal_runner.py:613-627`: matching statement, the contract's artifact name, the ref resolves under `output/`, a size cap and a hash check. The oracle is re-run before VERIFIED (`:573-580`). Export names come from the contract, not the record (`:561-571`). The oracle is an exact-equality reference (`capcontract.py:37-38`), so forged bytes can only equal the correct answer. | The forged record (escape name, and wrong bytes under `output/` with a matching hash) is re-executed. Nothing is written outside. |
| M1 fallback interface | **FIXED** | `_discovered` `:693-695` recomputes alternatives from `_collapse(eligible_caps)` after the first failure. The stored ranking is never read. Run-plan substitution requires an equal `(types, arity, out)` (`:789`). Writing another interface's op straight into a stored step is refused by `validate_plan` (PoC). | Other-interface capability is not run; the op-swap variant gives PLAN_INVALID. |
| M2 integrity fail-closed | **FIXED** | `_failure_class` `:630-635`: exact-type allowlist, so `SandboxUnavailable` (a RuntimeError subclass) becomes INTEGRITY. `Refused` from load_module/exec_args is re-raised (`:591-592`). A missing chain head is INTEGRITY (`:655-657`). Run-plan substitutes only for "every version revoked" (`_revoked_iface` `:728-741`). Anything else goes to `bad`, then `integrity_failure` and PLAN_INVALID (`:785-787`, `:878-882`). Residual (see the PoC): a `docker run` exit 125 is still EXECUTION. That is harmless, because the next attempt re-inspects the image first. | Cleanup-unverified now gives STEP_FAILED with `integrity_failure` and no fallback. |
| M3 forged improve_eval | **FIXED** | `hive_admission.py:144-196`: the record flag is ignored. The base body, sha and active version must match (`:169-173`). The objective is re-validated (`:174`). The previous-version receipt is re-checked and, on the real path, **re-measured** (`:179-185`). `met` is recomputed (`:186-189`), the dev regression is re-run in a container (`:190-195`), and the statement signs the recomputed values (`:85-87`). Production passes `rerun=None` (`cap_cli.py:184`). | Forged improve_eval is refused. A forged previous receipt is refused on the real path ("does not reproduce"); only the `rerun=` test seam trusts it. Honest real-path improvement admits v2. |
| M4 version binding | **PARTIAL** | Fixed against record forgery: refused when the exp_id was already admitted, or when the body equals any admitted or revoked version (`:152-156`). An existing version requires an explicit improvement (`:157-165`). **Gap:** the binding reads the store chain. If a store writer deletes or rewinds `operator/capreg/<cap>` after a signed revoke, the authority sees no versions and re-admits the revoked body as v1 (PoC m4c). Root cause and fix: N2. | Re-admitting the revoked exp is refused, and so is the same body under a new exp_id. With the chain deleted it is admitted (m4c). |
| M5 clone URL | **FIXED** | `acq_github.py:93-103`: `clone_url` derives `https://github.com/<full_name>` and refuses any stored URL that differs. It is used for both resolve and clone (`acquire.py:275-279`), so the name the deny/allow gate checks is the source fetched. Nits N7. | n/a (F2 tests pass) |
| L1 history on read | **FIXED** | `cap_history.py:30-41`: rows are re-validated with the same rules as `record()`, and a non-list value is ignored. | The forged row no longer crashes planning. |
| L2 improve ledger | **FIXED (accepted design)** | `discovery.py:215-220`: own frozen budget AND a per-capability total of `2 x BUDGET`. See the answer below. | n/a |
| L3 latency objective | **FIXED** (removed) | `check_objective` `discovery.py:410-418` accepts only failure_class. `objective_result` `:425-431` is a pure function of two receipts, and the CLI help is updated. | n/a |
| L4 DRAFT approval | **FIXED** | `m2_model.py:115-121`: a DRAFT name or text, or a status other than active, is refused. A non-default backend needs `status: active` AND the file sha bound in configs (`apply_backend` `:51-52`, `model_dispatch.json:29` is `null`). That defeats both rename and edit. New functional problem: N4. | n/a (F3 tests pass) |
| L5 spend gate | **FIXED** (nit) | A priced model with no budget is refused (`:215-216`). `KeyError`/`TypeError`/`AttributeError` fail closed before HTTP (`:218`, `:230`). One project ledger `ROOT/.hive/model-spend-ledger.jsonl` (`:149-152`) sits outside the documented store `.hive/operator`. Nit: with the CLI default `--store .hive` (`cli.py:23`) the ledger, and also `.hive/c3-private`, sit inside the store root. Refuse a ledger path that resolves under the store. | n/a |
| L6 holdout leak / resume | **FIXED** | The previous version's counts are gone from `why` (`discovery.py:429`). On resume, the objective, `sha(base_body)` and the active base are re-validated before any prompt (`:530-540`). Residual by design: the candidate's own hidden failure count is still fed back (`:656`), one number per proposal. | n/a (F2 tests pass) |
| 9f27c0a | **PASS** | Only `capabilities/site.ref-*` and the types/docs/tests/export script changed; no src. The proposer sees spec.md (natural-language grammar, no code), `gen_public` cases and the envelope text. oracle.py and baseline.py are evaluator-side only and not referenced from `proposer`. `adapter_ref` is null. | n/a |

### Question: F2's per-capability improvement cap instead of the global ledger (L2): acceptable?

Yes. The global ledger is a lifetime cap of one discovery budget (`BUDGET[k] - g[k]`, never reset). Applying it to improvements would block every
improvement once the first discovery had spent it. The chosen bound is tighter in practice:
- each experiment needs an explicit `cap improve`;
- there are at most 2 per base version;
- each one has its own frozen budget;
- each capability has 2 discovery budgets in total;
- each new version needs the key holder.

Two caveats, neither blocking:
- The cap is per capability for its whole life, not per base version as the comment at `discovery.py:36` says. After about two fully spent
  improvement experiments, a capability can never be improved again. Fix the comment, or key the sum by `base_version`.
- Like the global ledger, it is summed from store-written experiment ledgers, so a store writer can reset it. The real-money bound is the F3
  project ledger, which is outside the documented store.

### Question: qwen in `qualified` with `measured: true` and no live receipt?

No. Set it to `measured: false` until the conductor records a live smoke receipt, and flip it in the same commit that adds that receipt to
`evidence`. Three reasons:
- `measured` is the only "qualified" gate in `model_dispatch.plan` (`model_dispatch.py:49`). The approval binding is a separate owner gate. With
  `measured: true`, binding `approval_sha256` alone makes qwen executable.
- The requested model comes from the store-written `frozen.proposer.model` (`discovery.py:569`), so a store writer could then route experiments to
  a model never measured on the evaluator.
- The live path is untested and does not work today (N4). The evidence line itself says no receipt exists.

---

## New findings

### N1 (HIGH, existed before these fixes, sibling of H2, missed in P1): a forged registry task replay is VERIFIED without any check, and the goal reads the forged ref from any path

- `operator_runtime.py:424-428`: `run_task` returns any saved `operator/task/<tid>` whose state is VERIFIED or REJECTED when `_replayable`
  (`:368-375`) holds. That needs only the current genome and the evaluator pin, both public in the store. No file, hash or oracle is checked, and
  `tid` is computable (`task_id` `:378-380`).
- `goal_runner.py:950-958`: the registry branch takes the forged artifacts and does `(store_root / a["ref"]).read_bytes()`. An absolute `ref`
  reads any file the process can read. Those bytes feed the next step, and the forged list becomes `rec["deliverable"]`.
- Scenario (PoC `test_poc_n1c...`):
  1. Store-write the convert task of `before.csv` with `ref` = an outside CSV file.
  2. Run `run_goal` for "compare before and after". The goal is VERIFIED, the convert step is `saved_result_replay` with 0 container runs, and
     inventory-diff runs on the outside file's rows. The oracle agrees, because it checks the diff against the forged input.
  3. The outside file's content now sits in `output/goal/<id>/`, which the attacker reads.

  PoC `n1` shows a single-step VERIFIED goal whose deliverable ref is the absolute outside path.
- Minimal fix:
  - `_finish`: also save the raw output as an artifact (`raw_output_ref = s.put_artifact({"text": out})`).
  - `run_task` replay: accept a record only if its artifact names are the op's fixed export set, each `ref == f"output/operator/{tid}/{name}"`,
    and each file hashes to `a["sha256"]`. Then reload the raw output, require `_sha(out) == raw_output_sha256`, and re-run
    `independent_verify(op, texts, out)` until it passes. Otherwise re-execute. This is the H2 rule applied to the second replay path.
  - `goal_runner` registry branch: read through `O.contained(store_root / "output" / "operator" / t["task_id"], a["name"])` and check the hash.

### N2 (MEDIUM, existed before these fixes; root cause of the M4 gap): revocation does not survive a store writer

- `capability_registry.py:72,75-85,119-150`: the chain head is a plain store key and every prefix of a valid chain verifies. A store writer who sets
  `operator/capreg/<cap>` back to the admit event makes a revoked v1 active again (PoC `n2`). Deleting the key and asking for a re-admission brings
  the revoked body back through the authority (PoC `m4c`). P1's answer to Q2 ("no revoked code executes") does not hold against a store writer.
  The code is still once-signed, rechecked and sandboxed.
- Minimal fix: `hive_admission.revoke` also appends `cap_id version impl_sha256` to an owner-written `configs/admission_revocations`, next to
  `admission_signers`. `_state` / `resolve_discovered` refuse a listed (cap, version), and `_chain_and_improvement` refuses a listed impl_sha256.

### N3 (LOW, defence in depth): `_write` follows a planted `<name>.tmp` link

- `operator_runtime.py:402-406` writes `path.with_suffix(".tmp")` with `write_bytes`. `contained()` checks only the final name. Reproduced as the
  same user on this machine: a pre-planted **hardlink** `output/goal/<gid>/report.json.tmp` (no privilege needed; symlinks were refused, WinError
  1314) made the goal write overwrite the link target.
- Whether a store-only principal can hardlink a file in `configs/` depends on OS policy, so this rates LOW.
- Fix: `fd, tmp = tempfile.mkstemp(dir=path.parent, prefix=".w-")` (O_EXCL, random name), write, then `os.replace`.

### N4 (LOW, functional, fails closed): an honestly activated qwen approval is refused in discovery

- The DRAFT carries the M2 caps (`proposals_total 48, model_calls 64, ...`), but discovery's policy requires `APPROVAL_CAPS` (`discovery.py:37,90`).
  `apply_backend` keeps the policy's caps. Simulated: the DRAFT activated with `activate_backend_approval.py` semantics and the sha bound gives
  `approval_problems(...) == ['caps']`.
- The F3 test drives qwen only through the stub, which skips the approval gate.
- Fix: give the DRAFT the C3 caps (or carry per-backend `approval_caps`) and add one non-stub `approval_problems` test on an activated copy. Keep
  `measured: false` until a live receipt exists.

### Nits (no security impact today)

- N5 `_refresh_stored` `:781` derives `dag` from the **stored** ops. If a revoked typed-slot op is substituted, `dag` can flip to False: report
  names collapse to `report.json` and the up-front estimate check is skipped. Derive it from `steps` after substitution.
- N6 A stored `allowance.timeout_s` "may only be lower" (`:749-752`), but it only feeds the estimate, so a store writer can only shrink the up-front
  budget check. Drop the stored value. `_check_stored_contract` checks `deliverable in T["types"]`, not `T["deliverables"]`, and does not validate
  the shape of `inputs[*]` (a KeyError crash, not a Refused).
- N7 `FULL_NAME` uses `^...$`, so a trailing newline matches. It is caught later by the whitespace check in `repo_intel._validate_repo_url`; use
  `fullmatch`. Store-injected candidates are not checked against deny/allow before the clone (`acquire.py:275-279`), so a denied github.com repo is
  fetched to disk and refused only at the card. Call `AG.source_refusal` before `clone_url`.
- N8 In run-plan, an excluded registry op gives PLAN_INVALID without `integrity_failure`. At run time, a primary revoked between plan and run no
  longer falls back (`_collapse` has no group for an op that is no longer eligible). Group it by `_revoked_iface` if that matters.
- N9 Revoking the only version is now permanent. With versions present a non-improvement is refused, and with nothing active an improvement is
  refused. Allow a non-improvement admission when `cur is None`, keeping the exp_id and impl_sha checks, if that is wanted. The `"DRAFT"`
  substring test (`m2_model.py:115`) also refuses an honest approval that uses the word anywhere.

---

## Appendix omitted

The reviewer's proof-of-concept scripts are not published. They were never committed to the build branch.
