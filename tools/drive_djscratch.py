"""Drive djscratch's turntable on a clock this file controls.

3.3 packet 3 / C023, second half. The platter used to turn with `angle += VEL` where VEL was
"2.4 deg/frame" - a full spin every 2.5s at 60Hz and every 1.25s on a 120Hz display. Nothing in this
repo could catch that: check_play and check_teardown watch the channel on whatever cadence the machine
happens to run at, and at 60Hz the broken code and the fixed code paint the same picture. The defect is
only visible when frames and elapsed time DISAGREE, which they never do by accident.

So this driver disagrees on purpose. requestAnimationFrame is replaced before the page loads with a
queue that fires nothing until __pump(t) is called with a timestamp, so a "second" of animation can be
delivered in 20 frames or in 40 and the answer has to come out the same. Under the old code the two
cadences differ by exactly the ratio of their frame counts - 48 deg against 96 - so this is a gate that
fails loudly rather than one that drifts a few percent.

Playwright's own clock API is deliberately not used: install() drives rAF at a fixed 16ms internally,
which is the one cadence that cannot tell the two implementations apart.

The rest of the channel is not driven here. The rack game, breakThrough() and the unlock node are
check_play's, and the scratch jog was already elapsed-time correct before this packet.
"""
import functools, os, re, threading
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


# The frame queue. cancelAnimationFrame has to be replaced with it or channel-runtime's teardown would
# be handing ids to a native canceller that never issued them.
PUMP = """(() => {
  const q = new Map(); let next = 0;
  window.requestAnimationFrame = (fn) => { q.set(++next, fn); return next; };
  window.cancelAnimationFrame = (id) => { q.delete(id); };
  window.__pump = (t) => { const due = Array.from(q.values()); q.clear(); due.forEach(fn => fn(t)); return due.length; };
})()"""

DEG_PER_SEC = 144.0          # what tv/channels/djscratch.js declares; a full spin about every 2.5s
MAX_DT = 0.1                 # its clamp, in seconds


def angle(page):
    m = re.search(r"rotate\(([-\d.eE]+)deg\)", page.evaluate("() => document.querySelector('#platter').style.transform || ''"))
    return float(m.group(1)) if m else None


with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={"width": 1280, "height": 900})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.add_init_script(PUMP)
    pg.goto(BASE + "/play/djscratch/", wait_until="load")
    pg.wait_for_selector("#platter", timeout=10000)

    clock = [1000.0]

    def run(frames, span_ms):
        """Deliver span_ms of animation in `frames` even steps; return the degrees the platter turned."""
        before = angle(pg)
        for i in range(1, frames + 1):
            clock[0] += span_ms / float(frames)
            pg.evaluate("t => window.__pump(t)", clock[0])
        return angle(pg) - before

    # One priming pump: the first frame of a run has no previous timestamp to measure from, so it spends
    # no time. That is the loop's own rule, not an artefact of this driver.
    pg.evaluate("t => window.__pump(t)", clock[0])
    check(angle(pg) is not None, "the platter is mounted and painting a rotation")
    check(abs(angle(pg)) < 1e-9, "the first frame of a run turns nothing - there is no elapsed time yet")

    slow = run(20, 1000.0)     # 50ms a frame - a 20Hz display, or a busy one
    fast = run(40, 1000.0)     # 25ms a frame - and both are one second of wall clock
    check(abs(slow - DEG_PER_SEC) < 1.0,
          "one second at 20 frames turns %.1f deg, not %.1f (want %.0f)" % (slow, 20 * 2.4, DEG_PER_SEC))
    check(abs(fast - DEG_PER_SEC) < 1.0,
          "one second at 40 frames turns %.1f deg, not %.1f (want %.0f)" % (fast, 40 * 2.4, DEG_PER_SEC))
    check(abs(slow - fast) < 1.0,
          "the record keeps ONE speed on both cadences (%.2f deg apart)" % abs(slow - fast))

    # The deliberate ceiling: a backgrounded tab hands back one frame with a huge gap on it, and the
    # clamp is what stops the record snapping round to catch up on time nobody watched.
    jump = run(1, 5000.0)
    check(abs(jump - DEG_PER_SEC * MAX_DT) < 0.5,
          "a 5s gap in one frame is clamped to %.1f deg, not %.0f" % (jump, DEG_PER_SEC * 5))

    # And it is still a record: it keeps turning after the clamp, from the new timestamp.
    check(abs(run(10, 500.0) - DEG_PER_SEC * 0.5) < 1.0, "and it picks up again from there, at the same speed")

    clean = [e for e in errs if "favicon" not in e and "jsdelivr" not in e.lower()]
    check(not clean, "no page errors across the drive (%s)" % (clean[:2] or "none"))
    b.close()

print("\n%s" % ("TURNTABLE KEEPS TIME" if ok else "TURNTABLE BROKEN"))
raise SystemExit(0 if ok else 1)
