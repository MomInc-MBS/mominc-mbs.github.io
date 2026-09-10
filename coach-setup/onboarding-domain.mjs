import {SITE_QUESTIONS} from './onboarding-questions.mjs';
export {SITE_QUESTIONS};
export const WEBSITE='https://mominc.online';
export const COACH_APP='https://myr5.mominc.online';
export const COACHES=['supportive','direct','analytical','playful','calm','mom'];
export const EXERCISES={squat:'Squats',pushup:'Push-ups',tree:'Tree pose',warrior:'Warrior II',horse:'Horse stance',boxing:'Air boxing',jogging:'Jogging in place',jumping:'Jumps'};
export const FIELDS=[
 {key:'name',label:'What should your coach call you?',max:60},
 {key:'goalWeightLbs',label:'Goal weight (lb)',type:'number',min:1,max:1500},
 {key:'goal',label:'Your main training goal',options:['Build a routine','Build strength','Improve mobility and balance','Improve stamina','Manage weight']},
 {key:'experience',label:'Current training experience',options:['New to training','Returning to training','Training regularly']},
 {key:'coach',label:'Coach personality',options:COACHES},
 {key:'trainingStyle',label:'How should your coach guide training?',options:['Controlled reps','Gradual progression','Technique first']},
 {key:'guidance',label:'How much should your coach talk?',options:['Quiet','Balanced','Detailed']},
 {key:'sessionMinutes',label:'Minutes available per session',type:'number',min:1,max:180},
 {key:'restSeconds',label:'Rest between sets',options:['30','45','60','90','120','180']},
 {key:'trainingTime',label:'Usual training time',type:'time'},
 {key:'timezone',label:'Time zone'},
 {key:'reminderTone',label:'Reminder wording',options:['gentle','direct','cheeky']},
 {key:'reminderDays',label:'Reminder days per week',options:['1','3','5','7']},
 {key:'foodPreference',label:'Food preference',options:['Everything','Vegetarian','Vegan','Other preference']},
 {key:'foodLimits',label:'Food allergies or restrictions (write “none” if there are none)',max:600},
];
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
const validText=(v,max=600)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
export function validRecipe(r){return object(r)&&r.version===1&&object(r.styles)&&['head','eye','collar','body','arms','feet'].every(k=>Number.isInteger(r.styles[k])&&r.styles[k]>=0&&r.styles[k]<23)&&COACHES.includes(r.coach)&&['open','sleepy','wide'].includes(r.eye)&&Number.isFinite(r.fur)&&r.fur>=.65&&r.fur<=1.4&&Number.isFinite(r.iris)&&r.iris>=.7&&r.iris<=1.25&&['round','vertical','horizontal','oval','diamond','star','heart','cross'].includes(r.pupil??'round')&&Number.isFinite(r.pupilSize??1)&&(r.pupilSize??1)>=.6&&(r.pupilSize??1)<=1.15&&Number.isFinite(r.detail??1)&&(r.detail??1)>=.5&&(r.detail??1)<=1.5&&Number.isInteger(r.fingers??4)&&(r.fingers??4)>=2&&(r.fingers??4)<=6&&Number.isInteger(r.toes??3)&&(r.toes??3)>=1&&(r.toes??3)<=6&&['single','horizontal','vertical','frontBack','triangle','around','spider','square'].includes(r.eyeLayout??'single');}
export function missingFields(v){
 const missing=[];if(!object(v))return ['Complete your coach setup'];const p=v.profile||{};
 for(const f of FIELDS){const a=p[f.key];if(f.type==='number'?typeof a!=='number'||!Number.isFinite(a)||a<f.min||a>f.max:f.options?!f.options.includes(String(a)):f.type==='time'?!/^([01]\d|2[0-3]):[0-5]\d$/.test(a||''):!validText(a,f.max||160))missing.push(f.label);}
 try{if(!p.timezone)throw Error();new Intl.DateTimeFormat('en',{timeZone:p.timezone}).format();}catch{if(!missing.includes('Time zone'))missing.push('Time zone');}
 if(!Array.isArray(p.exercises)||!p.exercises.length||p.exercises.some(k=>!Object.hasOwn(EXERCISES,k)))missing.push('Choose at least one movement');
 for(const group of SITE_QUESTIONS)for(let i=0;i<group.questions.length;i++)if(!validText(v.answers?.[group.id]?.['q'+(i+1)],2000))missing.push(group.questions[i]);
 if(!validRecipe(v.appearance?.['myr5-recipe-v1']))missing.push('Save your customized coach');
 if(v.customizationConfirmed!==true)missing.push('Confirm your coach appearance');
 if(v.armieCompleted!==true)missing.push('Finish Coach Armie');
 return missing;
}
export function validateOnboarding(v){
 const missing=missingFields(v);if(missing.length)throw Object.assign(Error('Complete your coach setup: '+missing[0]),{status:400,missing});
 const profile=Object.fromEntries(FIELDS.map(f=>[f.key,typeof v.profile[f.key]==='string'?v.profile[f.key].trim():v.profile[f.key]]));
 profile.exercises=[...new Set(v.profile.exercises)];
 const answers=Object.fromEntries(SITE_QUESTIONS.map(g=>[g.id,Object.fromEntries(g.questions.map((_,i)=>['q'+(i+1),v.answers[g.id]['q'+(i+1)].trim()]))]));
 const appearance={};for(const k of ['myr5-recipe-v1','myr5-motion-v1','mominc-avatar-v1'])if(v.appearance[k]!=null){if(!object(v.appearance[k])||JSON.stringify(v.appearance[k]).length>30000)throw Object.assign(Error('Choose a valid saved appearance.'),{status:400});appearance[k]=v.appearance[k];}
 appearance['myr5-recipe-v1'].coach=profile.coach;
 const context=object(v.siteChoices)?v.siteChoices:{};if(JSON.stringify(context).length>20000)throw Object.assign(Error('The website choices are too large.'),{status:400});
 return {version:1,profile,answers,appearance,siteChoices:context,armieCompleted:true,customizationConfirmed:true};
}
export function calendarDay(now,timezone){const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(now)).map(x=>[x.type,x.value]));return `${p.year}-${p.month}-${p.day}`;}
export function dailyTargets(profile,startDay,now=Date.now()){
 const today=calendarDay(now,profile.timezone),elapsed=Math.max(0,Math.round((Date.parse(today+'T00:00:00Z')-Date.parse(startDay+'T00:00:00Z'))/86400000));
 const reps=3+elapsed,holdSeconds=9+elapsed;
 return {day:elapsed+1,date:today,reps,holdSeconds,proteinGrams:profile.goalWeightLbs,waterOz:profile.goalWeightLbs,goals:Object.fromEntries(Object.keys(EXERCISES).map(k=>[k,['tree','warrior','horse','boxing'].includes(k)?holdSeconds:reps]))};
}
export function encodeHandoff(v){const bytes=new TextEncoder().encode(JSON.stringify(v));if(bytes.length>55000)throw Error('Your profile is too large to transfer. Shorten long answers and try again.');let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');}
export function decodeHandoff(raw){if(typeof raw!=='string'||raw.length>75000||!/^[A-Za-z0-9_-]+$/.test(raw))throw Error('This coach transfer could not be read. Return to the website and open Coach again.');return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(raw.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0))));}
