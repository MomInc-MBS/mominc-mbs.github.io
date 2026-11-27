// MOM's alarm games, play side: per-attempt rounds (which game, round counter, saved progress), mounting through the host, and the in-play game switch.
// Shared by the web app and the APK page. Nothing here completes an occurrence: a terminal result goes to onResult(result) -> true when the app accepted it.
// Leaving / hiding / closing / a load failure only close or fall back; progress is saved so reopening never refills lives or budgets.
import {createHost} from './host.js';
import {CHOICES} from './choice.js';
import {icon} from '../ui/glyphs.js';
import {N} from '../ui/names.js';

export const ROUNDS_KEY = 'mom-alarm-rounds-v1';
/** Rounds store: {[attemptKey]: {game, n, saved: {[gameId]: state}}}. Pure helpers. */
export const prune = (m, isLive) => { for (const k of Object.keys(m)) if (!isLive(k)) delete m[k]; return m; };
export const entryOf = (m, key, dflt) => (m[key] ||= {game: dflt, n: 0, saved: {}});

export function createGamePlay({box, store = globalThis.localStorage, isLive = () => true, onResult, onFallback, doc = document}) {
  let key = null, cur = '2048', seq = 0;
  const read = () => { try { const m = JSON.parse(store.getItem(ROUNDS_KEY)); return m && typeof m === 'object' ? m : {}; } catch { return {}; } };
  const write = m => { try { store.setItem(ROUNDS_KEY, JSON.stringify(prune(m, isLive))); } catch {} };
  const edit = f => { const m = read(), e = key && entryOf(m, key, '2048'); if (e) { f(e); write(m); } };
  const fall = reason => { seq++; host.destroy(); cur = '2048'; edit(e => { e.game = '2048'; }); onFallback?.(reason); };   // never a loss: the 2048 board for this attempt (its own saved board) takes over
  const host = createHost({
    doc,
    onSave: s => edit(e => { e.saved[s.gameId] = s.saved; }),
    onError: e => fall(e.reason),
    onFinish: async r => {
      const my = seq;
      if (await onResult?.(r)) return;
      if (my !== seq || !key) return;                                // rejected/stale: keep ringing, stay on the game with a fresh round
      edit(e => { delete e.saved[r.gameId]; }); open(key, r.gameId);
    },
  });
  /** The attempt's game: chosen once when the challenge first opens (default = the app-wide choice). */
  const gameFor = (k, dflt) => { const m = read(), fresh = !m[k], e = entryOf(m, k, dflt); if (fresh) { key = k; write(m); } return e.game; };
  async function open(k, id) {
    key = k; cur = id; const my = ++seq; host.destroy();                 // the old round dies NOW (saved first): its late callbacks are stale
    let mod; try { mod = (await import(new URL(id + '.js', import.meta.url).href)).default; } catch (e) { if (my === seq) fall('load:' + (e?.message || e)); return false; }
    if (my !== seq) return false;                                    // a newer open/close superseded this load
    let n = 0, saved = null; edit(e => { e.game = id; n = e.n = e.n + 1; saved = e.saved[id] ?? null; });
    if (!host.mount(box, mod, {roundId: `${k}:${n}`, saved})) return false;   // mount failure already routed to fall() by the host
    host.start(); return true;
  }
  const close = () => { seq++; host.destroy(); };
  const refresh = () => host.resize();                                   // repaint the mounted game (a colour was picked while it is paused)
  /** Remember the attempt's game as 2048 (the player switched back to the board). */
  const setGame = (k, id) => { key = k; cur = id; edit(e => { e.game = id; }); };
  return {gameFor, open, close, setGame, pause: host.pause, resume: host.resume, refresh, get game() { return cur; }};
}

const GL = {'2048': 'board2048', brick: 'gBrick', pong: 'gPong', match3: 'gMatch3', blocks: 'gBlocks', memory: 'gMemory', odd: 'gOdd'};
export const gameGlyph = id => GL[id] || 'board2048';
/** The in-play game switch: one icon button (in the play header) that opens a compact icon list. onPick(id). */
export function mountSwitch(header, {onPick, current = () => '2048'}) {
  const wrap = document.createElement('span'); wrap.className = 'al-sw';
  wrap.innerHTML = `<button type="button" class="alt al-swb" aria-haspopup="true" aria-expanded="false" aria-label="${N.switchGame}">${icon('gSwap')}</button>
<div class="al-swl" role="radiogroup" aria-label="${N.switchGame}" hidden>${CHOICES.map(id => `<button type="button" class="alt" role="radio" data-g="${id}" aria-label="${N['game_' + id]}">${icon(GL[id])}</button>`).join('')}</div>`;
  const btn = wrap.firstElementChild, list = wrap.lastElementChild;
  const set = open => { list.hidden = !open; btn.setAttribute('aria-expanded', String(open)); if (open) list.querySelectorAll('button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.g === current()))); };
  btn.onclick = () => set(list.hidden);
  list.onclick = e => { const b = e.target.closest('[data-g]'); if (!b) return; set(false); onPick(b.dataset.g); };
  header.firstElementChild.after(wrap);                                  // beside the mode icon: the right end is the emergency stop + back
  return {el: wrap, close: () => set(false), hide(v) { wrap.hidden = v; if (v) set(false); }};
}
