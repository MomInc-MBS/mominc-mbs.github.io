// Site-owned round logic shared by the Dr Girlfriend page and the Coach Jump PWA. Pure, no DOM.
import {PAPER_SHAPES, PAPER_PALETTES, createPaperBatch} from '../../tv/channels/girlfriend-roster.js';

export const ROUND_KEY = 'mbs-app-jump-round-v1';

/** The one original MYR5 recipe: tubes poured in scene order 0..count-1. */
export const isOriginalOrder = (order, count) =>
  Array.isArray(order) && order.length === count && order.every((index, position) => index === position);

/** Original MYR5 keeps the goggles reveal; every other generated Coach jumps. */
export const branchFor = batch => (batch && batch.special === true ? 'reveal' : 'jump');

const valid = b => b && typeof b === 'object' && PAPER_SHAPES.some(s => s.id === b.shapeId)
  && PAPER_PALETTES.some(p => p.id === b.paletteId) && Number.isInteger(b.eyes) && b.eyes >= 1 && b.eyes <= 5;

/** Standalone: resume the saved round's Coach, or generate one and save it. */
export function currentRound(store, random = Math.random) {
  try {
    const saved = JSON.parse(store.getItem(ROUND_KEY));
    if (valid(saved && saved.batch)) return {batch: saved.batch, resumed: true};
  } catch { /* fall through to a new round */ }
  const batch = createPaperBatch(random);
  try { store.setItem(ROUND_KEY, JSON.stringify({v: 1, batch})); } catch { /* still playable unsaved */ }
  return {batch, resumed: false};
}

/** A finished (died / won) round: the next one generates a new Coach. */
export function finishRound(store) {
  try { store.removeItem(ROUND_KEY); } catch { /* ignore */ }
}
