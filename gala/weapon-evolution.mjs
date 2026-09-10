// Presentation and ability proposals. Saved weapon IDs and earned requirements
// remain owned by GalaWeapons; this module does not award workout progress.
const definitions = [
  ['rapier', 'cut', 186, 8, ['Crescent cut', 'Twin crescent', 'Sky sever', 'Rift ballet', 'Horizon split']],
  ['greatsword', 'cleave', 215, 12, ['Heavy arc', 'Fault line', 'Meteor cleave', 'World breaker', 'Heaven fall']],
  ['dagger', 'blink', 284, 6, ['Phase step', 'Double take', 'Ghost rush', 'Afterimage storm', 'Zero moment']],
  ['sabre', 'arc', 191, 7, ['Arc shot', 'Ricochet', 'Chain flash', 'Lightning fan', 'Thunder crown']],
  ['axe', 'burst', 153, 9, ['Pulse burst', 'Split volley', 'Crossfire', 'Aurora barrage', 'Infinite salvo']],
  ['hammer', 'rail', 210, 14, ['Rail shot', 'Twin rail', 'Ion tunnel', 'Orbital piercer', 'Skyline erase']],
  ['mace', 'chain', 271, 10, ['Coil lash', 'Forked current', 'Tesla web', 'Storm cage', 'Living lightning']],
  ['flail', 'drone', 164, 10, ['Drone dive', 'Twin dive', 'Hunter spiral', 'Satellite rush', 'Constellation fall']],
  ['spear', 'lance', 182, 9, ['Lance thrust', 'Triple pierce', 'Comet lance', 'Starfall spear', 'Event horizon']],
  ['trident', 'fork', 233, 11, ['Tri-beam', 'Prism fork', 'Ninefold light', 'Sky lattice', 'Prism cathedral']],
  ['halberd', 'rockets', 22, 14, ['Rocket salvo', 'Cluster bloom', 'Meteor rain', 'Orbital garden', 'Supernova parade']],
  ['scythe', 'reap', 292, 12, ['Gravity sweep', 'Twin moon', 'Orbit harvest', 'Rift scythe', 'Eclipse reaper']],
  ['bow', 'arrow', 168, 10, ['Photon arrow', 'Split star', 'Comet rain', 'Heaven string', 'Constellation arrow']],
  ['crossbow', 'gauss', 216, 11, ['Gauss bolt', 'Capacitor burst', 'Prism bolt', 'Warp volley', 'Luminous spearhead']],
  ['chakram', 'return', 308, 8, ['Orbit throw', 'Twin orbit', 'Solar wheel', 'Rift carousel', 'Galaxy return']],
  ['gauntlets', 'rush', 25, 7, ['Power rush', 'Twin impact', 'Meteor fists', 'Dragon engine', 'Thousand suns']],
  ['staff', 'gravity', 259, 14, ['Gravity well', 'Twin wells', 'Orbit crush', 'Singularity', 'Pocket universe']],
  ['wand', 'sonic', 179, 9, ['Sonic ring', 'Triple echo', 'Resonance wall', 'Aurora wave', 'Universe echo']],
  ['tome', 'swarm', 147, 12, ['Nanite rush', 'Split hive', 'Prism swarm', 'Astral flock', 'Living constellation']],
  ['cannon', 'plasma', 320, 16, ['Plasma bloom', 'Twin reactor', 'Solar lance', 'Supernova', 'Impossible sun']],
];

export const ABILITY_TIERS = Object.freeze([4, 8, 12, 16, 20]);
export const WEAPON_FAMILIES = Object.freeze(Object.fromEntries(definitions.map(
  ([id, motion, hue, cooldown, moves]) => [id, Object.freeze({id, motion, hue, cooldown, moves: Object.freeze(moves)})],
)));
export const MAX_COOLDOWN_MS = 40_000;

export function normalizeWeapon(value) {
  if (!value || !Object.hasOwn(WEAPON_FAMILIES, value.type) ||
      !Number.isInteger(value.tier) || value.tier < 0 || value.tier > 20) {
    throw new Error('Unknown weapon or tier.');
  }
  return {type: value.type, tier: value.tier};
}

