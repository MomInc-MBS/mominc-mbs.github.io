import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const Q = createRequire(import.meta.url)('../handborne/buynow.js');

const rec = (nails, extra = {}) => ({version: 4, sections: {nails, fingertips: 5, fingers: 12, palm: 3, back_of_hand: 17, wrist: 18}, nailShape: 'family', ...extra});
// Drive the ledger the way the page does: one commit() per committed look.
const run = (start, ...looks) => looks.reduce((l, r) => Q.commit(l, Q.signature(r)), Q.commit({count: 0, sig: ''}, Q.signature(start)));

test('quote starts at $19.99 in integer cents', () => {
  assert.equal(Q.cents(0), 1999);
  assert.equal(Q.money(Q.cents(0)), '$19.99');
  assert.equal(Q.money(Q.cents(1)), '$20.00');
  assert.equal(Q.money(Q.cents(11)), '$20.10');
});

test('initialization / first sighting does not count', () => {
  assert.equal(run(rec(14)).count, 0);
});

test('purple -> pink -> purple from another colour is three changes (incl. changing back)', () => {
  const l = run(rec(14), rec(1), rec(2), rec(1));
  assert.equal(l.count, 3);
});

test('alternating colours keeps rising past five (separate from the 5-decision counter)', () => {
  const looks = Array.from({length: 12}, (_, i) => rec(i % 2 ? 3 : 4));
  assert.equal(run(rec(14), ...looks).count, 12);
});

test('re-applying the current value, reload, orbit (same signature) are no-ops', () => {
  assert.equal(run(rec(14), rec(14), rec(14), rec(14, {pose: 'wave'})).count, 0);
  assert.equal(run(rec(14), rec(1), rec(1)).count, 1);
});

test('scalePattern undefined equals "none": no phantom change', () => {
  assert.equal(run(rec(14), rec(14, {scalePattern: 'none'})).count, 0);
  assert.equal(run(rec(14), rec(14, {scalePattern: 'round'})).count, 1);
});

test('a drag that passes through many values but is committed once counts once', () => {
  // The page checks only at commit points (pointerup/change), so only the released value reaches commit().
  assert.equal(run(rec(14), rec(9)).count, 1);
});

test('an imported different design is one commit; no recipe is ignored', () => {
  const imported = {version: 4, sections: {nails: 1, fingertips: 2, fingers: 3, palm: 4, back_of_hand: 5, wrist: 6}, nailShape: 'almond', scalePattern: 'hex'};
  assert.equal(run(rec(14), imported).count, 1);
  assert.equal(Q.commit({count: 4, sig: 'x'}, '').count, 4);
});

test('mailto is URI-encoded, addressed, and carries the exact subject', () => {
  const url = Q.mailto('a@b.c', 'Line 1\nP.S. & "quote"');
  assert.ok(url.startsWith('mailto:a@b.c?subject='));
  assert.ok(url.includes(encodeURIComponent('Mother, I really, really need a Helping Hand')));
  assert.ok(url.includes(encodeURIComponent('Line 1\nP.S. & "quote"')));
});

test('letter carries the design, count and quote and the exact fixed copy', () => {
  const o = {design: Q.summary(rec(14)), count: 3, quote: Q.money(Q.cents(3)), name: 'Pat'};
  const t = Q.letter(o);
  assert.ok(t.startsWith('Dear Mother,\n\nI really, really want a Helping Hand.'));
  assert.ok(t.includes('My design: Nails: ' ));
  assert.ok(t.includes('Design decisions: 3'));
  assert.ok(t.includes("MOM's fictional quote: $20.02"));
  assert.ok(t.includes('Yours, with both hands occupied,\n\nPat'));
  assert.ok(t.endsWith("The quote above is part of MOM's fictional sales routine."));
  assert.ok(!/\{\{/.test(t));
  assert.ok(Q.shortLetter(o).includes('Design decisions: 3'));
});
