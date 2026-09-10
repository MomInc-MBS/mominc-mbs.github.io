import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../tv/network-flow.js',import.meta.url),'utf8');
function flow(completed){const stored=new Map();const context={window:{MBS_STATE:{completedPages:()=>completed},dispatchEvent(){}},document:{readyState:'loading',addEventListener(){}},localStorage:{getItem:key=>stored.get(key)||null,setItem:(key,value)=>stored.set(key,value)},Event:class{}};vm.runInNewContext(source,context);return {api:context.window.MBS_FLOW,stored};}
test('Helping Hand opens after the three story pages without Fuel',()=>{const {api}=flow(['lilboyfriend','djscratch','corgi']);assert.equal(api.pagesReady(),true);assert.equal(api.armieReady(),false);for(let i=0;i<5;i++)assert.equal(api.decision('look-'+i),true);assert.equal(api.read().count,5);const hand={sections:{nails:1,fingertips:2,fingers:3,palm:4,back_of_hand:5,wrist:6},pose:'relaxed',nailShape:'family'};assert.ok(api.saveHand(hand));assert.equal(api.armieReady(),true);});
test('Fuel is optional and cannot replace another required page',()=>{for(const done of [[],['fuel'],['fuel','lilboyfriend','djscratch'],['lilboyfriend','corgi']]){assert.equal(flow(done).api.pagesReady(),false);}assert.equal(flow(['fuel','lilboyfriend','djscratch','corgi']).api.pagesReady(),true);});
