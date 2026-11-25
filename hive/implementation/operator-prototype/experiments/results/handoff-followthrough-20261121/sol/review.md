# Sol control-policy review

Decision: request one bounded, opt-in policy revision; retain P0/P1 and frozen P2 v3. This is a development/mechanical finding, with no useful-learning or acceptance claim.

Verified checkout: `D:/Repos/hive-ai`, branch `build/working-prototype`, HEAD `a1b8fb6ee9a856be90bf0573f5af208438395c2a`. Runtime identity is recorded by `policy-probe-results.json`. Reviewed AGENTS.md, README.md, docs/brief.md, docs/P2_EXACT_TOOL.md, docs/NEXT_WORK_ITEM.md, the attached dev4 handoff and the named source files. The current six-data/six-Python objective campaign is authoritative; historical video acceptance requirements do not replace it.

## Discriminating counterexample

`Executor._decision` (orchestrator.py:215) on a valid synthetic development math task, P2 v3, with a permitted pinned test adapter:

| Condition | Actual selection |
| --- | --- |
| Exact tool available | tool |
| Tool excluded by task permissions, local_direct allowed | local_direct |
| multiply tool grant absent, local_direct allowed | local_direct |
| Tool grant absent and local_direct explicitly requested | local_direct |
| Independent verifier raises during availability canary | abstain |
| Model budget exhausted, tool available | tool |
| Model budget exhausted and tool grant absent | abstain |
| Legacy v1/v2 with missing tool grant | local_direct |
| Model-required classification | local_direct |

These are actual Executor/governor decisions; no output execution or inference was performed. Every budget is unchanged before/after. All ten cases are recorded in `policy-probe-results.json`; `probe_policy.py` reproduces them with fixture-only identity. No private evaluator inputs, labels or memories were inspected.

Cause: governor.py:105-137 filters route permissions/scope/budget checks, then selects among remaining routes. learning_policy.py:38 prefers tool only if tool is still present; otherwise ordinary UCB selects an unobserved model route. That route's prior has zero observations, so model identity availability is being used without verified task-route capability evidence. `tests/unit/test_p2_exact_tool.py:40` explicitly preserves v3 fallback even when a per-tool reason says independent verifier unavailable. The real caller's global canary already prevents fallback when the shared verifier is missing; this unit test does not establish a live missing-shared-verifier bypass.

The counterexample is a gap against the proposed new fail-closed hypothesis, not a demonstrated incorrect accepted model output. The independent post-execution verifier remains active and may reject a wrong answer. No false-positive acceptance is claimed.

## Minimum repair for Luna

1. Add a distinct opt-in policy snapshot version, proposed v4. Keep v1/v2/v3 selection and old receipts unchanged.
2. Before numeric scoring in `governor.decide`, make model routes ineligible for v4 exact categories. Existing categories are sufficient for this bounded revision; do not add code_mission/video_clips or classification. With current interfaces there is no independently verified fallback authorization, so exact tasks require eligible tool or abstention. The rejection applies to explicit local requests and retry synthesis too; record a concrete policy reason. An explicit route preference does not override the safety contract.
3. Carry v4 through the existing source-context, canary, policy attribution, VERIFYING event and replay checks. Relevant hard-coded v3 locations: governor.py:143,155-156; orchestrator.py:221,370,508-511. Preserve exact version equality between event, decision and replay rather than changing checks to accept any arbitrary future integer. Do not alter historical artifacts.
4. Keep nonexact classification local eligibility, pinned identity, permission gates, STOP and all budgets unchanged. Retry calls already re-enter `_decision` at orchestrator.py:444-447, so a governor guard should cover them without a parallel retry framework.
5. Add deterministic negatives for missing grant/permission, injected tool-unavailable reason, missing verifier, explicit exact-model request, retry-to-local, and no eligible routes. Add positive classification/tool cases and frozen v1/v2/v3 compatibility. Assert no execute call, no reservations, versioned receipt integrity, and fresh-process replay for v4.

Comparison caution: pressure.py:308 installs the supplied policy on every arm. Running explicit fixed-specialist/team controls under v4 would appropriately block their exact-model requests. Preserve unchanged control policies; do not weaken v4 to accommodate the controls. A deterministic decision comparison is engineering evidence and can be the current bounded comparison; it is not a new learning study.

## Workstream C requirement inventory

