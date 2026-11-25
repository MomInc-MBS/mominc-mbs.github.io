# HIVE 0.4 operational prototype

The corrected dev6 handoff is implemented as a local operator workflow on the existing Store, Executor, governor, verifier and Docker protocol. The final measured release decision and receipts are in `build/prototype-v04/public/`. This build does not authorize inference or promote a policy.

## Scope and baseline

| State at dev6 | Action in this build |
| --- | --- |
| Existing Store, Executor, durable budgets, global inference lock, exact tools, P0, checkpoints and pinned Docker `json_function_v1` worked | Reused these components; retained historical evidence |
| Typed real CSV/JSON intake and cross-family data binding were missing | Added restricted intake, exact independent verifiers, immutable artifacts and verified data-to-Python input binding |
| Candidate components existed without this end-to-end source-disjoint workflow | Added a frozen development/comparison/subsequent plan, attributed feedback, fixed controls and strict rejection |
| Operators used CLI manifests | Added an authenticated loopback console with source selection, artifacts, health, budgets, learning state and controls |
| No new model allocation | Prepared an explicitly unapproved finite proposal; dispatch remains gated |
| Independent research corpus and acceptance decisions absent | Kept Level A and beneficial-learning research separate |

The reproduced baseline is runtime commit `f3d7e556ea41076e1138761d72df06b5ce3e0f65`, published with source packaging commit `0b3bfc391c8fc21555f451012757174933f1c479`. Its measured runtime SHA-256 is `0d97faae0caae31f3918296dccaa21be5ba0ba7a1cec0c8ca5f880001d17320e`. The canonical dev4 readiness label and later dev6 engineering supplement are separate historical records. The direct dev6 page remains https://mominc.online/hive/notes/P2SAFETY/.

## Work that runs

`hive data` reads pinned CSV or strict JSON beneath an allowed root. Inventory tasks use the existing exact grouping tool. Semantic classification can use only the explicitly approved pinned local model. Host-side label oracles never enter its request. A missing oracle produces REVIEW_PENDING; schema validity alone cannot count as semantic success. Symlinks, junctions, traversal, oversized files, duplicate JSON keys, non-finite values and malformed rows are rejected.

`hive mission run` composes structured data, restricted Python, independent review and report stages. The Python case receives the actual verified upstream artifact; the predeclared expected answer stays unchanged. Failed, pending or synthetic data cannot satisfy a real dependency. Code runs from a pinned disposable snapshot in a fixed Linux image with no network, restricted mounts and finite memory, CPU, process, time and output limits. The original repository is not patched.

`hive learn` freezes the plan and possible recovery procedures before observing development output. A verified schema failure may select a fixed labels-only JSON recovery prompt. Comparison sources and the subsequent source must have different source groups and input hashes from development and each other. The same verifier, model and caps apply to all arms. P0, strongest applicable tool, fixed specialist, conditional checker/recovery team and learning-disabled behavior are explicit. Identical executions are aliases, not independent gains. Ties, incomplete comparisons and critical regressions reject the candidate. Any retained procedure remains experimental and cannot modify governing P0 or promote P2.

STOP preserves spent reservations. Resume completes the same attempt. An interrupted model call with no completed receipt requires reconciliation and cannot silently dispatch again. Replay checks immutable outputs, independent evidence, source, verifier, configuration and runtime identity. Run from the same frozen source when resuming.

## Run locally

On Ian's measured machine, use the [prepared runbook](../build/prototype-v04/public/prepared-runbook.md)
to replay `tool-store-recovery` from the retained `runtime-recovery` archive. The
earlier `tool-store` and `tool-store-fixed` contain preserved failed/interrupted
attempts and must not be reset or reused with changed source. The commands below
are for a fresh checkout or extracted source package.

Use Python 3.11+, Git, the existing Docker daemon and the already installed image. No model download is needed. From the source checkout:

```powershell
$env:PYTHONPATH = "$PWD\src"
python scripts/prepare_operational_demo.py
python -m hive doctor --offline
python -m hive doctor --config configs/local.json
```

Preparation copies public first-party source material and emits immutable manifests, a generated runbook and an unapproved proposal under `.hive/prototype-v04-final-inputs`. It never calls a model or grants approval. Use its generated commands for the zero-call inventory, real Docker transformation, combined mission and learning rejection. The generated live commands all share one approved store and allocation.

For a local console:

```powershell
python -m hive --store .hive/prototype-v04-console console --allowed-root .hive/prototype-v04-final-inputs/inputs
```

The launch opens an authenticated localhost URL. The token stays local. Source, oracle references and registered missions are picked in the UI; evaluator contents are not served. Health checking contacts only local discovery endpoints and Docker inspection. Start with the same source, store, allowed root and approval file after a restart. See `PROTOTYPE_CONSOLE.md` for controls and HTTP boundaries.

## Separate authorization and research

The corrected handoff says the initial demo budget is **proposed, not already authorized**, and that new live inference needs a separate real authorization. The prepared proposal allows at most 24 requests, 128 generated tokens each, 3,072 total generated tokens, one global inference request at a time, 1,800 active seconds, 100 executor cycles and 64 MiB of artifacts. Docker tasks have their own stricter caps. The approval pins exact task fingerprints, model digest, endpoint, source root and store. Raising a limit or replacing these identities is not a resume.

Until that authorization and actual measured model receipts exist, the release can be READY_FOR_LIVE_DEMO, never OPERATIONAL_PROTOTYPE_DEMONSTRATED. Agent coding assistance and mock test adapters are not HIVE model dispatches.

Level A remains six unused structured-data source groups plus six unused Python snapshots, with at least ten independently accepted outputs out of twelve attempted and all mechanical gates. The first-party demonstration sources are development inputs, not an independent acceptance corpus. Level B requires its separate preregistered campaign with at least 24 held-out tasks, strong controls and no critical regression. No beneficial-learning or promotion claim follows from this prototype.
