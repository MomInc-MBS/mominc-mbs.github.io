(()=>{'use strict';const W=window.GalaWeapons,P=window.GalaProgress;let api,type='rapier',tier=0;
const $=id=>document.getElementById(id),canvas=(weapon,width=40,height=72)=>{const c=document.createElement('canvas');c.width=width;c.height=height;c.setAttribute('aria-hidden','true');W.draw(c.getContext('2d'),weapon,{scale:width/40});return c;};
function progress(){const p=P.read();$('weapon-xp').textContent=p.totalXp.toLocaleString()+' XP';$('weapon-strength').textContent='Strength '+p.strength;$('weapon-days').textContent=p.activeDays+' coach '+(p.activeDays===1?'day':'days');$('weapon-sync-note').textContent=p.importedAt?'Progress imported '+new Date(p.importedAt).toLocaleDateString()+'. Import again after more coaching days.':'In MYR5 Coach, open Progress → Download my data, then import that file here.';return p;}
function detail(){const value={type,tier},p=progress(),r=W.requirements(value),canEquip=W.unlocked(value,p),equipped=api.getLook().weapon;
 $('weapon-name').textContent=W.name(value);$('weapon-preview').replaceChildren(canvas(value,80,144));
 $('weapon-requirements').textContent=`${r.days} coach ${r.days===1?'day':'days'} · ${r.xp.toLocaleString()} XP · Strength ${r.strength}`;
 const selected=equipped?.type===type&&equipped?.tier===tier;
 $('weapon-equip').disabled=!canEquip||selected;$('weapon-equip').textContent=selected&&canEquip?'Equipped':canEquip?'Equip floating weapon':'Locked';
 const missing=[];if(p.activeDays<r.days)missing.push(`${r.days-p.activeDays} more coach ${r.days-p.activeDays===1?'day':'days'}`);if(p.strength<r.strength)missing.push(`Strength ${r.strength}`);
 $('weapon-lock-note').textContent=canEquip?'Ready to wield.':`Preview only · needs ${missing.join(' and ')}.`;
 $('weapon-equipped').textContent=equipped?(W.unlocked(equipped,p)?'Equipped: ':'Saved weapon locked: ')+W.name(equipped):'No weapon equipped';$('weapon-remove').disabled=!equipped;
 for(const button of $('weapon-tiers').children)button.setAttribute('aria-pressed',String(Number(button.dataset.tier)===tier));
 for(const button of $('weapon-types').children)button.setAttribute('aria-pressed',String(button.dataset.type===type));
}
function paintTiers(){const p=P.read();$('weapon-tiers').replaceChildren();W.tiers.forEach((name,index)=>{const b=document.createElement('button'),w={type,tier:index},open=W.unlocked(w,p);b.type='button';b.className='weapon-tier';b.dataset.tier=String(index);b.dataset.locked=String(!open);b.setAttribute('aria-label',W.name(w)+(open?', unlocked':', locked preview'));b.append(canvas(w));const label=document.createElement('span');label.textContent=index===0?'Starter':`Upgrade ${index}`;const state=document.createElement('small');state.textContent=open?'Unlocked':'Locked';b.append(label,state);b.onclick=()=>{tier=index;detail();};$('weapon-tiers').append(b);});detail();}
function refresh(){if(!api)return;detail();}
function mount(controller){api=controller;
 for(const family of W.types){const b=document.createElement('button');b.type='button';b.className='weapon-type';b.dataset.type=family.id;b.append(canvas({type:family.id,tier:0},24,44));const label=document.createElement('span');label.textContent=family.name;b.append(label);b.onclick=()=>{type=family.id;tier=api.getLook().weapon?.type===type?api.getLook().weapon.tier:0;paintTiers();};$('weapon-types').append(b);}
 $('weapon-equip').onclick=()=>{const w={type,tier};if(!W.unlocked(w)){api.status('Earn more coaching progress to wield this weapon.');return;}api.change(()=>api.getLook().weapon=w);api.status(W.name(w)+' equipped.');};
 $('weapon-remove').onclick=()=>{api.change(()=>delete api.getLook().weapon);api.status('Weapon put away.');};
 $('coach-progress-file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>10000000)throw Error('Choose a Coach export under 10 MB.');const p=P.importCoach(JSON.parse(await file.text()));paintTiers();api.paint();api.status(`Coach progress imported: ${p.activeDays} days, ${p.totalXp} XP, Strength ${p.strength}.`);}catch(err){api.status(err instanceof SyntaxError?'Choose a valid Coach data file.':err.message);}finally{e.target.value='';}};
 window.addEventListener('storage',e=>{if(e.key===P.KEY){paintTiers();api.paint();}});
 paintTiers();
 // Only the main equipped portrait animates. Thumbnails stay still.
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');let last=0;
 function frame(now){if(!document.hidden&&!reduced?.matches&&api.getLook().weapon&&now-last>65){last=now;window.GalaAvatar.draw($('avatar'),api.getLook(),{time:now});}window.requestAnimationFrame(frame);}
 window.requestAnimationFrame(frame);
}
window.GalaArmory={mount,refresh};
})();
