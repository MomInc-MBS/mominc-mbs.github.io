# HIVE CHECKPOINT: M2 protocol frozen (packet M2-0, 24 Nov 2026)

- **Runtime:** `build/working-prototype`. Protocol commit `d4b71d2fb070786245d71666365c270bf8b651d7`; parent `5c901a91f8e5389b46a01259b0165ee456381c40` (EOL-normalised pins).
- **Gate F: frozen.** Protocol `m2-local-model-two-effects-v1`, `docs/M2_PROTOCOL.md`: sha256 of the committed blob `9767b209264d7e871aa46ded4a2413b53d7be3c5c2f3f5aea25fcdf300ea1cf0` (33,440 B, LF); the working file matches.
- **Route:** R = `row-convert-v1` (existing `parse_whole` repurposed for format conversion through one declared-prep view `to_json`; owner chose this option 24 Nov). C = `batch-merge-v1` (composition `[each(parse_whole), aggregate]`, file-level quarantine over `List[Source]`).
- **Research subject:** `openai/gpt-oss-20b`, `D:/LMStudio/models/lmstudio-community/gpt-oss-20b-GGUF/gpt-oss-20b-MXFP4.gguf`, 12,109,565,632 B, sha256 `65d06d31a3977d553cb3af137b5c26b5f1e9297a6aaa29ae7caa98788cde53ab`.
- **Review:** three independent Opus sessions, read-only. R1 BLOCKED (C was a parameterisation of M1; four protocol gaps). R2 BLOCKED (original R not a real repurposing; owner decision needed). R3: design OK; two text blockers (prompt hint leak, approval `model_id`) and seven nits applied before commit.
- **Operator inference approval:** `build/m2/operator_inference_approval.json`, written by the conductor from Ian's message "1 and then go on campaign" (24 Nov 2026). It pins this protocol blob and commit, the model id and weight sha, and the §12 caps.
- **Tests run:** none (document-only packet).
- **Next:** M2-1E (evaluator: generators G7–G9, oracle, fixtures; private F-final/F-reuse) ∥ M2-1A (`src/hive/m2_views.py` with `to_json`, harness, prompts, stub server). Then freeze `build/m2/evaluation_manifest.json`, then M2-2 campaigns on the real model.
