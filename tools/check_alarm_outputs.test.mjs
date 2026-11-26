// Foreground outputs: arbiter, one audio owner, sound plan, wake lock, badge, speech, vibration, torch, audition, capability states, check-ins. Fake browser objects, no real audio.
process.env.TZ = 'UTC';
import test from 'node:test';
import assert from 'node:assert/strict';
import {soundPlan, vibratePattern, pick, createOutputs, createOwner} from '../apps/alarm/outputs.js';
import {describe, facts0, CAP_IDS} from '../apps/alarm/capabilities.js';
import * as K from '../apps/alarm/checkin.js';
import {blank} from '../apps/alarm/remind.js';

const tick = () => new Promise(r => setTimeout(r, 0));
const sound = (o = {}) => ({...blank().sound, stage: ['air-horn', 'train-horn', 'buzzer', 'crash'], pattern: 'burst', volume: 80, ramp: {from: 40, to: 100, secs: 20}, ...o});
const rem = (o = {}) => ({...blank(), sound: sound(), ...o});
const cand = (occId, face, due, o = {}) => ({occId, face, alert: face, due, snoozed: false, title: occId, reminder: rem(), ...o});

function fakeEnv(o = {}) {
  const log = {started: [], stopped: [], gains: [], vib: [], spoken: [], cancels: 0, badge: [], wake: 0, wakeReleased: 0};
  class AC {
    constructor() { this.state = o.acState || 'suspended'; this.currentTime = 5; this.destination = {}; log.ctx = this; }
    async resume() { if (!o.acStuck) this.state = 'running'; }
    createBuffer() { return {}; }
    createBufferSource() { const s = {loop: false, connect() {}, disconnect() {}, start() { log.started.push(s); }, stop() { log.stopped.push(s); s.onended?.(); }}; return s; }
    createGain() { const g = {gain: {setValueAtTime: (v, t) => log.gains.push(['set', v, t]), linearRampToValueAtTime: (v, t) => log.gains.push(['ramp', v, t])}, connect() {}}; return g; }
    async decodeAudioData() { return {duration: 3}; }
  }
  const navigator = {vibrate: o.noVibrate ? undefined : p => { log.vib.push(p); return true; }, userAgent: 'x',
    wakeLock: o.noWake ? undefined : {request: async () => { log.wake++; const l = {release: async () => { log.wakeReleased++; }, addEventListener() {}}; return l; }},
    setAppBadge: async n => log.badge.push(n), clearAppBadge: async () => log.badge.push(0), ...(o.navigator || {})};
  const window = {AudioContext: o.noAudio ? undefined : AC, Audio: o.Audio, speechSynthesis: o.noSpeech ? undefined : {speak: u => log.spoken.push(u.text), cancel: () => log.cancels++},
    SpeechSynthesisUtterance: o.noSpeech ? undefined : class { constructor(t) { this.text = t; } }, ...(o.window || {})};
  return {log, env: {navigator, window, document: {visibilityState: 'visible'}, fetch: async () => ({ok: true, arrayBuffer: async () => new ArrayBuffer(8)}), ...window, ...(o.env || {})}};
}

test('sound plan: per-stage pick, rotation through the picks, burst vs continuous, volume and a ramp relative to it; nothing is ever chosen for the user', () => {
  const r = rem();
  assert.deepEqual([0, 1, 2, 3, 4, 9].map(n => soundPlan(r, n).id), ['air-horn', 'train-horn', 'buzzer', 'crash', 'crash', 'crash']);
  const rot = rem({sound: sound({rotate: true, stage: ['air-horn', 'air-horn', 'crash', 'crash']})});
  assert.deepEqual([0, 1, 2, 3].map(n => soundPlan(rot, n).id), ['air-horn', 'crash', 'air-horn', 'crash']);
  const p = soundPlan(r, 0); assert.deepEqual([p.loop, p.gain, p.file], [false, 0.8, 'adhd_air_horn']); assert.deepEqual(p.ramp, {from: 0.8 * 0.4, to: 0.8, secs: 20});
  assert.equal(soundPlan(rem({sound: sound({pattern: 'continuous', ramp: {from: 0, to: 0, secs: 0}})}), 0).loop, true);
  assert.equal(soundPlan(rem({sound: sound({ramp: {from: 0, to: 0, secs: 0}})}), 0).ramp, null);
  assert.equal(soundPlan(rem({sound: blank().sound}), 0), null);
  assert.equal(soundPlan(rem({sound: sound({stage: ['nope', null, 5, undefined]})}), 0), null);
});

