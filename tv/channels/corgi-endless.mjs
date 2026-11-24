// Cortisol Corgi Endless: pure rules (no DOM, no three.js) so node can sweep them.
// Layout vocabulary is the existing school's: a main corridor along +x (z in +-1.2 clear), and per area one
// dead-end branch plus one two-mouth loop around a solid pillar (same topology as corgi.js genArea),
// parameterised in depth/width/side/mirror. Decoration randomness is NOT drawn here (see decorSeed).

export const GEN_VERSION = 1;
export const STORE_KEY = 'corgi-endless-v1';
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
    objectives, anchors: mainAnchors, nav: { nodes, edges }, decorSeed: mixSeed(sectionSeed(runSeed, section), 0xDEC0), dark: section % 2 === 0
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

// ---------- chaser: 25% of base walking speed at section 1 up to a 60% cap at section 10
export const chaserSpeed = section => BASE_SPEED * (0.25 + 0.35 * Math.min(1, Math.max(0, (section - 1) / 9)));

// ---------- perks: ten, two equip slots, ranks 1..5. Effects are a pure function of the slots (never accumulated).
export const MAX_RANK = 5;
export const PERKS = [
  { id: 'heart', name: 'Extra Heart', line: L => `+${L} maximum heart${L > 1 ? 's' : ''}` },
  { id: 'zoomies', name: 'Zoomies', line: L => `+${6 * L}% walking speed` },
  { id: 'wind', name: 'Second Wind', line: L => `${12 * L}% slower drain, ${12 * L}% faster regain` },
  { id: 'vision', name: 'Paper Vision', line: L => `outline papers through walls within ${6 * L} units` },
  { id: 'scent', name: 'Scent Trail', line: L => `show ${4 * L} units of path to the nearest paper` },
  { id: 'danger', name: 'Stranger Danger', line: L => `outline the pursuer through walls within ${5 * L} units` },
  { id: 'ears', name: 'Big Ears', line: L => `warning range +${2 * L} units, louder cue` },
  { id: 'hackles', name: 'Hackles', line: L => `warn when he is within ${4 + 2 * L} units` },
  { id: 'slippery', name: 'Slippery', line: L => `+${150 * L} ms grace, catch range ${(1.1 - 0.1 * L).toFixed(1)}` },
  { id: 'quick', name: 'Quick Read', line: L => `reach +${15 * L}%, faster pickup` }
];
export const perkById = id => PERKS.find(p => p.id === id);
export const BASE_HEARTS = 3, BASE_CATCH = 1.1, BASE_GRACE_MS = 600;
export function perkEffects(slots) {
  const rank = id => { const s = (slots || []).find(x => x && x.id === id); return s ? Math.min(MAX_RANK, Math.max(0, s.rank | 0)) : 0; };
  const L = id => rank(id);
  return {
    maxHearts: BASE_HEARTS + L('heart'), speedMul: 1 + 0.06 * L('zoomies'), drainMul: 1 - 0.12 * L('wind'), regainMul: 1 + 0.12 * L('wind'),
    visionRange: 6 * L('vision'), scentLen: 4 * L('scent'), dangerRange: 5 * L('danger'),
    earsRange: 2 * L('ears'), earsGain: Math.min(2, 1 + 0.2 * L('ears')), hackleRange: L('hackles') ? 4 + 2 * L('hackles') : 0,
    graceMs: 150 * L('slippery'), catchRange: BASE_CATCH - 0.1 * L('slippery'), readReach: 1 + 0.15 * L('quick'), readTime: Math.max(0.5, 1 - 0.1 * L('quick'))
  };
}

