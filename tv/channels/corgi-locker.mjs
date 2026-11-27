// Endless Corgi: main-hall lockers from section 3. Pure logic only (placement, the player's locker state, the creature's
// locker encounter); corgi.js draws, animates and routes. Node-testable: no DOM, no THREE, no Math.random.
//
// Placement is a POST-PASS on a finished v2 layout: it never touches the layout RNG, so a section (and a saved run's current
// section) regenerates byte-identically; lockers only add collision rects. Sections 1-2 and v1 layouts get none.
// Time is seconds of ACTIVE play handed in as dt, so a paused loop freezes every locker timer with it.
import { ACTOR_R, BASE_SPEED, circleHitsRect, clearSeg, routePath, validateLayout, mulberry32, chaserSpeed } from './corgi-endless.mjs';

export const LOCKER_FROM_SECTION = 3;
export const LK_W = 0.62, LK_D = 0.5, LK_H = 1.9, DOOR_W = 0.56, BANK_N = 2;       // one locker; a bank is BANK_N side by side
export const DOG_R = 0.28, CHASER_R = 0.32, MAX_REACH = 0.88;                     // corgi.js R / monster MR / BASE_CATCH (Slippery only shrinks it)
export const TRIGGER_R = 1.0, ARRIVE_R = 0.2, EXIT_MARGIN = 0.25, SPACING = 5, MAX_GAP = 7.5;
export const ENTRY = [['open', 0.3], ['turn', 0.4], ['back', 0.4], ['close', 0.4]];
export const EXIT_SEQ = [['open', 0.3], ['step', 0.4], ['close', 0.3]];
export const GRACE_S = 0.75, INSPECT_MIN_S = 2, INSPECT_MAX_S = 4, STUCK_S = 2.5;
// slit framing: the hidden camera sits at EYE_Y, deep in the locker; the creature stops so its head (HEAD_AHEAD in front of its
// centre, ~0.3..0.7 high in the inspection pose) is VIEW_D from that camera, which keeps head + teeth inside the centred slit band
export const EYE_Y = 0.51, HEAD_AHEAD = 0.46, VIEW_D = 1.55;
// reach budget: the dog sprinting (corgi.js SPEED x 1.7) must make a locker before a pursuer seated at the layout's own fair
// distance (validateLayout: >= 10 route units) closes to catch range. Faster sections get denser banks, capped at MAX_GAP.
export const DOG_SPRINT = BASE_SPEED * 1.7, FAIR_LEAD = 10;
export function reachGap(section) {
  const close = chaserSpeed(section) - DOG_SPRINT;
  return Math.min(MAX_GAP, close > 0 ? 2 * DOG_SPRINT * (FAIR_LEAD - MAX_REACH) / close : Infinity);   // ponytail: a 1-D chase model; past ~section 100 the hall's doorways cap density
}
export const seqLen = seq => seq.reduce((s, [, d]) => s + d, 0);
const CLEAR_DX = LK_W / 2 + CHASER_R + MAX_REACH + DOG_R + 0.6;                  // collider + attack reach + the dog + a margin, beyond the doorway

