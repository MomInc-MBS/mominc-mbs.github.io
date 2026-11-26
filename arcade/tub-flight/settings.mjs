// Player settings for Tub Flight / Nitro Fuel. Own key; never touches the best score or the unlock receipt.
export const SETTINGS_KEY='nitro-fuel-settings-v1';
const DEFAULTS={v:1,sfx:true,music:true,sfxVol:.8,musVol:.5,fx:null,seen:false};
export function loadSettings(){try{const o=JSON.parse(localStorage.getItem(SETTINGS_KEY));if(o&&o.v===1)return {...DEFAULTS,...o};}catch{}return {...DEFAULTS};}
export function saveSettings(s){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(s));}catch{}}
// Reduced Effects when chosen, or (nothing chosen yet) when the OS asks for reduced motion.
export const isReduced=s=>s.fx?s.fx==='reduced':!!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
