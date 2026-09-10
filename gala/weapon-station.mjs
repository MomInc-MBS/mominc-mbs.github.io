import {AbilityCooldown,abilityFor,evolution} from './weapon-evolution.mjs';
import {drawAnimatedWeapon} from './weapon-animator.mjs';
import {weaponDamage} from './combat.mjs';

const KEY='mominc-gala-special-v1';
const read=()=>{try{return localStorage.getItem(KEY);}catch{return null;}};
let cooldown=new AbilityCooldown(read());
export async function activateGalaSpecial(value){
 const activate=()=>{const saved=new AbilityCooldown(read());if(saved.readyAt>cooldown.readyAt){cooldown.readyAt=saved.readyAt;cooldown.durationMs=saved.durationMs;}const result=cooldown.activate(value,{progress:window.GalaProgress.read(),inRest:true,catalog:window.GalaWeapons});if(result.ok){try{localStorage.setItem(KEY,JSON.stringify(cooldown.snapshot()));}catch{}}return result;};
 return navigator.locks?.request?navigator.locks.request('gala-weapon-special',activate):activate();
}
window.GalaWeaponMotion={drawAnimatedWeapon,evolution,abilityFor,activate:activateGalaSpecial,remaining:()=>cooldown.remaining(),damage:weapon=>weaponDamage(window.GalaProgress.read().combat,weapon)};

