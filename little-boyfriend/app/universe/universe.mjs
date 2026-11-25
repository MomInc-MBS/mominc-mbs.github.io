// Memory Universe glue: ported from Coach battle-pass-page.mjs (R118 16618a6): shell/viewport/route/canvas (l.49-64),
// buildArea/buildMap (l.109-156), flight start, hyperJump, pointer handling, visibility/resize (l.174-218).
// Panels (media thumbs) replace the .pass-level rows. Score is never shown; onScore is ignored.
import {chapterWorld,chapterConstellation} from './coach/level-map-domain.mjs';
import {mountLevelMapScene} from './coach/level-map-scene.mjs';
import {mountFlightScroll,hyperDuration,hyperEase} from './coach/flight-scroll.mjs';

const SECTOR=10,MAX_IMGS=48,THUMB=256;
const $=id=>document.getElementById(id);
const node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!=null)el.textContent=text;return el;};
const svg=(tag,attrs)=>{const el=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const k in attrs)el.setAttribute(k,String(attrs[k]));return el;};
const bridge=()=>window.LBF||(window.parent!==window&&window.parent.LBF)||{open(){},back(){}}; // WEB: bridge may live in the host page
const shell=$('shell'),viewport=$('viewport'),route=$('route'),canvas=$('scene');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const scene=mountLevelMapScene(canvas,{ship:'supportive',reducedMotion:reduced.matches,onScore:()=>{}});

// ---- lazy thumbnails: at most MAX_IMGS imgs carry a src at once
const loaded=new Set(),near=new Set(),far=new Set();
let jump=0;
const drop=p=>{p.firstChild.removeAttribute('src');loaded.delete(p);bridge().release?.(Number(p.dataset.slot));};
// WEB: host bridge may supply thumb(slot,size)->objectURL (sync or Promise) and release(slot); native serves /thumb/<slot>
function setThumb(p){
 const b=bridge(),slot=Number(p.dataset.slot);
 if(!b.thumb){p.firstChild.src=`/thumb/${slot}?s=${THUMB}`;return;}
 Promise.resolve(b.thumb(slot,THUMB)).then(u=>{if(loaded.has(p)&&u)p.firstChild.src=u;else b.release?.(slot);}).catch(()=>{});
}
function sync(){
 if(!jump)for(const p of near)if(!loaded.has(p)){loaded.add(p);setThumb(p);}
 for(const p of [...loaded])if(!far.has(p)&&!near.has(p))drop(p);
 if(loaded.size>MAX_IMGS){
  const mid=viewport.scrollTop+viewport.clientHeight/2,y=p=>p.offsetTop+p.offsetParent.offsetTop;
  [...loaded].sort((a,b)=>Math.abs(y(b)-mid)-Math.abs(y(a)-mid)).slice(0,loaded.size-MAX_IMGS).forEach(drop);
 }
}
const watch=(set,margin)=>new IntersectionObserver(es=>{for(const e of es)e.isIntersecting?set.add(e.target):set.delete(e.target);sync();},{root:viewport,rootMargin:margin});
const nearIO=watch(near,'100% 0px'),farIO=watch(far,'200% 0px');

// ---- catalog -> map
const MONTH=new Intl.DateTimeFormat('en',{month:'short',year:'numeric'});
const monthOf=t=>MONTH.format(new Date(t*1000)).toUpperCase();
function sectorTitle(items){
 const ts=items.map(i=>i.t).filter(Boolean);
 if(!ts.length)return '';
 const a=monthOf(Math.min(...ts)),b=monthOf(Math.max(...ts));
 return a===b?a:`${a} – ${b}`;
}
function buildArea(s,bySlot,cat){
 const world=chapterWorld(s%25),geo=chapterConstellation(s%25);
 const area=node('section','mu-area');
 area.style.setProperty('--world-intensity',world.intensity);area.style.setProperty('--world-hue',`${205+(s%25)*12}deg`);
 area.style.setProperty('--object-x',`${s%2?13:81}%`);area.style.setProperty('--object-y',`${16+(s*11)%19}%`);
 const lines=svg('svg',{class:'mu-route-lines',viewBox:'0 0 100 100',preserveAspectRatio:'none','aria-hidden':'true'});
 lines.append(svg('path',{d:geo.main,class:'mu-route-main'}));
 const sky=node('div','mu-sky'),planet=node('div','mu-planet');sky.setAttribute('aria-hidden','true');planet.setAttribute('aria-hidden','true');
 area.append(sky,planet,lines);
 const items=[];
 for(let i=0;i<SECTOR;i++){
  const slot=s*SECTOR+i+1,it=bySlot.get(slot),pt=geo.nodes[i];
  const pos=el=>{el.style.setProperty('--node-x',`${pt.x}%`);el.style.setProperty('--node-y',`${pt.y}%`);return el;};
  if(!it){if(slot>cat.maxSlot)continue;const st=pos(node('span','mu-slot'));st.append(node('i','mu-star'));st.setAttribute('aria-hidden','true');area.append(st);continue;}
  items.push(it);
  const b=pos(node('button','mu-panel'));b.type='button';b.dataset.slot=String(slot);
  b.style.setProperty('--a',String(Math.max(.4,Math.min(2.5,(it.w>0&&it.h>0)?it.w/it.h:1))));
  b.setAttribute('aria-label',it.type==='video'?'Open video':'Open photo');
  const img=node('img');img.alt='';img.draggable=false;img.decoding='async';b.append(img);
  if(it.type==='video'){const m=Math.floor(it.durMs/60000),sec=String(Math.floor(it.durMs/1000)%60).padStart(2,'0');b.append(node('span','mu-badge',`▶ ${m}:${sec}`));}
  area.append(b);nearIO.observe(b);farIO.observe(b);
 }
 const title=node('div','mu-world-title');
 title.append(node('small',null,`MEMORIES ${s*SECTOR+1}–${s*SECTOR+SECTOR}`),node('b',null,sectorTitle(items)||world.name));
 area.append(title);
 return area;
}
let started=false;
function buildMap(cat){
 for(const p of [...loaded])drop(p);
 near.clear();far.clear();nearIO.disconnect();farIO.disconnect();
 const bySlot=new Map(cat.items.map(i=>[i.slot,i]));
 const n=Math.max(1,Math.ceil(cat.maxSlot/SECTOR)),frag=document.createDocumentFragment();
 for(let s=0;s<n;s++)frag.append(buildArea(s,bySlot,cat)); // oldest at the top, newest at the bottom
 route.replaceChildren(frag);
 $('album').textContent=cat.album;
 const ph=cat.items.filter(i=>i.type==='photo').length;
 $('count').textContent=`${ph} photos · ${cat.items.length-ph} videos`;
 const empty=cat.items.length===0;
 $('empty').hidden=!empty;
 if(empty)scene.stop();else if(started&&!document.hidden)scene.start();
}
async function load(){
 const b=bridge();
 buildMap(b.catalog?await b.catalog():await(await fetch('/catalog.json',{cache:'no-store'})).json());
}

