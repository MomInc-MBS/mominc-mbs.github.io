// Optional wordless challenges (an ALTERNATIVE exit; 2048 win/loss + emergency always remain). Digits, math symbols and tile values only.
import {icon} from './glyphs.js';

/** a × b ± c with a small positive answer. */
export function makeMath(rand = Math.random) {
  const a = 2 + (rand() * 8 | 0), b = 2 + (rand() * 8 | 0), c = 1 + (rand() * Math.min(9, a * b - 1) | 0), plus = rand() < .5;   // a×b−c stays >= 1 (no minus key)
  return {text: `${a} × ${b} ${plus ? '+' : '−'} ${c}`, answer: plus ? a * b + c : a * b - c};
}
/** Doubling 2048 tiles with one gap; three choices (right, double, half). */
export function makePattern(rand = Math.random) {
  const k = 1 + (rand() * 6 | 0), seq = [0, 1, 2, 3].map(i => 2 ** (k + i)), gap = 1 + (rand() * 3 | 0), right = seq[gap];
  const choices = [right, right * 2, right / 2].sort(() => rand() - .5);
  return {seq, gap, answer: right, choices};
}

/** createChallenge('math'|'pattern', host, {onSolved, rand}) -> {destroy} */
export function createChallenge(kind, host, {onSolved, rand = Math.random} = {}) {
  const box = document.createElement('div'); box.className = 'chal'; host.appendChild(box);
  const done = () => { box.dataset.solved = ''; box.innerHTML = `<div class="chal-ok">${icon('check')}</div>`; try { onSolved?.(); } catch (e) {} };
  const wrong = () => { box.dataset.wrong = ''; setTimeout(() => { delete box.dataset.wrong; draw(); }, 600); };
  let q = null, typed = '';
  function draw() {
    if (kind === 'pattern') {
      q = makePattern(rand);
      box.innerHTML = `<div class="chal-seq">${q.seq.map((v, i) => i === q.gap ? '<span class="tile gap"></span>' : `<span class="tile" data-v="${v}">${v}</span>`).join('')}</div>
<div class="chal-pick" role="group" aria-label="Pick the missing tile">${q.choices.map(v => `<button type="button" class="tile" data-v="${v}" aria-label="${v}">${v}</button>`).join('')}</div>`;
      box.querySelectorAll('.chal-pick button').forEach(b => b.onclick = () => +b.dataset.v === q.answer ? done() : wrong());
      return;
    }
    q = makeMath(rand); typed = '';
    box.innerHTML = `<div class="chal-eq" aria-live="polite"><span>${q.text} =</span> <output class="chal-ans" aria-label="Answer"></output></div>
<div class="chal-keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => `<button type="button" data-d="${d}" aria-label="${d}">${d}</button>`).join('')}
<button type="button" data-d="del" aria-label="Delete digit">${icon('back')}</button><button type="button" data-d="0" aria-label="0">0</button><button type="button" data-d="ok" class="ok" aria-label="Check answer">${icon('check')}</button></div>`;
    const out = box.querySelector('.chal-ans');
    box.querySelectorAll('.chal-keys button').forEach(b => b.onclick = () => {
      const d = b.dataset.d;
      if (d === 'del') typed = typed.slice(0, -1); else if (d === 'ok') return +typed === q.answer && typed ? done() : wrong(); else if (typed.length < 4) typed += d;
      out.textContent = typed;
    });
  }
  draw();
  return {destroy() { box.remove(); }};
}
