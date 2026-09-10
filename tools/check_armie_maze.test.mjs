import test from 'node:test';
import assert from 'node:assert/strict';
import {LANES,TRAPS,createRun,courseFor,input,step,upcoming,pathAt} from '../tv/assets/armie-intro/maze-run.mjs';

function drive(run,actions=true){for(let i=0;i<3000&&run.status==='running';i++){
 const e=upcoming(run),d=e?e.at-run.distance:100;
 if(actions&&e){if(e.type==='crack'&&d<2.1&&run.jumpTime===0)input(run,'jump');if(e.type==='turn'&&d<9)input(run,e.direction);if(['wall','rubble'].includes(e.type)&&d<8)input(run,e.lane===0?'right':'left');}
 step(run,1/60);
}return run;}
test('all course variants have two lanes, only three trap designs, and a real 90-degree turn',()=>{
 assert.equal(LANES.length,2);const types=new Set();
 for(let seed=0;seed<12;seed++){for(const e of courseFor(seed))if(e.type!=='turn'){types.add(e.type);assert.ok(e.lane===null||[0,1].includes(e.lane));}const p=pathAt(40,seed);assert.equal(Math.abs(p.yaw),Math.PI/2);assert.equal(Math.abs(p.x),12);assert.equal(p.z,-28);}
 assert.deepEqual([...types].sort(),[...TRAPS].sort());
});
test('all runs are solvable at normal speed with visible warning windows',()=>{for(let seed=0;seed<12;seed++)assert.equal(drive(createRun(seed)).status,'complete');});
test('missing a crack produces one hit and stops progress',()=>{const r=drive(createRun(0),false);assert.equal(r.status,'hit');assert.equal(r.hit,'crack');const d=r.distance;for(let i=0;i<50;i++)step(r,.05);assert.equal(r.distance,d);});
test('jump cannot bypass a sliding wall, while the open lane is safe',()=>{const r=createRun(1);r.distance=41.99;r.events[0].cleared=r.events[1].cleared=true;r.lane=1;r.jumpTime=.5;step(r,.02);assert.equal(r.hit,'wall');const clear=createRun(1);clear.distance=41.99;clear.events[0].cleared=clear.events[1].cleared=true;clear.lane=0;step(clear,.02);assert.equal(clear.status,'running');});
test('wrong corner choice fails and early left/right inputs only change lane',()=>{const r=createRun(0);input(r,'right');assert.equal(r.lane,1);assert.equal(r.turn,null);r.distance=27.99;r.events[0].cleared=true;input(r,'right');step(r,.02);assert.equal(r.hit,'turn');});
test('pause freezes jump and distance; background time cannot skip an obstacle',()=>{const r=createRun();input(r,'jump');r.paused=true;step(r,20);assert.equal(r.distance,0);assert.equal(r.jumpTime,.96);r.paused=false;step(r,20);assert.ok(r.distance<=.25);});
test('assisted mode waits for input and can finish every course',()=>{for(let seed=0;seed<6;seed++){const r=drive(createRun(seed,true),false);assert.equal(r.status,'running');assert.ok(r.distance<13);assert.equal(drive(r).status,'complete');}});
test('repeated lane input stays in exactly two lanes and jump cannot stack',()=>{const r=createRun();for(let i=0;i<20;i++)input(r,'left');assert.equal(r.lane,0);for(let i=0;i<20;i++)input(r,'right');assert.equal(r.lane,1);input(r,'jump');step(r,.1);const t=r.jumpTime;input(r,'jump');assert.equal(r.jumpTime,t);});
