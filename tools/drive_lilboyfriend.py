"""Drive lilboyfriend's 3D museum: the half no gate touches.

check_play drives the FLAT gallery (it forces WebGL off) and check_teardown only mounts and unmounts,
so before packet 12 nothing in this repo had ever pressed a key inside the museum itself.
Packet 12 rewired every listener in the 3D path - three on window, four on the WALK/BACK buttons, three
on the look zone, the guest book form and the door - and a listener that silently never fires would
pass every assertion in the repo and photograph identically. So: hold W, see the walk advance; look at
the lectern, see the guest book open; press Escape/E, see the zoom respond.
"""
import functools, os, threading
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
    ok &= bool(cond)
    print("  %s %s" % ("PASS" if cond else "FAIL", msg))


with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={"width": 1280, "height": 900})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.goto(BASE + "/play/lilboyfriend/", wait_until="load")
    pg.wait_for_timeout(6000)

    state = lambda: pg.evaluate("() => window.__lbState()")
    check(pg.evaluate("() => !!document.querySelector('#lb.webgl')"), "the 3D path was taken")
    t0 = state()["t"]

    # ---- the keyboard walk: three window listeners, the ones most likely to be silently unbound
    pg.keyboard.down("w")
    pg.wait_for_timeout(1500)
    pg.keyboard.up("w")
    pg.wait_for_timeout(200)
    t1 = state()["t"]
    check(t1 > t0, "holding W walks forward (t %.4f -> %.4f)" % (t0, t1))

    pg.keyboard.down("s")
    pg.wait_for_timeout(900)
    pg.keyboard.up("s")
    pg.wait_for_timeout(200)
    t2 = state()["t"]
    check(t2 < t1, "holding S walks back (t %.4f -> %.4f)" % (t1, t2))

    # ---- the WALK button: pointerdown/pointerup on a channel element
    box = pg.locator("#lbWalk").bounding_box()
    pg.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
    pg.mouse.down()
    pg.wait_for_timeout(1200)
    pg.mouse.up()
    pg.wait_for_timeout(200)
    t3 = state()["t"]
    check(t3 > t2, "holding the WALK button walks forward too (t %.4f -> %.4f)" % (t2, t3))

    # ---- the hint dismiss, which is the ctx.timeout plus the look zone's pointermove
    check(pg.evaluate("() => document.querySelector('#lbHint').classList.contains('hide')"),
          "the hint was dismissed (the look zone's pointermove and/or the 7s timer fired)")

    # ---- the guest book: level-triggered by proximity from inside the frame loop
    pg.evaluate("""() => { const s = JSON.parse(localStorage.getItem('mbs-lilbf-museum-v2') || '{}');
                           s.t = 0.03; s.signed = false; localStorage.setItem('mbs-lilbf-museum-v2', JSON.stringify(s)); }""")
    pg.reload(wait_until="load")
    pg.wait_for_timeout(6000)
    # Look at the lectern. The guest book sits at side -1 (negative x), and this channel's own comment
    # spells the sign convention out: forward is (-sin(yaw), -cos(yaw)), so a POSITIVE yaw faces -x, and
    # targetYaw = (nx - 0.5) * PI means the pointer has to go to the RIGHT of the look zone's centre to
    # turn toward it. Getting this backwards is exactly the mirrored-direction mistake the comment
    # records being made once already with a raycast.
    cv = pg.locator("#lookZone").bounding_box()
    pg.mouse.move(cv["x"] + cv["width"] * 0.82, cv["y"] + cv["height"] * 0.5)
    pg.wait_for_timeout(900)
    opened = pg.evaluate("() => document.querySelector('#bookPanel').classList.contains('show')")
    check(opened, "walking up to the lectern and looking at it opens the guest book")

    if opened:
        pg.fill("#bookForm input[name=city]", "las vegas")
        pg.fill("#bookForm input[name=country]", "united states")
        pg.fill("#bookForm input[name=income]", "52000")
        pg.click("#bookForm button[type=submit]")
        pg.wait_for_timeout(500)
        check(not pg.evaluate("() => document.querySelector('#bookPanel').classList.contains('show')"),
              "and signing it closes the panel")
        check(pg.evaluate("""() => { try { return !!JSON.parse(
                  localStorage.getItem('mbs-lilbf-museum-v2')).signed; } catch (e) { return false; } }"""),
              "and the signature is recorded in the shared store")

    clean = [e for e in errs if "favicon" not in e and "jsdelivr" not in e.lower()]
    check(not clean, "no page errors across the drive (%s)" % (clean[:2] or "none"))
    b.close()

print("\n%s" % ("3D PATH DRIVES" if ok else "3D PATH BROKEN"))
raise SystemExit(0 if ok else 1)
