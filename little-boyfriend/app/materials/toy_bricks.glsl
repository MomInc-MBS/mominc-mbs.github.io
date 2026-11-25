#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#endif
// Toy Bricks (single pass): one plastic stud brick per cell of a frame-anchored grid. Colour = area-averaged source mapped to the
// nearest colour of a fixed toy-plastic palette (21 colours); brick seam + upper-left bevel, round stud with drop shadow,
// rim light/shade and a small specular dot. Reference: photo-art-filters-android lego_bricks.frag (stud / rim structure); rewritten.
uniform sampler2D uSrc;
uniform vec2 uSize;
uniform float uRef;
varying vec2 vUv;
const float BR = 19.0;   // ref px per brick
vec3 pal(vec3 c) {
  vec3 best = vec3(0.93, 0.93, 0.90); float bd = 9.0;
#define PC(r, g, b) { vec3 k = vec3(r, g, b); vec3 e = c - k; float d = dot(e, e); if (d < bd) { bd = d; best = k; } }
  PC(0.93, 0.93, 0.90) PC(0.62, 0.63, 0.64) PC(0.27, 0.28, 0.30) PC(0.08, 0.08, 0.09)   // white, light grey, dark grey, black
  PC(0.80, 0.10, 0.12) PC(0.96, 0.46, 0.08) PC(0.98, 0.80, 0.10) PC(0.64, 0.78, 0.12)   // red, orange, yellow, lime
  PC(0.10, 0.55, 0.22) PC(0.05, 0.30, 0.18) PC(0.10, 0.30, 0.75) PC(0.35, 0.65, 0.90)   // green, dark green, blue, sky
  PC(0.45, 0.22, 0.60) PC(0.93, 0.45, 0.62) PC(0.82, 0.66, 0.42) PC(0.38, 0.22, 0.12)   // purple, pink, tan, brown
  PC(0.58, 0.34, 0.22) PC(0.27, 0.16, 0.11) PC(0.93, 0.76, 0.62) PC(0.70, 0.43, 0.29) PC(0.80, 0.50, 0.36)                                                                   // warm skin tan
  return best;
}
void main() {
  vec2 grid = uSize / (BR * uRef);
  vec2 p = vUv * grid;
  vec2 c = clamp(floor(p), vec2(0.0), floor(grid));
  vec2 f = p - c - 0.5;
  vec2 ctr = (c + 0.5) / grid, q = 0.3 / grid;
  vec3 s = 0.28 * texture2D(uSrc, ctr).rgb + 0.18 * (texture2D(uSrc, ctr + vec2(q.x, q.y)).rgb + texture2D(uSrc, ctr + vec2(-q.x, q.y)).rgb
         + texture2D(uSrc, ctr + vec2(q.x, -q.y)).rgb + texture2D(uSrc, ctr + vec2(-q.x, -q.y)).rgb);
  vec3 base = pal(saturate3((s - 0.5) * 1.12 + 0.5, 1.2) + (hash22(c + vec2(2.0, 6.0)).x - 0.5) * 0.05);   // +-2.5% fixed per-cell dither so smooth ramps break into mixed bricks
  vec2 L = normalize(vec2(-1.0, 1.0));               // light from the upper left (uv y up)
  float aa = 0.8 / BR;
  vec2 a = abs(f);
  float edge = 0.5 - max(a.x, a.y);                   // distance to the brick edge
  float rimB = 1.0 - smoothstep(0.0, 0.08, edge);
  float sideB = clamp((-f.x + f.y) * 1.5, -1.0, 1.0);
  vec3 col = base * (1.0 + 0.20 * rimB * sideB);
  col *= 0.62 + 0.38 * smoothstep(0.0, 0.05, edge);   // seam between bricks
  // stud: shadow on the brick top, then the cylinder wall (rim light / shade) and its top face
  float dd = length(f);
  float shadow = 1.0 - smoothstep(0.29, 0.29 + 0.07, length(f - vec2(0.06, -0.06)));
  col *= 1.0 - 0.34 * shadow;
  float stud = 1.0 - smoothstep(0.285 - aa, 0.285 + aa, dd);
  float wall = dot(normalize(f + 1e-4), L) * smoothstep(0.17, 0.285, dd);
  vec3 studCol = base * (1.07 + 0.30 * wall);
  float sp = 1.0 - smoothstep(0.0, 0.075, length(f - vec2(-0.085, 0.085)));
  studCol += 0.30 * sp * sp;
  col = mix(col, studCol, stud);
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
