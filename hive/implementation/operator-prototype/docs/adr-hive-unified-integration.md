# ADR: HIVE-native unified integration

Status: PROPOSED. Written against `build/working-prototype` at `32afa0e`. Code facts cite `file:line` or a commit read in this task. Anything not found in code is labelled **PROPOSED**. No pytest run, no model calls, no source or test edits were made. Test status below is static (test file present, test names read); reported pass counts were not reproduced.

## Context

- The unified audit (`docs/hive-unified-audit.md`) was taken at HEAD `fac5586`. HEAD is now `32afa0e`. Modules added since: `6e67d49` (roles, run_state), `b5a025c` (repo_intel), `21c3e96` (ooda), `caa0ebe` (adapter stubs), `32afa0e` (dispatch gate). The audit's "SOURCE_ONLY" labels for UsageLedger, RunAnywhere and Obscura are stale.
- `build/unified/gap-map.json` also predates those commits. It lists `OODAController` as MISSING (`gap-map.json:17`), `RunAnywhere`/`Obscura` adapters as MISSING (`:21-22`), and `docs/runbooks/hive-local-operator.md` as missing (`:25`). All three now exist (`src/hive/ooda.py`, `src/hive/adapters/{runanywhere,obscura}.py`, `docs/runbooks/hive-local-operator.md` in `caa0ebe`). Gap-map status is treated here as historical only.
- Canonical HIVE pieces, all present and in use:
  - `Store` (`src/hive/storage.py:36`), SQLite, with the `events` journal and `TRANSITIONS` (`storage.py:6`).
  - `Executor` (`src/hive/orchestrator.py:149`).
  - `ContextPolicy` (`src/hive/context_policy.py:91`), with `preflight` (`:240`), `record_usage` (`:341`), `is_emergency_stopped` (`:228`) and `DispatchBlocked` (`:30`).
- Governance rule: every autonomous dispatch passes the preflight gate, fail-closed (`docs/CONTEXT_GOVERNANCE.md:21-24`, `:38-52`).
- AGENTS.md: "Prefer the smallest runnable implementation and existing tools. Do not build a dashboard, distributed runtime, or memory service without a demonstrated need." and "Keep model output separate from execution authority."

## Decision

**PROPOSED:** one HIVE-native architecture. `Store`, `Executor` and `ContextPolicy` stay canonical. New modules extend them. There is no second coordinator, no second database and no second daemon. Each new module either attaches to an existing seam or stays a standalone, tested seam until a caller is added.

### Per-module status

Status key: **UNIT_TESTED** = test file exists, no production caller. **INTEGRATION_TESTED** = production caller exists and a test exercises that path (static, not run here). **NOT_WIRED** = no production caller in `src/`.

