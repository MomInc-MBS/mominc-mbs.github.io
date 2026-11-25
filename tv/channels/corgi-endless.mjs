// Cortisol Corgi Endless: pure rules (no DOM, no three.js) so node can sweep them.
// Layout vocabulary is the existing school's: a main corridor along +x (z in +-1.2 clear), and per area one
// dead-end branch plus one two-mouth loop around a solid pillar (same topology as corgi.js genArea),
// parameterised in depth/width/side/mirror. Decoration randomness is NOT drawn here (see decorSeed).

export const GEN_VERSION = 1;
export const STORE_KEY = 'corgi-endless-v2';   // the v1 key (STORE_KEY_V1) is read for migration and never overwritten
export const BASE_SPEED = 2.5;      // = corgi.js SPEED, the immutable dog walking speed
export const ACTOR_R = 0.34;        // clearance used for routes: dog .28, chaser .32, plus margin
export const CORRIDOR_HALF = 1.35;  // wall centre line (inner face 1.2)

// ---------- seeds: three independent streams per section (layout/objectives, decoration, perk offers)
export const sectionSeed = (runSeed, section) => (runSeed + section - 1) >>> 0;
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const mixSeed = (a, b) => { let h = Math.imul((a ^ 0x9E3779B9) >>> 0, 0x85EBCA6B) ^ Math.imul((b + 0x7F4A7C15) >>> 0, 0xC2B2AE35); h ^= h >>> 15; return Math.imul(h, 0x2C1B3C6D) >>> 0; };

// ---------- geometry helpers (rect = {x0,x1,z0,z1})
const rectOf = ([cx, cz, w, d]) => ({ x0: cx - w / 2, x1: cx + w / 2, z0: cz - d / 2, z1: cz + d / 2 });
export function circleHitsRect(x, z, r, w) {
  const px = Math.max(w.x0, Math.min(x, w.x1)), pz = Math.max(w.z0, Math.min(z, w.z1));
  return (x - px) ** 2 + (z - pz) ** 2 < r * r;
}
// slab test: does the segment pass through the rect?
export function segHitsRect(ax, az, bx, bz, w) {
  let t0 = 0, t1 = 1; const dx = bx - ax, dz = bz - az;
  for (const [p, d, lo, hi] of [[ax, dx, w.x0, w.x1], [az, dz, w.z0, w.z1]]) {
    if (Math.abs(d) < 1e-9) { if (p < lo || p > hi) return false; continue; }
    let a = (lo - p) / d, b = (hi - p) / d; if (a > b) [a, b] = [b, a];
    t0 = Math.max(t0, a); t1 = Math.min(t1, b); if (t0 > t1) return false;
  }
  return true;
}
export function clearSeg(rects, ax, az, bx, bz, r = ACTOR_R) {
  const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 0.1));
  for (let i = 0; i <= n; i++) {
    const x = ax + (bx - ax) * i / n, z = az + (bz - az) * i / n;
    for (const w of rects) if (circleHitsRect(x, z, r, w)) return false;
  }
  return true;
}

