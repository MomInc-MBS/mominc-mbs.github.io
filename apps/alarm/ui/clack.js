// Soft close-mic keyboard clacks for MOM's typed subtitles. Web Audio synthesis only: no files, no deps, no network. Never throws; silent until the first tap/key unlocks audio.
let ac = null, master = null, noise = null, lastT = -1;
const R = (a, b) => a + Math.random() * (b - a);
const GESTURES = ['pointerdown', 'touchend', 'click', 'keydown'];

function ctx() {
  if (ac) return ac;
  try {
    const C = globalThis.AudioContext || globalThis.webkitAudioContext; if (!C) return null;
    ac = new C(); master = ac.createGain(); master.gain.value = .55; master.connect(ac.destination);
    noise = ac.createBuffer(1, Math.ceil(ac.sampleRate * .12), ac.sampleRate);
    const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  } catch (e) { ac = null; }
  return ac;
}
// Stay armed until audio really runs: iOS may ignore resume() from pointerdown but honour touchend/click, and an interruption (call, background) suspends it again.
const arm = on => { if (typeof document !== 'undefined') for (const g of GESTURES) document[on ? 'addEventListener' : 'removeEventListener'](g, unlock, {capture: true, passive: true}); };
const unlock = () => {
  try {
    const c = ctx(); if (!c || c.state === 'running') return arm(false);
    c.onstatechange ||= () => arm(c.state !== 'running');
    c.resume?.()?.then?.(() => { if (c.state === 'running') arm(false); }, () => {});
  } catch (e) {}
};
arm(true);

/** One key press sound for character ch. Rate-capped (25 ms); nothing for newline; silent when audio is missing or not yet unlocked. */
export function clack(ch) {
  try {
    if (ch === '\n' || !ac || ac.state !== 'running' || ac.currentTime - lastT < .025) return;
    const sp = ch === ' ', heavy = !sp && Math.random() < .11, t = ac.currentTime + R(0, .004);
    lastT = ac.currentTime;
    let out = master;
    if (ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.value = R(-.3, .3); p.connect(master); out = p; }
    const env = (node, peak, decay, to) => { const g = ac.createGain(); g.gain.setValueAtTime(peak, t); g.gain.exponentialRampToValueAtTime(.0001, t + decay); node.connect(g); g.connect(to); return g; };
    const n = ac.createBufferSource(), bp = ac.createBiquadFilter(); n.buffer = noise;   // the click: filtered noise burst
    bp.type = 'bandpass'; bp.frequency.value = sp ? R(700, 1400) : R(1500, 4000); bp.Q.value = R(1.2, 2.6);
    n.connect(bp); env(bp, (sp ? .1 : .22) * R(.7, 1.2) * (heavy ? 1.4 : 1), sp ? R(.025, .04) : R(.015, .035), out);
    n.start(t, R(0, .05)); n.stop(t + .06);
    const o = ac.createOscillator(); o.type = 'sine';   // the thock: low body, very fast decay
    const f = sp ? R(80, 115) : R(120, 250) * (heavy ? .85 : 1); o.frequency.setValueAtTime(f * 1.25, t); o.frequency.exponentialRampToValueAtTime(f, t + .02);
    env(o, (sp ? .32 : .16) * R(.7, 1.2) * (heavy ? 1.6 : 1), sp ? R(.07, .09) : R(.035, .055), out);
    o.start(t); o.stop(t + .1);
  } catch (e) {}
}
