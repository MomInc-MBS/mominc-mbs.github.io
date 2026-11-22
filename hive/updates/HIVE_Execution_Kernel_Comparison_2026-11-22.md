---
id: HIVE-KERNEL-COMPARISON-2026-11-22
schema_version: "1.0"
title: "HIVE Execution Kernel Comparison — HIVE, Aden Hive, Ruflo"
date: 2026-11-22
status: "source-inspection; nothing executed; not a measured comparison"
project: HIVE
artifact_type: comparison
priority: high
---

# HIVE — Execution kernel comparison

**Purpose:** Compare, in detail, the three candidates for the part of HIVE that starts work, tracks it, recovers it and enforces limits. Requested by [owner decision 10](/hive/notes/DIRECTION/).

**Method and limits:** Source and documentation were read on 22 November 2026. **Nothing was installed or run.** No mission was executed on any of the three, so there are no speed, quality or cost measurements here. Versions read: the HIVE 0.4.0.dev1 published source ZIP; Aden Hive at its 17 November 2026 commit (package version 1.0.15); Ruflo at its 22 November 2026 commit (package `claude-flow` 3.80.1). Ruflo was surveyed, not read in depth.

## 1. What each one is

**HIVE kernel.** A small Python service with no runtime dependencies. A SQLite store holds jobs and content-addressed artifacts. One executor claims a job, checks it against pre-declared routes and budgets, runs it, has a deterministic verifier measure the result, and records evidence. It does not run code written by a model. Its purpose is to make every result checkable.

**Aden Hive.** An agent runtime built on one primitive, the agent loop. A long-lived "queen" agent does the first unit of work herself, saves the method as a skill, then starts worker clones in parallel. Workers write rows to a shared SQLite "tracker" table, and the queen checks progress with SQL. Its purpose is to get many similar units of real work done reliably.

**Ruflo.** A Node and Rust orchestration layer built around Claude Code and Codex as the execution host, with swarm modes, a router and memory features. Its purpose is to coordinate many coding-assistant agents.

## 2. Side by side

| Dimension | HIVE kernel 0.4.0.dev1 | Aden Hive 1.0.15 | Ruflo 3.80.1 |
|---|---|---|---|
| Language and runtime | Python, standard library only | Python 3.11+, Node 20+ for the dashboard | Node 20+, TypeScript, Rust crates |
| Size | About 13,600 lines of Python including scripts | About 125,000 lines of Python in `core`, excluding tests | Large; not counted |
| Dependencies | None | pydantic, anthropic, litellm, mcp, fastmcp, croniter, psutil, more for tools | Many; tied to Claude Code or Codex |
| License | Yours | Apache 2.0 | MIT |
| Unit of execution | A job on a pre-declared route (tool, model call, or fixed workflow) | An agent loop that chooses its own tool calls | An agent session in the host assistant |
| Who decides the next step | The governor, from a finite list of feasible routes | The model, turn by turn | The model and swarm coordinator |
| Parallel work | One worker at a time, enforced by a lock | Worker clones, four at a time by default, others queued | Swarm topologies |
| Shared state | Job table plus immutable artifacts | Tracker table the queen defines; workers upsert one row per unit | Shared memory store |
| Crash recovery | Leases with owner and generation; `recover()`; restart replay checked with unchanged budget | Every agent saves state to disk and resumes; "what's left" is a fresh tracker query | Not verified |
| Batch runs | Not present | Playbooks with retry, backoff, rate-limited lanes and a dead-letter list | Not verified |
| Budgets | Finite request, token, time and memory ceilings; operator approval file needed for live inference | Hard limits on turns and tool calls per worker; no limit in dollars | Not verified |
| Isolation of risky work | Docker adapter for code; model-written code is not executed | Built-in tools, including shell, run inside the Hive process; no Docker image | Not verified |
| Models | Local Ollama on loopback only | Any LiteLLM provider, including Ollama | Hosted assistants first |
| Tools and integrations | A few deterministic tools | Shell, files, search, PDF, scraping, browser bridge, any MCP server | MCP tools; a third-party review reports a share are stubs |
| Scheduling | None | Cron, interval and webhook triggers | Not verified |
| Human in the loop | STOP and resume in a local console; approvals by file | Colony approval, inbox, Telegram and Slack escalation | Not verified |
| Independent verification | Deterministic verifier separate from the runner; reviewer must differ from author | The queen checks worker rows; an optional judge can ask for a retry | Not verified |
| Held-out promotion gate | Yes. Fail-closed; nine required evidence flags; at least 24 matched held-out tasks with a positive confidence bound | None found | None found |
| Learning across sessions | Finite route selector updated from development feedback only; candidates quarantined until gated | Memory notes, learned skills, playbooks. Its documentation states there is no graph and no cross-generation code rewriting | Claimed router and pattern learning |
| Skill format | Own records | Open Agent Skills format | Own formats |
| Evidence and audit | Hashes, provenance, publication manifests, rejected candidates kept | Tracker rows and session files | Not verified |
| Users and upkeep | You | Active company and community | Active |

