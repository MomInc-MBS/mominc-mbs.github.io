// Coach Jump pyramid menu view: six real <button>s laid out 1-2-3 on the paper food pyramid of the game's level-1 desk.
// DOM only. State and rules live in selector.mjs; this file draws a state and reports taps.
import {renderPaperCoach} from '/tv/channels/girlfriend-roster.js';
import {layout} from '/apps/jump/selector.mjs';

const EDGE = '#624848', SHADOW = '#49334b66';
const hash = n => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
/** Port of cut() in game.mjs: a slightly uneven scissor-cut rectangle, in game units, deterministic per seed. */
function cutPoints(w, h, seed, j = 1.3) {
  const n = Math.max(2, Math.round(w / 20)), J = i => (hash(seed * 7 + i) - .5) * 2 * j, pts = [];
  for (let i = 0; i <= n; i++) pts.push([-w / 2 + w * i / n + J(i), -h / 2 + J(i + 50)]);
  pts.push([w / 2 + J(90), J(91)]);
  for (let i = n; i >= 0; i--) pts.push([-w / 2 + w * i / n + J(i + 100), h / 2 + J(i + 150)]);
  pts.push([-w / 2 + J(190), J(191)]);
  return pts.map(([x, y]) => `${(x + w / 2).toFixed(2)},${(y + h / 2).toFixed(2)}`).join(' ');
}
const sheet = (w, h, seed, fill, shadow = 3) => {
  const pts = cutPoints(w, h, seed);
  return `<svg viewBox="0 0 ${w} ${h}" aria-hidden="true" focusable="false"><polygon points="${pts}" fill="${SHADOW}" transform="translate(${shadow} ${shadow})"/><polygon points="${pts}" fill="${fill}" stroke="${EDGE}" stroke-width="1.6"/></svg>`;
};

// All numbers below are pyramidDesk() geometry (game units): tiers, 3+2 squares, label. Origin = top-left of the 150 x 109 box.
// [left, top, w, h, seed, fill]
const TIERS = [[0, 75, 150, 34, 20, '#cdbb8a'], [22.5, 43, 105, 34, 21, '#d9c590'], [45, 11, 60, 34, 22, '#e8d28a']];
const SLOT = {go: [55, 0], ml: [50, 52], mr: [78, 52], bl: [34, 84], bc: [64, 84], br: [94, 84]};
// Each tile keeps its own colour and cut shape; only its slot changes.
const TILES = {
  go: {w: 40, h: 18, seed: 8, fill: '#2d2a4e', shadow: 3},
  color: {w: 22, h: 18, seed: -62, fill: '#f4978e'},
  coach: {w: 22, h: 18, seed: -34, fill: '#c9a7eb'},
  music: {w: 22, h: 18, seed: -16, fill: '#f4d35e'},
  prev: {w: 22, h: 18, seed: -46, fill: '#7fcf5a'},
  next: {w: 22, h: 18, seed: 14, fill: '#4fd1c5'},
};
const ICON = {
  color: '<circle cx="8.5" cy="9" r="5.5" fill="#e0455d"/><circle cx="15.5" cy="9" r="5.5" fill="#3d8be0"/><circle cx="12" cy="15" r="5.5" fill="#f6df4a"/>',
  coach: '<path fill="#fff4dc" d="M12 2.5 16.2 10.5 15 14.5 17.5 21.5H6.5L9 14.5 7.8 10.5Z"/><circle cx="12" cy="9" r="1.4" fill="#2d2a4e"/>',
  music: '<path fill="#fff4dc" d="M9 18.5a3 3 0 1 1-1.5-2.6V5.5l11-2.3v12.3a3 3 0 1 1-1.5-2.6V6.9L9 8.5Z"/>',
  prev: '<path fill="#fff4dc" d="M16.5 4 6.5 12l10 8Z"/>',
  next: '<path fill="#fff4dc" d="M7.5 4l10 8-10 8Z"/>',
};
const icon = (name, extra = '') => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICON[name]}${extra}</svg>`;
const SLASH = '<path class="fillnone" d="M3 3 21 21" stroke="#c0283f" stroke-width="2.4"/>';
const preview = batch => `<span class="jm-preview"><svg viewBox="0 0 200 240" aria-hidden="true" focusable="false">${renderPaperCoach(batch)}</svg></span>`;
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

export function createMenu(parent, {onGo, onPick, onStep, onToggle}) {
  const lab = document.createElement('div');
  lab.className = 'jm-lab';
  lab.innerHTML = `<div class="jl-scene" aria-hidden="true"><div class="jl-wall"></div><div class="jl-trim"></div>
