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

SINCE THE HAND EDITOR, IT ALSO COVERS WebGL. djscratch's customize card builds a three.js scene, and
a WebGLRenderer is the first disposable on this television that the context genuinely cannot own. The
failure it causes is not an exception: a browser holds only a handful of live WebGL contexts and
silently drops the OLDEST when a page opens too many, so a retained renderer takes an EARLIER
channel's canvas away several channel changes later. The assertion is therefore a property of the
contexts themselves - how many are still un-lost after unmount - and never a tally, which cannot see
it. The no-WebGL case is asserted too, because the card's whole design is that the preset racks are
the control and the hologram is an upgrade layered on top; that claim is only worth anything if
somebody takes WebGL away and checks.

SINCE PACKET 11 THE WebGL CASE RUNS ON TWO DIFFERENT SHAPES. djscratch opens a context only if a
visitor scrolls to one card, and it creates its own canvas. fuel opens one for the channel's whole
life, against a canvas that is in the FRAGMENT'S own markup, and disposes its scene by WALKING the
graph rather than from a list built at construction time. Those are different ways to get it wrong,
so both are measured - and fuel is where a leak shows first, because it needs a context on every
single visit rather than only on the visits where somebody scrolls.

PACKET 12 ADDS THE THIRD SHAPE, and it is the biggest: lilboyfriend's museum is a first-person hall
whose scene the walk never leaves, with a camera that is itself a scene member because the held
magnifying glass and the fisheye quad are parented to it. It also loads twelve photographs of which
only one is ever a live material.map, so the scene walk alone would dispose one and miss eleven. What
is asserted here is the same property as for fuel, for the same reason: how many contexts are still
un-lost, never how many were made.

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
CONVERTED = {"mominc", "djscratch", "fuel", "lilboyfriend", "girlfriend", "corgi"}
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

print("== the play routes can mount a module too (2.18 packet 10, the half packet 9 left)")
check("opts.beforeMount(root)" in rt and "typeof opts.beforeMount" in rt,
      "channel-runtime.js calls opts.beforeMount(root) if it is given one")
# the CALL, not the doc comment above it that names the same identifier - .index() found the prose
CALL = 'if (typeof opts.beforeMount === "function") opts.beforeMount(root);'
check(CALL in rt, "and the call is guarded, so a caller that passes no hook is unaffected")
check(rt.index("host.innerHTML = html") < rt.index(CALL) < rt.index("mod.mount(root, ctx)"),
      "and calls it AFTER the fragment is injected and BEFORE the module's mount() - the whole point")
mnt = read("tv/mount.js")
check("chan.module" in mnt and "beforeMount: reveal" in mnt,
      "mount.js routes a converted channel through MBS_CH.mount with the isolation as the hook")
check('host.querySelectorAll("script")' in mnt,
      "and still has the legacy script-recreating path for the seven that are not converted")
gp = read("tools/gen.py")
play_block = gp[gp.index("PLAY = "):gp.index("COMING_SOON = ")]
check('<script src="channel-runtime.js"></script>' in play_block,
      "tools/gen.py emits the runtime on every play route")
check(play_block.index("channel-runtime.js") < play_block.index("mount.js"),
      "before mount.js, so MBS_CH exists when the play route mounts")
