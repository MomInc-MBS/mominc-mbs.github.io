// Code-authored pictograms (24x24, stroke = currentColor). No emoji, no text; digits only where the spec allows (none here).
// Decorative by contract: every glyph is aria-hidden; the control that holds it carries the accessible name (names.js).
const P = d => `<path d="${d}"/>`, F = d => `<path class="f" d="${d}"/>`;
const BELL = 'M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 20.5a2 2 0 0 0 4 0';
const PHONE = '<rect x="7" y="2" width="10" height="20" rx="2"/>';
const CAL = '<rect x="3" y="5" width="18" height="16" rx="2"/>' + P('M3 10h18M8 3v4M16 3v4');
const CLOCK = '<circle cx="12" cy="12" r="9"/>' + P('M12 7v5l3 2');
const BOARD = '<rect x="3" y="3" width="18" height="18" rx="2"/>' + P('M12 3v18M3 12h18');

export const G = {
  // rail
  railClock: '<rect x="2" y="5" width="14" height="14" rx="2"/>' + P('M2 9h14M6 3v4M12 3v4') + '<circle cx="17" cy="16" r="5.5" class="bg"/>' + P('M17 13.5V16l1.6 1'),
  railSound: P('M3 9h3l4-4v14l-4-4H3z') + P('M14 9a4 4 0 0 1 0 6M17 6a8 8 0 0 1 0 12') + P('M21 9v6'),
  railScreen: '<circle cx="12" cy="12" r="4"/>' + P('M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4'),
  railChallenge: BOARD + F('M4.5 4.5h6v6h-6z'),
  railDevices: '<rect x="2" y="3" width="10" height="17" rx="2"/>' + '<rect x="15" y="8" width="7" height="9" rx="2"/>' + P('M17 8V5h3v3M17 17v3h3v-3M6 17h2'),
  railHistory: P('M3 12a9 9 0 1 0 3-6.7') + P('M3 3v5h5M12 7v5l3 2'),
  railPrefs: P('M4 6h16M4 12h16M4 18h16') + F('M7 4h4v4H7zM13 10h4v4h-4zM6 16h4v4H6z'),
  // alarm games (picker + in-play switch)
  gBrick: '<rect x="3" y="4" width="5" height="3"/><rect x="9.5" y="4" width="5" height="3"/><rect x="16" y="4" width="5" height="3"/>' + P('M4 20h8') + '<circle cx="15" cy="15" r="1.8" class="bg"/>',
  gPong: P('M4 6v8M20 10v8') + '<circle cx="12" cy="12" r="1.8" class="bg"/>' + P('M12 4v2M12 9v2M12 13v2M12 18v2'),
  gMatch3: '<circle cx="6" cy="12" r="2.6"/><circle cx="12" cy="12" r="2.6"/><circle cx="18" cy="12" r="2.6"/>' + P('M3 18h18'),
  gBlocks: F('M10 3h4v4h-4zM6 7h4v4H6zM10 7h4v4h-4zM14 7h4v4h-4z') + P('M3 21h18'),
  gMemory: '<rect x="3" y="5" width="8" height="14" rx="1.5"/><rect x="13" y="5" width="8" height="14" rx="1.5"/>' + F('M5.5 10h3v4h-3z'),
  gOdd: '<circle cx="7" cy="8" r="2.4"/><circle cx="17" cy="8" r="2.4"/><circle cx="7" cy="16" r="2.4"/>' + F('M14.6 13.6h4.8v4.8h-4.8z'),
  gSwap: P('M4 8h14M14 4l4 4-4 4M20 16H6M10 12l-4 4 4 4'),
  // schedule
  clock: CLOCK, calendar: CAL, pencil: P('M4 20l1-5L16 4l4 4L9 19zM14 6l4 4'),
  once: CAL + F('M10 13h4v4h-4z'), daily: P('M4 11a8 8 0 0 1 14-5M18 2v4h-4M20 13a8 8 0 0 1-14 5M6 22v-4h4'),
  weekly: CAL + F('M10 11h4v9h-4z'), dates: CAL + F('M6 12h3v3H6zM11 15h3v3h-3zM15 12h3v3h-3z'),
  interval: CAL + F('M5 15h3v3H5zM16 15h3v3h-3z') + P('M7 13c2-3 8-3 10 0M17 13l-2.5-.5M17 13l.5-2.5'),
  skip: CAL + P('M9 13l6 6M15 13l-6 6'), skipNext: '<rect x="2" y="5" width="13" height="14" rx="2"/>' + P('M2 9h13M6 12l5 5M11 12l-5 5M17 12h5M19.5 9.5L22 12l-2.5 2.5'),
  globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/>' + P('M3 12h18'),
  phoneGlobe: '<rect x="2" y="3" width="10" height="18" rx="2"/>' + '<circle cx="17" cy="14" r="5"/><ellipse cx="17" cy="14" rx="2" ry="5"/>' + P('M12 14h10M6 18h2'),
  bell: P(BELL), bellOff: P(BELL) + P('M3 3l18 18'), bellOn: P(BELL) + P('M2 8a10 10 0 0 1 3-5M22 8a10 10 0 0 0-3-5'),
  timeline: F('M2 17h4v4H2zM7.5 13h4v8h-4zM13 9h4v12h-4zM18.5 5h4v16h-4z'),
  // sound
  airHorn: '<rect x="2" y="9" width="6" height="11" rx="1.5"/>' + P('M8 13h3l9-6v14l-9-6H8M4 9V6h2v3'),
  trainHorn: '<rect x="5" y="2" width="14" height="15" rx="3"/>' + P('M5 9h14M8 21l2-4M16 21l-2-4') + F('M7.5 12.5h2v2h-2zM14.5 12.5h2v2h-2z'),
  buzzer: '<rect x="2" y="7" width="9" height="10" rx="1.5"/>' + P('M11 12h2l2-5 2 10 2-10 2 5h1') + F('M5 10h3v4H5z'),
  crash: P('M12 2l2 6 6-2-4 5 6 3-6 1 2 6-5-4-1 6-2-6-6 2 3-6-5-3 6-1-2-5 5 3z'),
  play: F('M7 4l13 8-13 8z'), stop: F('M6 6h12v12H6z'), pause: F('M6 5h4v14H6zM14 5h4v14h-4z'),
  speaker: P('M3 9h4l5-4v14l-5-4H3z') + P('M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12'),
  boost: P('M3 9h4l5-4v14l-5-4H3z') + P('M18 6v8M14 10h8'), ramp: P('M3 20C11 20 14 17 21 4') + F('M1.5 18.5h3v3h-3zM19.5 2.5h3v3h-3z'),
  burst: P('M2 12h1M4 8v8M6 10v4M10 12h1M12 8v8M14 10v4M18 12h1M20 8v8M22 10v4'),
  continuous: P('M2 12c1.5-6 3-6 4 0s2.5 6 4 0 2.5-6 4 0 2.5 6 4 0 2.5-6 4 0'),
  shuffle: P('M3 7h4l10 10h4M3 17h4l3-3M14 10l3-3h4M19 5l2 2-2 2M19 15l2 2-2 2'),
  speak: '<circle cx="9" cy="8" r="4"/>' + P('M2 21c0-4 3-6 7-6s7 2 7 6M17 6a4 4 0 0 1 0 6M20 3a8 8 0 0 1 0 12'),
  vibrate: PHONE + P('M3 8v8M21 8v8M1 10v4M23 10v4'),
  // screen / light
  torch: P('M8 2h8v5l-2 3v12h-4V10L8 7zM8 7h8M12 13v2'), torchSteady: P('M5 2h8v5l-2 3v12H7V10L5 7z') + P('M15 4h7M15 8h7M15 12h7'),
  torchPulse: P('M5 2h8v5l-2 3v12H7V10L5 7z') + P('M15 4h2M20 4h2M15 8h2M20 8h2M15 12h2M20 12h2'),
  sun: '<circle cx="12" cy="12" r="4"/>' + P('M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4'),
  border: PHONE + '<rect x="9" y="4.5" width="6" height="15" rx="1" class="acc"/>', screenPulse: PHONE + P('M3 8a10 10 0 0 0 0 8M21 8a10 10 0 0 1 0 8'),
  fullScreen: '<rect x="7" y="4" width="10" height="16" rx="2"/>' + P('M2 7V2h5M22 7V2h-5M2 17v5h5M22 17v5h-5'),
  lockScreen: '<rect x="3" y="2" width="11" height="20" rx="2"/>' + '<rect x="13" y="13" width="9" height="7" rx="1.5" class="bg"/>' + P('M15 13v-2a2.5 2.5 0 0 1 5 0v2'),
  wake: PHONE + '<circle cx="12" cy="11" r="2.5"/>' + P('M12 6.5v1M12 14.5v1M8 11h1M15 11h1'),
  dnd: P('M15 3a8 8 0 1 0 6 12A7 7 0 0 1 15 3z') + P('M5 21v-3a3 3 0 0 1 6 0v3zM7 22.5h2'),
  overlay: '<rect x="2" y="3" width="13" height="10" rx="1.5"/><rect x="7" y="9" width="13" height="11" rx="1.5" class="bg"/>' + '<circle cx="19" cy="6" r="3.5" class="f"/>',
  hourglass: P('M6 2h12M6 22h12M7 2c0 6 10 6 10 10s-10 4-10 10M17 2c0 6-10 6-10 10s10 4 10 10'),
  // challenge
  board2048: BOARD, math: P('M7 3v6M4 6h6M14 6h6M5 15l4 4M9 15l-4 4M14 17h6') + F('M16.5 13.5h1v1h-1zM16.5 19.5h1v1h-1z'),
  pattern: '<circle cx="5" cy="5" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="12" cy="19" r="2"/><circle cx="19" cy="19" r="2"/>' + P('M5 5l7 7 7-7M12 12v7'),
  qr: P('M3 8V3h5M16 3h5v5M21 16v5h-5M8 21H3v-5') + F('M7 7h4v4H7zM13 7h4v4h-4zM7 13h4v4H7zM14 14h2v2h-2z'),
  nfc: '<rect x="2" y="6" width="11" height="13" rx="2"/>' + P('M16 8a5 5 0 0 1 0 8M19 5a9 9 0 0 1 0 14') + F('M5 9h5v2H5z'),
  motion: '<ellipse cx="7" cy="9" rx="3" ry="4.5"/><ellipse cx="16" cy="14" rx="3" ry="4.5"/>' + F('M5.5 15h3v2.5h-3zM14.5 20h3v2.5h-3z'),
  code: '<rect x="2" y="6" width="20" height="12" rx="2"/>' + F('M5 10.5h2v3H5zM9 10.5h2v3H9zM13 10.5h2v3h-2zM17 10.5h2v3h-2z'),
  // devices / outputs
  watch: '<rect x="6" y="6" width="12" height="12" rx="3"/>' + P('M8 6V2h8v4M8 18v4h8v-4M12 9v3l2 1'),
  headphones: P('M4 15v-3a8 8 0 0 1 16 0v3') + '<rect x="3" y="14" width="4" height="7" rx="1"/><rect x="17" y="14" width="4" height="7" rx="1"/>',
  house: P('M3 11l9-8 9 8M5 10v11h14V10') + '<circle cx="12" cy="14" r="2.5"/>' + P('M12 16.5V19'),
  notify: P(BELL) + '<circle cx="18.5" cy="5.5" r="3" class="f"/>',
  push: P('M7 12a4 4 0 0 1 .5-8 5.5 5.5 0 0 1 10.5 1.5A3.5 3.5 0 0 1 18 12H7z') + P('M12 9v4M10 11.5l2 2 2-2') + P('M8.5 20v-2.5a3.5 3.5 0 0 1 7 0V20l1 1h-9zM11 22.5h2'),
  exactAlarm: '<circle cx="12" cy="13" r="7"/>' + P('M12 10v3l2 2M3 6l3-3M21 6l-3-3M7.5 19.5L6 22M16.5 19.5L18 22'),
  badge: '<rect x="3" y="5" width="15" height="15" rx="3"/><circle cx="18" cy="6" r="3.5" class="f"/>',
  widget: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="18" height="8" rx="1.5"/>',
  tile: '<rect x="2" y="7" width="20" height="10" rx="5"/><circle cx="17" cy="12" r="2.5" class="f"/>',
  storage: '<ellipse cx="12" cy="5" rx="8" ry="3"/>' + P('M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3'),
  update: P('M20 12a8 8 0 1 1-2.3-5.7M20 3v5h-5') + P('M12 8v7M9 12l3 3 3-3'),
  // actions / states
  plus: P('M12 4v16M4 12h16'), minus: P('M4 12h16'), check: P('M4 12.5l5 5L20 6'), cross: P('M6 6l12 12M18 6L6 18'),
  back: P('M20 12H4M10 5l-7 7 7 7'), chevL: P('M15 4l-8 8 8 8'), chevR: P('M9 4l8 8-8 8'), chevU: P('M4 15l8-8 8 8'), chevD: P('M4 9l8 8 8-8'),
  bin: P('M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6'),
  lock: '<rect x="4" y="11" width="16" height="11" rx="2"/>' + P('M8 11V7a4 4 0 0 1 8 0v4') + F('M11 15h2v3h-2z'),
  unlock: '<rect x="4" y="11" width="16" height="11" rx="2"/>' + P('M8 11V7a4 4 0 0 1 7.7-1.5'),
  octagon: '<path class="f" d="M8 1.5h8L22.5 8v8L16 22.5H8L1.5 16V8z"/><path class="inv" d="M8.5 8.5h7v7h-7z"/>',
  exportT: P('M4 14v6h16v-6M12 15V3M7 8l5-5 5 5'), importT: P('M4 14v6h16v-6M12 3v12M7 10l5 5 5-5'),
  eye: P('M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z') + '<circle cx="12" cy="12" r="3"/>',
  stillFace: '<circle cx="12" cy="12" r="9"/>' + F('M8 9h2v2H8zM14 9h2v2h-2z') + P('M8.5 15.5h7'),
  contrast: '<circle cx="12" cy="12" r="9"/>' + F('M12 3a9 9 0 0 1 0 18z'),
  key: '<circle cx="7.5" cy="15.5" r="4.5"/>' + P('M11 12l9-9M16 7l3 3M14 9l2 2'),
  warn: P('M12 3l10 18H2z') + P('M12 10v5') + F('M11 17h2v2h-2z'),
  slash: P('M3 3l18 18'), cloudBroken: P('M7 18a4 4 0 0 1 .5-8 5.5 5.5 0 0 1 9-2.5M19 10.5A3.5 3.5 0 0 1 18 18h-3') + P('M3 3l18 18'),
  phoneOpen: P('M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z'),
  // history outcomes (no judgement: shapes only)
  win: BOARD + P('M14 15.5l2 2 4-4.5'), loss: BOARD + P('M14.5 14.5l5 5M19.5 14.5l-5 5'),
  missed: CLOCK + P('M3 21L21 3'), interrupted: P('M2 12h6l2-4M14 16l2-4h6') + P('M11 3v4M13 17v4'), checkin: P('M3 7l9-4 9 4v10l-9 4-9-4z') + P('M8 12l3 3 5-6'),
  ring: '<circle cx="12" cy="12" r="9" class="tr"/><path class="ar" d="M12 3a9 9 0 0 1 9 9"/>',
};

