# Synthetic objective smoke

The objective smoke runner exercises 6 narrow Python `json_function_v1`
missions and 6 `structured_data` grouped-inventory tasks through HIVE's current
code mission and shared Executor paths. All inputs and expected answers are
small, inspectable development fixtures. The code patches are fixed examples;
this checks the execution, verifier, receipt, replay, and accounting pipeline,
not code-solving ability or policy learning.

The pinned source snapshots are generated locally from these fixtures. They
are not 6 independent real repositories or fresh Level A sources. The trusted
case file and its expected values stay outside the Docker worker mount; only
the pinned `app.py` goes to the worker. Structured-data expected values are
fixed in the preregistered plan and independently checked by HIVE's host
verifier. Every task is included in the result, including failures and blocked
sandbox attempts.

The deterministic cases cover empty collections, minimum and maximum contract
values, duplicates, order preservation, Unicode, large integers, interleaved
groups, and the 256-row schema boundary. A deliberately wrong structured-data
output is also checked as a negative verifier probe. Fresh-process replay
rechecks the six saved code missions and six saved structured-data evidence
bundles, then compares output hashes and per-task budget usage.

Preparation writes the six pinned development source snapshots and task
manifests. It does not start Docker or contact a model runtime:

```powershell
$env:PYTHONPATH = "$PWD\src"
python scripts/objective_smoke.py --prepare-only
```

After confirming the pinned Docker image and daemon are available, run the
actual smoke with:

```powershell
$env:PYTHONPATH = "$PWD\src"
python scripts/objective_smoke.py
```

The runner uses a tool-only configuration with request and token caps of zero.
It does not supply a fixture isolation adapter. If Docker is unavailable, code
tasks are reported as blocked or failed; the denominator remains 12. The
result is written to `.hive/objective-smoke/report.json`. It is an engineering
pipeline smoke only: it does not establish Level A acceptance, genuine source
independence, useful learning, or a quality gain.
