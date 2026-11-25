"""M2 research-subject client (protocol §4, §8, §12, §13): fixed-sampling OpenAI-compatible calls to the local model.
Stdlib only. Never edits a proposal; never executes model output. Stub mode (loopback, any port, no approval) is for testing only."""
from __future__ import annotations
import hashlib, json, subprocess, time, urllib.error, urllib.request
from pathlib import Path
from urllib.parse import urlparse
from . import m2_workflow as W

ROOT = W.ROOT


class CapReached(RuntimeError): """A §12 cap was reached: the run ends INCONCLUSIVE (§11)."""
class Invalidated(RuntimeError): """A §8 invalidation trigger (weights, model id, host)."""
class Refused(RuntimeError): """The §13 operator-approval gate refused the call."""
class PromptTooLarge(RuntimeError): """The base prompt with no history exceeds the byte cap: blocks the manifest freeze."""


def seed_for(campaign, effect, rnd, pol=None):
    pol = pol or W.load_policy()
    return pol["seed_base"] + 1000 * pol["seed_campaign"][campaign] + 100 * pol["seed_effect"][effect] + rnd


def smoke_seed(i, pol=None): return (pol or W.load_policy())["smoke_seed_base"] + i


def parse_reply(content):
    """§4 output contract: last `{` position whose raw_decode is a dict with keys exactly {"steps"} and steps a list of 1..3 strings. Else None."""
    if not isinstance(content, str): return None
    dec, found = json.JSONDecoder(), None
    for p, ch in enumerate(content):
        if ch != "{": continue
        try: obj, _ = dec.raw_decode(content, p)
        except ValueError: continue
        if isinstance(obj, dict) and set(obj) == {"steps"} and isinstance(obj["steps"], list) and 1 <= len(obj["steps"]) <= 3 and all(isinstance(s, str) for s in obj["steps"]):
            found = obj["steps"]
    return found


def weight_sha(path, chunk=1 << 24):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while b := f.read(chunk): h.update(b)
    return h.hexdigest()


def manifest_problems(pol=None, manifest_path=None):
    """Why the evaluation manifest is not frozen (empty = frozen): exists, parses, schema, and every pin it records equals the live value."""
    pol, path = pol or W.load_policy(), Path(manifest_path or W.MANIFEST_PATH)
    try: m = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as e: return [f"manifest unreadable: {type(e).__name__}"]
    bad = []
    if m.get("schema") != pol["manifest_schema"]: bad.append("manifest schema")
    if (m.get("protocol") or {}).get("blob_sha256") != W.protocol_sha(): bad.append("manifest protocol blob sha")
    if (m.get("policy") or {}).get("blob_sha256") != W.policy_sha(): bad.append("manifest policy blob sha")
    if m.get("inventory") != W.inventory(): bad.append("manifest inventory pins")
    if m.get("prompts") != W.prompt_hashes(pol): bad.append("manifest prompt hashes")
    return bad


def _git_blob_sha(commit, path):
    out = subprocess.run(["git", "show", f"{commit}:{path}"], cwd=ROOT, capture_output=True, check=True).stdout
    return hashlib.sha256(out.replace(b"\r\n", b"\n")).hexdigest()


def approval_problems(path=None, pol=None, manifest_path=None):
    """§13: every reason the gate refuses (empty = approved)."""
    pol = pol or W.load_policy()
    path = Path(path) if path else ROOT / pol["approval_path"]
    try: a = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError: return ["approval file missing"]
    except (OSError, ValueError) as e: return [f"approval file unreadable: {type(e).__name__}"]
    if not isinstance(a, dict): return ["approval file is not an object"]
    bad = []
    m = pol["model"]
    if a.get("schema") != pol["approval_schema"]: bad.append("schema")
    for k in ("approver", "approved_at", "statement"):
        if not (isinstance(a.get(k), str) and a[k].strip()): bad.append(f"{k} missing")
    live = W.protocol_sha()
    if a.get("protocol_blob_sha256") != live or live != pol["protocol_blob_sha256"]: bad.append("protocol_blob_sha256")
    if a.get("protocol_commit") != pol["protocol_commit"]: bad.append("protocol_commit")
    else:
        try:
            if _git_blob_sha(pol["protocol_commit"], pol["protocol_path"]) != live: bad.append("protocol blob at commit differs from the working file")
        except (OSError, subprocess.SubprocessError): bad.append("protocol commit not verifiable in git")
    if a.get("model_id") != m["id"]: bad.append("model_id")
    if a.get("model_file_sha256") != m["sha256"]: bad.append("model_file_sha256")
    if a.get("endpoint") != m["endpoint"]: bad.append("endpoint")
    if a.get("caps") != pol["approval_caps"]: bad.append("caps")
    bad += manifest_problems(pol, manifest_path)
    return bad


