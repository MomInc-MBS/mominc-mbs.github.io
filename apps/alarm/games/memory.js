// MOM Inc memory pairs for the alarm: 12 cards, 6 pairs, 18 attempts max.
// No canvas: a DOM <button> grid, 4x3 or 3x4 by aspect. Drafted by local gpt-oss-20b, fixed in review. Win checked before the 18-attempt budget.

import {MONO} from './common.js';
const COLORS = [
  '#FFD60A', // yellow
  '#7B2FF7', // purple
  '#22D3EE', // blue
  '#F472B6', // pink
  '#A3E635', // green
  '#F97316'  // orange
];

const SHAPES = [
  '<polygon points="12,4 20,20 4,20" />',                     // triangle
  '<rect x="5" y="5" width="14" height="14" />',             // square
  '<circle cx="12" cy="12" r="8" />',                        // circle
  '<polygon points="12,4 18,12 12,20 6,12" />',              // diamond
  '<polygon points="7,4 17,4 22,12 17,20 7,20 2,12" />',       // hexagon
  '<polygon points="12,4 14,10 20,10 15,14 17,20 12,16 7,20 9,14 4,10 10,10" />' // star
];

const NAMES = ['triangle', 'square', 'circle', 'diamond', 'hexagon', 'star'];
const face = id => `<svg viewBox="0 0 24 24" style="display:block;width:100%;height:100%" fill="${COLORS[id]}">${SHAPES[id]}</svg>`;
const BACK_COLOR = '#3A1478';
// colour drawer vars (set on the play section): --gc-1 background, --gc-2 card backs, --gc-3 frame; each with a fallback = the original look
const BACK_SVG = `<svg viewBox="0 0 24 24" style="display:block;width:100%;height:100%"><rect width="24" height="24" style="fill:var(--gc-2,${BACK_COLOR})" rx="4"/><circle cx="12" cy="12" r="5" style="fill:var(--gc-2-ink,#FFD60A)"/></svg>`;

function makeCard(idx, faceId) {
  const btn = document.createElement('button');
  btn.style.touchAction = 'manipulation'; btn.style.overflow = 'hidden';   // the svg fills the grid cell; it never sets the row height
  btn.style.margin = '3px';
  btn.style.padding = '0';
  btn.dataset.idx = idx;
  btn.dataset.face = faceId;
  btn.setAttribute('aria-label', `card ${idx + 1}, face down`);
  btn.innerHTML = BACK_SVG;
  return btn;
}

