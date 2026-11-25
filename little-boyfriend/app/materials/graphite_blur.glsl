// Pencil pass 0 (0.5 scale): luma at two gaussian-ish radii for the XDoG response. r = small, g = large, b = luma.
uniform sampler2D uSrc;
uniform vec2 uSize;
varying vec2 vUv;
void main() {
  vec2 px = 1.0 / uSize;
  float s1 = 0.0, s2 = 0.0, w1 = 0.0, w2 = 0.0;
  for (int j = -2; j <= 2; j++) {
    for (int i = -2; i <= 2; i++) {
      vec2 o = vec2(float(i), float(j));
      float w = exp(-dot(o, o) * 0.5);
      s1 += luma(texture2D(uSrc, vUv + o * px * 0.8).rgb) * w;   // sigma ~0.8 half-res px
      s2 += luma(texture2D(uSrc, vUv + o * px * 2.0).rgb) * w;   // sigma ~2.0 half-res px
      w1 += w;
    }
  }
  gl_FragColor = vec4(s1 / w1, s2 / w1, luma(texture2D(uSrc, vUv).rgb), 1.0);
}
