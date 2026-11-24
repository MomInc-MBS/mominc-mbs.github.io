// Site-owned: rasterize the exact paper Coach (renderPaperCoach, viewBox 0 0 200 240) once into a canvas
// the vendored game draws with drawImage. One decode per round; the object URL is released immediately.
import {renderPaperCoach} from '../../tv/channels/girlfriend-roster.js';

export async function rasterizePaper(batch, scale = 3) {
  const w = 200 * scale, h = 240 * scale;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" width="${w}" height="${h}">${renderPaperCoach(batch)}</svg>`;
  const url = URL.createObjectURL(new Blob([svg], {type: 'image/svg+xml'}));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    return canvas;
  } finally { URL.revokeObjectURL(url); }
}

/** Free the bitmap when the round ends. */
export const releasePaper = canvas => { if (canvas) { canvas.width = 0; canvas.height = 0; } };
