# Compounding study protocol (pre-registration) — PROPOSED, UNEXECUTED

Status: pre-registered 2026-11-23 before any exposure. Nothing here authorizes spend, inference or promotion. Every `<PLACEHOLDER>` must be filled by the owner and hashed into the study freeze **before** the first task runs; no value may be changed afterwards. This is not Level B (`LEVEL_B_LEARNING_STUDY.md`), which stays a separate 24+ task study.

## Question
Does learning during phase one make the system better on **new, source-disjoint** tasks (transfer), and does re-optimizing on phase-two development data improve it further without hurting phase one (retention)?

## Arms (identical tasks, ceilings and verifiers)
- **C0** — unchanged P0, learning disabled, frozen at the study-freeze hash. Never updated, never sees any feedback.
- **L** — the learning candidate. Starts byte-identical to C0; may only change files marked `free` below.
- (Optional, if applicable) strongest deterministic tool and fixed specialist, as in Level B; charged the same way.

**Matched ceilings** (per task and per phase, same for every arm): model requests `<N_REQ>`, generated tokens/request `<N_TOK>`, total tokens `<N_TOTAL>`, wall seconds `<N_WALL>`, attempts 3, concurrency 1, paid inference $0. Retries, verifier work and failed attempts are charged to the arm that incurred them. Default is tool-only (0 model calls) unless the owner approves a finite cap `<OWNER_APPROVED_MODEL_CAP>`; agent-engineering spend stays under `.hive/agent-budget.json` and is not part of arm budgets.

## Phases and order (fixed)
1. **Phase 1 (P1)** — the 12 Level A tasks, if and only if the owner signs `LEVEL_A_SOURCE_APPROVAL.md`. C0 and L both attempt all 12. L may learn from P1 feedback within its ceiling.
2. **Freeze L1** — hash L's state at end of P1 (parent hash recorded).
3. **Transfer test (T)** — `<N_T>` (>=12) previously unused tasks from sources disjoint from P1 and from S/R. Run **C0 and L1 now, before any phase-two reoptimization**, no learning during T. This is the primary transfer measure.
4. **Phase-two reoptimization** — L1 may adapt using only the phase-two development split R (`<N_R>` tasks, disjoint from P1, T and S). Result is L2, parent hash L1. C0 gets the same R access but no learning.
5. **Post-reoptimization score (S)** — `<N_S>` (>=12) fresh held-out tasks, disjoint from P1, T, R. Run C0 and L2.
6. **Retention** — re-run the P1 tasks with L2 (no learning); compare with L1's P1 result.
Phase-two sources (T, R, S) are **not yet selected**; they need a second manifest and approval. This study cannot start on Level A alone.

## Frozen before exposure
Task contracts, source/exposure ledger, evaluator and holdout identities (kept outside any candidate-writable path), model/runtime/policy hashes, ceilings, `<DELTA>` (smallest practically meaningful acceptance-rate gain), seeds, analysis script hash.

## Objective outcomes
Per-task accept/reject by the pre-existing independent verifier only (no judge model, no visual review). Report accepted count, runtime, requests, tokens, abstentions and blocked tasks; denominators keep every scheduled task.

**PASS (all required):**
1. Transfer: L1 acceptance on T minus C0 on T >= `<DELTA>`, and the source-group paired-bootstrap 95% lower bound > 0 (`<N_BOOT>` resamples, seed frozen).
2. Post-reopt: L2 on S beats C0 on S by the same rule, and L2's S rate >= L1's T rate minus `<DELTA_NONDEG>`.
3. Across-phase aggregate: pooled accepted/attempted over P1+T+S, L vs C0, paired by task with per-phase breakdown shown; L must lead and the lower bound > 0. No phase may be dropped.
4. Retention: L2 accepts at least `<RETAIN_MIN>` of the tasks L1 accepted in P1; zero critical regressions.
5. Zero critical failures (gate tamper, budget overrun, unapproved model/route, leaked holdout, unverifiable receipt); every receipt replayable; resource use within ceilings.

**Otherwise:** `REJECT` (L <= C0 on T or S), `QUARANTINE` (any gate/provenance question), `INCONCLUSIVE` (interval spans zero or N below the preregistered size). Sample size is `<N_T>`,`<N_S>`; if a power analysis shows them too small, say INCONCLUSIVE rather than lower the bar. Cost savings or synthetic passes never count as learning.

## Rollback (automatic, to the last frozen parent hash)
Any one triggers: critical failure; frozen/gated file hash mismatch; budget or ceiling exceeded; L worse than C0 on T by more than the bootstrap interval; retention below `<RETAIN_MIN>`; evaluator or approval record unreadable; STOP flag. Candidate state is kept, quarantined with provenance and parent hash; C0 remains the default. **No automatic promotion**: promotion needs an independent reviewer plus explicit human approval.

## Mutability manifest (minimal)
| Class | Paths | Rule |
|---|---|---|
| **frozen** | `src/hive/experiment_verify.py`, `src/hive/structured_verifier.py`, `src/hive/code_verifier.py`, `src/hive/context_policy.py`, `configs/agent_context_policy.yaml`, `configs/experiment_sources.allowlist.json`, `configs/roles.yaml`, `experiments/private/**` (evaluators, oracles, holdouts), approval records, `.hive/agent-budget.json`, promotion policy, this protocol and the mutability manifest, the improver/learning code itself | No candidate or learner write access. Changed only by the owner outside a run; any diff aborts the run. |
| **gated** | routing/model allowlist and digests, per-task ceilings, source manifests | Edit needs independent reviewer sign-off, owner approval, a new freeze hash and a regression re-run on all earlier tasks. |
| **free** | `experiments/candidates/**` (to be created): candidate memory entries, prompts/skills, route weights | Learner may edit inside matched ceilings; every version kept with parent hash. |

The improver does not edit itself: its code, scoring and gates are `frozen`. Enforcement is by hash check at each phase boundary and filesystem scope, not by instruction.
