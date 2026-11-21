# Run HIVE locally

Requirements: Python 3.11+ and ffprobe on PATH. No additional Python package, model download, API key or service startup is required for the demonstrated workflow. Run commands from the repository root.

```sh
python -m unittest tools.hive_engine.test_engine tools.hive_engine.test_runtime tools.hive_engine.test_governor tools.hive_engine.test_search -v
python -m tools.hive_engine.cycle --out .hive-local/runtime-v2-new
python -m tools.hive_engine.audit .hive-local/runtime-v2-new/state
```

Use a new output directory for every benchmark. Existing results are never overwritten. `results.json` records the measured comparison/decision; `evaluation-plan.json` pins criteria, code and candidate; `state/events.jsonl` and `state/runtime.sqlite` contain replayable events; `rollback-proof.json` and `rollback-state/` prove restart and restored execution. `curated-dev.json` excludes evaluation examples.

To submit your own caption without the benchmark:

```python
from pathlib import Path
from tools.hive_engine.runtime import Runtime, task_for

caption = Path("my-caption.srt").resolve()
app = Runtime(".hive-local/my-hive")
try:
    result = app.run(task_for(caption), caption.parent)
    print(result["config_id"], result["passed"], result["errors"])
finally:
    app.close()
```

The corresponding JSON TaskSpec may be submitted via CLI:

```sh
python -m tools.hive_engine.runtime --state .hive-local/my-hive --input-root INPUT_DIRECTORY --task task.json
```

Tasks pin file bytes with SHA-256, name the rubric and input root, specify permissions, set a wall/input/concurrency budget, and declare a partition (`live`, `dev`, `holdout`, `retention`). A false caption verdict can still be a successful task if the caption is actually invalid. Missing authorization or a failed checker never counts as a successful execution.

For new evaluation data, preserve the existing manifest schema and independently record its canonical JSON SHA-256. `--dataset DIR --dataset-sha256 HASH` selects it; `--fresh-holdout-attestation REFERENCE` is an explicit operator provenance assertion, not a candidate-generated label. Enrollment rejects known exposed holdout content, overlapping source groups/content, changed criteria and mismatched bytes. There is no reason to add that freshness flag to the bundled old dataset; it fails intentionally.

An eligible result is still inactive. Local operator code can call `governor.promote(runtime, exact_candidate_hash, approval_reference)`; the governor rereads and recomputes evidence. `governor.rollback(runtime, current_release_id)` restores the previous policy across restart. The default demonstration candidate is rejected and cannot be promoted. Its separate pre-release rollback rehearsal exercises that exact candidate in a disposable runtime, rejects live tasks there, and restores the baseline. Evaluation policy overrides require exact membership in the enrolled frozen task set.

See [architecture](ARCHITECTURE.md), [current state](CURRENT_STATE.md), [gap map](GAP_IMPLEMENTATION_MAP.md), and [measured results](RESULTS.md). Original reports and evidence in the parent implementation directory are retained as the previous pilot's historical record.

The additive [learning-acceleration experiment](LEARNING_ACCELERATION.md) installs Optuna only in an optional isolated environment. [Search results](SEARCH_RESULTS.md) compare static, heuristic, random and TPE recipes under equal budgets. Core runtime and audit commands do not require Optuna; one optional sampler test is skipped unless `HIVE_OPTUNA_PYTHON` points to the pinned environment.

Supporting records: [capability inventory](CAPABILITY_INVENTORY.md), [decision log](CHANGELOG.md), [adoption audit](learning_acceleration_adoption_matrix.md), [repository pins](research_repo_pins.json), [experiment schemas](experiment-contracts.json), and [additive research graph](research_graph_overlay.json). Run `python tools/check_hive_runtime_docs.py` to validate the overlay and documentation while preserving the supplied vault export.
