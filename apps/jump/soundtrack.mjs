// Coach Jump soundtrack: one AudioContext, one looping source, lazy decode, LRU cache of 3. Audio failures never throw.
export const DEFAULT_TRACK = 'main-theme-one';
const MANIFEST = '/apps/jump/music/manifest.json', KEY = 'mbs-app-jump-music-on-v1', TV_MUTE = 'mbs-tv-muted-v1', FADE = 0.2, MAX_CACHE = 3;
let cached;
const warned = new Set();
const warn = (k, e) => { if (!warned.has(k)) { warned.add(k); console.warn('[jump soundtrack]', k, e?.message || e); } };

export function loadCatalog(fetchRef = globalThis.fetch) {
  cached ||= (async () => {
    const r = await fetchRef(MANIFEST);
    if (!r.ok) throw new Error(`manifest ${r.status}`);
    const m = await r.json();
    return Object.freeze(m.tracks.map(t => Object.freeze({ id: t.id, title: t.title, url: t.url, loopStart: t.loopStart, loopEnd: t.loopEnd, duration: t.duration })));
  })();
  cached.catch(() => { cached = null; });
  return cached;
}

export function createSoundtrack({ storage = globalThis.localStorage, fetchRef = globalThis.fetch, AudioContextRef = globalThis.AudioContext || globalThis.webkitAudioContext, documentRef = globalThis.document } = {}) {
  let ctx, gain, src, on, trackId = DEFAULT_TRACK, epoch = 0, disposed = false, tracks = null;
  const cache = new Map(), pending = new Map();
  try {
    const v = storage?.getItem(KEY);
    // Respect the site-wide TV mute (tv/sound.js) as the default when this app has no choice saved.
    on = v != null ? v !== '0' : storage?.getItem(TV_MUTE) !== '1';
  } catch { on = true; }
  const save = () => { try { storage?.setItem(KEY, on ? '1' : '0'); } catch {} };
  const catalog = () => loadCatalog(fetchRef).catch(e => { warn('catalog', e); return []; });
  const find = async id => (tracks ||= await catalog()).find(t => t.id === id);

  function stop(fade = true) {
    const s = src; src = null;
    if (!s) return;
    try {
      if (fade && ctx && gain) { gain.gain.cancelScheduledValues?.(ctx.currentTime); gain.gain.setValueAtTime?.(gain.gain.value, ctx.currentTime); gain.gain.linearRampToValueAtTime?.(0, ctx.currentTime + FADE); s.stop(ctx.currentTime + FADE); }
      else s.stop();
    } catch {}
  }
  function buffer(t) {
    if (cache.has(t.id)) { const b = cache.get(t.id); cache.delete(t.id); cache.set(t.id, b); return Promise.resolve(b); }
    if (pending.has(t.id)) return pending.get(t.id);
    const p = (async () => {
      const r = await fetchRef(t.url);
      if (!r.ok) throw new Error(`${t.id} ${r.status}`);
      const b = await ctx.decodeAudioData(await r.arrayBuffer());
      cache.set(t.id, b);
      while (cache.size > MAX_CACHE) cache.delete(cache.keys().next().value);
      return b;
    })().finally(() => pending.delete(t.id));
    pending.set(t.id, p);
    return p;
  }
  async function play() {
    const my = ++epoch;
    if (!on || !ctx || disposed) { stop(); return; }
    try {
      const t = await find(trackId);
      if (!t) return;
      const b = await buffer(t);
      if (my !== epoch || !on || disposed) return;
      stop(false);
      const s = ctx.createBufferSource();
      s.buffer = b; s.loop = true; s.loopStart = t.loopStart; s.loopEnd = t.loopEnd;
      s.connect(gain);
      gain.gain.cancelScheduledValues?.(ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(1, ctx.currentTime + FADE);
      s.start(0, t.loopStart);
      src = s;
    } catch (e) { warn('play ' + trackId, e); }
  }
  const onVis = () => {
    if (!ctx || disposed) return;
    try { documentRef.hidden ? ctx.suspend() : on && ctx.resume(); } catch {}
  };
  documentRef?.addEventListener?.('visibilitychange', onVis);

  return {
    catalog,
    unlock(id) {
      if (disposed) return;
      if (id) trackId = id;   // start the caller's track, not the default (play() ignores an unknown id)
      try {
        if (!ctx && AudioContextRef) { ctx = new AudioContextRef(); gain = ctx.createGain(); gain.connect(ctx.destination); }
        if (!ctx) return warn('ctx', 'no AudioContext');
        const was = ctx.state === 'running';
        if (!was) ctx.resume?.();
        if (!src) play();
      } catch (e) { warn('unlock', e); }
    },
    async select(id) {
      if (!(await find(id))) return;
      if (id === trackId && src) return;   // already looping this song: never restart it
      trackId = id;
      await play();
    },
    async setOn(v) { on = !!v; save(); if (on) { try { ctx?.resume?.(); } catch {} await play(); } else { epoch++; stop(); } },
    async prefetch(ids = []) {
      if (!ctx) return;
      for (const id of ids.slice(0, MAX_CACHE - 1)) { const t = await find(id); if (t) await buffer(t).catch(e => warn('prefetch', e)); }
    },
    get on() { return on; },
    get trackId() { return trackId; },
    get unlocked() { return !!ctx && ctx.state === 'running'; },
    dispose() {
      if (disposed) return;
      disposed = true; epoch++;
      stop(false);
      documentRef?.removeEventListener?.('visibilitychange', onVis);
      try { ctx?.close?.(); } catch {}
      cache.clear();
    },
  };
}
