# HIVE v0.4.x build checkpoint — 23 Nov 2026

Start every new session from this file and `docs/sequencing_reconciliation.md`. Do not carry the previous conversation forward.

## 1. Commit and verified baseline
- **Repo** `D:/Repos/hive-ai`, branch `build/working-prototype`.
- **Commits:** last code commit `89a1118`. HEAD `1ba42f9` (plus this checkpoint commit) changes docs and evidence only.
- **Campaign range:** `0e54412..HEAD`, starting from `1116f10`.
- **Full suite on 89a1118:** **821 passed, 3 skipped, 1 failed** in 53 min (`build/v04x/full-suite-89a1118.log`).
  - **The failure** is `tests/adversarial/test_code_isolation.py::test_code_stop_inflight_kills_worker_and_does_not_fake_success`: a 20 s subprocess timeout on a Docker code mission while the machine was under full-suite load.
  - Nothing in this campaign touches that path. The file passed **27/27 three times in a row** when run on its own, so it is recorded as a **load-sensitive flake, not fixed**.
  - The 3 skips are pre-existing.
- **Baseline growth:** 689 tests passed at `25f19b2`; 822 run now (821 passed + 1 flake).
- **How to run tests:** use `python -m pytest -q -p no:cacheprovider --basetemp=D:/tmp/<short>`. Use a short basetemp, because long Windows paths break. Run only **one** suite at a time, because concurrent runs share basetemp and delete each other's temp dirs.

## 2. Acceptance gates (directive `docs/NEXT_BUILD_V04X_DIRECTIVE.md` §5)

| Gate | Status | Evidence |
|---|---|---|
| A1 baseline recorded, suite green | **PASS with disclosed flake** | §1 |
| A2 multi-process ledger | **PASS** (independent) | `build/v04x/BC_REVIEW.md`, fixes `1269931`; at-most-once `ff9141c`/`99674a2`/`bee8da6` (`R_REVIEW.md`) |
| A3 MODEL_ROUTE on dispatch, shadow | **PASS** (independent) | `BC_REVIEW.md`; `src/hive/model_route.py` |
| A4 real pinned Git source through OODA | **PASS** (independent) | `D_REVIEW.md`, `D_run*/` |
| A5 STOP/restart/replay, zero duplicates, hash-linked | **PASS** (independent) | `DF_REVIEW.md`, `FINAL_REVIEW.md`, `D_run3/` |
| A6 candidate vs baseline, honest decision | **PASS** (independent) | `FIX_RECHECK.md`, `E_run2/` (E_run superseded) |
| A7 prior live demo reviewed | **PASS** | `A_LIVEDEMO_REVIEW.md` + owner attestation `A_OWNER_ATTESTATION.md`; relabelled `OPERATIONAL_PROTOTYPE_DEMONSTRATED` (`0ed9f1c`) |
| A8 Level A packet + compounding protocol | **PASS (prepared)** | `docs/LEVEL_A_SOURCE_APPROVAL.md` (owner: **Option A only**, manifest `1125b032…`), `docs/COMPOUNDING_PROTOCOL.md` |
| A9 cost / usage / hashes reported | **PASS** | §4 |

**Release label:** `ENGINEERING_AUTONOMOUS_EXPERIMENT_DEMONSTRATED`. A1–A6 pass, with independent review of the new experiment and the A1 flake disclosed.

**Not earned:** `BENEFICIAL_LEARNING_DEMONSTRATED`, `LEVEL_A_ACCEPTED`, `LEVEL_B_ACCEPTED`.

## 3. Candidate-versus-baseline result (`build/v04x/E_run2/`, `result_sha256 e0d0ad5e…`)

Candidate `C1-lowercase-forbidden-article` was derived from the real failpath diagnosis (country-list `02b3e31c`).

| Arm | Held-out passes (n=7) |
|---|---|
| C1 candidate | 5 |
| Strongest deterministic baseline `tool_scrub_delete` (preregistered rule) | 5 |
| P0 (incumbent, unchanged) | 1 |
| Learning-disabled control | 1 |
| Fixed-specialist route | N/A: no approved model route |

- **Decision: `REJECT_NO_GAIN`**. The candidate ties the strongest baseline and stays QUARANTINED. Nothing was promoted.
- **Why it ties:** C1's repair reproduces the repo's own later commit byte for byte, and a plain regex tool does the same.
- **Cost of the run:** 0 model calls; 4 network requests, which equals the 4 packs on disk; 8,096 blob bytes.
- **Held-out items are ENGINEERED variants of the candidate's own source.** The gate therefore reports `holdout_unused_for_learning=false` (FR-3), and n=7 supports no population claim.

## 4. Cost (agent engineering vs HIVE runtime)

- **HIVE runtime:** **0 model requests, 0 generated tokens, $0 inference** this campaign. Network fetches came only from allowlisted pinned GitHub sources (country-list, plus Level A verification by the F worker via `gh api` and `git fetch`).
- **Agent engineering:** measured from the 15 local Claude transcripts with `scripts/agent_usage_tally.py` (`build/v04x/agent_usage_tally.json`). Codex was out of usage all campaign and contributed $0 and 0 work.

