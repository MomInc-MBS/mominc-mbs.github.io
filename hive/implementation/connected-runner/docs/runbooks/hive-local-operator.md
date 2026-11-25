# HIVE local operator runbook

Consolidated only from existing docs. Every command below is copied from the
source doc named in its section. No flags were added. Run from the repository
root (`D:\Repos\hive-ai`, branch `build/working-prototype`) with Python 3.11+.

Sources (abbreviations used below):

- **RUN** = `docs/RUN_HIVE.md`
- **RUNBOOK** = `docs/HIVE_RUNBOOK.md`
- **OPS** = `docs/OPERATIONAL_PROTOTYPE.md`
- **CONSOLE** = `docs/PROTOTYPE_CONSOLE.md`
- **CTX** = `docs/CONTEXT_GOVERNANCE.md`

Standing rules from the docs: a live model call needs a separate operator-owned
approval file (CONSOLE, OPS). Budgets are never refilled by resume, replay or a
new store (RUN, RUNBOOK, CONSOLE). Fixture success is not acceptance (RUN).

## 1. Start the console

Set the import path, then start the local console. The store must sit outside
the allowed input directory (CONSOLE).

```powershell
$env:PYTHONPATH = "$PWD\src"
python -m hive --store .hive/operator-console console --allowed-root D:\HIVE-inputs
```

Source: CONSOLE, "Run from `D:\Repos\hive-ai`". It binds `127.0.0.1:8765` and
opens an authenticated local browser. Use `--port` for another port.

Health check before a live session (read-only, no generation):

```powershell
python -m hive doctor --offline
python -m hive doctor --config configs/local.json
```

Source: RUN, "Bootstrap and health". Offline doctor contacts neither Docker nor
model endpoints. Online doctor does not prove sandbox enforcement.

Live-approval variant (only with a real, separate approval file; source: CONSOLE,
"Finite inference approval"):

```powershell
python -m hive --store .hive/approved-demo console --allowed-root D:\HIVE-inputs --approval D:\HIVE-approvals\demo.json
```

Without `--approval` the allocation is zero model requests and zero generated
tokens (CONSOLE).

Conflict: OPS starts the console with
`python -m hive --store .hive/prototype-v04-console console --allowed-root .hive/prototype-v04-final-inputs/inputs`.
See section 9.

## 2. Submit a mission

### 2a. From the console (browser)

