// Tour reward record, mission predicates, and rescue-film coverage (tv/mom-tour.js core).
// Run: node --test tools/check_mom_tour.test.mjs   (the reset test needs jsdom: NODE_PATH=$(npm root -g))
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require = createRequire(import.meta.url);
const C = require('../tv/mom-tour.js');

const memory = () => { const m = new Map(); return {getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k)}; };

/* ---------- film coverage ---------- */
const D = 20;
function rig() {   // fake clock + fake video; sampled every 250 ms like the page does
  const storage = memory(), store = C.createStore(storage);
  const s = {t: 0, wall: 1e6, playing: true, visible: true, got: []};
  const host = {now: () => s.wall, time: () => s.t, duration: () => D, rate: () => 1, active: () => s.playing && s.visible};
  const tracker = new C.FilmTracker('f', store, host, id => s.got.push(id));
  const play = (sec, {advance = true} = {}) => { for (let i = 0; i < sec * 4; i++) { s.wall += 250; if (advance) { s.t += 0.25; if (s.t >= D) s.t -= D; } tracker.sample(); } };
  return {s, store, tracker, play, storage};
}
const doneRec = r => r.store.read().films.f?.done === true;

test('interval math: merge, clip, slack', () => {
  assert.deepEqual(C.mergeIntervals([[5, 9], [0, 3], [2, 6], [-4, 1], [30, 40]], 20), [[0, 9]]);
  assert.equal(C.qualifies([[0, 19.5]], 20), true);
  assert.equal(C.qualifies([[0, 19.4]], 20), false);
  assert.equal(C.qualifies([[0, 9], [9.5, 20]], 20), true);          // a 0.5 s gap is the whole slack
  assert.equal(C.qualifies([[0, 9], [9.6, 20]], 20), false);
  assert.equal(C.percent([[0, 10]], 20), 50);
  assert.equal(C.qualifies([[0, 10]], NaN), false);
});

test('full playthrough awards once; repeated loops do not re-award', () => {
  const r = rig(); r.tracker.sample(); r.play(20); r.tracker.flush();
  assert.equal(doneRec(r), true); assert.deepEqual(r.s.got, ['f']);
  r.play(20); r.tracker.flush(); assert.deepEqual(r.s.got, ['f']);
});

test('scrub-to-end and skipped middle supply no coverage', () => {
  const r = rig(); r.tracker.sample(); r.play(5);
  r.s.t = D - 0.1; r.play(0.5, {advance: false}); r.tracker.flush();
  assert.equal(doneRec(r), false);
  assert.ok(C.coveredSeconds(r.tracker.intervals, D) < 7);
  const a = rig(); a.tracker.sample(); a.play(5); a.s.t = 15; a.tracker.sample(); a.play(5); a.tracker.flush();
  assert.equal(doneRec(a), false);                                      // 0-5 and 15-20 only
});

test('repeated short fragment never adds up to the film', () => {
  const r = rig();
  for (let i = 0; i < 20; i++) { r.s.t = 0; r.tracker.reset(); r.tracker.sample(); r.play(3); }
  r.tracker.flush(); assert.equal(doneRec(r), false); assert.ok(r.tracker.pct() <= 15);
});

test('pause/resume and reload keep coverage (the record is the memory)', () => {
  const r = rig(); r.tracker.sample(); r.play(10);
  r.s.playing = false; r.tracker.sample(); r.s.wall += 60000;           // paused a minute
  r.s.playing = true; r.tracker.sample(); r.play(5);
  r.tracker.flush(); assert.equal(doneRec(r), false);
  const store = C.createStore(r.storage), s2 = {t: 15, wall: 2e6, got: []};   // reload / channel remount
  const t2 = new C.FilmTracker('f', store, {now: () => s2.wall, time: () => s2.t, duration: () => D, rate: () => 1, active: () => true}, id => s2.got.push(id));
  t2.sample(); for (let i = 0; i < 24; i++) { s2.wall += 250; s2.t += 0.25; t2.sample(); } t2.flush();
  assert.equal(store.read().films.f.done, true); assert.deepEqual(s2.got, ['f']);
});

test('hidden playback is never merged later', () => {
  const r = rig(); r.tracker.sample(); r.play(5);
  r.s.visible = false; r.play(10); r.s.visible = true;                  // plays on while hidden
  r.tracker.sample(); r.play(5); r.tracker.flush();
  assert.equal(doneRec(r), false);
  assert.ok(C.coveredSeconds(r.tracker.intervals, D) <= 10.4);
});

test('loop boundary credits the tail and the head', () => {
  const r = rig(); r.s.t = 0; r.tracker.sample(); r.play(20.5); r.tracker.flush();
  assert.equal(doneRec(r), true);
});

test('a replaced film (new duration) voids incomplete coverage but never revokes an award', () => {
  const store = C.createStore(memory());
  store.mergeFilm('x', 20, [[0, 10]]); store.mergeFilm('x', 30, [[0, 5]]);
  assert.equal(store.read().films.x.pct, 16);
  store.mergeFilm('y', 20, [[0, 20]]); store.mergeFilm('y', 30, [[0, 1]]);
  assert.equal(store.read().films.y.done, true);
});

