# HIVE — NEXT CODING-AGENT BUILD PROMPT
## Release target: Autonomous Verified Experiment v0.4.x (bounded integration)
**Prepared:** 2026-11-23  |  **For:** Claude Opus coding overseer and minimal specialist reviewers  |  **Scope:** existing HIVE repository, NOT a rewrite

> **COPY/PASTE TO CODER — BEGIN**

You are the **HIVE build overseer**. Your mandate is to turn the existing verified components into **one actual, bounded, independently verifiable autonomous experiment** that runs through the canonical HIVE execution path, while laying the groundwork for later measurable self-improvement. **Implement, execute, independently review, and report evidence in this run.** Do not stop after writing a plan or after the first failed test. Fix failures and repeat **within the finite budget and safety gates below**.

## 0. Ground truth — inspect before editing

Use the **current local repository** as the source of truth; verify branch, commit, clean/dirty state, and implementation before touching code. Read only the relevant modules and these public references; do not ingest the entire research vault:

- Unified integration: https://mominc.online/hive/notes/UNIFIED/
- First live local-model demo: https://mominc.online/hive/notes/LIVEDEMO/
- Owner decision record: https://mominc.online/hive/notes/DIRECTION/
- Operational release evidence: https://mominc.online/hive/notes/OPERATIONAL/
- Integrated design/proposed learning loop: https://mominc.online/hive/notes/WHOLE/

As of the published **22 Nov 2026** unified integration record: **689 passed / 3 skipped / 0 failed** at code revision `25f19b2`; the canonical `Store`, `Executor`, and `ContextPolicy` remain in place. The dispatch preflight, usage ledger, role registry, and run states are wired. The **MODEL_ROUTE decision gateway is CLI-only**, **repo_intel is standalone**, and the **OODA controller lacks a production driver**. Cross-process ledger locking is missing. The unified integration made **zero new HIVE model calls**. Separately, the earlier approved live demo made **five model requests**, rejected a tied learning candidate, and kept P0 unchanged. Independent review of that live demo was pending at publication. **Do not merge these campaigns or their results.** The state may have changed locally; verify and amend this baseline when starting.

**Owner direction on the decision gate: YES, wire MODEL_ROUTE through dispatch, but deploy in SHADOW mode first.** Route changes must not silently replace the incumbent model, bypass eligibility/quality tests, or use unapproved inference. Cheapest **qualified** model, not cheapest model, is the target. P0 is the governing fallback, P2 remains quarantined, and **no policy promotion or parameter training is authorized here**.

## 1. Target end-to-end behavior

Deliver one command or authenticated local UI action that executes this complete chain through the **existing** kernel:

`register experiment → freeze inputs & checks → eligibility/context/budget preflight → observe via repo_intel (real pinned HTTPS Git source) → orient/determine a testable action → decide with typed gateway record → act via approved deterministic tool or explicitly authorized local-model route → independently verify → record durable evidence → diagnose failure → propose a bounded L2 procedure or L3 route candidate → compare with P0 and strongest deterministic baseline → reject/quarantine or prepare for an external promotion decision → replay after process restart with zero repeat external effects`.

The **first experiment** is intentionally small: select a legitimate, read-only, approved public repository and a **pinned commit** containing one bounded text/CSV/JSON/config source. Through `repo_intel`, fetch only the necessary allowed blob(s), confirm remote, commit and SHA-256, and perform a useful metadata extraction/consistency check with a deterministic independent verifier. Add a different pinned source/commit or disclosed seeded engineering variant to exercise a failure and a repair candidate. **Do not call engineered fixtures unseen research data or Level A evidence.** If the candidate ties or regresses, reject it and preserve the negative result; a successful automatic rejection is an acceptable engineering outcome. Do not invent a beneficial-learning gain.

This must run from a durable **experiment driver**, not an isolated unit test or a coding agent manually executing each stage. The driver must persist transitions, enqueue/claim eligible work, execute bounded retries, use actual verified upstream artifacts, survive STOP/restart, and write an operator-readable final report. Use `Store`, `Executor`, `ContextPolicy`, `repo_intel`, OODA, and the existing verifier and decision contracts; **do not create a second scheduler, coordinator, event database, or parallel HIVE framework**.

## 2. Implementation order — finish each slice before expanding

