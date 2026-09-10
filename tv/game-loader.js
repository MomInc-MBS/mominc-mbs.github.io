/* Start this in the head. A game downloads on page entry, before any game code
   mounts or a character/Start button can be used. No layout-collapsing display:none. */
(() => {
  'use strict';
  if (window.MBS_LOAD) return;
  const names = {mominc: 'MOM INC', girlfriend: 'Dr. Girlfriend', lilboyfriend: 'Lil Boyfriend',
    corgi: 'Cortisol Corgi', djscratch: 'DJ Scratch', fuel: 'Fuel', goon: 'The Goon Gala',
    'war-room': 'The War Room', armie: 'Coach Armie', handborne: 'Helping Hand'};
  const path = location.pathname;
  function pageGame() {
    if (path.startsWith('/tv/assets/armie-intro/')) return 'armie';
    if (path.startsWith('/handborne/')) return 'handborne';
    if (path.startsWith('/gala/terminal/') || path === '/tv/games/goon/war-room.html') return 'war-room';
    if (path.startsWith('/gala/') || path.startsWith('/tv/games/goon/')) return 'goon';
    if (path.startsWith('/arcade/tub-flight/')) return 'fuel';
    const route = path.match(/^\/(?:games|play)\/([^/]+)/)?.[1];
    if (route) return route;
    if (/^\/tv\/(?:index.html)?$/.test(path)) return new URLSearchParams(location.search).get('ch') || 'mominc';
    return document.documentElement.dataset.game;
  }
  let selected = pageGame();
  if (selected === 'sag') selected = 'mominc';
  let overlay, label, meter, note, retry, finishRequested = false, finished = false, workerPromise;
  const pending = new Map();
  const domReady = document.readyState === 'loading'
    ? new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, {once: true})) : Promise.resolve();
  const bodyReady = document.body ? Promise.resolve() : new Promise(resolve => {
    const observer = new MutationObserver(() => { if (document.body) {observer.disconnect(); resolve();} });
    observer.observe(document.documentElement, {childList: true, subtree: true});
  });

  function cover(game) {
    selected = game;
    document.documentElement.setAttribute('data-game-loading', '');
    if (!document.getElementById('mbs-game-loading-style')) {
      const style = document.createElement('style'); style.id = 'mbs-game-loading-style';
      style.textContent = `html[data-game-loading] body>:not(#mbs-game-loading){visibility:hidden!important}
        html[data-game-loading] body{overflow:hidden!important}
        #mbs-game-loading{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;overflow:auto;
          padding:24px;box-sizing:border-box;background:#171329;color:#fff9e6;text-align:center;font:16px/1.5 system-ui,sans-serif}
        #mbs-game-loading .download-card{width:min(100%,360px)}
        #mbs-game-loading img{display:block;width:min(64vw,240px);height:240px;max-height:35vh;object-fit:contain;margin:0 auto 24px}
        #mbs-game-loading h1{font:700 22px/1.3 system-ui,sans-serif;letter-spacing:0;margin:0 0 16px;color:inherit}
        #mbs-game-loading progress{display:block;accent-color:#f4c94e;width:100%;height:12px;margin:0 0 12px}
        #mbs-game-loading p{font:15px/1.5 system-ui,sans-serif;margin:12px 0;min-height:3em;color:inherit}
        #mbs-game-loading button{min-height:48px;padding:10px 28px;border:2px solid #fff3c4;border-radius:6px;background:#f4c94e;color:#171329;font:700 16px system-ui,sans-serif;cursor:pointer}
        #mbs-game-loading button[hidden]{display:none}
        #mbs-game-loading button:focus-visible{outline:3px solid white;outline-offset:4px}`;
      document.head.append(style);
    }
    const show = () => {
      if (finished) return;
      if (!overlay) {
        overlay = document.createElement('div'); overlay.id = 'mbs-game-loading';
        overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'mbs-game-loading-title');
        overlay.innerHTML = '<div class="download-card"><img alt=""><h1 id="mbs-game-loading-title"></h1><progress aria-label="Game download" max="100"></progress><p role="status" aria-live="polite"></p><button type="button" hidden>Try again</button></div>';
        [label, meter, note, retry] = ['h1', 'progress', 'p', 'button'].map(s => overlay.querySelector(s));
        document.body.append(overlay);
      }
      if (!overlay.isConnected) document.body.append(overlay);
      const logo = game === 'handborne' ? '/tv/assets/helping-hand-badge.png'
        : ['armie', 'corgi', 'djscratch', 'girlfriend', 'lilboyfriend'].includes(game)
          ? '/tv/assets/marks/' + game + '.png' : '/tv/assets/mom-inc-mark.png';
      overlay.querySelector('img').src = logo;
      label.textContent = 'Loading ' + names[game];
      note.textContent = 'Getting this game ready…';
    };
    if (document.body) show(); else bodyReady.then(show);
  }

  function worker() {
    if (!workerPromise) workerPromise = (async () => {
      if (!('serviceWorker' in navigator)) throw Error('This browser could not save the game. Please open this page in your browser and try again.');
      const registration = await navigator.serviceWorker.register('/game-assets-sw.js', {scope: '/', updateViaCache: 'none'});
      await navigator.serviceWorker.ready;
      const matches = () => navigator.serviceWorker.controller?.scriptURL === new URL('/game-assets-sw.js', location.origin).href;
      if (!matches()) await new Promise((resolve, reject) => {
        const changed = () => { if (matches()) { clearTimeout(timer); navigator.serviceWorker.removeEventListener('controllerchange', changed); resolve(); } };
        const timer = setTimeout(() => { navigator.serviceWorker.removeEventListener('controllerchange', changed); reject(Error('The download could not start. Please try again.')); }, 20000);
        navigator.serviceWorker.addEventListener('controllerchange', changed); changed();
      });
      return navigator.serviceWorker.controller || registration.active;
    })().catch(error => {workerPromise = null; throw error;});
    return workerPromise;
  }

  function transfer(game, update) {
    return worker().then(controller => new Promise((resolve, reject) => {
      const channel = new MessageChannel();
      let timer;
      const close = () => { clearTimeout(timer); channel.port1.close(); };
      const heartbeat = () => {
        clearTimeout(timer);
        timer = setTimeout(() => {close(); reject(Error('The download stopped. Check your connection and try again.'));}, 120000);
      };
      channel.port1.onmessage = ({data}) => {
        heartbeat();
        if (data.type === 'ready') {close(); resolve(data);}
        else if (data.type === 'error') {close(); reject(Error(data.message));}
        else if (data.type === 'progress') update(data);
      };
      heartbeat(); controller.postMessage({type: 'PREPARE_GAME', game}, [channel.port2]);
    }));
  }

  function prepare(game = selected) {
    if (game === 'goon' && document.documentElement.dataset.galaRoom === 'war-room') game = 'war-room';
    if (!names[game]) return Promise.resolve();
    if (pending.has(game)) return pending.get(game);
    finished = false; finishRequested = false; cover(game);
    // This promise stays pending on failure. Nothing waiting to mount the game is
    // released until a successful retry has checked every file in the pack.
    const promise = new Promise(resolve => {
      const attempt = async () => {
        await bodyReady;
        retry.hidden = true; meter.removeAttribute('value'); note.textContent = 'Getting this game ready…';
        try {
          const result = await transfer(game, ({loaded, total}) => {
            const percent = total ? Math.min(99, Math.floor(100 * loaded / total)) : 0;
            meter.value = percent;
            // The status text changes by percentage, not every network chunk.
            const text = loaded >= total && total ? 'Finishing the download…' : percent + '% · Loading the whole game';
            if (note.textContent !== text) note.textContent = text;
          });
          meter.value = 100; note.textContent = 'Opening ' + names[game] + '…';
          resolve(result);
        } catch (error) {
          note.textContent = error.message; retry.hidden = false; retry.onclick = attempt;
        }
      };
      attempt();
    });
    pending.set(game, promise);
    if (window.MBS_LOAD) window.MBS_LOAD.ready = promise;
    return promise;
  }

  async function finish() {
    if (finishRequested || !names[selected]) return;
    finishRequested = true;
    await api.ready;
    await domReady;
    // Decode the currently displayed images after mount. Later scene images are
    // already downloaded; keep the stage's geometry intact throughout.
    await Promise.all(Array.from(document.images).filter(img => img.loading !== 'lazy' && img.getAttribute('src'))
      .map(img => typeof img.decode === 'function' ? img.decode().catch(() => {}) : Promise.resolve()));
    if (document.fonts) await document.fonts.ready;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    finished = true;
    document.documentElement.removeAttribute('data-game-loading');
    overlay?.remove();
    window.MBS_RT?.resume('download');
    window.dispatchEvent(new Event('mbs-game-ready'));
  }

  function failed() {
    domReady.then(() => {
      if (!note) return;
      note.textContent = 'The game could not open. Please try again.';
      retry.hidden = false; retry.onclick = () => location.reload();
    });
  }

  // Static game entrypoints opt in by marking their existing scripts. Dependencies
  // retain document order; module load events include their top-level awaits.
  async function runScripts() {
    const scripts = Array.from(document.querySelectorAll('script[type="application/mbs-script"]'));
    // Parser-blocking classics originally ran before deferred/module scripts,
    // even when the module's tag appeared first in the head (War Room globals).
    scripts.sort((a, b) => Number(a.dataset.mbsDefer === 'true') - Number(b.dataset.mbsDefer === 'true'));
    for (const old of scripts) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        if (old.dataset.mbsType === 'module') script.type = 'module';
        script.async = false;
        if (old.dataset.mbsSrc) {
          script.src = old.dataset.mbsSrc; script.onload = resolve; script.onerror = reject;
        } else {
          script.textContent = old.textContent;
          if (script.type === 'module') {script.onload = resolve; script.onerror = reject;}
        }
        old.replaceWith(script);
        if (!script.src && script.type !== 'module') resolve();
      });
    }
  }

  const api = window.MBS_LOAD = {prepare, finish, failed, ready: null};
  api.ready = prepare();
  if (!names[selected]) return;
  // Capture input without making the game subtree inert/display:none: legacy
  // canvases and iframe games measure themselves while they mount behind the logo.
  for (const event of ['pointerdown', 'click', 'keydown']) document.addEventListener(event, e => {
    if (!finished && !overlay?.contains(e.target)) {e.preventDefault(); e.stopImmediatePropagation();}
  }, true);
  domReady.then(async () => {
    window.MBS_RT?.pause('download');
    await api.ready;
    try {
      await runScripts();
      // TV and play mounts explicitly finish after their fragment scripts run.
      if (!/^\/(tv\/(?:index.html)?|play\/[^/]+\/(?:index.html)?)$/.test(path) && path !== '/tv/games/goon/war-room.html') await finish();
    } catch (_) {failed();}
  });
})();
