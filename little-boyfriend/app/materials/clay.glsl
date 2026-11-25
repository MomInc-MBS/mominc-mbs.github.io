#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;   // screen-space tile/grid coordinates need fp32 (mediump = fp16 on most phones)
#endif
// Claymation (round 2): strongly flattened matte colour, soft-knee highlight compression, curvature-ish shading from the
// smoothed luma (cavity + light-direction cue, +-6%), plus hand-sculpted lumps (broad static simplex-noise height
// with a lit-from-upper-left slope shade, frame anchored) and clay micro texture. The round-1 fingerprint whorls are gone:
// on big flat areas they read as concentric rings. No ink.
uniform sampler2D uPass3;
uniform sampler2D uTex0;   // clay_micro
uniform vec2 uSize;
uniform float uRef;
varying vec2 vUv;
// hand-made surface height in ref-px space: soft dents (about 60 px) + thumb pressure (about 22 px)
float lump(vec2 p) { return snoise(p * 0.0075 + 3.1) * 0.85 + snoise(p * 0.02 + 11.7) * 0.15; }
void main() {
  vec2 ru = uRef / uSize;
  vec2 p = vUv * uSize / uRef;
  vec3 b = texture2D(uPass3, vUv).rgb;
  float l = luma(b);
  // soft knee: highlights above 0.68 are squeezed (no plastic gloss) but white walls stay light clay, not grey
  float k = 0.68;
  float lc = l < k ? l : k + (1.0 - k) * 0.92 * tanh1((l - k) / (1.0 - k));
  vec3 c = saturate3(relight(b, lc * 0.98 + 0.015), 1.06);
  // curvature cue: cavity = luma minus the mean of a ring 11 ref-px out; light from upper-left
  float ring = 0.0;
  ring += luma(texture2D(uPass3, vUv + ru * vec2(11.0, 0.0)).rgb);
  ring += luma(texture2D(uPass3, vUv + ru * vec2(-11.0, 0.0)).rgb);
  ring += luma(texture2D(uPass3, vUv + ru * vec2(0.0, 11.0)).rgb);
  ring += luma(texture2D(uPass3, vUv + ru * vec2(0.0, -11.0)).rgb);
  ring += luma(texture2D(uPass3, vUv + ru * vec2(8.0, 8.0)).rgb);
  ring += luma(texture2D(uPass3, vUv + ru * vec2(-8.0, -8.0)).rgb);
  ring += luma(texture2D(uPass3, vUv + ru * vec2(8.0, -8.0)).rgb);
  ring += luma(texture2D(uPass3, vUv + ru * vec2(-8.0, 8.0)).rgb);
  float cav = clamp((l - ring / 8.0) * 0.9, -0.06, 0.06);
  float dirl = luma(texture2D(uPass3, vUv + ru * vec2(-5.0, 5.0)).rgb) - luma(texture2D(uPass3, vUv + ru * vec2(5.0, -5.0)).rgb);
  c *= 1.0 + cav + clamp(dirl * 0.25, -0.05, 0.05);
  // edge mask: hand marks must not cross contours (eyes, mouth, hair line)
  float e = smoothstep(0.06, 0.28, length(sobelLuma(uPass3, vUv, ru * 1.5)));
  // hand lumps: slope of the height field along the light direction (upper-left) -> soft dents, plus a little height tint
  float h0 = lump(p), h1 = lump(p + vec2(14.0, -14.0));
  float slope = clamp((h0 - h1) * 2.5, -1.0, 1.0);
  c *= 1.0 + (slope * 0.035 + h0 * 0.02) * (1.0 - 0.7 * e);
  float micro = texture2D(uTex0, vUv * uSize / (512.0 * uRef * 0.9)).r - 0.5;
  float tool = texture2D(uTex0, vUv * uSize / (512.0 * uRef * 3.0) + vec2(0.29, 0.61)).r - 0.5;
  c *= 1.0 + (micro * 0.022 + tool * 0.03) * (1.0 - 0.6 * e);
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}
