import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../tv/channels/corgi-endless.mjs';

const ALL = E.PERKS.map(p => p.id);
const slotsOf = (...s) => s.map(x => x && { id: x[0], rank: x[1] });

test('1000-seed sweep: 3/4/5 areas, both mirrors, later sections, valid, bounded, reproducible', () => {
  const areas = new Set(), sides = new Set(); let fallbacks = 0, maxAttempts = 0, mirroredAreas = 0, bothSides = 0;
  for (let i = 0; i < 1000; i++) {
    const runSeed = (i * 2654435761) >>> 0, section = 1 + (i % 40);       // sections 1..40 cover the later-difficulty range
    const L = E.genEndlessSection(runSeed, section);
    areas.add(L.areaCount); maxAttempts = Math.max(maxAttempts, L.attempts); if (L.fallback) fallbacks++;
    if (L.areas.some(a => a.mirror < 0)) mirroredAreas++; if (L.areas.some(a => a.side > 0) && L.areas.some(a => a.side < 0)) bothSides++;
    assert.equal(L.objectives.length, 3); assert.equal(new Set(L.objectives.map(o => o.areaId)).size, 3);
    assert.equal(new Set(L.objectives.map(o => o.objectiveId)).size, 3);
    assert.ok(L.corridorLength >= 34 && L.corridorLength <= 90, 'length ' + L.corridorLength);
    if (i % 25 === 0) {                                                    // determinism + a fresh independent validation
      assert.equal(JSON.stringify(E.genEndlessSection(runSeed, section)), JSON.stringify(L));
      assert.deepEqual(E.validateLayout(L), { ok: true, errors: [] });
    }
  }
  assert.deepEqual([...areas].sort(), [3, 4, 5]);
  assert.ok(mirroredAreas > 300 && bothSides > 300, `mirror variants ${mirroredAreas}/${bothSides}`);
  assert.equal(fallbacks, 0); assert.ok(maxAttempts <= E.MAX_ATTEMPTS);
});

test('the known-good fallback is itself valid, and a broken layout is rejected', () => {
  const fb = E.fallbackSection(123456, 7);
  assert.deepEqual(E.validateLayout(fb), { ok: true, errors: [] });
  const bad = JSON.parse(JSON.stringify(fb)); bad.collisionRects.push({ x0: 0.5, x1: 3, z0: -1, z1: 1 });   // wall the spawn in
  assert.equal(E.validateLayout(bad).ok, false);
  const leaky = JSON.parse(JSON.stringify(fb)); leaky.collisionRects = leaky.collisionRects.slice(0, 8);      // drop most walls: the hall leaks
  assert.equal(E.validateLayout(leaky).ok, false);
});

test('routes: spawn, every recovery point and a chaser seat reach all three papers and the exit; routes never cut a wall', () => {
  for (let i = 0; i < 60; i++) {
    const L = E.genEndlessSection(i * 7727 + 11, 1 + (i % 14)), rects = L.collisionRects;
    const targets = [...L.objectives.map(o => o.approachPoint), [L.exit[0] - 1, 0]];
    for (const from of [L.playerSpawn, ...L.recoveryPoints, L.chaserSpawn]) for (const to of targets) {
      const path = E.routePath(L, from[0], from[1], to[0], to[1]);
      assert.ok(path, `no route ${from} -> ${to} in ${L.sectionSeed}`);
      for (let k = 1; k < path.length; k++) assert.ok(E.clearSeg(rects, path[k - 1][0], path[k - 1][1], path[k][0], path[k][1], 0.3), 'route cuts a wall');
    }
    // starting in a side area with a loop between: the route goes around, never straight through the pillar
    const a = L.areas[L.objectives[0].areaId], inRing = a.anchors[3];
    const path = E.routePath(L, inRing[0], inRing[1], a.approach[0], a.approach[1]);
    assert.ok(path && E.pathLength(path) >= Math.hypot(inRing[0] - a.approach[0], inRing[1] - a.approach[1]) - 1e-6);
    for (const area of L.areas) for (const [ax, az] of area.anchors) {          // Scent Trail from any side area, ring or branch: a clear route to a paper
      const near = E.nearestPaper(L, ax, az, []);
      assert.ok(near, 'no paper route from an area anchor');
      for (let k = 1; k < near.path.length; k++) assert.ok(E.clearSeg(rects, near.path[k - 1][0], near.path[k - 1][1], near.path[k][0], near.path[k][1], 0.3));
      const t = E.trimPath(near.path, 4); assert.ok(E.pathLength(t) <= 4 + 1e-9);   // Scent Trail rank 1 shows at most 4L units
    }
    assert.ok(E.nearestPaper(L, 1, 0, []), 'nearest paper');
    assert.equal(E.nearestPaper(L, 1, 0, [0, 1, 2]), null);
  }
});

