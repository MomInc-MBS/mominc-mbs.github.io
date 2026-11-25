// Kuwahara oil (extra look, pass 0 at 0.5 scale): classic 4-sector Kuwahara, radius 3 (49 taps) on the held pose.
// Re-implemented ES 1.00 after the algorithm in photo-art-filters-android `kuwahara_oil.frag` / GPUImageKuwaharaFilter
// (both read, neither copied: theirs use mip-blurred taps / dynamic loops). Picks the lowest-variance sector mean.
uniform sampler2D uSrc;
uniform vec2 uSize;
varying vec2 vUv;
void main() {
  vec2 px = 1.0 / uSize;
  vec3 m0 = vec3(0.0), m1 = vec3(0.0), m2 = vec3(0.0), m3 = vec3(0.0);
  vec3 s0 = vec3(0.0), s1 = vec3(0.0), s2 = vec3(0.0), s3 = vec3(0.0);
  for (int j = -3; j <= 3; j++) {
    for (int i = -3; i <= 3; i++) {
      vec3 c = texture2D(uSrc, vUv + vec2(float(i), float(j)) * px * 1.3).rgb;
      vec3 q = c * c;
      if (i <= 0 && j <= 0) { m0 += c; s0 += q; }
      if (i >= 0 && j <= 0) { m1 += c; s1 += q; }
      if (i >= 0 && j >= 0) { m2 += c; s2 += q; }
      if (i <= 0 && j >= 0) { m3 += c; s3 += q; }
    }
  }
  m0 /= 16.0; m1 /= 16.0; m2 /= 16.0; m3 /= 16.0;
  vec3 v0 = s0 / 16.0 - m0 * m0, v1 = s1 / 16.0 - m1 * m1, v2 = s2 / 16.0 - m2 * m2, v3 = s3 / 16.0 - m3 * m3;
  float e0 = v0.r + v0.g + v0.b, e1 = v1.r + v1.g + v1.b, e2 = v2.r + v2.g + v2.b, e3 = v3.r + v3.g + v3.b;
  vec3 best = m0; float bv = e0;
  if (e1 < bv) { bv = e1; best = m1; }
  if (e2 < bv) { bv = e2; best = m2; }
  if (e3 < bv) { best = m3; }
  gl_FragColor = vec4(best, 1.0);
}
