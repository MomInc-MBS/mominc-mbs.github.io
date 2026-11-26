// MOM's single procedural face: one code-authored SVG head (geometric purple bob, blunt fringe, angular cat-eye glasses).
// Pure numbers drive it (§6.2). Base emotion comes only from the caller's snapshot; reactions are short additive offsets.
// No deps, aria-hidden, pointer-events:none, never throws into the caller, idle = no work, <=30 fps only while animating.
const NS = 'http://www.w3.org/2000/svg';
const C = {contour: '#100B1C', deep: '#27143B', hair: '#7138AB', hairLo: '#5a2a92', hairHi: '#8a4fc6', glyph: '#C493F2', rim: '#F3E6FF',
  skin: '#b98fe6', skinLo: '#9a6dd0', skinHi: '#d7bdf6', eye: '#fbf6ff', iris: '#27143B', frame: '#ffd36e', brow: '#1a0f2b', lip: '#4a1466', flush: '#ff5a8a', vein: '#ff4d6d'};

export const NEUTRAL = {tilt: 0, ox: 0, oy: 0, gx: 0, gy: 0, lid: .86, brow: 0, browY: 0, mouth: .1, open: 0, cheek: 0, accent: 0, lean: 0};
const PRESET = {
  happy: {lid: .95, brow: -.3, browY: .45, mouth: .95, open: .14, cheek: .35},
  upset: {lid: .72, brow: .55, browY: -.35, mouth: -.6, open: 0, cheek: .3},
  furious: {lid: .62, brow: 1, browY: -.55, mouth: -.95, open: .62, cheek: .85},
};
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, +v || 0));

/** Contract stage -> base: 1 happy .5, 2 upset .7, 3 furious .7, 4 furious 1.0; no active occurrence -> relaxed happy .3. */
export const baseForStage = s => ({1: ['happy', .5], 2: ['upset', .7], 3: ['furious', .7], 4: ['furious', 1]})[s] || ['happy', .3];

/** Deterministic parameters for an emotion at an intensity (0..1). Stage 4 = same furious family + static accent/lean. */
export function paramsFor(emotion, intensity) {
  const p = PRESET[emotion] || PRESET.happy, k = clamp(intensity), w = .4 + .6 * k, out = {...NEUTRAL};
  for (const key in p) out[key] = NEUTRAL[key] + (p[key] - NEUTRAL[key]) * w;
  out.accent = emotion === 'furious' ? clamp((k - .5) * 2) : 0;
  out.lean = out.accent > .8 ? .5 : 0;
  return out;
}

/** Reactions: 150-500 ms, additive offsets scaled by an envelope. x/y are normalized -1..1 (screen space). */
export const REACTIONS = {
  glance: {ms: 420, f: (x = .6, y = .2) => ({gx: x, gy: y})},
  nod: {ms: 380, f: () => ({oy: 9})},
  tilt: {ms: 460, f: (x = 1) => ({tilt: 6 * Math.sign(x || 1)})},
  concern: {ms: 480, f: () => ({brow: -.75, browY: .5, mouth: -.2})},
  blink: {ms: 160, f: () => ({lid: -1})},
  sleepy: {ms: 500, f: () => ({lid: -.5})},
  lean: {ms: 420, f: () => ({lean: .7, oy: -4})},
  neutral: {ms: 220, f: () => ({oy: 3})},
};
/** Envelope 0..1..0 over t in 0..1 (glance holds, others are a smooth bump). */
export const envelope = (kind, t) => {
  t = clamp(t);
  if (kind === 'glance') return t < .22 ? sm(t / .22) : t > .7 ? sm((1 - t) / .3) : 1;
  return Math.sin(Math.PI * t);
};
const sm = t => t * t * (3 - 2 * t);
/** base + gaze + one reaction offset; never mutates base. */
export function compose(base, look, add, e = 1) {
  const p = {...base};
  if (look) { p.gx += look.x * .9; p.gy += look.y * .9; }
  if (add) for (const k in add) p[k] = (p[k] || 0) + add[k] * e;
  p.lid = clamp(p.lid); p.gx = clamp(p.gx, -1, 1); p.gy = clamp(p.gy, -1, 1); p.open = clamp(p.open); p.cheek = clamp(p.cheek);
  return p;
}
const lerp = (a, b, k) => { const o = {}; for (const key in b) o[key] = a[key] + (b[key] - a[key]) * k; return o; };

