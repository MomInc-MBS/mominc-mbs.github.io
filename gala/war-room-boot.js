/* Load the resistance game only after clearance; the public Gala has its own entry. */
(()=>{'use strict';
 const script=src=>new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=src;el.async=false;el.onload=resolve;el.onerror=()=>reject(Error('Could not load the War Room.'));document.head.append(el);});
 window.GalaWarRoomAccess.enter(async()=>{
  await window.MBS_LOAD?.ready;
  if(document.documentElement.dataset.warRoomEntry==='shell'){await script('/tv/mount.js');return;}
  const files=['workout-tracks.js?v=training1','progress.js?v=training1','weapons.js?v=training1','avatar.js?v=performance1','performer.js?v=training1','guest.js?v=training1','crowd.js?v=1','gramophone.js?v=1','ammo.js?v=resistance1','war-room.js?v=separate1'];
  await Promise.all(files.map(file=>script('/gala/'+file)));
  await import('/gala/weapon-station.mjs?v=training1');
  await import('/tv/games/goon/assets/index-W2w8AfON.js?v=resistance1');
  document.getElementById('warRoomLoading')?.remove();
  window.MBS_LOAD?.finish();
 }).catch(()=>{
  window.MBS_LOAD?.failed();
  const notice=document.getElementById('warRoomLoading')||document.getElementById('boot');
  if(notice){notice.replaceChildren(document.createTextNode('The War Room could not load. '));const retry=document.createElement('a');retry.href=location.href;retry.textContent='Try again';notice.append(retry);}
 });
})();
