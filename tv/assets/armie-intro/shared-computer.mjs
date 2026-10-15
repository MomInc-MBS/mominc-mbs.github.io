// One cabinet for the Coach Armie intro and the orbitable, switched-off set.
export function createGoldMaterial(THREE, grit) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
  const g = canvas.getContext('2d'), shine = g.createLinearGradient(0, 0, 512, 0);
  [[0, '#8e6939'], [.08, '#e5c77d'], [.5, '#c9a45f'], [.92, '#dbb86c'], [1, '#94703e']].forEach(([at, color]) => shine.addColorStop(at, color));
  g.fillStyle = shine; g.fillRect(0, 0, 512, 512);
  g.lineWidth = 1;
  for (let x = -512; x < 1024; x += 4) {
    g.strokeStyle = x % 8 ? 'rgba(255,243,205,.12)' : 'rgba(87,55,23,.09)';
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x - 160, 512); g.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4;
  return new THREE.MeshStandardMaterial({map: texture, roughness: .62, metalness: .16, emissive: '#c7a058', emissiveIntensity: .16, bumpMap: grit, bumpScale: .014});
}

export function createComputer({THREE, scene, gold, black, faceHeight, mode}) {
  const width = 2.55, depth = .85, centerY = faceHeight > 1.434375 ? .98 + faceHeight / 2 : 1.68;
  const bottom = centerY - faceHeight / 2, top = centerY + faceHeight / 2, frontZ = depth / 2;
  const computer = new THREE.Group(); scene.add(computer);
  const box = (w, h, d, material, x, y, z) => { const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material); mesh.position.set(x, y, z); computer.add(mesh); return mesh; };
  const plane = (w, h, material, x, y, z) => { const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material); mesh.position.set(x, y, z); computer.add(mesh); return mesh; };
  // These are the original intro's table, case, stand, and keyboard dimensions.
  box(3, .15, 1.8, gold, 0, .64, 0);
  for (const x of [-1.3, 1.3]) box(.14, .6, .14, black, x, .3, 0);
  box(width, faceHeight, depth, gold, 0, centerY, 0);
  box(1.3, .12, .7, gold, 0, .92, .05);
  box(2.15, .11, .55, gold, 0, .8, .72);
  for (let row = 0; row < 4; row++) for (let k = 0; k < 13; k++) box(.12, .025, .085, black, -.87 + k * .145, .867, .53 + row * .105);

  const main = {x: 0, y: bottom + .4375 * faceHeight, width: width * .906, height: faceHeight * .42, z: frontZ + .016};
  const upper = {x: 0, y: bottom + .815 * faceHeight, width: width * .788, height: faceHeight * .225};
  box(main.width + .07, main.height + .07, .018, black, 0, main.y, frontZ + .005);
  const screenMat = mode === 'intro'
    ? new THREE.MeshBasicMaterial({color: '#ffffff', toneMapped: false})
    : new THREE.MeshStandardMaterial({color: '#0b0d12', roughness: .85, metalness: .05, emissive: '#6d63c8', emissiveIntensity: 0});
  const screen = plane(main.width, main.height, screenMat, main.x, main.y, frontZ + .016);
  box(upper.width + .12, upper.height + .12, .018, black, 0, upper.y, frontZ + .005);
  const glassGeometry = new THREE.PlaneGeometry(upper.width, upper.height, 16, 10);
  const positions = glassGeometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i) / (upper.width / 2), y = positions.getY(i) / (upper.height / 2);
    positions.setZ(i, .026 * (1 - x * x) * (1 - y * y));
  }
  glassGeometry.computeVertexNormals();
  const glass = new THREE.Mesh(glassGeometry, new THREE.MeshPhysicalMaterial({color: '#101217', roughness: .42, metalness: .03, clearcoat: .45, clearcoatRoughness: .38}));
  glass.position.set(0, upper.y, frontZ + .019); computer.add(glass);
  let upperScreen = null;
  if (mode === 'intro') {
    const c = document.createElement('canvas'); c.width = 512; c.height = 160;
    const g = c.getContext('2d'); g.fillStyle = '#0c1715'; g.fillRect(0, 0, 512, 160);
    g.fillStyle = '#a3e9bd'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 59px monospace'; g.fillText('MOM INC', 256, 80);
    const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace;
    upperScreen = plane(upper.width * .87, upper.height * .75, new THREE.MeshBasicMaterial({map: texture, toneMapped: false, transparent: true}), 0, upper.y, frontZ + .051);
  }

  const crop = (px, py, pw, ph, w, x, y, z, round = false) => {
    const texture = new THREE.TextureLoader().load(new URL('./website-bezel.png', import.meta.url).href);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.repeat.set(pw / 1280, ph / 720); texture.offset.set(px / 1280, 1 - (py + ph) / 720);
    const material = new THREE.MeshBasicMaterial({map: texture, toneMapped: false, transparent: true});
    if (!round) return plane(w, w * ph / pw, material, x, y, z);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(w / 2, 48), material); disc.position.set(x, y, z); computer.add(disc); return disc;
  };
  const chinY = bottom + .078 * faceHeight, dialPos = new THREE.Vector3(-width * .235, chinY, frontZ + .07);
  const dialDiameter = Math.max(width * 44 / innerWidth, Math.min(width * .365, faceHeight * .145, width * 160 / innerWidth));
  const powerWidth = Math.min(width * .27, width * 130 / innerWidth);
  const powerHeight = Math.max(faceHeight * 44 / innerHeight, Math.min(faceHeight * .09, faceHeight * 78 / innerHeight));
  const dial = crop(1112, 17, 122, 122, dialDiameter, dialPos.x, dialPos.y, dialPos.z, true);
  const power = new THREE.Vector3(width * .235, chinY, frontZ + .09);
  box(powerWidth, powerHeight, .05, black, power.x, power.y, frontZ + .025);
  box(powerWidth * .87, powerHeight * .8, .06, new THREE.MeshStandardMaterial({color: '#7a2fc4', roughness: .4, metalness: .2}), power.x, power.y, frontZ + .065);
  crop(1118, 510, 42, 24, powerWidth * .833, power.x, power.y, frontZ + .105);

  const badgeTexture = (text, vertical) => {
    const c = document.createElement('canvas'); c.width = vertical ? 256 : 512; c.height = vertical ? 1024 : 128;
    const g = c.getContext('2d'); g.fillStyle = '#d6b36c'; g.fillRect(0, 0, c.width, c.height);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (vertical) { g.translate(128, 512); g.rotate(Math.PI / 2); }
    g.font = `bold ${vertical ? 104 : 80}px Georgia, serif`;
    const cx = vertical ? 0 : 256, cy = vertical ? 0 : 64, max = vertical ? 940 : 476;
    g.fillStyle = '#f9e1a8'; g.fillText(text, cx + 2, cy + 2, max);
    g.fillStyle = '#65441d'; g.fillText(text, cx, cy, max);
    const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4; return texture;
  };
  const badge = (w, h, x, y, z, rotationY, text, vertical = false) => {
    const texture = badgeTexture(text, vertical);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({map: texture, emissive: '#ffffff', emissiveMap: texture, emissiveIntensity: .55, bumpMap: texture, bumpScale: .012, roughness: .62, metalness: .16, side: THREE.DoubleSide}));
    mesh.position.set(x, y, z); mesh.rotation.y = rotationY; computer.add(mesh);
  };
  const brandY = bottom + .2 * faceHeight;
  box(width * .85, faceHeight * .047, .035, gold, 0, brandY, frontZ + .02);
  badge(width * .82, faceHeight * .039, 0, brandY, frontZ + .045, 0, 'MOM INC');
  for (const side of [-1, 1]) {
    box(.025, faceHeight * .375, depth * .75, gold, side * (width / 2 + .015), bottom + faceHeight * .492, 0);
    badge(depth * .65, faceHeight * .344, side * (width / 2 + .03), bottom + faceHeight * .492, 0, side * Math.PI / 2, 'GLORY BE TO MOMMY', true);
  }
  box(.035, .12, .22, black, width / 2 + .01, 1.3, .24); // USB slot
  for (let i = 0; i < 9; i++) box(width * .7, .035, .03, black, 0, top - .35 - i * .07, -frontZ - .01);
  return {computer, screen, screenMat, upperScreen, dimensions: {width, height: faceHeight, centerY, frontZ, top, bottom}, screenBounds: main, controls: {dial, dialPos, power, dialDiameter, powerWidth, powerHeight}};
}