// ---- flight (behaviour unchanged from the XP page)
const flightStart=()=>Math.max(0,viewport.scrollHeight-viewport.clientHeight);
const endJump=()=>{if(jump)cancelAnimationFrame(jump);jump=0;scene.setWarp(0);delete shell.dataset.hyper;sync();};
function hyperJump(to){
 endJump();stopPointer();
 const from=viewport.scrollTop,dist=to-from;
 if(reduced.matches||Math.abs(dist)<2){viewport.scrollTop=to;sync();return;}
 const dur=hyperDuration(dist);let t0=null,last=from,lastT=0;
 shell.dataset.hyper='true';
 const step=now=>{
  if(t0===null)t0=lastT=now;
  const u=Math.min(1,(now-t0)/dur),y=from+dist*hyperEase(u);viewport.scrollTop=y;
  scene.setWarp(-(y-last)/Math.max(1,now-lastT));last=y;lastT=now;
  if(u<1)jump=requestAnimationFrame(step);else endJump();
 };
 jump=requestAnimationFrame(step);
}
let active=null,down=null,lastOpen=0;
const flightScroll=mountFlightScroll(viewport);
function stopPointer(){active=null;down=null;flightScroll.stop();scene.stopFiring();}
const inHud=t=>t.closest('.mu-hud,.mu-empty');
shell.addEventListener('pointerdown',e=>{
 if(jump&&!inHud(e.target))endJump();
 if(active!==null||!e.isPrimary||e.button!==0||inHud(e.target)||!$('empty').hidden)return;
 e.preventDefault();active=e.pointerId;shell.setPointerCapture(e.pointerId);
 down={x:e.clientX,y:e.clientY,t:e.timeStamp,panel:e.target.closest('.mu-panel')};
 scene.aim(e.clientX,e.clientY);flightScroll.aim(e.clientY);scene.startFiring();
});
document.addEventListener('pointermove',e=>{if(e.pointerId===active){e.preventDefault();scene.aim(e.clientX,e.clientY);flightScroll.aim(e.clientY);}});
shell.addEventListener('lostpointercapture',stopPointer);
document.addEventListener('pointerup',e=>{
 if(e.pointerId!==active)return;
 const d=down;stopPointer();
 // tap = quick, nearly still, began on a panel; holding over a panel just flies
 if(d&&d.panel&&e.timeStamp-d.t<250&&Math.hypot(e.clientX-d.x,e.clientY-d.y)<12)openSlot(d.panel);
});
document.addEventListener('pointercancel',e=>{if(e.pointerId===active)stopPointer();});
window.addEventListener('blur',stopPointer);
function openSlot(p){
 const now=performance.now();if(now-lastOpen<500)return;lastOpen=now;
 bridge().open(Number(p.dataset.slot));
}
route.addEventListener('click',e=>{const p=e.target.closest('.mu-panel');if(p&&e.detail===0)openSlot(p);}); // keyboard activation
$('back').onclick=$('emptyBack').onclick=()=>bridge().back();
$('home').onclick=()=>hyperJump(flightStart());
$('oldest').onclick=()=>hyperJump(0);
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopPointer();scene.stop();}else if(started&&$('empty').hidden)scene.start();});
window.addEventListener('resize',()=>scene.resize());

// ---- native nudges (evaluateJavascript, no data crosses)
window.universeReload=()=>load();   // after a delete: slots never reflow, so panels stay put
window.universeShow=async()=>{await load();viewport.scrollTop=flightStart();started=true;sync();if($('empty').hidden)scene.start();};
(async()=>{
 try{await load();}catch{$('empty').hidden=false;}
 requestAnimationFrame(()=>{viewport.scrollTop=flightStart();started=true;if($('empty').hidden)scene.start();sync();});
})();
