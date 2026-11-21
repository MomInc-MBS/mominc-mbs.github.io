# Checked capabilities

Observed during this implementation, rather than inferred from the public research graph.

| Component | Readiness / evidence | Use in this slice |
|---|---|---|
| Python 3.11.9 | Existing interpreter; all runtime tests execute | Standard-library controller and worker |
| ffprobe 9.0 | Real version/exit check; binary digest/version in manifests | Read-only SRT probe, combined and guarded procedures |
| CPU / RAM | Ryzen 7 5800, 8 cores / 16 threads; existing machine memory inventory | One admitted task at a time; worker CPU/peak RAM captured |
| RTX 5070 Ti | 16,303 MiB total, 6,355 MiB used, 16% sampled utilization | Existing shared load preserved; no inference/training |
| Ollama | Model-list and residency APIs answered; one downloaded 9B Q4 model, zero resident models | Swappable adapter implemented; real inference unavailable for this run |
| LM Studio | Endpoint timed out | No service started or model swapped |
| Laya | Endpoint timed out; studio context reports heuristic fallback | Not used as a learned routing authority |
| Studio Brain / Ruflo | Context and routing calls answered | Reconnaissance/coordination only; no private memories imported |
| Archived HIVE experiments | ZIP contains source, fixed seeds, data, summaries, requirements and run commands | Retained historical simulations; not rerun in-place |
| Optuna 5.1.0 | Newly installed only in isolated CPU venv from hash-locked dependencies; actual TPE process exercised | Optional development-only recipe proposer; no execution or release authority |

Current file enumeration confirmed these downloaded LM Studio model families: gpt-oss-20b, Qwen3.5-9B, Qwen3.6-35B-A3B, Qwen3.8-27B, Devstral Small 2 24B, Muse Glimmer 30B, Ornith 1.0 9B and Qwen3.5 9B Antidoom run9. Projector files exist for several multimodal models. Colibri P02F and two OLMoE research directories also exist. Existence is not serving readiness, loadability, training compatibility, licensing review or measured task quality.

The operational registry is separate from the research graph. Every enrolled adapter provides supported tasks, permissions, limits, health and provenance. The real benchmark includes `rules`, `probe`, `combined`, and candidate `probe-guard`. Tool discovery alone no longer implies health. Model calls remain excluded; the model transport test uses a deliberately labelled local HTTP fixture.

Inputs are capped at 64 KiB and one concurrent task. Built-in workers have process deadlines and timeout cleanup. Hard memory quotas, server-side model cancellation, full descendant resource accounting and GPU-aware scheduling remain unimplemented.

Before adoption, the active serving Python had none of the 14 reviewed optional research packages installed. [Adoption audit](learning_acceleration_adoption_matrix.md) records platform, licensing, compatibility, costs and deferred alternatives. A bounded directory-name scan found no matching project directories in the searched repository roots; that is not a claim that no equivalent software exists elsewhere on the PC.
