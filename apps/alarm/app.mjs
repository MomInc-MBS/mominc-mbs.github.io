// MOM's: 2048 Reminder, web edition. 2048 on the 3D mini-computer, plus a reminder PWA around it.
// Free play is unchanged and never touches an alarm. The alarm board is the same board.js; the rules live in remind.js (pure, tested).
import {newGame, move, encode, decode} from './board.js';
import {mountComputer} from './computer.js';
import * as R from './remind.js';
import * as P from './push.js';
import {createWebAdapter} from './web-adapter.js';
import {mountSettings} from './ui/settings.js';
import {icon} from './ui/glyphs.js';
import {N} from './ui/names.js';
import {mountGameColors} from './ui/game-colors.js';
import {HOLD_MS} from './stages.js';
import {createGamePlay, mountSwitch} from './games/play.js';
import {getChoice} from './games/choice.js';

const KEY = 'mom-alarm-2048-web-v1', BEST = 'mom-alarm-2048-web-best-v1'; // BEST = apps.json web.bestKey
const FREE = 'free';                                                      // the rounds key of free play (never an alarm attempt)
const AKEY = 'adhd-alarm-board-v1';                                       // live alarm boards, one per occurrence attempt ({attempt: encoded board}; the old single {attempt, enc} is still read)
// The shell is wordless: icons, digits and the user's own title text. Accessible names live in aria-label only (the installed name stays in metadata and notifications).
const HTML = `<div class="al"><div class="al-stage"><canvas aria-hidden="true"></canvas></div>
<div class="al-crt"><div class="al-set"></div>
<section class="al-play" hidden><header><strong class="al-mode" aria-hidden="true"></strong><span class="al-score num"></span><button class="al-back alt" type="button" aria-label="${N.back2}">${icon('back')}</button></header>
<div class="al-board" role="application" aria-label="2048 board. Swipe or use arrow keys."></div><div class="al-gbox" hidden></div><p class="al-msg vh" role="status"></p></section>
<div class="al-bar" hidden><button class="al-stop alt" type="button" data-hold="stop" aria-label="Emergency stop (hold 3 s)">${icon('octagon')}</button></div>
<div class="al-fx" aria-hidden="true"></div></div>
<button class="al-k" data-key="up" type="button" aria-label="${N.keyUp}"></button><button class="al-k" data-key="down" type="button" aria-label="${N.keyDown}"></button>
<button class="al-k" data-key="prev" type="button" aria-label="${N.keyPrev}"></button><button class="al-k" data-key="next" type="button" aria-label="${N.keyNext}"></button></div>`;

