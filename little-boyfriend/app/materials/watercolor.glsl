#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;   // screen-space tile/grid coordinates need fp32 (mediump = fp16 on most phones)
#endif
// Watercolor (extra look, round 2): pastel wash from the strongly flattened base, wobbly wet edges (webgl-noise simplex warps the
// sample position, static in screen space), pigment pooling darker at contours, paper granulation. No ink line.
// Round 2: the warp is edge-weighted (strong or fine edges, i.e. window frames, hands, lips, nostrils, keep their true position, so no
// double edge or glitch), lower frequency, and the pooled-pigment term is a one-sided ring (centre minus ring mean) instead of a symmetric
// Sobel, which drew two dark bands on thin bars.
uniform sampler2D uPass3;
uniform sampler2D uTex0;   // paper_tooth
uniform vec2 uSize;
uniform float uRef;
varying vec2 vUv;
void main() {
  vec2 ru = uRef / uSize;
  vec2 p = vUv * uSize / uRef;                 // ref-px space, resolution independent
  float e0 = length(sobelLuma(uPass3, vUv, ru * 1.3));
  float keep = 1.0 - smoothstep(0.16, 0.45, e0) * 0.92;           // strong/fine edges stay where the photo has them
  vec2 w = vec2(snoise(p * 0.011), snoise(p * 0.011 + 17.3)) * 3.0 * ru * keep;
  vec3 b = texture2D(uPass3, vUv + w).rgb;
  float l = luma(b);
  vec3 c = saturate3(relight(b, 0.18 + l * 0.8), 0.82);
  c = mix(c, vec3(1.0), 0.08);                 // wash: pigment never reaches full strength
  // pooled pigment: darker only on the dark side of an edge (centre darker than the ring around it)
  float ring = 0.0;
  ring += luma(texture2D(uPass3, vUv + w + ru * vec2(5.0, 0.0)).rgb);
  ring += luma(texture2D(uPass3, vUv + w + ru * vec2(-5.0, 0.0)).rgb);
  ring += luma(texture2D(uPass3, vUv + w + ru * vec2(0.0, 5.0)).rgb);
  ring += luma(texture2D(uPass3, vUv + w + ru * vec2(0.0, -5.0)).rgb);
  float pool = clamp((ring * 0.25 - l) * 4.0, 0.0, 1.0);
  c *= 1.0 - 0.34 * smoothstep(0.02, 0.22, pool);
  float t = texture2D(uTex0, vUv * uSize / (512.0 * uRef * 0.9)).r - 0.5;
  c *= 1.0 + t * 0.28 * (1.0 - 0.5 * l);       // granulation shows more in the pigment
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}
