#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;   // screen-space tile/grid coordinates need fp32 (mediump = fp16 on most phones)
#endif
// Kuwahara oil final: saturated oil colour from the Kuwahara pass, soft tonal compression, faint canvas tooth.
uniform sampler2D uPass0;
uniform sampler2D uTex0;   // paper_tooth used as canvas
uniform vec2 uSize;
uniform float uRef;
varying vec2 vUv;
void main() {
  vec3 b = texture2D(uPass0, vUv).rgb;
  float l = luma(b);
  vec3 c = saturate3(relight(b, 0.5 + (l - 0.5) * 0.92), 1.2);
  float t = texture2D(uTex0, vUv * uSize / (512.0 * uRef * 0.8)).r - 0.5;
  c *= 1.0 + t * 0.12;
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}
