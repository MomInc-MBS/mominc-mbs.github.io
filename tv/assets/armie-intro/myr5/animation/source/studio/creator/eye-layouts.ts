// Eye centers use the model's Y-up coordinates; yaw faces outward from the crown.
export const EYE_LAYOUTS = {
 "single":{"label":"One cyclops eye","eyes":[[0,2.1575,0.55,0.605,0]]},
 "horizontal":{"label":"Horizontal pair","eyes":[[-0.34,2.25,0.49,0.32,0],[0.34,2.25,0.49,0.32,0]]},
 "vertical":{"label":"Vertical pair","eyes":[[0,2.03,0.49,0.32,0],[0,2.73,0.39,0.31,0]]},
 "frontBack":{"label":"One front · one back","eyes":[[0,2.22,0.49,0.48,0],[0,2.22,-0.43,0.48,180]]},
 "triangle":{"label":"Triangle","eyes":[[-0.33,2.17,0.49,0.30,0],[0.33,2.17,0.49,0.30,0],[0,2.80,0.36,0.28,0]]},
 "around":{"label":"Evenly around the head","eyes":[[0,2.25,0.49,0.35,0],[0.59,2.25,-0.215,0.35,120],[-0.59,2.25,-0.215,0.35,240]]},
 "spider":{"label":"Spider · two big + two small","eyes":[[-0.34,2.16,0.49,0.32,0],[0.34,2.16,0.49,0.32,0],[-0.235,2.77,0.375,0.20,0],[0.235,2.77,0.375,0.20,0]]},
 "square":{"label":"Four small · square","eyes":[[-0.285,2.16,0.49,0.25,0],[0.285,2.16,0.49,0.25,0],[-0.285,2.73,0.375,0.25,0],[0.285,2.73,0.375,0.25,0]]}
} as const;
export type EyeLayout=keyof typeof EYE_LAYOUTS;
