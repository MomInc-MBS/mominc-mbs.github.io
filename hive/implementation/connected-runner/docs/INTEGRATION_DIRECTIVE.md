# HIVE — One-Shot Framework Integration Directive

**Audience:** Astra (build overseer), Sol (architecture/mathematics), Luna (implementation), Terra (independent verification), Grok and NVIDIA/Nemotron reviewers as available, and local models as test subjects  
**Priority:** P0 — Deliver a running integrated HIVE  
**Mode:** One coordinated integration build, followed by continuous evidence-driven improvement  
**Date:** 2026-11-21  
**Working repository (reported):** `D:\Repos\hive-ai`  
**Evidence hub:** <https://mominc.online/hive/>

> **MASTER DIRECTIVE TO ASTRA**  
> Stop treating the completion of isolated components, passing unit tests, or production of more architecture documents as the primary objective. Assemble the **existing** HIVE components into one executable, end-to-end adaptive framework now. Make reasonable implementation choices independently; use minimal, swappable baseline implementations wherever needed; and demonstrate real task execution, independent verification, feedback-driven change in subsequent behavior, persistence across restart, and safe recovery. Do not restart the project or rewrite working subsystems without a specific demonstrated blocker. Work through failures in a bounded, recorded build–test–diagnose–repair loop. The deliverable is **running software plus reproducible evidence**, not another proposal.

---

## 1. Why this direction is changing

HIVE has accumulated working parts, tests, documentation, and research, but the project has not yet established a **fully integrated, independently accepted, adaptive prototype**.

The last available handoff reported for **v0.3.0.dev2**:

- **235 passing tests**, **0 failures**, **2 Windows symlink skips**, and **3 CLI journeys**.
- Existing orchestration, verification, policy, event, checkpoint, and budget components.
- A limited real video alpha: structural checks of caption normalization and source-backed clip proposals; **not** editorially accepted.
- No accepted Level A working prototype, no verified Level B adaptive gain, and no production adaptive policy promotion.

These figures are **historical reported evidence, not a claim about today's checkout**. Astra must verify the current commit and actual test results at startup.

**Diagnosis:** Work has been optimized for proving fragments and expanding specifications rather than integrating the whole system into a functioning adaptive loop. Correct that delivery priority immediately.

## 2. Non-negotiable goal

Deliver one HIVE executable that can:

1. Receive a real, permitted task through a single entry point.
2. Classify the task and determine which routes are **eligible** under permissions, cost, model availability, and required verification.
3. Select and invoke a software tool, local specialist model, or an explicitly approved combination.
4. Save actual outputs and a structured evidence trail.
5. Independently verify objective outcomes; flag subjective judgments for human/editorial review instead of calling them verified.
6. Convert verified feedback into a **candidate** change to routing, strategy, skill selection, or another controllable policy parameter.
7. Compare candidate versus unchanged incumbent on a separate test; reject harmful changes.
8. Apply an approved improvement to a subsequent task, then show the **actual different choice or behavior** and its outcome.
9. Persist policy, memory, events, and checkpoints through a fresh-process restart; support safe rollback.
10. Continue to the next safe queued engineering task after a failed attempt, without silently evading safety stops or authorizations.

**Do not require:** optimal formulas, a large model, changes to neural weights, a complete knowledge graph, 50 tools, or broad scientific superiority before this loop runs.

## 3. The required end-to-end framework

```text
                         ┌─────────────────────┐
                         │ TASK / SENSORY INPUT│
                         └─────────┬───────────┘
                                   ▼
                         ┌─────────────────────┐
                         │ GOVERNING CONTROLLER│
                         │ goal, permissions,   │
                         │ budget, eligibility, │
                         │ task decomposition,  │
                         │ route selection      │
                         └─────────┬───────────┘
                                   ▼
               ┌───────────────────┼───────────────────┐
               ▼                   ▼                   ▼
       ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
       │ LOCAL MODELS │    │ SOFTWARE &   │    │ MEMORY /     │
       │ / SPECIALISTS│    │ DETERMINISTIC│    │ SKILLS       │
       │              │    │ TOOLS        │    │              │
       └────────┬─────┘    └──────┬───────┘    └──────┬───────┘
                └─────────────────┼───────────────────┘
                                  ▼
                         ┌─────────────────────┐
                         │ ARTIFACT + EVENTS   │
                         │ immutable receipts  │
                         └─────────┬───────────┘
                                   ▼
                         ┌─────────────────────┐
                         │ INDEPENDENT VERIFIER│
                         │ tests / assertions  │
                         │ + human review gate │
                         └─────────┬───────────┘
                                   ▼
                         ┌─────────────────────┐
                         │ ADAPTIVE CONTROLLER │
                         │ compare, propose,   │
                         │ test, accept/reject, │
                         │ persist, rollback   │
                         └─────────┬───────────┘
                                   │
                    verified feedback into NEXT run
                                   └───────────────► GOVERNING CONTROLLER
```

