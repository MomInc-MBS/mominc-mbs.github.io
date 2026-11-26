# REVIEW_P4: hosted NIM backend, harness fix, proposer seeds (c97e0d0..5ea5870)

Reviewer: independent, read-only on src/tests/configs. Threat model as in P1/P2: the attacker writes the store, goal and experiment records and
controls proposer output; the attacker cannot reach the signing key, configs/ or evaluator files. New: a hosted provider (NVIDIA NIM,
`moonshotai/kimi-k3.1-pro`) and an API key (`NVIDIA_API_KEY`).

## Verdict: ACCEPT WITH FIXES (F1 and F2 must land before the NIM approval is activated)

As shipped, the hosted path cannot run:
- `qualified[kimi].measured` is `false` (`configs/model_dispatch.json:16`), so `MD.plan` never executes it (`model_dispatch.py:49,62-65`).
- `approval_sha256` is `null` (`configs/model_dispatch.json:44`).
- The bound approval path `...kimi-k3.1-pro.approval.json` does not exist; only the DRAFT does.

The transport is sound:
- The host allowlist is in code.
- https only, with TLS verified by the stdlib defaults.
- Redirects are refused.
- Replies are capped in size.
- The key is read at call time and checked against a strict character set.

No key reached disk: a filename-only grep of the whole worktree (`.git`, zips and sqlite excluded) for the key value, its first 20 characters and
its last 16 characters found nothing.

The structural data guarantee holds. No path puts goal inputs or hidden fixtures into a hosted prompt.

The spend cap is the weak part. A store writer can lift it with records alone, using a negative `max_tokens` (**F1**). Once NIM is qualified, the
store record also picks the hosted backend and writes the prompt text (**F2**). Neither is reachable today. Both are small fixes.

Tests (Docker hidden from PATH so the image probe at import is skipped, `NVIDIA_API_KEY` and `HIVE_LIVE_NIM` unset, so no live call can authenticate):
- `tests/test_p_hosted_backend.py test_p_harness_percent.py test_p_model.py test_p_fix_model.py test_p_fix_model2.py test_model_dispatch.py test_discovery.py`:
  **84 passed, 3 skipped** (the two opt-in live smokes and the Docker container test), 139.5 s, `--basetemp <local path>`.
- Review PoCs (appendix, not committed): **9 passed** (17.1 s, `--basetemp <local path>`).

---

## Answers

### 1. Redirecting hosted calls, headers, model id, price, budget

**Host and endpoint.**
- Store and records cannot redirect hosted calls.
- `HOSTED_HOSTS`/`HOSTED_SCHEMES` are code constants (`m2_model.py:27-28`). Nothing outside tests reassigns them (grep).
- The endpoint comes only from the configs entry (`:92`). It must pass `hosted_endpoint_problem`: exact host, https, path `/v1`, no userinfo, query
  or fragment (`:43-51`, checked at `:101-103` and again at `:228`).
- A non-stub Model refuses any endpoint other than the configured one (`:227`). A stub endpoint must be loopback (`:224-225`), and a stub never
  reads the key (`:213`, `:274`).
- The approval binds host, provider, endpoint, model id and `hosted` (`:191-198`).

**Headers.**
- The headers are fixed (`:279-280`). The key must fullmatch `KEY_CHARS` (`:33`, `:276`), so CR/LF header injection through the environment is
  impossible (tested `test_p_hosted_backend.py:217`).
- The key's env var name is fixed by code per host, and the config cannot point at another secret (`:105`).

**Model id, prices, budget.**
- The model id in the body comes from configs (`:290`). The reply's model is verified (`:368`).
- The price table and budget come from `configs/model_dispatch.json` (`:214-217`). Only tests pass `pricing=`, `budget_usd=` or `ledger_path=`.

**What the store does control.**
- **Which** qualified backend runs (F2).
- The per-call `max_tokens`, from `frozen.budget.max_tokens_per_call` (`discovery.py:586`). Large values are self-limiting: they hit
  CONTEXT_DOES_NOT_FIT (`:589-592`) or a larger reservation. **Negative values are not limited (F1).**

