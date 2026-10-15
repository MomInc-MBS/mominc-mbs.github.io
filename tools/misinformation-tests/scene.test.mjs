import test from 'node:test';import assert from 'node:assert/strict';import {sceneFrame} from '../../play/misinformation/scene.js';
import {freshRun,beginQuestion,acceptAnswer,classify,skip,STATION,LEVELS,levelIndex,bandIndex} from '../../play/misinformation/engine.js';
import {renderScene,mobileSceneFrame} from '../../play/misinformation/scene.js';
test('every depth band maps to a different cell of the two-by-four atlas',()=>{const cells=[];for(let i=0;i<8;i++){const f=sceneFrame({distance:i*12500,hits:0,phase:'result'});cells.push(`${f.x},${f.y}`);assert.equal(f.layer,i);assert.ok(f.x===0||f.x===100);assert.ok(f.y>=0&&f.y<=100);}assert.equal(new Set(cells).size,8);});
test('damage closes the chase gap, and caught/docked states stay visible',()=>{const frames=[0,1,2].map(hits=>sceneFrame({distance:50000,hits,phase:'result'}));assert.ok(frames[0].player-frames[0].pursuer>frames[1].player-frames[1].pursuer);assert.ok(frames[1].player-frames[1].pursuer>frames[2].player-frames[2].pursuer);assert.match(sceneFrame({distance:100000,hits:0,phase:'escaped'}).status,/REACHED/);assert.match(sceneFrame({distance:0,hits:3,phase:'dead'}).status,/CAUGHT/);});

