import * as THREE from 'three';
import palettesData from './palettes.json';

export type FinishKind =
  | 'matte' | 'brushed-metal' | 'polished-metal' | 'glitter'
  | 'pearl' | 'watercolor' | 'marbled' | 'glaze';

export const FINISH_ID: Record<FinishKind, number> = {
  matte: 0,
  'brushed-metal': 1,
  'polished-metal': 2,
  glitter: 3,
  pearl: 4,
  watercolor: 6,
  marbled: 7,
  glaze: 8,
};

const KINDS = new Set<string>(Object.keys(FINISH_ID));
type PaletteMeta = { id: string; finish?: unknown; colors: string[] };
const CATALOG = new Map<string, PaletteMeta>(palettesData.map(p => [p.id,p]));

function meta(id?: string): (PaletteMeta & { finish: FinishKind }) | undefined {
  if (!id) return undefined;
  const p = CATALOG.get(id);
  return p && typeof p.finish === 'string' && KINDS.has(p.finish) ? p as PaletteMeta & {finish: FinishKind} : undefined;
}

export function paletteFinish(paletteId?: string): FinishKind | undefined {
  return meta(paletteId)?.finish;
}
export function isCatalogPalette(paletteId?: string): boolean {
  return !!meta(paletteId);
}

export const FINISH_LABELS: Record<FinishKind, string> = {
  matte: 'Matte', 'brushed-metal': 'Brushed metal', 'polished-metal': 'Polished metal',
  glitter: 'Glitter', pearl: 'Pearl', watercolor: 'Watercolor', marbled: 'Marbled', glaze: 'Glaze',
};
export function finishLabel(id?: string): string {
  const f = paletteFinish(id);
  return f ? FINISH_LABELS[f] : '';
}

export function finishSwatchCSS(id?: string): string {
  const p = meta(id); if (!p) return '';
  const [a,b,c] = p.colors;
  switch (p.finish) {
    case 'matte': return '';
    case 'brushed-metal': return `repeating-linear-gradient(100deg,${a} 0 2px,${b} 2px 3px,${c} 3px 5px)`;
    case 'polished-metal': return `linear-gradient(115deg,${a},${c} 38%,#fff 50%,${b} 64%,${a})`;
    case 'glitter': return `radial-gradient(circle at 22% 28%,#fff 0 2%,transparent 3%),radial-gradient(circle at 68% 62%,${c} 0 2%,transparent 3%),linear-gradient(135deg,${a},${b})`;
    case 'pearl': return `linear-gradient(120deg,${a},#fff 36%,${b} 58%,${c})`;
    case 'watercolor': return `radial-gradient(circle at 28% 34%,${a} 0 28%,transparent 55%),radial-gradient(circle at 72% 66%,${c} 0 24%,transparent 58%),linear-gradient(${b},${b})`;
    case 'marbled': return `repeating-linear-gradient(128deg,${a} 0 9px,${b} 10px 17px,${c} 18px 23px)`;
    case 'glaze': return `linear-gradient(160deg,rgba(255,255,255,.72),transparent 34%),linear-gradient(135deg,${a},${b},${c})`;
  }
}

const TAU = Math.PI * 2;
const wrap = (x: number) => x - Math.floor(x);
function flatField(u: number, v: number): number {
  u = wrap(u); v = wrap(v);
  const s = 0.5 + 0.5 * Math.sin(TAU * u + 0.9 * Math.sin(TAU * v))
    * Math.cos(TAU * v - 0.7 * Math.sin(TAU * u));
  return wrap(s + 0.22 * Math.sin(TAU * (u - v)));
}
export function samplePaletteTint(paletteId: string | undefined, tint: number, u: number, v: number, flat = false): number {
  const f = paletteFinish(paletteId);
  if (!f) return tint;
  let t = THREE.MathUtils.clamp(tint, 0, 1);
  u = wrap(u); v = wrap(v);
  if (flat && f !== 'watercolor' && f !== 'marbled') return THREE.MathUtils.clamp(0.72 * flatField(u, v) + 0.28 * t, 0, 1);
  if (f === 'watercolor') {
    const bloom = 0.5 + 0.32 * Math.sin(TAU * u + 1.7 * Math.sin(TAU * v)) + 0.18 * Math.sin(TAU * (2 * u + v) + 0.6);
    const grain = 0.03 * Math.sin(TAU * (9 * u + 5 * v));
    return THREE.MathUtils.clamp(0.84 * bloom + 0.16 * t + grain, 0, 1);
  }
  if (f === 'marbled') {
    const swirl = 0.5 + 0.48 * Math.sin(TAU * (u + 0.35 * Math.sin(TAU * (v + 0.5 * u))) + TAU * v);
    return THREE.MathUtils.clamp(0.86 * swirl + 0.14 * t, 0, 1);
  }
  return t;
}

