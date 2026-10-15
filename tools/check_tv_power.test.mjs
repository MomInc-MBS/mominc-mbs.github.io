import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const runtime = readFileSync(new URL('../tv/mbs-runtime.js', import.meta.url), 'utf8');
const shell = readFileSync(new URL('../tv/tv.js', import.meta.url), 'utf8');
function rig() {
  const listeners = new Map(), timers = new Map(); let serial = 0;
  const document = {
    addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(fn); },
    removeEventListener(type, fn) { listeners.get(type)?.delete(fn); },
    dispatchEvent(e) { for (const fn of [...(listeners.get(e.type) || [])]) fn(e); }
  };
  const window = {};
  const context = vm.createContext({window, document, Set, Map,
    CustomEvent: class {constructor(type, options) {this.type = type; this.detail = options?.detail;}},
    setTimeout(fn) {const id = ++serial; timers.set(id, fn); return id;}, clearTimeout(id) {timers.delete(id);}});
  vm.runInContext(runtime, context);
  return {rt: window.MBS_RT, window, context, document, timers,
    tick() {const pending = [...timers.values()]; timers.clear(); for (const fn of pending) fn();}};
}
test('warm-up waits for every existing pause source and then completes once', () => {
  const r = rig(); let starts = 0;
  r.rt.pause('game'); r.rt.pause('visibility');
  r.rt.warmUp(900, () => starts++);
  r.tick(); assert.equal(starts, 0);
  r.rt.resume('game'); r.tick(); assert.equal(starts, 0);
  r.rt.resume('visibility'); r.tick(); r.tick(); assert.equal(starts, 1);
});
test('pause during warm-up resumes instead of abandoning the power transition', () => {
  const r = rig(); let starts = 0;
  r.rt.warmUp(900, () => starts++);
  r.rt.pause('visibility'); r.tick(); assert.equal(starts, 0);
  r.rt.resume('visibility'); r.tick(); assert.equal(starts, 1);
});
test('switching off cancels a suspended warm-up and its resume listener', () => {
  const r = rig(); let starts = 0;
  const cancel = r.rt.warmUp(900, () => starts++);
  r.rt.pause('power'); cancel(); r.rt.resume('power');
  r.tick(); assert.equal(starts, 0); assert.equal(r.timers.size, 0);
});
test('joined wires power on with unavailable storage and a paused restored game', () => {
  const r = rig(), tv = {dataset: {state: 'off', off3d: 'on'}, dispatchEvent() {throw Error('joined wires rejected');}};
  let click, focused = 0;
  Object.assign(r.context, {tv, screen: {focus() {focused++;}}, power: {addEventListener(type, fn) {click = fn;}},
    sessionStorage: {getItem() {return null;}, setItem() {throw Error('unavailable');}},
    localStorage: {getItem() {return null;}}, paintDark() {}, Event: class {}});
  r.window.MBS_OFF3D = {hot: true}; r.window.MBS = {};
  r.rt.pause('game');
  vm.runInContext(shell.slice(shell.indexOf('  const hotwired ='), shell.indexOf('  // --- the picture control')), r.context);
  click(); click(); assert.equal(tv.dataset.state, 'warming'); assert.equal(r.timers.size, 0);
  r.rt.resume('game'); assert.equal(r.timers.size, 1); r.tick();
  assert.equal(tv.dataset.state, 'on'); assert.equal(focused, 1);
});
