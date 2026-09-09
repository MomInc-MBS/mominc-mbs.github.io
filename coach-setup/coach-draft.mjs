import {COACH_APP,encodeHandoff,SITE_QUESTIONS,validRecipe} from './onboarding-domain.mjs';
export function coachDraft(storage,armie,timezone){
 const read=k=>{try{return JSON.parse(storage.getItem(k)||'null');}catch{return null;}};
 const state=read('mbs-state')||{},recipe=read('myr5-recipe-v1'),prior=read('mbs-final-coach-draft-v1')||{};
 if(!validRecipe(recipe))throw Error('Wait for your coach preview to finish loading, then try again.');
 if(armie?.game?.hallways!==3)throw Error('Finish your last hallway with Coach Armie first.');
 const appearance=Object.fromEntries(['myr5-recipe-v1','myr5-motion-v1','mominc-avatar-v1'].map(k=>[k,read(k)]).filter(([,v])=>v));
 const data={version:1,appearance,armieCompleted:true,customizationConfirmed:true,answers:{...prior.answers},profile:{...prior.profile},siteChoices:{submissions:state.submissions||{},armie,hand:read('mbs-hand-profile-v1')}};
 data.profile.coach=recipe.coach;
 data.profile.experience??={Beginner:'New to training',Intermediate:'Returning to training',Advanced:'Training regularly'}[armie.game.experience];
 data.profile.timezone??=timezone;
 const plan=armie.plan||{};
 data.profile.trainingStyle??={'CONTROLLED REPS':'Controlled reps','GRADUAL PROGRESSION':'Gradual progression','TECHNIQUE FIRST':'Technique first'}[plan.reps];
 data.profile.foodPreference??={'EVERYTHING':'Everything','VEGETARIAN':'Vegetarian','VEGAN':'Vegan','OTHER PREFERENCE':'Other preference'}[plan.diet];
 for(const group of SITE_QUESTIONS)data.answers[group.id]={...state.submissions?.[group.id]?.answers,...state.drafts?.[group.id]?.answers,...data.answers[group.id]};
 if(!data.answers.corgi?.q1&&plan.sleep){data.answers.corgi??={};data.answers.corgi.q1=plan.sleep+' hours';}
 return data;
}
export function installerURL(data){return COACH_APP+'/install.html#coach='+encodeHandoff(data);}
