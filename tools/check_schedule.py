# -*- coding: utf-8 -*-
"""The schedule gate (PLAN-r9 Stage 2, micro-step 2.23 / C009).

2.23's acceptance is "the guide shows a concrete next action, not a static time." The old copy -
"MBS airs Wednesday at 7. 4 days. Press power." - is the static time: it is true forever, it never
names a date, it is the same sentence in Tokyo as in Las Vegas, and there is nothing to DO with it.

The trap in gating a schedule is that the answer depends on when you ask. A next-event renderer
computed from a buried Date.now() passes at 3pm and fails at 3am, so the gate would be decorative.
tv.js therefore takes `now` as an argument everywhere and reads the real clock in exactly one place,
and this gate drives the page at FIXED instants with Playwright's clock, in a chosen visitor time
zone, so every assertion below is a constant a human can check by hand:

  * the next airing is a dated instant, asserted as an exact ISO string in data-next, from four
    fixtures that each break a different way: an ordinary Tuesday, a Wednesday whose hour is already
    spent (the off-by-one that shows tonight's show forever), a November date on the far side of the
    daylight-saving change (the -7 somebody hardcodes), and New Year's Eve (the month rollover);
  * the visitor's own time is really the visitor's - the same instant reads 7:00 PM in Los Angeles
    and 11:00 AM the next day in Tokyo - and the clause is dropped, not duplicated, for a visitor
    already in the show's zone;
  * the calendar affordance is a real file: the .ics downloads, its DTSTART is the same instant as
    data-next, and it recurs weekly on Wednesday rather than dying after one show;
  * on air, the guide says so instead of advertising a show that is already playing.

Run:  python tools/check_schedule.py     (serves the repo itself; nothing else need be running)
"""
import functools, os, threading
from datetime import datetime, timezone
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")


class _Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *a): pass


_srv = ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(_Quiet, directory=ROOT))
threading.Thread(target=_srv.serve_forever, daemon=True).start()
BASE = "http://127.0.0.1:%d" % _srv.server_address[1]

ok, notes, errs = True, [], []


def check(c, m):
    global ok
    ok = ok and bool(c)
    notes.append(("PASS " if c else "FAIL ") + m)


READ = """() => {
    const n = document.getElementById('darkNote'), a = document.getElementById('darkAdd');
    return {
        state: document.getElementById('tv').dataset.state,
        next:  n.dataset.next || '',
        text:  n.textContent.replace(/\\s+/g, ' ').trim(),
        href:  a ? a.href : '',
        dl:    a ? (a.getAttribute('download') || '') : '',
    };
}"""

ICS = "async () => (await fetch(document.getElementById('darkAdd').href)).text()"


def utc(s):
    return datetime.fromisoformat(s).replace(tzinfo=timezone.utc)


def visit(browser, when, tz, want_ics=False, power_off=False):
    """Load the shell in a fresh context at a fixed instant, in a chosen visitor time zone."""
    ctx = browser.new_context(timezone_id=tz)
    ctx.clock.set_fixed_time(utc(when))
    pg = ctx.new_page()
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(BASE + "/tv/", wait_until="load")
    pg.wait_for_timeout(250)
    if power_off:
        # The set boots on during the show and off outside it, so "off by hand" is one click or two.
        pg.click("#power")
        pg.wait_for_timeout(1200)
        if pg.evaluate("() => document.getElementById('tv').dataset.state") != "off":
            pg.click("#power")
            pg.wait_for_timeout(300)
    out = pg.evaluate(READ)
    out["ics"] = pg.evaluate(ICS) if want_ics else ""
    ctx.close()
    return out


