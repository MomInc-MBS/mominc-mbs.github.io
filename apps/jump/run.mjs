// Coach Jump PWA runtime: the pyramid menu on Dr Girlfriend's bench (Coach, colors, song), then the game.
// Standalone: touches only its own keys (best, look, music), never website story state, receipts or redirects.
import {startGame} from '/arcade/pyramid-jump/game.mjs';
import {rasterizePaper, releasePaper} from '/arcade/pyramid-jump/paper.mjs';
import {askTilt, subscribeTilt, tiltReady} from '/arcade/pyramid-jump/tilt.mjs';
import {PAPER_SHAPES, PAPER_PALETTES} from '/tv/channels/girlfriend-roster.js';
import {ROUND_KEY} from '/arcade/pyramid-jump/rounds.mjs';
import {DEFAULT_TRACK, createSoundtrack} from '/apps/jump/soundtrack.mjs';
import {LOOK_KEY, initialState, fixTrack, pick, step, runConfig, saveLook, readJson} from '/apps/jump/selector.mjs';
import {createMenu} from '/apps/jump/menu.mjs';

const BEST_KEY = 'myr5-pyramid-jump-best-v1'; // the vendored game saves its best here (apps.json bestKey)
const GAME_W = 360;                            // game.mjs W: world units across the play area
// ponytail: the game's level-1 desk pyramid sits this many game units above the canvas bottom (camY -90, pyramidDesk(by=0) base at -4).
const DESK_BASE_UP = 86, DESK_BASE_W = 150;
const ZOOM_MS = 850, READY_MS = 600, BEGIN_MS = 400, FADE_MS = 200, PRELOAD_MS = 250;
const SHAPE_IDS = PAPER_SHAPES.map(s => s.id), PALETTE_IDS = PAPER_PALETTES.map(p => p.id);
const DEFAULTS = {shapeId: 'myr5', paletteId: 0, eyes: 2, trackId: DEFAULT_TRACK};
const el = (tag, cls, text) => Object.assign(document.createElement(tag), {className: cls || '', textContent: text || ''});
const wait = ms => new Promise(r => setTimeout(r, ms));
const lookKey = c => `${c.shapeId}|${c.paletteId}|${c.eyes}`;

