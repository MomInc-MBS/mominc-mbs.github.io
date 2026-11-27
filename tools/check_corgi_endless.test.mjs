import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import * as E from '../tv/channels/corgi-endless.mjs';


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

test('chaser speed: one formula, exact table, never touched by Zoomies', () => {
  const want = { 1: 0.8125, 2: 0.836875, 10: 1.060128, 20: 1.424724, 50: 3.458178, 100: 15.160329 };
  for (const [s, v] of Object.entries(want)) assert.ok(Math.abs(E.chaserSpeed(+s) - v) < 5e-7, `section ${s}: ${E.chaserSpeed(+s)}`);
  for (let s = 2; s <= 120; s++) assert.ok(Math.abs(E.chaserSpeed(s) / E.chaserSpeed(s - 1) - 1.03) < 1e-12);   // exactly 3% per section, no old cap or ramp underneath
  assert.equal(E.perkEffects({ zoomies: 100 }).speedMul, 2.5); assert.equal(E.chaserSpeed(1), 0.625 * 1.3);
});

test('catch distance starts at 0.88 and Slippery shrinks it by the plan formula, staying positive', () => {
  assert.equal(E.BASE_CATCH, 0.88); assert.equal(E.perkEffects(null).catchRange, 0.88);
  for (const n of [1, 6, 20, 100, 1e6]) {
    const c = E.perkEffects({ slippery: n }).catchRange;
    assert.ok(Math.abs(c - 0.88 * (0.8 + 0.2 / (1 + 0.1 * n))) < 1e-12); assert.ok(c > 0.88 * 0.8 && c < 0.88);
  }
});

test('every section is dark; no brightness alternation', () => {
  for (let s = 1; s <= 12; s++) assert.equal(E.genEndlessSection(99, s).dark, true);
});

test('trait effects from stack counts: 0 is the base, 6/20/100 are finite, positive where required, bounded where required', () => {
  const base = E.perkEffects(null);
  assert.deepEqual([base.maxQuarters, base.speedMul, base.drainMul, base.regainMul, base.catchRange, base.readReach, base.readTime, base.hackleRange, base.graceMs, base.earsGain], [12, 1, 1, 1, 0.88, 1, 1, 0, 0, 1]);
  const one = id => E.perkEffects({ [id]: 1 });
  assert.equal(one('heart').maxQuarters, 13); assert.ok(Math.abs(one('zoomies').speedMul - 1.015) < 1e-12);
  assert.ok(Math.abs(one('vision').visionRange - 1.5) < 1e-12 && one('scent').scentLen === 1 && Math.abs(one('danger').dangerRange - 1.25) < 1e-12);
  assert.ok(Math.abs(one('hackles').hackleRange - 4.5) < 1e-12 && Math.abs(one('ears').earsRange - 0.5) < 1e-12);
  assert.ok(Math.abs(one('quick').readReach - 1.0375) < 1e-12);
  for (const n of [6, 20, 100]) for (const id of E.TRAIT_IDS) {
    const e = E.perkEffects({ [id]: n });
    for (const [k, v] of Object.entries(e)) assert.ok(Number.isFinite(v) && v >= 0, `${id}x${n} ${k}=${v}`);
    assert.ok(e.drainMul > 0.2 && e.earsGain < 2 && e.graceMs < 1500 && e.readTime >= 0.5 && e.catchRange > 0.7, `${id}x${n} bounds`);
  }
  assert.ok(Math.abs(E.perkEffects({ wind: 100 }).drainMul - (0.2 + 0.8 / 5)) < 1e-12);
  const all = Object.fromEntries(E.TRAIT_IDS.map(id => [id, 20])), a = E.perkEffects(all);
  for (let i = 0; i < 50; i++) assert.deepEqual(E.perkEffects(all), a);                  // pure: reload or reopen can never stack
  assert.ok(a.speedMul > 1.29 && a.maxQuarters === 32 && E.TRAIT_IDS.length === 10);     // all ten active at once
  for (const id of E.TRAIT_IDS) { const t = E.nextLine(id, 100); assert.ok(t.length < 140 && !/NaN|undefined|\/5/.test(t), t); assert.ok(E.nextLine(id, 0).length > 3); }
});

