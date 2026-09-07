"""Drive corgi's 3D school hunt: the half no gate touches.

check_play drives the FALLBACK room-picker (it forces WebGL off) and check_teardown only mounts and
unmounts, so nothing in this repo has ever pressed a key inside the hall itself - and packet 14 rewired
every listener in it. Thirty of them, and TWO ARE BOUND TO WINDOW: the keydown that walks the dog and
the keyup that stops him. A window listener left bound after a channel change is a dead school reading
the next channel's W key; one silently never bound is a dog that cannot move, and BOTH pass every
assertion in this repo and photograph identically. That is what this file is for (drive_lilboyfriend.py
made the same argument for the museum, drive_girlfriend.py for the line).

WHAT IS DRIVEN, and it is all real input: the window keydown/keyup, the viewport's look-drag, the
tap-to-set joystick, the FLASHLIGHT and SPRINT buttons, the timecode interval, READ THE PAPER, the
book's own keyboard and BACK TO THE HALL. window.__corgi is read for the player's position and yaw -
it is the channel's existing probe hook, not something added for this - and is never used to MOVE
anything, because moving it through the hook would prove nothing about the listeners.

OFF-AIR ON PURPOSE. The play route defaults to public mode, where the suited figure talks instead of
killing, so a drive cannot be interrupted by a capture yanking the player back to spawn mid-assertion.
The listeners under test are identical in both modes.
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
    # a fresh context: this channel persists its progress per mode under mbs-corgi-school-v2, and a
    # dirty profile would start the dog mid-level somewhere this script does not expect
    c = b.new_context(viewport={"width": 1280, "height": 900})
    pg = c.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.goto(BASE + "/play/corgi/", wait_until="load")
    pg.wait_for_timeout(5000)

    pos = lambda: pg.evaluate("() => ({ x: window.__corgi.player.x, z: window.__corgi.player.z, "
                              "yaw: window.__corgi.player.yaw })")
    check(pg.evaluate("() => !!(window.__corgi && window.__corgi.desks > 0)"),
          "the 3D path was taken and a level is built (%s desks)"
          % pg.evaluate("() => window.__corgi.desks"))
    check(not pg.evaluate("() => { const f = document.querySelector('#ccFallback'); return !!f && !f.hidden; }"),
          "and it is NOT showing the fallback room-picker")

    # ---- 1. the WINDOW keydown/keyup, the two most likely to be silently unbound and the two that
    # matter most: they are bound to an element that outlives every channel.
    p0 = pos()
    pg.keyboard.down("w")
    pg.wait_for_timeout(1100)
    pg.keyboard.up("w")
    pg.wait_for_timeout(200)
    p1 = pos()
    moved = abs(p1["x"] - p0["x"]) + abs(p1["z"] - p0["z"])
    check(moved > 0.3, "holding W walks the dog (moved %.2f units, x %.2f -> %.2f)"
          % (moved, p0["x"], p1["x"]))
    # keyup is the other half, and its failure mode is the nastier one: a key that never lifts walks
    # the dog forever. Measure that he STOPS.
    p2 = pos()
    pg.wait_for_timeout(700)
    p3 = pos()
    check(abs(p3["x"] - p2["x"]) + abs(p3["z"] - p2["z"]) < 0.05,
          "and releasing it stops him (drift %.3f units over 700ms)"
          % (abs(p3["x"] - p2["x"]) + abs(p3["z"] - p2["z"])))

    # ---- 2. the viewport look-drag. Press somewhere that is not the joystick or a HUD button:
    # the handler itself skips those targets on purpose.
    vp = pg.locator("#ccViewport").bounding_box()
    yaw0 = pos()["yaw"]
    pg.mouse.move(vp["x"] + vp["width"] * 0.5, vp["y"] + vp["height"] * 0.35)
    pg.mouse.down()
    pg.mouse.move(vp["x"] + vp["width"] * 0.5 - 200, vp["y"] + vp["height"] * 0.35, steps=8)
    pg.mouse.up()
    pg.wait_for_timeout(200)
    check(abs(pos()["yaw"] - yaw0) > 0.3,
          "dragging the viewport turns the camera (yaw %.3f -> %.3f)" % (yaw0, pos()["yaw"]))

    # ---- 3. the tap-to-set joystick (0905 G2: a heading that PERSISTS after release), then its
    # dead-centre stop. A held-and-released drag would prove nothing here; the whole point of the
    # rewrite was that the dog keeps walking after the pointer lifts.
    joy = pg.locator("#ccJoy").bounding_box()
    j0 = pos()
    pg.mouse.click(joy["x"] + joy["width"] * 0.5, joy["y"] + joy["height"] * 0.06)   # push "up" = forward
    pg.wait_for_timeout(900)
    j1 = pos()
    walked = abs(j1["x"] - j0["x"]) + abs(j1["z"] - j0["z"])
    check(walked > 0.2, "a tap in the joystick ring sets a heading that persists after release (%.2f units)" % walked)
    pg.mouse.click(joy["x"] + joy["width"] * 0.5, joy["y"] + joy["height"] * 0.5)    # dead centre = stop
    pg.wait_for_timeout(600)
    j2 = pos()
    pg.wait_for_timeout(600)
    j3 = pos()
    check(abs(j3["x"] - j2["x"]) + abs(j3["z"] - j2["z"]) < 0.05,
          "and a dead-centre tap stops him (drift %.3f)" % (abs(j3["x"] - j2["x"]) + abs(j3["z"] - j2["z"])))

    # ---- 4. the two HUD buttons, each of which reports its own state back through aria-pressed
    pg.click("#ccFlashBtn")
    pg.wait_for_timeout(150)
    check(pg.evaluate("() => document.querySelector('#ccFlashBtn').getAttribute('aria-pressed')") == "true",
          "the FLASHLIGHT button turns the light on")
    # SPRINT, and this one needed care. The button's own pointerdown listener IS bound and DOES fire -
    # but the viewport's pointerdown handler runs next and calls setPointerCapture on the viewport,
    # which retargets the pointer and fires pointerout/pointerleave on the button in the same gesture,
    # and the leave handler puts aria-pressed straight back to "false". Measured event order on the
    # button: pointerdown, pointerout, pointerleave. So a naive "is it pressed after 150ms" check reads
    # false and looks exactly like a dead listener. It is not: verified identical on the pre-conversion
    # inline build, so the BUTTON path is a pre-existing defect (the viewport skips joy, flashBtn and
    # readBtn in that handler and was never given sprintBtn), recorded in the packet 14 backlog.
    # What is asserted here instead: the listener fires (read from inside a probe listener registered
    # after the channel's, so it sees what the channel just wrote), and the sprint that DOES work -
    # holding Shift - actually makes the dog faster.
    pg.evaluate("""() => { const b = document.querySelector('#ccSprintBtn'); window.__pressedAtDown = null;
        b.addEventListener('pointerdown', () => { window.__pressedAtDown = b.getAttribute('aria-pressed'); }); }""")
    sprint = pg.locator("#ccSprintBtn").bounding_box()
    pg.mouse.move(sprint["x"] + sprint["width"] / 2, sprint["y"] + sprint["height"] / 2)
    pg.mouse.down(); pg.wait_for_timeout(120); pg.mouse.up(); pg.wait_for_timeout(120)
    check(pg.evaluate("() => window.__pressedAtDown") == "true",
          "the SPRINT button's pointerdown listener is bound and fires (pressed at down=%s)"
          % pg.evaluate("() => window.__pressedAtDown"))

    def walk(mods):
        """Teleport to spawn - the documented use of this hook - then walk 900ms and return the distance."""
        pg.evaluate("() => { const p = window.__corgi.player; p.x = 1; p.z = 0; p.yaw = -Math.PI / 2; p.pitch = 0; }")
        pg.wait_for_timeout(1400)          # let stamina recover between the two runs
        a = pos()
        for m in mods: pg.keyboard.down(m)
        pg.keyboard.down("w"); pg.wait_for_timeout(900); pg.keyboard.up("w")
        for m in mods: pg.keyboard.up(m)
        pg.wait_for_timeout(150)
        z = pos()
        return abs(z["x"] - a["x"]) + abs(z["z"] - a["z"])

    plain = walk([])
    fast = walk(["Shift"])
    check(fast > plain * 1.25,
          "and holding Shift genuinely sprints (%.2f units vs %.2f walking)" % (fast, plain))

    # ---- 5. the timecode interval, which is the one ctx.interval in the channel
    tc0 = pg.evaluate("() => document.querySelector('#ccTC').textContent")
    pg.wait_for_timeout(2200)
    tc1 = pg.evaluate("() => document.querySelector('#ccTC').textContent")
    check(tc0 != tc1, "the timecode is running (%s -> %s)" % (tc0, tc1))

    # ---- 6. the book: READ THE PAPER, its own keyboard, and BACK TO THE HALL
    pg.click("#ccReadBtn")
    pg.wait_for_timeout(300)
    check(pg.evaluate("() => document.querySelector('#cc').dataset.view") == "book",
          "READ THE PAPER opens the newspaper")
    # The keydown is bound to #ccBook, which is a role="group" div with no tabindex - focusing IT does
    # nothing, and a key pressed at the body never reaches the listener. The real path is a control
    # INSIDE the book, from which the event bubbles up: #ccCornerNext is a real button in that subtree.
    # Getting this wrong reported a dead listener on a live one the first time this file ran.
    pg.focus("#ccCornerNext")
    pg.keyboard.press("ArrowRight")
    pg.wait_for_timeout(300)
    turned = pg.evaluate("() => document.querySelector('#ccAnnounce').textContent")
    check("Page 2 of 5" in turned, "and an arrow key inside the book turns the page (%r)" % turned[:44])
    pg.click("#ccNext")
    pg.wait_for_timeout(300)
    after = pg.evaluate("() => document.querySelector('#ccAnnounce').textContent")
    check("Page 3 of 5" in after, "and the PAGE button turns it again (%r)" % after[:44])
    pg.click("#ccBackHunt")
    pg.wait_for_timeout(300)
    check(pg.evaluate("() => document.querySelector('#cc').dataset.view") == "hunt",
          "and BACK TO THE HALL returns to the hunt")

    clean = [e for e in errs if "favicon" not in e and "jsdelivr" not in e.lower()]
    check(not clean, "no page errors across the drive (%s)" % (clean[:2] or "none"))
    b.close()

print("\n%s" % ("3D PATH DRIVES" if ok else "3D PATH BROKEN"))
raise SystemExit(0 if ok else 1)
