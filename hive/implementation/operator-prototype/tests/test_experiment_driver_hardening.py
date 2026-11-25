"""Slice D hardening (D_REVIEW must-fix + should-fix): forged receipts, git env/config, claim isolation, lows. Network-free."""
from __future__ import annotations

import json
import os
import subprocess

import pytest

from exp_fakes import FakeTransport, GOOD, allowlist, make_fixture, manifest
from hive.experiment_driver import ExperimentDriver, ExperimentError, GitTransport, _sha
from hive.ooda import _digest
from hive.storage import Store
from test_experiment_driver import env  # noqa: F401  (shared fixture)


def _reject_run(env):
    fx2 = make_fixture(env.tmp / "fx2", GOOD.replace("Bravo (the)", "Bravo (The)"))
    allowlist([env.fx, fx2], env.al)
    out = env.drv(FakeTransport(fx2), fixture=fx2).run(manifest(fx2, exp="exp-2"))
    assert out["status"] == "REJECT"
    return fx2, out


def _put_forged(env, exp, forged):
    s = Store(env.root)
    forged["receipt_body_sha256"] = _sha({k: v for k, v in forged.items() if k != "receipt_body_sha256"})  # unkeyed: anyone can do this
    s.set(f"exp:{exp}:receipt", s.put_artifact(forged))
    s.close()


def _accept_forgery(receipt):
    forged = dict(receipt)
    forged.update(verdict="ACCEPT", failure_class=None, diagnosis=None)
    forged["artifacts"] = {k: v for k, v in forged["artifacts"].items() if k != "diagnosis_ref"}
    return forged


# ---- defect 1: forged receipts -------------------------------------------------------------------

def test_forged_accept_receipt_with_recomputed_body_hash_fails_verify_and_replay(env):
    fx2, out = _reject_run(env)
    assert env.drv().verify("exp-2")["ok"]
    _put_forged(env, "exp-2", _accept_forgery(out["receipt"]))
    v = env.drv().verify("exp-2")
    assert not v["ok"] and v["checks"]["receipt_body_hash"] and not v["checks"]["verdict_matches_chain"]
    t = FakeTransport(fx2)
    again = env.drv(t, fixture=fx2).run(manifest(fx2, exp="exp-2"))
    assert again["status"] == "EVIDENCE_INVALID" and "receipt" not in again and t.calls == 0


def test_chain_relinked_to_accept_still_fails_because_verifier_is_rerun(env):
    """Attacker also rewrites the hash-linked OODA REJECT step to ACCEPT (digests recomputed) plus the receipt:
    the frozen verifier, re-run on the stored source bytes, still says fail, so the evidence is rejected."""
    fx2, out = _reject_run(env)
    s = Store(env.root)
    rows = s.db.execute("SELECT * FROM ooda_steps WHERE experiment_id='exp-2' ORDER BY step").fetchall()
    prev = ""
    for r in rows:
        to, payload, frm = r["to_state"], r["payload"], ("ACCEPT" if r["from_state"] == "REJECT" else r["from_state"])
        if to == "REJECT":
            p = json.loads(payload)
            p.update(verifier_verdict="pass")
            p.pop("diagnosis_ref"), p.pop("failures")
            to, payload = "ACCEPT", json.dumps(p, sort_keys=True, separators=(",", ":"))
        dg = _digest(prev, "exp-2", r["step"], r["event_id"], frm, to, payload)
        s.db.execute("UPDATE ooda_steps SET from_state=?, to_state=?, payload=?, digest=? WHERE experiment_id='exp-2' AND step=?",
                     (frm, to, payload, dg, r["step"]))
        prev = dg
    s.db.execute("UPDATE ooda_experiments SET verdict='ACCEPT' WHERE experiment_id='exp-2'")
    s.close()
    forged = _accept_forgery(out["receipt"])
    forged["ooda"] = {**forged["ooda"], "tail_digest": prev}
    _put_forged(env, "exp-2", forged)
    v = env.drv().verify("exp-2")
    assert v["checks"]["ooda_chain"] and v["checks"]["verdict_matches_chain"] and v["checks"]["ooda_tail_matches_receipt"]  # self-consistent...
    assert not v["ok"] and not v["checks"]["verifier_rerun_matches"]  # ...but cannot pass the independent re-run


def test_forged_artifact_refs_and_frozen_ref_are_detected(env):
    fx2, out = _reject_run(env)
    other = env.drv().run(manifest(env.fx))["receipt"]  # a genuine ACCEPT experiment in the same store
    forged = dict(out["receipt"])
    forged["artifacts"] = {**forged["artifacts"], "verification_ref": other["artifacts"]["verification_ref"]}
    _put_forged(env, "exp-2", forged)
    v = env.drv().verify("exp-2")
    assert not v["ok"] and not v["checks"]["artifact_refs_match_chain"]


# ---- defect 3: git env/config --------------------------------------------------------------------

