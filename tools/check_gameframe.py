# -*- coding: utf-8 -*-
"""The game-frame gate (PLAN-r9 Stage 2 packet 6, micro-step 2.15 / C001).

Covers the five things C001 asks for, each as the failure it exists to prevent:

  the frame            a game channel offers a visible, keyboard-reachable Enter game control; the
                       network hub offers none, because the hub is not a game
  fullscreen denied    the request is refused and game mode still happens. Denial is not an error
                       path: the in-page expanded layout IS game mode, fullscreen only removes the
                       browser's own chrome on top of it
  controls not hidden  C001's check is "without losing progress OR hiding controls", so the exit
                       control and the channel drawer are measured on screen while game mode is on,
                       at desktop size and after a rotate
  progress preserved   entering and leaving must not re-mount the channel. The probe is identity, not
                       a screenshot: the same DOM node, the same expando, the same banked state
  resize contract      the renderer follows the STAGE, not the window. Game mode changes the stage's
                       box while the window's is unchanged, and every game here sizes itself on a
                       window resize, so the stage observer must produce one

Run:  python tools/check_gameframe.py     (serves the repo itself; nothing else need be running)
"""
import functools, io, os, re, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
GAME_CH = "corgi"      # a real canvas game, so the resize contract is exercised against a renderer
HUB_CH = "mominc"      # the one channel with no gameRoute


class _Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *a): pass


_srv = ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(_Quiet, directory=ROOT))
threading.Thread(target=_srv.serve_forever, daemon=True).start()
BASE = "http://127.0.0.1:%d" % _srv.server_address[1]

ok, notes = True, []


def check(c, m):
    global ok
    ok = ok and bool(c)
    notes.append(("PASS " if c else "FAIL ") + m)


def read(p):
    with io.open(os.path.join(ROOT, p), encoding="utf-8") as fh:
        return fh.read()


# Fullscreen is stubbed to REFUSE on every page below. That is the acceptance criterion, and it also
# makes the gate deterministic: a headless browser's real fullscreen behaviour is not the thing under
# test, and a browser-driven exit would fire fullscreenchange and leave game mode mid-assertion.
# On the prototype, not on documentElement: an init script runs at document start, where
# document.documentElement does not exist yet and defineProperty on it throws.
DENY_FULLSCREEN = """
  window.__fsAsked = 0;
  Element.prototype.requestFullscreen = function () {
    window.__fsAsked++;
    return Promise.reject(new Error('denied by test'));
  };
"""

print("== the source: no hand-written game list, and the flag comes from the manifest")

js = read("tv/tv.js")
check("chanRec.game" in js, "tv.js reads the game flag from window.MBS_CHANNELS, not a literal list")
check(not re.search(r'\[\s*"(corgi|fuel|djscratch|lilboyfriend|girlfriend)"', js),
      "tv.js contains no hard-coded array of game ids")
check("MBS_RT.pause(\"game\")" in js and "MBS_RT.resume(\"game\")" in js,
      "the transition uses MBS_RT's pause lifecycle rather than a private flag")
check("function sweep" not in js, "no third sweep() was written; the engine is still mbs-runtime.js")
gen = read("tools/gen_channels.py")
check('"game": bool(c.get("gameRoute"))' in gen, "gen_channels.py derives `game` from the manifest's gameRoute")