with sync_playwright() as b_pw:
    b = b_pw.chromium.launch()

    print("== an ordinary Tuesday: the guide names the next airing, dated")
    # Tue 2026-09-08, 10:00 in Los Angeles. The next show is Wed 2026-09-09, 7pm PDT.
    a = visit(b, "2026-09-08T17:00:00", "Asia/Tokyo", want_ics=True)
    check(a["state"] == "off", "off-air, the set boots dark (got %r)" % a["state"])
    check(a["next"] == "2026-09-10T02:00:00.000Z", "next airing is Wed 9 Sep 7pm PDT (got %r)" % a["next"])
    check("Wed, Sep 9, 7:00 PM PDT" in a["text"], "the show's own time is named in full (got %r)" % a["text"])
    check("Thu, Sep 10, 11:00 AM" in a["text"], "and the Tokyo visitor's local time beside it (got %r)" % a["text"])
    check("where you are" in a["text"], "the local clause is labelled as the visitor's")
    check(not any(w in a["text"] for w in ("days.", "tomorrow", "tonight")),
          "no day-counting copy survives (got %r)" % a["text"])

    print("== the calendar affordance is a file, not a sentence")
    check(a["dl"] == "mbs.ics", "the link downloads mbs.ics (got %r)" % a["dl"])
    check(a["href"].startswith("blob:"), "served from a blob, which Chrome will actually download (got %r)" % a["href"][:24])
    check("DTSTART:20260910T020000Z" in a["ics"], "the .ics starts at the same instant as data-next")
    check("DTEND:20260910T030000Z" in a["ics"], "and ends an hour later, at 8")
    check("RRULE:FREQ=WEEKLY;BYDAY=WE" in a["ics"], "and recurs weekly on Wednesday, not once")
    check(a["ics"].startswith("BEGIN:VCALENDAR\r\n") and a["ics"].endswith("END:VCALENDAR\r\n"),
          "CRLF-terminated VCALENDAR, as RFC 5545 requires")

    print("== a Wednesday whose hour is already spent rolls to next week")
    # Wed 2026-09-09, 20:30 in Los Angeles - the show ended at 8. The off-by-one here advertises a
    # show that finished half an hour ago, every Wednesday night, forever.
    c = visit(b, "2026-09-10T03:30:00", "Asia/Tokyo")
    check(c["next"] == "2026-09-17T02:00:00.000Z", "after the show, next is Wed 16 Sep (got %r)" % c["next"])
    check("Wed, Sep 16" in c["text"], "and the copy says so (got %r)" % c["text"])

    print("== November is PST, and the offset is read, not assumed")
    # Thu 2026-11-05, 12:00 in Los Angeles - past the daylight-saving change. A hardcoded -7 puts
    # this show an hour early and calls it PDT.
    d = visit(b, "2026-11-05T20:00:00", "Asia/Tokyo", want_ics=True)
    check(d["next"] == "2026-11-12T03:00:00.000Z", "next airing is Wed 11 Nov 7pm PST (got %r)" % d["next"])
    check("7:00 PM PST" in d["text"], "named as PST, an hour later in UTC than PDT would be (got %r)" % d["text"])
    check("DTSTART:20261112T030000Z" in d["ics"], "and the .ics agrees with the readback")

    print("== the month, and the year, roll over")
    # Thu 2026-12-31, 16:30 in Los Angeles. Six days on is Wed 6 Jan 2027.
    e = visit(b, "2027-01-01T00:30:00", "Asia/Tokyo")
    check(e["next"] == "2027-01-07T03:00:00.000Z", "next airing is Wed 6 Jan 2027 (got %r)" % e["next"])

    print("== a visitor in the show's own zone is not told the time twice")
    f = visit(b, "2026-09-08T17:00:00", "America/Los_Angeles")
    check(f["next"] == "2026-09-10T02:00:00.000Z", "same instant, whoever is watching (got %r)" % f["next"])
    check("Wed, Sep 9, 7:00 PM PDT" in f["text"], "the show's time is still named (got %r)" % f["text"])
    check("where you are" not in f["text"], "and the redundant local clause is dropped (got %r)" % f["text"])
    check(f["text"].count("7:00 PM") == 1, "the same time is not printed twice (got %r)" % f["text"])

    print("== on air, the guide says the show is on, not when it will be")
    # Wed 2026-09-09, 19:30 in Los Angeles: the set boots ON, so the guide is only read once the
    # visitor switches it off - and it must not then advertise a show they are interrupting.
    g = visit(b, "2026-09-10T02:30:00", "Asia/Tokyo")
    check(g["state"] == "on", "on air, the set boots already on (got %r)" % g["state"])
    h = visit(b, "2026-09-10T02:30:00", "Asia/Tokyo", power_off=True)
    check(h["state"] == "off", "and switches off when asked (got %r)" % h["state"])
    check("on air now" in h["text"], "the guide says the show is on right now (got %r)" % h["text"])
    check(h["next"] == "", "with no next-airing readback to contradict it (got %r)" % h["next"])

    print("== switching off mid-week leaves the guide, not a dead end")
    # The old copy replaced the schedule with "Off. Press power." the moment anyone used the power
    # button, so the one visitor who looked away lost the only place the schedule was written.
    i = visit(b, "2026-09-08T17:00:00", "Asia/Tokyo", power_off=True)
    check(i["state"] == "off", "the set is off (got %r)" % i["state"])
    check(i["next"] == "2026-09-10T02:00:00.000Z", "and the guide still carries the next airing (got %r)" % i["next"])
    check(i["dl"] == "mbs.ics", "and the calendar link with it")

    check(not errs, "no console errors (%s)" % (errs[:3] or "none"))
    b.close()

print()
for n in notes:
    print(n)
p = sum(1 for n in notes if n.startswith("PASS"))
print("\n%s  %d/%d" % ("PASS" if ok else "FAIL", p, len(notes)))
raise SystemExit(0 if ok else 1)
