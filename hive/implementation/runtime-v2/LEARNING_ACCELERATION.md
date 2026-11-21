# Bounded learning-acceleration implementation

Stable research ID: `RUNTIME2`. [Vault node](../../vault/70_Local_Build/B09_Runtime_v2_and_Learning_Acceleration.md) · [unaltered incoming update](../../updates/HIVE_Build_Path_Update_Learning_Acceleration_2026-11-20.md) · [adoption audit](learning_acceleration_adoption_matrix.md) · [upstream pins](research_repo_pins.json).

[Research graph overlay](research_graph_overlay.json) adds the node and four typed edges to the immutable supplied graph. The merged research graph is validated by `python tools/check_hive_runtime_docs.py`; the base export and all original source bytes remain untouched.

## Decision LA-001: preserve the core and test one optional optimizer

The incumbent remains the fixed rules policy in `runtime.py`. The existing pilot and runtime loop stay runnable with standard Python and ffprobe. Only the separate proposal process imports Optuna 5.1.0; `tools/hive-optuna.lock` pins all transitive dependencies with artifact hashes. No package was installed into the serving Python. No GPU, model loading, paid API, robotics environment or external side effect is used. Installed package versions must exactly match the lock, and installed RECORD-file hashes are recorded and rechecked for each proposal. This trusts the local executable and installation; it does not independently attest every installed file against a malicious filesystem owner.

The actual implementation/review workers were the current Codex lead and a bounded GPT-6-luna research/review worker. SOL, Grok and Nemotron were proposed roles in the incoming document; this run does not claim those model endpoints were available or used. Laya was unavailable; Ruflo returned an uncalibrated heuristic recommendation, so the previously authorized inexpensive Codex worker was retained.

## WP1/WP2 contracts and evidence

`contracts.py` owns seven closed record formats: ExperimentSpec, TrialResult, MetricDefinition, PromotionDecision, DatasetSplit, ComputeBudget and CandidateLineage. JSON schemas are exported in [experiment-contracts.json](experiment-contracts.json); Python validation adds pilot-specific semantic checks. Tasks, capability contracts and the existing memory/release schemas remain in their original modules.

Four channels retain distinct purposes: **Control** freezes plans and budgets; **Task** records invocation intent; **Evidence** records observed outcomes, resources and verdicts; **Teaching** records frozen candidate lineage. Channel names are metadata, not separate transport implementations. Likewise the research graph, source/code graph, execution event graph and potential neural graph remain separate; no research edge executes code or changes weights.

The runtime records adapter invocation and outcome, errors/abstention, CPU/RSS, duration, zero retries, and recipe dispatch. Model token/GPU usage is unknown for a model call and zero for this CPU-only experiment. Costs do not silently substitute zero for unknown model measurements. Worker CPU/RSS exclude the ffprobe process and the optional Optuna proposal process. Total trial wall time includes proposal startup, runtime calls, verification, persistence and per-trial audit. Model tokens, dollars and GPU allocation are zero here because none is requested.

Trials run in separate persistent state directories. Resume verifies the frozen experiment, sources, environment and event chain. Completed trials are reused without execution; an interrupted trial becomes `inconclusive / outcome_unknown`, consumes its entire reserved wall and task-call allocation conservatively and is never silently rerun. The remaining planned trial slots may continue. Independently verified partial episodes are retained; unknown attempt costs remain flagged rather than presented as measured.

`effects.py` supplies an intent/reconciliation ledger for future stateful integrations: a stable idempotency key and persisted intent precede dispatch; unknown or applied outcomes block another dispatch; independently established `not_applied` permits it. Current runtime adapters must declare **read-only** effects. Stateful adapters fail closed until their actual remote reconciliation is integrated. This is a tested ledger boundary, not a claim of exactly-once external delivery.

## WP3 experiment LA-EXP-001

