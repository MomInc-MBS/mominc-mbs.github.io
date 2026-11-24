// Shared app shell runtime: opening menu, settings, full-screen game, offline status.
import {setupInstall} from '/apps/install.mjs';
const $ = id => document.getElementById(id);
// The game loader runs this module once the app's offline pack is verified; config sits in #app-config.
function boot(cfg) {
  const menu = $('menu'), settings = $('settings'), stage = $('stage'), host = $('host'), offline = $('offline');
  let game = null;
  const show = view => { for (const el of [menu, settings, stage]) el.hidden = el !== view; };
  const best = () => { try { return Math.max(0, Math.floor(Number(localStorage.getItem(cfg.bestKey))) || 0); } catch { return 0; } };
  const refresh = () => { $('best').textContent = best(); };
  addEventListener('mbs-game-ready', () => { offline.textContent = 'Ready offline ✓'; offline.dataset.state = 'ready'; });
  $('start').onclick = async () => {
    show(stage);
    try {
      game = (await import(cfg.src))[cfg.mount](host, cfg.options);
      host.querySelector('canvas')?.focus();
    } catch { host.textContent = 'The game could not open. Go back and try again.'; }
  };
  $('back').onclick = () => { game?.dispose?.(); game = null; host.replaceChildren(); refresh(); show(menu); };
  $('open-settings').onclick = () => show(settings);
  $('close-settings').onclick = () => { refresh(); show(menu); };
  $('reset').onclick = () => {
    if (!confirm('Reset your best score?')) return;
    try { localStorage.removeItem(cfg.bestKey); } catch {}
    refresh(); $('reset-note').textContent = 'Best score reset.';
  };
  setupInstall({button: $('install'), status: $('install-status'), list: $('install-steps'), iosHelp: $('ios-help'), name: cfg.name});
  refresh(); show(menu);
}
boot(JSON.parse($('app-config').textContent));
