// Strong flatten pass (0.5 scale): second vertical cross-bilateral.
uniform sampler2D uSrc;
uniform sampler2D uPass2;
uniform vec2 uSize;
varying vec2 vUv;
void main() { gl_FragColor = bilatAxis(uPass2, uSrc, vUv, vec2(0.0, 2.0 / uSize.y), 0.15); }
