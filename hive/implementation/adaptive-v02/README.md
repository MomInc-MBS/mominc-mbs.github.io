# HIVE local prototype

HIVE runs bounded local-model experiments, verifies outputs independently,
records immutable evidence, and learns category-specific routing from verified
development feedback. It is policy learning, not model-weight training.

Workspace: `D:\Repos\hive-ai`; branch `build/autonomous-v0.1`. Executable snapshots
and measured results are published at https://mominc.online/hive/; the local
runtime is not a public model service. Earlier design documents are preserved in `docs/brief.md`
and `docs/first-milestone.md`; Ian's new build directive is archived in
`docs/AUTONOMOUS_BUILD_DIRECTIVE.md`.

## Run from a clean checkout

Python 3.11+; no runtime Python dependencies. Tests need pytest. Optional packaging
uses setuptools; `pip install -e .` may fetch build tooling. The module fallback
works offline without packaging:

```powershell
cd D:\Repos\hive-ai
$env:PYTHONPATH = "$PWD\src"
python -m hive doctor --config configs/local.json
python -m hive tasks
python -m hive run --task-file benchmarks/development/example.json --route tool
python -m hive status
python -m pytest -q
```

For the short `hive` command, run `python -m pip install -e .`. Real inference
requires local Ollama and an installed model named in `configs/local.json`.
This machine has `myr5-hold-local:latest`, Qwen 9B Q4_K_M; doctor discovers its
exact manifest digest. Nothing downloads models automatically.

```powershell
hive --store .hive/my-task run --task-file benchmarks/development/example.json --route local_direct
hive --store .hive/my-task review --run <printed-job-id>
hive --store .hive/my-task compare --a <job-id> --b <same-task-job-id>
```

Supported finite task/evaluator types: arithmetic, predefined code-patch fixtures,
tool routing, coordination, evidence/abstention, and constant-rule adaptation.
Code repair is a bounded fixture laboratory, not arbitrary repo editing. User task
JSON must state success criteria before execution. Model output cannot invoke
shell commands, arbitrary code, network services, or file writes.

## Durable worker

The v0.2 adaptive controller runs a finite build → test → verify → diagnose →
improve cycle. It learns a frozen category router from verified development
observations, evaluates it against a direct-model baseline, and tries fixed
model-plus-tool and tool-only alternatives even after a rejected candidate.
Each decision and experimental checkpoint persists in SQLite and hashed artifacts.
Strict paired quality improvement with no critical regression is required to
replace the experimental incumbent. Equal-quality latency/token changes do not
qualify. Rejected candidates retain the incumbent; approved checkpoints are unchanged.

```powershell
python -m hive --store .hive/adaptive adaptive --config configs/adaptive.json --rounds 3 --output experiments/results/adaptive.json
python -m hive --store .hive/adaptive status
python -m hive --store .hive/adaptive stop
python -m hive --store .hive/adaptive resume
# Restart the identical adaptive command to resume; completed runs verify cached evidence.
```

`configs/adaptive.json` caps the mission at 48 local requests, 6,144 reserved
generated tokens, 900 active execution seconds, one inference at a time, 100
cycles and 64 MiB of artifacts. The three-candidate schedule uses at most 30
requests. STOP and exhausted budgets return a PAUSED state; resume never refills
budgets. Task, job, source, model and configuration identities bind reused
evidence. Changed runtime source requires a separate explicitly budgeted run.

This is verified routing adaptation over six finite synthetic task families.
Validation is reused for candidate selection and is labeled accordingly; it is
not an unused holdout. It does not establish broad learning, weight updates or
superiority over deterministic tools. The controller cannot promote its own
experimental checkpoint.

```powershell
hive --store .hive/worker run --task-file benchmarks/development/example.json --route local_tool --enqueue-only
hive --store .hive/worker loop --config configs/local.json
hive --store .hive/worker status
hive --store .hive/worker stop
hive --store .hive/worker resume
```

