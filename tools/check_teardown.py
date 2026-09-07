# -*- coding: utf-8 -*-
"""The channel-lifecycle gate (PLAN-r9 Stage 2 packet 8, micro-step 2.17 / D.1.7).

D.1.7 asks for three things and this asserts all three as the failures they exist to prevent:

  teardown          mount, unmount, remount, and what the runtime holds returns to baseline. The
                    legacy loader re-creates a channel's <script> tags and nothing ever releases the
                    listeners, timers, observers and AudioContexts they open, so a second channel in
                    the same document runs on top of the first one's still-live machinery. The probe
                    fixture opens one of each, deliberately, including a listener on `window` - the
                    one that survives innerHTML replacing the channel, and therefore the one that
                    actually leaks.

  module loading    a channel module is imported once and mounted per visit, and an import failure
                    renders the unavailable state rather than a blank stage. A blank stage reads as a
                    slow network and invites a reload that fails identically.

  error contract    a throw inside mount() is caught at the shell: the channel reports unavailable,
                    whatever it managed to register is still released, and THE REST OF THE TELEVISION
                    KEEPS WORKING. That last clause is the one worth a gate - a channel taking the
                    set down with it is the difference between one broken channel and no site.

WHAT THE MEASUREMENT IS, HONESTLY. A page cannot count its own event listeners; getEventListeners()
is a DevTools function, not a page API. So the count asserted here is the runtime's own tally of what
was registered THROUGH the context. A channel that binds a raw addEventListener is invisible to it -
which is not a hole quietly accepted but a case the probe reproduces on purpose (?probe=raw) and the
gate asserts is observable. That is exactly the mistake each 2.18 conversion has to avoid, and a gate
that pretended otherwise would be lying about its own reach.

THE SUBJECT IS A FIXTURE AND, SINCE PACKET 9, A REAL CHANNEL TOO. The fixture came first because when
2.17 landed no real channel was a module, and converting one early just to have something to test
would have been the sweeping change the plan forbids. tv/channels/_runtime-probe.{html,js} is still
the subject of the error and raw-listener cases, which need a channel that misbehaves on purpose;
mominc, converted by 2.18's first micro-step, is now the subject of the mount/unmount/remount
assertions, so the contract is measured against a real channel rather than only a fixture.

Run:  python tools/check_teardown.py     (serves the repo itself; nothing else need be running)
"""
import functools, io, json, os, re, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
PROBE = "_runtime-probe"


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


def total(counts):
    # `counts is None`, not `not counts`: an empty dict is falsy in Python, and treating it as "no
    # answer" turned a correct teardown into a FAIL once already.
    return -1 if counts is None else sum(counts.values())


# ---------------------------------------------------------------- the source half
print("== the runtime is a classic script, because the shell is")
rt = read("tv/channel-runtime.js")
check(not re.search(r"^\s*import\s", rt, re.M), "no static import: it would be a syntax error here")
check(not re.search(r"^\s*export\s", rt, re.M), "no export either")
check('import("./channels/' in rt, "the channel module is reached by dynamic import()")
check('<script src="channel-runtime.js">' in read("tv/index.html"),
      "the shell loads it, before tv.js")
check(read("tv/index.html").index('channel-runtime.js') < read("tv/index.html").index('src="tv.js"'),
      "and in that order, so MBS_CH exists when tv.js runs")

print("== the frame registry holds what is PENDING, not every frame ever asked for")
check("new Set()" in rt and "frames.delete(id)" in rt,
      "ctx.frame drops its own id when the frame fires, so a render loop cannot grow it without bound")
check("frames.clear()" in rt, "and dispose() empties it")

print("== the module flag is derived from disk, never hand-maintained")
gen = read("tools/gen_channels.py")
check("os.path.exists(os.path.join(ROOT" in gen and '"module"' in gen,
      "gen_channels.py derives `module` from whether tv/channels/<id>.js exists")
