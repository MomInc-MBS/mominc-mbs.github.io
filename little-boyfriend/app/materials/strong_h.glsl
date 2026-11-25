// Strong flatten pass (0.5 scale): second horizontal cross-bilateral over the previous result, wider step, sharp-source guide.
uniform sampler2D uSrc;
uniform sampler2D uPass1;
uniform vec2 uSize;
varying vec2 vUv;
void main() { gl_FragColor = bilatAxis(uPass1, uSrc, vUv, vec2(2.0 / uSize.x, 0.0), 0.15); }
