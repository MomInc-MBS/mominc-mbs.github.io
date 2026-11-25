---
id: HIVE-CONNECTED-RUNNER-2026-11-25
schema_version: "1.0"
title: "HIVE Connected Goal Runner: goal to plan to discovery to signed admission to reuse, 25 November 2026"
date: 2026-11-25
status: "connected-learning-mechanism-demonstrated; ties a scripted baseline; trusted local scope; not production-approved; not a research acceptance"
project: HIVE
artifact_type: evidence_report
priority: high
---

# Connected Goal Runner: HIVE finds a missing step, gets it checked, admits it and reuses it (25 Nov 2026)

This follows the [Operator Prototype](/hive/notes/OPERATOR/). The Operator Prototype ran two kept workflows when you named the operation. This build lets you type a goal instead. HIVE writes a task contract, plans with the capabilities it already has, and finds the step it is missing. It asks the local model to write that step. An independent evaluator then checks the step on private cases the model never saw. After a signed admission, HIVE reuses the step on new files after a restart, with zero model calls.

**What this is:** one connected run of the learning loop, end to end, through the normal console. **What it is not:** a learning advantage, Level A or Level B, neural weight learning, or a production approval. The model's step ties a simple hand-written script.

## The six gates

| Gate | Result | What was shown |
|---|---|---|
| C1 goal and contract | PASS | Convert and merge goals typed in the console become versioned task contracts and VERIFIED results, with 0 model calls. The old explicit-operation interface still works (8/8). |
| C2 typed planning | PASS | Folders are planned as [snapshot, snapshot, merge] with no hand-written workflow. A revoked capability never executes. Replays are labelled, and a restart keeps provenance. |
| C3 discovery | PASS | A real goal (compare before and after copies of MOM production folders) exposed the gap `canonical_rows x2 -> inventory_diff`. Experiment `d-563f4dc928c28acb7944` got one local gpt-oss-20b call. The candidate passed the independent evaluator 24/24. |
| C4 admission and rollback | PASS (rollback: test fixture) | A signed admission statement admitted the step. After a restart, fresh real inputs were VERIFIED with no regeneration. Tampered, unsigned and revoked admissions were refused (14/14). |
| C5 model dispatch | PASS | In active mode, a request for an unmeasured model was routed to the qualified `openai/gpt-oss-20b` and executed there. With the model unloaded, the request was refused as MODEL_UNAVAILABLE with 0 calls. |
| C6 connected acceptance | PASS | All 13 journey steps passed on a fresh store with fresh real inputs (below). The Operator journeys still pass 9/9. |

## C6 journey (fresh store, fresh real inputs)

1. A goal with discovery allowed produced a contract, the plan [convert, convert] and a reported gap.
2. The discovery experiment reached CANDIDATE_PASSED on the independent evaluator.
3. A signed admission created version 1 of `inventory-diff`.
4. The original goal was VERIFIED via [convert, convert, inventory-diff].
5. After a console restart, a different, unused pair of folders was submitted **without** discovery. It was VERIFIED as `retained_capability_execution`, with 0 model calls, 0 proposal calls and no new experiment.
6. STOP, a kill during a run (INTERRUPTED, then resubmitted), revoke (UNRESOLVED, 0 container runs) and a 0-call budget (BUDGET_EXHAUSTED) all behaved as recorded. A one-version rollback was refused with a clear reason.

## Baselines: read this before the result

On the 24 private cases, unchanged HIVE scores 0/24 because it has no capability for this. A hand-written scripted diff scores 24/24, and the model's candidate also scores 24/24. A matched-budget search over the M2 views cannot express the task, because no existing view produces an inventory diff. **The candidate ties the scripted baseline. This is evidence that the mechanism works, not that learning beats plain code.**

## Launch

From the package root (Windows, Python 3.11+, Docker with the pinned `python:3.11-slim` image; LM Studio with `openai/gpt-oss-20b` only for discovery):

```
scripts\hive-operator.cmd <inputs folder> [port]
```

CLI: `python -m hive --store .hive\operator operator goal "TEXT" SOURCES... --allowed-root R [--deliverable T] [--allow-discovery]`, `operator discover run <exp>`, and `python scripts\hive_admission.py init|admit|revoke|rollback`. The runbook is `docs/OPERATOR_RUNBOOK.md` in the package. For headless checks, add `--no-browser`; the plain launcher opens a browser that holds the session token.