test('vibration patterns scale only the on-times; off/unknown -> null', () => {
  assert.deepEqual(vibratePattern({pattern: 'pulse', strength: 100}), [200, 100]);
  assert.deepEqual(vibratePattern({pattern: 'pulse', strength: 50}), [100, 100]);
  assert.equal(vibratePattern({pattern: 'off'}), null); assert.equal(vibratePattern({pattern: 'pulse', strength: 0}), null); assert.equal(vibratePattern(undefined), null);
  for (const p of ['pulse', 'heartbeat', 'sos', 'rapid', 'wave']) assert.ok(vibratePattern({pattern: p, strength: 100}).every(x => x > 0));
});

test('arbiter: highest stage among not-snoozed, ties to the earliest due', () => {
  assert.equal(pick([]), null);
  assert.equal(pick([cand('a', 1, 5), cand('b', 3, 9), cand('c', 2, 1)]).occId, 'b');
  assert.equal(pick([cand('a', 3, 9), cand('b', 3, 1)]).occId, 'b');
  assert.equal(pick([cand('a', 3, 1, {snoozed: true}), cand('b', 1, 9)]).occId, 'b');
  assert.equal(pick([cand('a', 3, 1, {snoozed: true})]), null);
});

test('ONE horn across reminders: two ringing -> one source for the top; a new alert replaces it; the same alert is never re-fired by a tick', async () => {
  const {env, log} = fakeEnv(), o = createOutputs({env});
  await o.unlock(); assert.equal(o.facts().audio, 'running');
  const lo = cand('low', 1, 100), hi = cand('high', 2, 200), m = c => ({visible: true, owner: true, cands: c});
  const base = log.started.length;                                   // unlock's silent tick
  o.sync(m([lo, hi])); await tick(); await tick();
  assert.equal(log.started.length - base, 1);
  const first = log.started.at(-1); assert.equal(first.loop, false);
  o.sync(m([lo, hi])); o.sync(m([lo, hi])); await tick();
  assert.equal(log.started.length - base, 1);                        // idempotent
  o.sync(m([lo, {...hi, alert: 3, face: 3}])); await tick(); await tick();
  assert.equal(log.started.length - base, 2); assert.ok(log.stopped.includes(first));   // previous voice stopped before the next one
  o.sync(m([lo])); await tick(); await tick();
  assert.equal(log.started.length - base, 3);                        // the arbiter now voices the remaining one
  o.sync(m([])); assert.ok(log.stopped.includes(log.started.at(-1)));
});

test('gain ramp and burst/continuous reach Web Audio; no ramp -> a flat gain', async () => {
  const {env, log} = fakeEnv(), o = createOutputs({env}); await o.unlock();
  o.sync({visible: true, owner: true, cands: [cand('a', 0, 1, {reminder: rem({sound: sound({pattern: 'continuous'})})})]}); await tick(); await tick();
  assert.deepEqual(log.gains.slice(-2), [['set', 0.8 * 0.4, 5], ['ramp', 0.8, 25]]);
  assert.equal(log.started.at(-1).loop, true);
  o.sync({visible: true, owner: true, cands: [cand('b', 0, 1, {reminder: rem({sound: sound({ramp: {from: 0, to: 0, secs: 0}})})})]}); await tick(); await tick();
  assert.deepEqual(log.gains.at(-1), ['set', 0.8, 5]);
});

test('hidden page or a non-owner tab is silent and drops what was playing; snoozed -> silent; foreground only', async () => {
  const {env, log} = fakeEnv(), o = createOutputs({env}); await o.unlock();
  const c = [cand('a', 1, 1)], base = log.started.length;
  o.sync({visible: false, owner: true, cands: c}); o.sync({visible: true, owner: false, cands: c}); await tick();
  assert.equal(log.started.length - base, 0); assert.equal(log.vib.length, 0);
  o.sync({visible: true, owner: true, cands: c}); await tick(); await tick(); assert.equal(log.started.length - base, 1);
  o.sync({visible: false, owner: true, cands: c}); assert.equal(log.stopped.length >= 1, true);
  o.sync({visible: true, owner: true, cands: [{...c[0], snoozed: true}]}); await tick(); assert.equal(log.started.length - base, 1);   // snoozed: nothing new
});

