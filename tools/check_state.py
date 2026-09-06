# -*- coding: utf-8 -*-
"""The versioned-state gate (PLAN-r8 D.1.2, Stage 2 packet 2 / micro-steps 2.5-2.8).

Covers tv/state.js: the write/read path, the migration from mbs-unlock / mbs-forms / mbs-unlock-at
(corrected against r8's own table - mbs-forms lands in `submissions`, never `drafts`, and
mbs-unlock-at is the one top-level `armedAt` scalar, never a per-channel map), corruption quarantine
and rollback, and active-set completion (C004).

Run:  python tools/check_state.py     (serves the repo itself; nothing else need be running)
"""
import functools, json, os, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")


class _Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *a): pass


_srv = ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(_Quiet, directory=ROOT))
threading.Thread(target=_srv.serve_forever, daemon=True).start()
BASE = "http://127.0.0.1:%d" % _srv.server_address[1]

ACTIVE = ["fuel", "lilboyfriend", "djscratch", "corgi"]   # window.MBS_CHANNELS.active, read from the manifest today

ok, notes = True, []
def check(c, m):
    global ok
    ok = ok and bool(c)
    notes.append(("PASS " if c else "FAIL ") + m)


def seed(pg, page_errs, legacy=None, state_raw=None):
    """Clear all mbs-* storage, plant exactly the given legacy/raw-state keys, then reload so state.js's
    IIFE re-runs from scratch - the same as a fresh visitor whose browser holds only these bytes."""
    pg.evaluate("""() => { for (const k of Object.keys(localStorage)) localStorage.removeItem(k); }""")
    if legacy:
        pg.evaluate("(l) => { for (const k in l) if (l[k] !== null) localStorage.setItem(k, l[k]); }", legacy)
    if state_raw is not None:
        pg.evaluate("(s) => localStorage.setItem('mbs-state', s)", state_raw)
    page_errs.clear()
    pg.reload(wait_until="load")
    pg.wait_for_timeout(150)
    return [e for e in page_errs if "favicon" not in e]