<div class="jl-poster">CARED FOR.<br>CORRECTED.<br>PROVIDED FOR.</div><div class="jl-chair"></div>
<img class="jl-doctor" src="/tv/assets/drgf-paper-character.svg" alt="" decoding="async"><div class="jl-bench-back"></div><div class="jl-bench-front"></div></div>
<div class="jm-pyr" role="group" aria-label="Coach Jump menu"></div>`;
  const pyr = lab.querySelector('.jm-pyr');
  const tiers = [];
  for (const [l, t, w, h, seed, fill] of TIERS) {
    const d = document.createElement('div');
    d.className = 'jm-tier';
    d.style.cssText = `left:calc(${l}*var(--u));top:calc(${t}*var(--u));width:calc(${w}*var(--u));height:calc(${h}*var(--u))`;
    d.innerHTML = sheet(w, h, seed, fill);
    pyr.append(d); tiers.push(d);
  }
  const tiles = {};
  for (const [id, t] of Object.entries(TILES)) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = `jm-tile is-${id}`; b.dataset.id = id;
    b.style.width = `calc(${t.w}*var(--u))`; b.style.height = `calc(${t.h}*var(--u))`;
    b.innerHTML = `<span class="jm-sheet" style="inset:0">${sheet(t.w, t.h, t.seed, t.fill, t.shadow ?? 1)}</span><span class="jm-face"></span>`;
    pyr.append(b); tiles[id] = {el: b, face: b.querySelector('.jm-face'), key: ''};
  }
  // Delegated and registered once for the life of the menu.
  let locked = false;
  pyr.addEventListener('click', e => {
    const b = e.target.closest?.('.jm-tile');
    if (!b || locked) return;
    const id = b.dataset.id;
    if (id === 'go') onGo(); else if (id === 'prev') onStep(-1); else if (id === 'next') onStep(1);
    else if (b.classList.contains('is-center')) { if (id === 'music') onToggle(); } else onPick(id);
  });
  parent.append(lab);

  const setSlot = (id, slot) => { const [x, y] = SLOT[slot]; tiles[id].el.style.setProperty('--x', x); tiles[id].el.style.setProperty('--y', y); };
  const paint = (id, html, key) => { if (tiles[id].key !== key) { tiles[id].key = key; tiles[id].face.innerHTML = html; } };

  return {
    el: lab,
    pyr,
    baseTier: tiers[0],
    /** info = {shapeLabel, paletteName, trackTitle, musicOn, hasTracks} */
    render(state, info) {
      const s = layout(state.active), a = state.active;
      setSlot('go', 'go'); setSlot('prev', 'bl'); setSlot('next', 'br');
      setSlot(s.left, 'ml'); setSlot(s.right, 'mr'); setSlot(s.center, 'bc');
      const batch = {shapeId: state.shapeId, paletteId: state.paletteId, eyes: state.eyes}, bk = JSON.stringify(batch);
      for (const id of ['color', 'coach', 'music']) tiles[id].el.classList.toggle('is-center', s.center === id);
      const live = !!(info.musicOn && info.hasTracks);
      tiles.music.el.classList.toggle('is-off', !live);
      paint('go', '<span class="jm-go">&#9654; GO</span>', 'go');
      paint('prev', icon('prev'), 'prev'); paint('next', icon('next'), 'next');
      paint('color', s.center === 'color' ? preview(batch) : icon('color'), s.center === 'color' ? 'p' + bk : 'i');
      paint('coach', s.center === 'coach' ? preview(batch) : icon('coach'), s.center === 'coach' ? 'p' + bk : 'i');
      paint('music', icon('music', live ? '' : SLASH) + (s.center === 'music' ? `<span class="jm-title">${esc(info.hasTracks ? info.trackTitle : 'No music')}</span>` : ''),
        `${live}:${s.center === 'music' ? info.trackTitle : ''}`);
      const what = a === 'color' ? 'color' : a === 'coach' ? 'Coach' : 'song';
      const label = {
        go: 'Go: start jumping with this Coach, these colors and this song',
        prev: `Previous ${what}`,
        next: `Next ${what}`,
        color: s.center === 'color' ? `Colors: ${info.paletteName}. Use the arrows to change` : 'Choose colors',
        coach: s.center === 'coach' ? `Coach: ${info.shapeLabel}. Use the arrows to change` : 'Choose Coach shape',
        music: s.center === 'music' ? `Music: ${info.hasTracks ? info.trackTitle : 'unavailable'}. ${live ? 'Tap to turn music off' : 'Tap to turn music on'}` : 'Choose music',
      };
      for (const id of Object.keys(tiles)) tiles[id].el.setAttribute('aria-label', label[id]);
    },
    /** Inert controls during the game-start transition. */
    lock(v) { locked = v; lab.inert = v; },
    press(v) { tiles.go.el.classList.toggle('is-pressed', v); },
  };
}
