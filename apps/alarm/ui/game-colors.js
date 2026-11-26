// Game-only colour panel for MOM's 2048 (wordless: icons, digits, swatches; words live in aria-labels).
// Applies CSS custom properties on the play section only; never touches app-wide variables.
export const STORAGE_KEY = 'mom-alarm-2048-game-theme-v1';
export const TARGETS = ['background', 'tiles', 'board'];
export const PALETTE = [
  ['Near black', '#0B0B14'], ['Charcoal violet', '#1D1830'], ['Purple', '#5E2CA5'], ['Violet', '#7C3AED'], ['Lavender', '#B794F4'],
  ['Magenta', '#D946EF'], ['Pink', '#F472B6'], ['Red', '#EF4444'], ['Orange', '#F97316'], ['Amber', '#F59E0B'],
  ['Yellow', '#FACC15'], ['Lime', '#A3E635'], ['Green', '#22C55E'], ['Teal', '#14B8A6'], ['Cyan', '#22D3EE'],
  ['Sky', '#38BDF8'], ['Blue', '#3B82F6'], ['Indigo', '#4F46E5'], ['Silver', '#CBD5E1'], ['Off-white', '#F8FAFC']
].map(([name, hex]) => ({name, hex}));

export const GAME_COLOR_HELP = {
  handle: 'Colours for the game board. Tap to open.',
  close: 'Close the colour drawer.',
  'tab-background': 'Pick the colour behind the board.',
  'tab-tiles': 'Pick the colour of the number tiles.',
  'tab-board': 'Pick the colour of the board and its empty squares.',
  swatch: 'Tap a colour. Tap it again to go back to the original look.',
  reset: 'Put all three colours back the way they were.'
};

const defaults = () => ({v: 1, background: null, tiles: null, board: null});
const okIdx = n => Number.isInteger(n) && n >= 0 && n < PALETTE.length;

export function loadTheme(storage) {
  try {
    const j = JSON.parse(storage.getItem(STORAGE_KEY));
    if (!j || typeof j !== 'object' || j.v !== 1) return defaults();
    const t = defaults();
    for (const k of TARGETS) t[k] = okIdx(j[k]) ? j[k] : null;
    return t;
  } catch { return defaults(); }
}
export function saveTheme(theme, storage) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify({v: 1, background: theme.background, tiles: theme.tiles, board: theme.board})); return true; } catch { return false; }
}

const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const lin = c => (c /= 255) <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4;
export const luminance = h => { const [r, g, b] = rgb(h).map(lin); return .2126 * r + .7152 * g + .0722 * b; };
const DARK = '#10101C', LIGHT = '#FFFFFF';
/** Readable text colour for a fill: whichever of near-black / white has the higher contrast ratio. */
export const textColorFor = hex => {
  const L = luminance(hex);
  return (L + .05) / (luminance(DARK) + .05) >= 1.05 / (L + .05) ? DARK : LIGHT;
};
const mix = (a, b, t) => '#' + rgb(a).map((x, i) => Math.round(x + (rgb(b)[i] - x) * t).toString(16).padStart(2, '0')).join('').toUpperCase();

const svg = d => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICON = {
  background: svg('<rect x="2.5" y="2.5" width="19" height="19" rx="3"/><rect x="8" y="8" width="8" height="8" rx="1.5" fill="currentColor" stroke="none" opacity=".35"/>'),
  tiles: svg('<rect x="4" y="4" width="16" height="16" rx="3" fill="currentColor" stroke="none"/><path d="M9 12h6M12 9v6" stroke="#000" opacity=".5"/>'),
  board: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>'),
  reset: svg('<path d="M4 12a8 8 0 1 0 3-6.2"/><path d="M4 3.5V9h5.5"/>'),
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  handle: svg('<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 1.6-2-.5-1.2.2-2.5 1.6-2.5H17a4 4 0 0 0 4-4c0-5-4-9.5-9-9.5z"/><circle cx="7.5" cy="11" r="1.2" fill="currentColor"/><circle cx="10.5" cy="7" r="1.2" fill="currentColor"/><circle cx="15" cy="7.5" r="1.2" fill="currentColor"/>'),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7.5" stroke-width="3.2"/>')
};
const TARGET_LABEL = {background: 'Background colour', tiles: 'Tile colour', board: 'Board colour'};
const VARS = ['--game-background', '--game-tile-fill', '--game-board-fill', '--game-tile-text', '--game-tile-edge', '--game-tile-halo', '--game-cell-empty', '--game-board-edge'];

