#!/usr/bin/env python3
"""Stage 1.1 acceptance check, run in a real browser against the served worktree.

Asserts the two things the containment has to be true for, plus one regression check, because
removing GOON from CHANNELS and adding a SUPPRESSED branch both touch code every channel uses.
"""
import sys
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8791"
fails, notes = [], []

def check(cond, msg):
    (notes if cond else fails).append(("PASS " if cond else "FAIL ") + msg)

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page()
    reqs = []
    pg.on("request", lambda r: reqs.append(r.url))

    # ---- 1. the suppressed route
    reqs.clear()
    pg.goto(BASE + "/tv/?ch=goon", wait_until="networkidle")
    body = pg.inner_text("body")
    check("OFF AIR" in body, "?ch=goon renders the OFF AIR unavailable state")
    # the navigation URL itself contains "goon"; what must not appear is a fetch of the
    # channel fragment or of any bundle asset
    goon_reqs = [u for u in reqs
                 if "channels/goon.html" in u or "games/goon" in u or "_goon-quarantined" in u]
    check(not goon_reqs, "?ch=goon fetches no goon fragment or bundle (saw: %s)" % (goon_reqs or "none"))
    check("Card number" not in body, "?ch=goon shows no card-entry field")

    # ---- 2. no GOON entry in the channel LCD
    pg.goto(BASE + "/tv/", wait_until="networkidle")
    lcd = pg.inner_text("#lcdList") if pg.query_selector("#lcdList") else ""
    check("GOON" not in lcd.upper(), "the LCD channel list has no GOON entry")
    hrefs = pg.eval_on_selector_all("a[href]", "els => els.map(e => e.getAttribute('href'))")
    goon_links = [h for h in hrefs if h and "goon" in h.lower()]
    check(not goon_links, "no anchor on /tv/ points at goon (saw: %s)" % (goon_links or "none"))

    # ---- 3. regression: a real channel still loads through the edited branch chain
    reqs.clear()
    pg.goto(BASE + "/tv/?ch=corgi", wait_until="networkidle")
    got_corgi = any("channels/corgi.html" in u for u in reqs)
    check(got_corgi, "?ch=corgi still fetches its fragment (loader not broken)")
    check(len(pg.inner_text("body")) > 200, "?ch=corgi renders real content")

    # ---- 4. regression: no channel is suppressed by accident
    reqs.clear()
    pg.goto(BASE + "/tv/?ch=fuel", wait_until="networkidle")
    check(any("channels/fuel.html" in u for u in reqs), "?ch=fuel still fetches its fragment")

    # ---- 5. the direct bundle routes are gone
    for path in ("/tv/games/goon/", "/tv/games/goon/assets/index-W2w8AfON.js"):
        r = pg.request.get(BASE + path)
        check(r.status == 404, "%s returns 404 (got %d)" % (path, r.status))

    # ---- 6. the archived bundle is still there for C081
    r = pg.request.get(BASE + "/tv/games/_goon-quarantined/assets/index-W2w8AfON.js")
    check(r.status == 200, "the bundle is preserved for C081 (got %d)" % r.status)
    r = pg.request.get(BASE + "/tv/games/_goon-quarantined/")
    qt = r.text()
    check(r.status == 200 and "<input" not in qt and "index-W2w8AfON.js" not in qt,
          "the quarantine dir serves a holding page with no inputs and no bundle script")

    b.close()

for n in notes: print("  " + n)
for f in fails: print("  " + f)
print("\n%d passed, %d failed" % (len(notes), len(fails)))
sys.exit(1 if fails else 0)
