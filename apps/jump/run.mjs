// Coach Jump PWA runtime: a random paper Coach per new round, the same Coach on resume.
// Standalone: never touches website story state, receipts or redirects (only its own keys).
import {startGame} from '/arcade/pyramid-jump/game.mjs';
import {rasterizePaper, releasePaper} from '/arcade/pyramid-jump/paper.mjs';
import {currentRound, finishRound} from '/arcade/pyramid-jump/rounds.mjs';
import {subscribeTilt, tiltReady} from '/arcade/pyramid-jump/tilt.mjs';

const BEST_KEY = 'myr5-pyramid-jump-best-v1'; // the vendored game saves its best here (apps.json bestKey)
const el = (tag, cls, text) => Object.assign(document.createElement(tag), {className: cls || '', textContent: text || ''});

export function mountJump(host, options = {}) {
  const root = el('div', 'jump-root');
  host.append(root);
  let game = null, paper = null, disposed = false, token = 0, unsubTilt = null;
  const subscribeMotion = cb => (unsubTilt = subscribeTilt(cb)); // leaning + arrow keys only, no touch steering
  const stop = () => {
    game?.dispose(); game = null; unsubTilt = null;
    const done = paper; paper = null;
    setTimeout(() => releasePaper(done), 0); // after any in-flight frame finished drawing
    root.querySelector('.jump-over')?.remove();
  };
  const best = () => { try { return Math.max(0, Math.floor(Number(localStorage.getItem(BEST_KEY))) || 0); } catch { return 0; } };
  async function round() {
    const mine = ++token;
    const {batch} = currentRound(localStorage);
    const raster = await rasterizePaper(batch);
    await tiltReady(root);
    if (disposed || mine !== token) { releasePaper(raster); return; }
    paper = raster;
    game = startGame(root, {paperImg: paper, startLevel: 1, seed: Date.now(), subscribeMotion, onEnd, onExit: () => document.getElementById('back')?.click()});
  }
  function onEnd(r) {
    finishRound(localStorage); // the next round generates a new Coach
    stop();
    const over = el('div', 'jump-over');
    over.append(el('h2', '', r.won ? 'You made it!' : r.why), el('p', '', `Height ${r.score} · Best ${Math.max(best(), r.score)}`));
    const again = el('button', '', 'New round');
    again.type = 'button'; again.onclick = () => { over.remove(); round(); };
    over.append(again); root.append(over); again.focus();
  }
  round();
  return {dispose() { disposed = true; token++; stop(); root.remove(); }};
}
