/* MYR5 account-export bridge. Only completed workout days earn weapon XP. */
(()=>{'use strict';const KEY='mominc-gala-coach-progress-v1',DAY_XP=100;
function empty(){return {activeDays:0,totalXp:0,strength:1,completedSets:0,importedAt:null};}
function read(){try{const p=JSON.parse(localStorage.getItem(KEY));if(p?.version!==1||!Number.isSafeInteger(p.activeDays)||p.activeDays<0||p.activeDays>100000||!Number.isSafeInteger(p.completedSets)||p.completedSets<p.activeDays||p.completedSets>1000000)return empty();return {...empty(),activeDays:p.activeDays,totalXp:p.activeDays*DAY_XP,strength:1+Math.floor(p.completedSets/4),completedSets:p.completedSets,importedAt:p.importedAt};}catch{return empty();}}
function fromCoach(data,now=Date.now()){
 if(!data||!Array.isArray(data.workouts)||!Array.isArray(data.profiles)||!Array.isArray(data.meals)||!Array.isArray(data.reminders))throw Error('Choose myr5-data.json from Coach → Progress → Download my data.');
 if(data.workouts.length>100000)throw Error('This export is too large.');
 const ids=new Set(),days=new Set();let owner=null;
 for(const row of data.workouts){
  if(row.completed_at==null)continue;
  if(typeof row.id!=='string'||!/^[0-9a-f-]{36}$/i.test(row.id)||typeof row.user_id!=='string'||!row.user_id||!Number.isSafeInteger(row.completed_at)||!Number.isSafeInteger(row.started_at)||row.started_at<=0||row.completed_at<row.started_at||row.completed_at>now+300000||!Number.isFinite(row.value)||!Number.isFinite(row.goal)||row.goal<=0||row.value<row.goal)throw Error('This export contains an invalid completed workout. Download it again from Coach.');
  owner??=row.user_id;if(owner!==row.user_id)throw Error('Choose an export from one Coach account.');
  if(ids.has(row.id))continue;ids.add(row.id);
  // A UTC calendar day is stable across travel, devices and repeat imports.
  days.add(new Date(row.completed_at).toISOString().slice(0,10));
 }
 return {version:1,activeDays:days.size,completedSets:ids.size,importedAt:now};
}
function importCoach(data){const p=fromCoach(data);localStorage.setItem(KEY,JSON.stringify(p));window.dispatchEvent(new CustomEvent('mominc-coach-progress-change'));return read();}
window.GalaProgress={KEY,DAY_XP,read,fromCoach,importCoach};
})();
