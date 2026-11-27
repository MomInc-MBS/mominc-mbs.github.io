// Wordless settings (§5): icons, digits, dates, times, %, math symbols and tile values only; names live in names.js (aria only).
// mountSettings(host, adapter, {face}) consumes ONLY the contract adapter. Base emotion comes only from adapter.snapshot().
import {baseForStage} from './mom-face.js';
// Stage minis: the same three-head ASCII MOM, cropped to the centre head (three heads at 84 px read as a blob).
const createMini = (host, o) => { host.classList.add('mini3'); const inner = document.createElement('div'); host.appendChild(inner); return createMomFace(inner, o); };
import {createMomFace, bustGeometry} from './mom3-face.js';
import {icon, strip, capIcon, SOUND_WAVE, VIB_WAVE, PATTERN_WAVE, SOUNDS, SOUND_GLYPH, CAP_GLYPH, OUTCOME_GLYPH} from './glyphs.js';
import {N, CAP, STATE, SOUND, VIB, OUTCOME} from './names.js';
import {stepTab, hms, countdown, upcoming, nextDue, weekColumns, monthCells, fmtDate, fmtTime, dayOf, weekdayName, todayKey, zoneOf, deviceZone, offsetLabel, validZone} from './time.js';
import {createChallenge} from './challenges.js';
import {createHelp} from './help.js';
import {CHOICES, getChoice, setChoice} from '../games/choice.js';
import {STAGE_AT, REPEAT_S, HOLD_MS} from '../stages.js';

const RAIL = [['clock', 'railClock'], ['sound', 'railSound'], ['screen', 'railScreen'], ['challenge', 'railChallenge'], ['devices', 'railDevices'], ['history', 'railHistory'], ['prefs', 'railPrefs']];
const DRAFT_TABS = new Set(['sound', 'screen', 'challenge']);
const FIELD_TAB = {title: 'clock', time: 'clock', days: 'clock', dates: 'clock', recur: 'clock', sound: 'sound', webhook: 'devices', code: 'challenge'};
const STAGE_IMG = n => new URL(`../stages/stage${n}.webp`, import.meta.url).href;
const clone = o => JSON.parse(JSON.stringify(o ?? null));
const clamp = (v, a = -1, b = 1) => Math.min(b, Math.max(a, v));
const p2 = v => String(v).padStart(2, '0');
const longDate = k => { try { return new Intl.DateTimeFormat(undefined, {dateStyle: 'full', timeZone: 'UTC'}).format(new Date(k + 'T12:00:00Z')); } catch { return k; } };

function h(tag, a, ...kids) {
  const e = document.createElement(tag);
  if (a) for (const k in a) {
    const v = a[k]; if (v == null || v === false) continue;
    if (k === 'on') for (const ev in v) e.addEventListener(ev, v[ev]);
    else if (k === 'html') e.innerHTML = v; else if (k === 'text') e.textContent = v;
    else if (k === 'value') e.value = v; else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(9)) if (c != null && c !== false) e.append(c);
  return e;
}
const ring = () => `<svg class="spin" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/></svg>`;

