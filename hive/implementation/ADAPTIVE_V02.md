# Adaptive verified controller — v0.2

## Current executable: v0.2.1

The post-review runtime passed **136 tests**, with one Windows symlink test
skipped, and both Tester Army CLI journeys. It fixes persistent request/token
pause reasons, immediately blocks model identity drift, holds ownership through
cleanup, isolates experimental feedback even after process death, and records
wall usage atomically. Grok identified these edge cases; the targeted regressions
now pass. NVIDIA's statistics critique also removed utility-only acceptance.

[Download current executable source and evidence](/hive/downloads/HIVE_Adaptive_Controller_v0.2.1.zip) ·
[Current source manifest](/hive/implementation/adaptive-v021-publication.json) ·
[Current controller source](/hive/implementation/adaptive-v021/src/hive/adaptive.py) ·
[Final test results](/hive/implementation/adaptive-v021/experiments/results/adaptive-v021-tests.xml) ·
[Grok review and dispositions](/hive/implementation/adaptive-v021/experiments/results/adaptive-grok-review.json)

**Measurement provenance:** the real 30-call run below executed v0.2.0. Its
original executable snapshot is preserved separately. The later review fixes
used synthetic tests and spent no further model calls. Changing source cannot
silently resume an older experiment store.

## Preserved v0.2.0 experiment and executable

[Download executable source and public evidence](/hive/downloads/HIVE_Adaptive_Controller_v0.2.zip) ·
[Publication manifest](/hive/implementation/adaptive-v02-publication.json) ·
[Real run](/hive/implementation/adaptive-v02/experiments/results/adaptive-real-model.json) ·
[Fresh-process verification](/hive/implementation/adaptive-v02/experiments/results/adaptive-fresh-process-verification.json) ·
[Tests](/hive/implementation/adaptive-v02/experiments/results/adaptive-test-summary.json) ·
[Controller source](/hive/implementation/adaptive-v02/src/hive/adaptive.py)


Last verified: 21 November 2026 UTC. Executable runtime commit
`3d5522ae60735f3c7ffb2b754022c2ae3a328436`.

The `adaptive` CLI now constructs a frozen router from verified development
feedback, tests it, verifies paired results, diagnoses rejection, retains or
replaces an experimental checkpoint, and continues through bounded alternatives.
This changes routing policy, not model weights or arbitrary repository code.

## Executed local run

Run `d8a941b2f587` used real Ollama inference with `myr5-hold-local:latest`,
Qwen 9B Q4_K_M. Model manifest:
`a45646773d1ee8a6c1557c7de09a68e78a74f2990c4174a1408f65e777db150c`.
Twelve development observations trained the frozen router. The same six separate
validation tasks were then executed for each candidate and baseline.

| Route | Verified passes | Decision |
|---|---:|---|
| Direct local model baseline | 3/6 | Initial experimental incumbent |
| Learned greedy router | 5/6 | Accepted experimentally; two wins, zero losses |
| Fixed model-plus-tool | 4/6 | Rejected for a critical regression; retained learned router |
| Deterministic tools | 6/6 | Continued after rejection; accepted experimentally |

Thirty model calls, 36 observations, 1,013 generated tokens, 3,840 reserved tokens,
23.451 active execution seconds. Mission caps were 48 requests, 6,144 reserved
tokens, 900 active seconds, 100 cycles, 64 MiB artifacts and one local inference.
The completed run has 18 unspent requests; the controller does not reset budgets
or launch an unbounded daemon. Approved checkpoint remains null.

The report is `experiments/results/adaptive-real-model.json`; fresh-process
verification is `experiments/results/adaptive-fresh-process-verification.json`.
All 36 saved observations and candidate decisions reverified with zero new model
calls. The private SQLite store remains under `.hive/adaptive-v02-20261121`.

## Tests and defects resolved

122 runtime tests passed. Two Tester Army tools-only CLI journeys passed,
including STOP → resume → completed replay without spending more budget.
The exporter passed 10 tests; one filesystem symlink test was skipped because
Windows did not permit creating the test symlink.

The initial STOP CLI failure is retained in
`experiments/results/adaptive-e2e-initial-failure.json`. Fixed defects include
ordinary STOP returning an error, wrong-job evidence substitution, unchecked
cached evidence on partial resume, and a process-death window splitting an
incumbent change from its decision. Decisions now commit atomically and reproduce
from verified evidence on resume. Tests inject death at that write boundary,
test a real child-process exit, corrupt evidence, alter plans and exhaust budgets.

## Research and limits

Sol implemented paired descriptive assessment; Luna implemented the controller;
Terra tested recovery and adversarial cases. NVIDIA Nemotron reviewed the
statistical plan. Its useful challenge removed utility-only acceptance: quality
must improve strictly without critical regression. Utility and family dispersion
are descriptive. The NVIDIA review and dispositions are saved with the results.

Repeated validation is candidate-selection evidence, not an unused holdout.
Six correlated synthetic families and one model cannot demonstrate generalization,
compounding learning, weight training or superiority over the strongest simple
baseline. Deterministic tools won this run. Their measured zero latency is below
timer resolution, not zero physical compute. A candidate's acceptance is only
experimental; it cannot approve its own production checkpoint.

The next research bottleneck is a preregistered suite with unseen families and
tasks on which neither simple route saturates. Repeated inference and negative
controls must precede any broad gain claim. Model output still cannot execute
arbitrary code, change evaluators, or expand resource limits.

## Execute

```powershell
$env:PYTHONPATH = "$PWD\src"
python -m hive --store .hive/new-adaptive adaptive --config configs/adaptive.json --rounds 3 --output experiments/results/new-adaptive.json
python scripts/verify_adaptive.py --store .hive/new-adaptive --config configs/adaptive.json --output experiments/results/new-verification.json
```

A new store spends a new budget; the example is not an instruction to run
repeatedly without an aggregate limit. Restart the identical adaptive command
with its original store, source and configuration to resume an interrupted run.
