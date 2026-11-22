import copy
import hashlib
import json
import sqlite3
from concurrent.futures import ThreadPoolExecutor

import pytest

from hive.benchmark_registry import BenchmarkRegistry


def case(task="case-a", split="development", source="source-a", family="family-a",
         public=None, private=None, fixture="fixture-a"):
    public = public or {"prompt": "Solve this", "input": {"fixture": fixture}}
    return {
        "task_id": task, "family_id": family, "generator_or_source_id": source,
        "split": split, "creation_time": "2026-11-21T12:00:00Z",
        "fixture_hash": hashlib.sha256(json.dumps(
            public, sort_keys=True, separators=(",", ":"), ensure_ascii=False,
            allow_nan=False).encode()).hexdigest(),
        "gold_verifier_version": "verify-v1", "exposure_status": "unexposed",
        "consumed_at": None, "public": public or {"prompt": "Solve this", "input": {"x": 1}},
        "private": private or {"gold": {"answer": 42}},
    }


def test_manifest_freezes_and_public_view_excludes_private(tmp_path):
    registry = BenchmarkRegistry(tmp_path / "registry.sqlite")
    item = case(public={"prompt": "Solve", "input": {"x": 3}})
    digest = registry.register_manifest("m1", [item])
    assert len(digest) == 64
    view = registry.get_public_cases("m1", "development")[0]
    assert view["public"] == item["public"]
    assert "private" not in view and "answer" not in str(view)
    edited = copy.deepcopy(item)
    edited["private"]["gold"]["answer"] = 99
    with pytest.raises(ValueError, match="frozen"):
        registry.register_manifest("m1", [edited])
    registry.close()


@pytest.mark.parametrize("mutate", [
    lambda c: c.update(fixture_hash="bad"),
    lambda c: c.update(exposure_status="exposed"),
    lambda c: c["public"].update(expected=42),
    lambda c: c["public"]["input"].update(nested={"gold": 42}),
])
def test_schema_and_public_answer_leakage_fail_closed(tmp_path, mutate):
    item = case()
    mutate(item)
    registry = BenchmarkRegistry(tmp_path / "registry.sqlite")
    with pytest.raises(ValueError):
        registry.register_manifest("m1", [item])
    registry.close()


@pytest.mark.parametrize("key", ["gold-space", "g\u200bold", "label\n", "answer\u00a0"])
def test_obfuscated_private_answer_keys_are_rejected(tmp_path, key):
    item = case(public={key: "leak"})
    registry = BenchmarkRegistry(tmp_path / "registry.sqlite")
    try:
        with pytest.raises(ValueError, match="private-answer"):
            registry.register_manifest("m1", [item])
    finally:
        registry.close()


@pytest.mark.parametrize("value", [1.0, -0.0, "caf\u00e9"])
def test_semantically_equivalent_fixture_cannot_be_relabelled(tmp_path, value):
    path = tmp_path / "registry.sqlite"
    first_public = {"value": value}
    first = case("hold-a", "holdout", "source-a", "family-a", public=first_public)
    registry = BenchmarkRegistry(path)
    registry.register_manifest("m1", [first])
    registry.consume_once("m1", "holdout", "mission-a", "policy", "evaluator")
    registry.close()

    equivalent = (1 if value == 1.0 else 0 if value == -0.0 else "cafe\u0301")
    second = case("hold-b", "holdout", "source-b", "family-b",
                  public={"value": equivalent})
    # The explicit fixture SHA remains the exact wire payload hash and may differ;
    # semantic ownership catches equivalence before a second mission can consume it.
    assert second["fixture_hash"] != first["fixture_hash"]
    reopened = BenchmarkRegistry(path)
    try:
        with pytest.raises(ValueError, match="semantic fixture"):
            reopened.register_manifest("m2", [second])
    finally:
        reopened.close()


def test_invisible_identifier_aliases_and_non_json_native_data_are_rejected(tmp_path):
    registry = BenchmarkRegistry(tmp_path / "registry.sqlite")
    bad_identifier = case(task="task\u200b-a")
    with pytest.raises(ValueError, match="control or format"):
        registry.register_manifest("m1", [bad_identifier])
    for invalid in ((1, 2), float("nan"), float("inf")):
        item = case(task=f"task-{len(str(invalid))}", source=f"s-{len(str(invalid))}",
                    family=f"f-{len(str(invalid))}")
        item["private"]["payload"] = invalid
        with pytest.raises(ValueError):
            registry.register_manifest("m-" + str(len(str(invalid))), [item])
    registry.close()


