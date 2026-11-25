---
id: HIVE-OPERATOR-PROTOTYPE-2026-11-24
schema_version: "1.0"
title: "HIVE Operator Prototype: retained M2 capabilities on real inputs, 24 November 2026"
date: 2026-11-24
status: "operator-usability-demonstrated; trusted local scope; not production-approved; not a new research acceptance"
project: HIVE
artifact_type: evidence_report
priority: high
---

# Operator Prototype: use the retained M2 capabilities on your own files (24 Nov 2026)

This follows the [M2 note](/hive/notes/M2/). M2 showed that a local model could propose two workflows that HIVE then verified, kept and reused. This build puts those two kept workflows behind the ordinary HIVE operator path, so a person can launch HIVE, pick a file, run a task, get an independently checked result, restart, and run another file.

**What this is:** a usable local operator path with evidence. **What it is not:** a new held-out study, Level A or Level B, general CSV/JSON support, a search-skill result, or a production approval.

## Launch

From the runtime package root (Windows, Python 3.11+, Docker with the pinned `python:3.11-slim` image; no model server needed):

```
scripts\hive-operator.cmd D:\HIVE-operator-inputs
```

It imports the accepted capabilities (idempotent) and opens `http://127.0.0.1:8765/` with a local session token. The runbook is `docs/OPERATOR_RUNBOOK.md` in the package.

## The two operations

| Operation | Capability (from M2) | Behaviour |
|---|---|---|
| Convert a file to canonical JSON | `row-convert-v1`, steps `parse_whole -> to_json` | Any bad row rejects the whole file, with the reason. No row salvage. |
| Merge a batch with whole-file quarantine | `batch-merge-v1`, steps `each(parse_whole) -> aggregate` | Valid files are merged into per-group count and bytes. Each invalid file is quarantined whole, with the reason of its first failing row. |

**Input contract** (taken from the parser and the oracle, not broadened): UTF-8 without a BOM; at most 2 MiB; CSV header exactly `id,group,bytes`; JSON array of objects with exactly those keys; 1 to 256 rows; unique non-empty ids and non-empty groups up to 128 characters; `bytes` an integer from 0 to 1,000,000,000 (CSV: canonical decimal). Batches take 2 to 20 files. To make such a file from any folder there is an explicit preparation adapter, `inventory-snapshot-v1` (`hive operator snapshot-dir`). It is engineering preparation, not a learned capability.

## How a task runs

1. **Intake.** The file is read from the permitted folder. An immutable copy and its SHA-256 go into the store. The task identity is the operation plus the ordered file names and hashes.
2. **Selection.** The operator registry (an append-only chain per operation) resolves the current version and re-checks its evidence every time: genome hash, receipt hash, current protocol/policy/manifest/inventory/prompt pins, the pinned accepted version, allowed scope, revocation and type fit. Anything stale, tampered, revoked, out of scope or incompatible is refused.
3. **Execution.** The stored genome body runs in the pinned container (no network, read-only, non-root). Zero model calls.
4. **Independent check.** `evaluator/m2/oracle.py`, written separately from the runtime, recomputes the expected output from the input bytes in a separate `python -I` process. Only PASS outputs are exported.
5. **Result.** You get the verdict, accepted and quarantined counts, the download, and an expandable trace (capability and genome, input and output digests, evaluator pin, timings, container runs).

Same operation plus same files returns the saved result with no new execution, but only while the same capability is still eligible and the evaluator pin is unchanged. After a revoke or rollback it runs through selection again.

## Demonstration on real inputs (24 Nov)

Inputs were real first-party folders of the HIVE repository (`docs`, `configs`, `scripts`, `evaluator`, `src/hive`), turned into inventory files by the preparation adapter. The independent reference was PowerShell's own recursive file listing of the same folders (a different tool, no HIVE code). One defective file was derived from a real one by setting one size to `-5`; it is labelled `DERIVED-`. No model saw any input. Every journey went through the real launch command and the console HTTP API, with a full process restart in the middle.

