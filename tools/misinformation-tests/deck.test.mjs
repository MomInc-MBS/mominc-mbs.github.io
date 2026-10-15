import test from 'node:test';import assert from 'node:assert/strict';
import {createQuestionDeck,DECK_KEY} from '../../play/misinformation/deck.js';
const storage=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};};
test('question memory survives flight restarts and fresh module instances',()=>{
 const s=storage(),first=createQuestionDeck(['a','b','c'],s);
 first.remember('a');first.remember('b');
 assert.deepEqual(createQuestionDeck(['a','b','c'],s).recent(),['a','b']);
 first.remember('a');assert.deepEqual(first.recent(),['b','a']);
});
test('saved-flight seeds recover old clients but never replace existing browser rotation',()=>{
 const s=storage(),deck=createQuestionDeck(['a','b','c'],s,['a','obsolete']);
 assert.deepEqual(deck.recent(),['a']);deck.remember('b');
 assert.deepEqual(createQuestionDeck(['a','b','c'],s,['c']).recent(),['a','b']);
});
test('another tab is refreshed and obsolete questions are removed',()=>{
 const s=storage(),a=createQuestionDeck(['a','b','c'],s),b=createQuestionDeck(['a','b','c'],s);
 a.remember('a');b.remember('b');assert.deepEqual(a.recent(),['a','b']);
 assert.deepEqual(createQuestionDeck(['b','c'],s).recent(),['b']);
});
test('broken and unavailable storage keeps an honest session-only rotation',()=>{
 const s=storage();s.setItem(DECK_KEY,'broken');const deck=createQuestionDeck(['a','b'],s);
 assert.equal(deck.available,false);deck.remember('a');assert.deepEqual(deck.recent(),['a']);
 const denied=createQuestionDeck(['a'],{getItem(){throw Error('blocked');}});
 denied.remember('a');assert.deepEqual(denied.recent(),['a']);assert.equal(denied.available,false);
});
test('question memory is bounded and callers cannot mutate its internal deck',()=>{
 const ids=Array.from({length:600},(_,i)=>`q${i}`),deck=createQuestionDeck(ids,storage());
 for(const id of ids)deck.remember(id);
 const snapshot=deck.recent();assert.equal(snapshot.length,512);snapshot.length=0;
 assert.equal(deck.recent().length,512);deck.remember('unknown');assert.equal(deck.recent().length,512);
});
