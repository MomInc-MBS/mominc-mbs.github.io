import * as T from 'three';
import {regionFrame} from './creator/camera-focus';

// Eight seconds out, eight seconds back. The cosine eases to a stop at
// each end instead of snapping between the face and the wider coach view.
export function podCameraFrame(camera:T.PerspectiveCamera,head:T.Box3,body:T.Box3,seconds:number){
 const close=regionFrame(camera,head),wide=regionFrame(camera,body);
 if(!close||!wide)return null;
 const amount=(1-Math.cos(Math.PI*Math.max(0,seconds)/8))/2;
 return {target:close.target.lerp(wide.target,amount),position:close.position.lerp(wide.position,amount),maxDistance:Math.max(14,wide.distance*2)};
}
