"""C4 generalized capability registry: signed admissions of discovered capabilities, beside the M2 chains.

Chain `operator/capreg/<cap_id>` = append-only hash-linked events (same pattern as operator_runtime._event). Admit / revoke /
rollback events carry an OpenSSH signature that only the admission authority (scripts/hive_admission.py, private key outside
the repo and store) can make. This module only VERIFIES (public key in configs/admission_signers); it never signs and nothing a
model or the runtime writer produces can pass verify. Every use re-verifies the whole chain and the current statement."""
from __future__ import annotations

import json
import shutil
import subprocess
import tempfile
from pathlib import Path

from . import operator_runtime as O
from .operator_runtime import Refused, _now, _sha, _txn

CHAIN = "operator/capreg/"
SCHEMA, EVENT_SCHEMA = "hive-capability-admission-v1", "hive-capability-event-v1"
PRINCIPAL = NAMESPACE = "hive-admission"
SIGNERS = O.ROOT / "configs" / "admission_signers"
SIGNED = ("admit", "revoke", "rollback")


class Unavailable(Refused):
    """No eligible version (nothing admitted, all revoked, or no earlier version to roll back to)."""


def canon(o): return json.dumps(o, sort_keys=True, separators=(",", ":")).encode("utf-8")


def keygen(): return shutil.which("ssh-keygen") or ""


def authority_info():
    ssh = shutil.which("ssh")
    try:
        ver = subprocess.run([ssh, "-V"], capture_output=True, text=True, timeout=10).stderr.strip() if ssh else "unknown"
    except OSError:
        ver = "unknown"
    return {"ssh_keygen": keygen(), "version": ver}


def _run(args, data=None):
    return subprocess.run([keygen()] + args, input=data, capture_output=True, timeout=30)


def sign(data: bytes, key) -> str:
    """Authority side only (called from scripts/hive_admission.py)."""
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as t:
        f = Path(t) / "m"
        f.write_bytes(data)
        p = _run(["-Y", "sign", "-q", "-f", str(key), "-n", NAMESPACE, str(f)])
        if p.returncode or not (Path(t) / "m.sig").exists():
            raise Refused("signing failed: " + p.stderr.decode(errors="replace")[:200])
        return (Path(t) / "m.sig").read_bytes().decode().replace("\r\n", "\n")


def verify_sig(data: bytes, sig: str) -> bool:
    if not keygen() or not isinstance(sig, str) or not Path(SIGNERS).is_file():
        return False
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as t:
        s = Path(t) / "m.sig"
        s.write_bytes(sig.encode())
        p = _run(["-Y", "verify", "-f", str(SIGNERS), "-I", PRINCIPAL, "-n", NAMESPACE, "-s", str(s)], data)
    return p.returncode == 0


# ---------------------------------------------------------------- chain
def cap_ids(store):
    return sorted(r["key"][len(CHAIN):] for r in store.db.execute("SELECT key FROM kv WHERE key LIKE ?", (CHAIN + "%",)).fetchall())


def head(store, cap_id): return store.get(CHAIN + cap_id)


def history(store, cap_id):
    """Events oldest first, each artifact re-hashed on read; a missing or altered artifact raises Refused (chain broken)."""
    out, ref = [], head(store, cap_id)
    try:
        while ref:
            ev = store.read_artifact(ref)
            out.append(dict(ev, ref=ref))
            ref = ev["prev"]
    except (OSError, ValueError, KeyError) as e:
        raise Refused(f"capability chain broken: {type(e).__name__}") from None
    return out[::-1]


def append(store, cap_id, typ, *, statement=None, between=None, **extra):
    """One transaction: statement artifact (admit) + event. A crash or exception before the event leaves the head unchanged."""
    with _txn(store):
        ex = dict(extra)
        if statement is not None:
            ex["statement_ref"] = store.put_artifact(statement)
        if between:
            between()  # failure-injection seam for the interrupted-promotion test; no-op in production
        ref = store.put_artifact({"kind": "capability_registry_event", "cap_id": cap_id, "type": typ, "at": _now(), "prev": head(store, cap_id), **ex})
        store.set(CHAIN + cap_id, ref)
    return ref


def signed_payload(typ, cap_id, prev, **fields):
    """What the authority signs for revoke / rollback (admit signs its statement). Bound to the chain position via prev."""
    return {"schema": EVENT_SCHEMA, "type": typ, "cap_id": cap_id, "prev": prev, "at": _now(), **fields}


def versions(store, cap_id):
    """Raw (UNVERIFIED) admitted version numbers; the authority uses it to number the next version."""
    out = {}
    for e in history(store, cap_id):
        if e["type"] == "admit":
            try:
                st = store.read_artifact(e["statement_ref"])
                out[st["version"]] = e.get("statement_sha")
            except (OSError, ValueError, KeyError):
                pass
    return out


