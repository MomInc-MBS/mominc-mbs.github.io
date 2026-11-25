// Anime final: soft luma bands on the flattened base (chroma preserved) + thin grey ink from its gradient.
uniform sampler2D uSrc;
uniform sampler2D uPass1;
uniform vec2 uSize;
uniform float uRef;
varying vec2 vUv;
void main() {
  vec2 ru = uRef / uSize;
  vec3 b = texture2D(uPass1, vUv).rgb;
  float l = luma(b);
  float lq = mix(l, softQuant(l * 0.94 + 0.04, 6.0, 0.2) * 0.96 + 0.03, 0.85);
  vec3 c = saturate3(relight(b, lq), 1.18);
  // ink: Sobel on the already flattened base (texture/noise never reaches it), 1.2 ref-px ring
  vec2 g = sobelLuma(uPass1, vUv, ru * 1.2);
  float e = smoothstep(0.16, 0.34, length(g));
  c = mix(c, vec3(0.20, 0.19, 0.23), e * 0.78);
  gl_FragColor = vec4(c, 1.0);
}
