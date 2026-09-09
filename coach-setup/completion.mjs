const read=key=>{try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}};
export function completedArmie(){
 const receipt=read('mbs-armie-hall-result');
 if(receipt?.game?.hallways===3)return receipt;
 // Repair the old cinematic ending: it saved unlocked at the final lab, but
 // skipped the obsolete intake form that used to write the handoff receipt.
 const run=read('mbs-armie-hall-v2');
 if(run?.version!==2||run.unlocked!==true||run.hall!==2)return null;
 const repaired={goals:run.goals,species:run.species,plan:run.plan||{},game:{version:2,hallways:3,mistakes:run.mistakes||0,experience:['Beginner','Intermediate','Advanced'][run.level],style:run.style,moves:run.moves||[]}};
 try{localStorage.setItem('mbs-armie-hall-result',JSON.stringify(repaired));}catch{}
 return repaired;
}
