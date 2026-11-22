"""Frozen benchmark manifests with a durable, logical evaluator exposure boundary.

Private labels share the process and filesystem with the registry. This is not OS
isolation and must not be used to execute untrusted code in the same trust domain.
"""
from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import json
import math
from pathlib import Path
import re
import sqlite3
import unicodedata

SPLITS = frozenset({"development", "validation", "holdout", "future"})
REQUIRED = frozenset({"task_id", "family_id", "generator_or_source_id", "split",
                      "creation_time", "fixture_hash", "gold_verifier_version",
                      "exposure_status", "consumed_at", "public", "private"})
PUBLIC_FIELDS = frozenset({"task_id", "family_id", "generator_or_source_id", "split",
                           "creation_time", "fixture_hash", "gold_verifier_version",
                           "public"})
_FORBIDDEN_PUBLIC_KEYS = frozenset({"gold", "expected", "answer", "label", "labels",
                                    "private", "oracle", "solution", "verifier_result"})
_FORBIDDEN_PUBLIC_KEYS_COMPACT = frozenset(
    "".join(ch for ch in key if ch.isalnum()) for key in _FORBIDDEN_PUBLIC_KEYS)
_FORBIDDEN_PUBLIC_KEY_TOKENS = frozenset({"gold", "expected", "answer", "label", "labels",
                                         "private", "oracle", "solution"})
_SHA = re.compile(r"[0-9a-f]{64}\Z")


def _json(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"),
                      ensure_ascii=False, allow_nan=False)


def _timestamp(value):
    if not isinstance(value, str):
        raise ValueError("creation_time must be an ISO timestamp")
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValueError("creation_time must be an ISO timestamp") from exc
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        raise ValueError("creation_time must include a timezone")


def _validate_json_native(value, seen=None):
    """Reject values JSON would silently coerce or fail to round-trip."""
    if value is None or type(value) in (bool, int, str):
        return
    if type(value) is float:
        if not math.isfinite(value):
            raise ValueError("JSON numbers must be finite")
        return
    if seen is None:
        seen = set()
    if type(value) in (list, dict):
        identity = id(value)
        if identity in seen:
            raise ValueError("cyclic values are not JSON data")
        seen.add(identity)
        try:
            if type(value) is list:
                for item in value:
                    _validate_json_native(item, seen)
            else:
                for key, item in value.items():
                    if type(key) is not str:
                        raise ValueError("JSON object keys must be strings")
                    _validate_json_native(item, seen)
        finally:
            seen.remove(identity)
        return
    raise ValueError("payloads must contain only JSON-native values")


def _semantic_value(value):
    """Normalize JSON payloads for conservative fixture-alias ownership."""
    if type(value) is str:
        return unicodedata.normalize("NFC", value)
    if type(value) is float and value.is_integer():
        return int(value)
    if type(value) is list:
        return [_semantic_value(item) for item in value]
    if type(value) is dict:
        normalized = {}
        for key, item in value.items():
            semantic_key = unicodedata.normalize("NFC", key)
            if semantic_key in normalized:
                raise ValueError("public payload has Unicode-equivalent object keys")
            normalized[semantic_key] = _semantic_value(item)
        return normalized
    return value


def _semantic_fixture_hash(value):
    canonical = _json(_semantic_value(value)).encode("utf-8")
    return hashlib.sha256(canonical).hexdigest()


def _identifier(value, field):
    if type(value) is not str or not value.strip():
        raise ValueError(f"{field} must be a non-empty string")
    if any(unicodedata.category(ch) in {"Cc", "Cf", "Cs"} for ch in value):
        raise ValueError(f"{field} cannot contain control or format characters")
    # Compatibility normalization catches common full-width/compatibility aliases.
    return " ".join(unicodedata.normalize("NFKC", value).casefold().split())


def _private_key_name(key):
    """Reject known answer-field words after Unicode/separator normalization.

    This is a guard against common accidental leakage, not semantic inspection of
    curator-supplied values or arbitrary key encodings.
    """
    # Normalize compatibility forms and formatting characters, then match exact
    # words/known compact names. This catches padding without banning `golden_ratio`.
    normalized = unicodedata.normalize("NFKC", key).casefold()
    normalized = "".join(ch for ch in normalized if not unicodedata.category(ch).startswith("C"))
    tokens = set(re.findall(r"[a-z0-9]+", normalized))
    compact = "".join(ch for ch in normalized if ch.isalnum())
    return bool(tokens & _FORBIDDEN_PUBLIC_KEY_TOKENS) or compact in _FORBIDDEN_PUBLIC_KEYS_COMPACT