**Redirects, size, time, TLS.**
- `_NoRedirect` replaces the default redirect handler, because `build_opener` drops the stock handler for a subclass. A 3xx becomes an HTTPError
  (`:36-40`, `:285`), and the target never sees the key (test `:225-233`).
- Size: the body is read to `HOSTED_MAX_BYTES + 1` and refused when over (`:285-286`). Error text is read to 500 bytes (`:375`).
- TLS: the opener uses the stdlib default HTTPS context (CERT_REQUIRED and hostname check). No `_create_unverified_context`, `CERT_NONE`,
  `check_hostname` or `verify=False` appears in src/scripts/evaluator.
- Time: the timeout is per socket operation, 240 s for chat and 30 s for list (`:357`, `:256`). There is no total deadline (F6).

### 2. Can the key leak?

**No path found in code or on disk.**
- The key is read in the parent process at call time (`:348`, `:272-277`) and used only in the `Authorization` header.
- It is never in the body: `raw` is built from messages and sampling (`:349`), and the test checks the POST body (`:201`). It is never in `rec`,
  the logs or the ledgers.
- The reply is scrubbed on the raw bytes before parsing or logging (`:358`). Transport errors are scrubbed (`:373`). Error bodies are scrubbed
  (`:375`).
- `Request` and `HTTPError` have no repr that carries request headers. `HTTPError` keeps only the URL. Neither is logged.

**Child processes and containers.**
- Containers get no environment: `docker run` has no `-e` or `--env-file` (`isolation.py:197-206`). Only a temp dir holding `in.json` (plus
  read-only inputs) is mounted (`experiment_compare.py:138-155`).
- The process backend passes only SYSTEMROOT (`experiment_compare.py:185`).
- Trusted `python -I` children (evaluator, gen_private) inherit the parent env (`bounded.py:49`). They are evaluator-side, and the key is in the owner's
  user environment anyway.

**Receipts.**
- The smoke receipt holds usage and latency only. The smoke test asserts the key is absent (`test_p_hosted_backend.py:427`).

**Residuals.**
- F3: a key **fragment** can survive the 500-byte error-body cut. Reproduced.
- The raw-bytes scrub misses a JSON-escaped echo (`\/`, `\uXXXX`). Real `provider-key-prefix-` keys contain no `/`, so this is a nit.

### 3. Can real user data reach the hosted prompt?

**The structural guarantee is sound.** Discovery and acquisition run from records that carry only types:
- `record_gap` stores the deliverable, input types and schema text (`goal_runner.py:503-520`). Goals only queue work (`:907`, `:913`).

The proposal prompt (`discovery.py:261-287`) is built from:
- The behaviour spec, frozen from a repo file at open (`:172`).
- Public dev cases from `gen_public.cases()`. Every `capabilities/*/suite/gen_public.py` and `evaluator/c3/gen_public.py` is seeded RNG plus
  literals, with no file reads (grep). The one MOM-like string is the public path `little-boyfriend`, used as a synthetic section name
  (`site.release-diff/suite/gen_public.py:14`). v2 base64 payloads are shown only as their length (`:248-250`).
- The public GitHub card excerpt.
- For an improvement, the admitted body.
- Feedback from dev runs on those synthetic cases (`:326-337`). These run in a container that mounts only `in.json`.

Hidden fixtures never enter the prompt:
- `.hive/c3-private` is only an argument to the evaluator (`:372`).
- Hidden results come back as counts only (`:662`). Improve feedback holds no hidden counts (P2 L6).

The suggest prompt holds the contract purpose, spec and types only (`acquire.py:179-181`, `acq_propose.py:57-63`).

**So the heuristic is defence in depth, and in production it is half-wired.**
- No production caller passes `private_blobs`. It is plumbed through `discovery.py:480/596` and `acquire.py:82`, but `cli.py:224`,
  `console.py:442` and `scripts/*` never set it.
- Only the `ENCODED_RUN` check is live (F4).

