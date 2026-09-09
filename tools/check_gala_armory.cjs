const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {JSDOM}=require('jsdom');
const {createCanvas}=require('@napi-rs/canvas');
const root=path.join(__dirname,'../gala');
const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url:'http://127.0.0.1:8820/gala/',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,$=id=>w.document.getElementById(id),audios=[],downloads=[];
w.structuredClone=structuredClone;w.requestAnimationFrame=()=>0;w.matchMedia=()=>({matches:true});w.Blob=Blob;w.URL.createObjectURL=blob=>{downloads.push(blob);return 'blob:test';};w.URL.revokeObjectURL=()=>{};
w.HTMLAnchorElement.prototype.click=function(){};
function surface(el){if(!el._canvas||el._canvas.width!==el.width||el._canvas.height!==el.height)el._canvas=createCanvas(el.width,el.height);return el._canvas;}
w.HTMLCanvasElement.prototype.getContext=function(){const c=surface(this).getContext('2d');return new Proxy(c,{get(target,key){if(key==='drawImage')return (image,...args)=>target.drawImage(image instanceof w.HTMLCanvasElement?surface(image):image,...args);const value=target[key];return typeof value==='function'?value.bind(target):value;},set(target,key,value){target[key]=value;return true;}});};
w.HTMLCanvasElement.prototype.toBlob=function(callback){callback(new Blob([surface(this).toBuffer('image/png')],{type:'image/png'}));};
w.Audio=class extends w.EventTarget{constructor(src){super();this.src=src;this.currentTime=0;this.duration=183.6;this.volume=1;this.error=null;this.plays=0;this.pauses=0;audios.push(this);}async play(){this.plays++;this.dispatchEvent(new w.Event('playing'));}pause(){this.pauses++;this.dispatchEvent(new w.Event('pause'));}load(){}};
for(const file of ['progress.js','weapons.js','armory.js','gramophone.js','avatar.js','gala.js'])w.eval(fs.readFileSync(path.join(root,file),'utf8'));
const W=w.GalaWeapons,P=w.GalaProgress,A=w.GalaAvatar,look=()=>JSON.parse(w.localStorage.getItem('mominc-avatar-v1'));
const now=Date.UTC(2026,8,9,14),rows=(days,perDay=4)=>Array.from({length:days*perDay},(_,i)=>({id:`00000000-0000-4000-8000-${String(i).padStart(12,'0')}`,user_id:'test-owner',mode:'squat',goal:5,value:5,started_at:now-Math.floor(i/perDay)*86400000-60000,completed_at:now-Math.floor(i/perDay)*86400000}));
const exportFor=(days,perDay=4)=>({profiles:[],meals:[],reminders:[],workouts:rows(days,perDay)});
async function importProgress(data){await $('coach-progress-file').onchange({target:{files:[{size:1000,text:async()=>JSON.stringify(data)}],value:''}});}
(async()=>{
 assert.equal(w.document.querySelectorAll('#sections button').length,6);w.document.querySelector('[data-menu="equipment"]').click();assert.equal($('weapon-detail').hidden,true);$('weapon-types').children[0].click();assert.equal($('weapon-detail').hidden,false);
 assert.equal($('armory').hidden,false);assert.equal($('options').hidden,true);assert.equal($('weapon-types').children.length,20);assert.equal($('weapon-tiers').children.length,21);assert.equal($('weapon-equip').disabled,false);assert.equal(P.read().totalXp,0);
 for(const typeButton of $('weapon-types').children){typeButton.click();$('weapon-equip').click();assert.equal(look().weapon.type,typeButton.dataset.type);assert.equal(look().weapon.tier,0);assert.equal(P.read().totalXp,0);assert.equal(P.read().activeDays,0);}$('weapon-types').children[0].click();
 const hashes=new Set();
 for(const type of W.types){for(let tier=0;tier<=20;tier++){const value={type:type.id,tier},c=createCanvas(40,72);W.draw(c.getContext('2d'),value);const pixels=c.getContext('2d').getImageData(0,0,40,72).data;const hash=crypto.createHash('sha256').update(pixels).digest('hex');assert.ok(!hashes.has(hash),W.name(value)+' duplicated');hashes.add(hash);assert.equal(W.unlocked(value),tier===0);const r=W.requirements(value);assert.equal(W.unlocked(value,{activeDays:r.days,totalXp:r.xp,strength:r.strength}),true);assert.equal(W.unlocked(value,{activeDays:r.days-1,totalXp:r.xp,strength:r.strength}),false);assert.equal(W.unlocked(value,{activeDays:r.days,totalXp:r.xp-1,strength:r.strength}),false);assert.equal(W.unlocked(value,{activeDays:r.days,totalXp:r.xp,strength:r.strength-1}),false);}}
 const data=exportFor(1);data.workouts.push(data.workouts[0],{...data.workouts[0],id:'00000000-0000-4000-8000-999999999999',completed_at:null});const p=P.fromCoach(data,now);assert.equal(p.activeDays,1);assert.equal(p.completedSets,4);
 assert.throws(()=>P.fromCoach({activeDays:365,totalXp:36500,strength:75}),/Choose/);assert.throws(()=>P.fromCoach({...data,workouts:[{...data.workouts[0],completed_at:now+86400000}]},now),/invalid/);
 await importProgress(data);assert.equal(P.read().activeDays,1);assert.equal(P.read().totalXp,100);assert.equal(P.read().strength,2);assert.equal($('weapon-equip').disabled,false);
 $('weapon-equip').click();assert.equal(look().weapon.type,'rapier');assert.equal(look().weapon.tier,0);assert.equal($('avatar').width,96);
 assert.ok(surface($('avatar')).getContext('2d').getImageData(64,0,32,96).data.some((value,i)=>i%4===3&&value>0),'equipped weapon has visible pixels beside the character');
 $('weapon-tiers').children[20].click();assert.equal($('weapon-equip').disabled,true);$('weapon-equip').onclick();assert.equal(look().weapon.tier,0,'direct handler cannot equip a locked preview');
 $('export').click();assert.equal(JSON.parse(await downloads.at(-1).text()).weapon.tier,0);$('png').click();assert.equal(downloads.at(-1).type,'image/png');
 $('weapon-remove').click();assert.equal(look().weapon,undefined);assert.equal($('avatar').width,64);$('undo').click();assert.equal(look().weapon.tier,0);$('redo').click();assert.equal(look().weapon,undefined);
 await importProgress(exportFor(365));assert.equal(P.read().activeDays,365);assert.equal(P.read().totalXp,36500);assert.equal($('weapon-equip').disabled,false);
 $('weapon-equip').click();assert.equal(look().weapon.tier,20);assert.equal($('avatar').width,96);
 // An imported weapon recipe grants neither XP nor permission to display a locked weapon.
 w.localStorage.removeItem(P.KEY);const imported=A.normalize(look()),c=createCanvas(64,96);A.draw(c,imported);assert.equal(c.width,64);assert.equal(P.read().totalXp,0);
 for(const typeButton of $('weapon-types').children){typeButton.click();assert.equal($('weapon-tiers').children.length,21);}
 // Music starts on a gesture, mutes, remembers volume, and respects explicit mute.
 const audio=audios[0],toggle=w.document.querySelector('.gramophone-toggle'),volume=w.document.querySelector('.gramophone-volume input');
 $('category-name').dispatchEvent(new w.Event('pointerdown',{bubbles:true}));await Promise.resolve();await Promise.resolve();assert.equal(toggle.getAttribute('aria-pressed'),'true');toggle.click();assert.equal(toggle.getAttribute('aria-pressed'),'false');const plays=audio.plays;$('category-name').dispatchEvent(new w.Event('pointerdown',{bubbles:true}));assert.equal(audio.plays,plays);
 volume.value='20';volume.oninput();assert.equal(audio.volume,.2);assert.equal(JSON.parse(w.localStorage.getItem('mominc-gramophone-v1')).volume,.2);
 toggle.click();await Promise.resolve();await Promise.resolve();assert.equal(toggle.getAttribute('aria-pressed'),'true');
 // Actual drawing contact sheets: five families per sheet, six representative tiers.
 if(process.env.GALA_CONTACT_SHEETS)for(let group=0;group<4;group++){const sheet=createCanvas(900,650),ctx=sheet.getContext('2d');ctx.fillStyle='#1a1026';ctx.fillRect(0,0,900,650);for(let row=0;row<5;row++){const type=W.types[group*5+row];ctx.fillStyle='#efce93';ctx.font='17px sans-serif';ctx.fillText(type.name,8,row*130+22);[0,4,8,12,16,20].forEach((tier,col)=>{ctx.fillStyle='#30203b';ctx.fillRect(col*150+2,row*130+29,145,96);W.draw(ctx,{type:type.id,tier},{x:col*150+20,y:row*130+38,scale:1.1});ctx.fillStyle='#d5bfdc';ctx.font='12px sans-serif';ctx.fillText(tier===0?'Starter':`Upgrade ${tier}`,col*150+69,row*130+80);});}fs.writeFileSync(path.join(process.env.GALA_CONTACT_SHEETS,`weapons-${group+1}.png`),sheet.toBuffer('image/png'));}
 console.log('PASS: 420 unique weapon renders; 1260 unlock boundaries; daily deduplication; 20 type menus; 21 tiers; locked preview/equip guard; coach export import; strength; equipped portrait/export; undo/redo; music gesture, mute, preference and volume.');
 dom.window.close();
})().catch(error=>{console.error(error);dom.window.close();process.exitCode=1;});
