/* Start this in the head. A game downloads on page entry, before any game code
   mounts or a character/Start button can be used. No layout-collapsing display:none. */
(() => {
  'use strict';
  if (window.MBS_LOAD) return;
  const names = {mominc: 'MOM INC', girlfriend: 'Dr. Girlfriend', lilboyfriend: 'Lil Boyfriend',
    corgi: 'Cortisol Corgi', djscratch: 'DJ Scratch', fuel: 'Fuel', goon: 'The Goon Gala',
    'war-room': 'The War Room', armie: 'Coach Armie', handborne: 'Helping Hand',
    misinformation: "MOM's Misinformation Machine", 'app-fuel': "MOM's: Nitro Fuel", 'app-jump': "MOM's: Coach Jump", 'app-misinformation': "MOM's: Misinformation Machine", 'app-hand': "MOM's: Hand Customizer", 'app-corgi': "Mom's Endless Corgi Workday", 'app-alarm': "MOM's: 2048 Reminder"};
  const path = location.pathname;
  // Opt-in: <html data-loader="bar"> keeps the page usable and shows a slim bottom bar instead of a cover.
  const barMode = document.documentElement.dataset.loader === 'bar';
  const tvPage = /^\/tv\/(?:index\.html)?$/.test(path);
  const channelName = new URLSearchParams(location.search).get('ch') || 'mominc';
  // MOM INC is the network homepage, not a standalone game. Mount its content
  // normally and keep its already-lazy films out of the blocking game download.
  const homePage = tvPage && ['mominc', 'sag'].includes(channelName);
  function pageGame() {
    if (path.startsWith('/tv/assets/armie-intro/')) return 'armie';
    if (path.startsWith('/handborne/')) return 'handborne';
    if (path.startsWith('/gala/terminal/') || path === '/tv/games/goon/war-room.html') return 'war-room';
    if (path.startsWith('/gala/') || path.startsWith('/tv/games/goon/')) return 'goon';
    if (path.startsWith('/arcade/tub-flight/')) return 'fuel';
    const route = path.match(/^\/(?:games|play)\/([^/]+)/)?.[1];
    if (route) return route;
    if (tvPage) return homePage ? null : channelName;
    return document.documentElement.dataset.game;
  }
  let selected = pageGame();
  if (selected === 'sag') selected = 'mominc';
  // A game page opened inside its installed app (?app=1) verifies the lean app pack, not the website's full pack.
  if (names['app-' + selected] && new URLSearchParams(location.search).get('app') === '1') selected = 'app-' + selected;
  let overlay, label, meter, note, retry, batt, shown = false, showTimer, finishRequested = false, finished = false, workerPromise;
  const pending = new Map();
  const domReady = document.readyState === 'loading'
    ? new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, {once: true})) : Promise.resolve();
  const bodyReady = document.body ? Promise.resolve() : new Promise(resolve => {
    const observer = new MutationObserver(() => { if (document.body) {observer.disconnect(); resolve();} });
    observer.observe(document.documentElement, {childList: true, subtree: true});
  });

  // The television page keeps its cabinet: the overlay sits inside the glass (#screen, parsed after
  // this head script, so it attaches at domReady) and hides nothing else. Every other page covers
  // itself whole. The download starts at page entry either way; only the attach waits.
  const hostReady = tvPage ? domReady : bodyReady;
  function setPct(p) {
    const unknown = p == null;
    batt.classList.toggle('unk', unknown); batt.classList.remove('err');
    if (unknown) return;
    batt.style.setProperty('--p', p + '%'); batt.style.setProperty('--c', 'hsl(' + Math.round(p * 1.2) + ',85%,55%)');
    batt.querySelector('b').textContent = p + '%';
  }
  function reveal() { clearTimeout(showTimer); shown = true; overlay?.classList.remove('mbs-wait'); }
  function cover(game) {
    selected = game;
    if (!barMode) document.documentElement.setAttribute('data-game-loading', '');
    if (!document.getElementById('mbs-game-loading-style')) {
      const style = document.createElement('style'); style.id = 'mbs-game-loading-style';
      const full = (tvPage
        ? `html[data-game-loading] #screen{overflow:hidden!important}
        #mbs-game-loading{position:absolute;inset:0;z-index:50}
        #mbs-game-loading img{height:min(200px,26vh)!important}`
        : `html[data-game-loading] body>:not(#mbs-game-loading){visibility:hidden!important}
        html[data-game-loading] body{overflow:hidden!important}
        #mbs-game-loading{position:fixed;inset:0;z-index:2147483647}`) + `
        #mbs-game-loading{display:grid;place-items:center;overflow:auto;
          padding:24px;box-sizing:border-box;background:#171329;color:#fff9e6;text-align:center;font:16px/1.5 system-ui,sans-serif}
        #mbs-game-loading .download-card{width:min(100%,360px)}
        #mbs-game-loading img{display:block;width:min(64vw,240px);height:240px;max-height:35vh;object-fit:contain;margin:0 auto 24px}
        #mbs-game-loading h1{font:700 22px/1.3 system-ui,sans-serif;letter-spacing:0;margin:0 0 16px;color:inherit}
        #mbs-game-loading .mbs-batt{margin:0 auto 12px}
        #mbs-game-loading p{font:15px/1.5 system-ui,sans-serif;margin:12px 0;min-height:3em;color:inherit}
        #mbs-game-loading button{min-height:48px;padding:10px 28px;border:2px solid #fff3c4;border-radius:6px;background:#f4c94e;color:#171329;font:700 16px system-ui,sans-serif;cursor:pointer}
        #mbs-game-loading button[hidden]{display:none}
        #mbs-game-loading button:focus-visible{outline:3px solid white;outline-offset:4px}`;
      const bar = `#mbs-game-loading{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;pointer-events:none;
          box-sizing:border-box;padding:max(12px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));
          color:#fff9e6;font:13px/1.3 system-ui,sans-serif;text-align:center}
        #mbs-game-loading.mbs-wait{display:none}
        #mbs-game-loading .download-card{pointer-events:auto;box-sizing:border-box;width:min(100%,280px);padding:16px 14px;background:#171329;border:2px solid #f4c94e;border-radius:18px;box-shadow:0 8px 32px #000a}
        #mbs-game-loading h1{font:700 13px/1.3 system-ui,sans-serif;margin:0 0 12px;color:inherit;text-transform:none;text-shadow:none}
        #mbs-game-loading .mbs-batt{margin:0 auto 10px}
        #mbs-game-loading p{margin:0 0 4px;font:12px/1.3 system-ui,sans-serif;color:inherit;min-height:2.6em}
        #mbs-game-loading button{min-height:40px;margin-top:6px;padding:4px 18px;border:2px solid #fff3c4;border-radius:6px;background:#f4c94e;color:#171329;font:700 14px system-ui,sans-serif;cursor:pointer}
        #mbs-game-loading img{display:none}
        #mbs-game-loading button[hidden]{display:none}`;
      const batt = `#mbs-game-loading progress{position:absolute;width:1px;height:1px;opacity:0;overflow:hidden;pointer-events:none}
        #mbs-game-loading .mbs-batt{display:flex;align-items:center;width:140px;max-width:100%;--p:0%;--c:#f4c94e}
        #mbs-game-loading .mbs-body{position:relative;box-sizing:border-box;width:132px;height:60px;border:4px solid #fff9e6;border-radius:14px;overflow:hidden;background:#0d0a1a}
        #mbs-game-loading .mbs-fill{position:absolute;left:0;top:0;bottom:0;width:var(--p);background:var(--c);transition:width .25s,background-color .25s}
        #mbs-game-loading .mbs-pct{position:absolute;inset:0;display:grid;place-items:center;font:800 26px/1 system-ui,sans-serif;color:#171329;text-shadow:0 0 3px #fff9e6,0 0 6px #fff9e6,0 0 10px #fff9e6}
        #mbs-game-loading .mbs-bolt{display:none;width:22px;height:34px;fill:#171329;stroke:#fff9e6;stroke-width:1.5;stroke-linejoin:round}
        #mbs-game-loading .mbs-nub{width:8px;height:24px;margin-left:-1px;background:#fff9e6;border-radius:0 5px 5px 0}
        #mbs-game-loading .mbs-batt.unk .mbs-fill{width:100%;background:linear-gradient(90deg,#f4c94e55 0,#f4c94ecc 50%,#f4c94e55 100%) 0 0/200% 100%;animation:mbs-charge 1.4s linear infinite;transition:none}
        #mbs-game-loading .mbs-batt.unk .mbs-bolt{display:block}
        #mbs-game-loading .mbs-batt.unk .mbs-pct b{display:none}
        #mbs-game-loading .mbs-batt.err{--p:0%}
        #mbs-game-loading .mbs-batt.err .mbs-body{border-color:#ff4b4b}
        #mbs-game-loading .mbs-batt.err .mbs-nub{background:#ff4b4b}
        #mbs-game-loading .mbs-batt.err .mbs-pct{color:#ff8a8a;text-shadow:none}
        @keyframes mbs-charge{to{background-position:-200% 0}}
        @media (prefers-reduced-motion:reduce){#mbs-game-loading .mbs-batt.unk .mbs-fill{animation:none;background:#f4c94e66}#mbs-game-loading .mbs-fill{transition:none}}`;
      style.textContent = (barMode ? bar : full) + batt;
      document.head.append(style);
    }
    if (!overlay) {
      overlay = document.createElement('div'); overlay.id = 'mbs-game-loading';
      overlay.setAttribute('role', barMode ? 'region' : 'dialog'); if (!barMode) overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-labelledby', 'mbs-game-loading-title');
      overlay.innerHTML = '<div class="download-card"><img alt=""><h1 id="mbs-game-loading-title"></h1><div class="mbs-batt unk" aria-hidden="true"><div class="mbs-body"><i class="mbs-fill"></i><span class="mbs-pct"><svg class="mbs-bolt" viewBox="0 0 24 36"><path d="M14 1 2 20h8l-2 15L22 15h-8z"/></svg><b></b></span></div><span class="mbs-nub"></span></div><progress aria-label="Game download" max="100"></progress><p role="status" aria-live="polite"></p><button type="button" hidden>Try again</button></div>';
      [label, meter, note, retry] = ['h1', 'progress', 'p', 'button'].map(s => overlay.querySelector(s));
      batt = overlay.querySelector('.mbs-batt');
      // Bar mode stays hidden unless the download outlasts 700 ms (a cached re-verify finishes first) or fails.
      if (barMode) overlay.classList.add('mbs-wait');
    }
    const logo = game === 'handborne' ? '/tv/assets/helping-hand-badge.png'
      : ['armie', 'corgi', 'djscratch', 'girlfriend', 'lilboyfriend'].includes(game)
        ? '/tv/assets/marks/' + game + '.png' : '/tv/assets/mom-inc-mark.png';
    overlay.querySelector('img').src = logo;
    label.textContent = (barMode ? 'Saving ' : 'Loading ') + names[game] + (barMode ? ' for offline play' : '');
    note.textContent = 'Getting this game ready…';
    if (barMode && !shown && !showTimer) showTimer = setTimeout(reveal, 700);
    hostReady.then(() => {
      if (finished || overlay.isConnected) return;
      ((tvPage && document.getElementById('screen')) || document.body).append(overlay);
    });
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
    if (homePage && (!game || game === 'mominc' || game === 'sag')) return Promise.resolve();
    if (game === 'goon' && document.documentElement.dataset.galaRoom === 'war-room') game = 'war-room';
    if (!names[game]) return Promise.resolve();
    if (pending.has(game)) return pending.get(game);
    finished = false; finishRequested = false; cover(game);
    // This promise stays pending on failure. Nothing waiting to mount the game is
    // released until a successful retry has checked every file in the pack.
    const promise = new Promise(resolve => {
      const attempt = async () => {
        retry.hidden = true; meter.removeAttribute('value'); setPct(null); note.textContent = 'Getting this game ready…';
        try {
          const result = await transfer(game, ({loaded, total}) => {
            const percent = total ? Math.min(99, Math.floor(100 * loaded / total)) : 0;
            meter.value = percent; setPct(percent);
            // The status text changes by percentage, not every network chunk.
            const text = loaded >= total && total ? 'Finishing the download…' : percent + '% · Loading the whole game';
            if (note.textContent !== text) note.textContent = text;
          });
          meter.value = 100; setPct(100); if (barMode && !shown) clearTimeout(showTimer); note.textContent = 'Opening ' + names[game] + '…';
          resolve(result);
        } catch (error) {
          note.textContent = error.message; retry.hidden = false; retry.onclick = attempt;
          setPct(0); batt.classList.add('err'); batt.querySelector('b').textContent = ''; reveal();
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
    // A real update reads as charged: hold the full battery for a beat. Cached re-verifies never showed it.
    clearTimeout(showTimer);
    if (barMode && shown) await new Promise(resolve => setTimeout(resolve, 300));
    finished = true;
    document.documentElement.removeAttribute('data-game-loading');
    overlay?.remove();
    if (!barMode) window.MBS_RT?.resume('download');
    window.dispatchEvent(new Event('mbs-game-ready'));
  }

  function failed() {
    domReady.then(() => {
      if (!note) return;
      note.textContent = 'The game could not open. Please try again.';
      if (batt) {setPct(0); batt.classList.add('err'); batt.querySelector('b').textContent = ''; reveal();}
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
  // Refresh an older worker without hiding the homepage or requiring cache space.
  if (homePage) worker().catch(() => {});
  if (!names[selected]) return;
  // Capture input without making the game subtree inert/display:none: legacy
  // canvases and iframe games measure themselves while they mount behind the logo.
  // The television's own cabinet controls (dial, power, keys) stay usable while the glass loads.
  if (!barMode) for (const event of ['pointerdown', 'click', 'keydown']) document.addEventListener(event, e => {
    if (finished || overlay?.contains(e.target) || (tvPage && e.target?.closest?.('.panel, .off3d'))) return;
    e.preventDefault(); e.stopImmediatePropagation();
  }, true);
  domReady.then(async () => {
    if (!barMode) window.MBS_RT?.pause('download');
    await api.ready;
    try {
      await runScripts();
      // TV and play mounts explicitly finish after their fragment scripts run.
      if (!/^\/(tv\/(?:index.html)?|play\/[^/]+\/(?:index.html)?)$/.test(path) && path !== '/tv/games/goon/war-room.html') await finish();
    } catch (_) {failed();}
  });
})();
