// Original seamless material studies: baked canvas maps, no per-frame texture work.
export function createSurfaceLibrary(THREE, own = (value) => value) {
  const cache = new Map();
  return function surface(kind = "clay") {
    if (cache.has(kind)) return cache.get(kind);
    const size = 512;
    const colorCanvas = document.createElement("canvas");
    const heightCanvas = document.createElement("canvas");
    colorCanvas.width =
      colorCanvas.height =
      heightCanvas.width =
      heightCanvas.height =
        size;
    const color = colorCanvas.getContext("2d"),
      height = heightCanvas.getContext("2d");
    const pixels = color.createImageData?.(size, size),
      relief = height.createImageData?.(size, size);
    if (pixels?.data && relief?.data) {
      let seed = 7819;
      const random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
      };
      for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) {
          const u = (x / size) * Math.PI * 2,
            v = (y / size) * Math.PI * 2;
          const noise = random() - 0.5;
          let shade = 242 + noise * 13,
            depth = 128 + noise * 36;
          if (kind === "clay" || kind === "ceramic" || kind === "glass") {
            const knead =
              Math.sin(u * 3 + Math.sin(v * 2)) * Math.cos(v * 3) * 0.5;
            shade += knead * (kind === "clay" ? 10 : 4);
            depth += knead * 19;
          } else if (kind === "paper") {
            const fibers =
              Math.sin(u * 71 + Math.sin(v * 3)) * Math.sin(v * 53);
            shade = 239 + noise * 16 + fibers * 5;
            depth = 128 + noise * 30 + fibers * 18;
          } else if (kind === "wood") {
            const grain = Math.sin(
              u * 19 + Math.sin(v * 2) * 0.9 + Math.sin(u * 3) * 2,
            );
            const fine = Math.sin(u * 73 + Math.sin(v * 3) * 0.45);
            shade = 231 + grain * 15 + fine * 6 + noise * 8;
            depth = 128 + grain * 29 + fine * 12;
          } else if (kind === "cork") {
            const cellular = Math.sin(Math.floor(x / 5) * 127.1 + Math.floor(y / 5) * 311.7) * 43758.5453;
            const pores = (cellular - Math.floor(cellular) - 0.5) * 2;
            shade = 226 + pores * 13 + noise * 23;
            depth = 128 + pores * 29 + noise * 50;
          } else if (kind === "felt" || kind === "thread") {
            const weave =
              Math.sin(u * 64 + Math.sin(v * 8) * 0.8) * Math.cos(v * 64);
            const strand = Math.sin(u * 36 + v * 18);
            shade = 235 + noise * 22 + weave * 7;
            depth = 128 + weave * 35 + strand * 14 + noise * 35;
          } else if (kind === "metal") {
            const brush = Math.sin(v * 183) + Math.sin(v * 91) * 0.5;
            shade = 238 + brush * 7 + noise * 7;
            depth = 128 + brush * 13 + noise * 8;
          }
          const index = (y * size + x) * 4;
          for (let c = 0; c < 3; c++) {
            pixels.data[index + c] = Math.max(0, Math.min(255, shade));
            relief.data[index + c] = Math.max(0, Math.min(255, depth));
          }
          pixels.data[index + 3] = relief.data[index + 3] = 255;
        }
      color.putImageData(pixels, 0, 0);
      height.putImageData(relief, 0, 0);
      if (kind === "clay") {
        // Faint thumb-print rings, rather than a rocky or concrete surface.
        for (const [cx, cy] of [
          [130, 155],
          [378, 365],
        ])
          for (let r = 15; r < 58; r += 5) {
            color.strokeStyle = "rgba(90,70,80,.045)";
            color.lineWidth = 1;
            height.strokeStyle = "rgba(45,45,45,.11)";
            height.lineWidth = 1.3;
            for (const ctx of [color, height]) {
              ctx.beginPath();
              ctx.ellipse(cx, cy, r, r * 1.4, 0.45, 0, Math.PI * 2);
              ctx.stroke();
            }
          }
      }
    } else {
      color.fillStyle = "#eee";
      color.fillRect(0, 0, size, size);
      height.fillStyle = "#888";
      height.fillRect(0, 0, size, size);
    }
    function texture(canvas, data = false) {
      const t = own(new THREE.CanvasTexture(canvas));
      t.colorSpace = data ? THREE.NoColorSpace : THREE.SRGBColorSpace;
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = 4;
      return t;
    }
    const result = {
      map: texture(colorCanvas),
      bumpMap: texture(heightCanvas, true),
    };
    cache.set(kind, result);
    return result;
  };
}

// Give rounded boxes and long vessel walls consistent physical grain density.
export function scaleSurfaceUV(geometry, tile = 1.35) {
  const p = geometry.attributes.position,
    n = geometry.attributes.normal,
    uv = geometry.attributes.uv;
  if (!uv || !p || !n) return geometry;
  if (geometry.type === "BoxGeometry") {
    for (let i = 0; i < p.count; i++) {
      const x = Math.abs(n.getX(i)),
        y = Math.abs(n.getY(i)),
        z = Math.abs(n.getZ(i));
      if (x > y && x > z) uv.setXY(i, p.getZ(i) / tile, p.getY(i) / tile);
      else if (y > z) uv.setXY(i, p.getX(i) / tile, p.getZ(i) / tile);
      else uv.setXY(i, p.getX(i) / tile, p.getY(i) / tile);
    }
  } else if (geometry.type === "CylinderGeometry") {
    const a = geometry.parameters;
    for (let i = 0; i < uv.count; i++)
      if (Math.abs(n.getY(i)) < 0.8)
        uv.setXY(
          i,
          (uv.getX(i) * 2 * Math.PI * Math.max(a.radiusTop, a.radiusBottom)) /
            tile,
          (uv.getY(i) * a.height) / tile,
        );
  }
  if (geometry.type === "LatheGeometry") {
    const points=geometry.parameters.points;
    const radius=Math.max(...points.map(p=>p.x)),lo=Math.min(...points.map(p=>p.y)),hi=Math.max(...points.map(p=>p.y));
    for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*2*Math.PI*radius/tile,uv.getY(i)*(hi-lo)/tile);
  }
  if (geometry.type === "TubeGeometry") {
    const a = geometry.parameters, length = a.path.getLength();
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * length / tile, uv.getY(i) * 2 * Math.PI * a.radius / tile);
  }
  uv.needsUpdate = true;
  return geometry;
}

export function createStudioEnvironment(THREE, renderer) {
  const faces = Array.from({ length: 6 }, (_, i) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 0, 128);
    gradient.addColorStop(0, i === 2 ? "#fff4df" : "#d8c8df");
    gradient.addColorStop(0.48, "#a394ae");
    gradient.addColorStop(1, "#493650");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    if (i === 0 || i === 4) {
      ctx.fillStyle = "#fff3dd";
      ctx.fillRect(20, 12, 26, 76);
      ctx.fillStyle = "#ccb5e3";
      ctx.fillRect(84, 24, 14, 64);
    }
    return canvas;
  });
  const cube = new THREE.CubeTexture(faces);
  cube.colorSpace = THREE.SRGBColorSpace;
  cube.needsUpdate = true;
  const generator = new THREE.PMREMGenerator(renderer),
    target = generator.fromCubemap(cube);
  cube.dispose();
  generator.dispose();
  return target;
}
