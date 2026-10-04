import test from 'node:test';
import assert from 'node:assert/strict';
import {LANES,TRAPS,TURN_AT,LENGTH,createRun,courseFor,input,step,upcoming,pathAt,runSpeed,hint} from '../tv/assets/armie-intro/maze-run.mjs';
import {ROUTES,DIRECTIONS,routeFor} from '../tv/assets/armie-intro/ship-routes.mjs';
import {BANKS,questionFor} from '../tv/assets/armie-intro/fitness-questions.mjs';
import {chasePressure} from '../tv/assets/armie-intro/chase-state.mjs';
import {swipeAction} from '../tv/assets/armie-intro/swipe-input.mjs';

function act(run){
 if(run.status==='choosing')return input(run,['left','straight','right'][routeFor(run.seed).correct]);
 const e=upcoming(run),d=e?e.at-run.distance:100;if(!e)return;
 if(e.type==='platform'&&d<2.1&&run.jumpTime===0)input(run,'jump');
 if(e.type==='grid'&&d<2&&run.slideTime===0&&run.jumpTime===0)input(run,'slide');
 if(e.type==='turn'&&d<9)input(run,e.direction);
 if(e.type==='pit'&&d<8&&run.lane===1)input(run,run.seed%2?'right':'left');
}
function drive(run,actions=true,seen){for(let i=0;i<3000&&['running','choosing','exiting'].includes(run.status);i++){
 seen?.add(hint(run));if(actions)act(run);step(run,1/60);
}return run;}
function at(type,seed=0,lane=1){const r=createRun(seed);r.lane=lane;r.distance=41;r.events=[{type,at:42,...(type==='pit'?{length:7}:{}),cleared:false}];return r;}
test('all course variants have three lanes, only three full-width trap designs, and a real 90-degree turn',()=>{
 assert.deepEqual(LANES,[-1.25,0,1.25]);const types=new Set();
 for(let seed=0;seed<40;seed++){const course=courseFor(seed),traps=course.filter(e=>e.type!=='turn');
  assert.ok(course.length===7||course.length===8);for(const t of TRAPS)assert.ok(traps.some(e=>e.type===t),`seed ${seed} lacks ${t}`);
  traps.forEach(e=>{types.add(e.type);assert.equal(e.lane,undefined);});
  const ti=course.findIndex(e=>e.type==='turn');assert.equal(course[ti].at,TURN_AT);assert.notEqual(course[ti-1].type,'pit');
  const p=pathAt(TURN_AT+12,seed);assert.equal(Math.abs(p.yaw),Math.PI/2);assert.equal(Math.abs(p.x),12);assert.equal(p.z,-TURN_AT);}
 assert.deepEqual([...types].sort(),[...TRAPS].sort());
 assert.ok(new Set(Array.from({length:12},(_,s)=>courseFor(s).map(e=>e.type).join())).size>4,'orders vary by seed');
});
test('all runs are solvable at normal speed with visible warning windows',()=>{for(let seed=0;seed<24;seed++)assert.equal(drive(createRun(seed)).status,'complete');});
test('missing the first trap produces one hit and stops progress',()=>{const r=drive(createRun(0),false);assert.equal(r.status,'hit');assert.equal(r.hit,courseFor(0)[0].type);const d=r.distance;for(let i=0;i<50;i++)step(r,.05);assert.equal(r.distance,d);});
test('the pit kills the center lane and both edge ledges survive its whole length',()=>{
 for(const lane of [0,1,2]){const r=at('pit',0,lane);for(let i=0;i<200&&r.status==='running'&&r.distance<50;i++)step(r,.02);assert.equal(r.status,lane===1?'hit':'running');if(lane===1)assert.equal(r.hit,'pit');}
 const jumper=at('pit');input(jumper,'jump');for(let i=0;i<200&&jumper.status==='running'&&jumper.distance<50;i++)step(jumper,.02);assert.equal(jumper.hit,'pit','a jump cannot clear the pit');
});
test('the pit hit check runs continuously: stepping into the center mid-pit kills',()=>{
 const r=at('pit',0,0);while(r.distance<45)step(r,.02);assert.equal(r.status,'running');assert.equal(upcoming(r).type,'pit');
 input(r,'right');assert.equal(r.lane,1);step(r,.02);assert.equal(r.status,'hit');assert.equal(r.hit,'pit');
 const ok=at('pit',0,2);while(ok.distance<49.5&&ok.status==='running')step(ok,.02);assert.equal(ok.status,'running');assert.equal(upcoming(ok),null);input(ok,'left');step(ok,.02);assert.equal(ok.status,'running');
});
test('the energy grid needs a slide and the platform needs a jump in every lane',()=>{
 for(const lane of [0,1,2])for(const type of ['grid','platform'])for(const move of [null,'jump','slide']){
  const r=at(type,0,lane);if(move)input(r,move);for(let i=0;i<30&&r.status==='running';i++)step(r,.02);
  const good=type==='grid'?move==='slide':move==='jump';assert.equal(r.status,good?'running':'hit',`${type} lane ${lane} ${move}`);if(!good)assert.equal(r.hit,type);}
});
test('wrong corner choice fails and early left/right inputs shift one lane',()=>{const r=createRun(0);assert.equal(r.lane,1);input(r,'right');assert.equal(r.lane,2);assert.equal(r.turn,null);r.distance=TURN_AT-.01;r.events.filter(e=>e.at<TURN_AT).forEach(e=>e.cleared=true);input(r,'right');step(r,.02);assert.equal(r.hit,'turn');});
test('pause freezes jump and distance; background time cannot skip an obstacle',()=>{const r=createRun();input(r,'jump');r.paused=true;step(r,20);assert.equal(r.distance,0);assert.equal(r.jumpTime,.96);r.paused=false;step(r,20);assert.ok(r.distance<=.25);});
test('assisted mode waits for input and can finish every course',()=>{for(let seed=0;seed<6;seed++){const r=drive(createRun(seed,true),false);assert.equal(r.status,'running');assert.ok(r.distance<13);assert.equal(drive(r).status,'complete');}});
test('lane input shifts one lane at a time, clamps to three lanes, and jump cannot stack',()=>{const r=createRun();input(r,'left');assert.equal(r.lane,0);for(let i=0;i<20;i++)input(r,'left');assert.equal(r.lane,0);input(r,'right');assert.equal(r.lane,1);for(let i=0;i<20;i++)input(r,'right');assert.equal(r.lane,2);input(r,'jump');step(r,.1);const t=r.jumpTime;input(r,'jump');assert.equal(r.jumpTime,t);});
test('hint() is MOM Inc propaganda only: no arrows and no movement verbs',()=>{
 const seen=new Set();for(let seed=0;seed<6;seed++){const r=drive(createRun(seed),true,seen);assert.equal(r.status,'complete');r.paused=true;seen.add(hint(r));}
 assert.ok(seen.size>4);for(const text of seen){assert.doesNotMatch(text,/[←→↑↓]|JUMP|SLIDE|SWIPE|DODGE|TURN|LEFT|RIGHT/i,text);assert.ok(text===''||/MOM/.test(text),text);}
});
test('four directional swipes ignore taps and ambiguous diagonals',()=>{
 assert.equal(swipeAction(80,6),'right');assert.equal(swipeAction(-80,6),'left');assert.equal(swipeAction(4,-75),'jump');assert.equal(swipeAction(4,75),'slide');
 for(const [x,y] of [[10,0],[0,20],[40,40],[-30,30]])assert.equal(swipeAction(x,y),null);
});
test('slide and jump are exclusive, recover, and pause without expiring',()=>{
 const r=createRun();input(r,'slide');input(r,'jump');assert.equal(r.jumpTime,0);step(r,.05);r.paused=true;const t=r.slideTime;step(r,5);assert.equal(r.slideTime,t);r.paused=false;
 for(let i=0;i<30;i++)step(r,.05);assert.equal(r.duck,0);input(r,'jump');input(r,'slide');assert.equal(r.slideTime,0);assert.ok(r.jumpTime>0);
});
test('a junction waits for a directional swipe and runs through the selected tunnel before judging it',()=>{
 for(let hall=0;hall<3;hall++)for(let choice=0;choice<3;choice++){
  const r=createRun(hall);r.distance=LENGTH;r.events.forEach(e=>e.cleared=true);step(r,.01);assert.equal(r.status,'choosing');
  for(let i=0;i<100;i++)step(r,.05);assert.equal(r.status,'choosing');assert.equal(r.distance,LENGTH);
  r.paused=true;input(r,['left','jump','right'][choice]);assert.equal(r.exit,null);r.paused=false;
  input(r,['left','jump','right'][choice]);assert.equal(r.status,'exiting');assert.equal(r.exit,choice);
  input(r,'left');assert.equal(r.exit,choice);step(r,.05);assert.ok(r.exitProgress>0&&r.exitProgress<1);
  for(let i=0;i<30;i++)step(r,.05);
  assert.equal(r.status,choice===routeFor(hall).correct?'complete':'hit');if(r.status==='hit')assert.equal(r.hit,'exit');
  const retry=createRun(hall);assert.equal(retry.distance,0);assert.deepEqual(courseFor(retry.seed),courseFor(r.seed));
 }
});
test('sprint taps provide a temporary speed boost and all boosted mazes remain solvable',()=>{
 const slow=createRun(0),fast=createRun(0,false,1);assert.ok(runSpeed(fast)>runSpeed(slow));step(slow,.05);step(fast,.05);assert.ok(fast.distance>slow.distance);
 fast.distance=36;assert.equal(runSpeed(fast),4.8);for(let hall=0;hall<3;hall++)assert.equal(drive(createRun(hall,false,1)).status,'complete');
});
test('tapping widens the chase gap; mistakes close it; the third mistake fills the bar',()=>{
 const start=chasePressure({mistakes:0,boost:0}),sprint=chasePressure({mistakes:0,boost:1});assert.ok(sprint<start);
 assert.ok(chasePressure({mistakes:1,boost:0})>start);assert.ok(chasePressure({mistakes:2,boost:0})>chasePressure({mistakes:1,boost:0}));
 assert.ok(chasePressure({mistakes:2,boost:0})<1);assert.equal(chasePressure({mistakes:3,boost:1}),1);
});
test('each experience level has six distinct fitness questions, two per ship section',()=>{
 for(let level=0;level<3;level++){assert.equal(BANKS[level].length,6);const asked=[];for(let hall=0;hall<3;hall++)for(let slot=0;slot<2;slot++){const q=questionFor(level,hall,slot);assert.equal(q[1].length,3);assert.ok(Number.isInteger(q[2])&&q[2]>=0&&q[2]<3);asked.push(q[0]);}assert.equal(new Set(asked).size,6);}
});
test('each maze has spaced traps on both corridors and a clear approach to its junction',()=>{
 for(let hall=0;hall<12;hall++){const course=courseFor(hall),traps=course.filter(e=>e.type!=='turn');assert.ok(traps.length===6||traps.length===7);assert.ok(traps.some(e=>e.at<TURN_AT)&&traps.some(e=>e.at>TURN_AT));
  for(let i=1;i<course.length;i++)assert.ok(course[i].at-(course[i-1].at+(course[i-1].length||0))>=3);for(const p of traps.filter(e=>e.type==='pit'))assert.ok(p.length>=6&&p.length<=8);
  const last=traps.at(-1);assert.ok(LENGTH-(last.at+(last.length||0))>=8);}
});
test('three different junctions each offer left, straight and right with one warning-marked exit',()=>{
 assert.equal(DIRECTIONS.length,3);assert.deepEqual(ROUTES.map(r=>r.correct),[0,1,2]);
 const signs=new Set();for(const route of ROUTES){assert.equal(route.doors.length,3);route.doors.forEach((door,i)=>{const text=door.join(' ');assert.ok(!signs.has(text));signs.add(text);assert.match(text,i===route.correct?/GET OUT|KEEP RUNNING|DO NOT LOOK BACK/:/MOM|LOVE|LOVED/);});}
});