with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={"width": 1280, "height": 800})
    errs = []
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script(DENY_FULLSCREEN)

    print("== the generated flag")
    pg.goto(BASE + "/tv/", wait_until="load")
    flags = pg.evaluate("() => Object.fromEntries(window.MBS_CHANNELS.channels.map(c => [c.id, c.game]))")
    check(flags.get(GAME_CH) is True, "the manifest marks %s a game" % GAME_CH)
    check(flags.get(HUB_CH) is False, "the network hub %s is not a game" % HUB_CH)

    print("== the hub offers no game frame")
    pg.goto(BASE + "/tv/?ch=" + HUB_CH, wait_until="load")
    pg.wait_for_timeout(400)
    check(pg.evaluate("() => document.getElementById('gameKey').hidden") is True,
          "no Enter game control on a channel that is not a game")
    check(pg.evaluate("() => !!document.getElementById('gameBtn').offsetParent") is False,
          "and it is not merely transparent: it has no box at all")

    print("== a game channel: entering with fullscreen refused")
    pg.goto(BASE + "/tv/?ch=" + GAME_CH, wait_until="load")
    pg.wait_for_timeout(900)                      # the fragment is fetched, then its scripts re-created

    check(pg.evaluate("() => document.getElementById('gameKey').hidden") is False,
          "the Enter game control is present on a game channel")
    check(pg.evaluate("() => document.getElementById('gameBtn').getAttribute('aria-label')") == "Enter game",
          "it names itself for a screen reader before it is pressed")
    check(pg.evaluate("""() => {
        const b = document.getElementById('gameBtn');
        b.focus();
        return document.activeElement === b;     // a real button: reachable and focusable, not a div
    }"""), "the control is focusable, so the frame can be entered from the keyboard")

    # identity probes, planted BEFORE game mode. If entering re-mounted the channel these all die.
    pg.evaluate("""() => {
        const root = document.querySelector('#channel [data-host]') || document.getElementById('channel');
        root.__probe = 'alive';
        window.__root = root;
        window.MBS_STATE.bankUnlock('corgi');
        window.__resizes = 0;
        window.addEventListener('resize', () => window.__resizes++);
    }""")
    before = pg.evaluate("() => { const r = document.querySelector('.bezel').getBoundingClientRect(); return {w: r.width, h: r.height}; }")

    pg.click("#gameBtn")
    pg.wait_for_timeout(300)

    check(pg.evaluate("() => document.getElementById('tv').dataset.mode") == "game",
          "the click enters game mode")
    check(pg.evaluate("() => window.__fsAsked") >= 1,
          "the Fullscreen API was asked, and only from the visitor's own click")
    check(pg.evaluate("() => !document.fullscreenElement"),
          "the request was refused, so this is the in-page expanded mode")

    after = pg.evaluate("() => { const r = document.querySelector('.bezel').getBoundingClientRect(); return {w: r.width, h: r.height}; }")
    vp = pg.evaluate("() => ({w: innerWidth, h: innerHeight})")
    # not "grew in both axes": the cabinet already gives the bezel nearly the full viewport height, so
    # game mode trades ~56px of height for the gauge column, the panel column and the cabinet's own
    # padding. Area is the honest measure of what the visitor gets.
    check(after["w"] * after["h"] > before["w"] * before["h"], "the stage grew")
    check(after["w"] > before["w"], "it reclaimed the gauge and panel columns")
    check(abs(after["w"] - vp["w"]) < 2, "the stage spans the full viewport width")
    check(after["h"] >= vp["h"] * 0.88, "the stage takes the viewport height less the control strip")

    print("== the CRT furniture came off, and the controls did not")
    check(pg.evaluate("""() => ['.phosphor', '.glare', '.momlogo']
        .every(s => getComputedStyle(document.querySelector(s)).display === 'none')"""),
          "phosphor, glare and the MOM Inc bug are off the game (F.1)")
    check(pg.evaluate("() => getComputedStyle(document.querySelector('.glass')).borderRadius === '0px'"),
          "the curved tube corners are gone, so the stage is unframed")
    onscreen = """(sel) => {
        const r = document.querySelector(sel).getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= innerHeight + 1;
    }"""
    check(pg.evaluate(onscreen, "#gameBtn"), "the exit control is on screen in game mode")
    check(pg.evaluate(onscreen, "#power"), "the power key is on screen in game mode")
    check(pg.evaluate(onscreen, "#lcd"), "the channel drawer is on screen in game mode")
    check(pg.evaluate("() => document.querySelectorAll('#lcdList .lcd-card').length") > 3,
          "the drawer still lists every channel, so navigating out is one click")
    check(pg.evaluate("() => document.getElementById('gameBtn').getAttribute('aria-label')") == "Exit game",
          "the same control now reads as the exit")
    check(pg.evaluate("() => document.getElementById('gameLegend').textContent") == "EXIT",
          "and its printed legend says so too")

    print("== the renderer follows the stage")
    check(pg.evaluate("() => window.__resizes") >= 1,
          "changing the stage's box produced the resize the renderers listen for")

    print("== rotate: the phone turns sideways mid-play")
    # Through CDP rather than set_viewport_size: this chromium creates its window maximized and then
    # refuses Browser.setWindowBounds on it, and the window is not what is under test anyway. The
    # metrics override resizes the viewport the page sees, which is exactly what a rotate is.
    cdp = pg.context.new_cdp_session(pg)
    rotate = lambda w, h: cdp.send("Emulation.setDeviceMetricsOverride",
                                   {"width": w, "height": h, "deviceScaleFactor": 1, "mobile": True})
    rotate(420, 860)
    pg.wait_for_timeout(250)
    pg.evaluate("() => { window.__resizes = 0; }")
    rotate(860, 420)
    pg.wait_for_timeout(300)
    check(pg.evaluate("() => document.getElementById('tv').dataset.mode") == "game",
          "a rotate does not drop the visitor out of game mode")
    check(pg.evaluate("() => window.__resizes") >= 1, "and the renderer is told about it")
    check(pg.evaluate(onscreen, "#gameBtn"), "the exit control survives the rotate on a phone")
    check(pg.evaluate(onscreen, "#lcd"), "so does the channel drawer")
    cdp.send("Emulation.clearDeviceMetricsOverride")
    pg.wait_for_timeout(250)

    print("== exiting preserves progress")
    pg.click("#gameBtn")
    pg.wait_for_timeout(300)
    check(pg.evaluate("() => !document.getElementById('tv').dataset.mode"), "the second press leaves game mode")
    check(pg.evaluate("() => document.querySelector('#channel [data-host]') === window.__root"),
          "the channel is the SAME node: it was never re-mounted")
    check(pg.evaluate("() => window.__root.__probe") == "alive",
          "the running game kept its own state across enter and exit")
    check(pg.evaluate("() => window.MBS_STATE.unlockedActive().includes('corgi')"),
          "banked progress survived the round trip")
    check(pg.evaluate("() => getComputedStyle(document.querySelector('.phosphor')).display !== 'none'"),
          "and the CRT furniture came back on the way out")

    print("== Escape is an exit too")
    pg.click("#gameBtn")
    pg.wait_for_timeout(250)
    check(pg.evaluate("() => document.getElementById('tv').dataset.mode") == "game", "back in game mode")
    pg.keyboard.press("Escape")
    pg.wait_for_timeout(250)
    check(pg.evaluate("() => !document.getElementById('tv').dataset.mode"), "Escape leaves game mode")

    print("== game mode follows the visitor to the next game, and not to the hub")
    pg.click("#gameBtn")
    pg.wait_for_timeout(250)
    pg.goto(BASE + "/tv/?ch=djscratch", wait_until="load")
    pg.wait_for_timeout(700)
    check(pg.evaluate("() => document.getElementById('tv').dataset.mode") == "game",
          "changing to another game keeps the frame")
    pg.goto(BASE + "/tv/?ch=" + HUB_CH, wait_until="load")
    pg.wait_for_timeout(500)
    check(pg.evaluate("() => !document.getElementById('tv').dataset.mode"),
          "tuning to the network hub drops the frame, because the hub is not a game")

    # the shots for Ian, with the set ON: an off television shows the dark overlay and nothing else,
    # which proves the layout and hides the only thing worth looking at.
    pg.goto(BASE + "/tv/?ch=" + GAME_CH, wait_until="load")
    pg.evaluate("() => { try { sessionStorage.setItem('mbs-on', '1'); } catch (e) {} }")
    pg.goto(BASE + "/tv/?ch=" + GAME_CH, wait_until="load")
    pg.wait_for_timeout(2500)                     # the 900 ms warm-up, then the game's own first frames
    check(pg.evaluate("() => document.getElementById('tv').dataset.state") == "on",
          "the set is on for the shots, so the frame is photographed around a running game")
    # The shots are diagnostics, not assertions, and tools/shots/ is gitignored. Windows refuses the
    # write while an image viewer holds the file open, and a gate that goes red because someone is
    # LOOKING at last run's screenshot is a gate nobody will trust. Say so and carry on.
    def shot(fname):
        try:
            pg.screenshot(path=os.path.join(ROOT, "tools", "shots", fname))
        except OSError as e:
            notes.append("note  screenshot %s not written (%s); close it and re-run" % (fname, e.strerror))

    shot("gameframe-normal.png")
    pg.click("#gameBtn")
    pg.wait_for_timeout(1500)
    shot("gameframe-game.png")

    b.close()

print()
for n in notes:
    print(" ", n)
if errs:
    print("\n  console/page errors seen (not asserted, the channels are not under test here):")
    for e in errs[:8]:
        print("   ", e[:160])
print("\n%s  %d/%d" % ("ALL PASS" if ok else "FAILURES", sum(1 for n in notes if n.startswith("PASS")), len(notes)))
raise SystemExit(0 if ok else 1)
