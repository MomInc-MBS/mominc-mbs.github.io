// Ignore taps and ambiguous diagonals. A gesture commits once on the first clear swipe.
export function swipeAction(dx,dy,threshold=24){
  const x=Math.abs(dx),y=Math.abs(dy);
  if(Math.max(x,y)<threshold)return null;
  if(x>y*1.2)return dx<0?'left':'right';
  if(y>x*1.2)return dy<0?'jump':'slide';
  return null;
}
