import test from 'node:test';import assert from 'node:assert/strict';
import {POINTS,freshRun,lookup,beginQuestion,acceptAnswer,classify,skip,selectQuestion,STATION,APPROACH} from '../../play/misinformation/engine.js';
import {subjects,questions} from '../../play/misinformation/catalog.js';
const question=questions[0];const rare=subjects.find(s=>s.id===question.answers.find(a=>a.tier===5).id);const common=subjects.find(s=>s.id===question.answers.find(a=>a.tier===0).id);
const wrongChoice=rare.classification==='event'?'claim':'event';
function answer(state,s=rare,choice=s.classification){return classify(acceptAnswer(beginQuestion(state,question),s,question),s,question,choice);}
test('source-compatible scores, aliases and category membership',()=>{assert.deepEqual(POINTS,[10,15,30,60,85,100]);assert.equal(lookup('  MK-Ultra ',questions[1],subjects).id,'mkultra');assert.equal(lookup('Ted Bundy',question,subjects),undefined);assert.equal(lookup('unlisted answer',question,subjects),undefined);});
test('rare answers advance faster and dock after fourteen correct classifications',()=>{let s=freshRun();for(let i=0;i<14;i++)s=answer(s);assert.equal(s.phase,'escaped');assert.equal(s.distance,STATION);assert.equal(s.score,1400);assert.throws(()=>beginQuestion(s,question));});
test('ordinary correct answers reach every level and dock with no permanent low-tier lock',()=>{
 let s=freshRun();for(let i=0;i<19;i++)s=answer(s,common);
 assert.equal(s.distance,APPROACH);assert.equal(s.phase,'result');assert.equal(s.pristine,false);
 s=answer(s,common);assert.equal(s.phase,'escaped');assert.equal(s.distance,STATION);assert.equal(s.score,200);
 let mixed=answer(freshRun());mixed=answer(mixed,common);
 assert.equal(mixed.pristine,false);while(mixed.phase==='result')mixed=answer(mixed);
 assert.equal(mixed.phase,'escaped');
});
test('three classification hits terminate, two are survivable and award no fuel',()=>{let s=freshRun();s=answer(s,rare,wrongChoice);s=answer(s,rare,wrongChoice);assert.equal(s.phase,'result');assert.equal(s.distance,0);assert.equal(s.hits,2);s=answer(s,rare,wrongChoice);assert.equal(s.phase,'dead');assert.equal(s.hits,3);assert.throws(()=>beginQuestion(s,question));assert.deepEqual(freshRun(),freshRun());});
test('skips award no fuel or damage and do not prevent a later escape',()=>{
 let s=skip(beginQuestion(freshRun(),question,100));
 assert.equal(s.pristine,false);assert.equal(s.hits,0);assert.equal(s.rounds,1);assert.equal(s.phase,'result');assert.equal(s.distance,0);
 for(let i=0;i<20;i++)s=answer(s,common);assert.equal(s.phase,'escaped');
});
test('every prompt has multiple accepted answers, a top tier, and sources',()=>{for(const q of questions){assert.ok(q.answers.length>1);assert.ok(q.answers.some(a=>a.tier===5));for(const a of q.answers){const s=subjects.find(s=>s.id===a.id);assert.ok(s?.source.startsWith('https://'));assert.ok(['claim','event'].includes(s.classification));}}});
test('deeper pools unlock with distance; finite bank recycling is explicit',()=>{let s=freshRun();assert.ok(selectQuestion(s,questions,()=>0).question.band===0);s.distance=80000;const unlocked=questions.filter(q=>q.band<=6);s.seen=unlocked.map(q=>q.id);assert.equal(selectQuestion(s,questions).recycled,true);});
test('a completed question cannot be classified twice',()=>{const s=answer(freshRun());assert.throws(()=>classify(s,rare,question,'claim'));});

