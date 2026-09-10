(()=>{'use strict';const A=GalaAvatar,KEY='mominc-avatar-v1',SAVED='mominc-avatar-wardrobe-v1';let current=structuredClone(A.defaultLook),category=new URLSearchParams(location.search).get('section')==='weapons'?'weapons':'body',undo=[],redo=[],looks=[];
const $=id=>document.getElementById(id),status=message=>$('status').textContent=message;
try{const raw=localStorage.getItem(KEY);if(raw)current=A.normalize(JSON.parse(raw));const saved=JSON.parse(localStorage.getItem(SAVED)||'[]');if(Array.isArray(saved))looks=saved.slice(0,12).flatMap(x=>{try{return[A.normalize(x)];}catch{return[];}});}catch{status('Device storage is unavailable. You can still export your look.');}
function persist(){current.name=window.MBS_DJ.display();try{localStorage.setItem(KEY,JSON.stringify(current));window.dispatchEvent(new CustomEvent('mominc-avatar-change',{detail:structuredClone(current)}));return true;}catch{status('Could not save on this device. Download your look to keep it.');return false;}}
function change(fn){undo.push(structuredClone(current));if(undo.length>80)undo.shift();redo=[];fn();paint();persist();}
function makeCanvas(look){const c=document.createElement('canvas');c.setAttribute('aria-hidden','true');A.draw(c,look,{weapon:false});return c;}
const menus=[
 {id:'appearance',label:'Appearance',sections:['body','skin','face','hair','facial']},
 {id:'clothing',label:'Clothing',sections:['torso','shoulders','arms','hands','legs','feet','silk']},
 {id:'accessories',label:'Accessories',sections:['headwear','neck','held','back','base']},
 {id:'companion',label:'Companion',sections:['pet']},
 {id:'equipment',label:'Weapons',sections:['weapons','upgrades','progress']},
 {id:'saved',label:'My looks',sections:['saved','share']},
];
const extraLabels={silk:'Silk colour',weapons:'Weapon type',upgrades:'Upgrades',progress:'Coach progress',saved:'Saved avatars',share:'Save & share'};
const focusPoints={body:[32,48],skin:[32,27],face:[32,24],hair:[32,13],facial:[32,31],headwear:[32,10],neck:[32,36],torso:[32,48],shoulders:[32,38],arms:[32,49],hands:[32,59],legs:[32,70],feet:[32,82],held:[52,53],back:[32,45],base:[32,89],pet:[10,75],silk:[32,48],weapons:[80,40],upgrades:[80,40]};
let menu=menus.find(item=>item.sections.includes(category))?.id||'appearance';
const remembered=new Map([[menu,category]]);
const categoryLabel=id=>A.sections.find(section=>section.id===id)?.label||extraLabels[id];
function focusPreview(){
 const canvas=$('avatar'),point=focusPoints[category],weaponView=['weapons','upgrades'].includes(category);
 const anchor=weaponView&&canvas.width===64?[32,48]:point;
 canvas.style.setProperty('--preview-scale',point?'1.25':'1');
 canvas.style.setProperty('--focus-x',anchor?`${anchor[0]/canvas.width*100}%`:'50%');
 canvas.style.setProperty('--focus-y',anchor?`${anchor[1]/canvas.height*100}%`:'50%');
 canvas.dataset.focus=point?category:'full';
}
function selectCategory(id,toggle=false){
 const owner=menus.find(item=>item.sections.includes(id));if(!owner)return;
 const changed=menu!==owner.id;menu=owner.id;category=toggle&&category===id?null:id;
 if(category)remembered.set(menu,category);
 if(changed)paintSubmenus();$('options').scrollLeft=0;paint();
}
function paintSubmenus(){
 const active=menus.find(item=>item.id===menu);$('customizer-submenus').hidden=!active;$('subsections').replaceChildren();
 if(!active)return;$('menu-label').textContent=active.label;
 for(const id of active.sections){
  const button=document.createElement('button');button.type='button';button.dataset.section=id;button.textContent=categoryLabel(id);
  button.setAttribute('aria-controls',['saved','share'].includes(id)?'saved-looks':'wardrobe');button.setAttribute('aria-expanded',String(id===category));
  button.onclick=()=>selectCategory(id,true);$('subsections').append(button);
 }
}
function paintMenus(){
 for(const button of $('sections').children)button.setAttribute('aria-expanded',String(button.dataset.menu===menu));
 for(const button of $('subsections').children){const open=button.dataset.section===category;button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-pressed',String(open));}
}
function mountMenus(){
 for(const item of menus){
  const button=document.createElement('button');button.type='button';button.dataset.menu=item.id;button.textContent=item.label;button.setAttribute('aria-controls','customizer-submenus');
  button.onclick=()=>{if(menu===item.id){menu=null;category=null;}else{menu=item.id;category=remembered.get(menu)||item.sections[0];}paintSubmenus();paint();};$('sections').append(button);
 }
 paintSubmenus();
}

function paintOptions(){
 const weapons=['weapons','upgrades','progress'].includes(category),saved=['saved','share'].includes(category),silk=category==='silk',section=A.sections.find(s=>s.id===category);
 $('wardrobe').hidden=!category||saved;$('saved-looks').hidden=!saved;
 $('armory').hidden=!weapons;$('options').hidden=!section;$('silk-panel').hidden=!silk;$('retained-piece').hidden=true;
 $('looks').hidden=category!=='saved';$('save-actions').hidden=category!=='share';
 if(!category)return;
 if(saved){$('looks-title').textContent=categoryLabel(category);$('looks-note').textContent=category==='saved'?(looks.length?'Choose a saved avatar to wear it.':'No saved avatars yet. Open Save & share to keep this look.'):'Save on this device, download a portrait, or import and export a look.';return;}
 $('category-name').textContent=categoryLabel(category);
 if(weapons){
  $('category-note').textContent=category==='weapons'?'Choose a sci-fi weapon family.':category==='upgrades'?'A starter and 20 upgrades for your selected weapon.':'Your MYR5 coaching days earn weapon XP.';
  $('weapon-types').hidden=category!=='weapons';$('weapon-detail').hidden=category!=='upgrades';$('weapon-tiers').hidden=category!=='upgrades';
  for(const id of ['weapon-progress','coach-progress-import','weapon-day-note'])$(id).hidden=category!=='progress';
  window.GalaArmory?.refresh();return;
 }
 if(silk){$('category-note').textContent='Choose the colour of your Gala outfit.';$('dye-name').textContent=$('dyes').children[current.dye]?.getAttribute('aria-label')||'';return;}
 const left=$('options').scrollLeft;$('category-note').textContent=section.note;
 const retained=!section.choices.includes(current.parts[category]);$('retained-piece').hidden=!retained;
 $('retained-piece').textContent=retained?'Wearing your saved '+section.names[current.parts[category]]+'. Choose a piece below to change it.':'';
 $('options').replaceChildren();
 section.choices.forEach((id,index)=>{
  const name=section.names[id],button=document.createElement('button');button.type='button';button.className='option';button.dataset.piece=String(id);
  button.setAttribute('aria-label',name);button.setAttribute('aria-pressed',String(current.parts[category]===id));
  const variant=structuredClone(current);variant.parts[category]=id;button.append(makeCanvas(variant));
  const caption=document.createElement('span');caption.textContent=name;button.append(caption);
  button.onclick=()=>{change(()=>current.parts[category]=id);$('options').children[index].focus({preventScroll:true});status(name+' selected.');};$('options').append(button);
 });$('options').scrollLeft=left;
}

function paint(){current.name=window.MBS_DJ.display();A.draw($('avatar'),current);$('avatar').setAttribute('aria-label',(current.name||'Your alien')+' in '+A.sections.find(s=>s.id==='torso').names[current.parts.torso]);$('guest-name').textContent=current.name;$('undo').disabled=!undo.length;$('redo').disabled=!redo.length;paintMenus();focusPreview();for(const [i,b] of [...$('dyes').children].entries())b.setAttribute('aria-pressed',String(i===current.dye));paintOptions();window.GalaArmory?.refresh();}
function paintLooks(){$('looks').replaceChildren();looks.forEach((look,i)=>{const b=document.createElement('button');b.type='button';b.append(makeCanvas(look),document.createTextNode(look.name||'Unnamed guest'));b.setAttribute('aria-label','Wear '+(look.name||'saved look '+(i+1)));b.onclick=()=>{change(()=>current=structuredClone(look));status('Wearing '+(look.name||'your saved look')+'.');};$('looks').append(b);});}
function save(){current.name=window.MBS_DJ.display();const found=looks.findIndex(x=>x.name===current.name);if(found>=0)looks[found]=structuredClone(current);else looks.unshift(structuredClone(current));looks=looks.slice(0,12);try{localStorage.setItem(SAVED,JSON.stringify(looks));const ok=persist();paintLooks();paint();if(ok)status(current.name+' is saved to your guest list.');return ok;}catch{paintLooks();status('Could not save on this device. Export your look to keep it.');return false;}}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
const filename=()=>((current.name||'gala-guest').replace(/[^a-z0-9-]/gi,'-').replace(/-+/g,'-').slice(0,40)||'gala-guest');
mountMenus();
A.dyes.forEach((color,i)=>{const b=document.createElement('button');b.type='button';b.style.setProperty('--swatch',color);b.setAttribute('aria-label',['Nebula velvet','Plasma rose','Tidal silk','Reactor satin','Comet gold','Void blue','Solar copper','Lunar pearl','Obsidian smoke','Glacier mint'][i]);b.onclick=()=>change(()=>current.dye=i);$('dyes').append(b);});
window.addEventListener('mbs:dj-identity',()=>{paint();persist();});window.addEventListener('storage',e=>{if(e.key===window.MBS_DJ.KEY){paint();persist();}});
$('undo').onclick=()=>{if(!undo.length)return;redo.push(structuredClone(current));current=undo.pop();paint();persist();status('Last change undone.');};$('redo').onclick=()=>{if(!redo.length)return;undo.push(structuredClone(current));current=redo.pop();paint();persist();status('Change restored.');};
$('random').onclick=()=>{change(()=>{for(const s of A.sections)current.parts[s.id]=s.choices[Math.floor(Math.random()*s.choices.length)];current.dye=Math.floor(Math.random()*10);});status('MOM has chosen something extravagant.');};
$('save').onclick=save;$('export').onclick=()=>{current.name=window.MBS_DJ.display();download(new Blob([JSON.stringify(current,null,2)],{type:'application/json'}),filename()+'.json');status('Your look is exported. Import it here on another device.');};
$('png').onclick=()=>{const c=document.createElement('canvas');c.width=$('avatar').width*8;c.height=$('avatar').height*8;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage($('avatar'),0,0,c.width,c.height);c.toBlob(blob=>{if(blob){download(blob,filename()+'.png');status('Your pixel portrait is downloaded with a transparent background.');}},'image/png');};
$('import').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>30000)throw Error('Choose a small MOM Inc look file.');const look=A.normalize(JSON.parse(await f.text()));change(()=>current=look);status('Imported '+(current.name||'your alien')+'.');}catch(err){status(err instanceof SyntaxError?'That file is not a valid avatar look.':err.message);}finally{e.target.value='';}};
$('join').onclick=()=>{if(save())location.assign('/play/goon/');else{try{sessionStorage.setItem(KEY,JSON.stringify(current));}catch{}location.assign('/play/goon/');}};
window.GalaArmory?.mount({getLook:()=>current,change,status,paint,selectCategory});paint();paintLooks();
})();
