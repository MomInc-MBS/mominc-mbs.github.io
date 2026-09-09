export const DIGITS = ['index','middle','ring','pinky','thumb']         ;
                                          
                                                        // MCP, PIP, DIP flexion; spread, degrees
                                                                                                                                                        
const relaxed           =[0,0,0,0],straight           =[-3,-8,-7,0],fold           =[72,88,42,0];
const thumbIn           =[0,6,8,-60];
function pose(id       ,name       ,description       ,fingers                                  ={},opposition=0,rotation                       =[0,0,0])      {
  return {id,name,description,fingers:{index:[...relaxed],middle:[...relaxed],ring:[...relaxed],pinky:[...relaxed],thumb:[...relaxed],...fingers},opposition,rotation};
}
const fist={index:fold,middle:fold,ring:fold,pinky:fold,thumb:thumbIn};
export const POSES       =[
  pose('relaxed','Relaxed','The original relaxed, open hand.'),
  pose('high-five','High Five','An open palm with all five fingers spread.',{index:[-3,-8,-7,8],middle:straight,ring:[-3,-8,-7,-7],pinky:[-3,-8,-7,-13],thumb:[-6,-6,-5,12]},0,[0,180,0]),
  pose('fist-bump','Fist Bump','Closed fingers, with the knuckles leading.',fist,10,[58,0,-12]),
  pose('peace','Peace / Victory','Index and middle fingers form a V.',{...fist,index:[-3,-8,-7,12],middle:[-3,-8,-7,-7]},10),
  pose('rock-on','Rock On','Index and pinky up, thumb over the folded fingers.',{...fist,index:[-3,-8,-7,6],pinky:[-3,-8,-7,-10]},10),
  pose('i-love-you','I Love You','Thumb, index and pinky extended.',{index:straight,middle:fold,ring:fold,pinky:straight,thumb:[-4,-5,-6,8]}),
  pose('web-shooter','Web Shooter','Middle and ring fingers press toward the palm.',{index:[-3,-8,-7,5],middle:[65,80,58,0],ring:[65,80,58,0],pinky:[-3,-8,-7,-8],thumb:[-8,-6,-7,15]},0,[-8,180,-18]),
  pose('vulcan','Vulcan Salute','Two paired fingers, separated down the middle.',{index:[-3,-8,-7,6],middle:[-3,-8,-7,12],ring:[-3,-8,-7,-11],pinky:[-3,-8,-7,-5],thumb:[-4,-4,-4,10]}),
  pose('thumbs-up','Thumbs Up','A closed fist with the thumb held up.',{...fist,thumb:[-5,-8,-7,0]},0,[0,0,-51]),
  pose('thumbs-down','Thumbs Down','A closed fist with the thumb pointing down.',{...fist,thumb:[-5,-8,-7,0]},0,[0,0,129]),
  pose('finger-gun','Finger Gun','Index forward, thumb raised, other fingers curled.',{...fist,index:straight,thumb:[-8,-7,-5,13]},0,[0,0,-70]),
  pose('point-up','Point Up','One index finger raised.',{...fist,index:straight},10),
  pose('point-at-you','Point at You','An index finger aimed through the glass.',{...fist,index:straight},10,[72,-12,0]),
  pose('ok','OK Sign','Thumb and index form a circle.',{index:[35,72,46,4],middle:[-2,-6,-4,-1],ring:[3,0,0,-5],pinky:[6,3,0,-12],thumb:[-14.5,26.4,36.8,-38]},10.9,[0,55,0]),
  pose('pinch','Pinch','Thumb and index meet in a small precision pinch.',{index:[40,62,40,2],middle:[45,52,28,0],ring:[53,60,30,0],pinky:[60,65,32,0],thumb:[-.7,10.1,31.6,-35.3]},14.9,[0,55,0]),
  pose('crossed-fingers','Fingers Crossed','Index and middle crossed for good luck.',{...fist,index:[-9,-3,-5,-11],middle:[8,0,-3,17]},10),
  pose('pinky-promise','Pinky Promise','A single pinky extended from a loose fist.',{...fist,pinky:[-3,-8,-7,-7]},10),
  pose('hang-loose','Hang Loose / Shaka','Thumb and pinky out; the middle three fingers curled.',{...fist,pinky:[-3,-8,-7,-10],thumb:[-7,-8,-6,12]},0,[0,0,-25]),
  pose('scout-salute','Three-finger Salute','Index, middle and ring raised together.',{...fist,index:[-3,-8,-7,-2],middle:straight,ring:[-3,-8,-7,2]},10),
  pose('force-grip','Force Grip','A natural, open grasp with all fingers curved.',{index:[26,32,17,9],middle:[32,35,19,2],ring:[38,39,21,-5],pinky:[43,42,24,-12],thumb:[8,13,10,5]},20,[-10,-20,8]),
];
export const DEFAULT_POSE='relaxed';
export function getPose(id       )      { const found=POSES.find(p=>p.id===id);if(!found)throw new Error('Unknown hand pose.');return found; }
export function validatePose(value        )        {if(typeof value!=='string')throw new Error('Choose a valid hand pose.');getPose(value);return value;}
export function mixPoses(a     ,b     ,t       )      {
  if(t>=1)return b;
  const lerp=(x       ,y       )=>x+(y-x)*t;
  return {...b,fingers:Object.fromEntries(DIGITS.map(d=>[d,a.fingers[d].map((v,i)=>lerp(v,b.fingers[d][i]))]))                            ,opposition:lerp(a.opposition,b.opposition),rotation:a.rotation.map((v,i)=>v+((b.rotation[i]-v+540)%360-180)*t)                    };
}
