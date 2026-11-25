# HIVE improvement loop

Status: PROPOSED loop, IMPLEMENTED state machines. Written against `build/working-prototype` at `32afa0e`. Every code fact cites `file:line` or a commit read in this task. Items marked **PROPOSED** are not in code. No pytest run, no model calls, no edits to `src/` or `tests/`.

## 1. What the loop is

The operating loop in the directive (`docs/NEXT_BUILD_LEARNING_LOOP_DIRECTIVE.md:119-135`) is:

read durable queue and authorization → freeze scope, baseline, hashes, budget, metric → one falsifiable hypothesis → small isolated build → regression + fixture run → independent verification → pass: next item; fail: record counterexample, rollback → same failure twice: independent diagnosis and a changed hypothesis.

Code today implements the **pieces** of that loop, not a driver:

| Loop step | Implemented by | Driver that calls it |
|---|---|---|
| Bounded experiment, hypothesis, step ledger | `src/hive/ooda.py` (`OODAController`) | None. `ooda.py` has no importer under `src/` (grep). Only `tests/test_ooda.py`. |
| Gated real dispatch (build/model calls) | `src/hive/dispatch_gate.py` | Yes: `orchestrator.py:476`, `adapters/ollama.py:51,66` |
| Durable run lifecycle | `src/hive/run_state.py` (`RunStates`) | None (no importer under `src/`) |
| Promotion and rollback of a checkpoint | `src/hive/checkpoint_manager.py` | Rollback yes (`orchestrator.py:371,659`, `cli.py:264`, `console.py:364`); promote no (no caller under `src/`) |

**PROPOSED:** one driver that runs the directive loop, which calls `OODAController` for the experiment record, `DispatchGate` for each model call, `RunStates` for the run, and `Checkpoints.promote` only after a review verdict. Nothing in this document makes the driver exist.

## 2. OODA experiment state machine (`src/hive/ooda.py`)

The controller stores one row per experiment (`ooda_experiments`, `:75-81`) and an append-only step ledger (`ooda_steps`, `:82-87`). Each step has `prev_sha256`-style chaining: `_digest` (`:55-58`) covers the previous digest, experiment id, step number, event id, from/to state and payload. `verify_chain` (`:212-224`) recomputes it. The tamper test is `tests/test_ooda.py:144`.

Legal transitions (`LEGAL`, `:35-46`):

```
              create()  (limits: max_steps>0, max_wall_seconds>0; :132-137)
                 |
              CREATED
                 | advance(OBSERVE)
              OBSERVE
                 | advance(ORIENT)      requires refs      (REQUIRE_REFS :48)
              ORIENT
                 | advance(DECIDE)
              DECIDE
                 | advance(ACT)         requires refs
              ACT
                 | advance(VERIFY)      requires refs
              VERIFY
                 +--- advance(ACCEPT)       requires refs, verifier_verdict == "pass",
                 |                          verifier set and != author   (:183-187)
                 +--- advance(REJECT)       requires refs
                 +--- advance(INCONCLUSIVE) requires refs
                 |
              ACCEPT | REJECT | INCONCLUSIVE
                 | advance(CHECKPOINT)
              CHECKPOINT   (terminal; any further advance raises OODAError, :161-162)
```

Rules enforced in `advance()` (`:148-198`):

- Only the next state in `LEGAL` is accepted; anything else raises `OODAError` and writes nothing (`:165-166`; test `tests/test_ooda.py:62`).
- `REQUIRE_REFS` states (`:48`) need a non-empty list of string refs (`:179-182`).
- ACCEPT needs `verifier_verdict == "pass"` and a `verifier` that is present and differs from `author` (`:183-187`; tests `:70`, `:83`, `:174`).
- **Step budget.** If the next step would exceed `max_steps` (`:168`), `advance()` writes an `INCONCLUSIVE` step with reason `budget`, then a `CHECKPOINT` step, sets the experiment to `CHECKPOINT` with verdict `INCONCLUSIVE` (`:170-176`), and then raises `OODAError("step budget exceeded")` (`:197-198`). The requested state is **not** recorded. Test: `tests/test_ooda.py:103`.
- **Wall-clock budget is not enforced.** `max_wall_seconds` is validated (`:136-137`) and stored (`:146`) but `advance()` never reads it. Only `max_steps` is checked. See section 7.

Timestamps are ms strings (`_now`, `:125-126`). Events and steps commit inside `BEGIN IMMEDIATE` (`_tx`, `:89-97`).

## 3. Run state machine (`src/hive/run_state.py`)

Legal transitions (`LEGAL`, `:16-23`); terminal set `TERMINAL` (`:15`):

```
(none) -> ADMITTED -> RUNNING -> CHECKPOINTED -> VERIFYING -> ACCEPTED   [terminal]
                                                      |
                                                      +--------> REJECTED   [terminal]

RUNNING, CHECKPOINTED, VERIFYING --> PAUSED --> RUNNING        (pause / resume)
CHECKPOINTED --> RUNNING                                        (re-run)
ADMITTED, RUNNING, CHECKPOINTED, VERIFYING, PAUSED --> FAILED   [terminal]
```

