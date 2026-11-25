"""Durable OODA experiment driver (v0.4.x slice D).

One experiment = one frozen manifest run through the EXISTING kernel:
  Store (job queue + artifacts) -> RunStates (durable run + effect log) ->
  ContextPolicy preflight -> repo_intel (pinned https Git blob) -> OODAController ->
  DecisionGateway (typed records) -> approved deterministic tool -> independent verifier.

No model is ever called. Network happens in exactly one place (`transport.fetch`) and is
counted; a completed run replays from durable artifacts with zero fetches. Source text is
data only: it is never executed, never placed in a prompt/gate/path, and instruction-like
content is rejected. State lives in the Store's own SQLite; there is no new scheduler/DB.
"""
from __future__ import annotations

import hashlib
import inspect
import json
import os
import re
import subprocess
import time
from pathlib import Path
from urllib.parse import urlparse

from . import experiment_tool, experiment_verify
from .context_policy import ContextPolicy
from .decision_gateway import DecisionGateway
from .experiment_tool import csv_profile_v1
from .ooda import (ACCEPT, ACT, CHECKPOINT, CREATED, DECIDE, INCONCLUSIVE, OBSERVE, ORIENT,
                   REJECT, VERIFY, OODAController, OODAError)
from .orchestrator import worker_lock
from .repo_intel import ContentCache, RepoIntelError, RepoTreeIndex, SelectiveFetcher, _validate_path
from .run_state import RunStates
from .storage import Store, _json

DEFAULT_ALLOWLIST = Path(__file__).resolve().parents[2] / "configs" / "experiment_sources.allowlist.json"
SCHEMA = "hive-ooda-experiment-v1"
_HEX40, _HEX64 = re.compile(r"[0-9a-f]{40}"), re.compile(r"[0-9a-f]{64}")
# Source text containing any of these is refused (never interpreted). Frozen into the experiment.
INJECTION_PATTERNS = (r"ignore (all |any )?(previous|prior|above) (instructions|prompts?)", r"system prompt",
                      r"you are (now )?(an? )?(ai|assistant|language model)", r"<\s*script", r"^#!",
                      r"(begin|end) (system|assistant) (message|prompt)", r"\bAGENT[: ]+(run|execute)\b")
TOOL_NAME = "csv_profile_v1"
CATEGORY = "pinned_source_profile"  # deliberately NOT a P2 exact-tool category


class ExperimentError(ValueError):
    """Invalid manifest/allowlist or tampered frozen inputs (refused before any effect)."""


class TransientFetchError(Exception):
    """Remote unavailable / timeout: retryable within the attempt bound."""


class PermanentFetchError(Exception):
    """Remote says the revision/repo cannot be fetched: not retryable."""


# ---- the only network-touching code ---------------------------------------------------------

class GitTransport:
    """Fetch one pinned commit's trees plus ONLY the wanted blob over https into a local bare repo (two counted requests).

    `calls` counts real network requests; a repo that already holds the commit and blob costs zero.
    Flags: https only, no redirects, no credential helpers/prompts, no lazy (hidden) fetches.
    """
    name = "git-https"
    PERMANENT = ("not our ref", "couldn't find remote ref", "repository not found", "does not appear to be a git repository", "not found")

    _ENV_KEEP = ("PATH", "SYSTEMROOT", "SYSTEMDRIVE", "WINDIR", "TEMP", "TMP")  # minimum a git process needs (Windows ones are absent elsewhere)

    def __init__(self, timeout=90, run=subprocess.run, proxy=None):
        self.timeout, self._run, self.calls = timeout, run, 0
        self.proxy = proxy or os.environ.get("HIVE_GIT_PROXY")  # the ONLY proxy source: ambient HTTPS_PROXY/ALL_PROXY are ignored

    @staticmethod
    def clean_env() -> dict:
        """Explicit minimal env: no GIT_* / proxy / SSL passthrough, no system or global git config, no prompts."""
        env = {k: os.environ[k] for k in GitTransport._ENV_KEEP if k in os.environ}
        env.update(GIT_CONFIG_NOSYSTEM="1", GIT_CONFIG_GLOBAL=os.devnull, GIT_TERMINAL_PROMPT="0", GIT_NO_LAZY_FETCH="1")
        return env

    def _git(self, repo, *args, network=False):
        cmd = ["git", f"--git-dir={repo}"]  # explicit: never discover a parent repository
        if network:
            cmd += ["-c", "protocol.allow=never", "-c", "protocol.https.allow=always", "-c", "http.followRedirects=false",
                    "-c", "credential.helper=", "-c", "http.sslVerify=true", "-c", "core.hooksPath=" + os.devnull]
            if self.proxy:
                cmd += ["-c", "http.proxy=" + self.proxy]
        return self._run(cmd + list(args), capture_output=True, text=True, env=self.clean_env(), timeout=self.timeout)

    def has(self, commit, repo_dir) -> bool:
        """True when the repo already holds the commit, i.e. the commit step would cost zero network."""
        return Path(repo_dir, "objects").is_dir() and self._git(repo_dir, "cat-file", "-e", commit + "^{commit}").returncode == 0

    # Repo-local git config is trusted input to a network fetch (a URL-scoped http.<url>.sslVerify beats our -c flag; url.*.insteadOf
    # reroutes the endpoint), so only the keys `git init --bare` and a partial fetch write are accepted. Deliberately NOT all of core.*
    # (core.gitProxy/sshCommand/fsmonitor/pager/hooksPath execute programs).
    _LOCAL_CONFIG_OK = re.compile(r"core\.(repositoryformatversion|filemode|bare|symlinks|ignorecase|logallrefupdates|precomposeunicode)"
                                  , re.I)

    def local_config_violations(self, repo, url=None) -> list:
        """Keys outside the allowlist. Promisor keys are accepted only for the exact allowlisted fetch URL (FINAL_REVIEW #6)."""
        proc = self._git(repo, "config", "--local", "--name-only", "--list")
        if proc.returncode != 0:
            return ["<repo config unreadable>"]
        ok_remote = {f"remote.{url}.{k}".lower() for k in ("promisor", "partialclonefilter")} if url else set()
        return [k for k in (proc.stdout or "").splitlines()
                if k.strip() and not self._LOCAL_CONFIG_OK.fullmatch(k.strip()) and k.strip().lower() not in ok_remote]

    def _network(self, repo, before_call, cap, *args):
        """ONE counted network request. `before_call` runs first (the driver makes the count durable before the request exists)."""
        if before_call:
            before_call()
        self.calls += 1
        try:
            proc = self._git(repo, "fetch", "--no-tags", *args, network=True)
        except subprocess.TimeoutExpired as exc:
            raise TransientFetchError(f"git fetch timed out after {exc.timeout}s") from exc
        if proc.returncode != 0:
            err = (proc.stderr or "").strip().replace("\n", " ")[:300]
            raise (PermanentFetchError if any(m in err.lower() for m in self.PERMANENT) else TransientFetchError)(err or "git fetch failed")
        got = sum(p.stat().st_size for p in (Path(repo) / "objects").rglob("*") if p.is_file())
        if got > cap:  # post-hoc: git cannot be told to abort mid-transfer; fail closed and never read it
            raise PermanentFetchError(f"fetched object data {got} B exceeds cap {cap} B")

    def fetch(self, url, commit, repo_dir, max_blob_bytes, path=None, before_call=None, max_pack_bytes=None, expect_blob=None):
        """Trees-only commit fetch (--filter=blob:none), then ONE explicit counted fetch of just the path's blob oid (resolved
        locally from the tree). Returns the number of network requests made (0 = everything already local)."""
        if not url.startswith("https://") or not _HEX40.fullmatch(commit):
            raise PermanentFetchError("transport accepts only https URLs and full commit SHAs")
        if path is not None:
            try:
                _validate_path(path)
            except RepoIntelError as exc:
                raise PermanentFetchError(f"unsafe path: {exc}") from exc
        repo = Path(repo_dir)
        repo.mkdir(parents=True, exist_ok=True)
        cap = max_pack_bytes if max_pack_bytes is not None else int(max_blob_bytes) + 65536
        have_commit = self._git(repo, "cat-file", "-e", commit + "^{commit}").returncode == 0
        if not (repo / "objects").is_dir():
            self._run(["git", "init", "--bare", "-q", "--template=", str(repo)], check=True, capture_output=True, timeout=30, env=self.clean_env())
        oid = None
        if have_commit and path is not None:
            oid = self._blob_oid(repo, commit, path)
        if have_commit and (path is None or oid is None or self._has_object(repo, oid)):
            return 0
        bad = self.local_config_violations(repo, url)  # before ANY network request
        if bad:
            raise PermanentFetchError("repo-local git config not allowlisted (refusing to fetch): " + ", ".join(bad[:5]))
        n = 0
        if not have_commit:
            self._network(repo, before_call, cap, "--depth=1", "--filter=blob:none", "--", url, commit)
            n += 1
            if path is not None:
                oid = self._blob_oid(repo, commit, path)
        if path is not None and oid is not None and not self._has_object(repo, oid):
            if expect_blob is not None and oid != expect_blob:
                raise PermanentFetchError(f"tree blob oid {oid} != frozen expectation {expect_blob}; blob not fetched")
            self._network(repo, before_call, cap, "--", url, oid)
            n += 1
        return n

    def _has_object(self, repo, oid) -> bool:
        return self._git(repo, "cat-file", "-e", oid).returncode == 0

    def _blob_oid(self, repo, commit, path):
        out = (self._git(repo, "ls-tree", commit, "--", path).stdout or "").strip()
        parts = out.split(None, 3)  # "<mode> <type> <oid> TAB <path>"
        return parts[2] if len(parts) == 4 and parts[1] == "blob" and _HEX40.fullmatch(parts[2]) else None


