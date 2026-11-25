# HIVE unified audit (read-only)

Audit basis: working tree at `D:/Repos/hive-ai`, branch `build/working-prototype`. No commits, no pytest, no model calls, no `hive` mission runs. Historical numbers below are **reported** by the repo's own documents and were **not reproduced**.

## 1. Identity

| Item | Value |
|---|---|
| HEAD | `fac5586767767f44aba48a4e1d37ea390a3f39fd` (Add typed deterministic DecisionGateway and upstream sources lock) |
| Branch | `build/working-prototype` |
| Working tree | 30 entries in `git status --short` (uncommitted, shared with another worker) |
| Notable uncommitted | `M configs/agent_context_policy.yaml`; untracked `src/hive/usage_ledger.py`, `tests/test_usage_ledger.py` |
| Version | `0.4.0.dev1` (`pyproject.toml`, `docs/CURRENT_STATE.md`) |
| Package | `hive-local`, Python >=3.11, no runtime deps, entry point `hive = hive.cli:main` |

Hashes of the working-tree files (not HEAD blobs; `agent_context_policy.yaml` differs from HEAD):

```
8da1ba33e5935c3a07ab045daee511c67a2993a42a262fc991040d75dae60845  configs/adaptive.json
6e61d705dc0556fdff0b24ed02a02285cfe58657dbee7acf2357abb1e98c9df4  configs/agent_context_policy.yaml   (modified, uncommitted)
b53b3347f219f5430afdb71aebf45f282df3ecde79a4c0c22bd9e14ad5f742d7  configs/integration-20261121.json
8537705697732817faebd0c673c4b5eac1cf66b9295b0f2731b6d21215675628  configs/local.json
6707acdeb0d0e06c738db159d6ba03bafca86eb8e81d3937cf8b68341f95f652  configs/prototype-mission.example.json
2e6e86d79ce31823a3261494abcc334ac3afadac6f67d4b170b6deedf3fa1e48  configs/prototype-video.json
a6b62c579ac230cbe7cd144f571dfea4cb66a26e879c8dd2804fbb27622d4427  configs/v03-e0.json
```

## 2. Local infrastructure (read-only probes)

| Probe | Result | Label |
|---|---|---|
| `docker version --format '{{.Server.Version}}'` | `29.8.2` | RESPONDING (daemon answered) |
| `ollama list` | `myr5-hold-local:latest`, 5.6 GB, modified 5 weeks ago | INSTALLED (not called) |

## 3. Launch, doctor, test commands (copied from repo docs)

From `README.md` and `docs/RUN_HIVE.md`, run with `$env:PYTHONPATH = "$PWD\src"`:

```
python -m hive doctor --offline                      # README.md:11, no endpoints
python -m hive doctor --config configs/local.json    # README.md:63 (may contact endpoints)
python -m hive run --task-file benchmarks/development/example.json --route tool   # README.md:65
python -m hive console                               # cli.py:42 (authenticated local console)
python scripts/replay_integration_export.py          # README.md, zero new model calls
python scripts/objective_smoke.py --work .hive/objective-smoke   # Docker, zero model calls
python -m pytest -q                                  # README.md:67, NOT run in this audit
npx e2e run --config e2e.config.mts --output <dir>   # docs/HIVE_RUNBOOK.md, NOT run
```

Not executed in this audit: `doctor` (any form), `run`, `console`, pytest, e2e, objective smoke.

## 4. Reported test and run numbers (not reproduced)

- `docs/CURRENT_STATE.md:24`: **488 tests passed, three Windows symlink skips**; seven CLI journeys; twelve objective tasks replayed (reported, v0.4.0.dev1 final checks).
- `docs/CURRENT_STATE.md:51`: 448 passed, 2 skips (P2 frozen ZIP, reported).
- `docs/CURRENT_STATE.md:95`: dev5 suite 356 tests, 2 skips (reported).
- Static count (not a run): 49 `test_*.py` files and 354 `def test_` functions under `tests/`.
- `build/prototype-v04/live-demo-20261122/REPORT.md`: live-store totals **5 requests, 73 tokens, 7 cycles** of a 24/3,072 approval; O5 PASS; candidate rejected; P0 unchanged. Reported; store present at `.hive/prototype-v04-final-inputs/live-store` (conductor-verified 2026-11-22), not re-counted here.

## 5. Stores and journals

- Default store: `.hive` (`cli.py:23`, `--store`).
- SQLite store (`storage.py:45`): tables `jobs`, `events` (AUTOINCREMENT `seq`, the only journal), `kv`.
- Checkpoints: `checkpoint_manager.py` writes artifacts into the store and `kv` keys `checkpoint:<ref>`, `current_checkpoint`, `previous_checkpoint`.
- Context emergency stop: `<store_root>/…emergency_stop` file (`context_policy.py:~232`).
- Console stop: `<root>/STOP` file (`console.py:355`).
- Usage ledger (new, untracked): JSONL hash chain in `usage_ledger.py:37`; path is caller-supplied, no default store path confirmed.

## 6. Capability labels

| Capability | Label | Basis |
|---|---|---|
| hive Python package | SOURCE_ONLY | `pyproject.toml`; no install verified |
| Docker daemon | RESPONDING | `docker version` |
| `myr5-hold-local` model | INSTALLED | `ollama list`; not called |
| Context policy preflight gate | CONFIGURED | `configs/agent_context_policy.yaml` (modified, uncommitted); suite reported green |
| Structured data / Python mission path | TESTED (reported) | `CURRENT_STATE.md:24`; not reproduced |
| Operator console | TESTED (reported) | `console.py`, reported in `CURRENT_STATE.md` |
| Live model demo (5/73/7) | TESTED (reported, one run) | `REPORT.md`; store absent here |
| DecisionGateway | SOURCE_ONLY | committed fac5586, only the `context decide` CLI and tests call it |
| UsageLedger | SOURCE_ONLY | untracked, no caller in dispatch |
| RunAnywhere / Obscura adapters | SOURCE_ONLY (lock entries only) | `integrations/sources.lock.json:88`, `:108`; no adapter module |
| Any production promotion | none | `production_promoted: false` throughout; no PRODUCTION_ENABLED evidence |

## 7. Documents

Present: `README.md`, `AGENTS.md`, `pyproject.toml`, `docs/CURRENT_STATE.md`, `docs/NEXT_WORK_ITEM.md`, `docs/HIVE_RUNBOOK.md`, `docs/CONTEXT_GOVERNANCE.md`, `docs/RUN_HIVE.md`, `docs/OPERATIONAL_PROTOTYPE.md`, `docs/reviews/integration-sol-final-20261121.md`.

Missing (requested targets): `docs/adr-hive-unified-integration.md`, `docs/hive-improvement-loop.md`, `docs/runbooks/hive-local-operator.md`, `INTEGRATION_REPORT.md`.

## 8. Gap summary

See `build/unified/gap-map.json` (25 targets): **EXISTS 6, PARTIAL 10, MISSING 9**.

Key MISSING seams: scoped delegation/role registry, RepoTreeIndex/SelectiveFetcher/ContentCache, OODAController, RunAnywhere and Obscura adapters (OFF), and the four requested docs.

## 9. Caveats

- Labels are from source reading and the probes above; nothing was executed for this audit.
- `NEXT_WORK_ITEM.md` says the 24-request demo is pending Ian's approval; `REPORT.md` shows it ran. The two documents conflict; `REPORT.md` is the newer record.
- The usage ledger was being written by another worker during the audit; its status may change.
