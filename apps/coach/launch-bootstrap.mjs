export function showStartupFailure(document,error){
 const setup=document.getElementById('coachSetupGate');if(setup?.open)setup.close();
 let gate=document.getElementById('coachStartupRecovery');
 if(!gate){gate=document.createElement('dialog');gate.id='coachStartupRecovery';document.body.append(gate);}
 gate.setAttribute('aria-label','Reconnect');
 gate.style.cssText='position:fixed;inset:0;margin:0;width:100vw;height:100dvh;max-width:none;max-height:none;border:0;z-index:2147483646;background:#17111ef5;display:grid;place-content:center;padding:28px;color:#f5e4ba;font:18px/1.6 Arial;text-align:center';
 gate.replaceChildren();
 const heading=document.createElement('h1'),message=document.createElement('p'),retry=document.createElement('a');
 heading.textContent='Reconnect';message.textContent='Your saved data is safe. Reload the app to reconnect.';
 retry.textContent='Reload';retry.href='./?reconnect='+Date.now();retry.style.cssText='color:#b8e9cf;padding:14px;min-height:48px';
 gate.append(heading,message,retry);gate.hidden=false;if(!gate.open)gate.showModal();
 console.error('App startup failed',error);
}
export async function bootCoach({load,document,timeout=30000}){
 const timer=setTimeout(()=>showStartupFailure(document,new Error('Startup timed out.')),timeout);
 try{await load();const recovery=document.getElementById('coachStartupRecovery');if(recovery){recovery.close();recovery.hidden=true;}return true;}catch(error){showStartupFailure(document,error);return false;}finally{clearTimeout(timer);}
}
if(typeof document!=='undefined'){
 const runtime=new URL('./launch-runtime.mjs',import.meta.url);runtime.search=new URL(import.meta.url).search;
 void bootCoach({document,load:()=>import(/* @vite-ignore */ runtime.href)});
}
