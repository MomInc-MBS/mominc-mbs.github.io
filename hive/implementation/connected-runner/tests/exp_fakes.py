"""Network-free test doubles for the OODA experiment driver (importable from a subprocess too)."""
from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path

from hive.experiment_driver import PermanentFetchError, TransientFetchError

ENV = {**os.environ, "GIT_AUTHOR_NAME": "t", "GIT_AUTHOR_EMAIL": "t@t", "GIT_COMMITTER_NAME": "t", "GIT_COMMITTER_EMAIL": "t@t",
       "GIT_AUTHOR_DATE": "2026-01-01T00:00:00Z", "GIT_COMMITTER_DATE": "2026-01-01T00:00:00Z"}
URL = "https://example.test/fixture/repo"
GOOD = "Name,Code\nAlpha,AA\nBravo (the),BB\nCharlie,CC\n"


def _git(repo, *args, data=None):
    return subprocess.run(["git", "-C", str(repo), *args], check=True, capture_output=True, env=ENV, input=data).stdout.decode().strip()


def make_fixture(path: Path, content: bytes | str = GOOD, name="data.csv") -> dict:
    """Local git repo with one commit; returns {path, commit, blob, sha256, bytes}."""
    import hashlib
    path.mkdir(parents=True, exist_ok=True)
    raw = content.encode() if isinstance(content, str) else content
    _git(path, "init", "-q")
    (path / name).write_bytes(raw)
    _git(path, "add", name)
    _git(path, "commit", "-q", "-m", "fixture")
    return {"path": str(path), "commit": _git(path, "rev-parse", "HEAD"), "blob": _git(path, "rev-parse", f"HEAD:{name}"),
            "sha256": hashlib.sha256(raw).hexdigest(), "bytes": len(raw)}


class FakeTransport:
    """Counts every 'network' fetch (also in a file, so counts survive a hard process kill)."""
    name = "fake"

    def __init__(self, fixture, fail_times=0, permanent=False, on_fetch=None, call_log=None, before_fetch=None):
        self.fixture, self.fail_times, self.permanent, self.on_fetch = fixture, fail_times, permanent, on_fetch
        self.calls, self.call_log, self.before_fetch = 0, call_log, before_fetch

    def has(self, commit, repo_dir):
        repo = Path(repo_dir)
        return (repo / "objects").is_dir() and subprocess.run(["git", f"--git-dir={repo}", "cat-file", "-e", commit + "^{commit}"],
                                                              capture_output=True).returncode == 0

    def fetch(self, url, commit, repo_dir, max_blob_bytes, path=None, before_call=None, max_pack_bytes=None, expect_blob=None):
        repo = Path(repo_dir)
        repo.mkdir(parents=True, exist_ok=True)
        if self.has(commit, repo):
            return 0
        if before_call:
            before_call()  # the driver makes the request count durable here, before the request exists
        self.calls += 1
        if self.call_log:
            with open(self.call_log, "a") as f:
                f.write("fetch\n")
        if self.before_fetch:
            self.before_fetch()  # request in flight, nothing landed yet
        if self.permanent:
            raise PermanentFetchError("not our ref")
        if self.fail_times > 0:
            self.fail_times -= 1
            raise TransientFetchError("simulated remote unavailable")
        if not (repo / "objects").is_dir():
            subprocess.run(["git", "init", "--bare", "-q", str(repo)], check=True, capture_output=True)
        subprocess.run(["git", f"--git-dir={repo}", "fetch", "-q", self.fixture["path"], commit], check=True, capture_output=True, env=ENV)
        if self.on_fetch:
            self.on_fetch()
        return 1


def allowlist(fixtures, path: Path, **over) -> Path:
    entry = {"source_id": "fixture", "url": URL, "license": "test", "commits": [f["commit"] for f in fixtures], "paths": ["data.csv"],
             "max_blob_bytes": 65536, "max_files": 64, **over}
    path.write_text(json.dumps({"version": 1, "sources": [entry]}), encoding="utf-8")
    return path


def manifest(fx, exp="exp-1", **over) -> dict:
    m = {"version": 1, "experiment_id": exp, "hypothesis": "fixture has the frozen shape",
         "source": {"source_id": "fixture", "url": URL, "commit": fx["commit"], "path": "data.csv"},
         "expected": {"blob_sha": fx["blob"], "sha256": fx["sha256"], "bytes": fx["bytes"]},
         "tool": "csv_profile_v1", "verifier": "csv_profile_v1",
         "checks": {"format": "csv", "header": ["Name", "Code"], "rows": 3, "unique": "Code", "key_pattern": "[A-Z]{2}",
                    "forbid_pattern": r"\((The|A|An)\)"},
         "limits": {"max_bytes": 65536, "max_files": 64, "max_attempts": 3, "max_steps": 16, "max_wall_seconds": 3600}}
    for k, v in over.items():
        if isinstance(v, dict) and isinstance(m.get(k), dict):
            m[k] = {**m[k], **v}
        else:
            m[k] = v
    return m