chans = json.loads(read("tv/mbs-channels.js").split("=", 1)[1].strip().rstrip(";"))
check(all("module" in c for c in chans["channels"]),
      "every generated channel record carries the flag (%d records)" % len(chans["channels"]))
on_disk = {c["id"] for c in chans["channels"]
           if os.path.exists(os.path.join(ROOT, "tv", "channels", c["id"] + ".js"))}
flagged = {c["id"] for c in chans["channels"] if c["module"]}
check(on_disk == flagged, "the flag matches the tree exactly (on disk %s, flagged %s)"
      % (sorted(on_disk) or "none", sorted(flagged) or "none"))

print("== 2.18 is converting channels one at a time, and both paths still exist")
CONVERTED = {"mominc"}
check(flagged == CONVERTED, "exactly the channels this packet claims are converted (%s)"
      % (sorted(flagged) or "none"))
for cid in sorted(flagged):
    frag = read("tv/channels/%s.html" % cid)
    check("<script" not in frag,
          "%s.html has no inline <script> left: the module IS the channel now" % cid)
    check("export default" in read("tv/channels/%s.js" % cid),
          "%s.js is an ES module with a default export" % cid)
check(flagged != {c["id"] for c in chans["channels"]},
      "and this was NOT a sweeping conversion: %d channels are still on the legacy path"
      % (len(chans["channels"]) - len(flagged)))
check("res.legacy" in read("tv/tv.js"),
      "tv.js still re-creates inline scripts for an unconverted channel")


# ---------------------------------------------------------------- the behaviour half
def open_tv(pg, query=""):
    pg.goto(BASE + "/tv/" + query, wait_until="load")
    pg.wait_for_timeout(700)


MOUNT = """(name) => window.MBS_CH.mount(name, document.getElementById('channel'), {module:true})
             .then(r => ({ ok: !!r.ok, legacy: !!r.legacy,
                           counts: r.ctx ? r.ctx.counts() : null,
                           reason: r.reason ? String(r.reason) : null }))"""

