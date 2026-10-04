// Offline contract and complete rendering coverage for generated paper coaches.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source = await readFile(new URL('../tv/channels/girlfriend-roster.js', import.meta.url), 'utf8');
const {PAPER_SHAPES, PAPER_PALETTES, createPaperBatch, renderPaperCoach} = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
assert.equal(PAPER_SHAPES.length, 71);
assert.equal(PAPER_PALETTES.length, 24);
assert.equal(new Set(PAPER_SHAPES.map(shape => shape.id)).size, 71);
assert.equal(new Set(PAPER_SHAPES.map(shape => shape.paths[0].d)).size, 71, 'Every actual model has a distinct silhouette');
assert.equal(new Set(PAPER_PALETTES.map(palette => palette.id)).size, 24);
assert.equal(PAPER_PALETTES[0].primary, '#7946aa');
assert.equal(PAPER_PALETTES.find(palette => palette.name === 'Mortal').primary, '#b9856f');
assert.ok(PAPER_PALETTES.some(palette => palette.name === 'Spectral'));
assert.ok(PAPER_PALETTES.some(palette => palette.name === 'Voidborn'));

function batchWith(draws) {
  let cursor = 0;
  const batch = createPaperBatch(() => draws[cursor++]);
  assert.equal(cursor, 4, 'Shape, palette, eyes and version draw independently');
  return batch;
}
for (const [i, shape] of PAPER_SHAPES.entries()) {
  assert.equal(shape.viewBox, '0 0 200 240');
  assert.equal(shape.paths[0].region, 'silhouette');
  assert.ok(shape.paths.every(path => path.d.startsWith('M') && path.d.endsWith('Z')));
  assert.ok(shape.eye.r > 0 && Number.isFinite(shape.eye.x) && Number.isFinite(shape.eye.y));
  const coordinates = shape.paths[0].d.match(/-?\d+(?:\.\d+)?/g).map(Number);
  const xs = coordinates.filter((_, index) => index % 2 === 0);
  const ys = coordinates.filter((_, index) => index % 2 === 1);
  assert.ok(Math.min(...xs) >= 11.5 && Math.max(...xs) <= 188.5, `${shape.label} horizontal padding`);
  assert.ok(Math.min(...ys) >= 15.5 && Math.max(...ys) <= 236.5, `${shape.label} vertical padding`);
  assert.ok(Math.max(...ys) >= 235.25, `${shape.label} shared foot baseline`);
  const batch = batchWith([(i + .5) / 71, 0, 0, 0]);
  assert.equal(batch.shapeId, shape.id);
  assert.equal(batch.paletteId, 0);
  assert.equal(batch.shapeName, shape.label);
}
let rendered = 0;
for (const [i, palette] of PAPER_PALETTES.entries()) {
  const batch = batchWith([0, (i + .5) / 24, 0, 0]);
  assert.equal(batch.paletteId, palette.id);
  assert.equal(batch.shapeId, PAPER_SHAPES[0].id);
  assert.equal(batch.paletteName, palette.name);
  for (const shape of PAPER_SHAPES) {
    for (let eyes = 1; eyes <= 5; eyes++) {
      const markup = renderPaperCoach({shapeId: shape.id, paletteId: palette.id, eyes, version:'1.00'});
      assert.equal((markup.match(/class="paper-eye"/g) || []).length, eyes);
      assert.ok(markup.includes(palette.primary));
      assert.ok(markup.includes(palette.secondary));
      assert.ok(markup.includes(palette.accent));
      assert.ok(!/NaN|undefined|<image|filter=|linearGradient|radialGradient/.test(markup));
      assert.ok(markup.includes('fill-rule="evenodd"'));
      rendered++;
    }
  }
}
assert.equal(createPaperBatch(() => 0).version, '0.01');
assert.equal(createPaperBatch(() => .999999999).version, '4.99');
assert.equal(createPaperBatch(() => 1).version, '4.99');
for (let value = 0; value < 500; value++) {
  const batch = createPaperBatch(() => value / 500);
  assert.ok(Number(batch.version) > 0 && Number(batch.version) < 5);
  assert.ok(batch.eyes >= 1 && batch.eyes <= 5);
}
console.log(JSON.stringify({shapes:PAPER_SHAPES.length, distinctSilhouettes:71, palettes:PAPER_PALETTES.length, renderedCombinations:rendered, versionRange:['0.01','4.99'], bytes:Buffer.byteLength(source), status:'PASS'}));
