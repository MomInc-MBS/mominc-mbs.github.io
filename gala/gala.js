(()=>{'use strict';const A=GalaAvatar,KEY='mominc-avatar-v1',SAVED='mominc-avatar-wardrobe-v1';let current=structuredClone(A.defaultLook),category=new URLSearchParams(location.search).get('section')==='weapons'?'weapons':'body',undo=[],redo=[],looks=[];
const $=id=>document.getElementById(id),status=message=>$('status').textContent=message;
try{const raw=localStorage.getItem(KEY);if(raw)current=A.normalize(JSON.parse(raw));const saved=JSON.parse(localStorage.getItem(SAVED)||'[]');if(Array.isArray(saved))looks=saved.slice(0,12).flatMap(x=>{try{return[A.normalize(x)];}catch{return[];}});}catch{status('Device storage is unavailable. You can still export your look.');}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(current));window.dispatchEvent(new CustomEvent('mominc-avatar-change',{detail:structuredClone(current)}));return true;}catch{status('Could not save on this device. Download your look to keep it.');return false;}}
function change(fn){undo.push(structuredClone(current));if(undo.length>80)undo.shift();redo=[];fn();paint();persist();}
function makeCanvas(look){const c=document.createElement('canvas');c.setAttribute('aria-hidden','true');A.draw(c,look,{weapon:false});return c;}
function paintOptions(){
 const weapons=category==='weapons';$('armory').hidden=!weapons;$('options').hidden=weapons;
 document.querySelector?.('.dyes')?.toggleAttribute('hidden',weapons);
 if(weapons){$('category-name').textContent='Weapons';$('category-note').textContent='20 sci-fi weapon types · a starter and 20 upgrades each.';$('retained-piece').hidden=true;window.GalaArmory?.refresh();return;}
 const left=$('options').scrollLeft,section=A.sections.find(s=>s.id===category);
 $('category-name').textContent=section.label;$('category-note').textContent=section.note;
 const retained=!section.choices.includes(current.parts[category]);
 $('retained-piece').hidden=!retained;
 $('retained-piece').textContent=retained?'Wearing your saved '+section.names[current.parts[category]]+'. Choose a piece below to change it.':'';
 $('options').replaceChildren();
 section.choices.forEach((id,index)=>{
  const name=section.names[id],button=document.createElement('button');
  button.type='button';button.className='option';button.dataset.piece=String(id);
  button.setAttribute('aria-label',name);button.setAttribute('aria-pressed',String(current.parts[category]===id));
  const variant=structuredClone(current);variant.parts[category]=id;button.append(makeCanvas(variant));
  const caption=document.createElement('span');caption.textContent=name;button.append(caption);
  button.onclick=()=>{change(()=>current.parts[category]=id);$('options').children[index].focus({preventScroll:true});status(name+' selected.');};
  $('options').append(button);
 });
 $('options').scrollLeft=left;
}
function paint(){A.draw($('avatar'),current);$('avatar').setAttribute('aria-label',(current.name||'Your alien')+' in '+A.sections.find(s=>s.id==='torso').names[current.parts.torso]);if(document.activeElement!==$('guest-name'))$('guest-name').value=current.name;$('undo').disabled=!undo.length;$('redo').disabled=!redo.length;for(const b of $('sections').children)b.setAttribute('aria-pressed',String(b.dataset.section===category));for(const [i,b] of [...$('dyes').children].entries())b.setAttribute('aria-pressed',String(i===current.dye));paintOptions();window.GalaArmory?.refresh();}
function paintLooks(){$('looks').replaceChildren();looks.forEach((look,i)=>{const b=document.createElement('button');b.type='button';b.append(makeCanvas(look),document.createTextNode(look.name||'Unnamed guest'));b.setAttribute('aria-label','Wear '+(look.name||'saved look '+(i+1)));b.onclick=()=>{change(()=>current=structuredClone(look));status('Wearing '+(look.name||'your saved look')+'.');};$('looks').append(b);});}
function save(){current.name=$('guest-name').value.trim().slice(0,32)||'Guest from the Ninth Moon';const found=looks.findIndex(x=>x.name===current.name);if(found>=0)looks[found]=structuredClone(current);else looks.unshift(structuredClone(current));looks=looks.slice(0,12);try{localStorage.setItem(SAVED,JSON.stringify(looks));const ok=persist();paintLooks();paint();if(ok)status(current.name+' is saved to your guest list.');return ok;}catch{paintLooks();status('Could not save on this device. Export your look to keep it.');return false;}}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
const filename=()=>((current.name||'gala-guest').replace(/[^a-z0-9-]/gi,'-').replace(/-+/g,'-').slice(0,40)||'gala-guest');
A.sections.forEach((section,i)=>{const b=document.createElement('button');b.type='button';b.dataset.section=section.id;const n=document.createElement('span');n.textContent=String(i+1).padStart(2,'0');b.append(n,document.createTextNode(section.label));b.onclick=()=>{category=section.id;$('options').scrollLeft=0;paint();};$('sections').append(b);});
const weaponCategory=document.createElement('button');weaponCategory.type='button';weaponCategory.dataset.section='weapons';weaponCategory.textContent='Weapons';weaponCategory.onclick=()=>{category='weapons';paint();};$('sections').prepend(weaponCategory);
A.dyes.forEach((color,i)=>{const b=document.createElement('button');b.type='button';b.style.setProperty('--swatch',color);b.setAttribute('aria-label',['Nebula velvet','Plasma rose','Tidal silk','Reactor satin','Comet gold','Void blue','Solar copper','Lunar pearl','Obsidian smoke','Glacier mint'][i]);b.onclick=()=>change(()=>current.dye=i);$('dyes').append(b);});
$('guest-name').addEventListener('change',()=>change(()=>current.name=$('guest-name').value.trim().slice(0,32)));
$('undo').onclick=()=>{if(!undo.length)return;redo.push(structuredClone(current));current=undo.pop();paint();persist();status('Last change undone.');};$('redo').onclick=()=>{if(!redo.length)return;undo.push(structuredClone(current));current=redo.pop();paint();persist();status('Change restored.');};
$('random').onclick=()=>{change(()=>{for(const s of A.sections)current.parts[s.id]=s.choices[Math.floor(Math.random()*s.choices.length)];current.dye=Math.floor(Math.random()*10);});status('MOM has chosen something extravagant.');};
$('save').onclick=save;$('export').onclick=()=>{current.name=$('guest-name').value.trim().slice(0,32);download(new Blob([JSON.stringify(current,null,2)],{type:'application/json'}),filename()+'.json');status('Your look is exported. Import it here on another device.');};
$('png').onclick=()=>{const c=document.createElement('canvas');c.width=$('avatar').width*8;c.height=$('avatar').height*8;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage($('avatar'),0,0,c.width,c.height);c.toBlob(blob=>{if(blob){download(blob,filename()+'.png');status('Your pixel portrait is downloaded with a transparent background.');}},'image/png');};
$('import').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>30000)throw Error('Choose a small MOM Inc look file.');const look=A.normalize(JSON.parse(await f.text()));change(()=>current=look);status('Imported '+(current.name||'your alien')+'.');}catch(err){status(err instanceof SyntaxError?'That file is not a valid avatar look.':err.message);}finally{e.target.value='';}};
$('join').onclick=()=>{if(save())location.assign('/play/goon/');else{try{sessionStorage.setItem(KEY,JSON.stringify(current));}catch{}location.assign('/play/goon/');}};
window.GalaArmory?.mount({getLook:()=>current,change,status,paint});paint();paintLooks();
})();
