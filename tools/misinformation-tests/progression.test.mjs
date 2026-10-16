import test from 'node:test';
import assert from 'node:assert/strict';
import {LEVELS,LEVEL_DISTANCE,levelIndex,BANDS,bandIndex,POINTS,TRAVEL_BY_TIER,travelForTier,
 ANSWER_TIME_MS,PROGRESSION_VERSION,STATION,freshRun,migrateRun,beginQuestion,acceptAnswer,classify,skip} from '../../play/misinformation/engine.js';

const prompt={id:'progression-fixture',band:0,answers:POINTS.map((_,tier)=>({id:`tier-${tier}`,tier}))};
const subjects=POINTS.map((_,tier)=>({id:`tier-${tier}`,classification:'event'}));
function resolve(state,tier=0,correct=true){
 return classify(acceptAnswer(beginQuestion(state,prompt),subjects[tier],prompt),subjects[tier],prompt,correct?'event':'claim');
}
test('the exact twenty-level itinerary is independent of eight question-difficulty bands',()=>{
 assert.deepEqual(LEVELS.map(l=>l.name),[
  'Office','Ceiling Vents','Propaganda Stairwell','Rooftop and Billboards',
  'Sky of Paper Clouds','Space Elevator','Satellite Junkyard','MOM Port 18','Moon Cafeteria Colony',
  'The Fold','Origami','Asteroid Gym Belt','Wormhole Highway','Flatland','Mirror Office',
  'Quilt Dimension','Data Cable','Nebula Nursery','Edge of the Page',"MOM's Mothership Desk"
 ]);
 assert.equal(BANDS.length,8);assert.equal(LEVELS.length,20);assert.equal(LEVEL_DISTANCE,5000);
 for(let i=0;i<20;i++){
  const start=i===19?STATION:i*5000,end=i>=18?STATION:(i+1)*5000;
  assert.equal(LEVELS[i].number,i+1);assert.equal(LEVELS[i].startDistance,start);
  assert.equal(LEVELS[i].endDistance,end);assert.equal(levelIndex(start),i);
  if(i<19)assert.equal(levelIndex(end-1),i);
 }
 for(const distance of [90000,95000,97000,99999])assert.equal(levelIndex(distance),18);
 assert.equal(levelIndex(100000),19);assert.equal(levelIndex(-100),0);
 assert.equal(LEVELS[9].effect,'fold');assert.equal(LEVELS[18].effect,'drawing-hand');
 for(let i=0;i<8;i++)assert.equal(bandIndex(i*12500),i);
});
test('all six tiers award proportional distance and only five top answers win',()=>{
 assert.deepEqual(POINTS,[10,15,30,60,85,100]);assert.deepEqual(TRAVEL_BY_TIER,[2000,3000,6000,12000,17000,20000]);
 for(let tier=0;tier<6;tier++){
  let s=freshRun();
  for(let i=1;i<=5;i++){
   s=resolve(s,tier);assert.equal(s.rounds,i);assert.equal(s.distance,i*travelForTier(tier));
   assert.equal(s.phase,i<5?'result':tier===5?'escaped':'dead');
  }
  assert.equal(s.score,5*POINTS[tier]);assert.throws(()=>beginQuestion(s,prompt));
 }
 assert.throws(()=>travelForTier(-1),/Invalid rarity/);assert.throws(()=>travelForTier(6),/Invalid rarity/);
});
test('four top answers plus any lower answer cannot escape, regardless of order',()=>{
 for(let tier=0;tier<5;tier++)for(let position=0;position<5;position++){
  let s=freshRun();for(let i=0;i<5;i++)s=resolve(s,i===position?tier:5);
  assert.equal(s.phase,'dead');assert.equal(s.lossReason,'questions');assert.equal(s.hits,0);
  assert.equal(s.distance,80000+travelForTier(tier));assert.throws(()=>beginQuestion(s,prompt));
 }
});
test('passes and expired naming windows consume the five-question budget without damage',()=>{
 let s=freshRun();for(let i=0;i<5;i++)s=skip(beginQuestion(s,prompt,0));
 assert.equal(s.rounds,5);assert.equal(s.hits,0);assert.equal(s.distance,0);assert.equal(s.phase,'dead');
 assert.throws(()=>beginQuestion(s,prompt));
 s=freshRun();for(let i=0;i<4;i++)s=resolve(s,5);s=skip(beginQuestion(s,prompt));
 assert.equal(s.phase,'dead');assert.equal(s.distance,80000);assert.equal(s.hits,0);
});
test('three wrong classifications still end the flight early',()=>{
 let s=freshRun();for(let i=0;i<3;i++)s=resolve(s,5,false);
 assert.equal(s.phase,'dead');assert.equal(s.rounds,3);assert.equal(s.hits,3);assert.equal(s.lossReason,'hits');
 assert.throws(()=>beginQuestion(s,prompt));
});
test('reload preserves current progress and cannot offer a sixth question',()=>{
 let s=freshRun();for(let i=0;i<4;i++)s=resolve(s,5);
 const saved=JSON.parse(JSON.stringify(s));assert.deepEqual(migrateRun(saved),s);
 s=resolve(migrateRun(saved),5);assert.equal(s.phase,'escaped');assert.equal(s.distance,STATION);
 assert.throws(()=>beginQuestion(migrateRun(JSON.parse(JSON.stringify(s))),prompt));
 let loss=freshRun();for(let i=0;i<5;i++)loss=resolve(loss,0);
 assert.throws(()=>beginQuestion(migrateRun(JSON.parse(JSON.stringify(loss))),prompt));
 assert.throws(()=>beginQuestion({...freshRun(),rounds:5,phase:'result'},prompt));
});
test('old saves restart safely instead of importing unlimited-question distance',()=>{
 for(const phase of ['answer','classify','result','escaped','dead']){
  const old={...freshRun(),progressionVersion:2,phase,distance:95000,score:1900,rounds:42,hits:2,deadline:1000,previewUntil:999999,namingAutoSubmitted:true,lossReason:'hits',judgePending:true};
  const before=structuredClone(old),m=migrateRun(old);assert.deepEqual(old,before);
  assert.equal(m.progressionVersion,PROGRESSION_VERSION);assert.equal(m.phase,'ready');
  assert.equal(m.distance,0);assert.equal(m.rounds,0);assert.equal(m.score,0);assert.equal(m.hits,0);
  for(const key of ['previewUntil','namingAutoSubmitted','lossReason','judgePending'])assert.equal(m[key],undefined);
 }
 const active=beginQuestion(freshRun(),prompt,1000);assert.equal(ANSWER_TIME_MS,35000);assert.equal(active.deadline,36000);
 assert.deepEqual(migrateRun(active,11000),active);
});
