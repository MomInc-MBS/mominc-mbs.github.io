import {authFetch} from '../../../auth-client.mjs';
import {isGranted,currentCosmeticCoach} from '../../../creature/source/creator/unlock-store';
import {STYLES} from './catalog';
const allowed=new Set(['https://mominc.online','https://www.mominc.online','https://myr5.mominc.online']);
let pending=false;
window.addEventListener('message',async event=>{
 if(event.source!==window.parent||!allowed.has(event.origin)||event.data?.type!=='handborne:unlock-request'||pending)return;
 pending=true;
 try{
  let account=null;try{const res=await authFetch('/api/account');if(res.ok)account=await res.json();}catch{}
  (globalThis as any).myr5AuthenticatedAccount=account;
  const coach=currentCosmeticCoach(),styles=STYLES.filter(s=>s.id>=63&&s.paletteId&&isGranted('texture',s.paletteId,coach)&&isGranted('palette',s.paletteId,coach)).map(s=>s.id);
  window.parent.postMessage({type:'handborne:unlock-state',styles},event.origin);
 }finally{pending=false;}
});
