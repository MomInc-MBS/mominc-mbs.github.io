# Failure register

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
