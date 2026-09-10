/* Per-game downloads. Only completed packs become visible to fetches. Progress and
   accounts stay in their existing stores; these caches contain public static files. */
'use strict';
const FILES = 'mbs-game-files-v1', INDEX = 'mbs-game-index-v1', FONTS = 'mbs-game-fonts-v1';
const ORIGIN = self.location.origin;
const GAMES = new Set(['mominc', 'girlfriend', 'lilboyfriend', 'corgi', 'djscratch', 'fuel', 'goon', 'war-room', 'armie', 'handborne']);
const jobs = new Map();
let routesPromise;
const fileKey = revision => ORIGIN + '/.mbs-game-file/' + revision;
const indexKey = game => ORIGIN + '/.mbs-game-index/' + game;
const isFont = url => ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(new URL(url).hostname);
const canonicalPath = path => path.replace(/\/index\.html$/, '/').replace(/\.html$/, '').replace(/\/$/, '') || '/';

self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

async function routes() {
  if (!routesPromise) routesPromise = (async () => {
    const cache = await caches.open(INDEX);
    const records = await Promise.all((await cache.keys()).map(async key => (await cache.match(key)).json()));
    const map = new Map();
    records.sort((a, b) => a.installedAt - b.installedAt).forEach(pack => pack.assets.forEach(asset => map.set(asset.url, asset)));
    return map;
  })();
  return routesPromise;
}

function validate(pack, game) {
  if (pack.schema !== 1 || pack.game !== game || !Array.isArray(pack.assets) || !pack.assets.length) throw Error('Invalid game download.');
  for (const a of pack.assets) {
    const u = new URL(a.url, ORIGIN);
    if (u.origin !== ORIGIN || u.pathname !== a.url || !/^\/[a-z0-9_./-]+$/i.test(a.url)
        || !/^[a-f0-9]{40}$/.test(a.revision) || !Number.isSafeInteger(a.bytes) || a.bytes < 0) throw Error('Invalid game file.');
  }
  if (!Array.isArray(pack.fontStyles) || pack.fontStyles.some(url => !isFont(url))) throw Error('Invalid font list.');
  return pack;
}

async function download(asset, cache, progress) {
  const cached = await cache.match(fileKey(asset.revision));
  if (cached && Number(cached.headers.get('x-mbs-bytes')) === asset.bytes) {
    progress(asset.bytes);
    return;
  }
  const url = new URL(asset.url, ORIGIN);
  url.searchParams.set('mbs-rev', asset.revision);
  const response = await fetch(url.href, {cache: 'no-store', redirect: 'follow'});
  if (!response.ok || response.type === 'opaque') throw Error('A game file did not download.');
  if (response.redirected) {
    const destination = new URL(response.url);
    if (destination.origin !== ORIGIN || canonicalPath(destination.pathname) !== canonicalPath(asset.url)) throw Error('A game file redirected elsewhere.');
  }
  const parts = [];
  let size = 0;
  if (response.body) {
    const reader = response.body.getReader();
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      parts.push(value); size += value.byteLength; progress(value.byteLength);
      if (size > asset.bytes) { await reader.cancel(); throw Error('A game file changed. Please try again.'); }
    }
  } else {
    const buffer = await response.arrayBuffer();
    parts.push(buffer); size = buffer.byteLength; progress(size);
  }
  if (size !== asset.bytes) throw Error('A game file was interrupted.');
  const body = new Blob(parts);
  // Match Git's blob hash, including its header: an HTML error or stale deployment
  // must never count as a downloaded model, even if it has the expected byte length.
  const digest = await crypto.subtle.digest('SHA-1', await new Blob(['blob ' + size + '\0', body]).arrayBuffer());
  const revision = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  if (revision !== asset.revision) throw Error('A game file changed. Please try again.');
  const headers = new Headers(response.headers);
  headers.delete('content-encoding'); headers.delete('content-length');
  headers.set('content-length', String(size)); headers.set('x-mbs-bytes', String(size));
  // Reconstructing also removes the download query/response URL. Relative imports
  // resolve against the original request, including when two paths share a blob.
  await cache.put(fileKey(asset.revision), new Response(body, {headers}));
}

async function fontResponse(url, cache) {
  const cached = await cache.match(url);
  if (cached) return cached;
  if (!isFont(url)) throw Error('Invalid font URL.');
  const response = await fetch(url, {mode: 'cors', redirect: 'error'});
  if (!response.ok || response.type === 'opaque') throw Error('The page fonts did not download.');
  const headers = new Headers(response.headers);
  headers.delete('content-encoding'); headers.delete('content-length');
  const stored = new Response(await response.arrayBuffer(), {headers});
  await cache.put(url, stored.clone());
  return stored;
}

