const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const {JSDOM}=require('jsdom');const root=path.resolve(__dirname,'..');
test('DJ page arrival stays quiet; starting the game requires a dancing name picker and three-character moniker',()=>{
 const dom=new JSDOM('<body><details class="djid">'+['djA','djB','djC'].map((id,i)=>'<select id="'+id+'"><option value="'+['DJ','ECHO','3000'][i]+'">'+['DJ','ECHO','3000'][i]+'</option></select>').join('')+'<strong id="djName"></strong></details></body>',{url:'https://mominc.online/tv/?ch=djscratch',runScripts:'outside-only'}),w=dom.window;
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};w.eval(fs.readFileSync(path.join(root,'tv/dj-identity.js'),'utf8'));
 let started=0;w.togglePower=()=>started++;w.identityDialog=null;w.byId=id=>w.document.getElementById(id);w.ctx={on:(el,type,fn)=>el.addEventListener(type,fn),timeout:fn=>fn()};const source=fs.readFileSync(path.join(root,'tv/channels/djscratch.js'),'utf8');w.eval(source.slice(source.indexOf('    const djA ='),source.indexOf('    // ---- THE CONTROL RACK')));
 const dialog=w.document.querySelector('dialog'),confirm=dialog.querySelector('[data-name-confirm]'),tag=w.byId('dj-moniker');assert.equal(dialog.open,false);assert.equal(started,0);assert.equal(w.MBS_DJ.read(),null);
 w.eval(source.slice(source.indexOf('    function startGame()'),source.indexOf('    function nextRound()')));w.startGame();assert.equal(dialog.open,true);assert.equal(started,0);assert.equal(confirm.disabled,true);
 for(const [i,id] of ['djA','djB','djC'].entries()){const select=w.byId(id);select.value=['DJ','ECHO','3000'][i];select.dispatchEvent(new w.Event('change'));assert.ok(dialog.classList.contains('dj-dancing'));}
 tag.value='xy';tag.dispatchEvent(new w.Event('input'));assert.equal(confirm.disabled,true);tag.value='xyz';tag.dispatchEvent(new w.Event('input'));assert.equal(confirm.disabled,false);confirm.click();assert.equal(started,1);assert.equal(dialog.open,false);assert.equal(w.MBS_DJ.read().moniker,'XYZ');assert.equal(w.MBS_DJ.display(),'Anonymous guest');w.MBS_DJ.complete();assert.match(w.MBS_DJ.display(),/^PRISONER .*XYZ$/);dom.window.close();
});
test('Fuel entrances preserve the gate and open the builder inside the TV',()=>{
 const read=file=>fs.readFileSync(path.join(root,file),'utf8');
 assert.ok(read('arcade/tub-flight/game.mjs').includes("location.assign('/tv/?ch=fuel')"));
 assert.ok(!read('tv/tv.js').includes('location.replace("/play/fuel/")'));
 assert.ok(read('tv/tv.js').includes('name !== "fuel" && !!chanRec.game'));
 const landing=read('games/fuel/index.html');assert.ok(landing.indexOf('/tv/fuel-gate.js')<landing.indexOf("location.replace('/tv/?ch=fuel')"));assert.ok(landing.includes("dataset.fuelLocked!=='true'"));
 const wrapper=read('play/fuel/index.html');assert.ok(wrapper.indexOf('/tv/fuel-gate.js')<wrapper.indexOf("target.searchParams.set('ch','fuel')"));assert.ok(wrapper.includes('target.hash=location.hash'));
 const play=new JSDOM(wrapper),fragment=new JSDOM(read('tv/channels/fuel.html'));const roots=JSON.parse(play.window.document.documentElement.dataset.roots).roots;
 for(const selector of roots)assert.equal(fragment.window.document.querySelectorAll(selector).length,1,selector);
 assert.ok(fragment.window.document.querySelector('#fuStage'));assert.ok(fragment.window.document.querySelector('#controlTray'));assert.ok(fragment.window.document.querySelector('#doseEducation'));
 play.window.close();fragment.window.close();
});
test('workout playlist share codec round-trips, caps input and ignores bad links',()=>{
 const src=fs.readFileSync(path.join(root,'tv/channels/djscratch.js'),'utf8'),a=src.indexOf('// ---- WORKOUT DATA START'),b=src.indexOf('// ---- WORKOUT DATA END');assert.ok(a>0&&b>a);
 const WK=new Function(src.slice(a,b)+';return WK;')();
 const pl={n:'Leg day <b>',items:[{k:'w1',p:'warm'},{k:'~Eye of the Tiger',p:'peak'},{k:'~Ünïcode ♫',p:'peak'},{k:'c2',p:'cool'}]};
 const hash=WK.encode(pl);assert.match(hash,/^[\w-]+$/);const back=WK.decode(hash);
 assert.deepEqual(back.items,pl.items);assert.equal(back.n,'Leg day b');
 assert.equal(WK.decode('not-a-playlist'),null);assert.equal(WK.decode(''),null);assert.equal(WK.decode('a'.repeat(2500)),null);
 const odd=WK.decode(WK.encode({n:'x',items:[{k:'zz9',p:'warm'},{k:'w2',p:'nope'},{k:'w2',p:'warm'}]}));assert.deepEqual(odd.items,[{k:'w2',p:'warm'}]);
 const long=WK.decode(WK.encode({n:'y',items:Array.from({length:60},()=>({k:'w1',p:'warm'}))}));assert.equal(long.items.length,40);
 assert.ok(WK.decode(WK.encode({n:'t',items:[{k:'~'+'q'.repeat(90),p:'cool'}]})).items[0].k.length<=41);
});