## Limits

- **Trusted local scope only.** Nothing here is production-approved.
- **Admission trust is one Windows user.** The signer public key is committed in `configs/admission_signers`. The private key sits in `%USERPROFILE%\.hive-admission`, outside the repository and store, so anything running as that user can read it. Candidate code (in a container with no network or files) and the store writer cannot mint admissions. A forged or unsigned event fails the whole capability chain closed. Receipts are integrity-hashed, not signed; admission re-runs the evaluator instead of trusting them.
- **Rollback is proven only by a test fixture.** There is one real admitted version, so a live rollback refuses with UNAVAILABLE.
- **One workload, one model.** The step was found once, on one real workload, by one local model.
- **Known gaps:** the wall-time budget is checked before each step, not during one. The planner explores only the first match for single-input capabilities. Snapshot intermediates cannot be downloaded. The capability id `inventory-diff` is hardcoded in admission.
- **Behaviour change:** an unqualified requested model is now refused, even in shadow mode.
- Tested on one Windows 11 host with Docker Desktop and a 16 GB GPU (peak about 15.3 GB with the model loaded).

## Tests

- Full suite on the final code `033089b`: **1114 passed, 3 skipped, 0 failed** (1 h 10 min, Docker up).
- An earlier full run on `965aedd` had 22 failures. 21 came from evaluator folders sharing bare module names, fixed in `033089b` without changing any pinned evaluator file. The 22nd was a ledger-lock timeout that also failed on the old baseline under load, and it passed on the final run.
- Clean launch: the package extracted to a fresh folder imported OK, reported readiness at `033089b`, and contains no keys, private cases or SQLite stores.

## Evidence

[Checkpoint report](/hive/implementation/connected-runner-evidence/BUILD_CHECKPOINT_C.md) · gate summaries [C1+C2](/hive/implementation/connected-runner-evidence/c12-demo-summary.json), [C3](/hive/implementation/connected-runner-evidence/c3-run-summary.json), [C4](/hive/implementation/connected-runner-evidence/c4-run-summary.json), [C5](/hive/implementation/connected-runner-evidence/c5-run-summary.json), [C6](/hive/implementation/connected-runner-evidence/c6-run-summary.json). Receipts are listed as ids and hashes only. C3 candidate `e5765a1c...e88c`, evaluator receipt `92c1bdf8...86d7`, C4 admission statement `5883be35...89e6`, signer `SHA256:Yk7d2kF/AEKCd7Fi+CZJa0XxBOnkOZ10aX8khS9gkVc`.

## Identity

<!-- identity:start -->
- Runtime commit: `033089b5147c02b9256ad25aa61a51f31ed4ca3c` (repository `hive-ai`, local, branch `build/working-prototype`). Gate commits `20ce8f5` C1+C2, `0e2770c` C3, `c371dd5` C4, `7a1a28c` C5, `965aedd` C6; checkpoint `edb2a24`.
- Package: [`HIVE_Connected_Runner_033089b.zip`](/hive/downloads/HIVE_Connected_Runner_033089b.zip), SHA-256 `4dcc31a5fc91706d4e9a4183c6168b0cbca063dfb6e43069204ae0aa5ebd69ee`, 1179 files, `tracked_dirty` false. Publication manifest: [`connected-runner-publication.json`](/hive/implementation/connected-runner-publication.json).
- Model: local `openai/gpt-oss-20b` only (LM Studio, M2-pinned weights, unchanged). Real calls this build: C3 1, C5 2, C6 1; about 1339 tokens in and 350 out per proposal, 10 to 14 s each.
<!-- identity:end -->

## Cost and spending ceiling

Coding agents this build, list price: about $18.5 (conductor about $9.4, Sonnet gate workers about $9.1). The cumulative estimate is about $116.5 of the $120 ceiling; it carries forward earlier estimates and is not a reconciled ledger. Local inference cost $0.

**Owner decision, 25 November 2026: $120 is the spending limit for the rest of the HIVE project, and it will not be raised.** The milestones below are recorded as possible future work. They are not planned or authorised.

## Next (recorded, not authorised)

A second, harder real gap where a scripted baseline is not already perfect, such as fuzzy-match or schema-drift reconciliation, to see whether discovery ever beats the strongest baseline. Then a live two-version rollback, with a v2 admitted from a second experiment.