/** Inline SVG markup for a glyph (aria-hidden). */
export const icon = (name, cls = '') => `<svg class="g${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${G[name] || ''}</svg>`;

/** Bar-strip previews (48x16): waveform thumbnails for sounds and vibration rhythms. Values are bar heights 0..1, 0 = gap. */
export const SOUND_WAVE = {
  'air-horn': [1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1],
  'train-horn': [.9, 1, 1, 1, 1, 1, 1, .9, 0, 0, .9, 1, 1, 1, 1, 1, 1, .9],
  buzzer: [1, .3, 1, .3, 1, .3, 1, .3, 1, .3, 1, .3, 1, .3, 1, .3, 1, .3],
  crash: [1, .9, .7, .5, .3, .2, 0, .6, 0, .6, 0, .6, 0, .6, 0, .6, 0, .6],
};
export const VIB_WAVE = {
  off: [], pulse: [1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0], heartbeat: [1, 0, .7, 0, 0, 0, 0, 1, 0, .7, 0, 0, 0, 0, 1, 0],
  sos: [.6, 0, .6, 0, .6, 0, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 0, .6, 0, .6, 0, .6], rapid: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
  wave: [.2, .4, .6, .8, 1, .8, .6, .4, .2, 0, .2, .4, .6, .8, 1, .8, .6, .4],
};
export const PATTERN_WAVE = {burst: [1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1], continuous: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]};
export function strip(bars, cls = '') {
  const n = Math.max(bars.length, 1), w = 48 / n;
  const r = bars.map((v, i) => v > 0 ? `<rect x="${(i * w + w * .15).toFixed(2)}" y="${(8 - 7 * v).toFixed(2)}" width="${(w * .7).toFixed(2)}" height="${(14 * v).toFixed(2)}" rx=".6"/>` : '').join('');
  return `<svg class="strip${cls ? ' ' + cls : ''}" viewBox="0 0 48 16" aria-hidden="true" focusable="false"><path class="base" d="M0 8h48"/>${r}</svg>`;
}

