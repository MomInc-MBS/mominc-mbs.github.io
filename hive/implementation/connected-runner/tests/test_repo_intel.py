"""Tests for src/hive/repo_intel.py (read-only selective Git intelligence)."""

from __future__ import annotations

import os
import subprocess
from pathlib import Path

import pytest

from hive.repo_intel import (
    ContentCache,
    RepoIntelError,
    RepoTreeIndex,
    SelectiveFetcher,
    resolve_ref,
)

GIT = ["git"]


def _run_git(cwd, *args):
    return subprocess.run(GIT + ["-C", str(cwd), *args], check=True, capture_output=True, text=True)


def _make_repo(tmp_path: Path) -> Path:
    repo = tmp_path / "repo"
    repo.mkdir()
    _run_git(repo, "init", "-q", "-b", "main")
    _run_git(repo, "config", "user.email", "t@t.test")
    _run_git(repo, "config", "user.name", "Test")
    (repo / "hello.txt").write_text("hello world\n", encoding="utf-8")
    (repo / "data.bin").write_bytes(bytes(range(256)) * 4)
    _run_git(repo, "add", "hello.txt", "data.bin")
    _run_git(repo, "commit", "-q", "-m", "initial")
    return repo


def _sha(repo: Path, ref: str) -> str:
    out = _run_git(repo, "rev-parse", ref).stdout.strip()
    return out.split()[0]


def test_resolve_ref_returns_full_sha(tmp_path):
    repo = _make_repo(tmp_path)
    sha = resolve_ref(str(repo), "main")
    assert len(sha) == 40
    assert all(c in "0123456789abcdef" for c in sha)
    assert sha == _sha(repo, "HEAD")


def test_tree_lists_files_with_sizes(tmp_path):
    repo = _make_repo(tmp_path)
    sha = _sha(repo, "HEAD")
    index = RepoTreeIndex(str(repo), sha)
    entries = {e.path: e for e in index.list()}
    assert set(entries) == {"hello.txt", "data.bin"}
    assert entries["hello.txt"].blob_sha and len(entries["hello.txt"].blob_sha) == 40
    assert entries["hello.txt"].size == len("hello world\n")
    assert entries["data.bin"].size == 1024


def test_fetch_returns_exact_bytes_and_cache_hit(tmp_path):
    repo = _make_repo(tmp_path)
    sha = _sha(repo, "HEAD")
    cache = ContentCache(tmp_path / "cache")
    fetcher = SelectiveFetcher(str(repo), cache)
    content = fetcher.fetch(sha, "hello.txt")
    assert content == b"hello world\n"
    assert cache.misses == 1
    assert cache.hits == 0
    again = fetcher.fetch(sha, "hello.txt")
    assert again == b"hello world\n"
    assert cache.hits == 1
    assert cache.misses == 1


def test_fetch_traversal_raises(tmp_path):
    repo = _make_repo(tmp_path)
    sha = _sha(repo, "HEAD")
    fetcher = SelectiveFetcher(str(repo), ContentCache(tmp_path / "cache"))
    with pytest.raises(ValueError):
        fetcher.fetch(sha, "../hello.txt")


def test_fetch_absolute_path_raises(tmp_path):
    repo = _make_repo(tmp_path)
    sha = _sha(repo, "HEAD")
    fetcher = SelectiveFetcher(str(repo), ContentCache(tmp_path / "cache"))
    with pytest.raises(ValueError):
        fetcher.fetch(sha, "/etc/passwd")


def test_fetch_backslash_path_raises(tmp_path):
    repo = _make_repo(tmp_path)
    sha = _sha(repo, "HEAD")
    fetcher = SelectiveFetcher(str(repo), ContentCache(tmp_path / "cache"))
    with pytest.raises(ValueError):
        fetcher.fetch(sha, "..\\hello.txt")


def test_fetch_missing_path_raises(tmp_path):
    repo = _make_repo(tmp_path)
    sha = _sha(repo, "HEAD")
    fetcher = SelectiveFetcher(str(repo), ContentCache(tmp_path / "cache"))
    with pytest.raises(ValueError):
        fetcher.fetch(sha, "nope.txt")


def test_fetch_binary_raises(tmp_path):
    repo = _make_repo(tmp_path)
    sha = _sha(repo, "HEAD")
    fetcher = SelectiveFetcher(str(repo), ContentCache(tmp_path / "cache"))
    with pytest.raises(ValueError):
        fetcher.fetch(sha, "data.bin")


def test_fetch_oversized_raises(tmp_path):
    repo = _make_repo(tmp_path)
    sha = _sha(repo, "HEAD")
    fetcher = SelectiveFetcher(str(repo), ContentCache(tmp_path / "cache"), max_bytes=10)
    with pytest.raises(ValueError):
        fetcher.fetch(sha, "hello.txt")


def test_fetch_disallowed_glob_raises(tmp_path):
    repo = _make_repo(tmp_path)
    sha = _sha(repo, "HEAD")
    fetcher = SelectiveFetcher(str(repo), ContentCache(tmp_path / "cache"), allowed_globs=("*.md",))
    with pytest.raises(ValueError):
        fetcher.fetch(sha, "hello.txt")


def test_injection_ref_raises(tmp_path):
    repo = _make_repo(tmp_path)
    with pytest.raises(ValueError):
        resolve_ref(str(repo), "main;rm -rf /")


def test_cache_refuses_moving_ref(tmp_path):
    repo = _make_repo(tmp_path)
    cache = ContentCache(tmp_path / "cache")
    with pytest.raises(ValueError):
        cache.get("main", "hello.txt", "deadbeef" * 5)


def test_prefix_filter(tmp_path):
    repo = _make_repo(tmp_path)
    sha = _sha(repo, "HEAD")
    index = RepoTreeIndex(str(repo), sha)
    assert index.list(prefix="h") == [e for e in index.list() if e.path.startswith("h")]


def test_cache_put_get_metadata(tmp_path):
    repo = _make_repo(tmp_path)
    sha = _sha(repo, "HEAD")
    cache = ContentCache(tmp_path / "cache")
    fetcher = SelectiveFetcher(str(repo), cache)
    fetcher.fetch(sha, "hello.txt")
    target = list(cache.dir.glob("*.json"))[0]
    meta = target.read_text(encoding="utf-8")
    assert sha in meta and "hello.txt" in meta and "sha256" in meta and "fetched_at" in meta


def test_remote_non_https_transport_refused():
    import pytest
    from hive.repo_intel import RepoIntelError, resolve_ref
    for url in ("ext::sh", "file:///tmp/x", "git://example.com/r.git", "ssh://example.com/r.git"):
        with pytest.raises((RepoIntelError, ValueError)):
            resolve_ref(url, "HEAD")
