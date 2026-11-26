// Shared app shell runtime: opening menu, settings, full-screen game, offline status.
import {setupInstall, isStandalone} from '/apps/install.mjs';
import {watchUpdates} from '/apps/update.mjs';
const $ = id => document.getElementById(id);
// The game loader runs this module once the app's offline pack is verified; config sits in #app-config.
function boot(cfg) {
  const ui = $('app-ui');   // download-only apps keep their play UI inert until a standalone launch
  if (ui) {
    if (!isStandalone()) { setupInstall({button: $('gate-install'), status: $('gate-status'), list: $('gate-steps'), iosHelp: $('gate-ios'), name: cfg.name}); return; }
    $('gate')?.remove(); document.body.prepend(ui.content);
  }
  const menu = $('menu'), settings = $('settings'), stage = $('stage'), host = $('host'), offline = $('offline');
  let game = null, loaded = null, sheet = null, refreshModels = null;
  const editor = cfg.mode === 'editor';  // Hand Customizer: the page's own editor, not a mounted game
  const show = view => { for (const el of [menu, settings, stage]) el.hidden = el !== view; };
  const best = () => { try { return Math.max(0, Math.floor(Number(localStorage.getItem(cfg.bestKey))) || 0); } catch { return 0; } };
  const refresh = () => { if ($('best')) $('best').textContent = best(); };
  addEventListener('mbs-game-ready', () => { offline.textContent = 'Ready offline ✓'; offline.dataset.state = 'ready'; });
  $('start').onclick = async () => {
    show(stage);
    if (editor) {
      // The editor styles are only active while it is on screen, so they never restyle this menu.
      if (!sheet) sheet = document.head.appendChild(Object.assign(document.createElement('link'), {rel: 'stylesheet', href: cfg.style}));
      sheet.disabled = false;
      try { await (loaded ||= (async () => { if (cfg.before) await import(cfg.before); await import(cfg.src); })()); }
      catch { loaded = null; host.append(Object.assign(document.createElement('p'), {textContent: 'The editor could not open. Go back and try again.'})); }
      return;
    }
    try {
      if (cfg.mode === 'iframe') {   // an existing same-origin page, kept inside the app's own scope
        const frame = document.createElement('iframe');
        frame.title = cfg.name; frame.src = cfg.src; frame.allow = 'fullscreen';
        host.replaceChildren(frame); game = {dispose() { frame.src = 'about:blank'; }};
        return;
      }
      game = await (await import(cfg.src))[cfg.mount](host, cfg.options);
      host.querySelector('canvas')?.focus();
    } catch { host.textContent = 'The game could not open. Go back and try again.'; }
  };
  $('back').onclick = () => {
    if (editor) { if (sheet) sheet.disabled = true; show(menu); return; }  // keep the editor and its hand alive
    game?.dispose?.(); game = null; host.replaceChildren(); refresh(); show(menu); };
  $('open-settings').onclick = () => { show(settings); refreshModels?.(); };
  $('close-settings').onclick = () => { refresh(); show(menu); };
  if ($('reset')) $('reset').onclick = () => {
    if (!confirm(editor ? 'Reset your hand to the default look?' : 'Reset your best score?')) return;
    for (const key of editor ? cfg.resetKeys : [cfg.bestKey]) try { localStorage.removeItem(key); } catch {}
    if (editor) { if (loaded) location.reload(); $('reset-note').textContent = 'Hand reset.'; return; }
    refresh(); $('reset-note').textContent = 'Best score reset.';
  };
  // Tilt steering: shown only on touch devices that expose orientation; turned on only after a real reading arrives.
  const tilt = $('tilt'), tiltKey = cfg.options?.tiltKey;
  if (tilt && tiltKey && matchMedia('(pointer: coarse)').matches && 'DeviceOrientationEvent' in window) {
    $('tilt-panel').hidden = false;
    const on = () => { try { return localStorage.getItem(tiltKey) === '1'; } catch { return false; } };
    const note = text => { $('tilt-note').textContent = text; };
    const paint = () => { tilt.textContent = 'Tilt steering: ' + (on() ? 'on' : 'off'); };
    const save = v => { try { v ? localStorage.setItem(tiltKey, '1') : localStorage.removeItem(tiltKey); } catch {} paint(); };
    tilt.onclick = async () => {
      if (on()) { save(false); note(''); return; }
      try {
        if (typeof DeviceOrientationEvent.requestPermission === 'function' && await DeviceOrientationEvent.requestPermission() !== 'granted') { note('Tilt permission was not granted.'); return; }
      } catch { note('Tilt permission could not be requested.'); return; }
      const ok = await new Promise(resolve => {
        const h = e => { if (e.gamma != null) done(true); };
        const done = v => { removeEventListener('deviceorientation', h); clearTimeout(timer); resolve(v); };
        const timer = setTimeout(() => done(false), 1500);
        addEventListener('deviceorientation', h);
      });
      if (ok) { save(true); note('Tilt steering on. Touch still works.'); } else note('This device sent no tilt readings.');
    };
    paint();
  }
  setupInstall({button: $('install'), status: $('install-status'), list: $('install-steps'), iosHelp: $('ios-help'), name: cfg.name});
  if (editor && $('models')) import(cfg.models).then(m => { refreshModels = m.renderModels($('models'), cfg.optional); });
  if (cfg.settingsModule) import(cfg.settingsModule).then(m => m.setupSettings?.({root: settings, refresh}));
  refresh(); show(menu);
  watchUpdates({busy: () => cfg.options?.autostart === true ? false : !stage.hidden});   // autostart:true apps (Coach Jump) report a run themselves via window.MOM_APP_BUSY
  // a game, the editor or the alarm computer on screen = not a safe moment to reload
  // Opt-in (apps.json web.options.autostart = query name): a notification tap lands inside the app, not on the menu.
  const auto = cfg.options?.autostart;
  if (auto === true || (auto && new URLSearchParams(location.search).has(auto))) $('start').click();
}
boot(JSON.parse($('app-config').textContent));
