import { REGIONS, type RegionId } from './catalog.ts';
import type { Selection } from './recipe.ts';

export const HAND_SHAPES = [
  { id: 'original', name: 'Original', styleId: 0 },
  { id: 'skeletal', name: 'Skeletal', styleId: 7 },
  { id: 'mechanical', name: 'Mechanical', styleId: 18 },
  { id: 'stone', name: 'Stone', styleId: 13 },
  { id: 'fluffy', name: 'Fluffy', styleId: 20 },
  { id: 'jelly', name: 'Jelly', styleId: 21 },
  { id: 'baby', name: 'Baby', styleId: 22 },
] as const;
export type ShapeScope = 'hand' | 'section';

export function selectHandShape(selection: Selection, shapeId: string, scope: ShapeScope, region: RegionId, locks: readonly RegionId[]): Selection {
  const shape = HAND_SHAPES.find(item => item.id === shapeId);
  if (!shape) throw new Error('Choose a valid hand shape.');
  if (scope !== 'hand' && scope !== 'section') throw new Error('Choose a valid shape target.');
  if (!REGIONS.some(item => item.id === region)) throw new Error('Choose a valid section.');
  return Object.fromEntries(REGIONS.map(item => [
    item.id,
    (scope === 'hand' || item.id === region) && !locks.includes(item.id) ? shape.styleId : selection[item.id],
  ])) as Selection;
}

export function activeHandShape(selection: Selection, scope: ShapeScope, region: RegionId): string | null {
  const values = scope === 'hand' ? Object.values(selection) : [selection[region]];
  return HAND_SHAPES.find(shape => values.every(id => id === shape.styleId))?.id ?? null;
}