// ---------- placement: banks against the hall's side walls, doors facing the hall
const pt = (x, z) => [x, z];
function lockerOf(id, x, s, half) {
  const front = half - LK_D, out = s > 0 ? 0 : Math.PI;                          // yaw that looks from inside the locker out into the hall (-s)
  return {
    id, x, side: s, yawOut: out,
    rect: { x0: x - LK_W / 2, x1: x + LK_W / 2, z0: Math.min(s * front, s * half), z1: Math.max(s * front, s * half) },
    entry: pt(x, s * (front - DOG_R - 0.14)),                                    // where the dog stands to hide and is put back on exit
    interior: pt(x, s * (half - 0.12)), eyeY: EYE_Y, slit: pt(x, s * front),    // camera anchor deep inside; the door plane with the slit
    hinge: pt(x - (LK_W / 2 - 0.03), s * front), grip: pt(x + LK_W / 2 - 0.12, s * (front + 0.03)),
    inspect: pt(x, s * (half - 0.12 - VIEW_D - HEAD_AHEAD))                      // across the hall, facing the door: his head is VIEW_D from the hidden eye
  };
}
// a bank is valid if it sits on a solid stretch of its side wall (off doorways), keeps spawns/anchors/nav nodes/papers open,
// and leaves the hall wide enough for the dog, the open door and the creature's whole collider together
function bankOk(L, x, s, n, banks, half, face = false) {
  const w = n * LK_W, x0 = x - w / 2, x1 = x + w / 2, front = half - LK_D;
  if (x0 < 3 || x1 > L.corridorLength - 3) return false;                         // never at the spawn or the exit door
  const wallZ = L.corridorWalls.filter(c => Math.abs(c[1] - s * (half + 0.15)) < 0.2 && c[2] > 0.5);
  if (!wallZ.some(([cx, , cw]) => cx - cw / 2 <= x0 - 0.3 && cx + cw / 2 >= x1 + 0.3)) return false;   // solid wall behind it, 0.3 off any mouth
  const rect = { x0, x1, z0: Math.min(s * front, s * half), z1: Math.max(s * front, s * half) };
  const keep = [L.playerSpawn, L.chaserSpawn, ...L.recoveryPoints, ...L.mainAnchors, ...L.nav.nodes, ...L.objectives.map(o => o.approachPoint)];
  if (keep.some(p => circleHitsRect(p[0], p[1], ACTOR_R + 0.1, rect))) return false;
  if (L.collisionRects.some(r => rect.x0 < r.x1 && rect.x1 > r.x0 && rect.z0 < r.z1 && rect.z1 > r.z0)) return false;
  if (banks.some(b => (face ? b.s === s : true) && x0 < b.x1 + 0.6 && x1 > b.x0 - 0.6)) return false;   // face to face only when filling a gap
  return half - LK_D - DOOR_W + (half - (face ? LK_D : 0)) >= 2 * CHASER_R + 0.3;   // open door tip to the far wall (or the bank opposite): the creature still passes
}
export function lockersFor(L) {
  if (!L || L.layoutVersion !== 2 || !(L.section >= LOCKER_FROM_SECTION)) return { lockers: [], rects: [] };
  const half = L.clear.hall / 2, rng = mulberry32((L.sectionSeed ^ 0x10CCE7) >>> 0);   // its own stream: the layout RNG is never read
  const banks = [];
  for (let t = 4.5; t < L.corridorLength; t += SPACING) {                       // bankOk keeps every bank 3 off the spawn and the exit
    const sides = rng() < 0.5 ? [1, -1] : [-1, 1];
    found: for (let k = 0; k <= 12; k++) for (const n of [BANK_N, 1]) for (const s of sides) {
      const x = t + (k % 2 ? -1 : 1) * Math.ceil(k / 2) * 0.25;
      if (bankOk(L, x, s, n, banks, half)) { banks.push({ x, s, n, x0: x - n * LK_W / 2, x1: x + n * LK_W / 2 }); break found; }
    }
  }
  const G = reachGap(L.section), lockerGap = (a, b) => b.x0 - a.x1 + LK_W;          // measured locker centre to locker centre
  for (let i = 1; i < banks.length; i++) {                                         // fill: a stretch wider than this section's reach gets a bank inside it
    if (lockerGap(banks[i - 1], banks[i]) <= G) continue;
    const mid = (banks[i].x + banks[i - 1].x) / 2, kMax = 2 * Math.ceil((banks[i].x - banks[i - 1].x) / 2 / 0.125);   // the whole stretch, middle first
    fill: for (const face of [false, true]) for (let k = 0; k <= kMax; k++) for (const n of [BANK_N, 1]) for (const s of [1, -1]) {
      const x = mid + (k % 2 ? -1 : 1) * Math.ceil(k / 2) * 0.125;
      if (bankOk(L, x, s, n, banks, half, face)) { banks.splice(i, 0, { x, s, n, x0: x - n * LK_W / 2, x1: x + n * LK_W / 2 }); i--; break fill; }   // re-check both halves
    }
  }
  // repair: drop banks (last first) until the section still validates with them in collision
  const make = list => list.flatMap((b, bi) => Array.from({ length: b.n }, (_, i) => lockerOf(`${L.sectionSeed}:${bi}:${i}`, b.x0 + LK_W * (i + 0.5), b.s, half)));
  let list = banks;
  for (;;) {
    const lockers = make(list), rects = lockers.map(l => l.rect), test = { ...L, collisionRects: [...L.collisionRects, ...rects] };
    const reach = lockers.every(l => clearSeg(test.collisionRects, l.entry[0], l.entry[1], l.x, 0, DOG_R) && clearSeg(test.collisionRects, l.inspect[0], l.inspect[1], l.x, 0, CHASER_R));   // both open straight onto the spine
    if (!list.length || (reach && validateLayout(test).ok)) return { lockers, rects };
    list = list.slice(0, -1);
  }
}
// nearest locker whose entry is within reach of (x, z)
export function lockerNear(lockers, x, z, r = TRIGGER_R) {
  let best = null, bd = r;
  for (const l of lockers) { const d = Math.hypot(l.entry[0] - x, l.entry[1] - z); if (d <= bd) { bd = d; best = l; } }
  return best;
}
// ordered sequence lookup: which step t falls in and how far through it
export function phaseAt(seq, t) {
  let a = 0;
  for (const [name, d] of seq) { if (t < a + d) return { name, u: (t - a) / d, done: false }; a += d; }
  return { name: seq[seq.length - 1][0], u: 1, done: true };
}

