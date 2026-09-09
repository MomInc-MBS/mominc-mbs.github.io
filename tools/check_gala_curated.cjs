/* Run with Node: node tools/check_gala_curated.cjs. No browser required. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),avatarSource=fs.readFileSync(path.join(root,'gala/avatar.js'),'utf8'),controllerSource=fs.readFileSync(path.join(root,'gala/gala.js'),'utf8');
function boot(saved){
 const ids=new Map(),storage=new Map(saved?[['mominc-avatar-v1',JSON.stringify(saved)]]:[]),downloads=[];
 const document={activeElement:null,getElementById:id=>{if(!ids.has(id))ids.set(id,new Element('div'));return ids.get(id);},createElement:tag=>new Element(tag),createTextNode:text=>({textContent:text})};
 class Element{
  constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.attributes={};this.style={setProperty(){}};this.value='';this.scrollLeft=0;this.hidden=false;}
  append(...items){this.children.push(...items);}prepend(...items){this.children.unshift(...items);}replaceChildren(...items){this.children=[...items];}
  setAttribute(key,value){this.attributes[key]=String(value);}getAttribute(key){return this.attributes[key];}
  addEventListener(type,handler){this['on'+type]=handler;}focus(){document.activeElement=this;}click(){this.onclick?.();}
 }
 let seed=20260909;const math=Object.create(Math);math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const scope={window:{dispatchEvent(){}},document,localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},sessionStorage:{setItem(){}},location:{assign(){}},URLSearchParams,structuredClone,Math:math,Blob,CustomEvent:class{},URL:{createObjectURL:blob=>{downloads.push(blob);return 'blob:test';},revokeObjectURL(){}},setTimeout(){}};
 vm.createContext(scope);vm.runInContext(avatarSource,scope);scope.GalaAvatar=scope.window.GalaAvatar;
 scope.GalaAvatar.draw=(canvas,look)=>{canvas.look=structuredClone(look);};vm.runInContext(controllerSource,scope);
 return {A:scope.GalaAvatar,$:document.getElementById,document,downloads,look:()=>JSON.parse(storage.get('mominc-avatar-v1')),select:id=>document.getElementById('sections').children.find(b=>b.dataset.section===id).click()};
}
(async()=>{
 const app=boot();assert.equal(app.A.sections.length,17);
 for(const s of app.A.sections){
  assert.equal(s.choices.length,20,s.id);assert.equal(new Set(s.choices).size,20,s.id);
  assert.ok(s.choices.includes(0),s.id+' keeps the default or empty choice');
  assert.equal(new Set(s.choices.map(id=>id%10)).size,10,s.id+' covers all base types');
  assert.ok(s.choices.every(id=>Number.isInteger(id)&&id>=0&&id<s.names.length));
  app.select(s.id);assert.equal(app.$('options').children.length,20);
  // Exercise non-contiguous IDs, including entries above 19, and retained focus.
  for(let index=0;index<20;index++){
   const button=app.$('options').children[index],id=s.choices[index];
   assert.equal(button.children[0].look.parts[s.id],id);assert.equal(button.getAttribute('aria-label'),s.names[id]);button.click();
   assert.equal(app.look().parts[s.id],id);assert.equal(app.document.activeElement,app.$('options').children[index]);
   assert.equal(app.$('options').children.filter(b=>b.getAttribute('aria-pressed')==='true').length,1);
  }
  for(let id=0;id<40;id++){const old=structuredClone(app.A.defaultLook);old.parts[s.id]=id;assert.equal(app.A.normalize(old).parts[s.id],id);}
 }
 for(let i=0;i<100;i++){app.$('random').click();for(const s of app.A.sections)assert.ok(s.choices.includes(app.look().parts[s.id]),s.id+' randomizer escaped shortlist');}
 const legacy=structuredClone(app.A.defaultLook);legacy.name='Earlier guest';for(const s of app.A.sections)legacy.parts[s.id]=s.names.findIndex((_,id)=>!s.choices.includes(id));
 const old=boot(legacy);for(const s of old.A.sections){old.select(s.id);assert.equal(old.$('options').children.length,20);assert.equal(old.$('retained-piece').hidden,false);assert.ok(old.$('retained-piece').textContent.includes(s.names[legacy.parts[s.id]]));}
 old.$('dyes').children[3].click();assert.deepEqual(old.look().parts,legacy.parts,'unrelated edits preserve legacy pieces');
 old.select('body');const before=old.look();old.$('options').children[19].click();const after=old.look();assert.equal(old.$('retained-piece').hidden,true);
 old.$('undo').click();assert.deepEqual(old.look(),before);assert.equal(old.$('retained-piece').hidden,false);old.$('redo').click();assert.deepEqual(old.look(),after);
 old.$('save').click();old.$('random').click();old.$('looks').children[0].click();assert.deepEqual(old.look(),after);
 old.$('export').click();const exported=JSON.parse(await old.downloads.at(-1).text());assert.deepEqual(exported,after);
 const importFile=look=>({target:{files:[{size:1024,text:async()=>JSON.stringify(look)}],value:'look.json'}});
 await old.$('import').onchange(importFile(legacy));assert.deepEqual(old.look(),legacy);assert.equal(old.$('retained-piece').hidden,false);
 const invalid=structuredClone(legacy);invalid.parts.body=40;await old.$('import').onchange(importFile(invalid));assert.deepEqual(old.look(),legacy);assert.match(old.$('status').textContent,/unknown wardrobe/);
 const prePet=structuredClone(legacy);delete prePet.parts.pet;assert.equal(old.A.normalize(prePet).parts.pet,0);
 console.log('PASS: 17 categories, all 340 selections/previews/focus, 680 legacy IDs, randomizer, save, import/export, undo/redo, and invalid input.');
})().catch(error=>{console.error(error);process.exitCode=1;});
