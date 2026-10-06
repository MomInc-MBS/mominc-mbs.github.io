import * as T from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {builtinSurfaceProfile,sampleBuiltinSurface} from './material-patterns';
import {refineCoachGeometry,type CoachReliefBudget} from './material-refinement';
import {samplePaletteTint,applyPaletteFinish} from './palette-finishes';

// This material language is shared verbatim by Coach and Helping Hand. Maps are
// ordinary glTF-compatible PBR textures, so the appearance also survives export.
export const MATERIAL_REVISION='material-horror-robot-2026-10-05-r1';
export const MATERIAL_NOTES=[
 'Fine pores, palm folds and soft satin skin.',
 'Twisted roots, bark fissures and fresh leaf growth.',
 'Soft mushroom caps, radial gills and a branching mycelium web.',
 'Overlapping lacquered carapace plates with dark flexible seams.',
 'Raised overlapping scales, belly scutes and a serrated ridge.',
 'Deep ocean hide, swept fins and luminous sensory pearls.',
 'Porous reef limestone, branching antlers and hollow polyps.',
 'Weathered ivory, joint ends and hollow skeletal anatomy.',
 'Translucent mist glass with flowing veils and a pale inner glow.',
 'Charred hide, swept horns and ember-lit fractures.',
 'Pearlescent ceramic, engraved gold and orbiting halo segments.',
 'Obsidian shells with violet fracture edges and star-like inclusions.',
 'Folded flesh, coiled tendrils and luminous sensory nodules.',
 'Angular stone slabs, chipped strata and deep mineral seams.',
 'Faceted amethyst clusters with reflective faces and mineral inclusions.',
 'Black basalt crust over glowing orange lava fissures.',
 'Translucent blue ice, frost veins and sharp icicle clusters.',
 'Storm-dark armor with branching electric channels and conductor fins.',
 'Rigid brass armor, steel hinge joints, rivets and exposed toothed gears.',
 'Machined violet panels, recessed circuits and pink illuminated rails.',
 'Dense tapered fur tufts, a soft undercoat and contrasting guard hairs.',
 'Translucent gelatin, a wet clear coat and bubbles suspended inside.',
 'Plump soft forms, warm blush and delicate skin folds.'
] as const;
type Style={id:number;primary:string;secondary:string;accent:string;emissive:string;roughness:number;metalness:number;detail:string;paletteId?:string};
const clamp=T.MathUtils.clamp,fract=(x:number)=>x-Math.floor(x);
const hash=(x:number,y:number)=>fract(Math.sin(x*127.1+y*311.7)*43758.5453);
function cells(x:number,y:number){
 const ix=Math.floor(x),iy=Math.floor(y);let a=10,b=10;
 for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){
  const px=ix+i+.2+.6*hash(ix+i,iy+j),py=iy+j+.2+.6*hash(iy+j,ix+i+19);
  const d=Math.hypot(x-px,y-py);if(d<a){b=a;a=d;}else if(d<b)b=d;
 }
 return {pit:a,seam:b-a};
}
export function surfaceSample(id:number,x:number,y:number){
 const builtIn=sampleBuiltinSurface(id,x,y);if(builtIn)return builtIn;
 const c=cells(x*5,y*5),grain=hash(Math.floor(x*180),Math.floor(y*180));
 const wave=Math.sin(x*18+Math.sin(y*9)*2),vein=Math.pow(1-Math.abs(Math.sin(x*12+Math.sin(y*7)*2)),9);
 const seam=1-T.MathUtils.smoothstep(c.seam,.025,.12),spot=1-T.MathUtils.smoothstep(c.pit,.06,.19);
 const sx=fract(x*10+(Math.floor(y*12)%2)*.5)-.5,sy=fract(y*12)-.5;
 const scale=clamp(1-Math.pow(Math.abs(sx)*1.9,3)-Math.pow(Math.abs(sy)*1.9,4),0,1);
 let h=.5,t=.5,glow=0,rough=.7;
 switch(id){
  case 0:h=.42+grain*.12+wave*.015;t=.54+grain*.07;rough=.61+grain*.2;break;
  case 1:h=.4+wave*.19+vein*.25;t=.28+vein*.42+grain*.13;rough=.91;break;
  case 2:h=.6-spot*.3+Math.sin(Math.atan2(sy,sx)*24)*.04;t=.7-spot*.4;glow=spot*.16;rough=.87;break;
  case 3:h=scale*.75;t=.22+scale*.65;rough=.18+(.9-scale)*.4;break;
  case 4:h=scale*.6+grain*.12;t=.22+scale*.52+wave*.08;rough=.56+grain*.2;break;
  case 5:h=.55+wave*.12-spot*.23;t=.15+spot*.8;glow=spot;rough=.32;break;
  case 6:h=.75-spot*.65-grain*.12;t=.44+spot*.4+grain*.1;rough=.93;break;
  case 7:h=.55+Math.sin(y*35)*.09-grain*.12-seam*.06;t=.75-grain*.2-seam*.35;rough=.83;break;
  case 8:h=.5+wave*.035;t=.7+wave*.12;glow=vein*.35;rough=.12;break;
  case 9:h=.48+wave*.14+grain*.12;t=.15+grain*.13+vein*.3;glow=vein*.4;rough=.83;break;
  case 10:h=.55+vein*.08;t=.74+vein*.23;glow=vein*.22;rough=.18+grain*.07;break;
  case 11:h=.55-seam*.3;t=.03+seam*.48;glow=seam*.8;rough=.14;break;
  case 12:h=.5+wave*.19+spot*.18;t=.25+spot*.65;glow=spot*.4;rough=.39;break;
  case 13:h=.62-seam*.52+Math.floor(grain*4)*.035;t=.32+grain*.2-seam*.26;rough=.98;break;
  case 14:h=.45+Math.floor(c.pit*8)*.05;t=.32+c.pit*.45;rough=.09;break;
  case 15:{const lava=cells(x*2+Math.sin(y*5)*.3,y*2+Math.sin(x*4)*.3),crack=1-T.MathUtils.smoothstep(lava.seam,.015,.065);h=.72-crack*.65+grain*.1;t=.015+crack*.88;glow=crack;rough=.95-crack*.7;break;}
  case 16:h=.5+seam*.14;t=.72+seam*.22;rough=.13+seam*.48;break;
  case 17:{const bolt=Math.pow(1-Math.abs(Math.sin(x*7+Math.sin(y*22)*.25+Math.sin(y*9))),24);h=.54-bolt*.2;t=.13+bolt*.82;glow=bolt;rough=.38;break;}
  case 18:{const cut=Math.min(fract(x*5),fract(y*5));h=cut<.06?.12:.68+grain*.03;t=cut<.06?.05:.43+grain*.16;rough=.24+grain*.25;break;}
  case 19:{const a=fract(x*6),b=fract(y*6),switcher=hash(Math.floor(x*6),Math.floor(y*6));const rail=(Math.abs(a-.5)<.025&&b>.2&&switcher>.35)||(Math.abs(b-.5)<.025&&a<.6&&switcher<.65)?1:0;h=.5-rail*.2;t=.08+rail*.9;glow=rail;rough=.25;break;}
  case 20:h=.5+Math.sin(x*160+Math.sin(y*25))* .2;t=.58+grain*.2;rough=.98;break;
  case 21:h=.5+wave*.018;t=.7+wave*.07;rough=.07;break;
  case 22:h=.5+grain*.035+wave*.01;t=.67+wave*.02;rough=.51;break;
  // Rank 4 additions: Flat (no mask - literally constant) and Clay (soft procedural noise,
  // PLAN §6.1) so the runtime tint system has an always-unlocked, no-download starting pair.
  case 30:h=.5;t=.5;rough=.55;break;
  case 31:h=.5+grain*.05+wave*.008;t=.5+grain*.03;rough=.92;break;
 }
 return {height:h,tint:clamp(t,0,1),glow,rough};
}
const maps=new Map<string,{map:T.DataTexture;bump:T.DataTexture;rough:T.DataTexture;glow:T.DataTexture}>();
function materialMaps(style:Style){
 const key=[MATERIAL_REVISION,style.id,style.primary,style.secondary,style.accent,style.paletteId??''].join('|');if(maps.has(key))return maps.get(key)!;
 const size=192,buffers=Array.from({length:4},()=>new Uint8Array(size*size*4));
 const dark=new T.Color(style.secondary),base=new T.Color(style.primary),light=new T.Color(style.accent),color=new T.Color(),profile=builtinSurfaceProfile(style.id);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const s=surfaceSample(style.id,x/size,y/size),i=(y*size+x)*4;
  const tint=samplePaletteTint(style.paletteId,s.tint,x/size,y/size,style.id===30); // Palette stops follow the existing texture tones; watercolor/marbled add a spatial finish tint.
  color.copy(tint<.5?dark:base).lerp(tint<.5?base:light,tint<.5?tint*2:(tint-.5)*2);
  const roughnessMap=profile?clamp(.9+(s.rough-profile.roughness)*.75,0,1):s.rough;
  for(let k=0;k<3;k++){buffers[0][i+k]=Math.round([color.r,color.g,color.b][k]*255);buffers[1][i+k]=s.height*255;buffers[2][i+k]=roughnessMap*255;buffers[3][i+k]=s.glow*255;}
  for(const b of buffers)b[i+3]=255;
 }
 const textures=buffers.map(bytes=>{const tex=new T.DataTexture(bytes,size,size,T.RGBAFormat);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.magFilter=T.LinearFilter;tex.minFilter=T.LinearMipmapLinearFilter;tex.generateMipmaps=true;tex.needsUpdate=true;return tex;});
 const result={map:textures[0],bump:textures[1],rough:textures[2],glow:textures[3]};maps.set(key,result);return result;
}
/** Colour-only path for irises and other parts whose geometry must stay intact. */
export function applyPaletteSurface(material:T.MeshStandardMaterial,palette:{primary:string;secondary:string;accent:string;paletteId?:string;id?:number}){
 if(!palette.paletteId)return;
 material.map=materialMaps({...palette,id:palette.id??30,emissive:'#000000',roughness:.55,metalness:0,detail:'palette'}).map;
 material.color.set('white');material.needsUpdate=true;
 applyPaletteFinish(material as T.MeshPhysicalMaterial,palette.paletteId,palette);
}
export function materialFor(style:Style,unit:number,original?:T.MeshStandardMaterial){
 const tex=materialMaps(style),id=style.id;
 const profile=builtinSurfaceProfile(id);
 const mat=new T.MeshPhysicalMaterial({name:style.detail+' · '+MATERIAL_REVISION,color:'white',map:tex.map,bumpMap:tex.bump,bumpScale:unit*(profile?.bump??([8,21,22].includes(id)?.0005:.007)),roughnessMap:tex.rough,roughness:profile?.roughness??1,metalness:style.metalness,vertexColors:true,envMapIntensity:[18,19,14].includes(id)?1.3:1});
 if(original){mat.side=original.side;mat.polygonOffset=original.polygonOffset;mat.polygonOffsetFactor=original.polygonOffsetFactor;}
 if([3,4,10,11,14,18,19,21].includes(id)){mat.clearcoat=id===21?1:.6;mat.clearcoatRoughness=id===21?.055:.19;}
 if([8,14,16,21].includes(id)){
  mat.transmission=id===21?.8:id===8?.62:id===16?.54:.28;mat.thickness=unit*(id===21?.36:.16);mat.ior=id===21?1.36:id===16?1.31:1.46;
  mat.attenuationColor.set(style.primary);mat.attenuationDistance=unit*(id===21?1.4:2);mat.metalness=0;mat.roughnessMap=null;mat.roughness=id===21?.075:id===16?.16:.12;
 }
 if([5,8,9,10,11,12,15,17,19].includes(id)){mat.emissive.set(style.accent);mat.emissiveMap=tex.glow;mat.emissiveIntensity=id===15?2.1:id===17?1.5:.85;}
 if(id===20){mat.sheen=1;mat.sheenRoughness=.96;mat.sheenColor.set(style.accent);mat.metalness=0;}
 if(id===0||id===22){mat.sheen=.22;mat.sheenColor.set('#ffc9b1');}
 if(profile){mat.sheen=profile.sheen;mat.sheenRoughness=profile.sheenRoughness;mat.sheenColor.set(style.accent);mat.clearcoat=Math.max(mat.clearcoat,profile.clearcoat);mat.clearcoatRoughness=profile.clearcoatRoughness;}
 if(id>=57&&id<=62){
  mat.envMapIntensity=1.65;mat.iridescence=id===60?1:id===57?.85:.3;
  mat.iridescenceThicknessRange=id===60?[100,750]:[140,480];
  if([57,58,59,61].includes(id)){
   mat.transmission=id===58?.97:id===59?.84:.88;mat.thickness=unit*(id===59?.32:.48);
   mat.ior=id===59?1.8:id===58?1.46:1.38;mat.metalness=0;
   mat.attenuationColor.set(style.primary);mat.attenuationDistance=unit*3.5;
   mat.roughnessMap=null;mat.roughness=profile!.roughness;
   mat.dispersion=id===59?.75:.2;
  }
  if(id===62){mat.emissive.set(style.accent);mat.emissiveMap=tex.glow;mat.emissiveIntensity=.65;}
 }
 if(id===63||id===74){mat.transmission=id===63?.48:.82;mat.thickness=unit*.32;mat.ior=id===63?1.33:1.52;mat.metalness=0;mat.attenuationColor.set(style.primary);mat.attenuationDistance=unit*2.4;mat.roughnessMap=null;mat.roughness=profile!.roughness;}
 if([69,70,74].includes(id)){mat.emissive.set(style.accent);mat.emissiveMap=tex.glow;mat.emissiveIntensity=id===74?1.1:.75;}
 mat.flatShading=[13,14,59].includes(id);mat.userData.materialStyle=id;
 const optics={transmission:mat.transmission,thickness:mat.thickness,ior:mat.ior,roughness:mat.roughness,metalness:mat.metalness,iridescence:mat.iridescence,iridescenceThicknessRange:mat.iridescenceThicknessRange};
 applyPaletteFinish(mat,style.paletteId,style);
 // Color finishes coat a clear volume; they must not erase the chosen jelly/glass texture.
 if(style.paletteId&&optics.transmission>0){Object.assign(mat,optics);mat.clearcoat=1;mat.clearcoatRoughness=.035;}
 if(id===60){mat.metalness=.88;mat.iridescence=1;mat.iridescenceThicknessRange=[100,750];mat.roughness=.16;}
 if(id===61||id===62)applySparkle(mat,.85);
 return mat;
}

