# Local prototype console

The final measured v0.4 journey and screenshots are in
[`build/prototype-v04/public/console/`](../build/prototype-v04/public/console/report.json).
It uses the frozen `runtime-recovery` source and saved `tool-store-recovery`
allocation. Follow the [prepared runbook](../build/prototype-v04/public/prepared-runbook.md)
on Ian's machine; the examples below create a separate, initially empty console.

Run from `D:\Repos\hive-ai`, branch `build/working-prototype`:

```powershell
$env:PYTHONPATH = "$PWD\src"
python -m hive --store .hive/operator-console console --allowed-root D:\HIVE-inputs
```

The command binds `127.0.0.1:8765` and opens an authenticated local browser. The
random session token travels in a URL fragment, is removed from browser history
by the page, and remains in that tab's session storage. Access logs are disabled;
the command prints only the public loopback URL. A plain URL opened in another
browser session has no API authority. Restart the command to open a new session.
Use `--port` to choose another port. No model runtime or weights are installed.

The store must be outside the permitted input directory. One durable store and
one startup allocation serve every console mission. Pause and STOP create the
existing runtime STOP file. Resume clears STOP after the worker exits and
requeues interrupted work without changing caps. Resubmit the identical form to
continue or validate saved evidence. A changed source/contract needs a new mission
ID, and never replenishes the shared allocation. A store cannot switch its
startup allocation. A browser refresh does not lose persisted missions.

## Forms and supported source contracts

Select a file already under `--allowed-root`. Traversal, symlinks and Windows
reparse points are refused. The console lists up to 300 CSV/JSON files, omits
hidden and evaluator directories, and accepts sources up to 2 MiB. POST bodies
are limited to 32 KiB. The input directory should contain only operator-permitted
sources and registered manifests; it is not an arbitrary host file browser.

“Registered prepared mission” executes an existing structured-data, Python or
combined manifest unchanged and fills its registered mission ID. This preserves
the exact approved fingerprint, including source group, oracle hash, procedure
and input binding. Registered combined manifests support terminal review/report
stages and pinned Python standalone envelopes. A different allowed root is
refused. The family-specific forms remain available for constructing new work.

- Inventory uses `grouped_inventory_v1`, with CSV columns exactly `id,group,bytes`
  or JSON array rows containing those fields. IDs are unique; bytes are
  nonnegative integers. The worker accepts up to 256 rows and computes exact
  group counts and byte totals without inference.
- Classification uses `independent_labels_v1`, CSV columns exactly `id,text`
  or equivalent JSON array rows, at most 12 rows, and explicit comma-separated
  label names. An optional host-only oracle picker shows existing filenames and
  hashes, never contents. Files under `private`, `oracle` or `oracles`, or with
  oracle in their filename, are excluded from normal sources and cannot be
  downloaded. Its result remains `REVIEW_PENDING` while an independent
  oracle is absent. Schema validity is not semantic correctness.
- Python selects a registered version 1 `json_function_v1` code manifest under
  the input directory. Its pinned repository must also be under that directory.
  Select the manifest's registered mission ID; changing it in the form is
  refused. The existing host verifier and restricted Docker adapter own execution.
  This is a scoped function protocol, not arbitrary repository repair or a shell.
- Combined selects a data source and registered Python manifest. The console
  builds `structured_data → code → review → report`, binds `data.json` `/rows`
  into argument zero of declared verifier case `source-rows` by default, and
  lets the operator select the case ID, JSON pointer and argument index. The
  registered Python verifier's expected answer stays predeclared. Failed,
  review-pending and synthetic dependencies cannot satisfy real verification.

All sources remain unchanged. Generated output links are limited to returned
`named_outputs` underneath the store's `output` directory and verified against
their returned SHA-256. The API cannot download arbitrary paths, evaluator
files, SQLite databases, approval records or content-addressed evidence blobs.
Status includes source references, stages, route, model and policy identities,
machine/field verdicts, independent reviewer status, errors and shared accounting.
Private expected answers and raw task/evaluator structures are not status fields.

## Finite inference approval

The default allocation has zero model requests and zero generated tokens. The
browser cannot supply executor configuration, create an approved allocation,
increase caps or promote a candidate. “Prepare approval identity” returns an
unapproved list of exact task/manifest fingerprints without verifier answers.

Only a separate operator-owned finite approval file passed at service startup
can permit inference:

```powershell
python -m hive --store .hive/approved-demo console --allowed-root D:\HIVE-inputs --approval D:\HIVE-approvals\demo.json
```

