// MOM Inc "Odd One Out" alarm game.
// Same contract as brick.js. Drafted by local gpt-oss-20b, fixed in review. Never finishes before all 12 boards are answered.
//
// The game shows 12 boards in a row. Each board has six tiles (3×2 or 2×3 depending on aspect ratio).
// All tiles share the same colour; one tile differs by shape. The player taps the odd tile.
// After each tap we give ~400 ms feedback (green check or red cross) and then move to the next board.
// When all 12 boards have been answered we finish: outcome is 'won' if at least 8 answers are correct,
// otherwise 'lost'.  The final state is {answered, correct}.
//
// State is fully serialisable as {seed, answered, correct}.  A seeded RNG (mulberry32) generates the
// sequence of shapes and colours; restoring from a saved state reproduces exactly the same next board.

import {MONO} from './common.js';
const SHAPES = [
  'circle',
  'square',
  'triangle',
  'diamond',
  'star',
  'hexagon',
];
const COLORS = [
  '#FFD60A', // yellow
  '#7B2FF7', // purple
  '#22D3EE', // cyan
  '#F472B6', // pink
  '#A3E635', // lime
  '#F97316', // orange
];

// ----- SVG helpers ---------------------------------------------------------

function svg(shape, color) {
  const view = '0 0 100 100';
  let path;
  switch (shape) {
    case 'circle':
      path = `<circle cx="50" cy="50" r="40"/>`;
      break;
    case 'square':
      path = `<rect x="20" y="20" width="60" height="60"/>`;
      break;
    case 'triangle':
      path = `<polygon points="50,15 85,85 15,85"/>`;
      break;
    case 'diamond':
      path = `<polygon points="50,10 90,50 50,90 10,50"/>`;
      break;
    case 'star':
      path = `<path d="M50,15 L61,35 H84 L66,55 L73,80 L50,65 L27,80 L34,55 L16,35 H39 Z"/>`;
      break;
    case 'hexagon':
      path = `<polygon points="30,20 70,20 90,50 70,80 30,80 10,50"/>`;
      break;
    default:
      path = '';
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${view}" fill="${color}">${path}</svg>`;
}

function checkIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#22C55E"/><polyline points="30,55 45,70 70,35" stroke="#fff" stroke-width="10" fill="none"/></svg>`;
}

function crossIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#EF4444"/><line x1="30" y1="30" x2="70" y2="70" stroke="#fff" stroke-width="10"/><line x1="70" y1="30" x2="30" y2="70" stroke="#fff" stroke-width="10"/></svg>`;
}

// ----- RNG ---------------------------------------------------------------

function mulberry32(seed) {
  return function () {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = seed ^ (seed >>> 15);
    t = Math.imul(t, 1 | 0x7FFFFFFF);
    t ^= t + Math.imul(t ^ (t >>> 7), 123456789);
    return ((t ^ (t >>> 13)) >>> 0) / 4294967296;
  };
}

// ----- Game implementation ------------------------------------------------

