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

D.1.10 (C018) rides here too, in section 9, and corgi is the first of the six callers whose terminal is
NOT its unlock site: markLevelComplete() banks the ARG node on the third page of the last level and the
channel keeps going, so the run's real end is the vent form on the anchor's own record. That makes the
matched half the whole point of the row, and it takes TWO runs, because mbs-shim.js:124's transitional
emission shares complete()'s guard: a run that unlocks first cannot then complete. So 9 reaches the vent
form on a restored save that never banked the node - order-independence is D.1.10's own contract - and
9b banks the node down the flat floor plan and never answers. Both assert the event's DETAIL, never the
count: while that emission lives, unlock() alone puts a GAME_COMPLETE on the wire, and {terminal:'vent'}
against {nodes,need} is the only thing that says which call made it.
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


# D.1.10: every GAME_COMPLETE this run emits, in order, WITH its detail. Copied from drive_fuel.py:70 -
# the detail is what says the emission came from complete() and not from unlock()'s transitional one.
COUNT_COMPLETE = """document.addEventListener('mbs:lifecycle', e => {
    if (e.detail && e.detail.type === 'GAME_COMPLETE')
      (window.__completes = window.__completes || []).push(e.detail.detail || {});
  }); window.__completes = [];"""

# WebGL refused, so section 9b takes the channel's documented flat path (check_play.py:71). The floor
# plan is the only way to bank the node by real input inside a driver; walking three pages down in 3D is
# not scriptable in reasonable time.
NO_WEBGL = """(() => { const g = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (t, ...a) {
    return /webgl/i.test(t) ? null : g.call(this, t, ...a); }; })()"""

# The seeded save section 8 and section 9 both run on: the last (and, in public mode, only) level's three
# pages already found, so paintLeaf4() renders the anchor's own record. Restoring found pages does NOT
# call collect(), so markLevelComplete() never runs and nothing banks the node.
SEED = """() => localStorage.setItem('mbs-corgi-school-v2', JSON.stringify({
    public: { found: [[true, true, true], [false, false, false], [false, false, false]],
              unlocked: 0, level: 0 },
    live: null }))"""


def completes(p):
    return p.evaluate("()=>window.__completes.slice()")


def terminals(p):
    """Only the completions a channel's own complete() could have made. unlock()'s transitional emission
    carries {nodes,need} and no terminal, so this is what tells the two apart while both exist."""
    return [d for d in completes(p) if d.get("terminal")]


def banked(p):
    return p.evaluate("()=>{try{return window.MBS_STATE.unlockedActive().includes('corgi')}"
                      "catch(e){return false}}")


