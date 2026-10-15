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
  assert.equal(LEVELS[i].number,i+1);assert.equal(LEVELS[i].startDistance,i*5000);
  assert.equal(LEVELS[i].endDistance,(i+1)*5000);assert.equal(levelIndex(i*5000),i);
  assert.equal(levelIndex((i+1)*5000-1),i);
 }
 assert.equal(levelIndex(100000),19);assert.equal(levelIndex(-100),0);
 assert.equal(LEVELS[9].effect,'fold');assert.equal(LEVELS[18].effect,'drawing-hand');
 for(let i=0;i<8;i++)assert.equal(bandIndex(i*12500),i);
});
test('source point tiers are unchanged while all correct answers advance at least one full level',()=>{
 assert.deepEqual(POINTS,[10,15,30,60,85,100]);assert.deepEqual(TRAVEL_BY_TIER,[5000,5500,6000,6500,7000,7500]);
 for(let tier=0;tier<6;tier++){
  const s=resolve(freshRun(),tier);assert.equal(s.score,POINTS[tier]);
  assert.equal(s.distance,TRAVEL_BY_TIER[tier]);assert.equal(s.history.at(-1).travelled,travelForTier(tier));
 }
 assert.throws(()=>travelForTier(-1),/Invalid rarity/);assert.throws(()=>travelForTier(6),/Invalid rarity/);
});
test('ordinary knowledgeable play visits all twenty levels and wins in twenty correct answers',()=>{
 let s=freshRun();const visited=[levelIndex(s.distance)];
 for(let i=1;i<=20;i++){
  s=resolve(s,0);visited.push(levelIndex(s.distance));assert.equal(s.rounds,i);
  assert.equal(s.phase,i===20?'escaped':'result');assert.equal(s.distance,i*5000);
 }
 assert.equal(new Set(visited).size,20);assert.equal(s.score,200);assert.equal(s.pristine,false);
});
test('all six tiers can win; rarer answers reduce correct-answer count without changing damage rules',()=>{
 const counts=[];
 for(let tier=0;tier<6;tier++){
  let s=freshRun();while(s.phase!=='escaped')s=resolve(s,tier);
  counts.push(s.rounds);assert.equal(s.distance,STATION);assert.equal(s.hits,0);
 }
 assert.deepEqual(counts,[20,19,17,16,15,14]);
 let s=resolve(freshRun(),0,false);s=resolve(s,5,false);
 assert.equal(s.hits,2);assert.equal(s.distance,0);assert.equal(s.score,0);
 for(let i=0;i<20;i++)s=resolve(s,0);assert.equal(s.phase,'escaped');assert.equal(s.hits,2);
 let dead=resolve(freshRun(),0,false);dead=resolve(dead,0,false);dead=resolve(dead,0,false);
 assert.equal(dead.phase,'dead');assert.equal(dead.hits,3);assert.equal(dead.distance,0);
});
test('a saved legacy practice run keeps progress and can escape on its next ordinary answer',()=>{
 const legacy={...freshRun(),distance:95000,score:1900,pristine:false,phase:'result',rounds:42,hits:2};
 delete legacy.progressionVersion;const before=structuredClone(legacy),m=migrateRun(legacy,1000);
 assert.deepEqual(legacy,before);assert.equal(m.progressionVersion,PROGRESSION_VERSION);
 for(const key of ['distance','score','hits','phase','rounds','pristine'])assert.equal(m[key],legacy[key]);
 const won=resolve(m,0);assert.equal(won.phase,'escaped');assert.equal(won.distance,100000);assert.equal(won.hits,2);
 assert.deepEqual(migrateRun(m,999999),m);
});
test('new questions allow thirty-five seconds and old active deadlines gain exactly ten seconds once',()=>{
 const started=beginQuestion(freshRun(),prompt,1000);assert.equal(ANSWER_TIME_MS,35000);
 assert.equal(started.deadline,36000);assert.equal(started.remaining,35000);
 const old={...started,deadline:26000,remaining:25000};delete old.progressionVersion;
 const migrated=migrateRun(old,11000);assert.equal(migrated.deadline,36000);assert.equal(migrated.remaining,25000);
 assert.equal(migrateRun(migrated,12000).deadline,36000);
 const expired={...old,deadline:1000};assert.equal(migrateRun(expired,20000).remaining,0);
});
test('passes remain recoverable and do not move numeric distance',()=>{
 let s=resolve(freshRun(),0);const passed=skip(beginQuestion(s,prompt));
 assert.equal(passed.distance,5000);assert.equal(passed.score,10);assert.equal(passed.hits,0);
 s=passed;while(s.phase!=='escaped')s=resolve(s,0);assert.equal(s.phase,'escaped');
});
