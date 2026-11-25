# HIVE — Build Path After M0
## M1 protocol freeze → verified discovery and reuse → M2 local-model demonstration

**Date:** 23 November 2026  
**Baseline:** Owner-supplied “HIVE CHECKPOINT: M0 (23 Nov 2026).”  
**Governing master:** `HIVE_Master_Evolution_Build_Path_FINAL_Claude_Nemotron_2026-11-23.md`, version 0, 85,231 bytes.  
**Audience:** Claude conductor/integration coder; narrowly scoped Nemotron reuse workers; separately controlled evaluator/reviewer.  
**Status:** Execution supplement and proposed work sequence. This document does not declare M1 complete, freeze the actual protocol, or change D1–D11.

> **Next action: resolve the M1 draft’s §1 task-family condition and commit the frozen protocol.** Use thin typed views of existing parse/aggregate functions if source inspection establishes that they preserve existing behavior and do not supply the capability the search is supposed to discover. Otherwise use the draft’s eligible fallback family. Evaluator construction follows the protocol freeze; candidate search follows the evaluator and inventory pins.

## 1. Source authority and scope

This build path uses the supplied checkpoint for current implementation status and the matching master for architecture and milestone requirements. Relevant master sections were read, including D1–D11, the implementation phases, the M1/M2 experiment requirements, context economics, and future branches. The checkpoint supersedes the master’s older historical test baseline.

The repository, `docs/M1_PROTOCOL_DRAFT.md`, receipt bundle, and test logs were not independently inspected while preparing this handoff. Their reported contents are checkpoint evidence. The exact runtime HEAD, the actual fallback family, the available function signatures, and the final M1 case counts must be established in the coding workspace. The absent runtime hash must not be replaced with a guessed hash or the publication commit.

**Authority order:**

1. Current owner instructions and the existing owner spending ceiling.
2. The locked D1–D11 vector and governing master.
3. Verified current repository policy, evidence, and the checkpoint’s implementation status.
4. This document’s sequencing and explicitly marked operating proposals.

If current source contradicts the checkpoint, record the discrepancy and resolve only the affected step. Keep all unaffected authorized work moving. Map proposed artifact names below to existing repository conventions instead of creating duplicate registries, ledgers, evaluators, or stores.

**Sources:**