with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page()
    page_errs = []
    pg.on("console", lambda m: page_errs.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: page_errs.append(str(e)))
    pg.goto(BASE + "/tv/", wait_until="load")
    pg.wait_for_timeout(150)

    print("== 2.5 write path, reload, read path, version present")
    st = pg.evaluate("() => !!window.MBS_STATE")
    check(st, "window.MBS_STATE exists on /tv/")
    pg.evaluate("""() => { const s = window.MBS_STATE.read(); s.channels.fuel.secret.earned = true;
        s.channels.fuel.secret.earnedAt = 12345; window.MBS_STATE.write(s); }""")
    pg.reload(wait_until="load"); pg.wait_for_timeout(150)
    after = pg.evaluate("() => window.MBS_STATE.read()")
    check(after.get("v") == 2, "version field present after reload (v=%r)" % after.get("v"))
    check(after["channels"]["fuel"]["secret"]["earned"] is True and after["channels"]["fuel"]["secret"]["earnedAt"] == 12345,
          "the write survives a reload-read")

    print("== 2.6 migration fixtures (one per legacy shape found in the tree)")

    errs = seed(pg, page_errs, legacy={"mbs-unlock": json.dumps(ACTIVE), "mbs-forms": None, "mbs-unlock-at": None})
    s = pg.evaluate("() => window.MBS_STATE.read()")
    check(not errs, "mbs-unlock fixture: no console error")
    check(all(s["channels"][c]["secret"]["earned"] for c in ACTIVE),
          "mbs-unlock (array of ids, tv.js:186 / mbs-shim.js:117) -> channels[id].secret.earned=true for each")

    errs = seed(pg, page_errs, legacy={"mbs-unlock": None, "mbs-forms": json.dumps({"fuel": {"a": 1}}), "mbs-unlock-at": None})
    s = pg.evaluate("() => window.MBS_STATE.read()")
    check(s["submissions"].get("fuel") == {"a": 1} and not s["drafts"],
          "mbs-forms object payload (tv.js:229 / mbs-shim.js:154-155) -> submissions[id], never drafts")
    check(s["channels"]["fuel"]["form"]["status"] == "saved_here", "form.status -> saved_here")

    errs = seed(pg, page_errs, legacy={"mbs-unlock": None, "mbs-forms": json.dumps({"corgi": True}), "mbs-unlock-at": None})
    s = pg.evaluate("() => window.MBS_STATE.read()")
    check(s["submissions"].get("corgi", "MISSING") is None,
          "mbs-forms literal true (tv.js:229: f[site]=data||true) -> submissions[id]=null")

    # mbs-unlock-at is set from inside the page so it matches the browser's own clock, not Python's.
    seed(pg, page_errs, legacy={"mbs-unlock": json.dumps(["fuel"])})
    pg.evaluate("""() => { localStorage.setItem('mbs-unlock-at', String(Date.now()));
        localStorage.removeItem('mbs-state'); }""")
    pg.reload(wait_until="load"); pg.wait_for_timeout(150)
    s = pg.evaluate("() => window.MBS_STATE.read()")
    check(isinstance(s.get("armedAt"), (int, float)) and s["armedAt"] > 0,
          "mbs-unlock-at (tv.js:216 / mbs-shim.js:133) within the 30s window -> top-level armedAt scalar")

    seed(pg, page_errs, legacy={"mbs-unlock": json.dumps(["fuel"])})
    pg.evaluate("""() => { localStorage.setItem('mbs-unlock-at', String(Date.now() - 60000));
        localStorage.removeItem('mbs-state'); }""")
    pg.reload(wait_until="load"); pg.wait_for_timeout(150)
    s = pg.evaluate("() => window.MBS_STATE.read()")
    check(s.get("armedAt") is None, "an expired mbs-unlock-at (>30s old) is discarded, not restored as live")

    errs = seed(pg, page_errs, legacy={"mbs-unlock": json.dumps([]), "mbs-forms": None, "mbs-unlock-at": "1"})
    check(not errs, "mbs-unlock-at with empty mbs-unlock: no console error")
    q = pg.evaluate("() => localStorage.getItem('mbs-state-quarantine')")
    check(q is not None, "mbs-unlock-at with an empty mbs-unlock is treated as corrupt and quarantined")

    before = pg.evaluate("() => localStorage.getItem('mbs-state')")
    pg.evaluate("() => window.MBS_STATE.migrate()")
    after2 = pg.evaluate("() => localStorage.getItem('mbs-state')")
    check(before == after2, "running the migration twice: the second run is a byte-identical no-op")

    print("== 2.7 corruption recovery and rollback")

    errs = seed(pg, page_errs, legacy={"mbs-unlock": json.dumps(ACTIVE)}, state_raw="not json {{{")
    check(not errs, "unparseable payload: no exception reaches the page")
    q = pg.evaluate("() => localStorage.getItem('mbs-state-quarantine')")
    check(q == "not json {{{", "quarantine key holds the original bytes, unparseable case")
    s = pg.evaluate("() => window.MBS_STATE.read()")
    check(s.get("v") == 2, "the visitor gets a fresh working v2 session, unparseable case")

    bad_version = json.dumps({"v": 1, "channels": {}, "drafts": {}, "submissions": {},
                               "facility": {"rooms": {}}, "artifacts": []})
    errs = seed(pg, page_errs, state_raw=bad_version)
    check(not errs, "wrong-version payload: no exception reaches the page")
    q = pg.evaluate("() => localStorage.getItem('mbs-state-quarantine')")
    check(q == bad_version, "quarantine key holds the original bytes, wrong-version case")
    s = pg.evaluate("() => window.MBS_STATE.read()")
    check(s.get("v") == 2, "the visitor gets a fresh working v2 session, wrong-version case")

    bad_shape = json.dumps({"v": 2, "channels": "nope", "drafts": {}, "submissions": {},
                             "facility": {"rooms": {}}, "artifacts": []})
    errs = seed(pg, page_errs, state_raw=bad_shape)
    check(not errs, "right-version wrong-shape payload: no exception reaches the page")
    q = pg.evaluate("() => localStorage.getItem('mbs-state-quarantine')")
    check(q == bad_shape, "quarantine key holds the original bytes, wrong-shape case")
    s = pg.evaluate("() => window.MBS_STATE.read()")
    check(s.get("v") == 2, "the visitor gets a fresh working v2 session, wrong-shape case")

    print("== 2.8 active-set validation (C004): a stale sag/armie entry never counts toward completion")

    seed(pg, page_errs, legacy={"mbs-unlock": json.dumps(["sag", "armie"])})
    c = pg.evaluate("() => window.MBS_STATE.completion()")
    check(c["complete"] is False and c["done"] == 0,
          "sag+armie unlocks (both non-active) do not complete the four-set (%r)" % (c,))

    seed(pg, page_errs, legacy={"mbs-unlock": json.dumps(ACTIVE)})
    c = pg.evaluate("() => window.MBS_STATE.completion()")
    check(c["complete"] is True and c["done"] == 4 and c["need"] == 4,
          "exactly the four active ids completes the four-set (%r)" % (c,))

    b.close()

for n in notes: print("  " + n)
print("\n%d passed, %d failed" % (len([n for n in notes if n.startswith("PASS")]),
                                   len([n for n in notes if n.startswith("FAIL")])))
raise SystemExit(0 if ok else 1)
