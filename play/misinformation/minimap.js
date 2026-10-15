import {LEVELS,STATION,levelIndex} from './engine.js';
import {gapForRun} from './scene.js';

// Three wavy lanes connected by wide U-turns. The same cubic geometry drives
// the SVG, the stop locations, and arc-length interpolation of both craft.
export const ROUTE_SEGMENTS=Object.freeze([
 [[28,138],[85,112],[140,158],[202,136]],
 [[202,136],[265,113],[330,116],[390,138]],
 [[390,138],[472,167],[485,82],[414,92]],
 [[414,92],[345,82],[298,117],[230,94]],
 [[230,94],[166,72],[112,76],[66,96]],
 [[66,96],[0,124],[0,38],[72,44]],
 [[72,44],[140,51],[193,20],[252,43]],
 [[252,43],[315,68],[370,69],[440,40]]
].map(segment=>Object.freeze(segment.map(point=>Object.freeze(point)))));
export const ROUTE_PATH=`M ${ROUTE_SEGMENTS[0][0].join(' ')} `+ROUTE_SEGMENTS.map(segment=>`C ${segment.slice(1).map(p=>p.join(' ')).join(' ')}`).join(' ');
function cubic(segment,t){
 const u=1-t,weights=[u*u*u,3*u*u*t,3*u*t*t,t*t*t];
 return {x:segment.reduce((n,p,i)=>n+p[0]*weights[i],0),y:segment.reduce((n,p,i)=>n+p[1]*weights[i],0)};
}
const samples=[{x:28,y:138,length:0}];
for(const segment of ROUTE_SEGMENTS){
 for(let i=1;i<=80;i++){
  const p=cubic(segment,i/80),last=samples.at(-1);
  samples.push({...p,length:last.length+Math.hypot(p.x-last.x,p.y-last.y)});
 }
}
export const ROUTE_LENGTH=samples.at(-1).length;
const unit=value=>Math.max(0,Math.min(1,Number.isFinite(value)?value:0));
export function pointAtProgress(value){
 const progress=unit(value),distance=progress*ROUTE_LENGTH;
 let low=0,high=samples.length-1;
 while(low<high){const middle=Math.floor((low+high)/2);if(samples[middle].length<distance)low=middle+1;else high=middle;}
 const end=samples[low],start=samples[Math.max(0,low-1)];
 const mix=end.length===start.length?0:(distance-start.length)/(end.length-start.length);
 return {x:start.x+(end.x-start.x)*mix,y:start.y+(end.y-start.y)*mix,progress,distance};
}
export const ROUTE_STOPS=Object.freeze(LEVELS.map((level,index)=>{
 // The final stop marks actual arrival, not the beginning of its approach.
 const progress=index===LEVELS.length-1?1:level.startDistance/STATION;
 return Object.freeze({...level,...pointAtProgress(progress),group:index<6?'grounded':index<10?'folds':'dimensions'});
}));
export function minimapFrame(state){
 const progress=unit(state.distance/STATION),level=levelIndex(progress*STATION);
 const rounds=Number.isFinite(state.rounds)?Math.max(0,state.rounds):(state.history?.length??0);
 const hits=Math.max(0,Math.min(3,Number.isFinite(state.hits)?state.hits:0));
 const caught=state.phase==='dead';
 const gap=caught?0:gapForRun(state)/400;
 return {progress,level,title:LEVELS[level].name,percent:Math.floor(progress*100),
  player:pointAtProgress(progress),pursuer:pointAtProgress(Math.max(0,progress-gap)),
  caught,escaped:state.phase==='escaped'&&progress===1};
}