// ---------- one area, built in local coords u (along x from the spine) and zabs (distance from the corridor)
function buildArea(i, p) {
  const { cx, s, m, bFar, lFar, lw, pw } = p;
  const X = u => cx + m * u, Z = a => s * a, nearZ = 1.35;
  const wall = (u, za, w, d) => [X(u), Z(za), w, d];            // axis-aligned, so mirroring only moves the centre
  const zc = (a, b) => (a + b) / 2;
  const walls = [
    wall(-4.4, zc(nearZ, bFar), 0.3, bFar - nearZ), wall(-1.6, zc(nearZ, bFar), 0.3, bFar - nearZ), wall(-3, bFar + 0.15, 3.1, 0.3),                    // branch + cap
    wall(1.5, zc(nearZ, lFar), 0.3, lFar - nearZ), wall(1.5 + lw, zc(nearZ, lFar), 0.3, lFar - nearZ), wall(1.5 + lw / 2, lFar + 0.15, lw + 0.3, 0.3), // loop + cap
    wall(1.5 + lw / 2, zc(nearZ + 1.5, lFar - 1.5), pw, (lFar - 1.5) - (nearZ + 1.5))                                                                 // pillar
  ];
  const legW = (lw - 0.3 - pw) / 2, c1 = 1.65 + legW / 2, c2 = 1.5 + lw - 0.15 - legW / 2;
  const iv = (a, b) => [Math.min(X(a), X(b)), Math.max(X(a), X(b))];
  const mouths = [iv(-4.25, -1.75), iv(c1 - 0.6, c1 + 0.6), iv(c2 - 0.6, c2 + 0.6)];
  const bx = X(-3), xw = X(c1), xe = X(c2), band = Z(2.175), top = Z(lFar - 0.75);
  const px = bx, pz = Z(bFar - 1.0);
  return {
    id: i, name: `AREA ${i + 1}`, side: s, mirror: m, walls, mouths, deskYaw: s > 0 ? 0 : Math.PI,
    pagePos: [px, 1.0, pz],
    approach: [px, Z(bFar - 1.0 - 0.45 - 0.36)],                     // desk edge (0.45) plus body clearance, corridor side
    deskRect: rectOf([px, pz, 0.7, 0.9]),
    lights: [[bx, Z(nearZ + 2.2)], [bx, Z(bFar - 1)], [zc(xw, xe) , Z(nearZ + 1)], [zc(xw, xe), top]].map(([x, z]) => [x, z]),
    anchors: [[bx, Z(nearZ - 0.35)], [bx, Z(3.5)], [bx, Z(bFar - 1.8)], [xw, band], [xe, band], [xw, top], [xe, top]],
    bbox: { x0: Math.min(X(-4.6), X(1.7 + lw)), x1: Math.max(X(-4.6), X(1.7 + lw)), z0: Math.min(Z(nearZ), Z(lFar)) - 0.2, z1: Math.max(Z(nearZ), Z(lFar)) + 0.2 },
    nav: { bx, xw, xe, band, top, approach: [px, Z(bFar - 1.0 - 0.45 - 0.36)] }
  };
}

function footprint(p) { const a = p.cx + p.m * -4.4, b = p.cx + p.m * (1.5 + p.lw); return [Math.min(a, b) - 0.15, Math.max(a, b) + 0.15]; }

// ---------- assemble a section from parameters
function assemble(runSeed, section, version, specs, rng) {
  const areas = specs.map((p, i) => buildArea(i, p));
  const L = Math.max(34, Math.ceil(Math.max(...specs.map(p => footprint(p)[1])) + 3));
  const corridor = [[-0.6, 0, 0.4, 3.0]];
  for (const s of [1, -1]) {
    const gaps = areas.filter(a => a.side === s).flatMap(a => a.mouths).sort((a, b) => a[0] - b[0]);
    let cur = -0.4;
    for (const [lo, hi] of gaps) { if (lo > cur + 1e-6) corridor.push([(cur + lo) / 2, s * CORRIDOR_HALF, lo - cur, 0.3]); cur = Math.max(cur, hi); }
    corridor.push([(cur + L + 0.15) / 2, s * CORRIDOR_HALF, L + 0.15 - cur, 0.3]);
  }
  const door = [L, 0, 0.3, 2.6];
  // objectives: exactly three papers in distinct areas, chosen by the layout stream
  const order = areas.map((_, i) => i); for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  const objectives = order.slice(0, 3).sort((a, b) => a - b).map((ai, k) => ({
    objectiveId: `${runSeed}:${section}:${k}`, areaId: ai, pagePos: areas[ai].pagePos, approachPoint: areas[ai].approach, deskYaw: areas[ai].deskYaw
  }));
  // route graph: corridor spine + one branch line + one ring per area
  const nodes = [], edges = [], keyIdx = new Map();
  const node = (x, z, tag) => { const k = x.toFixed(3) + ',' + z.toFixed(3); if (!keyIdx.has(k)) { keyIdx.set(k, nodes.length); nodes.push([x, z, tag || '']); } return keyIdx.get(k); };
  const link = (a, b) => edges.push([a, b, Math.hypot(nodes[a][0] - nodes[b][0], nodes[a][1] - nodes[b][1])]);
  const xs = new Set([1, L - 1]);
  for (const a of areas) { xs.add(a.nav.bx); xs.add(a.nav.xw); xs.add(a.nav.xe); }
  const sorted = [...xs].sort((a, b) => a - b), spine = [];
  for (let i = 0; i < sorted.length; i++) { spine.push(sorted[i]); const nx = sorted[i + 1]; if (nx !== undefined) for (let x = sorted[i] + 4; x < nx - 2; x += 4) spine.push(x); }
  const spineIdx = [...new Set(spine)].sort((a, b) => a - b).map(x => node(x, 0, 'corridor'));
  for (let i = 1; i < spineIdx.length; i++) link(spineIdx[i - 1], spineIdx[i]);
  const at = x => spineIdx[[...new Set(spine)].sort((a, b) => a - b).indexOf(x)];
  for (const a of areas) {
    const n = a.nav, s = a.side, c0 = at(n.bx), mid = node(n.bx, s * 2.6, 'mouth'), ap = node(n.approach[0], n.approach[1], 'paper' + a.id);
    link(c0, mid); link(mid, ap);
    const wb = node(n.xw, n.band, 'ring'), eb = node(n.xe, n.band, 'ring'), wt = node(n.xw, n.top, 'ring'), et = node(n.xe, n.top, 'ring');
    link(at(n.xw), wb); link(at(n.xe), eb); link(wb, wt); link(eb, et); link(wb, eb); link(wt, et);
  }
  const playerSpawn = [1.0, 0], chaserSpawn = [L - 2, 0];
  const recoveryPoints = [[1.0, 0], [Math.round(L / 3), 0], [Math.round(2 * L / 3), 0]];
  const mainAnchors = []; for (let x = 2; x < L - 1; x += 5) mainAnchors.push([x, 1], [x, -1]);
  const all = [...corridor.map(rectOf), ...areas.flatMap(a => a.walls.map(rectOf)), rectOf(door)];
  const desks = areas.filter(a => objectives.some(o => o.areaId === a.id)).map(a => a.deskRect);
  return {
    layoutVersion: version, runSeed, section, sectionSeed: sectionSeed(runSeed, section), bounds: { x0: -0.8, x1: L + 0.2, z0: -10, z1: 10 }, corridorLength: L,
    mirrored: specs[0].s < 0, areaCount: areas.length, areas, corridorWalls: corridor, doorRect: rectOf(door), door, collisionRects: [...all, ...desks],
    entry: playerSpawn, exit: [L, 0], doorSockets: [[L - 0.6, 0]], playerSpawn, playerYaw: -Math.PI / 2, chaserSpawn, recoveryPoints, mainAnchors,
    objectives, anchors: mainAnchors, nav: { nodes, edges }, decorSeed: mixSeed(sectionSeed(runSeed, section), 0xDEC0), dark: true
  };
}

