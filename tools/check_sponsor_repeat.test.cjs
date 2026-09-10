const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'tv/network-flow.js'),'utf8');
const required=['lilboyfriend','djscratch','corgi'];

function environment({done=required,storage=new Map(),pathname='/tv/'}={}){
  const finished=new Set(done),events=new Map(),docEvents=new Map(),timers=new Map();
  let now=0,nextTimer=1,dialog=null,opens=0;
  const dispatch=(map,type,event={})=>(map.get(type)||[]).forEach(fn=>fn({type,...event}));
  const on=(map,type,fn)=>map.set(type,[...(map.get(type)||[]),fn]);
  const localStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,String(value))};
  const document={hidden:false,readyState:'complete',activeElement:{isConnected:true,focus(){}},
    body:{dataset:{},append(){}},documentElement:{dataset:{}},querySelector:()=>null,querySelectorAll:()=>[],
    addEventListener:(type,fn)=>on(docEvents,type,fn),
    createElement(){const callbacks=new Map();dialog={open:false,addEventListener:(type,fn)=>on(callbacks,type,fn),showModal(){this.open=true;opens++;},close(){this.open=false;dispatch(callbacks,'close');}};return dialog;}};
  const window={addEventListener:(type,fn)=>on(events,type,fn),dispatchEvent:event=>dispatch(events,event.type,event),MBS_STATE:{completedPages:()=>[...finished],completePage(id){if(finished.has(id))return;finished.add(id);dispatch(events,'mbs:page-complete');}}};
  const sandbox={window,document,localStorage,location:{pathname},Event:class{constructor(type){this.type=type;}},MutationObserver:class{observe(){}disconnect(){}},setTimeout(fn,ms){const id=nextTimer++;timers.set(id,{at:now+ms,fn});return id;},clearTimeout:id=>timers.delete(id)};
  vm.runInNewContext(source,sandbox);
  return {storage,finished,window,get open(){return !!dialog?.open;},get opens(){return opens;},close(){dialog.close();},advance(ms){const end=now+ms;for(let i=0;i<100;i++){const entry=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!entry)break;now=entry[1].at;timers.delete(entry[0]);entry[1].fn();}now=end;},visible(value){document.hidden=!value;dispatch(docEvents,'visibilitychange');},pageShow(){dispatch(events,'pageshow');},replay(){dispatch(docEvents,'click',{target:{closest:()=>({})}});},storageEvent(){dispatch(events,'storage');}};
}

test('the third required finished game opens one ad, without Fuel or partial completions',()=>{
 const e=environment({done:required.slice(0,2)});assert.equal(e.open,false);e.window.MBS_STATE.completePage('corgi');assert.equal(e.open,true);e.pageShow();assert.equal(e.opens,1);
});
test('closing starts a full ten-second delay and repeats after each dismissal',()=>{
 const e=environment();e.close();e.advance(9999);assert.equal(e.open,false);e.advance(1);assert.equal(e.open,true);e.close();e.advance(10000);assert.equal(e.opens,3);
});
test('channel arrival ignores the old seen flag and a return to the tab reopens it',()=>{
 const storage=new Map([['mbs-hand-ad-shown-v1','1']]);const e=environment({storage});assert.equal(e.open,true);e.close();e.visible(false);e.advance(10000);assert.equal(e.open,false);e.visible(true);assert.equal(e.open,true);e.close();assert.equal(environment({storage}).open,true);
});
test('unrelated storage changes do not shorten the dismissal delay',()=>{
 const e=environment();e.close();e.advance(1000);e.storageEvent();assert.equal(e.open,false);e.advance(9000);assert.equal(e.open,true);
});
test('hand builder stays usable and a completed hand ends automatic repetition',()=>{
 assert.equal(environment({pathname:'/handborne/'}).open,false);
 const e=environment();e.close();e.storage.set('mbs-hand-profile-v1',JSON.stringify({version:1,source:'handborne',complete:true,sections:Object.fromEntries(['nails','fingertips','middle_sections','knuckles','palm','back_of_hand','wrist'].map(key=>[key,0]))}));e.advance(10000);assert.equal(e.open,false);e.pageShow();assert.equal(e.open,false);e.replay();assert.equal(e.open,true);
});

const html=fs.readFileSync(path.join(root,'tv/index.html'),'utf8');
const early=html.match(/<main class="tv" id="tv" data-state="off">\s*<script>([\s\S]*?)<\/script>/)[1];
const shell=fs.readFileSync(path.join(root,'tv/tv.js'),'utf8');
const boot=shell.slice(shell.indexOf('  // --- boot:'),shell.lastIndexOf('})();'));
function powerEnvironment(storage,air){const tv={dataset:{state:'off'}};return {tv,onAir:()=>air,paintDark(){},document:{getElementById:()=>tv},sessionStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)}};}
test('saved power is restored before the channel is painted',()=>{
 const e=powerEnvironment(new Map([['mbs-on','1']]),false);vm.runInNewContext(early,e);assert.equal(e.tv.dataset.state,'on');
});
test('automatic broadcast startup stays on across the next off-air channel',()=>{
 const storage=new Map();const first=powerEnvironment(storage,true);vm.runInNewContext(boot,first);assert.equal(storage.get('mbs-on'),'1');const next=powerEnvironment(storage,false);vm.runInNewContext(early,next);assert.equal(next.tv.dataset.state,'on');vm.runInNewContext(boot,next);assert.equal(next.tv.dataset.state,'on');
});
test('an explicit press of Power off remains off',()=>{
 const e=powerEnvironment(new Map([['mbs-on','0']]),true);vm.runInNewContext(early,e);vm.runInNewContext(boot,e);assert.equal(e.tv.dataset.state,'off');
});
