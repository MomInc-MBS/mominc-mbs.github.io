#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;   // frame-anchored cell coordinates need fp32 (mediump = fp16 on most phones)
#endif
// Stained Glass (final pass, after base_h/base_v): Voronoi glass panes on a cell layout fixed to the frame (hash of the cell id,
// never uSeed), pane colour = flattened source colour at the pane seed, saturated and backlit, dark lead came along pane borders
// AND along strong contours of the flattened base (so faces / hands / room shapes stay readable), static ripple + seedy bubbles
// inside the glass, darker toward each pane edge. Constant 3x3 neighbour search (+ 3x3 for the exact bisector distance).
// Voronoi border distance idea after the public "distance to borders" construction; formula-level only, code is ours.
uniform sampler2D uPass1;
uniform vec2 uSize;
uniform float uRef;
varying vec2 vUv;
const float PANE = 28.0;   // ref px per cell (22 was too busy at phone size: ~4 px panes in a 300 px tile)
vec2 seedOf(vec2 cell) { return cell + 0.5 + (hash22(cell + vec2(3.7, 9.1)) - 0.5) * 0.84; }
void main() {
  vec2 grid = uSize / (PANE * uRef);
  vec2 p = vUv * grid;
  vec2 ip = floor(p);
  float dmin = 1e9; vec2 sb = vec2(0.0); vec2 cb = vec2(0.0);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 c = ip + vec2(float(i), float(j)); vec2 s = seedOf(c); vec2 d = p - s; float dd = dot(d, d);
    if (dd < dmin) { dmin = dd; sb = s; cb = c; }
  }
  float dB = 1e9;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 s = seedOf(ip + vec2(float(i), float(j))); vec2 e = s - sb;
    if (dot(e, e) > 1e-5) dB = min(dB, dot(0.5 * (sb + s) - p, normalize(e)));
  }
  // pane colour at the seed (5 taps of the flattened base, 0.25 cell apart), local colour used only where a contour splits the pane
  vec2 su = sb / grid, q = 0.25 / grid;
  vec3 c0 = 0.4 * texture2D(uPass1, su).rgb + 0.15 * (texture2D(uPass1, su + vec2(q.x, 0.0)).rgb + texture2D(uPass1, su - vec2(q.x, 0.0)).rgb
          + texture2D(uPass1, su + vec2(0.0, q.y)).rgb + texture2D(uPass1, su - vec2(0.0, q.y)).rgb);
  vec3 loc = texture2D(uPass1, vUv).rgb;
  vec3 col = mix(c0, loc, 0.8 * smoothstep(0.10, 0.28, length(loc - c0)));
  // near-neutral panes (white walls, grey shirts) would read as bare paper: tint them with a per-pane pastel glass colour
  vec2 hp = hash22(cb + vec2(11.0, 29.0));
  float chroma = max(col.r, max(col.g, col.b)) - min(col.r, min(col.g, col.b));
  vec3 tint = hp.x < 0.25 ? vec3(1.0, 0.90, 0.60) : (hp.x < 0.5 ? vec3(0.70, 0.86, 1.0) : (hp.x < 0.75 ? vec3(0.74, 0.98, 0.80) : vec3(1.0, 0.76, 0.80)));   // pale amber / ice / mint / blush
  float neutral = 1.0 - smoothstep(0.04, 0.20, chroma);
  col = mix(col, col * tint * 1.08, 0.5 * neutral);
  col *= 0.93 + 0.14 * hp.y;                            // per-pane tone variation (hand-cut glass)
  // glass: saturated, luminous, keep deep darks deep
  col = saturate3(col, 1.7);
  col = relight(col, 0.13 + 0.70 * pow(clamp(luma(col), 0.0, 1.0), 0.8));
  float inner = smoothstep(0.0, 0.5, dB);
  col *= mix(0.74, 1.12, inner);
  col += col * col * 0.3 * inner;                       // backlit glow, strongest mid-pane
  float rip = snoise(p * 1.6 + cb * 7.3);               // static ripple, fixed to the frame
  float str = snoise(p * vec2(0.6, 4.5) + cb * 3.1);    // fine drawn streaks
  col *= 1.0 + 0.07 * rip + 0.035 * str;
  vec2 hb = hash22(cb + vec2(41.0, 7.0));               // seedy bubble in ~40% of panes
  float bd = length(p - (sb + (hb - 0.5) * 0.5));
  float bub = step(0.6, hb.x) * (smoothstep(0.11, 0.07, bd) - 0.6 * smoothstep(0.06, 0.02, bd));
  col = col * (1.0 + 0.35 * bub * inner) + 0.12 * bub * inner;
  // lead came: pane borders (3.6 ref px) + strong contours of the flattened base (sobel, 1.6 ref px ring)
  float aa = 0.8 / PANE;
  // busy panes (faces, hands, room detail) get thinner pane lead so the contour lead carries the features
  float busy = smoothstep(0.10, 0.35, length(sobelLuma(uPass1, su, 4.0 * uRef / uSize)));
  float lw = (2.0 - 0.8 * busy) / PANE;
  float lead = 1.0 - smoothstep(lw - 0.5 * aa, lw + 0.5 * aa, dB);
  vec2 g = sobelLuma(uPass1, vUv, 1.9 * uRef / uSize);
  lead = max(lead, 0.97 * smoothstep(0.13, 0.30, length(g)));
  vec3 came = vec3(0.060, 0.058, 0.066) + 0.05 * smoothstep(0.0, 0.6, rip + 0.5);   // dull grey metal, faint unevenness
  gl_FragColor = vec4(clamp(mix(col, came, lead), 0.0, 1.0), 1.0);
}