# ---- manifest / allowlist --------------------------------------------------------------------

def _sha(data) -> str:
    return hashlib.sha256(data if isinstance(data, bytes) else _json(data).encode()).hexdigest()


def load_allowlist(path=DEFAULT_ALLOWLIST) -> dict:
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))


def validate_manifest(m, allow: dict) -> dict:
    """Refuse anything outside the frozen allowlist BEFORE any state or network is touched."""
    def need(cond, msg):
        if not cond:
            raise ExperimentError(msg)
    need(isinstance(m, dict) and m.get("version") == 1, "manifest version 1 required")
    need(re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]{0,79}", str(m.get("experiment_id", ""))), "experiment_id must match [A-Za-z0-9][A-Za-z0-9_.-]{0,79}")
    need(isinstance(m.get("hypothesis"), str) and m["hypothesis"].strip(), "hypothesis required")
    s, e, lim, chk = (m.get(k) for k in ("source", "expected", "limits", "checks"))
    need(all(isinstance(x, dict) for x in (s, e, lim, chk)), "source/expected/limits/checks objects required")
    u = urlparse(str(s.get("url", "")))
    need(u.scheme == "https" and u.hostname and not (u.username or u.password or u.port or u.query or u.fragment or u.params),
         "source url must be a plain https URL (no credentials/port/query)")
    entry = next((x for x in allow.get("sources", []) if x["url"] == s["url"] and x["source_id"] == s.get("source_id")), None)
    need(entry is not None, "source is not on the frozen allowlist")
    need(isinstance(s.get("commit"), str) and _HEX40.fullmatch(s["commit"]), "commit must be a full lowercase 40-hex SHA (no refs/branches/tags)")
    need(s["commit"] in entry["commits"], "revision is not allowlisted for this source")
    need(s.get("path") in entry["paths"], "path is not allowlisted for this source")
    try:
        _validate_path(s["path"])
    except RepoIntelError as exc:
        raise ExperimentError(f"unsafe path: {exc}") from exc
    need(isinstance(e.get("blob_sha"), str) and _HEX40.fullmatch(e["blob_sha"]) and isinstance(e.get("sha256"), str)
         and _HEX64.fullmatch(e["sha256"]) and isinstance(e.get("bytes"), int) and 0 < e["bytes"] <= entry["max_blob_bytes"],
         "expected needs blob_sha(40 hex), sha256(64 hex) and bytes within the allowlist cap")
    need(all(isinstance(lim.get(k), int) and not isinstance(lim.get(k), bool) for k in
             ("max_bytes", "max_files", "max_attempts", "max_steps", "max_wall_seconds")), "integer limits required")
    need(0 < lim["max_bytes"] <= entry["max_blob_bytes"] and 0 < lim["max_files"] <= entry["max_files"]
         and 1 <= lim["max_attempts"] <= 5 and lim["max_steps"] >= 10 and lim["max_wall_seconds"] > 0, "limits outside allowlist caps")
    need(m.get("tool") == TOOL_NAME, "tool is not an approved deterministic tool")
    need(isinstance(m.get("verifier"), str) and m["verifier"], "verifier name required")
    need(chk.get("format") == "csv" and isinstance(chk.get("header"), list) and isinstance(chk.get("rows"), int)
         and chk.get("unique") in chk["header"] and all(isinstance(chk.get(k), str) and len(chk[k]) <= 200 for k in ("key_pattern", "forbid_pattern")),
         "checks must define csv header/rows/unique/key_pattern/forbid_pattern")
    for k in ("key_pattern", "forbid_pattern"):
        try:
            re.compile(chk[k])
        except re.error as exc:
            raise ExperimentError(f"bad {k}: {exc}") from exc
    return m