// Sparkle flakes stay attached to the UV surface and flash as the viewing angle changes.
export function applySparkle(mat:T.MeshPhysicalMaterial,sparkle:number){
 const amount=clamp(sparkle,0,1);if(amount<=0||mat.userData.myr5FinishGlitter)return;
 if(mat.userData.myr5Sparkle)return;mat.userData.myr5Sparkle=amount;
 const previous=mat.onBeforeCompile;(mat as T.MeshPhysicalMaterial & {defines?:Record<string,string>}).defines={...(mat as T.MeshPhysicalMaterial & {defines?:Record<string,string>}).defines,USE_UV:''};
 mat.onBeforeCompile=(shader,renderer)=>{
  previous?.call(mat,shader,renderer);
  shader.uniforms.uSparkle={value:amount};
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vMyr5SparkleUv;').replace('#include <uv_vertex>','#include <uv_vertex>\nvMyr5SparkleUv=uv;');
  shader.fragmentShader=shader.fragmentShader
   .replace('#include <common>','uniform float uSparkle;\nvarying vec2 vMyr5SparkleUv;\n#include <common>')
   .replace('#include <dithering_fragment>','float mySparkleGrain=fract(sin(dot(floor(vMyr5SparkleUv*83.0),vec2(12.9898,78.233)))*43758.5453);\nvec3 myFlakeNormal=normalize(normal+vec3(sin(mySparkleGrain*91.0),cos(mySparkleGrain*73.0),0.0)*.55);\nfloat myGlint=pow(max(dot(myFlakeNormal,normalize(vViewPosition)),0.0),42.0);\ngl_FragColor.rgb+=step(0.94,mySparkleGrain)*myGlint*uSparkle*2.2;\n#include <dithering_fragment>');
 };
 const priorKey=mat.customProgramCacheKey.bind(mat);mat.customProgramCacheKey=()=>priorKey()+'|myr5-sparkle-v3|'+amount.toFixed(3);
 mat.needsUpdate=true;
}

