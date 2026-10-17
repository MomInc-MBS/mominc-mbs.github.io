import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source = readFileSync(new URL('../tv/tv.js', import.meta.url), 'utf8');
const block = source.slice(source.indexOf('  const gameKey ='), source.indexOf('  // --- the renderer-resize contract'));

test('every launch expands immediately and both return controls restore the same TV', () => {
  for (const [name, path] of [['mominc','/play/misinformation/'], ['lilboyfriend','/play/lilboyfriend/'],
    ['djscratch','/play/djscratch/'], ['girlfriend','/play/girlfriend/'], ['corgi','/play/corgi/'], ['goon','/gala/']]) {
    const callbacks = {}, frames = [], storage = new Map();
    const gameKey = {hidden:true}, gameBtn = {setAttribute(){}, addEventListener(type, fn){callbacks.back=fn;}};
    const tv = {dataset:{}}, channel = {addEventListener(type, fn){callbacks.launch=fn;}}, screen = {scrollTop:37, append(frame){frames.push(frame);}};
    const document = {
      getElementById(id){return {gameKey,gameBtn,gameLegend:{}}[id];},
      documentElement:{requestFullscreen(){return Promise.reject(new Error('denied'));}},
      addEventListener(type, fn){callbacks[type]=fn;},
      createElement(){return {addEventListener(type, fn){this[type]=fn;}, remove(){this.removed=true;}};}
    };
    const window = {MBS:{}, MBS_CHANNELS:{channels:[{id:name,game:name!=='mominc'}]}, MBS_RT:{pause(){},resume(){}}};
    vm.runInNewContext(block, {name,tv,channel,screen,document,window,URL,
      location:{origin:'https://mominc.online'}, sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
      requestAnimationFrame:fn=>fn()});
    const link = new URL(path, 'https://mominc.online'); let prevented = false;
    callbacks.launch({target:{closest:()=>link},preventDefault(){prevented=true;}});
    assert.equal(prevented,true,name); assert.equal(tv.dataset.mode,'game',name);
    assert.equal(frames[0].src,link.href,name); assert.equal(gameKey.hidden,false,name);
    // No load/ready event was needed to show the full-screen loading menu.
    callbacks.back();
    assert.equal(tv.dataset.mode,undefined,name); assert.equal(frames[0].removed,true,name);
    assert.equal(screen.scrollTop,37,name);
    callbacks.launch({target:{closest:()=>link},preventDefault(){}});
    frames[1].contentDocument = {URL:'https://mominc.online/tv/?ch='+name};
    frames[1].load();
    assert.equal(tv.dataset.mode,undefined,name); assert.equal(frames[1].removed,true,name);
  }
});