// ---------- static geometry (viewBox 0 0 400 460, pivot 200,250) ----------
const pts = a => 'M' + a.map(p => p.join(',')).join('L') + 'Z';
const mir = a => a.map(([x, y]) => [400 - x, y]).reverse();
const SIL = [[200, 26], [262, 34], [316, 60], [350, 104], [366, 162], [372, 232], [376, 300], [384, 370], [282, 396], [200, 372], [118, 396], [16, 370], [24, 300], [28, 232], [34, 162], [50, 104], [84, 60], [138, 34]];
const FACE = [[118, 148], [282, 148], [302, 200], [306, 252], [298, 300], [278, 346], [244, 382], [214, 398], [186, 398], [156, 382], [122, 346], [102, 300], [94, 252], [98, 200]];
const FRINGE = [[80, 150], [92, 106], [124, 68], [166, 48], [200, 44], [234, 48], [276, 68], [308, 106], [320, 150], [322, 198], [302, 166], [250, 170], [200, 167], [150, 170], [98, 166], [78, 198]];
const SIDE_L = [[78, 198], [98, 166], [110, 236], [110, 300], [122, 360], [126, 398], [96, 394], [70, 380], [58, 300], [60, 232]];
const FACETS = [ // low-poly hair planes: [points, fill]
  [[[92, 106], [124, 68], [150, 120], [102, 166], [80, 150]], C.hairLo], [[[166, 48], [200, 44], [196, 120], [150, 120], [124, 68]], C.hairHi],
  [[[234, 48], [276, 68], [252, 120], [204, 120], [200, 44]], C.hair], [[[276, 68], [308, 106], [320, 150], [298, 166], [252, 120]], C.hairLo],
  [[[60, 232], [78, 198], [98, 166], [110, 236], [84, 300]], C.hairHi], [[[340, 232], [322, 198], [302, 166], [290, 236], [316, 300]], C.hairLo],
];
const SHINE = [[128, 84], [200, 64], [272, 84], [264, 96], [200, 78], [136, 96]];
const STRANDS = 'M200 46L194 166M166 50L150 169M124 70L104 166M234 50L250 169M276 70L298 166M60 232L70 380M82 230L96 394M340 232L330 380M318 230L304 394';
const LENS_L = [[100, 196], [150, 206], [190, 210], [192, 244], [180, 262], [140, 266], [116, 256], [108, 230]];
const CHEEK_L = [[102, 262], [140, 286], [150, 346], [124, 346], [104, 300]];
const EYE = [{cx: 158, s: -1}, {cx: 242, s: 1}];
const EY = 236, MY = 336;
const VEIN = 'M268 96q10 2 12-8M296 88q-2 10 8 12M304 116q-10-2-12 8M276 124q2-10-8-12';
const BOLT = [[30, 6], [66, 38], [50, 44], [76, 84], [26, 52], [44, 46]];

