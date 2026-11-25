"""M0 independent evaluator: hand-written exact expected outputs. Never imports or calls candidate primitives."""
import hashlib, inspect, sys

VERSION = "m0-oracle-v1"
PROTOCOL_ID = "m0-exact-output-v1"
CHECKS = {"forbid_pattern": r"\((?:The|A|An)\)"}
TASKS = {
    "T1": {"input": "title,id\nDune (The),1\nEmma (A),2\nPlain,3\n",
           "expected": "title,id\nDune,1\nEmma,2\nPlain,3\n"},
    "T2": {"input": "name,qty\r\nOlive (An),5\r\nRiver (The),6\r\nKeep,7\r\n",
           "expected": "name,qty\r\nOlive,5\r\nRiver,6\r\nKeep,7\r\n"},
}


def sha(s): return hashlib.sha256(s.encode("utf-8")).hexdigest()


def oracle_sha(): return hashlib.sha256(inspect.getsource(sys.modules[__name__]).encode("utf-8")).hexdigest()


def protocol_sha():
    return sha(PROTOCOL_ID + "|" + VERSION + "|" + "|".join(f"{k}:{sha(v['input'])}" for k, v in sorted(TASKS.items())))


def judge(task, output): return "PASS" if output == TASKS[task]["expected"] else "FAIL"