export function mountWeaponStation(host,{getWeapon,getProgress=()=>window.GalaProgress.read(),canUse=()=>true,choose=false}={}){
 const W=window.GalaWeapons,reduced=matchMedia('(prefers-reduced-motion: reduce)');
 host.classList.add('weapon-station');
 host.innerHTML='<div class="weapon-station-selectors"><label>Weapon<select data-family></select></label><label>Tier<select data-tier></select></label></div><div class="weapon-station-stage"><span data-name></span><canvas width="640" height="320" role="img" aria-label="Weapon animation"></canvas></div><div class="weapon-station-actions"><button type="button" data-attack>Attack</button><button type="button" data-special>Special</button></div><progress max="1" value="1" aria-label="Special cooldown"></progress><p data-requirement></p><p data-damage></p><p data-feedback role="status"></p>';
 const $=selector=>host.querySelector(selector),canvas=$('canvas'),ctx=canvas.getContext('2d'),family=$('[data-family]'),tier=$('[data-tier]');
 let selected={type:'rapier',tier:0},action=null,frame=0,last=0,visible=false,disposed=false,signature='';
 if(choose){
  try{selected=W.normalize(JSON.parse(localStorage.getItem('mominc-avatar-v1'))?.weapon||selected);}catch{}
  for(const item of W.types){const option=document.createElement('option');option.value=item.id;option.textContent=item.name+' · '+W.requirements({type:item.id,tier:0}).label;family.append(option);}
 }else $('.weapon-station-selectors').hidden=true;
 const weapon=()=>{try{return W.normalize(getWeapon?.()||selected);}catch{return {type:'rapier',tier:0};}};
 function persist(){
  if(!choose||!canUse()||!W.unlocked(selected,getProgress()))return;
  try{const A=window.GalaAvatar,look=A.normalize(JSON.parse(localStorage.getItem('mominc-avatar-v1'))||A.defaultLook);look.weapon={...selected};localStorage.setItem('mominc-avatar-v1',JSON.stringify(look));window.dispatchEvent(new Event('mominc-avatar-change'));}catch{$('[data-feedback]').textContent='Could not save this weapon.';}
 }
 function refresh(){
  const value=weapon(),p=getProgress(),profile=evolution(value),trained=W.trainingProgress(value,p),key=value.type+':'+value.tier+':'+trained.totalXp;
  if(key!==signature){signature=key;action=null;host.style.setProperty('--weapon-energy',profile.energy);$('[data-name]').textContent=W.name(value);const r=W.requirements(value);$('[data-requirement]').textContent=`${trained.totalXp} ${r.label} XP · `+(W.unlocked(value,p)?(profile.ability?`${profile.ability.cooldownMs/1000}s cooldown`:'Special at tier 4'):`${r.xp} XP to unlock`);
   if(choose){family.value=value.type;tier.replaceChildren();W.tiers.forEach((name,index)=>{const option=document.createElement('option');option.value=index;option.textContent=index+' · '+name;option.disabled=!W.unlocked({type:value.type,tier:index},p);tier.append(option);});tier.value=value.tier;}
  }
  const damage=W.unlocked(value,p)?weaponDamage(p.combat,value):0;$('[data-damage]').textContent=damage?`${damage.toLocaleString()} damage · ${p.combat?.loginStreak||1} login days × level ${value.tier+1}${p.combat?.breathingCompleted?' ×100 breathing':''}`:'Import today’s Coach progress to sync damage.';
  const ability=abilityFor(value),remaining=cooldown.remaining(),specialActive=action?.special&&performance.now()-action.startedAt<(ability?.animationMs||0);
  $('[data-attack]').disabled=!canUse()||specialActive;
  $('[data-special]').disabled=!canUse()||!ability||!W.unlocked(value,p)||remaining>0;
  $('[data-special]').textContent=!ability?'Special · tier 4':!W.unlocked(value,p)?ability.name+' · Locked':remaining?`${ability.name} · ${Math.ceil(remaining/1000)}s`:ability.name;
  $('progress').value=remaining?Math.max(0,1-remaining/Math.max(1,cooldown.durationMs)):1;
 }
 function attack(){if(!canUse())return;const ability=abilityFor(weapon());if(action?.special&&performance.now()-action.startedAt<(ability?.animationMs||0))return;action={startedAt:performance.now(),special:false};}
 async function special(){
  if(!canUse())return;const result=await activateGalaSpecial(weapon());if(result.ok){action={startedAt:performance.now(),special:true};$('[data-feedback]').textContent=result.ability.name;}refresh();
 }
 $('[data-attack]').addEventListener('click',attack);$('[data-special]').addEventListener('click',special);
 family.addEventListener('change',()=>{selected={type:family.value,tier:selected.tier};if(!W.unlocked(selected,getProgress()))selected.tier=0;persist();refresh();});
 tier.addEventListener('change',()=>{const next={type:selected.type,tier:Number(tier.value)};if(W.unlocked(next,getProgress())){selected=next;persist();refresh();}});
 function draw(now){frame=0;if(disposed||document.hidden||!visible)return;
  if(now-last>(reduced.matches?100:32)){last=now;refresh();ctx.clearRect(0,0,640,320);ctx.imageSmoothingEnabled=false;
   ctx.fillStyle='#111d32';ctx.fillRect(0,0,640,320);ctx.fillStyle='#719aab';for(let i=0;i<24;i++)ctx.fillRect((i*89+13)%640,(i*47+21)%235,1,1);
   ctx.fillStyle='#304258';ctx.beginPath();ctx.moveTo(63,258);ctx.lineTo(300,258);ctx.lineTo(267,283);ctx.lineTo(99,278);ctx.fill();ctx.fillStyle='#94d6c5';ctx.fillRect(67,254,230,4);
   drawAnimatedWeapon(ctx,weapon(),{weapons:W,x:183,y:163,scale:1.35,now,action,reducedMotion:reduced.matches});
  }frame=requestAnimationFrame(draw);
 }
 function schedule(){if(frame)cancelAnimationFrame(frame);frame=0;if(!disposed&&!document.hidden&&visible)frame=requestAnimationFrame(draw);}
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();});observer.observe(host);
 const storage=event=>{if(event.key===KEY){const incoming=new AbilityCooldown(read());if(incoming.readyAt>cooldown.readyAt)cooldown=incoming;}if(event.key===window.GalaProgress.KEY||event.key==='mominc-avatar-v1')signature='';refresh();};
 window.addEventListener('storage',storage);window.addEventListener('mominc-coach-progress-change',refresh);document.addEventListener('visibilitychange',schedule);refresh();
 return {refresh,dispose(){disposed=true;schedule();observer.disconnect();window.removeEventListener('storage',storage);window.removeEventListener('mominc-coach-progress-change',refresh);document.removeEventListener('visibilitychange',schedule);host.replaceChildren();}};
}

const demo=document.getElementById('weapon-demo');
if(demo){const station=mountWeaponStation(demo,{getWeapon:()=>window.GalaArmory.selection()});window.addEventListener('pagehide',()=>station.dispose(),{once:true});}
