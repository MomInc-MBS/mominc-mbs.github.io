# HIVE CHECKPOINT: M1 protocol frozen (packet M1-0, 23–24 Nov 2026)

- **Runtime:** `build/working-prototype`. Protocol commit `af4b8d62b9b98d5f8d45742d248e23bb5db48598`; parent `c31fb698eb6838b049ba35d0a384ba441ccb8038` (M0). The pre-existing untracked `build/prototype-v04/*`, `integrations/*`, `build/m0/restart_result.json` and `build/m0/state.json` are preserved and unstaged.
- **Discrepancy recorded:** `BUILD_CHECKPOINT_M0.md` lists the M0 commit's parents as "fe06e4e and 6127776". Git shows one parent, `fe06e4eb87dfb01047edb590f8df4cceaad194af`. `6127776` is the parent of fe06e4e, not of the M0 commit, and is not a second parent. No other step is affected.
- **Publication:** unchanged. PR #58 / `e3fcce6`. M0 and M1-0 are not published.
- **Master / D vector:** unchanged (`HIVE_Master_Evolution_Build_Path_FINAL_Claude_Nemotron_2026-11-23.md` v0, 85,231 B, not on disk). Vector `D1=D D2=C D3=C D4=E D5=A D6=B D7=B D8=C D9=C D10=C D11=C`. Execution supplement imported as `docs/HIVE_POST_M0_BUILD_PATH_20261123.md`.
- **Gate D: frozen.** Protocol `m1-row-reconcile-v1`:
  - `docs/M1_PROTOCOL.md`: sha256 of the committed blob `6517f2e66615976ac2057faa3f44492ec543e638db9a9d63b9a97adec0106a26` (21,446 B); the working file matches.
  - `configs/m1_campaign_policy.json`: committed blob sha256 `4e3370d71f1f6de34782da687dc74b4e9ea325aaaaf8de45d857b1a3e8dc2215`. The working copy differs only by a trailing CRLF; the blob is authoritative.
- **§1 route:** thin views (`identity`, `parse_whole`, `split_rows`, `aggregate`) plus a generic `each(p)` combinator.
  - `normalize_header` and `dedupe_conflicts` would be new logic, so they are dropped. CSV header variance and duplicate ids are out of the family and registered for later.
  - The only claimed discovery is per-row isolation, found by type-directed enumeration over 3 legal workflows. `each` and the error channel are declared preparation, not discovery.
- **Review:** two independent Opus reviewer sessions, read-only.
  - Round 1: **BLOCKING**. The proposed `check_rows` view itself supplied the effect. It was redesigned, and the 8 minor items were fixed.
  - Round 2: **NON-BLOCKING**. Its 4 minor items were applied before commit.
- **Tests run:** none. This was a document/policy-only packet. The M0 evidence (865/3/0) still belongs to c31fb69.
- **Cost (measured from transcripts, list price, Opus 5.5):** conductor $2.40 + reviewer 1 $0.86 + reviewer 2 $0.76 = **$4.02** of the $5 M1-0 reservation. Runtime: 0 model calls, 0 network calls, $0. Cumulative is about **$58.6 of $120**. Reservation M1-0 is reconciled; the unused ~$1 is released. No other reservations are outstanding.
- **Context-ceiling overrun (recorded, not excluded):** reviewer packets read about 225–325k cached tokens against the master's 1,500-token reviewer input ceiling. The mandatory system context alone exceeds that ceiling. Later packets should hand reviewers excerpts, not whole files.
- **Open findings:** unchanged from M0 (SQ-1..5, SQ-7, SQ-8, BC-4..6, BC-8a/b/c, FR-3..7; A1 flake not root-caused). Trust limit unchanged: an unkeyed store writer can forge records (SQ-1). M1 runs as a trusted-local experiment.
- **Next single action:** packet M1-1E. A separate evaluator worker authors the F-final/F-reuse generators (G4–G6) and the independent oracle and validation fixtures, per protocol §4 and §6, in a private area. M1-1A (the views module, `each` and pins) can run concurrently on disjoint files. Search stays gated until both are pinned in `build/m1/evaluation_manifest.json`.

