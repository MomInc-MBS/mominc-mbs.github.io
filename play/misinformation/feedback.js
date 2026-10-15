// Original, short Web Audio cues. No samples, autoplay, timers or audio loops.
export const FEEDBACK_STORAGE_KEY='mom-misinformation-feedback-v1';
const RESOLVED=new Set(['launch','hit','pass','win']);
const TYPES=new Set(['accept','launch','hit','pass','reject','typing','win']);
const THROTTLE={typing:80,accept:100,reject:180};
const MAX_REMEMBERED=32,MAX_VOICES=24;
const CHIME=[523.25,659.25,783.99,1046.5,1318.51,1567.98];

function localStorageOrNull(){try{return globalThis.localStorage||null;}catch{return null;}}
function defaultAudioFactory(){
  const Constructor=globalThis.AudioContext||globalThis.webkitAudioContext;
  return typeof Constructor==='function'?new Constructor():null;
}
const bounded=(value,min,max)=>typeof value==='number'&&Number.isFinite(value)?Math.min(max,Math.max(min,Math.floor(value))):min;
const ordinalKey=value=>typeof value==='string'&&value.length>0&&value.length<=140?value
  :typeof value==='number'&&Number.isSafeInteger(value)&&value>=0?String(value):null;
function remembered(value){return Array.isArray(value)?value.filter(v=>typeof v==='string'&&v.length<=170).slice(-MAX_REMEMBERED):[];}

/**
 * Sound defaults off. toggleSound() belongs in an explicit user button handler;
 * a restored opt-in initializes audio lazily at the next action, never at render.
 * Use a stable run-scoped ordinal, e.g. `${runId}:${rounds}`, for resolved cues.
 * Return value from trigger means a cue was scheduled, not proof it was audible.
 */
