"""Slice D security follow-ups (DF_REVIEW 1-4, D_REVIEW 5/8/9). Network-free: real git for config, fakes for transport."""
from __future__ import annotations

import json
import subprocess
from pathlib import Path

import pytest

from exp_fakes import FakeTransport, GOOD, URL, allowlist, make_fixture, manifest
from hive import experiment_tool, experiment_verify
from hive.experiment_driver import ExperimentDriver, ExperimentError, GitTransport, PermanentFetchError, _sha
from hive.storage import Store
from test_experiment_driver import env  # noqa: F401  (shared fixture)


def _frozen(env, exp):
    s = Store(env.root)
    try:
        return s.read_artifact(s.get(f"exp:{exp}:frozen"))
    finally:
        s.close()


# ---- DF #1 / D #8: verify anchored outside the store --------------------------------------------------

def test_verify_anchor_rejects_consistent_store_that_is_not_the_registered_experiment(env):
    """A store holding a *weakened* experiment under the registered id is internally consistent (ok) but not anchored."""
    fx2 = make_fixture(env.tmp / "fx2", GOOD.replace("Bravo (the)", "Bravo (The)"))
    allowlist([env.fx, fx2], env.al)
    weak = manifest(fx2, exp="exp-2", checks={"forbid_pattern": "(?!x)x"})  # forbidden-style check can never fire
    assert env.drv(FakeTransport(fx2), fixture=fx2).run(weak)["status"] == "ACCEPT"
    real = manifest(fx2, exp="exp-2")  # what the operator actually registered
    plain = env.drv().verify("exp-2")
    assert plain["ok"] and plain["anchored"] is False  # old behaviour: nothing outside the store is consulted
    anchored = env.drv().verify("exp-2", manifest=real, canonical_allowlist=env.al)
    assert not anchored["ok"] and anchored["anchored"] is False and anchored["checks"]["anchor_manifest_matches_frozen"] is False


def test_verify_anchored_true_for_the_genuine_manifest_file_and_canonical_allowlist(env, tmp_path):
    env.drv().run(manifest(env.fx))
    mf = tmp_path / "m.json"
    mf.write_text(json.dumps(manifest(env.fx)), encoding="utf-8")
    v = env.drv().verify("exp-1", manifest=str(mf), canonical_allowlist=env.al)
    assert v["ok"] and v["anchored"] is True


def test_verify_anchor_requires_the_canonical_allowlist_not_the_run_override(env, tmp_path):
    env.drv().run(manifest(env.fx))  # run used env.al
    other = allowlist([env.fx], tmp_path / "canonical.json", max_files=32)  # a different "canonical" file
    v = env.drv().verify("exp-1", manifest=manifest(env.fx), canonical_allowlist=other)
    assert not v["ok"] and v["anchored"] is False and v["checks"]["anchor_allowlist_is_canonical"] is False


# ---- DF #2: repo-local git config is trusted input --------------------------------------------------

def _bare(tmp_path, *kv):
    repo = tmp_path / "r.git"
    subprocess.run(["git", "init", "--bare", "-q", "--template=", str(repo)], check=True, capture_output=True)
    for k, v in kv:
        subprocess.run(["git", f"--git-dir={repo}", "config", "--local", k, v], check=True, capture_output=True)
    return repo


@pytest.mark.parametrize("key,val", [
    ("http.https://example.test/.sslVerify", "false"),  # URL-scoped key beats our -c http.sslVerify=true
    ("url.https://evil.example/.insteadOf", "https://example.test/"),  # reroutes the endpoint
    ("http.extraHeader", "X-Evil: 1"), ("core.gitProxy", "calc.exe"), ("core.sshCommand", "calc.exe"), ("core.fsmonitor", "calc.exe"),
    ("include.path", "../evil.cfg"), ("credential.helper", "!evil"), ("remote.x.url", "https://evil.example/r"),
])
def test_hostile_repo_local_config_is_refused_before_any_network(tmp_path, key, val):
    repo = _bare(tmp_path, (key, val))
    t = GitTransport()
    assert t.local_config_violations(repo)
    with pytest.raises(PermanentFetchError, match="repo-local git config"):
        t.fetch(URL, "a" * 40, repo, 4096)
    assert t.calls == 0  # old code went straight to the (rerouted / unverified) fetch


def test_config_git_itself_writes_is_accepted(tmp_path):
    repo = _bare(tmp_path, ("remote.https://example.test/fixture/repo.promisor", "true"),
                 ("remote.https://example.test/fixture/repo.partialclonefilter", "blob:none"))
    assert GitTransport().local_config_violations(repo, "https://example.test/fixture/repo") == []
    assert GitTransport().local_config_violations(repo, "https://other.test/r") != []  # FINAL_REVIEW #6: promisor only for the exact URL


