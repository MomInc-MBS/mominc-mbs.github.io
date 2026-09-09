(()=>{
 const tv=document.querySelector('#tv'),screen=document.querySelector('#creator-screen');
 document.querySelector('#power').onclick=()=>{const off=tv.dataset.state==='on';tv.dataset.state=off?'off':'on';screen.inert=off;};
 document.querySelector('#pictureBtn').onclick=()=>{const clear=tv.dataset.picture!=='clear';tv.dataset.picture=clear?'clear':'crt';document.querySelector('#pictureBtn').setAttribute('aria-pressed',String(clear));document.querySelector('#pictureLegend').textContent=clear?'CRT':'CLEAR';};
 const knob=document.querySelector('#knob');knob.setAttribute('aria-label','Return to MOM INC');knob.title='Return to MOM INC';knob.onclick=()=>{window.top.location.href='/tv/?ch=mominc';};
 document.querySelector('#dialTicks').innerHTML=[1,2,3,4,5].map((n,i)=>{const a=(-120+i*60)*Math.PI/180;return '<text x="'+(60+Math.sin(a)*50)+'" y="'+(63-Math.cos(a)*50)+'" text-anchor="middle">'+n+'</text>';}).join('');
 let timer;function ready(){try{if(screen.contentDocument?.querySelector('canvas')){document.documentElement.dataset.studioReady='true';parent.postMessage({type:'armie-studio-ready'},location.origin);return;}}catch{}timer=setTimeout(ready,200);}
 screen.addEventListener('load',()=>{clearTimeout(timer);ready();});ready();window.addEventListener('pagehide',()=>clearTimeout(timer));
})();