// ---------- routing: Dijkstra over the validated graph, entered through any clear straight segment
export function routePath(layout, ax, az, bx, bz) {
  const rects = layout.collisionRects;
  if (clearSeg(rects, ax, az, bx, bz)) return [[ax, az], [bx, bz]];
  const { nodes, edges } = layout.nav, n = nodes.length, adj = nodes.map(() => []);
  for (const [a, b, d] of edges) { adj[a].push([b, d]); adj[b].push([a, d]); }
  const link = (x, z) => {   // up to four nearest nodes reachable by a clear straight segment (lazy: stops once found)
    const out = [], order = nodes.map((p, i) => [i, Math.hypot(p[0] - x, p[1] - z)]).sort((a, b) => a[1] - b[1]);
    for (const [i, d] of order) { if (clearSeg(rects, x, z, nodes[i][0], nodes[i][1])) out.push([i, d]); if (out.length >= 4) break; }
    return out;
  };
  const from = link(ax, az), to = link(bx, bz);
  if (!from.length || !to.length) return null;
  const dist = new Array(n).fill(Infinity), prev = new Array(n).fill(-1), done = new Array(n).fill(false);
  for (const [i, d] of from) dist[i] = d;
  for (;;) {
    let u = -1; for (let i = 0; i < n; i++) if (!done[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0) break; done[u] = true;
    for (const [v, d] of adj[u]) if (dist[u] + d < dist[v]) { dist[v] = dist[u] + d; prev[v] = u; }
  }
  let best = -1, bd = Infinity; for (const [i, d] of to) if (dist[i] + d < bd) { bd = dist[i] + d; best = i; }
  if (best < 0) return null;
  const out = []; for (let u = best; u >= 0; u = prev[u]) out.push([nodes[u][0], nodes[u][1]]);
  out.reverse(); return [[ax, az], ...out, [bx, bz]];
}
export const pathLength = p => p ? p.reduce((s, q, i) => i ? s + Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1]) : 0, 0) : Infinity;
// the first `len` units of a path, as points (used by Scent Trail)
export function trimPath(path, len) {
  const out = [path[0]]; let used = 0;
  for (let i = 1; i < path.length && used < len; i++) {
    const d = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
    if (used + d <= len) { out.push(path[i]); used += d; } else { const t = (len - used) / d; out.push([path[i - 1][0] + (path[i][0] - path[i - 1][0]) * t, path[i - 1][1] + (path[i][1] - path[i - 1][1]) * t]); used = len; }
  }
  return out;
}
// uncollected papers ranked by route distance from (x,z); returns {index, path} of the nearest reachable
export function nearestPaper(layout, x, z, collectedIdx) {
  let best = null;
  layout.objectives.forEach((o, i) => {
    if (collectedIdx.includes(i)) return;
    const path = routePath(layout, x, z, o.approachPoint[0], o.approachPoint[1]);
    const d = pathLength(path); if (path && (!best || d < best.d)) best = { index: i, path, d };
  });
  return best;
}