test('fair respawn: the pursuer is re-seated far (by route) from every recovery point', () => {
  for (let i = 0; i < 80; i++) {
    const L = E.genEndlessSection(i * 313 + 5, 1 + (i % 10));
    for (const r of L.recoveryPoints) assert.ok(E.pathLength(E.routePath(L, r[0], r[1], ...E.chooseSeat(L, r))) >= 10);
    assert.ok(E.pathLength(E.routePath(L, ...L.playerSpawn, ...L.chaserSpawn)) >= 12);
    const far = E.chooseRecovery(L, L.chaserSpawn[0], L.chaserSpawn[1]);   // after a capture the dog returns to the point farthest from the pursuer
    assert.ok(L.recoveryPoints.every(r => Math.hypot(far[0] - L.chaserSpawn[0], far[1] - L.chaserSpawn[1]) >= Math.hypot(r[0] - L.chaserSpawn[0], r[1] - L.chaserSpawn[1]) - 1e-9));
  }
});

test('chaser speed: 25% of base at section 1, 60% cap at section 10, flat after, and never touched by Zoomies', () => {
  assert.equal(E.chaserSpeed(1), E.BASE_SPEED * 0.25);
  assert.ok(Math.abs(E.chaserSpeed(10) - E.BASE_SPEED * 0.6) < 1e-12);
  assert.equal(E.chaserSpeed(11), E.chaserSpeed(10)); assert.equal(E.chaserSpeed(500), E.chaserSpeed(10));
  for (let s = 2; s <= 10; s++) assert.ok(E.chaserSpeed(s) > E.chaserSpeed(s - 1));
  const fast = E.perkEffects(slotsOf(['zoomies', 5], null));
  assert.equal(fast.speedMul, 1.3); assert.equal(E.chaserSpeed(1), E.BASE_SPEED * 0.25);   // pursuer reads BASE_SPEED, not speedMul
});

test('perk effects at ranks 1 and 5, from immutable bases, never compounding', () => {
  const at = (id, rank) => E.perkEffects(slotsOf([id, rank], null));
  const base = E.perkEffects(slotsOf(null, null));
  assert.deepEqual([base.maxHearts, base.speedMul, base.drainMul, base.regainMul, base.catchRange, base.readReach, base.readTime], [3, 1, 1, 1, 1.1, 1, 1]);
  assert.deepEqual([at('heart', 1).maxHearts, at('heart', 5).maxHearts], [4, 8]);
  assert.deepEqual([at('zoomies', 1).speedMul, at('zoomies', 5).speedMul], [1.06, 1.3]);
  assert.deepEqual([at('wind', 1).drainMul, at('wind', 1).regainMul], [0.88, 1.12]);
  assert.ok(at('wind', 5).drainMul > 0 && Math.abs(at('wind', 5).drainMul - 0.4) < 1e-12 && Math.abs(at('wind', 5).regainMul - 1.6) < 1e-12);
  assert.deepEqual([at('vision', 1).visionRange, at('vision', 5).visionRange], [6, 30]);
  assert.deepEqual([at('scent', 1).scentLen, at('scent', 5).scentLen], [4, 20]);
  assert.deepEqual([at('danger', 1).dangerRange, at('danger', 5).dangerRange], [5, 25]);
  assert.deepEqual([at('ears', 1).earsRange, at('ears', 5).earsRange], [2, 10]); assert.ok(at('ears', 5).earsGain <= 2 && at('ears', 1).earsGain > 1);
  assert.deepEqual([at('hackles', 1).hackleRange, at('hackles', 5).hackleRange], [6, 14]);
  assert.deepEqual([at('slippery', 1).graceMs, at('slippery', 5).graceMs], [150, 750]);
  assert.deepEqual([+at('slippery', 1).catchRange.toFixed(2), +at('slippery', 5).catchRange.toFixed(2)], [1.0, 0.6]);
  assert.deepEqual([at('quick', 1).readReach, +at('quick', 5).readReach.toFixed(2)], [1.15, 1.75]);
  assert.deepEqual([+at('quick', 1).readTime.toFixed(2), at('quick', 5).readTime], [0.9, 0.5]);
  const slots = slotsOf(['zoomies', 5], ['slippery', 5]), first = E.perkEffects(slots);
  for (let i = 0; i < 100; i++) assert.deepEqual(E.perkEffects(slots), first);            // pure: reload or reopen can never stack
  assert.equal(first.speedMul, 1.3); assert.equal(first.graceMs, 750);                       // Zoomies + Slippery
  assert.ok(ALL.length === 10 && new Set(ALL).size === 10);
});

