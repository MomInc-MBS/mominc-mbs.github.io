import test from 'node:test';
import assert from 'node:assert/strict';
import {subjects,questions} from '../../play/misinformation/catalog.js';
import {lookup,POINTS} from '../../play/misinformation/engine.js';

const question=id=>questions.find(q=>q.id===id);
test('familiar typed answers and less obvious study names pass the categories players expect',()=>{
 const cases=[
  ['science-04','Stanford prison experiment','stanford-prison-experiment'],
  ['science-04','Standford prison experiment','stanford-prison-experiment'],
  ['science-04','the Stanford prison experiment','stanford-prison-experiment'],
  ['science-04','Zimbardo prison experiment','stanford-prison-experiment'],
  ['science-04','Milgram experiment','milgram-obedience-study'],
  ['science-04','Asch conformity study','asch-conformity-study'],
  ['science-04','Little Albert study','little-albert-study'],
  ['science-04','Bobo doll study','bobo-doll-study'],
  ['science-04','Stroop study','stroop-effect-study'],
  ['programs-06','Stanford Prison Study','stanford-prison-experiment'],
  ['programs-06','Milgram obedience experiment','milgram-obedience-study'],
  ['programs-06','Robbers Cave study','robbers-cave-experiment'],
  ['history-01','Cuban Missle Crisis','cuban-missile-crisis'],
  ['history-01','WWII','world-war-two'],
  ['history-01','Great Depression','great-depression'],
  ['leaders-01','Obama','barack-obama'],
  ['leaders-01','Churchill','winston-churchill'],
  ['leaders-01','Queen Elizabeth 2','queen-elizabeth-ii'],
  ['leaders-01','Merkel','angela-merkel'],
  ['technology-01','WWW','world-wide-web'],
  ['technology-01','ENIAC','eniac'],
  ['science-01','DNA double-helix structure','dna-double-helix'],
  ['science-01','Penicillin discovery','penicillin-discovery'],
  ['space-01','Mars','mars'],
  ['space-01','Venus','venus']
 ];
 for(const [qid,answer,id]of cases)assert.equal(lookup(answer,question(qid),subjects)?.id,id,`${qid}: ${answer}`);
});

test('recognizable knowledge can score above ten without an obscure secret keyword',()=>{
 for(const id of ['stanford-prison-experiment','milgram-obedience-study']){
  const entry=question('science-04').answers.find(a=>a.id===id);
  assert.equal(POINTS[entry.tier],15,id);
 }
 const entry=question('programs-06').answers.find(a=>a.id==='robbers-cave-experiment');
 assert.equal(POINTS[entry.tier],30);
});

test('ordinary opening categories exclude theories, and later transmissions introduce them',()=>{
 const byId=new Map(subjects.map(s=>[s.id,s]));
 for(const q of questions.filter(q=>q.band<3)){
  assert.ok(q.answers.every(a=>byId.get(a.id).classification==='event'),q.id);
 }
 assert.ok(questions.filter(q=>q.band>=3).some(q=>q.answers.some(a=>byId.get(a.id).classification==='claim')));
 for(const q of questions.filter(q=>q.family==='conspiracies'))assert.ok(q.band>=3,q.id);
});

test('clearer categories do not accept unrelated names or a theory as a natural object',()=>{
 for(const [qid,answer]of [
  ['space-01','Stanford Prison Experiment'],['science-04','Hubble Space Telescope'],
  ['leaders-01','Marie Curie\'s 1911 Nobel Prize'],['nature-01','Sun'],
  ['space-01','Flat Earth'],['history-01','Moon landing hoax']
 ])assert.equal(lookup(answer,question(qid),subjects),undefined,`${qid}: ${answer}`);
});