**No path attaches real inputs or hidden fixtures.** The only route for arbitrary text is a **store writer** editing `frozen.behaviour_spec`,
`card_excerpt`, `feedback` or `best.body`. These are not re-checked against the contract (`check_frozen` `:58-74`). That text is the attacker's
own, or data they can already read in the store, so it is not a confidentiality break. It is sent to a third party under the owner's key, which
is part of F2.

### 4. Spend gate

- **Worst case reserved before the request:** yes. `_reserve` (`:305-326`) runs before the `Request` (`:352` then `:356`). It takes the lock, then
  check plus allocate. Worst case is `len(raw)+256` input "tokens" (bytes, so conservative), plus `max_tokens` output, with cached input priced as
  fresh (`:315`).
- **Zero requests when the budget is short:** yes for chat (`:320-323`, test `:250-257`). The `GET /models` with the key still precedes the gate
  (`discovery.py:601`, `acquire.py:85`). It is free, a nit.
- **Missing or partial usage:** charged at the worst case, never zero (`:328-335`, test `:260-282`).
- **Torn or garbage ledger:** refused, fail closed. `append` refuses a torn tail (`usage_ledger.py:87-91`). JSON or KeyError on read is caught at
  `:325`.
- **Separation from local $0:** a single ledger. Local rows cost 0, so they never consume the hosted budget. Discovery dispatch rows say
  `cost_usd: None` for hosted (`discovery.py:702`). Acquisition reports still claim $0 for local (F5).

**Can a store writer reset the hosted spend? Yes, two ways (F1).**
- (a) **Records only.** A negative `frozen.budget.max_tokens_per_call` reaches `p["sampling"]["max_tokens"]` (`discovery.py:586`). It passes the
  context check, because `need` is negative. Then:
  - the reservation is negative (`m2_model.py:315`, `usage_ledger.py:61-69`);
  - NIM's 4xx makes `_settle(None)` record `int(max_tokens)` output tokens, which is **negative dollars** (`:334`);
  - every later call has that much extra headroom.

  This works wherever the ledger file lives (PoC `f1b`: one forged experiment, then -$200 on the ledger, then 5 calls pass under a budget sized
  for 1).
- (b) **The ledger file.**
  - The ledger is an unkeyed hash chain. `verify_chain` is never called, and a negative `cost_usd` line is accepted (PoC `f1`).
  - With the CLI default `--store .hive` (`cli.py:23`), the ledger `.hive/model-spend-ledger.jsonl` sits **in the store root**, next to
    `hive.sqlite3` (PoC). Truncating it restores the full $5.
  - This is the P2 L5 nit, now load-bearing.
  - Every other bound is store-written and resettable too: `_cap()` counts `store/discovery/<exp>/model/model_calls.jsonl` (`:238-244`), and the
    experiment ledgers and retry depth are store records.

**How serious.**
- Both routes need an operator run of a forged experiment, and NIM qualified. Both are off today.
- After that, the only bound is what the provider allows on the key: its credit or rate limit, or an account spend cap.
- The same key serves the owner's other NIM routing. A burned key is therefore also an availability loss there.
- Rated MEDIUM, and it blocks activation.

**Minimal fix.**
1. `UsageLedger.cost_usd`/`reserve` raise on any negative token count or cost. `_iter_all` (or `totals`) refuses a line whose `cost_usd < 0`.
   `_reserve` already turns ValueError into a refusal.
2. `Model.call` refuses `max_tokens` that is not an int in `1..context`. Fix it in the shared client, not per caller.
3. Move the ledger out of `.hive` (for example `%LOCALAPPDATA%/hive/spend-ledger.jsonl`), or refuse a ledger path under the store root.
4. Give HIVE its **own** NVIDIA key with a provider-side limit. That is the bound that survives everything.

### 5. Approval

The DRAFT is inert. All of these refuse it independently:
- The name and status say DRAFT (`m2_model.py:174-175`).
- The sha is unbound (`:178-179`, config `null`).
- The bound file is missing.
- `measured: false` stops dispatch (`model_dispatch.py:49`, test `:378-385`).

