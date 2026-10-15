import test from 'node:test';
import assert from 'node:assert/strict';
import {LEVELS,freshRun,STATION} from '../../play/misinformation/engine.js';
import {ROUTE_SEGMENTS,ROUTE_PATH,ROUTE_LENGTH,ROUTE_STOPS,pointAtProgress,minimapFrame,mountMinimaps,renderMinimaps} from '../../play/misinformation/minimap.js';

test('the route has multiple continuous winding bends, not a straight progress line',()=>{
 assert.equal(ROUTE_SEGMENTS.length,8);assert.equal((ROUTE_PATH.match(/C /g)??[]).length,8);
 for(let i=1;i<ROUTE_SEGMENTS.length;i++)assert.deepEqual(ROUTE_SEGMENTS[i][0],ROUTE_SEGMENTS[i-1][3]);
 const start=pointAtProgress(0),end=pointAtProgress(1),direct=Math.hypot(end.x-start.x,end.y-start.y);
 assert.ok(ROUTE_LENGTH>direct*2.5);
 let reversals=0,previousSign=0;
 for(let i=1;i<=100;i++){
  const a=pointAtProgress((i-1)/100),b=pointAtProgress(i/100),sign=Math.sign(b.x-a.x);
  if(previousSign&&sign&&previousSign!==sign)reversals++;
  if(sign)previousSign=sign;
 }
 assert.ok(reversals>=2);
});
test('twenty ordered stops start at Office, reach the actual Mothership goal, and group dimensions',()=>{
 assert.equal(ROUTE_STOPS.length,20);assert.deepEqual(ROUTE_STOPS.map(s=>s.name),LEVELS.map(l=>l.name));
 assert.equal(ROUTE_STOPS[0].progress,0);assert.equal(ROUTE_STOPS.at(-1).progress,1);
 for(let i=1;i<20;i++)assert.ok(ROUTE_STOPS[i].distance>ROUTE_STOPS[i-1].distance);
 assert.deepEqual(ROUTE_STOPS.map(s=>s.group),[...Array(6).fill('grounded'),...Array(4).fill('folds'),...Array(10).fill('dimensions')]);
 assert.ok(ROUTE_STOPS.every(s=>s.x>=0&&s.x<=500&&s.y>=0&&s.y<=180));
});
test('arc-length movement is monotonic and smooth through every bend with clamped bounds',()=>{
 let previous=pointAtProgress(0);
 for(let i=1;i<=1000;i++){
  const p=pointAtProgress(i/1000);assert.ok(p.distance>previous.distance);
  assert.ok(Math.hypot(p.x-previous.x,p.y-previous.y)<=ROUTE_LENGTH/1000*1.001);
  previous=p;
 }
 assert.deepEqual(pointAtProgress(-3),pointAtProgress(0));assert.deepEqual(pointAtProgress(3),pointAtProgress(1));
 assert.deepEqual(pointAtProgress(NaN),pointAtProgress(0));
});
test('progress uses distance only and survives reload; only a dead phase puts MOM at the player',()=>{
 const state={...freshRun(),distance:50000,score:999999,hits:1,rounds:7,phase:'result'};
 const frame=minimapFrame(state);assert.equal(frame.progress,.5);assert.equal(frame.level,10);
 assert.ok(frame.pursuer.progress<frame.player.progress);assert.equal(frame.caught,false);
 assert.deepEqual(minimapFrame(JSON.parse(JSON.stringify(state))),frame);
 assert.ok(minimapFrame({...state,hits:2}).pursuer.progress>frame.pursuer.progress);
 const dead=minimapFrame({...state,hits:3,phase:'dead'});assert.equal(dead.pursuer.progress,dead.player.progress);assert.equal(dead.caught,true);
 assert.equal(minimapFrame({...state,distance:STATION+50000,phase:'escaped'}).progress,1);
 assert.equal(minimapFrame({...state,distance:-1}).progress,0);
 assert.equal(minimapFrame({...state,distance:NaN}).progress,0);
});
function fakeHost(){
 let html='',writes=0;const nodes=new Map();
 const node=()=>({attrs:{},textContent:'',setAttribute(name,value){this.attrs[name]=value;},removeAttribute(name){delete this.attrs[name];},classList:{toggle(){}}});
 const stops=Array.from({length:20},node);
 return {dataset:{},get innerHTML(){return html;},set innerHTML(value){html=value;writes++;},get writes(){return writes;},
  querySelector(selector){if(!nodes.has(selector))nodes.set(selector,node());return nodes.get(selector);},querySelectorAll(){return stops;}};
}
test('two map instances mount idempotently with unique SVG IDs and update the same current level',()=>{
 const desktop=fakeHost(),mobile=fakeHost();
 const doc={querySelector:selector=>selector==='#journey-minimap'?desktop:selector==='#mobile-minimap'?mobile:null};
 assert.equal(mountMinimaps(doc).length,2);mountMinimaps(doc);assert.equal(desktop.writes,1);assert.equal(mobile.writes,1);
 const ids=[...`${desktop.innerHTML}${mobile.innerHTML}`.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,6);assert.equal(new Set(ids).size,6);
 for(const host of [desktop,mobile]){
  const references=[...host.innerHTML.matchAll(/(?:aria-labelledby|aria-describedby)="([^"]+)"/g)].map(m=>m[1]);
  assert.ok(references.every(id=>host.innerHTML.includes(`id="${id}"`)));
 }
 const frame=renderMinimaps({...freshRun(),distance:45000,rounds:9,phase:'result'});
 assert.equal(frame.level,9);
 for(const host of [desktop,mobile]){
  assert.equal(host.dataset.level,'9');assert.equal(host.querySelector('.winding-map-name').textContent,LEVELS[9].name);
  assert.equal(host.querySelector('.winding-map-level').textContent,'10 / 20');
  assert.equal(host.querySelector('.winding-map-progress').attrs['stroke-dashoffset'],'0.55');
  assert.equal(host.writes,1);
 }
});
