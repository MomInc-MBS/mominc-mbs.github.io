const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom'),{createCanvas}=require('@napi-rs/canvas');
const site=path.join(__dirname,'..'),bundle=fs.readFileSync(path.join(site,'tv/games/goon/assets/index-W2w8AfON.js'),'utf8');
const dom=new JSDOM('<!doctype html><body></body>',{url:'https://mominc.online/tv/games/goon/',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
let reduced=false,hidden=false,draws=0;
const preference=new w.EventTarget();Object.defineProperty(preference,'matches',{get:()=>reduced});w.matchMedia=()=>preference;
Object.defineProperty(w.document,'hidden',{get:()=>hidden});
w.HTMLCanvasElement.prototype.getContext=function(){if(!this._surface||this._surface.width!==this.width||this._surface.height!==this.height)this._surface=createCanvas(this.width,this.height);return this._surface.getContext('2d');};
// Use the actual bundled Three classes, without creating a WebGL renderer or browser.
w.eval(bundle.slice(bundle.indexOf('const ya="180"'),bundle.indexOf('function Bp('))+';window.CrowdTestThree={Group:we,Mesh:Ut,PlaneGeometry:Pi,MeshBasicMaterial:Yn,CanvasTexture:Pn,NearestFilter:Je,SRGBColorSpace:Ve,Scene:Eu,Camera:Le,Vector:at};');
for(const file of ['avatar.js','crowd.js'])w.eval(fs.readFileSync(path.join(site,'gala',file),'utf8'));
const A=w.GalaAvatar,C=w.GalaCrowd,T=w.CrowdTestThree;
const player=A.normalize(A.defaultLook),before=JSON.stringify(player),next=C.wardrobe(player);
const looks=Array.from({length:380},next);
assert.equal(JSON.stringify(player),before,'guest creation leaves player recipe unchanged');
assert.equal(new Set(looks.map(look=>JSON.stringify(look.parts))).size,380);
for(const section of A.sections){const seen=new Set();for(const look of looks){assert.notEqual(look.parts[section.id],player.parts[section.id]);assert.ok(section.choices.includes(look.parts[section.id]));seen.add(look.parts[section.id]);}assert.equal(seen.size,section.choices.filter(id=>id!==player.parts[section.id]&&(section.id!=='body'||id%10!==player.parts.body%10)).length);}
for(const look of looks){assert.notEqual(look.parts.body%10,player.parts.body%10);assert.notEqual(look.dye,player.dye);assert.equal(look.weapon,undefined);A.normalize(look);}
for(let step=0;step<=1000;step++)for(let lane=0;lane<2;lane++){const p=C.promenade(step/1000,lane);assert.ok(Math.hypot(p.x,p.z)>4.7,'guest centers remain outside the table');assert.ok(p.z>-5.5,'guests remain in front of the back wall');}
const draw=A.draw;A.draw=(...args)=>{draws++;return draw(...args);};
const board={scene:new T.Scene(),camera:new T.Camera(34,1,.1,100)};board.camera.position.set(.5,7.3,6.2);
w.innerWidth=1200;w.innerHeight=800;
const controller=C.mount(board,T),root=board.scene.getObjectByName('gala-party-guests');
assert.equal(root.children.length,9);assert.equal(w.document.querySelectorAll('canvas').length,0,'no canvas overlay can intercept game input');assert.equal(draws,9);
const positions=()=>root.children.map(mesh=>mesh.position.toArray().join(','));
const initial=positions();for(let frame=0;frame<120;frame++)controller.update(1/60);assert.notDeepEqual(positions(),initial);assert.equal(draws,9,'sprites are cached between entrances');
for(const mesh of root.children){assert.equal(mesh.material.depthTest,true);assert.equal(mesh.material.map.magFilter,T.NearestFilter);assert.equal(mesh.material.map.colorSpace,T.SRGBColorSpace);}
hidden=true;const paused=positions();controller.update(100);assert.deepEqual(positions(),paused);hidden=false;
reduced=true;preference.dispatchEvent(new w.Event('change'));const still=positions();controller.update(1);assert.deepEqual(positions(),still);reduced=false;
w.innerWidth=390;w.innerHeight=844;controller.update();assert.equal(root.children.filter(mesh=>mesh.visible).length,6);
w.innerWidth=1200;w.innerHeight=800;controller.update();assert.equal(root.children.filter(mesh=>mesh.visible).length,9);
for(let frame=0;frame<4000;frame++)controller.update(.02);assert.ok(draws>18,'fresh looks arrive over time');
// Changes to the selected character replace the guest wardrobe without overwriting it.
player.parts.body=39;player.parts.hair=29;player.dye=8;w.localStorage.setItem('mominc-avatar-v1',JSON.stringify(player));let captured=[];
A.draw=(canvas,look,options)=>{captured.push(look);draw(canvas,look,options);};w.dispatchEvent(new w.StorageEvent('storage',{key:'mominc-avatar-v1'}));assert.equal(captured.length,9);
for(const look of captured){assert.notEqual(look.parts.body%10,9);assert.notEqual(look.parts.hair,29);assert.notEqual(look.dye,8);}
assert.equal(w.localStorage.getItem('mominc-avatar-v1'),JSON.stringify(player));
let released=0;for(const mesh of root.children){mesh.material.addEventListener('dispose',()=>released++);mesh.material.map.addEventListener('dispose',()=>released++);}root.children[0].geometry.addEventListener('dispose',()=>released++);
controller.dispose();controller.dispose();assert.equal(released,19);assert.equal(board.scene.getObjectByName('gala-party-guests'),undefined);captured=[];w.dispatchEvent(new w.StorageEvent('storage',{key:'mominc-avatar-v1'}));assert.equal(captured.length,0);
assert.ok(bundle.includes('board.galaCrowd=window.GalaCrowd?.mount(board,'));assert.ok(bundle.includes('this.galaCrowd?.update(x),this.renderer.render'));assert.ok(bundle.includes('this.galaCrowd?.dispose()'));
const html=fs.readFileSync(path.join(site,'tv/games/goon/index.html'),'utf8');assert.ok(html.includes('/gala/crowd.js?v=1'));assert.ok(html.includes('index-W2w8AfON.js?v=party1'));
console.log('PASS: 380 distinct unchosen looks; all alternate wardrobe choices; table/wall clearance; 9 desktop and 6 mobile guests; cached art; live wardrobe changes; hidden/reduced-motion pause; resource cleanup; game integration.');
dom.window.close();
