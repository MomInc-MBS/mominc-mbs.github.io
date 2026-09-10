import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync, readdirSync} from 'node:fs';
import {createHash, webcrypto} from 'node:crypto';

const root = new URL('../', import.meta.url);
const source = readFileSync(new URL('game-assets-sw.js', root), 'utf8');
const origin = 'https://mominc.online';
const turn = () => new Promise(resolve => setImmediate(resolve));
function file(url, body) {
  body = Buffer.from(body);
  return {url, bytes: body.length, revision: createHash('sha1').update(`blob ${body.length}\0`).update(body).digest('hex')};
}
function pack(game, assets, fontStyles = []) {return {schema: 1, game, version: 'test', assets, fontStyles};}
function storage() {
  const stores = new Map();
  return {stores, async open(name) {
    if (!stores.has(name)) stores.set(name, new Map());
    const map = stores.get(name), key = request => typeof request === 'string' ? request : request.url;
    return {async match(request) {return map.get(key(request))?.clone();},
      async put(request, response) {map.set(key(request), new Response(await response.arrayBuffer(), {headers: response.headers, status: response.status}));},
      async keys() {return Array.from(map.keys(), url => new Request(url));}};
  }};
}
function worker(packs, bodies, caches = storage()) {
  const listeners = {}, requests = [], state = {offline: false, hold: null};
  const fetch = async input => {
    const url = new URL(typeof input === 'string' ? input : input.url);
    requests.push(url.href);
    if (state.offline) throw Error('offline');
    if (state.hold) await state.hold(url);
    if (url.pathname.startsWith('/tv/game-packs/')) {
      const p = packs[url.pathname.split('/').pop().replace('.json', '')];
      return new Response(JSON.stringify(p), {status: p ? 200 : 404});
    }
    const body = bodies[url.origin === origin ? url.pathname : url.href];
    if (body instanceof Error) throw body;
    return new Response(body ?? 'missing', {status: body === undefined ? 404 : 200, headers: {'content-type': url.pathname.endsWith('.html') ? 'text/html' : 'application/octet-stream'}});
  };
  const context = vm.createContext({self: {location: {origin}, addEventListener(type, listener) {listeners[type] = listener;},
    skipWaiting: async () => {}, clients: {claim: async () => {}}}, caches, fetch, Response, Request, Headers,
    Blob, URL, crypto: webcrypto, Uint8Array, Map, Set, console});
  vm.runInContext(source, context);
  return {requests, state, caches,
    send(game) {
      const messages = []; let done;
      listeners.message({data: {type: 'PREPARE_GAME', game}, ports: [{postMessage(message) {messages.push(message);}, close() {}}],
        waitUntil(promise) {done = promise;}});
      return {messages, done};
    },
    async get(path, {range, navigate = false, destination = ''} = {}) {
      let response;
      const request = {url: new URL(path, origin).href, method: 'GET', destination, mode: navigate ? 'navigate' : 'cors', headers: new Headers(range ? {range} : {})};
      listeners.fetch({request, respondWith(promise) {response = promise;}});
      return response;
    }};
}

test('only the selected game downloads; readiness waits for the last file', async () => {
  const assets = [file('/intro.js', 'intro'), file('/later.glb', 'later')];
  const w = worker({armie: pack('armie', assets), corgi: pack('corgi', [file('/other.png', 'other')])}, {'/intro.js': 'intro', '/later.glb': 'later'});
  let release; const hold = new Promise(resolve => {release = resolve;});
  w.state.hold = url => url.pathname === '/later.glb' ? hold : undefined;
  const job = w.send('armie');
  await turn(); await turn();
  assert.ok(!job.messages.some(m => m.type === 'ready'));
  release(); await job.done;
  assert.equal(job.messages.at(-1).type, 'ready');
  assert.ok(!w.requests.some(url => url.includes('corgi') || url.includes('other.png')));
  assert.equal(await (await w.get('/later.glb?v=scene2')).text(), 'later');
});

