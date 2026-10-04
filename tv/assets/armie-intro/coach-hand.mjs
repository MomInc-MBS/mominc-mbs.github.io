// Coach Armie: severed purple clay forearm, pointy face, two mismatched googly eyes, torn stump with gold bone.
// Drawn lying down, face to the right. Rotate the returned element to point him elsewhere.
let uid=0;
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||!!document.querySelector('#ar.ar-motion-off');
export function coachHand({size=48}={}){
  const id='ch'+(++uid);
  const el=document.createElement('span');el.className='ar-coach-hand';el.style.setProperty('--ch-size',size+'px');el.setAttribute('aria-hidden','true');
  el.innerHTML=`<svg viewBox="0 0 132 64" width="${size}" height="${Math.round(size*64/132)}">
<defs>
<filter id="${id}c" x="-10%" y="-20%" width="120%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.2"/></filter>
<filter id="${id}t"><feTurbulence type="fractalNoise" baseFrequency=".22" numOctaves="3" seed="3"/><feColorMatrix values="0 0 0 0 .32  0 0 0 0 .16  0 0 0 0 .4  0 0 0 -2.2 1.25"/><feComposite in2="SourceGraphic" operator="in"/></filter>
<radialGradient id="${id}g" cx="55%" cy="28%" r="80%"><stop offset="0" stop-color="#b07acc"/><stop offset=".45" stop-color="#8e5b99"/><stop offset="1" stop-color="#512866"/></radialGradient>
<radialGradient id="${id}w" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="#cc518e"/><stop offset=".6" stop-color="#660044"/><stop offset="1" stop-color="#330022"/></radialGradient>
<clipPath id="${id}k"><path d="M14 13 Q40 7 66 16 Q76 12 96 14 Q108 16 128 31 Q130 34 126 36 Q112 42 102 47 Q100 57 92 58 Q90 52 86 50 Q76 52 66 48 Q40 57 14 52 Z"/></clipPath>
</defs>
<ellipse cx="66" cy="58" rx="56" ry="5" fill="#281433" opacity=".55"/>
<g filter="url(#${id}c)">
<path d="M14 13 Q40 7 66 16 Q76 12 96 14 Q108 16 128 31 Q130 34 126 36 Q112 42 102 47 Q100 57 92 58 Q90 52 86 50 Q76 52 66 48 Q40 57 14 52 Z" fill="url(#${id}g)"/>
<path d="M100 20 L126 31 M100 29 L128 33 M100 38 L125 35 M66 17 Q64 32 66 47" stroke="#512866" stroke-width="1.6" stroke-linecap="round" fill="none" opacity=".7"/>
<path d="M14 16 L9 22 L13 27 L7 33 L12 38 L8 45 L14 50 Q20 34 14 16 Z" fill="url(#${id}w)"/>
<rect x="1" y="29" width="15" height="6" rx="3" fill="#d4a017"/><circle cx="2.5" cy="28.5" r="3.2" fill="#e8b33a"/><circle cx="2.5" cy="35.5" r="3.2" fill="#e8b33a"/>
<path d="M12 45 q2 6 -1 11 M17 49 q1 4 -1 7" stroke="#660044" stroke-width="2.4" stroke-linecap="round" fill="none"/>
<rect x="12" y="6" width="118" height="54" fill="#000" filter="url(#${id}t)" opacity=".5" clip-path="url(#${id}k)"/>
</g>
<g fill="none" stroke="#512866" stroke-width=".8" opacity=".55"><ellipse cx="42" cy="24" rx="7" ry="4.5"/><ellipse cx="42" cy="24" rx="4.5" ry="2.7"/><ellipse cx="42" cy="24" rx="2" ry="1.1"/><ellipse cx="64" cy="44" rx="6" ry="3.6"/><ellipse cx="64" cy="44" rx="3.4" ry="2"/><ellipse cx="28" cy="38" rx="5" ry="3.3"/><ellipse cx="28" cy="38" rx="2.4" ry="1.5"/></g>
<g stroke="#7d6a58" stroke-width="1" stroke-linecap="round" opacity=".85"><path d="M34 13 l-3 -6 M36 13 l1 -7 M38 14 l4 -6"/><path d="M58 51 l-2 6 M60 51 l2 6"/><path d="M96 16 l3 -5 M98 17 l5 -4"/></g>
<g class="ch-eye"><circle cx="86" cy="24" r="10" fill="#fffdf6" stroke="#281433" stroke-width="1.4"/><circle class="ch-pupil" cx="86" cy="24" r="5" fill="#120a14"/><circle cx="82.5" cy="20" r="2" fill="#fff" opacity=".85"/></g>
<g class="ch-eye"><circle cx="100" cy="39" r="6" fill="#fffdf6" stroke="#281433" stroke-width="1.2"/><circle class="ch-pupil" cx="100" cy="39" r="3" fill="#120a14"/><circle cx="98" cy="36.6" r="1.2" fill="#fff" opacity=".85"/></g>
</svg>`;
  const eyes=[...el.querySelectorAll('.ch-pupil')].map((p,i)=>({p,cx:i?100:86,cy:i?39:24,r:i?6:10}));
  let pressure=.3,roll=false,angle=0,seen=false;
  function draw(){
    const still=reduced();angle+=roll?.9:0;
    for(const [i,e] of eyes.entries()){
      const pr=e.r*(.32+.36*pressure),room=e.r-pr-.8;
      let dx,dy;
      if(roll&&!still){dx=Math.cos(angle+i*2.4)*room;dy=Math.sin(angle+i*2.4)*room;}
      else if(still){dx=room*.5;dy=0;}
      else{dx=(Math.random()*2-1)*room*(.4+pressure*.6);dy=(Math.random()*2-1)*room*(.4+pressure*.6);}
      e.p.setAttribute('r',pr.toFixed(2));e.p.setAttribute('cx',(e.cx+dx).toFixed(2));e.p.setAttribute('cy',(e.cy+dy).toFixed(2));
    }
  }
  const timer=setInterval(()=>{if(el.isConnected)seen=true;else if(seen){clearInterval(timer);return;}if(seen)draw();},140);
  draw();
  el.coach={pressure(p){pressure=Math.max(0,Math.min(1,p));},roll(on){roll=!!on;},destroy(){clearInterval(timer);}};
  return el;
}
