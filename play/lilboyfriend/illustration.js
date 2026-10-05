import { cel, gradientMap } from './sakura/toon.js?objects=12';

// Keep photographs, printed lettering, glass and the engraved device hardware.
// Broad surfaces get the same cel ramp and tinted shadows as the reference.
export function illustrate(root) {
  const replacements = new Map();
  root.traverse(object => {
    if (!object.isMesh) return;
    const convert = material => {
      if (!material?.isMeshStandardMaterial || material.transparent || material.metalness > .3) return material;
      if (replacements.has(material)) return replacements.get(material);
      const next = cel({ color: material.color, bands: 3, flat: false,
        tint: 0x8275a6, side: material.side,
        map: material.userData.authoredSurface ? material.map : material.userData.surface || material.bumpMap ? null : material.map,
        emissive: material.emissive, emissiveIntensity: Math.min(material.emissiveIntensity, .35),
        alphaTest: material.alphaTest, vertexColors: material.vertexColors, cache: false });
      next.name = material.name;
      next.color = material.color;
      next.emissive = material.emissive;
      replacements.set(material, next);
      return next;
    };
    object.material = Array.isArray(object.material) ? object.material.map(convert) : convert(object.material);
  });
  return () => { for (const material of replacements.values()) material.dispose(); };
}
export function disposeIllustrationRamps() { gradientMap(3).dispose(); }