export function mountJump(host, options = {}) {
  const root = el('div', 'jump-root');
  host.append(root);
  const store = localStorage;
  let game = null, paper = null, disposed = false, token = 0, unsubTilt = null, phase = 'menu';
  let lastConfig = null, tracks = [], musicTried = false, preload = null, preloadTimer = 0;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const subscribeMotion = cb => (unsubTilt = subscribeTilt(cb)); // leaning + arrow keys only, no touch steering
  const st = createSoundtrack();   // ONE player for the whole mount: it keeps playing from menu into the game and back
  window.MOM_APP_BUSY = () => phase !== 'menu';   // shell update-reload waits only while a run is on screen

  let state = initialState({saved: readJson(store, LOOK_KEY), round: readJson(store, ROUND_KEY)?.batch, catalog: catalog(), defaults: DEFAULTS});
  function catalog() { return {shapes: SHAPE_IDS, palettes: PALETTE_IDS, tracks: tracks.map(t => t.id)}; }
  const best = () => { try { return Math.max(0, Math.floor(Number(store.getItem(BEST_KEY))) || 0); } catch { return 0; } };

  // ---- menu -------------------------------------------------------------------------------------------------------
  const menu = createMenu(root, {
    onGo: () => go(),
    onPick: id => { state = pick(state, id); draw(); },
    onStep: dir => {
      state = step(state, dir, catalog()); draw(); persist();
      if (state.active === 'music') st.select(state.trackId);   // previews the song; coach/color never touch the music
    },
    onToggle: () => { if (firstTap && st.on) { firstTap = false; return; } firstTap = false; const p = st.setOn(!st.on); draw(); p.then(draw); },
  });
  function draw() {
    const shape = PAPER_SHAPES.find(s => s.id === state.shapeId), pal = PAPER_PALETTES.find(p => p.id === state.paletteId);
    menu.render(state, {
      shapeLabel: shape?.label || '', paletteName: pal?.name || '',
      trackTitle: tracks.find(t => t.id === state.trackId)?.title || '', hasTracks: tracks.length > 0, musicOn: st.on,
    });
    schedulePreload();
  }
  const persist = () => saveLook(store, state);
  // Browser audio needs a gesture: unlock synchronously inside the first pointerdown/keydown, then play the chosen song.
  let firstTap = false;   // the tap that unlocks audio starts the music; it must not also count as the centre on/off toggle
  const gesture = e => {
    if (!musicTried) { musicTried = true; firstTap = e?.type === 'pointerdown'; st.unlock(state.trackId); st.select(state.trackId); }
    else if (!st.unlocked) st.unlock();   // a suspended context (e.g. iOS) is retried on the next tap
  };
  root.addEventListener('pointerdown', gesture, true);
  root.addEventListener('click', () => { firstTap = false; });   // bubbles after the menu's own click handler
  const onKey = e => {
    if (disposed || phase !== 'menu' || e.defaultPrevented) return;
    gesture();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); menu.el.querySelector(e.key === 'ArrowLeft' ? '.is-prev' : '.is-next').click(); }
  };
  addEventListener('keydown', onKey);
  st.catalog().then(list => {
    if (disposed) return;
    tracks = list;
    state = fixTrack(state, list.map(t => t.id), DEFAULT_TRACK);
    draw();
    st.prefetch?.([state.trackId]);
  });

  // ---- paper Coach: rasterize ahead while the menu idles, so GO is quick ---------------------------------------------
  function schedulePreload() {
    clearTimeout(preloadTimer);
    if (phase !== 'menu' || disposed) return;
    const cfg = runConfig(state), key = lookKey(cfg);
    if (preload?.key === key) return;
    preloadTimer = setTimeout(() => {
      if (disposed) return;
      const mine = {key, promise: rasterizePaper(cfg).catch(() => null)};
      const old = preload; preload = mine;
      old?.promise.then(releasePaper);
    }, PRELOAD_MS);
  }
  async function rasterFor(cfg) {
    const key = lookKey(cfg);
    if (preload?.key === key) { const p = preload; preload = null; const r = await p.promise; if (r) return r; }
    return rasterizePaper(cfg);
  }

  // ---- run ----------------------------------------------------------------------------------------------------------
  const canvasOf = () => root.querySelector('canvas');
  function stop() {
    game?.dispose(); game = null; unsubTilt = null;
    const done = paper; paper = null;
    setTimeout(() => releasePaper(done), 0); // after any in-flight frame finished drawing
    root.querySelector('.jump-over')?.remove();
    root.querySelector('.jm-call')?.remove();
  }
  async function go() {
    if (phase !== 'menu' || disposed) return;   // the guard: a second tap can never start a second run
    phase = 'starting';
    askTilt();   // still inside the GO tap: iPhone's motion prompt now, not a card after the zoom
    menu.lock(true); menu.press(true);
    menu.el.classList.add('is-go');
    const config = lastConfig = runConfig(state);
    persist();
    clearTimeout(preloadTimer);
    await run(config, true);
  }
  /** Mounts the game under the menu on hold, plays the entrance, then releases the hold. */
  async function run(config, zoom) {
    const mine = ++token, live = () => !disposed && mine === token;
    let raster;
    try {
      raster = await rasterFor(config);
      await tiltReady(root);
    } catch { raster = raster || null; }
    if (!live() || !raster) { releasePaper(raster); if (live()) toMenu(); return; }
    paper = raster;
    let release;
    const hold = new Promise(r => (release = r));
    game = startGame(root, {paperImg: paper, startLevel: 1, seed: Date.now(), subscribeMotion, onEnd, onExit: () => toMenu(), hold});
    const canvas = canvasOf();
    canvas?.classList.add('jm-game');
    if (canvas) canvas.style.opacity = '0';
    phase = 'zooming';
    await frame();
    if (!live()) return;
    if (zoom) await enter(canvas); else if (canvas) canvas.style.opacity = '1';
    if (!live()) return;
    const call = el('div', 'jm-call');
    root.append(call);
    phase = 'ready';
    call.textContent = 'READY?'; call.className = 'jm-call pop';
    await wait(READY_MS); if (!live()) return;
    phase = 'begin';
    call.textContent = 'BEGIN!'; call.className = 'jm-call pop';
    await wait(BEGIN_MS); if (!live()) return;
    call.remove();
    phase = 'playing';
    release();
    host.querySelector('canvas')?.focus();
  }
  const frame = () => new Promise(r => requestAnimationFrame(() => r()));
  /** Zoom out from the close-up bench to the game's level-1 framing, landing the pyramid on the game's desk pyramid. */
  async function enter(canvas) {
    const lab = menu.el;
    if (reduced()) {
      if (canvas) canvas.style.opacity = '1';
      lab.classList.add('is-fade');
      await wait(FADE_MS);
    } else {
      const r = root.getBoundingClientRect(), b = menu.baseTier.getBoundingClientRect();
      const cx = b.left + b.width / 2 - r.left, by = b.bottom - r.top;   // menu pyramid base, root px
      const s = root.clientWidth / GAME_W;                               // game px per unit
      const tx = root.clientWidth / 2, ty = root.clientHeight - DESK_BASE_UP * s;
      const k = (DESK_BASE_W * s) / b.width;
      lab.style.transformOrigin = `${cx}px ${by}px`;
      void lab.offsetWidth;
      lab.classList.add('is-zoom');
      lab.style.transform = `translate(${tx - cx}px,${ty - by}px) scale(${k})`;
      if (canvas) canvas.style.opacity = '1';
      await wait(ZOOM_MS + 150);
    }
    lab.hidden = true;
  }
  /** Back to the pyramid with every selection kept; music keeps playing (one player). */
  function toMenu() {
    ++token;
    stop();
    const lab = menu.el;
    lab.classList.remove('is-go', 'is-zoom', 'is-fade');
    lab.style.transform = ''; lab.style.transformOrigin = '';
    lab.hidden = false;
    menu.press(false); menu.lock(false);
    state = pick(state, 'music');    // every menu open starts in music mode, values kept
    phase = 'menu';
    draw();
  }
  function onEnd(r) {
    ++token;
    stop();
    phase = 'over';
    const over = el('div', 'jump-over');
    over.append(el('h2', '', r.won ? 'You made it!' : r.why), el('p', '', `Height ${r.score} · Best ${Math.max(best(), r.score)}`));
    const again = el('button', '', 'Jump again'), back = el('button', 'alt', 'Pyramid');
    again.type = back.type = 'button';
    again.onclick = () => { if (phase !== 'over') return; phase = 'starting'; over.remove(); run(lastConfig, false); };
    back.onclick = () => { if (phase === 'over') toMenu(); };
    over.append(again, back); root.append(over); again.focus();
  }

  draw();
  return {
    dispose() {
      disposed = true; token++; clearTimeout(preloadTimer);
      removeEventListener('keydown', onKey);
      stop();
      preload?.promise.then(releasePaper); preload = null;
      st.dispose();
      if (window.MOM_APP_BUSY) delete window.MOM_APP_BUSY;
      root.remove();
    },
  };
}
