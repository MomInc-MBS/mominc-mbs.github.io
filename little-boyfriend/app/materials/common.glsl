// Material Worlds shared functions. GLSL ES 1.00. Prepended to every pass (after the runtime's precision line).
// No uniforms/varyings are declared here: each pass declares only what it uses.
// Functions take samplers as parameters (legal in ES 1.00).

#ifdef GL_FRAGMENT_PRECISION_HIGH
#define HP highp
#else
#define HP mediump
#endif

float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

// tanh without the ES3 builtin; clamped so no driver returns NaN
float tanh1(float x) { x = clamp(x, -9.0, 9.0); float e = exp(2.0 * x); return (e - 1.0) / (e + 1.0); }

// Plateaus at integers 0..n-1 (returned normalised to 0..1); transitions are `soft` wide (0..0.5) and centred
// half way between levels, so thresholds are soft and band edges do not flicker on tiny luma noise.
float softQuant(float x, float n, float soft) {
  float v = clamp(x, 0.0, 1.0) * (n - 1.0);
  float f = floor(v);
  return (f + smoothstep(0.5 - soft, 0.5 + soft, v - f)) / (n - 1.0);
}

// Recolour keeping chroma: scale rgb so its luma becomes `target`, ratio clamped so near-black never explodes.
vec3 relight(vec3 c, float target) {
  float l = max(luma(c), 0.02);
  return clamp(c * clamp(target / l, 0.4, 2.2), 0.0, 1.0);
}

vec3 saturate3(vec3 c, float s) { return mix(vec3(luma(c)), c, s); }

// ---- separable cross-bilateral (7 taps / axis). `step` = one tap in uv along the axis.
// Spatial gaussian x range weight from the guide image (colour distance), so it flattens but keeps edges.
vec4 bilatAxis(sampler2D img, sampler2D guide, vec2 uv, vec2 step, float sigR) {
  vec3 g0 = texture2D(guide, uv).rgb;
  vec4 acc = vec4(0.0);
  float wsum = 0.0;
  float inv = 1.0 / (2.0 * sigR * sigR);
  for (int i = -3; i <= 3; i++) {
    float fi = float(i);
    vec2 p = uv + step * fi;
    vec3 d = texture2D(guide, p).rgb - g0;
    float w = exp(-fi * fi * 0.22 - dot(d, d) * inv);
    acc += texture2D(img, p) * w;
    wsum += w;
  }
  return acc / wsum;
}

// ---- 3x3 Sobel on luma of `t`. px = uv step of one sample ring. Returns (gx, gy).
vec2 sobelLuma(sampler2D t, vec2 uv, vec2 px) {
  float tl = luma(texture2D(t, uv + vec2(-px.x, -px.y)).rgb);
  float tc = luma(texture2D(t, uv + vec2(0.0, -px.y)).rgb);
  float tr = luma(texture2D(t, uv + vec2(px.x, -px.y)).rgb);
  float ml = luma(texture2D(t, uv + vec2(-px.x, 0.0)).rgb);
  float mr = luma(texture2D(t, uv + vec2(px.x, 0.0)).rgb);
  float bl = luma(texture2D(t, uv + vec2(-px.x, px.y)).rgb);
  float bc = luma(texture2D(t, uv + vec2(0.0, px.y)).rgb);
  float br = luma(texture2D(t, uv + vec2(px.x, px.y)).rgb);
  return vec2((tr + 2.0 * mr + br) - (tl + 2.0 * ml + bl), (bl + 2.0 * bc + br) - (tl + 2.0 * tc + tr));
}

// ---- XDoG response (Winnemoeller 2006): d = (1+p) g1 - p g2 ; v = d>=eps ? 1 : 1 + tanh(phi (d-eps)). 1 = paper, 0 = ink.
// g1 / g2 = luma blurred at small / large sigma. xdogRel removes the absolute luma level (d' = 1 + p (g1-g2)), so flat
// dark areas stay paper and only local dark ridges/edges become lines (the "lite" part: line mask only, no tone threshold).
float xdogResp(float d, float eps, float phi) { return d >= eps ? 1.0 : 1.0 + tanh1(phi * (d - eps)); }
float xdog(float g1, float g2, float p, float eps, float phi) { return xdogResp((1.0 + p) * g1 - p * g2, eps, phi); }
float xdogRel(float g1, float g2, float p, float eps, float phi) { return xdogResp(1.0 + p * (g1 - g2), eps, phi); }

// ---- stable per-pixel hash (screen-space; only used for static dither, never animated)
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// ---- webgl-noise 2D simplex (Ashima Arts / Stefan Gustavson, MIT; see NOTICE.md). Needs highp to be exact.
HP vec3 mod289(HP vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
HP vec2 mod289(HP vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
HP vec3 permute(HP vec3 x) { return mod289(((x * 34.0) + 10.0) * x); }
HP float snoise(HP vec2 v) {
  const HP vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  HP vec2 i = floor(v + dot(v, C.yy));
  HP vec2 x0 = v - i + dot(i, C.xx);
  HP vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  HP vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  HP vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  HP vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  HP vec3 x = 2.0 * fract(p * C.www) - 1.0;
  HP vec3 h = abs(x) - 0.5;
  HP vec3 ox = floor(x + 0.5);
  HP vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  HP vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// ---- Round 2 (new looks) helpers. Appended; everything above is unchanged.
// two stable hashes of an integer cell id (screen/frame-anchored patterns only; never animated)
vec2 hash22(vec2 p) { return vec2(hash21(p), hash21(p + vec2(17.13, 5.71))); }
// distance from p to the segment a-b (capsule core)
float sdSeg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0)); }
// signed distance to a rounded box of half size `hb` and corner radius `r`
float sdRBox(vec2 p, vec2 hb, float r) { vec2 q = abs(p) - hb + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
