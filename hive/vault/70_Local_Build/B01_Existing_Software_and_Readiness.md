---
id: "B01"
title: "Existing software and readiness"
type: "build"
status: "proposed"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/build
---

# Existing software and readiness

## Grounding

Use the 15 November inventory as the starting snapshot. This session recovered it; it did not freshly inspect the PC. “Graphy” is treated as **likely Graphify** from that inventory and must be checked locally.

The recorded vault path is **D:/MIcroMillionaire**. Preserve its spelling and confirm its current location before integration.

## Core software

| Tool | Recorded readiness | HIVE role | Local verification |
|---|---|---|---|
| Obsidian 1.13.4 | Installed in 2026-11-15 snapshot | Human-readable research and decision pages | Confirm current executable and vault selection; import new HIVE folder without overwriting unrelated notes. |
| Existing Obsidian vault | Recorded in 2026-11-15 snapshot | Existing linked studio knowledge base | Confirm exact current path, backup/versioning, note conventions, and boundaries before integration. |
| Studio Brain | Running in 2026-11-15 snapshot | Read/retrieve vault context and evidence-backed notes | Recheck brain_context/brain_search availability and documented write interface; preserve source provenance. |
| Graphify | Source only in 2026-11-15 snapshot | Candidate graph indexing and retrieval adapter; likely tool meant by graphy | Inspect Graphify-Labs/graphify revision, environment, entrypoint, formats, and local smoke test; identity is an inference from inventory. |
| Ruflo | Connected in 2026-11-15 snapshot | Existing agent coordination adapter and shared memory pointers | Recheck MCP schema and routing; do not infer durable execution guarantees from an earlier responding tool. |
| LAYA | Prepared; localhost:8791 offline in 2026-11-15 snapshot | Candidate typed router/classifier | Inspect D:/Repos/laya, cached model, engine/version, service startup, calibration; brain previously used deterministic fallback. |
| Code Review Graph | Prepared in 2026-11-15 snapshot | Optional code structure index | Verify entrypoint/environment and D:/External Tools/code-review-graph; keep code graph distinct from evidence graph. |
| Ollama 0.40.16 | Running in 2026-11-15 snapshot | Existing local model endpoint | Repeat model discovery and actual inference; previous /api/tags succeeded but no inference was requested. |
| LM Studio 0.4.26+4 | Installed; localhost:1234 offline in snapshot | Optional downloaded-model serving and inspection | Start only when needed; verify exact model API, supported formats, inference, and competing GPU load. |
| Soup | Prepared; GPU training not verified | Candidate frontend for inspectable fine-tuning recipes | Also inspect D:/envs/soup-p02-gpu and D:/External Tools/Soup; verify forward/backward step, save/reload parity, and peak memory. |
| Cursor 3.19.13 | Installed in snapshot | Existing coding editor | Verify chosen model/provider and repository access. |
| Orca | Installed in snapshot | Worktree-based coding-agent coordination | Verify configured agents, isolated worktrees, and interfaces; source also D:/External Tools/orca. |
| Codex CLI 0.159.2 | Installed in snapshot | Local coding-agent harness for SOL role if configured | Verify available model IDs, authorization, tool support, and whether execution is local or hosted. |
| Claude Code CLI | Installed in snapshot | Available alternative coding harness | Verify configured provider and capability; no silent substitution for a named assigned model. |
| OpenCode CLI 1.18.33 | Installed in snapshot | Alternative harness with supported local or hosted providers | Verify actual provider/model wiring; source also D:/Repos/opencode. |
| Grok Bot 0.79.4 | Installed in snapshot | Existing agent desktop interface | Verify service access and actual tool interface; installation does not establish local model inference. |
| Grok Build 1.0.5 | Installed; grok.exe resolved on PATH in snapshot | Named Grok integration coder harness candidate | Verify provider, model, credentials, execution scope, and cost policy. |
| OmniRoute 3.8.50 | Installed; credentials/server unverified | Optional gateway for existing providers | Verify server and models; keep optional until a configured route is demonstrated. |
| Python 3.11.9 / 3.12.10 | Installed in snapshot | Runtime, research scripts, local services | Choose and pin an isolated environment after compatibility test. |
| uv 0.12.2 | Installed in snapshot | Reproducible Python environments | Verify launcher and create project-specific lock/environment. |
| Node.js 24.19.0 | Installed in snapshot | JavaScript/MCP/indexing dependencies | Verify versions required by selected local adapters. |
| Git and GitHub CLI | Installed in snapshot | Source lineage, worktrees, reviewable changes | Verify local Git and repository status; remote publishing is a separate action. GitHub CLI path C:/Program Files/GitHub CLI. |
| Docker Desktop 4.95.0 | Installed; daemon unverified | Optional process isolation for generated-code and tool tests | Verify daemon, filesystem restrictions, resource caps, and cancellation. |
| anydoc 0.2.4 | Installed in snapshot | Candidate document-to-text import adapter | Verify formats and extraction fidelity; preserve original files beside derived text. |
| OBS Studio 32.2.2 | Installed in snapshot | Studio workload and interaction testbed | Verify actual path/version from current inventory and measure camera/filter GPU headroom; API readiness not implied. |
| FFmpeg / ffprobe 9.0 | Installed; commands resolved in snapshot | Deterministic video/media workers and artifact verification | Check current command resolution and supported codecs on a local fixture. |
| MOM Channel Surf | Running in snapshot | Existing playback/overlay integration target | Inspect documented interface; observed Python process does not prove HIVE call-loop capability. |
| Unity 6000.6.8f1 | Running in snapshot | Horror/haunt simulation and gameplay testbed | Verify actual project version and interface; preserve current project setup. |
| SOL and NVIDIA Nemotron model endpoints | Named in prior HIVE handoff; reachable endpoints not established by recovered inventory | SOL lead and Nemotron support coder | Discover exact invocation, model ID, provider, locality, tool support, rate limits and available authorization. Never report an assigned role as executed without endpoint evidence. |