# ---- D #5: fetch only the needed blob ---------------------------------------------------------------

OID = "b" * 40
COMMIT = "a" * 40


class _FakeGit:
    """Emulates just enough `git` to drive GitTransport.fetch: records every command, tracks what is 'local'."""

    def __init__(self, repo, oid=OID, big=0):
        self.repo, self.oid, self.big, self.cmds, self.local = Path(repo), oid, big, [], set()

    def __call__(self, cmd, **kw):
        self.cmds.append(cmd)
        ok = lambda out="": subprocess.CompletedProcess(cmd, 0, out, "")  # noqa: E731
        no = subprocess.CompletedProcess(cmd, 1, "", "")
        if "fetch" in cmd:
            target = cmd[-1]
            self.local.add(target)
            if target == COMMIT:
                self.local.add("tree")
            if self.big and target == self.oid:
                p = self.repo / "objects" / "pack"
                p.mkdir(parents=True, exist_ok=True)
                (p / "x.pack").write_bytes(b"x" * self.big)
            return ok()
        if "cat-file" in cmd:
            want = cmd[-1].removesuffix("^{commit}")
            return ok() if want in self.local else no
        if "ls-tree" in cmd:
            return ok(f"100644 blob {self.oid}\tdata.csv\n") if "tree" in self.local else no
        if "config" in cmd:
            return ok(f"core.bare\nremote.{URL}.promisor\n")
        return ok()


def _transport(tmp_path, **kw):
    repo = tmp_path / "r.git"
    (repo / "objects").mkdir(parents=True)
    g = _FakeGit(repo, **kw)
    return GitTransport(run=g), g, repo


def test_fetch_is_trees_only_then_exactly_one_blob_oid_each_counted(tmp_path):
    t, g, repo = _transport(tmp_path)
    counted = []
    assert t.fetch(URL, COMMIT, repo, 65536, path="data.csv", before_call=lambda: counted.append(1), expect_blob=OID) == 2
    fetches = [c for c in g.cmds if "fetch" in c]
    assert len(fetches) == 2 == t.calls == len(counted)
    assert "--filter=blob:none" in fetches[0] and "--depth=1" in fetches[0] and fetches[0][-3:] == ["--", URL, COMMIT]
    assert fetches[1][-3:] == ["--", URL, OID] and not any("filter" in a for a in fetches[1])  # the single wanted blob, nothing else
    assert not any("blob:limit" in a for c in fetches for a in c)  # old: --filter=blob:limit=N pulled every small blob
    before = len(g.cmds)
    assert t.fetch(URL, COMMIT, repo, 65536, path="data.csv", before_call=lambda: counted.append(1)) == 0
    assert not any("fetch" in c for c in g.cmds[before:]) and len(counted) == 2  # everything local: zero network


def test_unexpected_blob_oid_is_not_fetched(tmp_path):
    t, g, repo = _transport(tmp_path)
    counted = []
    with pytest.raises(PermanentFetchError, match="blob not fetched"):
        t.fetch(URL, COMMIT, repo, 65536, path="data.csv", before_call=lambda: counted.append(1), expect_blob="c" * 40)
    assert len(counted) == 1 and sum("fetch" in c for c in g.cmds) == 1  # only the trees-only request happened


def test_pack_size_over_cap_fails_closed(tmp_path):
    t, g, repo = _transport(tmp_path, big=5000)
    with pytest.raises(PermanentFetchError, match="exceeds cap"):
        t.fetch(URL, COMMIT, repo, 65536, path="data.csv", max_pack_bytes=1000)


# ---- DF #3: queue-drain guards ignore typed experiment jobs ----------------------------------------

class _PastGuard(Exception):
    pass


def _seed(root, typed=True):
    s = Store(root)
    s.enqueue_once("exp:x", {"kind": "ooda_experiment", "experiment_id": "x"} if typed else {"task": {"id": "t"}})
    s.close()


@pytest.mark.parametrize("typed,expect", [(True, _PastGuard), (False, ValueError)])
def test_lab_drain_guard_ignores_experiment_jobs_but_still_guards_plain_jobs(tmp_path, monkeypatch, typed, expect):
    from hive.lab import run_campaign
    from hive.orchestrator import DEFAULT_CONFIG

    def boom(*_):
        raise _PastGuard
    monkeypatch.setattr("hive.lab.discover", boom)
    monkeypatch.setattr("hive.model_registry.discover", lambda *_: {"available": True, "models": [{"id": "m", "digest": "d"}]})
    _seed(tmp_path / "s", typed)
    with pytest.raises(expect):
        run_campaign(tmp_path / "s", dict(DEFAULT_CONFIG, model="m"))


