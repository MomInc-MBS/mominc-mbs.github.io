import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../tv/run-progress.js',import.meta.url),'utf8');
function harness(state='off'){
 const nodes=new Map(),listeners={},glass={append(note){nodes.set(note.id,note);note.parentElement=this;}};
 const tv={dataset:{state},querySelector:()=>glass};let observer;
 const document={readyState:'complete',documentElement:{dataset:{}},getElementById:id=>id==='tv'?tv:nodes.get(id),body:{append(){throw Error('TV notices must stay inside glass');}},addEventListener(){},createElement:()=>({style:{},dataset:{},setAttribute(){},addEventListener(){}})};
 const window={dispatchEvent(){},addEventListener:(name,fn)=>listeners[name]=fn};
 const context={window,parent:window,document,location:{origin:'https://example.test'},navigator:{},localStorage:{getItem:()=>null},CustomEvent:class{},MutationObserver:class{constructor(fn){observer=fn;}observe(){}},setTimeout:()=>1,clearTimeout(){},matchMedia:()=>({matches:true})};
 vm.runInNewContext(source.replace('start().then(flush);',"window.testError=value=>{error=value;notify();};"),context);
 return {tv,glass,nodes,setError:window.testError,change(value){Object.assign(tv.dataset,value);observer();}};
}
test('run notices wait for ON and stay inside main TV glass',()=>{
 const h=harness();h.setError('Finish your hand before Coach Armie.');assert.equal(h.nodes.size,0);
 h.change({state:'warming'});assert.equal(h.nodes.size,0);
 h.change({state:'on'});const note=h.nodes.get('rankConnection');assert.equal(note.parentElement,h.glass);assert.equal(note.hidden,false);assert.equal(note.style.position,'absolute');assert.equal(note.style.zIndex,'8');
 h.change({state:'off'});assert.equal(note.hidden,true);
 h.change({state:'on'});assert.equal(note.hidden,false);
 h.change({mode:'game'});assert.equal(note.hidden,true);
 h.setError('Another late response');assert.equal(note.hidden,true);
});
