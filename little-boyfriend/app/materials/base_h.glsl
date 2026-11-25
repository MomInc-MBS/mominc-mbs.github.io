// Shared base pass 0 (0.5 scale): horizontal cross-bilateral flatten of the held pose.
uniform sampler2D uSrc;
uniform vec2 uSize;
varying vec2 vUv;
void main() { gl_FragColor = bilatAxis(uSrc, uSrc, vUv, vec2(1.3 / uSize.x, 0.0), 0.11); }
