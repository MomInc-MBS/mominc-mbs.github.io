"""Optional RunAnywhere on-device inference adapter. OFF by default.

Pilot gate only: no SDK import, no network, no model loading. Enabling the
env flag does not enable inference; run() still refuses until a licence review
and operator approval add a real implementation.
"""

from __future__ import annotations

import json
import os
from pathlib import Path

ADAPTER = "runanywhere"
ENABLED_ENV = "HIVE_ENABLE_RUNANYWHERE"
PROJECT = "RunAnywhere"
_LOCK = Path(__file__).resolve().parents[3] / "integrations" / "sources.lock.json"


def _license() -> str:
    # ponytail: re-read per call so the status always mirrors the lock file.
    data = json.loads(_LOCK.read_text(encoding="utf-8"))
    for entry in data["entries"]:
        if entry["project"] == PROJECT:
            return entry["license_spdx"]
    raise KeyError(f"{PROJECT} missing from {_LOCK.name}")


def _enabled() -> bool:
    return os.environ.get(ENABLED_ENV) == "1"


def status() -> dict:
    return {
        "adapter": ADAPTER,
        "enabled": _enabled(),
        "state": "OFF",
        "license": _license(),
        "reason": "pilot not approved; license/hardware gate pending",
    }


def run(*args, **kwargs):
    if not _enabled():
        raise RuntimeError("adapter disabled")
    raise NotImplementedError(
        "pilot not implemented; requires license review and operator approval"
    )
