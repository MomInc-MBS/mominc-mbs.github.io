import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {LEVELS,freshRun,levelIndex} from '../../play/misinformation/engine.js';
import {JOURNEY_ART,sceneFrame,renderScene} from '../../play/misinformation/scene.js';

const root=new URL('../../',import.meta.url);
const assetPaths=JOURNEY_ART.map(path=>fileURLToPath(new URL(`play/misinformation/${path}`,root)));
// Parse XML with the standard library rather than accepting tag-shaped text.
// Python is already required by this repository's asset manifest/generator tools.
const inspect=String.raw`
import ast, hashlib, json, re, sys
import xml.etree.ElementTree as ET
from pathlib import Path
ns='{http://www.w3.org/2000/svg}'
result=[]
for name in sys.argv[2:]:
    path=Path(name); raw=path.read_bytes(); root=ET.fromstring(raw)
    ids=[node.attrib['id'] for node in root.iter() if 'id' in node.attrib]
    refs=[]
    for node in root.iter():
        for key,value in node.attrib.items():
            refs.extend(re.findall(r'url\(#([^)]*)\)',value))
            if key.endswith('href') and value.startswith('#'): refs.append(value[1:])
    defs=root.find(ns+'defs')
    body=next(node for node in root.findall(ns+'g') if node.attrib.get('filter')=='url(#cut)')
    result.append(dict(name=path.name,tag=root.tag,viewBox=root.attrib.get('viewBox'),label=root.attrib.get('aria-label'),
      ids=ids,refs=refs,defs=ET.tostring(defs,encoding='unicode'),
      bodyHash=hashlib.sha256(ET.tostring(body)).hexdigest(),
      colors=sorted(set(value.lower() for node in root.iter() for value in node.attrib.values() if re.fullmatch(r'#[0-9a-fA-F]{6}',value))),
      scripts=sum(node.tag==ns+'script' for node in root.iter()),
      external=[value for node in root.iter() for key,value in node.attrib.items() if key.endswith('href') and not value.startswith('#')]))
tree=ast.parse(Path(sys.argv[1]).read_text(encoding='utf-8-sig'))
scenes=[]
for node in tree.body:
    if isinstance(node,ast.Expr) and isinstance(node.value,ast.Call):
        call=node.value
        if isinstance(call.func,ast.Attribute) and isinstance(call.func.value,ast.Name) and call.func.value.id=='scenes' and call.func.attr=='append':
            item=call.args[0]
            scenes.append(dict(slug=ast.literal_eval(item.elts[0]),label=ast.literal_eval(item.elts[1])))
print(json.dumps(dict(assets=result,generator=scenes)))
`;
const inspected=JSON.parse(execFileSync(process.env.PYTHON??'python',[
 '-c',inspect,fileURLToPath(new URL('tools/build_misinformation_journey.py',root)),...assetPaths
],{encoding:'utf8',maxBuffer:1024*1024}));

test('all twenty journey files parse as standalone SVG and match their exact itinerary labels',()=>{
 assert.equal(JOURNEY_ART.length,20);assert.equal(inspected.assets.length,20);
 assert.deepEqual(readdirSync(fileURLToPath(new URL('play/misinformation/assets/journey/',root))).filter(name=>name.endsWith('.svg')).sort(),assetPaths.map(path=>path.split(/[\\/]/).at(-1)).sort());
 for(let i=0;i<20;i++){
  const asset=inspected.assets[i],raw=readFileSync(assetPaths[i]);
  assert.equal(asset.tag,'{http://www.w3.org/2000/svg}svg');assert.equal(asset.viewBox,'0 0 640 720');
  assert.equal(asset.label,LEVELS[i].name);assert.equal(asset.scripts,0);assert.deepEqual(asset.external,[]);
  assert.equal(new Set(asset.ids).size,asset.ids.length);assert.ok(asset.refs.every(ref=>asset.ids.includes(ref)));
  assert.ok(!raw.subarray(0,3).equals(Buffer.from([0xef,0xbb,0xbf])));assert.ok(!raw.includes(Buffer.from('\r\n')));
 }
});
test('the generator, exported artwork routes, and twenty level names agree in order',()=>{
 assert.equal(inspected.generator.length,20);
 for(let i=0;i<20;i++){
  assert.equal(inspected.generator[i].label,LEVELS[i].name);
  assert.equal(JOURNEY_ART[i],`assets/journey/${String(i+1).padStart(2,'0')}-${inspected.generator[i].slug}.svg`);
  assert.equal(sceneFrame({distance:LEVELS[i].startDistance,hits:0,phase:'result'}).art,JOURNEY_ART[i]);
 }
});
test('the scenery shares one paper material and consistent palette with twenty distinct compositions',()=>{
 assert.equal(new Set(inspected.assets.map(asset=>asset.defs)).size,1);
 assert.equal(new Set(inspected.assets.map(asset=>asset.bodyHash)).size,20);
 for(const asset of inspected.assets){
  assert.ok(asset.ids.includes('paper'));assert.ok(asset.ids.includes('cut'));
  assert.ok(asset.colors.includes('#e8d9b7'));assert.ok(asset.colors.includes('#171321'));
  assert.match(asset.defs,/feTurbulence/);assert.match(asset.defs,/feDropShadow/);
 }
});
test('crossing each level updates the exact location title, artwork, effect and route marker without stale active stops',t=>{
 const originalDocument=globalThis.document,originalMedia=globalThis.matchMedia;
 t.after(()=>{globalThis.document=originalDocument;globalThis.matchMedia=originalMedia;});
 function marker(index){
  const classes=new Set(),attrs={};return {classes,attrs,dataset:{stop:String(index)},
   classList:{toggle:(name,on)=>on?classes.add(name):classes.delete(name)},
   setAttribute:(name,value)=>attrs[name]=value,removeAttribute:name=>delete attrs[name]};
 }
 const markers=LEVELS.map((_,i)=>marker(i)),vars={};
 const scene={dataset:{},offsetWidth:620,style:{setProperty:(key,value)=>vars[key]=value},classList:{remove(){},add(){}}};
 const title={textContent:''},stage={textContent:''};
 const elements={'#space-scene':scene,'#rocket':{style:{}},'#pursuer':{style:{}},'#chase-status':{textContent:''},'#location-title':title,'#location-stage':stage};
 globalThis.document={querySelector:selector=>elements[selector]??null,querySelectorAll:selector=>selector==='[data-stop]'?markers:[]};
 globalThis.matchMedia=()=>({matches:true});
 for(let i=0;i<20;i++){
  renderScene({...freshRun(),distance:LEVELS[i].startDistance,rounds:i,score:i*10,phase:i===0?'ready':'result'});
  assert.equal(title.textContent,LEVELS[i].name);assert.equal(scene.dataset.level,String(i));
  assert.equal(scene.dataset.effect,LEVELS[i].effect);assert.equal(vars['--journey-art'],`url("${JOURNEY_ART[i]}")`);
  assert.deepEqual(markers.filter(m=>m.classes.has('active')).map(m=>Number(m.dataset.stop)),[i]);
  for(let n=0;n<20;n++){
   assert.equal(markers[n].classes.has('reached'),n<i);assert.equal(markers[n].classes.has('nearby'),Math.abs(n-i)<=2);
   assert.equal(markers[n].attrs['aria-current'],n===i?'step':undefined);
  }
 }
 assert.equal(levelIndex(100000),19);
});
