// Flight points belong to this arcade run, independently of workout XP and unlocks.
export function createFlightScore(){
 let hits=0,score=0,multiplier=1;
 const read=()=>({hits,score,multiplier});
 return {read,hit(){hits++;score+=multiplier;multiplier++;return read();},miss(){multiplier=1;return read();},reset(){hits=0;score=0;multiplier=1;return read();}};
}
