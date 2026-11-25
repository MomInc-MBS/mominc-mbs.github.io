#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;   // screen-space tile/grid coordinates need fp32 (mediump = fp16 on most phones)
#endif
// Painted World (gouache, round 2): opaque soft paint. Compressed tones (no black), saturated flat colour, static brush texture
// whose direction follows the local edge flow (wide Sobel so the field is smooth) in 45-degree steps with a linear cross-fade, and
// fades to a fixed stroke direction on flat areas, so it cannot swim. The streak atlas is made 180-degree symmetric (two taps) so
// a gradient flipping sign across a ridge (cheek highlight) no longer swaps the pattern = no seam. Strokes are wider (bristle ~6 ref px)
// and fade out on bright flat areas (white wall, sky stay opaque flat paint).
uniform sampler2D uPass1;
uniform sampler2D uTex0;   // brush (horizontal streaks)
uniform vec2 uSize;
uniform float uRef;
varying vec2 vUv;
vec2 rot(vec2 p, float a) { float c = cos(a), s = sin(a); return vec2(c * p.x - s * p.y, s * p.x + c * p.y); }
float brush1(vec2 q, float a) { return texture2D(uTex0, rot(q, a) / (512.0 * uRef * 2.0)).r - 0.5; }
// 180-degree symmetric: stroke direction is a line, not an arrow
float brush(vec2 q, float a) { return (brush1(q, a) + brush1(q, a + 3.1415927)) * 0.9; }
void main() {
  vec2 ru = uRef / uSize;
  vec3 b = texture2D(uPass1, vUv).rgb;
  float l = luma(b);
  float lc = 0.5 + (l - 0.5) * 0.82;
  vec3 c = saturate3(relight(b, lc * 0.92 + 0.08), 1.15);
  vec2 g = sobelLuma(uPass1, vUv, ru * 5.0);
  float mag = length(g);
  float a = atan(g.y, g.x) + 1.5707963;                // along the edge
  float q = a / 0.78539816;
  float f = floor(q), t = fract(q);
  vec2 px = vUv * uSize;
  float oriented = mix(brush(px, f * 0.78539816), brush(px, (f + 1.0) * 0.78539816), smoothstep(0.15, 0.85, t));
  float fixedDir = brush(px, 0.35);
  float w = smoothstep(0.10, 0.45, mag) * 0.5;
  float br = mix(fixedDir, oriented, w);
  float bright = smoothstep(0.55, 0.9, l);
  float calm = 0.4 + 0.6 * smoothstep(0.05, 0.3, mag);   // calm on flat walls, marks where the form turns
  c *= 1.0 + br * 0.15 * calm * (1.0 - 0.75 * bright);
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}
