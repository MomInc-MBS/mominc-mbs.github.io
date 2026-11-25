// Gallery UI: DOM port of GalleryOverlay.kt + the Album | Memory Universe chooser from MainActivity (no redesign).
// Nothing is uploaded: Share uses navigator.share({files}) when the platform can, else a plain <a download>.
import * as store from './store.mjs';
import {createBridge, startGateE} from './universe/adapter.mjs';

const css = new URL('gallery.css', import.meta.url).href;
if (!document.querySelector(`link[href="${css}"]`)) document.head.append(Object.assign(document.createElement('link'), {rel: 'stylesheet', href: css}));

const el = (tag, cls, text, attrs) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
const btn = (text, on, label) => { const b = el('button', null, text, {type: 'button', ...(label ? {'aria-label': label} : {})}); b.onclick = on; return b; };
const EXT = {'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov'};
const mb = n => (n / 1048576 >= 1024 ? (n / 1073741824).toFixed(1) + ' GB' : Math.round(n / 1048576) + ' MB');

function toast(root, msg) {
  root.querySelector('.lbfg-toast')?.remove();
  const t = el('div', 'lbfg-toast', msg, {role: 'status'}); root.append(t); setTimeout(() => t.remove(), 3500);
}
function dialog(host, title, build) {
  const d = el('div', 'lbfg lbfg-dialog'), box = el('div', 'lbfg-box', null, {role: 'dialog', 'aria-label': title});
  box.append(el('h2', null, title)); d.append(box); build(box, () => d.remove()); host.append(d); return d;
}

/** Share (files) when the platform supports it, else download. Returns 'shared' | 'downloaded' | 'cancelled'. */
export async function shareOrDownload(rec, album) {
  const type = rec.blob.type || (rec.kind === 'video' ? 'video/mp4' : 'image/jpeg');
  const name = `${album || 'LittleBoyfriend'}-${rec.id}.${EXT[type.split(';')[0]] || (rec.kind === 'video' ? 'mp4' : 'jpg')}`.replace(/\s+/g, '_');
  const file = new File([rec.blob], name, {type});
  if (navigator.canShare?.({files: [file]})) {
    try { await navigator.share({files: [file], title: album}); return 'shared'; }
    catch (e) { if (e.name === 'AbortError') return 'cancelled'; /* else fall through to download */ }
  }
  const url = URL.createObjectURL(file), a = el('a', null, null, {download: name, href: url});
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000);
  return 'downloaded';
}

/** Photo/video viewer (back, Share, Delete). onClose(deleted). Used by the grid and, on its own, by the Universe. */
export async function showViewer(host, id, {onClose} = {}) {
  const rec = await store.get(id);
  if (!rec) { onClose?.(false); return null; }
  const v = el('div', 'lbfg lbfg-viewer', null, {role: 'dialog', 'aria-label': rec.kind === 'video' ? 'Video viewer' : 'Photo viewer'});
  const stage = el('div', 'lbfg-stage'), url = URL.createObjectURL(rec.blob);
  stage.append(rec.kind === 'video' ? Object.assign(el('video', null, null, {playsinline: '', controls: '', autoplay: ''}), {src: url, playsInline: true}) : Object.assign(el('img', null, null, {alt: ''}), {src: url}));
  let done = false;
  const close = deleted => { if (done) return; done = true; document.removeEventListener('keydown', onKey); stage.querySelector('video')?.pause(); v.remove(); URL.revokeObjectURL(url); onClose?.(deleted); };
  const onKey = e => { if (e.key === 'Escape') close(false); };
  document.addEventListener('keydown', onKey);
  const bar = el('div', 'lbfg-bar');
  bar.append(btn('← Back', () => close(false), 'Close viewer'),
    btn('Share', async () => { const r = await shareOrDownload(rec, await store.getAlbumName()); if (r === 'downloaded') toast(v, 'Saved to your downloads'); }),
    btn('Delete', () => dialog(v, `Delete ${rec.kind}?`, (box, gone) => {
      const row = el('div', 'lbfg-row');
      row.append(btn('Cancel', gone), btn('Delete', async () => { gone(); try { await store.remove(id); close(true); } catch { toast(v, "Couldn't delete"); } }));
      box.append(row);
    })));
  v.append(stage, bar); host.append(v);
  bar.querySelector('button').focus?.();
  return {close};
}