| Requirement | Existing implementation and concrete gap |
| --- | --- |
| Typed TaskContract | Partial: dictionary schema in verifier.py:51 and governor.py:35; permissions, evaluator, task category, split and success criteria interfaces exist. No typed TaskContract combining outcome, label/source sensitivity, deadline and per-task budgets. New code is needed for that complete interface, but not for the scoped v4 route fix. Reuse mission/config contracts rather than duplicating stores. |
| Eligibility before scores | Present: governor.py:105-137, orchestrator.py:148-237 cover permission/scope, model digest, STOP and budgets; v3 verifier canary exists. Missing exact-route fail-closed substitution rule is the current actionable defect. Model discovery proves identity availability, not independently measured category capability. |
| Evidence-producing PolicyDecision | Partial: hashed dictionary receipt includes versions, alternatives/reasons, selection, priors, reserved token cost and task/source/config hashes. v3 source context and fresh-process replay exist. No typed PolicyDecision, explicit confidence-provenance field or full estimated aggregate cost; unseen priors are honestly marked unmeasured. Extend existing receipt only as separately scoped needs arise. |
| Independently verified feedback | Present bounded mechanics: orchestrator.py:374-414 validates verifier verdicts, records result/cost/source-bearing artifact, updates development feedback atomically once; wrong outputs cannot increment successes. failure_triage.py supplies taxonomy. Declared source group is provenance, not attested source independence. No model-confidence-to-positive-memory path found. |
| Bounded updates/checkpoints/replay/rollback | Present: learning_policy.py:59, candidate_generator.py:3, checkpoint_manager.py and adaptive.py; unapproved checkpoints cannot restore/promote. Preserve identities. Generic Executor's candidate state can default to v1 separately from governing policy, so a new v4 experiment must explicitly initialize both candidate and governing state, as paired-development dispatch already does. |
| Partitions and specialist skill records | Partial: category/route buckets, development-only observation, holdout report sealing and model-environment invalidation exist (orchestrator.py:400-414; learning_policy.py:59-68). No source/sensitivity/specialist permission partition or route-specific skill artifact exists. This genuinely needs a separate scoped design/implementation before cross-specialist persistent memory claims. Current prototype does not contain independent specialist memory processes to migrate. |
| Same-input controls/ablations/full costs | Partial: lab.py:45-84 has frozen fixed/adaptive/learning-off/team replay and charges model+tool team; pressure.py:20,239-363 has five-arm task/source pairing, reservations, costs and arbitration. Do not rebuild it. Full independently manipulated memory-on/off and verifier-on/off study interfaces are absent; fixture proxies and omitted verifier/controller overhead cannot be treated as scientific efficacy proof. Verifier-off may be a negative control but must never be accepted as verified success. |

## Verification and disposition

Narrow baseline regression command: `python -m pytest -q -p no:cacheprovider --basetemp experiments/results/handoff-followthrough-20261121/sol/pytest-temp tests/unit/test_p2_exact_tool.py tests/unit/test_learning.py tests/integration/test_p2_replay.py::test_unavailable_verifier_blocks_before_dispatch_or_reservation tests/integration/test_governed_run.py --junitxml experiments/results/handoff-followthrough-20261121/sol/narrow-regression.xml`.

Result: **20 passed in 8.05 seconds**. Ten additional deterministic decision probes reproduced the counterexample. Zero HIVE model calls, zero task dispatches in the probe, no budget/STOP modifications outside new synthetic review stores, no runtime/test/doc edits, no commits or publication. Existing evidence preserved. The passing legacy tests establish present behavior, including its fallback; they do not satisfy the proposed v4 abstention requirement.

Disposition: QUARANTINE current candidate; implement/review v4 only. Retain unchanged incumbent and all historical P2 receipts. The missing typed contracts and specialist memory partitions require the bounded integration below to close Workstream C; they are not claims of completed work. Source authorization and fresh real inference are not supplied by this review.

## Concrete typed-contract and feedback integration plan

This is minimum proposed new code, derived from existing task/config/Store interfaces. It creates no new service or authorization mechanism. Apply only to v4; do not reinterpret v1-v3 receipts or policy counts.

Use frozen dataclasses (stdlib only), with a JSON serializer, for these two records:

