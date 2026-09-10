export const REGIONS = [
  { id: 'nails', label: 'Nails', short: 'Nails', description: 'Five claw and nail forms' },
  { id: 'fingertips', label: 'Finger tips', short: 'Tips', description: 'Distal pads and final phalanges' },
  { id: 'fingers', label: 'Fingers & knuckles', short: 'Fingers', description: 'Joined finger shafts, bases and knuckles' },
  { id: 'palm', label: 'Palm', short: 'Palm', description: 'The inner hand surface' },
  { id: 'back_of_hand', label: 'Back of hand', short: 'Back', description: 'The dorsal hand surface' },
  { id: 'wrist', label: 'Wrist', short: 'Wrist', description: 'Stump, cuff and transition' },
] as const;

export type RegionId = (typeof REGIONS)[number]['id'];

export type StyleFamily = {
  id: number;
  name: string;
  realm: string;
  primary: string;
  secondary: string;
  accent: string;
  emissive: string;
  roughness: number;
  metalness: number;
  detail: 'clean' | 'vine' | 'caps' | 'plates' | 'scales' | 'spines' | 'coral' | 'bone' | 'mist' | 'flame' | 'halo' | 'void' | 'eyes' | 'rock' | 'crystal' | 'magma' | 'ice' | 'storm' | 'gears' | 'neon';
};

export const STYLES: StyleFamily[] = [
  { id: 0, name: 'Mortal', realm: 'Baseline · Earth', primary: '#b9856f', secondary: '#714c42', accent: '#f0c0a3', emissive: '#000000', roughness: 0.72, metalness: 0.02, detail: 'clean' },
  { id: 1, name: 'Verdant', realm: 'Wildroot · Dimension 12', primary: '#3f7448', secondary: '#1e3b2b', accent: '#b8dd6e', emissive: '#172d13', roughness: 0.88, metalness: 0, detail: 'vine' },
  { id: 2, name: 'Mycelial', realm: 'Sporesea · Dimension 09', primary: '#d5c7ae', secondary: '#776b82', accent: '#f59ec4', emissive: '#6d234a', roughness: 0.92, metalness: 0, detail: 'caps' },
  { id: 3, name: 'Chitin', realm: 'Carapace · Dimension 31', primary: '#4f263d', secondary: '#180f20', accent: '#d17663', emissive: '#240716', roughness: 0.3, metalness: 0.28, detail: 'plates' },
  { id: 4, name: 'Reptilian', realm: 'Scalehold · Dimension 04', primary: '#5f7a3f', secondary: '#283621', accent: '#cfb85c', emissive: '#101c08', roughness: 0.76, metalness: 0.04, detail: 'scales' },
  { id: 5, name: 'Abyssal', realm: 'Deep Trench · Dimension 88', primary: '#132a42', secondary: '#06111f', accent: '#4edfd3', emissive: '#0b756f', roughness: 0.34, metalness: 0.12, detail: 'spines' },
  { id: 6, name: 'Coral', realm: 'Living Reef · Dimension 22', primary: '#e46867', secondary: '#70344c', accent: '#ffd27a', emissive: '#8b2438', roughness: 0.83, metalness: 0, detail: 'coral' },
  { id: 7, name: 'Skeletal', realm: 'Ossuary · Dimension 00', primary: '#d8d0af', secondary: '#80785f', accent: '#fff7d1', emissive: '#17160e', roughness: 0.9, metalness: 0, detail: 'bone' },
  { id: 8, name: 'Spectral', realm: 'Veil · Dimension 13', primary: '#8ed9cd', secondary: '#294c58', accent: '#d5fff8', emissive: '#248e86', roughness: 0.18, metalness: 0.04, detail: 'mist' },
  { id: 9, name: 'Infernal', realm: 'Cinder Court · Dimension 66', primary: '#7b211e', secondary: '#260b0a', accent: '#ff8a2a', emissive: '#d33812', roughness: 0.58, metalness: 0.1, detail: 'flame' },
  { id: 10, name: 'Celestial', realm: 'High Orbit · Dimension 07', primary: '#e6dca4', secondary: '#786da7', accent: '#fffbd7', emissive: '#8d74d6', roughness: 0.24, metalness: 0.5, detail: 'halo' },
  { id: 11, name: 'Voidborn', realm: 'Null Expanse · Dimension ∅', primary: '#16101f', secondary: '#060409', accent: '#9f64ff', emissive: '#482285', roughness: 0.16, metalness: 0.36, detail: 'void' },
  { id: 12, name: 'Eldritch', realm: 'Watcher Fold · Dimension 47', primary: '#6b426c', secondary: '#252038', accent: '#b6ef63', emissive: '#4e7628', roughness: 0.64, metalness: 0.04, detail: 'eyes' },
  { id: 13, name: 'Stone Golem', realm: 'Deep Strata · Dimension 19', primary: '#6f7068', secondary: '#393b37', accent: '#b7a37d', emissive: '#171811', roughness: 0.98, metalness: 0, detail: 'rock' },
  { id: 14, name: 'Crystal', realm: 'Prism Vault · Dimension 52', primary: '#896bc2', secondary: '#302e66', accent: '#e0c8ff', emissive: '#5a3da8', roughness: 0.12, metalness: 0.3, detail: 'crystal' },
  { id: 15, name: 'Magma', realm: 'Mantle · Dimension 03', primary: '#4a1713', secondary: '#140706', accent: '#ffb22f', emissive: '#e44712', roughness: 0.78, metalness: 0.06, detail: 'magma' },
  { id: 16, name: 'Glacial', realm: 'White Silence · Dimension 71', primary: '#93c9df', secondary: '#315a76', accent: '#ebfdff', emissive: '#3c93bb', roughness: 0.2, metalness: 0.14, detail: 'ice' },
  { id: 17, name: 'Stormcharged', realm: 'Tempest Ring · Dimension 28', primary: '#48536e', secondary: '#1a2236', accent: '#c3f7ff', emissive: '#3ebde0', roughness: 0.4, metalness: 0.32, detail: 'storm' },
  { id: 18, name: 'Clockwork', realm: 'Brass Meridian · Dimension 14', primary: '#9a6a37', secondary: '#33251d', accent: '#efd08c', emissive: '#5b2c12', roughness: 0.32, metalness: 0.82, detail: 'gears' },
  { id: 19, name: 'Neon Synth', realm: 'Aftergrid · Dimension 20', primary: '#251d54', secondary: '#0b0921', accent: '#ff5bd7', emissive: '#b519ac', roughness: 0.22, metalness: 0.55, detail: 'neon' },
];

export const DEFAULT_SELECTION: Record<RegionId, number> = {
  nails: 14,
  fingertips: 5,
  fingers: 12,
  palm: 11,
  back_of_hand: 17,
  wrist: 18,
};

export const PURE_PRESETS = STYLES.map((style) => ({
  name: style.name,
  description: `A pure ${style.name.toLowerCase()} hand`,
  values: Object.fromEntries(REGIONS.map((region) => [region.id, style.id])) as Record<RegionId, number>,
}));
