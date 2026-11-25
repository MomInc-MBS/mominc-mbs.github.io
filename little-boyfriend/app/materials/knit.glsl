#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#endif
// Knitted (single pass): stockinette. Columns of V stitches (two leaning yarn legs per stitch, rounded-cylinder shading, twisted-ply
// stripes, fuzzy rim) on a frame-anchored grid; one colour per stitch from the source (area average, saturated, soft palette);
// dark gap between legs and rows. Unlike matted `felt` the structure is a regular loop lattice, not fibre noise.
// Reference: photo-art-filters-android knitting.frag (V of two leaning loops per cell); rewritten with segment SDFs.
uniform sampler2D uSrc;
uniform vec2 uSize;
uniform float uRef;
varying vec2 vUv;
const vec2 ST = vec2(28.0, 32.0);   // stitch size, ref px
void main() {
  vec2 grid = uSize / (ST * uRef);
  vec2 p = vUv * grid;
  vec2 c = clamp(floor(p), vec2(0.0), floor(grid));
  vec2 f = p - c;
  vec2 ctr = (c + 0.5) / grid, q = 0.3 / grid;
  vec3 s = 0.28 * texture2D(uSrc, ctr).rgb + 0.18 * (texture2D(uSrc, ctr + vec2(q.x, q.y)).rgb + texture2D(uSrc, ctr + vec2(-q.x, q.y)).rgb
         + texture2D(uSrc, ctr + vec2(q.x, -q.y)).rgb + texture2D(uSrc, ctr + vec2(-q.x, -q.y)).rgb);
  vec2 h = hash22(c + vec2(8.3, 1.9));
  vec3 yarn = saturate3(s, 1.2);
  yarn = mix(yarn, vec3(softQuant(yarn.r, 8.0, 0.2), softQuant(yarn.g, 8.0, 0.2), softQuant(yarn.b, 8.0, 0.2)), 0.5);
  yarn *= 0.94 + 0.12 * h.x;
  vec2 u = vec2(f.x - 0.5, (f.y - 0.5) * ST.y / ST.x);   // cell units of stitch width, centred
  float R = 0.27;
  float fz = 1.0 + 0.10 * snoise(p * vec2(5.0, 4.0) + c);       // fuzzy rim
  vec2 aL = vec2(-0.30, 0.44), bL = vec2(-0.03, -0.44), aR = vec2(0.30, 0.44), bR = vec2(0.03, -0.44);
  float dL = sdSeg(u, aL, bL), dR = sdSeg(u, aR, bR);
  float aa = 0.9 / ST.x;
  float mL = 1.0 - smoothstep(R * fz - aa, R * fz + aa, dL);
  float mR = 1.0 - smoothstep(R * fz - aa, R * fz + aa, dR);
  // legs: cylinder shade + side light from the left + twisted ply stripes along the leg
  vec2 dirL = normalize(bL - aL), dirR = normalize(bR - aR);
  float alL = dot(u - aL, dirL), alR = dot(u - aR, dirR);
  float acL = dot(u - aL, vec2(-dirL.y, dirL.x)), acR = dot(u - aR, vec2(-dirR.y, dirR.x));
  float cylL = sqrt(clamp(1.0 - (dL / R) * (dL / R), 0.0, 1.0)), cylR = sqrt(clamp(1.0 - (dR / R) * (dR / R), 0.0, 1.0));
  float shL = (0.50 + 0.66 * cylL) * (1.0 + 0.16 * acL / R) * (0.90 + 0.10 * sin(alL * 62.0 - acL * 14.0));
  float shR = (0.50 + 0.66 * cylR) * (1.0 + 0.16 * acR / R) * (0.90 + 0.10 * sin(alR * 62.0 - acR * 14.0));
  vec3 gap = yarn * 0.38;                                          // shadow between legs / rows
  vec3 col = gap;
  col = mix(col, yarn * shL, mL);
  col = mix(col, yarn * shR * 1.04, mR);                           // right leg lies slightly over
  col *= 1.0 + 0.05 * snoise(p * vec2(11.0, 9.0) + c * 3.0);
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