test('offers: persisted shape, deterministic, three distinct valid choices, no maxed upgrades', () => {
  let run = E.newRun(777);
  for (let n = 0; n < 40; n++) {
    const a = E.makeOffer(run, 'x', 0), b = E.makeOffer(run, 'x', 0);
    assert.deepEqual(a, b);                                                              // reopening/reload cannot reroll
    assert.equal(a.choices.length, 3); assert.equal(new Set(a.choices.map(c => c.perk)).size, 3);
    for (const c of a.choices) {
      const eq = run.slots.find(s => s && s.id === c.perk);
      assert.equal(c.kind, eq ? 'upgrade' : 'new'); if (eq) assert.ok(eq.rank < E.MAX_RANK);
    }
    run = { ...run, offerIdx: run.offerIdx + 1, slots: slotsOf(['heart', n % 6 === 5 ? 5 : 1 + (n % 5)], ['zoomies', 5]) };
  }
  assert.notDeepEqual(E.makeOffer(E.newRun(1), 'x', 0).choices, E.makeOffer({ ...E.newRun(1), offerIdx: 1 }, 'x', 0).choices);
});

test('picks: slots, replacement, Extra Heart on commit only, milestones once, keep-build, death, next section', () => {
  const store = E.emptyStore();
  let run = { ...E.newRun(5), pendingOffer: { objectiveId: 'o', article: 0, choices: [{ perk: 'heart', kind: 'new' }, { perk: 'zoomies', kind: 'new' }, { perk: 'quick', kind: 'new' }] } };
  assert.equal(run.hearts, 3);
  let r = E.pickOffer(run, 0, undefined, store); run = r.run;                              // Extra Heart rank 1 -> +1 heart, once
  assert.deepEqual([run.hearts, run.slots[0].rank, run.pendingOffer], [4, 1, null]);
  assert.equal(E.perkEffects(run.slots).maxHearts, 4);
  const offer = (...c) => ({ ...run, pendingOffer: { objectiveId: 'o2', article: 0, choices: c } });
  run = offer({ perk: 'zoomies', kind: 'new' }); run = E.pickOffer(run, 0, undefined, r.best && store).run;
  assert.equal(run.slots[1].id, 'zoomies');
  run = offer({ perk: 'quick', kind: 'new' });                                              // both slots full: must choose a slot
  assert.ok(E.pickOffer(run, 0, undefined, store).error);
  assert.ok(E.pickOffer(offer({ perk: 'heart', kind: 'new' }), 0, 0, store).error, 'cannot take an equipped perk as new');
  const rep = E.pickOffer(run, 0, 0, store).run;                                            // replace Extra Heart: max falls, hearts clamp
  assert.deepEqual([rep.slots[0].id, rep.slots[0].rank, rep.hearts], ['quick', 1, 3]);
  // ranks to 5 (heart is gone; use zoomies/quick): first rank-5 milestone once, then full clear once
  let g = { ...E.newRun(9), slots: slotsOf(['zoomies', 4], ['quick', 4]), hearts: 3 }, seen = [];
  for (const [id, kind] of [['zoomies', 'upgrade'], ['quick', 'upgrade'], ['scent', 'new']]) {   // third: replace slot 0, flags stay once-only
    g = { ...g, pendingOffer: { objectiveId: 'p', article: 0, choices: [{ perk: id, kind }] } };
    const out = E.pickOffer(g, 0, 0, store); g = out.run; seen.push(g.pendingMilestone);
    if (g.pendingMilestone) g = { ...g, pendingMilestone: null };
  }
  assert.deepEqual(seen, ['first', 'full', null]);
  assert.ok(E.pickOffer({ ...E.newRun(1), slots: slotsOf(['zoomies', 5], null), pendingOffer: { objectiveId: 'p', article: 0, choices: [{ perk: 'zoomies', kind: 'upgrade' }] } }, 0, undefined, store).error, 'a maxed perk cannot be upgraded');
  assert.equal(E.keepBuild({ ...g, pendingOffer: { choices: [] } }).pendingOffer, null);
  // bests persist as the max ever equipped
  const out = E.pickOffer({ ...E.newRun(2), pendingOffer: { objectiveId: 'p', article: 0, choices: [{ perk: 'scent', kind: 'new' }] } }, 0, undefined, { ...store, best: { section: 0, perks: { scent: 3 } } });
  assert.equal(out.best.perks.scent, 3);
  // capture: one heart each, the last ends the run and clears powers
  let d = { ...E.newRun(3), hearts: 2, slots: slotsOf(['zoomies', 3], null) };
  d = E.loseHeart(d); assert.deepEqual([d.hearts, d.status], [1, 'active']);
  d = E.loseHeart(d); assert.deepEqual([d.hearts, d.status, d.slots], [0, 'over', [null, null]]);
  // exit: exactly one section per call, collected resets, best section tracks the maximum
  const n = E.nextSection({ ...E.newRun(3), collected: ['a', 'b', 'c'] }, store);
  assert.deepEqual([n.run.section, n.run.collected, n.best.section], [2, [], 2]);
  assert.equal(E.nextSection(n.run, { ...store, best: { section: 9, perks: {} } }).best.section, 9);
});

