#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#endif
// Linocut (final pass after base_h/base_v): carved two-tone print. Dark tones = solid ink, mid tones = parallel gouge lines
// (angle 32 deg, 11 ref-px pitch, line width grows with darkness, hand-wobbled and broken into short cuts by static noise), highlights = bare cream
// paper with a few nicks. Key contour ink from the flattened base. Ink is slightly starved by the paper tooth (uTex0).
// Everything is frame anchored (ref-px coordinates), never uSeed. Reference: photo-art-filters-android linocut_color.frag (two inks,
// gouge noise); rewritten as a one-ink carved print.
uniform sampler2D uPass1;
uniform sampler2D uTex0;   // paper_tooth
uniform vec2 uSize;
uniform float uRef;
varying vec2 vUv;
void main() {
  vec2 pr = vUv * uSize / uRef;
  float t = pow(clamp(luma(texture2D(uPass1, vUv).rgb), 0.0, 1.0), 0.95);
  float tooth = texture2D(uTex0, pr / 768.0).r;
  vec2 dir = vec2(0.848, 0.530), per = vec2(-0.530, 0.848);
  float al = dot(pr, dir), ac = dot(pr, per);
  float wob = 1.6 * snoise(vec2(al * 0.012, ac * 0.02) + 5.0);               // ref px of line wobble
  float cell = (ac + wob) / 11.0;
  float id = floor(cell), fy = fract(cell);
  float lineT = fy - 0.5;                                                    // across the gouge line, -0.5..0.5
  float brk = snoise(vec2(al * 0.010, id * 7.3));                           // breaks the line into short cuts
  float w = 0.5 * clamp((0.72 - t) / 0.30, 0.0, 1.0);                        // ink half-width: 0 at light mid-tone .. full at dark mid-tone
  w *= smoothstep(-0.55, -0.10, brk + 0.9 * (0.72 - t));                    // darker = fewer breaks
  float aa = 0.9 / 11.0;
  float gouge = 1.0 - smoothstep(w - aa * 0.5, w + aa * 0.5, abs(lineT));
  gouge *= step(0.001, w);
  float solid = 1.0 - smoothstep(0.24, 0.34, t);                             // solid ink in the darks
  vec2 g = sobelLuma(uPass1, vUv, 1.7 * uRef / uSize);
  float key = smoothstep(0.17, 0.34, length(g)) * 0.95;
  float nick = step(0.62, snoise(vec2(al * 0.05, ac * 0.4) + 9.0)) * smoothstep(0.55, 0.9, t) * 0.55;   // few cuts in the lights
  float ink = clamp(max(max(solid, gouge), max(key, nick)), 0.0, 1.0);
  vec3 paper = vec3(0.955, 0.925, 0.845) * (0.95 + 0.08 * tooth);
  vec3 inkc = vec3(0.085, 0.080, 0.105);
  ink *= 0.93 + 0.07 * smoothstep(0.35, 0.65, tooth);                         // tooth starves a little ink
  gl_FragColor = vec4(mix(paper, inkc, ink), 1.0);
}
