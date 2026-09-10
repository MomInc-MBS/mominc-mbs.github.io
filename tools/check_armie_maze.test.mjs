import test from 'node:test';
import assert from 'node:assert/strict';
import {LANES,TRAPS,TURN_AT,LENGTH,createRun,courseFor,input,step,upcoming,pathAt} from '../tv/assets/armie-intro/maze-run.mjs';
import {ROUTES,DIRECTIONS} from '../tv/assets/armie-intro/ship-routes.mjs';
import {swipeAction} from '../tv/assets/armie-intro/swipe-input.mjs';

function drive(run,actions=true){for(let i=0;i<3000&&run.status==='running';i++){
 const e=upcoming(run),d=e?e.at-run.distance:100;
 if(actions&&e){if(e.type==='crack'&&d<2.1&&run.jumpTime===0)input(run,'jump');if(e.type==='turn'&&d<9)input(run,e.direction);if(['wall','rubble'].includes(e.type)&&d<8)input(run,e.lane===0?'right':'left');}
 step(run,1/60);
}return run;}
test('all course variants have two lanes, only three trap designs, and a real 90-degree turn',()=>{
 assert.equal(LANES.length,2);const types=new Set();
 for(let seed=0;seed<12;seed++){for(const e of courseFor(seed))if(e.type!=='turn'){types.add(e.type);assert.ok(e.lane===null||[0,1].includes(e.lane));}const p=pathAt(TURN_AT+12,seed);assert.equal(Math.abs(p.yaw),Math.PI/2);assert.equal(Math.abs(p.x),12);assert.equal(p.z,-TURN_AT);}
 assert.deepEqual([...types].sort(),[...TRAPS].sort());
});
test('all runs are solvable at normal speed with visible warning windows',()=>{for(let seed=0;seed<12;seed++)assert.equal(drive(createRun(seed)).status,'complete');});
test('missing a crack produces one hit and stops progress',()=>{const r=drive(createRun(0),false);assert.equal(r.status,'hit');assert.equal(r.hit,'crack');const d=r.distance;for(let i=0;i<50;i++)step(r,.05);assert.equal(r.distance,d);});
test('jump cannot bypass an energy shutter, while the open lane is safe',()=>{for(const dodge of [false,true]){const r=createRun(1),wall=r.events.find(e=>e.type==='wall');r.distance=wall.at-.01;r.events.filter(e=>e.at<wall.at).forEach(e=>e.cleared=true);r.lane=dodge?1-wall.lane:wall.lane;r.jumpTime=.5;step(r,.02);assert.equal(r.status,dodge?'running':'hit');if(!dodge)assert.equal(r.hit,'wall');}});
test('wrong corner choice fails and early left/right inputs only change lane',()=>{const r=createRun(0);input(r,'right');assert.equal(r.lane,1);assert.equal(r.turn,null);r.distance=TURN_AT-.01;r.events.filter(e=>e.at<TURN_AT).forEach(e=>e.cleared=true);input(r,'right');step(r,.02);assert.equal(r.hit,'turn');});
test('pause freezes jump and distance; background time cannot skip an obstacle',()=>{const r=createRun();input(r,'jump');r.paused=true;step(r,20);assert.equal(r.distance,0);assert.equal(r.jumpTime,.96);r.paused=false;step(r,20);assert.ok(r.distance<=.25);});
test('assisted mode waits for input and can finish every course',()=>{for(let seed=0;seed<6;seed++){const r=drive(createRun(seed,true),false);assert.equal(r.status,'running');assert.ok(r.distance<13);assert.equal(drive(r).status,'complete');}});
test('repeated lane input stays in exactly two lanes and jump cannot stack',()=>{const r=createRun();for(let i=0;i<20;i++)input(r,'left');assert.equal(r.lane,0);for(let i=0;i<20;i++)input(r,'right');assert.equal(r.lane,1);input(r,'jump');step(r,.1);const t=r.jumpTime;input(r,'jump');assert.equal(r.jumpTime,t);});
test('four directional swipes ignore taps and ambiguous diagonals',()=>{
 assert.equal(swipeAction(80,6),'right');assert.equal(swipeAction(-80,6),'left');assert.equal(swipeAction(4,-75),'jump');assert.equal(swipeAction(4,75),'slide');
 for(const [x,y] of [[10,0],[0,20],[40,40],[-30,30]])assert.equal(swipeAction(x,y),null);
});
test('sliding clears a low wall but never a crack or rubble',()=>{
 for(const type of ['wall','crack','rubble']){const r=createRun(1);r.distance=41;r.lane=1;r.events=[{type,at:42,lane:type==='crack'?null:1,cleared:false}];input(r,'slide');for(let i=0;i<20&&r.status==='running';i++)step(r,.02);assert.equal(r.status,type==='wall'?'running':'hit');}
});
test('slide and jump are exclusive, recover, and pause without expiring',()=>{
 const r=createRun();input(r,'slide');input(r,'jump');assert.equal(r.jumpTime,0);step(r,.05);r.paused=true;const t=r.slideTime;step(r,5);assert.equal(r.slideTime,t);r.paused=false;
 for(let i=0;i<30;i++)step(r,.05);assert.equal(r.duck,0);input(r,'jump');input(r,'slide');assert.equal(r.slideTime,0);assert.ok(r.jumpTime>0);
});
test('ship courses can finish using slide in the blocked shutter lanes',()=>{
 for(let seed=1;seed<8;seed+=2){const r=createRun(seed);r.lane=1;for(let i=0;i<1500&&r.status==='running';i++){
  const e=upcoming(r),d=e?e.at-r.distance:100;
  if(e?.type==='crack'&&d<2&&r.jumpTime===0)input(r,'jump');
  if(e?.type==='turn'&&d<8)input(r,e.direction);
  if(e?.type==='rubble'&&d<8)input(r,e.lane===0?'right':'left');
  if(e?.type==='wall'&&d<8){input(r,e.lane===0?'left':'right');if(d<2&&r.slideTime===0)input(r,'slide');}step(r,1/60);
 }assert.equal(r.status,'complete');}
});
test('each maze has six spaced ship traps and a clear approach to its junction',()=>{
 for(let hall=0;hall<3;hall++){const course=courseFor(hall),traps=course.filter(e=>e.type!=='turn');assert.equal(traps.length,6);assert.ok(traps.some(e=>e.at<TURN_AT)&&traps.some(e=>e.at>TURN_AT));for(let i=1;i<course.length;i++)assert.ok(course[i].at-course[i-1].at>=10);assert.ok(LENGTH-traps.at(-1).at>=12);}
});
test('three different junctions each offer left, straight and right with one warning-marked exit',()=>{
 assert.equal(DIRECTIONS.length,3);assert.deepEqual(ROUTES.map(r=>r.correct),[0,1,2]);
 const signs=new Set();for(const route of ROUTES){assert.equal(route.doors.length,3);route.doors.forEach((door,i)=>{const text=door.join(' ');assert.ok(!signs.has(text));signs.add(text);assert.match(text,i===route.correct?/GET OUT|KEEP RUNNING|DO NOT LOOK BACK/:/MOM|LOVE|LOVED/);});}
});