All named boxes must **exist as code paths**, not only diagrams. Reuse existing implementation contracts when available. New pieces may begin with minimal reliable algorithms; boundaries must be stable and replaceable.

## 4. One-shot integration procedure

### Phase 0 — Inspect reality (short, bounded, no architectural detour)

Astra:

- Check the actual repository, branch, commit, local model/tool availability, configuration, tests, and existing entry points. Read `AGENTS.md` and project instructions.
- Map each box above to its existing implementation/module. Label it `WORKING`, `PARTIAL`, or `MISSING`, citing paths and runnable commands.
- Select one **single entry point** for the complete task-to-learning workflow. Prefer extending the current CLI/controller rather than introducing a competing runtime.
- Identify the smallest **blocking gaps** only. Assign implementation ownership immediately.
- Record the source SHA, baseline results, config/model identities, available budget/approval scope, and verified constraints in `docs/CURRENT_STATE.md`.

**Time-box this audit to the minimum needed to begin coding.** Unknowns become explicit testable assumptions or tracked blockers, not a request for more broad research.

### Phase 1 — Wire the whole vertical slice in one coordinated build

Build or reuse the following interfaces as one connected execution path:

| Subsystem | Minimum viable behavior |
|---|---|
| Task intake | Versioned task contract, task ID, inputs, desired artifact, acceptance rule, permissions |
| Governor | Hard eligibility checks; versioned baseline route scoring; no prohibited execution |
| Registry / adapters | At least one deterministic tool route and one available, pinned local-model route |
| Executor | Runs selected route in scoped context with finite limits and explicit outputs |
| Evidence store | Records source, input/output hashes, selected route, model/tool identity, results, cost, attempts |
| Verifier | Runs independent objective checks and preserves failure evidence |
| Feedback | Converts valid verdict into structured, attributable feedback |
| Adaptation | Proposes a policy change; compares to incumbent; only promotes with gate approval |
| Persistence | Reloadable policy state, event ledger, checkpoints, rollback |
| Operator surface | `run`, `status`, `inspect`, `stop`, `resume`, `rollback` (use current names where available) |

**Integration rule:** Do not declare a component finished until it is exercised by the shared end-to-end flow. Stubs are acceptable only when explicitly labeled, observable, safe, and replaced before the required acceptance gate.

### Phase 2 — Run two genuine demonstration missions

**Mission A: Deterministic/tool-supported task**  
Choose a permitted task with objective correctness (for example: calculate/transform structured data, or use isolated repository tests). HIVE must consider appropriate routes, select one, execute it, and pass an independent check. This establishes an objective baseline; deterministic tools must not be disadvantaged just to make learning look successful.

**Mission B: Local-specialist task**  
Use a *real* local model with exact identity/digest and a task requiring its participation (for example: bounded extraction or classification against independently checked labels). Show actual calls, outputs, artifacts, and verifier outcomes. Do not fabricate availability or claim a model ran when a stub ran. If no model is available, declare the dependency and complete other approved engineering work.

Both missions must run through the **same governor, executor, event store, verifier, and policy interface**. Avoid separate demo-only pipelines.

### Phase 3 — Demonstrate genuine adaptive behavior

1. Run a baseline task with **policy version P0**; record routing and outcome.
2. Generate a candidate **P1** from verified feedback (for example: different route preference for a well-defined task context).
3. Compare P1 with P0 on separate development tasks under the **same** permissions and resource accounting. Include the strongest simple baseline and an explicit **learning-disabled** control.
4. Reject P1 if it fails hard constraints, has no supported benefit, or loses on a mandatory guardrail. **Do not force promotion.**
5. If P1 passes the predeclared gate, authorize its promotion. Run a genuinely subsequent task and demonstrate changed behavior and its measured outcome.
6. Terminate the process, reload from persistent state, and show the same approved policy is active. Restore P0 and demonstrate that rollback works.

If the candidate loses, that is a **valid experimental result**. The integrated framework still exists; queue a changed hypothesis rather than blocking all progress.

**Important distinction:** A changed route is evidence of adaptation; a demonstrated gain over held-out, appropriately selected baselines is evidence of *useful learning*. Do not conflate either with neural-weight training or general intelligence.

### Phase 4 — Harden and then broaden

Only after the vertical slice executes successfully:

