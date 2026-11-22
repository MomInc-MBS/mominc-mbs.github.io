# Readiness build counterexamples

Date: 2026-11-21. These are engineering discoveries and repairs, not successful
research experiments. Initial failures were kept in agent review and interim
receipts; the final test receipt identifies the frozen version rechecked.

| Counterexample | Changed implementation | Discriminating regression |
|---|---|---|
| A test process can exit zero before assertions or print a fake pass. | Narrow trusted function protocol, host-only expected results, strict structured result comparison. | Actual Docker missions with `os._exit(0)`, fabricated output and incorrect values are rejected. |
| Mounting the whole source archive exposes verifier files and secrets. | Explicit curated regular runtime files; verifier and private files excluded. | Candidate tries to read the excluded fixture verifier/secret; host checker rejects the result. |
| A store path can traverse a Windows junction. | Reject reparse components before creating or opening mission storage. | Real Windows junction test observes no write through the redirected path. |
| Charging only after execution loses interrupted work. | Shared Executor reserves work before dispatch and recovers the same job. | Death before/after evidence commit charges the retry without resetting the allocation. |
| A host-only timeout disappears if the HIVE process dies. | Independent in-container timeout watchdog plus host STOP/timeout cleanup. | Kill the host during a 60-second container workload with a four-second cap; worker disappears within the bounded observation window. |
| A failed synthetic code result was labeled `SYNTHETIC_ONLY` and could satisfy a dependency. | Separate synthetic provenance from objective success and gate prerequisites on the verdict. | H11 negative code result remains failed through the shared controller. |
| Cached terminal mission stages can bypass underlying provenance rechecks. | Invoke each family replay verifier before returning cached success. | Changed source/config or corrupted evidence is rejected on replay. |
| A valid result from a different job could pass a self-consistency check. | Reconstruct the expected family task and operation from pinned inputs, then bind the Store job and evidence bundle to that exact identity. | Cross-mission code job substitution, changed job task, foreign video bundle job ID and changed video task all fail replay. |
| Adding an execution adapter to the finite benchmark category list changes old task generation. | Keep `code_mission` in the explicit verifier adapter whitelist and preserve the original six benchmark categories. | Existing adaptive trials and actual Docker code missions both execute successfully. |
| Windows Git line-ending conversion changes a generated fixture after its hash is recorded. | Disable automatic conversion in the synthetic source repository and hash the actual committed fixture bytes. | The public operator command completes and verifies unchanged original bytes on Windows. |
| Named patch/verdict files and the top-level trace could be changed after completion. | Bind exact store-local filenames and rehash every regular non-reparse output on replay. | Corrupted verdict, corrupted trace and an escaped output path are rejected. |
| A completed code stage returned a later shared-store budget after the dependent video stage ran. | Preserve the stage receipt bound to its immutable finish event, recheck all stable fields against fresh underlying replay, and return current accounting only at the outer mission level. | Combined code-to-video first/replay stages and budget match; corrupted cached stage is rejected. |
| A crash leaves a stage attempt in progress with no retries remaining. | Resume the existing attempt and let the shared job ledger reconcile it. | Restart the wrapper from an in-progress stage instead of manufacturing completion. |
| Altering a pressure report could invent ladder/configuration/crash behavior. | Independently bind named scenario observations to actual jobs, artifacts, decisions and feedback. | Forged scenario details, verdicts, policy states, counts and job IDs are rejected. |
| An expected value could be reused after changing its recombination input. | Recompute composition constraints from the bound inputs. | Invalid dependency/composition output fails the independent checker. |
| Fixture comparisons could misstate task grouping or resource equality. | Validate complete arms, paired source groups, declared budgets and measured observations. | Unequal budgets, changed source groups, missing observations and forged pass totals are rejected. |
| Identical failed build attempts can consume time indefinitely. | Durable queue blocks after two unchanged failures and requires independent diagnosis plus a changed hypothesis. | Fresh-process queue recovery selects another eligible authorized item without clearing mission STOP or budgets. |
| Expanded pressure evidence exceeds Node's default 1 MiB subprocess output buffer. | Bound the CLI test capture at 32 MiB; preserve all journey assertions and runtime limits. | Re-run the seven Tester Army journeys; the original `ENOBUFS` receipt remains in `e2e-attempt-buffer-limit`. |
| The portable replay helper hashes a serialized adapter record as if it were the original runtime config. | Reverse the documented JSON-only adapter representation before canonical hashing; reject collisions and malformed identities without importing adapters. | All six actual operator bundle hashes reproduce; ambiguous and malformed adapter records are rejected. Runtime bytes are unchanged. |

Authoritative tests: `tests/adversarial/test_code_isolation.py`,
`tests/adversarial/test_pressure_readiness.py`, the shared mission integration
tests, `tests/unit/test_pressure_contracts.py`, and `tests/unit/test_work_queue.py`.
The final readiness report lists executed commands and receipts. Docker proof
applies to the pinned Linux image and configured narrow protocol; it is not a
claim of immunity to every container vulnerability.

Historical dev3 failure is preserved: verified feedback led to a local inventory
candidate returning 42,073 instead of 41,907 bytes. The comparison rejected it
and retained P0. Version 2 adds an optional exact-tool preference; it is neither
an approved production promotion nor evidence of generalization. Old E0 and
six-call integration allocations were not renewed.
