---
id: HIVE-RESEARCH-UPDATE-2026-11-22-EXTERNAL-LANDSCAPE
schema_version: "1.0"
title: "HIVE Research Update — External Landscape of Similar Systems"
date: 2026-11-22
status: "research-synthesis; not-implementation-evidence; external claims not reproduced"
project: HIVE
artifact_type: database_update_handoff
priority: high
focus:
  - external-landscape
  - harness-self-improvement
  - promotion-governor
  - compounding-learning
---

# HIVE — Research Update: External Landscape of Similar Systems

**Database update purpose:** Record external programs, software and models that work partly or wholly like HIVE, found by web research on 22 November 2026. This is a **research synthesis**. Nothing here was run, reproduced or measured on HIVE hardware. External results keep the scope their authors reported.

Read it with [the integrated design map](/hive/notes/WHOLE/), which places each of these parts into the HIVE design, and with the earlier [100-project catalog](/hive/notes/CATALOG/), which this update extends.

## 0. Change log — what is new

| ID | Finding | Classification | Database action |
|---|---|---|---|
| EXT-01 | Every HIVE component has an external counterpart. No single external project was found that combines all of them. | [SYNTHESIS] | Add coverage map (section 4). |
| EXT-02 | The 100-project catalog does not cover the systems closest to the HIVE learning loop. Regimes, GEPA, ACE, Darwin Gödel Machine, Hyperagents, Meta-Harness, SIA, ADAS, AFlow and Agent Lightning were absent from the site search index before this update. | [SOURCE] site index, 22 Nov 2026 | Add entries in section 2; do not relabel old catalog outcomes. |
| EXT-03 | A published protocol now tests whether optimizer gains compound across task phases. Two of three optimizers failed it. The one that passed enforces a no-regression constraint inside the search. | [SOURCE] | Link to G04 and EXP-05. |
| EXT-04 | A published, open-source loop (Regimes) implements held-out-gated promotion on an event-sourced runtime. | [SOURCE] | Compare against the HIVE promotion governor before further governor work. |
| EXT-05 | The field now names this area "harness self-improvement" or "harness evolution". | [SOURCE] | Add the term to search vocabulary. |
| EXT-06 | At least four other active agent projects use the name Hive, HIVE or hive-mind. | [SOURCE] | Record in section 3; naming decision is open. |

### Evidence legend

- **[SOURCE]** Stated in the linked external page or paper. Not reproduced here.
- **[SYNTHESIS]** Comparison or reasoning made in this update.
- **[VENDOR]** A claim from the project's own marketing or from blog posts, with no controlled study found.
- **[OPEN]** Not resolved by this research.
- **[UNREAD]** Surfaced only as a citation; the primary page was not read.

## 1. What HIVE was compared against

HIVE as published on this site: framework 0.2, coder directions 0.4, the adaptive-organization addendum, and implementation status at 0.4.0.dev1. In short: a local-first, modular organization of specialists and deterministic tools, with a capability registry, selector, execution kernel, supervisors, memory and evidence services, a learning workbench, and a release registry that promotes only candidates that pass held-out gates. Six layers can change (L1 memory, L2 procedures, L3 routing, L4 parameters, L5 topology, L6 communication).

## 2. Closest external systems

Ordered by how much each bears on HIVE's open work.

### EXT-S01 — Regimes on ActiveGraph