test('count parsing rejects non-finite and unsafe values instead of coercing them', () => {
  for (const bad of [NaN, Infinity, -Infinity, -1, 1.5, 2 ** 53, 1e300, '5', null, undefined, {}, [], true]) assert.equal(E.count(bad), 0, String(bad));
  assert.equal(E.count(7), 7); assert.equal(E.count(2 ** 40), 2 ** 40); assert.equal(E.count(2 ** 31), 2 ** 31);   // no 32-bit wrap
  assert.equal(E.perkEffects({ heart: NaN, zoomies: '9', wind: 1e300, scent: -4 }).maxQuarters, 12);
  assert.deepEqual(E.cleanTraits({ heart: 3, bogus: 9, quick: 1.2 }), { ...E.emptyTraits(), heart: 3 });
});

test('offers: three distinct traits, deterministic, an undiscovered one while any remain, any trait offerable forever', () => {
  let run = E.newRun(777);
  for (let n = 0; n < 60; n++) {
    const a = E.makeOffer(run, 'x', 0), b = E.makeOffer(run, 'x', 0);
    assert.deepEqual(a, b);                                                               // reopening/reload cannot reroll
    assert.equal(a.choices.length, 3); assert.equal(new Set(a.choices.map(c => c.perk)).size, 3);
    if (E.TRAIT_IDS.some(id => !run.traits[id])) assert.ok(a.choices.some(c => !run.traits[c.perk]), 'must offer an undiscovered trait');
    for (const c of a.choices) assert.equal(c.kind, run.traits[c.perk] ? 'stack' : 'new');
    run = { ...E.pickOffer({ ...run, pendingOffer: a }, n % 3).run, offerIdx: run.offerIdx + 1, picked: [] };
  }
  assert.ok(E.TRAIT_IDS.every(id => run.traits[id] > 0), 'ten traits discovered within 60 offers');
  const seen = new Set(), maxed = { ...E.newRun(4), traits: Object.fromEntries(E.TRAIT_IDS.map(id => [id, 50])) };
  for (let i = 0; i < 80; i++) for (const c of E.makeOffer({ ...maxed, offerIdx: i }, 'x').choices) seen.add(c.perk);
  assert.equal(seen.size, 10);                                                            // heavily stacked traits stay offerable
  assert.notDeepEqual(E.makeOffer(E.newRun(1), 'x', 0).choices, E.makeOffer({ ...E.newRun(1), offerIdx: 1 }, 'x', 0).choices);
});

