// Game-only colour panel for MOM's alarm games (wordless: icons, digits, swatches; words live in aria-labels). 2048 keeps its own targets + storage key; the other six games each get three targets.
// Applies CSS custom properties on the play section only; never touches app-wide variables.
export const STORAGE_KEY = 'mom-alarm-2048-game-theme-v1';
export const TARGETS = ['background', 'tiles', 'board'];
export const GAME_STORAGE_KEY = 'mom-alarm-game-themes-v1';   // {[gameId]: {[target]: paletteIndex}} for every game except 2048
/** Exactly three colour targets per game, none of which carries gameplay meaning (piece kinds, card faces and answer colours never change). Order = the CSS vars --gc-1..3. */
export const GAME_TARGETS = {
  '2048': TARGETS,
  brick: ['background', 'bricks', 'paddle'],
  pong: ['background', 'paddles', 'ball'],
  match3: ['background', 'cells', 'accent'],
  blocks: ['background', 'well', 'buttons'],
  memory: ['background', 'cards', 'frame'],
  odd: ['background', 'slots', 'frame']
};
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
  'tab-bricks': 'Pick the colour of the bricks.',
  'tab-paddle': 'Pick the colour of the paddle.',
  'tab-paddles': 'Pick the colour of the paddles.',
  'tab-ball': 'Pick the colour of the ball.',
  'tab-cells': 'Pick the colour of the empty squares behind the pieces.',
  'tab-accent': 'Pick the colour of the highlight and the swap arrows.',
  'tab-well': 'Pick the colour of the well the blocks fall into.',
  'tab-buttons': 'Pick the colour of the control buttons.',
  'tab-cards': 'Pick the colour of the card backs.',
  'tab-frame': 'Pick the colour of the frames.',
  'tab-slots': 'Pick the colour of the squares behind the shapes.',
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
/** Other games: {target: index|null} for that game's three targets, read defensively (bad JSON / wrong type / out-of-range index -> default). */
export function loadGameTheme(storage, id) {
  const t = Object.fromEntries((GAME_TARGETS[id] || []).map(k => [k, null]));
  try { const j = JSON.parse(storage.getItem(GAME_STORAGE_KEY))?.[id]; if (j && typeof j === 'object') for (const k of Object.keys(t)) if (okIdx(j[k])) t[k] = j[k]; } catch {}
  return t;
}
export function saveGameTheme(storage, id, theme) {
  try {
    let all; try { all = JSON.parse(storage.getItem(GAME_STORAGE_KEY)); } catch {}
    if (!all || typeof all !== 'object' || Array.isArray(all)) all = {};
    all[id] = Object.fromEntries(Object.keys(theme).filter(k => theme[k] != null).map(k => [k, theme[k]]));
    storage.setItem(GAME_STORAGE_KEY, JSON.stringify(all)); return true;
  } catch { return false; }
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
  bricks: svg('<rect x="2.5" y="5" width="8" height="5" rx="1"/><rect x="13.5" y="5" width="8" height="5" rx="1"/><rect x="8" y="13" width="8" height="5" rx="1"/>'),
  paddle: svg('<rect x="3" y="15" width="18" height="4" rx="2" fill="currentColor" stroke="none"/><circle cx="12" cy="8" r="2.5"/>'),
  paddles: svg('<rect x="5" y="4" width="14" height="3.5" rx="1.7" fill="currentColor" stroke="none"/><rect x="5" y="16.5" width="14" height="3.5" rx="1.7" fill="currentColor" stroke="none"/>'),
  ball: svg('<circle cx="12" cy="12" r="7" fill="currentColor" stroke="none"/>'),
  cells: svg('<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>'),
  accent: svg('<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>'),
  well: svg('<path d="M6 3v17h12V3"/><rect x="9" y="12" width="6" height="5" fill="currentColor" stroke="none" opacity=".6"/>'),
  buttons: svg('<rect x="2.5" y="9" width="8" height="8" rx="2"/><rect x="13.5" y="9" width="8" height="8" rx="2"/>'),
  cards: svg('<rect x="5" y="3" width="14" height="18" rx="2.5"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>'),
  frame: svg('<rect x="3" y="3" width="18" height="18" rx="3" stroke-width="3.5"/>'),
  slots: svg('<rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor" stroke="none" opacity=".55"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/>'),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7.5" stroke-width="3.2"/>')
};
const TARGET_LABEL = {background: 'Background colour', tiles: 'Tile colour', board: 'Board colour', bricks: 'Brick colour', paddle: 'Paddle colour', paddles: 'Paddle colour', ball: 'Ball colour', cells: 'Square colour', accent: 'Highlight colour', well: 'Well colour', buttons: 'Button colour', cards: 'Card back colour', frame: 'Frame colour', slots: 'Square colour'};
const VARS = ['--game-background', '--game-tile-fill', '--game-board-fill', '--game-tile-text', '--game-tile-edge', '--game-tile-halo', '--game-cell-empty', '--game-board-edge',
  ...[1, 2, 3].flatMap(i => ['', '-ink', '-edge'].map(x => `--gc-${i}${x}`))];

