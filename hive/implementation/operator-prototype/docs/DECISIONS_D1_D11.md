# D1–D11 decision record + phase crosswalk + M0 legal surface (Gate A)

Imported 23 Nov 2026 by the conductor (Opus) from the owner-supplied supplement
`HIVE_Live_Checkpoint_Forward_Build_Handoff_2026-11-23.md` §2. That supplement names its authority as the final master,
`HIVE_Master_Evolution_Build_Path_FINAL_Claude_Nemotron_2026-11-23.md` (file version 0, 85,231 bytes, 23 Nov 22:32:21 UTC).
The master itself is **not on disk**: it lives in the owner's ChatGPT library. The meanings below are taken verbatim in
substance from the supplement's §2 table.

Approving the architecture is **not** a spending grant, does **not** authorise inference, and does **not** activate
production. The BLOCKED(owner) note on D7–D11 in `sequencing_reconciliation.md` §1 is resolved by this file.

## Vector (owner-approved)
`D1=D D2=C D3=C D4=E D5=A D6=B D7=B D8=C D9=C D10=C D11=C`

| D | Meaning | Consequence here |
|---|---|---|
| D1=D | Native incumbent search plus controlled OpenEvolve/ShinkaEvolve qualification; at most one default | Keep one governed interface. External engines are qualified later through the same runner. |
| D2=C | Immutable DGM ancestry plus a bounded HIVE-owned MAP-Elites archive, preserving the global champion | `lineage.py` holds every attempt. The active archive is separate and bounded. |
| D3=C | Fixed, prompt-only and structure-only arms first; combined optimisation later | The first discovery work is structural composition. |
| D4=E | Protected context packets/routes, then static sparse topology comparisons, then optional learned/spectral adaptation | Finish context discipline before any topology work. |
| D5=A | Typed dependency/provenance projections over the existing transactional state | Store + RunStates + artifacts. No new DB or registry. |
| D6=B | Deterministic checks, finite/SMT obligations, and Lean for predesignated critical obligations | Freeze the verification class per campaign. Unknown or timeout ≠ pass. |
| D7=B | M0 mechanics → M1 one verified new effect → M2 two distinct effects in a fixed-weight local-model campaign | Report the three milestones separately. |
| D8=C | Selected task family → failure-driven opportunity ranking → independently checked generated curricula | Choose one real gap for M0/M1. Autonomous curricula come later. |
| D9=C | One elite per frozen niche plus the global champion; capped within-cell Pareto specialists only on measured need | A small fixed archive with trusted descriptors. |
| D10=C | Hard gates and raw metrics govern acceptance; ranking methods are compared only among eligible candidates | A composite score never offsets a failed gate. |
| D11=C | Register all mathematical branches; separately capped cheap offline experiments; integrate only after prerequisites and measured benefit | Not a dependency for M0/M1. |

Unselected alternatives stay in the master's branch register (supplement §9). Nothing is deleted.

## Phase crosswalk (dispatch by name, never by number)
| Local wording | Master meaning | Rule |
|---|---|---|
| "P2 genome/lineage" (`P2_LINEAGE_DESIGN.md`) | Part of the master's Phase 3 common proposal/execution seam | Already built: slice 1 (`lineage.py`) plus the compare hook. |
| "P3 capability discovery" | The master's Phase 3 seam (Gate B) **plus** Phase 4 discovery | Map work to Gate B / M0 / M1. |
| "P4 first verified evolutionary benefit" | The master's Phase 4 M0/M1/M2 | The local P4 gate (core proven) means **M1 accepted**. M0 alone does not meet it. |
| "Core proven at P4" (sensory gate, §4b) | Local restriction, not a master phase | Sensory and embodied work stays reference-only until M1 is accepted. Renaming a milestone does not unlock it. |
| "P2 quarantine" (prototype policy) | Existing quarantine on the prototype's P2 lane | Unchanged. Experimental selection never lifts it. |

## Finding ledger at 6127776 (reconciled)
- **Lifted:** FR-2, FR-8, SQ-6, BC-7.
- **Open (LOW/NIT, each with a compensating control):** SQ-1..5, SQ-7, SQ-8, BC-4, BC-5, BC-6, BC-8a/b/c, FR-3..FR-7. See `SECURITY_QUARANTINE.md`.
- FR-3 (holdout derived from the candidate's own source) is about **evaluation independence** and is separate from FR-2/FR-8. Gate D closes it for M1 by using new source-partitioned data. The 7 old items stay diagnostic history only.
- The A1 flake (`test_code_stop_inflight`) passed in the 856/3 full run at 6127776. It is recorded as **not root-caused**.
- Older backlog: cross-process ledger locking is DONE (A2), the OODA driver is DONE (A4/A5), and at-most-once dispatch is DONE.

## M0 legal surface (machine-checkable copy: `configs/m0_campaign_policy.json`)
- **Candidate kind:** a declarative workflow. It is a JSON list of 1–3 steps. Each step names a primitive from the frozen inventory. The kind allows no free source.
- **Inventory:** the existing text→text procedures in `experiment_compare.py`: `identity`, `scrub_lowercase`, `scrub_delete`. Each is pinned by the sha256 of its `inspect.getsource` text. Composition is sequential and output-type text→text, so any order type-checks. The canonical digest is sha256 of the canonical JSON step list. Duplicates are refused before execution.
- **Backend:** the compiled workflow source is *generated* (operator class `generated`), so it always runs on the Docker container backend. A label cannot change this (FR-9).
- **Outside the mutation surface:** the evaluator and oracles, frozen specs, expected outputs, receipts, the ledger, the policy file itself, `experiment_verify.py`, `experiment_tool.py`, and anything production (P0 incumbent, P2 quarantine).
- **Caps:**
  - at most 20 proposals per campaign and at most 3 steps;
  - 1 concurrent experiment (Windows/Docker contention);
  - at most 2 repairs per packet;
  - 0 model calls and 0 network calls.
- **Verification class (D6):** deterministic exact-output oracle, authored separately from the candidate. An unknown or timeout result is a failure.
- **Selection:** only into the disposable experimental campaign state. There is no production write.
