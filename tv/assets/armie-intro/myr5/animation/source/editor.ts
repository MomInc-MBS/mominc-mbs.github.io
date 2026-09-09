import {CreatureViewer} from './viewer';
import {GESTURES,type Gesture} from './motion';
import {REGIONS,LABELS,STYLES,EYE_LAYOUTS,PUPILS,COACHES,RECIPE_KEY,MOTION_KEY,MAX_IMPORT_BYTES,fresh,importCreature,loadRecipe,motionSettings} from './profile';
import type {Design,Region} from './creator/design';
export {CreatureViewer,GESTURES,importCreature};
const download=(blob:Blob,name:string)=>{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);};
const $=(id:string)=>document.getElementById(id)!;
let recipe:Design=fresh(),undo:Design[]=[],redo:Design[]=[],selected:Region='head',ready=false,editGeneration=0;
let settings=motionSettings(null),initialError='';
try{recipe=loadRecipe(localStorage);settings=motionSettings(localStorage.getItem(MOTION_KEY));}catch{initialError='Your saved creature could not be read. Import a recipe to restore it.';}
const systemMotion=matchMedia('(prefers-reduced-motion: reduce)');
const base=document.body.dataset.modelBase?new URL(document.body.dataset.modelBase,location.href).href:new URL('../',import.meta.url).href;
let viewer:CreatureViewer;
function tell(text:string){$('creatureStatus').textContent=text;}
function sync(){
 for(const key of ['eyeLayout','fingers','toes','eye','pupil','coach','fur','iris','pupilSize','detail']){const input=$(key) as HTMLInputElement;input.value=String(recipe[key as keyof Design]);const out=document.getElementById(key+'Value');if(out)out.textContent=Number(input.value).toFixed(2);}
 for(const button of document.querySelectorAll<HTMLButtonElement>('[data-region]'))button.setAttribute('aria-pressed',String(button.dataset.region===selected));
 for(const button of document.querySelectorAll<HTMLButtonElement>('[data-style]'))button.setAttribute('aria-pressed',String(Number(button.dataset.style)===recipe.styles[selected]));
 $('partLabel').textContent=LABELS[selected];$('styleLabel').textContent=STYLES[recipe.styles[selected]].name;
 ($('undo') as HTMLButtonElement).disabled=!undo.length;($('redo') as HTMLButtonElement).disabled=!redo.length;
}
async function render(message:string,persist=false){
 const generation=++editGeneration;ready=false;($('exportGLB') as HTMLButtonElement).disabled=true;sync();tell('Updating your creature…');
 try{const applied=await viewer.setRecipe(recipe);if(!applied||generation!==editGeneration)return;ready=true;($('exportGLB') as HTMLButtonElement).disabled=false;
  if(persist){try{localStorage.setItem(RECIPE_KEY,JSON.stringify(recipe));window.dispatchEvent(new CustomEvent('myr5:recipe',{detail:recipe}));tell(message+' Saved on this device.');}catch{tell(message+' Storage is unavailable; export your recipe to keep it.');}}
  else tell(message);
 }catch(error){if(generation===editGeneration)tell('Could not update the creature. '+(error as Error).message);}
}
function commit(next:Design){if(JSON.stringify(next)===JSON.stringify(recipe))return;undo.push(recipe);undo=undo.slice(-40);redo=[];recipe=next;render('Creature updated.',true);}
function options(id:string,entries:ReadonlyArray<readonly [unknown,string]>){for(const [value,label] of entries){const o=document.createElement('option');o.value=String(value);o.textContent=label;$(id).append(o);}}
options('eyeLayout',Object.entries(EYE_LAYOUTS).map(([key,value])=>[key,value.label]));options('pupil',PUPILS);options('coach',COACHES.map(c=>[c.id,c.name]));
for(const [id,min,max] of [['fingers',2,6],['toes',1,6]] as const)options(id,Array.from({length:max-min+1},(_,i)=>[i+min,String(i+min)]));
for(const region of REGIONS){const button=document.createElement('button');button.textContent=LABELS[region];button.dataset.region=region;button.onclick=()=>{selected=region;sync();};$('parts').append(button);}
STYLES.forEach((style,index)=>{const button=document.createElement('button');button.dataset.style=String(index);const swatch=document.createElement('span');swatch.className='swatch';swatch.style.background=`linear-gradient(135deg,${style.primary},${style.accent})`;swatch.setAttribute('aria-hidden','true');const label=document.createElement('span');label.textContent=style.name;button.append(swatch,label);button.onclick=()=>commit({...recipe,styles:{...recipe.styles,[selected]:index}});$('styles').append(button);});
Object.entries(GESTURES).forEach(([id,gesture])=>{const button=document.createElement('button');button.textContent=gesture.label;button.dataset.gesture=id;button.setAttribute('aria-pressed',String(id==='idle'));button.onclick=()=>{viewer.play(id as Gesture);document.querySelectorAll('[data-gesture]').forEach(b=>b.setAttribute('aria-pressed',String((b as HTMLElement).dataset.gesture===id)));$('motionLabel').textContent=gesture.label;};$('gestures').append(button);});
for(const id of ['eyeLayout','fingers','toes','eye','pupil','coach','fur','iris','pupilSize','detail'])$(id).addEventListener('change',()=>{const input=$(id) as HTMLInputElement;const value=['fingers','toes','fur','iris','pupilSize','detail'].includes(id)?Number(input.value):input.value;commit({...recipe,[id]:value});});
document.querySelectorAll<HTMLInputElement>('input[type=range]').forEach(input=>input.addEventListener('input',()=>{const output=document.getElementById(input.id+'Value');if(output)output.textContent=Number(input.value).toFixed(2);}));
$('applyAll').onclick=()=>commit({...recipe,styles:Object.fromEntries(REGIONS.map(r=>[r,recipe.styles[selected]])) as Design['styles']});
$('undo').onclick=()=>{if(!undo.length)return;redo.push(recipe);recipe=undo.pop()!;render('Undo applied.',true);};
$('redo').onclick=()=>{if(!redo.length)return;undo.push(recipe);recipe=redo.pop()!;render('Redo applied.',true);};
$('original').onclick=()=>commit(fresh());
$('importFile').addEventListener('change',async event=>{const input=event.target as HTMLInputElement,file=input.files?.[0];if(!file)return;try{if(file.size>MAX_IMPORT_BYTES)throw Error('Choose a MYR5 recipe smaller than 64 KB.');const next=importCreature(await file.text());commit(next);}catch(error){tell((error as Error).message);}finally{input.value='';}});
$('exportRecipe').onclick=()=>download(new Blob([JSON.stringify(recipe,null,2)],{type:'application/json'}),'myr5-recipe.json');
$('exportGLB').onclick=async()=>{if(!ready)return;try{tell('Preparing your animated model…');download(await viewer.exportGLB(),'myr5-animated.glb');tell('Animated model exported with ten gestures. Keep the recipe for future customization.');}catch(error){tell((error as Error).message);}};
$('front').onclick=()=>viewer.resetView();
$('pauseMotion').onclick=()=>{viewer.setPaused(!viewer.paused);$('pauseMotion').textContent=viewer.paused?'Play motion':'Pause motion';$('pauseMotion').setAttribute('aria-pressed',String(viewer.paused));};
function applyMotion(){viewer.setSettings({...settings,reduced:settings.reduced||systemMotion.matches});}
($('amount') as HTMLInputElement).value=String(settings.amount);$('amountValue').textContent=settings.amount.toFixed(2);($('ambient') as HTMLInputElement).checked=settings.ambient;($('reduced') as HTMLInputElement).checked=settings.reduced;
for(const id of ['amount','ambient','reduced'])$(id).addEventListener('change',()=>{settings={amount:Number(($('amount') as HTMLInputElement).value),ambient:($('ambient') as HTMLInputElement).checked,reduced:($('reduced') as HTMLInputElement).checked};applyMotion();try{localStorage.setItem(MOTION_KEY,JSON.stringify(settings));}catch{tell('Motion changed for this visit. Storage is unavailable.');}});
systemMotion.addEventListener('change',applyMotion);
window.addEventListener('storage',event=>{if(event.key===RECIPE_KEY&&event.newValue){try{recipe=importCreature(event.newValue);undo=[];redo=[];render('Creature updated from another app tab.');}catch{tell('An invalid creature update was ignored.');}}});
const motionIndicator=setInterval(()=>{const current=viewer?.motion?.current;if(!current)return;$('motionLabel').textContent=GESTURES[current].label;document.querySelectorAll<HTMLButtonElement>('[data-gesture]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.gesture===current)));},250);
window.addEventListener('pagehide',()=>{clearInterval(motionIndicator);viewer?.dispose();});
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
try{viewer=new CreatureViewer($('creatureStage'),base);applyMotion();render(initialError||'Your creature is ready.');(window as any).myr5Companion={get recipe(){return recipe;},get viewer(){return viewer;},get ready(){return ready;},importRecipe:(raw:string)=>commit(importCreature(raw))};}
catch(error){tell('3D could not start. '+(error as Error).message);}
