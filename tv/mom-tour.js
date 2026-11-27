/* MOM's guided tour, the durable reward record, and the rescue-film tracker.
   One classic script, injected once by retro-pointer.js. The pure core (record, predicates, film
   coverage) is also loaded by node tests; the UI half only runs in a real top-level page.
   Rewards are local story unlocks: no accounts, no server, no DRM. */
(function (root) {
  'use strict';
  const KEY = 'mom-tour-v1';
  const FILM_SLACK = 0.5;                      // seconds of total uncovered time allowed
  const APPS = ['misinformation', 'fuel', 'jump', 'lilboyfriend', 'alarm', 'corgi', 'hand', 'coach'];
  const FINALE = 'coach';                       // 8th reward: the other seven unlocked = the full Mother's Tour

  /* ---------- durable record ---------- */
  const blank = () => ({v: 1, step: 'mominc', missions: {}, unlocked: {}, announced: {}, pendingRewards: [],
    installObservations: {}, acknowledged: {}, films: {}, quietUntil: 0, off: false, lastVisitDay: null, returnStreak: 0});
  const obj = x => (x && typeof x === 'object' && !Array.isArray(x)) ? x : {};
  function normalize(raw) {
    const r = Object.assign(blank(), obj(raw));       // unknown future fields survive
    for (const k of ['missions', 'unlocked', 'announced', 'installObservations', 'acknowledged', 'films']) r[k] = obj(r[k]);
    r.pendingRewards = Array.isArray(r.pendingRewards) ? r.pendingRewards.filter(a => typeof a === 'string') : [];
    r.v = 1;
    return r;
  }
  function createStore(storage, now) {
    now = now || Date.now;
    const read = () => { try { return normalize(JSON.parse(storage.getItem(KEY))); } catch { return blank(); } };
    // Read-modify-write against whatever is in storage NOW, so another tab's earned records survive.
    const update = fn => { const r = read(); fn(r); try { storage.setItem(KEY, JSON.stringify(r)); } catch {} return r; };
    return {
      read, update,
      mission: id => update(r => { if (!r.missions[id]) r.missions[id] = {at: now()}; }),
      // Unlock once, queue once. A later call for the same app is a no-op.
      unlock(app, evidence) {
        let fresh = false;
        update(r => {
          if (r.unlocked[app]) return;
          fresh = true; r.unlocked[app] = {at: now(), evidence: evidence || null};
          if (!r.announced[app] && !r.pendingRewards.includes(app)) r.pendingRewards.push(app);
        });
        return fresh;
      },
      announce: app => update(r => {
        if (!r.announced[app]) r.announced[app] = now();
        r.pendingRewards = r.pendingRewards.filter(a => a !== app);
      }),
      // Union stored coverage with ours (another tab may have watched too); never shrink, never revoke.
      mergeFilm(id, duration, intervals) {
        let done = false;
        update(r => {
          let f = obj(r.films[id]);
          if (typeof f.duration === 'number' && Math.abs(f.duration - duration) > 0.05 && !f.done) f = {};   // replaced film: incomplete coverage is void
          const merged = f.done && Math.abs(f.duration - duration) <= 0.05 ? f.intervals : mergeIntervals((f.intervals || []).concat(intervals), duration);
          done = !!f.done || qualifies(merged, duration);
          r.films[id] = {duration, intervals: merged, pct: percent(merged, duration), done, doneAt: f.doneAt || (done ? now() : undefined)};
        });
        return done;
      },
    };
  }

  /* ---------- film coverage math ---------- */
  function mergeIntervals(list, duration) {
    const clipped = [];
    for (const iv of list || []) {
      if (!Array.isArray(iv)) continue;
      const a = Math.max(0, Number(iv[0])), b = Math.min(duration, Number(iv[1]));
      if (Number.isFinite(a) && Number.isFinite(b) && b > a) clipped.push([a, b]);
    }
    clipped.sort((x, y) => x[0] - y[0]);
    const out = [];
    for (const [a, b] of clipped) {
      const last = out[out.length - 1];
      if (last && a <= last[1] + 1e-6) last[1] = Math.max(last[1], b); else out.push([a, b]);
    }
    return out.map(([a, b]) => [Math.round(a * 100) / 100, Math.round(b * 100) / 100]);
  }
  const coveredSeconds = (list, duration) => mergeIntervals(list, duration).reduce((s, [a, b]) => s + b - a, 0);
  const percent = (list, duration) => duration > 0 ? Math.min(100, Math.floor(100 * coveredSeconds(list, duration) / duration)) : 0;
  const qualifies = (list, duration) => Number.isFinite(duration) && duration > 0 && duration - coveredSeconds(list, duration) <= FILM_SLACK + 1e-6;

  /* Samples a playing, visible film. Credit is capped by wall-clock time, so a jump of currentTime
     (scrub-to-end, skipped middle) supplies nothing. A wrap from the end to the start is a loop boundary.
     host: {now() ms, time(), duration(), active() playing&visible&!seeking, rate()} */
  class FilmTracker {
    constructor(id, store, host, onDone) {
      this.id = id; this.store = store; this.host = host; this.onDone = onDone || (() => {});
      this.reset(); this.intervals = []; this.dirty = 0; this.done = !!obj(store.read().films[id]).done;
    }
    reset() { this.p = null; this.wall = 0; }
    sample() {
      const h = this.host, d = h.duration();
      if (!(Number.isFinite(d) && d > 0)) { this.reset(); return; }
      if (!h.active()) { this.flush(); this.reset(); return; }
      const t = h.time(), now = h.now();
      if (this.p === null) { this.p = t; this.wall = now; return; }
      const allowed = Math.max(0, (now - this.wall) / 1000 * h.rate()) + 0.15;
      let from = this.p;
      if (t >= from) { const to = Math.min(t, from + allowed); this.add(from, to, d); }
      else if (d - from <= allowed + 0.05 && t <= allowed + 0.05) { this.add(from, d, d); this.add(0, t, d); }   // loop boundary
      this.p = t; this.wall = now;
      if (this.dirty >= 2) this.flush();
    }
    add(a, b, d) { if (b > a) { this.intervals = mergeIntervals(this.intervals.concat([[a, b]]), d); this.dirty += b - a; } }
    flush() {
      const d = this.host.duration();
      if (!this.intervals.length || !(d > 0)) return;
      const was = this.done;
      this.done = this.store.mergeFilm(this.id, d, this.intervals);
      this.dirty = 0;
      if (this.done && !was) this.onDone(this.id, d);
    }
    pct() { return percent(this.intervals, this.host.duration()); }
  }

  /* ---------- predicates (section 5.3) ---------- */
  const int = v => Number.isSafeInteger(v) && v > 0;
  const parse = s => { try { return JSON.parse(s); } catch { return null; } };
  function fuelReceipt(env) { const r = parse(env.ls('mbs-fuel-flight-v1')); return r?.version === 1 && r.pipes === 8 && int(r.completedAt); }
  function goggles(env) {
    for (const get of [env.ls, env.ss]) {
      const r = parse(get('mbs-goggles-v1'));
      if (r?.version === 1 && int(r.acquiredAt) && Array.isArray(r.recipe) && r.recipe.length === 6 && r.recipe.every((n, i) => n === i)) return true;
    }
    return false;
  }
  // mbs-gala-completed-v1 stays the genuine-win receipt, written only by the Gala win branch (showEndingCard(true)). The character-created key
  // and a generic completePage('goon') are NOT evidence: network-flow recovers goon completion from character creation.
  // goon-result-menu-reached-v2 ({at,result}) is written when the ending menu opens on a win OR on no legal moves; it unlocks the
  // download. An old win receipt keeps working. A loss never writes mbs-gala-completed-v1.
  const menuReached = env => { try { return int(JSON.parse(env.ls('goon-result-menu-reached-v2'))?.at); } catch { return false; } };
  const galaWin = env => int(Number(env.ls('mbs-gala-completed-v1'))) || menuReached(env);
  // missions: step id -> predicate; rewards: app id -> predicate over the same env + record
  const MISSIONS = {
    fuel: env => fuelReceipt(env),
    girlfriend: env => goggles(env),
    lilboyfriend: env => env.pageDone('lilboyfriend'),
    goon: env => galaWin(env),
    corgi: env => env.pageDone('corgi'),
    djscratch: env => env.pageDone('djscratch'),
  };
  const REWARD_OF = {mominc: 'misinformation', fuel: 'fuel', girlfriend: 'jump', lilboyfriend: 'lilboyfriend', goon: 'alarm', corgi: 'corgi', djscratch: 'hand'};
  function reconcile(env, store) {
    const done = [];
    for (const [id, test] of Object.entries(MISSIONS)) {
      let ok = false; try { ok = !!test(env); } catch {}
      if (ok) { store.mission(id); if (id !== 'djscratch' && store.unlock(REWARD_OF[id], id)) done.push(REWARD_OF[id]); }
    }
    // Hand: DJ banked (even if done early) + all four existing prerequisites NOW + the hand offer reached.
    const r = store.read();
    if (r.missions.djscratch && !r.unlocked.hand && env.pagesReady() && (r.missions.handOffer || env.handOffer())) {
      store.mission('handOffer'); if (store.unlock('hand', 'djscratch')) done.push('hand');
    }
    // Coach MYR5: derived, never a new trigger. Seven earned = full tour, so earlier finishers get it here without replay.
    const u = store.read().unlocked;
    if (!u[FINALE] && APPS.every(a => a === FINALE || u[a]) && store.unlock(FINALE, 'tour')) done.push(FINALE);
    return done;
  }

  const core = {KEY, APPS, FILM_SLACK, REWARD_OF, createStore, mergeIntervals, coveredSeconds, percent, qualifies, FilmTracker, reconcile, normalize};
  if (typeof module !== 'undefined' && module.exports) module.exports = core;
  if (typeof window === 'undefined' || root !== window) return;
  if (root.MOM_TOUR) return;

  /* ====================== UI (browser, top window only) ====================== */
  try { if (window.top !== window && window.top.location.origin === location.origin) return; } catch {}
  const params = new URLSearchParams(location.search);
  if (location.pathname.startsWith('/apps/') || params.get('app') === '1') return;   // installed apps stay story-free
  const store = createStore(localStorage);
  const d = document;
  const reduced = () => !!matchMedia?.('(prefers-reduced-motion:reduce)').matches;
  if (params.get('tour') === 'off') store.update(r => { r.off = true; });
  if (params.get('tour') === 'on') store.update(r => { r.off = false; r.quietUntil = 0; });

  const STEPS = [
    {id: 'mominc', ch: 'mominc', url: '/tv/?ch=mominc', order: 'WATCH THE WHOLE RESCUE FILM. NO SKIPPING. MOM CAN TELL.', target: () => find('#miRescueVideo')},
    {id: 'fuel', ch: 'mominc', url: '/tv/?ch=mominc', order: 'SCROLL THE TV. WATCH THE FUEL AD. FLY THE TUB 8 PIPES.', target: () => find('.tv-ad-layer [data-sponsor="fuel"] .sponsor-art, .tv-ad-layer [data-sponsor="fuel"] a, .tv-ad-layer [data-sponsor="fuel"] button')},
    {id: 'girlfriend', ch: 'girlfriend', url: '/tv/?ch=girlfriend', order: 'DR GIRLFRIEND. POUR THE TUBES IN THE RIGHT ORDER. EARN THE GOGGLES.', target: () => find('#dgPaperGoggles')},
    {id: 'lilboyfriend', ch: 'lilboyfriend', url: '/tv/?ch=lilboyfriend', order: 'LITTLE BOYFRIEND. FINISH THE MUSEUM. SMALL IS GOOD.', target: () => find('#slotBtn, #lbLook, #lbWalk')},
    {id: 'goon', ch: 'goon', url: '/tv/?ch=goon', order: 'THE GOON GALA. MAKE 2048. A REAL 2048.', target: () => find('#joinBtn, [data-network-launch] a, #play')},
    {id: 'corgi', ch: 'corgi', url: '/tv/?ch=corgi', order: 'CORGI. FINISH THE HUNT. ALL OF IT.', target: () => find('#ventBtn, #ccNext, #ccReadBtn')},
    {id: 'djscratch', ch: 'djscratch', url: '/tv/?ch=djscratch', order: 'DJ SCRATCH LAST. FINISH THE BOOTH. THE HAND IS WAITING.', target: () => find('#hand-offer-link:not([hidden]), #powerSwitch, #codeSubmit')},
  ];
  function find(sel) {
    const hit = doc => { const el = doc.querySelector(sel); return el && vis(el) ? el : null; };
    let el = hit(d);
    if (el) return el;
    for (const f of d.querySelectorAll('iframe')) { try { el = f.contentDocument && hit(f.contentDocument); } catch {} if (el) return f; }
    return null;
  }
  function vis(el) { const r = el.getBoundingClientRect(); const v = el.ownerDocument.defaultView; return r.width > 0 && r.height > 0 && v.getComputedStyle(el).visibility !== 'hidden'; }

  /* env over live page state */
  const ls = k => { try { return localStorage.getItem(k); } catch { return null; } };
  const ss = k => { try { return sessionStorage.getItem(k); } catch { return null; } };
  const env = {
    ls, ss,
    pageDone(id) { try { const S = root.MBS_STATE, p = S?.read()?.channels?.[id]?.page; return !!(p?.complete === true && !p.legacy && S.completedPages().includes(id)); } catch { return false; } },
    pagesReady() { try { return !!root.MBS_FLOW?.pagesReady(); } catch { return false; } },
    handOffer() { return !!(d.querySelector('[data-sponsor="hand"]')); },
  };
  addEventListener('mbs:hand-offer', () => { if (env.pagesReady()) store.mission('handOffer'); });

  /* ---- apps catalogue: status decides the button ---- */
  let catalogue = null, catalogueAt = 0;
  async function loadCatalogue() {
    if (catalogue && Date.now() - catalogueAt < 60000) return catalogue;
    try { const r = await fetch('/apps/apps.json', {cache: 'no-cache'}); if (r.ok) { catalogue = Object.fromEntries((await r.json()).apps.map(a => [a.id, a])); catalogueAt = Date.now(); } } catch {}
    return catalogue || {};
  }
  function appAction(app, rec) {
    if (!rec || rec.status !== 'ready') return null;
    if (rec.type === 'apk') return {href: rec.href, label: 'DOWNLOAD THE APK', download: /\.apk$/.test(rec.href || '')};
    if (rec.type === 'external') return {href: rec.href, label: (rec.href.startsWith('/') ? 'OPEN ' : 'INSTALL ') + rec.name.toUpperCase()};   // a self-contained PWA with its own sw.js (Coach MYR5 at /apps/coach/)
    if (rec.type === 'pwa' && rec.browserPlay !== false) return {href: '/apps/' + app + '/', label: 'OPEN ' + rec.name.toUpperCase()};
    return rec.type === 'pwa' ? {href: '/apps/' + app + '/', label: 'INSTALL ' + rec.name.toUpperCase()} : null;
  }
  const NAMES = {misinformation: "MOM's: Misinformation Machine", fuel: "MOM's: Nitro Fuel", jump: "MOM's: Coach Jump", lilboyfriend: "MOM's: Little Boyfriend LIVE", alarm: "MOM's: 2048 Reminder", corgi: "Mom's Endless Corgi Workday", hand: "MOM's: Hand Customizer", coach: "MOM's: Coach MYR5"};

  /* ---- focus: gameplay, cutscenes, reveals and offers keep it; rewards wait ---- */
  let holds = 0;
  const hold = () => { holds++; let once = false; return () => { if (!once) { once = true; holds--; } }; };
  const tvGlass = () => d.querySelector('#tv .glass');
  const tvOff = () => { const t = d.getElementById('tv'); return !!t && t.dataset.state !== 'on'; };   // off or warming: MOM waits for power
  function busy() {
    if (holds > 0 || tvOff()) return true;
    const p = location.pathname;
    if (/^\/(?:play|gala|arcade|handborne)\//.test(p) || p.startsWith('/tv/games/')) return true;
    try { if (root.MBS?.inGame?.()) return true; } catch {}
    if (d.documentElement.hasAttribute('data-game-loading') || d.fullscreenElement) return true;
    if (d.querySelector('.retro-sponsor, [data-sponsor]:not([hidden])')) return true;
    return !!d.querySelector('dialog[open]:not(#mom-reward), [role="dialog"][aria-modal="true"]:not(#mom-reward)');
  }

  /* ---- UI ---- */
  let ui = null, card = null, lastActive = Date.now(), comeback = null, claimStart = Date.now();
  const el = (tag, cls, html) => { const e = d.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const earned = r => APPS.filter(a => r.unlocked[a]).length;
  function today() { const n = new Date(); return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0'); }
  function visit() {   // streak from real local visit days only
    store.update(r => {
      const t = today(); if (r.lastVisitDay === t) return;
      const y = new Date(Date.now() - 864e5), yd = y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0');
      r.returnStreak = r.lastVisitDay === yd ? (r.returnStreak || 0) + 1 : 1; r.lastVisitDay = t;
    });
  }
  function currentStep(r) { return STEPS.find(s => !r.missions[s.id]) || null; }
  function onStep(s) { const p = location.pathname; return (p === '/tv/' || p === '/tv/index.html') && params.get('ch') === s.ch || p.startsWith('/games/' + s.ch + '/'); }

  function build() {
    const root_ = el('div'); root_.id = 'mom-tour'; root_.setAttribute('aria-live', 'polite');
    const arrows = el('div', 'mt-arrows'); arrows.setAttribute('aria-hidden', 'true');   // pointer-events:none in CSS
    const bubble = el('section', 'mt-bubble'); bubble.setAttribute('aria-label', 'MOM tour');
    bubble.innerHTML = '<img class="mt-mark" src="/tv/assets/mom-inc-mark.png" alt="" width="44" height="44"><div class="mt-body"><p class="mt-order"></p><p class="mt-meta"></p></div>'
      + '<a class="mt-go" href="/tv/?ch=mominc">GO &raquo;</a><button class="mt-x" type="button" aria-label="Quiet MOM for 60 seconds">&times;</button>'
      + '<button class="mt-off" type="button">Turn tour off</button>';
    root_.append(arrows, bubble); d.body.append(root_);
    bubble.querySelector('.mt-x').onclick = () => { store.update(r => { r.quietUntil = Date.now() + 60000; }); render(); };
    bubble.querySelector('.mt-off').onclick = () => { store.update(r => { r.off = true; }); render(); };
    return {root: root_, arrows, bubble, order: bubble.querySelector('.mt-order'), meta: bubble.querySelector('.mt-meta'), go: bubble.querySelector('.mt-go')};
  }
  const idle = () => (Date.now() - lastActive) / 1000;
  const level = () => idle() >= 45 ? 3 : idle() >= 20 ? 2 : idle() >= 8 ? 1 : 0;
  const LINES = ['', 'MOM IS WAITING.', 'MOM SAID NOW.', 'MOM IS VERY DISAPPOINTED. NOW.'];

  function render() {
    const r = store.read();
    if (card) { fillLandingCards(r); return; }
    const free = !busy();
    if (free && r.pendingRewards.length) { showReward(r.pendingRewards[0], r); return; }
    const step = currentStep(r), show = free && !r.off && step && Date.now() >= r.quietUntil && !d.hidden;
    if (!show) { if (ui) ui.root.hidden = true; fillLandingCards(r); return; }
    ui = ui || build(); ui.root.hidden = false;
    const lv = level(), here = onStep(step), target = here ? step.target() : null;
    ui.root.dataset.level = lv;
    ui.order.textContent = (comeback || step.order) + (LINES[lv] ? ' ' + LINES[lv] : '');
    const n = earned(r), ob = Math.min(99, 14 + n * 11 + Math.min(r.returnStreak || 0, 5));
    ui.meta.textContent = n + '/8 DOWNLOADS EARNED · OBEDIENCE ' + ob + '% (MOM MADE THAT UP)';
    ui.go.hidden = here; ui.go.setAttribute('href', step.url);
    place(target, [2, 3, 4, 6][lv]);
    fillLandingCards(r);
  }
  /* Arrows sit beside the target pointing at it. A huge target (an iframe, a game surface) is never pointed at. */
  function place(target, count) {
    const vw = innerWidth, vh = innerHeight, A = ui.arrows, B = ui.bubble;
    A.replaceChildren(); B.classList.remove('mt-top');
    // On the TV, MOM lives inside the glass (never over the dial or POWER); elsewhere, the viewport.
    const g = tvGlass(), gr = g && g.getBoundingClientRect();
    const f = gr && gr.width > 160 && gr.height > 160 ? {l: Math.max(0, gr.left), t: Math.max(0, gr.top), r: Math.min(vw, gr.right), b: Math.min(vh, gr.bottom)} : null;
    const box = f || {l: 0, t: 0, r: vw, b: vh};
    B.classList.toggle('mt-framed', !!f);
    const frameAt = top => { if (f) B.style.cssText = 'left:' + (f.l + 6) + 'px;right:' + (vw - f.r + 6) + 'px;max-width:none;' + (top ? 'top:' + (f.t + 18) + 'px;bottom:auto' : 'top:auto;bottom:' + (vh - f.b + 6) + 'px'); else B.style.cssText = ''; };
    frameAt(false);
    let rect = target ? target.getBoundingClientRect() : null;
    if (rect && (rect.width * rect.height > vw * vh * 0.35 || rect.bottom < box.t || rect.top > box.b || rect.right < box.l || rect.left > box.r)) rect = null;
    const real = !!rect;
    if (!rect) rect = B.querySelector('.mt-go').hidden ? B.getBoundingClientRect() : B.querySelector('.mt-go').getBoundingClientRect();   // no usable target: point at the GO button, else at MOM's own bubble
    const b = B.getBoundingClientRect();    // never cover the target with the bubble
    const hit = rect.bottom > b.top - 4 && rect.top < b.bottom + 4 && rect.right > b.left && rect.left < b.right;
    if (hit && real) { B.classList.add('mt-top'); frameAt(true); }
    const cx = Math.max(box.l + 24, Math.min(box.r - 24, rect.left + rect.width / 2)), above = rect.top > box.t + 150, size = 40 + level() * 6;
    for (let i = 0; i < count; i++) {
      const c = el('i', 'mt-chev ' + (above ? 'down' : 'up'));
      const x = Math.max(box.l, Math.min(box.r - size, cx - size / 2 + (i % 2 ? 1 : -1) * (i >> 1) * (size + 6)));
      c.style.cssText = 'width:' + size + 'px;height:' + size + 'px;left:' + x + 'px;top:' + (above ? Math.max(box.t + 4, rect.top - (i % 2 + 1) * (size - 4) - 6) : Math.min(box.b - size - 4, rect.bottom + (i % 2) * (size - 4) + 6)) + 'px';
      c.style.animationDelay = (i * 90) + 'ms'; A.append(c);
    }
  }

  /* ---- reward celebration ---- */
  async function showReward(app, r) {
    if (card) return;
    card = true;                                  // reserve before the await
    const rec = (await loadCatalogue())[app], act = appAction(app, rec), n = earned(r);
    const c = el('section', 'mt-reward'); c.id = 'mom-reward'; c.setAttribute('role', 'dialog'); c.setAttribute('aria-labelledby', 'mt-rw-h');
    c.innerHTML = '<div class="mt-card"><p class="mt-stamp">UNLOCKED</p><h2 id="mt-rw-h">' + esc(rec?.name || NAMES[app] || app) + '</h2><p>' + esc(rec?.description || 'MOM says you earned this.') + '</p>'
      + '<p class="mt-count">' + n + '/8 DOWNLOADS EARNED</p>'
      + (act ? '<a class="mt-cta" href="' + esc(act.href) + '"' + (act.download ? ' download' : '') + '>' + act.label + '</a>' : '<p class="mt-cta soon">COMING SOON &mdash; MOM IS STILL MAKING IT.</p>')
      + '<p class="mt-claim"></p><button class="mt-continue" type="button">Continue</button></div>';
    d.body.append(c); card = c;
    const claim = c.querySelector('.mt-claim'), tick = () => { const s = 600 - Math.floor(((Date.now() - claimStart) / 1000) % 600); claim.textContent = 'CLAIM WINDOW ' + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') + ' - MOM MADE THIS DEADLINE UP. YOUR DOWNLOAD STAYS UNLOCKED.'; };
    tick(); const timer = setInterval(tick, 1000);
    const close = () => { clearInterval(timer); removeEventListener('keydown', key, true); c.remove(); card = null; store.announce(app); render(); };
    const key = e => { if (e.key === 'Escape') close(); };
    addEventListener('keydown', key, true);
    c.querySelector('.mt-continue').onclick = close;
    c.querySelector('.mt-cta[href]')?.addEventListener('click', () => store.announce(app));
    c.querySelector('.mt-continue').focus();
  }

  /* ---- landing cards: same record, same app ids ---- */
  let cards = null;
  async function fillLandingCards(r) {
    if (!/^\/(?:games\/|files\/|$)/.test(location.pathname)) return;
    const cat = await loadCatalogue();
    if (!cards) { cards = el('aside', 'mt-downloads'); cards.id = 'mom-downloads'; cards.setAttribute('aria-label', 'MOM downloads'); (d.querySelector('main') || d.body).prepend(cards); }
    cards.hidden = r.off && !earned(r);
    const rows = APPS.map(a => {
      const act = r.unlocked[a] && appAction(a, cat[a]);
      return '<li class="' + (r.unlocked[a] ? 'on' : '') + '"><b>' + esc(NAMES[a]) + '</b> ' + (act ? '<a href="' + esc(act.href) + '"' + (act.download ? ' download' : '') + '>' + act.label + '</a>' : r.unlocked[a] ? '<span>COMING SOON &mdash; MOM IS STILL MAKING IT.</span>' : '<span>LOCKED</span>') + '</li>';
    }).join('');
    const html = '<h2>MOM DOWNLOADS ' + earned(r) + '/8 EARNED</h2><ul>' + rows + '</ul>' + (r.off ? '<button type="button" class="mt-on">Turn tour back on</button>' : '');
    if (cards.dataset.sig !== html) { cards.innerHTML = html; cards.dataset.sig = html; cards.querySelector('.mt-on')?.addEventListener('click', () => { store.update(x => { x.off = false; }); render(); }); }
  }

  /* ---- rescue film tracker ---- */
  const tracked = new WeakSet();
  function attachFilm() {
    const v = d.getElementById('miRescueVideo');
    if (!v || tracked.has(v)) return;
    tracked.add(v);
    const name = (v.currentSrc || v.dataset.src || v.getAttribute('src') || 'rescue').split('?')[0].split('/').pop();
    const inView = () => { const b = v.getBoundingClientRect(); const w = Math.min(b.right, innerWidth) - Math.max(b.left, 0), h = Math.min(b.bottom, innerHeight) - Math.max(b.top, 0); return w > 0 && h > 0 && w * h >= b.width * b.height * 0.5; };
    const host = {now: () => Date.now(), time: () => v.currentTime, duration: () => v.duration, rate: () => v.playbackRate || 1,
      active: () => !d.hidden && !v.paused && !v.ended && !v.seeking && v.readyState >= 2 && inView()};
    const t = new FilmTracker('miRescueVideo:' + name, store, host, (id, dur) => {
      store.unlock('misinformation', 'film'); store.mission('mominc');
      dispatchEvent(new CustomEvent('mom:video-watched', {detail: {film: id, version: Math.round(dur * 10) / 10}}));
      render();
    });
    v._momFilm = t;
    let timer = 0;
    const start = () => { if (!timer) { t.sample(); timer = setInterval(() => t.sample(), 250); } };
    const stop = () => { t.sample(); t.flush(); t.reset(); clearInterval(timer); timer = 0; };
    v.addEventListener('playing', start); v.addEventListener('pause', stop); v.addEventListener('emptied', stop);
    v.addEventListener('seeking', () => t.reset()); v.addEventListener('seeked', () => t.reset()); v.addEventListener('ratechange', () => t.reset());
    v.addEventListener('ended', stop); v.addEventListener('timeupdate', () => t.sample());
    d.addEventListener('visibilitychange', () => { if (d.hidden) stop(); else if (!v.paused) start(); });
    addEventListener('pagehide', stop);
    if (!v.paused) start();
  }

  /* ---- loop ---- */
  let poll = 0;
  function tick() {
    attachFilm();
    reconcile(env, store);
    render();
  }
  function go() { if (!poll && !d.hidden) { tick(); poll = setInterval(tick, 1000); } }
  function pause() { clearInterval(poll); poll = 0; }
  function start() {
    visit();
    const link = d.createElement('link'); link.rel = 'stylesheet'; link.href = '/tv/mom-tour.css?v=2'; d.head.append(link);
    for (const t of ['pointerdown', 'keydown', 'touchstart', 'wheel', 'scroll']) d.addEventListener(t, () => { lastActive = Date.now(); }, {capture: true, passive: true});
    for (const t of ['scroll', 'resize']) addEventListener(t, () => { if (ui && !ui.root.hidden) render(); }, {passive: true, capture: true});
    visualViewport?.addEventListener('resize', () => render()); visualViewport?.addEventListener('scroll', () => render());
    addEventListener('storage', e => { if (e.key === KEY || e.key === null) render(); });
    for (const e of ['mbs:page-complete', 'mbs:goggles-earned', 'mbs-flow', 'mbs:gala-character-created']) addEventListener(e, tick);
    d.addEventListener('visibilitychange', () => {
      if (d.hidden) { pause(); comeback = 'MOM SAW YOU LEAVE. COME BACK AND FINISH.'; }
      else { go(); setTimeout(() => { comeback = null; render(); }, 6000); }
    });
    go();
  }
  root.MOM_TOUR = {hold, enabled: () => !store.read().off, state: () => store.read(), store, tick, STEPS};
  if (d.body) start(); else d.addEventListener('DOMContentLoaded', start, {once: true});
})(typeof window !== 'undefined' ? window : globalThis);
