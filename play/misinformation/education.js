// MOM's Public Education Program: one pure ruleset for site and installed PWA.
// prompt (open-ended, easy) -> 100 stage points -> QUIZ TIME -> lesson ->
// MOM'S COMMENTARY -> Continue -> next gate. Twenty cleared gates = victory.
// Nothing here ends a run early: no hull, no round cap, no station distance.
import {POINTS,STATION,normalize} from './engine.js';
export const SCHEMA=2,STAGE_POINTS=100,GATES=20;
export const DEFAULT_COMMENTARY='Mother would never treat you like that. Why are you still running, darling?';
const PHASES=['prompt','quiz','lesson','commentary','victory'];
const strip=s=>normalize(String(s).trim().toLowerCase().replace(/^(a|an|the|some)\s+/,''));
const indexes=new WeakMap();
function indexOf(prompt){
 let map=indexes.get(prompt);
 if(!map){map=new Map();for(const a of prompt.answers)for(const alias of [a.name,...a.aliases])map.set(strip(alias),a);indexes.set(prompt,map);}
 return map;
}
/** Known answer for this prompt (aliases, case/spacing, a/an/the, simple plurals) or undefined. */
export function lookupAnswer(prompt,text){
 const key=strip(text),map=indexOf(prompt);
 return map.get(key)||(key.length>3?map.get(key.replace(/(es|s)$/,''))||map.get(key.replace(/s$/,'')):undefined);
}
export function freshCourse(content,{now=Date.now(),seed=Math.floor(Math.random()*1e9)}={}){
 const s={schema:SCHEMA,kind:'education',contentVersion:content.CONTENT_VERSION,runId:`edu-${now.toString(36)}-${seed.toString(36)}`,
  startedAt:new Date(now).toISOString(),seed,stage:0,stagePoints:0,total:0,promptCount:0,promptId:null,
  stagePrompts:[],stageAnswers:[],history:[],cleared:[],wrong:[],phase:'prompt',victory:false};
 return openPrompt(s,content);
}
function openPrompt(s,content){
 const list=content.prompts,used=new Set(s.stagePrompts.length>=list.length?[]:s.stagePrompts);
 let i=(s.seed+s.promptCount*11)%list.length;
 while(used.has(list[i].id))i=(i+1)%list.length;
 return {...s,promptId:list[i].id,promptCount:s.promptCount+1,stagePrompts:[...(used.size?s.stagePrompts:[]),list[i].id]};
}
export const promptOf=(s,content)=>content.prompts.find(p=>p.id===s.promptId);
export const gateOf=(s,content)=>content.gates[s.stage];
/** Visual distance for the existing scene/minimap: gate i occupies level i. */
export function distanceOf(s){
 if(s.victory&&s.phase==='victory')return STATION;
 const within=Math.min(1,s.stagePoints/STAGE_POINTS)*4999;
 return Math.min(STATION-1,Math.min(s.stage,18)*5000+within);
}
export function submitAnswer(s,text,content){
 if(s.phase!=='prompt')return {state:s,result:{ok:false,reason:'closed'}};
 const prompt=promptOf(s,content),found=typeof text==='string'?lookupAnswer(prompt,text):undefined;
 if(!found){
  const example=prompt.answers.filter(a=>a.tier===0&&!s.stageAnswers.includes(strip(a.name)))[0]||prompt.answers[0];
  return {state:s,result:{ok:false,reason:'unknown',example:example.name}};
 }
 const key=strip(found.name);
 // Duplicate answers (any alias or spelling) score once per gate, never across the course.
 if(s.stageAnswers.includes(key))return {state:s,result:{ok:false,reason:'duplicate',name:found.name}};
 const points=POINTS[found.tier],stagePoints=Math.min(STAGE_POINTS,s.stagePoints+points);
 let next={...s,stagePoints,total:s.total+points,stageAnswers:[...s.stageAnswers,key],
  history:[...s.history,{gate:gateOf(s,content).id,prompt:prompt.id,answer:key,tier:found.tier,points}].slice(-200)};
 next=stagePoints>=STAGE_POINTS?{...next,phase:'quiz',wrong:[]}:openPrompt(next,content);
 return {state:next,result:{ok:true,name:found.name,tier:found.tier,points,quiz:next.phase==='quiz'}};
}
/** Pass, timeout or blank: zero points, another prompt, no penalty. */
export function passPrompt(s,content){return s.phase==='prompt'?openPrompt(s,content):s;}
export function pickChoice(s,choiceId,content){
 if(s.phase!=='quiz')return {state:s,result:{ok:false,reason:'closed'}};
 const gate=gateOf(s,content);
 if(!gate.choices.some(c=>c.id===choiceId))return {state:s,result:{ok:false,reason:'invalid'}};
 if(!gate.acceptedAnswerIds.includes(choiceId))
  return {state:{...s,wrong:s.wrong.includes(choiceId)?s.wrong:[...s.wrong,choiceId]},result:{ok:false,reason:'wrong'}};
 // The pass is committed here, before any lesson is read; replays never re-award.
 const cleared=s.cleared.includes(gate.id)?s.cleared:[...s.cleared,gate.id];
 const victory=cleared.length>=GATES;
 return {state:{...s,cleared,victory,phase:'lesson'},result:{ok:true,gate:gate.id,victory:victory&&!s.victory}};
}
export const toCommentary=s=>s.phase==='lesson'?{...s,phase:'commentary'}:s;
/** Continue is a no-op unless the commentary is showing, so double taps and reloads cannot skip a gate. */
export function continueCourse(s,content){
 if(s.phase!=='commentary')return s;
 if(s.victory)return {...s,phase:'victory'};
 return openPrompt({...s,stage:s.stage+1,stagePoints:0,stagePrompts:[],stageAnswers:[],wrong:[],phase:'prompt'},content);
}
export const commentaryOf=gate=>gate.momLine||DEFAULT_COMMENTARY;
/** Validate a saved course against the bundled content; null means start fresh (and archive the old one). */
export function restoreCourse(raw,content){
 try{
  const s=typeof raw==='string'?JSON.parse(raw):raw;
  if(!s||s.schema!==SCHEMA||s.kind!=='education'||s.contentVersion!==content.CONTENT_VERSION||!PHASES.includes(s.phase))return null;
  const n=s.cleared?.length;
  if(!Array.isArray(s.cleared)||!s.cleared.every((id,i)=>id===content.gates[i]?.id))return null;
  const passed=['lesson','commentary','victory'].includes(s.phase);
  if(!Number.isInteger(s.stage)||s.stage!==(passed?n-1:n)||s.stage<0||s.stage>=GATES)return null;
  if(!Number.isSafeInteger(s.total)||s.total<0||!Number.isInteger(s.stagePoints)||s.stagePoints<0||s.stagePoints>STAGE_POINTS)return null;
  if(!Array.isArray(s.stageAnswers)||!Array.isArray(s.stagePrompts)||!Array.isArray(s.history)||!Array.isArray(s.wrong))return null;
  if(s.phase==='quiz'&&s.stagePoints<STAGE_POINTS||s.phase==='prompt'&&(s.stagePoints>=STAGE_POINTS||!promptOf(s,content)))return null;
  if(s.victory!==(n>=GATES)||s.phase==='victory'&&!s.victory)return null;
  return s;
 }catch{return null;}
}
