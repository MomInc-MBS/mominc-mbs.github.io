"""Unit tests for HIVE durable verified memory / provenance store."""
from __future__ import annotations

import pytest

from hive.memory_store import MemoryStore
from hive.storage import Store


def test_store_and_get_verified_entry(tmp_path):
    store = Store(tmp_path)
    ms = MemoryStore(store)
    digest = ms.store_verified(key="k1", value={"x": 1}, source="test",
                               verified=True, metadata={"foo": "bar"})
    assert isinstance(digest, str) and len(digest) == 64
    entry = ms.get("k1")
    assert entry is not None
    assert entry["key"] == "k1"
    assert entry["value"] == {"x": 1}
    assert entry["source"] == "test"
    assert entry["verified"] is True
    assert entry["metadata"] == {"foo": "bar"}
    assert entry["digest"] == digest
    store.close()


def test_get_verified_returns_none_for_unverified(tmp_path):
    store = Store(tmp_path)
    ms = MemoryStore(store)
    ms.store_verified(key="k2", value={"y": 2}, source="scratch", verified=False)
    assert ms.get_verified("k2") is None
    assert ms.get("k2") is not None
    assert ms.get("k2")["verified"] is False
    store.close()


def test_get_missing_returns_none(tmp_path):
    store = Store(tmp_path)
    ms = MemoryStore(store)
    assert ms.get("nope") is None
    assert ms.get_verified("nope") is None
    store.close()


def test_store_unverified_scratch(tmp_path):
    store = Store(tmp_path)
    ms = MemoryStore(store)
    ms.store_unverified_scratch(key="scratch1", value="temp", source="agent")
    entry = ms.get("scratch1")
    assert entry["verified"] is False
    store.close()


def test_put_artifact_roundtrips_value(tmp_path):
    store = Store(tmp_path)
    ms = MemoryStore(store)
    value = {"a": 1, "b": [1, 2, 3]}
    d1 = ms.store_verified(key="k3", value=value, source="s")
    entry = ms.get("k3")
    assert entry is not None
    assert entry["value"] == value
    assert entry["digest"] == d1
    # digest is stable for the same stored payload
    assert ms.get("k3")["digest"] == d1
    store.close()


def test_sweep_expired_is_safe_noop(tmp_path):
    store = Store(tmp_path)
    ms = MemoryStore(store)
    # Should not raise even with nothing tracked
    assert ms.sweep_expired() == 0
    store.close()
