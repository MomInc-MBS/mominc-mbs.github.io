import {bandIndex} from './engine.js';
export function sceneFrame({distance,hits,phase}) {
 const layer=bandIndex(distance),progress=Math.max(0,Math.min(1,distance/100000));
 const player=phase==='escaped'?65:43+progress*17;
 const gap=phase==='dead'?3:Math.max(9,28-hits*8);
 return {layer,x:(layer%2)*100,y:Math.floor(layer/2)/3*100,player,pursuer:player-gap,
  status:phase==='dead'?'MOM CAUGHT YOUR SIGNAL':phase==='escaped'?'MOTHER STATION REACHED':hits===2?'MOM IS RIGHT BEHIND YOU':hits===1?'MOM IS CLOSING IN':'MOM IS ON YOUR TRAIL'};
}
export function renderScene(state) {
 const f=sceneFrame(state),scene=document.querySelector('#space-scene');
 if(!scene)return;
 scene.dataset.layer=String(f.layer);scene.dataset.hits=String(state.hits);scene.dataset.phase=state.phase;
 scene.style.setProperty('--space-x',`${f.x}%`);scene.style.setProperty('--space-y',`${f.y}%`);
 document.querySelector('#rocket').style.bottom=`${f.player}%`;
 document.querySelector('#pursuer').style.bottom=`${f.pursuer}%`;
 document.querySelector('#chase-status').textContent=f.status;
 for(const marker of document.querySelectorAll('.depth-chart [data-layer]')){
  const n=Number(marker.dataset.layer);marker.classList.toggle('active',n===f.layer);marker.classList.toggle('reached',n<f.layer);
  if(n===f.layer)marker.setAttribute('aria-current','step');else marker.removeAttribute('aria-current');
 }
}
