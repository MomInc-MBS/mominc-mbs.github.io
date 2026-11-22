# Hive AI first milestone proposal

Status: proposed, not an approved implementation specification.
Date: 2026-11-20 (America/Los_Angeles).

## Candidate purpose

Accept an agent's completion only when task-specific checks support the claim.
An overseer can then coordinate different models while keeping the artifact,
the claim, and verification evidence separately inspectable.

This is one candidate for what makes Hive AI useful. Ian has not yet chosen the
first user task or the framework's distinctive behavior.

## Grok's contribution

[Hive AI: Grok failure and testing perspective](t3-thread://v2/50b34497-15f3-472e-bf5c-62b0014ba111/thread:delegated-task:command%3Amcp%3A1ece455d-7ee8-4fde-9f4b-2bac91efead2%3Adelegate-task%3Ahive-ai-grok-readonly-challenge-20261120)

Grok recommends a small completion-verification core before broader orchestration.
It favors software-build/test as a candidate first use case: an exact test runner
can contradict an agent. It identifies false completion, correlated reviews,
competing owners, duplicated effects, cancellation races, provider failures, and
context leakage as central failure modes. Separate review inputs reduce shared
assumptions but do not establish correctness by themselves.

## Overseer's qualifications

- Evidence handles alone do not prove success. Bind evidence to the exact task,
  artifact digest, required check set, verifier, and outcome. Missing, stale,
  mismatched, or partial evidence cannot satisfy a completion gate.
- Protect a task with one current ownership lease and a generation token. A
  replacement can take over after an explicit transition; stale workers must
  not publish accepted results. A permanent owner id alone is insufficient.
- An internal log cannot guarantee exactly-once external effects. Use atomic
  local operations where possible, or an external system's idempotency support.
  If an external action's outcome is unknown after interruption, record that
  uncertainty and reconcile it before retrying.
- Cancellation prevents new dispatch once acknowledged. It does not undo work
  already performed or guarantee an in-flight external action will stop. Preserve
  completed, in-flight, and uncertain effects rather than hiding them.
- Give reviewers the task contract, selected artifact, and verification results
  through explicit fields. Exclude builder transcripts and private memory by
  default. Field filtering does not guarantee arbitrary artifact text is safe;
  it remains untrusted input.
- NVIDIA-hosted inference is not necessarily local inference. The attempted
  NVIDIA endpoint failed; no local NVIDIA execution or second review occurred.

## Small proposed demonstration

If Ian chooses software-build/test, start with a local CLI or API and a tiny
fixture. A scripted worker claims a failing fixture is complete. Hive records
the claim, runs the required check, and rejects it. A fixed fixture can be
accepted only with fresh evidence from that same artifact.

Keep this first demonstration limited to controlled local effects and simulated
providers. It would not verify real-model quality, arbitrary external effects,
or production reliability.

## Proposed acceptance checks

1. A failing fixture, missing check, wrong artifact digest, or partial suite can
   never yield accepted completion. Correct fresh evidence can.
2. Only the current owner generation may publish a result. A second live claim
   and a late stale result are rejected.
3. Retry of a controlled local operation does not duplicate its effect. Crash
   recovery preserves the operation record; uncertain external outcomes are
   explicitly represented and are not blindly retried.
4. Acknowledged cancellation blocks new work. Existing effects remain visible.
5. Reviewer payload fixtures exclude parent secrets, builder transcripts, and
   unrelated private memory; required task and artifact context remains present.
6. Provider refusal, timeout, duplicate result, and late result produce specified
   states without being treated as completed work.

Run exact core checks first. Tester Army can later exercise complete CLI/API
journeys if its tools-only target fits the implemented interface. Its narrative
verdict must be backed by observable state and artifact assertions. No dashboard
or UI is required solely to accommodate testing.

## Deferred until a demonstrated need

General routing policy, distributed workers, a memory bus, dashboards, autonomous
tool execution, live model integrations, and additional review passes. The first
use-case answer determines which of these become necessary.

## Actual evidence so far

This document is a design synthesis only. The repository contains documentation;
no kernel, CLI, adapter, acceptance test, or Hive AI e2e run has been implemented.
The available Tester Army CLI returned a version successfully. The Grok review
completed; the selected NVIDIA model returned HTTP 410 (retired).
