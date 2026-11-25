"""Sum Claude Code agent token usage for the v0.4.x build from local session transcripts (no network).

usage: python scripts/agent_usage_tally.py TRANSCRIPT_DIR MARKER [CONDUCTOR_SESSION_ID]
Counts each assistant message once (dedup by message.id). Prints JSON per session and totals by model.
"""
import json, sys
from pathlib import Path

# USD per 1M tokens, Anthropic first-party list prices (claude-api skill table cached 2026-11-03).
# cache_write uses the 1h-TTL rate (2x input), which Claude Code sessions here use; 5m TTL would be 1.25x.
PRICES = {
    "claude-opus-5-5": dict(uncached_input=4.00, cache_write=8.00, cached_read=0.20, output=20.00),
    "claude-sonnet-5-5": dict(uncached_input=2.00, cache_write=4.00, cached_read=0.10, output=10.00),
    "claude-haiku-5-5": dict(uncached_input=0.10, cache_write=0.20, cached_read=0.01, output=0.50),
}

def tally(path):
    seen, out = set(), {}
    for line in path.open(encoding="utf-8", errors="replace"):
        try:
            rec = json.loads(line)
        except ValueError:
            continue
        msg = rec.get("message") or {}
        u, mid = msg.get("usage"), msg.get("id")
        if not u or not mid or mid in seen:
            continue
        seen.add(mid)
        m = out.setdefault(msg.get("model", "?"), dict(uncached_input=0, cache_write=0, cached_read=0, output=0, messages=0))
        m["uncached_input"] += u.get("input_tokens", 0) or 0
        m["cache_write"] += u.get("cache_creation_input_tokens", 0) or 0
        m["cached_read"] += u.get("cache_read_input_tokens", 0) or 0
        m["output"] += u.get("output_tokens", 0) or 0
        m["messages"] += 1
    return out

def main(root, marker, conductor=None):
    sessions, totals = {}, {}
    for f in sorted(Path(root).glob("*.jsonl")):
        head = f.read_text(encoding="utf-8", errors="replace")[:20000]
        if marker in head or f.stem == conductor:
            sessions[f.stem] = tally(f)
            for model, m in sessions[f.stem].items():
                t = totals.setdefault(model, dict.fromkeys(m, 0))
                for k, v in m.items():
                    t[k] += v
    usd = {m: {k: round(t[k] * PRICES[m][k] / 1e6, 4) for k in PRICES[m]} for m, t in totals.items() if m in PRICES}
    for m in usd:
        usd[m]["total"] = round(sum(usd[m].values()), 4)
    print(json.dumps({"sessions": sessions, "totals_by_model": totals, "usd_list_price": usd,
                      "usd_total": round(sum(v["total"] for v in usd.values()), 2)}, indent=1))

if __name__ == "__main__":
    main(*sys.argv[1:4])