## Model selection

Start by benchmarking a model already loadable in Ollama or LM Studio. The inventory lists several downloaded GGUF models; downloaded files are not evidence of acceptable latency, task quality, or training compatibility.

The earlier 0.6B/1.7B/4B ladder remains a comparison proposal. It was not selected by a billion-parameter training experiment. See [Model size, resource budgets, and larger hive scales](../51_Prior_Methods/H12-Capacity-and-Scale.md).

Keep these decisions separate:

- Which model can serve the existing workload.
- Which compatible checkpoint can actually be trained.
- Which engine can load a candidate adapter or model version.
- Which model is best under measured quality and resource limits.

## Locality and versions

A locally running coding harness may invoke a hosted model. Record code execution location, inference provider, and data path separately. The default HIVE runtime and research records stay local; use existing remote coding/teacher routes only within their already configured scope.

Pin upstream revisions and environment locks after successful smoke tests. Verify model, adapter, and dataset terms separately from repository licenses.

## Downloaded model candidates from the snapshot

| Model | Recorded path | What remains unverified |
|---|---|---|
| myr5-hold-local:latest | D:/Ollama/models | Verify loadability, task quality, provenance, resource use, context and structured-output behavior. |
| gpt-oss-20b | D:/LMStudio/models/lmstudio-community/gpt-oss-20b-GGUF | GGUF verified; load/task fit not established. A GGUF file does not establish a compatible trainable checkpoint. |
| Qwen3.5-9B | D:/LMStudio/models/lmstudio-community/Qwen3.5-9B-GGUF | GGUF and projector verified; load/task fit not established. A GGUF file does not establish a compatible trainable checkpoint. |
| Qwen3.6-35B-A3B | D:/LMStudio/models/lmstudio-community/Qwen3.6-35B-A3B-GGUF | GGUF and projector verified; total storage and active compute differ. A GGUF file does not establish a compatible trainable checkpoint. |
| Qwen3.8-27B | D:/LMStudio/models/lmstudio-community/Qwen3.8-27B-GGUF | GGUF and projector verified; load/task fit not established. A GGUF file does not establish a compatible trainable checkpoint. |
| Devstral Small 2 24B Instruct 2512 | D:/LMStudio/models/lmstudio-community/Devstral-Small-2-24B-Instruct-2512-GGUF | GGUF and projector verified; load/task fit not established. A GGUF file does not establish a compatible trainable checkpoint. |
| Muse Glimmer 30B | D:/LMStudio/models/lmstudio-community/Muse-Glimmer-30B-GGUF | GGUF/projector verified; filename about 17 GB, fitting not tested. A GGUF file does not establish a compatible trainable checkpoint. |
| Ornith 1.0 9B | D:/LMStudio/models/ornith-ai/Ornith-1.0-9B-GGUF | GGUF verified; load/task fit not established. A GGUF file does not establish a compatible trainable checkpoint. |
| Qwen3.5 9B Antidoom run9 | D:/LMStudio/models/jiguack/qwen35-9b-antidoom | Q4_K_M GGUF verified; training recipe/result not audited here. A GGUF file does not establish a compatible trainable checkpoint. |
| Colibri P02F / OLMoE research model stores | D:/models | Inspect colibri-p02f, olmoe-source-p02f and olmoe-source-p02f2 with engine and checksum/manifest checks. |


## Inventory source

[Ian-AI-Generation-and-Game-Design-Software](../50_Source_History/R18_Ian_AI_Generation_and_Game_Design_Software.md)
