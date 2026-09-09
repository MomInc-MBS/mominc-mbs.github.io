(()=>{'use strict';if(window.GalaGramophone)return;
const KEY='mominc-gramophone-v1',POSITION='mominc-gramophone-position-v1',audio=new Audio('/gala/audio/satie-gramophone.mp3');audio.preload='none';audio.loop=true;
let preference={enabled:true,volume:.35},playing=false,pending=false,restoreAt=0,generation=0;
try{const saved=JSON.parse(localStorage.getItem(KEY));if(saved){preference.enabled=saved.enabled!==false;if(Number.isFinite(saved.volume))preference.volume=Math.max(0,Math.min(1,saved.volume));}restoreAt=Number(sessionStorage.getItem(POSITION))||0;}catch{}
audio.volume=preference.volume;
const style=document.createElement('link');style.rel='stylesheet';style.href='/gala/gramophone.css?v=1';document.head.append(style);
const panel=document.createElement('div');panel.className='gala-gramophone';panel.setAttribute('aria-label','Gramophone music');
panel.innerHTML='<button type="button" class="gramophone-toggle" aria-pressed="false">♫ Play gramophone</button><label class="gramophone-volume">Volume<input type="range" min="0" max="100" step="5" aria-label="Music volume"></label><a class="gramophone-credit" href="/gala/music.html" target="_blank" rel="noopener">Satie · recording credits</a>';
const button=panel.querySelector('button'),volume=panel.querySelector('input');volume.value=String(preference.volume*100);
const slot=document.querySelector('[data-gramophone-slot]');if(slot){slot.append(panel);panel.classList.add('is-inline');}else document.body.append(panel);
function save(){try{localStorage.setItem(KEY,JSON.stringify(preference));}catch{}}
function remember(){if(Number.isFinite(audio.currentTime))try{sessionStorage.setItem(POSITION,String(audio.currentTime));}catch{}}
function paint(){button.textContent=pending?'♫ Starting…':playing?'♫ Mute gramophone':'♫ Play gramophone';button.setAttribute('aria-pressed',String(playing));}
async function play(){if(pending||playing||!preference.enabled||document.hidden)return;const request=++generation;pending=true;paint();try{await audio.play();if(request!==generation)return;if(!preference.enabled||document.hidden){audio.pause();playing=false;}else playing=true;}catch{if(request===generation)playing=false;}finally{if(request===generation){pending=false;paint();}}}
function pause(){generation++;pending=false;audio.pause();playing=false;remember();paint();}
button.onclick=()=>{preference.enabled=!(playing||pending);save();if(preference.enabled){if(audio.error)audio.load();play();}else pause();};
volume.oninput=()=>{preference.volume=Number(volume.value)/100;audio.volume=preference.volume;save();};
audio.addEventListener('loadedmetadata',()=>{if(restoreAt>0&&Number.isFinite(audio.duration)){audio.currentTime=restoreAt%audio.duration;restoreAt=0;}});
audio.addEventListener('error',()=>{pending=false;playing=false;button.textContent='♫ Music unavailable · retry';button.setAttribute('aria-pressed','false');});
audio.addEventListener('pause',()=>{playing=false;paint();});audio.addEventListener('playing',()=>{playing=true;paint();});
// Browsers require an interaction before music can start. An explicit mute wins.
function firstAction(event){if(!panel.contains(event.target)&&preference.enabled)play();}
document.addEventListener('pointerdown',firstAction);document.addEventListener('keydown',firstAction);
document.addEventListener('visibilitychange',()=>document.hidden?pause():play());window.addEventListener('pagehide',pause);
window.addEventListener('storage',event=>{if(event.key!==KEY)return;try{const v=JSON.parse(event.newValue);if(!v)return;preference.enabled=v.enabled!==false;preference.volume=Math.max(0,Math.min(1,Number(v.volume)||0));audio.volume=preference.volume;volume.value=String(preference.volume*100);if(!preference.enabled)pause();}catch{}});
setInterval(remember,5000);paint();window.GalaGramophone={pause,play};
})();
