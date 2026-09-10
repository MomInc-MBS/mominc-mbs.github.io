/* tv/channel-runtime.js - the channel lifecycle (2.17, PLAN-r9 D.1.7). Classic script, no
   import/export: loaded before tv.js in the television, the same way mbs-channels.js and
   mbs-runtime.js are. A channel MODULE is an ES module and is reached by dynamic import() from
   here, which is the one form that works from a classic script; a static import in this file would
   be a syntax error and would take the whole shell down with it.

   WHY THIS FILE EXISTS. A channel is loaded today by injecting its fragment with innerHTML and then
   re-creating every <script> tag inside it, because scripts inserted through innerHTML never run.
   That works exactly once. Every listener, timer, ResizeObserver and AudioContext those scripts
   create belongs to nobody: there is no handle on them and no moment at which they are released. Load
   a second channel into the same document and the first one's observers are still measuring, its
   timers are still firing, and its listeners are still bound to nodes that have been replaced. That
   is the bug class D.1.7's teardown acceptance exists to catch, and it is why unmount() is not
   optional here.

   THE DESIGN DECISION THAT MATTERS. unmount() does not ask the channel to remember what it created.
   A channel that has to remember will forget, and the forgetting is invisible until something leaks.
   Instead mount() is handed a CONTEXT that owns the disposables - ctx.on, ctx.timeout, ctx.interval,
   ctx.frame, ctx.observe, ctx.audio - and unmount() releases everything registered through it,
   whether or not the channel's own unmount() does anything. "The listener count returns to baseline"
   is therefore a property of this runtime, not a promise each of nine channels makes separately.

   A channel's own unmount() still runs first, for the things only it knows: stopping a render loop
   flag, tearing down a WebGL context, saving progress. It runs inside a try/catch, because a channel
   that throws on the way out must not prevent the release of everything else.

   WHAT THIS DID NOT DO, WHEN IT LANDED. Packet 8 converted no channel; 2.18 converts them one at a
   time, simplest first, and flipping one over is: write tv/channels/<id>.js, re-run
   tools/gen_channels.py, done. mominc went first (packet 9) because it is the smallest script with no
   canvas, no WebGL and no CDN import - measured, not assumed. The other eight are still inline-script
   fragments on the legacy path. One channel per micro-step is the plan's explicit instruction, because
   a sweeping conversion cannot be bisected when it breaks. */
