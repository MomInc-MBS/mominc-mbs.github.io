// Suite PWA self-update for the /apps/<id>/ shells. The pack download, hash check and atomic switch are game-assets-sw.js's own
// (PREPARE_GAME): files are stored per revision and the old ones stay until the new pack is complete, so a failed update changes nothing.
// This module only notices a new version (apps/releases.json), asks the worker to install it in the background, then reloads ONCE at a
// safe boundary. It never touches localStorage/IndexedDB data except its own version note.
const id = location.pathname.split('/')[2], VER = 'mbs-app-ver:' + id, GUARD = 'mbs-app-reload:' + id;
const store = area => ({
  get: k => { try { return area().getItem(k); } catch { return null; } },
  set: (k, v) => { try { area().setItem(k, v); } catch {} },
});
const ls = store(() => localStorage), ss = store(() => sessionStorage);
const TYPING = /^(INPUT|TEXTAREA|SELECT)$/;

async function install(game) {   // ask the worker to fetch + verify the new pack; resolves only when it is complete
  const reg = await navigator.serviceWorker.getRegistration('/');
  reg?.update().catch(() => {});   // the worker script itself is revalidated (registered with updateViaCache:none)
  const worker = navigator.serviceWorker.controller || reg?.active;
  if (!worker) throw Error('no worker');
  await Promise.race([
    new Promise((resolve, reject) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = ({data}) => { if (data.type === 'ready') resolve(); else if (data.type === 'error') reject(Error(data.message)); };
      worker.postMessage({type: 'PREPARE_GAME', game}, [channel.port2]);
    }),
    new Promise((_, reject) => setTimeout(() => reject(Error('timeout')), 5 * 60000)),
  ]);
}

// busy(): true while a game/editor/alarm workflow is on screen. Apps may also set window.MOM_APP_BUSY = () => bool.
export function watchUpdates({busy = () => false} = {}) {
  if (!('serviceWorker' in navigator)) return;
  let running = ls.get(VER), adopted = false, ready = null, installing = false, last = 0;
  const safe = () => !(busy() || window.MOM_APP_BUSY?.() || TYPING.test(document.activeElement?.tagName || '') || document.activeElement?.isContentEditable || document.querySelector('dialog[open]'));
  function reloadWhenSafe() {
    if (!ready || !safe() || ss.get(GUARD) === ready) return;   // the guard: one reload per version per session, never a loop
    ss.set(GUARD, ready); ls.set(VER, ready); location.reload();
  }
  async function check(launch) {
    if (!navigator.onLine || installing || (!launch && Date.now() - last < 60000)) return;
    last = Date.now();
    let entry;
    try {
      const response = await fetch('/apps/releases.json', {cache: 'no-cache'});
      entry = response.ok && (await response.json()).apps.find(a => a.id === id && a.platform === 'pwa');
    } catch { return; }
    if (!entry?.version) return;
    // Online launch: the page and pack were just loaded fresh, so what is published IS what is running. An offline launch keeps its
    // old note, so the first online check sees the difference and updates.
    if (launch || running === null) { running = entry.version; adopted = true; ls.set(VER, running); return; }
    if (entry.version === running || entry.version === ready) return;
    installing = true;
    try { await install('app-' + id); ready = entry.version; } catch { /* retried on the next check */ }
    installing = false;
    reloadWhenSafe();
  }
  check(true);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { check(); reloadWhenSafe(); } });
  addEventListener('online', () => check());
  setInterval(() => { if (!document.hidden) check(); }, 30 * 60000);
  setInterval(reloadWhenSafe, 3000);
}