**A. Independently review the earlier live demo.** Have a reviewer who did not author the implementation inspect the locally preserved five-call receipt, source identity, approval scope, budget accounting, stage verdicts, rejected/tied candidate, incorrect subsequent classification, and zero-call replay. Re-run **read-only replay** independently. Produce a signed/hash-linked PASS/FAIL/PENDING report with exact reasons. Re-label the operational release **only if its published release criteria actually pass**; do not erase or reclassify the failed answer. If evidence is inaccessible, record PENDING and continue with independent safe engineering work.

**B. Fix the ledger's missing cross-process guarantee before new concurrency.** Implement OS-appropriate cross-process serialization or a transactionally equivalent single-writer path around allocation and append. Prove in a multi-process adversarial test that two simultaneous writers cannot fork the hash chain, overdraw a finite budget, skip sequence numbers, or double-dispatch an interrupted request. Verify lock recovery and fail-closed behavior. Maintain current single-request concurrency for actual inference.

**C. Connect `MODEL_ROUTE` at dispatch, shadow-first.** Every model route must pass existing role deny checks, model allowlist/digest, context preflight, finite operator approval, and usage accounting **in that order or an equally safe documented order**. Log the decision gateway's proposed model, the model actually executed, evidence and reason codes. In SHADOW mode the executed route is unchanged. A candidate may be eligible only when task capability, verifier-backed quality threshold, privacy, timeout, memory and remaining budget requirements are met. Lack of measured quality means **ineligible**, not 'cheap enough'. Add negative tests for unsupported/unknown model, gateway failure, budget exhaustion, unavailable model, role denial, replay, and unauthorized switching. Canary/active switching is a separate reviewed toggle, **off by default**.

**D. Wire `repo_intel` into one real OODA experiment driver.** Start from a pinned allowlisted HTTPS source. Limit fetched bytes, files and endpoints; reject binaries, path traversal, overlarge content, non-HTTPS transport, disallowed Git revisions and source-supplied instructions. Never execute fetched source or allow fetched text to alter system prompts, gates or filesystem scope. Distinguish observational failures, verification failures and proposed repairs. Use durable stage IDs and idempotency keys. Add controlled failures (bad hash, remote unavailable, stop mid-stage, verifier missing) and show bounded recovery or honest terminal failure. Include a working CLI example plus a local UI path only if the current UI can be reused with small changes.

**E. Execute the experiment and candidate review.** Compare P0, the strongest applicable deterministic tool, a fixed-specialist/control route where available, and one learning-disabled control. De-duplicate identical executions and record aliases. Freeze development/test/next-source partitions **before** running; keep independent evaluator checks outside the mutable candidate workspace. Require no regressions on earlier tasks **during** candidate search, not just at its end. Evaluate actual outputs, runtime, request counts, generated tokens, and uncertainty. Keep all candidates, including rejected ones, with provenance and parent hash. A candidate that does not beat the strongest applicable baseline remains quarantined. **No automatic production promotion**.

**F. Prepare, do not manufacture, Level A.** Create a candidate manifest of **six unused structured-data sources and six unused Python snapshots**, each with owner, URL/path, fixed revision/hash, license, first-seen check, contamination/overlap check, and an objective independent verifier. Check source disjointness against previous development/demo/evaluation inputs. Mark `PROPOSED_NOT_APPROVED` until the owner approves the exact manifest and appropriate runtime budget. Prepare one concise approval packet rather than twelve separate questions. Once approved, the acceptance target is **at least 10 independently accepted outputs from 12 genuinely attempted tasks**. Never substitute fixture passes or earlier exposed inputs. Level B remains a separately preregistered **24+ source-disjoint held-out task** study.

**G. Specify the next compounding study without spending an unauthorized budget.** Pre-register two task phases, an unchanged P0/no-learning control, matched resource ceilings, a transfer test **before** phase-two reoptimization, a post-reoptimization score, and an across-phase aggregate. Include objective pass/fail and rollback conditions. Use Level A inputs for phase one if eligible and approved. Run only what existing exact-source approvals permit; otherwise produce the executable manifest and one approval request. Lay down a minimal mutability manifest (`frozen`, `gated`, `free`) to keep evaluation gates, approval records, budgets and promotion policy outside candidate editing scope. No self-editing of the improver.