| Module | Extends | Status | Commit | Evidence |
|---|---|---|---|---|
| `dispatch_gate.py` | `ContextPolicy.preflight` (`context_policy.py:240`) and `UsageLedger` | **INTEGRATION_TESTED** | `32afa0e` | Attached to the Ollama adapter (`adapters/ollama.py:44`; `begin` `:51` before the request, `finish` `:66` after a valid response). `orchestrator.py:156` creates the gate. `orchestrator.py:476` scopes it with `use_gate` for `local_*` routes only. `DispatchGate.begin` at `dispatch_gate.py:53`, preflight at `:68`, raise on block at `:70-71`; `finish` at `:74`. Tests: `tests/test_dispatch_gate.py:115-174` (usage recorded, block propagates, replay/tool routes make no dispatch at `:125`). |
| `usage_ledger.py` | `ContextPolicy.record_usage` | **INTEGRATION_TESTED** (via dispatch gate) | `7de5957` | `UsageLedger` `:37`, `record` `:77`, hash chain `prev_sha256` `:96`, `verify_chain` `:155`. Unknown model raises `KeyError` `:49-50`. Called from `dispatch_gate.py:44` and `:85`. Known gap: in-process `RLock` only (`:94`). |
| `decision_gateway.py` | `ContextPolicy`, `TaskPacketCompiler`, `governor.route_scope_reason` | **UNIT_TESTED** (CLI-reachable only) | `fac5586` | `DecisionGateway` `:140`, `decide` `:144`, `Decision.enforce` `:94-97`, `REFUSALS` `:30`. Only caller in `src/` is `cli.py:287-291` (`context decide`). Not called on any dispatch path. Test: `tests/test_decision_gateway.py`. |
| `roles.py` (+ `configs/roles.yaml`) | Standalone, meant to feed `ContextPolicy.preflight` | **UNIT_TESTED** | `6e67d49` | `RoleRegistry.check` `:112`, `assign` `:137`. Module docstring says "Standalone seam (not yet wired into ContextPolicy.preflight)" (`roles.py:3`). No importer in `src/`. Test: `tests/test_roles.py`. Config header cites the PiBot pattern (`configs/roles.yaml:1`). |
| `run_state.py` | `Store` (`store.db`, `storage._json`) | **UNIT_TESTED** | `6e67d49` | `LEGAL` `:16-23`, `RunStates` `:50`, `transition` `:81`, `effect_begin` `:109`, `effect_receipt` `:122`, `resume` `:139`. Hash-chained `run_events` (`:35`, `:53-56`). No importer in `src/`. Test: `tests/test_run_state.py`. |
| `repo_intel.py` | Standalone, git CLI only | **UNIT_TESTED** | `b5a025c` | `resolve_ref` `:60` (https-only remote, `:71`), `RepoTreeIndex` `:93`, `ContentCache` `:134`, `SelectiveFetcher.fetch` `:232`, git blob-sha verification `:261-268`. No importer in `src/`. Test: `tests/test_repo_intel.py`. |
| `ooda.py` | `Store` (new tables `ooda_experiments`, `ooda_steps`) | **UNIT_TESTED** | `21c3e96` | `OODAController` `:72`, state set `:19-32`, `LEGAL` `:35-46`, `REQUIRE_REFS` `:48`, `advance` `:148`. No importer in `src/`. Test: `tests/test_ooda.py`. |
| `checkpoint_manager.py` (promote gate) | `review_gate.evaluate` (`review_gate.py:45`) | **PARTIAL**: rollback INTEGRATION_TESTED, promote NOT_WIRED | `9c6c331`, `32afa0e` | `promote` `:28` requires `review:<id>` = `PROMOTE` (`:22-24`, `:30`). `rollback` `:42` requires prior promotion (`:25-27`, `:44`). Rollback called from `orchestrator.py:371,659`, `cli.py:264`, `console.py:364`. `promote()` has no caller in `src/` (grep: none). Tests exist at `tests/test_dispatch_gate.py:174-204`. |
| `adapters/runanywhere.py` | `integrations/sources.lock.json` (entry `:88`) | **UNIT_TESTED, OFF** | `caa0ebe` | Env flag `HIVE_ENABLE_RUNANYWHERE` `:15`. `status()` returns the literal `"state": "OFF"` `:37`. `run()` raises `RuntimeError` when disabled `:44-45`, and `NotImplementedError` when enabled `:46-48`. Label changed to `OFF` in `25f19b2` so it does not claim test evidence. Test: `tests/test_optional_adapters.py`. Not imported by `adapters/__init__.py`, which exports only Ollama. |
| `adapters/obscura.py` | `integrations/sources.lock.json` (entry `:108`) | **UNIT_TESTED, OFF** | `caa0ebe` | Env flag `HIVE_ENABLE_OBSCURA` `:15`. Constraints string `:17-20` (read-only, no stealth/evasion, SSRF and prompt-injection tests required before enablement). Same `OFF` literal `:41`, same disabled/`NotImplementedError` shape `:49-53`. Test: `tests/test_optional_adapters.py`. |

### Upstream patterns

From `integrations/sources.lock.json`. All nine entries have `adoption: "pattern_only"`, `code_imported: false`, `review_status: "UNREVIEWED"`. The `sha` column is `pinned_commit[:8]`.

