export const DIRECTIONS = ['← Left', '↑ Straight', 'Right →'];
export const ROUTES = [
  {name:'The Gilded Passage',correct:0,clue:'← GET OUT / HULL BREACH',doors:[
    ['GET OUT','HULL BREACH','NO RETURN'],
    ['MOM LOVES YOU','COME HOME','SAFE IN HER ARMS'],
    ['YOU BELONG HERE','MOM IS WAITING','STAY FOREVER']
  ]},
  {name:'The Violet Junction',correct:1,clue:'↑ KEEP RUNNING / DO NOT STAY',doors:[
    ['REST WITH MOM','NO MORE PAIN','LET HER HOLD YOU'],
    ['KEEP RUNNING','DO NOT STAY','ESCAPE / DANGER'],
    ['MOM FORGIVES YOU','COME CLOSER','LOVE WITHOUT END']
  ]},
  {name:'The Last Airlock',correct:2,clue:'RUN / DO NOT LOOK BACK →',doors:[
    ['MOM KNOWS BEST','SURRENDER HERE','YOU ARE HER BABY'],
    ['FOREVER LOVED','NEVER LEAVE','MOM WILL KEEP YOU'],
    ['RUN','DO NOT LOOK BACK','AIRLOCK / GET OUT']
  ]}
];
export function routeFor(hall=0){return ROUTES[((hall%ROUTES.length)+ROUTES.length)%ROUTES.length];}