function meshWorldSpan(g:T.BufferGeometry,matrix:T.Matrix4){
 if(!g.boundingBox)g.computeBoundingBox();
 const size=g.boundingBox!.clone().applyMatrix4(matrix).getSize(new T.Vector3());
 return Math.max(size.x,size.y,size.z,1e-6);
}

export function authoredUvScale(g:T.BufferGeometry,matrix:T.Matrix4){
 const uv=g.attributes.uv,p=g.attributes.position,idx=g.index;if(!uv||uv.itemSize<2)return 1.8;
 let worldArea=0,uvArea=0;const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),ab=new T.Vector3(),ac=new T.Vector3();
 const count=idx?.count??p.count;
 for(let j=0;j+2<count;j+=3){const ia=idx?idx.getX(j):j,ib=idx?idx.getX(j+1):j+1,ic=idx?idx.getX(j+2):j+2;
  a.fromBufferAttribute(p,ia).applyMatrix4(matrix);b.fromBufferAttribute(p,ib).applyMatrix4(matrix);c.fromBufferAttribute(p,ic).applyMatrix4(matrix);
  ab.subVectors(b,a);ac.subVectors(c,a);worldArea+=ab.cross(ac).length()*.5;
  const ux=uv.getX(ib)-uv.getX(ia),uy=uv.getY(ib)-uv.getY(ia),vx=uv.getX(ic)-uv.getX(ia),vy=uv.getY(ic)-uv.getY(ia);uvArea+=Math.abs(ux*vy-uy*vx)*.5;
 }
 if(!Number.isFinite(worldArea)||!Number.isFinite(uvArea)||worldArea<=1e-10||uvArea<=1e-10)return 1.8;
 // Divide physical UV density by the mesh span. A ten-times larger imported
 // sculpt should show the same sized pattern, not 10x more tiles that mipmap away.
 const span=meshWorldSpan(g,matrix);
 return T.MathUtils.clamp(Math.sqrt(worldArea/uvArea)*1.8/Math.max(1,span/2),.5,6);
}