test('sound needs a gesture: never unlocked -> HTMLAudio is tried once and a refusal asks the UI for a tap; a context that cannot run does the same', async () => {
  let plays = 0;
  const Audio = class { play() { plays++; return Promise.reject(Error('NotAllowedError')); } pause() {} };
  const a = fakeEnv({Audio}), o = createOutputs({env: a.env});
  o.sync({visible: true, owner: true, cands: [cand('a', 0, 1)]}); await tick(); await tick();
  assert.equal(plays, 1); assert.equal(o.needTap(), true); assert.equal(o.facts().audio, 'locked');
  const b = fakeEnv({acStuck: true, Audio}), o2 = createOutputs({env: b.env}); await o2.unlock();
  assert.equal(o2.facts().audio, 'suspended');
  o2.sync({visible: true, owner: true, cands: [cand('a', 0, 1)]}); await tick(); await tick(); assert.equal(o2.needTap(), true);
  const c = fakeEnv({noAudio: true}), o3 = createOutputs({env: c.env}); assert.equal(await o3.unlock(), 'unsupported');
});

test('wake lock only while ringing and visible; badge = live count; speech speaks the title (or is skipped); vibration is feature-detected', async () => {
  const {env, log} = fakeEnv(), o = createOutputs({env}); await o.unlock();
  const r = rem({speak: 'title', vibrate: {pattern: 'pulse', strength: 100}});
  o.sync({visible: true, owner: true, cands: [cand('a', 1, 1, {reminder: r, title: 'Laundry'}), cand('b', 0, 2)]}); await tick(); await tick();
  assert.equal(log.wake, 1); assert.deepEqual(log.badge, [2]); assert.deepEqual(log.spoken, ['Laundry']); assert.deepEqual(log.vib.filter(Array.isArray), [[200, 100]]);
  o.sync({visible: true, owner: true, cands: []}); await tick(); await tick();
  assert.equal(log.wakeReleased, 1); assert.equal(log.badge.at(-1), 0); assert.ok(log.cancels >= 1); assert.deepEqual(log.vib.at(-1), 0);
  const bare = fakeEnv({noVibrate: true, noSpeech: true, noWake: true}), o2 = createOutputs({env: bare.env}); await o2.unlock();
  o2.sync({visible: true, owner: true, cands: [cand('a', 1, 1, {reminder: r})]}); await tick(); await tick();
  assert.ok(bare.log.started.length >= 2);                                                          // unsupported extras are skipped; the sound still plays
  const noWakeOff = fakeEnv(), o3 = createOutputs({env: noWakeOff.env}); await o3.unlock();
  o3.sync({visible: true, owner: true, cands: [cand('a', 1, 1, {reminder: rem({present: {...blank().present, wake: false}})})]}); await tick();
  assert.equal(noWakeOff.log.wake, 0);
});

test('torch: never started without a camera grant; a camera with no torch is reported, not faked; with torch it is steady or pulsing and released', async () => {
  const stopped = [], mk = torch => ({getUserMedia: async () => { const track = {getCapabilities: () => torch ? {torch: true} : {}, applyConstraints: async c => { constraints.push(c.advanced[0].torch); }, stop: () => stopped.push(1)}; return {getVideoTracks: () => [track], getTracks: () => [track]}; }});
  const constraints = [];
  const r = rem({torch: 'steady'}), c = [cand('a', 1, 1, {reminder: r})];
  const a = fakeEnv({navigator: {mediaDevices: mk(true)}}), o = createOutputs({env: a.env}); await o.unlock();
  o.sync({visible: true, owner: true, cands: c}); await tick(); assert.deepEqual(constraints, []);          // no grant yet
  assert.deepEqual(await o.probeCamera(), {camera: 'granted', torch: true});
  o.sync({visible: true, owner: true, cands: []}); o.sync({visible: true, owner: true, cands: [cand('z', 1, 1, {reminder: r})]}); await tick(); await tick();
  assert.deepEqual(constraints, [true]); o.stop(); assert.ok(stopped.length >= 2);
  const b = fakeEnv({navigator: {mediaDevices: mk(false)}}), o2 = createOutputs({env: b.env});
  assert.deepEqual(await o2.probeCamera(), {camera: 'granted', torch: false}); assert.equal(o2.facts().torch, false);
  const d = fakeEnv({navigator: {mediaDevices: {getUserMedia: async () => { throw Object.assign(Error('x'), {name: 'NotAllowedError'}); }}}});
  assert.equal((await createOutputs({env: d.env}).probeCamera()).camera, 'denied');
});

