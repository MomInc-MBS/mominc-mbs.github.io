"""C4 admission authority. The only code that can sign an admission; the runtime verifies with configs/admission_signers only.

  python scripts/hive_admission.py init [--key-dir DIR] [--signers FILE]
  python scripts/hive_admission.py admit --store S --exp EXP_ID [--key PATH]
  python scripts/hive_admission.py revoke --store S --cap inventory-diff --version N --reason R [--key PATH]
  python scripts/hive_admission.py rollback --store S --cap inventory-diff [--key PATH]

The private key lives OUTSIDE the repo and the store (default %USERPROFILE%/.hive-admission/admission_ed25519). Stdlib + OpenSSH
`ssh-keygen -Y sign/verify`. No model calls."""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
from hive import capability_registry as CR  # noqa: E402
from hive import discovery as D  # noqa: E402
from hive import experiment_compare as EC  # noqa: E402
from hive import operator_runtime as O  # noqa: E402
from hive.adapters.isolation import PINNED_IMAGE  # noqa: E402
from hive.operator_runtime import Refused, _now, _sha  # noqa: E402
from hive.storage import Store  # noqa: E402

CAP_ID = "inventory-diff"
DEFAULT_KEY = Path(os.environ.get("USERPROFILE") or Path.home()) / ".hive-admission" / "admission_ed25519"


def _outside(path, *roots):
    p = Path(path).resolve()
    for r in roots:
        if r and (p == Path(r).resolve() or Path(r).resolve() in p.parents):
            raise Refused(f"the private key must not be inside the repo or the store: {p}")
    return p


def init(key_dir=None, signers=None):
    key = _outside(Path(key_dir) / "admission_ed25519" if key_dir else DEFAULT_KEY, ROOT)
    key.parent.mkdir(parents=True, exist_ok=True)
    if not key.exists():
        p = subprocess.run([CR.keygen(), "-q", "-t", "ed25519", "-N", "", "-C", CR.PRINCIPAL, "-f", str(key)], capture_output=True, text=True)
        if p.returncode:
            raise Refused("ssh-keygen failed: " + p.stderr[:200])
    pub = Path(str(key) + ".pub").read_text().split()
    out = Path(signers or CR.SIGNERS)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(f'{CR.PRINCIPAL} namespaces="{CR.NAMESPACE}" {pub[0]} {pub[1]}\n'.encode())
    fp = subprocess.run([CR.keygen(), "-l", "-f", str(key) + ".pub"], capture_output=True, text=True).stdout.split()
    return {"key": str(key), "signers": str(out), "fingerprint": fp[1] if len(fp) > 1 else None}


def _reject(store, exp_id, reason):
    CR.append(store, CAP_ID, "rejected", exp_id=exp_id, reason=reason[:300])
    raise Refused(reason)


def admit(store_root, exp_id, key=None, *, rerun=None):
    """Independently re-check a CANDIDATE_PASSED experiment (read-only), re-run the evaluator, then sign + record ONE admit event.
    rerun(rec, outdir, body_path) -> (receipt, path) is a test seam; the default launches evaluate.py as a separate python -I process."""
    key = _outside(key or DEFAULT_KEY, ROOT, store_root)
    s = Store(store_root)
    try:
        rec = next((e for e in D.experiments(s) if e["exp_id"] == exp_id), None)
        if rec is None:
            raise Refused(f"unknown experiment {exp_id}")
        try:
            body, r, base_r, rr = _recheck(store_root, rec, rerun)
        except (Refused, OSError, ValueError, KeyError, RuntimeError) as e:
            _reject(s, exp_id, f"admission refused: {type(e).__name__ if not isinstance(e, Refused) else 'check'}: {str(e)[:240]}")
        hist = CR.versions(s, CAP_ID)
        fz, gap = rec["frozen"], rec["gap_key"]
        prev = max(hist) if hist else None
        st = {"schema": CR.SCHEMA, "cap_id": CAP_ID, "version": (prev or 0) + 1, "in_type": fz["gap"]["signature"]["in"], "out_type": fz["gap"]["signature"]["out"],
              "arity": [2, 2], "ordered": True, "impl_sha256": _sha(body), "body": body,
              "harness": {"path": "evaluator/c3/harness.py", "sha256": _sha(D._read_lf(D.EVAL_DIR / "harness.py"))},
              "env": {"image": PINNED_IMAGE["reference"], "digest": PINNED_IMAGE["digest"], "backend": "container", "network": "none"},
              "permissions": {"imports": ["json"], "network": False, "files": False},
              "limits": {"timeout_s": O.load_policy()["container_timeout_s"], "max_out": EC.MAX_OUT},
              "verifier": {"path": "evaluator/c3/oracle.py", "evaluator": "evaluator/c3/evaluate.py", "pin": D.evaluator_pin()},
              "evaluation": {"exp_id": exp_id, "frozen_sha": rec["frozen_sha"], "receipt_sha256": r["receipt_sha256"], "pass_count": r["pass_count"], "n": r["n"],
                             "admission_rerun_receipt_sha256": rr["receipt_sha256"], "case_result_sha256_match": True},
              "lineage": {"prev_version_statement_sha": _prev_sha(s), "gap_key": gap, "proposer_model": fz["proposer"]["model"]},
              "authority": {"principal": CR.PRINCIPAL, **CR.authority_info()}, "admitted_at": _now()}
        sig = CR.sign(CR.canon(st), key)
        ref = CR.append(s, CAP_ID, "admit", statement=st, statement_sha=_sha(CR.canon(st)), signature=sig, exp_id=exp_id,
                        rerun_receipt=s.put_artifact(rr))
        return {"cap_id": CAP_ID, "version": st["version"], "statement_sha": _sha(CR.canon(st)), "event_ref": ref, "rerun_receipt_sha256": rr["receipt_sha256"]}
    finally:
        s.close()


