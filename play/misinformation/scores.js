// This board lives only in this browser. No player data is sent to a server.
export const SCORE_KEY='mom-misinformation-scores-v1';
export const MAX_SAVED_RUNS=100;
const OUTCOMES=new Set(['escaped','dead','abandoned']);
export function newRunId(){
 try{if(globalThis.crypto?.randomUUID)return globalThis.crypto.randomUUID();}catch{}
 return `flight-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}
function validDate(value){return typeof value==='string'&&Number.isFinite(Date.parse(value));}
function clean(run){
 if(!run||typeof run.id!=='string'||!run.id.length||run.id.length>150||!OUTCOMES.has(run.outcome)||
 !Number.isSafeInteger(run.score)||run.score<0||!Number.isFinite(run.distance)||run.distance<0||run.distance>100000||
 !Number.isInteger(run.hits)||run.hits<0||run.hits>3||!Number.isSafeInteger(run.rounds)||run.rounds<0||
 !validDate(run.startedAt)||!validDate(run.finishedAt)||Date.parse(run.finishedAt)<Date.parse(run.startedAt)||
 typeof run.pristine!=='boolean'||(run.outcome==='escaped'&&(run.distance!==100000||!run.pristine||run.hits>=3))||
 (run.outcome==='dead'&&run.hits!==3))return null;
 return {id:run.id,outcome:run.outcome,score:run.score,distance:run.distance,hits:run.hits,rounds:run.rounds,
 pristine:run.pristine,startedAt:new Date(run.startedAt).toISOString(),finishedAt:new Date(run.finishedAt).toISOString()};
}
export function rankRuns(runs){return [...runs].sort((a,b)=>b.distance-a.distance||b.score-a.score||Date.parse(b.finishedAt)-Date.parse(a.finishedAt)||a.id.localeCompare(b.id));}
function decode(raw){
 if(!raw)return {runs:[],bestScore:0,bestDistance:0};
 const data=JSON.parse(raw);
 if(data?.version!==1||!Array.isArray(data.runs))throw new Error('Unsupported scoreboard');
 const unique=new Map();
 for(const value of data.runs){const run=clean(value);if(run&&!unique.has(run.id))unique.set(run.id,run);}
 const runs=[...unique.values()];
 // Optional aggregates keep version-one data readable while retaining records
 // that have since fallen out of the distance-ranked table.
 const savedScore=Number.isSafeInteger(data.bestScore)&&data.bestScore>=0?data.bestScore:0;
 const savedDistance=Number.isFinite(data.bestDistance)&&data.bestDistance>=0&&data.bestDistance<=100000?data.bestDistance:0;
 return {runs:rankRuns(runs).slice(0,MAX_SAVED_RUNS),
  bestScore:Math.max(savedScore,0,...runs.map(r=>r.score)),
  bestDistance:Math.max(savedDistance,0,...runs.map(r=>r.distance))};
}
export function createScoreStore(storage){
 let available=true,runs=[],bestScore=0,bestDistance=0;
 try{if(arguments.length===0)storage=globalThis.localStorage;if(!storage)throw new Error('No storage');}
 catch{available=false;}
 function merge(saved){
  const combined=[...new Map([...saved.runs,...runs].map(r=>[r.id,r])).values()];
  bestScore=Math.max(bestScore,saved.bestScore,0,...combined.map(r=>r.score));
  bestDistance=Math.max(bestDistance,saved.bestDistance,0,...combined.map(r=>r.distance));
  runs=rankRuns(combined).slice(0,MAX_SAVED_RUNS);
 }
 function refresh(){if(available){try{merge(decode(storage.getItem(SCORE_KEY)));}catch{available=false;}}}
 refresh();
 const snapshot=()=>{refresh();return {available,runs:runs.map(r=>({...r})),bestDistance,bestScore,
  escapes:runs.filter(r=>r.outcome==='escaped').length};};
 return {
  snapshot,
  record(value){
   const run=clean(value);if(!run)throw new Error('Invalid finalized flight');
   // Re-read before writing to merge scores finished by another browser tab.
   refresh();
   bestScore=Math.max(bestScore,run.score);bestDistance=Math.max(bestDistance,run.distance);
   if(!runs.some(r=>r.id===run.id))runs=rankRuns([...runs,run]).slice(0,MAX_SAVED_RUNS);
   if(available){try{storage.setItem(SCORE_KEY,JSON.stringify({version:1,runs,bestScore,bestDistance}));}catch{available=false;}}
   return snapshot();
  }
 };
}
