# Failure register

## Prototype video integration counterexamples (21 November 2026)

- Parent review: normalizing during intake then echoing an expected string did not independently check the original captions. The executor now normalizes raw input; a separate verifier parser checks original text, timing transformation and canonical syntax.
- Terra reproduced a cached-output STOP bypass and Windows output-junction escape. Output effects now check STOP and reject reparse points. Both Windows junction controls passed even though symlink creation is unavailable here.
- Terra's actual `os._exit` worker-death tests exposed an unstable replay receipt: per-invocation resource deltas changed output bytes. Frozen mission route/parent policy and an immutable receipt now make replay stable. New-process recovery preserves job IDs and feedback counts; the rename case preserves file mtime and spending.
- Parent review added guards for a junction at the store root before lock/database creation, negative source cue times, and combined storage growth across the two output writes. Four executable regressions preserve these cases, including the input-root junction that otherwise resolved before checking.
- Context/pinning: model calls require the expected digest at intake and immediately in the adapter before transport. A synthetic transport test verifies one model call, changed proposed route from feedback, exactly-once replay, and rejection of a last-moment digest change. No real model or footage was used by these tests.

Reproduction: `python -m pytest -q tests/adversarial/test_video_integrity.py tests/adversarial/test_video_review_regressions.py tests/integration/test_video_local_adapter.py tests/integration/test_video_mission.py` (full suite: 235 passed, two Windows symlink skips; all Windows junction controls passed). Historical faults/results below remain unchanged. The real excerpt now passes structural checks; editorial acceptance and a real multi-family batch remain pending; do not turn these synthetic controls into Level A acceptance.


## Prototype release harness findings

The first clean-ZIP harness tried to parse CLI failure output as stdout JSON;
STOP correctly failed on stderr. The harness now handles expected errors and
the rerun passed without inference. The first source-preparation attempt parsed
the entire older transcript and rejected a later non-positive cue; preparation
then parsed only the first seven cues already selected for this bounded excerpt,
preserving the original full transcript unchanged. The first external cue-check
harness assumed raw numeric IDs rather than HIVE canonical `c0001` IDs; its key
mapping was corrected. The real mission and all replays spent one call total.
These harness failures are not hidden as runtime successes or editorial passes.

## HIVE-V03-008: Grok boundary counterexamples

Relabeling Unicode/numeric-equivalent fixtures bypassed exact content ownership;
padded/invisible answer keys and tuple coercion bypassed public input checks.
Normalized fixture/identity ownership, strict JSON values, and normalized field
checks close those demonstrated cases. The wire hash is unchanged. Legacy
registries are validated on open; conflicts fail closed. Unit and independent
adversarial tests preserve the counterexamples.

The E0 wrapper also mishandled interruption during STOP preflight, could label
forged over-cap counters PASS, and wrote historical test counts during prepare.
It now preserves operator STOP unless explicitly resumed, checks counters and
artifact size, and writes a separate preparation-only receipt. No real E0
evidence was rewritten. Next test: zero-inference integrated evaluator/candidate
campaign; no new inference allowance. Rollback: published v0.2.1 code and its
qualified E0 evidence remain available, but do not use its unfinished v0.3 registry.

## HIVE-V03-007: stale status after real STOP/resume

The fresh v0.2.1 E0 finished, but generic `stop_reason` still said kill switch. No inference was duplicated and all 36 outputs reverified. Cause: adaptive terminal state and generic stop reason used different writes. v0.3 now synchronizes terminal reason under its worker lock. Regression: `test_stop_resume_completion_replaces_stale_status_reason`; the full suite passed 217 tests/one skip. Raw v0.2.1 evidence remains unchanged. Next real confirmation belongs to a separately funded mission; no E0 calls remain.

Astra also rejected duplicate fixture payloads within a single manifest to prevent inflated source counts. Reproduction: `test_same_payload_cannot_inflate_independent_source_count`.

## v0.3 source/exposure counterexamples

Terra reproduced three defects: duplicate fixtures across splits, consumed cases copied into another manifest, and same-split fixture reuse under new IDs. Cause: consumption scoped only to manifest/IDs. Luna bound canonical public-content hashes and global identity ownership; ten independent negative controls passed. Reproduction: `tests/adversarial/test_v03_evaluation_boundary.py`. Next hypothesis: the future integrated candidate adapter can preserve these boundaries across restart; owner Luna/Terra, next test zero-inference synthetic end-to-end campaign, rollback published v0.2.1. No real inference budget required for that test.

## BUILD-01 — LM Studio unavailable (ENVIRONMENT)
`lms ps --json` timed out waiting for its daemon; loopback 1234 refused connection.
Ollama 11434 was available with an installed model. Chose the real Ollama adapter
and verified one arithmetic request. No models were downloaded or swapped.

## BUILD-02 — unsupported route and taxonomy mismatch (IMPLEMENTATION)
Integration found local_tool had no permitted operation for five categories, and
runner error labels did not match the required failure taxonomy. Action: implement
six finite allowlisted tools, enforce uppercase categories, test schema failures.
Malformed model answers are valid zero-quality feedback; runtime faults are not.

## BUILD-03 — evaluator gaps and benchmark duplication (EVALUATION)
Initial code repair instances repeated across splits; missing abstention fields
could pass; tool baseline depended on an evaluator oracle. Action: independent
finite patch fixtures, exact response fields/types, distinct same-distribution
instances, public-input-only deterministic baseline. Holdout not yet opened.

## BUILD-04 — rollback selection and Windows file lock (IMPLEMENTATION)
Checkpoint pointer changes initially did not select an active policy; nested
Windows lock acquisition wrote the locked byte before taking the lock. Action:
select champion from checkpoint, restore prior champion on verified critical
failure, initialize lock byte only for an empty file. Regression tests pass.

## BUILD-05 — CLI journey during module integration (IMPLEMENTATION)
First Tester Army CLI run caught an intermediate task/runner schema mismatch.
It produced a finite retry chain (three attempts), including one real local-model
retry, and stopped. These are development diagnostics, excluded from the planned
scientific campaign. Re-run only after LUNA's corrected interface is complete.

Failures from actual experiments are persisted as content-addressed structured
reports and linked to their successor jobs. Holdout specifics remain sealed and
are never copied into this development failure register.