export const FINISH_TINT_GLSL = `
float myr5FlatPaletteTint(vec2 uv) {
  uv = fract(uv);
  float s = 0.5 + 0.5 * sin(6.2831853 * uv.x + 0.9 * sin(6.2831853 * uv.y))
    * cos(6.2831853 * uv.y - 0.7 * sin(6.2831853 * uv.x));
  return clamp(0.72 * fract(s + 0.22 * sin(6.2831853 * (uv.x - uv.y))) + 0.14, 0.0, 1.0);
}
float myr5FinishTint(float finish, float t, vec2 uv) {
  t = clamp(t, 0.0, 1.0); uv = fract(uv);
  if (finish == 6.0) {
    float bloom = 0.5 + 0.32 * sin(6.2831853 * uv.x + 1.7 * sin(6.2831853 * uv.y))
      + 0.18 * sin(6.2831853 * (2.0 * uv.x + uv.y) + 0.6);
    float grain = 0.03 * sin(6.2831853 * (9.0 * uv.x + 5.0 * uv.y));
    return clamp(0.84 * bloom + 0.16 * t + grain, 0.0, 1.0);
  }
  if (finish == 7.0) {
    float swirl = 0.5 + 0.48 * sin(6.2831853 * (uv.x + 0.35 * sin(6.2831853 * (uv.y + 0.5 * uv.x))) + 6.2831853 * uv.y);
    return clamp(0.86 * swirl + 0.14 * t, 0.0, 1.0);
  }
  return t;
}
`;

type Hooked = MeshPhysicalMaterialWithHooks;
type MeshPhysicalMaterialWithHooks = THREE.MeshPhysicalMaterial & {
  userData: Record<string, any>;
  defines?: Record<string,string>;
};

function addHook(mat: Hooked, kind: 'glitter' | 'brushed-metal'): void {
  mat.userData.__myr5FinishHooks ||= {};
  const hooks = mat.userData.__myr5FinishHooks as Record<string, boolean>;
  if (hooks[kind]) return;
  hooks[kind] = true;
  if (kind === 'glitter') mat.userData.myr5FinishGlitter = true;
  mat.defines={...mat.defines,USE_UV:''};
  const prev = mat.onBeforeCompile?.bind(mat);
  const vary = kind === 'glitter' ? 'vMyr5GlitterUv' : 'vMyr5BrushedUv';
  mat.onBeforeCompile = (shader, renderer) => {
    prev?.(shader, renderer);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\nvarying vec2 ${vary};`)
      .replace('#include <uv_vertex>', `#include <uv_vertex>\n${vary} = uv;`);
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>\nvarying vec2 ${vary};`
    );
    if (kind === 'glitter') {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        {
          vec2 gu = fract(${vary} * 83.0);
          float g = fract(sin(dot(floor(${vary} * 83.0), vec2(12.9898, 78.233))) * 43758.5453);
          float speck = step(0.92, g) * step(0.5, smoothstep(0.0, 0.08, min(gu.x, gu.y)));
          roughnessFactor = mix(roughnessFactor,0.055,speck);
        }`
      );
      shader.fragmentShader = shader.fragmentShader.replace('#include <dithering_fragment>', `{
        float grain=fract(sin(dot(floor(vMyr5GlitterUv*83.0),vec2(12.9898,78.233)))*43758.5453);
        vec3 flakeNormal=normalize(normal+vec3(sin(grain*91.0),cos(grain*73.0),0.0)*0.55);
        float glint=step(0.92,grain)*pow(max(dot(flakeNormal,normalize(vViewPosition)),0.0),42.0);
        gl_FragColor.rgb+=glint*1.8;
      }\n#include <dithering_fragment>`);
    } else {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        roughnessFactor = clamp(roughnessFactor + 0.055 * sin(6.2831853 * (fract(${vary}.y) * 90.0 + 0.15 * sin(6.2831853 * ${vary}.x))), 0.05, 1.0);`
      );
    }
  };
  const prevKey = mat.customProgramCacheKey?.bind(mat);
  mat.customProgramCacheKey = function () {
    return `${prevKey ? prevKey.call(this) : ''}|myr5-${kind}`;
  };
  mat.needsUpdate = true;
}

export function applyPaletteFinish(
  mat: THREE.MeshPhysicalMaterial,
  paletteId?: string,
  palette?: { primary: string; secondary: string; accent: string },
): void {
  const p = meta(paletteId);
  if (!p) return;
  const f = p.finish;
  mat.roughnessMap = null;
  mat.clearcoat = 0; mat.clearcoatRoughness = 0;
  mat.sheen = 0; (mat as any).sheenRoughness = 1; (mat as any).sheenColor?.set?.(0x000000);
  mat.iridescence = 0; mat.iridescenceIOR = 1.3; mat.iridescenceThicknessRange = [100, 400];
  (mat as any).anisotropy = 0;
  mat.transmission = 0; mat.thickness = 0; mat.ior = 1.5;
  switch (f) {
    case 'matte': mat.roughness = 0.92; mat.metalness = 0; break;
    case 'brushed-metal': mat.roughness = 0.44; mat.metalness = 0.82; (mat as any).anisotropy = 0.65; break;
    case 'polished-metal': mat.roughness = 0.16; mat.metalness = 0.92; break;
    case 'glitter': mat.roughness = 0.24; mat.metalness = 0.35; mat.clearcoat=1; mat.clearcoatRoughness=.035; mat.envMapIntensity=1.5; break;
    case 'pearl':
      mat.roughness = 0.3; mat.metalness = 0.08; mat.iridescence = 1;
      mat.iridescenceIOR = 1.35; mat.iridescenceThicknessRange = [120, 420]; break;
    case 'watercolor': mat.roughness = 0.96; mat.metalness = 0; break;
    case 'marbled': mat.roughness = 0.35; mat.metalness = 0.05; break;
    case 'glaze': mat.roughness = 0.24; mat.metalness = 0; mat.clearcoat = 1; mat.clearcoatRoughness = 0.08; break;
  }
  if (f === 'glitter') addHook(mat as Hooked, 'glitter');
  if (f === 'brushed-metal') addHook(mat as Hooked, 'brushed-metal');
  mat.needsUpdate = true;
}
