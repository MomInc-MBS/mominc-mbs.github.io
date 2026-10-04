"""Throwaway driver for the 2026-10-03 corgi refresh: humanoid crawling villain, quarter-speed chase, a real
break-room door, and synthesised laughter. Modelled on drive_corgi.py but rooted at THIS worktree.

Headless setup known to work: the download gate fails on a local http.server so it is bypassed by an init script,
and SwiftShader provides WebGL. window.__corgi is the channel's probe hook (door, chase, monster, player).

  python tools/drive_corgi_refresh.py
"""
import functools, math, os, threading, time
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
OUT = os.path.join(ROOT, "tools", "shots")
os.makedirs(OUT, exist_ok=True)


class _Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *a): pass


_srv = ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(_Quiet, directory=ROOT))
threading.Thread(target=_srv.serve_forever, daemon=True).start()
BASE = "http://127.0.0.1:%d" % _srv.server_address[1]

BYPASS = "window.MBS_LOAD={prepare:()=>Promise.resolve(),finish(){document.documentElement.removeAttribute('data-game-loading');},failed(){},ready:Promise.resolve()};"
AUDIO = """window.__audioLog=[];(function(){const A=window.AudioContext;
const c=A.prototype.createConvolver;A.prototype.createConvolver=function(){window.__audioLog.push('convolver');return c.apply(this,arguments)};
const p=A.prototype.createStereoPanner;A.prototype.createStereoPanner=function(){window.__audioLog.push('panner');return p.apply(this,arguments)};})();"""
SAVE = ("{public:{found:[[true,true,true],[false,false,false],[false,false,false]],unlocked:0,level:0,lives:3,dreamPhase:'hunt'}}")

ok = True


def check(cond, msg):
    global ok
    ok &= bool(cond)
    print("  %s %s" % ("PASS" if cond else "FAIL", msg), flush=True)


def shot(page, name):
    p = os.path.join(OUT, name)
    page.screenshot(path=p)
    print("  wrote", p, flush=True)


def wait_for(page, expr, timeout=20000):
    try:
        page.wait_for_function(expr, timeout=timeout)
        return True
    except Exception:
        return False