test('picks: one stack per committed pick, duplicate commit refused, Heart heals one quarter once, all-ten fires once', () => {
  const store = E.emptyStore();
  const run = { ...E.newRun(5), pendingOffer: { objectiveId: 'o1', article: 0, choices: [{ perk: 'heart', kind: 'new' }, { perk: 'zoomies', kind: 'new' }, { perk: 'quick', kind: 'new' }] }, quarters: 8 };
  const r = E.pickOffer(run, 0, store);
  assert.deepEqual([r.run.quarters, r.run.traits.heart, r.run.pendingOffer, r.run.picked, r.best.traits.heart], [9, 1, null, ['o1'], 1]);
  // replay of the same objective/offer (reload, double tap, restored pending offer) cannot add a second stack or heal again
  assert.equal(E.pickOffer({ ...r.run, pendingOffer: run.pendingOffer }, 0, store).error, 'already picked');
  assert.equal(E.pickOffer(r.run, 0, store).error, 'no such choice');
  assert.equal(E.pickOffer(run, 9, store).error, 'no such choice');
  assert.equal(E.pickOffer({ ...run, pendingOffer: { objectiveId: 'o', choices: [{ perk: 'nope' }] } }, 0, store).error, 'no such choice');
  assert.equal(E.pickOffer({ ...run, quarters: 12 }, 0, store).run.quarters, 13);        // heals only into the new maximum
  assert.equal(E.pickOffer({ ...run, quarters: 8 }, 1, store).run.quarters, 8);          // a non-heart pick never heals
  // stacks grow with no ceiling; bests track the maximum ever
  const g = E.pickOffer({ ...E.newRun(9), traits: { ...E.emptyTraits(), zoomies: 99 }, pendingOffer: { objectiveId: 'z', choices: [{ perk: 'zoomies', kind: 'stack' }] } }, 0, { ...store, best: { section: 0, traits: { ...E.emptyTraits(), zoomies: 120 } } });
  assert.deepEqual([g.run.traits.zoomies, g.best.traits.zoomies, g.allTen], [100, 120, false]);
  // the tenth distinct trait reports allTen exactly once and never ends the run
  const t = { ...E.newRun(1), traits: Object.fromEntries(E.TRAIT_IDS.map((id, i) => [id, i < 9 ? 1 : 0])) };
  const ten = E.pickOffer({ ...t, pendingOffer: { objectiveId: 'a', choices: [{ perk: 'quick', kind: 'new' }] } }, 0, store);
  assert.deepEqual([ten.allTen, ten.run.status], [true, 'active']);
  assert.equal(E.pickOffer({ ...ten.run, picked: [], pendingOffer: { objectiveId: 'b', choices: [{ perk: 'quick', kind: 'stack' }] } }, 0, store).allTen, false);
  // capture: four quarters each; the last ends the run and clears powers
  let d = { ...E.newRun(3), quarters: 9, traits: { ...E.emptyTraits(), zoomies: 3 } };
  d = E.capture(d); assert.deepEqual([d.quarters, d.status], [5, 'active']);
  d = E.capture(d); assert.deepEqual([d.quarters, d.status], [1, 'active']);
  d = E.capture(d); assert.deepEqual([d.quarters, d.status, d.traits], [0, 'over', E.emptyTraits()]);
  // exit: exactly one section per call; the queued layout generator becomes current; picks reset; best section is a maximum
  const n = E.nextSection({ ...E.newRun(3), genVersion: 1, nextGenVersion: 2, collected: ['a', 'b', 'c'], picked: ['a'] }, store);
  assert.deepEqual([n.run.section, n.run.collected, n.run.picked, n.run.genVersion, n.best.section], [2, [], [], 2, 2]);
  assert.equal(E.nextSection(n.run, { ...store, best: { section: 9, traits: {} } }).best.section, 9);
});

// a real v1 store: the exact shape the shipped corgi-endless.mjs wrote (two slots, integer hearts, ranks, milestones, a pending offer with upgrade/new kinds)
const V1_STORE = { v: 1, best: { section: 7, perks: { heart: 3, zoomies: 5, scent: 2 } },
  run: { v: 1, seed: 1234567, genVersion: 1, section: 5, status: 'active', hearts: 5, slots: [{ id: 'heart', rank: 2 }, { id: 'zoomies', rank: 5 }], collected: [0, 2], papers: 14, offerIdx: 14,
    pendingOffer: { objectiveId: '1234567:5:2', article: 14, choices: [{ perk: 'heart', kind: 'upgrade' }, { perk: 'quick', kind: 'new' }, { perk: 'scent', kind: 'new' }] },
    pendingMilestone: 'full', ms: { first: true, full: true } },
  settings: { sound: false, look: 1.4 } };
