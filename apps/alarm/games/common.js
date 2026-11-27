// Shared bits for the alarm games: the app's monospace glyph stack (digits only on screen) and a tiny seeded RNG whose state lives in the saved round.
export const MONO = "ui-monospace,'SF Mono',Menlo,Consolas,'Cascadia Mono',monospace";
/** mulberry32 over a state object {rng:uint32}: deterministic, serialisable. */
export function rand(st) {
  st.rng = (st.rng + 0x6D2B79F5) | 0;
  let t = st.rng; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export const freshSeed = () => ((Math.random() * 2 ** 31) >>> 0) || 1;