function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
/** Cached decorative mosaic: small squares/diamonds/triangles, no text, under the features, above an opaque underfill. */
function mosaic(seed, box, keep, colors, n) {
  const r = rng(seed); let s = '';
  for (let i = 0; i < n * 3 && n > 0; i++) {
    const x = box[0] + r() * (box[2] - box[0]), y = box[1] + r() * (box[3] - box[1]);
    if (!keep(x, y)) continue; n--;
    const z = 3 + r() * 8, c = colors[(r() * colors.length) | 0], o = (.18 + r() * .3).toFixed(2), k = r();
    s += k < .45 ? `<rect x="${(x - z / 2).toFixed(1)}" y="${(y - z / 2).toFixed(1)}" width="${z.toFixed(1)}" height="${z.toFixed(1)}" fill="${c}" opacity="${o}"/>`
      : k < .75 ? `<rect x="${(x - z / 2).toFixed(1)}" y="${(y - z / 2).toFixed(1)}" width="${z.toFixed(1)}" height="${z.toFixed(1)}" fill="${c}" opacity="${o}" transform="rotate(45 ${x.toFixed(1)} ${y.toFixed(1)})"/>`
      : `<path d="M${x.toFixed(1)} ${(y - z).toFixed(1)}l${z.toFixed(1)} ${(z * 1.6).toFixed(1)}h${(-2 * z).toFixed(1)}z" fill="${c}" opacity="${o}"/>`;
  }
  return s;
}
let STATIC = null;
function staticSvg() {
  if (STATIC) return STATIC;
  const face = pts(FACE), sil = pts(SIL);
  const faceGlyph = mosaic(7, [96, 148, 304, 398], (x, y) => Math.abs(x - 200) > 58 || y > 352, [C.glyph, C.skinLo, C.skinHi], 70);
  const hairGlyph = mosaic(11, [20, 30, 380, 396], (x, y) => y < 180 || Math.abs(x - 200) > 112, [C.glyph, C.deep, C.hairHi], 140);
  const lensR = mir(LENS_L), side = SIDE_L, sideR = mir(SIDE_L), cheekR = mir(CHEEK_L);
  STATIC = `<defs>
<clipPath id="mf-face"><path d="${face}"/></clipPath><clipPath id="mf-hair"><path d="${sil}"/></clipPath>
<clipPath id="mf-cl"><path class="mf-ec"/></clipPath><clipPath id="mf-cr"><path class="mf-ec"/></clipPath><clipPath id="mf-cm"><path class="mf-mc"/></clipPath>
<linearGradient id="mf-sk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.skinHi}"/><stop offset=".55" stop-color="${C.skin}"/><stop offset="1" stop-color="${C.skinLo}"/></linearGradient>
</defs>
<g class="mf-bolts" opacity="0"><path d="${pts(BOLT)}" fill="${C.frame}" stroke="${C.contour}" stroke-width="5" stroke-linejoin="round"/><path d="${pts(mir(BOLT))}" fill="${C.frame}" stroke="${C.contour}" stroke-width="5" stroke-linejoin="round"/></g>
<g class="mf-head">
<path d="${sil}" fill="none" stroke="${C.rim}" stroke-width="18" stroke-linejoin="round"/><path class="mf-hot" d="${sil}" fill="none" stroke="${C.vein}" stroke-width="22" stroke-linejoin="round" opacity="0"/>
<path d="${sil}" fill="${C.hair}" stroke="${C.contour}" stroke-width="8" stroke-linejoin="round"/>
<g class="mf-glyph" clip-path="url(#mf-hair)">${hairGlyph}</g>
<path d="${face}" fill="url(#mf-sk)" stroke="${C.contour}" stroke-width="7" stroke-linejoin="round"/>
<g class="mf-glyph" clip-path="url(#mf-face)">${faceGlyph}<path d="${pts(CHEEK_L)}" fill="${C.skinLo}" opacity=".55"/><path d="${pts(cheekR)}" fill="${C.skinLo}" opacity=".55"/></g>
<path class="mf-flush" d="${pts([[118, 284], [158, 292], [150, 318], [122, 310]])}${pts(mir([[118, 284], [158, 292], [150, 318], [122, 310]]))}" fill="${C.flush}" opacity="0"/>
<path d="M198 252L190 292L204 300L214 293" fill="none" stroke="${C.contour}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>
<path d="M198 254L190 292L204 300Z" fill="${C.skinLo}" opacity=".6"/>
<path d="M188 384L212 384" stroke="${C.contour}" stroke-width="3" stroke-linecap="round" opacity=".55"/>
<path class="mf-cheek" d="M136 320L146 332M264 320L254 332" stroke="${C.contour}" stroke-width="3.5" stroke-linecap="round" opacity="0"/>
${EYE.map((e, i) => `<path class="mf-ew" fill="${C.eye}"/><g clip-path="url(#mf-c${i ? 'r' : 'l'})"><g class="mf-iris"><circle cx="${e.cx}" cy="${EY + 1}" r="9.5" fill="${C.iris}"/><circle cx="${e.cx}" cy="${EY + 1}" r="4" fill="${C.contour}"/><circle cx="${e.cx + 3}" cy="${EY - 3}" r="2.6" fill="${C.rim}"/></g></g><path class="mf-el" fill="none" stroke="${C.contour}" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"/>`).join('')}
<path class="mf-mouth" fill="#2a0a2e" stroke="${C.lip}" stroke-width="6" stroke-linejoin="round"/>
<g clip-path="url(#mf-cm)"><rect class="mf-teeth" x="160" width="80" height="9" fill="${C.rim}" opacity="0"/><ellipse class="mf-tongue" cx="204" rx="17" ry="10" fill="#d4558a" opacity="0"/></g>
<path class="mf-mo" fill="none" stroke="${C.contour}" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M104 204L86 210M296 204L314 210" stroke="${C.contour}" stroke-width="9" stroke-linecap="round"/><path d="M104 204L86 210M296 204L314 210" stroke="${C.frame}" stroke-width="4.5" stroke-linecap="round"/>
<path d="${pts(FRINGE)}" fill="${C.hair}" stroke="${C.contour}" stroke-width="7" stroke-linejoin="round"/>
${FACETS.map(([p, f]) => `<path d="${pts(p)}" fill="${f}"/>`).join('')}
<path d="${pts(side)}" fill="${C.hair}" stroke="${C.contour}" stroke-width="7" stroke-linejoin="round"/><path d="${pts(sideR)}" fill="${C.hair}" stroke="${C.contour}" stroke-width="7" stroke-linejoin="round"/>
<path d="${pts(SHINE)}" fill="${C.glyph}" opacity=".6"/>
<path class="mf-glyph" d="${STRANDS}" stroke="${C.deep}" stroke-width="3" opacity=".55" stroke-linecap="round"/>
<g class="mf-glasses"><path d="${pts(LENS_L)}${pts(lensR)}" fill="${C.glyph}" fill-opacity=".14" stroke="${C.contour}" stroke-width="14" stroke-linejoin="round"/><path d="M190 222Q200 214 210 222" fill="none" stroke="${C.contour}" stroke-width="12" stroke-linecap="round"/>
<path d="${pts(LENS_L)}${pts(lensR)}" fill="none" stroke="${C.frame}" stroke-width="7" stroke-linejoin="round"/><path d="M190 222Q200 214 210 222" fill="none" stroke="${C.frame}" stroke-width="6" stroke-linecap="round"/>
<path d="M118 216L136 212L124 236ZM282 216L300 220L292 228Z" fill="${C.rim}" opacity=".35"/></g>
${EYE.map(() => `<path class="mf-brow" fill="${C.brow}" stroke="${C.contour}" stroke-width="2" stroke-linejoin="round"/>`).join('')}
<path class="mf-vein" d="${VEIN}" fill="none" stroke="${C.contour}" stroke-width="10" stroke-linecap="round" opacity="0"/><path class="mf-vein" d="${VEIN}" fill="none" stroke="${C.vein}" stroke-width="5" stroke-linecap="round" opacity="0"/>
</g>`;
  return STATIC;
}
const f1 = v => (+v).toFixed(1);
function eyePath(cx, s, lid, anger, cheek) {
  const inner = cx - s * 25, outer = cx + s * 25, at = k => f1(outer + (inner - outer) * k);
  const ho = 19 * lid, hi = 19 * lid * (1 - .72 * anger), hb = 10 * Math.min(1, lid + .25) * (1 - .35 * cheek) * (1 - .3 * anger);
  const shape = `M${f1(outer)} ${f1(EY + 1)}L${at(.3)} ${f1(EY - ho)}L${at(.78)} ${f1(EY - hi)}L${f1(inner)} ${EY}L${at(.62)} ${f1(EY + hb)}L${at(.24)} ${f1(EY + hb * .8)}Z`;
  const lash = `M${f1(outer + s * 9)} ${f1(EY - 8)}L${f1(outer)} ${f1(EY + 1)}L${at(.3)} ${f1(EY - ho)}L${at(.78)} ${f1(EY - hi)}L${f1(inner)} ${EY}`;
  return [shape, lash];
}
function browPath(cx, s, a, y) {
  const inner = cx - s * 30, outer = cx + s * 40, apexX = cx + s * 12;
  const iy = 192 + 17 * a - 12 * y, oy = 186 - 10 * a - 12 * y, ay = Math.min(iy, oy) - 9 + 8 * Math.max(0, a);
  return `M${inner} ${f1(iy)}L${apexX} ${f1(ay)}L${outer} ${f1(oy)}L${outer - s * 3} ${f1(oy + 6)}L${apexX} ${f1(ay + 11)}L${inner} ${f1(iy + 13)}Z`;
}
function mouthPath(m, open) {           // cubic lips: mids are where the lips cross the centre line
  const w = 32 + 12 * open, cy = MY - 14 * m, um = MY + 6 * m, lm = um + 2 + open * 44 + Math.max(0, m) * 16;
  const cu = f1((4 * um - cy) / 3), cl = f1((4 * lm - cy) / 3), L = f1(200 - w), R = f1(200 + w), a = f1(200 - w * .55), b = f1(200 + w * .55);
  return {d: `M${L} ${f1(cy)}C${a} ${cu} ${b} ${cu} ${R} ${f1(cy)}C${b} ${cl} ${a} ${cl} ${L} ${f1(cy)}Z`, up: um, lo: lm};
}

/** createMomFace(host, {reducedMotion, highContrast}) -> {setBase, react, look, settle, setReducedMotion, pause, resume, destroy} */
export function createMomFace(host, opts = {}) {
  let svg = null, E = null, dead = false, userPaused = false, raf = 0, last = 0;
  let rm = !!opts.reducedMotion, cur = paramsFor('happy', .3), from = cur, to = cur, t0 = 0, dur = 0;
  const look = {x: 0, y: 0}, lookTo = {x: 0, y: 0}; let rx = null;
  const safe = fn => (...a) => { try { return fn(...a); } catch (e) { /* decorative: never throw into the caller */ } };
  try {
    svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 400 460'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
    svg.setAttribute('class', 'mom-face' + (opts.highContrast ? ' mf-hc' : ''));
    svg.style.pointerEvents = 'none'; svg.style.display = 'block'; svg.style.width = '100%'; svg.style.height = '100%';
    const uid = 'mf' + Math.random().toString(36).slice(2, 7);   // per-instance clip ids (several faces may coexist)
    svg.innerHTML = staticSvg().replace(/mf-(face|hair|cl|cr|cm|sk)\b(?=[")])/g, `${uid}-$1`);
    host.appendChild(svg);
    const q = s => [...svg.querySelectorAll(s)];
    E = {head: q('.mf-head')[0], ew: q('.mf-ew'), el: q('.mf-el'), ec: q('.mf-ec'), iris: q('.mf-iris'), brow: q('.mf-brow'), mouth: q('.mf-mouth'),
      mo: q('.mf-mo'), mc: q('.mf-mc'), teeth: q('.mf-teeth')[0], tongue: q('.mf-tongue')[0], cheek: q('.mf-cheek')[0], flush: q('.mf-flush')[0], vein: q('.mf-vein'), bolts: q('.mf-bolts')[0], hot: q('.mf-hot')[0]};
  } catch (e) { E = null; }

  const draw = p => {
    if (!E) return;
    try {
      E.head.setAttribute('transform', `translate(${f1(200 + p.ox)} ${f1(250 + p.oy)}) rotate(${f1(p.tilt)}) scale(${(1 + p.lean * .05).toFixed(3)}) translate(-200 -250)`);
      const anger = Math.max(0, p.brow);
      EYE.forEach((e, i) => {
        const [shape, lash] = eyePath(e.cx, e.s, p.lid, anger, Math.max(0, p.mouth) * p.cheek);
        E.ew[i].setAttribute('d', shape); E.ec[i].setAttribute('d', shape); E.el[i].setAttribute('d', lash);
        E.iris[i].setAttribute('transform', `translate(${f1(p.gx * 8)} ${f1(p.gy * 4.5)})`);
        E.brow[i].setAttribute('d', browPath(e.cx, e.s, p.brow, p.browY));
      });
      const m = mouthPath(p.mouth, p.open), gap = m.lo - m.up;
      E.mouth[0].setAttribute('d', m.d); E.mo[0].setAttribute('d', m.d); E.mc[0].setAttribute('d', m.d);
      E.teeth.setAttribute('y', f1(m.up - 4)); E.teeth.setAttribute('opacity', gap > 9 ? 1 : 0);
      E.tongue.setAttribute('cy', f1(m.lo + 1)); E.tongue.setAttribute('opacity', gap > 18 ? .95 : 0);
      E.cheek.setAttribute('opacity', (p.cheek * .8).toFixed(2));
      E.flush.setAttribute('opacity', (p.accent * .32).toFixed(2));
      const v = clamp((p.accent - .2) * 1.6).toFixed(2); E.vein.forEach(el => el.setAttribute('opacity', v));
      const b = clamp((p.accent - .8) * 5).toFixed(2); E.bolts.setAttribute('opacity', b); E.hot.setAttribute('opacity', b);
    } catch (e) { /* keep the last good frame */ }
  };
  const idle = () => dead || userPaused || (typeof document !== 'undefined' && document.hidden);
  const frame = now => {
    raf = 0;
    if (idle()) return;
    if (now - last < 33) { raf = requestAnimationFrame(frame); return; }    // <=30 fps
    last = now; let busy = false;
    if (dur && now - t0 < dur) { cur = lerp(from, to, sm((now - t0) / dur)); busy = true; } else { cur = to; dur = 0; }
    for (const k of ['x', 'y']) { const d = lookTo[k] - look[k]; if (Math.abs(d) > .01) { look[k] += d * .4; busy = true; } else look[k] = lookTo[k]; }
    let add = null, e = 0;
    if (rx) { const t = (now - rx.t0) / rx.ms; if (t >= 1) rx = null; else { add = rx.add; e = envelope(rx.kind, t); busy = true; } }
    draw(compose(cur, look, add, e));
    if (busy) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf && !idle() && typeof requestAnimationFrame === 'function') raf = requestAnimationFrame(frame); };
  const snap = () => { cur = to; dur = 0; rx = null; look.x = lookTo.x; look.y = lookTo.y; draw(compose(cur, look)); };
  const onVis = () => { if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = 0; } else if (!userPaused) snap(); };
  try { document.addEventListener('visibilitychange', onVis); } catch (e) {}
  draw(compose(cur, look));

  return {
    setBase: safe((emotion, intensity) => {
      const next = paramsFor(emotion, intensity);
      if (rm) { to = next; snap(); return; }
      from = compose(cur, null); to = next; t0 = performance.now(); dur = 280; kick();
    }),
    react: safe((kind, at) => {
      const R = REACTIONS[kind]; if (!R || rm) return;                    // reduced motion: static, no reactions
      rx = {kind, ms: R.ms, t0: performance.now(), add: R.f(at?.x, at?.y)}; kick();
    }),
    look: safe((x, y) => { lookTo.x = clamp(x, -1, 1); lookTo.y = clamp(y, -1, 1); if (rm) snap(); else kick(); }),
    settle: safe(() => { lookTo.x = lookTo.y = 0; rx = null; if (rm) snap(); else kick(); }),
    setReducedMotion: safe(b => { rm = !!b; if (rm) snap(); }),
    pause: safe(() => { userPaused = true; if (raf) cancelAnimationFrame(raf); raf = 0; }),
    resume: safe(() => { userPaused = false; snap(); }),
    destroy: safe(() => { dead = true; if (raf) cancelAnimationFrame(raf); raf = 0; document.removeEventListener('visibilitychange', onVis); svg?.remove(); E = null; }),
  };
}