// ---------- the player: PLAYING -> ENTERING -> HIDDEN -> EXITING -> EXIT_GRACE -> PLAYING. One damage check for every loss path.
export const newPlayerLock = () => ({ mode: 'PLAYING', t: 0, lockerId: null, look: null, graceKey: null, graceUsed: [] });
export const damageEligible = p => !p || p.mode === 'PLAYING';
export const inLocker = p => !!p && (p.mode === 'ENTERING' || p.mode === 'HIDDEN' || p.mode === 'EXITING');
// Accept only from free play (a latch: taps during any sequence do nothing), alive, unlocked section, within reach, nothing between
export function canEnter(p, { alive, section, locker, x, z, rects }) {
  if (!locker || !alive || !(section >= LOCKER_FROM_SECTION) || (p.mode !== 'PLAYING' && p.mode !== 'EXIT_GRACE')) return false;
  return Math.hypot(locker.entry[0] - x, locker.entry[1] - z) <= TRIGGER_R && clearSeg(rects, x, z, locker.entry[0], locker.entry[1], 0.05);
}
export const enter = (p, locker, look) => ({ ...p, mode: 'ENTERING', t: 0, lockerId: locker.id, look });
// the exit spot (the entry point) must not overlap a wall or the creature's collider; otherwise the player stays safe inside
export function exitClear(locker, creature, rects) {
  const [x, z] = locker.entry;
  if (rects.some(r => circleHitsRect(x, z, DOG_R, r))) return false;
  return !creature || Math.hypot(creature[0] - x, creature[1] - z) >= DOG_R + CHASER_R + EXIT_MARGIN;
}
// the exit action: a clear spot, and never while he is sniffing at this very door (an early exit is allowed once he is passing)
export const canExit = (enc, locker, creature, rects) => exitClear(locker, creature, rects) && !(enc && enc.lockerId === locker.id && enc.stage === 'INSPECT');
export const exit = (p, graceKey) => p.mode === 'HIDDEN' ? { ...p, mode: 'EXITING', t: 0, graceKey } : p;
export function tickPlayer(p, dt) {
  const t = p.t + dt;
  if (p.mode === 'ENTERING') return t >= seqLen(ENTRY) ? { ...p, mode: 'HIDDEN', t: 0 } : { ...p, t };
  if (p.mode === 'EXITING') {
    if (t < seqLen(EXIT_SEQ)) return { ...p, t };
    const k = p.graceKey, fresh = k && !p.graceUsed.includes(k);                  // grace at most once per encounter id; never stacked or refreshed
    return fresh ? { ...p, mode: 'EXIT_GRACE', t: 0, lockerId: null, graceUsed: [...p.graceUsed, k].slice(-16) } : { ...p, mode: 'PLAYING', t: 0, lockerId: null };
  }
  if (p.mode === 'EXIT_GRACE') return t >= GRACE_S ? { ...p, mode: 'PLAYING', t: 0 } : { ...p, t };
  return p.mode === 'HIDDEN' ? { ...p, t } : p;
}

