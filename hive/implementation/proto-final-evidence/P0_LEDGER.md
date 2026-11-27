# P0 ledger lock starvation fix

## Diagnosis
`test_concurrent_processes_chain` saw 25/100 rows under full-suite load. Three of four children died with
`TimeoutError: timed out waiting for lock on ...ledger.jsonl.lock`. The cross-process lock was an unfair poll
(`msvcrt.locking(LK_NBLCK)` every 10 ms, 10 s deadline); the holder releases and re-takes it within microseconds,
so polling waiters starve until the deadline. No rows lost or corrupted (failures raise, never write unlocked);
the test never checked child exit codes, which hid the cause. Impact: liveness only (spurious TimeoutError ->
DispatchBlocked before a call, or an unsettled reservation after one, still counted conservatively).

## Change (src/hive/usage_ledger.py)
- Windows: `_win_lock` opens the .lock file via ctypes `CreateFileW` (RW, share all, OPEN_ALWAYS, FILE_FLAG_OVERLAPPED),
  `LockFileEx(EXCLUSIVE, byte 0, len 1)` with an event. Kernel queues the waiter; pending -> `WaitForSingleObject(timeout_s)`;
  on timeout `CancelIoEx` + `GetOverlappedResult(wait)` then `TimeoutError` (if the grant raced the cancel, we hold it and proceed).
  `_win_unlock` = `UnlockFileEx` + `CloseHandle`. Any Win32 failure -> `OSError(WinError)`; never unlocked. Same lock byte.
  Typed argtypes/restype, `use_last_error=True`, pointer-sized handles. `lock_fd` now holds the handle on Windows.
- POSIX path unchanged (+ `# ponytail:` note: still a non-fair poll).
- File keeps its original CRLF line endings (LF would rewrite every line of the diff).

## Tests (tests/test_usage_ledger.py)
- `test_concurrent_processes_chain` now asserts every child returncode == 0 and shows stderr.
- New `test_lock_is_not_starved_by_a_tight_reacquire_loop`: 6 procs x 40 records, child `lock_timeout_s=2.0`,
  synchronized start; checks exit codes, 240 rows, `verify_chain()`, seq 0..239 gapless. ~15-19 s.

## Evidence
OLD code: `1 failed in 6.13s` - child `TimeoutError: timed out waiting for lock on ...ledger.jsonl.lock`, `assert 1 == 0`.
NEW code, 3 runs: `1 passed in 18.65s`, `1 passed in 14.41s`, `1 passed in 18.78s`.
Full: `python -m pytest tests/test_usage_ledger.py tests/test_cross_process_adversarial.py tests/test_dispatch_gate.py
tests/test_executor_run_state.py tests/test_model_route_shadow.py tests/test_p_fix_hosted.py tests/test_p_hosted_backend.py
-q -p no:cacheprovider --basetemp D:/tmp/w1` -> `160 passed, 1 skipped in 151.67s (0:02:31)`
(includes holder-killed recovery and directory-lock OSError tests).
