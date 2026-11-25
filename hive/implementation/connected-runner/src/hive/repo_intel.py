"""Read-only selective Git repository intelligence.

Uses only the Python standard library plus the `git` CLI (invoked via
subprocess with list args; never shell=True). No network access is performed
directly; remote refs are resolved through `git ls-remote`.
"""
from __future__ import annotations

import hashlib
import json
import os
import subprocess
import time
from dataclasses import dataclass
from pathlib import Path

_HEX40 = set("0123456789abcdef")
_FORBIDDEN_REF_CHARS = set(";|&$`")


class RepoIntelError(ValueError):
    """Raised for invalid input or unsafe/selective-fetch violations."""


def _run(repo_path, *args, binary=False):
    return subprocess.run(
        ["git", "-C", str(repo_path), *args],
        check=True,
        capture_output=True,
        text=not binary,
    )


def _is_40_hex(value):
    return isinstance(value, str) and len(value) == 40 and all(c in _HEX40 for c in value)


def _validate_ref_token(token):
    if not isinstance(token, str) or not token:
        raise RepoIntelError("ref must be a non-empty string")
    if any(ch.isspace() for ch in token):
        raise RepoIntelError("ref contains whitespace")
    if any(ch in _FORBIDDEN_REF_CHARS for ch in token):
        raise RepoIntelError("ref contains forbidden shell metacharacter")
    if token.startswith("-"):
        raise RepoIntelError("ref starts with '-'")
    return token


def _validate_repo_url(url):
    if not isinstance(url, str) or not url:
        raise RepoIntelError("repository url/path must be a non-empty string")
    if any(ch.isspace() for ch in url):
        raise RepoIntelError("repository url contains whitespace")
    if any(ch in _FORBIDDEN_REF_CHARS for ch in url):
        raise RepoIntelError("repository url contains forbidden shell metacharacter")
    return url


def resolve_ref(repo_url_or_path, ref):
    """Resolve *ref* to a full 40-char commit SHA.

    Remote URLs use `git ls-remote`; local paths use `git rev-parse`.
    """
    _validate_repo_url(repo_url_or_path)
    _validate_ref_token(ref)
    if os.path.isdir(os.path.join(repo_url_or_path, ".git")):
        out = _run(repo_url_or_path, "rev-parse", "--verify", "--end-of-options", f"{ref}^{{commit}}").stdout.strip()
    else:
        # Remote: https only; every other git transport (ext::, file, ssh, git) is refused.
        if not repo_url_or_path.startswith("https://"):
            raise RepoIntelError("remote repository must be an https:// URL")
        out = subprocess.run(
            ["git", "-c", "protocol.allow=never", "-c", "protocol.https.allow=always",
             "ls-remote", "--", repo_url_or_path, ref],
            check=True, capture_output=True, text=True, timeout=30,
        ).stdout.strip()
    if not out:
        raise RepoIntelError(f"could not resolve ref: {ref}")
    sha = out.split()[0]
    if not _is_40_hex(sha):
        raise RepoIntelError(f"resolved ref is not a full SHA: {sha!r}")
    return sha


@dataclass(frozen=True)
class TreeEntry:
    path: str
    blob_sha: str
    size: int


class RepoTreeIndex:
    """Index of a Git tree at a given commit SHA, via `git ls-tree -r -l`."""

    def __init__(self, repo_path, commit_sha):
        if not _is_40_hex(commit_sha):
            raise RepoIntelError("commit_sha must be a full 40-hex SHA")
        self.repo_path = repo_path
        self.commit_sha = commit_sha
        self._entries = None

    def _load(self):
        if self._entries is not None:
            return
        out = _run(self.repo_path, "ls-tree", "-r", "-l", self.commit_sha).stdout
        entries = []
        for line in out.splitlines():
            if not line:
                continue
            parts = line.split(None, 3)
            if len(parts) != 4:
                continue
            mode, otype, oid, rest = parts
            if otype != "blob":
                continue
            rest_parts = rest.split(None, 1)
            size_str = rest_parts[0]
            path = rest_parts[1] if len(rest_parts) > 1 else ""
            try:
                size = int(size_str)
            except ValueError:
                size = -1
            entries.append(TreeEntry(path=path, blob_sha=oid, size=size))
        self._entries = entries

    def list(self, prefix=""):
        self._load()
        if prefix:
            return [e for e in self._entries if e.path.startswith(prefix)]
        return list(self._entries)