async function prepare(game, notify) {
  const index = await caches.open(INDEX), cache = await caches.open(FILES);
  let pack;
  try {
    const response = await fetch(ORIGIN + '/tv/game-packs/' + game + '.json', {cache: 'no-store', redirect: 'error'});
    if (!response.ok) throw Error('The game download list is unavailable.');
    pack = validate(await response.json(), game);
  } catch (error) {
    const previous = await index.match(indexKey(game));
    if (!previous) throw error;
    pack = validate(await previous.json(), game);
  }
  const byRevision = new Map();
  for (const asset of pack.assets) if (!byRevision.has(asset.revision)) byRevision.set(asset.revision, asset);
  const unique = Array.from(byRevision.values());
  const total = unique.reduce((sum, a) => sum + a.bytes, 0);
  let loaded = 0, cursor = 0, failure;
  const progress = bytes => { loaded += bytes; notify({type: 'progress', loaded, total}); };
  progress(0);
  // Bound memory and avoid overwhelming a weak connection. Completed files survive
  // an interruption; retries reuse them instead of starting the whole game again.
  await Promise.all(Array.from({length: 3}, async () => {
    while (!failure && cursor < unique.length) {
      const asset = unique[cursor++];
      try { await download(asset, cache, progress); } catch (error) { failure = error; }
    }
  }));
  if (failure) throw failure;
  const fonts = await caches.open(FONTS);
  for (const stylesheet of pack.fontStyles) {
    const css = await (await fontResponse(stylesheet, fonts)).text();
    const urls = new Set(Array.from(css.matchAll(/url\(['"]?(https:\/\/fonts\.gstatic\.com\/[^)'"\s]+)['"]?\)/g), m => m[1]));
    for (const url of urls) { await fontResponse(url, fonts); progress(0); }
  }
  await index.put(indexKey(game), new Response(JSON.stringify({...pack, installedAt: Date.now()}), {headers: {'content-type': 'application/json'}}));
  routesPromise = null;
  await routes();
  return {type: 'ready', game, total};
}

self.addEventListener('message', event => {
  if (event.data?.type !== 'PREPARE_GAME' || !GAMES.has(event.data.game) || !event.ports?.[0]) return;
  const {game} = event.data, port = event.ports[0];
  let job = jobs.get(game);
  if (!job) {
    job = {ports: new Set(), last: null};
    jobs.set(game, job);
    job.promise = prepare(game, message => {
      job.last = message; job.ports.forEach(p => p.postMessage(message));
    }).catch(error => ({type: 'error', message: error.name === 'QuotaExceededError'
      ? 'There is not enough space to save this game. Free some space and try again.'
      : 'The download stopped. Check your connection and try again.'}))
      .then(message => { job.ports.forEach(p => {p.postMessage(message); p.close();}); jobs.delete(game); });
  }
  job.ports.add(port);
  if (job.last) port.postMessage(job.last);
  event.waitUntil(job.promise);
});

async function ranged(response, header) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2])) return response;
  const blob = await response.blob(), size = blob.size;
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  if (start >= size || end < start) return new Response(null, {status: 416, headers: {'content-range': 'bytes */' + size}});
  const headers = new Headers(response.headers);
  headers.set('accept-ranges', 'bytes'); headers.set('content-range', `bytes ${start}-${end}/${size}`);
  headers.set('content-length', String(end - start + 1));
  return new Response(blob.slice(start, end + 1), {status: 206, headers});
}

self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || (url.origin !== ORIGIN && !isFont(url.href))) return;
  if (isFont(url.href)) {
    event.respondWith(caches.open(FONTS).then(async cache => (await cache.match(request)) || fetch(request)));
    return;
  }
  // HTML navigations stay fresh; a previously downloaded page can reopen offline.
  // Game fragments, scripts, artwork, fonts, and media use the prepared revision.
  event.respondWith((async () => {
    let path = url.pathname;
    if (path.endsWith('/')) path += 'index.html';
    const asset = (await routes()).get(path);
    // Recovery/bootstrap scripts must be able to update even when an older pack
    // is installed. Actual pack-download fetches have no script destination and
    // still go through byte/hash verification. Retain the offline fallback.
    if (request.destination === 'script' && ['/tv/game-loader.js', '/tv/tv.js'].includes(path)) {
      try { const live = await fetch(request); if (live.ok) return live; } catch (_) {}
      if (asset) {
        const stored = await (await caches.open(FILES)).match(fileKey(asset.revision));
        if (stored) return stored;
      }
      return fetch(request);
    }
    if (!asset || url.searchParams.has('mbs-rev')) return fetch(request);
    const response = await (await caches.open(FILES)).match(fileKey(asset.revision));
    if (request.mode === 'navigate') {
      try { const live = await fetch(request); if (live.ok) return live; } catch (_) {}
    }
    if (!response) return fetch(request);
    return request.headers.has('range') ? ranged(response, request.headers.get('range')) : response;
  })());
});