// ---------- run state + offers. A run is a plain object; every function returns a new one.
export const emptyStore = () => ({ v: 1, best: { section: 0, perks: {} }, run: null, settings: { sound: true, look: 1 } });
export function newRun(seed) {
  return { v: 1, seed: seed >>> 0, genVersion: GEN_VERSION, section: 1, status: 'active', hearts: BASE_HEARTS, slots: [null, null],
    collected: [], papers: 0, offerIdx: 0, pendingOffer: null, pendingMilestone: null, ms: { first: false, full: false } };
}
export function makeOffer(run, objectiveId, article = 0) {
  const rng = mulberry32(mixSeed(run.seed, 0x0FFE12 + run.offerIdx * 7919));
  const pool = PERKS.flatMap(p => { const eq = run.slots.find(s => s && s.id === p.id); return eq ? (eq.rank < MAX_RANK ? [{ perk: p.id, kind: 'upgrade' }] : []) : [{ perk: p.id, kind: 'new' }]; });
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return { objectiveId, article, choices: pool.slice(0, 3) };
}
// choice index, plus which slot (0|1) to overwrite when a new perk arrives with both slots full
export function pickOffer(run, index, replaceSlot, store) {
  const offer = run.pendingOffer, c = offer && offer.choices[index];
  if (!c) return { error: 'no such choice' };
  const slots = run.slots.map(s => s && { ...s }), eq = slots.findIndex(s => s && s.id === c.perk);
  if (c.kind === 'upgrade') { if (eq < 0 || slots[eq].rank >= MAX_RANK) return { error: 'cannot upgrade' }; slots[eq].rank += 1; }
  else {
    if (eq >= 0) return { error: 'already equipped' };
    let at = slots.findIndex(s => !s);
    if (at < 0) { if (replaceSlot !== 0 && replaceSlot !== 1) return { error: 'choose a slot to replace' }; at = replaceSlot; }
    slots[at] = { id: c.perk, rank: 1 };
  }
  return commit(run, slots, store);
}
export function keepBuild(run) { return { ...run, pendingOffer: null }; }
function commit(run, slots, store) {
  const oldMax = perkEffects(run.slots).maxHearts, newMax = perkEffects(slots).maxHearts;
  let hearts = run.hearts + Math.max(0, newMax - oldMax); hearts = Math.min(hearts, newMax);        // reward only on commit; replacement clamps
  const ms = { ...run.ms }; let pendingMilestone = null;
  const maxed = slots.filter(s => s && s.rank === MAX_RANK).length;
  if (maxed >= 1 && !ms.first) { ms.first = true; pendingMilestone = 'first'; }
  if (maxed >= 2 && !ms.full) { ms.full = true; pendingMilestone = 'full'; }
  const best = store ? { ...store.best, perks: { ...store.best.perks } } : null;
  if (best) for (const s of slots) if (s) best.perks[s.id] = Math.max(best.perks[s.id] || 0, s.rank);
  return { run: { ...run, slots, hearts, ms, pendingOffer: null, pendingMilestone }, best };
}
// capture: lose one heart; the last one ends the run and clears run powers (bests live in the store)
export function loseHeart(run) {
  const hearts = run.hearts - 1;
  return hearts > 0 ? { ...run, hearts } : { ...run, hearts: 0, status: 'over', slots: [null, null], pendingOffer: null, pendingMilestone: null };
}
// accepted exit transition: exactly one new section
export function nextSection(run, store) {
  const section = run.section + 1;
  return { run: { ...run, section, collected: [] }, best: store ? { ...store.best, section: Math.max(store.best.section, section) } : null };
}

// ---------- storage (tolerant of absence and garbage)
export function loadStore(storage) {
  try {
    const raw = JSON.parse(storage.getItem(STORE_KEY) || 'null'); const base = emptyStore();
    if (!raw || raw.v !== 1) return base;
    return { v: 1, best: { section: raw.best?.section | 0, perks: { ...(raw.best?.perks || {}) } }, run: raw.run && raw.run.v === 1 ? raw.run : null,
      settings: { sound: raw.settings?.sound !== false, look: Math.min(2, Math.max(0.5, Number(raw.settings?.look) || 1)) } };
  } catch { return emptyStore(); }
}
export function saveStore(storage, store) {
  try { storage.setItem(STORE_KEY, JSON.stringify(store)); storage.setItem('corgi-endless-best-v1', String(store.best.section | 0)); } catch { /* storage may be blocked */ }
}