export async function mountAlarm(host) {
  host.innerHTML = HTML;
  const root = host.firstElementChild, $ = c => root.querySelector('.al-' + c);
  let game = null, down = null, disposed = false, mode = 'free', boundOcc = null, holdT = 0;
  let S = R.load();
  const now = () => Date.now();
  const links = ['settings', 'game-colors'].map(n => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = `/apps/alarm/ui/${n}.css`; document.head.appendChild(l); return l; });
  // The adapter owns persistence, the outbox, foreground outputs and the clock; it shares this module's state variable.
  const A = createWebAdapter({bind: {get: () => S, set: v => { S = v; }}});
  A.commit(R.reconcile(S, now()), true);                  // migrated / imported reminders get their next occurrence
  const commit = ns => A.commit(ns);
  const say = t => { $('msg').textContent = ''; setTimeout(() => { $('msg').textContent = t; }, 30); };   // screen-reader only (.vh)

  // ---- 2048 board (free play and alarm share it). Alarm boards are kept per occurrence attempt, so two ringing reminders never share one. ---------------
  const boards = () => { try { const m = JSON.parse(localStorage.getItem(AKEY)); if (m && !m.attempt) return m; if (m?.attempt) return {[m.attempt]: m.enc}; } catch {} return {}; };   // v1 held a single {attempt, enc}
  const live = attempt => Object.values(S.runs).some(r => r.occ?.status === 'ACTIVE' && `${r.occ.id}:${r.occ.attempt}` === attempt);
  const putBoard = (k, enc) => { try { const m = boards(); if (enc == null) delete m[k]; else m[k] = enc; for (const id of Object.keys(m)) if (!live(id)) delete m[id]; localStorage.setItem(AKEY, JSON.stringify(m)); } catch {} };
  const save = () => {
    try {
      if (mode === 'alarm') { putBoard(R.attemptId(S, boundOcc), encode(game)); return; }
      localStorage.setItem(KEY, encode(game)); if (game.score > (Number(localStorage.getItem(BEST)) || 0)) localStorage.setItem(BEST, game.score);
    } catch {}
  };
  const draw = () => {
    $('board').replaceChildren(...game.board.flat().map(t => {   // fixed 16 cells, rebuilt each move: the DOM never grows
      const d = document.createElement('div'); d.className = 'cell';
      if (t) { d.dataset.t = t; d.style.setProperty('--t', t); d.textContent = '$' + 2 ** (t - 1); }
      return d;
    }));
    $('score').textContent = '$' + game.score.toLocaleString();
  };
  // ---- extra alarm games: the attempt's game is fixed when its challenge first opens; 2048 stays the default and the fallback ---------------------------------
  let gid = '2048', swc = null;
  const view = g => { gid = g; $('board').hidden = g !== '2048'; $('gbox').hidden = g === '2048'; $('play').classList.toggle('gm', g !== '2048'); gc?.close(); gc?.setGame(g); if (g !== '2048') $('score').textContent = ''; };   // the colour drawer follows the game on show
  const freeBoard = () => { let saved = null; try { saved = localStorage.getItem(KEY); } catch {} return (saved && decode(saved)) || newGame(); };
  const play2048 = att => { gp.close(); const saved = att !== FREE && att && boards()[att]; game = att === FREE ? freeBoard() : (saved && decode(saved)) || newGame(); view('2048'); draw(); };   // its own saved board (free play: the free board), never a fake loss
  const playGame = (att, g) => { view(g); gp.open(att, g); };
  const finishPlayed = async r => {                          // a game's terminal result: re-judged by R.finishGame; only the active occurrence's current attempt is accepted
    if (mode !== 'alarm' || !boundOcc) return false;
    const att = R.attemptId(S, boundOcc), ns = R.finishGame(S, boundOcc, r, now());
    if (ns === S) return false;
    commit(ns); if (att) putBoard(att, null); endAlarmBoard();
    if (r.outcome === 'won') ui?.say?.('gameDone');
    return true;
  };
  const gp = createGamePlay({box: $('gbox'), isLive: k => k === FREE || live(k), onResult: finishPlayed, onFallback: () => play2048(mode === 'alarm' ? R.attemptId(S, boundOcc) : FREE)});
  const show = playing => { $('play').hidden = !playing; setHost.classList.toggle('playing', playing); ui?.setPlaying(playing); syncKeys(); if (!playing) { gc?.close(); gp.close(); } size({}); };   // one CRT: the reminders app, or the 2048 board over it
  const startFree = () => {
    mode = 'free'; boundOcc = null; $('mode').innerHTML = icon('board2048'); bar(); gp.close();
    game = freeBoard();
    show(true); draw(); view('2048');
  };
  const startAlarm = occId => {
    const id = occId || R.ranked(S)[0]?.occId, attempt = id && R.attemptId(S, id);
    if (!attempt) return;
    commit(R.acknowledge(S, id, now()));                   // opening the game is recorded, nothing else
    mode = 'alarm'; boundOcc = id; $('mode').innerHTML = icon('bell');
    const g = gp.gameFor(attempt, getChoice());
    show(true); bar();
    if (g === '2048') play2048(attempt); else playGame(attempt, g);
  };
  const bar = () => {
    const alarm = mode === 'alarm' && !!boundOcc && R.attemptId(S, boundOcc) !== null;
    $('bar').hidden = !alarm; root.classList.toggle('has-bar', alarm); size({});   // the stop row costs board height only while shown
  };
  const endAlarmBoard = () => { mode = 'free'; boundOcc = null; show(false); bar(); ui.refresh(); };
  const finishAlarm = won => {                             // bound to the occurrence this board was started for: a stale board never clears another alarm
    const att = R.attemptId(S, boundOcc);
    const ns = (won ? R.win : R.lose)(S, boundOcc, now()), accepted = won && ns !== S;
    commit(ns); if (att) putBoard(att, null); endAlarmBoard();
    if (accepted) ui?.say?.('gameDone');                    // MOM's typed completion line, only after a real accepted win
  };
  const step = dir => {
    if (!game || $('play').hidden || gid !== '2048') return;
    if (game.over) {
      if (mode === 'alarm') return finishAlarm(false);
      game = newGame(); save(); draw(); return;
    }
    const r = move(game, dir);
    if (!r.changed) return;
    game = r.game; draw();
    if (r.won) {
      if (mode !== 'alarm') { save(); say('2048'); return; }
      return finishAlarm(true);
    }
    if (game.over && mode === 'alarm') return finishAlarm(false);
    save();
  };
  const onKey = e => {
    const d = {ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down'}[e.key];
    if (d && !$('play').hidden) { e.preventDefault(); step(d); }
  };
  const board = $('board');
  board.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; board.setPointerCapture?.(e.pointerId); });
  board.addEventListener('pointerup', e => {
    if (!down) return;
    const dx = e.clientX - down[0], dy = e.clientY - down[1]; down = null;
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) { if (game?.over) step('left'); return; }
    step(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  });
  board.addEventListener('pointercancel', () => { down = null; });
  addEventListener('keydown', onKey);
  $('back').onclick = () => { show(false); bar(); ui.refresh(); };

  // ---- foreground sound: the adapter's outputs (Web Audio, one voice, visible tab only). It starts only after an intentional tap on the page. ----------
  const unlock = () => { if (A.outputs.facts().audio !== 'running') A.unlock(); };
  addEventListener('pointerdown', unlock);

  // ---- wordless settings + the MOM face (one head, driven by adapter.snapshot()) --------------------------------------
  const setHost = root.querySelector('.al-set'), crt = $('crt');
  const DOCK = 46;   // MOM's subtitle dock stays visible under the board
  let comp = null, ui = null, gc = null, repT = 0, repI = 0, crtBox = {w: 300, h: 260}, size = () => {};
  const stopRepeat = () => { clearTimeout(repT); clearInterval(repI); repT = repI = 0; };
  const syncKeys = () => comp?.setKeys?.(!$('play').hidden ? false : !!ui?.canTab(-1), !$('play').hidden ? false : !!ui?.canTab(1));
  ui = mountSettings(setHost, A, {embedded: true, onGame: startFree, onState: () => { stopRepeat(); syncKeys(); }});
  gc = mountGameColors($('play'), {onToggle: o => { if (gid !== '2048') o ? gp.pause() : gp.resume(); }});   // real-time games hold still while the drawer is open
  $('play').addEventListener('gc-change', () => gp.refresh());                                           // a swatch repaints a paused / idle game at once
  swc = mountSwitch($('play').querySelector('header'), {current: () => gid, onPick: g => {   // in-play switch: stage, deadline and ringing are untouched; the old round is destroyed (its callbacks go stale)
    const att = mode === 'alarm' ? boundOcc && R.attemptId(S, boundOcc) : FREE;   // free play: a fixed key, never an alarm
    if (!att || g === gid) return;
    if (g === '2048') { gp.setGame(att, '2048'); play2048(att); } else playGame(att, g);
  }});   // game-only colour panel: rail/handle + drawer inside the glass
  $('play').addEventListener('click', e => { const k = e.target.closest?.('.gc-root [data-k]')?.dataset.k; if (k) ui.say(k); }, true);   // MOM's subtitle for each colour control
  const openSet = () => { show(false); ui.refresh(); };   // the reminders app IS the default view; this returns to it from the board
  const offPlay = A.on('playChallenge', e => startAlarm(e?.occId));
  const faceNow = () => {};   // the stage face now lives in the MOM bust and header chips of the reminders app
  const offSnap = A.on('snapshot', () => faceNow());

  // ---- emergency stop on the game screen: a deliberate ~3 s hold (pointer or Enter/Space), at every stage ---------------------------
  const stopOcc = async id => { if (!id) return; await A.emergencyStop(id); bar(); faceNow(); if (mode === 'alarm' && boundOcc === id) endAlarmBoard(); };
  const holdEnd = () => { clearTimeout(holdT); holdT = 0; root.classList.remove('holding'); root.querySelectorAll('.hold-on').forEach(b => b.classList.remove('hold-on')); };
  const holdStart = b => {
    if (holdT) return;
    root.classList.add('holding'); b.classList.add('hold-on');
    holdT = setTimeout(() => { holdT = 0; root.classList.remove('holding'); stopOcc(boundOcc); }, HOLD_MS);
  };
  root.addEventListener('pointerdown', e => { const b = e.target.closest?.('.al-bar [data-hold]'); if (b) { e.preventDefault(); holdStart(b); } });
  const onUp = () => holdT && holdEnd();
  addEventListener('pointerup', onUp); addEventListener('pointercancel', onUp);
  root.addEventListener('keydown', e => { const b = e.target.closest?.('.al-bar [data-hold]'); if (b && (e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); holdStart(b); } });
  root.addEventListener('keyup', e => { if (holdT && (e.key === 'Enter' || e.key === ' ')) holdEnd(); });
  root.addEventListener('contextmenu', e => { if (e.target.closest?.('[data-hold]')) e.preventDefault(); });

  // ---- the clock: due time and escalation stages per reminder; the speaker is the adapter's ---------------------------------------
  function tick() {
    const events = A.tick();
    for (const e of events) {
      if (e.type === 'start') openSet();
      else if (e.type === 'missed' && mode === 'alarm' && boundOcc === e.occId) endAlarmBoard();
    }
    faceNow();
    if (mode === 'alarm') bar();
  }
  const timer = setInterval(tick, 1000);
  const onVis = () => { if (!document.hidden) tick(); };
  document.addEventListener('visibilitychange', onVis);

  // ---- opening from a reminder notice: always the CURRENT truth about that occurrence ---------------------------------------------
  async function openOccurrence(id) {
    if (!id) return;
    const rm = await P.remote(id);
    if (rm) commit(R.applyRemote(S, rm, now()));
    const o = R.lookup(S, id);
    if (o && o.status === 'ACTIVE') commit(R.acknowledge(S, id, now()));   // a tap only opens: it never stops or pauses anything
    openSet();
  }
  const onSW = e => { if (e.data?.type === 'ADHD_OPEN') openOccurrence(e.data.occurrenceId); };
  navigator.serviceWorker?.addEventListener('message', onSW);
  try {
    const q = new URLSearchParams(location.search), occ = q.get('occ');
    if (occ) { q.delete('occ'); q.delete('view'); history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '')); openOccurrence(occ); }
  } catch {}
  tick(); A.sync();

  // ---- console keys: up/down scroll the active scroller (tap 64 px, hold repeats after 350 ms); the right keys step tabs. Never while the board is showing. ----
  const keyEl = k => root.querySelector(`[data-key="${k}"]`);
  for (const [k, dir] of [['up', -1], ['down', 1]]) {
    const b = keyEl(k);
    b.addEventListener('pointerdown', e => {
      e.preventDefault(); if (!$('play').hidden) return; stopRepeat();
      try { b.setPointerCapture(e.pointerId); } catch {}
      ui.scrollStep(dir); repT = setTimeout(() => { repI = setInterval(() => { if (!ui.scrollStep(dir)) stopRepeat(); }, 90); }, 350);
    });
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture', 'pointerleave']) b.addEventListener(ev, stopRepeat);
    b.addEventListener('contextmenu', e => e.preventDefault());
    b.addEventListener('click', e => { if (e.detail === 0 && $('play').hidden) ui.scrollStep(dir); });   // keyboard / assistive activation: one step
  }
  for (const [k, d] of [['prev', -1], ['next', 1]]) {
    const b = keyEl(k);
    b.addEventListener('pointerdown', e => e.preventDefault());
    b.addEventListener('click', () => { if ($('play').hidden) ui.tab(d); });
  }
  addEventListener('blur', stopRepeat);

  size = ({crt: c}) => { if (c) crtBox = c; root.style.setProperty('--bs', Math.max(96, Math.min(crtBox.w - 16, crtBox.h - 44 - 10 - DOCK)) + 'px'); };
  root.style.setProperty('--bs', '150px');
  comp = await mountComputer($('stage'), {crt, up: keyEl('up'), down: keyEl('down'), prev: keyEl('prev'), next: keyEl('next')}, size);
  if (disposed) comp.dispose();
  else if (!comp.ok) { root.classList.add('flat'); root.style.setProperty('--bs', '220px'); }
  syncKeys();
  return {dispose() {
    disposed = true; clearInterval(timer); removeEventListener('keydown', onKey); removeEventListener('pointerdown', unlock); removeEventListener('blur', stopRepeat); stopRepeat(); removeEventListener('pointerup', onUp); removeEventListener('pointercancel', onUp); clearTimeout(holdT); offPlay(); offSnap();
    document.removeEventListener('visibilitychange', onVis); navigator.serviceWorker?.removeEventListener('message', onSW);
    gc?.destroy(); ui?.destroy(); links.forEach(l => l.remove()); A.dispose(); comp?.dispose(); host.replaceChildren();
  }};
}
