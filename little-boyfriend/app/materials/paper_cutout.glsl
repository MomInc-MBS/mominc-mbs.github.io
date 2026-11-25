#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;   // screen-space tile/grid coordinates need fp32 (mediump = fp16 on most phones)
#endif
// Paper Cutout (tuned): 4 broad flat bands from the bilateral-flattened base, a 3 / 6 ref-px offset shadow cast by lighter
// bands onto darker neighbours (light from upper-left) plus a thin light rim on the lit edge, visible paper tooth. No outline.
// A visual overlap cue only, not segmentation.
uniform sampler2D uPass1;
uniform sampler2D uTex0;   // paper_tooth
uniform vec2 uSize;
uniform float uRef;
varying vec2 vUv;
float band(vec2 uv) { return softQuant(luma(texture2D(uPass1, uv).rgb) * 0.96 + 0.02, 4.0, 0.07); }
void main() {
  vec2 ru = uRef / uSize;
  vec3 b = texture2D(uPass1, vUv).rgb;
  float lq = band(vUv);
  vec3 c = saturate3(relight(b, lq * 0.88 + 0.08), 1.2);
  vec2 L = vec2(-1.0, 1.0);          // light travels from upper-left; paper above shades what lies down-right of it
  float s1 = clamp((band(vUv + L * ru * 3.0) - lq) * 4.0, 0.0, 1.0);
  float s2 = clamp((band(vUv + L * ru * 6.0) - lq) * 4.0, 0.0, 1.0);
  float sh = max(s1, 0.6 * s2);
  float rim = clamp((lq - band(vUv - L * ru * 2.5)) * 4.0, 0.0, 1.0);   // edge of a raised patch facing the light
  c *= 1.0 - 0.42 * sh;
  c += 0.07 * rim * (1.0 - sh);
  float t = texture2D(uTex0, vUv * uSize / (512.0 * uRef * 0.5)).r - 0.5;
  c *= 1.0 + t * 0.55;
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}
