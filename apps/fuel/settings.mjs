// Nitro Fuel settings dialog + the one-time intensity notice. Reads/writes only the Fuel settings key.
import {loadSettings, saveSettings, isReduced} from '/arcade/tub-flight/settings.mjs';
const $ = id => document.getElementById(id);
export function setupSettings() {
  const S = loadSettings(), save = () => saveSettings(S);
  const sfx = $('set-sfx'), music = $('set-music'), sfxVol = $('set-sfx-vol'), musicVol = $('set-music-vol');
  sfx.checked = S.sfx; music.checked = S.music; sfxVol.value = Math.round(S.sfxVol * 100); musicVol.value = Math.round(S.musVol * 100);
  sfx.onchange = () => { S.sfx = sfx.checked; save(); };
  music.onchange = () => { S.music = music.checked; save(); };
  sfxVol.oninput = () => { S.sfxVol = sfxVol.value / 100; save(); };
  musicVol.oninput = () => { S.musVol = musicVol.value / 100; save(); };
  const radios = [...document.getElementsByName('set-fx')];
  const paint = () => { const mode = isReduced(S) ? 'reduced' : 'classic'; for (const r of radios) r.checked = r.value === mode; };
  for (const r of radios) r.onchange = () => { S.fx = r.value; save(); };
  paint();
  // The game starts from a fresh read of the same key, so every change here applies the next time a run opens.
  const notice = $('fx-notice');
  if (!S.seen) {
    notice.hidden = false;
    const pick = mode => { S.fx = mode; S.seen = true; save(); notice.hidden = true; paint(); };
    $('fx-classic').onclick = () => pick('classic'); $('fx-reduced').onclick = () => pick('reduced');
    (isReduced(S) ? $('fx-reduced') : $('fx-classic')).focus();
  }
}