const prompt={id:'motion-test',band:0,answers:[{id:'common',tier:0},{id:'rare',tier:5}]};
const common={id:'common',classification:'event'},rare={id:'rare',classification:'event'};
function resolve(state,subject=common,choice='event'){
 return classify(acceptAnswer(beginQuestion(state,prompt),subject,prompt),subject,prompt,choice);
}
test('low answers, wrong classifications, and passes advance the visual chase without fake fuel',()=>{
 const before=sceneFrame(freshRun());
 const low=resolve(freshRun()),wrong=resolve(freshRun(),rare,'claim'),passed=skip(beginQuestion(freshRun(),prompt));
 for(const state of [low,wrong,passed]){
  const f=sceneFrame(state);assert.ok(f.player>before.player);assert.ok(f.pursuer>before.pursuer);assert.equal(f.motion,1);
 }
 assert.equal(low.distance,5000);assert.equal(low.score,10);
 assert.equal(wrong.distance,0);assert.equal(wrong.score,0);assert.equal(wrong.hits,1);
 assert.equal(passed.distance,0);assert.equal(passed.score,0);assert.equal(passed.hits,0);
 assert.equal(sceneFrame(wrong).outcome,'hit');assert.equal(sceneFrame(passed).outcome,'pass');
});
test('both craft approach the final desk monotonically until an ordinary twenty-answer win',()=>{
 let state=freshRun(),previous=sceneFrame(state);
 const visited=new Set([previous.level]);
 for(let i=0;i<20;i++){
  state=resolve(state);const f=sceneFrame(state);
  assert.ok(f.player>=previous.player);assert.ok(f.pursuer>=previous.pursuer);
  assert.ok(f.player<=(state.phase==='escaped'?80:72));assert.ok(f.pursuer<f.player);assert.ok(f.pursuer>=0);
  assert.equal(f.motion,i+1);assert.equal(f.level,levelIndex(state.distance));visited.add(f.level);previous=f;
 }
 assert.equal(state.distance,STATION);assert.equal(state.phase,'escaped');assert.equal(previous.player,80);
 assert.equal(visited.size,20);assert.equal(state.pristine,false);
});
test('top answers open a wider chase gap while only the third hit produces a catch',()=>{
 const low=sceneFrame(resolve(freshRun())),top=sceneFrame(resolve(freshRun(),rare));
 assert.ok(top.player-top.pursuer>low.player-low.pursuer);
 let state=freshRun();
 for(let i=1;i<=3;i++){
  state=resolve(state,rare,'claim');const f=sceneFrame(state);
  assert.equal(state.phase,i===3?'dead':'result');
  assert.ok(f.player>f.pursuer);if(i<3)assert.ok(f.player-f.pursuer>=6);
 }
 assert.match(sceneFrame(state).status,/CAUGHT/);
});
test('existing saved fields reproduce identical scene positions and ordinal after reload',()=>{
 let state=resolve(freshRun());state=skip(beginQuestion(state,prompt));state=resolve(state,rare,'claim');
 assert.deepEqual(sceneFrame(JSON.parse(JSON.stringify(state))),sceneFrame(state));
 assert.equal(sceneFrame({distance:0,hits:0,phase:'result',history:[{skipped:true}]}).motion,1);
});
test('each resolved ordinal retriggers one flyby; rerenders and reload do not, reduced motion suppresses it',t=>{
 const originalDocument=globalThis.document,originalMedia=globalThis.matchMedia;
 t.after(()=>{globalThis.document=originalDocument;globalThis.matchMedia=originalMedia;});
 let bursts=0;
 const classes=new Set();
 const scene={dataset:{},offsetWidth:365,style:{setProperty(){}},classList:{remove:c=>classes.delete(c),add:c=>{classes.add(c);bursts++;}}};
 const elements={'#space-scene':scene,'#rocket':{style:{}},'#pursuer':{style:{}},'#chase-status':{textContent:''}};
 globalThis.document={querySelector:s=>elements[s],querySelectorAll:()=>[]};
 globalThis.matchMedia=()=>({matches:false});
 renderScene(freshRun());assert.equal(bursts,0);
 const first=resolve(freshRun());renderScene(first);renderScene(first);assert.equal(bursts,1);
 const second=skip(beginQuestion(first,prompt));renderScene(second);assert.equal(bursts,2);
 assert.equal(scene.dataset.motionOrdinal,'2');
 // A pass before the final desk still generates a visible beat without fuel.
 renderScene({...second,rounds:1000,distance:95000,score:190});assert.equal(bursts,3);
 renderScene({...second,rounds:1001,distance:95000,score:190});assert.equal(bursts,4);
 globalThis.matchMedia=()=>({matches:true});renderScene({...second,rounds:1002});assert.equal(bursts,4);
 assert.ok(!classes.has('flight-step'));
 delete scene.dataset.motionOrdinal;renderScene(first);assert.equal(bursts,4);
});
test('the inline chase stays short of the station until the reachable ordinary-answer win',()=>{
 let state=freshRun(),previous=mobileSceneFrame(sceneFrame(state));
 for(let i=0;i<19;i++){
  state=resolve(state);const mini=mobileSceneFrame(sceneFrame(state));
  assert.ok(mini.player>=previous.player);assert.ok(mini.pursuer>=previous.pursuer);
  assert.ok(mini.pursuer<mini.player);assert.ok(mini.player<mini.station);assert.ok(mini.pursuer>0);
  previous=mini;
 }
 state=resolve(state);assert.equal(state.phase,'escaped');
 const docked=mobileSceneFrame(sceneFrame(state));
 assert.ok(docked.player>previous.player);assert.ok(docked.player<=docked.station);
 assert.deepEqual(mobileSceneFrame(sceneFrame(JSON.parse(JSON.stringify(state)))),docked);
});
test('twenty visual levels preserve the separate eight-band question difficulty mapping',()=>{
 assert.equal(LEVELS.length,20);const art=new Set();
 for(let i=0;i<20;i++){
  const distance=i*5000,frame=sceneFrame({distance,score:i*10,hits:0,rounds:i,phase:i===0?'ready':'result'});
  assert.equal(frame.level,i);assert.equal(frame.layer,bandIndex(distance));
  assert.equal(frame.effect,LEVELS[i].effect);assert.match(frame.art,/^assets\/journey\/.+\.svg$/);art.add(frame.art);
  assert.ok(frame.player<=72);assert.ok(frame.pursuer<frame.player);
  assert.deepEqual(sceneFrame(JSON.parse(JSON.stringify({distance,score:i*10,hits:0,rounds:i,phase:i===0?'ready':'result'}))),frame);
 }
 assert.equal(art.size,20);
});
test('the inline HUD receives atlas, ordinal, progress and independent pulses while rerenders remain quiet',t=>{
 const originalDocument=globalThis.document,originalMedia=globalThis.matchMedia;
 t.after(()=>{globalThis.document=originalDocument;globalThis.matchMedia=originalMedia;});
 function surface(){const vars={},classes=new Set();return {vars,classes,dataset:{},offsetWidth:300,
  style:{setProperty:(key,value)=>vars[key]=value},classList:{remove:c=>classes.delete(c),add:c=>classes.add(c)},
  setAttribute(name,value){this[name]=value;}};}
 const scene=surface(),mini=surface(),label={textContent:''};mini.querySelector=()=>label;
 const elements={'#space-scene':scene,'#mobile-chase':mini,'#rocket':{style:{}},'#pursuer':{style:{}},'#chase-status':{textContent:''}};
 globalThis.document={querySelector:s=>elements[s],querySelectorAll:()=>[]};
 globalThis.matchMedia=()=>({matches:false});
 renderScene(freshRun());assert.ok(!mini.classes.has('flight-step'));
 const first=resolve(freshRun());renderScene(first);
 assert.equal(mini.dataset.motionOrdinal,'1');assert.ok(mini.classes.has('flight-step'));
 assert.equal(mini.vars['--space-x'],scene.vars['--space-x']);
 assert.equal(mini.vars['--space-y'],scene.vars['--space-y']);
 assert.equal(mini.vars['--mini-player-x'],`${mobileSceneFrame(sceneFrame(first)).player}%`);
 assert.match(label.textContent,/02 \/ 20/);assert.ok(label.textContent.includes(LEVELS[1].name.toUpperCase()));
 assert.equal(mini.dataset.level,'1');assert.match(mini.vars['--journey-art'],/02-vents\.svg/);
 assert.match(mini['aria-label'],/Live saucer chase/);
 // A scoreboard/hint rerender leaves the completed animation alone.
 mini.classes.delete('flight-step');renderScene(first);assert.ok(!mini.classes.has('flight-step'));
 const second=skip(beginQuestion(first,prompt));renderScene(second);assert.ok(mini.classes.has('flight-step'));
 assert.equal(mini.dataset.motionOutcome,'pass');
 globalThis.matchMedia=()=>({matches:true});renderScene(resolve(second,rare,'claim'));
 assert.ok(!mini.classes.has('flight-step'));assert.equal(mini.dataset.hits,'1');
});
