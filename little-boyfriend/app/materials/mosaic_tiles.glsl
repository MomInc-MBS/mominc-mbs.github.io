#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;   // frame-anchored tile coordinates need fp32
#endif
// Mosaic (single pass): glazed ceramic tesserae on a square grid fixed to the frame. Per tile: area-averaged source colour (5 taps),
// soft glaze-level palette, per-tile tone/hue jitter, slightly wobbly rounded tile outline (each tile cut a little differently),
// bevel lit from the upper left, soft glaze highlight. Grout = warm grey with shadow against the tile edge. Formula-level reference:
// photo-art-filters-android ceramic_tiles.frag (grout/bevel/shine structure), code rewritten for ES 1.00.
uniform sampler2D uSrc;
uniform vec2 uSize;
uniform float uRef;
varying vec2 vUv;
const float TILE = 26.0;   // ref px
vec3 tileCol(vec2 c, vec2 grid) {
  vec2 ctr = (c + 0.5) / grid, q = 0.3 / grid;
  return 0.28 * texture2D(uSrc, ctr).rgb + 0.18 * (texture2D(uSrc, ctr + vec2(q.x, q.y)).rgb + texture2D(uSrc, ctr + vec2(-q.x, q.y)).rgb
       + texture2D(uSrc, ctr + vec2(q.x, -q.y)).rgb + texture2D(uSrc, ctr + vec2(-q.x, -q.y)).rgb);
}
void main() {
  vec2 grid = uSize / (TILE * uRef);
  vec2 p = vUv * grid;
  vec2 c = clamp(floor(p), vec2(0.0), floor(grid));
  vec2 f = p - c - 0.5;
  vec2 h = hash22(c + vec2(5.1, 2.3));
  vec3 col = saturate3(tileCol(c, grid), 1.38);
  col = mix(col, vec3(softQuant(col.r, 8.0, 0.2), softQuant(col.g, 8.0, 0.2), softQuant(col.b, 8.0, 0.2)), 0.55);   // limited glaze palette
  col *= 0.93 + 0.20 * h.y;                                  // per-tile tone
  col += (vec3(h.x, h.y, h.x) - 0.5) * 0.05;                 // per-tile hue nudge
  float aa = 0.8 / TILE;
  float half_ = 0.5 - 1.5 / TILE - 0.03 * h.x;               // tile half size: grout ~2.4 ref px plus wobble
  float d = sdRBox(f - (h - 0.5) * 0.05, vec2(half_), 0.13);
  float inside = 1.0 - smoothstep(-aa, aa, d);
  float rim = 1.0 - smoothstep(0.0, 0.14, -d);               // bevel band
  float side = clamp((-f.x + f.y) * 1.6, -1.0, 1.0);        // light from the upper left (uv y is up)
  col *= 1.0 + rim * side * 0.22;
  float sp = 1.0 - smoothstep(0.0, 0.34, length((f - vec2(-0.14, 0.17)) * vec2(1.0, 1.5)));
  col += sp * sp * (0.07 + 0.12 * h.x);                       // glaze highlight
  col *= 1.0 + 0.04 * snoise(p * 2.7 + c);                    // faint glaze unevenness
  vec3 grout = vec3(0.50, 0.48, 0.45) * (0.88 + 0.12 * snoise(p * 7.0));
  grout *= 0.55 + 0.38 * smoothstep(0.0, 0.16, d);            // shadow in the joint next to a tile
  gl_FragColor = vec4(clamp(mix(grout, col, inside), 0.0, 1.0), 1.0);
}
