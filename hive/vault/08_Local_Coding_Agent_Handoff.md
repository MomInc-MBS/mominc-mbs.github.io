---
id: "HANDOFF"
title: "Local coding-agent handoff"
type: "framework"
status: "proposed"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/framework
---

# Local coding-agent handoff

## Mission

Implement the HIVE framework and research workflow in this vault using the user's existing local software. Preserve prior work, keep alternatives visible, and produce measured results rather than architecture claims inferred from a successful demo.

## First instruction to the lead agent

Read [The proposed HIVE framework](01_Framework.md), [Local build roadmap and work packages](07_Local_Build_Roadmap.md), [Existing software and readiness](70_Local_Build/B01_Existing_Software_and_Readiness.md), [SOL, Grok, and Nemotron implementation workflow](51_Prior_Methods/H09-SOL-Coding-Handoff.md), and [AGENTS.md](AGENTS.md). Inspect the actual PC and current repositories. Create a scoped working copy or Git worktree. Do not overwrite the existing Obsidian vault or modify archived evidence.

## Team roles carried forward

| Role | Intended agent | Work |
|---|---|---|
| Lead and integrator | SOL | Architecture, contracts, backlog, dependency order, integration, evidence-based acceptance |
| Connector implementer and reviewer | Grok | Tool interfaces, runtime adapters, source import, Graphify/Studio Brain wiring |
| Contract and reliability implementer | NVIDIA Nemotron | Schemas, capability manifests, event state, supervision, evaluation helpers |
| Research worker | Any verified available agent | One topic/path at a time; supporting, contrary, and adjacent evidence |
| Independent evaluator | Agent not responsible for the change, plus deterministic checks | Inspect the actual artifacts and reproduce relevant outcomes |

These are assigned roles, not claims that those endpoints are currently configured. Discover exact model IDs, invocation, tool support, and locality. A local CLI may use hosted inference; record the actual provider and execution arrangement.

## Parallel work contract

- Give every worker one bounded ticket, owned paths, input hashes, output artifacts, budget, and acceptance criteria.
- Use separate worktrees for code changes; no worker writes into another's worktree.
- Use a single integrator for canonical notes, registry changes, and merged results.
- Let researchers submit proposed source/claim records; admission checks keep them distinct from accepted evidence.
- Reassign roles according to measured capabilities, with the change recorded.
- Keep SOL/Grok/Nemotron instructions portable across the installed harnesses rather than inventing unsupported CLI flags.

## First local ticket

**Ticket W00: recover the current machine state.**

| Input | Required check |
|---|---|
| Existing vault | Confirm D:/MIcroMillionaire and current conventions |
| Studio Brain | Read-only smoke test with a known source and locator |
| Graphify source | Exact revision, dependency environment, entrypoint, output format, semantic provider |
| Ruflo | Current MCP schema and a bounded routing test |
| Ollama / LM Studio | Model inventory, one inference, cold/warm timing, memory |
| Training candidate | Compatible trainable checkpoint, forward/backward step, save/reload parity |
| Named coding agents | Exact reachable model and provider; tools and budget |
| OBS/cameras | Foreground RAM/VRAM and latency baseline |

**Output:** a dated environment manifest, a list of blocked dependencies, and the next executable tickets. Keep credentials out of the manifest.

## Research worker instruction

For the assigned topic, read its history before searching. Create separate paths for meaningful alternatives. Collect primary evidence, counterevidence, failure boundaries, implementations, and an adjacent field. Give every claim a source and scope. Propose an experiment whose result could change the decision. Never mark a proposal as an executed trial.

## Completion record for each ticket

- What changed and why.
- Exact artifacts and versions.
- What was actually executed.
- Measured outcomes and failures.
- Which hypothesis or decision changed.
- Remaining alternatives and reopening conditions.
- Next dependent ticket.

## User review surface

The user should be able to open one decision page and follow its claim to the primary source, prior method, experiment specification, raw run, and current implementation. [Graphify and knowledge adapters](70_Local_Build/B03_Graphify_and_Knowledge_Adapters.md) defines this navigation.
