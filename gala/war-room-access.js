/* The resistance room uses the same clearance as the existing rankings terminal. */
(()=>{'use strict';
 const ready=()=>{const run=window.MBS_RUN?.read();return !!(run?.completedAt&&run?.installedAt);};
 async function enter(start){
  if(!ready())try{await window.MBS_RUN?.refresh();}catch{}
  if(ready()){await start();return true;}
  let target=window;try{if(window.top.location.origin===location.origin)target=window.top;}catch{}
  target.location.replace('/gala/terminal/');return false;
 }
 window.GalaWarRoomAccess={ready,enter};
})();
