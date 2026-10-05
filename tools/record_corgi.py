"""Records the scary Cortisol Corgi loop (dark school, crawling villain, chase) for the TV tile and game page.

  python tools/record_corgi.py [--out tv/assets] [--secs 10] [--shots DIR]

Writes corgi-preview.webm (re-encoded small with ffmpeg if available) and corgi-game-still.png.
Headless setup: SwiftShader WebGL; the download gate is bypassed with a stub window.MBS_LOAD (see drive_corgi_refresh.py).
SwiftShader is slow, so the game runs below real time; the recording is sped up to a smooth ~10 s by ffmpeg.
"""
import argparse, functools, os, shutil, subprocess, tempfile, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
BYPASS = "window.MBS_LOAD={prepare:()=>Promise.resolve(),finish(){document.documentElement.removeAttribute('data-game-loading');},failed(){},ready:Promise.resolve()};"
SAVE = "{public:{found:[[true,true,true],[false,false,false],[false,false,false]],unlocked:0,level:0,lives:3,dreamPhase:'hunt'}}"
W, H = 640, 400   # wide: the tile is object-fit:cover and 2.5-3.3:1 in landscape


class _Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *a): pass


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=os.path.join(ROOT, "tv", "assets"))
    ap.add_argument("--secs", type=float, default=6)
    ap.add_argument("--shots", default=None)
    a = ap.parse_args()
    srv = ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(_Quiet, directory=ROOT))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = "http://127.0.0.1:%d" % srv.server_address[1]
    tmp = tempfile.mkdtemp()
    with sync_playwright() as pw:
        b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"])
        c = b.new_context(viewport={"width": W, "height": H}, record_video_dir=tmp, record_video_size={"width": W, "height": H})
        c.add_init_script(BYPASS)
        pg = c.new_page()
        pg.goto(base + "/play/corgi/", wait_until="load")
        pg.wait_for_function("() => window.__corgi", timeout=30000)
        pg.evaluate("s => localStorage.setItem('mbs-corgi-school-v3', JSON.stringify(%s))" % SAVE)
        pg.reload(wait_until="load")
        pg.wait_for_function("() => window.__corgi && window.__corgi.level === 0", timeout=30000)
        pg.wait_for_timeout(1000)
        box = pg.locator("#ccViewport").bounding_box()
        pg.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 3)
        # office -> door -> break-room cut -> flashlight button -> dark school (same route as drive_corgi_refresh.py)
        pg.evaluate("() => { const c = window.__corgi; c.player.x = c.doorX - 1.6; c.player.z = 0; c.player.yaw = -Math.PI / 2; c.player.pitch = 0; }")
        pg.keyboard.down("w")
        pg.wait_for_function("() => window.__corgi.transition === 'enter'", timeout=15000)
        pg.keyboard.up("w")
        pg.wait_for_function("() => window.__corgi.transition === 'wake'", timeout=60000)
        pg.wait_for_selector("#ccTransition button:not([hidden])", timeout=10000)
        pg.click("#ccTransition button")
        pg.wait_for_function("() => window.__corgi.level === 1 && !window.__corgi.transition", timeout=10000)
        # face away until his opener ends (watched monsters freeze), then the chase starts
        pg.evaluate("() => { const p = window.__corgi.player; p.yaw = Math.PI / 2; p.pitch = 0; }")
        pg.wait_for_function("() => window.__corgi.chase.active", timeout=90000)
        # recording aids: hide the HUD (keep the CCTV REC label + timecode) and the static overlay that whites out the frame
        pg.add_style_tag(content=("#ccStatic,.cc-hint,#ccPrompt,#ccFlashBtn,#ccReadBtn,#ccSprintBtn,#ccJoy,#ccLives,#ccTally,#ccMeter,#ccMeterPct,"
                                  "#ccAnnounce,.ambience-toggle,.rail,.back,a[href*='tv'],button:not(#ccTransition button){display:none!important}"))
        # face him at 5u and crawl him toward the camera, clearly in the beam, ending on a close lunge
        pg.evaluate("() => { const c = window.__corgi; c.monster.position.x = c.player.x + 3.8; c.monster.position.z = c.player.z; }")
        pg.evaluate("""() => { const c = window.__corgi, m = c.monster.position, p = c.player; let last = performance.now();
            p.yaw = Math.atan2(p.x - m.x, p.z - m.z); p.pitch = 0.04;
            (function f(t) { const dt = Math.min(50, t - last) / 1000; last = t;
              const d = Math.hypot(m.x - p.x, m.z - p.z); if (d > 1.6) { m.x -= (m.x - p.x) / d * 0.5 * dt; m.z -= (m.z - p.z) / d * 0.5 * dt; }
              p.yaw = Math.atan2(p.x - m.x, p.z - m.z); requestAnimationFrame(f); })(last); }""")
        pg.wait_for_timeout(300)
        pg.wait_for_function("() => { const c = window.__corgi; return Math.hypot(c.monster.position.x - c.player.x, c.monster.position.z - c.player.z) < 2.5; }", timeout=60000)
        if a.shots:
            os.makedirs(a.shots, exist_ok=True)
            pg.screenshot(path=os.path.join(a.shots, "scary-frame.png"))
        pg.screenshot(path=os.path.join(a.out, "corgi-game-still.png"))
        pg.wait_for_timeout(1800)
        v = pg.video
        c.close()
        raw = os.path.join(tmp, "raw.webm")
        v.save_as(raw)
        b.close()
    out = os.path.join(a.out, "corgi-preview.webm")
    if shutil.which("ffmpeg"):
        # keep the last `secs` seconds (the dark school), strip the lobby/cutscene lead-in
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-sseof", "-%g" % a.secs, "-i", raw, "-an",
                        "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "36", "-deadline", "good", "-cpu-used", "4", out], check=True)
    else:
        shutil.copy(raw, out)
    print("wrote", out, os.path.getsize(out), "bytes")


if __name__ == "__main__":
    main()