const safe=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const instances=new WeakMap();
let activeDocument=null,serial=0;
function markup(prefix){
 const stops=ROUTE_STOPS.map((stop,index)=>`<g class="winding-stop winding-${stop.group}" data-route-stop="${index}" transform="translate(${stop.x} ${stop.y})"><title>${stop.number}. ${safe(stop.name)}</title><circle r="7.4"/><text y="3.7">${stop.number}</text></g>`).join('');
 return `<figure class="winding-map"><svg class="winding-map-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 180" role="img" aria-labelledby="${prefix}-title" aria-describedby="${prefix}-description"><title id="${prefix}-title">Your winding escape route</title><desc id="${prefix}-description" class="winding-map-description">From Office through twenty paper worlds to MOM's Mothership Desk.</desc><defs><linearGradient id="${prefix}-trail" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#c65f30"/><stop offset=".48" stop-color="#dfae54"/><stop offset="1" stop-color="#805b91"/></linearGradient></defs><rect class="winding-paper" x="1" y="1" width="498" height="178" rx="12"/><path class="winding-track-shadow" d="${ROUTE_PATH}"/><path class="winding-track" d="${ROUTE_PATH}"/><path class="winding-map-progress" d="${ROUTE_PATH}" pathLength="1" stroke="url(#${prefix}-trail)" stroke-dasharray="1 1" stroke-dashoffset="1"/>${stops}<text class="winding-end-label" x="20" y="176">START: OFFICE</text><text class="winding-end-label" x="455" y="12" text-anchor="end">GOAL: MOTHERSHIP</text><g class="winding-map-mom"><circle r="8.8"/><text y="23">MOM</text></g><g class="winding-map-you"><path d="M 0 -8 L 7 4 L 0 1 L -7 4 Z"/><text y="-14">YOU</text></g></svg><figcaption class="winding-map-caption"><span class="winding-map-level">01 / 20</span><b class="winding-map-name">Office</b><span class="winding-map-percent">0%</span></figcaption></figure>`;
}
export function mountMinimaps(doc=globalThis.document){
 if(!doc)return [];
 activeDocument=doc;
 const mounted=[];
 for(const selector of ['#journey-minimap','#mobile-minimap']){
  const container=doc.querySelector(selector);if(!container)continue;
  let entry=instances.get(container);
  if(!entry){
   let prefix;do{prefix=`mom-winding-route-${++serial}`;}while(doc.getElementById?.(`${prefix}-title`));
   container.innerHTML=markup(prefix);
   entry={container,progress:container.querySelector('.winding-map-progress'),player:container.querySelector('.winding-map-you'),
    pursuer:container.querySelector('.winding-map-mom'),description:container.querySelector('.winding-map-description'),
    level:container.querySelector('.winding-map-level'),name:container.querySelector('.winding-map-name'),percent:container.querySelector('.winding-map-percent'),
    stops:[...container.querySelectorAll('[data-route-stop]')]};
   instances.set(container,entry);
  }
  mounted.push(entry);
 }
 return mounted;
}
export function renderMinimaps(state){
 const frame=minimapFrame(state);
 for(const entry of mountMinimaps(activeDocument??globalThis.document)){
  entry.container.dataset.level=String(frame.level);entry.container.dataset.phase=state.phase;
  entry.progress.setAttribute('stroke-dashoffset',String(1-frame.progress));
  entry.player.setAttribute('transform',`translate(${frame.player.x} ${frame.player.y})`);
  entry.pursuer.setAttribute('transform',`translate(${frame.pursuer.x} ${frame.pursuer.y})`);
  entry.level.textContent=`${String(frame.level+1).padStart(2,'0')} / 20`;
  entry.name.textContent=frame.title;entry.percent.textContent=`${frame.percent}%`;
  entry.description.textContent=`Winding route: Office to MOM's Mothership Desk. Level ${frame.level+1} of 20: ${frame.title}. ${frame.percent}% travelled. ${frame.caught?'MOM caught this flight.':frame.escaped?'You escaped.':'Orange is you; purple is MOM.'}`;
  for(let i=0;i<entry.stops.length;i++){
   const stop=entry.stops[i],current=i===frame.level;
   stop.classList.toggle('is-current',current);stop.classList.toggle('is-reached',ROUTE_STOPS[i].progress<=frame.progress);
   if(current)stop.setAttribute('aria-current','step');else stop.removeAttribute('aria-current');
  }
 }
 return frame;
}
