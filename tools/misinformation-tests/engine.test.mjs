import test from 'node:test';import assert from 'node:assert/strict';
import {POINTS,freshRun,lookup,beginQuestion,acceptAnswer,classify,skip,selectQuestion,STATION,APPROACH} from '../../play/misinformation/engine.js';
import {subjects,questions} from '../../play/misinformation/catalog.js';
const question=questions[0];const rare=subjects.find(s=>s.id==='nibiru');const common=subjects.find(s=>s.id==='chemtrails');
function answer(state,s=rare,choice=s.classification){return classify(acceptAnswer(beginQuestion(state,question),s,question),s,question,choice);}
test('source-compatible scores, aliases and category membership',()=>{assert.deepEqual(POINTS,[10,15,30,60,85,100]);assert.equal(lookup('  MK-Ultra ',questions[1],subjects).id,'mkultra');assert.equal(lookup('Ted Bundy',question,subjects),undefined);assert.equal(lookup('unlisted answer',question,subjects),undefined);});
test('twenty top-tier correct classifications dock, no fixed round cap',()=>{let s=freshRun();for(let i=0;i<20;i++)s=answer(s);assert.equal(s.phase,'escaped');assert.equal(s.distance,STATION);assert.equal(s.score,2000);assert.throws(()=>beginQuestion(s,question));});
test('common-answer accumulation can never dock, including late disqualification',()=>{let s=freshRun();for(let i=0;i<300;i++)s=answer(s,common);assert.equal(s.distance,APPROACH);assert.equal(s.phase,'result');assert.equal(s.pristine,false);assert.equal(s.history.at(-1).travelled,0);for(let i=0;i<20;i++)s=answer(s);assert.notEqual(s.phase,'escaped');let late=freshRun();for(let i=0;i<19;i++)late=answer(late);late=answer(late,common);assert.equal(late.pristine,false);assert.equal(late.distance,APPROACH);});
test('three classification hits terminate, two are survivable and award no fuel',()=>{let s=freshRun();s=answer(s,rare,'event');s=answer(s,rare,'event');assert.equal(s.phase,'result');assert.equal(s.distance,0);assert.equal(s.hits,2);s=answer(s,rare,'event');assert.equal(s.phase,'dead');assert.equal(s.hits,3);assert.throws(()=>beginQuestion(s,question));assert.deepEqual(freshRun(),freshRun());});
test('skips disqualify clearance without dealing classification damage',()=>{const s=skip(beginQuestion(freshRun(),question,100));assert.equal(s.pristine,false);assert.equal(s.hits,0);assert.equal(s.rounds,1);assert.equal(s.phase,'result');});
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
test('app-style cycle resets preserve the cooldown and unlimited deep replay',()=>{
 const s={...freshRun(),distance:95000},recent=[];
 for(let i=0;i<60;i++){
  const selected=selectQuestion(s,layered,()=>0);
  assert.ok([6,7].includes(selected.question.band));
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
