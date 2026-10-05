// Sound for the television cabinet and its own web controls. Channel games keep their own audio.
((root, factory) => {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root && root.document) api.mount(root);
})(typeof window !== "undefined" ? window : null, () => {
  const FILES = {
    click: ["mechanical-click-1.mp3", "mechanical-click-2.mp3"],
    switch: ["metal-switch-1.mp3", "metal-switch-2.mp3"],
    detent: ["mechanical-click-1.mp3", "mechanical-click-2.mp3"],
    static: ["electric-static.mp3"],
    bloop: ["menu-bloop.mp3"],
  };
  const LEVEL = { click: .41, switch: .7, detent: .26, static: .15, bloop: .43 };   // CRT clicks 30% down (Ian, 2026-10-05)
  const GAP = { click: 50, switch: 65, detent: 65, static: 240, bloop: 70 };
  const KEY = "mbs-tv-muted-v1";

  function createEngine(env) {
    const AudioContext = env.AudioContext || env.webkitAudioContext;
    const buffers = new Map(), loading = new Map(), voices = new Set();
    const last = new Map(), next = new Map();
    let context, master, bed, muted = false, active = true, unlocked = false, epoch = 0;
    let noiseBuffer;
    try { muted = env.localStorage?.getItem(KEY) === "1"; } catch {}

    function setup() {
      if (!AudioContext || context) return context;
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = .58;
      master.connect(context.destination);
      return context;
    }
    function preload() {
      if (!setup()) return;
      for (const file of new Set(Object.values(FILES).flat())) {
        if (loading.has(file)) continue;
        const task = env.fetch(`/tv/audio/${file}`).then(r => {
          if (!r.ok) throw Error(`Sound ${r.status}`);
          return r.arrayBuffer();
        }).then(bytes => context.decodeAudioData(bytes)).then(buffer => {
          if (buffer && buffer.duration <= 3) buffers.set(file, buffer);
        }).catch(() => { loading.delete(file); });
        loading.set(file, task);
      }
    }
    function unlock() {
      if (!active || env.document?.hidden || !setup()) return;
      unlocked = true;
      preload();
      if (context.state === "suspended") context.resume().then(syncBed).catch(() => {});
      else syncBed();
    }
    function stopVoices() {
      for (const voice of [...voices]) {
        try { voice.source.stop(); } catch {}
        voice.source.disconnect(); voice.gain.disconnect(); voices.delete(voice);
      }
    }
    function stopBed() {
      if (!bed) return;
      const old = bed; bed = null;
      try {
        old.gain.gain.setTargetAtTime(0, context.currentTime, .035);
        old.source.stop(context.currentTime + .15);
      } catch { try { old.source.stop(); } catch {} }
      old.source.onended = () => { old.source.disconnect(); old.gain.disconnect(); };
    }
    function stop() { epoch++; stopVoices(); stopBed(); }
    function setMuted(value) {
      muted = !!value;
      try { env.localStorage?.setItem(KEY, muted ? "1" : "0"); } catch {}
      if (muted) stop(); else { unlock(); syncBed(); }
      return muted;
    }
    let wantsStatic = false;
    function setStatic(value) { wantsStatic = !!value; syncBed(); }
    function syncBed() {
      if (!unlocked || !context || context.state !== "running" || muted || !active || env.document?.hidden || !wantsStatic) {
        stopBed(); return;
      }
      if (bed) return;
      const length = context.sampleRate * 2;
      if (!noiseBuffer) {
        noiseBuffer = context.createBuffer(1, length, context.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        let seed = 87931;
        for (let i = 0; i < length; i++) {
          seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
          data[i] = ((seed >>> 8) / 8388608 - 1) * .3;
        }
      }
      const source = context.createBufferSource(), gain = context.createGain();
      source.buffer = noiseBuffer; source.loop = true;
      gain.gain.setValueAtTime(0, context.currentTime);
      gain.gain.setTargetAtTime(.013, context.currentTime, .12);
      source.connect(gain); gain.connect(master); source.start();
      bed = { source, gain };
    }
    function play(kind) {
      if (!FILES[kind] || muted || !active || env.document?.hidden) return false;
      const now = env.performance?.now?.() ?? Date.now();
      if (now - (last.get(kind) ?? -Infinity) < GAP[kind]) return false;
      last.set(kind, now);
      unlock();
      if (!context) return false;
      const files = FILES[kind], file = files[(next.get(kind) || 0) % files.length];
      next.set(kind, (next.get(kind) || 0) + 1);
      const startEpoch = epoch;
      const start = () => {
        if (epoch !== startEpoch || muted || !active || env.document?.hidden || context.state !== "running") return;
        if (Date.now() - stamp > 450) return;
        const buffer = buffers.get(file);
        if (!buffer) return;
        while (voices.size >= 6) {
          const oldest = voices.values().next().value;
          try { oldest.source.stop(); } catch {}
          oldest.source.disconnect(); oldest.gain.disconnect(); voices.delete(oldest);
        }
        const source = context.createBufferSource(), gain = context.createGain();
        source.buffer = buffer;
        source.playbackRate.value = 1 + ((next.get(kind) % 3) - 1) * .018;
        gain.gain.value = LEVEL[kind];
        source.connect(gain); gain.connect(master);
        const voice = { source, gain };
        voices.add(voice);
        source.onended = () => {
          source.disconnect(); gain.disconnect(); voices.delete(voice);
        };
        source.start();
      };
      const stamp = Date.now();
      if (buffers.has(file) && context.state === "running") start();
      else Promise.resolve(loading.get(file)).then(() => context.resume()).then(start).catch(() => {});
      return true;
    }
    function dispose() { active = false; stop(); context?.close?.(); }
    return { unlock, preload, play, stop, dispose, setMuted, get muted() { return muted; }, setStatic };
  }

  function mount(env) {
    const engine = createEngine(env);
    env.MBS_SOUND = engine;
    engine.preload(); // Decode only. Playback still requires a visitor gesture.
    const doc = env.document, tv = doc.getElementById("tv"), mute = doc.getElementById("soundBtn");
    if (!tv) return engine;
    const paintMute = () => {
      if (!mute) return;
      mute.setAttribute("aria-pressed", engine.muted ? "true" : "false");
      mute.setAttribute("aria-label", engine.muted ? "Unmute television sound" : "Mute television sound");
      mute.title = mute.getAttribute("aria-label");
      const legend = doc.getElementById("soundLegend");
      if (legend) legend.textContent = engine.muted ? "UNMUTE" : "MUTE";
    };
    const sync = () => engine.setStatic(tv.dataset.state === "on" && tv.dataset.mode !== "game");
    paintMute();
    new env.MutationObserver(sync).observe(tv, { attributes: true, attributeFilter: ["data-state", "data-mode"] });
    sync();
    doc.addEventListener("pointerdown", e => {
      if (e.isPrimary !== false) engine.unlock();
      if (e.target.closest?.("#knob") && e.isPrimary !== false && (e.pointerType !== "mouse" || e.button === 0)) engine.play("click");
    }, { capture: true });
    doc.addEventListener("keydown", e => { if (!e.repeat) engine.unlock(); }, { capture: true });
    const onClick = e => {
      const target = e.target.closest?.("button,a,[role=button]");
      if (!target || target.disabled || target.getAttribute("aria-disabled") === "true" || target.closest("[data-no-tv-sound]")) return;
      if (target === mute) {
        const muted = engine.setMuted(!engine.muted);
        paintMute();
        if (!muted) engine.play("switch");
      } else if (target.id === "knob") {
        if (e.detail === 0) engine.play("click"); // keyboard/assistive press; pointerdown already sounded
      } else if (tv.contains(target) && target.classList.contains("key")) engine.play("switch");
      else if (target.matches("a:not([href])")) return;
      else engine.play("bloop");
    };
    doc.addEventListener("click", onClick, { capture: true });
    // Same-origin pages inside the set have their own event documents. Bind only
    // their ordinary controls; known game frames provide their own input/audio.
    const bound = new WeakSet();
    const bindFrame = frame => {
      if (frame.matches("#ggGame,#ar-intro-frame,#ar-lab-frame,#ar-myr-frame,#creator-screen,.play-frame")) return;
      let child;
      try { child = frame.contentDocument; } catch { return; }
      if (!child || bound.has(child)) return;
      bound.add(child);
      child.addEventListener("pointerdown", () => engine.unlock(), { capture: true });
      child.addEventListener("keydown", e => { if (!e.repeat) engine.unlock(); }, { capture: true });
      child.addEventListener("click", onClick, { capture: true });
      child.querySelectorAll("iframe").forEach(bindFrame);
      child.addEventListener("load", e => { if (e.target.tagName === "IFRAME") bindFrame(e.target); }, true);
    };
    doc.querySelectorAll("iframe").forEach(bindFrame);
    doc.addEventListener("load", e => { if (e.target.tagName === "IFRAME") bindFrame(e.target); }, true);
    doc.addEventListener("visibilitychange", () => { if (doc.hidden) engine.stop(); else sync(); });
    // A channel visit may be restored from the back/forward cache with this same document.
    env.addEventListener("pagehide", () => engine.stop());
    env.addEventListener("pageshow", sync);
    return engine;
  }
  return { createEngine, mount };
});