function create() {
  let ctx = null;          // context passed by host
  let rng = null;          // seeded RNG
  let seed = ((Math.random() * 2 ** 31) >>> 0) || 1;   // fresh round: random seed, kept in state
  let answered = 0;
  let correct = 0;

  const container = document.createElement('div');
  const header = document.createElement('div');
  const boardDiv = document.createElement('div');

  let paused = false, wide = true;
  let done = false;
  let feedbackTimer = null;

  function renderHeader() {
    const left = 12 - answered;
    header.innerHTML = `
      <span style="font-size:16px;font-family:${MONO};color:#FFD60A;">${left}</span>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="18" height="18"><rect x="20" y="30" width="60" height="40" fill="#7B2FF7"/><rect x="25" y="35" width="50" height="30" fill="#FFD60A"/></svg>
      <span style="font-size:16px;font-family:${MONO};color:#FFD60A;margin-left:8px;">${correct}</span>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="18" height="18"><circle cx="50" cy="50" r="45" fill="#22C55E"/><polyline points="30,55 45,70 70,35" stroke="#fff" stroke-width="10" fill="none"/></svg>
    `;
  }

  function generateBoard() {
    // consume RNG for shape and colour
    const baseShapeIdx = Math.floor(rng() * SHAPES.length);
    const colorIdx = Math.floor(rng() * COLORS.length);
    const oddPos = Math.floor(rng() * 6); // 0..5
    const shapes = Array(6).fill(baseShapeIdx);
    shapes[oddPos] = (baseShapeIdx + 1 + Math.floor(rng() * (SHAPES.length - 1))) % SHAPES.length;   // always 4 rng() calls per board
    return {shapes, color: COLORS[colorIdx], oddPos};
  }

  function renderBoard() {
    boardDiv.innerHTML = '';
    const {shapes, color, oddPos} = generateBoard();
    const tiles = [];
    for (let i = 0; i < 6; i++) {
      const btn = document.createElement('button');
      btn.style.position = 'relative';
      btn.style.minWidth = btn.style.minHeight = '44px';
      btn.style.margin = '4px';
      btn.style.padding = '0';
      btn.style.border = '2px solid #7B2FF7';
      btn.style.borderRadius = '10px';
      btn.style.background = '#1A0B30';
      btn.style.cursor = 'pointer';
      btn.style.touchAction = 'manipulation';
      btn.setAttribute('aria-label', `tile ${i + 1}, ${SHAPES[shapes[i]]}`);
      const inner = document.createElement('div');
      inner.style.width = '70%';
      inner.style.height = '70%';
      inner.style.margin = 'auto';
      inner.innerHTML = svg(SHAPES[shapes[i]], color);
      btn.appendChild(inner);
      btn.dataset.index = i;
      tiles.push(btn);
    }

    // layout
    boardDiv.style.gridTemplateColumns = `repeat(${wide ? 3 : 2}, 1fr)`;
    boardDiv.style.gridTemplateRows = `repeat(${wide ? 2 : 3}, 1fr)`;
    boardDiv.style.width = '100%'; boardDiv.style.flex = '1'; boardDiv.style.minHeight = '0';
    boardDiv.style.display = 'grid';
    boardDiv.style.gap = '8px';

    tiles.forEach(btn => boardDiv.appendChild(btn));

    function onTap(e) {
      if (paused || done) return;
      const btn = e.currentTarget;
      const idx = Number(btn.dataset.index);
      answered++;
      if (idx === oddPos) correct++;

      // feedback overlay
      const overlay = document.createElement('div');
      overlay.style.position = 'absolute';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.innerHTML = idx === oddPos ? checkIcon() : crossIcon();
      btn.appendChild(overlay);

      // block further taps
      boardDiv.querySelectorAll('button').forEach(b => b.disabled = true);
      ctx.save();

      feedbackTimer = setTimeout(() => {
        if (btn.contains(overlay)) btn.removeChild(overlay);
        if (answered < 12) {
          renderBoard();
          renderHeader();
          boardDiv.querySelectorAll('button').forEach(b => b.disabled = false);
        } else {
          done = true;
          ctx.finish(correct >= 8 ? 'won' : 'lost', 'boards', {answered, correct});
        }
      }, 400);
    }

    tiles.forEach(btn => btn.addEventListener('click', onTap));
  }

  return {
    mount(host, c) {
      ctx = c;
      const sv = c.saved || {};
      if (Number.isInteger(sv.seed) && sv.seed > 0) seed = sv.seed;
      answered = Number.isInteger(sv.answered) ? Math.min(12, sv.answered) : 0;
      correct = Number.isInteger(sv.correct) ? Math.min(answered, sv.correct) : 0;

      rng = mulberry32(seed);
      // advance RNG to current board
      for (let i = 0; i < answered; i++) generateBoard();

      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.alignItems = 'center';
      container.style.justifyContent = 'center';
      container.style.width = '100%';
      container.style.height = '100%';
      header.style.marginBottom = '8px';

      host.replaceChildren(container);
      container.appendChild(header);
      container.appendChild(boardDiv);

      renderHeader();
      if (answered < 12) renderBoard();
    },

    resize(b) {
      const w = b.width >= b.height;
      if (w !== wide) { wide = w; boardDiv.style.gridTemplateColumns = `repeat(${wide ? 3 : 2}, 1fr)`; boardDiv.style.gridTemplateRows = `repeat(${wide ? 2 : 3}, 1fr)`; }
    },

    start() {   // a restored round that already answered all 12 boards finishes here, never early
      if (!done && answered === 12) { done = true; ctx.finish(correct >= 8 ? 'won' : 'lost', 'boards', {answered, correct}); }
    },
    resume() { paused = false; },
    pause() { paused = true; },

    serialize() {
      return {seed, answered, correct};
    },

    destroy() {
      done = true;
      if (feedbackTimer) clearTimeout(feedbackTimer);
      container.remove();
    },
  };
}

export default {id: 'odd', rulesVersion: 1, create};