for _cid in sorted(flagged):
    _rec = next(c for c in chans["channels"] if c["id"] == _cid)
    if _rec.get("gameRoute"):
        check('<script src="channel-runtime.js"></script>' in read("play/%s/index.html" % _cid),
              "the generated /play/%s/ carries it (a hand-edit there would be overwritten anyway)" % _cid)


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

    print("== beforeMount runs BETWEEN the fragment and mount(), which is why it exists")
    open_tv(pg)
    # asserted with the probe rather than a real channel, because the probe is the only subject that
    # reports on its own mount(): the question is ORDER, and order needs a witness on both sides of it.
    order = pg.evaluate("""() => {
        window.__hook = null;
        return window.MBS_CH.mount('_runtime-probe', document.getElementById('channel'), {
          module: true,
          beforeMount: (root) => { window.__hook = {
              injected: !!(root && root.isConnected),
              mountedYet: !!(window.__probe && window.__probe.mounted) }; }
        }).then(r => ({ ok: !!r.ok, hook: window.__hook,
                        mountedAfter: !!(window.__probe && window.__probe.mounted) }));
    }""")
    check(order["ok"] and order["hook"], "the hook was called")
    check(order["hook"] and order["hook"]["injected"],
          "with the fragment already in the document, so an isolation pass has something to walk")
    check(order["hook"] and not order["hook"]["mountedYet"] and order["mountedAfter"],
          "and BEFORE the module's mount() ran - a game must never measure the page furniture")
    pg.evaluate("() => window.MBS_CH.unmount()")

    print("== a throw out of beforeMount fails the mount CLOSED, never into an un-isolated game")
    thrown = pg.evaluate("""() => window.MBS_CH.mount('_runtime-probe',
            document.getElementById('channel'),
            { module: true, beforeMount: () => { throw new Error('isolation failed'); } })
          .then(r => ({ ok: !!r.ok, reason: r.reason ? String(r.reason) : null,
                        rendered: !!document.querySelector('#channel .testcard'),
                        mounted: !!window.MBS_CH.current() }))""")
    check(not thrown["ok"] and thrown["reason"] and "isolation failed" in thrown["reason"],
          "the mount fails and names the hook's own error")
    check(thrown["rendered"] and not thrown["mounted"],
          "the unavailable state is rendered and nothing is mounted: serving the whole page as the "
          "game is the exact defect Part A exists to remove")

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

    print("== /play/djscratch/: a converted channel on a REAL play route (2.18 packet 10)")
    pg.goto(BASE + "/play/djscratch/", wait_until="load")
    pg.wait_for_timeout(900)
    play = pg.evaluate("""() => {
        const cur = window.MBS_CH && window.MBS_CH.current();
        return { name: cur && cur.name, counts: cur ? cur.counts : null,
                 dj: !!document.querySelector('#channel #dj'),
                 scripts: document.querySelectorAll('#channel script').length,
                 sliders: document.querySelectorAll('#rack .knobface[role="slider"]').length,
                 deckOff: !!document.querySelector('#deck.mbs-off'),
                 sigOff: !!document.querySelector('#sigLbl.mbs-off'),
                 signHidden: !!document.querySelector('.customsign.mbs-off'),
                 hidden: document.querySelectorAll('#channel .mbs-off').length,
                 boot: !!document.getElementById('boot'),
                 title: document.title };
    }""")
    check(play["name"] == "djscratch",
          "the runtime mounted it, so the play route took the MODULE path (%s)" % play["name"])
    check(total(play["counts"]) > 0,
          "and everything it opened went through the context (%s)" % json.dumps(play["counts"]))
    check(play["dj"] and play["scripts"] == 0,
          "the channel is on the page with NO inline script re-created: the module IS the channel")
    # role="slider" is written by the module and appears nowhere in the markup, so this is evidence
    # the module's own mount() ran, not merely that the fragment arrived
    check(play["sliders"] == 2,
          "the module's mount() ran (%s knobs made sliders)" % play["sliders"])
    check(not play["deckOff"] and not play["sigOff"] and play["hidden"] > 0,
          "isolation ran through the hook: both roots visible, %s off-path elements hidden" % play["hidden"])
    check(play["signHidden"],
          "and the hide list still subtracts INSIDE a root (the CUSTOM HANDS sign lives in the deck)")
    check(not play["boot"], "the boot message is gone, so ready() ran")
    check("MBS" in (play["title"] or ""),
          "and the title came from the fragment (%s)" % play["title"])

    playgone = pg.evaluate("() => window.MBS_CH.unmount().then(r => r.counts)")
    check(total(playgone) == 0,
          "and it tears down on the play route exactly as it does in the television (%s)"
          % json.dumps(playgone))

    print("== EVERY generated play route is a module now (2.18 complete for the live channels)")
    # This block used to point at corgi as the UNCONVERTED example and assert the legacy path still
    # mounted through it. Packet 14 converted corgi, and with it the last play route on disk: corgi,
    # djscratch, fuel, girlfriend and lilboyfriend are all modules, and the three still on the legacy
    # path - goon, sag, armie - are coming_soon, so no play route is generated for them and there is
    # nothing left to point the old probe at. The assertion is INVERTED rather than dropped: same
    # route, same probe, opposite expectation.
    pg.goto(BASE + "/play/corgi/", wait_until="load")
    pg.wait_for_timeout(2500)
    conv = pg.evaluate("""() => ({
        mounted: !!(window.MBS_CH && window.MBS_CH.current()),
        scripts: document.querySelectorAll('#channel script').length,
        root: !!document.querySelector('#channel [data-host]'),
        boot: !!document.getElementById('boot') })""")
    check(conv["mounted"], "corgi's play route goes down the MODULE path now")
    check(conv["scripts"] == 0 and conv["root"],
          "with NO inline script re-created: the module IS the channel (%s)" % conv["scripts"])
    check(not conv["boot"], "and it still comes up, so ready() runs on both paths")
    # the milestone, read from data rather than claimed: every play route that exists on disk belongs
    # to a channel the manifest marks as a module.
    routed = sorted(d for d in os.listdir(os.path.join(ROOT, "play"))
                    if os.path.isdir(os.path.join(ROOT, "play", d)))
    modules = {c["id"] for c in chans["channels"] if c.get("module")}
    check(routed and set(routed) <= modules,
          "and every generated play route is a converted channel (%s)" % ", ".join(routed))
    # what is left on the legacy path, and why it cannot be exercised here. Named rather than assumed:
    # a silently empty set would make the check above vacuously true the day someone converts the rest.
    legacy_ids = sorted({c["id"] for c in chans["channels"]} - modules)
    coming = sorted(c["id"] for c in chans["channels"] if c.get("comingSoon"))
    check(legacy_ids and legacy_ids == coming,
          "the channels still on the legacy path are exactly the coming_soon ones (%s)"
          % ", ".join(legacy_ids))
    check(not (set(legacy_ids) & set(routed)),
          "and none of them has a play route to drive, which is why this block inverted rather than moved")

    print("== the WebGL context: the first disposable on this television that ctx does NOT own")
    # A page holds a small, fixed number of live WebGL contexts and the browser silently drops the
    # OLDEST once that is exceeded - so a renderer that outlives its channel does not throw, it takes
    # an EARLIER channel's canvas away, several channel changes later, with no error anywhere. A tally
    # cannot see that. What can is the context object itself: forceContextLoss() makes isContextLost()
    # true, so "how many live contexts does this page still hold" is a real, readable property.
    gpg = b.new_page(viewport={"width": 1280, "height": 900})
    gpg.on("pageerror", lambda e: errs.append(str(e)))
    gpg.add_init_script("""
        (() => { const real = HTMLCanvasElement.prototype.getContext;
                 window.__gl = [];
                 HTMLCanvasElement.prototype.getContext = function (type) {
                   const c = real.apply(this, arguments);
                   if (c && /webgl/i.test(String(type))) window.__gl.push(c);
                   return c;
                 }; })();
    """)
    open_tv(gpg)

    def hand_cycle(page):
        """Mount djscratch, get the hand editor to actually build, unmount. Returns what is live."""
        page.evaluate("() => window.MBS_CH.mount('djscratch', document.getElementById('channel'))")
        page.wait_for_timeout(300)
        # the model is fetched on an IntersectionObserver hit, so the card has to be approached
        page.evaluate("() => document.querySelector('#customize').scrollIntoView({block:'center'})")
        built = True
        try:
            page.wait_for_function("() => document.querySelector('#customize.has3d')", timeout=25000)
        except Exception:
            built = False
        page.evaluate("() => window.MBS_CH.unmount()")
        page.wait_for_timeout(250)
        return built, page.evaluate("""() => ({
            made: window.__gl.length,
            live: window.__gl.filter(c => !c.isContextLost()).length })""")

    built1, gl1 = hand_cycle(gpg)
    check(built1, "the hand editor actually builds a scene, so this probe is measuring something")
    check(gl1["made"] > 0, "and it took a real WebGL context to do it (%d)" % gl1["made"])
    check(gl1["live"] == 0,
          "after unmount the page holds NO live WebGL context (%d made, %d still live)"
          % (gl1["made"], gl1["live"]))

    built2, gl2 = hand_cycle(gpg)
    built3, gl3 = hand_cycle(gpg)
    check(built2 and built3, "and it rebuilds on the second and third visit rather than coming up empty")
    # The property, not a constant: contexts are ALLOWED to be created once per visit - that is what
    # a fresh renderer means - and what must never happen is one being retained. Asserting a total
    # here would assert something false the moment the model is cached differently.
    check(gl3["live"] == 0,
          "three visits later it still holds none (%d made across three, %d live)"
          % (gl3["made"], gl3["live"]))
    check(gl3["made"] <= gl1["made"] * 3,
          "and a visit costs ONE context, never a growing number (%d over three visits)" % gl3["made"])
    gpg.close()

    print("== fuel: a channel that holds a WebGL context for its WHOLE life (2.18 packet 11)")
    # The other shape of the same failure. djscratch takes a context only if the customize card is
    # approached and builds its own canvas; fuel needs one the moment it mounts, renders into a canvas
    # that came with the fragment, and tears the scene down by walking the graph instead of from a
    # list. It is also the channel where a retained renderer would bite soonest, because every single
    # visit costs a context rather than only the visits where somebody scrolls far enough.
    fpg = b.new_page(viewport={"width": 1280, "height": 900})
    fpg.on("pageerror", lambda e: errs.append(str(e)))
    fpg.add_init_script("""
        (() => { const real = HTMLCanvasElement.prototype.getContext;
                 window.__gl = [];
                 HTMLCanvasElement.prototype.getContext = function (type) {
                   const c = real.apply(this, arguments);
                   if (c && /webgl/i.test(String(type))) window.__gl.push(c);
                   return c;
                 }; })();
    """)
    open_tv(fpg)

    def fuel_cycle(page):
        """Mount fuel, wait for the scene to actually exist, unmount. Returns what is still live."""
        page.evaluate("() => window.MBS_CH.mount('fuel', document.getElementById('channel'))")
        built = True
        try:
            # .has3d is added ONLY after the whole scene is built and the first frame is queued, so
            # it is the channel's own statement that there is something here to leak
            page.wait_for_function("() => document.querySelector('#fu.has3d')", timeout=25000)
        except Exception:
            built = False
        page.wait_for_timeout(250)
        page.evaluate("() => window.MBS_CH.unmount()")
        page.wait_for_timeout(250)
        return built, page.evaluate("""() => ({
            made: window.__gl.length,
            live: window.__gl.filter(c => !c.isContextLost()).length })""")

    fbuilt1, fgl1 = fuel_cycle(fpg)
    check(fbuilt1, "fuel builds its scene as a module, so this probe is measuring something")
    check(fgl1["made"] > 0, "and it took a real WebGL context to do it (%d)" % fgl1["made"])
    check(fgl1["live"] == 0,
          "after unmount the page holds NO live WebGL context (%d made, %d still live)"
          % (fgl1["made"], fgl1["live"]))

    fbuilt2, fgl2 = fuel_cycle(fpg)
    fbuilt3, fgl3 = fuel_cycle(fpg)
    check(fbuilt2 and fbuilt3, "and it rebuilds on the second and third visit rather than coming up empty")
    # the property, never a constant: a fresh context per visit is CORRECT, a retained one is not
    check(fgl3["live"] == 0,
          "three visits later it still holds none (%d made across three, %d live)"
          % (fgl3["made"], fgl3["live"]))
    check(fgl3["made"] <= fgl1["made"] * 3,
          "and a visit costs ONE context, never a growing number (%d over three visits)" % fgl3["made"])
    # the runtime's own tally has to come back to nothing too - the scene is what ctx cannot own, but
    # every listener, the ResizeObserver, both scoop timers and all three frame chains ARE its job
    check(fpg.evaluate("() => window.MBS_CH.current()") is None,
          "and the runtime reports nothing mounted afterwards")
    fpg.close()

    print("== lilboyfriend: the museum, whose WebGL scene the whole channel lives inside (2.18 packet 12)")
    # The third shape, and the largest: a first-person hall of some hundred meshes that the walk never
    # leaves, against a canvas in the fragment's own markup, with the camera itself added to the scene
    # (the held magnifying glass and the fisheye quad are its children) and twelve loaded photographs of
    # which only the displayed one is ever a live material.map.
    lpg = b.new_page(viewport={"width": 1280, "height": 900})
    lpg.on("pageerror", lambda e: errs.append(str(e)))
    lpg.add_init_script("""
        (() => { const real = HTMLCanvasElement.prototype.getContext;
                 window.__gl = [];
                 HTMLCanvasElement.prototype.getContext = function (type) {
                   const c = real.apply(this, arguments);
                   if (c && /webgl/i.test(String(type))) window.__gl.push(c);
                   return c;
                 }; })();
    """)
    open_tv(lpg)

    def lb_cycle(page):
        """Mount the museum, wait for the renderer to actually exist, unmount. Returns what is live."""
        page.evaluate("() => window.MBS_CH.mount('lilboyfriend', document.getElementById('channel'))")
        built = True
        try:
            # This channel has no has3d-style marker class of its own to wait on - it sets .webgl before
            # the CDN import, which says only that the probe passed. A LIVE context is the honest signal
            # that the renderer came up, and it is the same property this gate exists to measure: the
            # fixed feature probe hands its own context straight back, so anything still un-lost here is
            # the renderer's.
            page.wait_for_function("() => window.__gl.filter(c => !c.isContextLost()).length > 0",
                                   timeout=25000)
        except Exception:
            built = False
        page.wait_for_timeout(400)
        page.evaluate("() => window.MBS_CH.unmount()")
        page.wait_for_timeout(250)
        return built, page.evaluate("""() => ({
            made: window.__gl.length,
            live: window.__gl.filter(c => !c.isContextLost()).length })""")

    lbuilt1, lgl1 = lb_cycle(lpg)
    check(lbuilt1, "the museum opens a real WebGL context, so this probe is measuring something")
    check(lgl1["live"] == 0,
          "after unmount the page holds NO live WebGL context (%d made, %d still live)"
          % (lgl1["made"], lgl1["live"]))

    lbuilt2, lgl2 = lb_cycle(lpg)
    lbuilt3, lgl3 = lb_cycle(lpg)
    check(lbuilt2 and lbuilt3, "and it rebuilds on the second and third visit rather than coming up empty")
    # the property, never a constant: a fresh context per visit is CORRECT, a retained one is not
    check(lgl3["live"] == 0,
          "three visits later it still holds none (%d made across three, %d live)"
          % (lgl3["made"], lgl3["live"]))
    check(lgl3["made"] <= lgl1["made"] * 3,
          "and a visit costs the SAME number of contexts, never a growing one (%d over three visits)"
          % lgl3["made"])
    check(lpg.evaluate("() => window.MBS_CH.current()") is None,
          "and the runtime reports nothing mounted afterwards")
    # the one window global this channel sets: it closes over the mount's state object, so leaving it
    # behind would mean a reader answering about a museum that is no longer in the document
    check(lpg.evaluate("() => typeof window.__lbState") == "undefined",
          "and the channel's own window.__lbState readback is gone with it")
    lpg.close()

    print("== girlfriend: the paper production line allocates no WebGL")
    # Same shape as the museum and fuel - a renderer taken at mount and held for the visit - with one
    # thing neither of those had: a listener on the SHELL's scroll container. .screen outlives every
    # channel, so a scroll handler left bound to it is a dead channel's closure running on every dial
    # turn afterwards. That is the runtime's job rather than this block's, and current() below is what
    # says it was done; what is measured here is the GPU, and the six preloaded MYR5 stills of which
    # only one is ever a live material.map.
    ppg = b.new_page(viewport={"width": 1280, "height": 900})
    ppg.on("pageerror", lambda e: errs.append(str(e)))
    ppg.add_init_script("""
        (() => { const real = HTMLCanvasElement.prototype.getContext;
                 window.__gl = [];
                 HTMLCanvasElement.prototype.getContext = function (type) {
                   const c = real.apply(this, arguments);
                   if (c && /webgl/i.test(String(type))) window.__gl.push(c);
                   return c;
                 }; })();
    """)
    open_tv(ppg)

    def dg_cycle(page):
        """Mount the line, wait for the scene to actually exist, unmount. Returns what is live."""
        page.evaluate("() => window.MBS_CH.mount('girlfriend', document.getElementById('channel'))")
        built = True
        try:
            # window.__dg is this channel's own probe hook and it is created at the END of the build,
            # after the renderer, the room and every station - so it is the channel's own statement
            # that there is a scene here to leak, and it is a stronger signal than a class name.
            page.wait_for_function("() => window.__dg && window.__dg.paper", timeout=25000)
        except Exception:
            built = False
        page.wait_for_timeout(400)
        page.evaluate("() => window.MBS_CH.unmount()")
        page.wait_for_timeout(250)
        return built, page.evaluate("""() => ({
            made: window.__gl.length,
            live: window.__gl.filter(c => !c.isContextLost()).length })""")

    pbuilt1, pgl1 = dg_cycle(ppg)
    check(pbuilt1, "the line builds its scene as a module, so this probe is measuring something")
    check(pgl1["made"] == 0, "the paper line allocates zero WebGL contexts (%d)" % pgl1["made"])
    check(pgl1["live"] == 0,
          "after unmount the page holds NO live WebGL context (%d made, %d still live)"
          % (pgl1["made"], pgl1["live"]))

    pbuilt2, pgl2 = dg_cycle(ppg)
    pbuilt3, pgl3 = dg_cycle(ppg)
    check(pbuilt2 and pbuilt3, "and it rebuilds on the second and third visit rather than coming up empty")
    # the property, never a constant: a fresh context per visit is CORRECT, a retained one is not
    check(pgl3["live"] == 0,
          "three visits later it still holds none (%d made across three, %d live)"
          % (pgl3["made"], pgl3["live"]))
    check(pgl3["made"] <= pgl1["made"] * 3,
          "and a visit costs the SAME number of contexts, never a growing one (%d over three visits)"
          % pgl3["made"])
    check(ppg.evaluate("() => window.MBS_CH.current()") is None,
          "and the runtime reports nothing mounted afterwards")
    # the one window global this channel sets, and it can DRIVE the line - pour, mould and pack are on
    # it. Left behind it would work a room that is no longer in the document.
    check(ppg.evaluate("() => typeof window.__dg") == "undefined",
          "and the channel's own window.__dg probe hook is gone with it")
    ppg.close()

    print("== corgi: the school hunt, the LAST live channel and the largest scene (2.18 packet 14)")
    # The biggest of the four WebGL shapes: a corridor with three branch areas, per-area lighting,
    # furniture, a monster and a door, rebuilt wholesale on every level transition. It also carries the
    # two things no earlier channel did - an AudioContext (public mode's office ambience) and two
    # listeners bound to WINDOW - but those are the runtime's job, and current() below is what says it
    # was done. What is measured here is the GPU.
    cpg = b.new_page(viewport={"width": 1280, "height": 900})
    cpg.on("pageerror", lambda e: errs.append(str(e)))
    cpg.add_init_script("""
        (() => { const real = HTMLCanvasElement.prototype.getContext;
                 window.__gl = [];
                 HTMLCanvasElement.prototype.getContext = function (type) {
                   const c = real.apply(this, arguments);
                   if (c && /webgl/i.test(String(type))) window.__gl.push(c);
                   return c;
                 }; })();
    """)
    open_tv(cpg)

    def cc_cycle(page):
        """Mount the school, wait for the scene to actually exist, unmount. Returns what is live."""
        page.evaluate("() => window.MBS_CH.mount('corgi', document.getElementById('channel'))")
        built = True
        try:
            # window.__corgi is created inside runHunt3D AFTER the import resolves and the player exists,
            # so it is the channel's own statement that there is a scene here to leak. desks is a getter
            # over the level's furniture, which only buildLevel fills in.
            page.wait_for_function("() => window.__corgi && window.__corgi.desks > 0", timeout=25000)
        except Exception:
            built = False
        page.wait_for_timeout(400)
        page.evaluate("() => window.MBS_CH.unmount()")
        page.wait_for_timeout(250)
        return built, page.evaluate("""() => ({
            made: window.__gl.length,
            live: window.__gl.filter(c => !c.isContextLost()).length })""")

    cbuilt1, cgl1 = cc_cycle(cpg)
    check(cbuilt1, "the school builds its scene as a module, so this probe is measuring something")
    check(cgl1["made"] > 0, "and it took a real WebGL context to do it (%d)" % cgl1["made"])
    check(cgl1["live"] == 0,
          "after unmount the page holds NO live WebGL context (%d made, %d still live)"
          % (cgl1["made"], cgl1["live"]))

    cbuilt2, cgl2 = cc_cycle(cpg)
    cbuilt3, cgl3 = cc_cycle(cpg)
    check(cbuilt2 and cbuilt3, "and it rebuilds on the second and third visit rather than coming up empty")
    # the property, never a constant: a fresh context per visit is CORRECT, a retained one is not
    check(cgl3["live"] == 0,
          "three visits later it still holds none (%d made across three, %d live)"
          % (cgl3["made"], cgl3["live"]))
    check(cgl3["made"] <= cgl1["made"] * 3,
          "and a visit costs the SAME number of contexts, never a growing one (%d over three visits)"
          % cgl3["made"])
    check(cpg.evaluate("() => window.MBS_CH.current()") is None,
          "and the runtime reports nothing mounted afterwards")
    # the one window global this channel sets, and it can MOVE the player: left behind, a driver could
    # teleport a dog around a school that is no longer in the document
    check(cpg.evaluate("() => typeof window.__corgi") == "undefined",
          "and the channel's own window.__corgi probe hook is gone with it")
    cpg.close()

    print("== fuel with no WebGL at all: the flat form is still the whole channel")
    # fuel's stated design is that the six radiogroups, the eight flavour buttons and the can readout
    # are the real page and the tub is an input method laid over them. Same as djscratch's racks: the
    # only honest way to check that claim is to take WebGL away and use the page.
    fnp = b.new_page(viewport={"width": 1280, "height": 900})
    fnp.on("pageerror", lambda e: errs.append(str(e)))
    fnp.add_init_script("""
        (() => { const real = HTMLCanvasElement.prototype.getContext;
                 HTMLCanvasElement.prototype.getContext = function (type) {
                   return /webgl/i.test(String(type)) ? null : real.apply(this, arguments);
                 }; })();
    """)
    open_tv(fnp)
    fnp.evaluate("() => window.MBS_CH.mount('fuel', document.getElementById('channel'))")
    fnp.wait_for_timeout(600)
    fnp.evaluate("""() => {
        document.querySelector('.srow[data-supp=creatine] .lvl[data-level=strong]').click();
        document.querySelector('.flv[data-flavour="TOXIC WASTE LIME"]').click();
    }""")
    fnp.wait_for_timeout(150)
    flat_fu = fnp.evaluate("""() => ({
        has3d: !!document.querySelector('#fu.has3d'),
        levels: document.querySelectorAll('#fu .lvl').length,
        can: (document.getElementById('canLabel') || {}).textContent || '',
        cost: (document.getElementById('costBar') || {}).textContent || '',
        mail: (document.getElementById('mailLink') || {}).href || '' })""")
    check(not flat_fu["has3d"], "no WebGL: the tub never claims to be there (.has3d stays off)")
    check(flat_fu["levels"] == 18, "the six radiogroups are in the DOM regardless (%d buttons)" % flat_fu["levels"])
    check("CREATINE: STRONG" in flat_fu["can"] and "TOXIC WASTE LIME" in flat_fu["can"],
          "and setting a level and a flavour still writes the can: %r" % flat_fu["can"][-60:])
    check("COST/SCOOP" in flat_fu["cost"], "the cost readout still renders (%r)" % flat_fu["cost"][:40])
    check(flat_fu["mail"].startswith("mailto:"),
          "and the mailto is built from first paint, never a placeholder")
    fnp.close()

    print("== and with no WebGL at all, the card is still a working control")
    # The claim the channel's own comment makes: the racks are the real control and the hologram is
    # an upgrade layered on top. The only honest way to check that is to take WebGL away.
    npg = b.new_page(viewport={"width": 1280, "height": 900})
    npg.on("pageerror", lambda e: errs.append(str(e)))
    npg.add_init_script("""
        (() => { const real = HTMLCanvasElement.prototype.getContext;
                 HTMLCanvasElement.prototype.getContext = function (type) {
                   return /webgl/i.test(String(type)) ? null : real.apply(this, arguments);
                 }; })();
    """)
    open_tv(npg)
    npg.evaluate("() => window.MBS_CH.mount('djscratch', document.getElementById('channel'))")
    npg.wait_for_timeout(300)
    npg.evaluate("() => document.querySelector('#customize').scrollIntoView({block:'center'})")
    npg.wait_for_timeout(2500)
    npg.evaluate("() => document.getElementById('hb-be2').click()")
    npg.evaluate("() => document.getElementById('hb-na3').click()")
    npg.wait_for_timeout(150)
    flat = npg.evaluate("""() => ({
        has3d: !!document.querySelector('#customize.has3d'),
        spec: (document.querySelector('#handSpec') || {}).textContent || '',
        racks: document.querySelectorAll('#orderForm .chips input').length,
        text: document.querySelectorAll('#orderForm input:not([type=radio]), #orderForm select, #orderForm textarea').length })""")
    check(not flat["has3d"], "no WebGL: the stage stays hidden rather than showing an empty box")
    check(flat["racks"] >= 15, "the preset racks are in the DOM regardless (%d chips)" % flat["racks"])
    check("lizard" in flat["spec"].lower() and "talons" in flat["spec"].lower(),
          "and picking still reads the spec back in words: %r" % flat["spec"][:90])
    check(flat["text"] == 0,
          "and there is no free-text field left on this card at all (%d)" % flat["text"])
    npg.close()

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
