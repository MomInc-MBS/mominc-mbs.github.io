"""Append-only JSONL episode; immutable once closed (sha256 manifest). Deterministic replay bytes."""
import hashlib
import json
import os
from pathlib import Path

from hive.storage import _json

from .adapter import replay
from .schema import Event, SchemaError


class EpisodeError(RuntimeError):
    pass


def _sha(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


class EpisodeWriter:
    def __init__(self, root, episode_id, device_manifest=None):
        self.dir = Path(root) / episode_id
        self.events_path, self.manifest_path = self.dir / "events.jsonl", self.dir / "manifest.json"
        if self.manifest_path.exists():
            raise EpisodeError("episode is closed and immutable: " + episode_id)
        self.dir.mkdir(parents=True, exist_ok=True)
        self.episode_id, self.device_manifest = episode_id, device_manifest
        self.count = sum(1 for _ in open(self.events_path, "rb")) if self.events_path.exists() else 0
        self._f = open(self.events_path, "ab")

    def append(self, event):
        if event.episode_id != self.episode_id:
            raise SchemaError("event episode_id mismatch")
        if event.sequence != self.count:   # contiguous; out-of-order *time* is allowed, replay sorts it
            raise SchemaError("sequence %d, expected %d" % (event.sequence, self.count))
        self._f.write(event.to_line().encode("utf-8") + b"\n")
        self.count += 1

    def close(self):
        self._f.flush()
        os.fsync(self._f.fileno())
        self._f.close()
        m = {"episode_id": self.episode_id, "events": self.count, "events_sha256": _sha(self.events_path),
             "device_manifest": self.device_manifest.to_dict() if self.device_manifest else None}
        tmp = self.dir / "manifest.tmp"
        tmp.write_bytes(_json(m).encode("utf-8"))
        os.replace(tmp, self.manifest_path)   # atomic publish = the close marker
        os.chmod(self.events_path, 0o444)
        return m


def verify(episode_dir):
    """Return the manifest dict; raise EpisodeError on tamper."""
    d = Path(episode_dir)
    try:
        m = json.loads((d / "manifest.json").read_text("utf-8"))
    except FileNotFoundError:
        raise EpisodeError("episode not closed")
    if _sha(d / "events.jsonl") != m["events_sha256"]:
        raise EpisodeError("tamper detected: events.jsonl hash mismatch")
    return m


def read_events(episode_dir):
    verify(episode_dir)
    with open(Path(episode_dir) / "events.jsonl", "r", encoding="utf-8") as f:
        return [Event.from_dict(json.loads(line)) for line in f]


def replay_bytes(episode_dir):
    """Byte-identical across runs: canonical JSON lines in (monotonic_time_ns, sequence) order."""
    return b"".join(e.to_line().encode("utf-8") + b"\n" for e in replay(read_events(episode_dir)))