# ---- deterministic tool (author side: experiment_tool.csv_profile_v1; verifier lives in experiment_verify and shares no code) --

TOOLS = {TOOL_NAME: csv_profile_v1}


def scan_for_instructions(text: str):
    return next((p for p in INJECTION_PATTERNS if re.search(p, text, re.I | re.M)), None)


def git_blob_sha(raw: bytes) -> str:
    return hashlib.sha1(b"blob %d\0" % len(raw) + raw).hexdigest()  # git object id, not a security hash


def _src_sha(fn) -> str | None:
    return _sha(inspect.getsource(fn).encode()) if fn else None


def _module_sha(mod) -> str:
    """sha256 of the module file's full bytes (the freeze must cover the whole verifier/tool file, not one function)."""
    return _sha(Path(mod.__file__).read_bytes())


# ---- diagnosis ---------------------------------------------------------------------------------

def diagnose(fail_class: str, detail, text: str | None = None, m: dict | None = None) -> dict:
    kind = {"OBSERVATION_TRANSIENT_EXHAUSTED": "observational", "OBSERVATION_PERMANENT": "observational",
            "OBSERVATION_INTEGRITY": "observational", "SOURCE_POLICY": "observational", "SOURCE_INSTRUCTIONS_REJECTED": "observational",
            "VERIFICATION_FAILED": "verification", "VERIFIER_MISSING": "verification",
            "DECISION_BLOCKED": "governance", "ACT_FAILED": "tool", "ORIENT_FAILED": "tool"}.get(fail_class, "other")
    out = {"class": fail_class, "kind": kind, "detail": detail,
           "retry": {"OBSERVATION_TRANSIENT_EXHAUSTED": "register a fresh experiment id once the remote is reachable",
                     "VERIFIER_MISSING": "register the verifier, then run a fresh experiment id"}.get(fail_class, "not retryable: terminal result"),
           "proposed_repair": None}
    if fail_class == "VERIFICATION_FAILED" and text and m:
        pat = m["checks"]["forbid_pattern"]
        fixed = re.sub(pat, lambda x: x.group(0).lower(), text)
        preview = experiment_verify.VERIFIERS[m["verifier"]](fixed.encode(), m["checks"], None, None) if m["verifier"] in experiment_verify.VERIFIERS else None
        out["proposed_repair"] = {"status": "PROPOSED_QUARANTINED_NOT_APPLIED", "rule": f"lowercase matches of {pat}",
                                  "cells_changed": sum(a != b for a, b in zip(text.split("\n"), fixed.split("\n"))),
                                  "preview_passes_frozen_checks": bool(preview and preview["verdict"] == "pass"),
                                  "note": "Data-only proposal. Not applied, not compared against baselines, not promoted; needs slice E review."}
    return out


# ---- the driver --------------------------------------------------------------------------------

class _Pause(Exception):
    pass


