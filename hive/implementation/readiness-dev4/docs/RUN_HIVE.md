# Run HIVE v0.3.0.dev4

This is a local engineering build. Read `build/readiness-report.md` for the
measured readiness verdict and external blockers. Fixture success does not
establish Level A acceptance or beneficial transferable learning.

## Bootstrap and health

Extract the published source ZIP into a new directory. Python 3.11 or newer is
required; the runtime has no third-party Python dependencies. Git is required
for pinned repository snapshots. The operator demo additionally needs FFmpeg,
ffprobe, and an available Docker Linux daemon with the exact pinned image.
No model downloads or inference are performed by these commands.

```powershell
$env:PYTHONPATH = "$PWD\src"
python -m hive doctor --offline
python -m hive doctor --config configs/local.json
python scripts/replay_integration_export.py
python scripts/replay_readiness_exports.py
```

Offline doctor contacts neither Docker nor model endpoints. Online doctor
distinguishes installed models from loaded models and checks daemon health;
health alone is not evidence of enforced sandbox controls. Budget caps are
not authorization. Historical E0 and integration allocations remain spent.
The readiness replay checks public file hashes, all eleven exported fixture
comparisons and the operator job bundles. It performs no dispatch. Private
SQLite journals are excluded; fresh fixture execution below exercises those
journal checks again in a newly created local store.

## Both task families through one controller

The synthetic operator demo creates an untouched Git source, a patch, a trusted
host-side function evaluator, and synthetic video/subtitle inputs. It invokes
the public mission CLI for each family and a code-to-video dependency graph
using one Store and budget. It invokes each again in a fresh process and
verifies unchanged accounting and original source bytes.

Install the pinned engineering image once if necessary (this downloads software,
not model weights):

```powershell
docker pull python@sha256:07d4824036af339fa1b6ef769cc99d9c10a141769538b52b3b597c84f7a7b535
python scripts/readiness_demo.py --work .hive/operator-demo
```

The receipt is `.hive/operator-demo/demo-report.json`; exact invocations and
responses are in `commands.json`. A missing sandbox blocks code execution. HIVE
does not run candidate code on the Windows host. The generated fixture is
development material, not one of the 12 fresh Level A tasks. Structurally valid
video captions and clip plans still require editorial review for real use.

To prepare the manifests without running them, use `--prepare-only`. Then the
exact public commands are:

```powershell
python -m hive --store .hive/operator-demo/code-store mission run --manifest .hive/operator-demo/code-mission.json --config .hive/operator-demo/tool-config.json
python -m hive --store .hive/operator-demo/video-store mission run --manifest .hive/operator-demo/video-mission.json --config .hive/operator-demo/tool-config.json
python -m hive --store .hive/operator-demo/combined-store mission run --manifest .hive/operator-demo/combined-mission.json --config .hive/operator-demo/tool-config.json
```

A version 1 mission manifest contains `id` and `stages`. Each stage declares
`id`, `family` (`code` or `video`), `manifest` (path or object), `depends_on`,
and `max_retries` (0–2). The immutable manifest/config/source identity binds
restart. Reusing a completed store with changed inputs is refused.

Code missions currently support the narrow `json_function_v1` Python protocol:
the worker sees public arguments and curated allowlisted runtime files, while
expected results and verifier files stay on the host. The host evaluates every
result. Exit status or a printed “pass” is insufficient. This is not a general
arbitrary-language repository test runner. Candidate patches never modify the
original repository. Inspect `src/hive/code_verifier.py` for the exact schema
and the generated `code.json` for a complete working example.

## All eleven pressure smoke paths

These commands execute deterministic/synthetic development fixtures with zero
model calls. Specialist/team labels in fixture reports are explicit proxies,
not model quality measurements. The independent checker verifies saved jobs,
artifacts, feedback and comparison grouping again on replay.

```powershell
python -m hive pressure list
python -m hive pressure validate --manifest experiments/pressure/contracts/H01.json
python -m hive --store .hive/pressure-demo pressure run --test H01 --mode fixture --output .hive/pressure-demo/H01-export.json
python -m hive --store .hive/pressure-demo pressure run --test H01 --mode fixture
python -m hive pressure compare --reports .hive/pressure-demo/H01-export.json --output .hive/pressure-demo/comparison.json
python -m hive --store .hive/pressure-demo pressure report --output .hive/pressure-demo/report.json
```

Run every registered case:

