# Level A source approval packet — PROPOSED_NOT_APPROVED

Prepared 2026-11-23 by worker FG. Research only: zero model inference, nothing executed, no approval exists.
Exact manifest: `build/v04x/level_a_manifest.proposed.json`
(SHA-256 `1125b03286e0ae5b903f2e98876d5b1965ed0c9510c8b92defc892140db65b06`; blob SHAs, sizes, file hashes, license links, checks live there).
Every URL, commit, path, blob SHA and size below was re-checked by real `git fetch` of the exact commit and by `gh api .../contents/PATH?ref=SHA` (both agree). Licenses were read at that commit.

## The twelve sources

| ID | Owner/repo (HTTPS Git URL = `https://github.com/<owner/repo>.git`) | Path (main file) | Commit (40) | Bytes | License (SPDX) | Verifier |
|---|---|---|---|---|---|---|
| D01 | fivethirtyeight/data | airline-safety/airline-safety.csv | 4c1ff5e3aef1816ae04af63218015066e186c147 | 2265 | CC-BY-4.0 (attribution) | `csv_profile_v1` — runs today |
| D02 | plotly/datasets | 2014_apple_stock.csv | 0c447c47b757ad74edecab31f0d72f849d2e67c2 | 5488 | MIT | `csv_profile_v1` — runs today |
| D03 | rfordatascience/tidytuesday | data/2019/2019-01-29/clean_cheese.csv | e3bf4a8cdbd4c3b332eb0bd0c51d57a1b284c395 | 4405 | CC0-1.0 | `csv_profile_v1` — runs today |
| D04 | sindresorhus/cli-spinners | spinners.json | c5f18f654e0f6bdbf830713927f815a42190d774 | 27524 | MIT | JSON schema/identity check — **new verifier needed** |
| D05 | github/choosealicense.com | _data/rules.yml | b851d0a602dc4db48a913cccd3a670b9183eeb09 | 2830 | MIT | YAML schema/identity check — **new verifier needed** |
| D06 | jshttp/mime-db | src/nginx-types.json | ba120a7f71bc8ab7d5299e88c0049063239029a7 | 5083 | MIT | JSON schema/identity check — **new verifier needed** |
| C01 | Suor/funcy | funcy/strings.py (+primitives.py) | a876c7e1cf11e7c746e91fce4632ebfa93865428 | 2463 | BSD-3-Clause | private oracle vs stdlib `re`/`str` |
| C02 | keon/algorithms | algorithms/string/caesar_cipher.py | bd1d152f9ec7331c69be662831610b003b10fc7a | 1015 | MIT | private oracle via `str.translate` + round-trip |
| C03 | pallets/itsdangerous | src/itsdangerous/encoding.py (+exc.py) | 672971d66a2ef9f85151e53283113f33d642dabd | 1409 | BSD-3-Clause | private oracle via stdlib `base64`/`int.to_bytes` |
| C04 | python-validators/validators | src/validators/mac_address.py (+utils.py) | 22786cc6e7283a0fa452c179797e447f798db9f0 | 1000 | MIT | private oracle: hand-written MAC parser |
| C05 | python-humanize/humanize | src/humanize/filesize.py (+i18n.py) | a95004512dde4e8f0269946bb4af754382347441 | 3000 | MIT | private oracle: independent 1000/1024 arithmetic |
| C06 | TheAlgorithms/Python | conversions/roman_numerals.py | 30507bbe41397065728167fb09aa820f9fce8dc7 | 2718 | MIT | private oracle + exhaustive 1..3999 round-trip |

Checks on all twelve: 12 distinct owners; none of the repos, owners, commit SHAs, blob SHAs or file hashes appears in the 55,408 text files of this repo (exclusion list: `datasets/country-list`, `strands-agents/harness-sdk`, `BerriAI/litellm-docs`, `ollama/ollama`, `langchain-ai/docs`, `awslabs/*`, generated smoke fixtures). Topics do not overlap country-list.

## Known limits (read before signing)

- Public files may be in model pretraining data. That exposure is **unknown**, not claimed absent. C02 and C06 are textbook snippets and likely seen; they are the weakest "fresh" evidence.
- D01–D03 expected checks were derived from the pinned bytes by the worker. The independent evaluator must seal independent facts (see manifest) before any run, or a pass proves only parse and identity.
- D04–D06 and C01–C06 need work outside this slice: three new data verifiers, and a `json_function_v1` adapter plus private oracle for each snapshot (closure files are listed in the manifest).
- D01 requires attribution (CC-BY-4.0). D02's underlying quotes are third-party market data; treat as read-only observation, no redistribution.

## Acceptance target

At least **10 independently accepted outputs out of 12 genuinely attempted tasks**, with all R1–R8 and A1–A6 gates, clean provenance and zero critical failures. All 12 attempts are scheduled up front; failures, blocked and abstained tasks stay in the denominator. No fixture passes, no earlier exposed inputs. Level B stays a separate 24+ task study.

## Runtime budget requested

**Option A (default, requested): tool-only.** 0 model calls, $0 paid inference, 0 generated tokens. Per task: max 3 attempts, 16 steps, 1,800 s wall, 64 KiB fetched bytes, 64 files, read-only HTTPS Git intake of the pinned commit only. Aggregate: 12 tasks, 6 h wall. Agent-engineering spend follows the existing moving cap (`.hive/agent-budget.json`), not this approval.

**Option B (only if separately ticked): local model arm for C01–C06 only.** At most 18 local-model requests (6 tasks × 3), 128 generated tokens per request, 2,304 tokens total, concurrency 1, 1,800 active seconds, local models only, $0 paid. Not requested by default; the earlier 24-request allowance is spent and not reused.

## Sign here (single yes/no)

I approve exactly this manifest (SHA-256 above) with **Option A** / **Option A + B** (strike one):  **YES / NO**

Owner: ____________________  Date: ____________

Signing this file is not itself a runtime approval: the real local approval artifact must still be created from it.

## Owner decision (recorded 23 Nov 2026)

Ian, in T3 chat: **"Approve Option A only, under the specified manifest and existing resource limits."**

- Decision: **YES, Option A only** (tool-only: 0 model calls, $0 paid inference, 0 generated tokens). Option B is **not** approved.
- Manifest: `build/v04x/level_a_manifest.proposed.json`, SHA-256 `1125b03286e0ae5b903f2e98876d5b1965ed0c9510c8b92defc892140db65b06`.
- Limits: exactly those in "Runtime budget requested", Option A. No other source, revision or limit is covered.
- Separation: Level A acceptance runs use their own store (`.hive/level-a/`) and report (`build/level-a/`), and are never mixed with the evolutionary development campaign or its candidates.
- Local runtime approval artifact: `.hive/level-a/owner-approval.json` (gitignored), binding this manifest hash.

