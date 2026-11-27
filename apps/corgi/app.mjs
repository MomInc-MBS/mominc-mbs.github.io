// Installed-app host for Mom's Endless Corgi Workday (the Corgi Endless app). It mounts the SAME engine as the story (tv/channels/corgi.js)
// and selects endless by handing it ctx.endless: no query string, story mode or URL can reach that branch.
// No story shim, receipts, redirects or hourly reset are loaded here; the engine gets no `mbs` object at all.
import {loadStore, saveStore, PERKS, traitIcon, nextLine} from '/tv/channels/corgi-endless.mjs';
import {LOOKS, LOOK_GROUPS, DEFAULT_LOOK, lookById, applyLook} from '/tv/channels/corgi-looks.mjs';

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

// The mounted game, so the Customization leaf can reach it. A look change while a locker sequence runs waits for cc:locker-idle.
let live = null;
const savedLook = () => { const id = loadStore(localStorage).settings.appearance; return /^animal_\d{3}$/.test(id || '') ? id : DEFAULT_LOOK; };

export async function mountCorgi(host) {
  const html = await (await fetch('/tv/channels/corgi.html')).text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  // The story page's TV promo and editorial are not part of the app: drop them before they can fetch anything.
  doc.querySelectorAll('[data-network-launch],[data-corgi-editorial]').forEach(n => n.remove());
  host.replaceChildren(...doc.head.childNodes, ...doc.body.childNodes);
  const root = host.querySelector('#cc');
  applyLook(root, lookById(savedLook()));
  const mod = (await import('/tv/channels/corgi.js')).default;
  const ctx = makeContext(root, {app: true});
  try { mod.mount(root, ctx); } catch (e) { ctx.dispose(); throw e; }
  let queued = null;
  const setLook = id => {
    if (root.dataset.locker) { queued = id; return; }   // the running locker sequence keeps one consistent animal
    applyLook(root, lookById(id)); root.dispatchEvent(new CustomEvent('cc:look', {detail: {id}}));
  };
  ctx.on(root, 'cc:locker-idle', () => { if (queued) { const id = queued; queued = null; setLook(id); } });
  root.dispatchEvent(new CustomEvent('cc:look', {detail: {id: root.dataset.lookId}}));
  const ctl = {
    counts: ctx.counts, root, setLook,
    pause() { root.dispatchEvent(new CustomEvent('cc:pause')); },
    resume() { root.dispatchEvent(new CustomEvent('cc:resume')); },
    dispose() { try { mod.unmount(); } catch {} ctx.dispose(); host.replaceChildren(); if (live === ctl) live = null; }
  };
  live = ctl;
  return ctl;
}

// ---- Settings leaf, Customization leaf and the folding newspaper. Everything is written into the generated menu (#np-*).
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
const $ = id => document.getElementById(id);
const panel = (title, ...kids) => { const s = el('section', 'panel'); s.append(el('p')); s.firstChild.append(el('strong', '', title)); s.append(...kids); return s; };
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

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
  wall.addEventListener('keydown', e => { if (e.key === 'Escape') wall.remove(); });
  sheet.append(grid, close); wall.append(sheet); document.body.append(wall); close.focus();
}

