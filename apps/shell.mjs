// Shared app shell runtime: opening menu, settings, full-screen game, offline status.
import {setupInstall} from '/apps/install.mjs';
const $ = id => document.getElementById(id);
// The game loader runs this module once the app's offline pack is verified; config sits in #app-config.
function boot(cfg) {
  const menu = $('menu'), settings = $('settings'), stage = $('stage'), host = $('host'), offline = $('offline');
  let game = null;
  const show = view => { for (const el of [menu, settings, stage]) el.hidden = el !== view; };
  const best = () => { try { return Math.max(0, Math.floor(Number(localStorage.getItem(cfg.bestKey))) || 0); } catch { return 0; } };
  const refresh = () => { if ($('best')) $('best').textContent = best(); };
  addEventListener('mbs-game-ready', () => { offline.textContent = 'Ready offline ✓'; offline.dataset.state = 'ready'; });
  $('start').onclick = async () => {
    show(stage);
    try {
      if (cfg.mode === 'iframe') {   // an existing same-origin page, kept inside the app's own scope
        const frame = document.createElement('iframe');
        frame.title = cfg.name; frame.src = cfg.src; frame.allow = 'fullscreen';
        host.replaceChildren(frame); game = {dispose() { frame.src = 'about:blank'; }};
        return;
      }
      game = (await import(cfg.src))[cfg.mount](host, cfg.options);
      host.querySelector('canvas')?.focus();
    } catch { host.textContent = 'The game could not open. Go back and try again.'; }
  };
  $('back').onclick = () => { game?.dispose?.(); game = null; host.replaceChildren(); refresh(); show(menu); };
  $('open-settings').onclick = () => show(settings);
  $('close-settings').onclick = () => { refresh(); show(menu); };
  if ($('reset')) $('reset').onclick = () => {
    if (!confirm('Reset your best score?')) return;
    try { localStorage.removeItem(cfg.bestKey); } catch {}
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
  refresh(); show(menu);
}
boot(JSON.parse($('app-config').textContent));