// where the dog comes back after a capture (farthest recovery point from the pursuer) and where he is re-seated (farthest anchor from the dog)
export const chooseRecovery = (L, mx, mz) => L.recoveryPoints.reduce((b, r) => Math.hypot(r[0] - mx, r[1] - mz) > Math.hypot(b[0] - mx, b[1] - mz) ? r : b);
export const chooseSeat = (L, p) => L.mainAnchors.reduce((b, a) => Math.hypot(a[0] - p[0], a[1] - p[1]) > Math.hypot(b[0] - p[0], b[1] - p[1]) ? a : b);

// ---------- validation (12.7): enclosure, reachability, clearance, fair spawns
export function validateLayout(L) {
  const errors = [], rects = L.collisionRects, R = ACTOR_R;
  const free = (x, z) => { for (const w of rects) if (circleHitsRect(x, z, R, w)) return false; return true; };
  const wallsOnly = [...L.corridorWalls.map(rectOf), ...L.areas.flatMap(a => a.walls.map(rectOf))];
  for (const a of L.areas) for (const w of a.walls) if (!(w[2] > 0 && w[3] > 0)) errors.push('degenerate wall');
  for (const o of L.objectives) {
    const d = L.areas[o.areaId].deskRect;
    if (wallsOnly.some(w => d.x0 < w.x1 && d.x1 > w.x0 && d.z0 < w.z1 && d.z1 > w.z0)) errors.push('desk overlaps wall ' + o.objectiveId);
    if (!free(o.approachPoint[0], o.approachPoint[1])) errors.push('approach blocked ' + o.objectiveId);
    if (Math.hypot(o.approachPoint[0] - o.pagePos[0], o.approachPoint[1] - o.pagePos[2]) > 0.88) errors.push('approach too far from paper');
  }
  if (new Set(L.objectives.map(o => o.areaId)).size !== 3 || L.objectives.length !== 3) errors.push('need three distinct objective areas');
  for (const s of [1, -1]) { const m = L.areas.filter(a => a.side === s).flatMap(a => a.mouths).sort((a, b) => a[0] - b[0]);
    for (let i = 0; i < m.length; i++) { if (m[i][1] - m[i][0] < 1.15) errors.push('mouth too narrow'); if (i && m[i][0] < m[i - 1][1] + 0.5) errors.push('mouths too close / overlap'); } }
  // flood fill on a 0.25 grid from the spawn
  const step = 0.25, gx0 = -3, gz0 = -14, W = Math.ceil((L.corridorLength + 6) / step), H = Math.ceil(28 / step);
  const seen = new Uint8Array(W * H), stack = [], cx = Math.round((L.playerSpawn[0] - gx0) / step), cz = Math.round((L.playerSpawn[1] - gz0) / step);
  if (!free(L.playerSpawn[0], L.playerSpawn[1])) errors.push('spawn blocked');
  stack.push(cx, cz); seen[cz * W + cx] = 1; let leak = false;
  const cell = new Map();
  const ok = (i, j) => { const k = j * W + i; if (!cell.has(k)) cell.set(k, free(gx0 + i * step, gz0 + j * step)); return cell.get(k); };
  while (stack.length) {
    const j = stack.pop(), i = stack.pop();
    if (i <= 1 || j <= 1 || i >= W - 2 || j >= H - 2) { leak = true; break; }
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, b = j + dj, k = b * W + a; if (!seen[k] && ok(a, b)) { seen[k] = 1; stack.push(a, b); } }
  }
  if (leak) errors.push('walkable area leaks outside the structure');
  const reach = (x, z) => { const i = Math.round((x - gx0) / step), j = Math.round((z - gz0) / step); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if (seen[(j + b) * W + i + a] === 1) return true; return false; };  // the grid is coarse: any flooded neighbour counts
  for (const o of L.objectives) if (!reach(o.approachPoint[0], o.approachPoint[1])) errors.push('paper unreachable ' + o.objectiveId);
  if (!reach(L.exit[0] - 1, 0)) errors.push('exit unreachable');
  // route graph: every node clear, every edge swept clear, papers + exit connected
  L.nav.nodes.forEach(([x, z], i) => { if (!free(x, z)) errors.push('nav node blocked ' + i); });
  for (const [a, b] of L.nav.edges) if (!clearSeg(rects, L.nav.nodes[a][0], L.nav.nodes[a][1], L.nav.nodes[b][0], L.nav.nodes[b][1])) errors.push('nav edge blocked');
  for (const o of L.objectives) if (!routePath(L, L.playerSpawn[0], L.playerSpawn[1], o.approachPoint[0], o.approachPoint[1])) errors.push('no route to ' + o.objectiveId);
  if (!routePath(L, L.playerSpawn[0], L.playerSpawn[1], L.exit[0] - 1, 0)) errors.push('no route to exit');
  // fair spawns: the chaser starts and respawns far (route distance) from the dog
  const fair = (p, q) => pathLength(routePath(L, p[0], p[1], q[0], q[1]));
  if (fair(L.playerSpawn, L.chaserSpawn) < 12) errors.push('chaser spawn too close');
  for (const r of L.recoveryPoints) { if (!free(r[0], r[1])) errors.push('recovery blocked'); if (fair(r, chooseSeat(L, r)) < 10) errors.push('no fair chaser seat for recovery'); }
  return { ok: errors.length === 0, errors };
}

