import { openingAnchors } from "./opening-layout.js?objects=12";
const smooth = t => t*t*(3-2*t);
// Capture both position and optical direction at each boundary, including review skips.
function shotCamera(c) {
  const {THREE,camera,poseCamera}=c;
  let eye,look;
  return {
    capture(){eye=camera.position.clone();look=eye.clone().add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(2));},
    move(to,target,t,foot){poseCamera(eye.clone().lerp(to,smooth(t)),look.clone().lerp(target,smooth(t)),foot);},
  };
}
export function theftShots(c) {
  const {THREE,camera,traveler,thief,magnifier,caption,sound,freeMag,putMagnifier}=c;
  const a=openingAnchors(THREE),v=(x,y,z)=>new THREE.Vector3(x,y,z),cam=shotCamera(c);
  let release=magnifier.getWorldPosition(v(0,0,0)),rotation=magnifier.getWorldQuaternion(new THREE.Quaternion());
  const heldOrigin=traveler.rightHand.position.clone(),heldPose=v(.03,1.32,-1.25),heldEye=camera.position.clone(),heldLook=traveler.group.localToWorld(v(.03,1.37,-1.30));
  const flat=new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/2,0,.18));
  const foot=v(camera.position.x,0,camera.position.z),lowFoot=v(a.crouch.x,0,a.crouch.z);
  let origin,offset,fallStart,fallRotation,impact=false;
  const moveHand=(from,to,t,pose="grasp")=>{thief.group.position.copy(from).lerp(to,smooth(t));thief.setPose(pose,t*2);};
  return [
    {duration:.85,enter(){cam.capture();caption("The whole borrowed controller rests in your felt hand.");},update(t){traveler.rightHand.position.copy(heldOrigin).lerp(heldPose,smooth(Math.min(1,t/.30)));cam.move(heldEye,heldLook,Math.min(1,t/.30),foot);traveler.group.updateMatrixWorld(true);}},
    {duration:.85,enter(){cam.capture();release=magnifier.getWorldPosition(v(0,0,0));rotation=magnifier.getWorldQuaternion(new THREE.Quaternion());freeMag(release);magnifier.quaternion.copy(rotation);fallStart=magnifier.position.clone();fallRotation=rotation.clone();caption("The borrowed controller slips.");},update(t){
      cam.move(a.topDown,a.landing,t,foot);
      const flight=Math.min(t/.80,1);magnifier.position.copy(fallStart).lerp(a.landing,flight);magnifier.position.y=fallStart.y+(a.landing.y-fallStart.y)*flight*flight;
      magnifier.quaternion.copy(fallRotation).slerp(flat,flight);
      if(t>=.8&&!impact){sound.cue("drop");impact=true;}
      if(t>.8)magnifier.position.y+=Math.sin((t-.8)/.2*Math.PI)*.035;
    }},
    {duration:.35,enter(){cam.capture();},update(t){cam.move(a.topDown,a.landing,t,foot);magnifier.position.copy(a.landing);magnifier.quaternion.copy(flat);}},
    {duration:1.4,enter(){cam.capture();caption("A purple right hand reaches from under the table.");thief.group.visible=true;thief.group.scale.setScalar(1.8);thief.group.rotation.set(0,Math.PI/2,0);thief.group.position.copy(a.hiddenWrist);thief.setPose("grasp",0);thief.setGrasp(0);thief.group.updateMatrixWorld(true);
      origin=thief.group.position.clone();offset=magnifier.localToWorld(v(.214,0,0)).sub(thief.grip.getWorldPosition(v(0,0,0)));
    },update(t){cam.move(a.topDown,a.landing,t,foot);thief.group.position.copy(origin).addScaledVector(offset,smooth(t));thief.setPose("grasp",0);thief.setGrasp(smooth(t),t);}},
    {duration:1.55,enter(){cam.capture();putMagnifier(thief.grip);origin=thief.group.position.clone();caption("Its long clay forearm pulls your controller beneath the table.");},update(t){cam.move(a.topDown,a.landing,t,foot);moveHand(origin,a.withdrawnWrist,t);}},
    {duration:1.65,enter(){cam.capture();caption("You crouch. A little open cardboard box waits in the shadow.");},update(t){cam.move(a.crouch,a.box.clone().add(v(0,.17,.17)),t,foot.clone().lerp(lowFoot,smooth(t)));thief.group.visible=false;traveler.leftHand.position.set(-.27,1.08-.77*smooth(t),-.35);traveler.rightHand.position.set(.27,1.08-.77*smooth(t),-.35);}},
    {duration:1.1,enter(){cam.capture();caption("The controller is gone. The box is just beyond the compression field.");},update(t){cam.move(a.crouch,a.boxInterior,t,lowFoot);traveler.leftHand.position.set(-.27,.31,-.35);traveler.rightHand.position.set(.27,.31,-.35);}},
  ];
}
export function probeShots(c) {
  const {THREE,traveler,caption,defaultLeftRotation,contact}=c,a=openingAnchors(THREE),cam=shotCamera(c),v=(x,y,z)=>new THREE.Vector3(x,y,z);
  const foot=v(a.probeEye.x,0,a.probeEye.z),inspect=a.probeEye.clone().add(v(-.24,-.23,-.55));let origin;
  const hand=p=>{traveler.group.updateMatrixWorld(true);traveler.leftHand.position.copy(traveler.group.worldToLocal(p.clone()));traveler.leftHand.rotation.copy(defaultLeftRotation);};
  const view=(target,t=1)=>cam.move(a.probeEye,target,t,foot);
  return [
    {duration:1.2,enter(){cam.capture();caption("You rise to the purple compression field.");},update(t){view(a.probeBoundary,t);}},
  ];
}
export function commitShots(c) {
  const {THREE,camera,traveler,world,caption}=c,a=openingAnchors(THREE),cam=shotCamera(c),v=(x,y,z)=>new THREE.Vector3(x,y,z);
  const start=v(camera.position.x,0,camera.position.z),threshold=v(0,0,-24.98),small=.16,finalScale=.04;
  function grounded(foot,scale,look,t=1){
    traveler.group.scale.setScalar(scale);
    cam.move(foot.clone().add(v(0,1.55*scale,0)),look,t,foot);
    traveler.leftHand.scale.setScalar(Math.min(1,.23/scale));
    traveler.leftHand.position.set(-.30,1.08,-.40);traveler.rightHand.position.set(.30,1.08,-.40);
  }
  const rimLook=a.boxInterior.clone().add(v(0,.15,0));
  let interiorLook;
  return [
    {duration:2,enter(){cam.capture();caption("You cross the field. Your feet stay grounded as the museum grows.");},update(t){const foot=start.clone().lerp(threshold,smooth(t));grounded(foot,1-(1-small)*smooth(t),rimLook,t);}},
    {duration:1.2,enter(){cam.capture();caption("You follow the stolen controller beneath the table.");},update(t){grounded(threshold.clone().lerp(a.jumpFoot,smooth(t)),small,rimLook);}},
    {duration:.65,enter(){cam.capture();caption("You bend your felt feet, ready to jump into the box.");},update(t){const foot=a.jumpFoot.clone();traveler.group.scale.setScalar(small);cam.move(foot.clone().add(v(0,small*(1.55-.30*Math.sin(t*Math.PI)),0)),rimLook,1,foot);traveler.leftHand.position.set(-.30,1.08,-.40);traveler.rightHand.position.set(.30,1.08,-.40);}},
    {duration:1.15,enter(){cam.capture();caption("A jump over the cardboard rim. Into your first home.");},update(t){const foot=a.jumpFoot.clone().lerp(a.boxInterior,t);foot.y+=Math.sin(t*Math.PI)*.55;grounded(foot,small,rimLook);traveler.leftHand.position.y+=Math.sin(t*Math.PI)*.20;traveler.rightHand.position.y+=Math.sin(t*Math.PI)*.20;}},
    {duration:1.6,enter(){cam.capture();caption("You land inside the same box. A chipped jar waits ahead.");const goal=a.boxInterior.clone().add(v(0,1.55*finalScale,0));world.boxRoom.scale.setScalar(finalScale);world.boxRoom.position.copy(goal).sub(c.eyeAt("boxRoom",0).multiplyScalar(finalScale));world.boxRoom.visible=true;world.boxRoom.updateMatrixWorld(true);interiorLook=world.boxRoom.localToWorld(c.eyeAt("boxRoom",0).add(v(0,0,-2)));},update(t){const scale=small+(finalScale-small)*smooth(t);grounded(a.boxInterior,scale,interiorLook,t);}},
  ];
}