// ---------- the creature: APPROACH -> INSPECT (2-4 s, once) -> PASS (past the doorway) -> CLEAR (collider + reach off the exit) -> DONE
export const STAGES = ['APPROACH', 'INSPECT', 'PASS', 'CLEAR', 'DONE'];
const hashU = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return (h >>> 0) / 4294967296; };
export const inspectSeconds = id => INSPECT_MIN_S + (INSPECT_MAX_S - INSPECT_MIN_S) * hashU(String(id));
export function newEncounter(id, locker, creature) {
  return { id, lockerId: locker.id, stage: 'APPROACH', inspectT: 0, inspectDur: inspectSeconds(id), inspected: false, startX: creature[0], dir: 0, clear: null, stuckT: 0, log: ['APPROACH'] };
}
const segPointDist = (a, b, p) => { const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz, t = l2 > 0 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / l2)) : 0; return Math.hypot(a[0] + dx * t - p[0], a[1] + dz * t - p[1]); };
// a downstream hall point the creature commits to: past the doorway by collider + reach + the dog + margin, on the spine, routable
export function clearWaypoint(L, locker, dir, from) {
  for (const d of [dir, -dir]) {
    const x = locker.x + d * CLEAR_DX, p = [x, 0];
    if (x < 1 || x > L.corridorLength - 1 || L.collisionRects.some(r => circleHitsRect(x, 0, ACTOR_R, r))) continue;
    if (routePath(L, from[0], from[1], x, 0)) return { x, z: 0, dir: d };
  }
  return null;
}
// where the encounter wants the creature this tick (null = the encounter is not steering it)
export function encounterGoal(enc, locker) {
  if (!enc || enc.stage === 'DONE') return null;
  if (enc.stage === 'APPROACH') return { x: locker.inspect[0], z: locker.inspect[1], hold: false };
  if (enc.stage === 'INSPECT') return { x: locker.inspect[0], z: locker.inspect[1], hold: true };
  return enc.clear ? { x: enc.clear.x, z: enc.clear.z, hold: false } : { x: locker.inspect[0], z: locker.inspect[1], hold: true };   // no route yet: hold, never retarget the player
}
const go = (e, stage) => ({ ...e, stage, stuckT: 0, log: [...e.log, stage].slice(-8) });
// One sim step with the creature's swept move prev -> cur. Transitions fall through within a step, so a long frame can never skip a state.
// navFailed: the host could not route to the goal this tick. playerOut: the player left the locker before the inspection began.
export function stepEncounter(enc, { locker, L, prev, cur, dt, navFailed = false, playerOut = false }) {
  if (!enc || enc.stage === 'DONE') return enc;
  let e = enc;
  if (e.stage === 'APPROACH' && playerOut) return go({ ...e, cancelled: true }, 'DONE');               // nobody inside any more: ordinary pursuit
  const moved = Math.hypot(cur[0] - prev[0], cur[1] - prev[1]);
  e = { ...e, stuckT: (e.stage === 'INSPECT' || moved > 0.02 * dt) ? 0 : e.stuckT + dt };
  if (e.stage === 'APPROACH' && segPointDist(prev, cur, locker.inspect) <= ARRIVE_R) e = go(e, 'INSPECT');     // the arrival frame was travel: the sniff clock starts next step
  else if (e.stage === 'APPROACH' && (navFailed || e.stuckT >= STUCK_S)) e = commit(go({ ...e, inspected: true, skipped: true }, 'INSPECT'), L, locker, cur);   // cannot reach: skip the sniff, keep the pass
  else if (e.stage === 'INSPECT' && !e.inspected) {
    e = { ...e, inspectT: Math.min(e.inspectDur, e.inspectT + dt) };
    if (e.inspectT >= e.inspectDur) e = commit({ ...e, inspected: true }, L, locker, cur);
  } else if (e.stage === 'INSPECT' && e.inspected && !e.clear) e = commit(e, L, locker, cur);          // earlier commit had no route: retry
  if ((enc.stage === 'PASS' || enc.stage === 'CLEAR') && (navFailed || e.stuckT >= STUCK_S)) {       // route lost mid-pass (this step's failure is about the old goal): re-plan, keep the commitment
    const alt = clearWaypoint(L, locker, e.clear ? -e.clear.dir : e.dir || 1, cur);
    e = alt ? { ...e, clear: alt, dir: alt.dir, stuckT: 0, replans: (e.replans || 0) + 1 } : { ...e, stuckT: 0 };
  }
  if (e.stage === 'PASS' && e.clear && e.clear.dir * (cur[0] - locker.x) > LK_W / 2) e = go(e, 'CLEAR');   // half-plane: a swept test by nature
  if (e.stage === 'CLEAR' && e.clear && e.clear.dir * (cur[0] - e.clear.x) >= -0.05) e = go(e, 'DONE');
  return e;
}
function commit(e, L, locker, cur) {
  const dir = Math.sign(locker.x - e.startX) || Math.sign(L.corridorLength / 2 - locker.x) || 1;    // keep going the way it came
  const clear = clearWaypoint(L, locker, dir, cur);
  return clear ? go({ ...e, dir: clear.dir, clear }, 'PASS') : { ...e, dir };
}
// after the encounter, while the player is still hidden, the creature keeps going down the hall (it ignores the occupied locker)
export const patrolPoint = (L, enc) => [(enc && enc.dir < 0) ? 1.5 : L.corridorLength - 2, 0];
// a new inspection only after the player is out, away from the trigger, and the old encounter has finished
export const rearmed = (enc, p, locker, x, z) => !enc || (enc.stage === 'DONE' && p.mode === 'PLAYING' && (!locker || Math.hypot(locker.entry[0] - x, locker.entry[1] - z) > TRIGGER_R));
