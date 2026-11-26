// Dr Girlfriend branch + Coach Jump round selection + vendored-source provenance (no browser).
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {isOriginalOrder, branchFor, currentRound, finishRound, ROUND_KEY} from '../arcade/pyramid-jump/rounds.mjs';
import {PAPER_SHAPES, PAPER_PALETTES} from '../tv/channels/girlfriend-roster.js';

const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const memory = () => { const m = new Map(); return {getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k)}; };
const seeded = seed => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
// Same derivation girlfriend.js performs at Mould time.
const batchFor = order => ({special: isOriginalOrder(order, 6)});

test('only the exact original order 0..5 takes the reveal path; everything else jumps', () => {
  assert.equal(branchFor(batchFor([0, 1, 2, 3, 4, 5])), 'reveal');
  for (const wrong of [[1, 0, 2, 3, 4, 5], [5, 4, 3, 2, 1, 0], [0, 1, 2, 3, 5, 4], [0, 1, 2, 3, 4], [0, 1, 2, 3, 4, 5, 5], [], null]) {
    assert.equal(branchFor(batchFor(wrong)), 'jump', JSON.stringify(wrong));
  }
  // A look-alike Coach (original shape/palette/eyes) is not proof: only the recipe sets special.
  assert.equal(branchFor({shapeId: 'myr5', paletteId: 0, eyes: 1, version: '5.00'}), 'jump');
  assert.equal(branchFor(null), 'jump');
});

test('girlfriend.js wires the branch and leaves the goggles reward exactly as shipped', () => {
  const src = read('tv/channels/girlfriend.js');
  assert.ok(src.includes('batch.special=isOriginalOrder(L.order,TUBES.length);'));
  assert.ok(src.includes("if(branchFor(batch)==='jump'){startJump();return;}"));
  const award = src.slice(src.indexOf('function awardGoggles()'), src.indexOf("get('dgVisX').dataset.guideNext"));
  assert.equal(createHash('sha1').update(award).digest('hex'), '98bc5673d8058aa4eae49c6b0aaad6dc9b61c490', 'awardGoggles changed');
  const tubes = [...src.slice(0, src.indexOf('// A paper prototype')).matchAll(/who:\s*"([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(tubes, ['Sentience juice', 'Mother’s love', 'Dog loyalty', 'Small juice', 'Womanly wit', 'MBS Fuel']);
});

test('standalone: same Coach on resume, a new Coach after a finished round, bad saves ignored', () => {
  const store = memory();
  const first = currentRound(store, seeded(1));
  assert.equal(first.resumed, false);
  const again = currentRound(store, seeded(999)); // different randomness must not matter on resume
  assert.equal(again.resumed, true);
  assert.deepEqual(again.batch, first.batch);
  finishRound(store);
  assert.equal(store.getItem(ROUND_KEY), null);
  const next = currentRound(store, seeded(2));
  assert.equal(next.resumed, false);
  store.setItem(ROUND_KEY, '{"v":1,"batch":{"shapeId":"nope","paletteId":0,"eyes":2}}');
  assert.equal(currentRound(store, seeded(3)).resumed, false);
  store.setItem(ROUND_KEY, 'not json');
  assert.equal(currentRound(store, seeded(4)).resumed, false);
});

test('standalone rounds vary shape, palette and eyes and never claim the original reveal', () => {
  const random = seeded(42), shapes = new Set(), palettes = new Set(), eyes = new Set();
  for (let i = 0; i < 300; i++) {
    const store = memory(), {batch} = currentRound(store, random);
    assert.ok(PAPER_SHAPES.some(s => s.id === batch.shapeId) && PAPER_PALETTES.some(p => p.id === batch.paletteId));
    assert.notEqual(batch.special, true);
    shapes.add(batch.shapeId); palettes.add(batch.paletteId); eyes.add(batch.eyes);
  }
  assert.ok(shapes.size > 40 && palettes.size > 15 && eyes.size === 5, `${shapes.size}/${palettes.size}/${eyes.size}`);
});

test('vendored Pyramid Jump is pinned to its Coach origin and only carries the listed patches', () => {
  const sync = JSON.parse(read('arcade/pyramid-jump/SYNC.json'));
  assert.match(sync.commit, /^[0-9a-f]{40}$/);
  const blob = text => createHash('sha1').update(`blob ${Buffer.byteLength(text)}\0`).update(text).digest('hex');
  for (const name of ['logic.mjs', 'data.mjs', 'shell-phase.mjs']) {
    assert.equal(blob(read('arcade/pyramid-jump/' + name)), sync.files[name].blob, name + ' drifted from the pinned source (re-run tools/sync_pyramid_jump.py)');
  }
  const game = read('arcade/pyramid-jump/game.mjs');
  assert.ok(game.includes('paperImg=null,onEnd=null') && game.includes('ctx.drawImage(paperImg,0,0,200,240)'));
  assert.equal(sync.patches.length, 11); // P1-P10 + P11 hold (Coach Jump pyramid menu)
  assert.ok(!game.includes('../../performance-progress.mjs') && !game.includes('quest-progress-reporter'));
});