def _prev_sha(s):
    ev = [e for e in CR.history(s, CAP_ID) if e["type"] == "admit"]
    return ev[-1]["statement_sha"] if ev else None


def _recheck(store_root, rec, rerun):
    """Every check the spec lists, from the files on disk. Raises Refused / RuntimeError with the reason."""
    fz, d = rec["frozen"], Path(store_root) / "discovery" / rec["exp_id"]
    if rec["state"] != "CANDIDATE_PASSED":
        raise Refused(f"state is {rec['state']}, not CANDIDATE_PASSED")
    if rec["frozen_sha"] != _sha(O._json(fz)) or rec["exp_id"] != "d-" + rec["frozen_sha"][:20]:
        raise Refused("frozen protocol sha does not recompute")
    cand = rec["candidate_sha256"]
    body_path = d / f"cand-{cand}.py"
    body = D._read_lf(body_path)
    if _sha(body) != cand:
        raise Refused("candidate body sha does not match the record")
    r = json.loads((d / rec["receipt"]["path"]).read_text(encoding="utf-8"))
    bad = D.receipt_problems(rec, r, cand, "candidate")
    if bad or r["receipt_sha256"] != rec["receipt"]["receipt_sha256"]:
        raise Refused("candidate receipt does not recompute / match the record: " + ", ".join(bad or ["record sha"]))
    if fz["evaluator"]["pin"] != D.evaluator_pin():
        raise Refused("evaluator pin differs from the frozen one")
    if r["verdict"] != "PASS" or r["pass_count"] != r["n"]:
        raise Refused("receipt is not a full pass")
    sb = rec["baselines"]["scripted"]
    base_r = json.loads((d / f"receipt-scripted_baseline-{sb['candidate_sha256'][:12]}.json").read_text(encoding="utf-8"))
    bad = D.receipt_problems(rec, base_r, sb["candidate_sha256"], "scripted_baseline")
    if bad or base_r["receipt_sha256"] != sb["receipt_sha256"]:
        raise Refused("scripted baseline receipt invalid: " + ", ".join(bad or ["record sha"]))
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as t:
        rr, _ = (rerun or (lambda rec, out, bp: D._evaluate(rec, out, bp, "admission_rerun", None)))(rec, t, body_path)
    if rr["verdict"] != "PASS" or rr["case_result_sha256"] != r["case_result_sha256"]:
        raise Refused("admission re-run did not reproduce the PASS with identical per-case hashes")
    return body, r, base_r, rr


def revoke(store_root, cap, version, reason, key=None):
    return _signed(store_root, cap, "revoke", key, version=int(version), reason=reason[:300])


def rollback(store_root, cap=CAP_ID, key=None):
    s = Store(store_root)
    try:
        frm, to = CR.rollback_target(s, cap)  # raises Unavailable with the reason when there is nothing to roll back to
    finally:
        s.close()
    return _signed(store_root, cap, "rollback", key, from_version=frm, to_version=to)


def _signed(store_root, cap, typ, key, **fields):
    key = _outside(key or DEFAULT_KEY, ROOT, store_root)
    s = Store(store_root)
    try:
        sp = CR.signed_payload(typ, cap, CR.head(s, cap), **fields)
        ref = CR.append(s, cap, typ, signed=sp, signature=CR.sign(CR.canon(sp), key))
        return {"cap_id": cap, "type": typ, "event_ref": ref, **fields}
    finally:
        s.close()


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    a = sub.add_parser("init"); a.add_argument("--key-dir"); a.add_argument("--signers")
    for n in ("admit", "revoke", "rollback"):
        p = sub.add_parser(n); p.add_argument("--store", required=True); p.add_argument("--key")
        if n == "admit": p.add_argument("--exp", required=True)
        else: p.add_argument("--cap", default=CAP_ID)
        if n == "revoke": p.add_argument("--version", required=True, type=int); p.add_argument("--reason", required=True)
    args = ap.parse_args(argv)
    try:
        out = (init(args.key_dir, args.signers) if args.cmd == "init" else admit(args.store, args.exp, args.key) if args.cmd == "admit"
               else revoke(args.store, args.cap, args.version, args.reason, args.key) if args.cmd == "revoke" else rollback(args.store, args.cap, args.key))
    except Refused as e:
        print(json.dumps({"ok": False, "reason": str(e)}), file=sys.stderr)
        return 2
    print(json.dumps(out, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
