import {POINTS,TIERS} from './engine.js';
export function reactionFor({type,tier=0,streak=0,travelled=0}={}){
 const n=Math.max(0,Math.min(5,Number.isInteger(tier)?tier:0));
 const headlines=['NICE ONE!','GOOD SIGNAL!','DEEP CUT!','BIG BRAIN BOOST!','REDACTED ROCKET!','MOTHERLODE!'];
 if(type==='launch')return {type,tier:n,headline:headlines[n],detail:`+${POINTS[n]} POINTS · +${Math.round(travelled).toLocaleString('en-US')} KM${streak>1?` · ${streak} IN A ROW`:''}`,quip:['The obvious answer still gets you out.','Mom was hoping you forgot that one.','A loose thread. Pull harder.','You read the footnotes. She noticed.','That file was supposed to stay shut.','Straight through the company ceiling.'][n],duration:1300+n*180};
 const messages={accept:['ANSWER LOCKED!','NOW CHECK THE EXACT STATEMENT'],hit:['HULL HIT!','MOM IS CLOSING IN'],pass:['KEEP SEARCHING','NEXT SIGNAL. SAME ESCAPE.'],reject:['TRY ANOTHER SIGNAL','NO DAMAGE · KEEP GOING'],win:['YOU GOT OUT!','20 WORLDS · MOM IS FURIOUS'],depart:['HERE WE GO!','NEXT STOP: SOMEWHERE YOU SHOULD NOT BE']};
 const [headline,detail]=messages[type]??['SIGNAL RECEIVED',TIERS[n]];
 return {type,tier:n,headline,detail,quip:'',duration:type==='win'?3200:type==='accept'?800:1200};
}
export function mountFlightFX(doc=globalThis.document){
 for(const layer of doc.querySelectorAll('.flight-speedlines')){
  if(layer.children.length)continue;
  // Deterministic paper swooshes: no per-frame DOM work or particle allocation.
  layer.innerHTML=Array.from({length:12},(_,i)=>`<i style="--line-y:${8+(i*37)%86}%;--line-delay:${-(i%5)*.23}s;--line-size:${22+(i%4)*14}%;--line-speed:${.65+(i%3)*.22}s"></i>`).join('');
 }
}
let clearTimer=null;
export function playFlightReaction(event,doc=globalThis.document){
 const reaction=reactionFor(event),surfaces=doc.querySelectorAll('#space-scene,#mobile-chase');
 clearTimeout(clearTimer);
 for(const surface of surfaces){
  surface.classList.remove('input-reaction');
  surface.dataset.reaction=reaction.type;surface.dataset.rarity=String(reaction.tier);
  surface.style.setProperty('--reaction-duration',`${reaction.duration}ms`);
  const label=surface.querySelector('.flight-reaction');
  if(label){label.querySelector('strong').textContent=reaction.headline;label.querySelector('span').textContent=reaction.detail;}
  void surface.offsetWidth;surface.classList.add('input-reaction');
 }
 clearTimer=setTimeout(()=>{for(const surface of surfaces)surface.classList.remove('input-reaction');},reaction.duration);
 return reaction;
}