export function sculptMaterial(mesh:T.Mesh,style:Style,unit=1,amount=1,coachRelief?:CoachReliefBudget){
 if(Array.isArray(mesh.material)||!mesh.geometry.attributes.position)return;
 // The higher-density authored-UV path is deliberately limited to known static meshes.
 // Keep animated, morph-target, interleaved and unsupported Float16 geometry on the
 // established path until their attributes can be refined without changing semantics.
 if(coachRelief&&((mesh as T.SkinnedMesh).isSkinnedMesh||mesh.geometry.attributes.skinIndex||mesh.geometry.attributes.skinWeight||Object.values(mesh.geometry.morphAttributes).some(attributes=>attributes.length)||Object.values(mesh.geometry.attributes).some(attribute=>(attribute as T.InterleavedBufferAttribute).isInterleavedBufferAttribute||(attribute as T.BufferAttribute & {isFloat16BufferAttribute?:boolean}).isFloat16BufferAttribute||((globalThis as any).Float16Array&&attribute.array instanceof (globalThis as any).Float16Array))))coachRelief=undefined;
 const old=mesh.geometry;
 // Keep Original MYR5's established single-pass geometry, UVs and JS-double displacement path exact.
 if(!coachRelief){
  const g=old.clone();if(!g.attributes.normal)g.computeVertexNormals();
  const p=g.attributes.position,n=g.attributes.normal,uv=new Float32Array(p.count*2),colors=new Float32Array(p.count*3);
  mesh.updateWorldMatrix(true,false);const normalMatrix=new T.Matrix3().getNormalMatrix(mesh.matrixWorld),inv=mesh.matrixWorld.clone().invert(),point=new T.Vector3(),normal=new T.Vector3();
  const id=style.id,relief=unit*(builtinSurfaceProfile(id)?.relief??([0,8,20,21,22].includes(id)?.0018:id===13?.037:id===18?.018:.019));
  for(let i=0;i<p.count;i++){
   point.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);normal.fromBufferAttribute(n,i).applyMatrix3(normalMatrix).normalize();
   const x=point.x/unit,y=point.y/unit,z=point.z/unit;
   const u=(Math.abs(normal.z)>.45?x:z)*1.8+.5,v=y*1.8+.5,s=surfaceSample(id,u,v);uv[i*2]=u;uv[i*2+1]=v;
   let edge=1;for(const [sx,sy,sz,r]of mesh.userData.eyeSockets??[])edge*=T.MathUtils.smoothstep(Math.hypot(point.x-sx,point.y-sy,point.z-sz),r*1.04,r*1.35);
   point.addScaledVector(normal,(s.height-.5)*relief*amount*edge).applyMatrix4(inv);p.setXYZ(i,point.x,point.y,point.z);
   const shade=.91+.09*Math.sin(x*3+y*4+z*2);colors.set([shade,shade,shade],i*3);
  }
  g.setAttribute('uv',new T.BufferAttribute(uv,2));g.setAttribute('color',new T.BufferAttribute(colors,3));g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
  const oldMat=mesh.material as T.MeshStandardMaterial;mesh.material=materialFor(style,unit,oldMat);mesh.geometry=g;
  if(mesh.userData.ownedGeometry)old.dispose();mesh.userData.ownedGeometry=true;mesh.userData.ownedMaterial=true;return;
 }
 mesh.updateWorldMatrix(true,false);const worldScale=mesh.matrixWorld.getMaxScaleOnAxis(),refined=refineCoachGeometry(old,coachRelief,worldScale),g=refined?.geometry??old.clone();if(!g.attributes.normal)g.computeVertexNormals();
 // Keep imported smoothing while adding only the geometric normal change caused by relief.
 // This avoids faceting the source coach while making shallow height fields catch light.
 const authoredNormals=new Float32Array(g.attributes.normal.array as ArrayLike<number>);g.computeVertexNormals();const geometricBefore=new Float32Array(g.attributes.normal.array as ArrayLike<number>);g.attributes.normal.array.set(authoredNormals);g.attributes.normal.needsUpdate=true;
 const p=g.attributes.position,n=g.attributes.normal,uv=new Float32Array(p.count*2),colors=new Float32Array(p.count*3),worldPositions=new Float32Array(p.count*3),worldOffsets=new Float32Array(p.count*3);
 const sourceUv=coachRelief?g.attributes.uv:undefined,uvScale=sourceUv?authoredUvScale(g,mesh.matrixWorld):1,vertexKeys=coachRelief?new Array<string>(p.count):undefined;
 const coordinateUnit=Math.max(unit,meshWorldSpan(g,mesh.matrixWorld)/2);
 const normalMatrix=new T.Matrix3().getNormalMatrix(mesh.matrixWorld),inv=mesh.matrixWorld.clone().invert(),point=new T.Vector3(),normal=new T.Vector3();
 const id=style.id,relief=Math.min(unit*(builtinSurfaceProfile(id)?.relief??([0,8,20,21,22].includes(id)?.0018:id===13?.037:id===18?.018:.019)),meshWorldSpan(g,mesh.matrixWorld)*.015);
 const seamOffsets=coachRelief?new Map<string,{x:number;y:number;z:number;count:number}>():undefined,seamKey=(x:number,y:number,z:number)=>`${Math.round(x*1e5)},${Math.round(y*1e5)},${Math.round(z*1e5)}`;
 for(let i=0;i<p.count;i++){
  const localX=p.getX(i),localY=p.getY(i),localZ=p.getZ(i);point.set(localX,localY,localZ).applyMatrix4(mesh.matrixWorld);normal.fromBufferAttribute(n,i).applyMatrix3(normalMatrix).normalize();
  const x=point.x/coordinateUnit,y=point.y/coordinateUnit,z=point.z/coordinateUnit;
  // Roster UVs avoid normal-threshold seams; original MYR5 keeps its proven object projection.
  // Both coordinates are fixed on the mesh and remain periodic for the built-in surfaces.
  const u=sourceUv?sourceUv.getX(i)*uvScale:(Math.abs(normal.z)>.45?x:z)*1.8+.5,v=sourceUv?sourceUv.getY(i)*uvScale:y*1.8+.5,s=surfaceSample(id,u,v);
  uv[i*2]=u;uv[i*2+1]=v;worldPositions[i*3]=point.x;worldPositions[i*3+1]=point.y;worldPositions[i*3+2]=point.z;
  let edge=1;for(const [sx,sy,sz,r]of mesh.userData.eyeSockets??[])edge*=T.MathUtils.smoothstep(Math.hypot(point.x-sx,point.y-sy,point.z-sz),r*1.04,r*1.35);
  const offset=(s.height-.5)*relief*amount*edge,dx=normal.x*offset,dy=normal.y*offset,dz=normal.z*offset;worldOffsets[i*3]=dx;worldOffsets[i*3+1]=dy;worldOffsets[i*3+2]=dz;
  if(seamOffsets){const key=seamKey(localX,localY,localZ);vertexKeys![i]=key;const group=seamOffsets.get(key)??{x:0,y:0,z:0,count:0};group.x+=dx;group.y+=dy;group.z+=dz;group.count++;seamOffsets.set(key,group);}
  const shade=.91+.09*Math.sin(x*3+y*4+z*2);colors.set([shade,shade,shade],i*3);
 }
 for(let i=0;i<p.count;i++){
  const x=worldPositions[i*3],y=worldPositions[i*3+1],z=worldPositions[i*3+2];let dx=worldOffsets[i*3],dy=worldOffsets[i*3+1],dz=worldOffsets[i*3+2];
  if(seamOffsets){const group=seamOffsets.get(vertexKeys![i]);if(group&&group.count>1){dx=group.x/group.count;dy=group.y/group.count;dz=group.z/group.count;}}
  point.set(x+dx,y+dy,z+dz).applyMatrix4(inv);p.setXYZ(i,point.x,point.y,point.z);
 }
 g.computeVertexNormals();const geometricAfter=g.attributes.normal;
 for(let i=0;i<p.count;i++){const j=i*3,x=authoredNormals[j]+geometricAfter.array[j]-geometricBefore[j],y=authoredNormals[j+1]+geometricAfter.array[j+1]-geometricBefore[j+1],z=authoredNormals[j+2]+geometricAfter.array[j+2]-geometricBefore[j+2],length=Math.hypot(x,y,z)||1;geometricAfter.setXYZ(i,x/length,y/length,z/length);}
 g.setAttribute('uv',new T.BufferAttribute(uv,2));g.setAttribute('color',new T.BufferAttribute(colors,3));g.computeBoundingBox();g.computeBoundingSphere();
 const oldMat=mesh.material as T.MeshStandardMaterial;mesh.material=materialFor(style,unit,oldMat);mesh.geometry=g;
 if(mesh.userData.ownedGeometry)old.dispose();mesh.userData.ownedGeometry=true;mesh.userData.ownedMaterial=true;
}

