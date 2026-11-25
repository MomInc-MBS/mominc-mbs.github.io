// ADHD, web edition. Free-play 2048 on the 3D mini-computer. Daily alarms are Android-only (see the APK).
// Port of the Android WebView app.js: the native bridge is gone; the board is kept in localStorage.
import {newGame, move, encode, decode} from './board.js';
import {mountComputer} from './computer.js';

const KEY = 'mom-alarm-2048-web-v1', BEST = 'mom-alarm-2048-web-best-v1'; // BEST = apps.json web.bestKey
const HTML = `<div class="al"><div class="al-stage"><canvas aria-hidden="true"></canvas></div>
<div class="al-screen" aria-live="polite"><section class="al-menu">
<h1>ADHD</h1><p class="dim">Alarm for the Distracted, Hungry &amp; Disorganized</p>
<p class="dim">Free play. Merge your way to $2048.</p>
<button class="al-start" type="button">Start</button>
<p class="dim"><a href="/download/alarm/">Daily alarm needs the Android app</a></p></section>
<section class="al-play" hidden><header><strong>FREE PLAY</strong><span class="al-score"></span><button class="al-back alt" type="button">Menu</button></header>
<div class="al-board" role="application" aria-label="2048 board. Swipe or use arrow keys."></div><p class="al-msg" role="status"></p></section></div>
<div class="al-glass" aria-hidden="true"></div></div>`;

export async function mountAlarm(host) {
  host.innerHTML = HTML;
  const root = host.firstElementChild, $ = c => root.querySelector('.al-' + c);
  let game = null, down = null, disposed = false, comp = null;
  const save = () => { try { localStorage.setItem(KEY, encode(game)); if (game.score > (Number(localStorage.getItem(BEST)) || 0)) localStorage.setItem(BEST, game.score); } catch {} };
  const draw = () => {
    $('board').replaceChildren(...game.board.flat().map(t => {   // fixed 16 cells, rebuilt each move: the DOM never grows
      const d = document.createElement('div'); d.className = 'cell';
      if (t) { d.dataset.t = t; d.style.setProperty('--t', t); d.textContent = '$' + 2 ** (t - 1); }
      return d;
    }));
    $('score').textContent = '$' + game.score.toLocaleString();
  };
  const show = playing => { $('menu').hidden = playing; $('play').hidden = !playing; };
  const start = () => {
    let saved = null; try { saved = localStorage.getItem(KEY); } catch {}
    game = (saved && decode(saved)) || newGame();
    $('msg').textContent = 'Free play. Swipe or use arrow keys.';
    show(true); draw();
  };
  const step = dir => {
    if (!game || $('play').hidden) return;
    if (game.over) { game = newGame(); save(); $('msg').textContent = 'New board.'; draw(); return; }
    const r = move(game, dir);
    if (!r.changed) return;
    game = r.game; draw(); save();
    if (r.won) $('msg').textContent = '2048!';
    else if (game.over) $('msg').textContent = 'No moves. Tap the board for a new one.';
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
  $('start').onclick = start;
  $('back').onclick = () => show(false);
  const size = (lw, lh) => root.style.setProperty('--bs', Math.max(96, Math.min(lw - 44 - 16, lh - 44 - 66)) + 'px');
  root.style.setProperty('--bs', '150px');
  comp = await mountComputer($('stage'), $('screen'), $('glass'), size);
  if (disposed) comp.dispose();
  else if (!comp.ok) { root.classList.add('flat'); size(300, 260); }
  return {dispose() { disposed = true; removeEventListener('keydown', onKey); comp?.dispose(); host.replaceChildren(); }};
}
