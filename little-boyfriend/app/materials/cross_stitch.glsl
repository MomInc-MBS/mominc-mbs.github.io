#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#endif
// Cross-Stitch (single pass): Aida cloth, one X stitch per cell (frame-anchored grid), thread colour = area-averaged source colour
// quantised to a limited thread palette (5 levels per channel). Cloth shows between threads, in the corner holes and wherever the
// source is bright (no stitch in highlights). Top stitch '/' casts a soft shadow on '\'. Twisted-ply shading along each thread.
// Reference: photo-art-filters-android cross_stitch.frag (two diagonal threads over woven fabric), rewritten (capsule SDF, no fwidth).
uniform sampler2D uSrc;
uniform vec2 uSize;
uniform float uRef;
varying vec2 vUv;
const float CELL = 26.0;   // ref px per stitch
void main() {
  vec2 grid = uSize / (CELL * uRef);
  vec2 p = vUv * grid;
  vec2 c = clamp(floor(p), vec2(0.0), floor(grid));
  vec2 f = p - c;
  vec2 ctr = (c + 0.5) / grid, q = 0.3 / grid;
  vec3 s = 0.28 * texture2D(uSrc, ctr).rgb + 0.18 * (texture2D(uSrc, ctr + vec2(q.x, q.y)).rgb + texture2D(uSrc, ctr + vec2(-q.x, q.y)).rgb
         + texture2D(uSrc, ctr + vec2(q.x, -q.y)).rgb + texture2D(uSrc, ctr + vec2(-q.x, -q.y)).rgb);
  vec3 th = saturate3(s, 1.3);
  th = vec3(softQuant(th.r, 5.0, 0.2), softQuant(th.g, 5.0, 0.2), softQuant(th.b, 5.0, 0.2));
  th = clamp(th * 0.96 + 0.03, 0.0, 1.0);
  // Aida cloth: cream, coarse over/under weave, dark holes at the cell corners
  vec3 cloth = vec3(0.94, 0.91, 0.83);
  cloth *= 0.93 + 0.07 * sin(f.x * 12.566) * sin(f.y * 12.566);
  vec2 ed = min(f, 1.0 - f);
  cloth *= 0.90 + 0.10 * smoothstep(0.0, 0.10, min(ed.x, ed.y));
  cloth *= 1.0 - 0.5 * (1.0 - smoothstep(0.05, 0.17, length(ed)));
  float aa = 0.7 / CELL;
  float r = 0.20;
  float d1 = sdSeg(f, vec2(0.16, 0.16), vec2(0.84, 0.84));      // '/' (top stitch)
  float d2 = sdSeg(f, vec2(0.16, 0.84), vec2(0.84, 0.16));      // '\' (under)
  float skip = smoothstep(0.84, 0.91, luma(s));                   // bright source: bare cloth
  float m1 = (1.0 - smoothstep(r - aa, r + aa, d1)) * (1.0 - skip);
  float m2 = (1.0 - smoothstep(r - aa, r + aa, d2)) * (1.0 - skip);
  float t1 = (f.x + f.y) * 0.7071, t2 = (f.x - f.y) * 0.7071;
  float sh1 = 0.55 + 0.55 * sqrt(clamp(1.0 - (d1 / r) * (d1 / r), 0.0, 1.0)) + 0.07 * sin(t1 * 46.0 - d1 * 22.0);
  float sh2 = 0.55 + 0.55 * sqrt(clamp(1.0 - (d2 / r) * (d2 / r), 0.0, 1.0)) + 0.07 * sin(t2 * 46.0 + d2 * 22.0);
  vec3 col = cloth * (1.0 - 0.22 * (1.0 - skip) * (1.0 - smoothstep(0.0, 0.30, min(d1, d2))));   // soft contact shadow of the thread on the cloth
  col = mix(col, th * sh2 * (1.0 - 0.38 * (1.0 - smoothstep(r, r + 0.11, d1))), m2);
  col = mix(col, th * sh1 * 1.04, m1);
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