| Model | Uncached input | Cache write | Cache read | Output | List USD |
|---|---|---|---|---|---|
| Opus 5.5 | 751 | 1,182,301 | 60,251,115 | 288,223 | 27.28 |
| Sonnet 5.5 | 582 | 1,129,616 | 44,655,328 | 388,124 | 12.87 |
| **Total** | 1,333 | 2,311,917 | 104,906,443 | 676,347 | **$40.14** |

- **What the USD figure is:** list-price equivalent ($/MTok: Opus 4 / 8 cache-write (1h) / 0.20 cache-read / 20; Sonnet 2 / 4 / 0.10 / 10). At the 5-minute cache-write rate it would be about $34.4. It is not the actual bill, which depends on Ian's plan; actual provider charges are **unknown**.
- **Cache economics:** cache reads are 99% of input tokens and about 41% of list cost. Workers' self-estimates (0.14–0.9M each) badly under-counted cache reads; use the tally script, not self-reports.
- **Moving cap:** the soft cap moved to about $90 through verified-progress windows, against the owner hard ceiling of **$120**. There were no two consecutive no-progress windows. This checkpoint adds a little conductor spend.

## 5. Remaining experimental work
- **Must fix before any learned, generated or code candidate (evolutionary campaign):** **FR-2**, candidates still run in the evaluator's process. See `docs/SECURITY_QUARANTINE.md`.
- **Open quarantine items:** SQ-1..5, SQ-7, SQ-8, BC-4..BC-8c, FR-3..FR-7 (all LOW/NIT; each lists a compensating control and a lift condition). SQ-6 and BC-7 are lifted.
- **Level A (owner-approved, Option A tool-only, manifest `1125b032…`):**
  - **Run status:** not run.
  - **Missing before it can run:** verifiers for the 3 JSON/YAML sources, plus adapters and private oracles for the 6 Python snapshots (the 3 CSVs pass `csv_profile_v1`).
  - **Where it runs:** separate store `.hive/level-a/` and report `build/level-a/`. It **must never** share a store, candidates or partitions with the evolutionary campaign.
- **Level B:** untested.
- **Compounding:** the protocol is preregistered, but phase-2 tasks are not selected.
- **Other open items:**
  - The A1 flake (raise the timeout or mark the test load-sensitive).
  - The public site (`mominc.online/hive/`) has **not** been updated with this campaign yet (AGENTS.md asks for it after verified milestones).
  - Master decisions D7–D11 cannot be resolved from the repo (see reconciliation).

## 6. Exact resume instructions (fresh, bounded session)
1. `cd D:/Repos/hive-ai && git checkout build/working-prototype && git log --oneline -1`. Expect this checkpoint commit. `git status` must show only untracked `build/prototype-v04/*` and `integrations/*` (pre-existing).
2. Read **only** this file, `docs/sequencing_reconciliation.md`, `docs/MASTER_SEQUENCING_PATCH_20261123.md` §4–§9, and `docs/SECURITY_QUARANTINE.md` FR-2. Do not read the build/v04x reports unless a task needs one.
3. **Sanity check (about 3 min):**
   - `python -m pytest -q -p no:cacheprovider --basetemp=D:/tmp/rs1 tests/test_experiment_compare.py tests/test_experiment_driver_security.py tests/test_dispatch_at_most_once.py`
   - `python -m hive --store build/v04x/D_run3/store ooda verify --experiment-id <id from build/v04x/D_run3/store/experiments> --manifest experiments/v04x/country-list-pass.json`, which must report `ok` and `anchored`. The D_run3 store is gitignored and local only. If it is missing, re-run the proof in `build/v04x/D_run3/a5_real_proof.py`.
4. **First, publish** this checkpoint to the public HIVE site, per AGENTS.md (`docs/sequencing_reconciliation.md` §5). Verify the live URL. **Then the next bounded task: Phase 1 / FR-2 evaluator isolation** (packet in `docs/sequencing_reconciliation.md` §3).
   - **Team:** one Sonnet implementation worker plus one independent Opus reviewer. Nemotron and Haiku only for grunt inspection, given exact paths. **No Grok.** Codex usage resets 28 Nov.
5. **Budget:**
   - **Agent spend:** a new campaign window under the moving cap in `.hive/agent-budget.json`. The hard ceiling stays $120 unless Ian raises it, so record cumulative spend from this checkpoint's $40.14.
   - **HIVE runtime:** tool-only; no model calls without a new exact approval.
   - **Measurement:** use `scripts/agent_usage_tally.py <transcripts dir> "<campaign marker>" <conductor session id>`.
6. **Do not edit** `src/hive/experiment_verify.py` or `src/hive/experiment_tool.py`: they are frozen by hash, and editing them breaks D_run3/E_run2 verify. Normalize worker files to LF before commit. Never run two full suites at once.