const layered=Array.from({length:8},(_,band)=>Array.from({length:3},(_,i)=>({id:`layer-${band}-${i}`,band}))).flat();
test('fresh current-depth questions outrank unseen surface leftovers',()=>{
 const s={...freshRun(),distance:80000};
 for(const random of [()=>0,()=>0.999])assert.equal(selectQuestion(s,layered,random).question.band,6);
 s.seen=layered.filter(q=>q.band===6).map(q=>q.id);
 assert.equal(selectQuestion(s,layered,()=>0).question.band,5);
});
test('three distinct current-depth prompts are reached before revisiting the previous layer',()=>{
 for(let band=0;band<8;band++){
  const s={...freshRun(),distance:band*12500},ids=[];
  for(let i=0;i<3;i++){
   const selected=selectQuestion(s,layered,()=>0);
   assert.equal(selected.question.band,band);assert.equal(selected.recycled,false);
   ids.push(selected.question.id);s.seen.push(selected.question.id);s.history.push({question:selected.question.id});
  }
  assert.equal(new Set(ids).size,3);
  if(band>0)assert.equal(selectQuestion(s,layered,()=>0).question.band,band-1);
 }
});
test('replay stays in current/previous layers and excludes the last three when alternatives exist',()=>{
 const s={...freshRun(),distance:50000,seen:layered.map(q=>q.id),
  history:[{question:'layer-4-0'},{question:'layer-4-1'},{question:'layer-3-0'}]};
 for(const random of [()=>0,()=>0.999]){
  const selected=selectQuestion(s,layered,random);
  assert.equal(selected.recycled,true);assert.ok([3,4].includes(selected.question.band));
  assert.ok(!s.history.some(h=>h.question===selected.question.id));
 }
});
test('app-style cycle resets preserve cooldown while exhausting all unlocked questions',()=>{
 const s={...freshRun(),distance:95000},recent=[];
 for(let i=0;i<60;i++){
  const selected=selectQuestion(s,layered,()=>0);
  assert.ok(selected.question.band<=7);
  assert.ok(!recent.includes(selected.question.id));
  if(selected.recycled)s.seen=[];
  s.seen.push(selected.question.id);s.history.push({question:selected.question.id});
  recent.push(selected.question.id);if(recent.length>3)recent.shift();
 }
});
test('missing current band falls back to deepest unlocked content, never locked content',()=>{
 const sparse=[{id:'surface',band:0},{id:'deep',band:4},{id:'locked',band:7}];
 assert.equal(selectQuestion({...freshRun(),distance:75000},sparse,()=>0).question.id,'deep');
 assert.throws(()=>selectQuestion(freshRun(),[],()=>0),/No unlocked/);
});
test('a tiny recycled pool avoids an immediate repeat when another question exists',()=>{
 const tiny=[{id:'one',band:0},{id:'two',band:0}];
 const s={...freshRun(),seen:['one','two'],history:[{question:'one'},{question:'two'}]};
 assert.equal(selectQuestion(s,tiny,()=>0.999).question.id,'one');
});
test('all unused unlocked content is consumed before recycling the current/previous layers',()=>{
 const s={...freshRun(),distance:95000,seen:layered.filter(q=>q.band>=6).map(q=>q.id)};
 const selected=selectQuestion(s,layered,()=>0);
 assert.equal(selected.recycled,false);assert.equal(selected.question.band,5);
});
test('optional browser-wide recent IDs avoid repeats across fresh runs without mutating state',()=>{
 const pool=Array.from({length:20},(_,i)=>({id:`many-${i}`,band:0}));
 const recentQuestions=pool.slice(0,16).map(q=>q.id);
 const s={...freshRun(),recentQuestions};
 assert.equal(selectQuestion(s,pool,()=>0).question.id,'many-16');
 assert.equal(s.seen.length,0);assert.equal(s.recentQuestions.length,16);
 const layeredPool=[{id:'surface-new',band:0},{id:'deep-recent',band:1}];
 assert.equal(selectQuestion({...freshRun(),distance:12500,recentQuestions:['deep-recent']},layeredPool,()=>0).question.id,'surface-new');
});
test('family repetition is avoided softly among fresh same-layer alternatives',()=>{
 const pool=[{id:'old-one',band:0,family:'sky'},{id:'old-two',band:0,family:'programs'},
  {id:'sky-new',band:1,family:'sky'},{id:'program-new',band:1,family:'programs'},{id:'crime-new',band:1,family:'crime'}];
 const s={...freshRun(),distance:12500,recentQuestions:['old-one','old-two']};
 assert.equal(selectQuestion(s,pool,()=>0).question.id,'crime-new');
 // Soft family filtering never makes an otherwise valid small pool unplayable.
 assert.equal(selectQuestion(s,pool.filter(q=>q.id!=='crime-new'),()=>0).question.band,1);
});
test('a long exact cooldown still rotates a fully seen small pool instead of repeating two prompts',()=>{
 const pool=layered.filter(q=>q.band<2),s={...freshRun(),distance:12500,seen:[]},ids=[];
 for(let i=0;i<18;i++){
  const selected=selectQuestion(s,pool,()=>0);ids.push(selected.question.id);
  if(selected.recycled)s.seen=[];
  s.seen.push(selected.question.id);s.history.push({question:selected.question.id});
 }
 assert.equal(new Set(ids.slice(0,6)).size,6);
 assert.ok(ids.every((id,i)=>i===0||id!==ids[i-1]));
});
test('a fresh answer pool outranks cosmetic wording of an already played pool',()=>{
 const pool=[{id:'sky-first',band:1,poolId:'same-sky'},{id:'sky-reworded',band:1,poolId:'same-sky'},
  {id:'new-program',band:1,poolId:'new-programs'}];
 const s={...freshRun(),distance:12500,seen:['sky-first'],history:[{question:'sky-first'}]};
 assert.equal(selectQuestion(s,pool,()=>0).question.id,'new-program');
 // A fresh previous-layer pool also outranks a shallow wording change at
 // the current layer once the current semantic material was already played.
 pool[2].band=0;
 assert.equal(selectQuestion(s,pool,()=>0).question.id,'new-program');
});
test('eight recent semantic pools cannot evade cooldown through different question IDs',()=>{
 const pool=Array.from({length:9},(_,i)=>[
  {id:`original-${i}`,band:0,poolId:`answers-${i}`},
  {id:`variant-${i}`,band:0,poolId:`answers-${i}`}
 ]).flat();
 const s={...freshRun(),recentQuestions:Array.from({length:8},(_,i)=>`original-${i}`)};
 assert.equal(selectQuestion(s,pool,()=>0).question.poolId,'answers-8');
});
test('semantic cooldown is eight questions while exact cooldown remains sixteen',()=>{
 const pool=[{id:'old-wording',band:0,poolId:'old-pool'},{id:'new-wording',band:0,poolId:'old-pool'},
  ...Array.from({length:8},(_,i)=>({id:`other-${i}`,band:0,poolId:`other-pool-${i}`}))];
 const s={...freshRun(),recentQuestions:['old-wording',...pool.slice(2).map(q=>q.id)]};
 assert.equal(selectQuestion(s,pool,()=>0).question.id,'new-wording');
});
test('small semantic pools still allow every wording and unlimited replay without cosmetic oscillation',()=>{
 const pool=[{id:'a',band:0,poolId:'a-pool'},{id:'a-variant',band:0,poolId:'a-pool'},
  {id:'b',band:0,poolId:'b-pool'},{id:'b-variant',band:0,poolId:'b-pool'}];
 const s=freshRun(),drawn=[];
 for(let i=0;i<24;i++){
  const selected=selectQuestion(s,pool,()=>0);drawn.push(selected.question);
  if(selected.recycled)s.seen=[];
  s.seen.push(selected.question.id);s.history.push({question:selected.question.id});
 }
 assert.notEqual(drawn[0].poolId,drawn[1].poolId);
 assert.equal(new Set(drawn.slice(0,4).map(q=>q.id)).size,4);
 assert.ok(drawn.every((q,i)=>i===0||q.poolId!==drawn[i-1].poolId));
});
test('a single pool can replay indefinitely and missing pool metadata preserves legacy behavior',()=>{
 const one=[{id:'only',band:0,poolId:'same'}],s={...freshRun(),seen:['only'],history:[{question:'only'}]};
 assert.equal(selectQuestion(s,one,()=>0).question.id,'only');
 assert.equal(selectQuestion(s,one,()=>0).recycled,true);
 const legacy=[{id:'old',band:0},{id:'fresh',band:0}];
 assert.equal(selectQuestion({...freshRun(),seen:['old'],history:[{question:'old'}]},legacy,()=>0).question.id,'fresh');
});