- **What it is [SOURCE]:** An improvement loop on an event-sourced agent runtime. It diagnoses a failed evaluation, proposes a repair at one typed point in the pipeline, and promotes it only after static checks, sandbox execution, in-sample evaluation and held-out validation. Each promote or discard is a logged event that replays deterministically.
- **Reported result [SOURCE]:** On LongMemEval-S across five seeded splits, 44 candidates authored, 27 discarded in-sample, 2 discarded at the held-out gate, 14 promoted. Held-out gains of +0.05 to +0.10 on four splits. The author states the held-out gate rarely fires, so selection pressure is low.
- **Overlap with HIVE [SYNTHESIS]:** promotion governor, evidence service, restart replay.
- **Has that HIVE lacks:** a promoted held-out gain on a public benchmark; a failure taxonomy that routes each failure to a pipeline seam.
- **HIVE has that it lacks:** multiple specialists; routing, parameters and topology as change targets.
- Links: [paper](https://arxiv.org/abs/2606.10241) · [code](https://github.com/yoheinakajima/regimes)

### EXT-S02 — "Do Agent Optimizers Compound?" and RELAI-VCL

- **What it is [SOURCE]:** A continual-learning evaluation. Optimize an agent on 12 Terminal-Bench 2.0 tasks, measure transfer to 10 new tasks without re-optimizing, then optimize again and check whether the first gains survive. 200 rollouts per phase.
- **Reported result [SOURCE]:**

| Agent | Phase 1 | Transfer | Final | Lifelong average |
|---|---|---|---|---|
| Baseline | 62.5% | 56.8% | 56.8% | 58.7% |
| GEPA (prompt only) | 70.8% | 54.5% | 72.7% | 66.0% |
| Meta-Harness | 66.6% | 68.2% | 59.1% | 64.6% |
| RELAI-VCL | 79.2% | 72.7% | 77.3% | 76.4% |

- **Reading [SYNTHESIS]:** GEPA overfit on transfer. Meta-Harness transferred, then regressed in the second phase. Only the method with a no-regression constraint inside the search both transferred and kept improving. The authors present this as an observation on 22 tasks under one protocol, not a general law.
- **Overlap with HIVE:** this is the design of gap G04 and of EXP-05, already specified by someone else.
- Link: [paper](https://arxiv.org/pdf/2607.14004)

### EXT-S03 — Hermes Agent (Nous Research)

- **What it is [SOURCE]:** A self-hosted, MIT-licensed agent with a built-in learning loop. After non-trivial work it writes a skill file, revises that skill on later use, keeps searchable cross-session memory, and exports trajectories for RL training. Works with any model endpoint.
- **Overlap with HIVE:** L2 procedural learning, the memory service, local-first operation.
- **Has that HIVE lacks:** a large user base; a skill file format compatible with the open agent-skills convention; a reported DSPy plus GEPA route for evolving skills without a GPU.
- **HIVE has that it lacks [SYNTHESIS]:** any gate. No held-out test stands between a skill edit and its use.
- **[VENDOR]:** "about 40% faster on repeated research tasks" comes from blog posts.
- Link: [documentation](https://hermes-agent.nousresearch.com/docs)

### EXT-S04 — Letta and Letta Code

- **What it is [SOURCE]:** The MemGPT team's platform. Sleep-time agents reorganize memory while idle. Skill Learning turns past trajectories into skills. Learned context is versioned in git. Their stated position is that agents should learn in "token space" (prompts, skills, memory) before weights, because such changes are inspectable and portable across models.
- **Overlap with HIVE:** the wake, capture, consolidate, evaluate cycle; L1 and L2. The existing catalog entry for MemGPT/Letta predates sleep-time agents, Skill Learning and the June 2026 "memory models" direction.
- **Has that HIVE lacks:** git as the registry for non-parameter changes, giving diff, rollback and audit.
- **Their own caveat [SOURCE]:** current sleep-time methods are expensive at scale and tend to overgeneralize.
- Links: [Skill Learning](https://www.letta.com/blog/skill-learning/) · [continual learning in token space](https://www.letta.com/blog/continual-learning)

### EXT-S05 — GEPA and optimize_anything

- **What it is [SOURCE]:** An evolutionary optimizer for any text artifact (prompts, code, agent architectures, configurations). The user supplies an evaluator; the system does reflective mutation with Pareto selection. Available inside DSPy.
- **Overlap with HIVE:** a ready-made candidate generator for the learning workbench across L2, L3, L5 and L6.
- **Caution [SYNTHESIS]:** see EXT-S02. Unguarded, it overfit on transfer.
- Link: [repository](https://github.com/gepa-ai/gepa)

### EXT-S06 — Darwin Gödel Machine, Hyperagents, Meta-Harness, SIA

- **What they are [SOURCE]:** The research line on agents that rewrite their own scaffold. DGM keeps a growing archive of self-modified coding agents. Hyperagents makes the improvement mechanism itself editable. Meta-Harness treats harness design as an outer-loop search. SIA updates the harness and then the weights of the same agent.
- **Overlap with HIVE:** SIA changes L2/L3 and L4 in one loop, the nearest match to the HIVE state tuple. Hyperagents bears on [D09](/hive/notes/D09/).
- **HIVE has that they lack [SYNTHESIS]:** local-first operation and evidence-status discipline. These systems optimize against benchmarks with frontier API models.
- **[UNREAD]:** Huxley-Gödel Machine, Group-Evolving Agents, RRSI, Harness², Hierarchical Self-Improvement.
- Links: [Hyperagents](https://ai.meta.com/research/publications/hyperagents/) · [SIA](https://arxiv.org/abs/2605.27276)

### EXT-S07 — ACE (Agentic Context Engineering)

- **What it is [SOURCE]:** Treats an agent's context as an evolving playbook updated by generate, reflect and curate steps, using small incremental edits. Names two failure modes: brevity bias and "context collapse", where repeated rewriting erodes detail. Reports +10.6% on agent tasks and +8.6% on a finance benchmark.
- **Overlap with HIVE:** L1 and L2 updates without parameter changes.
- Link: [paper](https://arxiv.org/abs/2510.04618)

### EXT-S08 — Topology search: ADAS, AFlow, MaAS, GPTSwarm, EvoAgentX

- **What they are [SOURCE]:** Methods that search over multi-agent workflow structure. ADAS frames design as search over code. AFlow uses tree search over reusable operators. EvoAgentX packages TextGrad, AFlow and MIPRO in one open-source platform.
- **Overlap with HIVE:** L5, and finding NEW-01 of the adaptive addendum (organization as a learnable component). This is an established subfield with baselines.
- Links: [EvoAgentX](https://github.com/EvoAgentX/EvoAgentX) · [survey of self-evolving agents](https://arxiv.org/pdf/2507.21046)

### EXT-S09 — Parameter-side tools: Agent Lightning, Doc-to-LoRA, Text-to-LoRA

- **Agent Lightning [SOURCE]:** Collects traces from an existing agent through a model proxy and trains with RL, prompt optimization or fine-tuning, with almost no change to the agent code. Can target one agent inside a multi-agent system.
- **Doc-to-LoRA and Text-to-LoRA [SOURCE]:** A hypernetwork that produces a LoRA adapter from a document or a task description in one forward pass. Public checkpoints exist for small base models.
- **Overlap with HIVE:** L4. The gap page records no training checkpoint.
- Links: [Agent Lightning](https://microsoft.com/en-us/research/project/agent-lightning/) · [Doc-to-LoRA](https://sakana.ai/doc-to-lora/)

### EXT-S10 — Aden Hive

- **What it is now [SOURCE]:** A model-agnostic runtime in which a persistent "Queen" agent does one unit of work and spawns worker clones, coordinated through a shared tracker ledger and a persistent plan. Crash-safe park and resume, cost enforcement, human escalation. Apache 2.0.
- **Shift [SOURCE] fork READMEs:** Earlier descriptions say a coding agent generates a node graph and the framework evolves the graph on failure. The current upstream README says there is no graph and leads with the harness.
- **Overlap with HIVE:** execution kernel, supervisors, budgets.
- **HIVE has that it lacks [SYNTHESIS]:** differentiated specialists (its workers are clones), held-out gates, a learning workbench, parameters.
- Link: [repository](https://github.com/aden-hive/hive)

### EXT-S11 — Ruflo

Already named in the framework as a possible execution adapter.

- **Claims [SOURCE]:** swarm topologies, queen and worker roles, a Q-learning router, a pattern learner (SONA), ReasoningBank, EWC++.
- **Check first [SOURCE] third-party review:** The project's own May 2026 self-audit is reported as putting about 195 of 240 tools in real code, with agent execution, hive-mind transport, workflow runtime and neural prediction listed as stubbed.
- Links: [repository](https://github.com/ruvnet/ruflo) · [review](https://alphasignalai.substack.com/p/how-ruflo-turns-claude-code-into)

### EXT-S12 — MELD

- **What it is [SOURCE]:** Recursive self-improvement for multi-agent scientific discovery, scored by private evaluators that run outside the agent workspace. Labels, evaluator state and scoring files are inaccessible to the agents and restored before each validation.
- **Overlap with HIVE:** the open "stronger evaluator isolation" gap.
- Link: [paper](https://arxiv.org/pdf/2610.24454)

## 3. Other projects using the name

| Project | What it is | Note |
|---|---|---|
| Aden Hive | EXT-S10 | Largest by adoption. |
| HIVE-AI (THTWASBRUTAL/HIVE-AI) | Role cards, scenario checks, and seeded held-out variants so a candidate cannot pass by memorizing inputs; private seeds for real promotions. | Close in spirit to HIVE quarantine. Only one pull request was read. |
| HivemindOS | Local-first control room for agent fleets across a user's own machines, with a shared Obsidian vault. | Has a crypto token named HIVE. |
| Ruflo hive-mind mode | Queen and worker swarm mode. | EXT-S11. |
| Apache Hive, Hive blockchain | Unrelated. | Dominate plain web searches for "hive". |

The naming decision is **[OPEN]**.

## 4. Coverage map

| HIVE part | Closest external work | In the 100 catalog before this update |
|---|---|---|
| Promotion governor, quarantine, rollback | Regimes, RELAI-VCL, HIVE-AI | No |
| Learning workbench (candidate generation) | GEPA, DGM, Meta-Harness | AlphaEvolve only |
| Procedures from experience (L2) | Hermes skills, Letta Skill Learning, ACE | Partly (Voyager, Reflexion) |
| Sleep and consolidation | Letta sleep-time agents; Google sleep and Nested Learning | Google yes; Letta partly |
| Topology as learnable (L5) | ADAS, AFlow, MaAS, GPTSwarm, EvoAgentX | No |
| Parameters from traces (L4) | Agent Lightning, SIA, Doc-to-LoRA | No |
| Selector and routing (L3) | RouteLLM, FrugalGPT, Ruflo router | Yes |
| Execution kernel, leases, resume | Aden Hive, Temporal, LangGraph | Yes, except Aden |
| Evaluator isolation | MELD | No |
| Compounding test | "Do Agent Optimizers Compound?" | No |

## 5. What was not found elsewhere

These look like HIVE's own contribution. **None is demonstrated.** Current status records no beneficial-learning gain and no promotion.

- Six separate change layers under one registry, with each improvement record naming the layer changed.
- Four separated channels, including a teaching channel where admission and evaluation precede promotion.
- Evidence-status labels on every claim, and publication of rejected candidates as results.
- The "use both" rule for organizational modes as an explicit requirement.
- Local-first operation on consumer hardware.

## 6. What external systems have that HIVE does not yet

1. A promoted held-out improvement (Regimes, RELAI-VCL).
2. Results on a public benchmark, so numbers can be compared.
3. An off-the-shelf candidate generator.
4. Git as the registry for non-parameter changes.
5. A skill format other tools can read.
6. Trace capture decoupled from the agent.
7. Users who find failures.

## 7. Limits of this research

- External results were read, not reproduced.
- The HIVE-AI repository page and Lilian Weng's July 2026 survey "Harness engineering for self-improvement" could not be opened. Several papers above cite the survey.
- The 100 existing catalog entries and their historical outcome labels were not rechecked.
- Adoption and speed figures for Hermes and Ruflo are **[VENDOR]**.
- Earlier chat-only HIVE research that was not supplied as a file is not included here.
