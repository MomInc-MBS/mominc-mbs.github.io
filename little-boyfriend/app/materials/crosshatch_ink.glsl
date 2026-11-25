#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;   // screen-space tile/grid coordinates need fp32 (mediump = fp16 on most phones)
#endif
// Crosshatch Ink (extra look, round 2): Pencil's calm recipe in blue-black pen ink on warm cream paper. Pass chain is now Pencil's
// (base_h, base_v bilateral flatten -> graphite_blur2 -> this), so the line mask and the hatch tone come from the flattened base,
// not the raw photo: that is what took Pencil from 1.6x to ~1.0x source flicker. Bolder line than Pencil, crisper nested
// cross-hatch (+-35 deg layers), dense cross tile only in the darkest tones, no solid wash.
uniform sampler2D uPass2;
uniform sampler2D uTex0;   // hatch_a
uniform sampler2D uTex1;   // hatch_b
uniform sampler2D uTex2;   // paper_tooth
uniform vec2 uSize;
uniform float uRef;
varying vec2 vUv;
vec2 rot(vec2 p, float a) { float c = cos(a), s = sin(a); return vec2(c * p.x - s * p.y, s * p.x + c * p.y); }
float lv(vec3 h, float s) { return s < 0.3333 ? mix(1.0, h.r, s * 3.0) : s < 0.6667 ? mix(h.r, h.g, s * 3.0 - 1.0) : mix(h.g, h.b, s * 3.0 - 2.0); }
void main() {
  vec4 p = texture2D(uPass2, vUv);
  // contour: XDoG-lite on the wide-sigma pair, soft phi, gated so a noise-level ridge fades out (flicker), bolder than Pencil
  float line = xdogRel(p.r, p.g, 16.0, 0.92, 2.5);
  line = 1.0 - (1.0 - line) * smoothstep(0.036, 0.08, p.g - p.r);
  // fine feature layer (eyes, brows, nostrils, lips): same absolute-contrast gate as Pencil
  float fine = smoothstep(0.026, 0.06, p.a * 0.125);
  float tone = pow(max(p.g, 0.0), 0.62);
  float d = 1.0 - smoothstep(0.08, 0.92, tone);
  vec2 px = vUv * uSize / (256.0 * 3.0 * uRef);
  float a = lv(texture2D(uTex0, rot(px, 0.61)).rgb, smoothstep(0.02, 0.75, d));
  float b = lv(texture2D(uTex0, rot(px, -0.61) + 0.37).rgb, smoothstep(0.34, 1.0, d));
  float c = mix(1.0, texture2D(uTex1, px + 0.53).g, smoothstep(0.82, 1.0, d));
  float hatch = a * b * c;
  float ink = min(min(line, 1.0 - 0.9 * fine), mix(1.0, hatch, 0.9));
  float tooth = texture2D(uTex2, vUv * uSize / (512.0 * 1.2 * uRef)).r - 0.5;
  vec3 paper = vec3(0.965, 0.935, 0.85) * (1.0 + tooth * 0.07);
  vec3 inkc = vec3(0.10, 0.11, 0.20);
  gl_FragColor = vec4(mix(inkc, paper, ink), 1.0);
}