// ---------- generator with bounded retries and a known-good fallback
const FALLBACK = [{ cx: 8, s: 1, m: 1, bFar: 8.5, lFar: 8.5, lw: 6, pw: 2.4 }, { cx: 22, s: -1, m: 1, bFar: 8.5, lFar: 8.5, lw: 6, pw: 2.4 }, { cx: 36, s: 1, m: 1, bFar: 8.5, lFar: 8.5, lw: 6, pw: 2.4 }];
export const MAX_ATTEMPTS = 6;
function drawSpecs(rng, section) {
  const n = 3 + Math.floor(rng() * 3), mirror = rng() < 0.5 ? -1 : 1, specs = [], lastEnd = { 1: -Infinity, '-1': -Infinity };
  let prevCx = -2;
  for (let i = 0; i < n; i++) {
    const s = (i % 2 ? -1 : 1) * mirror * (rng() < 0.2 ? -1 : 1), m = rng() < 0.5 ? 1 : -1;
    const depth = Math.min(1, (section - 1) / 12);          // later sections run a little longer, never beyond the validated bounds
    const p = { s, m, bFar: 6 + rng() * 2.5, lFar: 7 + rng() * 2.5, lw: 5.6 + rng() * 1.0, pw: 1.8 + rng() * 0.6 + depth * 0.0 };
    const lo = p.m > 0 ? -4.4 : -(1.5 + p.lw), hi = p.m > 0 ? 1.5 + p.lw : 4.4;
    let cx = Math.max(prevCx + 6 + rng() * 4, 2.6 - lo + 0.3, lastEnd[s] + 1.0 - lo);
    cx = Math.round(cx * 4) / 4; p.cx = cx; lastEnd[s] = cx + hi + 0.15; prevCx = cx; specs.push(p);
  }
  return specs;
}
export function genEndlessSection(runSeed, section, version = GEN_VERSION) {
  const seed = sectionSeed(runSeed, section), rng = mulberry32(mixSeed(seed, 0x1A70F7));
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const layout = assemble(runSeed, section, version, drawSpecs(rng, section), rng);
    if (validateLayout(layout).ok) return Object.assign(layout, { attempts: attempt, fallback: false });
  }
  return Object.assign(fallbackSection(runSeed, section, version), { attempts: MAX_ATTEMPTS, fallback: true });
}
// the known-good template (three areas, original depths); validated by the test sweep
export const fallbackSection = (runSeed, section = 1, version = GEN_VERSION) => assemble(runSeed, section, version, FALLBACK, mulberry32(sectionSeed(runSeed, section)));