test('migration v1 -> v2: ranks become four stacks, health to quarters with no bonus, legacy kept, v1 key untouched, runs once', () => {
  const mem = new Map([[E.STORE_KEY_V1, JSON.stringify(V1_STORE)]]), st = { getItem: k => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)) };
  const s = E.loadStore(st), r = s.run;
  assert.equal(s.v, 2); assert.deepEqual(s.legacy, V1_STORE);
  assert.deepEqual([r.traits.heart, r.traits.zoomies, r.traits.scent, r.traits.quick], [8, 20, 0, 0]);
  assert.equal(r.quarters, 20); assert.equal(E.maxQuarters(r), 20);                        // 5 hearts = 20 quarters; max 12 + 8 = 20: unchanged, no bonus
  assert.deepEqual([r.seed, r.section, r.collected, r.papers, r.offerIdx, r.status], [1234567, 5, [0, 2], 14, 14, 'active']);
  assert.deepEqual([r.genVersion, r.nextGenVersion], [1, E.GEN_VERSION]);                   // the saved section finishes on its own layout version
  assert.deepEqual([s.best.section, s.best.traits.heart, s.best.traits.zoomies, s.best.traits.scent], [7, 12, 20, 8]);
  assert.deepEqual([s.settings.sound, s.settings.look], [false, 1.4]);
  assert.equal(r.pendingOffer.objectiveId, '1234567:5:2'); assert.deepEqual(r.pendingOffer.choices.map(c => c.perk), ['heart', 'quick', 'scent']);   // same offered traits
  assert.deepEqual(r.pendingOffer.choices.map(c => c.kind), ['stack', 'new', 'new']);
  assert.ok(!('pendingMilestone' in r) && !('slots' in r) && !('ms' in r) && !('hearts' in r)); assert.deepEqual(r.picked, []);
  assert.equal(mem.get(E.STORE_KEY_V1), JSON.stringify(V1_STORE));                          // never overwritten
  E.saveStore(st, s);                                                                       // once saved as v2 it loads as v2: no re-migration, no second x4
  const again = E.loadStore(st); assert.deepEqual(again.run.traits, r.traits); assert.deepEqual(again.legacy, V1_STORE); assert.equal(again.run.quarters, 20);
  assert.deepEqual(E.loadStore(st).run, again.run);
  // damaged hearts are preserved, over-max is clamped; nothing heals
  assert.equal(E.migrateV1({ ...V1_STORE, run: { ...V1_STORE.run, hearts: 2 } }).run.quarters, 8);
  assert.equal(E.migrateV1({ ...V1_STORE, run: { ...V1_STORE.run, hearts: 99 } }).run.quarters, 20);
  const dead = E.migrateV1({ ...V1_STORE, run: { ...V1_STORE.run, status: 'over', hearts: 0, slots: [null, null], pendingOffer: null } }).run;
  assert.deepEqual([dead.status, dead.quarters, dead.pendingOffer], ['over', 0, null]);
  // a half-broken pending offer is topped up to three distinct valid traits
  const odd = E.migrateV1({ ...V1_STORE, run: { ...V1_STORE.run, pendingOffer: { objectiveId: 'q', article: 1, choices: [{ perk: 'ears' }, { perk: 'ears' }, { perk: 'junk' }] } } }).run.pendingOffer;
  assert.equal(odd.choices.length, 3); assert.equal(new Set(odd.choices.map(c => c.perk)).size, 3); assert.equal(odd.choices[0].perk, 'ears'); assert.ok(odd.choices.every(c => E.TRAIT_IDS.includes(c.perk)));
  // the migrated pending offer is a normal transaction: one stack, objective id recorded, replay refused
  const pick = E.pickOffer(r, 1, s); assert.equal(pick.run.traits.quick, 1); assert.deepEqual(pick.run.picked, ['1234567:5:2']);
  assert.equal(E.pickOffer({ ...pick.run, pendingOffer: r.pendingOffer }, 1, s).error, 'already picked');
  assert.equal(E.loadStore({ getItem: k => k === E.STORE_KEY_V1 ? JSON.stringify({ v: 1, best: { section: NaN, perks: { heart: 1e300 } }, run: { v: 1, seed: 'x' } }) : null }).run, null);   // garbage v1 run
});

test('storage: tolerant of absence and garbage, v2 round trip, mirrors best section for the menu', () => {
  const mem = new Map(), st = { getItem: k => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)) };
  assert.deepEqual(E.loadStore(st), E.emptyStore());
  mem.set(E.STORE_KEY, '{nope'); assert.deepEqual(E.loadStore(st), E.emptyStore());
  const s = E.emptyStore(); s.best.section = 7; s.run = E.newRun(42); s.run.traits.heart = 3; s.run.quarters = 99; s.settings.look = 9;
  E.saveStore(st, s);
  const back = E.loadStore(st);
  assert.equal(back.best.section, 7); assert.equal(back.run.seed, 42); assert.equal(back.settings.look, 2);   // look clamps
  assert.deepEqual([back.run.traits.heart, back.run.quarters], [3, 15]);                                        // quarters clamp to the computed max
  assert.equal(mem.get('corgi-endless-best-v1'), '7');
  mem.set(E.STORE_KEY, JSON.stringify({ v: 2, best: { section: 2 ** 40, traits: { heart: 2 ** 60, quick: 4 } }, run: { v: 2, seed: 5, traits: { zoomies: NaN, scent: 3 }, quarters: -5, section: 1.5 } }));
  const odd = E.loadStore(st); assert.equal(odd.best.section, 2 ** 40);
  assert.deepEqual([odd.best.traits.heart, odd.best.traits.quick, odd.run.traits.scent, odd.run.quarters, odd.run.section], [0, 4, 3, 1, 1]);
  assert.notEqual(E.STORE_KEY, 'mbs-corgi-school-v3'); assert.notEqual(E.STORE_KEY, E.STORE_KEY_V1);
});

