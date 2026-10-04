import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

// Install Playwright locally or supply PLAYWRIGHT_MODULE; serve the site at TV_TEST_URL.
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.TV_TEST_URL||'http://127.0.0.1:5202';

test('TV gestures play physical and digital samples, mute works, and Back retains sound',{timeout:300000},async()=>{
 console.log('Launching browser');const browser=await chromium.launch({channel:'msedge',headless:true,args:['--autoplay-policy=user-gesture-required']});
 try{
  const context=await browser.newContext({viewport:{width:375,height:812},reducedMotion:'reduce'});
  await context.addInitScript(()=>{
   if(window!==window.top)return;
   window.__audioQA={cues:[],sources:[]};let engine;
   Object.defineProperty(window,'MBS_SOUND',{configurable:true,get:()=>engine,set(value){engine=value;const play=value.play.bind(value);value.play=kind=>{__audioQA.cues.push(kind);return play(kind)};}});
   const create=AudioContext.prototype.createBufferSource;
   AudioContext.prototype.createBufferSource=function(){const source=create.call(this),start=source.start.bind(source),stop=source.stop.bind(source),ctx=this;const row={started:false,stopped:false};__audioQA.sources.push(row);source.addEventListener('ended',()=>{row.stopped=true});source.start=(...args)=>{Object.assign(row,{started:true,loop:source.loop,duration:source.buffer?.duration,state:ctx.state});return start(...args)};source.stop=(...args)=>{row.stopped=true;return stop(...args)};return source;};
  });
  const page=await context.newPage();await page.goto(base+'/tv/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.MBS_SOUND);console.log('Sound engine ready');
  assert.equal(await page.evaluate(()=>__audioQA.sources.some(s=>s.started)),false,'preloading is silent');
  console.log('Power gesture');await page.locator('#power').click();
  await page.waitForFunction(()=>document.querySelector('#tv').dataset.state==='on');
  await page.waitForFunction(()=>__audioQA.sources.some(s=>s.started&&!s.loop&&s.state==='running'));
  assert.ok(await page.evaluate(()=>__audioQA.cues.includes('switch')));
  console.log('Picture gesture');await page.locator('#pictureBtn').click();
  const before=await page.evaluate(()=>__audioQA.cues.filter(c=>c==='click').length);
  await page.locator('#knob').focus();await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>__audioQA.cues.filter(c=>c==='click').length),before+1,'one keyboard knob press');
  console.log('Mute toggle');await page.locator('#soundBtn').click();assert.equal(await page.evaluate(()=>MBS_SOUND.muted),true);
  await page.waitForFunction(()=>__audioQA.sources.filter(s=>s.started).every(s=>s.stopped));
  console.log('Mute toggle');await page.locator('#soundBtn').click();assert.equal(await page.evaluate(()=>MBS_SOUND.muted),false);
  await page.waitForFunction(()=>__audioQA.sources.some(s=>s.started&&!s.stopped));
  // An ordinary digital button follows the same delegated path as channel UI.
  await page.evaluate(()=>{const button=document.createElement('button');button.id='digitalSoundProbe';button.textContent='Digital probe';button.style.cssText='position:fixed;top:0;left:0;z-index:2147483647';document.body.append(button);});
  await page.locator('#digitalSoundProbe').click();assert.equal(await page.evaluate(()=>__audioQA.cues.at(-1)),'bloop');
  for(const width of [320,375]){await page.setViewportSize({width,height:812});const r=await page.locator('#soundBtn').boundingBox();assert.ok(r&&r.width>=44&&r.height>=44&&r.x>=0&&r.x+r.width<=width,'mute fits '+width+'px');}
  console.log('Back navigation');await page.goto(base+'/tv/audio/credits.html');await page.goBack();await page.waitForFunction(()=>!!window.MBS_SOUND);console.log('Sound engine ready');
  const count=await page.evaluate(()=>__audioQA.sources.filter(s=>s.started&&!s.loop).length);
  console.log('Picture gesture');await page.locator('#pictureBtn').click();await page.waitForFunction(n=>__audioQA.sources.filter(s=>s.started&&!s.loop).length>n,count);
  await context.close();
 }finally{await browser.close();}
});
