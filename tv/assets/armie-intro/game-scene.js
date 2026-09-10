import {createMazeScene} from './maze-scene.js?v=swipe-2';
// Gameplay continues in the intro's existing renderer, hallway, lighting and camera.
export function continueScene({THREE,scene,camera,renderer,coach,computer,hand,drive,flashMat,fade,status,caption,practicals}){
 const maze=createMazeScene(THREE);
 let state=null,started=0,changed=0,lastMistakes=0,shake=0,raf=0,currentX=12,currentZ=2;
 const gold=new THREE.MeshStandardMaterial({color:'#b28c45',metalness:.64,roughness:.34});const dark=new THREE.MeshStandardMaterial({color:'#35223d',metalness:.3,roughness:.4});
 const doorway=new THREE.Group();doorway.visible=false;scene.add(doorway);doorway.rotation.y=Math.PI/2;doorway.position.set(-15,0,2);
 const panels=[];for(const side of [-1,1]){const door=new THREE.Mesh(new THREE.BoxGeometry(1.35,3,.12),dark);door.position.set(side*.69,1.5,0);doorway.add(door);panels.push(door);const edge=new THREE.Mesh(new THREE.BoxGeometry(.07,3.1,.15),gold);edge.position.set(side*1.43,1.55,0);doorway.add(edge);}
 const signs=[];let signHall=-1;
 const fork=new THREE.Group();fork.visible=false;scene.add(fork);fork.rotation.y=Math.PI/2;
 for(const x of [-1.1,1.1]){const opening=new THREE.Mesh(new THREE.PlaneGeometry(1.45,2.9),new THREE.MeshBasicMaterial({color:'#050308'}));opening.position.set(x,1.45,0);fork.add(opening);for(const side of [-1,1]){const trim=new THREE.Mesh(new THREE.BoxGeometry(.065,3,.1),gold);trim.position.set(x+side*.76,1.5,.05);fork.add(trim);}const cap=new THREE.Mesh(new THREE.BoxGeometry(1.6,.09,.1),gold);cap.position.set(x,2.95,.05);fork.add(cap);const board=new THREE.Mesh(new THREE.PlaneGeometry(1.4,.6),new THREE.MeshBasicMaterial());board.position.set(x,2.43,.08);fork.add(board);signs.push(board);}
 function updateSigns(){const correct=state.route??[0,2,1][state.hall];signs.forEach((board,i)=>{const c=document.createElement('canvas');c.width=512;c.height=220;const g=c.getContext('2d');const exit=(i===0?0:2)===correct;g.fillStyle=exit?'#281313':'#ded0a7';g.fillRect(0,0,512,220);g.fillStyle=exit?'#f18a74':'#32253c';g.textAlign='center';g.font='bold 44px monospace';g.fillText(exit?'TORTURE / DEATH':'MOM INC',256,65);g.font='bold 34px monospace';g.fillText(exit?'DO NOT ENTER':'COME HOME',256,125);g.font='22px monospace';g.fillText(exit?'NO RETURN':'SAFE. LOVED. FOREVER.',256,184);board.material.map?.dispose();board.material.map=new THREE.CanvasTexture(c);board.material.map.colorSpace=THREE.SRGBColorSpace;board.material.needsUpdate=true;});signHall=state.hall;}
 function frame(now){if(!state)return;if(state.phase==='run'&&state.maze){fade.style.opacity='0';maze.render(renderer,state.maze,state.motion!==false);raf=requestAnimationFrame(frame);return;}const t=(now-started)/1000,elapsed=(now-changed)/1000;const move=state.motion!==false;const directionStage=state.phase==='direction'||state.phase==='feedback'&&state.from==='tap'&&state.good;
 const questionStage=state.phase==='question'||state.phase==='feedback'&&(state.from==='question'||state.from==='direction'&&state.good);
 const stage=state.phase==='enterLab'?3.2:questionStage?2:directionStage?1:state.phase==='tap'?Math.min(1,(state.taps||0)/9):0;
 const entranceX=10-state.hall*7;const targetX=entranceX-stage*1.9;
 if(signHall!==state.hall)updateSigns();
 currentX+= (targetX-currentX)*(move?.075:1);const moving=Math.abs(currentX-targetX)>.08;
 const bump=move&&moving?Math.sin(t*19)*.032:0;const jolt=move?Math.max(0,1-(now-shake)/600):0;
 const lane=questionStage?2+(1-(state.route??[0,2,0][state.hall]))*1.1:2;
 currentZ+=(lane-currentZ)*(move?.065:1);
 camera.position.set(currentX,1.65+bump+Math.sin(t*90)*jolt*.035,currentZ+Math.cos(t*77)*jolt*.04);
 camera.lookAt(state.back?currentX+20:questionStage&&moving?entranceX-5.3:currentX-20,1.58,questionStage?lane:currentZ);
 const caught=state.phase==='caught';coach.position.set(currentX+[11,6,2.3,.6][Math.min(state.mistakes,3)],caught?2.4-Math.min(1,elapsed/1.3)*1.5:.66,2);coach.scale.setScalar(caught?3.8:2.6);coach.material.color.set(state.mistakes===0?'#302435':state.mistakes===1?'#6a5274':'#d5badf');
 if(caught)camera.lookAt(coach.position);
 doorway.position.x=entranceX-5.3;doorway.visible=!state.back&&(state.phase==='enterLab'||state.phase==='question'||state.phase==='feedback'&&state.from==='question');const open=state.phase==='enterLab'||state.phase==='feedback'&&state.from==='question'&&state.good;panels.forEach((door,i)=>door.position.x=(i?1:-1)*(.69+(open?Math.min(1,elapsed)*1.5:0)));
 fork.visible=!state.back&&(state.phase==='direction'||state.phase==='feedback'&&state.from==='tap'&&state.good);fork.position.set(entranceX-4.8,0,2);
 practicals.forEach((light,i)=>light.intensity=5+(move?Math.sin(t*1.7+i)*.18:0));
 flashMat.opacity=Math.max(0,1-t*1.5);fade.style.opacity=String(flashMat.opacity);renderer.render(scene,camera);raf=requestAnimationFrame(frame);
 }
 return next=>{const now=performance.now();if(!state){started=now;computer.visible=false;hand.visible=false;drive.visible=false;status.style.display='none';caption.textContent='';document.querySelector('#controls').hidden=true;currentX=10;raf=requestAnimationFrame(frame);}if(!state||state.phase!==next.phase||state.hall!==next.hall)changed=now;if(next.mistakes>lastMistakes)shake=now;lastMistakes=next.mistakes;state=next;window.armieGameSceneState=next;};
}


