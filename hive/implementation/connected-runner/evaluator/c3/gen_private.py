"""C3 acceptance cases from a random seed, written ONLY under --out (.hive/c3-private, gitignored) with their answers.
Prints just {"set_sha256","n"}: the proposer side learns the hash, never the cases."""
import argparse
import hashlib
import json
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gen_public  # noqa: E402
import oracle  # noqa: E402

ALPHA = "abcdefghij/._- é日本ß\"\\"


def _id(rng):
    return "".join(rng.choice(ALPHA) for _ in range(rng.randint(1, 12))) or "x"


def _rows(rng, n, ids=None):
    ids = ids or list({_id(rng) for _ in range(n)})
    return [(i, rng.choice(["docs", "img", "é-grp", "g" + str(rng.randint(0, 3))]), rng.choice([0, rng.randint(1, 10**9), 10**9])) for i in ids]


def _derive(rng, rows, keep=0.7, add=3):
    out = [r for r in rows if rng.random() < keep]
    for k, (i, g, b) in enumerate(out):
        if rng.random() < 0.3:
            out[k] = (i, g if rng.random() < 0.5 else g + "x", b if rng.random() < 0.5 else (b + 1) % (10**9 + 1))
    used = {r[0] for r in rows}
    out += [r for r in _rows(rng, add) if r[0] not in used]
    return out or rows[:1]


def generate(seed, n=24):
    rng, cases = random.Random(seed), []

    def add(name, before, after):
        rng.shuffle(before), rng.shuffle(after)
        cases.append(gen_public.case(name, before, after))

    num = [("10", "g", 1), ("9", "g", 2), ("2", "g", 3), ("100", "g", 4), ("1", "g", 5)]
    add("numeric-vs-text-ids", num, [(i, g, b + (i == "9")) for i, g, b in num])
    uni = [("日本/ファイル.txt", "g", 1), ("é", "g", 2), ("😀", "g", 3), ("\uffff", "g", 4), ("a", "g", 5)]
    add("unicode-ids", uni, uni[1:] + [("ñ", "g", 9)])
    big = [(f"f{k:03d}.dat", f"g{k % 5}", k) for k in range(256)]
    add("256-rows-identical", list(big), list(big))
    add("256-vs-1", list(big), big[:1])
    add("1-vs-256", big[:1], list(big))
    add("1-row-identical", [("only", "g", 7)], [("only", "g", 7)])
    add("1-row-bytes-change", [("only", "g", 7)], [("only", "g", 8)])
    add("1-row-group-change", [("only", "g", 7)], [("only", "h", 7)])
    add("disjoint", [("a", "g", 1)], [("b", "g", 1)])
    add("boundary-bytes", [("a", "g", 0), ("b", "g", 10**9)], [("a", "g", 10**9), ("b", "g", 0)])
    while len(cases) < n:
        before = _rows(rng, rng.randint(1, 40))
        add(f"random-{len(cases)}", before, _derive(rng, before))
    return cases


def set_sha(cases):
    return hashlib.sha256(json.dumps(cases, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--seed", type=int)
    a = ap.parse_args(argv)
    cases = generate(random.SystemRandom().randrange(2**62) if a.seed is None else a.seed)
    sha = set_sha(cases)
    d = os.path.join(a.out, sha)
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, "cases.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(cases, f, sort_keys=True, separators=(",", ":"))
    print(json.dumps({"set_sha256": sha, "n": len(cases)}))


if __name__ == "__main__":
    main()