- **[CP]** Owner-supplied M0 checkpoint in this conversation, dated 23 November 2026.
- **[MASTER]** [HIVE_Master_Evolution_Build_Path_FINAL_Claude_Nemotron_2026-11-23.md](https://chatgpt.com/library?file_id=libfile_fde3_f-e2a79df56dac81919ad55816a994d229_08dd7e10f8d081918b684a802f5b489c&account_id=personal), version 0, 85,231 bytes. Primary sections: §0/§0A; §4/§4A; §7A and common measurement protocol; §8; §9/§9A.
- **Proposed operating choices** in this supplement are recommendations for preregistration. They are not historical results or additional owner-approved spending.

## 2. Preserve this exact starting position

### 2.1 Runtime, publication, and phase identities

| Item | Checkpoint state | Required treatment |
|---|---|---|
| Runtime branch | `build/working-prototype` | Record the full current HEAD and verify the reported checkpoint relationship. |
| Runtime commit | Described as “this commit”; parents `fe06e4e` and `6127776` | Resolve full HEAD and full parents in the checkout. Neither parent identifies the checkpoint commit. |
| Working tree | Tracked tree clean; pre-existing untracked `build/prototype-v04/*` and `integrations/*` | Preserve those paths and any subsequent unrelated changes. Stage only intended files. |
| Publication | PR #58, `e3fcce6`; unchanged | Keep publication identity separate from runtime identity. M0 is reported as unpublished. |
| Local phase | “P3” = Gate B + M0/M1 | Preserve this crosswalk. |
| Local “P4 core proven” | M1 accepted | Use only after M1 acceptance evidence exists. |
| Sensory branch | Reference-only | Preserve that status through this execution path. |

### 2.2 Gates and demonstrated evidence

| Gate | Current status | Meaning |
|---|---|---|
| A | Completed | Decisions, crosswalk, findings ledger, and legal surface in `configs/m0_campaign_policy.json`. |
| B | Completed | Declarative workflow → generated source → container backend → independent oracle → bound receipt. |
| C | M0 demonstrated mechanism | Lifecycle proof; no discovery or benefit claim. |
| D | Protocol drafted | `docs/M1_PROTOCOL_DRAFT.md` exists according to the checkpoint. Freeze still pending. |

M0 uses `m0-exact-output-v1` and `m0-oracle-v1`, with hand-written expected outputs in `src/hive/m0_oracle.py`. Its verification class is deterministic exact output. [CP]

| Candidate | Role | Recorded result |
|---|---|---|
| P0 `862f34e940f1` | Identity root | After rollback, returns the expected identity output on T2. |
| `5e9a68911d72` | `[scrub_delete, scrub_lowercase]` | ACCEPTED; T1 1/1 and T2 1/1 after restart. |
| `a4d572a70af1` | `[scrub_lowercase]` | REJECTED and retained; T1 0/1. |

Use full candidate hashes and inventory pins from `build/m0/m0_receipt_bundle.json`; the table contains abbreviated display IDs only. A new process reopened the store, verified lineage and pins, resolved selection, and ran previously unused T2 through the container. Rollback was appended, with history `select, rollback`, and selection resolves to P0. [CP]

Preserve all negative evidence: three pre-execution refusals for an unknown primitive, four steps, and a duplicate digest; the oracle failure; tampered-receipt and stale-oracle-SHA rejection; rejection of selecting the failed candidate; and rejection of a forged self-consistent receipt through binding to parent-written ACCEPTED `evidence_refs`. The last regression distinguishes the conductor’s fix from the earlier worker implementation. [CP]

**Historical verification:** 865 passed / 3 skipped / 0 failed in 36.6 minutes in `build/m0/full-suite.log`; targeted M0/lineage/compare checks: 36 passed. These results belong to M0. They are not verification of a future M1 commit. [CP]

### 2.3 Locked architecture

Preserve the vector exactly:

~~~text
D1=D D2=C D3=C D4=E D5=A D6=B D7=B D8=C D9=C D10=C D11=C
~~~

| Decision | Binding direction from the master |
|---|---|
| D1=D | Native incumbent plus controlled OpenEvolve/ShinkaEvolve qualification; at most one default. |
| D2=C | Immutable DGM ancestry and bounded HIVE-owned MAP-Elites; preserve global champion. |
| D3=C | Fixed, prompt-only, and structure-only arms; joint optimization follows separate qualification. |
| D4=E | Protected context packets/routes, then static sparse comparisons, then optional adaptation. |
| D5=A | Typed projections over the existing transactional store. |
| D6=B | Deterministic checks, finite/SMT checks, and Lean for predesignated critical obligations. |
| D7=B | M0 mechanism → M1 one verified new effect → M2 two effects in an actual fixed-weight local-model campaign. |
| D8=C | Selected M0/M1 task family → failure-driven opportunity ranking → independently checked curricula. |
| D9=C | One elite per frozen niche plus champion initially; Pareto specialists require measured need. |
| D10=C | Hard gates/raw metrics govern acceptance; compare ranking policies among eligible candidates. |
| D11=C | Register all research branches; permit separately capped independent offline work; gate integration on prerequisites and benefit. |

The master requires M1 to include at least two independently evaluated variants, a new verified capability reused on held-out work, restoration after restart, measurable held-out benefit, cost accounting, and rollback. M2 is a separate, stronger milestone. [MASTER, §§4, 7, 9]

## 3. Execution order and gate dependencies

The identifiers below are work-packet labels, not replacements for Gates A–D or the local phase names.

| Packet | Owner | Work | Exit condition |
|---|---|---|---|
| M1-0 | Claude + independent protocol reviewer | Reconcile checkpoint; resolve §1; freeze protocol | Full protocol content SHA and committed protocol identity; no unresolved acceptance fields. |
| M1-1E | Independent evaluator | Build F-final generator, oracles, split and access controls | Pinned evaluation manifest; independently checked oracle; final data protected. |
| M1-1A | Claude/Nemotron | Implement approved thin views and pin inventory | Equivalent semantics demonstrated; inventory and adapter versions fixed. |
| M1-2 | Claude conductor | Freeze meaningful baselines; run bounded legal search | Complete attempt ledger; at least two evaluated variants; one locked nominee or explicit failure. |
| M1-3 | Independent evaluator | Evaluate the locked nominee against the declared comparator | Bound final receipts, raw counts, benefit result, and explicit outcome. |
| M1-4 | Conductor + independent reviewer | Verify registration, restart, reuse, rollback, and integrated evidence | M1 accepted, failed, inconclusive, or invalidated with reasons. |
| M2 | Claude + evaluator | Run the separately frozen fixed-weight local-model campaign | One repurposing effect and one composition effect, both reproduced; restart reuse evidence. |
| Later master phases | Existing component owners | Scheduler/archive, backend and topology qualification, integrated shadow | Each phase’s independent evidence and resource gates met. |

M1-1E and M1-1A may run concurrently after M1-0 when interfaces are fixed, outputs are disjoint, and final answers cannot reach the adapter/proposal workers. M1-2 waits for both. Publication is a separate delivery action with its own exact version; a merge or local acceptance does not establish deployment.

## 4. M1-0 — resolve the family and freeze the protocol

### 4.1 Inspect only what is needed

Retrieve the checkpoint, the relevant master sections, `docs/DECISIONS_D1_D11.md`, `docs/M1_PROTOCOL_DRAFT.md`, the active campaign policy, current cost/context policy, M0 receipt bundle, and exact parse/aggregate definitions and direct tests. Retrieve findings individually when they affect these surfaces.

Capture the real branch, HEAD, parents, and status without discarding work. Suitable read-only Git commands, run in the actual repository, are:

~~~bash
git branch --show-current
git rev-parse HEAD
git show -s --format='%H%n%P%n%D' HEAD
git status --short --untracked-files=all
~~~

Check that the conductor receipt-binding fix and its regression are present in this HEAD. Locate existing test commands and state/lineage owners. Reuse existing M0 evidence; a full-suite rerun is not a prerequisite for editing a protocol document.

### 4.2 Recommended resolution of §1

**Prefer thin typed views of existing parse/aggregate functions if all conditions hold:**

- Exact source symbols, signatures, behavior, dependencies, and versions are identified.
- The functions already perform the underlying computation inside the approved inventory/scope.
- Views add only the necessary type/interface adaptation, input validation, and explicit error mapping.
- The view does not implement task-specific cleanup, aggregation logic, hidden constants, solution selection, or a successful workflow.
- The selected task presents an actual inventory gap that legal composition or repurposing could close.
- An independent oracle can judge that effect without calling the candidate implementation.

Pin the exposed inventory after adapter preparation and before search. Exposing an existing function is preparation; do not count it as a discovered capability. Any adapter behavior that changes the task semantics requires protocol review before search.

**Use the fallback if these conditions fail.** Inspect the actual fallback specified in §1, prove that its primitives are already eligible, and apply the same novelty and oracle requirements. If the draft contains no usable fallback, select a small eligible family under D8 or record the precise missing capability/authority. This handoff does not invent what the unseen draft says.

Bound this inspection/design packet. Use the master’s repair limit and the reserved task budget; leave a compact blocker if neither route fits. Avoid broad refactoring to make an attractive task possible.

### 4.3 Fields that must be fixed before the protocol can be called frozen

| Field | Required content |
|---|---|
| Identity and objective | Protocol version, runtime base, master identity, D vector, task contract, and narrow claim. |
| Novelty rule | Starting effect inventory; what qualifies as a newly available effect; treatment of wrappers and already-known solutions. |
| Legal search space | Exact primitive/type allowlist, parameters, normalization, composition rules, depth, mutation operations, and forbidden surfaces. |
| Baselines | Relevant incumbent, fixed/reference composition if applicable, random legal search, and retained-skill-disabled comparison; state each control’s purpose. |
| Benefit rule | Which meaningful comparison establishes benefit; metric, direction, threshold, cost treatment, and unacceptable regressions. |
| Data | Development, validation if used, F-final, and post-restart reuse partitions; exact counts, categories, shift definitions, and independence unit. |
| Oracle | Input/output and error semantics, exact-output rules, determinism requirements, and independent-authoring constraints. |
| Selection | Search feedback allowed, nomination rule/tie-breaks, number of final nominees, and when each becomes immutable. |
| Exposure/retries | Final-data access, permitted infrastructure retries, what invalidates a run, and how fresh confirmation is obtained. |
| Bounds | Proposal, execution, repair, time, concurrency, compute, token, and monetary caps; stop/cancel behavior. |
| Lifecycle | Evidence schema, registration status, restart/reuse checks, rollback target and post-rollback assertions. |
| Decision | Accepted, failed, inconclusive, and invalidated outcomes; designated reviewer and required evidence. |

Use exact numbers from the reviewed draft or preregister concrete bounded choices within existing authority. Counts and thresholds may not remain “TBD” at freeze. The master’s illustrative quality, efficiency, and context targets remain proposals until the applicable protocol and authorization adopt them; do not turn them into claimed measurements.

**Protocol freeze receipt:** record the document’s SHA-256 over its exact committed bytes, the full commit containing it, its path, and the runtime base. Verify the committed blob matches the hashed bytes. Put the digest/commit reference in the checkpoint or a later manifest; do not make the protocol contain its own final hash or its own future commit SHA.

**Gate D exit:** the committed protocol exists, §1 has one selected route, its acceptance and budget fields are complete, and independent review has found no blocking ambiguity. End the first packet here.

## 5. M1-1 — independent evaluation and inventory preparation

### 5.1 Evaluator ownership

Give the evaluator the frozen task specification and interface definitions. Keep its F-final cases, seeds, expected answers, private reference implementation, and answer-bearing logs out of candidate-worker packets and workspaces.

The evaluator authors the generator and oracles independently. A reference oracle that invokes the same parse/aggregate implementation as the candidate cannot establish independent correctness for that implementation. Use direct specification-based logic, independently computed examples, and task-relevant negative controls.

Check representative valid cases, boundary cases, malformed inputs where defined, and deliberately wrong outputs. These are evaluator validation fixtures, separate from F-final. Record failures before fixes. If implementation reveals a substantive specification ambiguity, revise and recommit the protocol before candidate search.

Pin:

- Protocol content hash and protocol commit.
- Runtime/executor environment and container-image digest.
- Final primitive inventory, type contracts, and adapter hashes.
- Generator and oracle versions/hashes.
- Split construction, exact case/category counts, and data commitments.
- Candidate permissions, resource limits, baseline identities, and retry rules.
- Private-data custodian and the actual access controls used.

The protocol can be frozen before evaluator code exists. The evaluation manifest closes that implementation gap. No candidate search begins until both freezes are complete.

### 5.2 What “sealed” means here

Keep final cases and answers outside the proposer’s accessible material. A separate chat session is a role boundary; it is not automatically filesystem isolation. A candidate container must not receive evaluator files, the writable authoritative store, or broader mounts than its approved execution contract.

Document actual protections. If a trusted conductor can access everything, state that trust assumption. The checkpoint’s hostile-store-writer limit remains open; neither hashes nor a differently named worker remove it.

F-final is not a development feedback loop. Recommended default: one nominated candidate and one final evaluation episode, with only preregistered retries of identical bytes for identified infrastructure failures. If final results influence edits or selection, retire that final set for confirmation and open a new versioned episode with fresh final evidence.

### 5.3 Adapter ownership

Nemotron may implement a narrow adapter from a Claude-approved contract and exact source references. It returns the minimal diff, provenance, direct semantic-equivalence checks, and unresolved issues. It must escalate new behavior as design work.

The final inventory is the inventory against which novelty is judged. Include adapter versions in it. A new primitive introduced after search begins invalidates a fixed-inventory comparison and requires a new protocol episode.

## 6. M1-2 — meaningful baselines and bounded search

### 6.1 Keep lineage and comparison roles distinct

Preserve P0 as M0’s identity root and rollback reference. The M1 performance comparator must represent the relevant existing capability. Passing a parsing/aggregation task against an identity function alone does not establish useful improvement.

Use the master’s control structure:

| Control/arm | Purpose |
|---|---|
| Relevant current incumbent | Measure whether the proposed capability improves the actual available behavior. |
| Fixed composition/reference, if applicable | Establish what a simple known solution can already achieve; disclose who supplied it and its cost. |
| Random legal composition | Measure whether guided search adds value over legal exploration. |
| Bounded proposed search | Find an eligible workflow under the same inventory and constraints. |
| Retained skill disabled | Determine whether persistence/reuse provides the claimed advantage. |

Freeze which baseline comparison supports which claim. If a fixed solution already supplies the target effect, account for that fact in novelty and benefit before search. Do not relabel a stronger baseline as irrelevant after observing results.

Report all required arms, failures, costs, and denominators. A reference ceiling, the operational incumbent, and a search-efficiency comparator can play different roles, but those roles must be declared in advance.

### 6.2 Use the existing narrow search seam

Reuse the Gate B path: declarative proposal → validation → generated code → governed container → independent evaluation → bound evidence. Native deterministic search is the recommended first M1 route when the actual protocol permits it. Paid models and new external search backends are unnecessary to establish this deterministic milestone.

Carry forward the master’s initial defaults unless the active policy is stricter:

- At most **20 submitted proposals per campaign**.
- Workflow depth at most **3**.
- At most **2 concurrent experiments**.
- At most **2 repairs per candidate/packet**.

Proposed accounting interpretation: invalid proposals, duplicates, and repaired resubmissions consume the proposal allowance; executions, retries, and other resource charges also count toward their own caps. Freeze this interpretation before search. Internal enumeration must have its own finite work/time bound.

At least **two distinct legal M1 variants** must receive independent evaluation. Preflight refusals do not satisfy that requirement. Evaluate variants on permitted development/validation data; nominate by the frozen rule before opening final results. Do not use the known M0 scrub solution as evidence of M1 discovery.

Retain complete candidate provenance: proposer mode, exact inputs permitted to the search, parent, inventory, normalized digest, refusal/execution outcome, evaluator identity, development metrics, and charged resources. This distinguishes automated discovery from a human-supplied solution.

### 6.3 Search exits

- **Eligible nominee found:** freeze its digest/source, parentage, inventory, selection rule, and confirmation budget.
- **No nominee within limits:** preserve the run and report failure or inconclusive status under the protocol.
- **Integrity problem or leakage:** invalidate the affected episode, preserve evidence, and identify the exact remediation.

A proposal-count cap is an experimental and cost boundary. It may be changed prospectively for a new campaign within authority; it cannot be raised silently because a current search has failed.

## 7. M1-3 and M1-4 — final evidence, reuse, and acceptance

### 7.1 Final evaluation

Evaluate the locked nominee and required frozen baselines on F-final under matched declared conditions. For deterministic exact-output tasks, report exact successes/total, failure categories, and paired outcome counts. A fresh random seed by itself is not evidence of a new task family or distribution shift.

The independent evaluator emits evidence bound to the protocol, candidate, parent, inventory, oracle, generator/data commitment, execution environment, policy, attempt, and measured output. The trusted acceptance path links that evidence to parent-written ACCEPTED `evidence_refs`. Hash consistency alone is insufficient.

Report novelty and benefit separately:

- **New effect:** absent from the audited starting inventory, produced by the legal search, and independently verified.
- **Measured benefit:** the frozen comparison and threshold pass, with all costs and failures included.
- **Scope:** the actual tested family and sample size. Small deterministic pilots do not justify broad generalization claims.

The master’s M1 completion definition requires both the qualifying new capability and measured held-out benefit. Correct outputs without the required comparison leave M1 incomplete.

### 7.2 Lifecycle evidence on the actual accepted artifact

After the verification/acceptance path qualifies the candidate for the experimental selection:

1. Register the exact immutable capability and its evidence in the existing store.
2. End the process and start a new one.
3. Reopen the store; verify lineage, protocol/oracle/inventory pins, and accepted evidence references.
4. Resolve selection from stored state without reconstructing the capability from the worker transcript.
5. Invoke through HIVE on the frozen fresh-reuse partition, including the specified shifted cases.
6. Exercise the retained-skill-disabled comparison under the same task conditions.
7. Append rollback and verify the selection resolves to the protocol-declared prior version.
8. Execute a post-rollback check, retain the full history, and verify ineligible/stale candidates cannot be selected.

If M1’s prior version is P0, name that explicitly. If the task uses a different experimental incumbent, pin it and preserve M0’s original select/rollback history unchanged. Never rewrite a rollback target merely to obtain a passing demonstration.

A rollback demonstration can leave the experiment on its prior version. Any subsequent reselection is a separate recorded action; do not erase rollback evidence.

### 7.3 Required regression evidence

Keep these checks tied to the affected M1 execution and acceptance paths:

- Unknown primitive, excessive depth, and duplicate proposal refusal.
- Independent oracle rejection and failed-candidate selection refusal.
- Stale protocol/oracle/inventory pins and tampered-receipt rejection.
- The forged self-consistent receipt rejected by parent-written acceptance binding.
- Lineage/content consistency, new-process restart, exact reuse, and append-only rollback.
- Budget stop/cancellation and reservation behavior when those paths are changed or used by the new campaign.

Use existing tests where available. Add checks only for a changed contract or concrete uncovered risk. Run the required integrated suite at the acceptance boundary on the recorded revision. Repeat broad testing only after a material subsequent change, a required gate, or a failure that needs resolution. Keep the first failure and every rerun; a passing retry does not explain the A1 flake.

### 7.4 Acceptance decision

| Result | Required interpretation |
|---|---|
| **M1 ACCEPTED** | Novel effect, at least two evaluated variants, declared held-out benefit, retained reuse, restart, rollback, integrity checks, and cost accounting all satisfy the frozen protocol. Local “P4 core proven” becomes valid. |
| **M1 FAILED** | A decisive acceptance requirement was tested and missed. Preserve the candidate and negative evidence. |
| **M1 INCONCLUSIVE** | Evidence is insufficient to decide the stated claim within the frozen limits. Do not promote. |
| **M1 INVALIDATED** | Protocol drift, final-data contamination, evidence corruption, or another validity failure prevents interpretation. Preserve the episode and start fresh only after remediation. |

Prepare the M1 report before starting the next milestone. It must include the declared claim, exact versions, raw per-arm results, cost, negative evidence, novelty assessment, benefit comparison, lifecycle evidence, open findings, limitations, and one next action.

## 8. Findings and receipt trust

The checkpoint leaves `SQ-1..5`, `SQ-7`, `SQ-8`, `BC-4..6`, `BC-8a/b/c`, and `FR-3..7` open as LOW/NIT, and A1 lacks a root cause. This handoff does not infer the contents of those individual records. [CP]

| Finding group | Treatment |
|---|---|
| Receipt trust / SQ-1 | Record the exact threat model. M0’s binding rejects a forged worker receipt when parent acceptance evidence remains trusted; an unkeyed writer able to rewrite the entire store can forge the record. |
| Findings touching M1 correctness, authority, evidence, isolation, rollback, or budget | Inspect before the relevant gate. Block that gate if the finding makes its evidence unreliable. |
| A1 flake | Check whether it affects M1 validity or the required suite. Preserve first-run evidence and investigate when relevant; do not make repeated broad reruns the remedy. |
| Other LOW/NIT findings | Keep in the ledger with owner, impact, and revisit condition. Fix opportunistically when the touched code warrants it. |

For a bounded trusted-local M1 experiment, document the hostile-writer exclusion explicitly. Before introducing mutually untrusted writers or stronger authenticity claims, design an actual authority boundary: restricted evidence writing and verification rooted outside candidate control. Merely adding another unkeyed checksum or placing a signing secret in the same writable store does not solve this limit.

Keep this work proportional to the declared experiment. Global storage/security redesign is not automatically a new M1 prerequisite.

## 9. Cost, context windows, and worker dispatch

### 9.1 Preserve the existing ceiling

| Item | Checkpoint amount |
|---|---:|
| Owner ceiling | $120 |
| Cumulative reported spend | Approximately $54.60 |
| Indicative remaining headroom | Approximately $65.40 |
| M0 session engineering | Approximately $2.55 list-priced from transcripts: Opus $1.99, Sonnet $0.56 |
| M0 runtime | 0 model calls, 0 network, 4 Docker runs, $0 recorded charge |
| Outstanding reservations | None |

The session figure is part of the reported cumulative history; do not add it again without ledger evidence. Reconcile actual/list-estimated accounting and outstanding work before dispatch. M0’s zero runtime charge does not predict M1 engineering cost or make local execution costless.

Track engineering, runtime model charges, and other incremental charges separately and charge each exactly once against the aggregate owner ceiling unless the authoritative policy explicitly says otherwise.

~~~text
available = owner_ceiling - reconciled_actual - outstanding_reservations

dispatch only when:
  packet_prerequisites_pass
  AND packet_reservation <= available
  AND applicable_call/compute/time_limits_allow_it
~~~

Reserve atomically before calls, retain reservations for unknown/delayed usage, reconcile actual charges including failed work, then release the unused balance. Do not erase a reservation before accounting for its costs.

**Proposed first-packet cap:** up to **$5** for M1-0 inspection, family resolution, protocol writing, and independent review, subject to any lower existing cap. This is a maximum reservation, not a forecast or spending target. Keep the rest unallocated until protocol scope supports estimates for evaluator, adapters, search, and confirmation. Routine bounded packets inside the existing authorized ceiling do not require a fresh owner confirmation each time.

Keep final evaluation/reproduction resources available before starting search. Stop when any relevant cap is reached; no automatic paid fallback, automatic campaign renewal, or free retries.

The $120 ceiling does not authorize new paid runtime services. Use already-authorized engineering resources. Paid runtime calls require the master's applicable recorded monetary limit and call authority before execution. The proposed $5 packet cap becomes operative through the existing reservation/policy process.

### 9.2 Use the master’s context limits

Carry forward the master’s starting token ceilings where existing policy does not impose lower limits:

| Role | Input ceiling | Output ceiling |
|---|---:|---:|
| Proposer/implementation packet | 4,000 tokens | 1,000 tokens |
| Reviewer packet | 1,500 tokens | 500 tokens |

Treat these as total accounted inputs where measurable: instructions, retrieved source, diffs, prior messages, tool excerpts, and cached text all matter. If mandatory system context already exceeds a ceiling, record that overhead and revise the packet design/limit transparently within policy; do not label the call compliant by excluding expensive text.

Put complete code and logs in artifacts. Reports contain the result, changed paths, test/evidence references, costs, unresolved issue, and next action. Retrieve exact symbols and relevant document sections. Do not send the 85,231-byte master, full transcripts, or full-suite logs to every worker.

Proposed checkpoint target: at most 1,500 tokens for the conductor’s rolling state; use a fresh bounded session at a genuine task boundary, or before context pressure consumes the space needed for verification and handoff. A tool-reported 70% context-usage trigger can be a conservative starting rule where that accounting exists.

Track uncached input, cache reads, cache writes, output, retries, tool charges, local CPU/GPU/wall time, and the measured total. Cache hits are billable activity where the provider charges for them; compare money as well as tokens. Missing usage stays unknown and conservatively reserved.

Cost per verified completion is undefined when there are no verified completions. A reuse break-even estimate is meaningful only when measured per-task savings are positive and discovery, confirmation, and maintenance costs are included.

### 9.3 Role and packet boundaries

- **Claude conductor:** protocol/design, novel behavior, integration, reservation ownership, review, and milestone claims.
- **Nemotron reuse workers:** exact existing-code adaptation, deterministic fixtures, repetitive bounded implementation, and test execution from explicit contracts.
- **Independent evaluator:** generator/oracle construction, protected final evidence, evaluation, and independent checks. Do not assign it candidate optimization.
- **Owner:** existing scope/budget authority and production decisions. Coding-worker roles are distinct from the local models studied in M2.

Use disjoint file scopes and a single integration owner. Serialize changes to shared policy, registry, acceptance state, and budget ledger.

~~~yaml
work_packet:
  task_id: M1-0
  role: claude_design
  objective: Resolve the existing draft's family condition and freeze M1
  runtime_base: <verified full SHA>
  governing_master: <path and verified identity>
  decisions: "D1=D D2=C D3=C D4=E D5=A D6=B D7=B D8=C D9=C D10=C D11=C"
  allowed_files: <explicit existing/proposed paths>
  references: <only necessary pinned sections and symbols>
  acceptance: <concrete gate checks>
  reservation: <atomic ID and limits>
  stop: <exit condition, cap, or exact blocker>
  handoff: <commit, hashes, findings, tests, usage, next action>
~~~

## 10. After M1: preserve the master’s wider build path

### 10.1 M2 — actual fixed-weight local-model campaign

Start after the M1 review. Freeze a separate M2 protocol and budget; identify actual configured local models, weight hashes, prompts/tool contracts, sampling settings, task splits, and resource limits.

M2 must independently demonstrate **two distinct effects**:

1. An existing capability repurposed for a different qualifying effect.
2. A qualifying composition of existing capabilities.

Reproduce both on fresh inputs and reuse at least one after restart. A renamed workflow or two parameterizations do not automatically establish two distinct effects. Include incumbent/fixed and random controls and retained-skill-disabled comparison as required by the master.

Keep the research-subject model weights fixed. Coding agents may build the harness; their work cannot stand in for an actual local-model run. The master’s 12-task smoke target is pilot guidance, not proof of broad generalization or an automatically approved campaign size. Report M2 separately from M1.

### 10.2 Subsequent qualification

| Workstream | Entry condition | Evidence needed |
|---|---|---|
| Scheduler/search experiments | Core loop and applicable master Phase 4 prerequisites | Strong fixed/heuristic/random baselines; quality, fairness, latency, all-in costs; complete losing runs. |
| Archive/ranking | Versioned lineage and bounded common archive | One elite per frozen niche plus champion first; equal-capacity controls; D9 occupancy separate from D10 ranking. |
| Backend competition | Common runner/evaluator/archive and separate campaign limits | Native vs qualified OpenEvolve/ShinkaEvolve adapters under matched controls; at most one default. |
| Opportunity ranking | Selected-family baseline established | Failure-driven ranking vs simpler controls before generated curricula; dev-only generation and independent solvability. |
| Communication/topology | Protected routes, context measurement, applicable Phase 1–3 prerequisites | Static/packet controls first; actual traffic, evidence delivery, costs, recovery; adaptive changes only after justification. |
| Integrated shadow | Isolated component qualifications and permissions | Interaction tests, fresh held-out work across three separately budgeted learning windows, restart, rollback, exact versioned evidence. |
| Controlled rollout | Qualified exact candidate and existing activation requirements satisfied | Recorded activation decision, version pin, monitoring/canary where applicable, and demonstrated rollback. |

Cheap independent deterministic preparation can proceed under D11 when separately capped and ready; it must not delay M1/M2 or introduce another production controller. Preserve all unselected alternatives and original branch IDs/aliases in the existing research register.

The sensory/world-model/weight-training direction remains reference-only under this checkpoint. Give that branch its own future protocol when activated through the project’s established decision path.

### 10.3 Publication

Maintain two fields at every checkpoint: runtime commit and publication commit. An honest M0 status update can be prepared before M1, and a later update can describe M1’s accepted or unsuccessful outcome. In either case, publication is established only by the actual deployment record. Until then retain PR #58 / `e3fcce6` as the reported published baseline.

Do not label the site as M1-proven because code merged or a report was drafted. Publish the scope, numerators/denominators, limitations, and open findings alongside any success claim.

## 11. Proposed deliverable map

These paths are suggested names, not assertions that they exist. Reuse equivalent existing artifacts.

| Artifact | Purpose | Producer |
|---|---|---|
| `docs/M1_PROTOCOL.md` | Frozen objective, family, legal surface, evaluation and limits | Claude + protocol reviewer |
| `build/m1/evaluation_manifest.json` | Protocol, oracle, generator, inventory, environment and data pins | Independent evaluator + conductor |
| Existing private evaluator area | F-final seeds, cases, expected outputs, and private oracle assets | Independent evaluator |
| `build/m1/candidate_attempts.jsonl` | Every submission, refusal, failure, metric, and resource charge | Existing runner |
| `build/m1/m1_receipt_bundle.json` | Final evidence and trusted acceptance references | Existing evaluator/acceptance path |
| `build/m1/restart_reuse_rollback.json` | New-process execution and append-only lifecycle evidence | Independent reviewer |
| `docs/M1_REPORT.md` | Outcome, novelty, benefit, controls, limitations, findings and costs | Claude conductor |
| Existing checkpoint/cost/finding registers | Resume state, accounting, unresolved work | Existing owners |

The public evaluation manifest contains commitments and allowed metadata, not hidden cases or answer-bearing logs. A final-data directory is not safely private just because its name says “private.”

## 12. First dispatch — send at the current M0 checkpoint

**Timing:** Send this handoff now if the coding agent remains at the stated M0 checkpoint. Ask it to execute only M1-0 first. If it has already advanced, reconcile its actual HEAD and evidence at the next clean work boundary; do not retroactively call an already-run experiment preregistered.

~~~text
Continue from HIVE CHECKPOINT M0 (23 Nov 2026) on the actual
build/working-prototype runtime checkout.

Execute packet M1-0 only: resolve §1 of docs/M1_PROTOCOL_DRAFT.md
and freeze the M1 protocol.

Preserve the master identity, D1–D11 vector, existing Gate A–D/local
phase crosswalk, M0 receipts/history, conductor receipt-binding fix,
and pre-existing untracked build/prototype-v04/* and integrations/*.

First capture full HEAD, parents, branch, relevant dirty state, and
current budget/reservations. Keep runtime identity separate from
published PR #58 / e3fcce6.

Read only the M1 draft, relevant master sections, current legal/
cost/context policy, required inventory symbols and direct tests,
and findings that affect this packet.

Prefer thin typed views of existing parse/aggregate behavior when
they expose approved existing computation without supplying the
solution. Otherwise use an eligible fallback from the actual draft.
Record source symbols, limits, and the reason for the selected route.

Freeze the task contract, novelty rule, meaningful baselines,
benefit threshold, exact development/final/reuse partitions and
counts, independent oracle requirements, selection/retry rules,
search bounds, budgets, and lifecycle acceptance criteria.

Use existing lower limits; otherwise preserve the master defaults:
20 proposals, depth 3, 2 concurrent experiments, 2 repairs per packet/
candidate, and bounded role-specific context. Reserve the packet
within the existing $120 ceiling; proposed M1-0 maximum is $5.
No new blanket approval request is needed for already-authorized
bounded work within that ceiling.
Use only already-authorized engineering resources. Budget headroom
does not grant authority for new paid runtime services; the proposed
$5 cap must be recorded through the existing reservation policy.

Commit the protocol and report the full protocol commit and SHA-256
of its exact committed bytes. Store its identity outside the content
being hashed. Report only tests actually run.

Return: selected route and rationale; protocol path/commit/hash;
remaining blockers/findings; actual usage and reservations; one next
action: independent F-final generator/oracle construction.

Stop this packet at protocol freeze. Candidate search remains gated
on separately pinned evaluation assets and the final inventory.
~~~

## 13. Resume checkpoint template

~~~text
HIVE CHECKPOINT: <M1 protocol frozen | evaluation pinned |
                  candidate locked | M1 accepted/failed/inconclusive/invalidated>

Runtime: <full commit, branch, parents if changed, relevant dirty state>
Publication: <exact verified published version, or unchanged e3fcce6>
Master/D vector: <verified identity and unchanged vector>
Phase/gates: <existing names and precise completed substeps>

Protocol: <path, content SHA, full protocol commit>
Evaluator/data: <versions, hashes, commitments, access boundary>
Inventory/environment: <pins>
Baselines/variants: <identities and evaluation roles>
Candidate: <full digest, parent, status>

Raw results: <per-arm and per-category successes/total, failures>
Discovery claim: <new effect and search provenance, or not established>
Benefit claim: <frozen comparison and outcome, or not established>
Lifecycle: <registration, restart, fresh reuse, rollback evidence>
Negative evidence: <retained references>
Verification: <commands, results, revision, original failures/reruns>

Open findings: <IDs, impact, blocker status, A1 status>
Trust limit: <actual evidence-writer/access assumptions>
Cost: <engineering/runtime/other actuals or explicit estimates>
Owner ceiling/headroom: <reconciled amounts>
Reservations: <active/reconciled/released>

Next single action: <one bounded packet>
Resume condition: <specific required hash/evidence/authority>
~~~

**Immediate finish line:** a committed, reviewable M1 protocol with §1 resolved.  
**Next milestone finish line:** one legally discovered, independently verified new effect with measured held-out benefit, retained reuse, restart, rollback, and complete accounting.  
**Following milestone:** M2’s actual fixed-weight local-model demonstration of both repurposing and composition.

