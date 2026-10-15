# -*- coding: utf-8 -*-
"""The off television is a 3D computer (tv/off-scene.mjs). Gate:

  * no show-time copy or calendar link survives on the off screen;
  * the sticky note is there on a first visit, reads "Be smart. Beat the games. Beat Mom. Be free.",
    and is gone for good (localStorage, across reloads) after one read;
  * power is dead until the rear wires are joined (hotwired), then the normal TV comes on;
  * after hotwire + power on, the off scene is locked to the front across visits until Coach Armie
    is complete ('mbs-armie-hall-result' is written), then rotation unlocks.

Run:  python tools/check_tv_off_3d.py     (serves the repo itself)
"""
import functools, os, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")


class _Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *a): pass


_srv = ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(_Quiet, directory=ROOT))
threading.Thread(target=_srv.serve_forever, daemon=True).start()
BASE = "http://127.0.0.1:%d" % _srv.server_address[1]
NOTE = "Be smart. Beat the games. Beat Mom. Be free."
ok, notes, errs = True, [], []


def check(c, m):
    global ok
    ok = ok and bool(c)
    notes.append(("PASS " if c else "FAIL ") + m)


src = open(os.path.join(ROOT, "tv", "tv.js"), encoding="utf8").read()
check(not any(w in src for w in ("Next show", "Add to your calendar", "on air now", "mbs.ics", "VCALENDAR")), "tv.js carries no show-time copy")
check(NOTE in open(os.path.join(ROOT, "tv", "off-scene.mjs"), encoding="utf8").read(), "the note text is in off-scene.mjs")

state = "() => document.getElementById('tv').dataset.state"
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    ctx = b.new_context(viewport={"width": 412, "height": 915}, has_touch=True, is_mobile=True)
    ctx.clock.set_fixed_time("2026-09-08T17:00:00Z")   # a Tuesday: off air, the set boots dark
    pg = ctx.new_page()
    pg.on("pageerror", lambda e: errs.append(str(e)))

    def load():
        pg.goto(BASE + "/tv/", wait_until="load")
        pg.wait_for_function("() => document.getElementById('tv').dataset.off3d === 'on'", timeout=20000)
        pg.wait_for_timeout(800)

    load()
    text = pg.evaluate("() => document.getElementById('darkNote').textContent")
    check(pg.evaluate(state) == "off", "the set boots off")
    check("Next show" not in text and not pg.query_selector("#darkAdd"), "no show time or calendar link (%r)" % text)
    check(pg.is_visible(".off3d canvas"), "the 3D computer covers the off screen")

    print("== the note: there once, then gone for good")
    check(pg.is_visible(".off3d-note") and NOTE in (pg.get_attribute(".off3d-note", "aria-label") or ""), "the note is on the monitor and reads the message")
    pg.click(".off3d-note"); pg.wait_for_timeout(1200)
    check(pg.evaluate("document.querySelector('.off3d').classList.contains('zoomed')"), "tapping it zooms in")
    pg.click(".off3d-note"); pg.wait_for_timeout(1200)
    check(pg.evaluate("MBS_OFF3D.noteGone") and not pg.is_visible(".off3d-note"), "after one read it is gone")

    print("== power is dead until hotwired")
    pg.click(".off3d-power"); pg.wait_for_timeout(1200)
    check(pg.evaluate(state) == "off", "power does nothing before the wires are joined")
    pg.evaluate("MBS_OFF3D.setYaw(Math.PI)"); pg.wait_for_timeout(500)
    a, z = pg.locator(".off3d-wire").nth(0).bounding_box(), pg.locator(".off3d-wire").nth(1).bounding_box()
    pg.mouse.move(a["x"] + a["width"] / 2, a["y"] + a["height"] / 2); pg.mouse.down()
    for i in range(1, 21):
        pg.mouse.move(a["x"] + a["width"] / 2 + (z["x"] - a["x"]) * i / 20, a["y"] + a["height"] / 2 + (z["y"] - a["y"]) * i / 20)
    pg.mouse.up(); pg.wait_for_timeout(300)
    check(pg.evaluate("MBS_OFF3D.hot"), "dragging one wire end onto the other hotwires it")
    pg.evaluate("MBS_OFF3D.setYaw(0)"); pg.wait_for_timeout(500)
    pg.click(".off3d-power"); pg.wait_for_timeout(2000)
    check(pg.evaluate(state) == "on", "then power turns the normal TV on")
    check(not pg.is_visible(".off3d"), "and the 3D layer is gone while on")

    print("== locked to the front until Coach Armie is beaten")
    pg.evaluate("sessionStorage.clear()")   # a later visit: only localStorage survives
    load()
    check(pg.evaluate(state) == "off", "a later visit boots off")
    check(pg.evaluate("MBS_OFF3D.locked"), "the scene is locked")
    pg.evaluate("MBS_OFF3D.setYaw(2)"); pg.keyboard.press("ArrowRight")
    check(pg.evaluate("MBS_OFF3D.yaw") == 0, "rotation is refused while locked")
    check(not pg.is_visible(".off3d-note"), "the note stays gone after a reload")
    pg.click(".off3d-power"); pg.wait_for_timeout(2000)
    check(pg.evaluate(state) == "on", "power still works while locked")
    pg.evaluate("localStorage.setItem('mbs-armie-hall-result', '{}'); sessionStorage.setItem('mbs-on', '0')")
    load()
    check(not pg.evaluate("MBS_OFF3D.locked"), "after Armie completes the lock lifts")
    pg.evaluate("MBS_OFF3D.setYaw(2)")
    check(pg.evaluate("MBS_OFF3D.yaw") == 2, "and the computer can be orbited again")

    check(not errs, "no page errors (%s)" % (errs[:3] or "none"))
    b.close()

print()
for n in notes:
    print(n)
p = sum(1 for n in notes if n.startswith("PASS"))
print("\n%s  %d/%d" % ("PASS" if ok else "FAIL", p, len(notes)))
raise SystemExit(0 if ok else 1)
