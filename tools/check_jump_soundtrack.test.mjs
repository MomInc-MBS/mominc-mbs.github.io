// Coach Jump soundtrack: manifest integrity + player behaviour against a fake AudioContext/fetch.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createSoundtrack, DEFAULT_TRACK} from '../apps/jump/soundtrack.mjs';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(fs.readFileSync(new URL('apps/jump/music/manifest.json', root)));
const IDS = manifest.tracks.map(t => t.id);

function rig({fail = []} = {}) {
  const r = {alive: 0, maxAlive: 0, played: [], closed: 0, decoded: 0, ctxs: 0};
  const param = () => ({value: 0, cancelScheduledValues() {}, setValueAtTime() {}, linearRampToValueAtTime() {}});
  class Ctx {
    constructor() { r.ctxs++; this.state = 'suspended'; this.currentTime = 0; this.destination = {}; }
    createGain() { return {gain: param(), connect() {}}; }
    createBufferSource() {
      const s = {connect() {}, start() { r.alive++; r.maxAlive = Math.max(r.maxAlive, r.alive); r.played.push(s.buffer.id); }, stop() { if (!s.stopped) { s.stopped = true; r.alive--; } }};
      return s;
    }
    async decodeAudioData(buf) { r.decoded++; const id = Buffer.from(buf).toString(); if (fail.includes('decode:' + id)) throw new Error('bad'); return {id}; }
    resume() { this.state = 'running'; return Promise.resolve(); }
    suspend() { this.state = 'suspended'; return Promise.resolve(); }
    close() { r.closed++; return Promise.resolve(); }
  }
  const fetchRef = async url => {
    if (url.endsWith('manifest.json')) return {ok: true, json: async () => manifest};
    const id = url.split('/').pop().replace('.m4a', '');
    await new Promise(res => setTimeout(res, id === IDS[1] ? 15 : 1)); // older select resolves later than newer
    if (fail.includes(id)) return {ok: false, status: 404};
    return {ok: true, arrayBuffer: async () => new TextEncoder().encode(id).buffer};
  };
  const mem = {}, storage = {getItem: k => mem[k] ?? null, setItem: (k, v) => { mem[k] = v; }};
  const st = createSoundtrack({storage, fetchRef, AudioContextRef: Ctx, documentRef: null});
  return {r, st, mem};
}

test('manifest files exist, sha256 match, ids unique, default first', () => {
  assert.equal(IDS.length, 6);
  assert.equal(new Set(IDS).size, 6);
  assert.equal(new Set(manifest.tracks.map(t => t.sha256)).size, 6);
  assert.equal(IDS[0], DEFAULT_TRACK);
  for (const t of manifest.tracks) {
    const b = fs.readFileSync(new URL('apps/jump/music/' + t.id + '.m4a', root));
    assert.equal(b.length, t.bytes);
    assert.equal(crypto.createHash('sha256').update(b).digest('hex'), t.sha256);
    assert.equal(t.url, `/apps/jump/music/${t.id}.m4a`);
  }
});

test('rapid selects: only the last plays, never two sources', async () => {
  const {r, st} = rig();
  st.unlock();
  await Promise.all([st.select(IDS[1]), st.select(IDS[2]), st.select(IDS[3])]);
  await new Promise(res => setTimeout(res, 40));
  assert.equal(r.alive, 1);
  assert.equal(r.maxAlive, 1);
  assert.equal(r.played.at(-1), IDS[3]);
  assert.ok(!r.played.includes(IDS[1]));
  assert.equal(r.ctxs, 1);
  st.dispose();
});

test('setOn(false) stops and persists; on resumes', async () => {
  const {r, st, mem} = rig();
  st.unlock();
  await st.select(IDS[0]);
  assert.equal(r.alive, 1);
  await st.setOn(false);
  assert.equal(r.alive, 0);
  assert.equal(mem['mbs-app-jump-music-on-v1'], '0');
  assert.equal(st.on, false);
  await st.setOn(true);
  assert.equal(r.alive, 1);
  assert.equal(mem['mbs-app-jump-music-on-v1'], '1');
  st.dispose();
});

test('unknown id is a no-op', async () => {
  const {r, st} = rig();
  st.unlock();
  await st.select(IDS[0]);
  await st.select('nope');
  assert.equal(st.trackId, IDS[0]);
  assert.equal(r.alive, 1);
  st.dispose();
});

test('404 and decode failure resolve quietly', async () => {
  const {r, st} = rig({fail: [IDS[1], 'decode:' + IDS[2]]});
  st.unlock();
  await st.select(IDS[1]);
  await st.select(IDS[2]);
  assert.equal(r.alive, 0);
  st.dispose();
});

test('dispose closes context and is idempotent', async () => {
  const {r, st} = rig();
  st.unlock();
  await st.select(IDS[0]);
  st.dispose(); st.dispose();
  assert.equal(r.closed, 1);
  assert.equal(r.alive, 0);
});

test('decoded cache never exceeds 3', async () => {
  const {r, st} = rig();
  st.unlock();
  for (const id of IDS) await st.select(id);
  await st.select(IDS[0]); // evicted earlier, must decode again
  assert.equal(r.decoded, 7);
  await st.select(IDS[5]); // still cached (not evicted by IDS[0] load? 3,4,5 -> 0 evicts 3)
  assert.equal(r.maxAlive, 1);
  st.dispose();
});