test('large models download fully, report bytes, and are shared across paths and games', async () => {
  const body = Buffer.alloc(9 * 1024 * 1024, 77);
  const first = file('/armie/family.glb', body), second = {...first, url: '/handborne/family.glb'};
  const w = worker({armie: pack('armie', [first, second]), handborne: pack('handborne', [second])}, {[first.url]: body});
  const a = w.send('armie'); await a.done;
  assert.equal(a.messages.at(-1).type, 'ready');
  assert.equal(a.messages.filter(m => m.type === 'progress').at(-1).loaded, body.length);
  const b = w.send('handborne'); await b.done;
  assert.equal(w.requests.filter(url => url.includes('.glb')).length, 1);
  w.state.offline = true;
  assert.equal((await (await w.get('/handborne/family.glb?style=2')).arrayBuffer()).byteLength, body.length);
});

test('an interrupted download never commits and retry keeps completed files', async () => {
  const assets = [file('/a.png', 'a'), file('/b.glb', 'bb')];
  const bodies = {'/a.png': 'a', '/b.glb': Error('interrupted')};
  const w = worker({armie: pack('armie', assets)}, bodies);
  const first = w.send('armie'); await first.done;
  assert.equal(first.messages.at(-1).type, 'error');
  assert.equal(w.caches.stores.get('mbs-game-index-v1').size, 0);
  bodies['/b.glb'] = 'bb';
  const next = w.send('armie'); await next.done;
  assert.equal(next.messages.at(-1).type, 'ready');
  assert.equal(w.requests.filter(url => new URL(url).pathname === '/a.png').length, 1);
});

test('a same-size corrupted update leaves the last complete pack usable', async () => {
  const packs = {armie: pack('armie', [file('/a.png', 'old')])}, bodies = {'/a.png': 'old'};
  const w = worker(packs, bodies);
  await w.send('armie').done;
  packs.armie = pack('armie', [file('/a.png', 'new')]); bodies['/a.png'] = 'bad';
  const update = w.send('armie'); await update.done;
  assert.equal(update.messages.at(-1).type, 'error');
  assert.equal(await (await w.get('/a.png')).text(), 'old');
  bodies['/a.png'] = 'new'; await w.send('armie').done;
  assert.equal(await (await w.get('/a.png')).text(), 'new');
});

test('worker restarts and offline page entries reuse the committed pack', async () => {
  const p = {armie: pack('armie', [file('/games/armie/index.html', '<p>Armie</p>')])};
  const w = worker(p, {'/games/armie/index.html': '<p>Armie</p>'}); await w.send('armie').done;
  const restarted = worker(p, {}, w.caches); restarted.state.offline = true;
  const job = restarted.send('armie'); await job.done;
  assert.equal(job.messages.at(-1).type, 'ready');
  assert.equal(await (await restarted.get('/games/armie/', {navigate: true})).text(), '<p>Armie</p>');
});

test('audio and video range requests work offline, including suffix and invalid ranges', async () => {
  const w = worker({mominc: pack('mominc', [file('/movie.mp4', '0123456789')])}, {'/movie.mp4': '0123456789'});
  await w.send('mominc').done; w.state.offline = true;
  for (const [range, text] of [['bytes=2-4', '234'], ['bytes=7-', '789'], ['bytes=-3', '789'], ['bytes=8-999', '89']]) {
    const response = await w.get('/movie.mp4?v=1', {range});
    assert.equal(response.status, 206); assert.equal(await response.text(), text);
  }
  assert.equal((await w.get('/movie.mp4', {range: 'bytes=50-60'})).status, 416);
});

test('concurrent page and iframe requests share the same download', async () => {
  const w = worker({armie: pack('armie', [file('/a.glb', 'model')])}, {'/a.glb': 'model'});
  const a = w.send('armie'), b = w.send('armie'); await Promise.all([a.done, b.done]);
  assert.equal(a.messages.at(-1).type, 'ready'); assert.equal(b.messages.at(-1).type, 'ready');
  assert.equal(w.requests.filter(url => url.includes('.glb')).length, 1);
});

