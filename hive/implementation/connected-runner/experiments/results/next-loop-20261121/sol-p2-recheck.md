# Independent P2 repair recheck — Sol, 2026-11-21

Target: D:/Repos/hive-ai, build/working-prototype, runtime dev5 working tree. Separate repair check; original review remains unchanged. No inference, Docker, subagents, private stores, commits or publishing.

Result: original findings have concrete repairs, but one schema-downgrade replay bypass remains blocking for the claim that changed/rebound P2 receipts are rejected.

## Executed

- `python -m pytest -q tests/integration/test_p2_replay.py tests/unit/test_p2_exact_tool.py tests/integration/test_governed_run.py`: **17 passed in 12.81 s**. Includes real Executor missing verifier/false acceptance canary checks with zero dispatch/reservation, receipt corruption/missing/route/input attribution negatives, fresh-process replay, H11 parent-relative path, existing governance boundaries.
- Independent `.hive/p2-recheck/check.py`: loaded original policy and governor directly from `git show 1e1bf94:<path>`. All **144** combinations of versions 1/2, four modes, six built-in categories and three requested-route settings produced identical current/original decision receipts and policy snapshots.
- Fresh v1/v2 stores replayed saved output unchanged, including intentionally retained legacy replay when decision artifact is corrupt. This proves compatibility of tested legacy mechanics, not all historic receipts.
- Independent `.hive/p2-recheck/downgrade.py`: starting from a successful v3 run, removed embedded decision.policy_version, replaced decision_ref with a nonexistent all-zero hash, wrote a newly hashed evidence artifact and rebound jobs.result exactly as new mismatch tests do. **inspect_evidence accepted the passing output.** The current guard trusts the embedded marker to decide whether to validate that marker's provenance.
- Machine-readable observations: `sol-p2-recheck.json`.

## Remaining blocking fix

`inspect_evidence` must prevent a P2 receipt from being reinterpreted as legacy merely by deleting its policy_version. Minimal fix should identify v3 from authenticated/persisted job provenance or load the hashed decision and enforce agreement, plus reject partial P2 attribution/version markers. Add the downgrade counterexample while retaining genuine historical v1/v2 receipts. An attacker with unrestricted database control can replace more records; this finding uses precisely the evidence-rebinding threat model already asserted by the new tests, not a new authority assumption.

## Repair assessment and scope

Source context now distinguishes input hash, declared source group, evaluator identifier and verifier file hashes from runtime hash. The declaration is explicitly not source independence/freshness approval; this is appropriate static attribution for quarantined synthetic development checks. It does not establish a source-disjoint acceptance inventory.

The missing-output canary checks one verifier availability/fail-closed condition before dispatch. It cannot predict arbitrary faults on actual outputs; such later faults appropriately fail invalid after dispatch. The earlier review's missing-verifier negative now has a real caller-level preflight defense. Malformed evaluator contracts were already separately rejected by validation.

Version3 intentionally retains v2 route choices and adds identity/availability semantics; updated documentation states this explicitly. No routing improvement, quality gain, beneficial learning or promotion is established. Governing default remains unchanged. No fresh model pin execution, Docker execution or full-suite claim by this reviewer.