export function mountGameColors(gameRoot, opts = {}) {
  const storage = opts.storage || (() => { try { return window.localStorage; } catch { return null; } })() || {getItem() { return null; }, setItem() {}};
  let gid = '2048', targets = TARGETS, theme = loadTheme(storage), target = 'tiles', open = false, mode = 'drawer';
  const doc = gameRoot.ownerDocument;
  gameRoot.classList.add('gc-host');

  const root = doc.createElement('div');
  root.className = 'gc-root';
  root.innerHTML = `
    <button type="button" class="gc-handle" data-k="handle" aria-label="Game colours" aria-expanded="false">${ICON.handle}</button>
    <div class="gc-scrim" hidden></div>
    <div class="gc-panel" role="group" aria-label="Game colours">
      <div class="gc-tabs">
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
  const tabsFor = () => targets.map(t => `<button type="button" class="gc-tab" data-k="tab-${t}" data-target="${t}" aria-label="${TARGET_LABEL[t]}" aria-pressed="false">${ICON[t]}</button>`).join('');
  const buildTabs = () => { $$('.gc-tab').forEach(b => b.remove()); $('.gc-tabs').insertAdjacentHTML('afterbegin', tabsFor()); };
  buildTabs();
  const load = () => gid === '2048' ? loadTheme(storage) : loadGameTheme(storage, gid);

  function applyTheme() {
    const s = gameRoot.style, set = (k, v) => v == null ? s.removeProperty(k) : s.setProperty(k, v);
    if (gid !== '2048') {                                   // other games: target i -> --gc-i (+ -ink readable on it, -edge a shade off it); background also paints the play section
      VARS.forEach(k => s.removeProperty(k)); for (const a of ['data-gc-bg', 'data-gc-tiles', 'data-gc-board']) gameRoot.removeAttribute(a);
      targets.forEach((t, n) => {
        const hex = theme[t] == null ? null : PALETTE[theme[t]].hex; if (!hex) return;
        set(`--gc-${n + 1}`, hex); set(`--gc-${n + 1}-ink`, textColorFor(hex)); set(`--gc-${n + 1}-edge`, mix(hex, luminance(hex) < .3 ? '#FFFFFF' : '#000000', .3));
        if (t === 'background') { set('--game-background', hex); gameRoot.setAttribute('data-gc-bg', ''); }
      });
      return;
    }
    ['--gc-1', '--gc-2', '--gc-3'].forEach(k => ['', '-ink', '-edge'].forEach(x => s.removeProperty(k + x)));
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
    if (open !== wasOpen) { wasOpen = open; opts.onToggle?.(open); }
  }
  let wasOpen = false;
  const commit = () => { gid === '2048' ? saveTheme(theme, storage) : saveGameTheme(storage, gid, theme); refresh(); gameRoot.dispatchEvent(new CustomEvent('gc-change')); };

  root.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || !root.contains(b)) return;
    if (b.classList.contains('gc-tab')) { target = b.dataset.target; refresh(); }
    else if (b.classList.contains('gc-sw')) { const i = +b.dataset.i; theme[target] = theme[target] === i ? null : i; commit(); }
    else if (b.classList.contains('gc-reset')) { theme = gid === '2048' ? defaults() : loadGameTheme({getItem: () => null}, gid); commit(); }
    else if (b === handle) api.open();
    else if (b.classList.contains('gc-close')) api.close();
  });
  scrim.addEventListener('click', () => api.close());

  // While the drawer is open nothing underneath may react: swallow gestures that did not start inside the panel/handle.
  const BLOCK = ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'touchstart', 'touchmove', 'touchend', 'mousedown', 'mouseup', 'wheel', 'click'];
  const inside = t => panel.contains(t) || handle.contains(t) || scrim === t;
  const block = e => { if (open && mode === 'drawer' && !inside(e.target) && e.target.closest?.('.al-gbox, .al-board')) { e.stopPropagation(); if (e.cancelable) e.preventDefault(); } };   // only input over the game itself is swallowed: a cancelled touchstart also kills the tap, so back / switch / stop must never see this
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
    const board = gameRoot.querySelector(gid === '2048' ? '.al-board' : '.al-gbox'), bw = board ? board.offsetWidth : 150;
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
    /** Switch the drawer to another game's three targets and that game's saved colours (2048 keeps its own key and format). */
    setGame(id) {
      id = GAME_TARGETS[id] ? id : '2048'; if (id === gid) return;
      gid = id; targets = GAME_TARGETS[id]; theme = load(); target = targets[1]; open = false; buildTabs(); layout();
      gameRoot.dispatchEvent(new CustomEvent('gc-change'));
    },
    get game() { return gid; },
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
