// Sparkle filters its shader children, not the DOM beneath its canvas. These small
// ornaments supply their own bright Star art; rewards, tiles and text stay intact.
// Verified against shader-effects-inc/shaders packages/core/src/shaders/{Sparkle,Star}.
const TIER_COLORS = Object.freeze({
  uncommon: '#76e356', rare: '#4bafff', legendary: '#ff9c36', secret: '#b388ff',
});

const tierColor = host => TIER_COLORS[host?.closest?.('[data-tier]')?.dataset?.tier] || '#ffe39a';
const hasUnlock = host => [...(host?.querySelectorAll?.('strong') || [])]
  .some(item => / unlocked!$/.test(item.textContent || ''));
const openedDialog = (host, selector) => host?.closest?.(selector)?.open === true;

function ornament(color, seed = 0) {
  return [{
    type: 'Sparkle',
    id: 'reward-sparkle',
    props: {
      size: 16, intensity: 2.2, threshold: .45, expand: 0,
      rayLength: 2, colorize: .65, speed: .65, seed,
    },
    children: [{
      type: 'Star', id: 'reward-sparkle-art',
      props: {color, center: {x: .5, y: .5}, radius: .42, sides: 4, innerRatio: .18},
    }],
  }];
}

const cornerStyle = Object.freeze({
  position: 'absolute', inset: 'auto', top: '12px', right: '12px',
  width: '56px', height: '56px', pointerEvents: 'none', zIndex: '1',
});

// The shared manager owns visibility, camera/reduced-motion guards, GPU setup,
// timeouts and cleanup. These descriptors never grant, clear or persist rewards.
export const sparkleTargets = [
  {
    selector: '.drop-pod[data-phase="reveal"] .drop-pod-card',
    name: 'sparkle', priority: 50, opacity: .6, durationMs: 2200,
    style: {...cornerStyle, top: '4px', right: '4px',width:'40px',height:'40px'},
    active: host => openedDialog(host, '.drop-pod') &&
      host.closest('.drop-pod').dataset?.phase === 'reveal' && hasUnlock(host),
    components: host => ornament(tierColor(host)),
  },
  {
    // A canvas cannot visibly host another canvas. Mount in the surrounding card
    // and put the ornament beside the existing 2D reward tile instead.
    selector: '.reward-pack-dialog.opened .reward-pack-card',
    name: 'sparkle', priority: 50, opacity: .6, durationMs: 2200,
    style: {...cornerStyle, top: '84px'},
    active: host => openedDialog(host, '.reward-pack-dialog.opened') &&
      !host.ownerDocument?.querySelector?.('.drop-pod[open]') &&
      hasUnlock(host.querySelector?.('.reward-pack-result')),
    components: host => ornament(tierColor(host), 1),
  },
  {
    selector: '.creature-skin-reward',
    name: 'sparkle', priority: 50, opacity: .6, durationMs: 2200,
    style: {...cornerStyle, top: '-16px', right: '-8px', width: '44px', height: '44px'},
    active: host => !!host?.querySelector?.('li'),
    components: () => ornament('#ffe39a', 2),
  },
  {
    selector: '.dj .logobar',
    name: 'sparkle', priority: 50, opacity: .6, durationMs: 2200,
    style: {...cornerStyle, top: '15%', left: '4%', right: 'auto', width: '80px', height: '80px'},
    active: host => !!host?.querySelector?.('img'),
    components: () => ornament('#fff4bd', 3),
  },
];

// Existing .lcd-card.done nodes do not identify a newly banked unlock. A future
// transition signal can opt them in without replaying old saved achievements.
