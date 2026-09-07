# -*- coding: utf-8 -*-
"""The participation-event gate (Stage 2 packet 2.24 / PLAN-r9 C010).

C010 asks for an event adapter carrying channel / episode / event / session id for `start`,
`milestone`, `artifact_saved` and `participation_*`. 2.24's acceptance is narrower and harder:
*participation events are recorded for non-completion interactions and verified in state*.

So the centre of this file is not the adapter's unit behaviour, it is the readback: a visitor who
lands on a real channel and keeps an answer, and never finishes a game, must leave a record of having
taken part - and `completion()` must still say they finished nothing, at the same instant. A gate that
only proved events exist would pass a build where every event was `milestone`, which would measure
exactly the completion 2.24 exists to look past.

Three things this gate is deliberately built to catch:

  * an episode read from the VISITOR'S clock instead of the show's. The episode is a property of the
    broadcast; a visitor in Tokyo on Thursday morning is watching Wednesday's episode. The same five
    calendar instants are asserted from two timezones and the answers must be identical, which no
    amount of local-time arithmetic can fake.
  * `start` recorded inside the module path. Three channels are still unconverted fragments, so an
    event recorded after the dynamic import would silently measure nothing for them. The legacy mount
    is driven here explicitly, with a channel that HAS no module.
  * anything leaving the browser. This is a local log by design (C008), and an event adapter is the
    easiest place in the codebase to quietly grow a beacon. Every request the drives make is watched.

Run:  python tools/check_events.py     (serves the repo itself; nothing else need be running)
"""
import functools, json, os, threading
from datetime import datetime, timezone
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")


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


# ---- the episode cases -----------------------------------------------------------------------------
# The show airs Wednesdays in America/Los_Angeles (tv.js's SHOW, dated by C009), so the episode label is
# the Wednesday that opened the broadcast week the instant falls in. Each case is here for one reason:
# Every case has to be chosen so a WRONG answer is a DIFFERENT answer, which for a weekly label means
# the instant must sit near the week's own boundary. A Thursday-in-Tokyo / Wednesday-in-LA pair reads
# like a good zone test and is not one: both step back to the same Wednesday, so it passes whichever
# zone is used. The two half-past-midnight cases below are the ones that carry this section - each is
# thirty minutes from a Tuesday/Wednesday turnover in Los Angeles, so reading the clock in the visitor's
# zone, or with the wrong DST offset, moves the answer by a whole week rather than not at all.
CASES = [
    # (instant, expected episode, why this instant)
    ("2026-09-07T12:00:00Z", "2026-09-02", "a plain Monday falls back to the week's Wednesday"),
    ("2026-09-09T20:00:00Z", "2026-09-09", "Wednesday itself is its own episode"),
    # 00:30 Wednesday PDT: the first half hour of a new episode. Read as PST it is 23:30 TUESDAY and
    # the answer is last week's show.
    ("2026-09-09T07:30:00Z", "2026-09-09", "the first half hour of the week, on the PDT side"),
    # 23:30 Tuesday PST, three days after DST ended: the last half hour of the old episode. Read as a
    # fixed -7 it is 00:30 WEDNESDAY and the answer jumps a week forward. Read in UTC or in Tokyo it is
    # already Wednesday afternoon and it jumps a week too - so this one case fails BOTH mistakes.
    ("2026-11-04T07:30:00Z", "2026-10-28", "the last half hour of the week, on the PST side of the DST change"),
    ("2026-10-01T12:00:00Z", "2026-09-30", "stepping back across the 1st of a month"),
    ("2027-01-01T12:00:00Z", "2026-12-30", "stepping back across the 1st of a year"),
]

FOUR_IDS = ["event", "channel", "episode", "session"]