def test_sources_and_task_aliases_cannot_cross_splits_or_manifests(tmp_path):
    registry = BenchmarkRegistry(tmp_path / "registry.sqlite")
    dev = case()
    with pytest.raises(ValueError, match="split"):
        registry.register_manifest("mixed", [dev, case("case-b", "holdout", "source-a", "family-b", fixture="b")])
    registry.register_manifest("m1", [dev])
    with pytest.raises(ValueError, match="another manifest"):
        registry.register_manifest("m2", [case("CASE-A", "development", "other", "other-family", fixture="other")])
    with pytest.raises(ValueError, match="another manifest"):
        registry.register_manifest("m3", [case("new", "development", "SOURCE-A", "new-family", fixture="x")])
    with pytest.raises(ValueError, match="fixture reused"):
        registry.register_manifest("m4", [case("newer", "development", "another-source",
                                                  "another-family", fixture="fixture-a")])
    registry.close()


def test_holdout_consumption_is_atomic_resumable_and_persisted(tmp_path):
    path = tmp_path / "registry.sqlite"
    registry = BenchmarkRegistry(path)
    registry.register_manifest("m1", [case("hold-a", "holdout", "hold-source", "hold-family")])
    first = registry.consume_once("m1", "holdout", "mission", "policy-v1", "eval-v1")
    assert first[0]["exposure"] == "fresh"
    registry.close()

    reopened = BenchmarkRegistry(path)
    resumed = reopened.consume_once("m1", "holdout", "mission", "policy-v1", "eval-v1")
    assert resumed[0]["exposure"] == "resumed"
    assert resumed[0]["consumed_at"] == first[0]["consumed_at"]
    with pytest.raises(PermissionError):
        reopened.consume_once("m1", "holdout", "mission-2", "policy-v1", "eval-v1")
    with pytest.raises(PermissionError):
        reopened.consume_once("m1", "holdout", "mission", "policy-v2", "eval-v1")
    reopened.close()


def test_same_payload_cannot_inflate_independent_source_count(tmp_path):
    registry = BenchmarkRegistry(tmp_path / "registry.sqlite")
    try:
        with pytest.raises(ValueError, match="duplicate fixture"):
            registry.register_manifest("m1", [
                case("a", "holdout", "source-a", "family-a"),
                case("b", "holdout", "source-b", "family-b"),
            ])
    finally:
        registry.close()


def test_concurrent_consumers_have_one_fresh_exposure(tmp_path):
    path = tmp_path / "registry.sqlite"
    setup = BenchmarkRegistry(path)
    setup.register_manifest("m1", [case("hold-a", "holdout", "hold-source", "hold-family")])
    setup.close()

    def consume(_):
        db = BenchmarkRegistry(path)
        try:
            return db.consume_once("m1", "holdout", "mission", "policy", "eval")[0]["exposure"]
        finally:
            db.close()

    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(consume, range(4)))
    assert results.count("fresh") == 1
    assert results.count("resumed") == 3


def test_manifest_corruption_refuses_access(tmp_path):
    path = tmp_path / "registry.sqlite"
    registry = BenchmarkRegistry(path)
    registry.register_manifest("m1", [case()])
    registry.close()
    with sqlite3.connect(path) as db:
        db.execute("UPDATE manifests SET body=replace(body, 'Solve this', 'Tampered') WHERE manifest_id='m1'")
    with pytest.raises(ValueError, match="integrity"):
        BenchmarkRegistry(path)


def test_open_rebuilds_normalized_ownership_from_legacy_manifests(tmp_path):
    path = tmp_path / "legacy.sqlite"
    item = case("old-task", "holdout", "ＳＯＵＲＣＥ-A", "old-family")
    body = json.dumps([item], sort_keys=True, separators=(",", ":"),
                      ensure_ascii=False, allow_nan=False)
    digest = hashlib.sha256(body.encode("utf-8")).hexdigest()
    with sqlite3.connect(path) as db:
        db.executescript("""
            CREATE TABLE manifests(manifest_id TEXT PRIMARY KEY, body TEXT NOT NULL, digest TEXT NOT NULL);
            CREATE TABLE identity_owners(kind TEXT NOT NULL, identity TEXT NOT NULL,
                manifest_id TEXT NOT NULL, PRIMARY KEY(kind,identity));
            CREATE TABLE fixture_owners(fixture_hash TEXT PRIMARY KEY, split TEXT NOT NULL,
                manifest_id TEXT NOT NULL);
            CREATE TABLE semantic_fixture_owners(fixture_hash TEXT PRIMARY KEY, split TEXT NOT NULL,
                manifest_id TEXT NOT NULL);
            CREATE TABLE exposures(manifest_id TEXT NOT NULL, split TEXT NOT NULL,
                identity TEXT NOT NULL, consumed_at TEXT NOT NULL, PRIMARY KEY(manifest_id,split));
        """)
        db.execute("INSERT INTO manifests VALUES (?,?,?)", ("legacy", body, digest))
        # Simulate the older strip/casefold-only identity index.
        db.execute("INSERT INTO identity_owners VALUES (?,?,?)",
                   ("source", "ｓｏｕｒｃｅ-a", "legacy"))
    registry = BenchmarkRegistry(path)
    try:
        with pytest.raises(ValueError, match="another manifest"):
            registry.register_manifest("new", [case("new-task", "holdout", "SOURCE-A",
                                                       "new-family", fixture="new")])
    finally:
        registry.close()
