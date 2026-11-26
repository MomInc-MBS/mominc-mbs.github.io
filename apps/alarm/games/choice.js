// The app-wide default alarm game. 2048 is the default and the fallback; anything unknown reads as 2048. Never throws (storage can be blocked).
export const GAME_KEY = 'mom-alarm-game-v1';
export const CHOICES = ['2048', 'brick', 'pong', 'match3', 'blocks', 'memory', 'odd'];
export const getChoice = (ls = globalThis.localStorage) => { try { const v = ls.getItem(GAME_KEY); return CHOICES.includes(v) ? v : '2048'; } catch { return '2048'; } };
export const setChoice = (id, ls = globalThis.localStorage) => { try { if (CHOICES.includes(id)) ls.setItem(GAME_KEY, id); } catch {} };