Written out, the edges are:

- None → ADMITTED
- ADMITTED → RUNNING, FAILED
- RUNNING → CHECKPOINTED, PAUSED, FAILED
- CHECKPOINTED → RUNNING, VERIFYING, PAUSED, FAILED
- VERIFYING → ACCEPTED, REJECTED, PAUSED, FAILED
- PAUSED → RUNNING, FAILED

There is **no direct RUNNING → VERIFYING edge**. A run must pass through CHECKPOINTED (`:19`, `:20`). `STATES` (`:24`) includes all of the above.

Properties implemented:

- Hash-chained `run_events` table (`:53-56`). `_digest` (`:35-36`) includes the previous digest. `_last` (`:71-79`) checks the last row. `resume` (`:139-154`) verifies the whole chain, gapless `seq`, and `from_state` continuity before reporting state.
- Event id replay is idempotent: a duplicate `event_id` with the same state and payload returns the original (`:87-91`). The same id with different content raises `ValueError`.
- Terminal states are immutable (`:94-95`).
- **Effects.** `effect_begin` (`:109-120`) records intent before an external effect. `effect_receipt` (`:122-137`) records completion once; the same digest is a no-op; a different digest raises. `resume` lists effects with no receipt as `effects_unknown` (`:154`).
- Writers serialize on `BEGIN IMMEDIATE` (`_tx`, `:61-69`).

Nothing under `src/` imports `RunStates` (grep). The state machine is tested in `tests/test_run_state.py` only.

## 4. Promotion gate (`src/hive/checkpoint_manager.py`)

```
save(policy, evidence, approved: bool)        -> checkpoint:<ref> stored      (:6-10)
   |
record_review(ref, gate_input)                -> review:<ref> = evaluate(...)  (:16-21)
   |                                              review_gate.evaluate returns PROMOTE | REJECT | QUARANTINE (review_gate.py:45)
   v
promote(ref)  requires: approved artifact (:14, :29)
              AND review:<ref>.decision == "PROMOTE"   (:22-24, :30)
   |
   v  _switch: BEGIN IMMEDIATE; previous_checkpoint = old current;
               current_checkpoint = ref; promoted:<ref> = True   (:32-41)

rollback(ref) requires: approved artifact (:43-44)
              AND ref was promoted before  (:25-27 promoted:<ref> marker
                  OR ref is current/previous checkpoint)           (:44)
   |
   v  _switch; last_rollback = {restored: ref, reason: ...}        (:45-46)
```

Facts:

- A review verdict is stored per checkpoint. A rejected or quarantined verdict does not block `rollback`, only `promote` (test: `tests/test_dispatch_gate.py:174-204`, "promote denied without review and after failed review"; "rollback to previously promoted works but unpromoted refused").
- **Production promotion has no caller.** `promote` is defined at `checkpoint_manager.py:28`. A grep for `.promote(` under `src/` finds no call site. Only rollback is wired (section 1).
- The commit that added the review requirement is `32afa0e` ("review-gated promote"). Its stat shows the change to `checkpoint_manager.py` (25 lines) and `tests/test_dispatch_gate.py` (218 lines, new).
- `build/unified/gap-map.json:18` records the earlier contract ("promote checks approval only, not review_gate", at `checkpoint_manager.py:13`). That entry predates `32afa0e`; `promote` is now at `:28`.

## 5. Dispatch gate (`src/hive/dispatch_gate.py`)

Sequence for one real model call:

```
Orchestrator.execute (local_* route only)       orchestrator.py:476  use_gate(self.gate)
   |
OllamaAdapter.generate(model, prompt, ...)      adapters/ollama.py:49
   |
   1. gate.begin(task_id, model, endpoint, prompt, max_tokens)     ollama.py:51 -> dispatch_gate.py:53
        - first real dispatch only: seed budgets from ledger totals   (:57-65)
        - est_in = bytes(prompt)//4 + 1                              (:29-30, :66)
        - policy.preflight(...) ; not eligible -> raise DispatchBlocked (:68-71)
        - returns ticket {task_id, model, est_in, start}              (:72)
   |
   2. discover() catalog + digest pin + transport(POST /api/chat)  ollama.py:52-58
   |
   3. response validation (message, size cap, model id, eval_count)  ollama.py:59-65
   |
   4. gate.finish(ticket, response)                                 ollama.py:66 -> dispatch_gate.py:74
        - measured iff prompt_eval_count and eval_count are both ints   (:78)
        - UsageLedger.record(...)  (hash chained)                       (:85)
        - policy.record_usage(model, fresh_in, out, cost)                (:86-87)
```

Rules:

- **Preflight before, ledger after.** The ledger row is written only on the success path at `:66`. A failure in steps 2–3 after the transport call leaves no ledger row (ADR open item, section 7).
- **Blocked dispatch is a block, not a model failure.** `DispatchBlocked` propagates (test `tests/test_dispatch_gate.py:106`, "execute propagates block instead of scoring it as model failure"). The executor then blocks the job and releases the reservation (test `:149`; handler at `orchestrator.py:480`).
- **Replay and tool routes never reach the adapter.** Test `tests/test_dispatch_gate.py:125`, "replay and tool routes make no dispatch and write no usage". `use_gate` is scoped only around `local_*` routes (`orchestrator.py:474-476`). Non-local routes call `execute` without the gate (`:478-479`).
- Emergency stop and exhausted budget both block before any request (tests `:77`, `:86`).
- The gate and ledger load lazily on the first real dispatch (`dispatch_gate.py:41-45`, docstring `:7-8`).
- The ledger file is `usage-ledger.jsonl` under the store root (`:20`, `:44`).

## 6. Safety and provenance

- **P0 governs.** The current production policy is P0. The directive says "Do not overwrite P0 or change the expected result" (`docs/NEXT_BUILD_LEARNING_LOOP_DIRECTIVE.md:87`) and "retain P0" when a candidate does not pass (`:113`).
- **P2 is quarantined.** P2 is a "versioned experimental policy" (`:87`). The overseer rule is to keep it quarantined (`:228`). AGENTS.md: "Publication does not promote a quarantined policy or expand budgets" (AGENTS.md, last bullet). The DecisionGateway, roles and OODA modules do not change which policy is active.
- **Model output is not authority.** AGENTS.md: "Keep model output separate from execution authority." `RoleRegistry.check` denies unknown roles, tools and `..` paths (`roles.py:112-131`). `DecisionGateway` PERMISSION_CHECK denies unknown tools and paths outside allowed roots (`decision_gateway.py:257-271`). These are typed checks, not model judgments. Neither is wired into dispatch (section 1).
- **No learning claim without source-disjoint held-out evidence.**
  - Level A acceptance: at least 10 of 12 genuine attempts independently accepted, across six video source groups and six independent code snapshots, plus the R1–R8 and A1–A6 gates. Passing 10/12 alone is not enough (`:77`).
  - Level B transfer: a separate, preregistered study with at least 24 source-disjoint, matched, previously unused holdout tasks, compared with a deterministic tool, a fixed specialist, a fixed team and a learning-disabled controller (`:105`). Statistical ambiguity is INCONCLUSIVE, not success (`:111`).
  - The repo's own status line: v0.3.0.dev4 is "READY_FOR_PRESSURE_TESTS, not accepted Level A or Level B" (`:35`).
  - The live-store demo (5 requests, 73 tokens, 7 cycles, O5 PASS, candidate rejected, P0 unchanged) is reported in `build/prototype-v04/live-demo-20261122/REPORT.md` and is one run. It is not Level A or Level B evidence (`docs/hive-unified-audit.md:58`, reported, not reproduced here).
- **Evidence refs are required** for every ORIENT/ACT/VERIFY/ACCEPT/REJECT/INCONCLUSIVE step (`ooda.py:48`, `:179-182`).
- **Gap vs. the directive:** the directive asks for "rollback" on a counterexample (`:132`). The code offers `Checkpoints.rollback` (`checkpoint_manager.py:42`), but no driver calls it on an OODA REJECT. OODA REJECT records a verdict only.

## 7. Open items

1. No driver connects OODA, RunStates, DispatchGate and Checkpoints into the directive loop. **PROPOSED:** one driver module, called from the existing `Executor`, with a test per transition.
2. `max_wall_seconds` is not enforced (`ooda.py:136-137` store only; `advance()` `:148-198` reads only `max_steps`). **PROPOSED:** check elapsed wall time in `advance()` and force INCONCLUSIVE with reason `wall`.
3. `Checkpoints.promote` has no production caller (`checkpoint_manager.py:28`). **PROPOSED:** promote only through `record_review` then `promote`, with a test that rejects a checkpoint lacking a PROMOTE verdict.
4. Ledger gap on exception paths after `begin` (`ollama.py:51` vs `:66`). **PROPOSED:** write an estimate row in a `finally` after a successful `begin`.
5. UsageLedger cross-process writes need a file lock (`usage_ledger.py:94` ponytail note; `:95-99`).
6. No automatic REJECT → rollback in the loop (section 6).
7. Run state is not used by the executor (section 3).

## 8. Verification status

- Not run: pytest, any model call, any adapter enablement, any OODA experiment, any promotion.
- Static only: `tests/test_ooda.py`, `tests/test_run_state.py`, `tests/test_dispatch_gate.py`, `tests/test_roles.py`, `tests/test_decision_gateway.py`, `tests/test_usage_ledger.py`, `tests/test_optional_adapters.py` exist and their names were read. Their pass status is not confirmed here.
