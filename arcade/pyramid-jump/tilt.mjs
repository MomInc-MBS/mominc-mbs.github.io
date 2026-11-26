// Site-only (not synced from the Coach repo): lean steering for Pyramid Jump. Arrow keys are in game.mjs.
// gamma is left/right lean in portrait; logic.steeringForMotion scales steerX by 2.2 and clamps to ±1,
// so /30 reaches full steer at ~14° of lean.
let granted = !(typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function');

export function subscribeTilt(cb) {
  const on = e => { if (e.gamma != null) cb({steerX: e.gamma / 30}); };
  addEventListener('deviceorientation', on);
  return () => removeEventListener('deviceorientation', on);
}

let asking = null;
// Call synchronously inside a tap (e.g. a GO button): asks iPhone for motion right away, so tiltReady needs no card.
export function askTilt() {
  if (granted || asking) return asking;
  try { asking = DeviceOrientationEvent.requestPermission().then(r => { granted = r === 'granted'; }, () => {}).finally(() => { asking = null; }); } catch {}
  return asking;
}

// iPhone only grants motion from a tap, so show one tap-to-allow card before the round; resolves at once elsewhere.
export async function tiltReady(host) {
  if (asking) await asking;
  if (granted) return;
  return new Promise(resolve => {
    const card = document.createElement('div');
    card.style.cssText = 'position:absolute;inset:0;z-index:5;display:grid;place-content:center;gap:12px;padding:24px;text-align:center;background:#171329;color:#fff4dc;font:700 16px system-ui,sans-serif';
    card.innerHTML = '<p>Lean your phone left and right to steer.</p><button type="button" style="min-height:48px;padding:0 22px;border:3px solid #fff;border-radius:999px;background:#c8ff4d;color:#1d1428;font:800 16px system-ui,sans-serif">Allow leaning</button>';
    const done = () => { card.remove(); resolve(); };
    card.querySelector('button').onclick = async () => {
      try { granted = await DeviceOrientationEvent.requestPermission() === 'granted'; } catch {}
      done(); // denied still plays (arrow keys on a keyboard); the card comes back next round
    };
    host.append(card);
  });
}