test('fonts used later in a game are cached before readiness', async () => {
  const css = 'https://fonts.googleapis.com/css2?family=Anton', font = 'https://fonts.gstatic.com/anton/test.woff2';
  const w = worker({fuel: pack('fuel', [file('/game.js', 'game')], [css])}, {'/game.js': 'game', [css]: `@font-face{src:url(${font})}`, [font]: 'font'});
  const job = w.send('fuel'); await job.done;
  assert.equal(job.messages.at(-1).type, 'ready'); w.state.offline = true;
  assert.equal(await (await w.get(font)).text(), 'font');
});

test('invalid pack paths and storage failures never release the game', async () => {
  const bad = worker({armie: pack('armie', [{...file('/a', 'a'), url: 'https://elsewhere.test/a'}])}, {});
  const first = bad.send('armie'); await first.done; assert.equal(first.messages.at(-1).type, 'error');
  const caches = storage(), open = caches.open;
  caches.open = async name => {const cache = await open(name); if (name === 'mbs-game-files-v1') cache.put = async () => {throw Object.assign(Error('full'), {name: 'QuotaExceededError'});}; return cache;};
  const full = worker({armie: pack('armie', [file('/a', 'a')])}, {'/a': 'a'}, caches);
  const second = full.send('armie'); await second.done;
  assert.match(second.messages.at(-1).message, /not enough space/);
});

test('Armie entry pack includes intro, every selectable family, lab, and coach styles', () => {
  const p = JSON.parse(readFileSync(new URL('tv/game-packs/armie.json', root)));
  const urls = new Set(p.assets.map(a => a.url));
  for (const file of ['index.html', 'intro.js', 'lab.html', 'lab.js', 'maze-scene.js', 'maze-ui.mjs', 'myr5/models/myr5.glb', 'myr5/models/anatomy.glb', 'myr5/models/hands-v2.glb']) assert.ok(urls.has('/tv/assets/armie-intro/' + file), file);
  for (let i = 0; i < 23; i++) {
    assert.ok(urls.has((i < 20 ? '/tv/assets/armie-intro/models/' : '/handborne/models/') + `family-${String(i).padStart(2, '0')}.glb`));
    assert.ok(urls.has('/tv/assets/armie-intro/myr5/styles/' + String(i).padStart(2, '0') + '.png'));
  }
  assert.ok(!urls.has('/handborne/downloads/handborne.zip'));
});