```powershell
$tests = python -m hive pressure list | ConvertFrom-Json
foreach ($test in $tests) {
    python -m hive --store .hive/pressure-all pressure run --test $test.test_id --mode fixture --output ".hive/pressure-all/$($test.test_id)-export.json"
    if ($LASTEXITCODE -ne 0) { throw "Pressure case failed: $($test.test_id)" }
}
python -m hive --store .hive/pressure-all pressure report
```

`--mode real` without a complete preregistration and matching operator allocation
fails closed. The `paired-development-v1` adapter dispatches fixed tool,
fixed specialist, fixed two-component team, learning-disabled and adaptive
controls through the existing Executor and Store. Both team components are
charged; a fixed trusted rule selects verified agreement, verified tool fallback
or abstention. Selection and comparison source groups must be disjoint and all
arms receive the same finite caps. Only adaptive development training may learn;
comparison and fixed arms remain frozen. The earlier `integration-development-v1`
adapter remains supported.

Use `experiments/pressure/campaigns/paired-development.example.json`,
`paired-config.template.json`, `paired-real.template.json` and
`operator-approval.template.json` to prepare a reviewable allocation. The example
tasks are synthetic and the placeholders are deliberately unapproved. Replace
them with independently checked sources, pin every required file/source/model
digest, and obtain a matching explicit allocation before invoking:

```powershell
python -m hive --store .hive/approved-development pressure validate --manifest path/to/paired-real.json
python -m hive --store .hive/approved-development pressure run --test H03 --mode real --manifest path/to/paired-real.json --output path/to/development-export.json
python -m hive pressure compare --reports path/to/development-export.json
python -m hive --store .hive/approved-development pressure report
```

The code tests use a fake specialist to verify actual route dispatch and
accounting without inference. They do not measure model or team quality.
These development adapters do not establish that a complete source-disjoint
H01–H11 research campaign has run. Changing a budget ID or creating another directory
does not authorize more model calls. Use `experiments/plans/readiness-level-a.json`
and `readiness-level-b.json` as incomplete input/approval inventories, not runnable
approved studies.

## STOP, recovery, review and restore

```powershell
python -m hive --store .hive/operator-demo/code-store stop
python -m hive --store .hive/operator-demo/code-store status
python -m hive --store .hive/operator-demo/code-store resume
# Rerun the identical mission command above; budgets are not replenished.
```

A process killed between recording a terminal stage and linking its immutable
finish event stops safely on replay and requires journal reconciliation. The
controller does not invent a missing completion receipt. Bounded deterministic
work may repeat after other interrupted attempts, with the retry charged.

The shared controller also recognizes `<mission-id>.CANCEL` in its store.
Recovered deterministic operations may execute again when death happened before
durable evidence; every dispatch is charged. No exactly-once external-effects
claim is made. Saved completed evidence is checked instead of silently rerun.

Existing review and experimental restore commands remain available:

```powershell
python -m hive --store path/to/store review --run JOB_ID
python -m hive --store path/to/store rollback --experimental ARTIFACT_REF
python -m hive --store path/to/store rollback --checkpoint APPROVED_CHECKPOINT_ID
```

Only existing valid artifacts/checkpoints are accepted. A restore cannot grant
permissions, refill budgets or promote a candidate. See the historical
`HIVE_RUNBOOK.md` for the preserved six-call run and rejected candidate.

The engineering queue uses the same Store: `queue init --manifest FILE` and
`queue status`. It records blocked dependencies and requires a different,
independently reviewed hypothesis after two identical failures. It does not
dispatch missions autonomously or override STOP.

## Verification

Install test-only dependencies if they are absent; these commands fetch software,
not model weights. The runtime and offline receipt replay need neither package.

```powershell
python -m pip install pytest
npm install --ignore-scripts
```

```powershell
python -m pytest -q
npm run test:e2e
```

Pytest is a test dependency. CLI journey tests use the existing Tester Army
`e2e` package; they contain no inference steps. Docker tests report skips if
Docker or the exact pinned image is unavailable; a skipped sandbox test is not
a verified sandbox. Two legacy Windows symlink tests may also skip without
symlink privilege. Windows junction rejection has separate executed coverage.

Private stores, media, evaluator secrets and sealed labels belong outside the
public source export. Public fixture answers are intentionally exposed synthetic
development material. `SNAPSHOT_MANIFEST.json` hashes the published payload;
the publication receipt hashes the downloadable ZIP.
