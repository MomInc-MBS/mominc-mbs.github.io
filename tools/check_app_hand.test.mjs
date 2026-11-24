import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const json = path => JSON.parse(read(path));
const app = json('apps/apps.json').apps.find(a => a.id === 'hand');
const urls = pack => json(`tv/game-packs/${pack}.json`).assets.map(a => a.url);
const core = urls('app-hand');
const family = url => /^\/handborne\/models\/family-(\d\d)\.glb$/.exec(url)?.[1];

test('core pack stays lean: no ZIPs, source, previews, TV shell or optional models', () => {
  const bytes = json('tv/game-packs/app-hand.json').assets.reduce((n, a) => n + a.bytes, 0);
  assert.ok(bytes < 40 * 1048576, `core is ${(bytes / 1048576).toFixed(1)} MiB`);
  for (const url of core) {
    assert.ok(!/\.zip$|\/downloads\/|\/source\/|\/_next\/|\/previews\/|^\/tv\/(?!game-loader\.js|assets\/mom-inc-mark\.png)|\/companion\.|unlock-bridge|\.obj$/.test(url), url);
    assert.ok(!url.startsWith('/handborne/index.html') && !url.startsWith('/handborne/decisions.js'), url);
  }
  const optional = new Set(app.optionalPacks.flatMap(o => o.files.map(f => '/' + f)));
  for (const url of core) assert.ok(!optional.has(url), `optional model in core: ${url}`);
});

test('every family model is either in the core pack or exactly one optional pack', () => {
  const inCore = core.filter(family);
  const optional = app.optionalPacks.map(o => urls(o.pack));
  for (const list of optional) assert.equal(list.length, 1), assert.ok(family(list[0]));
  const all = [...inCore, ...optional.flat()].map(family).sort();
  assert.deepEqual(all, json('handborne/models/manifest.json').filter(m => m.id < 23).map(m => String(m.id).padStart(2, '0')));
  assert.equal(new Set(all).size, all.length);
});

test('core has the default hand, the entry bundle and everything the entry imports', () => {
  const catalog = read('handborne/source/app/catalog.ts');
  const defaults = catalog.match(/DEFAULT_SELECTION[^{]*\{([^}]*)\}/)[1].match(/:\s*(\d+)/g).map(m => Number(m.slice(1)));
  for (const id of [...defaults, 0]) assert.ok(core.includes(`/handborne/models/family-${String(id).padStart(2, '0')}.glb`), `default family ${id}`);
  assert.ok(core.includes(app.src) && core.includes(app.style));
  const js = read(app.src.slice(1));
  for (const chunk of new Set(js.match(/\.\/[\w.-]+\.js/g) || [])) assert.ok(core.includes('/handborne/assets/' + chunk.slice(2)), chunk);
  for (const font of read(app.style.slice(1)).match(/\/handborne\/fonts\/[\w-]+\.ttf/g) || []) assert.ok(core.includes(font), font);
  for (const url of core) assert.ok(existsSync(new URL(url.slice(1), root)), url);
});

test('the app uses the same editor build as the website page and leaves the site gate alone', () => {
  const site = read('handborne/index.html');
  assert.ok(site.includes(app.src) && site.includes(app.style), 'rebuild the editor? update apps/apps.json src/style');
  assert.ok(site.includes('MBS_FLOW.pagesReady()') && site.includes('/handborne/decisions.js') && site.includes('/games/djscratch/'));
  const page = read('apps/hand/index.html');
  assert.doesNotMatch(page, /MBS_FLOW|decisions\.js|network-flow|state\.js|retro-pointer|shader|Gym Class|djscratch/);
  assert.match(page, /rel="manifest"/);
  assert.match(page, /Extra models download when you choose them\./);
  assert.ok(!page.includes(`href="${app.style}"`), 'editor CSS is only attached on Start');
});

test('optional readiness needs the index record and every cached file at its size', async () => {
  const stores = new Map();
  globalThis.location = {origin: 'https://x.test'};
  globalThis.caches = {open: async name => ({match: async key => stores.get(name)?.get(key)?.clone()})};
  const {isReady} = await import('../apps/hand/models.mjs');
  const put = (name, key, body, headers) => (stores.get(name) || stores.set(name, new Map()).get(name)).set(key, new Response(body, {headers}));
  assert.equal(await isReady('app-hand-model-01'), false);
  put('mbs-game-index-v1', 'https://x.test/.mbs-game-index/app-hand-model-01', JSON.stringify({assets: [{revision: 'r1', bytes: 4}]}));
  assert.equal(await isReady('app-hand-model-01'), false, 'index alone is not ready');
  put('mbs-game-files-v1', 'https://x.test/.mbs-game-file/r1', 'abcd', {'x-mbs-bytes': '4'});
  assert.equal(await isReady('app-hand-model-01'), true);
  stores.get('mbs-game-files-v1').clear();
  assert.equal(await isReady('app-hand-model-01'), false, 'evicted file is not ready');
});
