#!/usr/bin/env python3
"""GOON containment gate (C081/C084).

GOON's compiled bundle creates live "Card number", "Expiry" and "Security code" inputs. Its
replacement is C084, blocked on C081 settling which source tree reproduces the deployed build,
so the route is closed and this asserts it stays closed.

What "contained" means here, precisely, because the first version of this file got it wrong:

  - The BUNDLE is unreachable by any normal route. That is the safety property, and it comes
    from tv/games/goon/ having been renamed to tv/games/_goon-quarantined/.
  - ?ch=goon renders a holding card and never fetches the fragment.
  - GOON's LCD slot is a dim span, not a link.
  - /games/goon/ is a 200 coming-soon LANDING STUB, not a 404. It is generated from
    registry.json's status by registry-0904/gen.py, exactly as sag and armie are, and the
    landing gate invokes that generator. Asserting 404 here fights the generator and loses.
    What matters is that the stub reaches no bundle and offers no play route.
  - /play/goon/ does not exist: gen.py emits no play route for a coming_soon game.

Run against a static server rooted at the repo, e.g.
    python -m http.server 8792 --bind 127.0.0.1

Reverse the containment by restoring the directory name and clearing the registry status, then
delete this file.
"""
import sys
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8792"
fails, notes = [], []
def check(c, m): (notes if c else fails).append(("PASS " if c else "FAIL ") + m)

with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    reqs = []
    pg.on("request", lambda r: reqs.append(r.url))

    # ---- the channel route
    reqs.clear()
    pg.goto(BASE + "/tv/?ch=goon", wait_until="networkidle")
    body = pg.inner_text("body")
    check("coming soon" in body.lower() or "rebuilt" in body.lower(),
          "?ch=goon renders the coming-soon holding card")
    check(not [u for u in reqs if "channels/goon.html" in u or "games/goon/" in u
               or "_goon-quarantined" in u],
          "?ch=goon fetches no goon fragment and no bundle")
    check("Card number" not in body, "?ch=goon shows no card-entry field")

    # ---- the dial
    pg.goto(BASE + "/tv/", wait_until="networkidle")
    el = pg.query_selector('#lcdList [data-id="goon"]')
    check(el is not None, "GOON keeps its dial slot on the LCD")
    if el:
        check(el.evaluate("e => e.tagName") == "SPAN", "the GOON slot is a SPAN, not an anchor")
        check("off" in (el.get_attribute("class") or ""), "the GOON slot carries the dim 'off' class")
        check(el.get_attribute("href") is None, "the GOON slot has no href")
    hrefs = pg.eval_on_selector_all("a[href]", "els => els.map(e => e.getAttribute('href'))")
    check(not [h for h in hrefs if h and "goon" in h.lower()],
          "no anchor on /tv/ points at goon")

    # ---- the landing stub: present, generated, and inert
    r = pg.request.get(BASE + "/games/goon/")
    check(r.status == 200, "/games/goon/ is a 200 coming-soon stub (got %d)" % r.status)
    stub = r.text() if r.status == 200 else ""
    check('data-status="coming-soon"' in stub, "the stub is the generated coming-soon variant")
    check("index-W2w8AfON" not in stub and "games/goon/index.html" not in stub,
          "the stub references no bundle")
    check("play/goon" not in stub, "the stub offers no play route")

    # ---- no play route at all
    r = pg.request.get(BASE + "/play/goon/")
    check(r.status == 404, "/play/goon/ does not exist (got %d)" % r.status)

    # ---- the bundle, by every normal path
    for path in ("/tv/games/goon/", "/tv/games/goon/assets/index-W2w8AfON.js"):
        r = pg.request.get(BASE + path)
        check(r.status == 404, "%s returns 404 (got %d)" % (path, r.status))

    # ---- the archive survives for C081
    r = pg.request.get(BASE + "/tv/games/_goon-quarantined/assets/index-W2w8AfON.js")
    check(r.status == 200, "the bundle is preserved for C081 (got %d)" % r.status)

    # ---- regression: other channels still load through the edited branch chain
    for slug in ("corgi", "fuel"):
        reqs.clear()
        pg.goto(BASE + "/tv/?ch=" + slug, wait_until="networkidle")
        check(any("channels/%s.html" % slug in u for u in reqs),
              "?ch=%s still fetches its fragment (loader intact)" % slug)

    b.close()

for n in notes: print("  " + n)
for f in fails: print("  " + f)
print("\n%d passed, %d failed" % (len(notes), len(fails)))
sys.exit(1 if fails else 0)
