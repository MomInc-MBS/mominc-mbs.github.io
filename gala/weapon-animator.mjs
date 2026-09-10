import {evolution} from './weapon-evolution.mjs';

const TAU = Math.PI * 2;
const clamp = value => Math.max(0, Math.min(1, value));
const point = (x, y) => [Math.round(x), Math.round(y)];

function polygon(ctx, vertices, color, alpha = 1) {
  ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = color; ctx.beginPath();
  vertices.forEach(([x, y], i) => i ? ctx.lineTo(Math.round(x), Math.round(y)) : ctx.moveTo(Math.round(x), Math.round(y)));
  ctx.closePath(); ctx.fill(); ctx.restore();
}
function line(ctx, vertices, color, width = 2, alpha = 1) {
  ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = 'miter'; ctx.beginPath();
  vertices.forEach(([x, y], i) => i ? ctx.lineTo(Math.round(x), Math.round(y)) : ctx.moveTo(Math.round(x), Math.round(y)));
  ctx.stroke(); ctx.restore();
}
function arc(ctx, x, y, radius, from, to, color, width = 2, alpha = 1) {
  const count = Math.max(5, Math.ceil(Math.abs(to - from) * 5));
  line(ctx, Array.from({length: count + 1}, (_, i) => point(x + Math.cos(from + (to - from) * i / count) * radius, y + Math.sin(from + (to - from) * i / count) * radius)), color, width, alpha);
}
function diamond(ctx, x, y, size, color, alpha = 1) {
  polygon(ctx, [[x, y-size], [x+size, y], [x, y+size], [x-size, y]], color, alpha);
}