def _validate_case(case):
    if not isinstance(case, dict) or set(case) != REQUIRED:
        raise ValueError("case must contain exactly the registered schema fields")
    for key in ("task_id", "family_id", "generator_or_source_id", "gold_verifier_version"):
        _identifier(case[key], key)
    if type(case["split"]) is not str or case["split"] not in SPLITS:
        raise ValueError("unsupported split")
    _timestamp(case["creation_time"])
    if not isinstance(case["fixture_hash"], str) or not _SHA.fullmatch(case["fixture_hash"]):
        raise ValueError("fixture_hash must be a lowercase sha256 digest")
    if case["exposure_status"] != "unexposed" or case["consumed_at"] is not None:
        raise ValueError("new manifest cases must start unexposed with consumed_at null")
    if not isinstance(case["public"], dict) or not isinstance(case["private"], dict):
        raise ValueError("public and private payloads must be objects")
    _validate_json_native(case["public"])
    _validate_json_native(case["private"])
    def inspect(value):
        if isinstance(value, dict):
            for key, nested in value.items():
                if type(key) is not str or _private_key_name(key):
                    raise ValueError("public payload contains a private-answer field")
                inspect(nested)
        elif isinstance(value, list):
            for nested in value:
                inspect(nested)
    inspect(case["public"])
    expected_fixture_hash = hashlib.sha256(_json(case["public"]).encode("utf-8")).hexdigest()
    if case["fixture_hash"] != expected_fixture_hash:
        raise ValueError("fixture_hash must match the canonical public payload")
    return dict(case)


