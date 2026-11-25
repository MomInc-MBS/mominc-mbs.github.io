"""C3 independent evaluator. Run as its own process: python -I evaluator/c3/evaluate.py ...
Loads a candidate body by sha256, runs it over the private acceptance cases in ONE container run, compares with the oracle answers
and writes a receipt. It never prints or stores an answer; per-case results are hashes. Nothing in src/hive judges the verdict."""
import argparse
import hashlib
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
import harness  # noqa: E402

CRLF, LF = bytes([13, 10]), bytes([10])
SCHEMA = "hive-c3-evaluation-receipt-v1"
PIN_FILES = ["evaluate.py", "oracle.py", "harness.py", "gen_private.py", "gen_public.py"]
M2_VIEWS = "not expressible: no M2 view produces inventory_diff (view inventory: identity, parse_whole, split_rows, aggregate, to_json, each)"


def sha(b):
    return hashlib.sha256(b if isinstance(b, bytes) else b.encode()).hexdigest()


def _lf(n):
    return sha(open(os.path.join(HERE, n), "rb").read().replace(CRLF, LF))


def pin():
    return sha("".join(f"{n}:{_lf(n)}{chr(10)}" for n in PIN_FILES))


def receipt_sha(r):
    return sha(json.dumps({k: v for k, v in r.items() if k != "receipt_sha256"}, sort_keys=True, separators=(",", ":")))


def evaluate(a, run_container=None):
    from datetime import datetime, timezone
    if run_container is None:
        sys.path.insert(0, os.path.join(ROOT, "src"))
        from hive import experiment_compare as EC

        def run_container(src, text):
            return EC.run_isolated(src, text, {}, timeout=a.timeout, backend="container", operator_class="generated")
    body = open(a.candidate_file, "rb").read().decode("utf-8")
    if sha(body) != a.candidate_sha or harness.static_problems(body):
        raise SystemExit("candidate hash mismatch or static check failed")
    cases = json.load(open(os.path.join(a.private, a.set, "cases.json"), encoding="utf-8"))
    from gen_private import set_sha
    if set_sha(cases) != a.set:
        raise SystemExit("acceptance set does not match its hash")
    import oracle
    want = [oracle.expected(c["env"]) for c in cases]
    err = None
    try:
        got = json.loads(run_container(harness.wrap(body), json.dumps([c["env"] for c in cases])))
        assert isinstance(got, list) and len(got) == len(cases)
    except Exception as e:  # a crashed or timed-out run passes nothing
        got, err = [None] * len(cases), f"{type(e).__name__}: {str(e)[:200]}"
    ok = [g == w for g, w in zip(got, want)]
    r = {"schema": SCHEMA, "label": a.label, "exp_id": a.exp, "frozen_sha": a.frozen_sha, "candidate_sha256": a.candidate_sha,
         "evaluator": {"path": "evaluator/c3/evaluate.py", "pin": pin(), "process": "separate python -I"}, "acceptance_set_sha256": a.set,
         "n": len(cases), "pass_count": sum(ok), "case_result_sha256": [sha(g if isinstance(g, str) else "null") for g in got],
         "container_runs": 1, "run_error": err, "verdict": "PASS" if all(ok) else "FAIL", "at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
         "baselines": {"unchanged_hive": "0/n: no registered capability produces inventory_diff (planner refuses; measured by discovery)",
                       "matched_budget_m2_views_search": M2_VIEWS}}
    if a.baseline_receipt:
        b = json.load(open(a.baseline_receipt, encoding="utf-8"))
        if b.get("receipt_sha256") != receipt_sha(b) or b.get("exp_id") != a.exp or b.get("label") != "scripted_baseline":
            raise SystemExit("baseline receipt invalid")
        r["baselines"]["scripted_hand_written"] = {k: b[k] for k in ("candidate_sha256", "n", "pass_count", "receipt_sha256")}
    r["receipt_sha256"] = receipt_sha(r)
    with open(a.out, "w", encoding="utf-8", newline="\n") as f:
        json.dump(r, f, sort_keys=True, indent=1)
    return r


def main(argv=None, run_container=None):
    ap = argparse.ArgumentParser()
    for k in ("exp", "frozen-sha", "candidate-file", "candidate-sha", "private", "set", "out", "label"):
        ap.add_argument("--" + k, required=True)
    ap.add_argument("--baseline-receipt")
    ap.add_argument("--timeout", type=int, default=120)
    r = evaluate(ap.parse_args(argv), run_container)
    print(json.dumps({"verdict": r["verdict"], "pass_count": r["pass_count"], "n": r["n"], "receipt_sha256": r["receipt_sha256"]}))


if __name__ == "__main__":
    main()
