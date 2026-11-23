---
id: HIVE-METABASE-2026-11-22
schema_version: "1.0"
title: "HIVE Base for Later Self-Improvement of the Improver"
date: 2026-11-22
status: "design-proposal; not-implemented; does not open D09"
project: HIVE
artifact_type: design_proposal
priority: medium
---

# HIVE — Base for later self-improvement of the improver

**Purpose:** [Owner decision 11](/hive/notes/DIRECTION/) is: not now, but if a piece must be in the architecture now to make it possible later, give it a good base now. This page names those pieces. It is a **design proposal**. It does not allow HIVE to edit its own improvement mechanism, and [D09](/hive/notes/D09/) stays open.

## 1. What "the improver improving itself" would mean

Today the slow loop has fixed parts: how failures are triaged, how candidates are generated, how they are searched, and how they are judged. Self-improvement of the improver means some of those parts become candidates themselves. Outside examples are the Darwin Gödel Machine and Hyperagents (see [the external landscape](/hive/notes/LANDSCAPE/)).

The risk is specific: a system that can change how it is judged can learn to pass by weakening the judge.

## 2. What has to be true first

Seven conditions. For each: whether the 0.4.0.dev1 source already meets it, by inspection on 22 November 2026.

| # | Condition | Why it must come first | Today |
|---|---|---|---|
| 1 | **A mutability class on every artifact**: frozen, gated, or free | Without a declared boundary, "what may the system change" is answered by accident | Not found as an explicit field |
| 2 | **The judge lives in the frozen class and outside the candidate's reach**: gate code, evaluator data, budgets, approval records | A self-editing system must be physically unable to touch its referee | Partly. The review gate is a pure fail-closed function and the interface cannot create an approval. Stronger evaluator isolation is an open gap and now decided ([decision 7](/hive/notes/DIRECTION/)) |
| 3 | **The improver's own parts are versioned artifacts**: triage rules, candidate generator, search settings, prompts | Something that is code baked into the kernel cannot be proposed, compared or rolled back | Not yet. They are source modules |
| 4 | **A seventh layer ID reserved for "improver"**, beside the six existing layers | Every improvement record names the layer changed. Adding a layer later means re-labelling history | Not present |
| 5 | **A full lineage archive**: every candidate keeps a pointer to its parent, including rejected ones | Self-improving search needs to branch from old variants, not only the current champion | Rejected candidates are kept. Parent pointers were not found by text search |
| 6 | **A measure of the improver itself**: how fast and how durably HIVE improves across task phases | You cannot judge a change to the improver without a score for improving | Not yet. The compounding experiment ([decision 2](/hive/notes/DIRECTION/)) produces exactly this |
| 7 | **Approval authority by class of change** | A change to the improver should need a higher authority than a change to a procedure | Partly. The gate requires a reviewer distinct from the author. Classes of authority were not found |

"Not found" means not found by reading and text search of the published source. Confirm against the working tree.

## 3. What to build now

Only the pieces that are cheap now and expensive to retrofit.

1. **Mutability manifest.** One file listing every artifact type with its class. Gate, evaluator, budget ceilings, approval files and this manifest itself are `frozen`. Procedures, routing policy, memory rules, topology and protocols are `gated`. Scratch and development outputs are `free`. A test fails the build if a `frozen` path changes without a human-signed record.
2. **Layer ID `L7 improver`**, reserved and unused. Records may carry it; nothing may be promoted under it.
3. **`parent_id` on every candidate record**, including rejected ones.
4. **Improver settings read from a versioned file** instead of constants: triage thresholds, candidate count, search budget. No behaviour change; they simply become data.
5. **Authority field on promotion records**, with values such as `gate`, `independent_reviewer`, `owner`. `L7` requires `owner`.
6. **Compounding score recorded per release** once the experiment exists, so the improver has a baseline.

None of these changes what HIVE does today. They change what is written down.

## 4. What stays closed

- No candidate may be promoted under `L7`.
- Nothing in the `frozen` class may be proposed as a candidate.
- No external self-editing system is adopted.

## 5. Conditions to reopen

Reconsider when all of these hold:

- at least one non-parameter promotion has passed the full gate;
- the compounding experiment has a published result with an unchanged control;
- evaluator isolation is shown by a failing access test;
- the mutability manifest has caught at least one attempted change in testing.

## 6. Open

- Whether search strategy and triage should be one artifact or several.
- Whether the frozen class should be enforced by file permissions, a separate process, or a separate machine.
