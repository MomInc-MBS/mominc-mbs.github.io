#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;   // screen-space tile/grid coordinates need fp32 (mediump = fp16 on most phones)
#endif
// Soft Pixel (single pass): 96 cells across (171 for 9:16), square cells, grid anchored to the frame.
// Each cell colour = area average of the held pose (2x2 bilinear taps over the cell); cell edges are softened by
// ~1 ref-px, a faint cell seam darkens the boundary, then a restrained 9-level-per-channel palette. Aspect-independent: row count follows the output aspect, so cells stay square.
uniform sampler2D uSrc;
uniform vec2 uSize;
uniform float uRef;
varying vec2 vUv;
const float CELLS_X = 96.0;      // m1 was 180: cells shrank to ~2 px once the aperture scales the image. 96 -> ~3.3 css px on a 412 phone
vec3 cell(vec2 c, vec2 grid) {
  vec2 ctr = (c + 0.5) / grid;
  vec2 q = 0.25 / grid;                 // 2x2 bilinear taps at +-quarter cell: area average of ~the whole cell
  return 0.25 * (texture2D(uSrc, ctr + vec2(-q.x, -q.y)).rgb + texture2D(uSrc, ctr + vec2(q.x, -q.y)).rgb
               + texture2D(uSrc, ctr + vec2(-q.x, q.y)).rgb + texture2D(uSrc, ctr + vec2(q.x, q.y)).rgb);
}
void main() {
  vec2 grid = vec2(CELLS_X, floor(CELLS_X * uSize.y / uSize.x + 0.5));
  vec2 p = vUv * grid;
  vec2 c = clamp(floor(p), vec2(0.0), grid - 1.0);
  vec2 f = p - c;
  float cellPx = uSize.x / grid.x;                 // output px per cell
  float w = clamp(1.0 * uRef / cellPx, 0.02, 0.5);   // soft edge width in cell units
  vec2 sg = vec2(f.x < 0.5 ? -1.0 : 1.0, f.y < 0.5 ? -1.0 : 1.0);
  vec2 db = 0.5 - abs(f - 0.5);                    // distance to nearest boundary on each axis
  vec2 m = 0.5 * (1.0 - smoothstep(0.0, w, db));  // blend toward neighbour
  vec3 col = cell(c, grid);
  // neighbour cells only matter inside the soft edge band (~40% of pixels): skip their taps elsewhere
  if (m.x > 0.0 || m.y > 0.0) {
    vec3 c10 = cell(c + vec2(sg.x, 0.0), grid);
    vec3 c01 = cell(c + vec2(0.0, sg.y), grid);
    vec3 c11 = cell(c + sg, grid);
    col = mix(mix(col, c10, m.x), mix(c01, c11, m.x), m.y);
  }
  // restrained palette: contrast/saturation nudge, then 9 levels per channel (729 colours) so tones band like retro pixel art
  col = saturate3((col - 0.5) * 1.08 + 0.5, 1.12);
  col = floor(clamp(col, 0.0, 1.0) * 8.0 + 0.5) / 8.0;
  float seam = smoothstep(0.0, w * 1.6, min(db.x, db.y));
  float bev = (0.5 - f.x) * 0.05 + (0.5 - f.y) * 0.05;
  gl_FragColor = vec4(clamp(col * (1.0 + bev) * (0.93 + 0.07 * seam), 0.0, 1.0), 1.0);
}