## Update: M1-1E + M1-1A done (24 Nov 2026): evaluation pinned

- **Evaluator (M1-1E, separate Sonnet worker; read nothing under `src/hive/`):**
  - Code: `evaluator/m1/oracle.py` (stdlib only), `gen_public.py` and `fixtures.py`; 15 hand-checked fixtures plus 5 wrong outputs, all of which were rejected.
  - Public data: F-dev 24 CSV (6 clean / 18 defective) and F-sel 20 JSON (4 / 16), in `build/m1/data/`.
  - Private data: F-final 60 (30 CSV / 30 JSON, 12 / 48) and F-reuse 20 (10 / 10, 4 / 16), in gitignored `.hive/m1-private/`, committed here by hash only.
  - Every case was admitted only after the generator record and an independent re-derivation agreed. No oracle failures and no blocking ambiguity (`build/m1/EVALUATOR_NOTES.md`).
- **Views (M1-1A, separate Sonnet worker; read nothing under `.hive/`, `evaluator/` or `build/m1/`):**
  - Code: `src/hive/m1_views.py` and `src/hive/m1_workflow.py`.
  - Type checker: 3 of the 584 lists are legal and 581 are refused. Unknown, depth-4 and duplicate lists are refused.
  - Equivalence checks pass, and Docker smoke tests ran for all 3 workflows (container output = in-process output).
  - Conductor-reviewed: no task logic in the views.
- **Tests run (conductor, this revision):** `tests/test_m1_views.py`, `tests/test_m1_oracle.py`, `tests/test_m0_workflow.py`: **40 passed**. The full suite was not run (not required at this gate).
- **Pre-search interface cross-check (F-dev only, logged in `exposure.jsonl`):** `W_strict` 6/24, `[identity,parse_whole,aggregate]` 6/24, `[split_rows,each(parse_whole),aggregate]` 24/24. No candidate has touched F-sel, F-final or F-reuse.
- **Manifest:** `build/m1/evaluation_manifest.json` pins:
  - the protocol and policy blobs;
  - the inventory and adapter hashes, and the 3 workflow digests;
  - the image `python:3.11-slim@sha256:07d48240…`;
  - the evaluator file and partition hashes, counts, custodian, access controls (trust assumption: same OS user, so the conductor can read private files) and retry rule.
- **Cost (measured, list):** evaluator $0.66 + views $0.61 + conductor about $0.85, so about **$2.12**, within the $10 reserved for M1-1E + M1-1A. Cumulative is about **$60.8 of $120**.
- **Next single action:** M1-2. Run the bounded search: arm 5 is enumeration (3 proposals) and arm 4 is 20 random draws. Evaluate on F-dev and F-sel through the container, append to `build/m1/candidate_attempts.jsonl`, and lock one nominee by the §7 rule. Then M1-3: the evaluator scores the nominee and arms 1–3 on F-final once.

## Update: M1 ACCEPTED (24 Nov 2026)

- **Outcome:** M1 is ACCEPTED, so local "P4 core proven" is now valid. The full report is `docs/M1_REPORT.md`.
- **Search** (at `d4252a8`): 3 legal variants were evaluated. The nominee `[split_rows, each(parse_whole), aggregate]` was locked before F-final was opened.
- **F-final:** 60/60, against 12/60 for `W_strict`; McNemar p = 3.6e-15.
- **F-reuse after restart:** 20/20, against 4/20; p = 1.5e-5.
- **Lifecycle:** rollback to `W_strict`, and all integrity checks passed (`all_ok`).
- **Reviewer:** the designated independent Opus reviewer ruled ACCEPTED, pending the cost record (now added) and the regression gate (passed: 900 passed, 3 skipped, plus 1 test-isolation fault that was fixed and rerun).
- **Cost:** M1 total is about $9.42 against a $24 cap; cumulative is about $64.0 of $120. Runtime: 0 model calls, 0 network calls, 11 container runs.
- **Publication:** unchanged (PR #58 / `e3fcce6`). The owner said not to publish for now.
- **Next single action:** fix the policy-pin line-ending fragility, then freeze the M2 protocol (an actual fixed-weight local-model campaign showing repurposing plus composition).