test('audition: one at a time (a new one stops the last); refused while a real alarm sounds', async () => {
  const {env, log} = fakeEnv(), o = createOutputs({env}); await o.unlock();
  await o.audition('sound', {id: 'air-horn', volume: 80}); await tick(); const first = log.started.at(-1);
  await o.audition('sound', {id: 'crash', volume: 60}); await tick(); assert.ok(log.stopped.includes(first));
  await o.audition('vibrate', 'sos'); assert.ok(log.vib.some(p => Array.isArray(p) && p.length > 10));
  o.stopAudition(); assert.ok(log.stopped.includes(log.started.at(-1)));
  o.sync({visible: true, owner: true, cands: [cand('a', 1, 1)]}); await tick(); await tick();
  const n = log.started.length; await o.audition('sound', {id: 'buzzer'}); await tick(); assert.equal(log.started.length, n);
});

test('audio owner across tabs: Web Locks elect exactly one visible tab; a hidden tab lets go and another can take over', async () => {
  const held = new Set(), waiting = [];
  const locks = {request: (name, o, cb) => { if (held.has(name)) return Promise.resolve(cb(null)); held.add(name); const p = cb({}); p.then(() => held.delete(name)); return p; }};
  const mk = () => { const ev = []; return {ev, owner: createOwner({navigator: {locks}}, v => ev.push(v))}; };
  const t1 = mk(), t2 = mk();
  t1.owner.want(true); await tick(); t2.owner.want(true); await tick();
  assert.deepEqual([t1.owner.isOwner(), t2.owner.isOwner()], [true, false]);
  t1.owner.want(false); await tick(); t2.owner.want(true); await tick();
  assert.deepEqual([t1.owner.isOwner(), t2.owner.isOwner()], [false, true]);
  assert.equal(createOwner({navigator: {}}).isOwner(), true);                                    // no coordination API: a single tab owns
});

test('audio owner fallback: BroadcastChannel, the latest visible tab claims and the other yields', async () => {
  const chans = []; class BC { constructor() { chans.push(this); } postMessage(m) { for (const c of chans) if (c !== this) c.onmessage?.({data: m}); } close() {} }
  const a = createOwner({navigator: {}, BroadcastChannel: BC}), b = createOwner({navigator: {}, BroadcastChannel: BC});
  a.want(true); assert.equal(a.isOwner(), true); b.want(true); assert.deepEqual([a.isOwner(), b.isOwner()], [false, true]); b.want(false); assert.equal(b.isOwner(), false);
});

test('capability states are honest: API presence alone never reads as ready; Android-only things are unsupported on the web', () => {
  const win = {Notification: {permission: 'default'}, PushManager: {}, AudioContext: class {}, speechSynthesis: {}, SpeechSynthesisUtterance: class {}, BarcodeDetector: class {}, NDEFReader: class {}, DeviceMotionEvent: {requestPermission() {}}, matchMedia: () => ({matches: true})};
  const env = {navigator: {serviceWorker: {}, vibrate() {}, wakeLock: {}, setAppBadge() {}, mediaDevices: {getUserMedia() {}}, userAgent: 'iPhone', standalone: true}, window: win};
  const f = facts0(); f.push.origin = 'https://push.example';
  const c = describe(env, f);
  assert.deepEqual(Object.keys(c).sort(), [...CAP_IDS].sort());
  for (const id of ['exactAlarm', 'fullScreen', 'lockScreen', 'dnd', 'overlay', 'widget', 'tile', 'watch', 'bluetooth']) assert.equal(c[id].state, 'unsupported');
  assert.deepEqual([c.notify.state, c.push.state, c.sound.state, c.torch.state, c.qr.state, c.nfc.state, c.motion.state], ['permission', 'permission', 'permission', 'permission', 'permission', 'permission', 'permission']);
  assert.equal(c.vibrate.state, 'foreground'); assert.equal(c.wakeLock.state, 'foreground'); assert.equal(c.speak.state, 'foreground');
  assert.deepEqual(c.sound.reason, 'audio-locked'); assert.equal(c.torch.reason, 'not-probed'); assert.equal(c.webhook.state, 'permission');
  f.audio = 'running'; f.torch = false; f.camera = 'granted'; f.nfc = 'granted'; f.motion = 'granted'; f.wake = true; f.persisted = true; f.push.subscribed = true; win.Notification.permission = 'granted'; f.push.permission = 'granted';
  const d = describe(env, f);
  assert.deepEqual([d.sound.state, d.torch.state, d.torch.reason, d.qr.state, d.nfc.state, d.motion.state, d.wakeLock.state, d.storage.state, d.push.state, d.notify.state], ['foreground', 'unsupported', 'no-torch-capability', 'foreground', 'foreground', 'foreground', 'active', 'active', 'active', 'active']);
  const ios = describe({navigator: {userAgent: 'iPhone', serviceWorker: {}}, window: {Notification: {permission: 'default'}}}, {...facts0(), push: {origin: 'https://p', permission: 'default'}});
  assert.deepEqual([ios.push.state, ios.push.reason, ios.vibrate.state, ios.vibrate.reason, ios.sound.state, ios.qr.state], ['unsupported', 'ios-needs-home-screen', 'unsupported', 'ios-no-vibration', 'unsupported', 'unsupported']);
  assert.equal(describe({navigator: {}, window: {}}, facts0()).push.reason, 'no-server');
  assert.equal(describe(env, {...f, update: {state: 'available'}}).update.state, 'available'); assert.equal(describe(env, {...f, storageError: true}).storage.state, 'error');
  assert.equal(describe(env, {...f, camera: 'denied'}).torch.reason, 'camera-denied'); assert.equal(describe(env, {...f, outbox: 2, webhooks: 1}).webhook.reason, 'pending-sync');
});

