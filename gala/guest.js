/* The saved Gala guest and earned floating weapon appear together in the game. */
(()=>{'use strict';const KEY='mominc-avatar-v1';let look;
function load(){try{const raw=localStorage.getItem(KEY)||sessionStorage.getItem(KEY);look=raw?GalaAvatar.normalize(JSON.parse(raw)):null;}catch{look=null;}}
load();if(!look)return;
const link=document.createElement('a');link.href='/gala/';link.target='_top';link.style.cssText='position:fixed;right:8px;top:8px;z-index:90;display:flex;align-items:center;gap:6px;max-width:180px;padding:5px 9px;background:#20142deb;border:1px solid #c3a367;color:#f8e6bd;text-decoration:none;font:12px Georgia;box-shadow:0 3px 10px #0007';
const c=document.createElement('canvas');c.style.cssText='height:64px;width:auto;image-rendering:pixelated';const span=document.createElement('span');span.style.cssText='max-width:72px;overflow-wrap:anywhere';link.append(c,span);document.body.append(link);
function paint(time=0){link.style.display=look?'flex':'none';if(!look)return;GalaAvatar.draw(c,look,{time});span.textContent=look.name||'Gala guest';link.setAttribute('aria-label','Change your gala avatar: '+span.textContent);}
paint();window.addEventListener('storage',e=>{if(e.key===KEY||e.key===window.GalaProgress?.KEY){load();paint();}});
let last=0;const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');function frame(now){if(!document.hidden&&!reduced?.matches&&look?.weapon&&now-last>65){last=now;paint(now);}requestAnimationFrame(frame);}requestAnimationFrame(frame);
})();
