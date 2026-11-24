// Explicit simulation phases, never camera tracking, own a full-screen lease.
let sequence=0;
export function gameShellPhase(source,root){
 const doc=root?.ownerDocument??globalThis.document;
 const instanceId=`${source}-${Date.now().toString(36)}-${++sequence}`;
 let last='',closed=false,announced=false;
 if(root?.dataset)root.dataset.gameInstance=instanceId;
 const emit=value=>{
  if(root?.dataset)root.dataset.gamePhase=value;
  const Event=doc?.defaultView?.CustomEvent??globalThis.CustomEvent;
  if(doc?.dispatchEvent&&Event)doc.dispatchEvent(new Event('myr5:game-phase',{detail:{source,instanceId,phase:value}}));
 };
 const phase=value=>{
  if(closed)return;
  // Several adapters construct their host before appending/opening its dialog.
  // Announce the lifecycle only once it can actually own visible content.
  if(root?.isConnected===false||root?.closest?.('dialog:not([open])')){if(value==='closed')closed=true;return;}
  if(!announced){announced=true;emit('loading');last='loading';}
  if(value===last)return;
  last=value;emit(value);
  if(value==='closed')closed=true;
 };
 const visibility=()=>{if(doc.hidden)phase('paused');};
 doc?.addEventListener?.('visibilitychange',visibility);
 phase('loading');
 return {phase,close(){phase('closed');doc?.removeEventListener?.('visibilitychange',visibility);if(root?.dataset?.gameInstance===instanceId){delete root.dataset.gameInstance;delete root.dataset.gamePhase;}}};
}