test('check-in proofs: QR/NFC compare to what THIS reminder saved; motion needs its step count; shake counter debounces', () => {
  assert.equal(K.verify('qr', {code: 'abc'}, 'abc'), true); assert.equal(K.verify('qr', {code: 'abc'}, 'abd'), false); assert.equal(K.verify('qr', {code: null}, null), false); assert.equal(K.verify('qr', {code: ''}, ''), false);
  assert.equal(K.verify('nfc', {nfc: 'tag1'}, 'tag1'), true); assert.equal(K.verify('nfc', {}, 'tag1'), false);
  assert.equal(K.verify('motion', {steps: 5}, 5), true); assert.equal(K.verify('motion', {steps: 5}, 4), false); assert.equal(K.verify('motion', {steps: 0}, 10), true); assert.equal(K.verify('motion', {steps: 0}, 9), false);
  assert.equal(K.verify('math', {}, 1), false);
  const sc = K.stepCounter(14, 250); let t = 0;
  for (const m of [3, 20, 21, 2, 20, 2, 22, 2]) sc.push({x: m, y: 0, z: 0, t: (t += 100)});       // 20/21 are one shake; 22 comes 200 ms after the last peak: debounced
  assert.equal(sc.count(), 2);
});

test('QR scan reads codes until one matches; unsupported/denied report why; NFC and motion likewise', async () => {
  const frames = [[{rawValue: 'wrong'}], [], [{rawValue: 'right'}]], stopped = [];
  const stream = {getTracks: () => [{stop: () => stopped.push(1)}]};
  const env = {navigator: {mediaDevices: {getUserMedia: async () => stream}}, window: {BarcodeDetector: class { async detect() { return frames.shift() || []; } }},
    document: {createElement: () => ({play: async () => {}, set srcObject(v) {}})}};
  const seen = []; const r = await K.scanQr(env, {code: 'right'}, null, p => seen.push(p));
  assert.deepEqual([r.ok, r.proof, seen], [true, 'right', ['wrong', 'right']]); assert.equal(stopped.length, 1);                  // camera released
  assert.deepEqual(await K.scanQr({navigator: {mediaDevices: {}}, window: {}}, {}), {ok: false, reason: 'no-barcode-detector'});
  assert.equal((await K.scanQr({navigator: {mediaDevices: {getUserMedia: async () => { throw Object.assign(Error('x'), {name: 'NotAllowedError'}); }}}, window: {BarcodeDetector: class {}}}, {})).reason, 'camera-denied');
  assert.equal((await K.scanNfc({window: {}}, {})).reason, 'no-web-nfc');
  class Reader { async scan() {} } let reader; const w = {NDEFReader: class extends Reader { constructor() { super(); reader = this; } }};
  const p = K.scanNfc({window: w}, {nfc: 'tag9'}); await tick(); reader.onreading({serialNumber: 'other', message: {records: []}}); reader.onreading({serialNumber: 'tag9', message: {records: []}});
  assert.deepEqual(await p, {ok: true, proof: 'tag9'});
  const lis = {}, mw = {DeviceMotionEvent: {}, addEventListener: (t, h) => { lis[t] = h; }, removeEventListener: () => {}};
  const mp = K.countMotion({window: mw}, {steps: 2}); for (const [x, t] of [[30, 100], [1, 200], [30, 500]]) lis.devicemotion({accelerationIncludingGravity: {x, y: 0, z: 0}, timeStamp: t});
  assert.equal((await mp).ok, true);
  assert.equal(await K.requestMotion({window: {}}), 'unsupported'); assert.equal(await K.requestMotion({window: {DeviceMotionEvent: {requestPermission: async () => 'denied'}}}), 'denied');
});
