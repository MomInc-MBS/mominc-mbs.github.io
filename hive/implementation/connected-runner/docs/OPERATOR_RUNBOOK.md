# HIVE Operator Prototype runbook (24 Nov 2026)

Run two retained, independently verified M2 capabilities on your own CSV/JSON files through the
normal HIVE path: registry selection -> evidence check -> pinned container -> independent oracle ->
download. Zero model calls. Scope: trusted local experiment (not production-approved).

## Prerequisites (Windows host, as tested)

- Python 3.11+ on PATH (no extra packages).
- Docker Desktop running, with the pinned image present:
  `docker pull python:3.11-slim@sha256:07d4824036af339fa1b6ef769cc99d9c10a141769538b52b3b597c84f7a7b535`
- No model server is needed.

## Launch (one command)

From the repository / extracted package root:

```
scripts\hive-operator.cmd D:\HIVE-operator-inputs
```

It imports `build/operator/capabilities_m2.json` into `.hive/operator` (idempotent; refuses a bundle whose
artifacts do not re-hash or whose capabilities differ from the pins in `configs/operator_policy.json`),
then serves `http://127.0.0.1:8765/` and opens an authenticated browser tab. A busy port fails closed;
pass another port as the second argument. Equivalent: `set PYTHONPATH=src` then
`python -m hive --store .hive/operator operator launch --allowed-root <folder>`.

The inputs folder must be outside the store. Only `.csv`/`.json` files under it are listed.

## Recipe 1 - convert one file to canonical JSON

1. Put a file with columns `id,group,bytes` in the inputs folder, or make one from any folder:
   `python -m hive operator snapshot-dir <folder> --out <inputs>\my-folder.csv --group-by ext`
   (adapter `inventory-snapshot-v1`: engineering preparation, not a learned capability; max 256 files).
2. In the console choose **Convert**, select the file, **Run task**.
3. Result card: VERIFIED + `converted.json` + `report.json`. Any bad row = whole file REJECTED with the reason.

## Recipe 2 - merge a batch with whole-file quarantine

1. Select 2-20 files (Ctrl/Shift-click) and choose **Merge**.
2. Valid files are merged into per-group count/bytes; each invalid file is quarantined whole with its first
   failing row's reason (no row salvage). Download `merged.json`.

## Behaviour you can rely on

- Same operation + same files = saved-result replay: no new execution; `replays` counter increments.
- STOP (console) prevents execution; tasks submitted while stopped are STOPPED. Resume, then resubmit.
- A crash mid-task leaves it INTERRUPTED after restart; resubmitting executes it once.
- Registry: **Roll back** selects the previous permitted version (the M2 baseline, which cannot perform
  these operations, so tasks are refused with 0 executions); **Re-select accepted** restores it.
  History is append-only.
- Evidence is re-verified on every task: stale protocol/policy/manifest/inventory/prompt pins, a tampered
  receipt or genome, a revoked version, a disallowed scope or a version other than the policy pin is refused.
- Unknown operations are recorded as missing-capability opportunities; no discovery run is started.

## Input contract (derived from `structured_verifier.parse_source` and `evaluator/m2/oracle.py`)

- UTF-8 without BOM; at most 2 MiB per file (2 MiB total for a batch).
- CSV header exactly `id,group,bytes`, 3 fields per row. JSON: array of objects with exactly those keys.
- 1-256 rows; `id` unique non-empty string <=128 chars; `group` non-empty string <=128 chars;
  `bytes` integer 0..1,000,000,000 (CSV canonical decimal: no sign, no leading zeros).

## CLI

`python -m hive --store .hive/operator operator status|readiness|import|run convert|merge <files> --allowed-root <dir>|rollback <op>|reselect <op>|revoke <op>`

## Reproduce the acceptance journeys

`set PYTHONPATH=src` then `python scripts/operator_demo.py --inputs <empty dir> --store .hive/operator-demo --out <out dir>`
(uses port 8781; writes `journeys.json`, `checks.json`, `provenance.json`, `reference.json`).
Unit checks: `python -m pytest tests/test_operator_runtime.py -p no:cacheprovider --basetemp=<short dir>`.

## Goals, discovery, admission, dispatch (C1-C5)

- Goal: `python -m hive --store .hive/operator operator goal "<text>" <files> --allowed-root <dir> [--deliverable inventory_diff] [--allow-discovery]`
  (console: POST /api/operator/goal). A missing capability is recorded as a gap; with `--allow-discovery` ONE bounded experiment is queued.
- Discovery (local LM Studio only; `lms load openai/gpt-oss-20b --context-length 32768 --gpu max` first): `operator discover run <exp_id>`, `operator discover list`.
  Budget, approval and evaluator pins are frozen at open (`build/c-series/c3_inference_approval.json`); `lms unload --all` afterwards.
- Admission (authority key stays outside the repo in `%USERPROFILE%/.hive-admission`): `python scripts/hive_admission.py init` once, then
  `admit --store <store> --exp <exp_id>`, `revoke --store <store> --cap inventory-diff --version N --reason "..."`, `rollback --store <store> --cap inventory-diff`.
  Admitted capabilities are reused on new inputs with zero model calls; a revoked one leaves the goal UNRESOLVED with no execution.
- Dispatch: `configs/model_dispatch.json` (class `c3-proposal`: shadow | canary | active, qualified models, P0 fallback). Default is shadow.
- Full journey: `python scripts/c6_acceptance.py` (writes `build/c-series/c6-run/summary.json`; needs Docker and LM Studio).
