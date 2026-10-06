"""Records the Little Boyfriend preview: museum gallery walk -> purple field look-down + hand reach/shrink -> a room with its
hanging name sign. Plays the real game (window.museum hooks, same route as the review scripts), marks wall-clock times, then
cuts the three beats out of the one recording with ffmpeg.

  python tools/record_lilboyfriend.py [--out tv/assets] [--shots DIR]

Writes lilboyfriend-preview.webm and lilboyfriend-game-still.png. SwiftShader WebGL, 640x400 landscape (the tile is
object-fit:cover, 2.5-3.3:1 in landscape). Takes a few minutes. Needs ffmpeg.
"""
import argparse, functools, os, shutil, subprocess, tempfile, threading, time
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
W, H = 640, 400
BYPASS = "window.MBS_LOAD={prepare:()=>Promise.resolve(),finish(){document.documentElement.removeAttribute('data-game-loading');},failed(){},ready:Promise.resolve()};"
# controls stay clickable (opacity, not display) but are invisible in the clip
HIDE = "#forward,#back,#exit,#prompt{opacity:0!important}"
BEATS = {"walk": 3.0, "field": 6.0, "sign": 2.5}   # seconds kept per beat


class _Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *a): pass


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=os.path.join(ROOT, "tv", "assets"))
    ap.add_argument("--shots", default=None)
    a = ap.parse_args()
    srv = ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(_Quiet, directory=ROOT))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = "http://127.0.0.1:%d" % srv.server_address[1]
    tmp = tempfile.mkdtemp()
    marks = {}
    with sync_playwright() as pw:
        b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
        c = b.new_context(viewport={"width": W, "height": H}, has_touch=True, is_mobile=True,
                          record_video_dir=tmp, record_video_size={"width": W, "height": H})
        c.add_init_script(BYPASS)
        p = c.new_page(); p.set_default_timeout(150000)
        T0 = time.time()
        mark = lambda k: marks.__setitem__(k, time.time() - T0)
        snap = lambda: p.evaluate("(()=>{const s=museum.snapshot();return {state:s.state,room:s.room,route:s.route,lim:s.routeLimit,seq:s.sequence,insp:s.inspected}})()")
        prompt = lambda: p.evaluate("(()=>{const e=document.getElementById('prompt');return e.classList.contains('show')?[...e.children].map(b=>b.textContent):[]})()")
        def hold(sel, secs):
            bb = p.locator(sel).bounding_box()
            p.mouse.move(bb["x"] + bb["width"] / 2, bb["y"] + bb["height"] / 2); p.mouse.down()
            p.wait_for_timeout(int(secs * 1000)); p.mouse.up()
        tap = lambda i=0: p.locator("#prompt button").nth(i).tap()
        def wait_state(pred, tries=500, ms=300):
            for _ in range(tries):
                s = snap()
                if pred(s): return s
                p.wait_for_timeout(ms)
            raise RuntimeError("timeout waiting, at %s" % snap())

        p.goto(base + "/play/lilboyfriend/", wait_until="load")
        p.wait_for_function("window.museum", timeout=90000)
        p.wait_for_timeout(1500)
        p.add_style_tag(content=HIDE)
        p.locator("#start").tap(); p.wait_for_timeout(1200)
        # beat 1: walk the gallery
        mark("walk")
        hold("#forward", 6.0)
        mark("walk_end")
        # un-recorded stretch: walk on and inspect exhibits until the last one's "tap to continue" (theft)
        t0 = time.time()
        while snap()["route"] < 20 and time.time() - t0 < 240: hold("#forward", 1.0)
        for i in range(60):
            s = snap()
            if s["seq"] or s["state"] != "explore": break
            if prompt():
                tap(); p.wait_for_timeout(600)
                if snap()["insp"] == 5:
                    tap(); break
                p.locator("#hologram").tap(); p.wait_for_timeout(300)
            hold("#forward", 0.8)
        wait_state(lambda s: s["state"] == "choice1")
        # beat 2: reach into the purple field, look down, hand shrinks
        mark("field")
        tap()
        wait_state(lambda s: s["state"] == "fieldIn")
        p.wait_for_timeout(800)
        mark("field_end")
        tap()
        wait_state(lambda s: s["state"] == "choice2")
        p.wait_for_timeout(500)
        # beat 3: enter the box, first room with its hanging sign
        tap(next(i for i, t in enumerate(prompt()) if t == "enter again"))
        wait_state(lambda s: s["state"] == "explore" and s["room"] != "gallery", 120, 400)
        mark("sign")
        p.wait_for_timeout(1800)
        os.makedirs(a.out, exist_ok=True)
        p.screenshot(path=os.path.join(a.out, "lilboyfriend-game-still.png"))
        if a.shots:
            os.makedirs(a.shots, exist_ok=True)
            p.screenshot(path=os.path.join(a.shots, "lb-still.png"))
        p.wait_for_timeout(1500)
        mark("sign_end")
        v = p.video; c.close()
        raw = os.path.join(tmp, "raw.webm"); v.save_as(raw); b.close()
    print("marks", {k: round(t, 1) for k, t in marks.items()})
    # cut each beat (the field beat is centred on the reach; the sign beat ends on the settled sign) and concat
    cuts = [("walk", marks["walk_end"] - BEATS["walk"], BEATS["walk"]),
            ("field", marks["field"], min(BEATS["field"], marks["field_end"] - marks["field"] + 2.5)),
            ("sign", marks["sign_end"] - BEATS["sign"], BEATS["sign"])]
    parts = []
    for name, ss, dur in cuts:
        f = os.path.join(tmp, name + ".webm")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", "%.2f" % ss, "-t", "%.2f" % dur, "-i", raw, "-an",
                        "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "36", "-deadline", "good", "-cpu-used", "4", f], check=True)
        parts.append(f)
    lst = os.path.join(tmp, "list.txt")
    open(lst, "w").write("".join("file '%s'\n" % f.replace("\\", "/") for f in parts))
    out = os.path.join(a.out, "lilboyfriend-preview.webm")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", out], check=True)
    print("wrote", out, os.path.getsize(out), "bytes")


if __name__ == "__main__":
    main()