test('every game page has the early loader and both mount paths wait before fetching', () => {
  for (const group of ['games', 'play']) for (const slug of readdirSync(new URL(group + '/', root)).filter(x => !x.includes('.') && x !== 'sag')) {
    const html = readFileSync(new URL(`${group}/${slug}/index.html`, root), 'utf8');
    assert.ok(html.indexOf('/tv/game-loader.js') < html.indexOf('</head>'));
  }
  const runtime = readFileSync(new URL('tv/channel-runtime.js', root), 'utf8');
  assert.ok(runtime.indexOf('MBS_LOAD?.prepare(name)') < runtime.indexOf('return fetch('));
  const mount = readFileSync(new URL('tv/mount.js', root), 'utf8');
  assert.ok(mount.indexOf('MBS_LOAD?.prepare(slug)') < mount.indexOf('fetch("channels/"'));
  const armie = readFileSync(new URL('tv/assets/armie-intro/index.html', root), 'utf8');
  assert.match(armie, /type="application\/mbs-script"[^>]*data-mbs-src="\.\/intro.js/);
  const gala = readFileSync(new URL('tv/games/goon/index.html', root), 'utf8');
  assert.match(gala, /data-mbs-defer="true"[^>]*index-gala-classic.js/);
  assert.doesNotMatch(gala, /war-room\.js|ammo\.js|hologram/);
  const boot = readFileSync(new URL('gala/war-room-boot.js', root), 'utf8');
  assert.ok(boot.indexOf('GalaWarRoomAccess.enter') < boot.indexOf('await window.MBS_LOAD?.ready'));
  assert.ok(boot.indexOf('await window.MBS_LOAD?.ready') < boot.indexOf("script('/tv/mount.js')"));
  assert.ok(boot.indexOf('await window.MBS_LOAD?.ready') < boot.indexOf("import('/tv/games/goon/assets/index-W2w8AfON.js"));
  for (const entry of ['play/war-room/index.html', 'tv/games/goon/war-room.html']) {
    const html = readFileSync(new URL(entry, root), 'utf8');
    assert.match(html, /war-room-access\.js/);
    assert.match(html, /war-room-boot\.js/);
    assert.ok(html.indexOf('/tv/game-loader.js') < html.indexOf('</head>'));
  }
});

test('Gala and War Room keep separate game bundles and retain the clearance check', () => {
  const urls = game => new Set(JSON.parse(readFileSync(new URL(`tv/game-packs/${game}.json`, root))).assets.map(asset => asset.url));
  const gala = urls('goon'), war = urls('war-room');
  assert.ok(gala.has('/tv/games/goon/assets/index-gala-classic.js'));
  assert.ok(!gala.has('/tv/games/goon/assets/index-W2w8AfON.js'));
  assert.ok(!gala.has('/gala/war-room.js'));
  assert.ok(war.has('/tv/games/goon/assets/index-W2w8AfON.js'));
  assert.ok(!war.has('/tv/games/goon/assets/index-gala-classic.js'));
  assert.ok(war.has('/gala/war-room-access.js'));
  assert.ok(war.has('/gala/war-room-boot.js'));
});

function page(path, scripts = [], search = '') {
  const callbacks = {}, attrs = new Set(), nodes = new Map(), ports = [], executed = [];
  function element(tag) {
    const node = {tag, dataset: {}, hidden: false, children: [], isConnected: false, textContent: '',
      setAttribute(key, value) {this[key] = value;}, removeAttribute(key) {delete this[key];},
      contains(target) {return target === this || this.children.includes(target);},
      append(child) {child.isConnected = true;this.children.push(child); if(child.id) nodes.set(child.id, child);},
      remove() {this.isConnected = false;}, querySelector(selector) {return this.parts?.[selector];}};
    Object.defineProperty(node, 'innerHTML', {set() {this.parts = Object.fromEntries(['h1', 'progress', 'p', 'button', 'img'].map(key => [key, element(key)]));this.children = Object.values(this.parts);}});
    return node;
  }
  const document = {readyState: 'loading', body: element('body'), head: element('head'), images: [],
    documentElement: {dataset: {}, setAttribute(key) {attrs.add(key);}, removeAttribute(key) {attrs.delete(key);}},
    getElementById: id => nodes.get(id), createElement: element,
    addEventListener(type, listener) {(callbacks[type] ||= []).push(listener);},
    querySelectorAll: () => scripts};
  for (const old of scripts) old.replaceWith = script => {
    executed.push(script.src);
    setImmediate(() => script.onload?.());
  };
  const serviceWorker = {controller: {scriptURL: origin + '/game-assets-sw.js', postMessage(_, sent) {ports.push(sent[0]);}},
    ready: Promise.resolve(), async register() {return {active: this.controller};}};
  const window = {dispatchEvent() {}};
  vm.runInNewContext(readFileSync(new URL('tv/game-loader.js', root), 'utf8'), {window, document,
    location: {pathname: path, origin, search, reload() {}}, navigator: {serviceWorker},
    URL, URLSearchParams, MessageChannel, Event, setTimeout, clearTimeout,
    requestAnimationFrame: fn => setImmediate(fn), MutationObserver: class {observe() {} disconnect() {}}});
  return {window, document, attrs, ports, executed, nodes,
    domReady() {document.readyState = 'interactive';callbacks.DOMContentLoaded?.forEach(fn => fn());}};
}

test('a failed page download keeps character selection covered until Retry succeeds', async () => {
  const p = page('/tv/', [], '?ch=corgi');
  await turn();await turn();
  p.domReady();
  const finishing = p.window.MBS_LOAD.finish();
  p.ports[0].postMessage({type: 'error', message: 'Download interrupted'});
  await turn();await turn();
  const overlay = p.nodes.get('mbs-game-loading');
  assert.ok(p.attrs.has('data-game-loading')); assert.equal(overlay.querySelector('button').hidden, false);
  overlay.querySelector('button').onclick();
  await turn();await turn();
  p.ports[1].postMessage({type: 'ready'});
  await finishing;
  assert.ok(!p.attrs.has('data-game-loading')); assert.equal(overlay.isConnected, false);
  p.ports.forEach(port => port.close());
});

test('the War Room starts after download and after its existing synchronous globals', async () => {
  const p = page('/tv/games/goon/', [
    {dataset: {mbsSrc: '/game.js', mbsType: 'module', mbsDefer: 'true'}},
    {dataset: {mbsSrc: '/gala/war-room.js', mbsType: 'classic', mbsDefer: 'false'}},
    {dataset: {mbsSrc: '/gala/weapon-station.mjs', mbsType: 'module', mbsDefer: 'true'}}]);
  p.domReady();await turn();await turn();
  assert.deepEqual(p.executed, []);
  p.ports[0].postMessage({type: 'ready'});
  for(let i=0;i<12;i++) await turn();
  assert.deepEqual(p.executed, ['/gala/war-room.js', '/game.js', '/gala/weapon-station.mjs']);
  assert.ok(!p.attrs.has('data-game-loading'));
  p.ports.forEach(port => port.close());
});

test('the MOM INC homepage mounts without a game pack on every home URL', async () => {
  for (const [path, search] of [['/tv/', ''], ['/tv/index.html', ''], ['/tv/', '?ch=mominc'], ['/tv/', '?ch=sag']]) {
    const p = page(path, [], search);
    p.domReady();
    await p.window.MBS_LOAD.ready;
    await p.window.MBS_LOAD.prepare('mominc');
    await p.window.MBS_LOAD.finish();
    await turn(); await turn();
    assert.equal(p.ports.length, 0, 'The homepage must not request a full game pack');
    assert.ok(!p.attrs.has('data-game-loading'));
    assert.ok(!p.nodes.has('mbs-game-loading'));
  }
  const shell = readFileSync(new URL('tv/tv.js', root), 'utf8');
  assert.match(shell, /const current = .*get\("ch"\) \|\| "mominc"/);
  assert.match(shell, /const name = current === "sag" \? "mominc" : current/);
  assert.match(shell, /MBS_CH\.mount\(name, channel\)/);
});

test('Armie still downloads on page entry, before any character or Start action', async () => {
  const p = page('/tv/assets/armie-intro/index.html');
  await turn(); await turn();
  assert.equal(p.ports.length, 1);
  assert.ok(p.attrs.has('data-game-loading'));
  p.domReady();
  p.ports[0].postMessage({type: 'ready'});
  for (let i = 0; i < 12; i++) await turn();
  assert.ok(!p.attrs.has('data-game-loading'));
  p.ports.forEach(port => port.close());
});

test('recovery scripts bypass stale installed packs but remain available offline', async () => {
  for (const path of ['/tv/game-loader.js', '/tv/tv.js']) {
    const bodies = {[path]: 'old'};
    const w = worker({corgi: pack('corgi', [file(path, 'old')])}, bodies);
    await w.send('corgi').done;
    bodies[path] = 'new';
    const requestPath = path + '?mbs-rev=home-repair-2';
    assert.equal(await (await w.get(requestPath, {destination: 'script'})).text(), 'new');
    w.state.offline = true;
    assert.equal(await (await w.get(requestPath, {destination: 'script'})).text(), 'old');
  }
});

test('all generated packs match the current loading and homepage scripts', () => {
  const paths = ['tv/game-loader.js', 'tv/index.html', 'tv/tv.js'];
  for (const name of readdirSync(new URL('tv/game-packs/', root))) {
    const p = JSON.parse(readFileSync(new URL('tv/game-packs/' + name, root)));
    assert.ok(!p.assets.some(a => a.url === '/game-assets-sw.js'), 'Worker installation must not be a game-pack dependency');
    for (const path of paths) {
      const expected = file('/' + path, readFileSync(new URL(path, root)));
      assert.deepEqual(p.assets.find(a => a.url === expected.url), expected, name + ': ' + path);
    }
  }
});
