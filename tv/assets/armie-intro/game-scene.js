import {LENGTH} from './maze-run.mjs?v=chase-4';
import {createMazeScene} from './maze-scene.js?v=chase-4';
// Gameplay continues in the intro's existing renderer, hallway, lighting and camera.
export function continueScene({THREE,scene,camera,renderer,coach,computer,hand,drive,flashMat,fade,status,caption,practicals}){
 const maze=createMazeScene(THREE);
 let state=null,started=0,changed=0,lastMistakes=0,shake=0,raf=0,currentX=12,currentZ=2;
 const gold=new THREE.MeshStandardMaterial({color:'#b28c45',metalness:.64,roughness:.34});const dark=new THREE.MeshStandardMaterial({color:'#35223d',metalness:.3,roughness:.4});
 const doorway=new THREE.Group();doorway.visible=false;scene.add(doorway);doorway.rotation.y=Math.PI/2;doorway.position.set(-15,0,2);
 const panels=[];for(const side of [-1,1]){const door=new THREE.Mesh(new THREE.BoxGeometry(1.35,3,.12),dark);door.position.set(side*.69,1.5,0);doorway.add(door);panels.push(door);const edge=new THREE.Mesh(new THREE.BoxGeometry(.07,3.1,.15),gold);edge.position.set(side*1.43,1.55,0);doorway.add(edge);}
 let lastMaze=null;
 function frame(now){if(!state)return;const junction=state.phase==='question'||state.phase==='feedback'&&state.from==='question';const failedRun=state.phase==='feedback'&&state.from==='run';if(state.phase==='run'&&state.maze||junction||failedRun&&lastMaze){fade.style.opacity='0';const snapshot=junction?(lastMaze?.seed===state.hall?{...lastMaze,paused:true}:{seed:state.hall,distance:LENGTH,time:0,lane:0,height:0,duck:0,paused:true}):state.maze||lastMaze;maze.render(renderer,snapshot,state.motion!==false,{junction,open:state.phase==='feedback'&&state.from==='question'&&state.good});raf=requestAnimationFrame(frame);return;}const t=(now-started)/1000,elapsed=(now-changed)/1000;const move=state.motion!==false;const directionStage=state.phase==='direction'||state.phase==='feedback'&&state.from==='tap'&&state.good;
 const questionStage=state.phase==='question'||state.phase==='feedback'&&(state.from==='question'||state.from==='direction'&&state.good);
 const stage=state.phase==='enterLab'?3.2:questionStage?2:directionStage?1:state.phase==='tap'?Math.min(1,(state.taps||0)/9):0;
 const entranceX=10-state.hall*7;const targetX=entranceX-stage*1.9;

 currentX+= (targetX-currentX)*(move?.075:1);const moving=Math.abs(currentX-targetX)>.08;
 const bump=move&&moving?Math.sin(t*19)*.032:0;const jolt=move?Math.max(0,1-(now-shake)/600):0;
 const lane=questionStage?2+(1-(state.route??[0,2,0][state.hall]))*1.1:2;
 currentZ+=(lane-currentZ)*(move?.065:1);
 camera.position.set(currentX,1.65+bump+Math.sin(t*90)*jolt*.035,currentZ+Math.cos(t*77)*jolt*.04);
 camera.lookAt(state.back?currentX+20:questionStage&&moving?entranceX-5.3:currentX-20,1.58,questionStage?lane:currentZ);
 const caught=state.phase==='caught';coach.position.set(currentX+[11,6,2.3,.6][Math.min(state.mistakes,3)],caught?2.4-Math.min(1,elapsed/1.3)*1.5:.66,2);coach.scale.setScalar(caught?3.8:2.6);coach.material.color.set(state.mistakes===0?'#302435':state.mistakes===1?'#6a5274':'#d5badf');
 if(caught)camera.lookAt(coach.position);
 doorway.position.x=entranceX-5.3;doorway.visible=!state.back&&(state.phase==='enterLab'||state.phase==='question'||state.phase==='feedback'&&state.from==='question');const open=state.phase==='enterLab'||state.phase==='feedback'&&state.from==='question'&&state.good;panels.forEach((door,i)=>door.position.x=(i?1:-1)*(.69+(open?Math.min(1,elapsed)*1.5:0)));

 practicals.forEach((light,i)=>light.intensity=5+(move?Math.sin(t*1.7+i)*.18:0));
 flashMat.opacity=Math.max(0,1-t*1.5);fade.style.opacity=String(flashMat.opacity);renderer.render(scene,camera);raf=requestAnimationFrame(frame);
 }
 return next=>{const now=performance.now();if(!state){started=now;computer.visible=false;hand.visible=false;drive.visible=false;status.style.display='none';caption.textContent='';document.querySelector('#controls').hidden=true;currentX=10;raf=requestAnimationFrame(frame);}if(!state||state.phase!==next.phase||state.hall!==next.hall)changed=now;if(next.mistakes>lastMistakes)shake=now;lastMistakes=next.mistakes;if(state?.hall!==next.hall)lastMaze=null;if(next.maze)lastMaze={...next.maze};state=next;window.armieGameSceneState=next;};
}