For an explicitly launched hidden background process:

```powershell
.\scripts\Start-HiveWorker.ps1 -Store .hive/worker
```

Status, SQLite history, and worker stdout/stderr logs are observable. The worker
exits on empty queue, budget, or STOP; no perpetual activity is implied. Restart
with the same store: dead-owner jobs recover, live owners retain leases, and
budgets persist. `resume` clears STOP and requeues paused work; it does not refill
budgets. Mission config is immutable once work starts. A new experiment requires
a fresh, explicitly budgeted store and unused holdout; creating stores does not
authorize unbounded aggregate spending.

Default ceilings: one local inference globally across HIVE stores; 120 local
requests; 128 generated tokens/request; 15,360 reserved generated tokens; 2,700
seconds of active execution; 240 cycles; 256 MiB artifacts; two automatic follow-up
attempts per failure. Token reservations survive crashes. These are application
limits, not OS CPU/GPU memory quotas. The local runtime allocates its hardware.

## Preregistered comparison

```powershell
hive --store .hive/new-campaign experiment --config configs/local.json --output experiments/results/comparison.json
```

The plan executes 18 development, 12 validation and 24 held-out tasks through
direct local model, model-assisted tools and deterministic tools: 108 local-model
requests and 162 observations. It compares fixed, greedy, UCB, seeded random,
fixed-tool and fixed model-plus-tool policies, learning-disabled ablation,
alternative objectives and prior sensitivity. These are offline policy replays
over shared outcomes. Actual latency/tokens are reported; equal caps do not imply
equal realized cost. The fixed team always returns its deterministic tool answer.

Candidate state freezes after development. Validation/holdout never update it.
The repo-level ledger prevents another campaign reusing the same holdout IDs.
Re-running a finished campaign returns its saved report without new calls. An
interrupted campaign resumes its jobs with the same source/config.

Six correlated synthetic task families cannot establish general superiority.
Design reviews do not approve experimental results. Fresh-process saved-output
verification is distinguished from fresh live-model reproduction. A failed gate
leaves the policy experimental and queues a research hypothesis. Utility cannot
override hard gates.

## Evidence

- `docs/CURRENT_STATE.md`: verified checkpoints and limitations.
- `docs/BUILD_ISSUES.json`: owners, dependencies, priorities, evidence criteria.
- `docs/EXPERIMENT_LOG.md`: reports and next actions.
- `docs/FAILURE_REGISTER.md`, `docs/REVIEW_DECISIONS.md`: diagnoses and reviews.
- `experiments/results/C1-real-model.json`: actual local vertical slice.
- `experiments/results/C5-policy-comparison.json`: aggregate comparison.
- `experiments/results/C6-live-reproduction.json`: six fresh-inference checks.
- `experiments/results/release-smoke.json`: clean Git archive and CLI restart.
- `.hive/campaign-v01/`: durable full evidence, hashes, jobs and frozen policy.

Holdout labels, outputs and per-case failures remain in the local evaluator store,
sealed from CLI development reviews and reports. This is a logical boundary in a
trusted single-user process, not protection against the operating-system owner
or arbitrary Python with filesystem access. Model requests omit evaluator answer
keys. Private evaluator state is git-ignored; aggregate reports can be shared.

Tests cover subprocess recovery/CLI restart, false evidence, budgets, ownership,
holdout consumption, feedback, promotion gates, and synthetic promotion/regression
rollback. Synthetic tests do not mean a real learned policy has been approved.
Restore an approved checkpoint with `hive rollback --checkpoint <artifact-ref>`;
unapproved checkpoints are refused.

Tester Army tools-only journey: `npx e2e run --config e2e.config.mts` after
installing the optional `package.json` development dependency. This machine reuses
installed e2e 0.21.1 through an ignored node_modules junction. Results are in
`experiments/results/e2e/report.json`. No browser/device trace is claimed.
