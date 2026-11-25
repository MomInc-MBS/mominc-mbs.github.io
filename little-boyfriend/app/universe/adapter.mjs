// WEB adapter for the vendored Memory Universe (replaces what Kotlin serves natively: window.LBF bridge, /catalog.json, /thumb/<slot>).
// Not vendored: written for this PWA. Slots come from store.slotMap() (UniverseSlots port); thumbs are object URLs revoked on release().
import * as store from '../store.mjs';

export function createBridge({open, back}) {
  const urls = new Map(), ids = new Map(); // slot -> objectURL, slot -> record id
  const release = slot => { const u = urls.get(slot); if (u) { URL.revokeObjectURL(u); urls.delete(slot); } };
  return {
    open, back, release,
    async catalog() {
      const m = await store.slotMap();
      ids.clear();
      const items = m.items.map(i => { const slot = m.slotOf(i.id); ids.set(slot, i.id); return {slot, type: i.kind, w: i.w, h: i.h, durMs: i.durMs, t: Math.floor(i.createdAt / 1000)}; });
      return {album: await store.getAlbumName(), maxSlot: m.maxSlot, items: items.sort((a, b) => a.slot - b.slot)};
    },
    async thumb(slot) {
      release(slot);
      const rec = ids.has(slot) ? await store.get(ids.get(slot)) : null;
      if (!rec?.thumbBlob) return '';
      const u = URL.createObjectURL(rec.thumbBlob); urls.set(slot, u); return u;
    },
    blobOf: async slot => (ids.has(slot) ? (await store.get(ids.get(slot)))?.blob : null),
    dispose() { for (const s of [...urls.keys()]) release(s); },
  };
}

/**
 * Gate E: nearby videos play muted, looped, inline. A video panel plays when it is in view AND either the flight is
 * approaching it (panel centre within APPROACH of the viewport centre while the route scrolls) or the user has been
 * stationary (no scroll for DWELL ms). At most MAX_PLAY at once, nearest the centre first; paused/removed when off-screen
 * or the app is hidden. Returns stop().
 */
export const GATE_E = {MAX_PLAY: 2, DWELL: 600, APPROACH: 0.3, TICK: 120};
export function startGateE(iframe, blobOf) {
  const live = new Map(); // panel -> {video, url}
  let lastTop = null, lastMove = performance.now();
  const stopOne = p => {
    const e = live.get(p); if (!e) return; live.delete(p);
    if (e.video) { e.video.pause(); e.video.remove(); e.video.removeAttribute('src'); e.video.load(); }
    if (e.url) URL.revokeObjectURL(e.url);
  };
  const stopAll = () => { for (const p of [...live.keys()]) stopOne(p); };
  async function startOne(p) {
    const e = {video: null, url: null}; live.set(p, e);
    const blob = await blobOf(Number(p.dataset.slot));
    if (!blob || live.get(p) !== e) return;
    const v = p.ownerDocument.createElement('video');
    v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.preload = 'auto';
    v.style.cssText = 'position:absolute;inset:3px;width:calc(100% - 6px);height:calc(100% - 6px);object-fit:contain;pointer-events:none;border-radius:3px;background:#000';
    e.url = URL.createObjectURL(blob); v.src = e.url; e.video = v; p.append(v);
    v.play().catch(() => {});
  }
  function tick() {
    const doc = iframe.contentDocument, vp = doc?.getElementById('viewport');
    if (!vp || document.hidden) return stopAll();
    const now = performance.now();
    if (vp.scrollTop !== lastTop) { if (lastTop !== null) lastMove = now; lastTop = vp.scrollTop; }
    const still = now - lastMove >= GATE_E.DWELL;
    const vr = vp.getBoundingClientRect(), cy = vr.top + vr.height / 2;
    const want = [];
    for (const p of doc.querySelectorAll('.mu-panel')) {
      if (!p.querySelector('.mu-badge')) continue; // videos only
      const r = p.getBoundingClientRect();
      if (r.bottom < vr.top || r.top > vr.bottom || r.right < vr.left || r.left > vr.right) continue;
      const d = Math.abs(r.top + r.height / 2 - cy);
      if (still || d < vr.height * GATE_E.APPROACH) want.push([d, p]);
    }
    const keep = new Set(want.sort((a, b) => a[0] - b[0]).slice(0, GATE_E.MAX_PLAY).map(w => w[1]));
    for (const p of [...live.keys()]) if (!keep.has(p) || !p.isConnected) stopOne(p);
    for (const p of keep) if (!live.has(p)) startOne(p);
  }
  const timer = setInterval(tick, GATE_E.TICK);
  const onVis = () => { if (document.hidden) stopAll(); };
  document.addEventListener('visibilitychange', onVis);
  return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVis); stopAll(); };
}