export function evolution(value) {
  const weapon = normalizeWeapon(value), family = WEAPON_FAMILIES[weapon.type];
  const t = weapon.tier, stage = Math.floor(t / 4), fraction = t / 20;
  // Every adjacent tier changes hue, proportions, and footprint. Milestones
  // add silhouettes/choreography without resetting the smaller tier gains.
  const hue = (family.hue + t * 4.7) % 360;
  return {
    ...weapon, family, stage, fraction,
    energy: `hsl(${hue.toFixed(1)} 96% ${62 + fraction * 17}%)`,
    accent: `hsl(${(hue + 55) % 360} 100% ${70 + fraction * 12}%)`,
    shell: `hsl(${(family.hue + t * 2) % 360} ${18 + fraction * 24}% ${35 + fraction * 42}%)`,
    core: '#f4fbff',
    width: 1 + t * .023,
    length: 1 + t * .031,
    reach: 35 + t * 2.8,
    trailCount: 1 + Math.floor(t / 3),
    particleCount: 3 + t * 2,
    orbitCount: stage,
    finLength: 2 + t * .65,
    idleLift: 1.5 + t * .12,
    attackMs: Math.max(350, 680 - t * 11),
    ability: abilityFor(weapon),
  };
}

export function abilityFor(value) {
  const weapon = normalizeWeapon(value), family = WEAPON_FAMILIES[weapon.type];
  if (weapon.tier < ABILITY_TIERS[0]) return null;
  const rank = ABILITY_TIERS.filter(tier => weapon.tier >= tier).length;
  return Object.freeze({
    id: `${weapon.type}:${rank}`,
    family: weapon.type,
    name: family.moves[rank - 1],
    rank,
    unlockTier: ABILITY_TIERS[rank - 1],
    cooldownMs: (family.cooldown + (rank - 1) * 2) * 1000,
    animationMs: 1000 + rank * 180,
    damageMultiplier: 2 + rank,
    motion: family.motion,
  });
}

// One shared special gauge: changing the family/tier or re-entering rest cannot
// reset its timer. The arena owns persistence, and the gallery uses a separate
// instance. Clamping time prevents a clock rollback from shortening a cooldown.
export class AbilityCooldown {
  constructor(saved = null, now = Date.now()) {
    if (!Number.isFinite(now) || now < 0) throw new Error('Invalid cooldown clock.');
    if (typeof saved === 'string') { try { saved = JSON.parse(saved); } catch { saved = null; } }
    this.lastNow = now;
    this.readyAt = now;
    this.durationMs = 0;
    if (saved?.version === 1 && Number.isFinite(saved.readyAt)) {
      this.readyAt = Math.max(now, Math.min(now + MAX_COOLDOWN_MS, saved.readyAt));
      this.durationMs = Math.max(this.readyAt - now, Math.min(MAX_COOLDOWN_MS, Number(saved.durationMs) || 0));
    }
  }

  clock(now) {
    if (!Number.isFinite(now) || now < 0) throw new Error('Invalid cooldown clock.');
    this.lastNow = Math.max(this.lastNow, now);
    return this.lastNow;
  }

  remaining(now = Date.now()) {
    return Math.max(0, this.readyAt - this.clock(now));
  }

  activate(value, {now = Date.now(), progress, inRest = false, catalog = globalThis.GalaWeapons} = {}) {
    const weapon = normalizeWeapon(value), ability = abilityFor(weapon), at = this.clock(now);
    if (!inRest) return {ok: false, reason: 'not-rest'};
    if (!ability) return {ok: false, reason: 'tier', unlockTier: ABILITY_TIERS[0]};
    if (!progress || !catalog?.unlocked(weapon, progress)) return {ok: false, reason: 'locked'};
    const remainingMs = this.remaining(at);
    if (remainingMs > 0) return {ok: false, reason: 'cooldown', remainingMs};
    this.readyAt = at + ability.cooldownMs;
    this.durationMs = ability.cooldownMs;
    return {ok: true, ability, readyAt: this.readyAt};
  }

  snapshot() { return {version: 1, readyAt: this.readyAt, durationMs: this.durationMs}; }
  merge(saved,now=Date.now()) { const incoming=new AbilityCooldown(saved,this.clock(now));if(incoming.readyAt>this.readyAt){this.readyAt=incoming.readyAt;this.durationMs=incoming.durationMs;}return this.remaining(now); }
}
