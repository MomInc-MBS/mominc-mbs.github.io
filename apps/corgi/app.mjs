// Installed-app host for Cortisol Corgi Endless. It mounts the SAME engine as the story (tv/channels/corgi.js)
// and selects endless by handing it ctx.endless: no query string, story mode or URL can reach that branch.
// No story shim, receipts, redirects or hourly reset are loaded here; the engine gets no `mbs` object at all.
import {loadStore, saveStore, PERKS, traitIcon, nextLine} from '/tv/channels/corgi-endless.mjs';

// Same disposable registry the TV runtime hands a channel (tv/channel-runtime.js makeContext), minus the TV.
function makeContext(root, endless) {
  const listeners = [], timeouts = [], intervals = [], observers = [], audios = [], frames = new Set();
  return {
    name: 'corgi', root, endless,
    on(t, type, fn, opts) { t.addEventListener(type, fn, opts); listeners.push([t, type, fn, opts]); return fn; },
    timeout(fn, ms) { const id = setTimeout(fn, ms); timeouts.push(id); return id; },
    interval(fn, ms) { const id = setInterval(fn, ms); intervals.push(id); return id; },
    frame(fn) { const id = requestAnimationFrame(t => { frames.delete(id); fn(t); }); frames.add(id); return id; },
    observe(obs, target, opts) { if (target) obs.observe(target, opts); observers.push(obs); return obs; },
    audio(a) { audios.push(a); return a; },
    counts: () => ({listeners: listeners.length, timeouts: timeouts.length, intervals: intervals.length, frames: frames.size, observers: observers.length, audios: audios.length}),
    dispose() {
      listeners.forEach(l => { try { l[0].removeEventListener(l[1], l[2], l[3]); } catch {} });
      timeouts.forEach(clearTimeout); intervals.forEach(clearInterval); frames.forEach(cancelAnimationFrame);
      observers.forEach(o => { try { o.disconnect(); } catch {} });
      audios.forEach(a => { try { if (a && a.state !== 'closed') a.close(); } catch {} });
    }
  };
}

export async function mountCorgi(host) {
  const html = await (await fetch('/tv/channels/corgi.html')).text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  // The story page's TV promo and editorial are not part of the app: drop them before they can fetch anything.
  doc.querySelectorAll('[data-network-launch],[data-corgi-editorial]').forEach(n => n.remove());
  host.replaceChildren(...doc.head.childNodes, ...doc.body.childNodes);
  const root = host.querySelector('#cc');
  const mod = (await import('/tv/channels/corgi.js')).default;
  const ctx = makeContext(root, {app: true});
  try { mod.mount(root, ctx); } catch (e) { ctx.dispose(); throw e; }
  return {counts: ctx.counts, dispose() { try { mod.unmount(); } catch {} ctx.dispose(); host.replaceChildren(); }};
}

// ---- Settings (sound, look sensitivity, reset run) and the wall of ten perk pages. Written into the shell's #settings.
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
const panel = (title, ...kids) => { const s = el('section', 'panel'); s.append(el('p')); s.firstChild.append(el('strong', '', title)); s.append(...kids); return s; };

export function openWall() {
  const store = loadStore(localStorage), now = store.run?.traits || {};
  const wall = el('section', 'wall'); wall.setAttribute('role', 'dialog'); wall.setAttribute('aria-modal', 'true'); wall.setAttribute('aria-label', 'The wall');
  const sheet = el('article', 'wall-sheet');
  sheet.append(el('header', '', 'THE NAUSEOUS TIMES · THE WALL'), el('h2', '', 'TEN TRAITS'),
    el('p', 'wall-sub', 'Best section: ' + store.best.section + (store.run ? ' · this run: section ' + store.run.section : '') + '. Traits stack without limit.'));
  const grid = el('div', 'wall-grid');
  for (const p of PERKS) {
    const best = store.best.traits[p.id] || 0, cur = now[p.id] || 0, page = el('div', 'wall-page'), head = el('b', '', p.name);
    const icon = document.createElement('template'); icon.innerHTML = traitIcon(p.id); head.prepend(icon.content.firstChild);
    const counts = el('span', 'wall-counts', cur ? '×' + cur + ' now · best ×' + best : best ? 'best ×' + best : 'Not found yet');
    page.append(head, counts, el('small', '', nextLine(p.id, cur)));
    grid.append(page);
  }
  const close = el('button', 'alt', 'Close'); close.type = 'button'; close.onclick = () => wall.remove();
  sheet.append(grid, close); wall.append(sheet); document.body.append(wall); close.focus();
}

export function setupSettings({root, refresh}) {
  const store = () => loadStore(localStorage), write = fn => { const s = store(); fn(s); saveStore(localStorage, s); };
  const sound = el('button', 'alt'); sound.type = 'button'; sound.id = 'sound';
  const paintSound = () => { const on = store().settings.sound; sound.textContent = 'Sound: ' + (on ? 'on' : 'off'); sound.setAttribute('aria-pressed', String(on)); };
  sound.onclick = () => { write(s => { s.settings.sound = !s.settings.sound; }); paintSound(); }; paintSound();
  const look = el('input'); look.type = 'range'; look.id = 'look'; look.min = '0.5'; look.max = '2'; look.step = '0.1'; look.value = store().settings.look; look.setAttribute('aria-label', 'Look sensitivity');
  const lookOut = el('output', '', Number(look.value).toFixed(1) + 'x');
  look.oninput = () => { write(s => { s.settings.look = Number(look.value); }); lookOut.textContent = Number(look.value).toFixed(1) + 'x'; };
  const note = el('p'); note.id = 'reset-run-note'; note.setAttribute('role', 'status');
  const reset = el('button', 'alt', 'Reset run'); reset.type = 'button'; reset.id = 'reset-run';
  reset.onclick = () => { if (!confirm('Reset this run? Your best section and best trait counts stay.')) return; write(s => { s.run = null; }); note.textContent = 'Run reset. A new one starts when you press Start.'; refresh?.(); };
  const wall = el('button', 'alt', 'Open the wall'); wall.type = 'button'; wall.id = 'open-wall'; wall.onclick = openWall;
  const anchor = root.querySelector('.panel');
  const panels = [panel('Sound', sound), panel('Look sensitivity', look, lookOut), panel('Run', reset, note), panel('The wall', wall)];
  anchor ? anchor.before(...panels) : root.querySelector('h2').after(...panels);
}
