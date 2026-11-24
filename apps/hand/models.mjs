// Optional hand model packs: honest readiness + on-demand download through the existing game worker.
// Cache names/keys mirror game-assets-sw.js; a pack counts as ready only when its worker index record
// exists AND every file is still in the file cache at the recorded size (cache eviction => not ready).
const INDEX = 'mbs-game-index-v1', FILES = 'mbs-game-files-v1';

export async function isReady(pack) {
  try {
    const record = await (await caches.open(INDEX)).match(location.origin + '/.mbs-game-index/' + pack);
    if (!record) return false;
    const files = await caches.open(FILES);
    for (const a of (await record.json()).assets) {
      const hit = await files.match(location.origin + '/.mbs-game-file/' + a.revision);
      if (!hit || Number(hit.headers.get('x-mbs-bytes')) !== a.bytes) return false;
    }
    return true;
  } catch { return false; }
}

export async function download(pack, onProgress) {
  const registration = await navigator.serviceWorker.ready;
  const worker = navigator.serviceWorker.controller || registration.active;
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = ({data}) => {
      if (data.type === 'progress') onProgress(data.total ? Math.min(99, Math.floor(100 * data.loaded / data.total)) : 0);
      else { channel.port1.close(); data.type === 'ready' ? resolve() : reject(Error(data.message)); }
    };
    worker.postMessage({type: 'PREPARE_GAME', game: pack}, [channel.port2]);
  });
}

// Renders one row per model; returns refresh() to re-check readiness (e.g. when Settings opens).
export function renderModels(list, models) {
  const rows = models.map(m => {
    const li = document.createElement('li'), name = document.createElement('span'), state = document.createElement('span'), button = document.createElement('button');
    name.textContent = `${m.label} · ${m.mb} MB${m.note ? ' · ' + m.note : ''}`;
    state.className = 'state'; state.setAttribute('role', 'status'); button.type = 'button'; button.className = 'alt';
    li.append(name, state, button); list.append(li);
    let busy = false;
    const set = (text, kind, label) => { state.textContent = text; state.dataset.state = kind; button.hidden = !label; button.textContent = label || ''; };
    const refresh = async () => {
      if (busy) return;
      set('Checking…', 'check', '');
      if (await isReady(m.pack)) set('Ready offline ✓', 'ready', '');
      else set('Not downloaded · needs internet', 'missing', 'Download');
    };
    button.onclick = async () => {
      busy = true; button.disabled = true; set('Downloading 0%', 'busy', '');
      try { await download(m.pack, p => { state.textContent = `Downloading ${p}%`; }); busy = false; }
      catch (error) { busy = false; set(`${error.message} Needs internet.`, 'error', 'Retry'); button.disabled = false; return; }
      button.disabled = false; refresh();
    };
    return refresh;
  });
  const refresh = () => Promise.all(rows.map(r => r()));
  refresh();
  return refresh;
}