| Project | Repo | sha[:8] | License (lock) | Adoption | code_imported | Lock line | HIVE use (lock `hive_use`) |
|---|---|---|---|---|---|---|---|
| Jev Engineering | yibie/jev-engineering-zh | 8bab0c14 | NOASSERTION | pattern_only | false | `:6`, `:10` | typed decision gateway |
| PiBot | w01fb0ss/PiBot | 008198f0 | Apache-2.0 | pattern_only | false | `:27`, `:31` | scoped multi-agent roles |
| cache-maxxing | 5m0k3/cache-maxxing | 7934b255 | MIT | pattern_only | false | `:47`, `:51` | provider-aware cache economics |
| go-bot | xyc999-ai/go-bot | 21589385 | MIT | pattern_only | false | `:67`, `:71` | durable sessions / idempotent effects |
| RunAnywhere | RunanywhereAI/runanywhere-sdks | 87865ea8 | NOASSERTION | pattern_only | false | `:88`, `:92` | optional on-device adapter, OFF |
| Obscura | h4ckf0r0day/obscura | fef52749 | Apache-2.0 | pattern_only | false | `:108`, `:112` | optional read-only browser adapter, OFF |
| Vulnerator AI | irraz/vulnerator-ai | 93fa0ab2 | MIT | pattern_only | false | `:128`, `:132` | OODA evidence ledger only, no exploitation |
| El Remoto | agzam/remoto.el | 3fccf0c0 | GPL-3.0 | pattern_only | false | `:148`, `:152` | selective remote git tree/fetch |
| Qwen3.8-Flash-Next | QwenLM/Qwen3.8-Flash-Next | 69885871 | null (no SPDX) | pattern_only | false | `:168`, `:172` | architecture principles only, no weights |

Notes:

- **El Remoto is GPL-3.0: pattern only, no code copy.** `repo_intel.py` is written from HIVE's own design. Its docstring names no upstream code. Lock note: "GPL-3.0: pattern only, no code copy" (`sources.lock.json:165`).
- **RunAnywhere is NOASSERTION, and Qwen has no SPDX.** Both need a license review gate before any adapter code or weights move in. RunAnywhere's adapter stays OFF (`runanywhere.py:37`, `:44-48`). Qwen is architecture-reference only. Lock note: "check Qwen Community License" (`:186`). **PROPOSED:** no code or weights from either until a written license review is recorded.
- **Jev is also NOASSERTION** (`sources.lock.json:10`), which the handoff did not flag. Lock note: third-party study, not Jev's official runtime (`:24`). Treated as pattern-only.
- **Obscura and RunAnywhere are OFF.** The label is code-declared (`obscura.py:41`, `runanywhere.py:37`). It is a gate, not a verified pilot. No adapter performs a browse or an inference.
- **All nine are UNREVIEWED** (`review_status`). The lock records GitHub API lookups by the conductor (`verified_by`, `:189`). Live API calls were not repeated in this task.

### Alternatives rejected

- **Installing upstream frameworks** (RunAnywhere SDK, Obscura binary, PiBot, Jev runtime). Rejected: license NOASSERTION or GPL, no review, and AGENTS.md's "smallest runnable implementation and existing tools". Only patterns are taken.
- **A separate daemon or coordinator** (for example a second orchestrator or a parallel memory service). Rejected: AGENTS.md bars a memory service or distributed runtime "without a demonstrated need". All new state lives in the existing `Store` SQLite (`run_state.py:53-59` and `ooda.py:75-87` create tables in `store.db`; `dispatch_gate.py:20`, `:44` place the ledger file beside the store root).
- **Claude replacing HIVE inference** (routing real dispatches to a hosted model instead of the local adapter). Rejected: it would bypass `DispatchGate` (`dispatch_gate.py:53`) and make model output a source of authority. AGENTS.md: "Keep model output separate from execution authority."

## Consequences