def _state(store, cap_id):
    """Verify every signed event, then fold: (admitted {v: (statement, event)}, revoked set, current version or None)."""
    adm, revoked, cur = {}, set(), None
    for n, e in enumerate(history(store, cap_id)):
        t = e["type"]
        if t == "rejected":
            continue  # unsigned by design; never eligible
        if t not in SIGNED:
            raise Refused(f"event {n}: unknown type {str(t)[:20]!r}")
        if t == "admit":
            try:
                st = store.read_artifact(e["statement_ref"])
            except (OSError, ValueError, KeyError):
                raise Refused(f"event {n}: statement artifact missing or altered") from None
            if not verify_sig(canon(st), e.get("signature")) or e.get("statement_sha") != _sha(canon(st)):
                raise Refused(f"event {n}: admission signature does not verify (unauthorized or altered)")
            if st.get("schema") != SCHEMA or st.get("cap_id") != cap_id or not isinstance(st.get("version"), int):
                raise Refused(f"event {n}: malformed statement")
            adm[st["version"]], cur = (st, e), st["version"]
        else:
            sp = e.get("signed")
            if not isinstance(sp, dict) or not verify_sig(canon(sp), e.get("signature")) or sp.get("type") != t or sp.get("cap_id") != cap_id \
                    or sp.get("prev") != e.get("prev"):
                raise Refused(f"event {n}: {t} signature does not verify (unauthorized or altered)")
            if t == "revoke":
                revoked.add(sp["version"])
                cur = None if cur == sp["version"] else cur
            else:
                if sp["to_version"] not in adm or sp["to_version"] in revoked:
                    raise Refused(f"event {n}: rollback target is not an admitted, unrevoked version")
                cur = sp["to_version"]
    return adm, revoked, cur


def _check_statement(st):
    """Current-file checks on EVERY use: nothing in the statement is trusted without recomputing it from the files in the repo."""
    from . import discovery as D
    from .adapters.isolation import PINNED_IMAGE
    if _sha(st["body"]) != st["impl_sha256"]:
        raise Refused("implementation body does not match its admitted sha256")
    h = D._load("harness")
    hp = D.EVAL_DIR / "harness.py"
    if D._sha(D._read_lf(hp)) != st["harness"]["sha256"]:
        raise Refused("evaluator harness differs from the admitted one")
    if st["verifier"]["pin"] != D.evaluator_pin():
        raise Refused("evaluator pin differs from the admitted one")
    if (st["env"]["image"], st["env"]["digest"]) != (PINNED_IMAGE["reference"], PINNED_IMAGE["digest"]):
        raise Refused("execution image differs from the admitted one")
    bad = h.static_problems(st["body"])
    if bad:
        raise Refused("static check failed: " + ", ".join(bad))


def resolve_discovered(store, cap_id):
    """The verified current statement (+ event ref) or Refused / Unavailable. Never returns anything unverified."""
    if head(store, cap_id) is None:
        raise Unavailable(f"{cap_id}: nothing admitted")
    adm, revoked, cur = _state(store, cap_id)
    if cur is None:
        raise Unavailable(f"{cap_id}: no eligible version (all admitted versions revoked)")
    st, e = adm[cur]
    try:
        _check_statement(st)
    except KeyError as k:
        raise Refused(f"statement field missing: {k}") from None
    return {"cap_id": cap_id, "version": cur, "statement": st, "statement_sha": e["statement_sha"], "event_ref": e["ref"]}


def rollback_target(store, cap_id):
    """Previous admitted, unrevoked version below the current one (or the newest unrevoked one when nothing is current); else Unavailable."""
    adm, revoked, cur = _state(store, cap_id)
    ok = [v for v in adm if v not in revoked and (cur is None or v < cur)]
    if not ok:
        raise Unavailable(f"{cap_id}: no earlier admitted, unrevoked version to roll back to (only: {sorted(set(adm) - revoked)})")
    return cur, max(ok)


def eligible_discovered(store):
    """({cap_id: type row}, [{op, reason}]) for the planner. Types come only from the verified statement."""
    ok, ex = {}, []
    for cid in cap_ids(store):
        try:
            r = resolve_discovered(store, cid)
        except Unavailable as e:
            ex.append({"op": cid, "reason": str(e)})
            continue
        except Refused as e:
            ex.append({"op": cid, "reason": "refused: " + str(e)[:200]})
            continue
        st = r["statement"]
        ok[cid] = {"kind": "discovered", "in": st["in_type"], "out": st["out_type"], "arity": st["arity"], "verifier": st["verifier"]["path"],
                   "version": r["version"], "statement_sha": r["statement_sha"], "genome": r["statement_sha"]}
    return ok, ex
