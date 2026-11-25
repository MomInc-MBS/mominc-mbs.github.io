#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;   // screen-space tile/grid coordinates need fp32 (mediump = fp16 on most phones)
#endif
// Printed Comic (round 2): vivid simplified colour (4 soft bands on a gamma-lifted tone so bright scenes stay bright), dark ink,
// orderly 45-degree halftone dots at 12 ref-px pitch (8 px at 720p: survives H.264 at 4-6 Mbps without moire; analytic anti-aliased
// coverage) printed only in real shadows, light paper tone + tooth.
uniform sampler2D uPass1;
uniform sampler2D uTex0;   // paper_tooth
uniform vec2 uSize;
uniform float uRef;
varying vec2 vUv;
void main() {
  vec2 ru = uRef / uSize;
  vec3 b = texture2D(uPass1, vUv).rgb;
  float l = pow(max(luma(b), 0.0), 0.72);          // lift: phone scenes are dim-to-mid, comic print must stay light
  float lq = mix(l, softQuant(l * 0.96 + 0.03, 4.0, 0.2), 0.85);
  vec3 c = saturate3(relight(b, clamp(lq * 0.9 + 0.13, 0.0, 1.0)), 1.3);
  // ink
  float e = smoothstep(0.17, 0.40, length(sobelLuma(uPass1, vUv, ru * 1.4)));
  float e2 = smoothstep(0.20, 0.44, length(sobelLuma(uPass1, vUv, ru * 2.2)));
  float ink = max(e, e2 * 0.7);
  // halftone, pitch P output px, rotated 45 deg, in output pixels so it is stable and scale-correct
  float P = 12.0 * uRef;
  vec2 q = vUv * uSize;
  vec2 r = vec2(q.x + q.y, q.y - q.x) * 0.70710678 / P;
  vec2 d = fract(r) - 0.5;
  float dist = length(d);
  float dark = clamp(1.0 - lq * 1.1, 0.0, 1.0);
  float rad = 0.70 * sqrt(dark);
  float aa = max(0.9 / P, 0.06);
  float cov = 1.0 - smoothstep(rad - aa, rad + aa, dist);
  c = mix(c, c * vec3(0.55, 0.50, 0.62), cov * smoothstep(0.16, 0.45, dark));
  c = mix(c, vec3(0.09, 0.08, 0.13), ink * 0.92);
  float t = texture2D(uTex0, vUv * uSize / (512.0 * uRef * 1.0)).r - 0.5;
  c = c * vec3(0.985, 0.97, 0.93) + 0.012;
  c *= 1.0 + t * 0.12;
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}