test('sight and reach stop at walls: a segment through a wall is blocked, one beside it is not', () => {
  const wall = { x0: 4, x1: 4.3, z0: -3, z1: 3 };
  assert.equal(E.segHitsRect(3.2, 0, 5.0, 0, wall), true);     // Quick Read / outlines through a wall: not sight, not reach
  assert.equal(E.segHitsRect(3.2, 3.5, 5.0, 3.5, wall), false);
  assert.equal(E.segHitsRect(3.2, 0, 3.9, 0, wall), false);
});

// ---------------------------------------------------------------- geometry v1 (frozen) and v2 (wider halls)
const V1_PRINTS = {"17:1":"e9d80b93aa916057","2654435778:6":"2b2ee918541752db","1013904243:11":"efba0bf5bb57705c","3668340004:16":"b397edf674b9de4b","2027808469:21":"6e8ecfdba5652797","387276934:26":"f125fd0bd6e1eb4d","3041712695:31":"a72276c0cfe30099","1401181160:5":"d62fec96082b069e","4055616921:10":"9bddb9dd53271d9b","2415085386:15":"9a569e09c9902d5a","774553851:20":"ef33849e3ef78a13","3428989612:25":"872724d1654508e6","1788458077:30":"d0e2b9c46d0268dc","147926542:4":"81c6206854ad27b1","2802362303:9":"1956d97af24c3d60","1161830768:14":"ab2ce4ee92178531","3816266529:19":"992a5cbdd25b16ec","2175734994:24":"281ab104707310db","535203459:29":"6a056f2580a37c0a","3189639220:3":"ee6568d9df77a1ff","1549107685:8":"279e58d75d9209a7","4203543446:13":"66c2cebc062852fd","2563011911:18":"5960e51def7a9de7","922480376:23":"2da9eb4dda16addb"};
const prints = (seed, section) => createHash('sha256').update(JSON.stringify((({ dark, ...rest }) => rest)(E.genEndlessSection(seed, section, 1)))).digest('hex').slice(0, 16);
test('layout v1 is frozen: byte-identical to the shipped generator (everything but the now-always-on `dark`)', () => {
  const keys = Object.keys(V1_PRINTS); assert.equal(keys.length, 24);
  for (const k of keys) { const [seed, section] = k.split(':').map(Number); assert.equal(prints(seed, section), V1_PRINTS[k], 'v1 layout changed for ' + k); }
  const L = E.genEndlessSection(31, 3, 1); assert.deepEqual([L.layoutVersion, L.dark, 'decor' in L, 'clear' in L], [1, true, false, false]);
  assert.equal(E.hallClear(1), 2.4); assert.equal(E.CORRIDOR_HALF, 1.35);
  assert.throws(() => E.genEndlessSection(1, 1, 9), /unknown layout version/);
});

