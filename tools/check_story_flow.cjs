/* Usage: NODE_PATH=<directory containing playwright> node tools/check_story_flow.cjs */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const root = path.resolve(__dirname, '..');
const ids = ['fuel', 'lilboyfriend', 'djscratch', 'corgi'];
const fixture = `<!doctype html><html data-game="djscratch"><body><main id="dj"></main>
<script src="/tv/mbs-channels.js"></script><script src="/tv/state.js"></script>
<script src="/tv/network-flow.js"></script><script src="/tv/mbs-shim.js"></script></body></html>`;
const types={'.js':'application/javascript','.mjs':'application/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.rsc':'text/x-component','.svg':'image/svg+xml','.png':'image/png','.glb':'model/gltf-binary'};
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 if(pathname==='/__flow'){res.setHeader('Content-Type','text/html');return res.end(fixture);}
 let file=path.resolve(root,'.'+pathname);
 if(!file.startsWith(root+path.sep)){res.statusCode=403;return res.end();}
 try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);}catch{res.statusCode=404;res.end();}
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-angle=swiftshader']});
 try{
  if(!process.argv.includes('--additional')){
  const context=await browser.newContext(),page=await context.newPage();const errors=[];
  page.on('pageerror',e=>{errors.push(e.message);console.error('Browser:',e.message);});
  await page.goto(base+'/__flow');
  await page.evaluate(ids=>ids.forEach(id=>MBS.unlock(id)),ids);
  assert.equal(await page.locator('dialog[open]').count(),0,'Unlocking secrets does not finish pages');
  await page.evaluate(ids=>ids.slice(0,3).forEach(id=>MBS.complete(id)),ids);
  assert.equal(await page.locator('dialog[open]').count(),0,'No ad before all four pages');
  await page.evaluate(()=>MBS.complete('corgi'));
  await page.locator('dialog[open]').waitFor();
  assert.equal(await page.locator('dialog[open]').count(),1);
  await page.locator('.ad-close').click();
  await page.evaluate(ids=>{ids.forEach(id=>MBS.complete(id));window.dispatchEvent(new Event('mbs-flow'));},ids);
  await page.reload();
  assert.equal(await page.locator('dialog[open]').count(),0,'Ad stays dismissed after reload');
  const second=await context.newPage();await second.goto(base+'/__flow');
  assert.equal(await second.locator('dialog[open]').count(),0,'Ad stays dismissed in another tab');await second.close();
  console.log('PASS ad waits for four terminal completions and stays dismissed across reloads and tabs');

  const recipe={version:4,sections:{nails:20,fingertips:21,fingers:22,palm:20,back_of_hand:21,wrist:22},pose:'relaxed',nailShape:'natural'};
  await page.evaluate(r=>{localStorage.setItem('mbs-hand-decisions-v1',JSON.stringify({count:5,last:'saved'}));localStorage.setItem('handborne-recipe-v4',JSON.stringify(r));localStorage.removeItem('mbs-hand-profile-v1');},recipe);
  assert.equal(await page.evaluate(()=>MBS_FLOW.armieReady()),true,'Recover completed hand from six-section recipe');
  assert.equal(await page.evaluate(()=>MBS_FLOW.handProfile().sections.knuckles),22);
  assert.equal(await page.evaluate(()=>MBS_FLOW.validHand({...MBS_FLOW.handProfile(),sections:{nails:99}})),false);
  console.log('PASS saved hand recovery, joined fingers, all 23 styles, and malformed-hand rejection');

  await page.goto(base+'/games/armie/');
  await page.waitForURL('**/tv/?ch=armie');
  await page.locator('#ar-styles button').first().waitFor({timeout:30000});
  assert.equal(await page.locator('#ar-hand-gate').isVisible(),false,'Coach accepts the saved hand');
  await page.locator('#ar-styles button').first().click();
  await page.locator('#ar-levels button').first().click();
  await page.getByRole('button',{name:'Run for coach',exact:false}).click();
  await page.locator('#ar-intro-frame').waitFor({state:'visible',timeout:45000});
  console.log('PASS completed hand opens Coach and starts his introduction');
  await page.goto(base+'/__flow');
  const grip=await page.evaluate(async()=>{
   const phone=document.createElement('div');phone.style.cssText='width:220px;height:400px;position:relative';document.body.append(phone);
   const m=await import('/tv/assets/armie-intro/phone-grip.js');
   const result=await m.mountPhoneGrip(phone,MBS_FLOW.handProfile());
   const styles=result.hand.children.map(c=>c.userData.styleId);phone.remove();return {ready:phone.dataset.handReady,styles};
  });
  assert.equal(grip.ready,'true');assert(grip.styles.includes(22));
  console.log('PASS Fluffy, Jelly and Baby hand parts render in Coach phone grip');

  await page.evaluate(()=>{localStorage.removeItem('mbs-hand-profile-v1');localStorage.removeItem('mbs-hand-decisions-v1');localStorage.removeItem('handborne-recipe-v4');});
  await page.goto(base+'/handborne/');
  await page.waitForFunction(()=>!!localStorage.getItem('handborne-recipe-v4'));
  await page.locator('#hand-progress').waitFor();
  const remix=page.getByRole('button',{name:'Randomize unlocked sections'});
  for(let i=1;i<=5;i++){await remix.click();await page.waitForFunction(n=>MBS_FLOW.read().count===n,i);}
  assert.equal(await page.locator('#hand-progress a').isVisible(),true);
  const before=await page.evaluate(()=>MBS_FLOW.read().count);
  await page.waitForTimeout(2500);
  assert.equal(await page.evaluate(()=>MBS_FLOW.read().count),before,'Automatic poses do not add decisions');
  await page.locator('#hand-progress a').click();
  await page.waitForURL('**/tv/?ch=armie*');
  await page.locator('#ar-styles button').first().waitFor({timeout:30000});
  assert.equal(await page.locator('#ar-hand-gate').isVisible(),false);
  console.log('PASS five real editor actions save the hand and carry it into Coach');
  assert.deepEqual(errors,[],'No browser errors');
  await context.close();

  const legacy=await browser.newContext(),old=await legacy.newPage();
  await old.goto(base+'/__flow');
  await old.evaluate(ids=>{const s=MBS_STATE.read();delete s.storyVersion;ids.forEach(id=>{s.channels[id].secret={earned:true,earnedAt:1};delete s.channels[id].page;});MBS_STATE.write(s);},ids);
  await old.reload();assert.equal(await old.evaluate(()=>MBS_FLOW.pagesReady()),true);
  await old.locator('dialog[open]').waitFor();await old.locator('.ad-close').click();await old.reload();
  assert.equal(await old.locator('dialog[open]').count(),0);
  console.log('PASS legacy progress is preserved once without repeating the sponsor message');
  await legacy.close();
  }

  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),studio=await mobile.newPage();
  await studio.route('https://myr5.mominc.online/**',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Coach installer</title>'}));
  await studio.goto(base+'/__flow');
  await studio.evaluate(()=>{
   localStorage.setItem('mbs-armie-hall-v2',JSON.stringify({version:2,unlocked:true,hall:2,level:0,style:'steady',moves:[]}));
   localStorage.setItem('myr5-recipe-v1',JSON.stringify({version:1,styles:Object.fromEntries(['head','eye','collar','body','arms','feet'].map(k=>[k,0])),coach:'supportive',eye:'open',fur:1,iris:1}));
  });
  await studio.goto(base+'/tv/assets/armie-intro/creature-tv.html');
  const useCoach=studio.getByRole('button',{name:'Use this coach →',exact:true});await useCoach.waitFor();
  const box=await useCoach.boundingBox();assert(box.y>=0&&box.y+box.height<=844,'Finish button visible on phone');
  await useCoach.click();await studio.waitForURL('https://myr5.mominc.online/install.html#coach=*');
  const {decodeHandoff}=await import('../coach-setup/onboarding-domain.mjs');
  const incoming=decodeHandoff(new URLSearchParams(new URL(studio.url()).hash.slice(1)).get('coach'));
  assert.equal(incoming.siteChoices.armie.game.hallways,3,'The old ending is repaired before leaving the website');
  assert.equal(incoming.customizationConfirmed,true);assert.equal(incoming.appearance['myr5-recipe-v1'].coach,'supportive');
  console.log('PASS phone finish button carries the saved Coach straight to the app installer');await mobile.close();

  const timed=await browser.newContext(),clock=await timed.newPage();
  await clock.clock.install({time:Date.now()});await clock.goto(base+'/__flow');
  await clock.evaluate(ids=>{
   ids.forEach(id=>MBS.complete(id));
   localStorage.setItem('mbs-hand-decisions-v1',JSON.stringify({count:5}));
   localStorage.setItem('mbs-lilbf-museum-v2',JSON.stringify({phase:'done'}));
   localStorage.setItem('mbs-corgi-school-v3',JSON.stringify({public:{level:2}}));
   localStorage.setItem('mbs-armie-hall-v2',JSON.stringify({version:2,unlocked:true,hall:2}));
   localStorage.setItem('mbs-armie-hall-result',JSON.stringify({game:{hallways:3}}));
   localStorage.setItem('myr5-recipe-v1',JSON.stringify({saved:'coach'}));
   localStorage.setItem('mbs-hand-profile-v1',JSON.stringify({saved:'hand'}));
   MBS_STATE.saveDraft('fuel',{answers:{q1:'saved answer'}});
  },ids);
  await clock.clock.fastForward(3599000);
  assert.equal(await clock.evaluate(()=>MBS_FLOW.pagesReady()),true,'Progress remains before the hour');
  const reloaded=clock.waitForEvent('load');await clock.clock.fastForward(1000);await reloaded;
  assert.equal(await clock.evaluate(()=>MBS_STATE.completedPages().length),0);
  assert.equal(await clock.evaluate(()=>MBS_STATE.unlockedActive().length),0);
  assert.equal(await clock.evaluate(()=>MBS_FLOW.read().count),0);
  for(const key of ['mbs-hand-ad-shown-v1','mbs-lilbf-museum-v2','mbs-corgi-school-v3','mbs-armie-hall-v2'])assert.equal(await clock.evaluate(k=>localStorage.getItem(k),key),null);
  for(const key of ['myr5-recipe-v1','mbs-hand-profile-v1','mbs-armie-hall-result'])assert(await clock.evaluate(k=>localStorage.getItem(k),key));
  assert.equal(await clock.evaluate(()=>MBS_STATE.draftFor('fuel').answers.q1),'saved answer');
  await clock.reload();assert.equal(await clock.evaluate(()=>MBS_STATE.completedPages().length),0,'Reload does not restore expired progress');
  await clock.evaluate(ids=>ids.forEach(id=>MBS.complete(id)),ids);
  await clock.locator('dialog[open]').waitFor();
  assert.equal(await clock.locator('dialog[open]').count(),1,'The new hour has its own one-time sponsor message');
  console.log('PASS exact one-hour active reset clears all round progress and keeps saved designs/setup');await timed.close();
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
