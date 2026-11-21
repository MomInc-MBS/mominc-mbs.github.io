# Hive AI working rules

- Confirm this repository and the current branch before changes. This project is
  separate from `D:\AR-Party-Horror`.
- Read `README.md` and `docs/brief.md`. Label assumptions and proposals; do not
  present them as requirements from Ian.
- The overseer coordinates scoped workers, resolves disagreements, and checks
  evidence before accepting completion. Do not create nested workers unless the
  assigned task explicitly requests them.
- Prefer the smallest runnable implementation and existing tools. Do not build a
  dashboard, distributed runtime, or memory service without a demonstrated need.
- Use NVIDIA-hosted and Grok perspectives where useful, within available access.
  Verify provider/model selection and do not silently change providers on failure.
- Assign file ownership before parallel edits. Design reviewers are read-only
  unless their task grants ownership of named files.
- Keep model output separate from execution authority. Scope tools and writes to
  the task. Do not store credentials in the repository, reports, or memory.
- Completion needs observable evidence. A model's statement or another model's
  agreement is not proof. Keep real-provider, simulated, and device test results
  accurately labeled.
- Use Tester Army e2e where the milestone has a relevant end-to-end journey;
  preserve deterministic regression checks and record report/trace paths.
- Private agent memories and Ian's shared brain remain separate. Workers receive
  only the task's explicit context and do not import private memories.