with sync_playwright() as pw:
    b = pw.chromium.launch()
    # a fresh context: this channel persists its progress per mode under mbs-corgi-school-v2, and a
    # dirty profile would start the dog mid-level somewhere this script does not expect
    c = b.new_context(viewport={"width": 1280, "height": 900})
    pg = c.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.add_init_script(COUNT_COMPLETE)      # before the first goto, and it survives section 8's reload
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

    # ---- 7. C035: the newspaper pauses the WORLD, not just the keyboard.
    # The bug's exact shape is a key that is ALREADY DOWN when the book goes up: the keydown gate only ever
    # refused NEW keys, and the frame loop had no view gate at all, so behind the paper the dog kept walking,
    # kept sprinting his stamina away and kept burning the flashlight. So the book is opened here mid-hold,
    # never after a release. Every one of the three clocks is measured TWICE - once in the hall, where it has
    # to move, and once behind the paper, where it must not. A one-sided "unchanged" assertion would pass just
    # as happily on a channel whose render loop had died outright, which is the failure this must not confuse.
    print("\n  -- 7. C035: with the paper up, the hall stops")

    def prop(sel, name):
        return float(pg.evaluate("([s, n]) => document.querySelector(s).style.getPropertyValue(n) || '0'",
                                 [sel, name]))

    # The light has been on since section 4 and drains at 2.4/sec; cycle it off first so there is real charge
    # left to measure a drain against (setFlash refuses to light below 3%, which would read as a dead button).
    if pg.evaluate("() => document.querySelector('#ccFlashBtn').getAttribute('aria-pressed')") == "true":
        pg.click("#ccFlashBtn")
    pg.evaluate("() => { const p = window.__corgi.player; p.x = 1; p.z = 0; p.yaw = -Math.PI / 2; p.pitch = 0; }")
    pg.wait_for_timeout(2600)          # recharges the battery AND lets stamina return to full
    pg.click("#ccFlashBtn")
    check(pg.evaluate("() => document.querySelector('#ccFlashBtn').getAttribute('aria-pressed')") == "true",
          "the flashlight is lit going in")

    # WINDOW LENGTHS, and they are not arbitrary. Headless rAF here delivers ~5-12fps, and frame() clamps dt
    # to 50ms, so every clock integrates roughly a QUARTER of wall time: the battery falls ~0.6/sec against a
    # nominal 2.4, and --bat is written as an integer, so a one-second window cannot resolve a drain at all.
    # 4 seconds can. The battery control is measured standing still, on purpose - the light burns whether or
    # not the dog walks, and a 4-second sprint would put him far enough down the corridor to trip a pickup,
    # which opens the book by itself and would decide the next assertion for it.
    b0 = prop("#ccBatFill", "--bat")
    pg.wait_for_timeout(4000)
    b1 = prop("#ccBatFill", "--bat")
    check(b1 < b0, "standing still in the hall, the lit flashlight burns battery (%.0f -> %.0f)" % (b0, b1))

    h0, s0 = pos(), prop("#ccStamFill", "--stam")
    pg.keyboard.down("Shift"); pg.keyboard.down("w")
    pg.wait_for_timeout(900)
    h1, s1 = pos(), prop("#ccStamFill", "--stam")
    hall = abs(h1["x"] - h0["x"]) + abs(h1["z"] - h0["z"])
    check(hall > 0.2, "a held Shift+W walks the dog (%.2f units)" % hall)
    check(s1 < s0 - 2, "and burns stamina (%.0f -> %.0f)" % (s0, s1))

    pg.click("#ccReadBtn")             # both keys still down. The viewport's pointerdown handler skips readBtn.
    pg.wait_for_timeout(200)
    check(pg.evaluate("() => document.querySelector('#cc').dataset.view") == "book",
          "the paper goes up with both keys still held")
    # Stamina enters this window already spent, which is what makes "frozen" mean anything: at a full 100 it
    # is clamped and would sit still even on the broken build.
    r0, pb0, ps0 = pos(), prop("#ccBatFill", "--bat"), prop("#ccStamFill", "--stam")
    pg.wait_for_timeout(4000)
    r1, pb1, ps1 = pos(), prop("#ccBatFill", "--bat"), prop("#ccStamFill", "--stam")
    drift = abs(r1["x"] - r0["x"]) + abs(r1["z"] - r0["z"])
    check(drift < 0.02, "and behind it the dog does not move (%.3f units over 4s of held keys)" % drift)
    check(ps1 == ps0, "stamina is frozen, neither burning nor recovering (%.0f -> %.0f)" % (ps0, ps1))
    check(pb1 == pb0, "and the flashlight battery is frozen (%.0f -> %.0f)" % (pb0, pb1))

    pg.keyboard.up("w"); pg.keyboard.up("Shift")
    pg.click("#ccBackHunt")
    pg.wait_for_timeout(300)
    check(pg.evaluate("() => document.querySelector('#cc').dataset.view") == "hunt",
          "BACK TO THE HALL puts the paper down")
    q0 = pos()
    pg.keyboard.down("w"); pg.wait_for_timeout(700); pg.keyboard.up("w")
    pg.wait_for_timeout(150)
    q1 = pos()
    back = abs(q1["x"] - q0["x"]) + abs(q1["z"] - q0["z"])
    check(back > 0.2, "and the world runs again on the other side of it (%.2f units)" % back)

    # ---- 8. C032: the citation, read back off the RENDERED newspaper rather than out of corgi.js. The source
    # is not its own witness (drive_girlfriend.py, section 11): a record and what the visitor is shown drifting
    # apart is the whole failure here, and it is exactly what corgi.html's header comment had done.
    # The save is seeded through evaluate + reload, never add_init_script, which fires on EVERY navigation.
    print("\n  -- 8. C032: the 800M page names its edition and its scenario, on screen")
    pg.evaluate(SEED)
    pg.reload(wait_until="load")
    pg.wait_for_timeout(5000)
    pg.click("#ccReadBtn")
    pg.wait_for_timeout(400)
    leaf = lambda i: pg.evaluate("(i) => document.querySelector('#ccLeaf' + i + ' .face.front').textContent", i)
    mail = leaf(1)
    check("800 million" in mail, "the found MAIL ROOM page is on leaf 1 and prints its statistic")
    check("2017" in mail, "and the year of the edition it came from (2017)")
    check("Jobs Lost, Jobs Gained" in mail, "and the report by name")
    check("400" in mail and "scenario" in mail,
          "and that 800M is the top of a 400-800M range, labelled as a scenario")
    check("generative AI could displace up to 800" not in mail,
          "the old undated flat 'generative AI could displace up to 800 million' claim is gone")
    for i in (2, 3):
        check("2023" in leaf(i) and "July 2023" in leaf(i),
              "leaf %d carries its own McKinsey edition date" % i)

    head = open(os.path.join(ROOT, "tv", "channels", "corgi.html"), encoding="utf-8").read()[:5000]
    for stale in ["Goldman Sachs Mar 2023", "WEF Future of Jobs Report", "Pew Research Jun 2026"]:
        check(stale not in head, "the header comment no longer claims %r is cited on this page" % stale)
    check("Jobs Lost, Jobs Gained" in head and "C032" in head,
          "and it names what IS cited, and why it changed")

    # ---- 9. D.1.10 (C018): the vent form is the terminal. Still on section 8's seeded save, so the
    # anchor's own record is rendered and the book is open at page 1 - and nothing this session has
    # banked the node, which is exactly the run that can prove the new call, because unlock() has not
    # yet spent the shared guard on the transitional emission.
    print("\n  -- 9. C018: the run ends when the dog is answered, not when the node is banked")
    check(completes(pg) == [], "a restored run that has read nothing has completed nothing")
    check(not banked(pg), "and has banked no ARG node - complete() and unlock() are order-independent")

    for _ in range(4):                      # front page -> three pages -> the record
        pg.click("#ccNext")
        pg.wait_for_timeout(220)
    at = pg.evaluate("() => document.querySelector('#ccAnnounce').textContent")
    check("Page 5 of 5" in at, "turning to the back page puts the anchor's own record in front (%r)" % at[:52])
    check(terminals(pg) == [], "and reading it to the end still completes nothing")

    # The scan is decorative and the name is optional; the one required answer is which AI. Typing it is
    # not answering it - sampled here as well as at the end, so an emission on input could not hide.
    pg.fill("#ventAI", "the scheduler")
    pg.wait_for_timeout(150)
    check(terminals(pg) == [], "typing an answer is not submitting one")

    # Submitted from the keyboard, and not out of neatness: #ccBook floats on an infinite ccFloat
    # keyframe (corgi.html:161), so NOTHING inside the newspaper is ever "stable" and a pointer click on
    # #ventBtn retries until it times out. fill() and focus() have no stability check; click() does.
    # Enter in a required text input with a submit button present is implicit form submission - the same
    # handler, by real input, and it is how most people would actually answer the dog.
    pg.focus("#ventAI")
    pg.keyboard.press("Enter")
    pg.wait_for_timeout(500)
    done = completes(pg)
    check(len(done) == 1, "answering emits exactly one GAME_COMPLETE: %d" % len(done))
    check(bool(done) and done[0].get("terminal") == "vent",
          "carrying vent as the terminal, so it came from complete() and not from unlock()'s "
          "transitional emission: %s" % (done[0] if done else None))
    check(pg.evaluate("() => document.querySelector('#ventBtn').textContent") == "THE DOG HEARD YOU",
          "and the dog heard it - the form's own handler ran, which is where the call lives")
    check(not banked(pg),
          "completing banked NO ARG node: the vent form is the run's end, not the channel's secret")
    check(pg.evaluate("""()=>{window.MBS.complete('corgi',{terminal:'vent'});
        return window.__completes.length;}""") == 1,
          "and a direct second complete() for the site is a no-op - once per site per session")

    # ---- 9b. The matched half, and it needs its own run: mbs-shim.js:124's transitional emission shares
    # complete()'s guard, so a session that banks the node cannot afterwards complete. Down the flat floor
    # plan, by real clicks, collect() -> markLevelComplete() -> unlock("corgi"). The vent form is never
    # touched. The COUNT here is 1, not 0 - that one is the transitional emission, and it is precisely why
    # every row above reads the detail. When caller six removes it this run goes to 0 and the row still
    # passes unchanged; nothing here has to be rewritten for that packet.
    print("\n  -- 9b. the matched half: banking the node is not finishing the run")
    c2 = b.new_context(viewport={"width": 1280, "height": 900})
    p2 = c2.new_page()
    p2.on("pageerror", lambda e: errs.append(str(e)))
    p2.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    p2.add_init_script(COUNT_COMPLETE)
    p2.add_init_script(NO_WEBGL)
    p2.goto(BASE + "/play/corgi/", wait_until="load")
    p2.wait_for_timeout(3000)
    check(p2.evaluate("() => { const f = document.querySelector('#ccFallback'); return !!f && !f.hidden; }"),
          "WebGL refused, so the floor plan is showing")
    rooms = p2.locator("#ccFbMap button:not(.locked)")
    for _ in range(rooms.count()):
        p2.locator("#ccFbMap button:not(.locked):not(.found)").first.click()
        p2.wait_for_timeout(600)
        if banked(p2):
            break
    p2.wait_for_timeout(1200)
    check(banked(p2), "walking the floor plan to the third page banks the ARG node")
    check(terminals(p2) == [],
          "and the run has completed NOTHING - it never reached the vent form (%s)" % completes(p2))
    check(p2.evaluate("() => !document.querySelector('#ventForm') "
                      "|| !document.querySelector('#ventBtn').disabled"),
          "the dog is still waiting to be answered - nothing pressed that button")
    c2.close()

    clean = [e for e in errs if "favicon" not in e and "jsdelivr" not in e.lower()]
    check(not clean, "no page errors across the drive (%s)" % (clean[:2] or "none"))
    b.close()

print("\n%s" % ("3D PATH DRIVES" if ok else "3D PATH BROKEN"))
raise SystemExit(0 if ok else 1)
