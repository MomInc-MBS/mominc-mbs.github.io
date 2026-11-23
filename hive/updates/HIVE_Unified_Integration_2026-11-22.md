---
id: HIVE-UNIFIED-INTEGRATION-2026-11-22
schema_version: "1.0"
title: "HIVE Unified Integration Campaign — 22 November 2026"
date: 2026-11-22
status: "engineering-integration-tested; zero model calls; Level A not accepted; learning unproven"
project: HIVE
artifact_type: evidence_report
priority: high
---

# HIVE unified integration — 22 November 2026

**Status: ENGINEERING_INTEGRATION (INTEGRATION_TESTED).** Full suite **689 passed, 3 skipped, 0 failed** at `25f19b2`. **Zero model calls** and $0 of HIVE runtime spend. No Level A acceptance, no learning claim, P2 still quarantined.

Baseline was `59d9b5e`, the [live-demo record](/hive/notes/LIVEDEMO/). Version is still 0.4.0.dev1; dev4 and dev6 artifacts are untouched, and P0 governs.

## What was built

One HIVE-native architecture: `Store`, `Executor` and `ContextPolicy` stay canonical, and new modules extend them. No second coordinator, daemon or database was added.

| Module | Role | State |
|---|---|---|
| Dispatch gate | Runs the fail-closed context preflight before every real Ollama request and appends to the usage ledger after it. Replay and tool routes are never gated | Wired, integration-tested (`32afa0e`) |
| Usage ledger | Hash-chained record of requests and tokens; unknown model raises | Wired via the dispatch gate (`7de5957`) |
| Run states | Durable job transitions and effect receipts in the existing Store SQLite | Wired into the Executor (`25f19b2`) |
| Role registry | Role deny checks; the builder role holds model dispatch | Checked in the dispatch gate (`25f19b2`) |
| Checkpoint promote | Requires a passing review-gate verdict; rollback only to a previously promoted checkpoint | Gate in place; **no production code promotes** (tests assert it) |
| Decision gateway | Typed decisions, including MODEL_ROUTE | Reachable from the CLI only; **not on the dispatch path** |
| repo_intel | Selective remote git tree/fetch with blob-hash verification, https only | Standalone, unit-tested |
| OODA controller | Bounded experiments with a hash-chained step log; wall-clock limit enforced | Unit-tested; **no production driver** |
| RunAnywhere and Obscura adapters | Optional adapters | **OFF**; both refuse to run even when enabled |

Campaign commits, in order: `fac5586`, `7de5957`, `e3bc72b`, `caa0ebe`, `6e67d49`, `b5a025c`, `21c3e96`, `32afa0e`, `a6952cf`, `25f19b2`. A passing unit test does not mean a gate protects a run: modules marked standalone, CLI-only or no-driver above are not on any live path.

## Tests

| Point | Result |
|---|---|
| Earlier reported | 488 passed, 3 skipped |
| `32afa0e` (conductor-run) | 661 passed, 3 skipped, 0 failed |
| `25f19b2` (worker-run, 36:52) | **689 passed, 3 skipped, 0 failed**; the 86 focused final-wave tests were re-run by the conductor and pass |

A short temporary directory is needed on Windows, because long test paths hit MAX_PATH.

## Evidence

- Preflight blocks with zero usage recorded.
- Role deny, path traversal, repo-transport and binary/oversize guards are in place.
- Hash-chain tamper detection covers the ledger, run events and OODA steps.
- Rollback is allowed only to a previously promoted checkpoint.
- The conductor reviewed every patch before commit and fixed: wrong repositories in the sources lock, a ledger chain race, a repo_intel remote-transport and `-C` bug, an OODA missing-verifier hole, a request-cap key bug, and a wrong store path in the audit.
- Upstream decisions: all nine upstream projects are pattern-only and no code was imported. One is GPL-3.0, so no code may be copied. Two projects have license NOASSERTION and one has no SPDX license; each needs a written license review before anything moves in.

## Limitations

- **Level A: NOT ACCEPTED.** It needs six unused data sources and six unused Python snapshots, with at least 10 of 12 accepted. Not attempted here.
- **Level B: UNTESTED.** It needs at least 24 source-disjoint holdouts.
- **Learning is unproven.** The only comparison (the live demo) tied and was rejected.
- **P2 is quarantined.** P0 is the governing policy; no production path promotes.
- The cross-process ledger lock is missing: the ledger uses an in-process lock only, so two processes could fork the chain.
- Worker-agent token spend was not measured. The usage ledger governs HIVE runtime only.
- The context A/B comparison was not run in this campaign.
- Grok was removed mid-campaign because it stalls on larger context. Fable was not used.

## Next actions

1. Wire the decision gateway MODEL_ROUTE at dispatch as an explicit, reviewed route change.
2. Add a cross-process file lock to the usage ledger.
3. Add an OODA driver for one bounded experiment, using repo_intel as its first real use.
4. Record written license reviews for the NOASSERTION and no-SPDX upstreams.
5. Level A needs the owner to supply 12 unused, approved sources.

Source revision: `f5fbb1a` of the HIVE repository (code `25f19b2`). Publication grants no runtime authority and does not promote a quarantined policy or expand any budget. Private evaluator stores and per-case holdout labels and results are not published.
