import {validRecipe} from './onboarding-domain.mjs';
import {completedArmie} from './completion.mjs';
import {coachDraft,installerURL} from './coach-draft.mjs';
const button=document.getElementById('finishCoach'),status=document.getElementById('coachFinishStatus');
button.textContent='Use this coach →';
status.textContent='Choose the look you like, then tap Use this coach to open the app installer.';
button.onclick=()=>{
 try{
  const armie=completedArmie();
  if(!armie){status.textContent='Your last hallway is not complete yet. Return to Coach Armie to finish the run.';let link=document.getElementById('finishCoachHelp');if(!link){link=document.createElement('a');link.id='finishCoachHelp';link.href='/tv/?ch=armie';link.target='_top';link.textContent='Continue the last hallway →';button.after(link);}return;}
  const recipe=JSON.parse(localStorage.getItem('myr5-recipe-v1')||'null');
  if(!validRecipe(recipe))throw Error('The coach is still loading. Wait for the preview, choose your look, then tap Use this coach.');
  localStorage.setItem('mbs-coach-customized-v1',JSON.stringify({confirmedAt:Date.now()}));
  const data=coachDraft(localStorage,armie,Intl.DateTimeFormat().resolvedOptions().timeZone);
  localStorage.setItem('mbs-final-coach-draft-v1',JSON.stringify(data));
  button.disabled=true;button.textContent='Opening the app installer…';
  window.top.location.assign(installerURL(data));
 }catch(e){status.textContent=e.message;}
};
