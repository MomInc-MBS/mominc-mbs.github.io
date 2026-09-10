import {LENGTH} from './maze-run.mjs?v=chase-4';
export function chasePressure(state,run){
  if(state.mistakes>=3)return 1;
  const travelled=run?Math.min(1,run.distance/LENGTH):0;
  const boost=Math.max(0,Math.min(1,state.boost||0));
  return Math.max(.06,Math.min(.94,.24+state.mistakes*.27-boost*.16*(1-travelled)));
}