errs = []
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"])
    c = b.new_context(viewport={"width": 1440, "height": 900})
    c.add_init_script(BYPASS)
    c.add_init_script(AUDIO)
    pg = c.new_page()
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(BASE + "/play/corgi/", wait_until="load")
    check(wait_for(pg, "() => window.__corgi", 30000), "window.__corgi appears")
    pg.evaluate("s => localStorage.setItem('mbs-corgi-school-v3', JSON.stringify(%s))" % SAVE, None)
    pg.reload(wait_until="load")
    check(wait_for(pg, "() => window.__corgi && window.__corgi.level === 0 && document.querySelector('#cc').dataset.view === 'hunt'", 30000),
          "reloaded into public level 0, hunt view")
    pg.wait_for_timeout(1500)
    vp = pg.locator("#ccViewport")
    box = vp.bounding_box()
    pg.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 3)   # first gesture: starts the AudioContext
    pg.wait_for_timeout(200)

    print("1. THE DOOR")
    check(pg.evaluate("() => window.__corgi.doorX") > 20, "doorX exposed")
    pg.evaluate("() => { const c = window.__corgi; c.player.x = c.doorX - 2.3; c.player.z = 0; c.player.yaw = -Math.PI / 2; c.player.pitch = 0; }")
    pg.wait_for_timeout(600)
    check(pg.evaluate("() => !!window.__corgi.door"), "door leaf group exists in the scene (__corgi.door)")
    check(pg.evaluate("() => window.__corgi.door && window.__corgi.door.rotation.y === 0"), "leaf starts CLOSED (rotation.y == 0) with all pages found and the dog 2.3u away")
    check(pg.evaluate("() => window.__corgi.doorOpen") is False, "doorOpen is still false until approached")
    if pg.evaluate("() => window.__corgi.monster && window.__corgi.monster.visible"): shot(pg, "office-boss.png")   # standing humanoid, jacket recolour
    pg.evaluate("() => { window.__corgi.monster.visible = false; }")   # test only: keep the boss out of the door's way
    pg.wait_for_timeout(300)
    shot(pg, "door-closed.png")
    pg.evaluate("() => { const c = window.__corgi; c.player.x = c.doorX - 1.6; c.player.yaw = -Math.PI / 2; }")
    t0 = time.time(); rot = 0; opened = False
    while time.time() - t0 < 1.5:
        rot = pg.evaluate("() => window.__corgi.door.rotation.y")
        if rot < -1.5:
            opened = True; break
        pg.wait_for_timeout(50)
    check(opened, "leaf swings open: rotation.y 0 -> %.2f (< -1.5) within 1.5s (%.2fs)" % (rot, time.time() - t0))
    pg.wait_for_timeout(1200)
    check(pg.evaluate("() => window.__corgi.doorOpen") is True, "doorOpen true after the swing")
    check("swings open" in pg.inner_text("#ccAnnounce"), "announce reads: %r" % pg.inner_text("#ccAnnounce"))
    shot(pg, "door-open.png")
    pg.keyboard.down("w")
    entered = wait_for(pg, "() => window.__corgi.transition === 'enter'", 6000)
    pg.keyboard.up("w")
    check(entered, "walking forward through the open door starts transition 'enter'")

    print("2. THE DARK SCHOOL")
    check(wait_for(pg, "() => window.__corgi.transition === 'wake'", 20000), "break-room cut reaches 'wake'")
    pg.wait_for_selector("#ccTransition button:not([hidden])", timeout=10000)
    pg.click("#ccTransition button")
    check(wait_for(pg, "() => window.__corgi.level === 1 && !window.__corgi.transition", 5000), "flashlight button pressed: level 1, cutscene over")
    # she spawns facing down the hall, and a monster watched dead-on freezes (even his opener), so turn away first
    pg.evaluate("() => { const p = window.__corgi.player; p.yaw = Math.PI / 2; p.pitch = 0; }")
    check(wait_for(pg, "() => window.__corgi.chase.active", 30000), "monster enters chase mode after his opener")
    ch = pg.evaluate("() => window.__corgi.chase")
    check(abs(ch["speed"] - 0.625) < 1e-6, "CHASE_SPEED == 0.625 (got %s)" % ch["speed"])
    rig = pg.evaluate("() => { const m = window.__corgi.monster, r = m.userData.rig; return {name: m.name, keys: Object.keys(r), meshes: (()=>{let n=0;m.traverse(o=>{if(o.isMesh)n++});return n})()}; }")
    check(rig["name"] == "school-monster" and all(k in rig["keys"] for k in ["head", "neck", "torso", "armL", "armR", "legL", "legR"]),
          "monster is a rigged humanoid (%d meshes, rig keys %s)" % (rig["meshes"], rig["keys"]))

    # Headless SwiftShader renders the dark school at only a few frames a second, and the game caps its per-frame dt at
    # 50 ms, so game time runs slower than wall time and wall-clock sampling cannot measure a speed. Record the monster's
    # position at EVERY animation frame (the recorder shares the game's rAF timestamp, so its dt is the game's dt before
    # the cap) and measure in GAME time: speed = step / (min(dt, 50 ms)), over a window of 6 s of game time.
    pg.evaluate("""() => { const m = window.__corgi.monster, p = window.__corgi.player; const R = window.__rec = {gt: 0, f: [], last: null};
        (function f(t) { if (R.last !== null) { const dt = Math.min(50, t - R.last) / 1000; R.gt += dt;
            R.f.push([dt, m.position.x, m.position.z, Math.hypot(m.position.x - p.x, m.position.z - p.z)]); }
          R.last = t; requestAnimationFrame(f); })(performance.now()); }""")
    check(wait_for(pg, "() => window.__rec.gt >= 6", 180000), "recorded 6 s of game time")
    fr = pg.evaluate("() => window.__rec.f")
    d0, d1 = fr[0][3], fr[-1][3]
    check(d0 - d1 >= 1.5, "he approaches: distance %.2f -> %.2f (closed %.2f u in 6 s of game time, need >= 1.5)" % (d0, d1, d0 - d1))
    check(all(fr[i + 1][3] <= fr[i][3] + 0.02 for i in range(len(fr) - 1)), "distance never increases while she stands still (%d frames)" % len(fr))
    sp = [math.hypot(fr[i][1] - fr[i - 1][1], fr[i][2] - fr[i - 1][2]) / fr[i][0] for i in range(1, len(fr))]
    zero = [v for v in sp if v < 0.02]; moving = [v for v in sp if v >= 0.02]
    band = [v for v in moving if 0.55 <= v <= 0.70]
    print("  frames: %d, paused (sniff) frames: %d, moving frames: %d; moving speed min %.3f max %.3f u/s" % (len(sp), len(zero), len(moving), min(moving), max(moving)))
    check(len(band) >= 0.6 * len(sp), "speed in the 0.55-0.70 band on %d of %d frames (%d are sniff pauses, excluded from motion)" % (len(band), len(sp), len(zero)))
    check(len(zero) > 0, "he paused at least once (sniff) in the window")
    check(max(moving) <= 0.70, "never faster than 0.70 u/s (a quarter of 2.5, sprint-independent)")

    # face him: he must stop within 300 ms
    pg.evaluate("""() => { const c = window.__corgi, m = c.monster.position, p = c.player;
        p.yaw = Math.atan2(p.x - m.x, p.z - m.z); p.pitch = 0; }""")
    pg.wait_for_timeout(300)
    a = pg.evaluate("() => { const m = window.__corgi.monster.position; return [m.x, m.z]; }")
    pg.wait_for_timeout(700)
    b2 = pg.evaluate("() => { const m = window.__corgi.monster.position; return [m.x, m.z]; }")
    moved = math.hypot(a[0] - b2[0], a[1] - b2[1])
    check(moved < 0.03, "watched dead-on: he stops within 300 ms (moved %.3f u over the next 0.7 s)" % moved)

    # a crawl shot in the beam: 3u from him, facing him, flashlight on
    pg.evaluate("""() => { const c = window.__corgi, m = c.monster.position, p = c.player;
        let dx = p.x - m.x, dz = p.z - m.z; const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d;
        p.x = m.x + dx * 3; p.z = m.z + dz * 3; p.yaw = Math.atan2(p.x - m.x, p.z - m.z); p.pitch = 0.05; }""")
    pg.wait_for_timeout(500)
    print("  flashlight aria-pressed:", pg.get_attribute("#ccFlashBtn", "aria-pressed"))
    shot(pg, "monster-crawl.png")

    print("3. AUDIO")
    got = wait_for(pg, "() => window.__audioLog.includes('convolver') && window.__audioLog.includes('panner')", 20000)
    log = pg.evaluate("() => window.__audioLog")
    check(got, "convolver and stereo panner created in the dark level (log: %d convolver, %d panner)" % (log.count("convolver"), log.count("panner")))
    c.close(); b.close()

print("uncaught page errors:", errs[:6] if errs else "none")
print("OVERALL:", "PASS" if ok else "FAIL")