Select a file already under `--allowed-root`, choose a form, then submit.
Resubmit the identical form to continue or validate saved evidence. A changed
source or contract needs a new mission ID (CONSOLE, "Forms and supported source
contracts"). Registered prepared missions keep their approved mission ID.

### 2b. From the CLI (operator demo, code mission)

```powershell
python -m hive --store .hive/operator-demo/code-store mission run --manifest .hive/operator-demo/code-mission.json --config .hive/operator-demo/tool-config.json
```

Source: RUN, "Both task families through one controller" (the three exact
invocations are code, video and combined). Manifests are produced with
`--prepare-only`. Video and combined invocations are in the same RUN section.
Reusing a completed store with changed inputs is refused (RUN).

Preparing the public demonstration (zero model calls, writes manifests only):

```powershell
$env:PYTHONPATH = "$PWD\src"
python scripts/prepare_operational_demo.py
```

Source: OPS, "Run locally". It does not call a model or grant approval.

Run the operator demo fixture itself (needs Docker and the pinned image):

```powershell
docker pull python@sha256:07d4824036af339fa1b6ef769cc99d9c10a141769538b52b3b597c84f7a7b535
python scripts/readiness_demo.py --work .hive/operator-demo
```

Source: RUN, "Both task families through one controller". The receipt is
`.hive/operator-demo/demo-report.json`.

## 3. STOP / emergency-stop

Two different mechanisms exist. Do not conflate them (see section 9).

### 3a. Mission STOP (runtime stop file)

```powershell
python -m hive --store .hive/operator-demo/code-store stop
python -m hive --store .hive/operator-demo/code-store status
```

Source: RUN, "STOP, recovery, review and restore"; RUNBOOK, "Restart, STOP and
policy restoration" (same commands). STOP preserves spent reservations. The
console Pause and STOP controls create this same runtime STOP file (CONSOLE).

### 3b. Context emergency-stop (policy)

```
hive context emergency-stop --reason "..."
hive context clear-emergency-stop
```

Source: CTX, "CLI". Per CTX, this activates the runtime stop flag that blocks all
dispatch until cleared. Both docs write `hive` without `python -m`; use the form
as written and do not invent a variant.

## 4. Resume

```powershell
python -m hive --store .hive/operator-demo/code-store resume
# Rerun the identical mission command above; budgets are not replenished.
```

Source: RUN, "STOP, recovery, review and restore". Also RUNBOOK ("Restart, STOP
and policy restoration"): `python -m hive --store <store> resume`.

Rules from the docs:

- Resume clears STOP after the worker exits and requeues interrupted work
  without changing caps (CONSOLE).
- An interrupted model call with no completed receipt requires reconciliation
  and cannot silently dispatch again (RUN, "STOP, recovery, review and restore"
  describes reconciliation for a terminal stage; CONSOLE describes requeue).
- Resume must use the same frozen source the store was created with (OPS,
  "Run locally": "Run from the same frozen source when resuming"). A store with a
  changed source is refused (RUNBOOK, "Two source identities").

## 5. Replay (zero-call)

Public evidence replay. Needs no model, private database, network access or
allocation:

```powershell
$env:PYTHONPATH = "$PWD\src"
python scripts/replay_integration_export.py
```

Source: RUNBOOK, "replay" at the top ("Start with the public evidence
replay"); RUN, "Bootstrap and health". Expected: eleven verified jobs, 43 hashed
artifacts, candidate `REJECTED`, zero new model calls (RUNBOOK).

Readiness export replay (no dispatch):

```powershell
python scripts/replay_readiness_exports.py
```

Source: RUN, "Bootstrap and health". Checks public file hashes and operator job
bundles.

Replay of an operator mission: rerun the identical command from section 2b. A
completed store returns saved evidence and does not spend a new allocation
(RUN, "Both task families"; CONSOLE, "Resubmit the identical form to continue or
validate saved evidence"). Completed evidence is checked, not silently rerun
(RUN, "STOP, recovery, review and restore").

Historical completed-store replay (zero calls, frozen source only):

```powershell
$env:PYTHONPATH = 'D:/Repos/hive-ai/.hive/frozen-integration-28239ab/src'
python -m hive --store D:/Repos/hive-ai/.hive/integration-20261121 status
```

Source: RUNBOOK, "Two source identities". Use `inspect` and `integration` only
as written there.

## 6. Rollback

Experimental candidate-state restore (restores learning state only):

```powershell
python -m hive --store <store> rollback --experimental <initial_snapshot>
python -m hive --store <store> rollback --experimental <candidate_snapshot>
```

Source: RUNBOOK, "Restart, STOP and policy restoration". The snapshot names come
from the report's `initial_snapshot` and `candidate_snapshot` fields.

Production checkpoint restore (only for an independently approved checkpoint):

```powershell
python -m hive --store path/to/store rollback --checkpoint APPROVED_CHECKPOINT_ID
```

Source: RUN, "STOP, recovery, review and restore"; RUNBOOK repeats the same
distinction. Unapproved snapshots are refused (RUNBOOK). A restore cannot grant
permissions, refill budgets or promote a candidate (RUN). The console restore
control lists only approved checkpoints (CONSOLE).

Review of a job (read-only) from the same source:

```powershell
python -m hive --store path/to/store review --run JOB_ID
```

Source: RUN, "STOP, recovery, review and restore".

## 7. Context report

```
hive context report
```

Source: CTX, "CLI" (`hive context report  # policy snapshot + budget state`).
Read-only. It prints the policy snapshot and budget state. The output format is
not documented in CTX.

Related checks from the same doc: `ContextPolicy.preflight(...)` gates dispatch;
a blocked dispatch raises `DispatchBlocked` and the task is not enqueued (CTX,
"Preflight gate").

## 8. Where evidence lands

| Evidence | Location | Source |
| --- | --- | --- |
| Operator demo receipt | `.hive/operator-demo/demo-report.json` | RUN |
| Exact demo invocations and responses | `.hive/operator-demo/commands.json` | RUN |
| Measured readiness verdict | `build/readiness-report.md` | RUN |
| v0.4 release decision and receipts | `build/prototype-v04/public/` | OPS, CONSOLE |
| Prepared runbook for Ian's machine | `build/prototype-v04/public/prepared-runbook.md` | CONSOLE, OPS |
| Console browser journey + screenshots | `build/prototype-v04/console-browser-final/` (`browser-report.json`, `console-desktop.png`, `console-mobile.png`, `download-data.json`) | CONSOLE |
| Console health receipt | `build/prototype-v04/console-browser-health/health-browser-report.json` | CONSOLE |
| Pressure export | `.hive/pressure-demo/H01-export.json`, `.hive/pressure-demo/report.json` | RUN |
| Pressure report (all cases) | `.hive/pressure-all/` | RUN |
| Prepared proposal and runbook | `.hive/prototype-v04-final-inputs/` (`runbook.md`) | OPS |
| Mission store (state, journals) | the `--store` path, e.g. `.hive/operator-console` | CONSOLE |
| Generated output links | `output` directory under the store, verified by SHA-256 | CONSOLE |

Private SQLite journals, evaluator secrets and sealed labels are excluded from
public exports (RUN, "Verification"). Do not copy them into a public folder.

## 9. Doc conflicts

1. **Console `--allowed-root` example.** CONSOLE uses
   `--allowed-root D:\HIVE-inputs` with store `.hive/operator-console`.
   OPS uses `--allowed-root .hive/prototype-v04-final-inputs/inputs` with store
   `.hive/prototype-v04-console`. Both are examples, not conflicting rules. Both
   docs have the same last-commit time (`2026-11-22 00:32:09 -0800`), so neither
   is newer. Choose the root that matches your inputs and keep store and root
   distinct.

2. **E2E command.** RUN has `npm run test:e2e`. RUNBOOK and OPS have
   `npx e2e run --config e2e.config.mts --output <new-e2e-output-directory>`.
   Last commit: RUN `2026-11-21 18:23:26 -0800`, RUNBOOK `2026-11-21 16:28:10
   -0800`, OPS `2026-11-22 00:32:09 -0800`. OPS is newer, so its form is listed
   first in section 10. The repo's `package.json` was not checked, so whether the
   `test:e2e` script exists is unverified.

3. **Two STOP mechanisms.** RUN, RUNBOOK and CONSOLE describe `stop` as the
   mission STOP. CTX (`2026-11-22 19:25:25 -0800`, the newest of the five)
   describes `emergency-stop` as "runtime stop flag". The docs do not say whether
   the two use the same flag. Treat them as distinct until verified.

4. **`hive run --task <id> --route tool`.** Listed in CTX only. Not mentioned in
   RUN, RUNBOOK, OPS or CONSOLE. Not included in this runbook's commands because
   the other docs do not confirm it.

## 10. Verification commands (from the docs)

```powershell
$env:PYTHONPATH = "$PWD\src"
python -m pytest -q
npx e2e run --config e2e.config.mts --output <new-e2e-output-directory>
python scripts/replay_integration_export.py
```

Source: OPS, "Verification" (the `npx e2e` form, newest source). RUN gives
`python -m pytest -q` and `npm run test:e2e` in its own section. CONSOLE gives
`python -m pytest -q tests/test_console.py`. Pytest is a test dependency only
(RUN). Two legacy Windows symlink tests may skip without symlink privilege (RUN).

## Conductor resolution (verified in source, 2026-11-22)

- **STOP vs emergency-stop share one flag:** `hive stop` writes `<store>/STOP` (`src/hive/cli.py:238`); `hive context emergency-stop` writes `store_root/STOP` (`src/hive/context_policy.py:97,233`). Same file when `--store` matches the policy `store_root` (default `.hive`). `hive resume` removes it and recovers jobs.
- **E2E:** `npm run test:e2e` is defined in `package.json` as `e2e run`; the explicit `npx e2e run --config e2e.config.mts --output ...` form adds config/output paths. Both valid.