class ContentCache:
    """Content cache keyed by (commit_sha, path, blob_sha).

    Stores content bytes plus JSON metadata. Tracks hits/misses.
    """

    def __init__(self, dir):
        self.dir = Path(dir)
        self.dir.mkdir(parents=True, exist_ok=True)
        self.hits = 0
        self.misses = 0

    def _key_path(self, commit_sha, path, blob_sha):
        if not _is_40_hex(commit_sha):
            raise RepoIntelError("commit_sha must be a full 40-hex SHA")
        digest = hashlib.sha256(f"{commit_sha}\0{path}\0{blob_sha}".encode("utf-8")).hexdigest()
        return self.dir / (digest + ".json")

    def get(self, commit_sha, path, blob_sha):
        target = self._key_path(commit_sha, path, blob_sha)
        if not target.exists():
            self.misses += 1
            return None
        try:
            record = json.loads(target.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            self.misses += 1
            return None
        if record.get("commit_sha") != commit_sha or record.get("path") != path or record.get("blob_sha") != blob_sha:
            self.misses += 1
            return None
        data_path = self.dir / (record.get("data") or "")
        try:
            content = data_path.read_bytes()
        except OSError:
            self.misses += 1
            return None
        self.hits += 1
        return content

    def put(self, commit_sha, path, blob_sha, content):
        if not _is_40_hex(commit_sha):
            raise RepoIntelError("commit_sha must be a full 40-hex SHA")
        target = self._key_path(commit_sha, path, blob_sha)
        data_digest = hashlib.sha256(content).hexdigest()
        data_path = self.dir / (data_digest + ".bin")
        if not data_path.exists():
            data_path.write_bytes(content)
        meta = {
            "commit_sha": commit_sha,
            "path": path,
            "blob_sha": blob_sha,
            "sha256": data_digest,
            "bytes": len(content),
            "data": data_digest + ".bin",
            "fetched_at": time.time(),
        }
        target.write_text(json.dumps(meta, sort_keys=True), encoding="utf-8")
        return content


def _validate_path(path):
    if not isinstance(path, str) or not path:
        raise RepoIntelError("path must be a non-empty string")
    if "\x00" in path:
        raise RepoIntelError("path contains NUL")
    if "\\" in path:
        raise RepoIntelError("path contains backslash")
    if os.path.isabs(path):
        raise RepoIntelError("path is absolute")
    parts = path.replace("/", os.sep).split(os.sep)
    if ".." in parts or "." in parts:
        raise RepoIntelError("path contains '.' or '..' segment")
    return path


def _matches_globs(path, allowed_globs):
    import fnmatch

    for pattern in allowed_globs:
        if fnmatch.fnmatch(path, pattern):
            return True
    return False


class SelectiveFetcher:
    """Fetch blob content from a Git object store, read-only and bounded."""

    def __init__(self, repo_path, cache, max_bytes=262144, allowed_globs=("*")):
        self.repo_path = repo_path
        if not isinstance(cache, ContentCache):
            raise RepoIntelError("cache must be a ContentCache")
        self.cache = cache
        self.max_bytes = max_bytes
        if isinstance(allowed_globs, str):
            allowed_globs = (allowed_globs,)
        self.allowed_globs = tuple(allowed_globs)

    def fetch(self, commit_sha, path):
        if not _is_40_hex(commit_sha):
            raise RepoIntelError("commit_sha must be a full 40-hex SHA (moving refs must be resolved first)")
        _validate_path(path)
        if not _matches_globs(path, self.allowed_globs):
            raise RepoIntelError(f"path not allowed by globs: {path}")

        index = RepoTreeIndex(self.repo_path, commit_sha)
        entry = None
        for e in index.list():
            if e.path == path:
                entry = e
                break
        if entry is None:
            raise RepoIntelError(f"path not in tree: {path}")

        cached = self.cache.get(commit_sha, path, entry.blob_sha)
        if cached is not None:
            return cached

        raw = _run(self.repo_path, "cat-file", "blob", f"{commit_sha}:{path}", binary=True).stdout

        if len(raw) > self.max_bytes:
            raise RepoIntelError(f"blob exceeds max_bytes ({len(raw)} > {self.max_bytes})")

        if b"\x00" in raw[:8000]:
            raise RepoIntelError("blob is binary (NUL byte in first 8000 bytes)")

        # Verify git object id matches tree entry.
        digest_proc = subprocess.run(
            ["git", "hash-object", "--stdin"],
            input=raw,
            capture_output=True,
        )
        object_sha = digest_proc.stdout.decode("utf-8").strip()
        if object_sha != entry.blob_sha:
            raise RepoIntelError(f"git blob sha mismatch: {object_sha} != {entry.blob_sha}")

        content = raw
        self.cache.put(commit_sha, path, entry.blob_sha, content)
        return content