- Gates that are wired now, and that a regression would break: preflight before every real Ollama request (`ollama.py:51`), ledger after a valid response (`ollama.py:66`), replay and tool routes never gated (`test_dispatch_gate.py:125`), and rollback limited to prior promotions (`checkpoint_manager.py:44`).
- Gates that exist but are not on any path: `DecisionGateway` MODEL_ROUTE, `RoleRegistry`, `RunStates`, `RepoTreeIndex`/`SelectiveFetcher`/`ContentCache`, `OODAController`, the `promote()` review requirement. A passing unit test does not mean the gate protects a run.
- Ledger gap: `finish` runs only after a fully validated response (`ollama.py:66`). If `transport` (`:58`) returns and a later check raises (`:59-65`), tokens may have been spent with no ledger row or budget charge.

## Open items

1. **DecisionGateway MODEL_ROUTE is not wired at dispatch.** It exists only behind `cli.py:287-291`. Wiring it before `DispatchGate.begin` would change the route choice (it selects the lowest-cost eligible model, `decision_gateway.py:224-225`). **PROPOSED:** make the route choice an explicit, reviewed change with a test that the chosen model equals the lowest-cost eligible model.
2. **roles, run_state and OODA are not wired into `Executor`** (`orchestrator.py:149`). `orchestrator.py` does not import them (grep). `roles.py:3` states the same. **PROPOSED:** attach `RoleRegistry.check` to `ContextPolicy.preflight`, and attach `RunStates` to the `Store` job lifecycle, as separate, individually tested steps.
3. **OODA `max_wall_seconds` is stored but not enforced.** It is validated (`ooda.py:136-137`), stored (`:146`) and returned (`:209`). `advance()` (`:148-198`) reads only `max_steps` (`:168`). **PROPOSED:** check elapsed wall time in `advance()` and force `INCONCLUSIVE` with reason `wall` on expiry.
4. **UsageLedger cross-process writers need a file lock.** The writer uses only an in-process `RLock` (`usage_ledger.py:43`, `:94` ponytail note). Two processes can read the same `prev_sha256` (`:96`) and fork the chain. **PROPOSED:** an OS file lock around `_prev_sha` plus append in `record` (`:95-99`).
5. **Ledger gap on exception paths** (see Consequences). **PROPOSED:** record an estimate in a `finally` path after `begin` succeeds.
6. **Promote gate has no production caller.** `Checkpoints.promote` (`checkpoint_manager.py:28`) is called only from tests. **PROPOSED:** route promotion through `record_review` and `promote` in one reviewed step, with the gate covering `review_gate` (`review_gate.py:45`).
7. **License review gates** for RunAnywhere (NOASSERTION), Qwen (no SPDX), Jev (NOASSERTION): none recorded. **PROPOSED:** a written review entry in `sources.lock.json` before any adapter code or weights are imported.

## Verification status

- Not run: pytest, `hive doctor`, any model call, any adapter enablement.
- Static evidence only: the test files and names cited above exist (`tests/test_dispatch_gate.py`, `test_decision_gateway.py`, `test_roles.py`, `test_run_state.py`, `test_repo_intel.py`, `test_ooda.py`, `test_usage_ledger.py`, `test_optional_adapters.py`). Their pass status is not confirmed here.

## Update after 25f19b2 (conductor, 2026-11-22)

- Open item 2: **resolved in part.** `RunStates` is now recorded through the `Executor` job lifecycle, with effect receipts around local dispatch. `RoleRegistry` is checked in `DispatchGate.begin` (the builder role holds `model_dispatch`). The OODA controller still has no production driver.
- Open item 3: **resolved.** `max_wall_seconds` is enforced in `advance()` with an injectable clock, and expiry records INCONCLUSIVE with reason `wall_clock`.
- Open item 5: **resolved.** Any request that reached the transport now records usage before the error propagates.
- Open item 6: **confirmed intentional.** There is no production promotion path; tests assert that no `src/` code promotes the governing checkpoint. P2 stays quarantined.
- Open items 1, 4 and 7: still open.
- Verification: the full suite passed at `32afa0e` (661 passed, 3 skipped) and at `25f19b2` (689 passed, 3 skipped, 0 failed).