with sync_playwright() as pw:
    b = pw.chromium.launch()

    # ---------------------------------------------------------------------------------------------
    print("== the episode is the SHOW's broadcast week, not the visitor's calendar")
    seen = {}
    for tz in ("UTC", "Asia/Tokyo"):
        ctx = b.new_context(timezone_id=tz)
        pg = ctx.new_page()
        pg.goto(BASE + "/tv/", wait_until="load")
        pg.wait_for_timeout(150)
        got = []
        for iso, want, why in CASES:
            v = pg.evaluate("(s) => window.MBS_STATE.episodeFor(new Date(s))", iso)
            got.append(v)
            check(v == want, "%s: %s -> %s (%s)" % (tz, iso, want, why) + ("" if v == want else "  GOT %r" % v))
        seen[tz] = got
        ctx.close()
    check(seen["UTC"] == seen["Asia/Tokyo"],
          "the same six instants give the same six episodes from UTC and from Tokyo")

    # The wiring, not the arithmetic: what recordEvent() actually stamps, with the browser's own clock
    # fixed. clock.set_fixed_time fakes Date and leaves timers real (clock.install would freeze the
    # shell's 900ms warm-up forever) - 2.23's finding, reused.
    ctx = b.new_context(timezone_id="Asia/Tokyo")
    pg = ctx.new_page()
    pg.clock.set_fixed_time(datetime(2026, 11, 4, 7, 30, 0, tzinfo=timezone.utc))
    pg.goto(BASE + "/tv/", wait_until="load")
    pg.wait_for_timeout(150)
    rec = pg.evaluate("() => window.MBS_STATE.recordEvent('start', 'fuel')")
    check(rec["episode"] == "2026-10-28",
          "recordEvent stamps the show's episode, not the visitor's date (%r)" % rec["episode"])
    ctx.close()

    # ---------------------------------------------------------------------------------------------
    print("== the adapter: four ids on every record, and a session that means a session")

    ctx = b.new_context()
    pg = ctx.new_page()
    errs = []
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(BASE + "/tv/", wait_until="load")
    pg.wait_for_timeout(150)
    pg.evaluate("() => { for (const k of Object.keys(localStorage)) localStorage.removeItem(k); }")
    pg.reload(wait_until="load")
    pg.wait_for_timeout(150)

    check(pg.evaluate("() => window.MBS_STATE.read().v") == 3, "a fresh store is schema v3")
    check(pg.evaluate("() => Array.isArray(window.MBS_STATE.read().events)"), "`events` is part of the schema")

    rec = pg.evaluate("() => window.MBS_STATE.recordEvent('milestone', 'corgi', {what: 'secret'})")
    missing = [k for k in FOUR_IDS if not rec.get(k)]
    check(not missing, "a record carries all four ids C010 names (missing: %s)" % (missing or "none"))
    check(rec["event"] == "milestone" and rec["channel"] == "corgi" and isinstance(rec["at"], (int, float)),
          "the record says which event, on which channel, and when (%r)" % ({k: rec[k] for k in FOUR_IDS},))
    check(pg.evaluate("() => window.MBS_STATE.events().length") == 1, "the record is readable back out of state")

    s1 = pg.evaluate("() => window.MBS_STATE.sessionId()")
    pg.reload(wait_until="load")
    pg.wait_for_timeout(150)
    check(pg.evaluate("() => window.MBS_STATE.sessionId()") == s1, "the session id survives a reload in the same tab")
    check(pg.evaluate("() => window.MBS_STATE.events()[0].session") == s1,
          "the event recorded before the reload still carries that session id")

    ctx2 = b.new_context()
    pg2 = ctx2.new_page()
    pg2.goto(BASE + "/tv/", wait_until="load")
    pg2.wait_for_timeout(150)
    check(pg2.evaluate("() => window.MBS_STATE.sessionId()") != s1, "a new browser session gets a new session id")
    ctx2.close()

    # ---------------------------------------------------------------------------------------------
    print("== the log is bounded, and the readback can be asked a question")

    pg.evaluate("() => window.MBS_STATE.clearEvents()")
    n = pg.evaluate("() => window.MBS_STATE.MAX_EVENTS")
    pg.evaluate("""(n) => { for (let i = 0; i < n + 20; i++)
        window.MBS_STATE.recordEvent('participation_probe', 'fuel', { i }); }""", n)
    log = pg.evaluate("() => window.MBS_STATE.events()")
    check(len(log) == n, "the log stops at MAX_EVENTS (%d entries for %d writes)" % (len(log), n + 20))
    check(log[0]["detail"]["i"] == 20 and log[-1]["detail"]["i"] == n + 19,
          "it is the OLDEST that are dropped, so the newest participation is the part kept (%r..%r)"
          % (log[0]["detail"]["i"], log[-1]["detail"]["i"]))

    pg.evaluate("() => window.MBS_STATE.clearEvents()")
    pg.evaluate("""() => { const S = window.MBS_STATE;
        S.recordEvent('start', 'fuel'); S.recordEvent('start', 'corgi'); S.recordEvent('milestone', 'fuel'); }""")
    check(pg.evaluate("() => window.MBS_STATE.events({channel: 'fuel'}).length") == 2, "events() filters by channel")
    check(pg.evaluate("() => window.MBS_STATE.events({event: 'start'}).length") == 2, "events() filters by event")
    check(pg.evaluate("() => window.MBS_STATE.events({event: 'start', channel: 'fuel'}).length") == 1,
          "events() ANDs the fields it is given")
    check(not errs, "no console error anywhere in the adapter's own drives (%s)" % (errs[:2] or "none"))

    # ---------------------------------------------------------------------------------------------
    print("== the other three C010 events come off the writers that already existed")

    pg.evaluate("() => { for (const k of Object.keys(localStorage)) localStorage.removeItem(k); }")
    pg.reload(wait_until="load")
    pg.wait_for_timeout(150)
    pg.evaluate("""() => { const S = window.MBS_STATE;
        S.bankUnlock('fuel'); S.bankUnlock('fuel');
        S.addArtifact({id: 'case-1', channel: 'lilboyfriend', title: 'Case file'});
        S.addArtifact({id: 'case-1', channel: 'lilboyfriend', title: 'Case file'});
        S.saveForm('corgi', {a: 1}); }""")
    kinds = pg.evaluate("() => window.MBS_STATE.events().map(e => e.event + ':' + e.channel)")
    check(kinds == ["milestone:fuel", "artifact_saved:lilboyfriend", "participation_form_saved:corgi"],
          "one event per real change, on the right channel, and a repeat writes nothing (%r)" % (kinds,))

    # ---------------------------------------------------------------------------------------------
    print("== 2.24: a REAL channel, a non-completion interaction, and the readback (the acceptance)")

    net = []
    pg.on("request", lambda r: net.append((r.method, r.url)))

    # (1) the landing. A visitor reads the card, writes a note to themselves, and never presses play.
    # tv/card.js is the writer here and it was never told about events - it calls saveDraft, which is.
    pg.goto(BASE + "/games/fuel/", wait_until="load")
    pg.wait_for_timeout(300)
    pg.evaluate("() => { for (const k of Object.keys(localStorage)) localStorage.removeItem(k); }")
    pg.reload(wait_until="load")
    pg.wait_for_timeout(300)
    boxes = pg.locator("#profileForm textarea")
    check(boxes.count() > 0, "the fuel landing really has a profile form to take part in (%d fields)" % boxes.count())
    boxes.first.fill("I am not playing today, I am just thinking about it.")
    pg.locator("#profileForm button[type=submit]").first.click()
    pg.wait_for_timeout(250)

    got = pg.evaluate("() => window.MBS_STATE.events({event: 'participation_draft_saved', channel: 'fuel'})")
    check(len(got) == 1, "keeping an answer on the fuel landing records exactly one participation event")
    if got:
        e = got[0]
        check(all(e.get(k) for k in FOUR_IDS),
              "and it carries channel/episode/event/session (%r)" % ({k: e.get(k) for k in FOUR_IDS},))
        check(e["channel"] == "fuel", "the channel id is the channel the visitor was actually on")

    # The clause that makes it a NON-completion measurement rather than a second completion counter.
    comp = pg.evaluate("() => window.MBS_STATE.completion()")
    check(comp["done"] == 0 and comp["complete"] is False,
          "at that same instant the visitor has completed nothing (%r)" % (comp,))
    check(pg.evaluate("() => window.MBS_STATE.events({event: 'milestone'}).length") == 0,
          "and no milestone was invented to represent it")

    # (2) the mount. Every channel start, through the one point both mount paths pass.
    pg.goto(BASE + "/play/fuel/", wait_until="load")
    pg.wait_for_timeout(2500)
    got = pg.evaluate("() => window.MBS_STATE.events({event: 'start', channel: 'fuel'})")
    check(len(got) >= 1, "mounting the real fuel channel records `start` (%d)" % len(got))
    if got:
        check(all(got[0].get(k) for k in FOUR_IDS),
              "the start event carries all four ids (%r)" % ({k: got[0].get(k) for k in FOUR_IDS},))
    check(pg.evaluate("() => window.MBS_STATE.completion().done") == 0,
          "arriving on a channel is participation and still not completion")

    # (3) the legacy path. sag has no module - three fragments are still unconverted - so an event
    # recorded after the dynamic import would measure nothing at all for a third of the set.
    pg.goto(BASE + "/tv/", wait_until="load")
    pg.wait_for_timeout(300)
    pg.evaluate("() => window.MBS_STATE.clearEvents()")
    res = pg.evaluate("""async () => {
        const h = document.createElement('div');
        document.body.appendChild(h);
        return await window.MBS_CH.mount('sag', h, { module: false });
    }""")
    check(res.get("legacy") is True, "sag really did take the legacy (no-module) mount path (%r)" % (res,))
    got = pg.evaluate("() => window.MBS_STATE.events({event: 'start', channel: 'sag'})")
    check(len(got) == 1, "an UNCONVERTED channel records `start` too (%d)" % len(got))

    # (4) nothing left the browser while any of that happened. The set does make ONE deliberate
    # off-origin request - three.js from jsDelivr, dynamically imported so a CDN outage degrades to
    # the flat fallback rather than a dead channel - so the assertion is not "no third party", it is
    # "no third party this repo has not already argued for", plus the two clauses that actually carry
    # the promise: nothing is POSTed, and no session id is ever put on a wire.
    # three.js from jsDelivr and the webfonts from Google: both are static assets the pages already
    # declare in markup, both are GETs of a fixed URL, and neither can carry anything about a visitor.
    ALLOWED_OFF_ORIGIN = ("https://cdn.jsdelivr.net/npm/three@",
                          "https://fonts.googleapis.com/", "https://fonts.gstatic.com/")
    sid = pg.evaluate("() => window.MBS_STATE.sessionId()")
    away = [u for m, u in net if not u.startswith(BASE) and not u.startswith(ALLOWED_OFF_ORIGIN)]
    posts = ["%s %s" % (m, u) for m, u in net if m != "GET"]
    leaked = [u for m, u in net if sid in u]
    check(not away, "every off-origin request is a declared static asset, nothing else (%s)" % (away[:2] or "none"))
    check(not posts, "nothing is POSTed anywhere - the log is local, as C008 promises (%s)" % (posts[:2] or "none"))
    check(not leaked, "the session id never appears in any URL the browser requested (%s)" % (leaked[:2] or "none"))

    ctx.close()
    b.close()

for n in notes:
    print("  " + n)
print("\n%d passed, %d failed" % (len([n for n in notes if n.startswith("PASS")]),
                                  len([n for n in notes if n.startswith("FAIL")])))
raise SystemExit(0 if ok else 1)