It is bound by sha over the exact bytes (`:180`). It also binds model id, hosted, provider, host, endpoint and caps (`:191-199`).

The caps equal `APPROVAL_CAPS`, so P2 N4 is not repeated. PoC: an honest activation with `activate_backend_approval.py` plus the sha bound gives
`approval_problems == []`. A one-byte edit is refused. Dispatch still refuses while `measured:false`.

Activation needs nothing a store writer could forge:
- The script reads only the DRAFT and CLI args.
- The effective switch is the owner's configs edit (`approval_sha256` plus `measured: true`), which the threat model puts out of reach.

Two notes:
- **The approver is free text.** The trust anchor is the configs edit, not the script.
- **The smoke made real, billed calls through a self-made approval.** It used an active approval minted in `tmp_path` and a throwaway ledger
  (`test_p_hosted_backend.py:396-409`). This is fine if the owner authorised the smoke. It does mean the gate is only as strong as the caller's
  `dispatch_cfg`/`approval_path` arguments. Production callers pass none.

### 6. Harness (9006051) and seeds (e95b7a4)

**Reveal-nothing holds.**
- `wrap` is unchanged (`harness.py:75-79`). It is the only wrapper used by the hidden evaluator (`evaluator/g2/evaluate.py:64`) and by retained
  execution (`goal_runner.py:587`).
- `wrap_dev` is reached only from `_dev_ok` on the public dev cases (`discovery.py:332`).

**The offset is correct.**
- `pre` has 3 lines, the `_OFF` line is 1, and `_WHY` has 7, so `_OFF = 11`. This is the same value the old template produced.
- `repr(list)` cannot add a raw newline.
- `test_p_harness_percent.py` checks "adapter line 3". A body with bare `\r` would shift the reported line, which is cosmetic.

**Consequence to expect (fail closed, not security).** `harness.py` is a pin file of 8 g2 contracts. `CC.recheck` (`capcontract.py:420-423`) now
refuses every capability admitted under the old harness, and open experiments end INTERRUPTED (`discovery.py:533`). Re-admit, and check that the
running batch does not depend on retained g2 capabilities.

**Seeds.**
- `proposer_seed` gives `2026300000+n` for attempt 1 (`discovery.py:520-522`, test `test_discovery.py:125`). That is identical to before.
- A store-written `attempt` only picks seeds, which is harmless. A non-int value ends INTERRUPTED.

### 7. Loopback rule for local backends

No regression:
- A non-hosted entry still requires a loopback endpoint (`m2_model.py:106`, test `:187-190`).
- Hosted needs config `class: "hosted"`. A config `hosted: true` on a local entry still fails `hosted_endpoint_problem` at `:228`.
- The stub rule is unchanged (`:224-225`).
- `MD.loaded` is tightened to loopback (`model_dispatch.py:86`).
- `make_suggest` now uses `apply_backend` instead of `dict(model, id=ex)`. That fixes a latent mis-pin (`acquire.py:78`).

---

## Findings

| ID | Severity | Summary |
|----|----------|---------|
| F1 | MEDIUM (blocks activation) | The hosted spend cap is resettable by a store writer: a negative max_tokens records negative dollars, and the ledger file is unkeyed, unverified and (default store) inside the store |
| F2 | MEDIUM (blocks activation) | The store record picks the hosted backend and writes the prompt text for operator runs |
| F3 | LOW | A key fragment survives the 500-byte error-body cut, unscrubbed |
| F4 | LOW | The data guard's blob probes are never wired in production; the owner-signed DRAFT text overstates it |
| F5 | LOW | Hosted spend is reported as $0/local in acquisition reports; the smoke spend is missing from the project ledger |
| F6 | NIT | Unhandled reply shapes escape `call()`; no total deadline; any port on the allowed host |

### F1 (MEDIUM): a store writer can lift the hosted spend cap

