import {completedArmie} from './completion.mjs';
import {coachDraft,installerURL} from './coach-draft.mjs';
const status=document.getElementById('setupStatus'),host=document.getElementById('setupBody');
try{
 const confirmed=JSON.parse(localStorage.getItem('mbs-coach-customized-v1')||'null');
 if(!confirmed)throw Error('Choose your finished coach in the creature studio first.');
 const data=coachDraft(localStorage,completedArmie(),Intl.DateTimeFormat().resolvedOptions().timeZone);
 localStorage.setItem('mbs-final-coach-draft-v1',JSON.stringify(data));
 document.querySelector('h1').textContent='Your coach is ready to go.';
 status.textContent='Opening the app installer with your saved coach…';
 const link=document.createElement('a');link.className='setup-action';link.textContent='Open the Coach installer →';link.href=installerURL(data);link.target='_top';host.append(link);
 window.top.location.replace(link.href);
}catch(error){status.textContent=error.message;const link=document.createElement('a');link.className='setup-action';link.textContent='Return to my creature studio';link.href='/tv/assets/armie-intro/creature-tv.html';link.target='_top';host.append(link);}