// The folding newspaper: three leaves (0 Settings, 1 Front, 2 Customization). One is flat and active; its neighbours stand
// folded at the sides as a sliver. Each leaf hinges on the spine it shares with the active one; backfaces are hidden, so no mirrored text.
function paper(menu, hooks) {
  const sheet = menu.querySelector('.np-sheet'), leaves = [...sheet.querySelectorAll('.np-leaf')];
  let at = 1, want = 1, busy = false;
  const ms = () => reduced() ? 120 : 440;
  const paint = () => leaves.forEach((l, i) => {
    const d = i - at; l.dataset.d = String(d);
    l.inert = d !== 0; l.setAttribute('aria-hidden', String(d !== 0));
  });
  const step = () => {
    if (busy || want === at) return;
    busy = true; hooks.leaving?.(at);
    at += Math.sign(want - at); sheet.dataset.at = String(at); paint(); hooks.arrived?.(at);
    setTimeout(() => { busy = false; step(); if (!busy) leaves[at].querySelector('[data-first]')?.focus?.({preventScroll: true}); }, ms());
  };
  const go = i => { want = Math.max(0, Math.min(2, i)); step(); };   // rapid requests coalesce to the latest destination; far hops pass through the front page
  menu.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b && menu.contains(b) && !b.closest('[inert]')) go(Number(b.dataset.go)); });
  // Deliberate horizontal swipes only: sliders, form controls and mostly-vertical drags never turn a page.
  let t = null;
  sheet.addEventListener('pointerdown', e => {
    t = e.target.closest('input,select,textarea,.np-noswipe') ? null : {x: e.clientX, y: e.clientY, id: e.pointerId, time: e.timeStamp};
  });
  sheet.addEventListener('pointerup', e => {
    if (!t || t.id !== e.pointerId) return;
    const dx = e.clientX - t.x, dy = e.clientY - t.y, dt = e.timeStamp - t.time; t = null;
    if (Math.abs(dx) >= 64 && Math.abs(dx) > Math.abs(dy) * 2 && dt < 900) go(at + (dx < 0 ? 1 : -1));
  });
  sheet.addEventListener('pointercancel', () => { t = null; });
  paint(); sheet.dataset.at = '1';
  return {go, get at() { return at; }, reset() { want = at = 1; busy = false; sheet.dataset.at = '1'; paint(); }};
}