**Scenario A (records only).**
1. Write `frozen.budget.max_tokens_per_call = -10000000` and (with F2) `frozen.proposer.model = kimi` on any experiment.
2. The operator runs `hive discover run <exp>`.
3. One request goes out with `max_tokens: -10000000` (PoC `f1b` shows it in the request body), and a negative "worst case" is reserved.
4. NIM rejects the request. `_settle(None)` writes a negative-cost estimate (about -$200).
5. Every later hosted call, from any run, has that much headroom (PoC: 5 calls pass under a budget sized for 1).

**Scenario B (file).** With `--store .hive`, truncate `.hive/model-spend-ledger.jsonl`, or append a negative `cost_usd` line. The full budget is
back (PoCs `f1`).

**Minimal fix.** See answer 4 items 1 to 3, about 6 lines. Item 4 (a dedicated key with a provider-side limit) is the operational backstop.

### F2 (MEDIUM): the store record picks the hosted backend

- `requested = requested_model or fz["proposer"]["model"]` (`discovery.py:574`).
- `cli.py:224` and `console.py:442` pass no model. Honest records always carry `openai/gpt-oss-20b` (`discovery.py:182`), so the frozen field
  only matters for forged records.
- Once kimi is qualified, a forged record routes an operator's run to the priced remote model. It also sends store-written text under the owner's
  key: `behaviour_spec` is not re-checked (`check_frozen` `:58-74`) and goes into the prompt at `:265`.
- PoC `f2`: the request bodies carry `model: kimi` and the attacker's text.
- This is P2's qwen concern, now with money and a third party involved.

**Fix (2 lines):**
- `requested = requested_model or "openai/gpt-oss-20b"`: a hosted backend only by explicit caller choice.
- Build the prompt from `CC.text_ref(c["proposer"]["behaviour_spec_ref"])`, or require equality with it in `check_frozen`.

### F3 (LOW): key fragment at the error-body cut

`rec["error_body"] = scrub(e.read(500)...)` (`m2_model.py:375`) truncates **before** scrubbing. An error page that echoes the header near byte 500
leaves a key prefix in `model_calls.jsonl` inside the store. PoC `f3`: 13 key characters persisted, and the full key does not match.

**Fix:**
- `scrub(e.read(65536).decode(...), key)[:500]`, or drop `error_body` for hosted.
- Optionally, also scrub the decoded `content` (JSON-escaped echoes).

### F4 (LOW): the data guard's blob probes are not wired

No production caller passes `private_blobs` (answer 3), so only the 512-character encoded-run check is live. That is acceptable, because the
structural guarantee does the work.

The DRAFT `context` that the owner will sign says "a data guard refuses prompts with real input data". Reword it before activation: prompts are
built only from repo contract text, synthetic public dev cases and public repo cards; a heuristic refuses long encoded payloads.

### F5 (LOW): hosted spend reported as local $0

- The acquisition run report hard-codes `"cost_usd": 0.0, "cost_note": "local model, no paid calls"`. It takes `model` from
  `frozen.proposer.model`, which is always gpt-oss (`acquire.py:584`). A NIM-driven run would be reported as local and free.
- The live smoke spent real money ($0.004624) on a throwaway ledger. The project ledger has no kimi rows (grep).

**Fix:**
- Report `executed_model` from the dispatch records, and the cost from the project ledger rows for the run (or "see usage ledger", as
  `discovery.py:702` does).
- Append the smoke's spend to the project ledger.

### F6 (NIT): robustness

- An `AttributeError` (a `usage` or `message` of the wrong shape) or an `http.client.HTTPException` (`IncompleteRead`) is not in `call()`'s
  except tuple (`m2_model.py:371`) or in `run_experiment`'s (`discovery.py:503`). It escapes and leaves the experiment RUNNING. Spend stays
  reserved, which is conservative (PoC `f5`). Add both to the tuple.
- A trickling reply can exceed `call_timeout_s`, because there is no total deadline.
- `hosted_endpoint_problem` accepts any port on the allowed host. Pin 443.

---

## Appendix omitted

The reviewer's proof-of-concept scripts are not published. They were never committed to the build branch.
