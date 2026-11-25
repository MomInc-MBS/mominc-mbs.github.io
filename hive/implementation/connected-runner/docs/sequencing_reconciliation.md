# Sequencing reconciliation: Phase 0 of the master sequencing patch

- **Patch:** `docs/MASTER_SEQUENCING_PATCH_20261123.md`, applied at the v0.4.x checkpoint (see `docs/BUILD_CHECKPOINT_V04X.md`).
- **Date:** 23 Nov 2026.
- **Baseline:** last code commit `89a1118`, branch `build/working-prototype`.
- **Authority:** this file is the **single authoritative execution queue**. No other campaign queue is active.

## 1. Phase 0 record
- **Worktree:** clean apart from the pre-existing untracked files `build/prototype-v04/*` and `integrations/*`.
- **Workers, leases, campaigns:** no worker is running and no lease is held. The v0.4.x campaign is complete; no overlapping campaign exists.
- **Baseline tests:** 821 passed, 3 skipped, plus 1 load-sensitive flake (details in the checkpoint §1).
- **Rollback points:**
  - `1116f10`: the pre-campaign base.
  - `89a1118`: the last code state of this campaign.
- **Authoritative documents found:**
  - directive: `docs/NEXT_BUILD_V04X_DIRECTIVE.md`
  - acceptance: `docs/LEVEL_A_ACCEPTANCE.md`, `docs/LEVEL_B_LEARNING_STUDY.md`, `docs/OPERATIONAL_PROTOTYPE.md`
  - compounding: `docs/COMPOUNDING_PROTOCOL.md`
  - security: `docs/SECURITY_QUARANTINE.md`
  - context accounting: `configs/agent_context_policy.yaml` plus `scripts/agent_usage_tally.py`
- **RESOLVED 23 Nov (was BLOCKED): D1–D11 imported in `docs/DECISIONS_D1_D11.md` (vector `D1=D D2=C D3=C D4=E D5=A D6=B D7=B D8=C D9=C D10=C D11=C`, with phase crosswalk and M0 legal surface). Historical note follows.** ~~The master evolution and constraint-transcendence handoffs that define D1–D11 are not in this repo.** No copy was found on this PC: `D:/site-work`, `D:/Research`, `D:/MOM Rig`, `D:/outputs` and the T3 attachments were searched for "MAP-Elites". D1–D6 are known only from the patch's own table. **D7–D11 are unresolved and must not be inferred.** Ian needs to supply the master document or its location.~~
- **No candidate registry or lineage store exists.** The candidate records in `experiment_compare.py` (`parent_hash`, `candidate_hash`, provenance) and the `mission.py` and `pressure*.py` provenance fields are the nearest existing interfaces.

## 2. Patch items → status

| Patch item | Status | Evidence / paths | Gap |
|---|---|---|---|
| P1: gateway governs real model dispatch (deny-by-default, budget, unauthorized, retry) | **PARTIAL** | `dispatch_gate.py`, `model_route.py` (shadow), `orchestrator.py` at-most-once guard; tests `test_dispatch_gate.py`, `test_model_route_shadow.py`, `test_dispatch_at_most_once.py` | Only `adapters/ollama.py` performs real dispatch; `runanywhere.py` and `obscura.py` are pilot stubs with no network. Role is not plumbed through the adapter (BC-8a); a `gate=None` adapter skips gates (BC-8b). |
| P1: OODA connected to bounded experiment driver (cancel, limits, leases, checkpoints) | **DONE** for tool-only | `experiment_driver.py`, `hive ooda run/verify/compare`; A4/A5 independent PASS | Leases are Store `owner`+`generation` plus `worker_lock`; stale-lease recovery is via `Store.recover`. No model-route experiments yet. |
| P1: usage ledger cross-process safe, atomic reservation, actual-cost settle | **DONE** | `usage_ledger.py`, `dispatch_gate.py`; `test_cross_process_adversarial.py`; A2 PASS | `max_requests` is not a ledger dimension (BC-8c). |
| P1: candidate execution cannot modify evaluator, holdouts, scoring, gates, production | **DONE (FR-2 lifted 23 Nov; residual FR-8 before Phase 2 code candidates)** | The verifier and tool are frozen by module hash; evaluator hashes are checked before and after; there is no promotion path | **FR-2:** candidates run in the evaluator's process and could monkeypatch the scorer. |
| P1: context and cost rules (§8) for runtime and external agents | **PARTIAL** | `agent_context_policy.yaml` (runtime); `scripts/agent_usage_tally.py` (Claude agents: input, cache read and write, output, list USD) | No per-task run-ID telemetry row for agents; actual provider charges unknown; NVIDIA/Nemotron and Codex telemetry not captured. |
| P2: evolutionary genome and lineage | **MISSING** | — | Build on Store + run_state + artifacts (D5 = existing store + graph). |
| P3: capability discovery engine | **MISSING** | The OODA driver plus compare is the nearest loop | — |
| P4: first verified evolutionary benefit | **MISSING** | E_run2 = REJECT_NO_GAIN, a negative result that is correctly kept | — |
| P5: Level A | **PREPARED, not run** | Owner approved Option A for manifest `1125b032…`; 3 CSV verifiers exist | Verifiers for 3 JSON/YAML sources plus adapters and oracles for 6 Python snapshots; separate store `.hive/level-a/`. May proceed **in parallel** under evaluator control. |
| P5: Level B | **MISSING** | `docs/LEVEL_B_LEARNING_STUDY.md` (contract) | — |
| P6–P9 | **NOT STARTED (deferred)** | — | Interface design only if cheap and nonblocking; full work waits on P4 evidence. D7–D11 BLOCKED (see §1). |
| §8 bounded packets, checkpoints, budget preflight | **DONE (process)** | This checkpoint; `.hive/agent-budget.json` moving cap ($120 owner ceiling) | Worker packets have been about 1–2k tokens of brief; actual per-worker context was mostly cached reads, measured. |

