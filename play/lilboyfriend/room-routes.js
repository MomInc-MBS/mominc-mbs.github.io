// One arc-length route source drives walking, entry staging and reverse recall.
export function createRouteSampler(THREE, metadata) {
  const curves = new Map();
  for (const [id, room] of Object.entries(metadata)) {
    if (!Array.isArray(room.path) || room.path.length < 2)
      throw new Error(`Missing route: ${id}`);
    const points = room.path.map((p) =>
      Array.isArray(p) ? new THREE.Vector3(...p) : p.clone(),
    );
    const curve = new THREE.CatmullRomCurve3(points, false, "centripetal");
    curve.arcLengthDivisions = 500;
    curve.updateArcLengths();
    curves.set(id, { curve, length: curve.getLength() });
  }
  function length(id) {
    return id === "gallery" ? 22.5 : curves.get(id)?.length || 0;
  }
  function limit(id) {
    return id === "atomicRoom" ? Math.max(0, length(id) - 1.15) : length(id);
  }
  function sample(id, distance) {
    if (id === "gallery")
      return {
        position: new THREE.Vector3(0, 0, 1 - distance),
        tangent: new THREE.Vector3(0, 0, -1),
        heading: 0,
      };
    const item = curves.get(id);
    if (!item) throw new Error(`Unknown room route: ${id}`);
    const u = THREE.MathUtils.clamp(distance / item.length, 0, 1),
      tangent = item.curve.getTangentAt(u).normalize();
    return {
      position: item.curve.getPointAt(u),
      tangent,
      heading: Math.atan2(-tangent.x, -tangent.z),
    };
  }
  return { length, limit, sample, ids: [...curves.keys()] };
}
