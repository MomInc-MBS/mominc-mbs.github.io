// Pencil pass 2 (0.5 scale): luma of the bilateral-flattened base (uPass1) at two radii for the XDoG response.
// a = fine dark-ridge strength*8 (ring mean at 3.6 ref px minus centre luma; computed here at half res to save full-res taps).
// r = sigma ~1.1 half-res px, g = sigma ~3 (also the smooth tone for hatching), b = centre luma. Wider than graphite_blur
// so photo noise / skin texture never reaches the line mask or the hatch tone.
uniform sampler2D uPass1;
uniform vec2 uSize;
uniform float uRef;
varying vec2 vUv;
void main() {
  vec2 px = 1.0 / uSize;
  float s1 = 0.0, s2 = 0.0, w1 = 0.0;
  for (int j = -2; j <= 2; j++) {
    for (int i = -2; i <= 2; i++) {
      vec2 o = vec2(float(i), float(j));
      float w = exp(-dot(o, o) * 0.5);
      s1 += luma(texture2D(uPass1, vUv + o * px * 1.7).rgb) * w;
      s2 += luma(texture2D(uPass1, vUv + o * px * 3.6).rgb) * w;
      w1 += w;
    }
  }
  float c0 = luma(texture2D(uPass1, vUv).rgb);
  float ring = 0.0;
  for (int k = 0; k < 8; k++) {
    float a = float(k) * 0.7853982;
    ring += luma(texture2D(uPass1, vUv + vec2(cos(a), sin(a)) * 3.6 * 0.5 * uRef / uSize).rgb);
  }
  gl_FragColor = vec4(s1 / w1, s2 / w1, c0, clamp((ring * 0.125 - c0) * 8.0, 0.0, 1.0));
}
