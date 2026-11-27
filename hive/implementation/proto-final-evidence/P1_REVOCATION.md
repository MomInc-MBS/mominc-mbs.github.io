# P1 revocation scope

## Behaviour
- `CR.store_uuid(store)`: uuid4 hex in the store's sqlite kv (key `operator/store_uuid`, INSERT OR IGNORE, then read). Survives reopen and directory move; a copied store keeps it.
- `scripts/hive_admission.py revoke` writes a `scope: "store"` entry by default; `--global` writes `scope: "global"`. Plumbed as keyword `global_scope` through `cap_cli.revoke`.
- Record first, roll the file back only if signing is refused (unchanged order).
- `record_revocation` defaults to scope global (old callers keep their meaning); hive_admission passes the scope explicitly. It is append-only: older entries are never dropped or rewritten; an identical (scope, store_uuid, cap_id, version, statement_sha) is not added twice.
- Matching in `CR._state`: no `scope` (legacy) or `global` = cap_id+version and body revoked in every store, as before. `store` = revoked here only if store_uuid equals this store's uuid and cap_id+version match, OR statement_sha equals that version's admission statement_sha.
- Bodies: `CR.revoked_impls(cap, store)` counts global/legacy bodies plus this store's store-scoped bodies; a store-scoped body never revokes the same body elsewhere. Admission (hive_admission.py:156) passes the destination store.
- Unknown scope, or `store` scope without a string store_uuid: `revocations()` raises Refused (fail closed). No migration of old entries.

## Entry schema
`{scope, store_uuid (null for global), cap_id, version, impl_sha256, statement_sha, reason (<=300), at}`

## Tests (tests/test_revocation_scope.py)
local revoke hits only this store (A vs B with different bodies); global revoke blocks both; legacy unscoped blocks both; unknown/malformed scope fails closed; uuid stable over reopen/move/copytree, new store differs; append-only + idempotent; stale plan refuses at execution; body revoked locally in A still admits in B, globally revoked body refused.

## Result
Full run (revocation_scope, capability_admission, discovery, p_fix_admission, p_fix_admission2, p_cli, goal_runner, g3_planner, g3_gate, capcontract, operator_runtime, p_improve, p_planner): `1 failed, 225 passed in 547.29s` — the one failure (p_fix_admission2 rollback test calling record_revocation with the old signature) was fixed by defaulting scope to global; rerun `tests/test_revocation_scope.py tests/test_p_fix_admission2.py`: `13 passed in 27.42s`.

## Findings
- Execution DOES recheck: goal_runner.py:591 `_run_discovered` calls `CR.resolve_discovered` on every use and also refuses if statement_sha differs from the plan (line 593). Covered by a test.
- `operator_runtime.revoke` (line 289) is a different layer (an in-store `revoke` event on an operator pin; it never calls `record_revocation`), so no `--global` keyword was added there.
- `hive operator cap revoke` in src/hive/cli.py (not an owned file) does not expose `--global` yet; it defaults to store scope. Add the flag there if the owner wants it from that CLI.
- Store-scoped copy semantics are conservative: a copied store keeps its uuid, so a revoke in A also revokes the copy (by uuid and by statement_sha).