## 3. What differs in kind

1. **Who is trusted.** HIVE trusts a verifier and a gate, and treats the model as a part that must prove its output. Aden trusts the queen to check her workers. That is the difference between a measured system and a managed one.
2. **What the model may do.** In HIVE the model picks from routes someone declared. In Aden the model writes its own next step, including shell commands, inside the same process. HIVE's rule against executing model-written code and Aden's in-process shell are not compatible without a sandbox around Aden.
3. **What "improves" means.** Aden says its mechanisms make a colony more reliable on problems it has already met, not more capable in general, and it retired graph evolution in version 1. HIVE's claim is exactly the one Aden stepped back from: improvement that is tested and compounds.
4. **Scale of work.** Aden is built for dozens of similar units in parallel with resume. HIVE runs one job at a time.

## 4. What HIVE's kernel lacks that Aden has

Ranked by usefulness to HIVE.

1. **A tracker table as the source of truth for a batch**, so "what is left" is a query and re-running resumes.
2. **Bounded parallel workers** with a queue.
3. **Playbooks**: a deterministic runner over rows with retry, backoff and dead-letter.
4. **Pilot first, then fan out**: do one unit, record the method, then repeat it.
5. **The open skill file format** (already [owner decision 13](/hive/notes/DIRECTION/)).
6. **Escalation to a person through a messaging channel** when a run stalls.
7. **Triggers** for scheduled runs.
8. **A model gateway** covering many providers.

## 5. What Aden lacks that HIVE's kernel has

1. A held-out promotion gate and a release registry with rollback for learned artifacts.
2. Separation of evaluator answers from the worker.
3. Differentiated specialists and deterministic experts. Its workers are clones.
4. Finite, operator-approved inference budgets.
5. Isolation for code execution.
6. A zero-dependency core that can be read in a day.

## 6. Options

| Option | What changes | Gain | Cost and risk |
|---|---|---|---|
| A. Keep the HIVE kernel; port patterns 1 to 4 from section 4 | A tracker table, a worker pool and a playbook runner added to the existing store and executor | Parallel batch work without giving up the gate, budgets or isolation | You build and test it. A few hundred lines each, by estimate. |
| B. Run Aden Hive as one route behind the HIVE kernel | HIVE treats a colony as a specialist: it hands over a bounded task, then verifies the output independently | Aden's tools, browser and parallelism at once | A large dependency; its shell tools need a container around them; its internal steps are not HIVE evidence |
| C. Replace the HIVE kernel with Aden Hive | HIVE's gate, evidence and approval rebuilt on top of Aden | Community upkeep of the runtime | Loses the property that every step is declared and checked; biggest rework; ties HIVE to another project's direction, which already changed once |
| D. Ruflo as the base | — | — | Wrong fit: Node-based, built around hosted coding assistants, with reported stubs. Keep only as the optional adapter already named in the framework |

## 7. Assessment

**[SYNTHESIS]** Option A fits the design best. The kernel is where HIVE's guarantees live, and neither alternative has them. Option B is worth one trial later as a way to borrow tools, with Aden inside a container and treated as an unverified specialist. Option C gives up what makes HIVE different. Option D is not recommended.

This is a reading of source, not a measurement. The mission comparison in [owner decision 10](/hive/notes/DIRECTION/) is still unrun and would need its own approved budget.

## 8. Open

- Whether a single-writer SQLite store holds up under a worker pool, or needs a queue in front.
- Whether parallel local-model calls help at all on one GPU, where requests are served one at a time.
- Whether Aden Hive's agent loop can be driven with a fixed tool allowlist tight enough to meet HIVE's boundary rules.