function create() {
  let host, ctx;
  let deck = [];          // array of 12 face ids (0-5 repeated)
  let matched = Array(12).fill(false);
  let attempts = 0;
  let pairs = 0;
  let firstIdx = null;    // index of first flipped card in current attempt
  let busy = false;       // during mismatch delay
  let paused = false;     // host pause
  let done = false;       // finished
  let timeoutId = null;

  const grid = document.createElement('div');
  const statusBar = document.createElement('div');

  function updateStatus() {
    statusBar.innerHTML = '';
    const a = document.createElement('span');
    a.style.fontFamily = MONO;
    a.style.fontWeight = 'bold';
    a.style.color = 'var(--gc-1-ink,#FFD60A)';
    a.style.display = 'flex';
    a.style.alignItems = 'center';
    a.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 2 L12 22 M12 22 L8 18 M12 22 L16 18" stroke="currentColor" fill="none"/></svg> <span>${String(18 - attempts).padStart(2, '0')}</span>`;
    const p = document.createElement('span');
    p.style.fontFamily = MONO;
    p.style.fontWeight = 'bold';
    p.style.color = 'var(--gc-1-ink,#FFD60A)';
    p.style.display = 'flex';
    p.style.alignItems = 'center';
    p.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18"><path d="M6 12 L10 16 L18 8" stroke="currentColor" fill="none"/></svg> <span>${String(pairs).padStart(2, '0')}</span>`;
    statusBar.append(a, p);
  }

  function flipCard(idx) {
    if (busy || paused || done || matched[idx] || idx === firstIdx) return;
    const btn = grid.children[idx];
    const faceId = deck[idx];
    btn.innerHTML = face(faceId);
    btn.setAttribute('aria-label', `card ${idx + 1}, ${NAMES[faceId]}`);
    if (firstIdx === null) {
      firstIdx = idx;
    } else {
      attempts++;
      const secondIdx = idx;
      if (deck[firstIdx] === deck[secondIdx]) { // match
        matched[firstIdx] = matched[secondIdx] = true;
        pairs++;
        firstIdx = null;
        grid.children[secondIdx].style.borderColor = grid.children[firstIdxOf(secondIdx)].style.borderColor = '#FFD60A';
        updateStatus();
        ctx.save();
        if (pairs === 6) { done = true; ctx.finish('won', 'pairs', {pairs, attempts}); }
        else if (attempts >= 18) { done = true; ctx.finish('lost', 'attempts', {pairs, attempts}); }
      } else {
        updateStatus();
        ctx.save();                                   // a miss spends an attempt too: saved now, so returning never refills it
        if (attempts >= 18) { done = true; ctx.finish('lost', 'attempts', {pairs, attempts}); return; }
        busy = true;
        timeoutId = setTimeout(() => {
          grid.children[firstIdx].innerHTML = BACK_SVG;
          grid.children[secondIdx].innerHTML = BACK_SVG;
          grid.children[firstIdx].setAttribute('aria-label', `card ${firstIdx + 1}, face down`);
          grid.children[secondIdx].setAttribute('aria-label', `card ${secondIdx + 1}, face down`);
          firstIdx = null;
          busy = false;
        }, 700);
      }
    }
  }

  const firstIdxOf = i => deck.findIndex((f, j) => j !== i && f === deck[i]);
  function initDeck() {
    deck = [];
    for (let i = 0; i < 6; i++) deck.push(i, i);
    // shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }

  function validateRestored(saved) {
    if (!Array.isArray(saved.deck) || saved.deck.length !== 12) return false;
    if (!Array.isArray(saved.matched) || saved.matched.length !== 12) return false;
    if (!Number.isInteger(saved.attempts) || !Number.isInteger(saved.pairs)) return false;
    const counts = Array(6).fill(0);
    for (const f of saved.deck) {
      if (!Number.isInteger(f) || f < 0 || f > 5) return false;
      counts[f]++;
    }
    if (!counts.every(c => c === 2)) return false;
    const matchedPairs = saved.matched.filter(Boolean).length / 2;
    if (matchedPairs !== saved.pairs || saved.pairs > 6) return false;
    for (let i = 0; i < 12; i++) if (saved.matched[i] && !saved.matched[saved.deck.findIndex((f, j) => j !== i && f === saved.deck[i])]) return false;
    if (saved.attempts < 0 || saved.attempts > 18) return false;
    return true;
  }

  function mount(hostEl, c) {
    host = hostEl;
    ctx = c;

    // restore or init
    if (c.saved && validateRestored(c.saved)) {
      deck = c.saved.deck.slice();
      matched = c.saved.matched.slice();
      attempts = c.saved.attempts;
      pairs = c.saved.pairs;
    } else {
      initDeck();
      matched.fill(false);
      attempts = 0;
      pairs = 0;
    }
    firstIdx = null;
    busy = false;
    paused = false;
    done = false;

    host.innerHTML = '';
    statusBar.style.display = 'flex';
    statusBar.style.justifyContent = 'space-between';
    statusBar.style.padding = '4px';
    grid.style.display = 'grid';
    grid.style.gridGap = '6px';
    grid.style.backgroundColor = 'var(--gc-1,#1A0B30)';
    const wrap = document.createElement('div'); wrap.style.cssText = 'display:flex;flex-direction:column;width:100%;height:100%';   // the grid takes what the status row leaves (a fixed height overflowed the box)
    grid.style.flex = '1'; grid.style.minHeight = '0';
    wrap.append(statusBar, grid); host.append(wrap);

    // create buttons
    for (let i = 0; i < 12; i++) {
      const btn = makeCard(i, deck[i]);
      if (matched[i]) {
        btn.innerHTML = face(deck[i]);
        btn.setAttribute('aria-label', `card ${i + 1}, ${NAMES[deck[i]]}`);
      }
      btn.style.border = '2px solid var(--gc-3,#7B2FF7)';
      btn.style.borderRadius = '8px';
      btn.style.backgroundColor = '#1A0B30';
      if (matched[i]) btn.style.borderColor = '#FFD60A';
      btn.addEventListener('click', () => flipCard(i));
      grid.append(btn);
    }
    updateStatus();

    // finish immediately if already terminal
  }

  function resize(b) {
    const w = b.width, h = b.height;
    const cols = w >= h ? 4 : 3;
    const rows = Math.ceil(12 / cols);
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    Array.from(grid.children).forEach(btn => {
      btn.style.minWidth = '44px';
      btn.style.minHeight = '44px';
    });
  }

  function start() {
    if (!done && (pairs === 6 || attempts >= 18)) { done = true; ctx.finish(pairs === 6 ? 'won' : 'lost', pairs === 6 ? 'pairs' : 'attempts', {pairs, attempts}); return; }
    resume();
  }
  function pause() { paused = true; }
  function resume() { paused = false; }
  function serialize() {
    return {deck: deck.slice(), matched: matched.slice(), attempts, pairs};
  }
  function destroy() {
    done = true;
    if (timeoutId) clearTimeout(timeoutId);
    host && (host.innerHTML = '');
  }

  return {mount, resize, start, pause, resume, serialize, destroy};
}

export default {id: 'memory', rulesVersion: 1, create};
