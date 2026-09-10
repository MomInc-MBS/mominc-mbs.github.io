const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {JSDOM}=require('jsdom'),{createCanvas}=require('@napi-rs/canvas');
const root=path.join(__dirname,'../gala'),dom=new JSDOM('<!doctype html><body></body>',{url:'https://mominc.online/tv/games/goon/',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
let reduced=false,hidden=false,earned={activeDays:365,totalXp:36500,strength:75};
const preference=new w.EventTarget();Object.defineProperty(preference,'matches',{get:()=>reduced});w.matchMedia=()=>preference;Object.defineProperty(w.document,'hidden',{get:()=>hidden});
const pending=new Map();let serial=0;w.requestAnimationFrame=fn=>{pending.set(++serial,fn);return serial;};w.cancelAnimationFrame=id=>pending.delete(id);
function frame(now){const batch=[...pending.values()];pending.clear();batch.forEach(fn=>fn(now));}
function surface(el){if(!el._surface||el._surface.width!==el.width||el._surface.height!==el.height)el._surface=createCanvas(el.width,el.height);return el._surface;}
w.HTMLCanvasElement.prototype.getContext=function(){const ctx=surface(this).getContext('2d');return new Proxy(ctx,{get(target,key){if(key==='drawImage')return(image,...args)=>target.drawImage(image instanceof w.HTMLCanvasElement?surface(image):image,...args);const value=target[key];return typeof value==='function'?value.bind(target):value;},set(target,key,value){target[key]=value;return true;}});};
w.GalaProgress={KEY:'test-coach-progress',read:()=>earned};
for(const file of ['weapons.js','avatar.js','performer.js'])w.eval(fs.readFileSync(path.join(root,file),'utf8'));
const A=w.GalaAvatar,P=w.GalaPerformance,look=A.normalize(A.defaultLook);look.parts.pet=11;look.parts.face=22;look.parts.hair=31;look.parts.body=6;look.weapon={type:'cannon',tier:12};
const saved=JSON.stringify(look),actor=P.create(look),canvas=w.document.createElement('canvas'),starts={};let start=0;
for(const scene of actor.scenes){if(starts[scene.name]===undefined)starts[scene.name]=start;start+=scene.duration;}
assert.deepEqual(Object.keys(starts),['idle','weapon','pet','face','walk']);assert.equal(P.moment(actor.scenes,start).name,'idle');
const hash=el=>crypto.createHash('sha256').update(surface(el).getContext('2d').getImageData(0,0,el.width,el.height).data).digest('hex');
const renders=new Map();for(const [name,at] of Object.entries(starts)){assert.equal(actor.paint(canvas,at+1100).name,name);assert.equal(canvas.dataset.scene,name);renders.set(name,hash(canvas));}assert.equal(new Set(renders.values()).size,5);assert.equal(JSON.stringify(look),saved);
const center=()=>{const pixels=surface(canvas).getContext('2d').getImageData(0,0,160,168).data;let sum=0,weight=0;for(let i=3;i<pixels.length;i+=4){sum+=((i-3)/4%160)*pixels[i];weight+=pixels[i];}return sum/weight;};
actor.paint(canvas,starts.walk+100);const departureCenter=center();actor.paint(canvas,starts.walk+1000);assert.ok(center()>departureCenter+20,'character always leaves through the right side');
actor.paint(canvas,starts.walk+3000);assert.ok(!surface(canvas).getContext('2d').getImageData(0,0,160,168).data.some((n,i)=>i%4===3&&n>0),'character walks fully outside its frame');actor.paint(canvas,starts.walk+7300);assert.ok(surface(canvas).getContext('2d').getImageData(0,0,160,168).data.some((n,i)=>i%4===3&&n>0),'character returns');
// Every face, including the single eye, multiple eyes, mask, and visor, can blink.
for(let face=0;face<40;face++){const sample=A.normalize(look);sample.parts.face=face;const open=createCanvas(64,96),closed=createCanvas(64,96);A.draw(open,sample,{weapon:false,blink:false});A.draw(closed,sample,{weapon:false,blink:true});assert.notDeepEqual(open.getContext('2d').getImageData(24,17,17,14).data,closed.getContext('2d').getImageData(24,17,17,14).data,`face ${face} visibly blinks`);}
actor.paint(canvas,starts.face+1200);const eyesOpen=hash(canvas);actor.paint(canvas,starts.face+1600);assert.notEqual(hash(canvas),eyesOpen);
const bare=A.normalize(A.defaultLook);assert.deepEqual(Array.from(P.playlist(bare),s=>s.name),['idle','face','idle','walk']);earned={activeDays:0,totalXp:0,strength:1};assert.ok(!P.playlist(look).some(s=>s.name==='weapon'));earned={activeDays:365,totalXp:36500,strength:75};
// A later save can reveal the portrait, without reloading the game. Motion has one loop.
w.eval(fs.readFileSync(path.join(root,'guest.js'),'utf8'));const stage=w.document.querySelector('.gala-player');assert.equal(stage.hidden,true);assert.equal(pending.size,0);
w.localStorage.setItem('mominc-avatar-v1',saved);w.dispatchEvent(new w.StorageEvent('storage',{key:'mominc-avatar-v1'}));assert.equal(stage.hidden,false);assert.equal(pending.size,1);assert.equal(stage.querySelector('canvas').getAttribute('aria-hidden'),'true');
frame(1);frame(51);assert.equal(pending.size,1);hidden=true;w.document.dispatchEvent(new w.Event('visibilitychange'));assert.equal(pending.size,0);hidden=false;w.document.dispatchEvent(new w.Event('visibilitychange'));assert.equal(pending.size,1);
reduced=true;preference.dispatchEvent(new w.Event('change'));assert.equal(pending.size,0);assert.equal(stage.querySelector('canvas').dataset.scene,'idle');reduced=false;preference.dispatchEvent(new w.Event('change'));assert.equal(pending.size,1);
w.dispatchEvent(new w.PageTransitionEvent('pagehide'));assert.equal(pending.size,0);w.dispatchEvent(new w.PageTransitionEvent('pageshow'));assert.equal(pending.size,1);
w.localStorage.removeItem('mominc-avatar-v1');w.dispatchEvent(new w.StorageEvent('storage',{key:'mominc-avatar-v1'}));assert.equal(stage.hidden,true);assert.equal(pending.size,0);
if(process.env.GALA_PERFORMANCE_SHEET){const sheet=createCanvas(1050,270),ctx=sheet.getContext('2d');ctx.fillStyle='#21112e';ctx.fillRect(0,0,1050,270);ctx.imageSmoothingEnabled=false;['idle','weapon','pet','face','walk'].forEach((name,index)=>{actor.paint(canvas,starts[name]+(name==='face'?1600:name==='walk'?700:1100));ctx.drawImage(surface(canvas),index*210+9,28,192,202);ctx.fillStyle='#f3d39c';ctx.font='16px sans-serif';ctx.fillText(name==='face'?'Face / blink':name,index*210+15,255);});fs.writeFileSync(process.env.GALA_PERFORMANCE_SHEET,sheet.toBuffer('image/png'));}
console.log('PASS: five distinct scenes; weapon/pet eligibility; off-frame departure and return; 40 blinking face styles; original recipe unchanged; storage refresh; one animation loop; hidden/reduced-motion pause; page restore.');dom.window.close();