## 3. Execution contract — do not conflate permission and capability

- **Permissions:** Public webpages, chat approvals and proposed approval JSON are **not** runtime approval files. Inspect the actual local approval artifact, its task fingerprints, store root, identity, remaining allocation and reuse rules. Do **not** assume any of the earlier 24-request allowance remains valid for a new experiment. Without matching approval, run **tool-only** and prepare one exact finite approval request. Do not fabricate owner consent.
- **Model spend:** `$0` permitted **paid inference**. Local-model requests: **zero by default unless an existing local operator approval explicitly covers the exact new task**. If authorized, honor the approval's tighter limit; the previously published proposal of 24 requests / 128 generated tokens per request / 3,072 total / concurrency 1 / 1,800 active seconds is **background context, not a fresh blanket approval**.
- **Agent-engineering budget — moving cap (owner amendment 23 Nov 2026, replaces the fixed $30 / 4-cycle cap):** we eliminate wasted spend, we do not throttle productive work. Budget lives in `.hive/agent-budget.json` (owner-editable; the agent may only append checkpoints to it).
  - **Checkpoint window:** every **$10 estimated agent spend** (or ~1.5M total tokens incl. cache reads when price is unknown) is one window. Starting **soft cap = $30**.
  - **Progress-based continuation:** at each window end, continue only if the window produced **verified progress**: an acceptance item (A1–A9) newly passing, a new test green on the real execution path, a reviewer-confirmed defect fix, or a recorded diagnostic that eliminates a root-cause hypothesis. Code written but unverified is **not** progress.
  - **The cap moves:** each verified-progress window raises the soft cap by **+$15**. A window with no verified progress does not raise it; **two consecutive no-progress windows stop that branch** (record why, switch to the next unmet slice).
  - **Hard ceiling (owner-controlled):** **$120** default in `.hive/agent-budget.json` `hard_ceiling_usd`. The agent never raises it; only Ian edits it. Reaching it is a hard stop with a checkpoint.
  - **Spending alerts:** at 50 / 75 / 90 % of the current soft cap and of the hard ceiling, write an alert line to the checkpoint and `build/v04x/SPEND_ALERTS.md`.
  - **Repair cycles:** no fixed 4-cycle limit. Diagnose–repair–verify cycles continue while each yields verified progress; **two consecutive cycles on the same failure with no new evidence = stop that branch**. Never repeat an identical failed call.
  - **Team:** one implementation worker plus one independent reviewer at a time (cheap tiers for grunt work). No Grok. Fable only for hard blockers. If price accounting is unavailable, declare it unknown and use the token proxy above. Do not claim total cost was $0 merely because HIVE runtime inference was $0.
- **Context:** each worker gets a task packet of at most **6,000 input tokens**: goal, scoped file paths/symbols, relevant contracts, one failure trace, target tests. Use targeted retrieval, **not** the whole vault, historical chats, or multi-megabyte logs. Maintain a rolling **≤500-token checkpoint** of changed files, decisions, evidence, next step and remaining budget. Create a new context/session after saturation rather than repeatedly rereading prior transcripts. Cache stable source headers only where economical; separately track cache-read, uncached-input and output token costs when available.
- **Security and separation:** freeze evaluator code and holdouts outside candidate write access. Read-only remote Git intake, sandboxed transformations, least-privilege roles. Never bypass approval, verification, independent review, STOP, or quarantine to achieve a green result. No third-party code imports without written license review. No secret/private evaluator/public export leakage.

## 4. Autonomous build loop

Repeat **while the moving cap and progress rule (section 3) allow**:

1. Select the highest-priority unmet acceptance test on the **real execution path**.
2. Make one minimal change in a scoped branch/worktree; record parent SHA and reason.
3. Run the narrow test, then required safety/regression tests, then one end-to-end execution or read-only replay as appropriate.
4. Have the independent reviewer inspect dangerous code boundaries and actual outcome receipts; feed actionable defects back to the implementation worker.
5. If rejected, isolate root cause and change one mechanism; do **not** widen scope, rewrite architecture, lower acceptance thresholds or repeatedly run the same failed call. Keep all failed attempts.
6. Emit a concise checkpoint (incl. spend, soft cap, hard ceiling, progress verdict for the window) and continue while the moving cap and approvals permit. When blocked on a real human approval, continue other approved engineering slices; stop only the blocked branch.