// ---------- chaser: one formula from immutable bases. Zoomies never enters it.
export const chaserSpeed = section => 0.625 * 1.30 * Math.pow(1.03, count(section) < 1 ? 0 : count(section) - 1);

// ---------- counts: finite safe non-negative integers only. No `|0` (it wraps at 2^31), no clamping a bad value into a good one.
export const MAX_STACK = Math.floor(Number.MAX_SAFE_INTEGER / 8);
export const count = v => (typeof v === 'number' && Number.isSafeInteger(v) && v > 0 && v <= MAX_STACK) ? v : 0;

// ---------- traits: ten, unlimited stacks, all active at once. Effects are a pure function of the counts (never accumulated).
export const BASE_QUARTERS = 12, CAPTURE_QUARTERS = 4, BASE_CATCH = 0.88, BASE_GRACE_MS = 600;
const f1 = x => +x.toFixed(1), f2 = x => +x.toFixed(2);
export const PERKS = [
  { id: 'heart', name: 'Extra Heart', line: n => `${(BASE_QUARTERS + n) / 4} hearts max` },
  { id: 'zoomies', name: 'Zoomies', line: n => `+${f1(1.5 * n)}% walking speed` },
  { id: 'wind', name: 'Second Wind', line: n => `${f1(100 * (1 - (0.20 + 0.80 / (1 + 0.04 * n))))}% slower drain, ${3 * n}% faster regain` },
  { id: 'vision', name: 'Paper Vision', line: n => `papers outlined through walls within ${f1(1.5 * n)} units` },
  { id: 'scent', name: 'Scent Trail', line: n => `${n} unit${n === 1 ? '' : 's'} of path to the nearest paper` },
  { id: 'danger', name: 'Stranger Danger', line: n => `pursuer outlined within ${f2(1.25 * n)} units` },
  { id: 'ears', name: 'Big Ears', line: n => `warning range +${f1(0.5 * n)} units, cue x${f2(1 + n / (n + 19))}` },
  { id: 'hackles', name: 'Hackles', line: n => n ? `warns when he is within ${f1(4 + 0.5 * n)} units` : 'off' },
  { id: 'slippery', name: 'Slippery', line: n => `+${Math.round(1500 * n / (n + 39))} ms grace, catch range ${f2(BASE_CATCH * (0.80 + 0.20 / (1 + 0.10 * n)))}` },
  { id: 'quick', name: 'Quick Read', line: n => `reach +${f1(3.75 * n)}%, pickup ${f2(0.50 + 0.50 / (1 + 0.05 * n))}x time` }
];
export const TRAIT_IDS = PERKS.map(p => p.id);
export const perkById = id => PERKS.find(p => p.id === id);
export const emptyTraits = () => Object.fromEntries(TRAIT_IDS.map(id => [id, 0]));
export const cleanTraits = t => { const out = emptyTraits(); if (t && typeof t === 'object') for (const id of TRAIT_IDS) out[id] = count(t[id]); return out; };
// the next real improvement for a card (owned n -> n+1), not the total
export const nextLine = (id, n) => { const p = perkById(id); return n > 0 ? `${p.line(n)}  →  ${p.line(n + 1)}` : p.line(1); };

export function perkEffects(traits) {
  const T = cleanTraits(traits), n = id => T[id];
  return {
    maxQuarters: BASE_QUARTERS + n('heart'), maxHearts: (BASE_QUARTERS + n('heart')) / 4,
    speedMul: 1 + 0.015 * n('zoomies'),
    drainMul: 0.20 + 0.80 / (1 + 0.04 * n('wind')), regainMul: 1 + 0.03 * n('wind'),
    visionRange: 1.5 * n('vision'), scentLen: 1.0 * n('scent'), dangerRange: 1.25 * n('danger'),
    earsRange: 0.5 * n('ears'), earsGain: 1 + n('ears') / (n('ears') + 19),
    hackleRange: n('hackles') ? 4 + 0.5 * n('hackles') : 0,
    graceMs: 1500 * n('slippery') / (n('slippery') + 39), catchRange: BASE_CATCH * (0.80 + 0.20 / (1 + 0.10 * n('slippery'))),
    readReach: 1 + 0.0375 * n('quick'), readTime: 0.50 + 0.50 / (1 + 0.05 * n('quick'))
  };
}

