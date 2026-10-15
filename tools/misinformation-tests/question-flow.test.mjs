import test from 'node:test';
import assert from 'node:assert/strict';
import {PREVIEW_MS,openTransmission,namingClock,suggestCorrection} from '../../play/misinformation/question-flow.js';
import {ANSWER_TIME_MS,freshRun,lookup} from '../../play/misinformation/engine.js';
import {subjects,questions} from '../../play/misinformation/catalog.js';

test('three-second preview precedes the full thirty-five-second naming clock',()=>{
  const start=100000,question=questions[0],original=freshRun();
  const state=openTransmission(original,question,start);
  assert.equal(PREVIEW_MS,3000);assert.equal(ANSWER_TIME_MS,35000);
  assert.equal(state.previewUntil,start+3000);
  assert.equal(state.deadline,start+3000+35000);
  assert.equal(state.remaining,35000);
  assert.equal(original.phase,'ready','Opening does not mutate the previous saved run');
  for(const [elapsed,seconds] of [[0,3],[1000,2],[2999,1]]){
    assert.deepEqual(namingClock(state,start+elapsed),{phase:'preview',seconds,fraction:1});
  }
  assert.deepEqual(namingClock(state,start+3000),{phase:'answer',seconds:35,fraction:1});
  const running=namingClock(state,start+4000);
  assert.equal(running.phase,'answer');assert.equal(running.seconds,34);
  assert.equal(running.fraction,34/35);
});

test('saved deadlines expire without rearming or consuming the state on repeated reads',()=>{
  const state=openTransmission(freshRun(),questions[0],1000);
  const saved=JSON.parse(JSON.stringify(state)),before=JSON.stringify(saved);
  assert.deepEqual(namingClock(saved,saved.deadline-1),{phase:'answer',seconds:1,fraction:1/ANSWER_TIME_MS});
  for(const time of [saved.deadline,saved.deadline+1,saved.deadline+90000]){
    assert.deepEqual(namingClock(saved,time),{phase:'expired',seconds:0,fraction:0});
  }
  assert.equal(JSON.stringify(saved),before,'Clock reads never submit twice or move a saved deadline');
  const next=openTransmission({...saved,phase:'result',namingAutoSubmitted:true},questions[1],99999);
  assert.equal(next.namingAutoSubmitted,false,'Only a genuinely new transmission resets the submission flag');
  assert.equal(next.deadline,99999+PREVIEW_MS+ANSWER_TIME_MS);
});

const fixture=[
  {id:'jupiter',name:'Jupiter',aliases:['Largest planet']},
  {id:'andromeda',name:'Andromeda Galaxy',aliases:['Messier 31']},
  {id:'saturn',name:'Saturn',aliases:['Ringed planet']},
  {id:'satin',name:'Satin',aliases:[]}
];
const pool=(...ids)=>({answers:ids.map(id=>({id,tier:0}))});

test('typo suggestions recognize adjacent transpositions and bounded long-name edits',()=>{
  const question=pool('jupiter','andromeda');
  assert.equal(suggestCorrection('Jupietr',question,fixture)?.id,'jupiter');
  assert.equal(suggestCorrection('Jupter',question,fixture)?.id,'jupiter');
  assert.equal(suggestCorrection('Juxxter',question,fixture),null,'Short names do not receive two speculative edits');
  assert.equal(suggestCorrection('Andromda Galxy',question,fixture)?.id,'andromeda','Two deletions are allowed for a long answer');
  assert.equal(suggestCorrection('Andromd Galxy',question,fixture),null,'Three edits remain outside the correction budget');
  assert.equal(suggestCorrection('Mras',question,fixture),null,'Very short inputs do not trigger guesses');
  assert.equal(suggestCorrection('banana',question,fixture),null);
});

test('equal best candidates abstain and out-of-pool names cannot become corrections',()=>{
  assert.equal(suggestCorrection('Satun',pool('saturn','satin'),fixture),null,'Both candidates are one edit away');
  assert.equal(suggestCorrection('Satun',pool('saturn'),fixture)?.id,'saturn');
  assert.equal(suggestCorrection('Jupiter',pool('saturn'),fixture),null);
  const one=[{id:'one',name:'Saturn',aliases:['Satun','Saturn planet']}];
  assert.equal(suggestCorrection('Satun',pool('one'),one)?.id,'one','Two aliases of one subject are not competing identities');
});

test('reviewed canonical aliases and the Cuban misspelling retain exact lookup before correction',()=>{
  const history=questions.find(q=>q.id==='history-01');
  for(const answer of ['Cuban Missile Crisis','Cuban Missle Crisis','cuban missile crises','CUBA MISSILE CRISIS']){
    assert.equal(lookup(answer,history,subjects)?.id,'cuban-missile-crisis',answer);
    assert.equal(suggestCorrection(answer,history,subjects)?.id,'cuban-missile-crisis',answer);
  }
  assert.equal(lookup('WWII',history,subjects)?.id,'world-war-two');
  const sky=questions.find(q=>q.id==='sky');
  assert.equal(lookup('moon',sky,subjects)?.id,'moon','A short exact answer is valid even though short typo guessing is disabled');
});
