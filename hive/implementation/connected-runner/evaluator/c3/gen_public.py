"""C3 public dev cases: deterministic, shown to the proposer. Each case = {"name", "env", "expected"}."""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import oracle  # noqa: E402


def text(rows):
    """convert's `converted` form: compact sorted-key JSON, file order kept."""
    return json.dumps([{"bytes": b, "group": g, "id": i} for i, g, b in rows], sort_keys=True, separators=(",", ":"))


def case(name, before, after):
    env = {"files": [{"format": "json", "text": text(before)}, {"format": "json", "text": text(after)}]}
    return {"name": name, "env": env, "expected": oracle.expected(env)}


def cases():
    r = [("a.txt", "docs", 10), ("b.png", "img", 2048), ("c.md", "docs", 5)]
    return [case("empty-diff", r, list(reversed(r))),
            case("all-added", [("x", "g", 1)], r),
            case("all-removed", r, [("x", "g", 1)]),
            case("group-only-change", r, [("a.txt", "notes", 10), r[1], r[2]]),
            case("bytes-only-change", r, [r[0], ("b.png", "img", 4096), r[2]]),
            case("mixed", r + [("d.csv", "data", 7)], [("a.txt", "docs", 11), r[1], ("e/f.json", "data", 3), ("d.csv", "data", 7)])]


if __name__ == "__main__":
    print(json.dumps(cases(), sort_keys=True))