```text
TaskContractV1
  schema_version: 1
  task_id, task_hash: str
  outcome: str                     # success_criteria or evaluator-defined description; never expected labels
  family: str                      # existing task.category
  tags: tuple[str, ...]             # existing declared tags, or (category,)
  split: Literal[development, validation, holdout]
  actions: tuple[str, ...]          # existing tool grants; no inferred host/shell actions
  permitted_routes: tuple[str, ...] # normalized existing task_routes result
  permission_hash: str              # normalized routes/tools/scopes
  source_group: str                 # declared group; if absent task-id-scoped development provenance
  source_attribution: str           # declared / task_scoped; never an independence attestation
  source_sensitivity: str           # existing declaration if supported, else development_unclassified
  label_sensitivity: str            # sealed for validation/holdout; development_only otherwise
  verifier_id: str                  # existing task.evaluator
  verifier_hashes: dict[str, str]   # existing p2_source_context hash map
  exact_tool_required: bool         # v4 exact category set; not arbitrary model output
  execution_timeout_s: float        # min(config timeout, existing per-task mission timeout)
  declared_deadline_utc: str | None # absent remains None; never invent an approved deadline
  budget_limits: dict[str, int|float] # existing immutable mission limits and any already validated stricter task caps

OutcomeFeedbackV1
  schema_version: 1
  task_contract_hash, job_id, evidence_ref, decision_ref: str
  partition_key: str
  source_group, route, permission_hash, verifier_id: str
  model_identity: dict | None
  valid, passed: bool               # independently verified; no confidence substitution
  quality: Literal[0, 1]
  failure_category: str | None      # existing failure taxonomy
  charged_cost: dict               # reserved/actual tokens, requests, cycles, elapsed time from existing evidence
  split: str
  feedback_eligible: bool           # development AND valid AND learn_feedback
```

1. Derive `TaskContractV1` in the v4 path before ranking. Validate types and reuse `validate_task`, `task_routes`, `route_scope_reason`, `p2_source_context` and immutable config. A declared source group remains a declaration. Unsupported sensitivity/deadline declarations must be rejected or explicitly unsupported rather than silently claiming enforcement. Existing timeouts/budgets remain the executable gates; store remaining resource snapshot separately in PolicyDecision, so mutable remaining balances do not rewrite contract identity. Do not copy task.expected into this contract or a public decision.
2. Embed the serialized contract and its hash in the v4 decision receipt. Replay re-derives its static fields from saved task/config and verifies hash/identity. Introduce `PolicyDecisionV1` as a typed wrapper over existing alternatives/selection/route_source/source-context fields, with `confidence_provenance` equal to verified partition statistics or `unmeasured`; no new numeric confidence is needed. Abstention records exact rejected reasons. Add existing selected identity and reserved cost instead of fabricating latency estimates.
3. Write the typed feedback record beside the existing immutable execution bundle and `feedback:<job>` marker inside the same transaction at orchestrator.py:400-417. The marker should bind the immutable feedback reference, which binds evidence/verdict/source/route/cost. Existing positive-memory control remains: quality 1 requires independently verified passed=True; verified wrong answers add only zero quality, invalid verdicts never train. No extra verifier invocation is needed.
4. Use a stable partition hash over `(split, source_group, route, permission_hash, verifier_id+hashes, model digest or deterministic tool identity, specialist_id if explicitly configured)`. Derive specialist identity from selected model identity when no separate specialist exists. Do not infer specialists from prose or import private memories. Put partitioned observations under Store keys `feedback_partition:v1:<hash>` or a v4-only nested `partition_counts`; reuse `Policy.observe` on the selected partition, retaining its category/route shape inside that partition. Keep historical `counts` untouched for v1-v3. Freeze/replay/checkpoint the v4 partition state together with its contract schema version.
5. v4 reads only explicitly compatible partitions: same split=development, permission fingerprint, verifier identity and specialist/model identity. The smallest safe default is exact source-group matching; cross-source aggregation needs a separately declared compatible training-scope identifier, not silent pooling. This conservative default proves isolation but cannot be called transfer learning. Validation/holdout records stay evaluator-only, do not create policy buckets and do not populate public feedback artifacts. Existing sealed-report behavior remains.
6. Add a small route-skill record as a view of a partition: `(partition_key, category, route, verified n/successes/utility, supporting feedback_refs, permission_hash, model/tool identity)`. This meets route-specific provenance without generated skill text, a memory service or execution authority. Selection cannot use a skill whose permission/model/verifier partition differs; source changes do not silently reuse task-specific memory.
7. Expose a v4 `memory_enabled` policy flag or candidate-construction option, frozen in its snapshot. False supplies no partition observations to selection but preserves verdict/cost logging. Existing team toggle and matched development controls can be reused. Verifier-off should be an explicit rejection-only negative control: no independent verdict means feedback_eligible=False and no accepted success. Report tool/verifier/controller elapsed cost separately where measured; mark any unmeasured overhead instead of asserting complete accounting.

Minimal integration ownership: one small contract module, governor v4 contract/decision derivation, orchestrator v4 feedback write/read/replay, and learning_policy v4 partition snapshot/selection plus memory-off flag. Checkpoint_manager can retain opaque policy snapshots; Store already supports immutable artifacts and keyed state, so neither needs a new storage layer. New negatives should cover cross-source/permission/model/verifier partitions, sealed split feedback refusal, memory-off, unchanged v1-v3 snapshots and feedback idempotency/restart. These changes are required to mark the relevant C items complete; the route-only v4 fix alone closes only the demonstrated eligibility defect.
