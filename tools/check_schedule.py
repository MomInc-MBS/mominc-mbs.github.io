# -*- coding: utf-8 -*-
"""The schedule gate, after the show-times guide was retired (Ian, 2026-10-15).

The off screen no longer names the next airing or hands over an .ics; the 3D computer replaces it
(tools/check_tv_off_3d.test.mjs). What is left of the clock is the boot rule: during the Wednesday
7-8pm (Los Angeles) show the set boots ON, outside it the set boots OFF. Driven at FIXED instants
with Playwright's clock so the answer does not depend on when the gate runs.

Run:  python tools/check_schedule.py     (serves the repo itself; nothing else need be running)
"""
import functools, os, threading
from datetime import datetime, timezone
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")


class _Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *a): pass


_srv = ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(_Quiet, directory=ROOT))
threading.Thread(target=_srv.serve_forever, daemon=True).start()
BASE = "http://127.0.0.1:%d" % _srv.server_address[1]

ok, notes, errs = True, [], []


def check(c, m):
    global ok
    ok = ok and bool(c)
    notes.append(("PASS " if c else "FAIL ") + m)


READ = """() => {
    const n = document.getElementById('darkNote');
    return { state: document.getElementById('tv').dataset.state, text: n.textContent.replace(/\s+/g, ' ').trim(),
             add: !!document.getElementById('darkAdd') };
}"""


def utc(s):
    return datetime.fromisoformat(s).replace(tzinfo=timezone.utc)


def visit(browser, when, tz):
    """Load the shell in a fresh context at a fixed instant, in a chosen visitor time zone."""
    ctx = browser.new_context(timezone_id=tz)
    ctx.clock.set_fixed_time(utc(when))
    pg = ctx.new_page()
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(BASE + "/tv/", wait_until="load")
    pg.wait_for_timeout(250)
    out = pg.evaluate(READ)
    ctx.close()
    return out


with sync_playwright() as b_pw:
    b = b_pw.chromium.launch()

    print("== off-air, the set boots dark and advertises no show time")
    a = visit(b, "2026-09-08T17:00:00", "Asia/Tokyo")
    check(a["state"] == "off", "off-air, the set boots dark (got %r)" % a["state"])
    check(not any(w in a["text"] for w in ("Next show", "calendar", "on air", "PDT", "PST")), "no show-time copy (got %r)" % a["text"])
    check(not a["add"], "no calendar link")

    print("== on air, the set boots on")
    g = visit(b, "2026-09-10T02:30:00", "Asia/Tokyo")
    check(g["state"] == "on", "on air, the set boots already on (got %r)" % g["state"])
    e = visit(b, "2026-11-12T03:30:00", "Europe/London")
    check(e["state"] == "on", "and in November (PST) too (got %r)" % e["state"])

    check(not errs, "no console errors (%s)" % (errs[:3] or "none"))
    b.close()

print()
for n in notes:
    print(n)
p = sum(1 for n in notes if n.startswith("PASS"))
print("\n%s  %d/%d" % ("PASS" if ok else "FAIL", p, len(notes)))
raise SystemExit(0 if ok else 1)