const wallsOf = L => [...L.corridorWalls, ...L.areas.flatMap(a => a.walls)].map(([cx, cz, w, d]) => ({ x0: cx - w / 2, x1: cx + w / 2, z0: cz - d / 2, z1: cz + d / 2 }));
// clear width through (x,z) between the nearest wall FACES (inner collision faces), measured along z or along x
const gapZ = (walls, x, z) => { let lo = -Infinity, hi = Infinity; for (const w of walls) if (w.x0 < x && x < w.x1) { if (w.z1 <= z) lo = Math.max(lo, w.z1); if (w.z0 >= z) hi = Math.min(hi, w.z0); } return hi - lo; };
const gapX = (walls, x, z) => { let lo = -Infinity, hi = Infinity; for (const w of walls) if (w.z0 < z && z < w.z1) { if (w.x1 <= x) lo = Math.max(lo, w.x1); if (w.x0 >= x) hi = Math.min(hi, w.x0); } return hi - lo; };
const EPS = 1e-6;
function measure(L) {
  const walls = wallsOf(L), out = { hall: [], branch: [], leg: [], vest: [], top: [], mouth: [] };
  for (let x = 1; x < L.corridorLength - 1; x += 0.5) { const g = gapZ(walls, x, 0); if (g < 4) out.hall.push(g); }
  for (const a of L.areas) {
    const n = a.nav, xm = (n.xw + n.xe) / 2, zm = (n.band + n.top) / 2;
    out.branch.push(gapX(walls, n.bx, a.side * 3.5)); out.leg.push([gapX(walls, n.xw, zm), a.clear?.leg], [gapX(walls, n.xe, zm), a.clear?.leg]);
    out.vest.push(gapZ(walls, xm, n.band)); out.top.push(gapZ(walls, xm, n.top)); for (const [lo, hi] of a.mouths) out.mouth.push(hi - lo);
  }
  return out;
}
test('layout v2 sweep, 200 seeds x sections 1-30: inner-face widths are v1 x 1.25, everyone reaches every objective and the exit, no fallbacks', { timeout: 600000 }, () => {
  const C = E.CLEAR_V2; let halls = 0, fallbacks = 0, retried = 0, decor = 0, areas = 0;
  assert.ok(Math.abs(E.hallClear(2) - 3.0) < EPS && Math.abs(E.CORRIDOR_HALF_V2 - 1.65) < EPS);                 // (3.0 + 0.3) / 2, not 1.35 * 1.25
  for (let i = 0; i < 200; i++) for (let section = 1; section <= 30; section++) {
    const L = E.genEndlessSection((i * 2654435761 + 7) >>> 0, section);
    assert.equal(L.layoutVersion, 2); assert.equal(L.dark, true); fallbacks += L.fallback ? 1 : 0; retried += L.attempts > 1 ? 1 : 0; decor += L.decor.length; areas += L.areas.length;
    const m = measure(L);
    for (const g of m.hall) { assert.ok(g >= 3.0 - EPS && g <= 3.0 + EPS, 'hall ' + g); halls++; }
    for (const g of m.branch) assert.ok(g >= C.branch - EPS, 'branch ' + g);
    for (const [g, want] of m.leg) assert.ok(g >= C.legMin - EPS && Math.abs(g - want) < EPS, `leg ${g} vs ${want}`);
    for (const g of m.vest) assert.ok(Math.abs(g - C.vestibule) < EPS, 'vestibule ' + g);
    for (const g of m.top) assert.ok(Math.abs(g - C.top) < EPS, 'top ' + g);
    for (const g of m.mouth) assert.ok(g >= C.mouth - EPS, 'mouth ' + g);
    for (const from of [L.playerSpawn, L.chaserSpawn]) for (const to of [...L.objectives.map(o => o.approachPoint), [L.exit[0] - 1, 0]]) {   // player and boss reach three objectives + exit
      const path = E.routePath(L, from[0], from[1], to[0], to[1]); assert.ok(path, `no route ${from} -> ${to} in ${L.runSeed}:${section}`);
      for (let k = 1; k < path.length; k++) assert.ok(E.clearSeg(L.collisionRects, path[k - 1][0], path[k - 1][1], path[k][0], path[k][1], 0.32), 'route clips a wall or a solid prop');
    }
  }
  assert.ok(halls > 100000, 'hall samples ' + halls); assert.equal(fallbacks, 0); assert.ok(retried < 60, 'retries ' + retried);
  assert.ok(decor / areas >= 4.5, 'decor per area ' + decor / areas);                                         // v1 dressed <= 3 props/area; v2 is at least +50%
});

test('layout v2 measurement is honest: the same probe reads the shipped v1 widths (2.4 hall, 2.5 branch, 1.35 vestibule)', () => {
  for (let i = 0; i < 20; i++) {
    const L = E.genEndlessSection(i * 977 + 3, 1 + (i % 9), 1), m = measure(L);
    assert.ok(m.hall.length && m.hall.every(g => Math.abs(g - 2.4) < EPS)); assert.ok(m.branch.every(g => Math.abs(g - 2.5) < EPS)); assert.ok(m.vest.every(g => Math.abs(g - 1.35) < EPS));
  }
});

