"""Cache-aware usage + cost accounting append-only JSONL ledger.

Each line stores ``prev_sha256`` = sha256 of the previous line's raw bytes
("" for the first), forming a tamper-evident chain. Costs are computed per
model using a pricing map keyed by model name with per-1M-token USD prices for
``fresh_input``, ``cached_read``, ``cache_write`` and ``output``. Unknown
models raise ``KeyError`` (never zero). Measured and estimated costs are kept
separately.
"""
from __future__ import annotations

import contextlib
import hashlib
import json
import os
import threading
import time
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class UsageRecord:
    """A single usage measurement or estimate."""

    run_id: str
    parent_run_id: str | None
    task_id: str
    model: str
    fresh_input_tokens: int
    cached_read_tokens: int
    cache_write_tokens: int
    output_tokens: int
    wall_seconds: float
    measured: bool
    source: str


class UsageLedger:
    """Append-only JSONL ledger with a hash chain over line bytes."""

    def __init__(self, path: str | Path, pricing: dict[str, dict[str, float]]) -> None:
        self.path = Path(path)
        self.pricing = pricing
        self._lock = threading.RLock()
        self.lock_path = self.path.with_name(self.path.name + ".lock")
        self.lock_fd: int | None = None
        self._depth = 0
        self.lock_timeout_s = 10.0
        self.path.parent.mkdir(parents=True, exist_ok=True)

    # ---- cost computation -------------------------------------------------

    def _price(self, model: str) -> dict[str, float]:
        if model not in self.pricing:
            raise KeyError(f"unknown model: {model}")
        return self.pricing[model]

    def cost_usd(self, rec: UsageRecord) -> float:
        """USD cost of a record using per-1M-token pricing."""
        price = self._price(rec.model)
        return (
            price["fresh_input"] * rec.fresh_input_tokens / 1e6
            + price["cached_read"] * rec.cached_read_tokens / 1e6
            + price["cache_write"] * rec.cache_write_tokens / 1e6
            + price["output"] * rec.output_tokens / 1e6
        )

    # ---- append / read ----------------------------------------------------

    def _read_lines(self) -> list[bytes]:
        if not self.path.exists():
            return []
        with self.path.open("rb") as handle:
            return [line for line in handle.readlines() if line.strip()]

    def _tail(self) -> tuple[str, int]:
        """(sha256 of the last line, line count); caller holds the cross-process lock."""
        lines = self._read_lines()
        return (hashlib.sha256(lines[-1]).hexdigest() if lines else ""), len(lines)

    def append(self, entry: dict[str, Any]) -> None:
        """Append one hash-chained, sequenced JSON line under the cross-process lock."""
        with self.locked():
            if self.path.exists() and self.path.stat().st_size:
                with self.path.open("rb") as handle:
                    handle.seek(-1, os.SEEK_END)
                    if handle.read(1) != b"\n":  # torn tail from a crashed write: never glue onto it
                        raise ValueError(f"usage ledger {self.path} has a torn last line; operator repair required")
            prev, count = self._tail()
            entry["prev_sha256"], entry["seq"] = prev, count
            line = (json.dumps(entry, sort_keys=True, separators=(",", ":"), ensure_ascii=False) + "\n").encode("utf-8")
            with self.path.open("ab") as handle:
                handle.write(line)
                handle.flush()
                os.fsync(handle.fileno())

    def record(self, rec: UsageRecord, reservation_id: str | None = None) -> None:
        """Append a record to the ledger, chaining on the previous line. Settles ``reservation_id`` if given."""
        cost = self.cost_usd(rec)
        entry: dict[str, Any] = {
            "run_id": rec.run_id,
            "parent_run_id": rec.parent_run_id,
            "task_id": rec.task_id,
            "model": rec.model,
            "fresh_input_tokens": rec.fresh_input_tokens,
            "cached_read_tokens": rec.cached_read_tokens,
            "cache_write_tokens": rec.cache_write_tokens,
            "output_tokens": rec.output_tokens,
            "wall_seconds": rec.wall_seconds,
            "measured": rec.measured,
            "source": rec.source,
            "cost_usd": cost,
        }
        if reservation_id:
            entry["reservation_id"] = reservation_id
        self.append(entry)

    def reserve(self, run_id: str, task_id: str, model: str, est_cost_usd: float) -> str:
        """Append an allocation record (estimated cost held against the budget until settled by ``record``).

        Call inside ``locked()`` together with the budget check so check+allocate is one atomic step.
        An interrupted request never settles, so its reservation stays counted (conservative, never refunded).
        """
        rid = uuid.uuid4().hex
        self.append({"kind": "reservation", "reservation_id": rid, "run_id": run_id, "task_id": task_id,
                      "model": model, "cost_usd": float(est_cost_usd)})
        return rid

    def release(self, reservation_id: str) -> None:
        """Void a reservation whose request never left the process (nothing was spent)."""
        self.append({"kind": "release", "reservation_id": reservation_id})

    def outstanding_reserved_usd(self) -> float:
        """Estimated cost of reservations with no settling usage record."""
        recs = self._iter_all()
        settled = {r["reservation_id"] for r in recs if r.get("kind") != "reservation" and r.get("reservation_id")}  # usage or release
        return sum(r["cost_usd"] for r in recs if r.get("kind") == "reservation" and r["reservation_id"] not in settled)

    @contextlib.contextmanager
    def locked(self):
        """Re-entrant cross-process exclusive lock; raises (never proceeds unlocked) on any lock error."""
        with self._lock:
            if self._depth == 0:
                self._acquire_lock()
            self._depth += 1
            try:
                yield
            finally:
                self._depth -= 1
                if self._depth == 0:
                    self._release_lock()

    def _acquire_lock(self) -> None:
        fd = os.open(str(self.lock_path), os.O_CREAT | os.O_RDWR, 0o644)
        deadline = time.monotonic() + self.lock_timeout_s
        while True:
            try:
                if os.name == "nt":
                    import msvcrt

                    msvcrt.locking(fd, msvcrt.LK_NBLCK, 1)
                else:
                    import fcntl

                    fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
                self.lock_fd = fd
                return
            except OSError:
                if time.monotonic() >= deadline:
                    os.close(fd)
                    raise TimeoutError(f"timed out waiting for lock on {self.lock_path}") from None
                time.sleep(0.01)

    def _release_lock(self) -> None:
        fd, self.lock_fd = self.lock_fd, None
        if fd is None:
            return
        try:
            if os.name == "nt":
                import msvcrt

                msvcrt.locking(fd, msvcrt.LK_UNLCK, 1)
            else:
                import fcntl

                fcntl.flock(fd, fcntl.LOCK_UN)
        finally:
            os.close(fd)

    def _iter_all(self) -> list[dict[str, Any]]:
        return [json.loads(line.decode("utf-8")) for line in self._read_lines()]

    def _iter_records(self) -> list[dict[str, Any]]:
        return [r for r in self._iter_all() if r.get("kind") not in ("reservation", "release")]

    # ---- totals -----------------------------------------------------------

    def totals(self, run_id: str | None = None, include_children: bool = True) -> dict[str, Any]:
        """Aggregate token/cost totals, optionally rolling up the parent chain."""
        records = self._iter_records()
        selected: list[dict[str, Any]] = []
        for rec in records:
            if run_id is None:
                selected.append(rec)
                continue
            if rec["run_id"] == run_id:
                selected.append(rec)
            elif include_children and self._descends_from(rec, run_id, records):
                selected.append(rec)

        fresh = sum(r["fresh_input_tokens"] for r in selected)
        cached_read = sum(r["cached_read_tokens"] for r in selected)
        cache_write = sum(r["cache_write_tokens"] for r in selected)
        output = sum(r["output_tokens"] for r in selected)
        usd_measured = sum(r["cost_usd"] for r in selected if r["measured"])
        usd_estimated = sum(r["cost_usd"] for r in selected if not r["measured"])
        return {
            "fresh_input_tokens": fresh,
            "cached_read_tokens": cached_read,
            "cache_write_tokens": cache_write,
            "output_tokens": output,
            "usd_measured": usd_measured,
            "usd_estimated": usd_estimated,
        }

    def _descends_from(self, rec: dict[str, Any], ancestor: str, all_records: list[dict[str, Any]]) -> bool:
        by_run: dict[str, dict[str, Any]] = {}
        for r in all_records:
            by_run[r["run_id"]] = r
        seen: set[str] = set()
        current: str | None = rec.get("parent_run_id")
        while current is not None and current not in seen:
            seen.add(current)
            if current == ancestor:
                return True
            parent = by_run.get(current)
            if parent is None:
                return False
            current = parent.get("parent_run_id")
        return False

    # ---- verify chain -----------------------------------------------------

    def verify_chain(self) -> bool:
        """Return True iff every line's prev_sha256 matches the prior line's sha256."""
        lines = self._read_lines()
        prev = ""
        for n, line in enumerate(lines):
            try:
                entry = json.loads(line.decode("utf-8"))
            except (json.JSONDecodeError, UnicodeDecodeError):
                return False
            if entry.get("prev_sha256") != prev or entry.get("seq", n) != n:
                return False
            prev = hashlib.sha256(line).hexdigest()
        return True
