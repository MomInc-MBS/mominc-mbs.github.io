# HIVE runtime v2 reconnaissance — 2026-11-20

Target: `MomInc-MBS/mominc-mbs.github.io`, live `main` 7477ea8284a258331d4b16f4e34a46dce8aa49ec; implementation branch `feature/hive-runtime-v2-20261120`. Public reference: https://mominc.online/hive/ (HTTP 200). The initial checkout's six report edits were committed and published by the existing publication workflow before this extension began. No unrelated AR-Party-Horror files were changed.

## Verified starting point

- `python -m unittest tools.hive_engine.test_engine -v`: 13/13 pass before changes.
- Existing `core.py`: SQLite append-only events, D1–D5 policy helpers, partitioned memory and release records.
- Existing `captions.py`, `pilot.py`, `fixtures.py`, `verify.py`: real ffprobe/rules benchmark, dev-only bounded proposer, pinned 48/24 synthetic split, four-arm replay and rejected candidate. Preserve `hive/evidence/caption-pilot-1` and all fixture bytes.
- Missing connections: router decision did not dispatch; release record did not control next execution; no replaceable model adapter; audit utility did not recompute verification verdicts. Existing eligibility tested requirements, but executable discovery alone was called health.
- Existing independent verification compared expected labels; it was not a model grading itself. Existing process separation is for trusted code, not an operating-system security sandbox.

## Local readiness observed again

Python 3.11.9 and ffprobe 9.0 available. Ryzen 7 5800, RTX 5070 Ti with 16,303 MiB total / 6,355 MiB in use, 16% utilization at sampling. This is shared machine load, not per-task telemetry. Ollama responds: one downloaded Qwen3.5 9B Q4 model, **zero loaded models**. LM Studio and Laya endpoints time out. Studio Brain and Ruflo answer; Ruflo routing is heuristic and Laya unavailable. No model was loaded/unloaded, GPU process stopped, or existing service reconfigured.

## Research and historical experiments

Read `hive/vault/06_Previous_Work.md`, `70_Local_Build/B01_Existing_Software_and_Readiness.md`, the original simulation findings, and the archived ZIP's README/requirements/file list. The ZIP includes runnable learning, representation and systems programs, raw data, summaries, seeds and analysis; requirements are NumPy 2.3.5 and Matplotlib 3.10.8. Reproduction writes alongside its source, so never run in the archive. Its 360 tiny-network and 1,440 scheduling runs remain historical CPU/synthetic evidence; this task does not claim to rerun that grid or validate real-model performance.

Preservation hashes were captured in local reconnaissance before edits. Research alternatives, 19 originals, original pilot outputs and fixtures are retained. Ian's shared context was consulted; no private character/agent memory was imported.

## Implementation sequence

1. Route one caller-supplied caption TaskSpec through a registry, execute the selected adapter, independently verify and persist the complete episode.
2. Extend the existing dev-only failure proposal into a frozen, three-control comparison with explicit reused-holdout status.
3. Bind local activation to recomputed evidence, make persistent active state affect routing, and prove restart/rollback with an isolated rehearsal of the exact candidate.
4. Test malformed outputs, authorization, timeouts, service failures, lineage and tampering; record all measured limits.

No autonomous-learning claim is justified by the initial pilot. A rejected candidate remains a valid loop demonstration, not verified improvement.

## Additive learning-acceleration update

The supplied 2026-11-20 update is preserved byte-for-byte under `hive/updates/` (SHA-256 `27ec100f08547f4a6fef9f27ddd94f902f8d3aea1ff11df3dbcd9732f3de2f03`). Its WP0 audit covers all 14 named upstream repositories and exact commit/release pins. Optuna 5.1.0 alone was installed in `.hive-local/optuna-env`; the serving Python and model services were left intact. Twelve optional Python packages are pinned by version and artifact hashes. Installed package metadata/RECORD identities are frozen with the experiment.

WP1/WP2 now include seven experiment records, normalized invocation/outcome events, partial-trial reconciliation and a fail-closed stateful-effect boundary. WP3 compares static, the existing heuristic, seeded random and optional TPE recipes. The full 38-test suite, including the real optional sampler process, passed before the final benchmark. See [implementation and acceptance limits](LEARNING_ACCELERATION.md), [runtime results](RESULTS.md) and [search results](SEARCH_RESULTS.md).

All 696 snapshotted source/research, fixture and prior-evidence files remain byte-identical, including the supplied vault navigation, graph and validation report. The website's source-byte checker requires that immutable export. One new stable node (`RUNTIME2`) and four edges extend it through [a separate overlay](research_graph_overlay.json); the new Obsidian note links to existing research and the implementation artifacts. `tools/check_hive_runtime_docs.py` validates the merged graph and new documentation without rewriting the base. The website reference is not rebuilt or deployed by this implementation branch.
