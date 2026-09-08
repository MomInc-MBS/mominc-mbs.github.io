"""Drive /handborne/ for real: the room loads from its new prefix, and the hand gets back out.

check_handborne.py reads the files. This one runs them, because the failure this port can actually
produce is invisible on disk: Handborne was BUILT TO BE SERVED FROM A DOMAIN ROOT, every reference it
emits was root-absolute, and the port rewrote them. A rewrite that missed one is a file that 404s in
production while every string in the repo still looks right - and a chunk that fails to load in a
module graph is silent, so the page simply renders less of itself.

So: nothing may 404, nothing may throw, and the way back out is exercised end to end against the real
predicate on the other side. armie.html decides whether a hand is a hand; this drive hands its own
output to that page and asserts the gate opens, rather than asserting the JSON looks about right.
"""
import functools, json, os, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

ROOT = os.path.join("D:\\", "MBS Pages")

class _Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

_srv = ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(_Quiet, directory=ROOT))
threading.Thread(target=_srv.serve_forever, daemon=True).start()
BASE = "http://127.0.0.1:%d" % _srv.server_address[1]

ok = True
def check(cond, msg):
    global ok
    if not cond:
        ok = False
    print(("  ok   " if cond else "  FAIL ") + msg)

RECIPE = {"version": 3, "sections": {"nails": 14, "fingertips": 5, "fingers": 12,
                                     "palm": 11, "back_of_hand": 17, "wrist": 18}}

with sync_playwright() as pw:
    b = pw.chromium.launch()

    print("\n  -- handborne: the room serves from its new prefix --")
    ctx = b.new_context()
    bad, errs = [], []
    ctx.on("response", lambda r: bad.append("%d %s" % (r.status, r.url)) if r.status >= 400 else None)
    pg = ctx.new_page()
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(BASE + "/handborne/", wait_until="load")
    pg.wait_for_timeout(2500)
    check(not bad, "nothing 404s under the rewritten prefix (%s)" % (bad[:3] or "none"))
    check(not errs, "no page error (%s)" % (errs[:2] or "none"))
    # The app is React: if its chunks loaded and ran, it put controls on the page. If a chunk had
    # 404'd the shell would still render and this is what would be empty.
    controls = pg.evaluate("() => document.querySelectorAll('button').length")
    check(controls > 5, "the customizer actually mounted - %d controls on the page" % controls)
    check(pg.evaluate("() => !!document.querySelector('canvas')"), "the hand has a canvas to stand in")

    print("\n  -- handborne: the way back out --")
    # No ?return= at all: the bar must not exist. A door that is always there is a door that leaks a
    # profile to whatever page happens to be last in history.
    check(pg.evaluate("() => !document.getElementById('hb-return-bar')"),
          "with no ?return= there is no return bar")

    # An off-site return target is refused rather than followed.
    off = ctx.new_page()
    off.goto(BASE + "/handborne/?return=https://example.com/steal", wait_until="load")
    off.wait_for_timeout(1200)
    check(off.evaluate("() => !document.getElementById('hb-return-bar')"),
          "an off-site ?return= is refused")
    off.close()

    RET = "/tv/channels/armie.html"
    hb = ctx.new_page()
    hb.goto(BASE + "/handborne/?return=" + RET, wait_until="load")
    hb.wait_for_timeout(1200)
    check(hb.evaluate("() => !!document.getElementById('hb-return-bar')"),
          "a same-origin ?return= raises the return bar")
    # Nothing built yet: the bar says so and offers no way onward.
    hb.evaluate("() => localStorage.removeItem('handborne-recipe-v3')")
    hb.wait_for_timeout(900)
    check(hb.evaluate("() => document.querySelector('#hb-return-bar button').hidden"),
          "an unfinished hand cannot be taken to the coach")

    hb.evaluate("r => localStorage.setItem('handborne-recipe-v3', JSON.stringify(r))", RECIPE)
    hb.wait_for_timeout(900)
    check(not hb.evaluate("() => document.querySelector('#hb-return-bar button').hidden"),
          "a finished hand can be")

    # Nothing on file yet on the other side, checked BEFORE the handover so the next assertion is
    # about this trip rather than about something an earlier one left behind.
    pre = ctx.new_page()
    pre.goto(BASE + RET, wait_until="domcontentloaded")
    check(not pre.evaluate("() => !!localStorage.getItem('mbs-hand-profile-v1')"),
          "the coach starts with no hand on file")
    pre.close()

    print()
    print("  -- and the coach takes it --")
    hb.click("#hb-return-bar button")
    hb.wait_for_url("**/tv/channels/armie.html*", timeout=90000)
    hb.wait_for_timeout(1500)
    # armie.html banks the profile and then strips it out of the address bar in the same breath, so
    # what is asserted here is the banked record, not the hash it arrived in.
    prof = hb.evaluate("() => JSON.parse(localStorage.getItem('mbs-hand-profile-v1') || 'null')")
    check(bool(prof), "armie.html accepted the handed-over profile and banked it")
    if prof:
        s = prof["sections"]
        check(prof.get("source") == "handborne" and prof.get("complete") is True,
              "banked as a complete Handborne hand")
        check(s.get("middle_sections") == 12 and s.get("knuckles") == 12,
              "the one 'Fingers & knuckles' choice arrives as both regions")
        check(s.get("nails") == 14 and s.get("fingertips") == 5 and s.get("palm") == 11
              and s.get("back_of_hand") == 17 and s.get("wrist") == 18,
              "and every other section survives the trip intact")
    check(not hb.evaluate("() => location.hash"),
          "and the hand is cleared out of the address bar rather than left in it")
    # The gate the whole chain exists to open.
    check(hb.evaluate("() => { const g = document.getElementById('ar-hand-gate');"
                      " return !!g && g.hidden; }"),
          "the 'Coach needs hand' gate is down")
    hb.close()
    ctx.close()
    b.close()

print()
print("HANDBORNE DRIVES" if ok else "HANDBORNE BROKEN")
raise SystemExit(0 if ok else 1)
