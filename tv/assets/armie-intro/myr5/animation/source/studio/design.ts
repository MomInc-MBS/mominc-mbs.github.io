import {EYE_LAYOUTS,type EyeLayout} from './eye-layouts';
import {COACHES,type CoachId} from './coaching';
import {PUPILS,type PupilShape} from './pupils';
import {STYLES as HAND_STYLES} from './catalog';
export const REGIONS=['head','eye','collar','body','arms','feet'] as const;
export type Region=typeof REGIONS[number];
export const LABELS:Record<Region,string>={head:'Crown & scales',eye:'Eyes & pupils',collar:'Shaggy collar',body:'Body',arms:'Arms & hands',feet:'Legs & feet'};
export const STYLES=[{...HAND_STYLES[0],name:'Original MYR5',primary:'#7946aa',secondary:'#351344',accent:'#b373d4',roughness:.62},...HAND_STYLES.slice(1)];
export type Design={version:1;styles:Record<Region,number>;eye:'open'|'sleepy'|'wide';fur:number;iris:number;pupil:PupilShape;pupilSize:number;detail:number;coach:CoachId;fingers:number;toes:number;eyeLayout:EyeLayout};
export const fresh=():Design=>({version:1,styles:{head:0,eye:0,collar:0,body:0,arms:0,feet:0},eye:'open',fur:1,iris:1,pupil:'round',pupilSize:1,detail:1,coach:'supportive',fingers:4,toes:3,eyeLayout:'single'});
export function parseRecipe(raw:string):Design{const d=JSON.parse(raw);d.pupil??='round';d.pupilSize??=1;d.detail??=1;d.coach??='supportive';d.fingers??=4;d.toes??=3;d.eyeLayout??='single';if(!Number.isInteger(d.fingers)||d.fingers<2||d.fingers>6||!Number.isInteger(d.toes)||d.toes<1||d.toes>6||!Object.hasOwn(EYE_LAYOUTS,d.eyeLayout)||d.version!==1||!d.styles||!REGIONS.every(r=>Number.isInteger(d.styles[r])&&d.styles[r]>=0&&d.styles[r]<20)||!['open','sleepy','wide'].includes(d.eye)||!Number.isFinite(d.fur)||d.fur<.65||d.fur>1.4||!Number.isFinite(d.iris)||d.iris<.7||d.iris>1.25||!PUPILS.some(p=>p[0]===d.pupil)||!Number.isFinite(d.pupilSize)||d.pupilSize<.6||d.pupilSize>1.15||!Number.isFinite(d.detail)||d.detail<.5||d.detail>1.5||!COACHES.some(c=>c.id===d.coach))throw Error('Choose a valid MYR5 recipe.');return {version:1,styles:Object.fromEntries(REGIONS.map(r=>[r,d.styles[r]])) as Design['styles'],eye:d.eye,fur:d.fur,iris:d.iris,pupil:d.pupil,pupilSize:d.pupilSize,detail:d.detail,coach:d.coach,fingers:d.fingers,toes:d.toes,eyeLayout:d.eyeLayout};}


