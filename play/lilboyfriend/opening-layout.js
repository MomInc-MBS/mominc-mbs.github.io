export const OPENING = Object.freeze({
  table: [0,0,-26], tableTop: 1.05,
  pedestal: [-1.65,0,-23], pedestalTop: .95,
  field: [0,.55,-24.55], landing: [.40,.065,-24.88],
  hiddenWrist: [1.05,-.10,-25.55], withdrawnWrist: [1.12,-.10,-26.15], box: [0,.05,-26], boxSize: [1.25,.39,1.05],
  ladderFoot: [0,0,-25.30], ladderRim: [0,.44,-25.475], ladderHeight:.48, ladderWidth:.36,
  jumpFoot: [0,0,-25.12], boxInterior: [0,.08,-25.95], topDown: [.40,1.75,-24.15], crouch: [.65,.56,-24.65],
  probeEye:[0,1.55,-23.95], probeBoundary:[-.20,1.13,-24.55], probeInside:[-.20,1.13,-24.93],
});
export function openingAnchors(THREE) {
  const anchors = Object.fromEntries(Object.entries(OPENING).map(([key,value]) =>
    [key, Array.isArray(value) ? new THREE.Vector3(...value) : value]));
  anchors.rungAt = t => anchors.ladderFoot.clone().lerp(anchors.ladderRim, Math.max(0,Math.min(1,t)));
  return anchors;
}