`hive.prototype_approval.load_prototype_config` is the single authority for its
version 1 schema, exact source/task hashes, allowed directory, store, pinned model
digest and complete finite executor configuration. Supplying an approval is not
proof that any model dispatched or any result passed. Classification also needs
its independently registered oracle contract selected in the host-only picker;
the source form cannot create that oracle. No inference was used in the console
regression journey.

Learning shows the stored `prototype_learning` aggregate, prior policy, candidate,
source groups, comparison arms, decision and subsequent-task identity when
present. QUARANTINED, REJECTED, EXPERIMENTAL and APPROVED have separate badges.
P2 stays quarantined. The restore control lists only existing approved
checkpoints and delegates to `Checkpoints.rollback`; it never creates approval.

## Verification and Python entry points

```powershell
$env:PYTHONPATH = "$PWD\src"
python -m pytest -q tests/test_console.py
python -m hive console --help
```

`serve_console(store_path, *, allowed_root, host='127.0.0.1', port=8765,
approval_path=None)` blocks until interrupted. `create_console_server` accepts
the same arguments and returns an unstarted standard-library
`ThreadingHTTPServer` for integration tests. Each API/worker action creates and
closes its own thread-affine SQLite connection. A background mission thread
leaves the HTTP STOP path responsive during worker execution. The in-flight
local-model timeout remains the existing runtime cancellation limit.

Tests exercise real loopback HTTP authentication, Origin/Host/DNS-rebinding
rejection, bounded bodies, source escapes, zero-call default, responsive STOP,
unchanged counters through resume/replay/restart, approved-only rollback,
artifact tampering and evaluator redaction. The actual inventory journey uses
the shared Executor, deterministic tool and independent verifier. Windows may
skip symlink creation where the account lacks developer privileges.

The implementation check on 2026-11-21 passed **11 tests, 1 Windows symlink
skip**. Playwright Chromium completed the actual inventory form, observed
`VERIFIED`, downloaded `data.json`, pressed STOP/resume and replayed without
changing the budget. It recorded zero model requests, zero page errors, no
session token in the final address, and no horizontal overflow at 390 px.
Evidence: `build/prototype-v04/console-browser-final/browser-report.json`,
`console-desktop.png`, `console-mobile.png`, and `download-data.json` in that
directory. These are local tools-only engineering checks, not evidence of real
model dispatch, Python sandbox success, beneficial learning or acceptance.

The subsequent `clarity-report.json` checks compact primary counters, collapsed
raw accounting, VERIFIED as the worker's primary execution verdict, an actual
no-oracle REVIEW_PENDING result, and a visible missing-approval failure with
zero model requests. The registered combined form was also checked against
the prepared Python snapshot: relative `source-inventory.csv`, case
`source-rows`, `/rows` into argument zero, followed by review/report stages.

“Check runtime health” explicitly runs the existing read-only doctor and inspects
up to three distinct digest-pinned images from registered Python manifests. It
never auto-polls, loads weights or generates tokens. The response includes its
original UTC measurement timestamp, configured-model discovery and digest,
whether that model is currently loaded, approved digest match when applicable,
Docker daemon/version and exact image availability. Availability does not prove
task isolation enforcement or authorize inference. Raw doctor configuration and
host error strings are not served.

Final health/clarity screenshots and receipt are in
`build/prototype-v04/console-browser-health/`: `console-desktop.png`,
`console-mobile.png`, and `health-browser-report.json`. The explicit read-only
check discovered the configured model present but unloaded, Docker daemon
available and the registered pinned Python image available; zero new model
calls. The same browser saw the actual inventory task VERIFIED, compact counters,
collapsed accounting and no 390 px horizontal overflow.

## Prepared complete demonstration

`python scripts/prepare_operational_demo.py` prepares the new
`.hive/prototype-v04-final-inputs` root with its own `runbook.md`. It preserves
the older roots and does not run inference or write an approved allocation.
It prepares four independently reviewed, first-party classification source
groups, four source-disjoint exact inventory inputs, two-comparison learning
plans, pinned Python standalone envelopes and both combined missions. The
model-backed combined mission consumes actual verified `/labels` and emits
sorted label counts; the inventory mission retains `/rows`.

The one unapproved proposal fingerprints all classification learning variants
and the model-combined data stage under the same finite live allocation.
Follow the generated runbook for exact `data`, `mission run`, `learn`, replay
and console commands. All approved live commands share `live-store`; all
zero-call commands share `tool-store` and `tool_config`. Separate stores here
separate the two explicitly different allocations; new stores never authorize
additional inference. The development provenance and labels do not establish
an independent research acceptance corpus or beneficial transfer.
