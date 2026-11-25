// Negative above the center, positive below it; quadratic acceleration at the edges.
export function flightScrollSpeed(clientY,top,height){
 if(!Number.isFinite(clientY)||!(height>0))return 0;
 const offset=Math.max(-1,Math.min(1,2*(clientY-top)/height-1));
 return Math.sign(offset)*offset*offset*1600;
}

export function mountFlightScroll(viewport,{requestFrame=requestAnimationFrame,cancelFrame=cancelAnimationFrame,now=()=>performance.now()}={}){
 let pointerY=null,frame=0,last=0;
 const tick=time=>{
  if(pointerY===null)return;
  const rect=viewport.getBoundingClientRect(),dt=Math.min(50,Math.max(0,time-last));last=time;
  viewport.scrollTop+=flightScrollSpeed(pointerY,rect.top,rect.height)*dt/1000;
  frame=requestFrame(tick);
 };
 return {
  aim(clientY){pointerY=clientY;if(!frame){last=now();frame=requestFrame(tick);}},
  stop(){pointerY=null;if(frame)cancelFrame(frame);frame=0;},
 };
}

// R-1017 one achievements page: tuning knobs for real phones.
export const FLIGHT_TUNING={
 hyperMinMs:650,      // shortest hyper-speed jump
 hyperMaxMs:1700,     // longest jump (the whole 250-level route)
 hyperPxPerMs:28,     // cruise speed before the min/max clamp
 coachLine:.6,        // on open the golden coach's feet sit at this share of the screen; the ship rests just under them
 landLine:.5,         // a jumped-to section lands with its marker at this share of the screen
};
// Section menu: 0..chapters-1 are the flight systems (system 1 at the bottom of the page), the last one is the coaches.
export function flightSections(chapters){
 return [...Array.from({length:chapters},(_,chapter)=>({id:`system-${chapter+1}`,chapter})),{id:'coaches',chapter:null}];
}
// scrollTop that puts a point `y` px down the scroller's content at `line` of its height, clamped to the scroll range.
export function sectionScrollTop(y,viewportHeight,scrollHeight,line=FLIGHT_TUNING.landLine){
 return Math.round(Math.max(0,Math.min(scrollHeight-viewportHeight,y-viewportHeight*line)));
}
export function hyperDuration(distance,t=FLIGHT_TUNING){
 return Math.round(Math.max(t.hyperMinMs,Math.min(t.hyperMaxMs,Math.abs(distance)/t.hyperPxPerMs)));
}
// Ease in-out (cubic): a punch out of the start, full warp in the middle, a brake into the section.
export const hyperEase=u=>u<.5?4*u*u*u:1-(-2*u+2)**3/2;