export function createFeedback(options={}){
  const storage=options.storage===undefined?localStorageOrNull():options.storage;
  const audioFactory=options.audioContextFactory||defaultAudioFactory;
  const nav=options.navigator===undefined?globalThis.navigator:options.navigator;
  const now=typeof options.now==='function'?options.now:Date.now;
  let enabled=false,seen=[],haptics=[],context=null,master=null,destroyed=false;
  const voices=new Set(),lastAt=new Map();
  try{
    const saved=JSON.parse(storage?.getItem(FEEDBACK_STORAGE_KEY)||'null');
    if(saved?.version===1){enabled=saved.enabled===true;seen=remembered(saved.seen);haptics=remembered(saved.haptics);}
  }catch{/* Storage absence, denial or malformed saved settings keep a silent default. */}
  function persist(){
    try{storage?.setItem(FEEDBACK_STORAGE_KEY,JSON.stringify({version:1,enabled,seen,haptics}));}catch{}
  }
  function remember(key){seen=[...seen,key].slice(-MAX_REMEMBERED);persist();}
  function ensureContext(){
    if(destroyed)return null;
    if(context)return context;
    try{
      const candidate=audioFactory();
      if(!candidate||typeof candidate.createOscillator!=='function'||typeof candidate.createGain!=='function')return null;
      context=candidate;master=context.createGain();
      master.gain.setValueAtTime(.25,context.currentTime);
      master.connect(context.destination);
      return context;
    }catch{context=null;master=null;return null;}
  }
  function resume(){try{context?.resume?.()?.catch?.(()=>{});}catch{}}
  function stopVoices(){
    for(const voice of voices){try{voice.osc.stop();}catch{}try{voice.osc.disconnect();voice.gain.disconnect();}catch{}}
    voices.clear();
  }
  function note(frequency,offset,duration,{wave='sine',volume=.045,endFrequency}={}){
    if(!context||voices.size>=MAX_VOICES)return false;
    let osc,gain;
    try{
      osc=context.createOscillator();gain=context.createGain();
      const start=context.currentTime+.008+offset;
      osc.type=wave;
      osc.frequency.setValueAtTime(frequency,start);
      if(endFrequency)osc.frequency.exponentialRampToValueAtTime(endFrequency,start+duration);
      gain.gain.setValueAtTime(.0001,start);
      gain.gain.exponentialRampToValueAtTime(volume,start+Math.min(.012,duration/3));
      gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
      osc.connect(gain);gain.connect(master);
      const voice={osc,gain};voices.add(voice);
      osc.onended=()=>{voices.delete(voice);try{osc.disconnect();gain.disconnect();}catch{}};
      osc.start(start);osc.stop(start+duration+.015);
      return true;
    }catch{
      try{osc?.disconnect();gain?.disconnect();}catch{}
      for(const voice of voices)if(voice.osc===osc)voices.delete(voice);
      return false;
    }
  }
  function play(type,tier,streak){
    let scheduled=false;
    const add=(...args)=>{scheduled=note(...args)||scheduled;};
    if(type==='typing')add(880,0,.018,{volume:.009});
    if(type==='accept'){add(440,0,.055,{volume:.025});add(660,.035,.07,{volume:.025});}
    if(type==='reject'){add(220,0,.07,{wave:'triangle',volume:.025,endFrequency:165});}
    if(type==='pass')add(330,0,.11,{volume:.025,endFrequency:220});
    if(type==='hit'){
      add(150,0,.22,{wave:'triangle',volume:.065,endFrequency:45});
      add(65,.025,.11,{wave:'square',volume:.018,endFrequency:45});
    }
    if(type==='launch'){
      add(180,0,.17,{wave:'triangle',volume:.025,endFrequency:1100+tier*100});
      const count=Math.min(CHIME.length,2+tier);
      for(let i=0;i<count;i++)add(CHIME[i],.065+i*.05,.13,{volume:.04});
      if(streak>=3)add(CHIME.at(-1)*1.5,.1+count*.05,.1,{volume:.023});
    }
    if(type==='win'){
      add(261.625,0,.65,{wave:'triangle',volume:.045});
      for(let i=0;i<CHIME.length;i++)add(CHIME[i],i*.085,.2,{volume:.048});
      add(2093,.59,.26,{volume:.035});
    }
    return scheduled;
  }
  function vibrate(type,ordinal){
    if(!['launch','hit'].includes(type)||!ordinal||haptics.includes(ordinal))return;
    haptics=[...haptics,ordinal].slice(-MAX_REMEMBERED);persist();
    try{nav?.vibrate?.(type==='hit'?[18,30,18]:12);}catch{}
  }
  function trigger({type,tier=0,streak=0,ordinal}={}){
    if(destroyed||!TYPES.has(type))return false;
    const key=ordinalKey(ordinal);
    if(RESOLVED.has(type)&&!key)return false;
    // Type is part of identity: a launch and its win stinger may share an ordinal.
    if(key&&type!=='typing'){
      const identity=`${type}:${key}`;
      if(seen.includes(identity))return false;
      remember(identity); // Also consume silent events, preventing later replay.
    }
    if(!enabled)return false;
    const time=now();
    if(THROTTLE[type]&&time-(lastAt.get(type)??-Infinity)<THROTTLE[type])return false;
    if(!ensureContext())return false;
    lastAt.set(type,time);resume();
    const scheduled=play(type,bounded(tier,0,5),bounded(streak,0,100));
    if(scheduled)vibrate(type,key);
    return scheduled;
  }
  function toggleSound(){
    if(destroyed)return false;
    if(enabled){enabled=false;stopVoices();persist();return false;}
    if(!ensureContext()){enabled=false;persist();return false;}
    enabled=true;resume();persist();return true;
  }
  function destroy(){
    if(destroyed)return;
    destroyed=true;stopVoices();
    try{master?.disconnect();context?.close?.()?.catch?.(()=>{});}catch{}
    context=null;master=null;
  }
  return Object.freeze({trigger,toggleSound,soundEnabled:()=>enabled,destroy});
}