test('layout v2 fallback: valid, three areas, wider than v1, and the generator can still reach it', () => {
  for (const seed of [1, 99, 123456, 4000000000]) {
    const fb = E.fallbackSection(seed, 7); assert.deepEqual(E.validateLayout(fb), { ok: true, errors: [] }); assert.equal(fb.areaCount, 3); assert.equal(fb.layoutVersion, 2);
    const m = measure(fb); assert.ok(m.hall.every(g => Math.abs(g - 3.0) < EPS) && m.branch.every(g => g >= E.CLEAR_V2.branch - EPS));
    assert.deepEqual(E.validateLayout(E.fallbackSection(seed, 7, 1)), { ok: true, errors: [] });
    const gone = JSON.parse(JSON.stringify(fb)); gone.collisionRects = gone.collisionRects.slice(0, 6); assert.equal(E.validateLayout(gone).ok, false);   // validation still has teeth on v2
  }
});

test('layout v2 decor: in alcoves/perimeter only, never in the walking lane, solid pieces are in collision and routes', () => {
  const kinds = new Set(); let solid = 0, flat = 0;
  for (let i = 0; i < 120; i++) {
    const L = E.genEndlessSection(i * 7001 + 5, 1 + (i % 30)), again = E.genEndlessSection(i * 7001 + 5, 1 + (i % 30));
    assert.deepEqual(L.decor, again.decor);                                                                  // deterministic from decorSeed
    const lane = []; for (const [a, b] of L.nav.edges) { const [ax, az] = L.nav.nodes[a], [bx, bz] = L.nav.nodes[b], n = Math.ceil(Math.hypot(bx - ax, bz - az) / 0.2); for (let k = 0; k <= n; k++) lane.push([ax + (bx - ax) * k / n, az + (bz - az) * k / n]); }
    for (const d of L.decor) {
      kinds.add(d.kind); d.solid ? solid++ : flat++;
      assert.equal(L.collisionRects.some(r => r === d.rect || (r.x0 === d.rect.x0 && r.z0 === d.rect.z0 && r.x1 === d.rect.x1 && r.z1 === d.rect.z1)), d.solid, 'solid <=> in collision');
      assert.ok(Math.min(Math.abs(d.rect.z0), Math.abs(d.rect.z1)) >= E.CORRIDOR_HALF_V2 + 0.15, 'decor in the main hall');
      for (const [x, z] of lane) assert.ok(!E.circleHitsRect(x, z, E.LANE_R - 1e-9, d.rect), `${d.kind} in the walking lane`);
      for (const o of L.objectives) assert.ok(!E.circleHitsRect(o.approachPoint[0], o.approachPoint[1], 0.99, d.rect), 'decor crowds a paper');
      assert.ok(d.rect.x1 > d.rect.x0 && d.rect.z1 > d.rect.z0);
    }
    assert.deepEqual(E.validateLayout(L), { ok: true, errors: [] });
  }
  assert.ok(kinds.size >= 6 && solid > 200 && flat > 100, `kinds ${kinds.size} solid ${solid} flat ${flat}`);
});

test('saved v1 sections finish on v1, the next section and new runs are v2', () => {
  const run = E.loadStore({ getItem: k => k === E.STORE_KEY_V1 ? JSON.stringify(V1_STORE) : null }).run;
  assert.deepEqual([run.genVersion, run.nextGenVersion], [1, 2]);
  assert.equal(E.genEndlessSection(run.seed, run.section, run.genVersion).layoutVersion, 1);
  const next = E.nextSection(run, E.emptyStore()).run; assert.deepEqual([next.section, next.genVersion], [6, 2]);
  assert.equal(E.genEndlessSection(next.seed, next.section, next.genVersion).layoutVersion, 2);
  assert.equal(E.newRun(5).genVersion, 2);
});

