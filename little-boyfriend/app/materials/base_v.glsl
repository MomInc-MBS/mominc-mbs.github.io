// Shared base pass 1 (0.5 scale): vertical cross-bilateral, guided by the sharp source so edges stay put.
uniform sampler2D uSrc;
uniform sampler2D uPass0;
uniform vec2 uSize;
varying vec2 vUv;
void main() { gl_FragColor = bilatAxis(uPass0, uSrc, vUv, vec2(0.0, 1.3 / uSize.y), 0.11); }