## 3. Next bounded task: FR-2 evaluator isolation (Phase 1 closure)

**Why first:** Phase 2–4 introduce generated and learned candidates. FR-2 is the only open gap where such a candidate could alter its own score. The patch makes evaluator isolation a Phase 1 exit condition.

Task packet for one Sonnet worker, under 8k input tokens:
- **Objective:** candidates (`experiment_compare.Candidate.apply` and `extra_candidates`) run in a **separate subprocess**. The subprocess receives only `(text, checks copy)` over stdin and JSON, and returns only output text. Scoring, the verifier, `collateral` and dedup run in the parent. The subprocess gets a minimal env, a timeout and an output-size cap, and has no import path to the evaluator modules' mutable state.
- **Scope:** `src/hive/experiment_compare.py` and `tests/test_experiment_compare.py` only. **Do not edit** `experiment_verify.py` or `experiment_tool.py`.
- **Done when:**
  - The reviewer's monkeypatch probe (a candidate that rewrites the scorer and self-reports 7/7) now scores honestly.
  - A crashing, hanging or oversized candidate fails only its own arm.
  - Rerunning `hive ooda compare` on the committed plan into a new `--out` gives the same decision. The `result_sha256` may change only if the receipt schema changes; record why.
  - All 4 experiment test files pass, plus one new test that fails on `89a1118`.
- **Budget:** one implementation window ($10 list) plus one Opus review. Tool-only, 0 model calls.
- **Then:** lift FR-2 in `SECURITY_QUARANTINE.md`, then start the P2 lineage design (one page, mapped onto Store and artifacts) before any code.

## 4. Parallel, evaluator-controlled (may start now, disjoint files)
- **Level A verifier prep:**
  - **Scope:** JSON/YAML verifiers and Python-snapshot oracles under a new evaluator-owned path, not readable by candidate workers.
  - **Store:** `.hive/level-a/` only.
  - **Must not touch** `experiment_compare.py` or any evolutionary artifact. Tool-only (Option A).

## 4b. Sensory / embodied research — REFERENCE ONLY (owner, 23 Nov)
- **Owner rule:** `docs/research/HEXE_EMBODIED_EXPLORATION_HANDOFF_20261123.md` and `docs/research/SENSORY_GROUNDING_RESEARCH_PLAN_20261123.md` are reference material only, used **once the core structure is proven** (Phase 1 closed through P4 first verified evolutionary benefit). They do not add queue items and get no agent spend before then.
- **Parked code:** `src/hive/sensing/` (928cb32: mock G01, actuators denied, immutable episodes, deterministic replay, 7 tests) was built before this rule. It stays as-is, dormant: no further work, no hardware asks, until the gate above is met.

## 5. Queued (standing instruction, no decision needed)
- **Public site:** AGENTS.md requires publishing verified milestones to `mominc.online/hive/`, so this is first in the next session, before FR-2.
  - **Source:** MomInc-MBS/mominc-mbs.github.io main.
  - **Content:** checkpoint facts only. Label it `ENGINEERING_AUTONOMOUS_EXPERIMENT_DEMONSTRATED`, with the negative E result and quarantine summary.
  - **Must not appear:** Level A manifest internals beyond source names, and any private evaluator material.

## 6. Open owner decisions
1. ~~Supply D7–D11~~ RESOLVED (`DECISIONS_D1_D11.md`).
2. Whether to raise the $120 hard ceiling for the next campaign. Spent so far: $40.14 list-equivalent.

## 7. Active queue after Gate A (23 Nov, supplement handoff)
1. **Gate B + C, M0:** a declarative workflow candidate goes through the container backend, then independent oracle, lineage, experimental selection, restart, a distinct-task reuse, and rollback, producing a receipt bundle in `build/m0/`. Policy: `configs/m0_campaign_policy.json`.
2. **Gate D, M1 protocol:** source-partitioned dev/selection/final data, private oracles, frozen baselines, and a decision rule. It can run in parallel because its file scope is disjoint.
3. Gate E (M1 bounded search) comes after both. M2 needs a separate inference authorisation.