/* ---------- reward record ---------- */
test('unlock/queue/announce are idempotent and merge with another tab', () => {
  const storage = memory(), a = C.createStore(storage, () => 1), b = C.createStore(storage, () => 2);
  assert.equal(a.unlock('fuel', 'fuel'), true); assert.equal(a.unlock('fuel', 'fuel'), false);
  assert.equal(b.unlock('alarm', 'goon'), true);                        // a second tab writes in between
  assert.deepEqual(a.read().pendingRewards, ['fuel', 'alarm']);
  a.announce('fuel'); a.announce('fuel');
  assert.deepEqual(b.read().pendingRewards, ['alarm']);
  assert.equal(b.unlock('fuel', 'again'), false);                       // an announced reward is never re-queued
  assert.deepEqual(b.read().pendingRewards, ['alarm']);
  assert.equal(b.read().unlocked.fuel.evidence, 'fuel');
  assert.deepEqual(C.createStore(storage).read().pendingRewards, ['alarm']);   // unannounced survives a refresh
  storage.setItem(C.KEY, 'not json'); assert.deepEqual(C.createStore(storage).read().unlocked, {});
});

const envOf = (o = {}) => ({ls: k => o.ls?.[k] ?? null, ss: k => o.ss?.[k] ?? null, pageDone: id => !!o.done?.includes(id), pagesReady: () => !!o.ready, handOffer: () => !!o.offer});
const goggles = JSON.stringify({version: 1, acquiredAt: 5, recipe: [0, 1, 2, 3, 4, 5]});

test('predicates: each receipt, and the ambiguous ones stay out', () => {
  const run = o => { const s = C.createStore(memory()); C.reconcile(envOf(o), s); return Object.keys(s.read().unlocked).sort(); };
  assert.deepEqual(run({}), []);
  assert.deepEqual(run({ls: {'mbs-fuel-flight-v1': JSON.stringify({version: 1, pipes: 8, completedAt: 9})}}), ['fuel']);
  assert.deepEqual(run({ls: {'mbs-fuel-flight-v1': JSON.stringify({version: 1, pipes: 7, completedAt: 9})}}), []);
  assert.deepEqual(run({ss: {'mbs-goggles-v1': goggles}}), ['jump']);
  assert.deepEqual(run({ls: {'mbs-goggles-v1': JSON.stringify({version: 1, acquiredAt: 5, recipe: [1, 0, 2, 3, 4, 5]})}}), []);
  assert.deepEqual(run({done: ['lilboyfriend', 'corgi']}), ['corgi', 'lilboyfriend']);
  // goon: character creation (and the completePage('goon') network-flow recovers from it) must NOT unlock the alarm
  assert.deepEqual(run({done: ['goon'], ls: {'mbs-gala-character-created-v1': '123'}}), []);
  assert.deepEqual(run({ls: {'mbs-gala-completed-v1': String(Date.now())}}), ['alarm']);
});

test('hand: DJ banked early waits for the four prerequisites and the offer', () => {
  const s = C.createStore(memory());
  C.reconcile(envOf({done: ['djscratch']}), s);
  assert.ok(s.read().missions.djscratch); assert.equal(s.read().unlocked.hand, undefined);
  C.reconcile(envOf({done: ['djscratch'], ready: true}), s);             // prerequisites, no offer yet
  assert.equal(s.read().unlocked.hand, undefined);
  C.reconcile(envOf({ready: true, offer: true}), s);                     // offer reached (DJ stays banked)
  assert.equal(s.read().unlocked.hand.evidence, 'djscratch'); assert.deepEqual(s.read().pendingRewards, ['hand']);
});

/* ---------- hourly story reset ---------- */
test('hourly story reset removes story keys but keeps mom-tour-v1 and the Fuel receipt', () => {
  let JSDOM; try { ({JSDOM} = require('jsdom')); } catch { return; }      // needs NODE_PATH=$(npm root -g)
  const src = f => readFileSync(new URL('../tv/' + f, import.meta.url), 'utf8');
  const dom = new JSDOM('<!doctype html><body></body>', {url: 'https://mominc.online/tv/', runScripts: 'outside-only'});
  const w = dom.window, store = C.createStore(w.localStorage);
  store.unlock('fuel', 'fuel'); store.mission('fuel'); store.update(r => { r.films.f = {done: true}; });
  w.localStorage.setItem('mbs-fuel-flight-v1', '{"version":1,"pipes":8,"completedAt":1}');
  w.localStorage.setItem('mbs-gala-completed-v1', '1'); w.localStorage.setItem('mbs-goggles-v1', 'x');
  w.localStorage.setItem('mbs-story-started-at-v1', String(Date.now() - 2 * 3600 * 1000));    // the hour is up
  w.eval(src('mbs-channels.js')); w.eval(src('state.js'));
  assert.equal(w.localStorage.getItem('mbs-gala-completed-v1'), null, 'reset really ran');
  assert.equal(w.localStorage.getItem('mbs-goggles-v1'), null);
  const r = C.createStore(w.localStorage).read();
  assert.ok(r.unlocked.fuel && r.missions.fuel && r.films.f.done, 'rewards, missions and film coverage survive');
  assert.notEqual(w.localStorage.getItem('mbs-fuel-flight-v1'), null);
  w.close();   // state.js leaves a one-hour timer running
});
