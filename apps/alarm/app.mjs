// MOM's: 2048 Reminder, web edition. 2048 on the 3D mini-computer, plus a reminder PWA around it.
// Free play is unchanged and never touches an alarm. The alarm board is the same board.js; the rules live in remind.js (pure, tested).
import {newGame, move, encode, decode} from './board.js';
import {mountComputer} from './computer.js';
import * as R from './remind.js';
import * as P from './push.js';
import {createWebAdapter} from './web-adapter.js';
import {mountSettings} from './ui/settings.js';
import {icon} from './ui/glyphs.js';
import {faceUrl, HOLD_MS} from './stages.js';

const KEY = 'mom-alarm-2048-web-v1', BEST = 'mom-alarm-2048-web-best-v1'; // BEST = apps.json web.bestKey
const AKEY = 'adhd-alarm-board-v1';                                       // live alarm boards, one per occurrence attempt ({attempt: encoded board}; the old single {attempt, enc} is still read)
// The shell is wordless: icons, digits and the user's own title text. Accessible names live in aria-label only (the installed name stays in metadata and notifications).
const HTML = `<div class="al"><div class="al-stage"><canvas aria-hidden="true"></canvas></div>
<div class="al-screen"><section class="al-menu">
<img class="al-face" alt="" width="96" height="96">
<div class="al-menurow"><button class="al-rems" type="button" aria-label="Reminders">${icon('bell')}</button><button class="al-start alt" type="button" aria-label="Free play">${icon('board2048')}</button></div></section>
<section class="al-play" hidden><header><strong class="al-mode" aria-hidden="true"></strong><span class="al-score num"></span><button class="al-back alt" type="button" aria-label="Menu">${icon('back')}</button></header>
<div class="al-board" role="application" aria-label="2048 board. Swipe or use arrow keys."></div><p class="al-msg vh" role="status"></p></section></div>
<div class="al-glass" aria-hidden="true"></div>
<div class="al-bar" hidden><button class="al-stop alt" type="button" data-hold="stop" aria-label="Emergency stop (hold 3 s)">${icon('octagon')}</button></div>
<div class="al-rem" hidden><button class="al-x" type="button" aria-label="Back to the computer">${icon('back')}</button><div class="al-set"></div></div></div>`;

export async function mountAlarm(host) {
  host.innerHTML = HTML;
  const root = host.firstElementChild, $ = c => root.querySelector('.al-' + c);
  let game = null, down = null, disposed = false, comp = null, mode = 'free', boundOcc = null, holdT = 0;
  let S = R.load();
  const now = () => Date.now();
  const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = '/apps/alarm/ui/settings.css'; document.head.appendChild(link);
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
  const show = playing => { $('menu').hidden = playing; $('play').hidden = !playing; };
  const startFree = () => {
    mode = 'free'; boundOcc = null; $('mode').innerHTML = icon('board2048'); bar();
    let saved = null; try { saved = localStorage.getItem(KEY); } catch {}
    game = (saved && decode(saved)) || newGame();
    show(true); draw(); closeSet();
  };
  const startAlarm = occId => {
    const id = occId || R.ranked(S)[0]?.occId, attempt = id && R.attemptId(S, id);
    if (!attempt) return;
    commit(R.acknowledge(S, id, now()));                   // opening the game is recorded, nothing else
    mode = 'alarm'; boundOcc = id; $('mode').innerHTML = icon('bell');
    const saved = boards()[attempt];
    game = (saved && decode(saved)) || newGame();
    show(true); draw(); closeSet(); bar();
  };
  const bar = () => {
    const alarm = mode === 'alarm' && !!boundOcc && R.attemptId(S, boundOcc) !== null;
    $('bar').hidden = !alarm; root.classList.toggle('has-bar', alarm);
  };
  const endAlarmBoard = () => { mode = 'free'; boundOcc = null; show(false); bar(); openSet(); };
  const finishAlarm = won => {                             // bound to the occurrence this board was started for: a stale board never clears another alarm
    const att = R.attemptId(S, boundOcc);
    commit((won ? R.win : R.lose)(S, boundOcc, now())); if (att) putBoard(att, null); endAlarmBoard();
  };
  const step = dir => {
    if (!game || $('play').hidden) return;
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
  $('start').onclick = startFree;
  $('back').onclick = () => { show(false); bar(); };

  // ---- foreground sound: the adapter's outputs (Web Audio, one voice, visible tab only). It starts only after an intentional tap on the page. ----------
  const unlock = () => { if (A.outputs.facts().audio !== 'running') A.unlock(); };
  addEventListener('pointerdown', unlock);

  // ---- wordless settings + the MOM face (one head, driven by adapter.snapshot()) --------------------------------------
  const rem = $('rem'), setHost = root.querySelector('.al-set');
  let ui = null;
  const openSet = () => { rem.hidden = false; ui ||= mountSettings(setHost, A, {}); ui.refresh(); };
  const closeSet = () => { rem.hidden = true; };
  $('rems').onclick = openSet;
  root.querySelector('.al-x').onclick = closeSet;
  const offPlay = A.on('playChallenge', e => startAlarm(e?.occId));
  const faceNow = () => { const u = faceUrl((R.snapshot(S, now()).stage || 1) - 1), i = $('face'); if (i.getAttribute('src') !== u) i.src = u; };
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
  if (R.ranked(S).length && rem.hidden) openSet();          // reopened while ringing

  const size = (lw, lh) => root.style.setProperty('--bs', Math.max(96, Math.min(lw - 44 - 16, lh - 44 - 66)) + 'px');
  root.style.setProperty('--bs', '150px');
  comp = await mountComputer($('stage'), $('screen'), $('glass'), size);
  if (disposed) comp.dispose();
  else if (!comp.ok) { root.classList.add('flat'); size(300, 260); }
  return {dispose() {
    disposed = true; clearInterval(timer); removeEventListener('keydown', onKey); removeEventListener('pointerdown', unlock); removeEventListener('pointerup', onUp); removeEventListener('pointercancel', onUp); clearTimeout(holdT); offPlay(); offSnap();
    document.removeEventListener('visibilitychange', onVis); navigator.serviceWorker?.removeEventListener('message', onSW);
    ui?.destroy(); link.remove(); A.dispose(); comp?.dispose(); host.replaceChildren();
  }};
}
