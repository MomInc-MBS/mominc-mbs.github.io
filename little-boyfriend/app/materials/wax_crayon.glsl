#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#endif
// Crayon (final pass after base_h/base_v): waxy colour strokes over paper tooth. Flattened base colour, saturated + 7-level soft
// palette; wax coverage = pressure (darker / more saturated = heavier) + elongated static stroke streaks (two stroke angles chosen by a
// low-frequency field) + paper tooth (uTex0 paper_tooth.png, so the paper grain shows through light strokes); bold soft outline from the base.
// Everything is anchored to the frame (ref-px coordinates), never uSeed. Reference: photo-art-filters-android wax_crayon.frag (coverage vs tooth,
// outline mix); rewritten.
uniform sampler2D uPass1;
uniform sampler2D uTex0;   // paper_tooth
uniform vec2 uSize;
uniform float uRef;
varying vec2 vUv;
void main() {
  vec2 pr = vUv * uSize / uRef;                           // ref px, frame anchored
  vec3 b = texture2D(uPass1, vUv).rgb;
  vec3 c = saturate3(b, 1.3);
  c = mix(c, vec3(softQuant(c.r, 7.0, 0.2), softQuant(c.g, 7.0, 0.2), softQuant(c.b, 7.0, 0.2)), 0.6);
  c = clamp(c * 1.04, 0.0, 1.0);
  float tooth = texture2D(uTex0, pr / 768.0).r;           // ~1.5 ref px grain
  float fld = snoise(pr * 0.0035 + 3.0);                  // which stroke direction (low frequency)
  float ang = fld > 0.0 ? 0.62 : -0.78;
  vec2 dir = vec2(cos(ang), sin(ang)), per = vec2(-dir.y, dir.x);
  float al = dot(pr, dir), ac = dot(pr, per);
  float str = snoise(vec2(ac * 0.085, al * 0.0055) + 11.0) * 0.6 + snoise(vec2(ac * 0.31, al * 0.02) + 4.0) * 0.4;
  float sat = max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b));
  float pressure = 0.52 + 0.45 * (1.0 - luma(c)) + 0.35 * sat;
  float cover = smoothstep(0.34, 0.68, pressure + 0.20 * str + 0.55 * (tooth - 0.5));
  vec3 paper = vec3(0.975, 0.955, 0.905) * (0.94 + 0.10 * tooth);
  vec3 wax = c * (0.90 + 0.18 * tooth) * (1.0 - 0.06 * str);
  vec3 col = mix(paper, mix(paper, c, 0.45) * (0.96 + 0.06 * tooth), smoothstep(0.10, 0.40, cover));   // thin wax tint
  col = mix(col, wax, smoothstep(0.35, 0.80, cover));
  // bold soft outline: sobel of the flattened base, wide ring, broken up by the paper tooth like a pressed crayon edge
  vec2 g = sobelLuma(uPass1, vUv, 2.4 * uRef / uSize);
  float e = smoothstep(0.14, 0.42, length(g)) * (0.62 + 0.55 * tooth);
  col = mix(col, c * 0.28 + 0.03, clamp(e, 0.0, 0.85));
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