@pytest.mark.parametrize("typed,expect", [(True, _PastGuard), (False, ValueError)])
def test_adaptive_drain_guard_ignores_experiment_jobs_but_still_guards_plain_jobs(tmp_path, monkeypatch, typed, expect):
    from hive.adaptive import run_adaptive
    from hive.orchestrator import DEFAULT_CONFIG

    def boom(*_):
        raise _PastGuard
    monkeypatch.setattr("hive.adaptive._learning_state", boom)
    monkeypatch.setattr("hive.model_registry.discover", lambda *_: {"available": True, "models": [{"id": "m", "digest": "d"}]})
    _seed(tmp_path / "s", typed)
    with pytest.raises(expect):
        run_adaptive(tmp_path / "s", dict(DEFAULT_CONFIG, model="m"), rounds=1)


# ---- DF #4: replay counters are measured; proxy use is recorded ------------------------------------

def test_replay_counters_are_measured_not_literal(env, monkeypatch):
    env.drv().run(manifest(env.fx))
    t2 = FakeTransport(env.fx)
    real = ExperimentDriver._verify_evidence

    def touchy(self, *a, **k):  # something during replay that makes one transport call and writes one ledger line
        t2.calls += 1
        with open(env.root / "usage-ledger.jsonl", "ab") as f:
            f.write(b"{}\n")
        return real(self, *a, **k)
    monkeypatch.setattr(ExperimentDriver, "_verify_evidence", touchy)
    rp = env.drv(t2).run(manifest(env.fx))["replay"]
    assert rp["network_calls_this_invocation"] == 1 and rp["model_dispatches_this_invocation"] == 1  # old code: literal 0 / 0


def test_clean_replay_measures_zero(env):
    env.drv().run(manifest(env.fx))
    rp = env.drv(FakeTransport(env.fx)).run(manifest(env.fx))["replay"]
    assert rp["network_calls_this_invocation"] == 0 and rp["model_dispatches_this_invocation"] == 0


@pytest.mark.parametrize("proxy", [None, "http://operator:3128"])
def test_observation_records_proxy_only_when_one_was_used(env, proxy):
    t = FakeTransport(env.fx)
    t.proxy = proxy
    out = env.drv(t).run(manifest(env.fx))
    s = Store(env.root)
    obs = s.read_artifact(out["receipt"]["artifacts"]["observation_ref"])
    s.close()
    assert ("proxy" in obs and obs["proxy"] is True) is (proxy is not None)


# ---- D #9: freeze covers the whole verifier/tool files, verify rechecks them -----------------------

def test_freeze_hashes_full_module_bytes(env):
    env.drv().run(manifest(env.fx))
    f = _frozen(env, "exp-1")
    assert f["verifier_module_sha256"] == _sha(Path(experiment_verify.__file__).read_bytes())
    assert f["tool_module_sha256"] == _sha(Path(experiment_tool.__file__).read_bytes())


def test_verify_and_rerun_notice_a_changed_verifier_module(env, monkeypatch):
    env.drv().run(manifest(env.fx))
    assert env.drv().verify("exp-1")["ok"]
    monkeypatch.setattr("hive.experiment_driver._module_sha", lambda mod: "0" * 64)  # a byte somewhere else in the module changed
    v = env.drv().verify("exp-1")
    assert not v["ok"] and v["checks"]["verifier_module_is_frozen_one"] is False and v["checks"]["tool_module_is_frozen_one"] is False
    with pytest.raises(ExperimentError, match="frozen"):
        env.drv().run(manifest(env.fx))


def test_local_read_refuses_hostile_repo_config_sq6(tmp_path):
    """SQ-6 lifted: replay/restart local reads get the same repo-config guard as a network fetch."""
    from hive.experiment_driver import ExperimentDriver
    repo = _bare(tmp_path, ("url.https://evil.example/.insteadOf", URL))
    d = ExperimentDriver(tmp_path / "store", transport=GitTransport())
    m = {"source": {"url": URL, "commit": "a" * 40, "path": "data.csv"}, "expected": {}}
    verdict, raw = d._read_blob({"m": m, "lim": {"max_files": 64, "max_bytes": 65536}, "repo_dir": repo, "cache_dir": tmp_path / "c"})
    assert verdict[0] == "SOURCE_POLICY" and "not allowlisted" in verdict[1]["reason"] and raw is None