test('settings: appearance id and ambience level are sanitised, defaults fill missing fields, sound/look untouched', () => {
  const mem = new Map(), st = { getItem: k => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)) };
  assert.deepEqual(E.emptyStore().settings, { sound: true, look: 1, appearance: 'animal_001', ambience: 0.5 });
  const c = E.cleanSettings;
  assert.deepEqual(c(undefined), E.emptyStore().settings);
  assert.deepEqual([c({ appearance: 'animal_042' }).appearance, c({ appearance: 'animal_999' }).appearance], ['animal_042', 'animal_999']);   // well-formed ids kept (lookById falls back)
  for (const bad of ['animal_1', 'ANIMAL_001', 'animal_0012', ' animal_001', 7, null, {}, 'corgi']) assert.equal(c({ appearance: bad }).appearance, 'animal_001');
  assert.deepEqual([0, 0.3, 1, 2, -1, NaN, '0.7', null, Infinity].map(a => c({ ambience: a }).ambience), [0, 0.3, 1, 1, 0, 0.5, 0.5, 0.5, 0.5]);
  mem.set(E.STORE_KEY, JSON.stringify({ v: 2, best: { section: 1 }, run: null, settings: { sound: false, look: 1.5 } }));   // an old v2 save without the new fields
  assert.deepEqual(E.loadStore(st).settings, { sound: false, look: 1.5, appearance: 'animal_001', ambience: 0.5 });
  const s = E.emptyStore(); s.settings.appearance = 'animal_017'; s.settings.ambience = 0.2; E.saveStore(st, s);
  assert.deepEqual([E.loadStore(st).settings.appearance, E.loadStore(st).settings.ambience], ['animal_017', 0.2]);
});

test('A05 healing: four distinct awards restore exactly one heart, each at most a quarter, clamped at max, zero at full', () => {
  let r = { ...E.newRun(7), quarters: 4 };
  for (let i = 0; i < 4; i++) { const a = E.awardHealing(r, 'h' + i); assert.equal(a.delta, 1); r = a.run; }
  assert.equal(r.quarters, 8);
  r = { ...r, quarters: E.maxQuarters(r) - 1 };
  const last = E.awardHealing(r, 'top'); assert.deepEqual([last.delta, last.run.quarters], [1, E.maxQuarters(r)]);
  const full = E.awardHealing(last.run, 'over-top'); assert.deepEqual([full.delta, full.run.quarters], [0, E.maxQuarters(r)]);   // full health: nothing, no feedback
  assert.ok(full.run.healed.includes('over-top'));                                                                               // ...but the award is spent
  assert.equal(E.awardHealing({ ...r, status: 'over', quarters: 0 }, 'dead').delta, 0);                                          // a finished run never heals
  for (let i = 0; i < 100; i++) r = E.awardHealing(r, 'many' + i).run;
  assert.ok(r.healed.length <= E.HEALED_KEEP && r.quarters === E.maxQuarters(r));
});

test('A06 healing: repeated callbacks cannot duplicate an award, traits cannot multiply it, new runs start at base, the record survives a reload', () => {
  let r = { ...E.newRun(8), quarters: 5 };
  const once = E.awardHealing(r, 'pickup:1');
  const again = E.awardHealing(once.run, 'pickup:1'); assert.deepEqual([again.delta, again.run.quarters], [0, 6]);           // same pickup, many collision callbacks
  assert.strictEqual(again.run, once.run);
  // every trait at a huge stack: one award is still one quarter
  const big = { ...r, traits: Object.fromEntries(E.TRAIT_IDS.map(id => [id, 500])) };
  assert.equal(E.awardHealing(big, 'x').delta, 1);
  // Heart pick: +1 max and one quarter; a replayed offer heals nothing (both the pick record and the award record refuse it)
  const offer = { objectiveId: 's:3:1', article: 0, choices: [{ perk: 'heart', kind: 'new' }, { perk: 'quick', kind: 'new' }, { perk: 'scent', kind: 'new' }] };
  const p = E.pickOffer({ ...r, pendingOffer: offer }, 0, E.emptyStore()).run;
  assert.deepEqual([p.quarters, p.healed], [6, ['pick:s:3:1']]);
  assert.equal(E.awardHealing(p, 'pick:s:3:1').delta, 0);
  // new run is initialisation, not a reward
  assert.deepEqual([E.newRun(1).quarters, E.newRun(1).healed], [E.BASE_QUARTERS, []]);
  // a reload keeps the record, so a restored pending award cannot pay twice
  const mem = new Map(), st = { getItem: k => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)) };
  const s = E.emptyStore(); s.run = once.run; E.saveStore(st, s);
  const back = E.loadStore(st).run; assert.deepEqual(back.healed, ['pickup:1']); assert.equal(E.awardHealing(back, 'pickup:1').delta, 0);
});