export const SOUNDS = ['air-horn', 'train-horn', 'buzzer', 'crash'];
export const SOUND_GLYPH = {'air-horn': 'airHorn', 'train-horn': 'trainHorn', buzzer: 'buzzer', crash: 'crash'};
export const CAP_GLYPH = {notify: 'notify', push: 'push', exactAlarm: 'exactAlarm', fullScreen: 'fullScreen', lockScreen: 'lockScreen', dnd: 'dnd', overlay: 'overlay',
  torch: 'torch', vibrate: 'vibrate', sound: 'speaker', speak: 'speak', wakeLock: 'wake', badge: 'badge', qr: 'qr', nfc: 'nfc', motion: 'motion', widget: 'widget',
  tile: 'tile', watch: 'watch', bluetooth: 'headphones', webhook: 'house', update: 'update', storage: 'storage'};
export const OUTCOME_GLYPH = {win: 'win', loss: 'loss', off: 'bellOff', emergency: 'octagon', missed: 'missed', interrupted: 'interrupted', checkin: 'checkin'};
const BADGE = {permission: 'key', disconnected: 'cloudBroken', error: 'warn', active: 'check'};

/** Capability pictogram with its §5.4 state: key badge, slashed + patterned boundary, open-phone silhouette, broken cloud + pending ring, warning, check. */
export function capIcon(glyph, state = 'available') {
  const inner = state === 'foreground' ? `<span class="fg">${icon('phoneOpen', 'fgp')}${icon(glyph, 'fgi')}</span>` : icon(glyph);
  const slash = state === 'unsupported' ? icon('slash', 'sl') : '';
  const badge = BADGE[state] ? `<span class="bd bd-${state}">${icon(BADGE[state])}${state === 'disconnected' ? '<span class="pend"></span>' : ''}</span>` : '';
  return `<span class="cap" data-state="${state}">${inner}${slash}${badge}</span>`;
}
