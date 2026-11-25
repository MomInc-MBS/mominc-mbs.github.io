// Little Boyfriend service worker. Scope: /little-boyfriend/app/ only (this file's directory). VERSION + PRECACHE are stamped by
// tools/web/stamp_version.mjs (hash of every file in web/). Unstamped (dev) = empty precache: everything goes to the network.
/*LBF_STAMP_START*/
const VERSION = '3e7a1a6712b3';
const PRECACHE = [
 "app.css",
 "app.mjs",
 "depth.mjs",
 "effects.v1.json",
 "frames/birdhouse/blur.webp",
 "frames/birdhouse/frame.webp",
 "frames/birdhouse/layout.json",
 "frames/birdhouse/mask.png",
 "frames/birdhouse/sdf.png",
 "frames/cardboard_box/blur.webp",
 "frames/cardboard_box/frame.webp",
 "frames/cardboard_box/layout.json",
 "frames/cardboard_box/mask.png",
 "frames/cardboard_box/sdf.png",
 "frames/dollhouse/blur.webp",
 "frames/dollhouse/frame.webp",
 "frames/dollhouse/layout.json",
 "frames/dollhouse/mask.png",
 "frames/dollhouse/sdf.png",
 "frames/mason_jar/blur.webp",
 "frames/mason_jar/frame.webp",
 "frames/mason_jar/layout.json",
 "frames/mason_jar/mask.png",
 "frames/mason_jar/sdf.png",
 "gallery.css",
 "gallery.mjs",
 "gen/shaders.mjs",
 "hw.mjs",
 "icons/apple-touch-icon-180.png",
 "icons/icon-192.png",
 "icons/icon-512.png",
 "icons/maskable-512.png",
 "index.html",
 "manifest.webmanifest",
 "materials/NOTICE.md",
 "materials/SOURCE.txt",
 "materials/anime_cel.glsl",
 "materials/base_h.glsl",
 "materials/base_v.glsl",
 "materials/clay.glsl",
 "materials/common.glsl",
 "materials/cross_stitch.glsl",
 "materials/crosshatch_ink.glsl",
 "materials/felt.glsl",
 "materials/gouache.glsl",
 "materials/graphite.glsl",
 "materials/graphite_blur.glsl",
 "materials/graphite_blur2.glsl",
 "materials/knit.glsl",
 "materials/kuwahara.glsl",
 "materials/kuwahara_oil.glsl",
 "materials/linocut.glsl",
 "materials/materials.json",
 "materials/mosaic_tiles.glsl",
 "materials/paper_cutout.glsl",
 "materials/printed_comic.glsl",
 "materials/soft_pixel.glsl",
 "materials/stained_glass.glsl",
 "materials/strong_h.glsl",
 "materials/strong_v.glsl",
 "materials/textures/brush.png",
 "materials/textures/clay_micro.png",
 "materials/textures/felt_fiber.png",
 "materials/textures/felt_wool.png",
 "materials/textures/fingerprints.png",
 "materials/textures/hatch_a.png",
 "materials/textures/hatch_b.png",
 "materials/textures/paper_tooth.png",
 "materials/toy_bricks.glsl",
 "materials/watercolor.glsl",
 "materials/wax_crayon.glsl",
 "render.mjs",
 "store.mjs",
 "tempo.mjs",
 "universe/adapter.mjs",
 "universe/coach/flight-score.mjs",
 "universe/coach/flight-scroll.mjs",
 "universe/coach/level-map-domain.mjs",
 "universe/coach/level-map-scene.mjs",
 "universe/coach/space-rocks.mjs",
 "universe/index.html",
 "universe/pod/worlds/kenney-meteor-brown-tiny1.png",
 "universe/pod/worlds/kenney-meteor-grey-tiny1.png",
 "universe/pod/worlds/kenney-space-shooter-license.txt",
 "universe/universe.css",
 "universe/universe.mjs",
 "vendor/LICENSE-signalsmith-stretch.txt",
 "vendor/SignalsmithStretch.mjs",
 "voice.mjs"
];
/*LBF_STAMP_END*/
const CACHE = 'lbf-' + VERSION;
const BASE = new URL('./', self.location.href).pathname;

self.addEventListener('install', e => {
  // no skipWaiting here: the page shows "New version ready" and asks us via SKIP_WAITING, so a running session is never swapped silently
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE.map(p => new Request(p, { cache: 'reload' })))));
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('lbf-') && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
  else if (e.data === 'GET_VERSION') e.source?.postMessage({ version: VERSION });
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== self.location.origin || !u.pathname.startsWith(BASE)) return; // network for everything else (site's own SW at / is untouched)
  let rel = u.pathname.slice(BASE.length);
  if (rel === '') rel = 'index.html';
  if (!PRECACHE.includes(rel)) return; // not precached -> network
  e.respondWith(caches.open(CACHE).then(c => c.match(rel)).then(hit => hit || fetch(r)));
});