(() => {
  const R = (window.MBS_CH = window.MBS_CH || {});

  let mounted = null;   // { name, root, host, mod, ctx } - at most one channel is mounted at a time

  /* The unavailable state. Both error contracts land here: an import that fails and a mount() that
     throws. It is a rendered state, never a blank stage, because a blank stage looks like a slow
     network and invites a reload that will fail the same way. */
  function unavailable(host, name, why) {
    host.innerHTML =
      '<section class="testcard" aria-label="' + name + ' unavailable"><h1>' + name.toUpperCase() +
      '</h1><div class="spacer"></div><p>This channel is off the air. The rest of the set still works.</p></section>';
    // Reported, never swallowed: a channel that silently fails to load is the hardest kind to notice.
    if (why) console.error("[MBS_CH] " + name + " unavailable:", why);
    return { ok: false, reason: why };
  }

  /* The context handed to mount(root, context). Everything a channel currently reaches for on the
     global object is passed through, so a converted channel's body is the same code with `MBS` and
     `MBS_STATE` coming in as arguments instead of off window - and the disposable registry is the
     only thing it has to adopt. */
  function makeContext(name, root) {
    const listeners = [], timeouts = [], intervals = [], observers = [], audios = [];
    // frames is a SET of PENDING ids, not a log of every frame ever asked for. A channel with a
    // render loop re-registers on every frame - mominc queues one per pointer move, the probe holds
    // a continuous loop - so an append-only array here grows without bound for as long as the
    // channel is on screen, which is the exact leak this runtime exists to prevent. The wrapper
    // below drops its own id the moment the frame fires, so the set holds what is actually
    // outstanding and counts().frames is an honest number rather than a stopwatch.
    const frames = new Set();

    return {
      name: name,
      root: root,
      // pass-through: read at mount time, so a channel sees the same values tv.js and mbs-shim.js do
      mbs: window.MBS,
      state: window.MBS_STATE,
      rt: window.MBS_RT,
      mode: (window.MBS && window.MBS.mode) || "public",
      isLive: !!(window.MBS && window.MBS.isLive),
      channel: ((window.MBS_CHANNELS && window.MBS_CHANNELS.channels) || [])
                 .find(function (c) { return c.id === name; }) || null,

      /* The disposable registry. Each returns what its raw counterpart returns, so adopting these is
         a rename at the call site and nothing more. */
      on: function (target, type, fn, opts) {
        target.addEventListener(type, fn, opts);
        listeners.push([target, type, fn, opts]);
        return fn;
      },
      timeout: function (fn, ms) { const id = setTimeout(fn, ms); timeouts.push(id); return id; },
      interval: function (fn, ms) { const id = setInterval(fn, ms); intervals.push(id); return id; },
      frame: function (fn) {
        const id = requestAnimationFrame(function (t) { frames.delete(id); fn(t); });
        frames.add(id);
        return id;
      },
      observe: function (obs, target, opts) {
        // registered even when target is omitted: an IntersectionObserver built here and observed
        // later still has to be disconnected, and forgetting that is the leak this exists to stop
        if (target) obs.observe(target, opts);
        observers.push(obs);
        return obs;
      },
      audio: function (ctx) { audios.push(ctx); return ctx; },

      /* What is still held. The gate reads this: after unmount every number must be zero, and after a
         remount they must match the first mount rather than doubling. A tally the runtime keeps is
         the only listener count a browser will actually give you - getEventListeners() is a DevTools
         function, not a page API - so this is the measurement, not a convenience. */
      counts: function () {
        return {
          listeners: listeners.length, timeouts: timeouts.length, intervals: intervals.length,
          frames: frames.size, observers: observers.length, audios: audios.length,
        };
      },

      /* Release everything, in the order that matters: listeners first so nothing fires during the
         rest of the teardown. Every step is individually guarded - a closed AudioContext throws on
         close(), a disconnected observer may already be gone, and one throw must not strand the
         remaining disposables. */
      dispose: function () {
        listeners.forEach(function (l) {
          try { l[0].removeEventListener(l[1], l[2], l[3]); } catch (e) { /* node already gone */ }
        });
        timeouts.forEach(function (id) { clearTimeout(id); });
        intervals.forEach(function (id) { clearInterval(id); });
        frames.forEach(function (id) { cancelAnimationFrame(id); });
        observers.forEach(function (o) { try { o.disconnect(); } catch (e) { /* already gone */ } });
        audios.forEach(function (a) {
          try { if (a && a.state !== "closed") a.close(); } catch (e) { /* already closed */ }
        });
        listeners.length = timeouts.length = intervals.length = 0;
        observers.length = audios.length = 0;
        frames.clear();
      },
    };
  }

  /* Mount a channel into `host`.

     The fragment is fetched and injected here rather than by the caller, so that the module-loading
     contract has one owner: fragment, then module, then mount, with a single failure path. `no-store`
     matches the loader it replaces - phone testing wants every refresh to be the current file.

     opts.beforeMount(root) is the one hook in that sequence, and it exists for the PLAY ROUTES
     (2.18, packet 10). tv/mount.js has to run its isolation pass - the ancestor-path reveal that
     hides the page furniture around a game - AFTER the fragment is in the document and BEFORE the
     module's mount() runs, because these games measure layout while they initialise and must never
     see the advert around them. Nothing else in the sequence can be split to make room for it, so
     the hook is one callback rather than a new file. A throw from it fails the mount closed, into
     the same unavailable state as any other failure: serving the whole page as the game is the
     exact defect Part A exists to remove, so a broken isolation must never fall through to a
     mounted channel. */
  R.mount = function (name, host, opts) {
    if (!/^[a-z0-9_-]+$/.test(name)) return Promise.resolve(unavailable(host, "channel", "bad id"));
    opts = opts || {};

    return R.unmount()
      .then(function () { return window.MBS_LOAD?.prepare(name); })
      .then(function () {
        return fetch("channels/" + name + ".html", { cache: "no-store" })
          .then(function (r) { return r.ok ? r.text() : Promise.reject(new Error("fragment " + r.status)); });
      })
      .then(function (html) {
        host.innerHTML = html;
        // 2.24/C010: `start` is recorded HERE, after the fragment lands and before the module is
        // imported, because this is the single point BOTH the module path and the legacy path
        // below pass through. Recorded inside a channel module it would miss every unconverted
        // one; guarded because a page can mount a channel without having loaded state.js.
        try { if (window.MBS_STATE) window.MBS_STATE.recordEvent("start", name); } catch (e) {}
        const root = host.querySelector("[data-host]") || host.firstElementChild || host;
        // The module is imported ONLY when the manifest says the file exists. Sniffing by catching an
        // import failure cannot tell a missing file from a broken one: a 404 and a syntax error both
        // surface as "Failed to fetch dynamically imported module", and GitHub Pages answers a missing
        // .js with an HTML 404 page, which fails on MIME type instead. So the question is answered
        // from data - tools/gen_channels.py sets `module` from whether tv/channels/<id>.js is on disk -
        // and every import failure below is therefore a REAL failure, handled as one.
        const rec = ((window.MBS_CHANNELS && window.MBS_CHANNELS.channels) || [])
                      .find(function (c) { return c.id === name; });
        // opts.module overrides the manifest. The default is the manifest and the shell never passes
        // this; it exists so tools/check_teardown.py can mount the _runtime-probe fixture, which is
        // deliberately NOT a manifest record. Making the decision an argument with a data-derived
        // default is cheaper than a fake channel in the single source of truth.
        const asModule = (opts.module === undefined) ? !!(rec && rec.module) : !!opts.module;
        if (!asModule) return { legacy: true, root: root };   // not converted yet: caller runs the old path

        return import("./channels/" + name + ".js" + (name === "djscratch" ? "?v=game-name-2" : "")).then(function (m) {
          const mod = m && (m.default || m);
          if (!mod || typeof mod.mount !== "function") throw new Error("module exports no mount()");
          // between the fragment and mount(): see opts.beforeMount above. Deliberately NOT caught
          // here - a failed isolation is a failed mount, and the .catch below renders it as one.
          if (typeof opts.beforeMount === "function") opts.beforeMount(root);
          const ctx = makeContext(name, root);
          // A throw inside mount() is the channel's failure, not the television's: it is caught here,
          // whatever the channel managed to register is released, and the set keeps working.
          try {
            mod.mount(root, ctx);
          } catch (e) {
            ctx.dispose();
            throw e;
          }
          mounted = { name: name, root: root, host: host, mod: mod, ctx: ctx };
          return { ok: true, root: root, ctx: ctx };
        });
      })
      .catch(function (e) { return unavailable(host, name, e); });
  };

  /* Unmount whatever is mounted. Safe to call when nothing is, which is what makes it safe to call
     unconditionally at the top of mount(). */
  R.unmount = function () {
    if (!mounted) return Promise.resolve({ ok: true, wasMounted: false });
    const m = mounted;
    mounted = null;
    try {
      if (typeof m.mod.unmount === "function") m.mod.unmount();
    } catch (e) {
      // the channel threw on the way out; its disposables are released below regardless
      console.error("[MBS_CH] " + m.name + " threw in unmount():", e);
    }
    m.ctx.dispose();
    return Promise.resolve({ ok: true, wasMounted: true, counts: m.ctx.counts() });
  };

  /* What is mounted right now, for the shell and for the gate. */
  R.current = function () {
    return mounted ? { name: mounted.name, counts: mounted.ctx.counts() } : null;
  };
})();
