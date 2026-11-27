// Coach Jump pyramid menu: the selector state machine. Pure, no DOM. Ids are persisted, never indexes.
export const LOOK_KEY = 'mbs-app-jump-look-v1';
export const CATS = ['music', 'coach', 'color'];
// Home slots: color = middle-left, coach = middle-right, music = bottom-centre.
const LAYOUT = {
  music: {left: 'color', right: 'coach', center: 'music'},
  coach: {left: 'color', right: 'music', center: 'coach'},   // coach moves down, music takes its vacated right slot
  color: {left: 'music', right: 'coach', center: 'color'},   // color moves down, music takes its vacated left slot
};
export const layout = active => LAYOUT[active] || LAYOUT.music;

const validEyes = n => Number.isInteger(n) && n >= 1 && n <= 5;
/** The first valid candidate wins, per field: saved look, then the saved round's Coach, then the fixed default. */
const firstIn = (ids, ...candidates) => candidates.find(c => ids.includes(c));

/**
 * catalog = {shapes: [ids], palettes: [ids], tracks: [ids] (may be empty until the soundtrack catalog loads)}
 * defaults = {shapeId, paletteId, eyes, trackId}
 */
export function initialState({saved, round, catalog, defaults}) {
  const s = saved && typeof saved === 'object' ? saved : {}, r = round && typeof round === 'object' ? round : {};
  return {
    active: 'music',
    shapeId: firstIn(catalog.shapes, s.shapeId, r.shapeId, defaults.shapeId) ?? catalog.shapes[0],
    paletteId: firstIn(catalog.palettes, s.paletteId, r.paletteId, defaults.paletteId) ?? catalog.palettes[0],
    eyes: [s.eyes, r.eyes, defaults.eyes].find(validEyes) ?? 2,
    // Tracks load later: until then keep the saved id so a slow catalog never wipes the choice (see fixTrack).
    trackId: catalog.tracks.length ? firstIn(catalog.tracks, s.trackId, defaults.trackId) ?? catalog.tracks[0] : (s.trackId || defaults.trackId),
  };
}
/** Once the soundtrack catalog arrives, make the track valid. */
export const fixTrack = (state, tracks, defaultTrack) =>
  !tracks.length || tracks.includes(state.trackId) ? state : {...state, trackId: tracks.includes(defaultTrack) ? defaultTrack : tracks[0]};

/** One category tap changes only which selector is active. */
export const pick = (state, category) => CATS.includes(category) && category !== state.active ? {...state, active: category} : state;

const FIELD = {coach: ['shapeId', 'shapes'], color: ['paletteId', 'palettes'], music: ['trackId', 'tracks']};
/** Previous/next (dir -1/+1): only the active category's value moves; wraps at the ends. */
export function step(state, dir, catalog) {
  const [field, list] = FIELD[state.active], ids = catalog[list];
  if (!ids.length) return state;
  const i = ids.indexOf(state[field]);
  return {...state, [field]: ids[i < 0 ? 0 : (i + dir + ids.length) % ids.length]};
}

export const toLook = s => ({v: 1, shapeId: s.shapeId, paletteId: s.paletteId, eyes: s.eyes, trackId: s.trackId});
export const runConfig = s => Object.freeze({shapeId: s.shapeId, paletteId: s.paletteId, eyes: s.eyes, trackId: s.trackId});

export function readJson(store, key) { try { return JSON.parse(store.getItem(key)); } catch { return null; } }
export function saveLook(store, state) { try { store.setItem(LOOK_KEY, JSON.stringify(toLook(state))); } catch { /* still playable unsaved */ } }