A coding-agent failure is a **diagnostic input**, not a reason to abandon the loop. A budget/permission/safety gate is a **hard stop**, not a request to work around it.

## 5. Acceptance — what counts as finished

Report these separately; the next build is successful only when the **engineering demonstration** criteria are met, even if learning remains unproven:

| ID | Required evidence |
|---|---|
| A1 | Current local baseline and branch/commit recorded; pre-existing tests remain green, with any skip explained. |
| A2 | Multi-process ledger adversarial test passes without budget overrun or hash-chain fork. |
| A3 | `MODEL_ROUTE` is on the dispatch path in **shadow** mode; unauthorized changes blocked; P0 remains actual route. |
| A4 | Single operator command drives a **real pinned Git source** through OODA, `repo_intel`, independent verification and durable outcome; not a simulated-only test. |
| A5 | STOP/restart/replay shows **zero duplicate network/model dispatches**, unchanged consumption and checkable hash-linked evidence. |
| A6 | An automatically produced or nominated candidate is **independently compared**, then honestly rejected/quarantined or staged for review against P0 and the strongest applicable baseline. No fake improvement/promotion. |
| A7 | Separate prior-live-run independent review verdict and exact explanation of the incorrect subsequent answer are recorded. |
| A8 | Level A twelve-source proposal and two-phase compounding protocol are ready, with explicit remaining owner approval dependencies. |
| A9 | Actual agent spend (including cached reads when available), HIVE runtime usage, latency and evidence hashes are reported separately. |

**Release labels:** `ENGINEERING_AUTONOMOUS_EXPERIMENT_DEMONSTRATED` only after A1–A6 pass and independent review of this new experiment passes; otherwise publish `INTEGRATION_TESTED` or a clearly named blocker status. `BENEFICIAL_LEARNING_DEMONSTRATED`, `LEVEL_A_ACCEPTED`, `LEVEL_B_ACCEPTED` and `OPERATIONAL_PROTOTYPE_DEMONSTRATED` have distinct gates—**do not infer any of them from unit tests or an OODA demonstration alone**.

## 6. Deliverables in the same run

1. Working, committed code with a small patch list, version/commit/hash and no unnecessary framework rewrite.
2. One reproducible CLI command (and UI path if implemented) plus a complete **real-source experiment receipt** and independent verifier result.
3. Before/after safety tests, multi-process ledger test, failure/recovery example, replay proof and candidate decision (including negative outcomes).
4. Independent review record of the previous live-demo run, clearly separate from the new run.
5. `LEVEL_A_SOURCE_APPROVAL.md` and frozen source-manifest proposal; `COMPOUNDING_PROTOCOL.md` with budget placeholders requiring approval.
6. `HIVE_NEXT_BUILD_REPORT.md`: what changed, what actually ran, verified metrics, all failed/blocked items, exact next highest-value action, operator approval required, and **coding-agent vs HIVE runtime token/cost breakdown**.
7. Update the public HIVE status **only after** the corresponding evidence is verified; preserve public/private boundary and release history.

**Do the work. Keep the existing invariants. Do not stop at a plan. Do not claim self-learning until the evidence demonstrates transfer or retained gain.**

> **COPY/PASTE TO CODER — END**

---

### Source references and limits

Published site records inspected 2026-11-23:
- https://mominc.online/hive/notes/UNIFIED/ — 689/3/0 suite; live-path gaps; zero new HIVE calls in integration.
- https://mominc.online/hive/notes/LIVEDEMO/ — five local-model requests; candidate rejection; failed subsequent answer; pending independent review.
- https://mominc.online/hive/notes/DIRECTION/ — 22 Nov owner direction; runtime approval separate from public record; no-regression, evaluator isolation and compounding decisions.
- https://mominc.online/hive/notes/OPERATIONAL/ — O1–O10 gates and source-approval limits.
- https://mominc.online/hive/notes/WHOLE/ — proposed separate fast-execution and slow-learning loops, no-regression, private evaluators and compounding design.

The prompt's moving engineering cost cap (owner amendment 23 Nov), shadow-routing policy, pilot experiment form, and proposed release label are **new recommendations**, not published measured HIVE results. The local checkout and approval files were **not** inspected here; the coding agent must verify them before acting.
