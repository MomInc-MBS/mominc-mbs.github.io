import test from 'node:test';
import assert from 'node:assert/strict';
import {reactionFor,mountFlightFX,playFlightReaction} from '../../play/misinformation/flight-fx.js';
import {POINTS} from '../../play/misinformation/engine.js';

test('rarity increases celebration while displayed points and travel remain the actual awards',()=>{
  const reactions=POINTS.map((points,tier)=>reactionFor({type:'launch',tier,travelled:1234,streak:3}));
  assert.equal(new Set(reactions.map(r=>r.headline)).size,POINTS.length);
  for(let tier=0;tier<POINTS.length;tier++){
    const reaction=reactions[tier];
    assert.equal(reaction.tier,tier);
    assert.ok(reaction.detail.includes(`+${POINTS[tier]} POINTS`));
    assert.ok(reaction.detail.includes('+1,234 KM'),'Show actual travel, including a shortened final leg');
    assert.ok(reaction.detail.includes('3 IN A ROW'));
    assert.ok(!/multiplier|combo bonus|\bx\d/i.test(reaction.detail),'A streak is not an invented score multiplier');
    assert.ok(reaction.quip);
    if(tier)assert.ok(reaction.duration>reactions[tier-1].duration);
  }
  assert.match(reactions[0].headline,/NICE/);assert.match(reactions.at(-1).headline,/MOTHERLODE/);
  const still=reactionFor({type:'launch',tier:5,travelled:0,streak:1});
  assert.ok(still.detail.includes('+0 KM'));assert.ok(!still.detail.includes('IN A ROW'));
  assert.equal(reactionFor({type:'launch',tier:99}).tier,5);
  assert.equal(reactionFor({type:'launch',tier:-9}).tier,0);
  assert.equal(reactionFor({type:'launch',tier:NaN}).tier,0);
});

test('accept, hit, pass, rejection and escape explain their actual outcomes',()=>{
  assert.match(reactionFor({type:'accept'}).detail,/EXACT STATEMENT/);
  assert.match(reactionFor({type:'hit'}).headline,/HULL HIT/);
  assert.match(reactionFor({type:'hit'}).detail,/CLOSING IN/);
  assert.match(reactionFor({type:'pass'}).detail,/NEXT SIGNAL/);
  assert.match(reactionFor({type:'reject'}).detail,/NO DAMAGE/);
  assert.match(reactionFor({type:'win'}).headline,/GOT OUT/);
  for(const type of ['accept','hit','pass','reject','win']){
    const reaction=reactionFor({type,tier:5,travelled:5000});
    assert.ok(!/\+\d.*POINTS/.test(reaction.detail),`${type}: do not claim a launch award`);
    assert.ok(reaction.duration>0&&reaction.duration<5000);
  }
});

function layer(initial=0){
  let html='',writes=0;
  return {children:Array.from({length:initial},()=>({})),get writes(){return writes;},get innerHTML(){return html;},
    set innerHTML(value){html=value;writes++;this.children=Array.from(value.matchAll(/<i\b/g),()=>({}));}};
}
function surface(){
  const strong={textContent:''},span={textContent:''},classes=new Set(),operations=[],properties=new Map();let layouts=0;
  return {dataset:{},operations,properties,strong,span,classes,
    classList:{remove:name=>{operations.push(`remove:${name}`);classes.delete(name);},add:name=>{operations.push(`add:${name}`);classes.add(name);}},
    style:{setProperty:(key,value)=>properties.set(key,value)},
    querySelector:selector=>selector==='.flight-reaction'?{querySelector:tag=>tag==='strong'?strong:span}:null,
    get offsetWidth(){layouts++;return 200;},get layouts(){return layouts;}};
}

test('mount initializes deterministic swooshes once without retriggering a reaction',()=>{
  const first=layer(),second=layer(),existing=layer(1),scene=surface();
  const doc={querySelectorAll:selector=>selector==='.flight-speedlines'?[first,second,existing]:[scene]};
  mountFlightFX(doc);
  assert.ok(first.children.length>0&&first.children.length<=20);
  assert.equal(first.innerHTML,second.innerHTML,'Independent mounts build the same stable illustration');
  assert.equal(first.writes,1);assert.equal(existing.writes,0);
  mountFlightFX(doc);mountFlightFX(doc);
  assert.equal(first.writes,1);assert.equal(second.writes,1);
  assert.deepEqual(scene.operations,[],'Passive mount/render work does not replay a celebration');
});

test('explicit reactions retrigger both surfaces and replace their previous cleanup timer',t=>{
  const timers=new Map(),cleared=[];let sequence=0;
  t.mock.method(globalThis,'setTimeout',(callback,delay)=>{const id=++sequence;timers.set(id,{callback,delay});return id;});
  t.mock.method(globalThis,'clearTimeout',id=>{cleared.push(id);timers.delete(id);});
  const desktop=surface(),phone=surface(),lines=layer();
  const doc={querySelectorAll:selector=>selector==='.flight-speedlines'?[lines]:[desktop,phone]};
  const launch=playFlightReaction({type:'launch',tier:4,travelled:7000},doc);
  const firstTimer=sequence;
  for(const target of [desktop,phone]){
    assert.equal(target.dataset.reaction,'launch');assert.equal(target.dataset.rarity,'4');
    assert.equal(target.strong.textContent,launch.headline);assert.equal(target.span.textContent,launch.detail);
    assert.ok(target.classes.has('input-reaction'));assert.equal(target.layouts,1);
  }
  mountFlightFX(doc);
  assert.equal(sequence,firstTimer,'Mounting after a reaction schedules no duplicate timeout');
  assert.equal(desktop.layouts,1);
  const hit=playFlightReaction({type:'hit'},doc);
  assert.ok(cleared.includes(firstTimer));assert.ok(!timers.has(firstTimer));assert.equal(timers.size,1);
  for(const target of [desktop,phone]){
    assert.equal(target.dataset.reaction,'hit');assert.equal(target.strong.textContent,hit.headline);
    assert.equal(target.layouts,2,'Only a second explicit reaction restarts the CSS transition');
    assert.equal(target.operations.filter(op=>op==='add:input-reaction').length,2);
  }
  const pending=timers.get(sequence);assert.equal(pending.delay,hit.duration);
  pending.callback();
  assert.ok(!desktop.classes.has('input-reaction'));assert.ok(!phone.classes.has('input-reaction'));
});