// Renders within the caller's canvas/transform. All timing is caller supplied;
// no timers, event listeners, storage, or workout state live in the renderer.
export function drawAnimatedWeapon(ctx, value, {
  weapons = globalThis.GalaWeapons,
  x = 90, y = 90, scale = 1, now = 0, action = null, reducedMotion = false,
} = {}) {
  const p = evolution(value);
  const duration = action?.special && p.ability ? p.ability.animationMs : p.attackMs;
  const age = action ? (now - action.startedAt) / duration : -1;
  const active = age >= 0 && age < 1;
  const a = clamp(age), special = active && action.special && !!p.ability;
  const pulse = active ? Math.sin(a * Math.PI) : 0;
  const windup = active ? Math.sin(clamp(a / .23) * Math.PI / 2) : 0;
  const power = (special ? 1.5 + p.stage * .11 : 1) * pulse;
  const motion = p.family.motion;
  const t = reducedMotion ? 0 : now / 1000;
  const float = reducedMotion ? 0 : Math.sin(t * 1.7) * p.idleLift;
  const reach = p.reach * (special ? 1.25 : 1);
  const extent = special ? p.stage + 2 : 1;
  const ranged = ['rail','lance','fork','rockets','arrow','gauss','burst'].includes(motion);
  const horizontal = ['arc','plasma','sonic'].includes(motion);
  let dx = 0, dy = float, rotation = ranged ? Math.PI / 2 : horizontal ? 0 : -.14;
  if (active && !reducedMotion) {
    if (motion === 'cut' || motion === 'reap') rotation += -1.15 + a * 2.9;
    else if (motion === 'cleave') { rotation += -1.25 + a * 2.7; dy -= windup * 12 * (1 - a); }
    else if (motion === 'blink') { dx = Math.sin(a * Math.PI) * reach; rotation += Math.sin(a * TAU) * .65; }
    else if (motion === 'return') { dx = Math.sin(a * Math.PI) * reach; dy -= Math.sin(a * TAU) * 14; rotation += a * TAU * (2 + p.stage); }
    else if (motion === 'rush') { dx = Math.sin(a * Math.PI) * 16; rotation = Math.sin(a * TAU * extent) * .45; }
    else if (ranged || horizontal) { dx -= power * 7; rotation -= pulse * .09; }
    else { dy -= power * 12; rotation += Math.sin(a * TAU) * .2; }
  }

  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(scale, scale); ctx.imageSmoothingEnabled = false;
  // Slow orbiting hardware remains legible in idle and reduced-motion mode.
  for (let k = 0; k < p.orbitCount; k++) {
    const theta = t * .7 + k * TAU / p.orbitCount;
    diamond(ctx, Math.cos(theta) * (24 + p.tier), Math.sin(theta) * (23 + p.tier * .4), 2 + p.stage * .35, p.energy, .5);
  }
  if (p.tier >= 12) arc(ctx, 0, 0, 24 + p.tier, -.7 + t * .12, 2.9 + t * .12, p.accent, 1, .22);

  if (active && !reducedMotion) {
    // Charge converges into the weapon before release. Advanced tiers add
    // stepped afterimages, without large white flashes or camera shake.
    if (a < .26) {
      for (let k = 0; k < p.trailCount; k++) {
        const theta = k * TAU / p.trailCount + t;
        const r = (1 - a / .26) * (reach * .6) + 8;
        diamond(ctx, Math.cos(theta) * r, Math.sin(theta) * r, 2, p.accent, .65);
      }
    }
    for (let k = p.trailCount; k > 0; k--) {
      if (motion === 'blink' || motion === 'rush' || motion === 'return') {
        ctx.save(); ctx.globalAlpha = .06 + .08 * (1 - k / (p.trailCount + 1));
        ctx.translate(dx - k * (special ? 9 : 5), dy); ctx.rotate(rotation);
        weapons.draw(ctx, value, {x: -20, y: -40, palette: p}); ctx.restore();
      }
    }
  }

  // Additional geometry follows the defining family rather than applying a
  // single generic decoration to every weapon. Proportions grow each tier.
  ctx.save(); ctx.translate(Math.round(dx), Math.round(dy)); ctx.rotate(rotation);
  ctx.scale(p.width * .8, p.length * .8);
  weapons.draw(ctx, value, {x: -20, y: -40, palette: p});
  if (p.tier > 0) {
    const fin = p.finLength, count = 1 + p.stage;
    if (['cut','cleave','blink','lance','fork','reap'].includes(motion)) {
      for (const side of [-1, 1]) polygon(ctx, [[side*5,-8],[side*(7+fin*.32),-24-fin],[side*3,-29-fin],[side*3,-8]], p.accent, .65);
    } else if (ranged || horizontal) {
      for (let k = 0; k < count; k++) {
        const yy = horizontal ? -15 : -25 - k * 3;
        polygon(ctx, [[-13,yy],[-13-fin*.45,yy-4],[-13-fin*.45,yy+6],[-11,yy+4]], p.energy, .75);
      }
    } else if (motion === 'return') {
      for (let k = 0; k < 3 + p.stage; k++) {
        const theta = k * TAU / (3 + p.stage);
        polygon(ctx, [[Math.cos(theta)*15,Math.sin(theta)*18-8],[Math.cos(theta+.16)*(20+fin*.3),Math.sin(theta+.16)*(23+fin*.3)-8],[Math.cos(theta+.3)*15,Math.sin(theta+.3)*18-8]], p.accent);
      }
    } else if (motion === 'rush') {
      for (const side of [-1,1]) polygon(ctx, [[side*9,-18],[side*(9+fin*.5),-25-fin*.3],[side*14,-11]], p.accent);
    } else {
      for (let k = 0; k < count; k++) {
        const theta = k * TAU / count - Math.PI / 2;
        diamond(ctx, Math.cos(theta)*(22+fin*.2), Math.sin(theta)*(28+fin*.2)-4, 1.5+p.stage*.3, p.accent);
      }
    }
  }
  ctx.restore();

  if (active && reducedMotion) {
    // A contained, stationary emblem conveys an attack with no shake, rush,
    // repeated blinking, or moving background.
    diamond(ctx, 32, -16, special ? 11 : 6, p.energy, .75);
    arc(ctx, 32, -16, special ? 16 : 10, 0, TAU, p.accent, 2, .65);
  } else if (active && a > .18) {
    const travel = clamp((a - .18) / .62), fade = Math.min(1, (1 - a) * 3.5);
    const target = 32 + travel * reach, burst = Math.sin(travel * Math.PI);
    const beam = (vertices, width = 2, alpha = 1, color = p.energy) => line(ctx, vertices, color, width, fade * alpha);
    const ring = (xx, yy, radius, width = 2, alpha = 1) => arc(ctx, xx, yy, radius, 0, TAU, p.energy, width, fade * alpha);
    const slash = (yy, reverse = false) => {
      const radius = reach * (.58 + burst * .35);
      for (let k = 0; k < p.trailCount; k++) arc(ctx, 8, yy, radius-k*3, (reverse?-.1:-1.4)+travel*.45, (reverse?1.5:.5)+travel*.55, k===0?p.core:p.energy, k===0?2:3, fade/(1+k*.35));
    };
    switch (motion) {
      case 'cut': slash(-6); if (special) slash(14, true); break;
      case 'cleave':
        slash(6); beam([[24,-45],[target,32],[target+reach*.35,32]], 4+power*5);
        if (special) for(let k=0;k<extent;k++) beam([[target,32],[target+(k-extent/2)*9,16-k*3],[target+(k-extent/2)*14,28]],2);
        break;
      case 'blink':
        for(let k=0;k<extent;k++) beam([[target-k*9-9,-16+k*5],[target-k*9+10,6+k*5]],2+k%2);
        break;
      case 'arc':
        for(let k=0;k<extent;k++) beam([[16,-10],[target*.4,-18+k*7],[target*.6,-4+k*4],[target,-14+k*8]],2);
        break;
      case 'burst':
        for(let k=0;k<2+extent;k++) { const xx=24+((travel+k*.17)%1)*reach; beam([[xx-10,-12+k*5],[xx+5,-12+k*5]],2+special); }
        break;
      case 'rail':
        beam([[5,-6],[32+reach,-6]],3+power*5); beam([[5,-6],[32+reach,-6]],2,1,p.core);
        for(let k=0;k<extent;k++) ring(25+k*reach/extent,-6,5+burst*(6+p.stage),1,.7);
        break;
      case 'chain':
        for(let k=0;k<extent+1;k++) { const yy=(k-extent/2)*12; beam([[0,-20],[25,-8],[48,yy-10],[65,yy+2],[target,yy-5]],2); diamond(ctx,target,yy-5,3,p.core,fade); }
        break;
      case 'drone':
        for(let k=0;k<extent;k++) { const yy=Math.sin(travel*TAU+k)* (14+p.stage*3); beam([[target-20,yy-8],[target-9,yy],[target,yy]],1,.7); diamond(ctx,target,yy,4+p.stage*.5,p.energy,fade); }
        break;
      case 'lance':
        polygon(ctx, [[12,-8],[target+30,-13-power*2],[target+43, -5],[target+30,3+power*2],[12,-2]],p.energy,fade*.8);
        beam([[16,-5],[target+36,-5]],2,1,p.core); break;
      case 'fork':
        for(let k=-1;k<=1;k++) { const yy=k*(12+travel*16); beam([[0,k*7],[target,yy]],2+power*2); diamond(ctx,target,yy,3+p.stage,p.accent,fade); if(special)ring(target,yy,7+burst*10,1); }
        break;
      case 'rockets':
        for(let k=0;k<2+extent;k++) { const yy=-Math.sin(travel*Math.PI)*(18+k*6)+k*5; beam([[target-13,yy+7],[target-6,yy+1],[target,yy]],2,.7); diamond(ctx,target,yy,3,p.accent,fade); if(travel>.8)ring(target,yy,4+burst*12,2); } break;
      case 'reap': slash(-2); ring(target*.6,-6,10+burst*15,3,.7); if(special)slash(15,true); break;
      case 'arrow':
        for(let k=0;k<extent;k++) { const yy=(k-(extent-1)/2)*9; beam([[target-26,yy],[target+7,yy]],2); polygon(ctx,[[target+14,yy],[target+2,yy-5],[target+2,yy+5]],p.core,fade); } break;
      case 'gauss':
        for(let k=0;k<extent;k++) { const xx=target-k*11; diamond(ctx,xx,-6,7+p.stage,p.energy,fade); beam([[xx-23,-6],[xx,-6]],2,.8,p.accent); } break;
      case 'return':
        for(let k=0;k<extent;k++) arc(ctx,dx,dy,18+k*5,travel*TAU+k,travel*TAU+k+4,p.energy,2,fade*.8); break;
      case 'rush':
        for(let k=0;k<3+extent;k++) { const xx=20+((travel+k*.13)%1)*reach*.8,yy=Math.sin(k*2.1)*14; beam([[xx-19,yy],[xx+2,yy]],3); diamond(ctx,xx+5,yy,4+p.stage,p.accent,fade); } break;
      case 'gravity':
        polygon(ctx,Array.from({length:12},(_,k)=>{const theta=k*TAU/12;return [target*.7+Math.cos(theta)*(8+burst*18),-6+Math.sin(theta)*(8+burst*18)];}),'#080a1b',fade);
        for(let k=0;k<extent+1;k++) arc(ctx,target*.7,-6,12+burst*19+k*4,k+t,-k+t+4,p.energy,2,fade*.8);
        break;
      case 'sonic':
        for(let k=0;k<extent+1;k++) arc(ctx,8+k*15+travel*reach*.7,-5,8+travel*(18+p.tier)-k*2,-1.15,1.15,p.energy,2+special,fade*.8); break;
      case 'swarm':
        for(let k=0;k<4+extent*2;k++) { const theta=k*2.399+t*3; const xx=target*.8+Math.cos(theta)*(8+burst*16),yy=Math.sin(theta)*(12+burst*14); beam([[xx-7,yy+5],[xx,yy]],1,.6); diamond(ctx,xx,yy,2+k%2,p.energy,fade); } break;
      case 'plasma':
        beam([[10,-6],[target,-6]],6+power*8,.7);
        diamond(ctx,target,-6,9+power*(7+p.stage),p.energy,fade);
        diamond(ctx,target,-6,4+power*4,p.core,fade);
        if(special)for(let k=0;k<extent;k++)ring(target,-6,12+k*5+burst*10,1,.55);
        break;
    }
    // Deterministic shards use tier-driven counts; no random allocations or
    // particle objects accumulate between frames.
    if (special && travel > .5) {
      for(let k=0;k<p.particleCount;k++) {
        const theta=k*2.399, radius=(travel-.5)*(20+(k%7)*8+p.tier);
        diamond(ctx,32+reach*.7+Math.cos(theta)*radius,Math.sin(theta)*radius*.65,1+k%2,k%3?p.energy:p.accent,fade*.7);
      }
    }
  }
  ctx.restore();
  return {active, progress: a, profile: p};
}