- Test STOP/resume, crash during write, stale checkpoints, duplicated events, partial failure, exhausted budgets, and corrupted policy candidates.
- Add real task families one by one through the **same interfaces**: isolated code/test, video-production, and subsequently live-interaction or game tasks where feasible and authorized.
- Compare alternative routing/learning formulas in controlled, versioned experiments instead of continuously revising the architecture.
- Establish a fresh, non-leaked, independently reviewed acceptance set before making broad adaptive-performance claims. Retain the existing Level A / Level B gates; do not silently weaken them.

## 5. Initial governing mathematics — good enough to run

Implement **simple versioned baselines**, then let experiments evaluate variants. Do not postpone framework integration until optimal mathematics is discovered.

### F0 — Eligibility before ranking

```text
eligible_routes = routes satisfying:
  permission_ok AND resource_budget_ok AND identity_known
  AND required_verifier_available AND execution_scope_valid
```

No utility score can override a hard eligibility failure.

### F1 — Baseline route decision

For eligible route `a` and task context `x`:

```text
score(a, x) = estimated_verified_success(a, x) * task_value(x)
              - lambda_cost * estimated_cost(a, x)
              - lambda_time * estimated_latency(a, x)
              - lambda_risk * estimated_failure_risk(a, x)

selected_route = argmax(score(a, x)) among eligible routes
```

Use honest initial priors, deterministic fallbacks, and transparent logs. Track confidence and abstain/escalate when required; do not represent unmeasured estimates as facts.

### F2 — Feedback and candidate acceptance

```text
candidate_delta = measured_utility(candidate, fresh_dev_tasks)
                  - measured_utility(incumbent, same_fresh_dev_tasks)

promote ONLY IF:
  all_hard_gates_pass
  AND no_critical_regressions
  AND predeclared_quality_cost_criteria_pass
  AND independent_review_and_required_approval_pass
```

Avoid one universal formula for all domains: task families may use separate versioned policies and verifiers. Distinguish research proposals from production policies.

### F3 — Learning behavior

Start with an interpretable context-conditioned choice rule (for example: grouped empirical success rates with conservative updates, or a small contextual bandit where suitable). Require explicit evidence for an update. Keep route selection, skill-memory changes, and neural-weight training as **different adaptation types** with different approvals and tests.

## 6. Agent responsibilities

| Agent | Required contribution | Proof |
|---|---|---|
| **Astra — integration owner** | Maintain single integrated branch, dependency graph, work queue, approvals, resource limits; assemble and run end-to-end flow | Executable demonstration, evidence bundle, next work item |
| **Sol — architecture/math** | Define interface contracts, baseline formulas, alternative hypotheses, and measurable gates | Minimal contracts, scoring implementation tests, experiment spec |
| **Luna — primary implementer** | Wire reused modules, adapters, CLI, policy updates, event/persistence integration | Working source changes and integration test |
| **Terra — independent verifier** | Create adversarial/fault tests before acceptance; independently reproduce results | Test receipts, failing counterexamples, acceptance decision |
| **Grok — adversarial reviewer (if available)** | Inspect permissions, injection, race conditions, leakage, accounting | Dated findings with reproducible cases |
| **NVIDIA/Nemotron — statistical reviewer (if available)** | Critique claims, baselines, comparisons, evaluator independence | Dated review and dispositions |
| **Local models — subjects** | Perform bounded specialist work under controlled identities and limits | Real call logs, model digest, output hash |

Do not mark unavailable external reviewers or models as completed. Astra can substitute an independently scoped reviewer where appropriate, but must record that substitution. The producer of a candidate cannot be its sole evaluator and promotion authority.

## 7. Agentic build–test–repair loop (without stalling)

```python
while approved_work_remains():
    item = select_highest_priority_unblocked_integration_item()
    baseline = record_code_config_policy_model_and_budget_identity()
    result = make_smallest_integrating_change_and_run_tests(item)
    save_immutable_artifacts_and_receipts(result, baseline)

    if result.critical_safety_or_integrity_failure:
        stop_affected_execution()
        quarantine_and_record(result)
        enqueue_safe_repair_for_review()
    elif result.failed:
        classify_root_cause(result)
        minimize_reproducer(result)
        enqueue_changed_testable_hypothesis(result)
    else:
        independently_verify(result)
        advance_only_the_gate_actually_met()

    persist_queue_checkpoint_and_next_action()
```

**Anti-minutiae rule:** Prioritize blockers preventing the integrated flow over peripheral optimization, naming, documentation polish, new frameworks, or optional features. Limit two attempts at substantially the same failed fix; then change the approach or request independent diagnosis. Continue other approved tasks while a dependency is blocked.