test('section seeds: literal (runSeed + section - 1) >>> 0, and the three streams are independent', () => {
  assert.equal(E.sectionSeed(4294967295, 3), 1);
  const a = E.genEndlessSection(50, 4), b = E.genEndlessSection(50, 4);
  assert.equal(a.decorSeed, b.decorSeed);
  assert.notEqual(E.genEndlessSection(50, 5).decorSeed, a.decorSeed);
  assert.equal(E.makeOffer(E.newRun(50), 'x', 0).choices.length, 3);                       // offers never consume the layout stream
  assert.equal(JSON.stringify(E.genEndlessSection(50, 4)), JSON.stringify(a));
});

test('storage: tolerant of absence and garbage, mirrors best section for the menu', () => {
  const mem = new Map(), st = { getItem: k => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)) };
  assert.deepEqual(E.loadStore(st), E.emptyStore());
  mem.set(E.STORE_KEY, '{nope'); assert.deepEqual(E.loadStore(st), E.emptyStore());
  const s = E.emptyStore(); s.best.section = 7; s.run = E.newRun(42); s.settings.look = 9;
  E.saveStore(st, s);
  const back = E.loadStore(st);
  assert.equal(back.best.section, 7); assert.equal(back.run.seed, 42); assert.equal(back.settings.look, 2);   // look clamps
  assert.equal(mem.get('corgi-endless-best-v1'), '7');
  assert.notEqual(E.STORE_KEY, 'mbs-corgi-school-v3');
});

test('sight and reach stop at walls: a segment through a wall is blocked, one beside it is not', () => {
  const wall = { x0: 4, x1: 4.3, z0: -3, z1: 3 };
  assert.equal(E.segHitsRect(3.2, 0, 5.0, 0, wall), true);     // Quick Read / outlines through a wall: not sight, not reach
  assert.equal(E.segHitsRect(3.2, 3.5, 5.0, 3.5, wall), false);
  assert.equal(E.segHitsRect(3.2, 0, 3.9, 0, wall), false);
});