def test_git_subprocess_ignores_hostile_env_and_global_config(tmp_path, monkeypatch):
    hostile = tmp_path / "hostile.gitconfig"
    hostile.write_text('[url "https://evil.example/"]\n\tinsteadOf = https://example.test/\n[http]\n\tsslVerify = false\n\textraHeader = X-Evil: 1\n')
    for k, v in {"GIT_CONFIG_GLOBAL": str(hostile), "GIT_CONFIG_COUNT": "1", "GIT_CONFIG_KEY_0": "http.sslVerify", "GIT_CONFIG_VALUE_0": "false",
                 "GIT_SSL_NO_VERIFY": "1", "HTTPS_PROXY": "http://evil.example:1", "ALL_PROXY": "http://evil.example:1", "GIT_ASKPASS": "echo",
                 "GIT_TRACE": "1", "GIT_EXEC_PATH": str(tmp_path)}.items():
        monkeypatch.setenv(k, v)
    monkeypatch.delenv("HIVE_GIT_PROXY", raising=False)
    clean = GitTransport.clean_env()
    repo = tmp_path / "r.git"
    subprocess.run(["git", "init", "--bare", "-q", str(repo)], check=True, env=clean)
    out = GitTransport()._git(repo, "config", "--list", "--show-origin", network=True).stdout.lower()
    assert "evil" not in out and "sslverify=false" not in out and "extraheader" not in out and "proxy" not in out
    assert "http.sslverify=true" in out and "credential.helper=" in out
    assert clean["GIT_CONFIG_NOSYSTEM"] == "1" and clean["GIT_CONFIG_GLOBAL"] == os.devnull
    assert not ({"GIT_ASKPASS", "GIT_TRACE", "GIT_SSL_NO_VERIFY", "GIT_CONFIG_COUNT", "HTTPS_PROXY", "ALL_PROXY", "GIT_EXEC_PATH"} & set(clean))


def test_git_proxy_only_when_explicitly_configured(tmp_path, monkeypatch):
    seen = []
    monkeypatch.setenv("HTTPS_PROXY", "http://ambient:1")
    monkeypatch.delenv("HIVE_GIT_PROXY", raising=False)
    for proxy, expect in ((None, False), ("http://operator:3128", True)):
        t = GitTransport(run=lambda cmd, **kw: seen.append((cmd, kw)) or subprocess.CompletedProcess(cmd, 0, "", ""), proxy=proxy)
        t._git(tmp_path, "version", network=True)
        cmd, kw = seen[-1]
        assert ("http.proxy=http://operator:3128" in cmd) is expect and "HTTPS_PROXY" not in kw["env"]


def test_driver_scrubs_ambient_git_env_during_run_and_restores_it(env, monkeypatch):
    monkeypatch.setenv("GIT_CONFIG_COUNT", "1")
    monkeypatch.setenv("GIT_SSL_NO_VERIFY", "1")
    seen = {}
    t = FakeTransport(env.fx, on_fetch=lambda: seen.update({k: os.environ.get(k) for k in
                                                           ("GIT_CONFIG_COUNT", "GIT_SSL_NO_VERIFY", "GIT_CONFIG_NOSYSTEM", "GIT_NO_LAZY_FETCH")}))
    assert env.drv(t).run(manifest(env.fx))["status"] == "ACCEPT"
    assert seen == {"GIT_CONFIG_COUNT": None, "GIT_SSL_NO_VERIFY": None, "GIT_CONFIG_NOSYSTEM": "1", "GIT_NO_LAZY_FETCH": "1"}
    assert os.environ["GIT_CONFIG_COUNT"] == "1" and os.environ["GIT_SSL_NO_VERIFY"] == "1"


# ---- should-fix (a): experiment jobs are not claimable by the shared worker loop -----------------------

def test_shared_claim_never_takes_experiment_jobs(env):
    s = Store(env.root)
    exp_job = s.enqueue_once("exp:exp-q", {"kind": "ooda_experiment", "experiment_id": "exp-q"})
    assert s.claim("worker-loop") is None and s.get_job(exp_job)["state"] == "QUEUED"  # old code claimed it
    plain = s.enqueue_once("plain-1", {"task": {"id": "t"}})
    assert s.claim("worker-loop")["id"] == plain
    assert s.claim("exp-owner", exp_job)["id"] == exp_job  # explicit claim by id still works
    s.close()


# ---- lows -----------------------------------------------------------------------------------------

def test_nul_byte_beyond_first_8000_bytes_is_refused_as_binary(env):
    sneaky = make_fixture(env.tmp / "sneaky", b"Name,Code\n" + b"Alpha,AA\n" * 1200 + bytes([0]) + b"x,XX\n")  # NUL ~10.8 KB in
    allowlist([env.fx, sneaky], env.al)
    out = env.drv(FakeTransport(sneaky), fixture=sneaky).run(manifest(sneaky, exp="e-nul"))
    assert out["receipt"]["failure_class"] == "SOURCE_POLICY" and "NUL" in json.dumps(out["receipt"]["diagnosis"]["detail"])


@pytest.mark.parametrize("bad", ["..", ".", ".hidden", "-x"])
def test_dot_experiment_ids_are_refused(env, bad):
    t = FakeTransport(env.fx)
    with pytest.raises(ExperimentError, match="experiment_id"):
        env.drv(t).run(manifest(env.fx, exp=bad))
    assert t.calls == 0


def test_stop_between_retry_attempts_halts_further_network_calls(env):
    stop = env.root / "STOP"
    t = FakeTransport(env.fx, fail_times=99)
    d = ExperimentDriver(env.root, allowlist_path=env.al, transport=t, workdir=env.tmp / "work", sleep=lambda s: stop.write_text("op stop"))
    out = d.run(manifest(env.fx))
    assert out["status"] == "STOPPED" and t.calls == 1 and out["net_calls"] == 1  # old code made all 3 attempts
    stop.unlink()
    assert env.drv(FakeTransport(env.fx)).run(manifest(env.fx))["status"] == "ACCEPT"
