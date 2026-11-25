#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;   // screen-space tile/grid coordinates need fp32 (mediump = fp16 on most phones)
#endif
// Pencil final: clear XDoG-lite contours + nested hatching (spite/cross-hatching tiles) on off-white paper.
// Light tones stay clean paper; hatching starts in mid tones at +35 deg, a -35 deg layer joins in darker tones, the
// dense cross tile (hb) only in the darkest, so no single direction dominates. Tone is gamma-lifted because phone
// rooms are dark: walls are paper-ish, only real shadows get hatch.
uniform sampler2D uPass2;
uniform sampler2D uTex0;   // hatch_a: R,G,B = tone levels 0,1,2 (light -> mid), horizontal strokes
uniform sampler2D uTex1;   // hatch_b: R,G,B = tone levels 3,4,5 (dark), cross-hatched
uniform sampler2D uTex2;   // paper_tooth
uniform vec2 uSize;
uniform float uRef;
varying vec2 vUv;
vec2 rot(vec2 p, float a) { float c = cos(a), s = sin(a); return vec2(c * p.x - s * p.y, s * p.x + c * p.y); }
// s: 0 = paper .. 1 = densest of the three tiles
float lv(vec3 h, float s) { return s < 0.3333 ? mix(1.0, h.r, s * 3.0) : s < 0.6667 ? mix(h.r, h.g, s * 3.0 - 1.0) : mix(h.g, h.b, s * 3.0 - 2.0); }
void main() {
  vec4 p = texture2D(uPass2, vUv);
  // contour: wider line than m1 (sigma 1.1 vs 3), soft phi so it does not flip on noise
  float line = xdogRel(p.r, p.g, 12.0, 0.93, 2.5);
  line = 1.0 - (1.0 - line) * smoothstep(0.03, 0.075, p.g - p.r);   // gate: only real dark ridges/edges, compression-noise-level ones fade out
  // fine feature layer: small dark ridge = ring mean - centre luma on the flattened base (radius 3.6 ref px). Absolute-contrast gate
  // (0.022..0.056) so eyes, brows, nostrils, lips always draw and wall/compression noise (< ~0.02) never does; large dark areas
  // (hair, shadow) have a dark ring too, so they do not trigger it.
  float c0 = p.b;
  float ridge = p.a * 0.125;
  float fine = smoothstep(0.022, 0.056, ridge);
  float floorTone = fine * (1.0 - smoothstep(0.10, 0.22, c0));      // solid graphite for pupils / nostrils / mouth interior
  float tone = pow(max(p.g, 0.0), 0.5);
  float d = 1.0 - smoothstep(0.18, 0.78, tone);          // 0 = clean paper, 1 = darkest
  vec2 px = vUv * uSize / (256.0 * 3.0 * uRef);
  float a = lv(texture2D(uTex0, rot(px, 0.61)).rgb, smoothstep(0.02, 0.75, d));
  float b = lv(texture2D(uTex0, rot(px, -0.61) + 0.37).rgb, smoothstep(0.38, 1.0, d));
  float c = mix(1.0, texture2D(uTex1, px + 0.53).g, smoothstep(0.85, 1.0, d));
  float hatch = a * b * c;
  float paper = 0.945 + (texture2D(uTex2, vUv * uSize / (512.0 * 0.6 * uRef)).r - 0.5) * 0.09;
  float ink = min(min(line, 1.0 - 0.85 * fine), mix(1.0, hatch, 0.86));
  ink *= 1.0 - 0.7 * floorTone;
  float v = mix(0.22, 1.0, ink) * paper;
  gl_FragColor = vec4(vec3(v) * vec3(1.0, 0.995, 0.985), 1.0);
}
