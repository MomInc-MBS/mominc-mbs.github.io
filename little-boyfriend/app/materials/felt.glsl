#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;   // screen-space tile/grid coordinates need fp32 (mediump = fp16 on most phones)
#endif
// Wool Felt (round 2): strongly flattened base (4 bilateral passes), 6 soft tonal bands (chroma kept), edge-selective fuzz
// (3 taps displaced by the fibre atlas) and WOOL FIBRES: the fibre atlas is sampled along a slowly turning, static direction
// (low-frequency simplex angle, frame anchored) and stretched along it, so the nap reads as short tangled strands instead of
// isotropic grain. Fibre strength falls on bright flat areas (white wall, sky stay soft pale wool, no grey speckle) and on
// fine detail (eyes, teeth). No ink.
uniform sampler2D uPass3;
uniform sampler2D uTex0;   // felt_fiber (low-frequency fuzz displacement)
uniform sampler2D uTex1;   // felt_wool (generated strands, horizontal bias)
uniform vec2 uSize;
uniform float uRef;
varying vec2 vUv;
// fibre sample: rotate the ref-px coordinate by `a` (the strand atlas is horizontal-biased)
float fibre(vec2 p, float a, float scale, vec2 off) {
  float c = cos(a), s = sin(a);
  vec2 q = vec2(c * p.x + s * p.y, -s * p.x + c * p.y);
  return texture2D(uTex1, q / (512.0 * scale) + off, 0.5).r - 0.5;
}
void main() {
  vec2 ru = uRef / uSize;
  vec2 p = vUv * uSize / uRef;                       // ref-px space
  vec2 fp = vUv * uSize / (512.0 * uRef * 1.5);
  float e = smoothstep(0.10, 0.36, length(sobelLuma(uPass3, vUv, ru * 1.5)));
  float fine = smoothstep(0.35, 0.8, length(sobelLuma(uPass3, vUv, ru * 0.8)));
  // fuzz: displace by the (static) fibre texture, only near boundaries
  vec2 n1 = vec2(texture2D(uTex0, fp).r, texture2D(uTex0, fp + vec2(0.37, 0.71)).r) - 0.5;
  vec2 n2 = vec2(texture2D(uTex0, fp * 1.7 + 0.2).r, texture2D(uTex0, fp * 1.7 + vec2(0.55, 0.13)).r) - 0.5;
  float amp = 5.0 * (0.15 + e);
  vec3 b = (texture2D(uPass3, vUv).rgb + texture2D(uPass3, vUv + n1 * ru * amp * 2.2).rgb + texture2D(uPass3, vUv + n2 * ru * amp * 2.2).rgb) / 3.0;
  float l = luma(b);
  // fibre direction field: static, slowly varying (about 160 ref px). Rotating the atlas by a smooth per-pixel angle would swirl it
  // into whorls, so the angle snaps to 4 directions and two neighbouring directions are cross-faded instead (like the gouache brush).
  float q = (snoise(p * 0.006 + 5.3) * 0.5 + 0.5) * 3.0;
  float qi = floor(min(q, 2.999)), qt = smoothstep(0.25, 0.75, q - qi);
  float a0 = qi * 0.7853982 - 0.4, a1 = (qi + 1.0) * 0.7853982 - 0.4;
  float f1 = mix(fibre(p, a0, 4.0, vec2(0.0)), fibre(p, a1, 4.0, vec2(0.0)), qt);
  float f2 = mix(fibre(p, a0 + 0.9, 2.2, vec2(0.31, 0.62)), fibre(p, a1 + 0.9, 2.2, vec2(0.31, 0.62)), qt);
  float f = f1 * 0.75 + f2 * 0.45;
  // tonal bands, edges broken up by the fibre (static) so smooth walls get nap steps, not topographic contour lines
  float lq = mix(l, softQuant(l + f * 0.05, 6.0, 0.35), 0.75);
  vec3 c = saturate3(relight(b, lq * 0.93 + 0.05), 0.95);
  float bright = smoothstep(0.55, 0.9, l);
  float amt = 0.26 * (1.0 - 0.7 * fine) * (1.0 - 0.7 * bright);
  c *= 1.0 + f * amt + min(f, 0.0) * 0.06 * (1.0 - bright);
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}