// ---------- run state + offers. A run is a plain object; every function returns a new one.
export const STORE_V = 2, STORE_KEY_V1 = 'corgi-endless-v1';
export const emptyStore = () => ({ v: STORE_V, best: { section: 0, traits: emptyTraits() }, run: null, settings: { sound: true, look: 1 }, legacy: null });
// genVersion = layout generator of the CURRENT section; nextGenVersion = what the next section (and a new run) uses.
export function newRun(seed) {
  return { v: STORE_V, seed: seed >>> 0, genVersion: GEN_VERSION, nextGenVersion: GEN_VERSION, section: 1, status: 'active', quarters: BASE_QUARTERS, traits: emptyTraits(),
    collected: [], papers: 0, offerIdx: 0, pendingOffer: null, picked: [] };
}
export const maxQuarters = run => perkEffects(run.traits).maxQuarters;
const discovered = (run, id) => count(run.traits && run.traits[id]) > 0;
// three distinct traits, deterministic from (seed, offerIdx); while any trait is undiscovered one offered slot is an undiscovered one
export function makeOffer(run, objectiveId, article = 0) {
  const rng = mulberry32(mixSeed(run.seed, 0x0FFE12 + run.offerIdx * 7919)), pool = TRAIT_IDS.slice();
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const fresh = pool.find(id => !discovered(run, id)), picks = pool.filter(id => id !== fresh).slice(0, fresh ? 2 : 3);
  if (fresh) picks.splice(Math.floor(rng() * (picks.length + 1)), 0, fresh);
  return { objectiveId, article, choices: picks.map(perk => ({ perk, kind: discovered(run, perk) ? 'stack' : 'new' })) };
}
// choose one offered trait: records the objective/offer id and exactly one stack in ONE returned run, so a replay or reload cannot add a second
export function pickOffer(run, index, store) {
  const offer = run.pendingOffer, c = offer && offer.choices[index];
  if (!c || !TRAIT_IDS.includes(c.perk)) return { error: 'no such choice' };
  if ((run.picked || []).includes(offer.objectiveId)) return { error: 'already picked' };
  const owned = count(run.traits[c.perk]); if (owned + 1 > MAX_STACK) return { error: 'stack limit' };
  const before = cleanTraits(run.traits), traits = { ...before, [c.perk]: owned + 1 }, max = perkEffects(traits).maxQuarters;
  const quarters = Math.min(max, run.quarters + (c.perk === 'heart' ? 1 : 0));        // +1 quarter only on a committed new Heart stack
  const best = store ? { ...store.best, traits: cleanTraits(store.best.traits) } : null;
  if (best) best.traits[c.perk] = Math.max(best.traits[c.perk], traits[c.perk]);
  const allTen = TRAIT_IDS.every(id => traits[id] > 0) && !TRAIT_IDS.every(id => before[id] > 0);   // true once, on the pick that completes the set
  return { run: { ...run, traits, quarters, pendingOffer: null, picked: [...(run.picked || []), offer.objectiveId] }, best, allTen };
}
// capture: four quarter-hearts; at zero the run ends and run powers clear (bests live in the store)
export function capture(run) {
  const quarters = Math.max(0, run.quarters - CAPTURE_QUARTERS);
  return quarters > 0 ? { ...run, quarters } : { ...run, quarters: 0, status: 'over', traits: emptyTraits(), pendingOffer: null };
}
// accepted exit transition: exactly one new section; the generator queued for the next section becomes current
export function nextSection(run, store) {
  const section = run.section + 1;
  return { run: { ...run, section, collected: [], picked: [], genVersion: run.nextGenVersion || GEN_VERSION, nextGenVersion: GEN_VERSION }, best: store ? { ...store.best, section: Math.max(count(store.best.section), section) } : null };
}