export function mountGameColors(gameRoot, opts = {}) {
  const storage = opts.storage || (() => { try { return window.localStorage; } catch { return null; } })() || {getItem() { return null; }, setItem() {}};
  let theme = loadTheme(storage), target = 'tiles', open = false, mode = 'drawer';
  const doc = gameRoot.ownerDocument;
  gameRoot.classList.add('gc-host');

  const root = doc.createElement('div');
  root.className = 'gc-root';
  root.innerHTML = `
    <button type="button" class="gc-handle" data-k="handle" aria-label="Game colours" aria-expanded="false">${ICON.handle}</button>
    <div class="gc-scrim" hidden></div>
    <div class="gc-panel" role="group" aria-label="Game colours">
      <div class="gc-tabs">
        ${TARGETS.map(t => `<button type="button" class="gc-tab" data-k="tab-${t}" data-target="${t}" aria-label="${TARGET_LABEL[t]}" aria-pressed="false">${ICON[t]}</button>`).join('')}
        <button type="button" class="gc-reset" data-k="reset" aria-label="Reset game colours">${ICON.reset}</button>
        <button type="button" class="gc-close" data-k="close" aria-label="Close game colours">${ICON.close}</button>
      </div>
      <div class="gc-grid">
        ${PALETTE.map((c, i) => `<button type="button" class="gc-sw" data-k="swatch" data-i="${i}" aria-label="${c.name}" aria-pressed="false" style="--sw:${c.hex};--ck:${textColorFor(c.hex)}">${ICON.check}</button>`).join('')}
      </div>
    </div>`;
  gameRoot.appendChild(root);
  const $ = s => root.querySelector(s), $$ = s => [...root.querySelectorAll(s)];
  const handle = $('.gc-handle'), scrim = $('.gc-scrim'), panel = $('.gc-panel');

  function applyTheme() {
    const s = gameRoot.style, set = (k, v) => v == null ? s.removeProperty(k) : s.setProperty(k, v);
    const bg = theme.background == null ? null : PALETTE[theme.background].hex;
    const tile = theme.tiles == null ? null : PALETTE[theme.tiles].hex;
    const board = theme.board == null ? null : PALETTE[theme.board].hex;
    gameRoot.toggleAttribute('data-gc-bg', bg != null);
    gameRoot.toggleAttribute('data-gc-tiles', tile != null);
    gameRoot.toggleAttribute('data-gc-board', board != null);
    set('--game-background', bg);
    set('--game-tile-fill', tile);
    set('--game-board-fill', board);
    if (tile) {
      const ink = textColorFor(tile);
      set('--game-tile-text', ink);
      set('--game-tile-edge', ink);
      set('--game-tile-halo', ink === DARK ? '#FFFFFF66' : '#00000099');
    } else ['--game-tile-text', '--game-tile-edge', '--game-tile-halo'].forEach(k => s.removeProperty(k));
    if (board) {
      // empty cells: board colour nudged toward its contrast colour so they read as holes in the backing
      const dark = luminance(board) < .3;
      set('--game-cell-empty', mix(board, dark ? '#FFFFFF' : '#000000', dark ? .14 : .16));
      set('--game-board-edge', mix(board, dark ? '#FFFFFF' : '#000000', .3));
    } else ['--game-cell-empty', '--game-board-edge'].forEach(k => s.removeProperty(k));
  }

  function refresh() {
    $$('.gc-tab').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.target === target)));
    $$('.gc-sw').forEach(b => b.setAttribute('aria-pressed', String(theme[target] === +b.dataset.i)));
    handle.setAttribute('aria-expanded', String(open));
    root.dataset.mode = mode; root.dataset.open = open ? '1' : '0';
    scrim.hidden = !(mode === 'drawer' && open);
    applyTheme();
  }
  const commit = () => { saveTheme(theme, storage); refresh(); };

  root.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || !root.contains(b)) return;
    if (b.classList.contains('gc-tab')) { target = b.dataset.target; refresh(); }
    else if (b.classList.contains('gc-sw')) { const i = +b.dataset.i; theme[target] = theme[target] === i ? null : i; commit(); }
    else if (b.classList.contains('gc-reset')) { theme = defaults(); commit(); }
    else if (b === handle) api.open();
    else if (b.classList.contains('gc-close')) api.close();
  });
  scrim.addEventListener('click', () => api.close());

  // While the drawer is open nothing underneath may react: swallow gestures that did not start inside the panel/handle.
  const BLOCK = ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'touchstart', 'touchmove', 'touchend', 'mousedown', 'mouseup', 'wheel'];
  const inside = t => panel.contains(t) || handle.contains(t) || scrim === t;
  const block = e => { if (open && mode === 'drawer' && !inside(e.target)) { e.stopPropagation(); if (e.cancelable) e.preventDefault(); } };
  BLOCK.forEach(t => gameRoot.addEventListener(t, block, {capture: true, passive: false}));
  const onKey = e => {
    if (!open) return;
    if (e.key === 'Escape') { e.stopPropagation(); api.close(); handle.focus(); }
    else if (mode === 'drawer' && e.key.startsWith('Arrow')) e.stopPropagation();
  };
  doc.addEventListener('keydown', onKey, true);

  function layout() {
    const W = gameRoot.clientWidth, H = gameRoot.clientHeight;
    const sw = H >= 10 * 44 + 9 * 4 + 100 ? 44 : 36;
    root.style.setProperty('--gc-sw', sw + 'px');
    const railW = 2 * sw + 4 + 16 + 4;
    const board = gameRoot.querySelector('.al-board'), bw = board ? board.offsetWidth : 150;
    const next = W >= bw + 2 * railW ? 'rail' : 'drawer';
    if (next !== mode) { mode = next; if (mode === 'rail') open = false; }
    refresh();
  }
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(layout) : null;
  if (ro) ro.observe(gameRoot);
  layout();

  const api = {
    open() { if (mode === 'drawer') { open = true; refresh(); panel.querySelector('.gc-tab[aria-pressed="true"]')?.focus(); } },
    close() { open = false; refresh(); },
    isOpen: () => open,
    destroy() {
      ro?.disconnect();
      BLOCK.forEach(t => gameRoot.removeEventListener(t, block, {capture: true}));
      doc.removeEventListener('keydown', onKey, true);
      root.remove(); gameRoot.classList.remove('gc-host');
      for (const a of ['data-gc-bg', 'data-gc-tiles', 'data-gc-board']) gameRoot.removeAttribute(a);
      VARS.forEach(k => gameRoot.style.removeProperty(k));
    }
  };
  return api;
}