**Safety and accountability:** No unbounded self-modification, hidden resource consumption, silent budget reset, unrestricted shell execution, or automatic promotion to production. Local iteration can be autonomous **inside preapproved scope**; exceeding that scope requires explicit authorization. On a genuine safety stop, stop the affected execution—not the entire engineering queue.

## 8. Definition of done: first integrated HIVE

Mark **`INTEGRATED_PROTOTYPE_DEMONSTRATED`** only when all of the following have runnable evidence:

- [ ] A single command/API starts a real task and runs through the existing HIVE controller.
- [ ] One verified deterministic/software task completes and produces an artifact.
- [ ] One real local-model specialist task completes with model identity and trace.
- [ ] Both use the same routing, execution, evidence, and verifier flow.
- [ ] At least one objective correctness check comes from an independent verifier.
- [ ] Every decision and failure has versioned, inspectable receipts.
- [ ] Verified feedback produces an explicit candidate policy or strategy update.
- [ ] A later actual task demonstrates a selected and approved behavior change, **or** records a valid rejected candidate without falsely claiming successful adaptation.
- [ ] Fresh-process reload restores the correct state; rollback restores a prior policy.
- [ ] STOP/resume and one injected failure do not duplicate unauthorized side effects.
- [ ] Current tests run with recorded result, source SHA, configuration, and known skips.
- [ ] An operator can reproduce the demonstration from documented commands.

**Separate status labels (do not blur):**

- `FRAMEWORK_WIRED`: all required paths exist; some may be unverified.
- `INTEGRATED_PROTOTYPE_DEMONSTRATED`: functional end-to-end evidence passes the above gate; if no beneficial candidate passed, mark adaptation as **not yet validated**.
- `LEVEL_A_ACCEPTED`: existing independent functional acceptance gates passed on appropriate new tasks.
- `LEVEL_B_ACCEPTED`: independent, pre-registered evidence demonstrates useful adaptive gain relative to strong controls and with no unacceptable regressions.

Never announce Level A or B solely on the basis of the first integrated demonstration.

## 9. Required output from Astra

Commit implementation changes and produce:

```text
docs/CURRENT_STATE.md
  Verified current commit, components reused, missing paths, runtime setup,
  approved scope, budgets, and actual test baseline.

docs/INTEGRATION_MAP.md
  Existing modules -> unified flow, interfaces, and any temporary stubs.

docs/HIVE_RUNBOOK.md
  Exact commands to install/check, run both missions, inspect evidence,
  test an update, restart, stop, resume, and roll back.

experiments/results/integration-smoke/
  Input/output artifacts, identities, hashes, independent verdicts, logs.

experiments/results/adaptation-demo/
  P0/P1 versions, comparison tasks, feedback, actual future-run decisions,
  promotion or rejection rationale, restart/rollback proof.

docs/NEXT_WORK_ITEM.md
  The next highest-impact integration or learning gap with a falsifiable test.
```

Use the repository's established conventions if these paths differ. Preserve historical experiment artifacts; don't overwrite them with new runs.

### Startup instructions

1. Open `D:\Repos\hive-ai` and review `AGENTS.md`, current CLI `--help`, current commit, test suite, and any existing prototype demo/runbook.
2. Verify the published `v0.3.0.dev2` baseline against the **actual** working tree; preserve differences as evidence.
3. Identify and implement the shortest missing path connecting task intake → governor → worker/tool → independent verifier → persisted feedback → changed next policy choice.
4. Run both missions and the adaptation/restart/rollback demo, recording actual results.
5. Report **working / failing / blocked**, each with an exact command, receipt, and next engineering action. Continue within the approved work scope until the integrated demonstration gate is met or a genuine external dependency blocks it.

**Do not respond with another build plan as the final deliverable. Build the framework and return the runnable source, commands, and proof.**

---

## 10. Existing evidence / starting references

- [HIVE project evidence hub](https://mominc.online/hive/)
- [Published implementation status](https://mominc.online/hive/notes/STATUS/)
- [Latest published video alpha](https://mominc.online/hive/notes/WORKING/)
- [v0.3.0.dev2 release manifest](https://mominc.online/hive/implementation/working-prototype-dev2-publication.json)
- [Existing prototype acceptance criteria](https://mominc.online/hive/implementation/working-prototype-dev2/docs/PROTOTYPE_ACCEPTANCE.md)
- [Existing next work item](https://mominc.online/hive/implementation/working-prototype-dev2/docs/NEXT_WORK_ITEM.md)

*References identify the previously reported public release. The local repository and its actual tested commit are authoritative for implementation.*
