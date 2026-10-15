import test from 'node:test';
import assert from 'node:assert/strict';
import {createFeedback,FEEDBACK_STORAGE_KEY} from '../../play/misinformation/feedback.js';

function memory(){const values=new Map();return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};}
class FakeAudioContext{
  currentTime=10;destination={};oscillators=[];resumes=0;closed=0;
  createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}
  createOscillator(){
    const osc={starts:[],stops:[],frequencies:[],connect(){},disconnect(){},
      start(t){this.starts.push(t);},stop(t){this.stops.push(t);}};
    osc.frequency={setValueAtTime:(f,t)=>osc.frequencies.push([f,t]),exponentialRampToValueAtTime:(f,t)=>osc.frequencies.push([f,t])};
    this.oscillators.push(osc);return osc;
  }
  resume(){this.resumes++;return Promise.resolve();}
  close(){this.closed++;return Promise.resolve();}
  finish(){for(const oscillator of this.oscillators)oscillator.onended?.();}
}
function rig(storage=memory()){
  const audio=new FakeAudioContext(),vibrations=[];let factories=0,time=1000;
  const feedback=createFeedback({storage,audioContextFactory:()=>{factories++;return audio;},navigator:{vibrate:value=>vibrations.push(value)},now:()=>time});
  return {feedback,audio,storage,vibrations,factories:()=>factories,advance:ms=>time+=ms};
}

test('default remains silent and creates no AudioContext until explicit opt-in',()=>{
  const r=rig();assert.equal(r.feedback.soundEnabled(),false);assert.equal(r.factories(),0);
  for(const type of ['typing','accept','reject','launch','hit','pass','win'])assert.equal(r.feedback.trigger({type,ordinal:'run-a:1'}),false);
  assert.equal(r.factories(),0);assert.deepEqual(r.vibrations,[]);
  assert.equal(r.feedback.toggleSound(),true);assert.equal(r.factories(),1);
  assert.equal(r.feedback.trigger({type:'launch',ordinal:'run-a:1'}),false,'Muted resolved cues remain consumed');
  assert.equal(r.feedback.trigger({type:'launch',ordinal:'run-a:2'}),true);
});

test('sound setting persists while context initialization stays lazy after reload',()=>{
  const r=rig();r.feedback.toggleSound();
  const next=rig(r.storage);assert.equal(next.feedback.soundEnabled(),true);assert.equal(next.factories(),0);
  assert.equal(next.feedback.trigger({type:'accept'}),true);assert.equal(next.factories(),1);
  assert.equal(next.feedback.toggleSound(),false);
  assert.equal(rig(r.storage).feedback.soundEnabled(),false);
});

test('resolved type and ordinal deduplicate across reload without double haptics',()=>{
  const r=rig();r.feedback.toggleSound();
  assert.equal(r.feedback.trigger({type:'launch',tier:5,ordinal:'run-a:20'}),true);
  const count=r.audio.oscillators.length;
  assert.equal(r.feedback.trigger({type:'launch',tier:5,ordinal:'run-a:20'}),false);
  assert.equal(r.audio.oscillators.length,count);
  assert.equal(r.feedback.trigger({type:'win',ordinal:'run-a:20'}),true,'Win can follow launch for one answer');
  assert.deepEqual(r.vibrations,[12]);
  assert.equal(r.feedback.trigger({type:'hit',ordinal:'run-a:20'}),true);
  assert.deepEqual(r.vibrations,[12],'One physical feedback per resolved ordinal');
  const next=rig(r.storage);
  assert.equal(next.feedback.trigger({type:'win',ordinal:'run-a:20'}),false);
  assert.equal(next.factories(),0,'Duplicate restored cues do not start audio');
  assert.equal(next.feedback.trigger({type:'launch',ordinal:'run-b:20'}),true,'New run identity avoids a collision');
});