- Four arms: static rules, the existing dev-derived probe guard heuristic, seeded random recipes, and Optuna multi-objective TPE.
- Three predeclared seeds: 11, 29, 47. Four development trials per arm/seed; each uses the same 48 development tasks. All selected candidates freeze before any evaluation calls. Each selected recipe gets the same 24 previously exposed evaluation tasks once.
- Equal ceilings per arm/seed: four development slots plus one evaluation slot, 216 adapter task calls including evaluation, 240 seconds total trial wall, 45 seconds per trial, concurrency one, zero retries, zero dollars, zero GPU seconds. The explicit aggregate ceiling is 60 slots, 2,592 calls and 2,880 accumulated trial seconds. Arm order rotates deterministically; task order is identical for a seed/trial across arms. Static and heuristic arms consume repeated trial slots rather than receiving extra search budget.
- Allowlist: primary specialist in rules/probe/combined; escalation to combined above 0, 64, 128 or 65,536 input bytes. This is a size-based recipe switch, not a calibrated uncertainty threshold. Retry cap zero, serial execution and mandatory verification are fixed constraints. The preexisting heuristic may use probe-guard; it is not an extra Optuna search option.
- Optuna receives only its own previous development summaries, never evaluation outcomes, paths or permission files. TPE is reconstructed from completed development history for each proposal with seed `seed + trial_index`, two startup trials, and two objectives: maximize verified fraction and minimize execution latency. This deterministic reconstruction is the declared sampler, not a claim of equivalence to a continuously seeded study.
- Development selection requires 48/48 verified answers. No latency reduction can buy a quality regression. Among eligible recipes the lowest development latency wins, with deterministic hash tie-breaking. All recipes, nonwinning trials and failures remain in the ledger. This is the quality-constrained portion of the quality/latency Pareto frontier; no weighted scalar objective substitutes for gates.
- The optimizer boundary is an allowlisted data interface plus separate trusted process, not an OS sandbox against a malicious installed dependency. It has no evaluator mutation API and receives no file paths, but the local user still owns the filesystem. Arbitrary generated code is not admitted.

Search decisions are independent evaluator reports. They cannot call the runtime activation API. The current dataset fails the fresh-holdout, novel-family-retention and candidate-specific recovery gates, so every recipe is rejected for operational promotion. The original runtime cycle separately demonstrates candidate-bound rejection, isolated activation, restart and rollback; injected positive tests prove the approval mechanism only.

## Reproduce

Run from the repository root, with Python 3.11+ and ffprobe on PATH:

```powershell
python -m unittest tools.hive_engine.test_engine tools.hive_engine.test_runtime tools.hive_engine.test_governor tools.hive_engine.test_search -v
uv venv .hive-local/optuna-env --python 3.11
uv pip sync --python .hive-local/optuna-env/Scripts/python.exe --require-hashes tools/hive-optuna.lock
$env:HIVE_OPTUNA_PYTHON = (Resolve-Path .hive-local/optuna-env/Scripts/python.exe).Path
python -m unittest tools.hive_engine.test_search -v
python -m tools.hive_engine.search --out .hive-local/search-new --optimizer-python $env:HIVE_OPTUNA_PYTHON
python -m tools.hive_engine.search --audit .hive-local/search-new
```

Repeat the same search command to resume the same frozen run; use a new output path for changed source, dependencies or environment. A saved recipe can be instantiated with `RecipeAdapter(recipe_json)` in a normal Registry and evaluated by Runtime without Optuna installed. `test_normal_recipe_runs_without_optimizer_and_audits` exercises that path.

## Acceptance and remaining work

| Incoming requirement | State and evidence boundary |
|---|---|
| Incumbent inventory and fixed baseline | Implemented; CURRENT_STATE, original benchmark and live TaskSpec demonstration |
| Allowlisted proposals, equal controls, all losers, optimizer-off execution | Implemented and tested in this narrow caption recipe experiment |
| Effect reconciliation and no unsafe duplicate actions | Ledger and rejection tests implemented; real stateful remote integration deferred |
| Independent gates, good/bad mechanism, rollback | Runtime governor and injected positive/negative tests; current measured candidates rejected |
| Novel task families and old skill retention | **Not established.** Six related caption variants are regression coverage, not novel task families or general skill retention |
| Strong generalist / fixed team / heuristic adaptive team / optimizer team | **Not established.** This four-arm comparison concerns software recipes. No resident authorized model arm or multi-agent team benchmark was available |
| Fresh held-out improvement and recovery parity | **Not established.** Known exposed evaluation remains regression-only; no candidate is promoted |
| Three real pilots | Retained in WP6: video production/posting with dry-run publication, live-call/streaming supervisor with shadow actions, horror-haunt with task-specific interaction/resource limits |
| WP4–WP7 alternatives | GEPA/OpenEvolve, organizational tests, continual/weight learning and robotics retained with reopening conditions in the adoption audit |

The next deciding test needs independently controlled, representative new task families plus old-skill retention and recovery tasks. Merely generating new synthetic seeds would not satisfy that requirement. No autonomous learning, compounding improvement or neural-weight update is claimed.