class ExperimentDriver:
    def __init__(self, store_root, *, allowlist_path=DEFAULT_ALLOWLIST, transport=None, workdir=None,
                 sleep=time.sleep, clock=time.time, backoff=(2, 5)):
        self.root = Path(store_root)
        self.allowlist_path = Path(allowlist_path)
        self.transport = transport or GitTransport()
        self.workdir = Path(workdir) if workdir else self.root / "experiments"
        self.sleep, self.clock, self.backoff = sleep, clock, backoff

    # public ---------------------------------------------------------------------------------
    def run(self, manifest, report_dir=None) -> dict:
        if not isinstance(manifest, dict):
            manifest = json.loads(Path(manifest).read_text(encoding="utf-8-sig"))
        allow = load_allowlist(self.allowlist_path)
        m = validate_manifest(manifest, allow)
        self.workdir.mkdir(parents=True, exist_ok=True)
        guard = {**GitTransport.clean_env(), "GIT_CEILING_DIRECTORIES": str(self.workdir.resolve())}
        saved = {k: os.environ.get(k) for k in set(guard) | {k for k in os.environ if k.startswith("GIT_")}}
        for k in saved:
            os.environ.pop(k, None)  # hostile GIT_CONFIG_*/GIT_SSL_NO_VERIFY must not reach repo_intel's git calls either
        os.environ.update(guard)  # ...which must neither discover a parent repo nor lazily hit the network
        try:
            with worker_lock(self.root):
                store = Store(self.root)
                try:
                    return self._run(store, m, allow, report_dir)
                finally:
                    store.close()
        finally:
            for k, v in saved.items():
                os.environ.pop(k, None) if v is None else os.environ.__setitem__(k, v)

    def verify(self, experiment_id, manifest=None, canonical_allowlist=DEFAULT_ALLOWLIST) -> dict:
        """Without `manifest` this proves internal consistency only (`anchored: false`). With the operator's own manifest file it
        also requires validate_manifest(file) == the frozen manifest and the frozen allowlist hash == the canonical allowlist's."""
        store = Store(self.root)
        try:
            return self._verify_evidence(store, experiment_id, manifest, canonical_allowlist)
        finally:
            store.close()

    # internals ------------------------------------------------------------------------------
    def _consumption(self, store, policy) -> dict:
        ledger = self.root / "usage-ledger.jsonl"
        data = ledger.read_bytes() if ledger.exists() else b""
        return {"ledger_lines": data.count(b"\n"), "ledger_sha256": _sha(data), "store_budget": store.get("budget"),
                "policy_budget": {k: v for k, v in policy.remaining_budget()["state"].items() if k != "last_updated"}}  # timestamp is not consumption

    def _frozen(self, m, allow):
        vfn = experiment_verify.VERIFIERS.get(m["verifier"])
        return {"schema": SCHEMA, "manifest": m, "allowlist_sha256": _sha(allow), "tool_source_sha256": _src_sha(TOOLS[m["tool"]]),
                "tool_module_sha256": _module_sha(experiment_tool), "verifier": m["verifier"], "verifier_source_sha256": _src_sha(vfn),
                "verifier_module_sha256": _module_sha(experiment_verify), "injection_patterns_sha256": _sha(list(INJECTION_PATTERNS)),
                "transport": self.transport.name, "model_dispatch": "none: no approval covers a new model call"}

    def _run(self, store, m, allow, report_dir):
        exp, lim = m["experiment_id"], m["limits"]
        store.recover()
        ooda, rs, policy = OODAController(store, self.clock), RunStates(store), ContextPolicy(store_root=self.root)
        frozen = self._frozen(m, allow)
        frozen_ref = store.put_artifact(frozen)
        prev = store.get(f"exp:{exp}:frozen")
        if prev is not None and prev != frozen_ref:
            raise ExperimentError("frozen inputs/checks changed since registration; refusing to run a different experiment under this id")
        ctx = dict(store=store, ooda=ooda, rs=rs, policy=policy, m=m, exp=exp, lim=lim, frozen_ref=frozen_ref,
                   calls0=getattr(self.transport, "calls", 0), ledger0=self._consumption(store, policy)["ledger_lines"],
                   repo_dir=self.workdir / exp / "repo", cache_dir=self.workdir / exp / "cache")
        if not self._exists(ooda, exp):  # register: OODA row, then freeze + consumption baseline, queue job, ADMITTED
            ooda.create(exp, m["hypothesis"], "P0 governing route; deterministic tool only; no model dispatch",
                        {"max_steps": lim["max_steps"], "max_wall_seconds": lim["max_wall_seconds"]})
        if prev is None:
            store.set(f"exp:{exp}:consumption_before", self._consumption(store, policy))
            store.set(f"exp:{exp}:frozen", frozen_ref)
        job_id = store.enqueue_once("exp:" + exp, {"kind": "ooda_experiment", "experiment_id": exp, "frozen_ref": frozen_ref})
        rs.transition(exp, "ADMITTED", "admit", {"frozen_ref": frozen_ref, "job": job_id})
        if self._ostate(ooda, exp) == CHECKPOINT:
            return self._replay(ctx, report_dir)
        if policy.is_emergency_stopped():
            return {"status": "STOPPED", "experiment_id": exp, "stage": self._ostate(ooda, exp), "net_calls": self._net(store, exp),
                    "note": "STOP present: nothing dispatched. Clear it (hive resume) then rerun the same command."}
        job = store.get_job(job_id)
        if job["state"] == "RETRY_READY":
            store.transition(job_id, "QUEUED", {"reason": "resume"})
        job = store.claim(f"exp-{os.getpid()}", job_id)
        if job is None:
            raise RuntimeError(f"job {job_id} is owned by another live worker or already finished")
        ctx.update(job=job, owner=job["owner"], gen=job["generation"])
        try:
            out = self._loop(ctx)
        except _Pause:
            return self._pause(ctx)
        except _Blocked as blocked:
            return {"status": "BLOCKED_PREFLIGHT", "experiment_id": exp, "reasons": blocked.gate["reasons"], "gate": blocked.gate,
                    "note": "Eligibility/context/budget preflight refused; no OODA step, no network, no model. Fix the cause and rerun."}
        except BaseException as exc:  # crash/exception: leave the job retryable; durable state already persisted
            self._job_retry(ctx, f"interrupted: {type(exc).__name__}")
            raise
        if out is not None:
            return out
        return self._finalize(ctx, report_dir)

    # state helpers --------------------------------------------------------------------------
    @staticmethod
    def _exists(ooda, exp):
        try:
            ooda.get(exp)
            return True
        except KeyError:
            return False

    @staticmethod
    def _ostate(ooda, exp):
        steps = ooda.get(exp)["steps"]
        return steps[-1]["to_state"] if steps else CREATED

    @staticmethod
    def _net(store, exp):
        return store.get(f"exp:{exp}:net_calls", 0)

    def _payload(self, ctx, state):
        return next((s["payload"] for s in reversed(ctx["ooda"].get(ctx["exp"])["steps"]) if s["to_state"] == state), None)

    def _rs(self, ctx, to, event_id, payload=None):
        return ctx["rs"].transition(ctx["exp"], to, event_id, payload or {})

    def _rs_state(self, ctx):
        return ctx["rs"].resume(ctx["exp"])

    def _rs_run(self, ctx):  # ensure RUNNING (ADMITTED/PAUSED/CHECKPOINTED -> RUNNING)
        st = self._rs_state(ctx)
        if st["state"] in ("ADMITTED", "PAUSED", "CHECKPOINTED"):
            self._rs(ctx, "RUNNING", f"run@{st['cursor']}")

    def _rs_checkpoint(self, ctx, stage):
        st = self._rs_state(ctx)
        if st["state"] == "RUNNING":
            self._rs(ctx, "CHECKPOINTED", f"ck:{stage}@{st['cursor']}")

    def _adv(self, ctx, to, evidence):
        return ctx["ooda"].advance(ctx["exp"], to, evidence)

    def _put(self, ctx, kind, body):
        return ctx["store"].put_artifact({"schema": SCHEMA, "kind": kind, "experiment_id": ctx["exp"], **body})

    def _job_retry(self, ctx, reason):
        try:
            if ctx["store"].get_job(ctx["job"]["id"])["state"] in ("RUNNING", "VERIFYING", "REVIEWING"):
                ctx["store"].transition(ctx["job"]["id"], "RETRY_READY", {"reason": reason}, ctx["owner"], ctx["gen"])
        except Exception:  # best effort: store.recover() requeues dead-pid jobs on the next start
            pass

    def _pause(self, ctx):
        st = self._rs_state(ctx)
        if st["state"] in ("RUNNING", "CHECKPOINTED", "VERIFYING"):
            self._rs(ctx, "PAUSED", f"pause@{st['cursor']}", {"reason": "STOP"})
        self._job_retry(ctx, "STOP")
        return {"status": "STOPPED", "experiment_id": ctx["exp"], "stage": self._ostate(ctx["ooda"], ctx["exp"]),
                "net_calls": self._net(ctx["store"], ctx["exp"]),
                "note": "Paused at a stage boundary. Clear STOP (hive resume) and rerun the same command; completed stages and the fetch are not repeated."}

    def _stop_check(self, ctx):
        if ctx["policy"].is_emergency_stopped():
            raise _Pause()

    # stage loop -----------------------------------------------------------------------------
    def _loop(self, ctx):
        exp, ooda = ctx["exp"], ctx["ooda"]
        try:
            while True:
                cur = self._ostate(ooda, exp)
                if cur == CHECKPOINT:
                    return None
                if cur in (CREATED, OBSERVE, ORIENT, DECIDE, ACT, VERIFY):
                    self._stop_check(ctx)
                if cur in (OBSERVE, ORIENT, DECIDE, ACT):
                    self._rs_run(ctx)
                getattr(self, "_st_" + cur.lower())(ctx)
        except OODAError:  # step/wall budget exceeded: the controller already committed INCONCLUSIVE + CHECKPOINT
            if self._ostate(ooda, exp) != CHECKPOINT:
                raise

    def _abort(self, ctx, fail_class, detail, refs=None, text=None):
        """Honest terminal failure: INCONCLUSIVE (hypothesis untested) with a durable diagnosis artifact."""
        dx = diagnose(fail_class, detail, text, ctx["m"])
        ref = self._put(ctx, "diagnosis", dx)
        self._adv(ctx, INCONCLUSIVE, {"refs": (refs or []) + [ref], "reason": fail_class, "diagnosis_ref": ref})

    def _st_created(self, ctx):  # preflight: eligibility + context + budget (no OODA mutation if blocked)
        m, policy = ctx["m"], ctx["policy"]
        gate = policy.preflight(task_id=ctx["exp"], model_name="local-tool", requested_tokens=0, estimated_cost_usd=0.0)
        if not gate["eligible"]:
            self._job_retry(ctx, "preflight blocked")
            raise _Blocked(gate)
        ref = self._put(ctx, "preflight", {"gate": gate, "model_dispatch_requested": False,
                                           "role": "deterministic tool only; no model route requested"})
        self._adv(ctx, OBSERVE, {"stage": "observe", "frozen_ref": ctx["frozen_ref"], "preflight_ref": ref})

    def _st_observe(self, ctx):
        m, store, exp, lim, rs = ctx["m"], ctx["store"], ctx["exp"], ctx["lim"], ctx["rs"]
        eff = "fetch:" + _sha(f"{exp}|{m['source']['url']}|{m['source']['commit']}|{m['source']['path']}")[:16]
        row = store.db.execute("SELECT digest FROM run_effects WHERE run_id=? AND effect_id=?", (exp, eff)).fetchone()
        if row is not None and row["digest"]:  # fetch already done and receipted: never repeat the network call
            ref = "artifacts/" + row["digest"] + ".json"
            if store.read_artifact(ref).get("kind") == "observation":
                return self._adv(ctx, ORIENT, {"refs": [ref], "observation_ref": ref, "net_calls": self._net(store, exp), "resumed_from_receipt": True})
            return self._abort(ctx, **self._recorded_failure(store, ref))
        self._stop_check(ctx)  # before any network effect
        self._rs_run(ctx)
        rs.effect_begin(exp, eff)
        failure, raw = self._fetch(ctx)
        if failure is None:
            text = raw.decode("utf-8")
            ref = self._put(ctx, "observation", {"source": m["source"], "blob_sha": git_blob_sha(raw), "sha256": _sha(raw), "bytes": len(raw),
                                                 "text": text, "via": "repo_intel.SelectiveFetcher", "transport": self.transport.name,
                                                 "attempts": store.get(f"exp:{exp}:attempts")["n"],
                                                 **({"proxy": True} if getattr(self.transport, "proxy", None) else {})})  # HIVE_GIT_PROXY is an ambient knob: record its use
            rs.effect_receipt(exp, eff, ref.split("/")[1][:-5])
            self._rs_checkpoint(ctx, "observe")
            return self._adv(ctx, ORIENT, {"refs": [ref], "observation_ref": ref, "net_calls": self._net(store, exp)})
        fref = self._put(ctx, "failure", {"class": failure[0], "detail": failure[1]})  # not an observation: marks the effect closed
        rs.effect_receipt(exp, eff, fref.split("/")[1][:-5])
        self._abort(ctx, failure[0], failure[1])

    def _recorded_failure(self, store, ref):
        a = store.read_artifact(ref)
        return {"fail_class": a["class"], "detail": a["detail"]}

    def _fetch(self, ctx):
        """Returns (None, raw_bytes) or ((class, detail), None). Bounded retries; attempts persisted BEFORE each network call."""
        m, store, exp, lim, s = ctx["m"], ctx["store"], ctx["exp"], ctx["lim"], ctx["m"]["source"]
        key = f"exp:{exp}:attempts"
        att = store.get(key, {"n": 0, "errors": []})
        while True:
            if att["n"] >= lim["max_attempts"]:
                return ("OBSERVATION_TRANSIENT_EXHAUSTED", {"attempts": att["n"], "errors": att["errors"]}), None
            if att["n"]:
                self._stop_check(ctx)  # STOP also halts the retry sequence (job stays retryable)
            att["n"] += 1
            store.set(key, att)
            def before_call():  # durable BEFORE each real request: a hard kill can only over-count, never hide a request
                store.set(f"exp:{exp}:net_calls", self._net(store, exp) + 1)
            try:
                self.transport.fetch(s["url"], s["commit"], ctx["repo_dir"], lim["max_bytes"], path=s["path"], before_call=before_call,
                                     max_pack_bytes=lim["max_bytes"] + 65536 + 512 * lim["max_files"], expect_blob=m["expected"]["blob_sha"])
            except TransientFetchError as exc:
                att["errors"].append(str(exc)[:200])
                store.set(key, att)
                if att["n"] < lim["max_attempts"]:
                    self.sleep(self.backoff[min(att["n"] - 1, len(self.backoff) - 1)])
                continue
            except PermanentFetchError as exc:
                return ("OBSERVATION_PERMANENT", {"error": str(exc)[:300]}), None
            break
        return self._read_blob(ctx)

    def _read_blob(self, ctx):
        m, lim, s, e = ctx["m"], ctx["lim"], ctx["m"]["source"], ctx["m"]["expected"]
        tr = self.transport if isinstance(self.transport, GitTransport) else None
        bad = tr.local_config_violations(ctx["repo_dir"], s["url"]) if tr and (Path(ctx["repo_dir"]) / "config").exists() else []
        if bad:  # SQ-6: local reads (replay/restart) get the same repo-config guard as network fetches
            return ("SOURCE_POLICY", {"reason": f"repo-local git config not allowlisted: {bad[:5]}"}), None
        try:
            files = RepoTreeIndex(str(ctx["repo_dir"]), s["commit"]).list()
            if len(files) > lim["max_files"]:
                return ("SOURCE_POLICY", {"reason": f"tree has {len(files)} files > max_files {lim['max_files']}"}), None
            raw = SelectiveFetcher(str(ctx["repo_dir"]), ContentCache(ctx["cache_dir"]), max_bytes=lim["max_bytes"],
                                   allowed_globs=(s["path"],)).fetch(s["commit"], s["path"])
        except (RepoIntelError, subprocess.CalledProcessError) as exc:
            return ("SOURCE_POLICY", {"reason": str(getattr(exc, "stderr", None) or exc)[:300]}), None
        if git_blob_sha(raw) != e["blob_sha"] or _sha(raw) != e["sha256"] or len(raw) != e["bytes"]:
            return ("OBSERVATION_INTEGRITY", {"expected": {"blob_sha": e["blob_sha"], "sha256": e["sha256"], "bytes": e["bytes"]},
                                              "got": {"blob_sha": git_blob_sha(raw), "sha256": _sha(raw), "bytes": len(raw)}}), None
        if b"\0" in raw:  # repo_intel only scans the first 8000 bytes
            return ("SOURCE_POLICY", {"reason": "binary: NUL byte in content"}), None
        try:
            text = raw.decode("utf-8")
        except UnicodeDecodeError:
            return ("SOURCE_POLICY", {"reason": "not valid UTF-8 text"}), None
        hit = scan_for_instructions(text)
        if hit:
            return ("SOURCE_INSTRUCTIONS_REJECTED", {"pattern": hit}), None
        return None, raw

    def _st_orient(self, ctx):
        obs_ref = self._payload(ctx, ORIENT)["observation_ref"]
        text = ctx["store"].read_artifact(obs_ref)["text"]
        try:
            lines = text.count("\n")
            ref = self._put(ctx, "orientation", {"observation_ref": obs_ref, "input_sha256": _sha(text.encode()), "lines": lines,
                                                 "testable_claims": sorted(k for k in ctx["m"]["checks"]), "tool": ctx["m"]["tool"]})
        except Exception as exc:  # pragma: no cover - pure string ops
            return self._abort(ctx, "ORIENT_FAILED", str(exc), [obs_ref])
        self._rs_checkpoint(ctx, "orient")
        self._adv(ctx, DECIDE, {"refs": [ref, obs_ref], "orientation_ref": ref, "observation_ref": obs_ref})

    def _st_decide(self, ctx):
        m, pay = ctx["m"], self._payload(ctx, DECIDE)
        gw = DecisionGateway(ctx["policy"])
        tool_sel = gw.decide({"kind": "TOOL_SELECT", "task": {"category": CATEGORY, "allowed_tools": [m["tool"]]},
                              "tools": [{"name": m["tool"], "deterministic": True}]})
        perm = gw.decide({"kind": "PERMISSION_CHECK", "tool": m["tool"], "allowed_tools": [m["tool"]],
                          "path": str(ctx["cache_dir"].resolve()), "allowed_roots": [str(self.workdir.resolve())]})
        refs = [pay["orientation_ref"]]
        if tool_sel.outcome != m["tool"] or perm.outcome != "ALLOW":
            ref = self._put(ctx, "decision", {"tool_select": tool_sel.as_dict(), "permission_check": perm.as_dict(), "blocked": True})
            return self._abort(ctx, "DECISION_BLOCKED", {"tool_select": tool_sel.outcome, "permission_check": perm.outcome}, refs + [ref])
        ref = self._put(ctx, "decision", {"tool_select": tool_sel.as_dict(), "tool_select_sha256": tool_sel.sha256(),
                                          "permission_check": perm.as_dict(), "permission_check_sha256": perm.sha256(),
                                          "chosen_tool": m["tool"], "model_dispatch": {"requested": False, "reason": "tool-only; zero approved model calls"}})
        self._rs_checkpoint(ctx, "decide")
        self._adv(ctx, ACT, {"refs": [ref] + refs, "decision_ref": ref, "observation_ref": pay["observation_ref"]})

    def _st_act(self, ctx):
        m, pay = ctx["m"], self._payload(ctx, ACT)
        text = ctx["store"].read_artifact(pay["observation_ref"])["text"]
        try:
            profile = TOOLS[m["tool"]](text)  # parses data only; fetched content is never executed or interpolated
        except Exception as exc:
            return self._abort(ctx, "ACT_FAILED", f"{type(exc).__name__}: {exc}", [pay["decision_ref"]])
        ref = self._put(ctx, "act", {"tool": m["tool"], "tool_source_sha256": _src_sha(TOOLS[m["tool"]]), "input_sha256": _sha(text.encode()),
                                     "observation_ref": pay["observation_ref"], "profile": profile})
        self._rs_checkpoint(ctx, "act")
        self._adv(ctx, VERIFY, {"refs": [ref], "act_ref": ref, "observation_ref": pay["observation_ref"], "verifier": m["verifier"]})

    def _st_verify(self, ctx):
        m, pay, store = ctx["m"], self._payload(ctx, VERIFY), ctx["store"]
        if self._rs_state(ctx)["state"] == "PAUSED":  # PAUSED -> RUNNING -> CHECKPOINTED -> VERIFYING (only legal path)
            self._rs_run(ctx)
        self._rs_checkpoint(ctx, "pre-verify")
        if self._rs_state(ctx)["state"] == "CHECKPOINTED":
            self._rs(ctx, "VERIFYING", "verify:begin")
        fn = experiment_verify.VERIFIERS.get(m["verifier"])
        if fn is None:
            return self._abort(ctx, "VERIFIER_MISSING", {"verifier": m["verifier"], "registered": sorted(experiment_verify.VERIFIERS)}, [pay["act_ref"]])
        text = store.read_artifact(pay["observation_ref"])["text"]
        claimed = store.read_artifact(pay["act_ref"])["profile"]
        res = fn(text.encode("utf-8"), m["checks"], claimed, m["expected"])
        vref = self._put(ctx, "verification", {"act_ref": pay["act_ref"], "observation_ref": pay["observation_ref"], **res,
                                               "verifier_source_sha256": _src_sha(fn)})
        ev = {"refs": [vref], "verification_ref": vref, "verifier_verdict": res["verdict"],
              "verifier": "experiment_verify." + m["verifier"], "author": "experiment_driver." + m["tool"]}
        if res["verdict"] == "pass":
            return self._adv(ctx, ACCEPT, ev)
        dref = self._put(ctx, "diagnosis", diagnose("VERIFICATION_FAILED", res["failures"], text, m))
        self._adv(ctx, REJECT, {**ev, "failures": res["failures"], "diagnosis_ref": dref})

    def _st_terminal(self, ctx):  # ACCEPT/REJECT/INCONCLUSIVE -> CHECKPOINT, carrying that verdict's refs
        self._adv(ctx, CHECKPOINT, {"refs": self._payload(ctx, self._ostate(ctx["ooda"], ctx["exp"]))["refs"]})

    _st_accept = _st_reject = _st_inconclusive = _st_terminal

    # finalize / receipt ---------------------------------------------------------------------
    def _finalize(self, ctx, report_dir):
        store, ooda, exp = ctx["store"], ctx["ooda"], ctx["exp"]
        g = ooda.get(exp)
        verdict = g["verdict"] or next(s["to_state"] for s in reversed(g["steps"]) if s["to_state"] in (ACCEPT, REJECT, INCONCLUSIVE))
        rs_to = {ACCEPT: "ACCEPTED", REJECT: "REJECTED", INCONCLUSIVE: "FAILED"}[verdict]
        if self._rs_state(ctx)["state"] not in ("ACCEPTED", "REJECTED", "FAILED"):
            self._rs(ctx, rs_to, "final", {"verdict": verdict})
        receipt = self._build_receipt(ctx, g, verdict)
        rref = store.put_artifact(receipt)
        store.set(f"exp:{exp}:receipt", rref)
        job = store.get_job(ctx["job"]["id"])
        if job["state"] == "RUNNING":
            if verdict != INCONCLUSIVE:
                store.transition(job["id"], "VERIFYING", {"experiment": exp}, ctx["owner"], ctx["gen"])
                store.transition(job["id"], "REVIEWING", {"verdict": verdict}, ctx["owner"], ctx["gen"])
            # experimental observations are never PROMOTED (same convention as Executor): pass -> BLOCKED pending external decision
            store.finish(job["id"], "REJECTED" if verdict == REJECT else "BLOCKED",
                         {"receipt_ref": rref, "verdict": verdict, "failure_class": receipt["failure_class"]}, ctx["owner"], ctx["gen"])
        out = {"status": verdict, "experiment_id": exp, "receipt_ref": rref, "receipt": receipt}
        if report_dir:
            self._write_report(Path(report_dir), receipt, rref)
        return out

    @staticmethod
    def _chain_refs(g) -> dict:
        refs = {}
        for s in g["steps"]:
            for k in ("preflight_ref", "observation_ref", "orientation_ref", "decision_ref", "act_ref", "verification_ref", "diagnosis_ref"):
                if k in s["payload"]:
                    refs[k] = s["payload"][k]
        return refs

    def _build_receipt(self, ctx, g, verdict):
        store, exp = ctx["store"], ctx["exp"]
        refs, fail = self._chain_refs(g), None
        if "diagnosis_ref" in refs:
            fail = store.read_artifact(refs["diagnosis_ref"])
        rs = ctx["rs"].resume(exp)
        before, after = store.get(f"exp:{exp}:consumption_before"), self._consumption(store, ctx["policy"])
        src = ctx["m"]["source"]
        body = {"schema": SCHEMA, "kind": "receipt", "experiment_id": exp, "verdict": verdict,
                "failure_class": fail["class"] if fail else None, "diagnosis": fail,
                "source": {**src, "expected": ctx["m"]["expected"]}, "frozen_ref": ctx["frozen_ref"], "artifacts": refs,
                "net_calls": self._net(store, exp), "fetch_attempts": (store.get(f"exp:{exp}:attempts") or {}).get("n", 0),
                "model_dispatches": 0, "consumption_before": before, "consumption_after": after, "consumption_unchanged": before == after,
                "ooda": {"steps": len(g["steps"]), "tail_digest": store.db.execute("SELECT digest FROM ooda_steps WHERE experiment_id=? ORDER BY step DESC LIMIT 1", (exp,)).fetchone()[0],
                         "chain_ok": ctx["ooda"].verify_chain(exp)},
                "run_state": {"state": rs["state"], "cursor": rs["cursor"], "effects_done": rs["effects_done"], "effects_unknown": rs["effects_unknown"]}}
        body["receipt_body_sha256"] = _sha(body)
        return body

    def _write_report(self, d: Path, receipt, rref):
        d.mkdir(parents=True, exist_ok=True)
        (d / "receipt.json").write_text(json.dumps({"receipt_ref": rref, **receipt}, indent=2, ensure_ascii=False), encoding="utf-8")
        r = receipt
        lines = [f"# Experiment {r['experiment_id']} - {r['verdict']}", "",
                 f"- Source: {r['source']['url']} @ `{r['source']['commit']}` `{r['source']['path']}`",
                 f"- Frozen sha256 `{r['source']['expected']['sha256']}`; blob `{r['source']['expected']['blob_sha']}`",
                 f"- Network calls: **{r['net_calls']}** (attempts {r['fetch_attempts']}); model dispatches: **{r['model_dispatches']}**",
                 f"- Consumption unchanged: **{r['consumption_unchanged']}**; OODA chain ok: {r['ooda']['chain_ok']} (tail `{r['ooda']['tail_digest'][:16]}`)",
                 f"- Receipt artifact: `{rref}`", ""]
        if r["diagnosis"]:
            lines += ["## Diagnosis", f"- class `{r['failure_class']}` ({r['diagnosis']['kind']}): {r['diagnosis']['detail']}",
                      f"- retry: {r['diagnosis']['retry']}"]
            if r["diagnosis"].get("proposed_repair"):
                lines.append(f"- proposed repair (NOT applied): {json.dumps(r['diagnosis']['proposed_repair'])}")
        lines += ["", "## Artifacts", *[f"- {k}: `{v}`" for k, v in r["artifacts"].items()]]
        (d / "REPORT.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    def _replay(self, ctx, report_dir):
        store, exp = ctx["store"], ctx["exp"]
        rref = store.get(f"exp:{exp}:receipt")
        if rref is None:  # crashed between CHECKPOINT and receipt: rebuild from durable state, zero effects
            job = store.get_job(store.get("enqueue:exp:" + exp))
            ctx.update(job=job, owner=job["owner"], gen=job["generation"])
            if job["state"] in ("QUEUED", "RETRY_READY"):
                if job["state"] == "RETRY_READY":
                    store.transition(job["id"], "QUEUED", {"reason": "finalize"})
                job = store.claim(f"exp-{os.getpid()}", job["id"])
                ctx.update(job=job, owner=job["owner"], gen=job["generation"])
            out = self._finalize(ctx, report_dir)
            out["replay"] = {"finalized_after_crash": True, **self._measured(ctx)}
            return out
        receipt = store.read_artifact(rref)
        evidence = self._verify_evidence(store, exp)
        now = self._consumption(store, ctx["policy"])
        zero = self._measured(ctx, now)
        if not evidence["ok"]:  # a receipt that does not match the hash-linked chain + re-run verifier is never replayed as a verdict
            return {"status": "EVIDENCE_INVALID", "experiment_id": exp, "receipt_ref": rref, "replay": {**zero, "evidence": evidence},
                    "note": "Stored receipt does not verify against the OODA chain / frozen verifier re-run; verdict withheld."}
        return {"status": receipt["verdict"], "experiment_id": exp, "receipt_ref": rref, "receipt": receipt,
                "replay": {**zero, "consumption_unchanged_vs_receipt": now == receipt["consumption_after"], "evidence": evidence}}

    def _measured(self, ctx, now=None) -> dict:
        """This invocation's effects, observed (transport call delta; usage-ledger line delta), not asserted."""
        now = now or self._consumption(ctx["store"], ctx["policy"])
        return {"network_calls_this_invocation": getattr(self.transport, "calls", 0) - ctx["calls0"],
                "model_dispatches_this_invocation": now["ledger_lines"] - ctx["ledger0"]}

    def _verify_evidence(self, store, exp, manifest=None, canonical_allowlist=DEFAULT_ALLOWLIST) -> dict:
        """Recompute every hash link AND bind the receipt to the chain: verdict, artifact refs, frozen inputs, run-state,
        then re-run the frozen independent verifier on the stored source bytes. Any mismatch fails."""
        checks = {}
        rref = store.get(f"exp:{exp}:receipt")
        checks["receipt_present"] = rref is not None
        if rref is None:
            return {"ok": False, "anchored": False, "checks": checks}
        try:
            r = store.read_artifact(rref)  # digest verified on read
            body = {k: v for k, v in r.items() if k != "receipt_body_sha256"}
            checks["receipt_body_hash"] = _sha(body) == r["receipt_body_sha256"]
            ok_art = True
            for ref in list(r["artifacts"].values()) + [r["frozen_ref"]]:
                try:
                    store.read_artifact(ref)
                except (ValueError, OSError):
                    ok_art = False
            checks["artifacts_hash_ok"] = ok_art
            ooda = OODAController(store)
            checks["ooda_chain"] = ooda.verify_chain(exp)
            tail = store.db.execute("SELECT digest FROM ooda_steps WHERE experiment_id=? ORDER BY step DESC LIMIT 1", (exp,)).fetchone()
            checks["ooda_tail_matches_receipt"] = bool(tail) and tail[0] == r["ooda"]["tail_digest"]
            rs_now = RunStates(store).resume(exp)
            checks["run_state_chain"] = True
            checks["no_unknown_effects"] = not r["run_state"]["effects_unknown"]
            checks.update(self._bind_to_chain(store, exp, r, ooda.get(exp), rs_now))
            if manifest is not None:
                checks.update(self._anchor(store, exp, manifest, canonical_allowlist))
        except Exception as exc:  # malformed/forged artifacts must fail closed, never raise out of verify
            checks.setdefault("run_state_chain", False)
            checks["evidence_well_formed"] = False
            checks["error"] = f"{type(exc).__name__}: {str(exc)[:120]}"
        anchored = manifest is not None and checks.get("anchor_manifest_matches_frozen") is True and checks.get("anchor_allowlist_is_canonical") is True
        return {"ok": "error" not in checks and all(v is True for k, v in checks.items() if k != "error"), "anchored": anchored, "checks": checks}

    @staticmethod
    def _anchor(store, exp, manifest, canonical_allowlist) -> dict:
        """Tie the store to something OUTSIDE it: the operator's manifest file and the canonical allowlist file."""
        out = {"anchor_manifest_matches_frozen": False, "anchor_allowlist_is_canonical": False}
        frozen = store.read_artifact(store.get(f"exp:{exp}:frozen"))
        canon = load_allowlist(canonical_allowlist)
        out["anchor_allowlist_is_canonical"] = frozen["allowlist_sha256"] == _sha(canon)
        mf = manifest if isinstance(manifest, dict) else json.loads(Path(manifest).read_text(encoding="utf-8-sig"))
        try:
            out["anchor_manifest_matches_frozen"] = validate_manifest(mf, canon) == frozen["manifest"]
        except ExperimentError:
            pass
        return out

    def _bind_to_chain(self, store, exp, r, g, rs_now) -> dict:
        """The receipt is only a summary: every claim in it is re-derived from the chain, run-state and a verifier re-run."""
        steps = g["steps"]
        term = next((s["to_state"] for s in reversed(steps) if s["to_state"] in (ACCEPT, REJECT, INCONCLUSIVE)), None)
        refs = self._chain_refs(g)
        frozen_ref = store.get(f"exp:{exp}:frozen")
        first = next((s["payload"].get("frozen_ref") for s in steps if s["to_state"] == OBSERVE), None)
        out = {"verdict_matches_chain": term is not None and r["verdict"] == term == g["verdict"],
               "run_state_matches_verdict": r["run_state"]["state"] == rs_now["state"] == {ACCEPT: "ACCEPTED", REJECT: "REJECTED", INCONCLUSIVE: "FAILED"}.get(term),
               "artifact_refs_match_chain": r["artifacts"] == refs,
               "frozen_ref_bound": r["frozen_ref"] == frozen_ref == first}
        fail = store.read_artifact(refs["diagnosis_ref"]) if "diagnosis_ref" in refs else None
        out["diagnosis_matches_chain"] = r["diagnosis"] == fail and r["failure_class"] == (fail["class"] if fail else None)
        frozen = store.read_artifact(frozen_ref)
        m = frozen["manifest"]
        out["source_matches_frozen"] = r["source"] == {**m["source"], "expected": m["expected"]}
        for key, mod in (("verifier_module_sha256", experiment_verify), ("tool_module_sha256", experiment_tool)):
            if key in frozen:  # stores frozen before slice-D hardening carry only function-source hashes
                out[key.replace("_sha256", "_is_frozen_one")] = frozen[key] == _module_sha(mod)
        if term in (ACCEPT, REJECT):  # independent re-verification of the stored source bytes (pure; zero network, zero model)
            fn = experiment_verify.VERIFIERS.get(frozen["verifier"])
            obs = store.read_artifact(refs["observation_ref"])
            raw = obs["text"].encode("utf-8")
            res = fn(raw, m["checks"], store.read_artifact(refs["act_ref"])["profile"], m["expected"]) if fn else None
            stored = store.read_artifact(refs["verification_ref"]) if "verification_ref" in refs else None
            out["verifier_is_frozen_one"] = fn is not None and _src_sha(fn) == frozen["verifier_source_sha256"]
            out["source_bytes_match_expected"] = (git_blob_sha(raw), _sha(raw), len(raw)) == (m["expected"]["blob_sha"], m["expected"]["sha256"], m["expected"]["bytes"])
            out["verifier_rerun_matches"] = bool(res and stored and res["verdict"] == stored["verdict"] and res["failures"] == stored["failures"]
                                                 and res["verdict"] == ("pass" if term == ACCEPT else "fail"))
        elif "verification_ref" in refs:  # INCONCLUSIVE never carries a verification
            out["verifier_rerun_matches"] = False
        return out


class _Blocked(Exception):
    def __init__(self, gate):
        self.gate = gate
