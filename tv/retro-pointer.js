/* Original 16 × 16 pixel artwork, drawn as 48px native cursors. No cursor library. */
(()=>{'use strict';
 if(document.documentElement.dataset.retroPointer)return;
 const themes={
  mominc:{ink:'#211725',paper:'#fff4ce',accent:'#e2b65f',shade:'#907746',badge:'011110/122221/124421/122221/011110/001100'},
  girlfriend:{ink:'#301333',paper:'#ffe7f5',accent:'#ff5da7',shade:'#a84f93',badge:'010010/141141/144441/014410/001100/000000'},
  djscratch:{ink:'#180e27',paper:'#e8ecff',accent:'#bf84ff',shade:'#685790',badge:'001100/011110/114411/114411/011110/001100'},
  lilboyfriend:{ink:'#152932',paper:'#fff0cb',accent:'#7dccdc',shade:'#b78e5a',badge:'010010/111111/124421/122221/012210/001100'},
  corgi:{ink:'#39211c',paper:'#ffefb4',accent:'#fa9345',shade:'#ac692e',badge:'110011/141141/122221/124421/012210/001100'},
  goon:{ink:'#160b25',paper:'#e4ffd4',accent:'#b7ff3c',shade:'#8745d8',badge:'011110/122221/114411/122221/011110/010010'},
  fuel:{ink:'#1a0a10',paper:'#ffea00',accent:'#c6ff00',shade:'#ff2e88',badge:'001110/014100/141110/111410/001410/001100'},
  armie:{ink:'#24171b',paper:'#f9e5bf',accent:'#ee7951',shade:'#8b5254',badge:'011110/141141/141141/111111/014410/001100'},
  handborne:{ink:'#231132',paper:'#f4e6ff',accent:'#7de4cd',shade:'#a267d4',badge:'001100/011110/114411/144441/014410/001100'},
  terminal:{ink:'#061b15',paper:'#e0ffe9',accent:'#57ffaf',shade:'#299270',badge:'001100/001100/114411/114411/001100/001100'},
  files:{ink:'#081a39',paper:'#f4f4e4',accent:'#5be2ff',shade:'#7386bd',badge:'011000/144110/144441/144441/144441/111111'},
  sag:{ink:'#213425',paper:'#fff6d9',accent:'#a7e566',shade:'#78a57a',badge:'011110/144441/124421/144441/014410/001100'}
 };
 const arrow=['0100000000000000','0110000000000000','0121000000000000','0122100000000000','0122210000000000','0122221000000000','0122222100000000','0122222210000000','0122222221000000','0122241111100000','0124141000000000','0141014100000000','0110014410000000','0100001441000000','0000000111000000','0000000000000000'];
 const hand=['0000001100000000','0000012210000000','0000012210000000','0000012210000000','0000012211110000','0000012212241100','0011012212242410','0122112222242410','0122212222242410','0012222222242410','0012222222442410','0001222224444100','0001222244444100','0000122444441000','0000011111110000','0000000000000000'];
 const beam=['0001111111110000','0001222122210000','0001112121110000','0000001210000000','0000001210000000','0000001410000000','0000001410000000','0000001410000000','0000001410000000','0000001410000000','0000001210000000','0000001210000000','0001112121110000','0001222122210000','0001111111110000','0000000000000000'];
 function sprite(theme,pattern,badge=false){
  const pixels=pattern.map(row=>row.split(''));if(badge)theme.badge.split('/').forEach((row,y)=>[...row].forEach((pixel,x)=>{if(pixel!=='0')pixels[y+10][x+10]=pixel;}));
  const colors=['',theme.ink,theme.paper,theme.shade,theme.accent],paths=new Map();
  // Merge neighboring pixels into color paths so each page stays light.
  pixels.forEach((row,y)=>{const fills=row.map((pixel,x)=>pixel==='2'&&x>3&&y>5?theme.shade:colors[pixel]);for(let x=0;x<16;){const fill=fills[x];let end=x+1;while(end<16&&fills[end]===fill)end++;if(fill)paths.set(fill,(paths.get(fill)||'')+'M'+x+' '+y+'h'+(end-x)+'v1h-'+(end-x)+'z');x=end;}});
  const cells=[...paths].map(([fill,d])=>'<path fill="'+fill+'" d="'+d+'"/>').join('');return 'url("data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 16 16" shape-rendering="crispEdges">'+cells+'</svg>')+'")';
 }
 const artwork=Object.fromEntries(Object.entries(themes).map(([name,theme])=>[name,{arrow:sprite(theme,arrow,true),hand:sprite(theme,hand),text:sprite(theme,beam)}]));
 function pageTheme(){const path=location.pathname;if(path.includes('/gala/terminal'))return 'terminal';if(path.includes('/gala/'))return 'goon';if(path.includes('/handborne'))return 'handborne';if(path.includes('/tub-flight'))return 'fuel';if(path.includes('/files')||path.includes('/download'))return 'files';if(path.includes('/armie')||path.includes('/coach-setup'))return 'armie';const name=new URLSearchParams(location.search).get('ch')||document.documentElement.dataset.game||document.body?.dataset.slug||path.match(/\/(?:play|games)\/([^/]+)/)?.[1];return themes[name]?name:'mominc';}
 function updateTheme(){document.documentElement.dataset.retroPointer=pageTheme();}
 const style=document.createElement('style');style.id='retro-pointer-style';style.textContent=Object.entries(artwork).map(([name,art])=>'[data-retro-pointer="'+name+'"]'+(name==='fuel'?',.tv-ad-layer [data-sponsor="fuel"]':name==='handborne'?',.tv-ad-layer [data-sponsor="hand"]':'')+'{--retro-arrow:'+art.arrow+' 3 0;--retro-hand:'+art.hand+' 18 0;--retro-text:'+art.text+' 21 21;--retro-touch:'+art.arrow+';--retro-accent:'+themes[name].accent+';}').join('\n')+`
 @media(any-pointer:fine){
  html[data-retro-pointer],html[data-retro-pointer] body,html[data-retro-pointer] body *{cursor:var(--retro-arrow),auto!important}
  html[data-retro-pointer] :is(a,button,summary,label[for],[role=button],input[type=checkbox],input[type=radio],input[type=range]),html[data-retro-pointer] :is(a,button,summary,[role=button]) *{cursor:var(--retro-hand),pointer!important}
  html[data-retro-pointer] :is(textarea,input:not([type=button]):not([type=submit]):not([type=reset]):not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]):not([type=file]),[contenteditable=true]){cursor:var(--retro-text),text!important}
  html[data-retro-pointer] :is(:disabled,[aria-disabled=true]),html[data-retro-pointer] :is(:disabled,[aria-disabled=true]) *{cursor:not-allowed!important}
 }
 .retro-touch-layer{position:fixed!important;inset:0!important;z-index:2147483646!important;overflow:hidden!important;pointer-events:none!important;contain:strict}
 .retro-touch-marker{position:absolute!important;width:48px!important;height:48px!important;transform:translate(-3px,0);background-image:var(--retro-touch);background-size:48px 48px;image-rendering:pixelated;pointer-events:none!important;filter:drop-shadow(2px 2px 0 #0008)}
 .retro-touch-marker:before{content:"";position:absolute;left:-10px;top:-10px;width:18px;height:18px;border:3px dotted var(--retro-accent);opacity:.9}
 .retro-touch-marker.released{animation:retro-touch-away .38s steps(4,end) forwards}
 @keyframes retro-touch-away{to{opacity:0;translate:0 -6px}}
 @media(prefers-reduced-motion:reduce){.retro-touch-marker.released{animation:none;opacity:.5}}
 `;document.head.append(style);updateTheme();window.addEventListener('popstate',updateTheme);window.addEventListener('pageshow',updateTheme);
 const touches=new Map(),layers=new Map();const reduced=()=>window.matchMedia?.('(prefers-reduced-motion:reduce)').matches;
 const editable=target=>target.closest('input,textarea,select,[contenteditable=true]');
 function clear(id){const mark=touches.get(id);if(!mark)return;clearTimeout(mark.timer);mark.node.remove();touches.delete(id);if(!mark.layer.childElementCount){mark.layer.remove();layers.delete(mark.host);}}
 function clearAll(){for(const id of [...touches.keys()])clear(id);}
 document.addEventListener('pointerdown',event=>{if(!['touch','pen'].includes(event.pointerType)||!event.target.closest||editable(event.target))return;clear(event.pointerId);const host=event.target.closest('dialog[open]')||document.body;let layer=layers.get(host);if(!layer){layer=document.createElement('div');layer.className='retro-touch-layer';layer.setAttribute('aria-hidden','true');host.append(layer);layers.set(host,layer);}const node=document.createElement('span');node.className='retro-touch-marker';const ad=event.target.closest('[data-sponsor]');node.dataset.retroPointer=ad?(ad.dataset.sponsor==='fuel'?'fuel':'handborne'):pageTheme();node.style.left=event.clientX+'px';node.style.top=event.clientY+'px';layer.append(node);touches.set(event.pointerId,{node,host,layer,x:event.clientX,y:event.clientY,timer:setTimeout(()=>clear(event.pointerId),1400)});},{passive:true,capture:true});
 document.addEventListener('pointermove',event=>{const mark=touches.get(event.pointerId);if(mark&&Math.hypot(event.clientX-mark.x,event.clientY-mark.y)>12)clear(event.pointerId);},{passive:true,capture:true});
 document.addEventListener('pointerup',event=>{const mark=touches.get(event.pointerId);if(!mark)return;clearTimeout(mark.timer);mark.node.classList.add('released');mark.timer=setTimeout(()=>clear(event.pointerId),reduced()?150:380);},{passive:true,capture:true});
 document.addEventListener('pointercancel',event=>clear(event.pointerId),{passive:true,capture:true});document.addEventListener('scroll',clearAll,{passive:true,capture:true});document.addEventListener('visibilitychange',()=>{if(document.hidden)clearAll();});window.addEventListener('pagehide',clearAll);
})();
