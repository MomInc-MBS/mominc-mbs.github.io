# M1 report: `m1-row-reconcile-v1`

**Outcome: M1 ACCEPTED (24 Nov 2026). Local "P4 core proven" is now valid.**

This was decided under the frozen protocol `docs/M1_PROTOCOL.md` (blob sha256 `6517f2e6…` @ `af4b8d6`) by the designated independent Opus reviewer, together with the conductor's regression gate.

## Claim allowed (reviewer's wording)

Under protocol `m1-row-reconcile-v1`, deterministic type-directed enumeration searched a pinned inventory of thin views plus the declared-preparation `each` combinator. It registered `[split_rows, each(parse_whole), aggregate]`. That workflow's row-level quarantine output on synthetic `grouped_inventory_v1` sources was independently oracle-verified at 60/60 on held-out data, against 12/60 for the existing workflow. After a restart it was reused 20/20, and it was then rolled back to `W_strict`. The solution was known to the designers. **No claim is made about search difficulty, real-world data or generality.**

## Versions

| Item | Identity |
|---|---|
| Runtime base | `build/working-prototype`: protocol @ `af4b8d6`, M1-1 @ `010a8fd`, search @ `d4252a8`, evidence @ `7de2dec` |
| Master / vector | unchanged; `D1=D D2=C D3=C D4=E D5=A D6=B D7=B D8=C D9=C D10=C D11=C` |
| Evaluation manifest | `build/m1/evaluation_manifest.json` (sha256 `d6fb0058…`) plus `manifest_addendum_M1-2.json` |
| Container image | `python:3.11-slim@sha256:07d48240…` |
| Nominee | digest `1b9892c5…e93cb`, genome `f96171a2…` |

## Raw results

| Arm | F-dev (24) | F-sel (20) | F-final (60) | F-reuse (20) |
|---|---:|---:|---:|---:|
| 1 `W_strict` = `[parse_whole, aggregate]` | 6 | 4 | 12 | (control) |
| 2 learning disabled (= `W_strict`) | — | — | 12 | 4 |
| 3 strongest without `each` (= `W_strict`, tie on fewer steps) | 6 | 4 | 12 | — |
| `[identity, parse_whole, aggregate]` | 6 | 4 | — | — |
| 4 random search (20 draws of 584 lists) | 0 of 20 draws type-check: "none in 20" | | | |
| 5 nominee `[split_rows, each(parse_whole), aggregate]` | 24 | 20 | **60** | **20** |

- **F-final:** Δ = +80 points; exact one-sided McNemar b = 48, c = 0, p = 3.6e-15. The nominee passed 100% in every defect category (1–5) and on the clean files. `W_strict` passed only the 12 clean files.
- **F-reuse, after a restart in a new process:** 20/20 against 4/20; b = 16, c = 0, p = 1.5e-5.
- **As protocol §9 notes,** the margin mostly confirms the clean/defective mix plus the nominee's exact correctness on defective files.

## Lifecycle and integrity (`build/m1/restart_reuse_rollback.json`, `all_ok: true`)

- **Selection:** used the parent-written ACCEPTED evidence.
- **Restart:** a new pid. Lineage, pins, source and manifest were verified, and the selection resolved to the nominee from stored state.
- **Rollback:** appended (history: select, rollback); the selection resolves to `W_strict`, and 3 post-rollback cases matched the control.
- **Refused:** selection of a REJECTED variant; forged self-consistent, tampered and stale receipts; unknown, depth-4, type-failing and duplicate proposals (before execution).
- **Oracle:** rejected all 5 wrong-output fixtures.

## Regression gate

- **Full suite at evidence commit `7de2dec`:** 900 passed, 3 skipped, **1 failed** in 40.6 min (`build/m1/full-suite.log`; the first failure is preserved).
  - The failing test was `tests/test_m1_views.py::test_propose_refusals_before_execution`. It asserted that the process-global `STATS["docker_runs"]` was 0, but `test_m1_campaign.py` runs Docker earlier in the same process. This was a test-isolation fault, not an M1 behaviour fault.
  - The test was fixed to compare the counter before and after.
  - A targeted rerun in the same order (campaign → oracle → views → M0) passed 45 (`build/m1/rerun-after-fix.log`).
- **No regressions:** the M0 T1/T2 and structured-mission tests all passed in the full run.
- The full suite was not rerun, because a test-only fix is not a material change.

## Cost

| Packet | Engineering (list, measured from transcripts) | Cap |
|---|---:|---:|
| M1-0 protocol + 2 reviews | $4.02 | $5 |
| M1-1E evaluator + M1-1A views | $2.12 | $10 |
| M1-2 search (discovery) | ~$1.59 (worker $0.99 + conductor ~$0.60) | $3 |
| M1-3 + M1-4 final, lifecycle, review (execution) | ~$1.69 (reviewer $1.09 + conductor ~$0.60) | $6 |
| **M1 total** | **~$9.42** | $24 |

- **Runtime:** 0 model calls, 0 network calls, 11 container runs (cap 120), $0.
- **Discovery vs execution:** 6 container runs for search, 5 for final and lifecycle.
- **Cumulative:** about $64.0 of the $120 owner ceiling. The conductor's split between packets is estimated from the change in session totals.

## Negative evidence and limitations

- **Round-1 protocol review was BLOCKING:** the first design's `check_rows` view supplied the effect. It was redesigned before freeze.
- **The space is tiny:** 3 workflows type-check. Random search found none in 20 draws, but no claim of search skill is made.
- **Synthetic data only:** CSV header variance and duplicate-id abstention are out of the family and registered for later.
- **Inadvertent conductor read:** the conductor read the first 200 characters of F-final case `fin-00` before search began, while checking the record format. This is logged, but without a timestamp. It is not a §7 trigger: the proposer is deterministic and no candidate was involved.
- **Pre-search adapter change:** the adapter hashes changed before search (a batch envelope was added); the inventory pins are unchanged (see the addendum).
- **Policy pin line endings:** receipts bind the working-tree policy bytes `074c46…` (a trailing CRLF), while the manifest and freeze record the LF blob `4e3370…`. The content is identical. A fresh Windows checkout would change the line endings and fail the stale-pin check. The fix (next packet): pin over LF-normalized bytes or add `.gitattributes`. The evidence is not edited.
- **Arm 2 is hardcoded** to `W_strict` rather than reached through a skill-off selection path. The result is the same.
- **`final_result.json` says `"ACCEPTED"`** for the benefit check alone, written before this review. The milestone outcome is this report.
- **Trust limit:** an unkeyed store writer can forge records (SQ-1). The private holdout is a gitignored folder owned by the same OS user. Open findings are unchanged from M0.

## Next action

Lock the M2 protocol for an actual fixed-weight local-model campaign with two effects, repurposing and composition (master §10.1). Before that, fix the policy-pin line endings.
