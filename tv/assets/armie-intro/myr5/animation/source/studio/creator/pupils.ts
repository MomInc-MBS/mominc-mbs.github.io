import * as THREE from 'three';
export const PUPILS=[['round','Round'],['vertical','Vertical slit'],['horizontal','Horizontal slit'],['oval','Oval'],['diamond','Diamond'],['star','Star'],['heart','Heart'],['cross','Cross']] as const;
export type PupilShape=typeof PUPILS[number][0];
export function pupilGeometry(type:PupilShape){
 const s=new THREE.Shape();
 if(['round','vertical','horizontal','oval'].includes(type)){
  const rx=type==='vertical'?.07:type==='horizontal'?.30:.239;
  const ry=type==='horizontal'?.065:type==='vertical'?.31:type==='oval'?.31:.257;
  s.absellipse(0,0,rx,ry,0,Math.PI*2,false,0);
 }else if(type==='heart'){
  s.moveTo(0,-.28);s.bezierCurveTo(-.09,-.18,-.31,.00,-.27,.17);s.bezierCurveTo(-.24,.32,-.07,.32,0,.18);s.bezierCurveTo(.07,.32,.24,.32,.27,.17);s.bezierCurveTo(.31,0,.09,-.18,0,-.28);
 }else{
  let pts:number[][]=[];
  if(type==='diamond')pts=[[0,.31],[.21,0],[0,-.31],[-.21,0]];
  if(type==='star')pts=Array.from({length:10},(_,i)=>{const a=Math.PI/2+i*Math.PI/5,r=i%2?.135:.30;return [Math.cos(a)*r,Math.sin(a)*r];});
  if(type==='cross')pts=[[-.08,.28],[.08,.28],[.08,.08],[.28,.08],[.28,-.08],[.08,-.08],[.08,-.28],[-.08,-.28],[-.08,-.08],[-.28,-.08],[-.28,.08],[-.08,.08]];
  pts.forEach((p,i)=>i?s.lineTo(p[0],p[1]):s.moveTo(p[0],p[1]));s.closePath();
 }
 return new THREE.ShapeGeometry(s,40);
}