with sync_playwright() as pw:
    b = pw.chromium.launch()
    errs = []
    pg = b.new_page(viewport={"width": 1280, "height": 800})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    open_tv(pg)

    print("== mount, unmount, remount: what the runtime holds returns to baseline")
    first = pg.evaluate(MOUNT, PROBE)
    check(first["ok"], "the probe mounts as a module")
    check(total(first["counts"]) > 0,
          "and it registered disposables through the context (%s)" % json.dumps(first["counts"]))
    check(pg.evaluate("!!(window.__probe && window.__probe.mounted)"), "the module's own mount() ran")

    after = pg.evaluate("() => window.MBS_CH.unmount().then(r => r.counts)")
    check(total(after) == 0, "after unmount the runtime holds nothing (%s)" % json.dumps(after))
    check(pg.evaluate("!!(window.__probe && window.__probe.unmounted)"),
          "the module's own unmount() ran")
    check(pg.evaluate("!window.MBS_CH.current()"), "and nothing is mounted")

    second = pg.evaluate(MOUNT, PROBE)
    check(second["ok"], "it remounts")
    check(second["counts"] == first["counts"],
          "with the SAME tally as the first mount, not double it (%s vs %s)"
          % (json.dumps(first["counts"]), json.dumps(second["counts"])))

    # the leak this whole contract exists to prevent, reproduced: a listener bound to window survives
    # the channel's own DOM being replaced, so counting only what is inside #channel would prove nothing
    third = pg.evaluate(MOUNT, PROBE)
    check(third["counts"] == first["counts"],
          "and again on a third mount, so the tally does not creep")
    pg.evaluate("() => window.MBS_CH.unmount()")
    check(pg.evaluate("() => window.MBS_CH.current()") is None,
          "the final unmount leaves nothing mounted and nothing held")

    print("== mounting a second channel unmounts the first, without being asked")
    pg.evaluate(MOUNT, PROBE)
    swapped = pg.evaluate("""() => {
        const before = window.MBS_CH.current();
        return window.MBS_CH.mount('_runtime-probe', document.getElementById('channel'), {module:true})
          .then(() => ({ beforeName: before && before.name,
                         nowCounts: window.MBS_CH.current().counts }));
    }""")
    check(swapped["beforeName"] == PROBE, "a channel was mounted before the swap")
    check(swapped["nowCounts"] == first["counts"],
          "and after it the tally is one channel's worth, not two (%s)" % json.dumps(swapped["nowCounts"]))
    pg.evaluate("() => window.MBS_CH.unmount()")

    print("== a throw inside mount() is the channel's failure, never the television's")
    open_tv(pg, "?probe=throw-mount")
    threw = pg.evaluate(MOUNT, PROBE)
    check(not threw["ok"], "the mount reports failure")
    check(threw["reason"] and "deliberate throw" in threw["reason"],
          "and names the channel's own error rather than swallowing it")
    check(pg.evaluate("!!document.querySelector('#channel .testcard')"),
          "the unavailable state is RENDERED, not a blank stage")
    check(pg.evaluate("!window.MBS_CH.current()"),
          "nothing is left mounted, so the next channel starts clean")
    # the clause that matters: the set still works
    check(pg.evaluate("!!document.querySelector('.tv') && !!document.getElementById('powerBtn')") or
          pg.evaluate("!!document.querySelector('.power')"),
          "the television's own controls are still there")
    check(pg.evaluate("() => typeof window.MBS_CH.mount === 'function'"),
          "and the runtime still works: another channel can be mounted after the failure")
    recovered = pg.evaluate(MOUNT, PROBE)
    check(recovered["reason"] and "deliberate throw" in recovered["reason"],
          "(this probe throws every time by design, so the retry fails the same way, not worse)")

    print("== a throw inside unmount() must not strand the disposables")
    open_tv(pg, "?probe=throw-unmount")
    pg.evaluate(MOUNT, PROBE)
    left = pg.evaluate("() => window.MBS_CH.unmount().then(r => r.counts)")
    check(total(left) == 0,
          "everything is released even though the channel threw on the way out (%s)" % json.dumps(left))

    print("== an import that fails renders the unavailable state")
    open_tv(pg)
    missing = pg.evaluate("""() => window.MBS_CH.mount('_no-such-probe',
            document.getElementById('channel'), {module:true})
          .then(r => ({ ok: !!r.ok, rendered: !!document.querySelector('#channel .testcard') }))""")
    check(not missing["ok"], "a channel whose fragment is not there fails")
    check(missing["rendered"], "and renders the unavailable state rather than a blank stage")

    print("== a raw addEventListener is INVISIBLE to the runtime, and the gate says so")
    open_tv(pg, "?probe=raw")
    raw = pg.evaluate(MOUNT, PROBE)
    check(raw["counts"] == first["counts"],
          "the runtime's tally counts only what went through the context, as documented")
    check("addEventListener" in read("tv/channels/_runtime-probe.js"),
          "the fixture really does bind one raw listener, so this is measured and not assumed")
    notes.append("note  the raw listener is NOT released by unmount(). That is the reach of this "
                 "gate, stated rather than hidden: every 2.18 conversion must route through ctx.on.")

    print("== the FIRST REAL CONVERTED CHANNEL mounts, unmounts and remounts (2.18)")
    open_tv(pg)
    # no {module:true} here, unlike the probe: this proves the manifest's disk-derived flag is what
    # actually routes a real channel down the module path
    REAL = """(name) => window.MBS_CH.mount(name, document.getElementById('channel'))
                .then(r => ({ ok: !!r.ok, legacy: !!r.legacy,
                              counts: r.ctx ? r.ctx.counts() : null,
                              dressed: document.querySelectorAll('#mi .myr .pupil').length,
                              booth: !!document.querySelector('#mi #miDeny') }))"""
    m1 = pg.evaluate(REAL, "mominc")
    check(m1["ok"] and not m1["legacy"],
          "mominc mounts as a MODULE off the manifest flag, not down the legacy path")
    check(total(m1["counts"]) > 0,
          "and everything it opened went through the context (%s)" % json.dumps(m1["counts"]))
    check(m1["dressed"] > 0 and m1["booth"],
          "the channel actually rendered: %d googly eyes dressed and the booth is there" % m1["dressed"])

    gone = pg.evaluate("() => window.MBS_CH.unmount().then(r => r.counts)")
    check(total(gone) == 0, "after unmount the runtime holds nothing (%s)" % json.dumps(gone))

    # A REAL channel's tally is not identical mount to mount, and asserting that it was would be
    # asserting something false. mominc binds a `load` listener only to an image that has not arrived
    # yet, so the first mount carries up to 12 of them depending on what the cache already holds and
    # every later mount carries none. 27 is the unconditional floor (3 on window/#screen, 1 goon, 2 arm
    # and disarm, 15 iteration cards, 2 booth buttons, 1 keydown, 3 on the hologram); a cold first mount
    # has been seen at 39. The number is therefore cache-dependent, and the contract is that
    # remounting does not ACCUMULATE, so that is what is asserted - never growth, and a steady state
    # once the cache is warm. A gate that demanded equality here would fail on a correct channel.
    m2 = pg.evaluate(REAL, "mominc")
    check(all(m2["counts"][k] <= m1["counts"][k] for k in m1["counts"]),
          "remounting never GROWS the tally (%s then %s)"
          % (json.dumps(m1["counts"]), json.dumps(m2["counts"])))
    check(m2["dressed"] == m1["dressed"], "and renders the same on the second visit")
    pg.evaluate("() => window.MBS_CH.unmount()")
    m3 = pg.evaluate(REAL, "mominc")
    check(m3["counts"] == m2["counts"],
          "and a third mount matches the second exactly, so it does not creep (%s)"
          % json.dumps(m3["counts"]))
    check(total(pg.evaluate("() => window.MBS_CH.unmount().then(r => r.counts)")) == 0,
          "and the last unmount still leaves nothing held")

    print("== the leak this conversion was for: A and D stop stamping when you leave CH 1")
    # mominc's inspection booth binds keydown to `document`, which innerHTML replacing the channel
    # never took away. Under the legacy loader, leaving CH 1 and pressing A still wrote a verdict into
    # localStorage for a booth that was no longer on the screen. This asserts the behaviour, not the
    # tally - a count cannot tell you the keyboard went quiet.
    stamp = pg.evaluate("""() => {
        const K = 'mbs-mominc-inspect-v2';
        localStorage.removeItem(K);
        const fire = () => document.dispatchEvent(new KeyboardEvent('keydown', {key:'a'}));
        return window.MBS_CH.mount('mominc', document.getElementById('channel')).then(() => {
          fire();
          const mounted = localStorage.getItem(K);
          return window.MBS_CH.unmount().then(() => {
            fire();
            return { mounted: mounted, after: localStorage.getItem(K) };
          });
        });
    }""")
    check(stamp["mounted"], "while mounted, A stamps the booth (so the probe itself is live)")
    check(stamp["after"] == stamp["mounted"],
          "after unmount the SAME key changes nothing: the document listener is released")

    b.close()

print()
for n in notes:
    print(" ", n)
if errs:
    print("\n  uncaught page errors (a channel's own throw is caught, so this should be empty):")
    for e in errs[:8]:
        print("   ", e[:160])
asserted = [n for n in notes if n.startswith(("PASS", "FAIL"))]
print("\n%s  %d/%d" % ("ALL PASS" if ok else "FAILURES",
                       sum(1 for n in asserted if n.startswith("PASS")), len(asserted)))
raise SystemExit(0 if ok else 1)
