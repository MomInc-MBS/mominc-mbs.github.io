/* Keep touch gestures inside the authored phone layout. */
(()=>{'use strict';if(!matchMedia('(pointer:coarse)').matches)return;
let meta=document.querySelector('meta[name="viewport"]');if(!meta){meta=document.createElement('meta');meta.name='viewport';document.head.append(meta);}meta.content='width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
const style=document.createElement('style');style.textContent='html{touch-action:pan-x pan-y;overflow-x:clip;-webkit-text-size-adjust:100%;text-size-adjust:100%}body{overflow-x:clip}input,select,textarea{font-size:16px!important}button,a{touch-action:manipulation}';document.head.append(style);
for(const type of ['gesturestart','gesturechange','gestureend'])document.addEventListener(type,e=>e.preventDefault(),{passive:false});
document.addEventListener('touchmove',e=>{if(e.touches.length>1)e.preventDefault();},{passive:false});
})();