/** Album grid. */
export function openGallery(host, {onClose} = {}) {
  const root = el('div', 'lbfg', null, {role: 'dialog', 'aria-label': 'Gallery'});
  const name = el('input', 'lbfg-name', null, {type: 'text', placeholder: 'Album name', 'aria-label': 'Album name', enterkeyhint: 'done', autocomplete: 'off'});
  const count = el('div', 'lbfg-count'), stor = el('div', 'lbfg-store'), grid = el('div', 'lbfg-grid');
  const title = el('div', 'lbfg-title'); title.append(name, count, stor);
  let all = [], asc = false, closed = false;
  const urls = new Map(), io = new IntersectionObserver(es => {
    for (const e of es) {
      const c = e.target, id = Number(c.dataset.id), img = c.firstChild;
      if (e.isIntersecting && c._thumb && !urls.has(id)) { const u = URL.createObjectURL(c._thumb); urls.set(id, u); img.src = u; }
      else if (!e.isIntersecting && urls.has(id)) { img.removeAttribute('src'); URL.revokeObjectURL(urls.get(id)); urls.delete(id); }
    }
  }, {root: grid, rootMargin: '150% 0px'});

  const sortBtn = btn('', () => { asc = !asc; render(); });
  function render() {
    sortBtn.textContent = asc ? 'Sort: Oldest first' : 'Sort: Newest first';
    sortBtn.setAttribute('aria-label', `Sort order, ${asc ? 'oldest' : 'newest'} first, tap to reverse`);
    io.disconnect(); for (const u of urls.values()) URL.revokeObjectURL(u); urls.clear();
    const items = asc ? all : [...all].reverse(), cells = [];
    for (const it of items) {
      const c = el('button', 'lbfg-cell', null, {type: 'button', 'data-id': it.id, 'aria-label': it.kind === 'video' ? 'Open video' : 'Open photo'});
      c._thumb = it.thumbBlob; c.append(el('img', null, null, {alt: '', draggable: 'false'}));
      if (it.kind === 'video') c.append(el('span', 'lbfg-play', '▶'));
      c.onclick = () => showViewer(root, it.id, {onClose: deleted => { if (deleted) reload(); }});
      cells.push(c);
    }
    grid.replaceChildren(...(cells.length ? cells : [el('div', 'lbfg-empty', 'No memories yet — take a photo or video first')]));
    cells.forEach(c => io.observe(c));
  }
  async function reload() {
    name.value = await store.getAlbumName();
    all = await store.list();
    const v = all.filter(i => i.kind === 'video').length;
    count.textContent = `${all.length - v} photos · ${v} videos`;
    const u = await store.usage(); stor.textContent = u ? `Stored on this device: ${mb(u.usage)} of ${mb(u.quota)} available` : '';
    if (!closed) render();
  }
  async function rename() {
    try { name.value = await store.setAlbumName(name.value); toast(root, 'Album: ' + name.value); }
    catch (e) { toast(root, e.message || 'Invalid name'); name.value = await store.getAlbumName(); }
  }
  name.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); name.blur(); rename(); } });
  const close = () => { if (closed) return; closed = true; document.removeEventListener('keydown', onKey); io.disconnect(); for (const u of urls.values()) URL.revokeObjectURL(u); urls.clear(); root.remove(); onClose?.(); };
  const onKey = e => { if (e.key === 'Escape' && !root.querySelector('.lbfg-viewer, .lbfg-dialog')) close(); };
  document.addEventListener('keydown', onKey);

  const head = el('div', 'lbfg-head'), sortRow = el('div', 'lbfg-sortrow');
  head.append(btn('✕', close, 'Close gallery'), title, btn('Rename', rename));
  sortRow.append(sortBtn);
  root.append(head, sortRow, grid); host.append(root);
  reload().catch(e => toast(root, 'Could not read your album: ' + (e.message || e)));
  return {close, reload};
}

/** Memory Universe: the vendored flight page in an iframe, fed by the adapter (window.LBF bridge, catalog, thumbs). */
export function openUniverse(host, {onClose, onOpen} = {}) {
  const root = el('div', 'lbfg lbfg-uni', null, {role: 'dialog', 'aria-label': 'Memory Universe'});
  const frame = el('iframe', null, null, {title: 'Memory Universe', allow: ''});
  let stopE = null, closed = false;
  // slot -> record id comes from the same slot map the page's catalog is built from
  async function openSlot(slot) {
    const m = await store.slotMap(), it = m.items.find(i => m.slotOf(i.id) === slot);
    if (!it) return;
    onOpen?.(it);
    stopE?.(); stopE = null; // no videos playing under the viewer
    showViewer(root, it.id, {onClose: deleted => {
      if (closed) return;
      if (deleted) frame.contentWindow?.universeReload?.();
      stopE = startGateE(frame, bridge.blobOf);
    }});
  }
  const bridge = createBridge({back: () => close(), open: openSlot});
  const mine = bridge; window.LBF = mine;
  function close() {
    if (closed) return; closed = true;
    stopE?.(); bridge.dispose(); if (window.LBF === mine) delete window.LBF;
    document.removeEventListener('keydown', onKey); root.remove(); onClose?.();
  }
  const onKey = e => { if (e.key === 'Escape' && !root.querySelector('.lbfg-viewer, .lbfg-dialog')) close(); };
  document.addEventListener('keydown', onKey);
  frame.src = new URL('universe/index.html', import.meta.url).href;
  frame.addEventListener('load', () => { stopE ??= startGateE(frame, bridge.blobOf); }, {once: true});
  root.append(frame); host.append(root);
  return {close, frame};
}

/** The Gallery button: native "Gallery: Album | Memory Universe" chooser. */
export function openGalleryChooser(host, {onClose, onOpen} = {}) {
  return dialog(host, 'Gallery', (box, gone) => {
    box.append(btn('Album', () => { gone(); openGallery(host, {onClose}); }), btn('Memory Universe', () => { gone(); openUniverse(host, {onClose, onOpen}); }));
    for (const b of box.querySelectorAll('button')) b.className = 'lbfg-opt';
    box.append(btn('Cancel', () => { gone(); onClose?.(); }));
    box.lastChild.className = 'lbfg-opt';
  });
}
