import test from 'node:test';
import assert from 'node:assert/strict';
import sound from '../tv/sound.js';

function rig(fetchImpl = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(4) }), initialState = 'suspended') {
  const sources = [], gains = [], storage = new Map();
  class Context {
    constructor() { this.state = initialState; this.currentTime = 0; this.sampleRate = 100; this.destination = {}; }
    createGain() {
      const node = { gain: { value: 0, setTargetAtTime() {}, setValueAtTime() {} }, connect(to) { this.output = to; }, disconnect() { this.disconnected = true; } };
      gains.push(node); return node;
    }
    createBufferSource() {
      const node = { playbackRate: { value: 1 }, connect(to) { this.output = to; }, disconnect() { this.disconnected = true; }, start() { this.started = true; }, stop() { this.stopped = true; this.onended?.(); } };
      sources.push(node); return node;
    }
    createBuffer(_channels, length) { return { getChannelData: () => new Float32Array(length) }; }
    decodeAudioData() { return Promise.resolve({ duration: .3 }); }
    resume() { this.state = 'running'; return Promise.resolve(); }
    close() { this.state = 'closed'; }
  }
  let time = 1000;
  const env = {
    AudioContext: Context, fetch: fetchImpl, performance: { now: () => time },
    document: { hidden: false },
    localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
  };
  return { env, sources, gains, storage, advance: ms => { time += ms; } };
}
const settle = () => new Promise(resolve => setImmediate(resolve));

test('preloading never plays; first gesture plays a decoded sample through gain and master', async () => {
  const r = rig(), engine = sound.createEngine(r.env);
  engine.preload(); await settle();
  assert.equal(r.sources.length, 0);
  assert.equal(engine.play('click'), true);
  await settle();
  assert.equal(r.sources.filter(x => x.started).length, 1);
  const voice = r.sources[0];
  assert.equal(voice.output, r.gains[1]);
  assert.equal(r.gains[1].output, r.gains[0]);
  assert.equal(r.gains[0].output instanceof Object, true);
  assert.equal(engine.play('click'), false, 'same-kind bounce is throttled');
  r.advance(100);
  assert.equal(engine.play('click'), true);
  await settle();
  assert.equal(r.sources.filter(x => x.started).length, 2);
});

test('CRT hiss cannot start before a gesture even when AudioContext runs on construction', async () => {
  const r = rig(undefined, 'running'), engine = sound.createEngine(r.env);
  engine.preload(); engine.setStatic(true); await settle();
  assert.equal(r.sources.length, 0);
  engine.unlock();
  assert.equal(r.sources.filter(x => x.started).length, 1);
  engine.stop();
});

test('mute and visibility stop active voices, and stale loads never replay', async () => {
  let release;
  const r = rig(url => url.endsWith('metal-switch-1.mp3')
    ? new Promise(resolve => { release = resolve; })
    : Promise.resolve({ ok: true, arrayBuffer: async () => new ArrayBuffer(4) }));
  const engine = sound.createEngine(r.env);
  assert.equal(engine.play('switch'), true);
  engine.setMuted(true);
  release({ ok: true, arrayBuffer: async () => new ArrayBuffer(4) });
  await settle();
  assert.equal(r.sources.filter(x => x.started).length, 0);
  assert.equal(r.storage.get('mbs-tv-muted-v1'), '1');
  assert.equal(sound.createEngine(r.env).muted, true, 'mute preference survives reload');
  engine.setMuted(false);
  await settle();
  r.advance(100);
  engine.play('switch'); await settle();
  assert.equal(r.sources.filter(x => x.started).length, 1);
  engine.stop();
  assert.equal(r.sources[0].stopped, true);
  r.env.document.hidden = true;
  r.advance(100);
  assert.equal(engine.play('switch'), false);
});

test('voice count stays bounded and failed fetch can retry on the next gesture', async () => {
  let fail = true, calls = 0;
  const r = rig(async () => { calls++; if (fail) throw Error('offline'); return { ok: true, arrayBuffer: async () => new ArrayBuffer(4) }; });
  const engine = sound.createEngine(r.env);
  engine.preload(); await settle();
  const failedCalls = calls;
  fail = false;
  engine.unlock(); await settle();
  assert.ok(calls > failedCalls);
  for (let i = 0; i < 10; i++) { r.advance(100); engine.play('bloop'); await settle(); }
  assert.ok(r.sources.filter(x => x.started && !x.stopped).length <= 6);
});

test('cabinet controls, digital frame buttons and BFCache restoration keep one appropriate cue', async () => {
  const r = rig(), listeners = new Map(), childListeners = new Map();
  const add = (map, name, fn) => { const all = map.get(name) || []; all.push(fn); map.set(name, all); };
  const dispatch = (map, name, event) => map.get(name)?.forEach(fn => fn(event));
  const button = (id, key = false) => ({
    id, disabled: false, classList: { contains: name => key && name === 'key' },
    getAttribute: () => null, matches: () => false,
    closest(selector) { return selector === 'button,a,[role=button]' ? this : null; },
  });
  const child = { addEventListener: (name, fn) => add(childListeners, name, fn), querySelectorAll: () => [] };
  const frame = { matches: () => false, contentDocument: child };
  const skipped = { matches: selector => selector.includes('#ggGame'), contentDocument: {
    addEventListener: () => assert.fail('managed game frame must not be bound'),
  } };
  const tv = { dataset: { state: 'on' }, contains: node => node.id !== 'digital' };
  const doc = {
    hidden: false,
    getElementById: id => id === 'tv' ? tv : null,
    querySelectorAll: () => [frame, skipped],
    addEventListener: (name, fn) => add(listeners, name, fn),
  };
  r.env.document = doc;
  r.env.addEventListener = (name, fn) => add(listeners, name, fn);
  r.env.MutationObserver = class { observe() {} };
  const engine = sound.mount(r.env);
  const cues = () => r.sources.filter(x => x.started && x.buffer?.duration);
  await settle();
  const power = button('power', true);
  dispatch(listeners, 'pointerdown', { target: power, isPrimary: true });
  dispatch(listeners, 'click', { target: power, detail: 1 });
  await settle();
  assert.equal(cues().length, 1, 'cabinet power gets one switch');
  const knob = button('knob');
  dispatch(listeners, 'click', { target: knob, detail: 0 });
  await settle();
  assert.equal(cues().length, 2, 'keyboard knob press clicks');
  dispatch(listeners, 'click', { target: knob, detail: 1 });
  await settle();
  assert.equal(cues().length, 2, 'pointer knob click is not doubled');
  const digital = button('digital');
  dispatch(childListeners, 'pointerdown', { target: digital });
  dispatch(childListeners, 'click', { target: digital, detail: 1 });
  await settle();
  assert.equal(cues().length, 3, 'same-origin frame button bloops');
  const disabled = button('digital');
  disabled.getAttribute = name => name === 'aria-disabled' ? 'true' : null;
  r.advance(100);
  dispatch(childListeners, 'click', { target: disabled, detail: 1 });
  await settle();
  assert.equal(cues().length, 3, 'ARIA-disabled digital control stays silent');
  dispatch(listeners, 'pagehide', {});
  assert.ok(r.sources.every(x => x.stopped || !x.started));
  dispatch(listeners, 'pageshow', { persisted: true });
  r.advance(100);
  dispatch(childListeners, 'click', { target: digital, detail: 1 });
  await settle();
  assert.equal(cues().length, 4, 'BFCache return can play again');
  engine.dispose();
});
