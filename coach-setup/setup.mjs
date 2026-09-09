import {transferCoach} from './transfer.mjs';
import {COACH_APP,encodeHandoff,validRecipe,SITE_QUESTIONS,validateOnboarding} from './onboarding-domain.mjs';
import {mountProfileForm} from './onboarding-form.mjs';
const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'null');}catch{return null;}};
const status=document.getElementById('setupStatus'),host=document.getElementById('setupBody');
const armie=read('mbs-armie-hall-result'),state=read('mbs-state')||{},recipe=read('myr5-recipe-v1'),prior=read('mbs-final-coach-draft-v1')||{};
const appearance=Object.fromEntries(['myr5-recipe-v1','myr5-motion-v1','mominc-avatar-v1'].map(k=>[k,read(k)]).filter(([,v])=>v));
const data={version:1,...prior,appearance,armieCompleted:armie?.game?.hallways===3,customizationConfirmed:!!read('mbs-coach-customized-v1'),answers:{...prior.answers},siteChoices:{submissions:state.submissions||{},armie:armie||{},hand:read('mbs-hand-profile-v1')}};
data.profile={...prior.profile};if(recipe)data.profile.coach=recipe.coach;
data.profile.experience??={Beginner:'New to training',Intermediate:'Returning to training',Advanced:'Training regularly'}[armie?.game?.experience];
data.profile.timezone??=Intl.DateTimeFormat().resolvedOptions().timeZone;
const plan=armie?.plan||{};data.profile.trainingStyle??={'CONTROLLED REPS':'Controlled reps','GRADUAL PROGRESSION':'Gradual progression','TECHNIQUE FIRST':'Technique first'}[plan.reps];data.profile.foodPreference??={'EVERYTHING':'Everything','VEGETARIAN':'Vegetarian','VEGAN':'Vegan','OTHER PREFERENCE':'Other preference'}[plan.diet];
for(const group of SITE_QUESTIONS)data.answers[group.id]={...state.drafts?.[group.id]?.answers,...data.answers[group.id]};
if(!data.answers.corgi?.q1&&plan.sleep){data.answers.corgi??={};data.answers.corgi.q1=plan.sleep+' hours';}
if(!data.armieCompleted||!validRecipe(recipe)||!data.customizationConfirmed){status.textContent='Complete Coach Armie, then confirm your finished coach in the creature studio. Your saved answers will be waiting here.';const a=document.createElement('a');a.className='setup-action';a.textContent=data.armieCompleted?'Return to creature studio':'Continue Coach Armie';a.href=data.armieCompleted?'/tv/assets/armie-intro/creature-tv.html':'/tv/?ch=armie';a.target='_top';host.append(a);}
else {status.textContent='Your saved website answers are filled in below. Complete anything missing, then bring your coach into the app.';mountProfileForm(host,data,{changed:v=>{try{localStorage.setItem('mbs-final-coach-draft-v1',JSON.stringify(v));}catch{status.textContent='This browser cannot save drafts. Keep this page open until you finish.';}},save:async v=>{const complete=validateOnboarding(v);localStorage.setItem('mbs-final-coach-draft-v1',JSON.stringify(complete));await transferCoach(complete);status.textContent='Your choices reached Coach. Continue in the Coach tab to sign in and finish activation.';}});}