type Triangle={a:T.Vector3;b:T.Vector3;c:T.Vector3;normal:T.Vector3;total:number};
function surfaceTriangles(group:T.Group){
 group.updateWorldMatrix(true,true);const inv=group.matrixWorld.clone().invert(),triangles:Triangle[]=[],bounds=new T.Box3();let total=0;
 group.traverseVisible(obj=>{if(!(obj instanceof T.Mesh)||obj.userData.materialDetail)return;const g=obj.geometry,p=g.attributes.position,ix=g.index;if(!p)return;
  const matrix=inv.clone().multiply(obj.matrixWorld),normalMatrix=new T.Matrix3().getNormalMatrix(matrix),authored=g.attributes.normal,count=ix?.count??p.count;
  // Surface sampling needs area coverage, not every triangle of the dense fur assets.
  const stride=Math.max(1,Math.ceil(count/24000))*3;
  for(let j=0;j+2<count;j+=stride){const ids=[0,1,2].map(k=>ix?ix.getX(j+k):j+k),[a,b,c]=ids.map(i=>new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(matrix));const cross=b.clone().sub(a).cross(c.clone().sub(a)),area=cross.length()*.5;if(area<1e-10)continue;const normal=authored?ids.reduce((sum,i)=>sum.add(new T.Vector3().fromBufferAttribute(authored,i).applyMatrix3(normalMatrix)),new T.Vector3()).normalize():cross.normalize();if(normal.lengthSq()<1e-8)normal.copy(cross).normalize();total+=area;bounds.expandByPoint(a);bounds.expandByPoint(b);bounds.expandByPoint(c);triangles.push({a,b,c,normal,total});}
 });return {triangles,total,bounds};
}
export function growMaterial(group:T.Group,style:Style,region:string,unit=1,amount=1,hand=false){
 const result=new T.Group();result.name='Material sculpture '+style.detail;result.userData.region=region;
 if(region==='eye'||region==='nails'||[0,7,22].includes(style.id))return result;
 const {triangles,total,bounds}=surfaceTriangles(group);if(!triangles.length)return result;
 let seed=style.id*9173+region.length*419;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const id=style.id;if(hand&&id===20)return result;
 const baseCount=id===20?2100:[3,4].includes(id)?110:id===21?32:42;
 const count=Math.round((id>=63?(id===66?60:id===68?22:id===72?12:38):id>=57&&id<=62?(id===61?180:id===58?55:36):baseCount)*(region==='head'||region==='palm'||region==='back_of_hand'?1:region==='body'?.8:.5));
 const batches:T.BufferGeometry[][]=[[],[],[]],normal=new T.Vector3(),point=new T.Vector3(),up=new T.Vector3(0,1,0);
 const span=bounds.getSize(new T.Vector3()),featureUnit=unit*T.MathUtils.clamp(Math.cbrt(Math.max(1e-6,span.x*span.y*span.z))/2.2,1,2.2);
 function add(g:T.BufferGeometry,pos:T.Vector3,q:T.Quaternion,scale:T.Vector3,material=0){g.applyMatrix4(new T.Matrix4().compose(pos,q,scale));if(!g.attributes.uv)g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));if(g.index){const expanded=g.toNonIndexed();g.dispose();g=expanded;}batches[material].push(g);}
 const color=[style.primary,style.accent,style.secondary];
 for(let k=0;k<count;k++){
  const pick=rand()*total;let lo=0,hi=triangles.length-1;while(lo<hi){const m=(lo+hi)>>1;if(triangles[m].total<pick)lo=m+1;else hi=m;}
  const {a,b,c}=triangles[lo],u=Math.sqrt(rand()),v=rand();point.copy(a).multiplyScalar(1-u).addScaledVector(b,u*(1-v)).addScaledVector(c,u*v);normal.copy(triangles[lo].normal);
  let socket=false;group.traverse(o=>{for(const [x,y,z,r]of o.userData.eyeSockets??[])if(point.distanceTo(new T.Vector3(x,y,z))<r*1.48)socket=true;});
  if(socket||(!hand&&region==='feet'&&normal.y<-.2))continue;
  const larger=[2,3,9,13,14,16].includes(id)?1.7:1;
  const q=new T.Quaternion().setFromUnitVectors(up,normal),s=featureUnit*amount*(.055+rand()*.075)*larger,center=point.clone(),size=new T.Vector3(s,s,s);
  const geometry=(g:T.BufferGeometry,offset=0,scale=size,mat=0)=>add(g,center.clone().addScaledVector(normal,offset+s*.12),q,scale,mat);
  switch(id){
   case 63:geometry(new T.SphereGeometry(.8,10,7),-s*.3,new T.Vector3(s,s*.6,s),k%3);break;
   case 64:geometry(new T.SphereGeometry(.7,10,7),-s*.12,new T.Vector3(s*.8,s*.65,s*.8),k%3);if(k%3===0)geometry(new T.TorusGeometry(.45,.13,5,10).rotateX(Math.PI/2),s*.05,size,0);break;
   case 65:geometry(new T.DodecahedronGeometry(.6,0),0,new T.Vector3(s,s*.45,s),k%3);geometry(new T.SphereGeometry(.22,6,4),s*.4,size,2);break;
   case 66:{const curve=new T.CatmullRomCurve3([new T.Vector3(-.7,0,0),new T.Vector3(-.25,.35,.25),new T.Vector3(.3,.2,-.15),new T.Vector3(.65,.55,.1)]);geometry(new T.TubeGeometry(curve,7,.15,5,false),s*.06,new T.Vector3(s,s,s),k%3);break;}
   case 67:{const curve=new T.CatmullRomCurve3([new T.Vector3(-.6,0,0),new T.Vector3(-.15,.3,.15),new T.Vector3(.5,.55,-.1)]);geometry(new T.TubeGeometry(curve,6,.12,5,false),s*.1,new T.Vector3(s*.75,s*1.4,s),k%3);break;}
   case 68:{geometry(new T.CylinderGeometry(.48,.38,.045,12),s*.12,size,1);geometry(new T.TorusGeometry(.53,.13,6,12).rotateX(Math.PI/2),s*.17,size,0);for(let t=0;t<6;t++){const a=t*Math.PI/3,offset=new T.Vector3(Math.cos(a)*s*.34,s*.32,Math.sin(a)*s*.34).applyQuaternion(q);add(new T.ConeGeometry(.08,.34,5),center.clone().add(offset),q,size,2);}break;}
   case 69:geometry(new T.BoxGeometry(.65,.13,.85),s*.04,size,0);geometry(new T.BoxGeometry(.08,.05,1.15),s*.14,size,2);geometry(new T.CylinderGeometry(.12,.12,.1,8),s*.18,size,2);break;
   case 70:geometry(new T.BoxGeometry(1.25,.18,.85),s*.1,size,0);geometry(new T.CylinderGeometry(.17,.17,.19,8),s*.27,size,1);geometry(new T.BoxGeometry(.9,.05,.12),s*.25,size,2);break;
   case 71:geometry(new T.CylinderGeometry(.15,.15,1.7,8).rotateZ(Math.PI/2),s*.13,size,0);geometry(new T.BoxGeometry(.2,.11,1.05),s*.12,size,1);break;
   case 72:geometry(new T.BoxGeometry(.8,.1,.5),s*.07,size,1);geometry(new T.CylinderGeometry(.1,.1,.12,6),s*.16,size,0);break;
   case 73:geometry(new T.BoxGeometry(1,.15,1),s*.1,size,0);geometry(new T.BoxGeometry(.08,.025,1.1).rotateY(Math.PI/4),s*.2,size,1);break;
   case 74:geometry(new T.SphereGeometry(.32,8,6),-s*.05,size,2);geometry(new T.TorusGeometry(.45,.07,5,12).rotateX(Math.PI/2),s*.07,size,0);break;
   case 57:geometry(new T.OctahedronGeometry(.55,1),-s*.3,new T.Vector3(s*.6,s*.2,s*.6),k%3);break;
   case 58:geometry(new T.SphereGeometry(.55,10,7),-s*.4,new T.Vector3(s*.45,s*.65,s*.45),k%3);break;
   case 59:case 62:geometry(new T.CylinderGeometry(0,.32,1.7,6),s*.42,size,k%3);break;
   case 61:geometry(new T.OctahedronGeometry(.22),-s*.2,new T.Vector3(s,s*.18,s),k%3);break;
   case 1:{ // Roots and leaves have separate silhouettes, not generic spikes.
    const path=new T.CatmullRomCurve3([new T.Vector3(0,-.1,0),new T.Vector3(.18,.5,0),new T.Vector3(-.15,1.3,.1),new T.Vector3(.35,2,.1)]);
    geometry(new T.TubeGeometry(path,8,.14,5,false),0,size,2);geometry(new T.SphereGeometry(1,8,5),s*1.1,new T.Vector3(s*.55,s*.9,s*.12),1);break;}
   case 2:geometry(new T.CylinderGeometry(.13,.19,1,6),s*.25,new T.Vector3(s,s,s),2);geometry(new T.SphereGeometry(1,12,8,0,Math.PI*2,0,Math.PI/2),s*.8,new T.Vector3(s*.8,s*.38,s*.8),k%3===0?1:0);geometry(new T.ConeGeometry(.73,.12,16),s*.77,size,2);break;
   case 3:geometry(new T.SphereGeometry(1,6,4),s*.08,new T.Vector3(s*.86,s*.26,s*1.3),0);geometry(new T.ConeGeometry(.19,.8,5),s*.34,size,1);break;
   case 4:geometry(new T.SphereGeometry(1,5,3),s*.015,new T.Vector3(s*.68,s*.17,s),k%6===0?1:0);break;
   case 5:geometry(new T.ConeGeometry(.18,2.5,4),s*.6,new T.Vector3(s,s,s*.5),2);geometry(new T.SphereGeometry(.22,8,5),s*1.7,size,1);break;
   case 6:{geometry(new T.CylinderGeometry(.19,.32,1.9,7),s*.55,size,0);for(const sign of [-1,1]){const branchQ=q.clone().multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),sign*.62));add(new T.CylinderGeometry(.12,.2,1.2,6),center.clone().addScaledVector(normal,s),branchQ,size,1);}geometry(new T.TorusGeometry(.2,.08,5,9),s*1.5,size,2);break;}
   case 8:geometry(new T.SphereGeometry(1,9,6),s*.3,new T.Vector3(s*.3,s*1.9,s*.13),1);break;
   case 9:{const curve=new T.CatmullRomCurve3([new T.Vector3(0,-.15,0),new T.Vector3(.1,.7,0),new T.Vector3(.6,1.5,0)]);const g=new T.TubeGeometry(curve,9,.24,7,false),p=g.attributes.position;for(let j=0;j<p.count;j++){const t=Math.floor(j/8)/9,at=curve.getPointAt(t),v=new T.Vector3().fromBufferAttribute(p,j).sub(at).multiplyScalar(1-t*.97).add(at);p.setXYZ(j,v.x,v.y,v.z);}g.computeVertexNormals();geometry(g,0,size,2);break;}
   case 10:geometry(new T.TorusGeometry(.65,.075,5,18,Math.PI*1.55),s*.3,size,1);geometry(new T.OctahedronGeometry(.35),s*.4,size,0);break;
   case 11:geometry(new T.OctahedronGeometry(1),s*.02,new T.Vector3(s*.7,s*.28,s*.85),2);geometry(new T.OctahedronGeometry(.11),s*.5,size,1);break;
   case 12:geometry(new T.TorusGeometry(.65,.18,7,13,Math.PI*1.8),s*.25,size,0);geometry(new T.SphereGeometry(.28,8,6),s*.4,size,1);break;
   case 13:geometry(new T.DodecahedronGeometry(1,0),s*.05,new T.Vector3(s*1.3,s*.38,s*.9),k%4===0?1:0);break;
   case 14:case 16:geometry(new T.CylinderGeometry(0,.36,2.3,id===14?6:5),s*.72,new T.Vector3(s,s,s),k%3===0?1:0);geometry(new T.CylinderGeometry(.28,.34,.65,6),s*.14,size,2);break;
   case 15:geometry(new T.DodecahedronGeometry(1,0),s*.025,new T.Vector3(s*1.25,s*.22,s),2);break;
   case 17:geometry(new T.BoxGeometry(.12,1.7,.9),s*.45,size,2);geometry(new T.CylinderGeometry(.08,.08,1.4,5),s*.4,size,1);break;
   case 18:{geometry(new T.CylinderGeometry(.76,.88,.18,8),s*.12,size,0);geometry(new T.TorusGeometry(.38,.1,5,14),s*.26,size,2);for(let r=0;r<6;r++){const angle=r*Math.PI/3,offset=new T.Vector3(Math.cos(angle)*s*.63,s*.29,Math.sin(angle)*s*.63).applyQuaternion(q);add(new T.CylinderGeometry(.08,.08,.12,6),center.clone().add(offset),q,size,1);}if(k%3===0)geometry(new T.CylinderGeometry(.46,.46,.23,12),s*.32,size,2);break;}
   case 19:geometry(new T.BoxGeometry(1.1,.19,1.65),s*.06,size,2);geometry(new T.BoxGeometry(.075,.035,1.35),s*.18,size,1);break;
   case 20:{const lean=.3+rand()*.6,curve=new T.CatmullRomCurve3([new T.Vector3(0,-.1,0),new T.Vector3(.15,.6,.1),new T.Vector3(lean,1.3,.25),new T.Vector3(lean*1.4,1.65,.3)]);const g=new T.TubeGeometry(curve,5,.035,3,false),p=g.attributes.position;for(let j=0;j<p.count;j++){const t=Math.floor(j/4)/5,at=curve.getPointAt(t),v=new T.Vector3().fromBufferAttribute(p,j).sub(at).multiplyScalar(1-t*.96).add(at);p.setXYZ(j,v.x,v.y,v.z);}g.computeVertexNormals();geometry(g,0,size,k%4===0?1:k%5===0?2:0);break;}
   case 21:geometry(new T.SphereGeometry(1,10,7),-s*.72,new T.Vector3(s*.3,s*.43,s*.3),k%4===0?1:2);break;
  }
 }
 batches.forEach((geos,index)=>{if(!geos.length)return;const g=mergeGeometries(geos,false);geos.forEach(g=>g.dispose());if(!g)return;
  const mat=new T.MeshPhysicalMaterial({color:color[index],roughness:[14,16,21].includes(id)?.12:id===20?.95:style.roughness,metalness:style.metalness,clearcoat:[3,18,19,21].includes(id)?.7:0});
  if(index===1&&[5,8,9,11,12,15,17,19].includes(id)){mat.emissive.set(style.accent);mat.emissiveIntensity=1.2;}
  if([8,14,16].includes(id)){mat.transmission=.45;mat.thickness=unit*.15;mat.ior=1.35;mat.metalness=0;}
  if(id>=57&&id<=62){mat.clearcoat=1;mat.clearcoatRoughness=.035;mat.roughness=.08;mat.iridescence=.9;mat.iridescenceThicknessRange=[100,650];
   if(id===58){mat.transmission=.75;mat.thickness=unit*.04;mat.metalness=0;mat.ior=1.1;}
   if(id===57||id===59){mat.transmission=.5;mat.thickness=unit*.08;mat.metalness=0;mat.ior=1.6;}
   if(id===61){mat.metalness=.9;applySparkle(mat,1);}
   if(id===62&&index===1){mat.emissive.set(style.accent);mat.emissiveIntensity=.5;}
  }
  if(id>=63&&id<=68){mat.metalness=0;mat.clearcoat=id===65?0:1;mat.clearcoatRoughness=.055;mat.roughness=id===65?.98:.16;
   if(id===63){mat.transmission=.55;mat.thickness=unit*.08;mat.ior=1.33;}
   if(id===64&&index===2){mat.transmission=.25;mat.thickness=unit*.06;}
  }
  if(id>=69&&id<=74){mat.metalness=id===74?0:style.metalness;mat.clearcoat=.8;mat.clearcoatRoughness=.06;
   if(index===2&&[69,70,74].includes(id)){mat.emissive.set(style.accent);mat.emissiveIntensity=1.3;}
   if(id===74&&index===0){mat.transmission=.75;mat.thickness=unit*.04;mat.roughness=.045;}
  }
  if(id===20){mat.sheen=1;mat.sheenColor.set(style.accent);}
  if(id===21){mat.color.set(index===1?style.accent:'#edffd3');mat.roughness=.12;mat.metalness=0;}
  if(id===18){mat.metalness=.87;mat.color.set(index===2?'#333d48':color[index]);}
  const mesh=new T.Mesh(g,mat);mesh.name=style.detail+' structural details';mesh.userData={materialDetail:true,ownedGeometry:true,ownedMaterial:true,region};result.add(mesh);
 });return result;
}
