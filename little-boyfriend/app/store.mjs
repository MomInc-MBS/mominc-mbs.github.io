// Gallery store (contract section 2). IndexedDB 'lbf': stores media (records with Blobs) + meta (album name, universe slots).
// Rules ported 1:1 from AlbumRepository.kt (AlbumNames) and UniverseSlots.kt. Nothing here touches the network.
export const ALBUM_DEFAULT = 'My Album', ALBUM_MAX = 40;
const BAD = /[\\/:*?"<>|\u0000-\u001f]/;
export function validateAlbumName(raw) {
  const n = String(raw ?? '').trim().replace(/\s+/g, ' ');
  if (!n) throw new Error("Name can't be empty");
  if (n.length > ALBUM_MAX) throw new Error(`Max ${ALBUM_MAX} characters`);
  if (BAD.test(n)) throw new Error('No / \\ : * ? " < > | in the name');
  if (n.startsWith('.') || n.includes('..')) throw new Error("Name can't start with a dot or contain ..");
  return n;
}

// ---- UniverseSlots port: id -> stable slot (1-based). New ids get next++ in (dateAdded, id) order; deleted slots stay reserved.
export class Slots {
  constructor(ser) {
    this.byId = new Map(); this.next = 1;
    const p = typeof ser === 'string' ? ser.split(';') : [];
    if (p.length === 2) {
      this.next = parseInt(p[0], 10) || 1;
      for (const e of p[1].split(',')) {
        const [id, slot] = e.split(':'); const s = parseInt(slot, 10), i = parseInt(id, 10);
        if (!Number.isNaN(s) && !Number.isNaN(i)) { this.byId.set(i, s); if (s >= this.next) this.next = s + 1; }
      }
    }
  }
  get maxSlot() { return this.next - 1; }
  slotOf(id) { return this.byId.get(id); }
  /** items = [[id, dateAddedSeconds]]; returns true if new slots were handed out. */
  assign(items) {
    const fresh = items.filter(i => !this.byId.has(i[0])).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    for (const f of fresh) this.byId.set(f[0], this.next++);
    return fresh.length > 0;
  }
  serialize() { return `${this.next};` + [...this.byId.entries()].sort((a, b) => a[1] - b[1]).map(e => `${e[0]}:${e[1]}`).join(','); }
}

// ---- IndexedDB plumbing
let dbp;
const open = () => dbp ??= new Promise((res, rej) => {
  const r = indexedDB.open('lbf', 1);
  r.onupgradeneeded = () => { const d = r.result; d.createObjectStore('media', {keyPath: 'id', autoIncrement: true}); d.createObjectStore('meta'); };
  r.onsuccess = () => { r.result.onversionchange = () => { r.result.close(); dbp = null; }; res(r.result); };
  r.onerror = () => { dbp = null; rej(r.error); };
});
const isQuota = e => e && (e.name === 'QuotaExceededError' || e.code === 22);
const quotaError = () => Object.assign(new Error('Not enough storage on this device. Delete some memories or free space, then try again. Nothing already saved was lost.'), {code: 'quota'});
const req = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
/** fn(media, meta) issues requests; resolves with its return value once the transaction has committed. */
async function run(mode, fn) {
  const d = await open();
  return new Promise((res, rej) => {
    const tx = d.transaction(['media', 'meta'], mode); let out;
    tx.oncomplete = () => res(out);
    tx.onabort = () => rej(isQuota(tx.error) ? quotaError() : tx.error || new Error('Storage transaction aborted'));
    tx.onerror = e => e.preventDefault(); // surfaces through onabort
    try { out = fn(tx.objectStore('media'), tx.objectStore('meta')); } catch (e) { try { tx.abort(); } catch {} rej(isQuota(e) ? quotaError() : e); }
  });
}
const strip = ({blob, ...rest}) => rest;

// ---- thumbnails (256 px long side, JPEG)
const THUMB = 256;
const toJpeg = (src, w, h) => {
  const k = Math.min(1, THUMB / Math.max(w, h)), c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  return new Promise(r => c.toBlob(r, 'image/jpeg', 0.8));
};
async function photoThumb(blob) {
  const bmp = await createImageBitmap(blob);
  try { return {thumb: await toJpeg(bmp, bmp.width, bmp.height), w: bmp.width, h: bmp.height}; } finally { bmp.close?.(); }
}
/** first decodable frame via <video> (+ short seek where the container allows it) */
async function videoThumb(blob) {
  const url = URL.createObjectURL(blob), v = document.createElement('video');
  v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = url;
  const once = (ev, ms) => new Promise(r => { const t = setTimeout(r, ms); v.addEventListener(ev, () => { clearTimeout(t); r(true); }, {once: true}); });
  try {
    await Promise.race([once('loadeddata', 4000), new Promise((_, rej) => v.addEventListener('error', () => rej(new Error('video decode')), {once: true}))]);
    if (Number.isFinite(v.duration) && v.duration > 0.1) { v.currentTime = 0.05; await once('seeked', 1000); }
    return {thumb: await toJpeg(v, v.videoWidth, v.videoHeight), w: v.videoWidth, h: v.videoHeight, durMs: Number.isFinite(v.duration) ? Math.round(v.duration * 1000) : 0};
  } finally { v.removeAttribute('src'); v.load(); URL.revokeObjectURL(url); }
}
async function makeThumb(blob, kind) {
  try { return await (kind === 'video' ? videoThumb(blob) : photoThumb(blob)); }
  catch { return {thumb: null}; } // undecodable preview: item is still saved, UI shows a placeholder
}

// ---- public API (contract)
export async function save({blob, kind, w, h, durMs}) {
  if (!(blob instanceof Blob) || (kind !== 'photo' && kind !== 'video')) throw new Error('save needs {blob, kind: photo|video}');
  const t = await makeThumb(blob, kind), createdAt = Date.now();
  const rec = {kind, w: w || t.w || 0, h: h || t.h || 0, durMs: kind === 'video' ? (durMs || t.durMs || 0) : 0, createdAt, thumbBlob: t.thumb, blob};
  navigator.storage?.persist?.().catch(() => {});
  const add = await run('readwrite', (media, meta) => {
    const a = media.add(rec);
    a.onsuccess = () => { // reserve the slot in the same transaction: a failed save leaves nothing behind
      const g = meta.get('slots');
      g.onsuccess = () => { const s = new Slots(g.result); s.assign([[a.result, createdAt / 1000]]); meta.put(s.serialize(), 'slots'); };
    };
    return a;
  });
  return add.result;
}
export async function list() {
  const all = await run('readonly', media => media.getAll());
  return all.result.map(strip).sort((a, b) => a.createdAt - b.createdAt || a.id - b.id);
}
export async function get(id) { return (await run('readonly', media => media.get(id))).result ?? null; }
export async function remove(id) { await run('readwrite', media => { media.delete(id); }); } // its slot stays reserved
export async function getAlbumName() { return (await run('readonly', (m, meta) => meta.get('album'))).result || ALBUM_DEFAULT; }
export async function setAlbumName(s) { const n = validateAlbumName(s); await run('readwrite', (m, meta) => { meta.put(n, 'album'); }); return n; }

/** Universe catalog source: stable slots for everything currently stored (assigns missing ones, persists). */
export async function slotMap() {
  const items = await list(), d = await open(), tx = d.transaction('meta', 'readwrite'), meta = tx.objectStore('meta');
  const s = new Slots(await req(meta.get('slots')));
  if (s.assign(items.map(i => [i.id, i.createdAt / 1000]))) meta.put(s.serialize(), 'slots');
  await new Promise(r => { tx.oncomplete = tx.onabort = r; });
  return {items, slotOf: id => s.slotOf(id), maxSlot: s.maxSlot};
}
export async function usage() { try { const {usage, quota} = await navigator.storage.estimate(); return {usage, quota}; } catch { return null; } }
/** test hook: wipe everything */
export async function clearAll() { await run('readwrite', (m, meta) => { m.clear(); meta.clear(); }); }
