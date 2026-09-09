import {COACH_APP} from './onboarding-domain.mjs';
let receiver=null,cleanup=()=>{};
export function transferCoach(profile){
 if(new TextEncoder().encode(JSON.stringify(profile)).length>55000)throw Error('Shorten the longest answers before transferring this profile.');
 cleanup();receiver=window.open(COACH_APP+'/onboarding.html?receive=1','myr5-coach-activation');
 if(!receiver)throw Error('Allow this site to open Coach in a new tab, then tap Unlock again. Your answers are saved here.');
 return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{cleanup();reject(Error('Your answers are saved. Keep this page open and tap Unlock again after signing in to Coach.'));},180000);
  function message(event){if(event.origin!==COACH_APP||event.source!==receiver)return;if(event.data?.type==='myr5:ready-for-coach')receiver.postMessage({type:'myr5:coach-transfer',profile},COACH_APP);if(event.data?.type==='myr5:coach-received'){cleanup();resolve();}}
  cleanup=()=>{clearTimeout(timer);window.removeEventListener('message',message);};window.addEventListener('message',message);
 });
}