export function setupSettings({refresh}) {
  const menu = $('menu'), slot = $('np-settings-slot');
  if (!slot || !menu?.classList.contains('np')) return;   // not the newspaper menu: nothing to build
  const store = () => loadStore(localStorage), write = fn => { const s = store(); fn(s); saveStore(localStorage, s); };
  const start = $('start'), back = $('back');
  let paused = false;

  // ---- Settings leaf
  const sound = el('button', 'alt'); sound.type = 'button'; sound.id = 'sound';
  const paintSound = () => { const on = store().settings.sound; sound.textContent = 'Sound: ' + (on ? 'ON' : 'OFF'); sound.setAttribute('aria-pressed', String(on)); };
  sound.onclick = () => { write(s => { s.settings.sound = !s.settings.sound; }); paintSound(); }; paintSound();
  const scale = (id, label, min, max, step, value, fmt, key) => {
    const input = el('input'); input.type = 'range'; input.id = id; input.min = min; input.max = max; input.step = step; input.value = value; input.setAttribute('aria-label', label);
    const out = el('output', '', fmt(Number(input.value))); out.htmlFor = id;
    const ticks = el('div', 'np-ticks'); ticks.setAttribute('aria-hidden', 'true'); ticks.append(el('span', '', fmt(Number(min))), el('span', '', fmt(Number(max))));
    const paint = () => input.style.setProperty('--p', (input.value - min) / (max - min));
    input.oninput = () => { write(s => { s.settings[key] = Number(input.value); }); out.textContent = fmt(Number(input.value)); paint(); };
    paint();
    const row = el('div', 'np-scale'); row.append(input, out); return [row, ticks];
  };
  const amb = store().settings.ambience, ambV = typeof amb === 'number' && amb >= 0 && amb <= 1 ? amb : .5;
  const note = el('p'); note.id = 'reset-run-note'; note.setAttribute('role', 'status');
  const reset = el('button', 'alt', 'Reset run'); reset.type = 'button'; reset.id = 'reset-run';
  reset.onclick = () => {
    if (paused) { note.textContent = 'A run is paused. Resume it before resetting.'; return; }
    if (!confirm('Reset this run? Your best section and best trait counts stay.')) return;
    write(s => { s.run = null; }); note.textContent = 'Run reset. A new one starts when you press Start.'; refresh?.();
  };
  const wall = el('button', 'alt', 'Open the wall'); wall.type = 'button'; wall.id = 'open-wall'; wall.onclick = openWall;
  slot.replaceChildren(panel('Sound', sound), panel('Ambience volume', ...scale('ambience', 'Ambience volume', 0, 1, .05, ambV, v => Math.round(v * 100) + '%', 'ambience')),
    panel('Look sensitivity', ...scale('look', 'Look sensitivity', .5, 2, .1, store().settings.look, v => v.toFixed(1) + 'x', 'look')), panel('Run', reset, note), panel('The wall', wall));

  // ---- Customization leaf
  const prev = $('lk-prev'), nameEl = $('lk-name'), posEl = $('lk-pos'), noteEl = $('lk-note'), useBtn = $('lk-use'), filter = $('lk-group');
  let active = savedLook(), cand = active, list = LOOKS;
  const show = id => {
    cand = id; const l = lookById(id); applyLook(prev, l);
    const i = list.findIndex(x => x.id === id);
    nameEl.textContent = l.name; posEl.textContent = (i + 1) + ' / ' + list.length; $('lk-id').textContent = 'No. ' + id.slice(7);
    $('lk-sw-fur').style.background = l.base; $('lk-sw-skin').style.background = l.skin; $('lk-sw-claw').style.background = l.claw;
    const using = id === active; useBtn.disabled = using; useBtn.textContent = using ? 'In use ✓' : 'Use this look'; prev.dataset.using = String(using);
    noteEl.textContent = using ? 'This is the look you wear in the halls.' : 'Previewing. Press Use this look to wear it.';
  };
  const move = d => { let i = list.findIndex(x => x.id === cand); if (i < 0) i = 0; show(list[(i + d + list.length) % list.length].id); };
  $('lk-prev-btn').onclick = () => move(-1); $('lk-next-btn').onclick = () => move(1);
  $('lk-shuffle').onclick = () => { const pool = (list.length > 1 ? list : LOOKS).filter(x => x.id !== cand); show(pool[Math.floor(Math.random() * pool.length)].id); };
  filter.append(...LOOK_GROUPS.map(g => { const o = el('option', '', g[0].toUpperCase() + g.slice(1)); o.value = g; return o; }));
  filter.onchange = () => { list = filter.value ? LOOKS.filter(l => l.group === filter.value) : LOOKS; show(list.some(l => l.id === cand) ? cand : list[0].id); };
  useBtn.onclick = () => {
    active = cand; write(s => { s.settings.appearance = active; });
    live?.setLook(active); show(cand); noteEl.textContent = 'Saved. ' + (live?.root.dataset.locker ? 'It takes effect when you step out of the locker.' : 'You wear it now.');
  };
  let pullTimer = 0;
  const grip = () => prev.querySelector('.cc-grip');
  $('lk-pull').onclick = () => {
    clearTimeout(pullTimer); grip().className = 'cc-grip on';
    pullTimer = setTimeout(() => { grip().className = 'cc-grip pull'; pullTimer = setTimeout(() => { grip().className = 'cc-grip'; }, 1300); }, 700);
  };
  show(active);

  // ---- the paper itself. Leaving Customization without applying keeps the old look.
  const pap = paper(menu, {
    arrived: i => { if (i === 2) show(active); },
    leaving: i => { if (i === 2) { clearTimeout(pullTimer); grip().className = 'cc-grip'; } }
  });

  // ---- pause surface: "← Menu" during a run pauses it; Resume returns to the same mounted game
  const label = () => { start.textContent = paused ? 'Resume run' : 'Start'; $('np-ad-note').textContent = paused ? 'Your run is paused.' : 'A new school day begins.'; };
  let closing = false;
  start.addEventListener('click', e => {
    if (closing) return;
    if (!reduced()) {   // fold the newspaper away, then let the shell reveal the game
      e.stopImmediatePropagation(); closing = true; menu.classList.add('np-closing');
      setTimeout(() => { menu.classList.remove('np-closing'); start.click(); closing = false; }, 380);
    }
  }, true);
  start.addEventListener('click', () => { if (paused) { paused = false; label(); } });
  back.addEventListener('click', () => { if (live) { paused = true; pap.reset(); show(active); } label(); refresh?.(); });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || menu.hidden || $('stage').hidden === false) return;
    if (pap.at !== 1) pap.go(1); else if (paused) start.click();
  });
  $('np-date').textContent = new Date().toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'}).toUpperCase();
  label();
}