| Journey | Result |
|---|---|
| Fresh conversion (68-row docs inventory) | VERIFIED; oracle PASS; downloaded JSON equals the PowerShell reference |
| Mixed batch (4 files, 1 derived defect) | VERIFIED; the derived file quarantined whole ("bytes must be a canonical nonnegative decimal integer"); merged group totals equal the PowerShell reference over the 3 accepted files |
| Unsupported inputs | BOM file, one-file merge, unknown operation, path outside the folder, `.txt` file: each refused with a precise reason, nothing executed |
| STOP and resume | Task submitted under STOP recorded STOPPED with 0 executions; after resume the same task ran once and verified |
| Crash mid-task | Server killed while RUNNING; after restart the task shows INTERRUPTED; resubmitting ran it once and verified |
| Restart, different input | New process; the retained capability was loaded from the store and executed (+1 execution, 0 model or proposal calls), oracle PASS, matches the reference |
| Exact replay | Same task id, same artifacts, execution and container counters unchanged, replay counter +1 |
| Rollback | Rollback selected the previous permitted version, the M2 baseline, which cannot convert: the task was refused with 0 container runs. Re-select restored the accepted version and the next task verified. History kept all three events |
| Revoke | After revoking the merge capability, resubmitting the earlier verified batch was **not** replayed: refused, 0 executions |

Final counters: 7 container runs started, 6 completed executions (the 7th was the deliberately killed one), 0 model calls, 0 proposal calls, 1 replay. The same journeys were also checked in the browser UI, including a download.

Stale-pin, tampered-receipt, tampered-bundle, wrong-scope and failed-verification refusals are covered by unit tests (`tests/test_operator_runtime.py`), not by the live journeys.

## Limits

- **Trusted local scope only.** The capabilities are marked `trusted_local_experiment` and `production_approved: false`. The SQ-1 store-writer weakness and the same-user holdout boundary from M2 are unchanged.
- **Narrow contract.** Only the `id,group,bytes` inventory shape. Real files of other shapes need an explicit adapter.
- **Rollback here is a disable.** The only earlier permitted version is the M2 baseline, which cannot perform these operations. No second accepted version exists yet.
- **Docker image check is bounded to 5 s.** On a heavily loaded PC it can fail closed (EXECUTION_FAILED); resubmitting retries.
- **Usability, not research.** These demonstrations do not satisfy Level A, Level B or a new held-out study. The independent oracle is the same M2 oracle; the PowerShell listing is the extra outside reference.
- Tested on one Windows 11 host with Docker Desktop.

## Review

An independent read-only reviewer (Opus) returned ACCEPT WITH FIXES with no blockers. All should-fix items were fixed before packaging: replay now respects revocation and pin changes, failed checks are not cached, unverified output is never parsed or shown as a result, verifier timeouts are handled, registry writes are transactional, STOP during execution discards the output, and session tokens are redacted from the evidence.

## Identity

<!-- identity:start -->
- Runtime commit: `c7683fe82f5e7a5527b5bf70b93edcde3b7d5d40` (repository `hive-ai`, local). Evaluated revision for the regression gate: `f65d950ae3fd7dca3dbdbff9252b3567d083af87`.
- Regression gate on the evaluated revision: 1042 passed, 3 skipped, 0 failed on f65d950 (89 min); then a one-line readiness display fix with focused tests 39 passed, 1 skipped; clean-launch of the exported package VERIFIED/PASS.
- Package: [`HIVE_Operator_Prototype_c7683fe.zip`](/hive/downloads/HIVE_Operator_Prototype_c7683fe.zip), SHA-256 `4fa79b889dae9c4e519f50b02f9dc3e959ed918b4420cd682cce60ffda227e6f`. Publication manifest: [`operator-prototype-publication.json`](/hive/implementation/operator-prototype-publication.json).
- Capability bundle `build/operator/capabilities_m2.json`, SHA-256 `8d2a608e5678ef14581819a091eab17673f4133477f78911dc5a865be123a736`. Accepted genomes: convert `5ac1c937...`, merge `a06169a5...` (pinned in `configs/operator_policy.json`).
- Historical references: M2 runtime `1799c58`, protocol `d4b71d2`, M2 publication PR #69.
<!-- identity:end -->

## Cost

Coding agents this build, list price: about $12 (conductor about $10.3, independent reviewer $1.5), so the cumulative estimate is about $97 of the $120 ceiling. That cumulative figure carries forward the M2 report's estimate (about $85); it is not a reconciled ledger. Runtime: 0 model calls, $0; local container runs only.

## Next

The next pressure experiment is one bounded discovery problem chosen from real failure records, with a richer inventory where search actually matters. It is not authorised by this build.
