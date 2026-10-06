import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultLabel,cleanLabel,cleanDraft,batchIdentity,batchSignature} from '../tv/channels/fuel-label.mjs';
const keys=['caffeine','theanine','glutamine','citrulline','creatine','electrolytes'];
const flavors=['LIME','GRAPE'];
test('restored drafts enforce capacity, ingredient limits and valid mixing',()=>{
  const d=cleanDraft({version:1,scoops:['caffeine','caffeine','caffeine','unknown','creatine'],flavour:'LIME',mixTurns:3,phase:'done'},keys,flavors);
  assert.deepEqual(d.scoops,['caffeine','caffeine','creatine']);assert.equal(d.mixTurns,0);assert.equal(d.phase,'fill');
  const full=['caffeine','caffeine','theanine','theanine','glutamine','glutamine','creatine','creatine'];
  const valid=cleanDraft({version:1,scoops:full,flavour:'LIME',mixTurns:3,phase:'done'},keys,flavors);
  assert.equal(valid.phase,'done');assert.equal(valid.mixTurns,3);
  assert.equal(cleanDraft({...valid,flavour:'invalid'},keys,flavors).phase,'flavor');
  assert.equal(cleanDraft({version:2,scoops:[]},keys,flavors),null);
});
test('label validation bounds artwork, text, enums, colors and transforms',()=>{
  const label=cleanLabel({shape:'invalid',primary:'url(x)',title:'x'.repeat(100),artData:'data:image/svg+xml;base64,abc',artScale:Infinity,artX:9,artY:-9});
  assert.equal(label.shape,defaultLabel().shape);assert.equal(label.primary,defaultLabel().primary);
  assert.equal(label.title.length,48);assert.equal(label.artData,'');assert.equal(label.artScale,1);assert.equal(label.artX,1);assert.equal(label.artY,-1);
  assert.deepEqual(cleanLabel(null),defaultLabel());
});
test('visual identity tracks artwork and every design edit without remix locks',()=>{
  const label=defaultLabel(),fp=batchIdentity(['creatine'],'LIME',['MY','FUEL','XR'],label);
  for(const change of [{primary:'#123456'},{shape:'oval'},{title:'personal'},{subtitle:'mine'},{font:'mono'},{pattern:'dots'},{icon:'star'},{artData:'data:image/png;base64,YQ=='},{artX:.2}])assert.notEqual(batchIdentity(['creatine'],'LIME',['MY','FUEL','XR'],{...label,...change}),fp);
  assert.equal(batchIdentity(['creatine'],'LIME',['MY','FUEL','XR'],{...label,locks:{name:true,colors:true,art:true,shape:true}}),fp);
  assert.notEqual(batchIdentity(['creatine','caffeine'],'LIME',['MY','FUEL','XR'],label),batchIdentity(['caffeine','creatine'],'LIME',['MY','FUEL','XR'],label));
  const signature=batchSignature(['creatine'],'LIME',['MY','FUEL','XR'],label);
  assert.match(signature,/^[a-f0-9]{16}$/);
  assert.notEqual(signature,batchSignature(['creatine'],'LIME',['MY','FUEL','XR'],{...label,shape:'oval'}));
});