// ---------- storage (tolerant of absence and garbage) + v1 -> v2 migration
// v1 run: {hearts, slots:[{id,rank}|null x2], pendingOffer:{choices:[{perk,kind}]}, pendingMilestone, ms}; v1 best: {section, perks:{id:rank}}.
// Each old rank becomes four stacks (old additive investments were four times the new ones). Health becomes quarters, clamped to the computed max, no bonus heal.
const RANK_TO_STACKS = 4;
const cleanSettings = s => ({ sound: !s || s.sound !== false, look: Math.min(2, Math.max(0.5, Number(s && s.look) || 1)) });
const cleanOffer = (po, run) => {
  if (!po || typeof po.objectiveId !== 'string' || !Array.isArray(po.choices)) return null;
  const ids = [...new Set(po.choices.map(c => c && c.perk).filter(id => TRAIT_IDS.includes(id)))].slice(0, 3);
  for (const c of makeOffer(run, po.objectiveId).choices) if (ids.length < 3 && !ids.includes(c.perk)) ids.push(c.perk);   // an old offer with fewer than three usable items is topped up
  return { objectiveId: po.objectiveId, article: count(po.article), choices: ids.map(perk => ({ perk, kind: discovered(run, perk) ? 'stack' : 'new' })) };
};
export function migrateV1(raw) {
  const out = emptyStore(); out.legacy = raw;                                  // the whole v1 record is kept under `legacy`
  const b = raw.best || {};
  out.best.section = count(b.section);
  for (const id of TRAIT_IDS) out.best.traits[id] = Math.min(MAX_STACK, count(b.perks && b.perks[id]) * RANK_TO_STACKS);
  out.settings = cleanSettings(raw.settings);
  const r = raw.run;
  if (r && r.v === 1 && Number.isSafeInteger(r.seed)) {
    const traits = emptyTraits();
    for (const s of Array.isArray(r.slots) ? r.slots : []) if (s && TRAIT_IDS.includes(s.id)) traits[s.id] = Math.min(5, count(s.rank)) * RANK_TO_STACKS;
    const max = perkEffects(traits).maxQuarters, over = r.status === 'over';
    const run = { v: STORE_V, seed: r.seed >>> 0, genVersion: r.genVersion === 1 ? 1 : GEN_VERSION, nextGenVersion: GEN_VERSION, section: Math.max(1, count(r.section)), status: over ? 'over' : 'active',
      quarters: over ? 0 : Math.min(max, Math.max(1, count(r.hearts) * CAPTURE_QUARTERS)), traits, collected: Array.isArray(r.collected) ? r.collected.slice(0, 64) : [],
      papers: count(r.papers), offerIdx: count(r.offerIdx), pendingOffer: null, picked: [] };
    if (!over) run.pendingOffer = cleanOffer(r.pendingOffer, run);             // pendingMilestone / ms (rank-5, full-clear) are dropped: they commit nothing and duplicate no paper
    out.run = run;
  }
  return out;
}
function cleanRun(r) {
  if (!r || r.v !== STORE_V || !Number.isSafeInteger(r.seed)) return null;
  const traits = cleanTraits(r.traits), max = perkEffects(traits).maxQuarters, over = r.status === 'over';
  const run = { v: STORE_V, seed: r.seed >>> 0, genVersion: r.genVersion === 1 ? 1 : GEN_VERSION, nextGenVersion: GEN_VERSION, section: Math.max(1, count(r.section)), status: over ? 'over' : 'active',
    quarters: over ? 0 : Math.min(max, Math.max(1, count(r.quarters))), traits, collected: Array.isArray(r.collected) ? r.collected.slice(0, 64) : [], papers: count(r.papers), offerIdx: count(r.offerIdx),
    pendingOffer: null, picked: Array.isArray(r.picked) ? r.picked.filter(x => typeof x === 'string').slice(0, 8) : [] };
  if (!over) run.pendingOffer = cleanOffer(r.pendingOffer, run);
  return run;
}
// v2 first; otherwise a v1 record is migrated (the v1 key is never overwritten, so a rollback still finds its save)
export function loadStore(storage) {
  try {
    const raw2 = JSON.parse(storage.getItem(STORE_KEY) || 'null');
    if (raw2 && raw2.v === STORE_V) return { v: STORE_V, best: { section: count(raw2.best && raw2.best.section), traits: cleanTraits(raw2.best && raw2.best.traits) }, run: cleanRun(raw2.run), settings: cleanSettings(raw2.settings), legacy: raw2.legacy || null };
    const raw1 = JSON.parse(storage.getItem(STORE_KEY_V1) || 'null');
    return raw1 && raw1.v === 1 ? migrateV1(raw1) : emptyStore();
  } catch { return emptyStore(); }
}
export function saveStore(storage, store) {
  try { storage.setItem(STORE_KEY, JSON.stringify(store)); storage.setItem('corgi-endless-best-v1', String(count(store.best.section))); } catch { /* storage may be blocked */ }
}
