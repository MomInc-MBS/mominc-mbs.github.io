"""Optional adapters (RunAnywhere, Obscura) are OFF by default and stay gated."""

import json
from pathlib import Path

import pytest

from hive.adapters import obscura, runanywhere

LOCK = Path(__file__).resolve().parents[1] / "integrations" / "sources.lock.json"
MODULES = [
    (runanywhere, "HIVE_ENABLE_RUNANYWHERE", "RunAnywhere"),
    (obscura, "HIVE_ENABLE_OBSCURA", "Obscura"),
]


def _lock_license(project):
    data = json.loads(LOCK.read_text(encoding="utf-8"))
    return next(e["license_spdx"] for e in data["entries"] if e["project"] == project)


@pytest.mark.parametrize("module,env,project", MODULES)
def test_disabled_by_default(monkeypatch, module, env, project):
    monkeypatch.delenv(env, raising=False)
    st = module.status()
    assert module.ENABLED_ENV == env
    assert st["enabled"] is False
    assert st["state"] == "OFF"  # label must not claim test evidence
    assert st["reason"] == "pilot not approved; license/hardware gate pending"


@pytest.mark.parametrize("module,env,project", MODULES)
def test_run_raises_when_disabled(monkeypatch, module, env, project):
    monkeypatch.delenv(env, raising=False)
    with pytest.raises(RuntimeError, match="adapter disabled"):
        module.run()


@pytest.mark.parametrize("module,env,project", MODULES)
def test_enabled_still_not_implemented(monkeypatch, module, env, project):
    monkeypatch.setenv(env, "1")
    assert module.status()["enabled"] is True
    with pytest.raises(NotImplementedError) as exc:
        module.run("anything", key=1)
    assert str(exc.value) == (
        "pilot not implemented; requires license review and operator approval"
    )


@pytest.mark.parametrize("module,env,project", MODULES)
def test_only_exact_one_enables(monkeypatch, module, env, project):
    for value in ("0", "true", "yes", ""):
        monkeypatch.setenv(env, value)
        assert module.status()["enabled"] is False


@pytest.mark.parametrize("module,env,project", MODULES)
def test_license_matches_lock_file(module, env, project):
    assert module.status()["license"] == _lock_license(project)


def test_obscura_constraints_stated(monkeypatch):
    monkeypatch.delenv("HIVE_ENABLE_OBSCURA", raising=False)
    assert obscura.status()["constraints"] == (
        "read-only; no stealth/evasion; SSRF and prompt-injection tests required "
        "before enablement"
    )


def test_known_licenses():
    assert runanywhere.status()["license"] == "NOASSERTION"
    assert obscura.status()["license"] == "Apache-2.0"