class BenchmarkRegistry:
    """SQLite-backed immutable manifests and one-use holdout/future exposures."""

    def __init__(self, path):
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(path, timeout=30, isolation_level=None)
        self.db.row_factory = sqlite3.Row
        self.db.execute("PRAGMA journal_mode=WAL")
        self.db.executescript("""
            CREATE TABLE IF NOT EXISTS manifests(
                manifest_id TEXT PRIMARY KEY, body TEXT NOT NULL, digest TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS identity_owners(
                kind TEXT NOT NULL, identity TEXT NOT NULL, manifest_id TEXT NOT NULL,
                PRIMARY KEY(kind,identity));
            CREATE TABLE IF NOT EXISTS fixture_owners(
                fixture_hash TEXT PRIMARY KEY, split TEXT NOT NULL, manifest_id TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS semantic_fixture_owners(
                fixture_hash TEXT PRIMARY KEY, split TEXT NOT NULL, manifest_id TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS exposures(
                manifest_id TEXT NOT NULL, split TEXT NOT NULL, identity TEXT NOT NULL,
                consumed_at TEXT NOT NULL, PRIMARY KEY(manifest_id,split));
        """)
        try:
            self._rebuild_ownership_indexes()
        except BaseException:
            self.db.close()
            raise

    def _rebuild_ownership_indexes(self):
        """Rebuild derived ownership indexes using current Unicode equivalence rules."""
        self.db.execute("BEGIN IMMEDIATE")
        try:
            self.db.execute("DELETE FROM identity_owners")
            self.db.execute("DELETE FROM fixture_owners")
            self.db.execute("DELETE FROM semantic_fixture_owners")
            identity_owners = {}
            fixture_owners = {}
            semantic_owners = {}
            rows = self.db.execute("SELECT manifest_id,body,digest FROM manifests").fetchall()
            for row in rows:
                if hashlib.sha256(row["body"].encode("utf-8")).hexdigest() != row["digest"]:
                    raise ValueError("manifest integrity failure during registry migration")
                try:
                    cases = json.loads(row["body"])
                    for case in cases:
                        _validate_case(case)
                except Exception as exc:
                    raise ValueError("manifest corruption during registry migration") from exc
                local_identities = {}
                local_tasks = set()
                local_fixtures = set()
                local_semantic_fixtures = set()
                for case in cases:
                    for kind, field in (("task", "task_id"), ("family", "family_id"),
                                        ("source", "generator_or_source_id")):
                        identity = (kind, _identifier(case[field], kind))
                        prior_split = local_identities.setdefault(identity, case["split"])
                        if prior_split != case["split"]:
                            raise ValueError("identity split collision during registry migration")
                        if kind == "task":
                            if identity in local_tasks:
                                raise ValueError("duplicate task identity during registry migration")
                            local_tasks.add(identity)
                        prior_owner = identity_owners.setdefault(identity, row["manifest_id"])
                        if prior_owner != row["manifest_id"]:
                            raise ValueError("identity ownership conflict during registry migration")
                    raw_fixture = case["fixture_hash"]
                    semantic_fixture = _semantic_fixture_hash(case["public"])
                    if raw_fixture in local_fixtures or semantic_fixture in local_semantic_fixtures:
                        raise ValueError("duplicate fixture in existing manifest")
                    local_fixtures.add(raw_fixture)
                    local_semantic_fixtures.add(semantic_fixture)
                    for fixture, owners, table in (
                            (raw_fixture, fixture_owners, "fixture_owners"),
                            (semantic_fixture, semantic_owners, "semantic_fixture_owners")):
                        owner = owners.setdefault(fixture, (case["split"], row["manifest_id"]))
                        if owner != (case["split"], row["manifest_id"]):
                            raise ValueError("fixture ownership conflict during registry migration")
                        self.db.execute(f"INSERT OR IGNORE INTO {table} VALUES (?,?,?)",
                                        (fixture, case["split"], row["manifest_id"]))
            for (kind, identity), owner in identity_owners.items():
                self.db.execute("INSERT INTO identity_owners VALUES (?,?,?)",
                                (kind, identity, owner))
            self.db.execute("COMMIT")
        except BaseException:
            self.db.execute("ROLLBACK")
            raise

    def register_manifest(self, manifest_id, cases):
        if not isinstance(manifest_id, str) or not manifest_id.strip():
            raise ValueError("manifest_id required")
        if not isinstance(cases, list) or not cases:
            raise ValueError("manifest requires a non-empty case list")
        normalized = [_validate_case(case) for case in cases]
        if len({c["task_id"] for c in normalized}) != len(normalized):
            raise ValueError("duplicate task_id")
        ownership = {}
        fixtures = {}
        semantic_fixtures = {}
        task_aliases = set()
        for case in normalized:
            for kind, value in (("task", case["task_id"]), ("family", case["family_id"]),
                                ("source", case["generator_or_source_id"])):
                key = (kind, _identifier(value, kind))
                if kind == "task" and key[1] in task_aliases:
                    raise ValueError("duplicate task_id alias")
                if kind == "task":
                    task_aliases.add(key[1])
                prior = ownership.setdefault(key, case["split"])
                if prior != case["split"]:
                    raise ValueError(f"{kind} identity reused across benchmark splits")
            fixture = case["fixture_hash"]
            if fixture in fixtures:
                raise ValueError("duplicate fixture payload within manifest or across splits")
            prior = fixtures.setdefault(fixture, case["split"])
            if prior != case["split"]:
                raise ValueError("fixture reused across benchmark splits")
            semantic_fixture = _semantic_fixture_hash(case["public"])
            if semantic_fixture in semantic_fixtures:
                raise ValueError("duplicate semantic fixture payload within manifest")
            semantic_fixtures[semantic_fixture] = case["split"]
        body = _json(normalized)
        digest = hashlib.sha256(body.encode("utf-8")).hexdigest()
        self.db.execute("BEGIN IMMEDIATE")
        try:
            existing = self.db.execute("SELECT body,digest FROM manifests WHERE manifest_id=?",
                                       (manifest_id,)).fetchone()
            if existing:
                if existing["digest"] != digest or existing["body"] != body:
                    raise ValueError("manifest is frozen and cannot be edited")
                self.db.execute("COMMIT")
                return digest
            for (kind, identity), split in ownership.items():
                owner = self.db.execute("SELECT manifest_id FROM identity_owners WHERE kind=? AND identity=?",
                                        (kind, identity)).fetchone()
                if owner and owner["manifest_id"] != manifest_id:
                    raise ValueError(f"{kind} identity already registered in another manifest")
            for fixture, split in fixtures.items():
                owner = self.db.execute("SELECT split,manifest_id FROM fixture_owners WHERE fixture_hash=?",
                                        (fixture,)).fetchone()
                if owner and (owner["split"] != split or owner["manifest_id"] != manifest_id):
                    raise ValueError("fixture reused across benchmark splits")
            for fixture, split in semantic_fixtures.items():
                owner = self.db.execute("SELECT split,manifest_id FROM semantic_fixture_owners WHERE fixture_hash=?",
                                        (fixture,)).fetchone()
                if owner and (owner["split"] != split or owner["manifest_id"] != manifest_id):
                    raise ValueError("semantic fixture reused across benchmark splits/manifests")
            self.db.execute("INSERT INTO manifests VALUES (?,?,?)", (manifest_id, body, digest))
            for (kind, identity), _split in ownership.items():
                self.db.execute("INSERT OR IGNORE INTO identity_owners VALUES (?,?,?)",
                                 (kind, identity, manifest_id))
            for fixture, split in fixtures.items():
                self.db.execute("INSERT OR IGNORE INTO fixture_owners VALUES (?,?,?)",
                                (fixture, split, manifest_id))
            for fixture, split in semantic_fixtures.items():
                self.db.execute("INSERT OR IGNORE INTO semantic_fixture_owners VALUES (?,?,?)",
                                (fixture, split, manifest_id))
            self.db.execute("COMMIT")
            return digest
        except BaseException:
            self.db.execute("ROLLBACK")
            raise

    def _manifest(self, manifest_id):
        row = self.db.execute("SELECT body,digest FROM manifests WHERE manifest_id=?",
                              (manifest_id,)).fetchone()
        if row is None:
            raise KeyError(manifest_id)
        if hashlib.sha256(row["body"].encode("utf-8")).hexdigest() != row["digest"]:
            raise ValueError("manifest integrity failure")
        try:
            cases = json.loads(row["body"])
            for case in cases:
                _validate_case(case)
        except Exception as exc:
            raise ValueError("manifest corruption") from exc
        return row["digest"], cases

    @staticmethod
    def _public(case):
        # Explicit allowlist. Private labels and unknown keys can never cross this API.
        return {key: case[key] for key in PUBLIC_FIELDS}

    def get_public_cases(self, manifest_id, split):
        """Read development/validation cases. Validation repeats are diagnostics only."""
        if split not in {"development", "validation"}:
            raise ValueError("only development and reusable validation are directly readable")
        _, cases = self._manifest(manifest_id)
        result = [self._public(c) for c in cases if c["split"] == split]
        if not result:
            raise KeyError(f"no cases in split {split}")
        return result

    def consume_once(self, manifest_id, split, mission_id, policy_id, evaluator_id):
        """Atomically consume holdout/future before returning candidate-visible cases.

        Same identity resumes the recorded exposure and is marked `resumed`; it does
        not represent a fresh evaluation. Any identity change is refused.
        """
        if split not in {"holdout", "future"}:
            raise ValueError("consume_once is only for holdout and future")
        identity_fields = (mission_id, policy_id, evaluator_id)
        if any(not isinstance(v, str) or not v.strip() for v in identity_fields):
            raise ValueError("mission, policy and evaluator identities are required")
        digest, cases = self._manifest(manifest_id)
        matching = [c for c in cases if c["split"] == split]
        if not matching:
            raise KeyError(f"no cases in split {split}")
        identity = _json({"mission_id": mission_id, "policy_id": policy_id,
                           "evaluator_id": evaluator_id, "manifest_hash": digest})
        self.db.execute("BEGIN IMMEDIATE")
        try:
            existing = self.db.execute("SELECT identity,consumed_at FROM exposures WHERE manifest_id=? AND split=?",
                                       (manifest_id, split)).fetchone()
            resumed = existing is not None
            if resumed and existing["identity"] != identity:
                raise PermissionError("one-use exposure already belongs to another identity")
            consumed_at = existing["consumed_at"] if resumed else datetime.now(timezone.utc).isoformat()
            if not resumed:
                self.db.execute("INSERT INTO exposures VALUES (?,?,?,?)",
                                 (manifest_id, split, identity, consumed_at))
            self.db.execute("COMMIT")
        except BaseException:
            self.db.execute("ROLLBACK")
            raise
        return [{**self._public(c), "exposure": "resumed" if resumed else "fresh",
                 "consumed_at": consumed_at} for c in matching]

    def close(self):
        self.db.close()