class Model:
    """One client per run. `stub=True`: loopback endpoint of any port, no approval, no weight check (records go only where `out` points)."""

    def __init__(self, out, stub=False, endpoint=None, pol=None, weights_path=None, approval_path=None, manifest_path=None, timeout=None):
        self.pol, self.out, self.stub = pol or W.load_policy(), Path(out), stub
        m = self.pol["model"]
        self.endpoint = (endpoint or m["endpoint"]).rstrip("/")
        self.timeout = timeout or self.pol["call_timeout_s"]
        self.weights_path = weights_path or (None if stub else m["file"])
        host = urlparse(self.endpoint)
        if stub:
            if host.hostname not in ("127.0.0.1", "localhost"): raise Invalidated(f"stub endpoint must be loopback, got {self.endpoint}")
        else:
            if self.endpoint != m["endpoint"]: raise Invalidated(f"call to a host other than {m['endpoint']}: {self.endpoint}")
            bad = approval_problems(approval_path, self.pol, manifest_path)
            if bad: raise Refused("operator approval gate refused: " + "; ".join(bad))
        self.out.mkdir(parents=True, exist_ok=True)

    # -- ledger --
    def _log(self, name, rec):
        rec = {"ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), **rec}
        with open(self.out / name, "a", encoding="utf-8", newline="\n") as f: f.write(json.dumps(rec, sort_keys=True) + "\n")

    def ledger(self):
        p = self.out / "model_calls.jsonl"
        return [json.loads(l) for l in p.read_text(encoding="utf-8").splitlines() if l.strip()] if p.exists() else []

    def totals(self):
        rows = self.ledger()
        return {"calls": len(rows), "tokens": sum(r.get("tokens", 0) for r in rows)}

    def check_weights(self, label):
        if not self.weights_path: return None
        sha, want = weight_sha(self.weights_path), self.pol["model"]["sha256"]
        self._log("weight_checks.jsonl", {"label": label, "sha256": sha, "expected": want, "ok": sha == want})
        if sha != want: raise Invalidated(f"weight sha mismatch at {label}")
        return sha

    def list_models(self):
        with urllib.request.urlopen(self.endpoint + "/models", timeout=30) as r: ids = [d["id"] for d in json.loads(r.read())["data"]]
        self._log("model_list.jsonl", {"ids": ids})
        if self.pol["model"]["id"] not in ids: raise Invalidated(f"unexpected model ids {ids}")
        return ids

    # -- request --
    def body(self, messages, seed):
        s = self.pol["sampling"]
        return {"model": self.pol["model"]["id"], "messages": messages, "temperature": s["temperature"], "top_p": s["top_p"], "top_k": s["top_k"],
                "max_tokens": s["max_tokens"], "stream": s["stream"], "n": s["n"], "repeat_penalty": s["repeat_penalty"],
                "frequency_penalty": s["frequency_penalty"], "presence_penalty": s["presence_penalty"], "seed": seed}

    def _cap(self):
        t = self.totals()
        if t["calls"] >= self.pol["max_model_calls"]: raise CapReached(f"model call cap {self.pol['max_model_calls']} reached")
        if t["tokens"] >= self.pol["max_tokens_total"]: raise CapReached(f"token cap {self.pol['max_tokens_total']} reached")

    def call(self, kind, messages, seed, campaign=None, rnd=None):
        """One logical call (proposal or smoke): up to 1 + transport_retries identical-bytes attempts, each logged and counted.
        Returns {content, usage, status, attempts, seed}; status is ok or transport_failure (the proposal is then consumed)."""
        raw = json.dumps(self.body(messages, seed), sort_keys=True, ensure_ascii=True).encode("utf-8")
        for attempt in range(1, self.pol["transport_retries"] + 2):
            self._cap()
            t0, rec = time.time(), {"kind": kind, "campaign": campaign, "round": rnd, "attempt": attempt, "seed": seed, "model": self.pol["model"]["id"],
                                    "endpoint": self.endpoint, "request_sha256": hashlib.sha256(raw).hexdigest(), "request_bytes": len(raw), "request_body": raw.decode("utf-8")}
            try:
                req = urllib.request.Request(self.endpoint + "/chat/completions", data=raw, headers={"Content-Type": "application/json"}, method="POST")
                with urllib.request.urlopen(req, timeout=self.timeout) as r: resp = r.read()
                data = json.loads(resp)
                content = data["choices"][0]["message"].get("content")
                usage = data.get("usage") or {}
                tokens = int(usage.get("prompt_tokens", 0)) + int(usage.get("completion_tokens", 0))
                if not usage: tokens = len(raw) // 3 + self.pol["sampling"]["max_tokens"]  # conservative when usage is absent
                rec.update(status="ok", http_status=200, response_bytes=len(resp), response_sha256=hashlib.sha256(resp).hexdigest(), response_text=resp.decode("utf-8", "replace"),
                           usage=usage, tokens=tokens, response_model=data.get("model"), latency_s=round(time.time() - t0, 3))
                self._log("model_calls.jsonl", rec)
                if data.get("model") != self.pol["model"]["id"]: raise Invalidated(f"unexpected model id in response: {data.get('model')!r}")
                return {"content": content if isinstance(content, str) else "", "usage": usage, "status": "ok", "attempts": attempt, "seed": seed}
            except Invalidated: raise
            except (urllib.error.URLError, OSError, ValueError, KeyError, IndexError, TypeError) as e:
                rec.update(status="transport_error", error=f"{type(e).__name__}: {e}", http_status=getattr(e, "code", None), tokens=0, latency_s=round(time.time() - t0, 3))
                self._log("model_calls.jsonl", rec)
        return {"content": "", "usage": {}, "status": "transport_failure", "attempts": attempt, "seed": seed}


def assemble(system, user_head, history_rows, contract, cap, log=None):
    """Build the (system, user) pair. user_head has <<HISTORY>> and <<CONTRACT>> slots; history_rows are already-rendered strings, oldest first.
    Drops the oldest rows one at a time until system+user <= cap UTF-8 bytes; each drop is passed to log. Raises PromptTooLarge if even zero rows is over."""
    rows = list(history_rows)
    while True:
        hist = "".join(rows) if rows else "(none)\n"
        user = user_head.replace("<<HISTORY>>", hist).replace("<<CONTRACT>>", contract)
        size = len((system + user).encode("utf-8"))
        if size <= cap: return system, user, size
        if not rows: raise PromptTooLarge(f"base prompt is {size} bytes, over {cap}")
        if log: log({"dropped_history_row": rows[0][:80], "size_before": size})
        rows.pop(0)