export function mountSettings(host, adapter, opts = {}) {
  const S = {tab: 'clock', list: [], caps: {}, snap: safeSnap(), draft: null, isNew: false, picked: true, stageSel: 0, hist: null, upd: null, err: null,
    confirmDel: false, preview: false, pv: 0, aud: null, month: null, locked: {}, saving: false, saveUi: null, io: null, chal: null};
  const offs = [], timers = [];
  const emb = !!opts.embedded, root = h('div', {class: emb ? 'ms ms-emb' : 'ms'});
  const bg = h('div', {class: 'ms-bg', 'aria-hidden': 'true'}), probe = h('div', {class: 'ms-probe', 'aria-hidden': 'true'});
  const faceHost = h('div', {class: 'ms-face', 'aria-hidden': 'true'});
  const top = h('div', {class: 'ms-top'});
  const panel = h('div', {class: 'ms-panel', role: 'tabpanel', tabindex: '-1'});
  const rail = h('nav', {class: 'ms-rail', role: 'tablist', 'aria-label': N.rail});
  const live = h('div', {class: 'vh', role: 'status', 'aria-live': 'polite'});
  const stop = stopButton();
  root.append(bg, faceHost, top, panel, stop, rail, live, probe);
  host.appendChild(root);
  const rm0 = !!(S.snap.reducedMotion || globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
  const face = opts.face || createMomFace(faceHost, {reducedMotion: rm0, highContrast: !!S.snap.highContrast, minPx: emb ? 408 : 0});
  // collapsing hero: bust (list at scroll 0) -> pinned eye strip. p = clamp(scrollTop / hD); CSS does the rest from --p (see settings.css hero block).
  let hD = 0, hero = false, raf = 0;
  const setP = () => { raf = 0; root.style.setProperty('--p', hero && hD > 0 ? clamp01(panel.scrollTop / hD).toFixed(4) : '1'); };
  const clamp01 = v => Math.min(1, Math.max(0, v));
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(setP); };
  panel.addEventListener('scroll', onScroll, {passive: true});
  // Embedded (inside the console's CRT): the bust starts at the very top and is contain-fit to 96-144 px; the header controls FLOAT over its corners;
  // the panel starts under the 44 px header row (the hero spacer --sp bridges the rest); MOM's subtitle dock + rail sit under the panel.
  // Sized from the dock's MINIMUM height so typing a long subtitle never resizes MOM; the panel just gets shorter.
  function layoutEmb(H, Wr) {
    const HDR = 44, st = root.style, cs = getComputedStyle(root), railH = parseFloat(cs.getPropertyValue('--rail-h')) || 46;
    const subMin = parseFloat(cs.getPropertyValue('--sub-min')) || 42, sub = root.querySelector('.ms-sub'), dock = Math.max(subMin, sub ? sub.offsetHeight : 0);
    const card = panel.querySelector('.card'), cardH = card ? card.offsetHeight : 66;
    const bh = Math.min(144, Math.max(96, H - railH - subMin - 6 - 4 - cardH));
    const w = Math.min(Wr - 8, bh / bustGeometry(1).h), g = bustGeometry(w); hD = Math.max(0, g.h - HDR - 2);   // scroll extent of the collapse = the spacer
    st.setProperty('--hero-top', '0px'); st.setProperty('--fw2', w.toFixed(1) + 'px'); st.setProperty('--hexp', g.h.toFixed(1) + 'px');
    st.setProperty('--d', (g.h - g.strip).toFixed(1) + 'px'); st.setProperty('--ey', g.eyeTop.toFixed(1) + 'px'); st.setProperty('--pt', HDR + 'px'); st.setProperty('--sp', hD.toFixed(1) + 'px');
    st.setProperty('--dock', dock + 'px'); st.setProperty('--tail', '0px');
    if (hero && hD > 0) st.setProperty('--tail', Math.max(0, panel.clientHeight + hD - panel.scrollHeight).toFixed(1) + 'px');
    setP();
  }
  function layout() {
    const H = root.clientHeight, Wr = root.clientWidth; if (!H || !Wr) return;
    if (emb) return layoutEmb(H, Wr);
    const cs = getComputedStyle(probe), safeT = parseFloat(cs.paddingTop) || 0, safeB = parseFloat(cs.paddingBottom) || 0;
    const heroTop = safeT + 58, card = panel.querySelector('.card'), reserve = (card ? card.offsetHeight : 76) + 14;
    const below = Math.max(66 + safeB, H - panel.offsetTop - panel.offsetHeight);   // rail + MOM's subtitle box (whatever sits under the panel)
    const avail = H - heroTop - below - reserve, maxW = Math.min(Wr, 540);
    let w = maxW; const g0 = bustGeometry(w); if (g0.h > avail) w = Math.max(150, w * avail / g0.h); // short screens: scale the whole bust, never crop a head
    const g = bustGeometry(w); hD = Math.max(0, g.h - g.strip);
    const st = root.style; st.setProperty('--hero-top', heroTop + 'px'); st.setProperty('--fw2', w.toFixed(1) + 'px'); st.setProperty('--hexp', g.h.toFixed(1) + 'px');
    st.setProperty('--d', hD.toFixed(1) + 'px'); st.setProperty('--ey', g.eyeTop.toFixed(1) + 'px'); st.setProperty('--pt', (heroTop + g.strip).toFixed(1) + 'px');
    st.setProperty('--tail', '0px');
    if (hero && hD > 0) st.setProperty('--tail', Math.max(0, panel.clientHeight + hD - panel.scrollHeight).toFixed(1) + 'px'); // short lists still get the full collapse extent
    setP();
  }
  if (typeof ResizeObserver === 'function') { const ro = new ResizeObserver(() => layout()); ro.observe(root); offs.push(() => ro.disconnect()); }
  const ownFace = !opts.face; let mini = null, chal = null, pvTimer = 0;
  const F = (fn, ...a) => { try { face[fn](...a); } catch (e) {} };
  const announce = t => { live.textContent = ''; setTimeout(() => { live.textContent = t; }, 30); };
  const help = createHelp({root, rail, S, face, announce, rm: () => root.classList.contains('ms-rm') || !!S.snap.reducedMotion || rm0});   // typed MOM subtitles; describes existing handlers, never replaces them

  if (emb) root.addEventListener('click', e => { if (S.draft && e.target.closest?.('.ms-sub')) root.classList.toggle('ms-sub-open'); });   // editor open: dock is one line, tap to expand over the panel
  if (emb && typeof ResizeObserver === 'function') { const sub = root.querySelector('.ms-sub'); if (sub) { const ro = new ResizeObserver(() => layout()); ro.observe(sub); offs.push(() => ro.disconnect()); } }

  function safeSnap() { try { return adapter.snapshot() || {}; } catch (e) { return {}; } }
  const toward = el => { try { const r = el.getBoundingClientRect(), f = faceHost.getBoundingClientRect(); return {x: clamp((r.left + r.width / 2 - (f.left + f.width / 2)) / (innerWidth / 2)), y: clamp((r.top + r.height / 2 - (f.top + f.height * .5)) / (innerHeight / 2))}; } catch (e) { return {x: 0, y: .6}; } };
  const now = () => Date.now();
  const tz = () => zoneOf(S.draft);
  const capState = id => S.caps[id]?.state || 'available';
  const applyPrefs = s => { root.classList.toggle('ms-rm', !!s.reducedMotion || rm0); root.classList.toggle('ms-hc', !!s.highContrast); F('setReducedMotion', !!s.reducedMotion || rm0); };

  // ---------- small controls ----------
  const lab = t => t ? `<span class="cp" data-copy>${t}</span>` : '';
  const ib = (label, glyph, on, a = {}) => h('button', {type: 'button', class: 'ib ' + (a.cls || ''), 'aria-label': label, 'data-k': a.k, 'aria-pressed': a.pressed, on: {click: on}, html: a.html || icon(glyph)});
  function sw(label, on, set, glyph, k, extra = '', cp = '') {
    return h('button', {type: 'button', role: 'switch', class: 'sw' + (cp ? ' lb' : ''), 'aria-checked': String(!!on), 'aria-label': label, 'data-k': k, on: {click: () => set(!on)},
      html: `<span class="sw-ic">${icon(glyph)}${on ? '' : icon('slash', 'sl')}${extra}</span><span class="sw-tr"><span class="sw-kn">${on ? icon('check') : icon('minus')}</span></span>${lab(cp)}`});
  }
  function seg(label, opts, cur, pick, k) {
    return h('div', {class: 'seg', role: 'radiogroup', 'aria-label': label},
      opts.map(o => h('button', {type: 'button', role: 'radio', class: 'sg ' + (o.cls || '') + (o.cp ? ' lb' : ''), 'aria-checked': String(o.v === cur), 'aria-label': o.label, 'data-k': k + ':' + o.v,
        'aria-disabled': o.dis ? 'true' : null, on: {click: e => { if (!o.dis) pick(o.v, e.currentTarget); }}, html: (o.html || icon(o.glyph)) + lab(o.cp)})));
  }
  const row = (glyph, ...kids) => h('div', {class: 'card row'}, glyph && h('span', {class: 'lead', html: icon(glyph)}), kids);
  function slider(label, glyph, v, min, max, step, set, k, unit = '%', cp = '') {
    const out = h('span', {class: 'num', text: v + unit});
    const inp = h('input', {type: 'range', min, max, step, value: String(v), 'aria-label': label, 'aria-valuetext': v + unit, 'data-k': k,
      on: {input: e => { const x = +e.target.value; out.textContent = x + unit; e.target.setAttribute('aria-valuetext', x + unit); set(x, false); F('look', ((x - min) / (max - min)) * 2 - 1, toward(e.target).y); },
        change: e => { set(+e.target.value, true); F('settle'); F('react', 'blink'); }}});
    const r = row(glyph, inp, out); if (cp) r.querySelector('.lead')?.insertAdjacentHTML('beforeend', lab(cp));
    return r;
  }
  function wheel(label, max, value, pick, k) {
    const IH = emb ? 36 : 48;   // item height; the CSS wheel in the CRT uses the same 36 (.ms-emb .wh-i)
    let cur = value, t = 0;
    const list = h('div', {class: 'wh-l', 'aria-hidden': 'true'}, Array.from({length: max + 1}, (_, i) => h('div', {class: 'wh-i', text: p2(i)})));
    const el = h('div', {class: 'wh', role: 'spinbutton', tabindex: '0', 'aria-label': label, 'aria-valuemin': '0', 'aria-valuemax': String(max), 'aria-valuenow': String(value), 'aria-valuetext': p2(value), 'data-k': k}, list);
    const commit = v => { v = (v + max + 1) % (max + 1); if (v === cur) return; cur = v; el.setAttribute('aria-valuenow', v); el.setAttribute('aria-valuetext', p2(v)); pick(v); F('react', 'blink'); };
    list.addEventListener('scroll', () => { clearTimeout(t); t = setTimeout(() => commit(Math.round(list.scrollTop / IH)), 140); }, {passive: true});
    el.addEventListener('keydown', e => {
      const d = {ArrowUp: 1, ArrowDown: -1, PageUp: 5, PageDown: -5}[e.key]; if (!d) return;
      e.preventDefault(); commit(cur + d); list.scrollTop = cur * IH;
    });
    list.addEventListener('click', e => { const i = [...list.children].indexOf(e.target); if (i >= 0) { list.scrollTop = i * IH; commit(i); } });
    requestAnimationFrame(() => { list.scrollTop = value * IH; });
    return el;
  }
  const cd = until => h('span', {class: 'num cd', 'data-cd': String(until), text: countdown(until, now())});
  const lockFor = id => { const s = S.snap; if (s.occId && !s.offAllowed && s.unlockAt && s.reminderId === id) return s.unlockAt; return S.locked[id] > now() ? S.locked[id] : 0; };

  // ---------- top strip, emergency stop, rail ----------
  let topSig = '';
  function renderTop() {
    const s = S.snap, kids = [];
    // unchanged header = keep the same elements: a re-render between pointerdown and click (the audio unlock fires a snapshot) swallowed the tap on the stage chip
    const sig = [s.occId, s.stage, s.offAllowed, s.unlockAt, s.nextDue, s.pendingSync, S.saveUi, !!opts.onGame].join('|'); if (sig === topSig && top.firstChild) return; topSig = sig;
    if (s.occId) {
      kids.push(h('button', {type: 'button', class: 'chip stg', 'aria-label': `${N.game}. ${N.active} ${s.stage || 1}`, on: {click: () => { try { adapter.playChallenge(s.occId); } catch (e) {} }}},
        h('img', {src: STAGE_IMG(s.stage || 1), alt: '', width: '40', height: '40'}), h('span', {class: 'num', text: String(s.stage || 1)})));
      if (!s.offAllowed && s.unlockAt) kids.push(h('span', {class: 'chip lk', role: 'timer', 'aria-label': N.lockedOff}, h('span', {html: icon('lock')}), cd(s.unlockAt)));
      else kids.push(h('span', {class: 'chip lk open', role: 'img', 'aria-label': N.unlockedOff, html: icon('unlock')}));
    } else if (s.nextDue) {
      kids.push(h('span', {class: 'chip', role: 'img', 'aria-label': `${N.next} ${fmtTime(s.nextDue)} ${longDate(new Date(s.nextDue).toISOString().slice(0, 10))}`},
        h('span', {html: icon('bell')}), h('span', {class: 'num', text: fmtTime(s.nextDue)}), h('span', {class: 'num dim', text: fmtDate(s.nextDue)})));
    } else kids.push(h('span', {class: 'chip', role: 'img', 'aria-label': N.off, html: icon('bellOff')}));
    if (emb && kids.length > 1) kids.splice(0, kids.length, h('div', {class: 'tl'}, ...kids));   // ringing: stage chip over the lock timer, a narrow column left of the bust
    kids.push(h('span', {class: 'sp'}));
    if (opts.onGame) kids.push(h('button', {type: 'button', class: 'chip gm', 'data-k': 'free', 'aria-label': N.freePlay, on: {click: () => opts.onGame()}, html: icon('board2048')}));
    if (s.pendingSync) kids.push(h('span', {class: 'chip warnc', role: 'img', 'aria-label': N.sync, html: icon('cloudBroken') + ring()}));
    if (S.saveUi) kids.push(h('span', {class: 'chip sv-' + S.saveUi, role: 'img', 'aria-label': N[S.saveUi], html: S.saveUi === 'saving' ? ring() : icon(S.saveUi === 'saved' ? 'check' : 'warn')}));
    top.replaceChildren(...kids);
  }
  function stopButton() {
    const b = h('button', {type: 'button', class: 'ms-stop', hidden: true, 'aria-label': N.emergency,
      html: icon('octagon') + '<svg class="hold" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="29"/></svg>'});
    let t = 0;
    const cancel = () => { clearTimeout(t); t = 0; b.classList.remove('holding'); };
    const fire = async () => {
      t = 0; b.classList.remove('holding'); const occ = S.snap.occId;
      try { await adapter.emergencyStop(occ); } catch (e) {}
      F('settle'); announce(N.stopped); S.snap = safeSnap(); refreshLive();
    };
    const start = e => { if (t || !S.snap.occId) return; if (e.pointerId != null) try { b.setPointerCapture(e.pointerId); } catch (x) {} b.classList.add('holding'); t = setTimeout(fire, HOLD_MS); };
    b.addEventListener('pointerdown', start);
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) b.addEventListener(ev, cancel);
    b.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); start(e); } });
    b.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') cancel(); });
    b.addEventListener('click', e => e.preventDefault());
    b.addEventListener('contextmenu', e => e.preventDefault());
    return b;
  }
  function renderRail() {
    rail.replaceChildren(...RAIL.map(([id, n]) => {
      const dis = DRAFT_TABS.has(id) && !S.draft;
      return h('button', {type: 'button', role: 'tab', class: 'rl', 'aria-selected': String(S.tab === id), 'aria-label': N[n], 'aria-disabled': dis ? 'true' : null, 'data-k': 'tab:' + id,
        on: {click: () => { if (dis) return; S.tab = id; S.preview = false; render(); panel.scrollTop = 0; if (id === 'history') loadHistory(); if (id === 'prefs' && !S.upd) checkUpd(); }},
        html: icon('rail' + id[0].toUpperCase() + id.slice(1))});
    }));
    const sel = rail.querySelector('[aria-selected=true]');   // rail-only scroll (scrollIntoView could move the page behind the CRT)
    if (sel && rail.scrollWidth > rail.clientWidth) rail.scrollLeft = Math.max(0, sel.offsetLeft + sel.offsetWidth / 2 - rail.clientWidth / 2);
    try { opts.onState?.(); } catch (e) {}
  }

  // ---------- panel ----------
  function render() {
    stopPreviewTimer();
    try { mini?.destroy(); } catch (e) {} mini = null; try { chal?.destroy(); } catch (e) {} chal = null;
    const st = panel.scrollTop, fk = document.activeElement?.dataset?.k;
    panel.setAttribute('aria-label', N[RAIL.find(r => r[0] === S.tab)[1]]);
    const nh = S.tab === 'clock' && !S.draft && !S.preview, st2 = nh === hero ? st : 0;
    hero = nh; root.classList.toggle('ms-hero', hero); root.classList.toggle('ms-edit', !!S.draft); root.classList.toggle('ms-ed-clock', !!S.draft && S.tab === 'clock' && !S.preview); if (!S.draft) root.classList.remove('ms-sub-open');
    panel.replaceChildren(...(hero ? [h('div', {class: 'ms-hero-sp', 'aria-hidden': 'true'})] : []), ...build().flat(9).filter(Boolean));
    panel.scrollTop = st2; layout(); panel.scrollTop = st2; setP();   // restore BEFORE layout() reads scrollTop (a stale offset from the previous tab gave a stale --p), and again after --tail changed the scroll extent
    if (fk) { const el = panel.querySelector(`[data-k="${CSS.escape(fk)}"]`) || rail.querySelector(`[data-k="${CSS.escape(fk)}"]`); el?.focus({preventScroll: true}); }
    if (S.err) markError(S.err);
    renderTop(); renderRail(); stop.hidden = !S.snap.occId;
  }
  function build() {
    if (S.preview && S.draft) return [previewFrame()];
    const ed = !!S.draft;
    switch (S.tab) {
      case 'clock': return ed ? [editHead(), clockRows(), secSave()] : listRows();
      case 'sound': return ed ? [editHead(), soundRows(), secSave()] : [];
      case 'screen': return ed ? [editHead(), screenRows(), secSave()] : [];
      case 'challenge': return ed ? [editHead(), challengeRows(), secSave()] : [];
      case 'devices': return [ed && editHead(), ed && webhookRow(), capGrid(), ed && secSave()];
      case 'history': return historyRows();
      case 'prefs': return prefsRows();
    }
    return [];
  }
  const renderSec = name => { const old = panel.querySelector(`[data-sec="${name}"]`); if (old) old.replaceWith(name === 'up' ? secUpcoming() : secSave()); };

  // list
  function listRows() {
    const out = S.list.map(r => {
      const armed = r.enabled && r.confirmed?.rev === r.rev, st = !r.enabled ? 'off' : armed ? 'armed' : 'unarmed';
      const nd = r.enabled ? nextDue(r, now()).due : null, z = zoneOf(r), active = S.snap.occId && S.snap.reminderId === r.id;
      return h('div', {class: 'card rem', 'data-state': st},
        h('button', {type: 'button', class: 'rem-open', 'data-k': 'open:' + r.id, 'aria-label': `${N.open}: ${r.title || ''} ${r.time}. ${N[st]}`, on: {click: () => openEdit(r)}},
          active ? h('span', {class: 'rem-st act'}, h('img', {src: STAGE_IMG(S.snap.stage || 1), alt: ''}))
            : h('span', {class: 'rem-st', html: icon(st === 'off' ? 'bellOff' : 'bell') + (st === 'armed' ? `<span class="bd bd-active">${icon('check')}</span>` : st === 'unarmed' ? `<span class="bd bd-error">${icon('warn')}</span>` : '')}),
          h('span', {class: 'rem-time num', text: r.time}),
          nd ? h('span', {class: 'rem-date num', text: fmtDate(nd, z)}) : h('span', {class: 'rem-date', html: icon('minus')}),
          h('span', {class: 'rem-title', 'data-user': '', text: r.title || ''})),
        enableCtl(r));
    });
    out.push(h('button', {type: 'button', class: 'card add', 'aria-label': N.add, 'data-k': 'add', on: {click: newDraft}, html: icon('plus') + icon('bell')}));
    return out;
  }
  function enableCtl(r) {
    const until = lockFor(r.id), act = S.snap.occId && S.snap.reminderId === r.id;
    if (until) return h('button', {type: 'button', class: 'lockbtn', 'data-k': 'en:' + r.id, 'aria-label': `${N.lockedOff}`, on: {click: e => F('react', 'glance', toward(e.currentTarget))}},
      h('span', {html: icon('bellOff')}), h('span', {class: 'lk', html: icon('lock')}), cd(until));
    if (act && r.enabled) return h('button', {type: 'button', class: 'lockbtn open', 'data-k': 'en:' + r.id, 'aria-label': N.unlockedOff, on: {click: () => setEnabled(r, false)}},
      h('span', {html: icon('bellOff')}), h('span', {class: 'lk', html: icon('unlock')}));
    return sw(N.enabled, r.enabled, on => setEnabled(r, on), 'bell', 'en:' + r.id);
  }
  async function setEnabled(r, on) {
    let res; try { res = await adapter.setEnabled(r.id, on); } catch (e) { res = {ok: false, error: 'storage'}; }
    if (res?.ok) { F('react', 'nod'); await loadList(); }
    else if (res?.error === 'locked') { S.locked[r.id] = now() + (res.remainingMs || 0); render(); F('react', 'glance', toward(panel.querySelector(`[data-k="en:${r.id}"]`) || panel)); announce(N.locked); }
    else { F('react', 'concern'); announce(N.error); }
  }

  // edit flow
  function template() {
    const t = new Date(now() + 3600_000);
    return {id: 'r_' + Math.random().toString(36).slice(2, 10), rev: 0, enabled: true, title: '', time: `${p2(t.getHours())}:00`,
      recur: {kind: 'daily', days: [], date: null, dates: [], every: 1, start: null, skip: [], skipNext: false}, tz: {mode: 'device', zone: deviceZone()}, escalate: true,
      sound: {stage: [null, null, null, null], rotate: false, pattern: 'burst', volume: 80, ramp: null, streamBoost: false}, speak: 'off', vibrate: {pattern: 'pulse', strength: 100},
      torch: 'off', screen: {brightness: 100, border: true, pulse: false}, present: {fullScreen: true, lockScreen: true, wake: true, overlay: false}, snooze: 0,
      challenge: {extra: null, code: null, nfc: null, steps: 0}, webhook: null, confirmed: null};
  }
  function openEdit(r, isNew = false) {
    S.draft = clone(r); S.isNew = isNew; S.picked = !isNew; S.err = null; S.saveUi = null; S.confirmDel = false; S.stageSel = 0; S.tab = 'clock'; S.preview = false;
    const k = (S.draft.recur.kind === 'once' && S.draft.recur.date) || S.draft.recur.dates?.[0] || todayKey(now(), tz());
    S.month = k.split('-').slice(0, 2).map(Number);
    render(); panel.scrollTop = 0; F('react', 'glance', {x: 0, y: .9});
  }
  const newDraft = () => openEdit(template(), true);
  const discard = () => { stopAud(); S.draft = null; S.err = null; S.preview = false; S.tab = 'clock'; render(); panel.scrollTop = 0; F('settle'); };
  function editHead() {
    if (S.confirmDel) return h('div', {class: 'card head del'},
      h('span', {class: 'lead bad', html: icon('bin')}), h('span', {class: 'sp'}),
      ib(N.confirmDel, 'check', remove, {cls: 'danger', k: 'delok'}), ib(N.cancel, 'cross', () => { S.confirmDel = false; render(); }, {k: 'delno'}));
    return h('div', {class: 'card head'}, ib(N.back, 'back', discard, {k: 'back'}), h('span', {class: 'sp'}),
      ib(N.preview, 'eye', startPreview, {k: 'pv'}), !S.isNew && ib(N.del, 'bin', () => { S.confirmDel = true; render(); }, {k: 'del'}));
  }
  async function remove() {
    let res; try { res = await adapter.remove(S.draft.id); } catch (e) { res = {ok: false, error: 'storage'}; }
    if (res?.ok) { S.draft = null; S.confirmDel = false; await loadList(); }
    else if (res?.error === 'locked') { S.locked[S.draft.id] = now() + (res.remainingMs || 0); S.confirmDel = false; render(); F('react', 'glance', {x: 0, y: -.8}); announce(N.locked); }
    else { F('react', 'concern'); announce(N.error); }
  }
  const D = () => S.draft;
  const touch = (...secs) => { S.err = null; secs.forEach(renderSec); renderSec('save'); };

  function clockRows() {
    const d = D(), rc = d.recur, [hh, mm] = d.time.split(':').map(Number);
    const kinds = [['once', 'once'], ['daily', 'daily'], ['weekly', 'weekly'], ['dates', 'dates'], ['interval', 'interval']];
    const setTime = (H, M) => { d.time = `${p2(H)}:${p2(M)}`; touch('up'); };
    const out = [
      h('div', {class: 'card row', 'data-field': 'title'}, h('span', {class: 'lead', html: icon('pencil')}),
        h('input', {type: 'text', class: 'txt', placeholder: 'Title', maxlength: '200', autocomplete: 'off', 'aria-label': N.title, value: d.title || '', 'data-k': 'title',
          on: {input: e => { d.title = e.target.value; }, focus: e => F('react', 'glance', toward(e.target))}})),
      h('div', {class: 'card row time', 'data-field': 'time'}, h('span', {class: 'lead', html: icon('clock')}),
        wheel(N.hour, 23, hh, v => setTime(v, +d.time.slice(3)), 'hh'), h('span', {class: 'colon', text: ':'}), wheel(N.minute, 59, mm, v => setTime(+d.time.slice(0, 2), v), 'mm')),
      h('div', {class: 'card row', 'data-field': 'recur'},
        seg(N.repeat, kinds.map(([v, g]) => ({v, glyph: g, label: N[v]})), rc.kind, v => setKind(v), 'kind')),
    ];
    if (rc.kind === 'weekly') out.push(weekCols());
    if (rc.kind === 'once' || rc.kind === 'dates') out.push(monthGrid(rc.kind));
    if (rc.kind === 'interval') out.push(intervalRow());
    out.push(secUpcoming(), tzRow());
    out.push(h('div', {class: 'card row'}, h('span', {class: 'lead', html: icon('bellOn')}), lockFor(d.id) ? h('span', {class: 'lockbtn', role: 'timer', 'aria-label': N.lockedOff}, h('span', {html: icon('lock')}), cd(lockFor(d.id)))
      : sw(N.enabled, d.enabled, on => { d.enabled = on; render(); }, 'bell', 'enabled')));
    return out;
  }
  function setKind(v) {
    const rc = D().recur, today = todayKey(now(), tz());
    rc.kind = v;
    if (v === 'weekly' && !rc.days?.length) rc.days = [new Date(today + 'T12:00:00Z').getUTCDay()];
    if (v === 'dates' && !rc.dates?.length) rc.dates = [today];
    if (v === 'interval') { rc.every = Math.max(2, rc.every | 0); rc.start = rc.start || today; }
    render(); F('react', 'blink');
  }
  function weekCols() {
    const rc = D().recur, cols = weekColumns(todayKey(now(), tz()), 3);
    return h('div', {class: 'card wk', role: 'group', 'aria-label': N.weekly, 'data-field': 'days'}, cols.map(c => {
      const on = rc.days.includes(c.wd);
      return h('button', {type: 'button', class: 'wk-c', 'aria-pressed': String(on), 'aria-label': weekdayName(c.keys[0]), 'data-k': 'wd' + c.wd,
        on: {click: e => { const set = new Set(rc.days); on ? set.delete(c.wd) : set.add(c.wd); if (!set.size) { F('react', 'neutral'); return; } rc.days = [...set].sort(); render(); F('react', 'glance', toward(e.currentTarget)); }}},
        c.keys.map((k, i) => h('span', {class: i ? 'wk-d num' : 'wk-d wk-h num', text: String(dayOf(k))})), on && h('span', {class: 'wk-ck', html: icon('check')}));
    }));
  }
  function monthGrid(mode) {
    const rc = D().recur, [y, m] = S.month, today = todayKey(now(), tz());
    const sel = k => mode === 'once' ? rc.date === k : rc.dates.includes(k);
    const lab = new Intl.DateTimeFormat(undefined, {year: 'numeric', month: '2-digit', timeZone: 'UTC'}).format(new Date(Date.UTC(y, m - 1, 15)));
    const go = dm => { const t = new Date(Date.UTC(y, m - 1 + dm, 1)); S.month = [t.getUTCFullYear(), t.getUTCMonth() + 1]; render(); };
    return h('div', {class: 'card cal', 'data-field': 'dates'},
      h('div', {class: 'cal-h'}, ib(N.prevMonth, 'chevL', () => go(-1), {k: 'mprev'}), h('span', {class: 'num', text: lab}), ib(N.nextMonth, 'chevR', () => go(1), {k: 'mnext'})),
      h('div', {class: 'cal-g', role: 'group', 'aria-label': N.month}, monthCells(y, m).map(c => c.inMonth ? h('button', {type: 'button', class: 'cal-c num' + (c.key === today ? ' today' : ''),
        'aria-pressed': String(sel(c.key)), 'aria-label': longDate(c.key), disabled: c.key < today ? true : null, 'data-k': 'd:' + c.key, text: String(c.d),
        on: {click: e => {
          if (mode === 'once') rc.date = rc.date === c.key ? null : c.key;
          else { const s = new Set(rc.dates); s.has(c.key) ? s.delete(c.key) : s.add(c.key); if (!s.size) { F('react', 'neutral'); return; } rc.dates = [...s].sort(); }
          render(); F('react', 'glance', toward(e.currentTarget));
        }}}) : h('span', {class: 'cal-c out', 'aria-hidden': 'true'}))));
  }
  function intervalRow() {
    const rc = D().recur, set = n => { rc.every = Math.min(365, Math.max(1, n)); render(); F('react', 'blink'); };
    return h('div', {class: 'card row'}, h('span', {class: 'lead', html: icon('interval')}),
      ib(N.fewer, 'minus', () => set(rc.every - 1), {k: 'ev-'}), h('span', {class: 'num big', role: 'status', 'aria-label': `${N.every} ${rc.every}`, text: String(rc.every)}),
      ib(N.more, 'plus', () => set(rc.every + 1), {k: 'ev+'}), h('span', {class: 'sp'}),
      h('span', {class: 'chip', role: 'img', 'aria-label': `${N.start} ${longDate(rc.start)}`}, h('span', {html: icon('calendar')}), h('span', {class: 'num', text: fmtDate(Date.parse(rc.start + 'T12:00:00Z'), 'UTC')})));
  }
  function secUpcoming() {
    const d = D(), z = tz(), occ = upcoming(d, now(), 5, z);
    return h('div', {class: 'card up', 'data-sec': 'up'}, h('span', {class: 'lead', html: icon('skip')}),
      h('div', {class: 'up-l', role: 'group', 'aria-label': N.upcoming}, occ.length ? occ.map(o => h('button', {type: 'button', class: 'up-c', 'aria-pressed': String(o.skipped),
        'aria-label': `${longDate(o.key)} ${fmtTime(o.due, z)}`, 'data-k': 'up:' + o.key, on: {click: e => toggleSkip(o, e.currentTarget)}},
        h('span', {class: 'num', text: fmtDate(o.due, z)}), h('span', {class: 'num dim', text: fmtTime(o.due, z)}), o.skipped && h('span', {class: 'x', html: icon('cross')})))
        : h('span', {class: 'lead dim', html: icon('minus')})),
      ib(N.skipNext, 'skipNext', () => { d.recur.skipNext = !d.recur.skipNext; renderSec('up'); F('react', 'tilt'); }, {k: 'skipnext', pressed: String(!!d.recur.skipNext), cls: 'tog'}));
  }
  function toggleSkip(o, el) {
    const rc = D().recur;
    if (o.next) rc.skipNext = false; else { const s = new Set(rc.skip); s.has(o.key) ? s.delete(o.key) : s.add(o.key); rc.skip = [...s].sort(); }
    renderSec('up'); F('react', 'tilt', toward(el));
  }
  let ZONES = null;
  function zones() {
    if (ZONES) return ZONES;
    const all = (Intl.supportedValuesOf?.('timeZone') || []).concat(deviceZone()), seen = new Map();
    for (const z of all) { if (!validZone(z)) continue; const l = offsetLabel(z); if (!seen.has(l)) seen.set(l, z); }
    return ZONES = [...seen].sort((a, b) => parseInt(a[0].replace('−', '-').replace(':', ''), 10) - parseInt(b[0].replace('−', '-').replace(':', ''), 10));
  }
  function tzRow() {
    const t = D().tz;
    const pick = (v, el) => { t.mode = v; if (v === 'fixed' && !t.zone) t.zone = deviceZone(); render(); F('look', v === 'fixed' ? .6 : -.6, .5); setTimeout(() => F('settle'), 500); };
    let sel = null;
    if (t.mode === 'fixed') {
      const cur = offsetLabel(t.zone);
      sel = h('select', {class: 'sel num', 'aria-label': N.zone, 'data-k': 'zone', on: {change: e => { t.zone = e.target.value; touch('up'); }}},
        zones().map(([l, z]) => h('option', {value: l === cur ? t.zone : z, selected: l === cur ? true : null, text: l})));
    }
    return h('div', {class: 'card row'}, seg(N.zone, [{v: 'device', glyph: 'phoneGlobe', label: N.tzDevice}, {v: 'fixed', glyph: 'globe', label: N.tzFixed}], t.mode, pick, 'tz'), sel);
  }

  // sound + haptics
  function soundRows() {
    const d = D(), s = d.sound, cur = s.stage[S.stageSel];
    const tl = h('div', {class: 'card tl', role: 'radiogroup', 'aria-label': N.timeline},
      [0, 1, 2, 3].map(i => [h('button', {type: 'button', role: 'radio', class: 'tl-s', 'aria-checked': String(i === S.stageSel), 'aria-label': `${N.stage} ${i + 1}${s.stage[i] ? ': ' + SOUND[s.stage[i]] : ''}`, 'data-k': 'st' + i,
        on: {click: () => { S.stageSel = i; render(); }}}, h('img', {src: STAGE_IMG(i + 1), alt: '', width: '52', height: '52'}), h('span', {class: 'num', text: String(i + 1)}),
        h('span', {class: 'tl-snd', html: s.stage[i] ? icon(SOUND_GLYPH[s.stage[i]]) : icon('warn')})),
        h('span', {class: 'tl-gap num' + (i < 3 ? '' : ' rep'), style: i < 3 ? `grid-column:${i + 1}` : null, 'aria-hidden': 'true'}, i < 3 ? '+' + hms(STAGE_AT[i + 1] - STAGE_AT[i]) : h('span', {html: icon('daily')}), i < 3 ? null : hms(REPEAT_S))]));
    const miniHost = h('div', {class: 'mini', 'aria-hidden': 'true'});
    queueMicrotask(() => { try { mini = createMini(miniHost, {reducedMotion: true}); mini.setBase(...baseForStage(S.stageSel + 1)); } catch (e) {} });
    const snd = h('div', {class: 'card snd', 'data-field': 'sound'}, miniHost,
      h('div', {class: 'snd-g', role: 'radiogroup', 'aria-label': N.sound}, SOUNDS.map(id => h('button', {type: 'button', role: 'radio', class: 'sg snd-b', 'aria-checked': String(cur === id), 'aria-label': SOUND[id], 'data-k': 'snd:' + id,
        on: {click: () => pickSound(id)}, html: icon(SOUND_GLYPH[id]) + strip(SOUND_WAVE[id])}))),
      ib(S.aud === 'sound' ? N.stopAudition : N.audition, S.aud === 'sound' ? 'stop' : 'play', () => audition('sound', cur), {cls: 'big' + (cur ? '' : ' off'), k: 'aud'}));
    const ramp = s.ramp;
    return [tl, snd,
      h('div', {class: 'card row'}, sw(N.rotate, s.rotate, v => { s.rotate = v; render(); }, 'shuffle', 'rotate', '', 'Shuffle'),
        seg(N.burst, [{v: 'burst', html: icon('burst') + strip(PATTERN_WAVE.burst), label: N.burst, cp: 'Bursts'}, {v: 'continuous', html: icon('continuous') + strip(PATTERN_WAVE.continuous), label: N.continuous, cp: 'Steady'}], s.pattern, v => { s.pattern = v; render(); }, 'pat')),
      slider(N.volume, 'speaker', s.volume, 0, 100, 5, v => { s.volume = v; }, 'vol', '%', 'Volume'),
      h('div', {class: 'card row'}, sw(N.ramp, !!ramp, v => { s.ramp = v ? {from: 40, to: 100, secs: 20} : null; render(); F('react', 'glance', {x: .5, y: .4}); }, 'ramp', 'ramp', '', 'Ramp'),
        ramp && seg(N.rampSecs, [10, 20, 30, 60].map(v => ({v, label: `${N.rampSecs} ${v}`, html: `<span class="num">${hms(v)}</span>`})), ramp.secs, v => { ramp.secs = v; render(); }, 'rs')),
      ramp && slider(N.rampFrom, 'ramp', ramp.from, 0, 100, 5, v => { ramp.from = v; }, 'rf', '%', 'From'),
      ramp && slider(N.rampTo, 'ramp', ramp.to, 0, 100, 5, v => { ramp.to = v; }, 'rt', '%', 'To'),
      h('div', {class: 'card row'}, sw(N.boost, s.streamBoost, v => { s.streamBoost = v; render(); }, 'boost', 'boost', '', 'Boost'),
        capSwitch('speak', N.speak, d.speak === 'title', v => { d.speak = v ? 'title' : 'off'; render(); }, 'speak', 'Say title')),
      h('div', {class: 'card vib'}, seg(N.vibrate, Object.keys(VIB_WAVE).map(v => ({v, label: VIB[v], html: v === 'off' ? icon('vibrate') + icon('slash', 'sl') : strip(VIB_WAVE[v])})), d.vibrate.pattern,
        v => { d.vibrate.pattern = v; render(); }, 'vib'),
        h('div', {class: 'row'}, h('span', {class: 'lead jig', html: capIcon('vibrate', capState('vibrate'))}),
          h('input', {type: 'range', min: 0, max: 100, step: 10, value: String(d.vibrate.strength), 'aria-label': N.strength, 'aria-valuetext': d.vibrate.strength + '%', 'data-k': 'vs',
            on: {input: e => { d.vibrate.strength = +e.target.value; e.target.nextSibling.textContent = e.target.value + '%'; e.target.setAttribute('aria-valuetext', e.target.value + '%'); }}}),
          h('span', {class: 'num', text: d.vibrate.strength + '%'}),
          ib(S.aud === 'vibrate' ? N.stopAudition : N.testVibrate, S.aud === 'vibrate' ? 'stop' : 'play', e => { audition('vibrate', d.vibrate.pattern); const j = panel.querySelector('.jig'); j?.classList.remove('go'); void j?.offsetWidth; j?.classList.add('go'); }, {k: 'audv', cls: d.vibrate.pattern === 'off' ? 'off' : ''}))),
    ];
  }
  function pickSound(id) {
    const s = D().sound;
    if (!S.picked) { s.stage = s.stage.map(x => x || id); S.picked = true; }
    s.stage[S.stageSel] = id; S.err = null; render();
  }
  async function audition(kind, value) {
    if (!value || value === 'off') return;
    if (S.aud === kind) return stopAud();
    stopAud(); S.aud = kind; render(); if (kind === 'sound') F('react', 'tilt'); else if (kind === 'torch') F('react', 'blink');
    try { await adapter.audition(kind, value); } catch (e) {}
  }
  function stopAud() { if (!S.aud) return; S.aud = null; try { adapter.stopAudition(); } catch (e) {} if (S.draft) render(); }

  // capability-aware switch: unsupported = slashed in a patterned boundary, no toggle; permission = key that requests only that grant.
  function capSwitch(capId, label, on, set, glyph, cp = '') {
    const st = capState(capId);
    if (st === 'unsupported') return h('span', {class: 'capx', role: 'img', 'aria-label': `${label}: ${STATE.unsupported}`, html: capIcon(glyph, 'unsupported') + lab(cp)});
    const req = (st === 'permission' || st === 'disconnected' || st === 'error') && ib(`${CAP[capId]}: ${STATE[st]}`, null, e => request(capId, e.currentTarget), {html: capIcon('key', st === 'permission' ? 'available' : st), cls: 'req', k: 'req:' + capId});
    const extra = st === 'foreground' ? `<span class="bd bd-fg">${icon('phoneOpen')}</span>` : '';
    return h('span', {class: 'capsw'}, sw(`${label}${st === 'foreground' ? ': ' + STATE.foreground : ''}`, on, set, glyph, 'cap:' + capId, extra, cp), req);
  }
  async function request(capId, el) {
    let v; try { v = await adapter.request(capId); } catch (e) { v = {state: 'error', reason: 'throw'}; }
    S.caps[capId] = v || S.caps[capId];
    render();
    if (v?.state === 'active') F('react', 'glance', toward(el || panel)); else F('react', 'neutral');     // refusal: neutral, never punitive
    announce(`${CAP[capId]}: ${STATE[v?.state] || ''}`);
  }

  // screen + light
  function screenRows() {
    const d = D(), sc = d.screen, pr = d.present;
    return [
      h('div', {class: 'card row'}, h('span', {class: 'lead', html: icon('sun')}),
        h('input', {type: 'range', min: 10, max: 100, step: 5, value: String(sc.brightness), 'aria-label': N.brightness, 'aria-valuetext': sc.brightness + '%', 'data-k': 'br',
          on: {input: e => { sc.brightness = +e.target.value; e.target.nextSibling.textContent = sc.brightness + '%'; e.target.setAttribute('aria-valuetext', sc.brightness + '%'); panel.querySelector('.brp')?.style.setProperty('--b', sc.brightness / 100); F('look', .9, -.2); },
            change: () => { F('settle'); renderSec('save'); }}}),
        h('span', {class: 'num', text: sc.brightness + '%'}), h('span', {class: 'brp', style: `--b:${sc.brightness / 100}`, 'aria-hidden': 'true'})),
      h('div', {class: 'card row'}, sw(N.border, sc.border, v => { sc.border = v; render(); }, 'border', 'border'), sw(N.screenPulse, sc.pulse, v => { sc.pulse = v; render(); }, 'screenPulse', 'spulse')),
      h('div', {class: 'card row'}, capIcon('torch', capState('torch')) && h('span', {class: 'lead', html: capIcon('torch', capState('torch'))}),
        seg(N.torch, [{v: 'off', glyph: 'torch', label: N.torchOff, html: icon('torch') + icon('slash', 'sl')}, {v: 'steady', glyph: 'torchSteady', label: N.torchSteady}, {v: 'pulse', glyph: 'torchPulse', label: N.torchPulse}],
          d.torch, v => { d.torch = v; render(); }, 'torch'),
        ib(S.aud === 'torch' ? N.stopAudition : N.testTorch, S.aud === 'torch' ? 'stop' : 'play', () => audition('torch', d.torch), {k: 'audt', cls: d.torch === 'off' ? 'off' : ''})),
      h('div', {class: 'card row wrap'},
        capSwitch('fullScreen', N.fullScreen, pr.fullScreen, v => { pr.fullScreen = v; render(); if (v) F('react', 'lean'); }, 'fullScreen'),
        capSwitch('lockScreen', N.lockScreen, pr.lockScreen, v => { pr.lockScreen = v; render(); F('react', 'glance', {x: .3, y: .8}); }, 'lockScreen'),
        capSwitch('wakeLock', N.wake, pr.wake, v => { pr.wake = v; render(); }, 'wake'),
        capSwitch('overlay', N.overlay, pr.overlay, v => { pr.overlay = v; render(); F('react', 'glance', {x: .8, y: -.4}); }, 'overlay')),
      h('div', {class: 'card row'}, ib(`${CAP.dnd}: ${STATE[capState('dnd')]}`, null, e => request('dnd', e.currentTarget), {html: capIcon('dnd', capState('dnd')), cls: 'capb', k: 'req:dnd'})),
    ];
  }

  // challenge
  function challengeRows() {
    const d = D(), c = d.challenge;
    const ex = [['none', 'cross'], ['qr', 'qr'], ['nfc', 'nfc'], ['motion', 'motion'], ['math', 'math'], ['pattern', 'pattern']];
    const board = h('div', {class: 'mb', 'aria-hidden': 'true'}, [2, 4, 8, 2048].map(v => h('span', {class: 'tile', 'data-v': v, text: String(v)})));
    const out = [
      h('div', {class: 'card row'}, S.snap.occId ? h('button', {type: 'button', class: 'mbb', 'aria-label': N.playBoard, 'data-k': 'board', on: {click: () => { try { adapter.playChallenge(S.snap.occId); } catch (e) {} }}}, board)
        : h('span', {class: 'mbb', role: 'img', 'aria-label': N.board}, board), h('span', {class: 'lead ok', html: icon('lock') + icon('check')}), h('span', {class: 'sp'})),
      h('div', {class: 'card row'}, seg(N.pickGame, CHOICES.map(g => ({v: g, label: N['game_' + g], glyph: g === '2048' ? 'board2048' : 'g' + g[0].toUpperCase() + g.slice(1)})), getChoice(),
        (v, el) => { setChoice(v); render(); F('react', 'glance', toward(el)); }, 'gm')),
      h('div', {class: 'card row'}, seg(N.extra, ex.map(([v, g]) => ({v, label: ['qr', 'nfc', 'motion'].includes(v) ? `${N[v]}: ${STATE[capState(v)]}` : N[v], dis: capState(v) === 'unsupported' && v !== 'none', html: ['qr', 'nfc', 'motion'].includes(v) ? capIcon(g, capState(v)) : icon(g)})), c.extra || 'none',
        (v, el) => { c.extra = v === 'none' ? null : v; render(); F('react', 'glance', toward(el)); }, 'extra')),
    ];
    if (c.extra === 'qr' || c.extra === 'nfc') out.push(h('div', {class: 'card row', 'data-field': 'code'}, h('span', {class: 'lead', html: icon(c.extra === 'qr' ? 'qr' : 'nfc')}),
      h('input', {type: 'text', class: 'txt', placeholder: 'Code', maxlength: '120', autocomplete: 'off', 'aria-label': N.code, 'data-k': 'code', value: (c.extra === 'qr' ? c.code : c.nfc) || '',
        on: {input: e => { c[c.extra === 'qr' ? 'code' : 'nfc'] = e.target.value || null; }, focus: e => F('react', 'glance', toward(e.target))}}),
      capState(c.extra) !== 'active' && ib(`${CAP[c.extra]}: ${STATE[capState(c.extra)]}`, null, e => request(c.extra, e.currentTarget), {html: capIcon('key', 'available'), cls: 'req', k: 'req:' + c.extra})));
    if (c.extra === 'motion') out.push(h('div', {class: 'card row'}, h('span', {class: 'lead', html: icon('motion')}),
      ib(N.fewer, 'minus', () => { c.steps = Math.max(0, (c.steps || 0) - 10); render(); }, {k: 'st-'}), h('span', {class: 'num big', role: 'status', 'aria-label': `${N.steps} ${c.steps || 0}`, text: String(c.steps || 0)}),
      ib(N.more, 'plus', () => { c.steps = Math.min(5000, (c.steps || 0) + 10); render(); }, {k: 'st+'})));
    if (c.extra === 'math' || c.extra === 'pattern') {
      const ch = h('div', {class: 'chal-host'});
      out.push(h('div', {class: 'card'}, ib(N.tryChallenge, 'play', () => { try { chal?.destroy(); } catch (e) {} ch.replaceChildren(); chal = createChallenge(c.extra, ch, {onSolved: () => F('react', 'glance', toward(ch))}); }, {k: 'try'}), ch));
    }
    out.push(h('div', {class: 'card row'}, h('span', {class: 'lead', html: icon('hourglass')}),
      seg(N.snooze, [0, 300, 600, 900, 1800].map(v => ({v, label: v ? `${N.snooze} ${hms(v)}` : N.snoozeOff, html: v ? `<span class="num">${hms(v)}</span>` : icon('hourglass') + icon('slash', 'sl')})), d.snooze || 0,
        v => { d.snooze = v; render(); if (v) F('react', 'sleepy'); }, 'snz')));
    return out;
  }
  function webhookRow() {
    const d = D();
    return h('div', {class: 'card row', 'data-field': 'webhook'}, h('span', {class: 'lead', html: icon('house')}),
      h('input', {type: 'url', class: 'txt', placeholder: 'URL', inputmode: 'url', autocomplete: 'off', 'aria-label': N.webhook, 'data-k': 'url', value: d.webhook?.url || '',
        on: {input: e => { const v = e.target.value.trim(); d.webhook = v ? {url: v, token: d.webhook?.token ?? null} : null; }, focus: e => F('react', 'glance', toward(e.target))}}));
  }
  function capGrid() {
    return h('div', {class: 'card capg', role: 'group', 'aria-label': N.railDevices}, Object.keys(CAP_GLYPH).map(id => {
      const st = capState(id), can = st === 'permission' || st === 'disconnected';
      return h('button', {type: 'button', class: 'capt', 'aria-label': `${CAP[id]}: ${STATE[st]}`, 'aria-disabled': can ? null : 'true', 'data-k': 'cap:' + id,
        on: {click: e => { if (can) request(id, e.currentTarget); }}, html: capIcon(CAP_GLYPH[id], st)});
    }));
  }

  // save / arm (checkmark beside the actual selected capability icons)
  function secSave() {
    const d = D(), s = d.sound, picked = S.picked && s.stage.every(Boolean), ic = [];
    const add = (cap, g) => ic.push(capIcon(g, ['active', 'available'].includes(capState(cap)) ? 'available' : capState(cap)));
    if (picked) [...new Set(s.stage)].forEach(id => add('sound', SOUND_GLYPH[id]));
    if (d.vibrate.pattern !== 'off') add('vibrate', 'vibrate');
    if (d.torch !== 'off') add('torch', d.torch === 'pulse' ? 'torchPulse' : 'torchSteady');
    if (d.screen.border || d.screen.pulse) ic.push(icon('border'));
    if (d.speak === 'title') add('speak', 'speak');
    for (const [k, cap, g] of [['fullScreen', 'fullScreen', 'fullScreen'], ['lockScreen', 'lockScreen', 'lockScreen'], ['wake', 'wakeLock', 'wake'], ['overlay', 'overlay', 'overlay']]) if (d.present[k]) add(cap, g);
    ic.push(icon('board2048'));
    if (d.challenge.extra) add(d.challenge.extra, d.challenge.extra);
    if (d.snooze) ic.push(icon('hourglass'));
    if (d.webhook?.url) add('webhook', 'house');
    return h('div', {class: 'savebar', 'data-sec': 'save'},
      h('div', {class: 'sv-ic', 'aria-hidden': 'true', html: lab('Effects') + (picked ? '' : `<span class="need">${icon('speaker')}${icon('warn', 'w')}</span>`) + ic.join('')}),
      h('button', {type: 'button', class: 'sv-ok', 'data-k': 'save', 'aria-label': picked ? N.save : N.needSound, 'aria-disabled': picked && !S.saving ? null : 'true', on: {click: save},
        html: (S.saving ? ring() : icon('check')) + lab('Arm')}));
  }
  async function save() {
    const d = D(); if (!d || S.saving) return;
    if (!(S.picked && d.sound.stage.every(Boolean))) { S.tab = 'sound'; S.err = 'sound'; render(); panel.scrollTop = 0; F('react', 'glance', toward(panel.querySelector('.snd-g') || panel)); announce(N.needSound); return; }
    const rev = (d.rev | 0) + 1, r = {...clone(d), rev, confirmed: {rev, at: now()}};
    S.saving = true; S.saveUi = 'saving'; renderSec('save'); renderTop();
    let res; try { res = await adapter.save(r); } catch (e) { res = {ok: false, error: 'storage'}; }
    S.saving = false;
    if (res?.ok) {
      S.saveUi = 'saved'; S.draft = null; S.err = null; S.tab = 'clock'; announce(N.saved);
      await loadList(); panel.scrollTop = 0; F('react', 'nod');                                     // nod only after persistence succeeded
      later(() => { if (S.saveUi === 'saved') { S.saveUi = null; renderTop(); } }, 1800);
      return;
    }
    S.saveUi = 'error';
    if (res?.error === 'locked') { S.locked[d.id] = now() + (res.remainingMs || 0); S.tab = 'clock'; render(); F('react', 'glance', toward(panel.querySelector('.lockbtn') || panel)); announce(N.locked); }
    else if (res?.error === 'permission') { render(); F('react', 'neutral'); announce(N.permission); }
    else { S.err = res?.field || 'save'; if (FIELD_TAB[S.err]) S.tab = FIELD_TAB[S.err]; render(); const b = panel.querySelector('.bad'); if (b) panel.scrollTop = b.offsetTop - 60; F('react', 'concern'); announce(res?.field ? N.invalid : N.error); }
  }
  function markError(field) {
    const el = panel.querySelector(`[data-field="${field}"]`) || panel.querySelector('.savebar');
    if (!el) return;
    el.classList.add('bad'); el.querySelector('input,select')?.setAttribute('aria-invalid', 'true');
    if (!el.querySelector('.errw')) el.append(h('span', {class: 'errw', 'aria-hidden': 'true', html: icon('warn')}));
  }

  // silent preview: separate simulation state, no adapter calls, explicit stop
  function startPreview() { stopAud(); S.preview = true; S.pv = 0; render(); }
  function stopPreviewTimer() { clearInterval(pvTimer); pvTimer = 0; }
  function previewFrame() {
    const d = D(), i = S.pv, snd = d.sound.stage[i];
    const fx = [snd ? icon(SOUND_GLYPH[snd]) + strip(SOUND_WAVE[snd]) : icon('warn'), d.vibrate.pattern !== 'off' && icon('vibrate') + strip(VIB_WAVE[d.vibrate.pattern]),
      d.torch !== 'off' && icon(d.torch === 'pulse' ? 'torchPulse' : 'torchSteady'), d.speak === 'title' && icon('speak'), d.present.fullScreen && icon('fullScreen'), d.present.lockScreen && icon('lockScreen')].filter(Boolean);
    const fh = h('div', {class: 'pv-face', 'aria-hidden': 'true'});
    queueMicrotask(() => { try { mini = createMini(fh, {reducedMotion: true}); mini.setBase(...baseForStage(i + 1)); } catch (e) {} });
    const step = () => { S.pv = (S.pv + 1) % 4; render(); };
    if (!root.classList.contains('ms-rm')) later(() => { if (S.preview && !pvTimer) pvTimer = setInterval(step, 1600); }, 0);
    return h('div', {class: 'pv', role: 'region', 'aria-label': N.preview},
      h('div', {class: 'pv-frame' + (d.screen.border ? ' bord' : '') + (d.screen.pulse ? ' puls' : ''), style: `--b:${d.screen.brightness / 100}`},
        h('div', {class: 'pv-st'}, [0, 1, 2, 3].map(k => h('img', {src: STAGE_IMG(k + 1), alt: '', class: k === i ? 'on' : ''}))), fh,
        h('div', {class: 'pv-fx', 'aria-hidden': 'true', html: fx.join('')}),
        h('div', {class: 'pv-t num', 'aria-hidden': 'true', text: '+' + hms(STAGE_AT[i])})),
      h('div', {class: 'card head'}, ib(N.nextStage, 'chevR', step, {k: 'pvnext'}), h('span', {class: 'sp'}), ib(N.stopPreview, 'stop', () => { S.preview = false; render(); }, {k: 'pvstop', cls: 'big'})));
  }

  // history
  function historyRows() {
    if (!S.hist) return [h('div', {class: 'card row', html: ring()})];
    if (!S.hist.length) return [h('div', {class: 'card row', role: 'img', 'aria-label': N.historyEmpty, html: icon('railHistory')})];
    return [h('div', {class: 'hl', role: 'list', 'aria-label': N.history}, S.hist.map(e => h('div', {class: 'card hist', role: 'listitem', 'aria-label': `${longDate(new Date(e.dueAt).toISOString().slice(0, 10))} ${fmtTime(e.dueAt)}, ${N.stage} ${e.stage || 1}, ${OUTCOME[e.outcome] || e.outcome}`},
      h('span', {class: 'num', text: fmtDate(e.dueAt)}), h('span', {class: 'num big', text: fmtTime(e.dueAt)}),
      h('img', {src: STAGE_IMG(Math.min(4, Math.max(1, e.stage || 1))), alt: '', width: '36', height: '36'}),
      h('span', {class: 'lead o-' + e.outcome, html: icon(OUTCOME_GLYPH[e.outcome] || 'minus')}),
      h('span', {class: 'num dim', text: e.endedAt ? hms((e.endedAt - e.dueAt) / 1000) : ''}))))];
  }
  async function loadHistory() { try { S.hist = await adapter.history(); } catch (e) { S.hist = []; } if (S.tab === 'history') render(); }

  // preferences: reduced motion, contrast, export/import trays, update ring
  function prefsRows() {
    const p = S.snap, io = S.io || {}, u = S.upd;
    const file = h('input', {type: 'file', accept: 'application/json,.json', hidden: true, tabindex: '-1', on: {change: e => importFile(e.target.files?.[0])}});
    const st = k => io[k] === 'busy' ? ring() : io[k] === 'ok' ? icon('check') : io[k] === 'err' ? icon('warn') : '';
    const updBtn = !u || u.state === 'none' || u.state === 'error' ? ib(N.update, 'update', checkUpd, {k: 'upd'})
      : u.state === 'available' ? ib(N.applyUpdate, 'importT', applyUpd, {k: 'upd', cls: 'big'}) : u.state === 'downloading' || u.state === 'checking' ? h('span', {class: 'ib', role: 'progressbar', 'aria-label': N.updDownloading, html: ring()})
      : ib(N.updReady, 'update', applyUpd, {k: 'upd', cls: 'big ready'});
    return [
      h('div', {class: 'card row'}, sw(N.reducedMotion, !!p.reducedMotion, v => setPref({reducedMotion: v}), 'stillFace', 'rm'), sw(N.highContrast, !!p.highContrast, v => setPref({highContrast: v}), 'contrast', 'hc')),
      h('div', {class: 'card row'}, ib(N.export, 'exportT', exportFile, {k: 'exp'}), h('span', {class: 'io', role: 'status', 'aria-label': io.exp === 'ok' ? N.exported : '', html: st('exp')}),
        h('span', {class: 'sp'}), ib(N.import, 'importT', () => file.click(), {k: 'imp'}), h('span', {class: 'io', role: 'status', html: st('imp')}, io.count ? h('span', {class: 'num', text: '+' + io.count}) : null), file),
      h('div', {class: 'card row'}, updBtn, u?.version && h('span', {class: 'num', text: u.version}), h('span', {class: 'io', html: u?.state === 'none' ? icon('check') : u?.state === 'error' ? icon('warn') : u?.state === 'ready' ? icon('update') : ''})),
    ];
  }
  async function setPref(p) { try { await adapter.setPrefs({reducedMotion: !!S.snap.reducedMotion, highContrast: !!S.snap.highContrast, ...p}); } catch (e) {} S.snap = {...safeSnap(), ...p}; applyPrefs(S.snap); render(); }
  async function exportFile() {
    S.io = {exp: 'busy'}; render();
    try {
      const text = await adapter.exportData(), a = h('a', {href: URL.createObjectURL(new Blob([text], {type: 'application/json'})), download: `moms-2048-reminders-${todayKey(now())}.json`});
      document.body.append(a); a.click(); a.remove(); later(() => URL.revokeObjectURL(a.href), 4000); S.io = {exp: 'ok'}; announce(N.exported);
    } catch (e) { S.io = {exp: 'err'}; announce(N.error); }
    render();
  }
  async function importFile(f) {
    if (!f) return; S.io = {imp: 'busy'}; render();
    let res; try { res = await adapter.importData(await f.text()); } catch (e) { res = {ok: false}; }
    S.io = res?.ok ? {imp: 'ok', count: res.count} : {imp: 'err'}; announce(res?.ok ? `${N.imported} ${res.count}` : N.importFailed);
    if (res?.ok) await loadList(); else render();
  }
  async function checkUpd() { S.upd = {state: 'checking'}; if (S.tab === 'prefs') render(); try { S.upd = await adapter.checkUpdate(); } catch (e) { S.upd = {state: 'error'}; } if (S.tab === 'prefs') render(); }
  async function applyUpd() { S.upd = {...S.upd, state: 'downloading'}; render(); try { await adapter.applyUpdate(); S.upd = await adapter.checkUpdate(); } catch (e) { S.upd = {state: 'error'}; } render(); }

  // ---------- data + live state ----------
  async function loadList() { try { S.list = await adapter.list(); } catch (e) { S.list = []; } render(); }
  function refreshLive() {
    renderTop(); stop.hidden = !S.snap.occId;
    if (!S.draft && S.tab === 'clock') render();
  }
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  let lastStage = S.snap.stage ?? null, lastOcc = S.snap.occId ?? null;
  let lastBase = '';
  const setBase = () => { const b = (S.snap.emotion || 'happy') + (S.snap.intensity ?? .3); if (b !== lastBase) { lastBase = b; F('setBase', S.snap.emotion || 'happy', S.snap.intensity ?? .3); } };
  const onSnap = s => {
    S.snap = s || safeSnap(); applyPrefs(S.snap); setBase();
    if ((S.snap.stage ?? null) !== lastStage || (S.snap.occId ?? null) !== lastOcc) { lastStage = S.snap.stage ?? null; lastOcc = S.snap.occId ?? null; F('settle'); refreshLive(); }
    else renderTop();
    if (!S.saving && S.snap.saveState === 'error' && !S.saveUi) { S.saveUi = 'error'; renderTop(); }
  };
  try { offs.push(adapter.on('snapshot', onSnap)); offs.push(adapter.on('change', () => { if (!S.draft) loadList(); })); offs.push(adapter.on('capability', c => { Object.assign(S.caps, c); if (S.tab !== 'history') render(); })); } catch (e) {}
  const tick = setInterval(() => {
    if (document.hidden) return; let expired = false;
    root.querySelectorAll('[data-cd]').forEach(el => { const u = +el.dataset.cd; el.textContent = countdown(u, now()); if (u <= now()) expired = true; });
    if (expired) { S.snap = safeSnap(); render(); }
  }, 1000);
  let focusT = 0;
  panel.addEventListener('focusin', e => { clearTimeout(focusT); focusT = setTimeout(() => F('look', ...Object.values(toward(e.target))), 120); });
  panel.addEventListener('focusout', e => { if (!panel.contains(e.relatedTarget)) { clearTimeout(focusT); F('settle'); } });

  applyPrefs(S.snap); setBase();
  render();
  (async () => { try { S.caps = await adapter.capabilities() || {}; } catch (e) {} await loadList(); F('react', 'glance', {x: 0, y: .9}); })();

  const tabDis = id => DRAFT_TABS.has(id) && !S.draft;
  const tabIds = RAIL.map(r => r[0]);
  const scroller = () => root.querySelector('[role=dialog]:not([hidden]) [data-scroll]') || panel;   // an open contained drawer/modal body wins over the panel
  return {
    face,
    say: help.say,
    setPlaying: on => root.classList.toggle('ms-playing', !!on),   // the 2048 board is on top: only MOM's subtitle dock stays
    canTab: delta => stepTab(tabIds, S.tab, delta, tabDis) != null,
    tab(delta) {                                           // exactly the rail icon's own click handler (same help line, same draft-tab rules)
      const id = stepTab(tabIds, S.tab, delta, tabDis); if (!id) return false;
      rail.querySelector(`[data-k="tab:${id}"]`)?.click(); return true;
    },
    scrollStep(dir, px = 64) {
      const el = scroller(), before = el.scrollTop; el.scrollTop = before + (dir < 0 ? -px : px); return el.scrollTop !== before;
    },
    refresh: () => { S.snap = safeSnap(); loadList(); },
    destroy() {
      clearInterval(tick); help.destroy(); stopPreviewTimer(); timers.forEach(clearTimeout); offs.forEach(f => { try { f?.(); } catch (e) {} }); stopAud();
      try { mini?.destroy(); } catch (e) {} try { chal?.destroy(); } catch (e) {} if (ownFace) F('destroy'); root.remove();
    },
  };
}