test('typing feedback throttles at eighty milliseconds and invalid events do nothing',()=>{
  const r=rig();r.feedback.toggleSound();
  assert.equal(r.feedback.trigger({type:'typing'}),true);
  r.advance(79);assert.equal(r.feedback.trigger({type:'typing'}),false);
  r.advance(1);assert.equal(r.feedback.trigger({type:'typing'}),true);
  assert.equal(r.feedback.trigger({type:'not-a-cue'}),false);
  for(const type of ['launch','hit','pass','win'])assert.equal(r.feedback.trigger({type}),false,'Resolved cues need an ordinal');
});

test('rarity adds bounded original notes and every source has a scheduled stop',()=>{
  const common=rig();common.feedback.toggleSound();common.feedback.trigger({type:'launch',tier:0,ordinal:'a:1'});
  const rare=rig();rare.feedback.toggleSound();rare.feedback.trigger({type:'launch',tier:5,streak:8,ordinal:'a:1'});
  assert.ok(rare.audio.oscillators.length>common.audio.oscillators.length);
  assert.ok(rare.audio.oscillators.length<=8);
  for(const r of [common,rare])for(const osc of r.audio.oscillators){
    assert.equal(osc.starts.length,1);assert.equal(osc.stops.length,1);
    assert.ok(osc.stops[0]>osc.starts[0]&&osc.stops[0]-osc.starts[0]<1);
    assert.ok(osc.frequencies.every(([f])=>Number.isFinite(f)&&f>0&&f<5000));
    assert.notEqual(osc.loop,true);
  }
  const burst=rig();burst.feedback.toggleSound();
  for(let i=0;i<30;i++)burst.feedback.trigger({type:'win',ordinal:`run:${i}`});
  assert.ok(burst.audio.oscillators.length<=24,'Burst voice budget prevents an unbounded audio pileup');
  burst.audio.finish();assert.equal(burst.feedback.trigger({type:'launch',ordinal:'run:31'}),true);
});

test('missing audio, blocked storage, vibration errors and malformed settings degrade quietly',()=>{
  const missing=createFeedback({storage:memory(),audioContextFactory:()=>null,navigator:null});
  assert.equal(missing.toggleSound(),false);assert.equal(missing.soundEnabled(),false);
  assert.equal(missing.trigger({type:'launch',ordinal:1}),false);
  const badStore={getItem(){throw Error('denied');},setItem(){throw Error('denied');}};
  const audio=new FakeAudioContext();
  const blocked=createFeedback({storage:badStore,audioContextFactory:()=>audio,navigator:{vibrate(){throw Error('unsupported');}}});
  assert.equal(blocked.toggleSound(),true);assert.equal(blocked.trigger({type:'hit',ordinal:'r:1'}),true);
  const malformed=memory();malformed.setItem(FEEDBACK_STORAGE_KEY,'not json');
  assert.equal(rig(malformed).feedback.soundEnabled(),false);
  const throws=createFeedback({storage:memory(),audioContextFactory(){throw Error('unsupported');}});
  assert.equal(throws.toggleSound(),false);
});

test('mute and destroy stop active voices, close once and retain a bounded replay ledger',()=>{
  const r=rig();r.feedback.toggleSound();r.feedback.trigger({type:'launch',ordinal:'a:1'});
  const first=r.audio.oscillators[0];r.feedback.toggleSound();assert.equal(first.stops.length,2);
  r.feedback.toggleSound();
  for(let i=0;i<80;i++)r.feedback.trigger({type:'pass',ordinal:`a:${i}`});
  const saved=JSON.parse(r.storage.getItem(FEEDBACK_STORAGE_KEY));assert.ok(saved.seen.length<=32);assert.ok(saved.haptics.length<=32);
  r.feedback.destroy();r.feedback.destroy();assert.equal(r.audio.closed,1);
  assert.equal(r.feedback.trigger({type:'win',ordinal:'a:81'}),false);assert.equal(r.feedback.toggleSound(),false);
});
