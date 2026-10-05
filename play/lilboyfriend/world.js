import { createEnergySystem } from "./energy-fields.js?objects=12";
import { OPENING, openingAnchors } from "./opening-layout.js?objects=12";
import { buildInteriorsA } from "./rooms-a.js?objects=12";
import { buildInteriorsB } from "./rooms-b.js?objects=12";
import { furnishHomes } from "./home-details.js?objects=12";
import { createSurfaceLibrary, scaleSurfaceUV } from "./surfaces.js?objects=12";
import { objectSurfaces } from "./object-surfaces.js?objects=12";
import { rebuildObjectWorlds } from "./object-worlds.js?objects=12";
import { createMomPropaganda } from "./mom-propaganda.js?objects=12";

// Explicit flat faces, quarter-round edges and octant corners allocate detail
// only to the silhouette. Shared analytic normals keep all bevel joins seamless.
function sculptedBoxGeometry(THREE, w, h, d, radius = .1, variation = .008) {
  const size=[w,h,d],r=Math.min(radius,...size.map(v=>v*.499)),core=size.map(v=>v/2-r);
  const bevelSteps=Math.max(...size)>4||r<.045?3:4;
  const positions=[],normals=[],uvs=[];
  function skin(v,n) {
    const ripple=Math.min(variation,r*.1)*(.65*Math.sin(v[0]*2.7+v[1]*1.8)+.35*Math.sin(v[2]*3.2-v[0]));
    return {v:v.map((a,i)=>a+n[i]*ripple),n};
  }
  function triangle(a,b,c) {
    const u=b.v.map((v,i)=>v-a.v[i]),v=c.v.map((v,i)=>v-a.v[i]);
    const cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
    if(Math.hypot(...cross)<1e-10) return;
    if(cross.reduce((n,x,i)=>n+x*(a.n[i]+b.n[i]+c.n[i]),0)<0) [b,c]=[c,b];
    for(const point of [a,b,c]) {
      positions.push(...point.v);normals.push(...point.n);
      const n=point.n,axis=Math.abs(n[0])>Math.abs(n[1])?(Math.abs(n[0])>Math.abs(n[2])?0:2):(Math.abs(n[1])>Math.abs(n[2])?1:2);
      const other=[0,1,2].filter(i=>i!==axis);
      uvs.push(point.v[other[0]]/size[other[0]]+.5,point.v[other[1]]/size[other[1]]+.5);
    }
  }
  function patch(rows,cols,point) {
    const grid=Array.from({length:rows+1},(_,i)=>Array.from({length:cols+1},(_,j)=>point(i/rows,j/cols)));
    for(let i=0;i<rows;i++)for(let j=0;j<cols;j++) {
      triangle(grid[i][j],grid[i+1][j],grid[i][j+1]);
      triangle(grid[i+1][j],grid[i+1][j+1],grid[i][j+1]);
    }
  }
  for(let axis=0;axis<3;axis++)for(const sign of [-1,1]) {
    const other=[0,1,2].filter(i=>i!==axis);
    patch(1,1,(u,v)=>{const p=[0,0,0],n=[0,0,0];n[axis]=sign;
      p[axis]=sign*(core[axis]+r);p[other[0]]=(u*2-1)*core[other[0]];p[other[1]]=(v*2-1)*core[other[1]];return skin(p,n);});
  }
  for(let axis=0;axis<3;axis++)for(const sa of [-1,1])for(const sb of [-1,1]) {
    const [a,b]=[0,1,2].filter(i=>i!==axis);
    patch(1,bevelSteps,(u,v)=>{const theta=v*Math.PI/2,n=[0,0,0],p=[0,0,0];
      n[a]=sa*Math.cos(theta);n[b]=sb*Math.sin(theta);p[axis]=(u*2-1)*core[axis];
      p[a]=sa*core[a]+r*n[a];p[b]=sb*core[b]+r*n[b];return skin(p,n);});
  }
  for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1]) {
    const signs=[x,y,z];
    patch(bevelSteps,bevelSteps,(u,v)=>{const theta=u*Math.PI/2,phi=v*Math.PI/2;
      const n=[x*Math.sin(theta)*Math.cos(phi),y*Math.cos(theta),z*Math.sin(theta)*Math.sin(phi)];
      return skin(core.map((a,i)=>a*signs[i]+r*n[i]),n);});
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute("normal",new THREE.Float32BufferAttribute(normals,3));
  g.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));
  g.computeBoundingBox();g.computeBoundingSphere();return g;
}

/* Original clay museum geometry. No third-party geometry or texture code. */
export function createWorld(THREE) {
  const resources = new Set();
  const textures = new Set();
  const roomAnimations = [];
  const movingObjects = new Set();
  const palette = {
    cream: "#faf6ef",
    sand: "#d7c4a3",
    dark: "#59617a",
    purple: "#53627a",
    lilac: "#aab9c6",
    gold: "#e7bd61",
    peach: "#d5a8a2",
    mint: "#84ad9e",
  };
  let seed = 718;
  const rand = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const texture = (canvas) => {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    textures.add(t);
    return t;
  };
  const propaganda = createMomPropaganda(THREE, t => {textures.add(t);return t;});
  const surface = createSurfaceLibrary(THREE, (value) => {
    textures.add(value);
    return value;
  });
  const objectSurface = objectSurfaces(THREE, value => {textures.add(value);return value;});
  function material(color, opts = {}) {
    const {
      surface: kind = opts.transparent ? "glass" : "clay",
      ...properties
    } = opts;
    const authored = objectSurface(kind);
    const maps = authored || surface(kind);
    const physical = kind === "ceramic" || kind === "glass";
    const Constructor = physical
      ? THREE.MeshPhysicalMaterial
      : THREE.MeshStandardMaterial;
    const m = new Constructor({
      color,
      roughness: kind === "ceramic" ? 0.3 : kind === "metal" ? 0.4 : 0.83,
      metalness: kind === "metal" ? 0.65 : 0,
      map: kind === "glass" ? null : maps.map,
      bumpMap: maps.bumpMap,
      bumpScale:
        kind === "glass"
          ? 0.004
          : kind === "ceramic"
            ? 0.006
            : kind === "felt"
              ? 0.035
              : 0.024,
      ...(physical
        ? {
            clearcoat: kind === "ceramic" ? 0.5 : 0.2,
            clearcoatRoughness: 0.28,
          }
        : {}),
      ...properties,
    });
    m.userData.surface = kind;
    m.userData.authoredSurface = !!authored;
    resources.add(m);
    return m;
  }
  const mat = Object.fromEntries(
    Object.entries(palette).map(([k, c]) => [k, material(c)]),
  );
  const emissivePurple = material(palette.lilac, {
    emissive: "#6622a9",
    emissiveIntensity: 0.7,
    roughness: 0.55,
  });
  const emissiveGold = material(palette.gold, {
    emissive: "#ff9518",
    emissiveIntensity: 0.65,
  });
  const floorPalettes = new Map();
  const lampMaterials = new Map();
  const seamMaterials = new Map();
  function roundedGeometry(w, h, d, radius = 0.1, variation = 0.008) {
    const g = sculptedBoxGeometry(THREE, w, h, d, Math.min(radius, .025), 0);
    resources.add(g);
    return scaleSurfaceUV(g);
  }
  function box(parent, size, pos, m = mat.cream, radius = 0.1, rot = 0) {
    const mesh = new THREE.Mesh(roundedGeometry(...size, radius), m);
    mesh.position.set(...pos);
    mesh.rotation.y = rot;
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function ball(parent, pos, scale, m) {
    const extent=Math.max(...scale);
    const g = new THREE.SphereGeometry(1, extent<.075?16:extent<.3||extent>2?20:24,
      extent<.075?10:extent<.3?12:14);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        y = p.getY(i),
        z = p.getZ(i),
        s = 1 + 0.012 * Math.sin(x * 4 + y * 3) * Math.cos(z * 4);
      p.setXYZ(i, x * s, y * s, z * s);
    }
    g.computeVertexNormals();
    resources.add(g);
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(...pos);
    mesh.scale.set(...scale);
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function tube(parent, points, radius, m, closed = false) {
    const curve = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(...p)),
      closed,
    );
    const g = new THREE.TubeGeometry(
      curve,
      Math.max(closed ? 32 : 8, Math.min(48, Math.ceil(curve.getLength() * 4), points.length * 5)),
      radius,
      radius<.009 ? 8 : 12,
      closed,
    );
    scaleSurfaceUV(g);
    resources.add(g);
    const mesh = new THREE.Mesh(g, m);
    mesh.castShadow = !m.emissive || m.emissive.getHex() === 0;
    parent.add(mesh);
    return mesh;
  }
  function cylinder(parent, radius, height, pos, m, topRadius = radius) {
    const b = Math.min(height * .18, radius * .1, topRadius * .1, .07);
    const profile = [[0,-height/2],[radius-b,-height/2]];
    for (let i=1;i<=3;i++) {
      const a=i/3*Math.PI/2;
      profile.push([radius-b+b*Math.sin(a),-height/2+b-b*Math.cos(a)]);
    }
    profile.push([(radius+topRadius)/2,0],[topRadius,height/2-b]);
    for (let i=1;i<=3;i++) {
      const a=i/3*Math.PI/2;
      profile.push([topRadius-b+b*Math.cos(a),height/2-b+b*Math.sin(a)]);
    }
    profile.push([0,height/2]);
    const g = scaleSurfaceUV(new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),radius>3?64:36));
    resources.add(g);
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(...pos);
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function lathe(parent, profile, pos, m, segments = 48) {
    const g = scaleSurfaceUV(new THREE.LatheGeometry(profile.map(p => new THREE.Vector2(...p)), segments));
    resources.add(g);
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(...pos);
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function ceramicCup(parent, pos, m = mat.cream, scale = 1, logo = false) {
    const group = new THREE.Group();
    group.position.set(...pos);
    group.scale.setScalar(scale);
    parent.add(group);
    lathe(group, [[0,0],[.17,0],[.191,.008],[.204,.035],[.23,.38],
      [.231,.412],[.228,.425],[.218,.43],[.208,.423],[.206,.406],
      [.185,.067],[.173,.04],[0,.04]], [0,0,0], m);
    cylinder(group,.181,.009,[0,.355,0],mat.dark);
    tube(group, [[.217,.343,0],[.337,.353,0],[.393,.305,0],[.401,.215,0],
      [.363,.117,0],[.204,.11,0]], .035, m);
    // Glaze sits over a real wall, rolled lip and dark recessed drink surface.
    if (logo) {
      const canvas = document.createElement("canvas");
      canvas.width=512; canvas.height=256;
      const context=canvas.getContext("2d");
      context.fillStyle="#713692";
      context.textAlign="center"; context.textBaseline="middle";
      context.font='900 102px "Trebuchet MS", sans-serif';
      context.fillText("MOM",256,100);
      context.font='700 35px "Trebuchet MS", sans-serif';
      context.fillText("I N C",256,183);
      const printed = new THREE.MeshStandardMaterial({map:texture(canvas), transparent:true,
        roughness:.34, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2});
      resources.add(printed);
      const g = new THREE.CylinderGeometry(.2267,.2123,.19,24,5,true,-.64,1.28);
      resources.add(g);
      const decal = new THREE.Mesh(g,printed);
      decal.name="printed-MOM-INC-glaze";
      decal.position.y=.225; decal.renderOrder=1;
      group.add(decal);
    }
    return group;
  }
  function bowl(parent, pos, scale = 1, m = mat.cream) {
    const mesh = lathe(parent, [[0,0],[.13,0],[.16,.01],[.2,.038],[.247,.098],
      [.267,.145],[.265,.159],[.251,.166],[.24,.154],[.218,.1],[.177,.055],[.13,.03],[0,.03]],pos,m);
    mesh.scale.setScalar(scale);
    return mesh;
  }
  function cloth(parent, pos, width, depth, m, fall = 0.12, folds = 5) {
    const g = new THREE.PlaneGeometry(width,depth,24,18);
    g.rotateX(-Math.PI/2);
    const p=g.attributes.position;
    for(let i=0;i<p.count;i++) {
      const x=p.getX(i),z=p.getZ(i),t=z/depth+.5;
      p.setY(i,.017*Math.sin(x/width*folds*Math.PI*2+t*.8) - fall*Math.pow(Math.max(0,(t-.68)/.32),2));
      p.setX(i,x+.009*Math.sin(t*8+x*4));
    }
    g.computeVertexNormals(); scaleSurfaceUV(g); resources.add(g);
    const mesh=new THREE.Mesh(g,m); mesh.position.set(...pos);
    mesh.castShadow=mesh.receiveShadow=true; parent.add(mesh);
    return mesh;
  }
  function textCanvas(
    lines,
    {
      width = 1024,
      height = 512,
      bg = "#ead9bc",
      fg = "#452e4c",
      small = "",
      accent = "#7a2fc4",
      titleSize = 62,
    } = {},
  ) {
    const c = document.createElement("canvas");
    c.width = width;
    c.height = height;
    const ctx = c.getContext("2d");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(40, 35);
    ctx.lineTo(width - 38, 38);
    ctx.lineTo(width - 35, height - 35);
    ctx.lineTo(38, height - 40);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = fg;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${titleSize}px "Trebuchet MS", sans-serif`;
    const arr = Array.isArray(lines) ? lines : [lines];
    const spacing = titleSize * 1.18;
    const start =
      height / 2 - ((arr.length - 1) * spacing) / 2 - (small ? 22 : 0);
    arr.forEach((s, i) =>
      ctx.fillText(s, width / 2, start + i * spacing, width - 95),
    );
    if (small) {
      ctx.font = '24px "Trebuchet MS", sans-serif';
      ctx.fillText(small, width / 2, height - 69, width - 100);
    }
    return texture(c);
  }
  function plaque(parent, lines, pos, w = 2, h = 0.65, opts = {}) {
    const group = new THREE.Group();
    group.position.set(...pos);
    if (opts.rotation) group.rotation.y = opts.rotation;
    box(
      group,
      [w + 0.09, h + 0.09, 0.12],
      [0, 0, 0],
      opts.back || mat.purple,
      0.08,
    );
    const copy=(Array.isArray(lines)?lines:[lines]).join(' ');
    const isCampaign=/MOM FICTIONAL AD|ONE ROOM\.|YOUR NEXT HOME|THE STARTER BOX|PRIVACY, REDUCED|A CLEARER FUTURE|WHY KEEP SPACE|PRODUCTIVE RESIDENTS|THE PRODUCTIVE HOME|YOUR ADDRESS|RESIDENTIAL COMPRESSION UNIT/i.test(copy)||/FICTIONAL AD/i.test(opts.small||'');
    const t = isCampaign ? propaganda(lines,w/h) : textCanvas(lines, opts);
    if(isCampaign){group.name='illustrated-MOM-campaign';group.userData.campaign=copy;}
    const m = new THREE.MeshBasicMaterial({ map: t });
    resources.add(m);
    const g = new THREE.PlaneGeometry(w, h);
    resources.add(g);
    const face = new THREE.Mesh(g, m);
    face.position.z = 0.083;
    group.add(face);
    parent.add(group);
    return group;
  }
  function lamp(parent, pos, color = "#ffc58b", strength = 0.7) {
    const group = new THREE.Group();
    group.position.set(...pos);
    box(group, [0.64, 0.12, 0.5], [0, 0, 0], mat.dark, 0.055);
    if (!lampMaterials.has(color))
      lampMaterials.set(
        color,
        material(color, { emissive: color, emissiveIntensity: 0.55 }),
      );
    ball(group, [0, -0.075, 0], [0.22, 0.12, 0.19], lampMaterials.get(color));
    if (strength > 0) {
      const light = new THREE.PointLight(color, strength, 6, 1.5);
      light.position.y = -0.15;
      group.add(light);
    }
    parent.add(group);
    return group;
  }
  function floor(parent, width, length, color = mat.sand) {
    box(parent, [width, 0.25, length], [0, -0.16, 2 - length / 2], color, 0.08);
    if (!floorPalettes.has(color)) {
      floorPalettes.set(
        color,
        Array.from({ length: 7 }, (_, i) => {
          const shade = new THREE.Color(color.color);
          shade.offsetHSL((i - 3) * 0.0007, 0, (i - 3) * 0.008);
          return material(shade);
        }),
      );
    }
    const colors = floorPalettes.get(color);
    // Broad hand-rolled slabs have uneven seams and slightly mismatched warm hues.
    const countX=Math.ceil(width/2.2),countZ=Math.ceil(length/2.3),
      stepX=width/countX,stepZ=length/countZ;
    for (let iz=0;iz<countZ;iz++)
      for (let ix=0;ix<countX;ix++) {
        const x=-width/2+(ix+.5)*stepX,z=2-(iz+.5)*stepZ;
        const slabMaterial = colors[Math.floor(rand() * colors.length)];
        box(
          parent,
          [stepX - 0.025, 0.045, stepZ - 0.035],
          [x, -0.014 + rand() * 0.005, z],
          slabMaterial,
          0.035,
          (rand() - 0.5) * 0.012,
        );
      }
  }
  function rug(parent, pos, width, length, color = mat.purple) {
    box(parent, [width, 0.04, length], pos, color, 0.035);
    for (let x = -width / 2 + 0.12; x < width / 2; x += 0.18) {
      box(
        parent,
        [0.06, 0.035, 0.23],
        [pos[0] + x, pos[1], pos[2] + length / 2 + 0.04],
        mat.lilac,
        0.028,
      );
      box(
        parent,
        [0.06, 0.035, 0.23],
        [pos[0] + x, pos[1], pos[2] - length / 2 - 0.04],
        mat.lilac,
        0.028,
      );
    }
  }
  function bench(parent, pos, rot = 0) {
    const group = new THREE.Group();
    group.position.set(...pos);
    group.rotation.y = rot;
    box(group, [2.2, 0.2, 0.65], [0, 0.5, 0], mat.peach, 0.13);
    box(group, [2.17, 0.55, 0.18], [0, 0.91, -0.25], mat.peach, 0.1);
    for(const x of [-.69,0,.69]) {
      pillow(group,[x,.642,.015],.93,mat.peach);
      tube(group,[[x-.28,.76,-.14],[x-.28,1.12,-.15]],.007,mat.sand);
    }
    [-0.83, 0.83].forEach((x) =>
      box(group, [0.18, 0.46, 0.43], [x, 0.22, 0], mat.dark, 0.055),
    );
    parent.add(group);
    return group;
  }
  function plant(parent, pos, scale = 1) {
    const g = new THREE.Group();
    g.position.set(...pos);
    g.scale.setScalar(scale);
    lathe(g,[[0,0],[.19,0],[.22,.025],[.3,.35],[.325,.36],[.33,.405],
      [.317,.423],[.29,.42],[.276,.39],[.213,.065],[0,.065]],[0,0,0],mat.peach);
    cylinder(g, 0.264, 0.02, [0, 0.371, 0], mat.dark);
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const y = 0.5 + (i % 3) * 0.09;
      tube(
        g,
        [
          [0, 0.4, 0],
          [Math.cos(a) * 0.08, 0.75, Math.sin(a) * 0.08],
          [Math.cos(a) * 0.32, 0.92, Math.sin(a) * 0.32],
        ],
        0.026,
        mat.mint,
      );
      const vertices=[],indices=[];
      for(let j=0;j<=20;j++) for(let k=0;k<=12;k++) {
        const t=j/20,angle=k/12*Math.PI*2, swell=Math.sin(t*Math.PI);
        vertices.push(.13*Math.pow(swell,.8)*Math.sin(angle),t*.58-.29,
          .047*swell+.019*swell*Math.cos(angle));
        if(j<20&&k<12){const n=j*13+k;indices.push(n,n+1,n+13,n+1,n+14,n+13);}
      }
      const geometry=new THREE.BufferGeometry();
      geometry.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));
      geometry.setAttribute("uv",new THREE.Float32BufferAttribute(vertices.flatMap((_,index)=>index%3===0?[index/3%13/12,Math.floor(index/3/13)/20]:[]),2));
      geometry.setIndex(indices);geometry.computeVertexNormals();resources.add(geometry);
      const leaf = new THREE.Mesh(geometry,mat.mint);
      leaf.position.set(Math.cos(a)*.32,y+.35,Math.sin(a)*.32);
      leaf.castShadow=true;g.add(leaf);
      leaf.rotation.z = -Math.cos(a) * 0.8;
      leaf.rotation.y = -a;
    }
    parent.add(g);
    return g;
  }
  function bookStack(parent, pos, n = 4) {
    for (let i = 0; i < n; i++) {
      const g = new THREE.Group();
      g.position.set(pos[0], pos[1] + i * 0.11, pos[2]);
      g.rotation.y = i % 2 ? 0.12 : -0.09;
      box(
        g,
        [0.5, 0.095, 0.35],
        [0, 0, 0],
        i % 2 ? mat.lilac : mat.peach,
        0.025,
      );
      box(g, [0.44, 0.055, 0.32], [0.012, 0.007, 0.015], mat.cream, 0.017);
      box(g,[.036,.092,.35],[-.236,0,0],i%2?mat.lilac:mat.peach,.012);
      for(const y of [-.017,0,.017]) tube(g,[[.246,y,-.13],[.249,y,0],[.246,y,.155]],.0018,mat.sand);
      parent.add(g);
    }
  }
  function pillow(parent, pos, scale = 1, m = mat.gold) {
    const group=new THREE.Group(); group.position.set(...pos);
    group.rotation.y=.16; group.scale.setScalar(scale); parent.add(group);
    const g=new THREE.SphereGeometry(1,24,16),p=g.attributes.position;
    const shape=(v,power)=>Math.sign(v)*Math.pow(Math.abs(v),power);
    for(let i=0;i<p.count;i++) {
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
      p.setXYZ(i,shape(x,.5)*.325,shape(y,.7)*.104*(1-.07*Math.sin(x*4+z*3)),shape(z,.5)*.24);
    }
    g.computeVertexNormals();resources.add(g);
    const cushion=new THREE.Mesh(g,m); cushion.castShadow=cushion.receiveShadow=true;group.add(cushion);
    if(!seamMaterials.has(m)) seamMaterials.set(m,material(m.color.clone().multiplyScalar(.77),{surface:"thread"}));
    const piping=seamMaterials.get(m);
    const points=Array.from({length:49},(_,i)=>{const a=i/48*Math.PI*2;
      return [shape(Math.cos(a),.5)*.319,-.006,shape(Math.sin(a),.5)*.234];});
    tube(group,points,.0055,piping,true);
    // Three shallow gathers at the sewn corners break the inflated-box look.
    for(const side of [-1,1]) for(const z of [-1,1])
      tube(group,[[side*.28,.014,z*.205],[side*.252,.029,z*.179],[side*.22,.04,z*.16]],.0035,piping);
    return group;
  }
  const gallery = new THREE.Group();
  gallery.name = "clay-gallery";
  const windowGlass = new THREE.MeshBasicMaterial({color: "#b8d5e4"});
  resources.add(windowGlass);
  floor(gallery, 10, 32);
  box(gallery, [10.4, 0.22, 32.3], [0, 4.55, -14], mat.cream, 0.08).castShadow = false;
  for (const side of [-1, 1]) {
    box(gallery, [0.28, 4.7, 32], [side * 5.1, 2.2, -14], mat.cream, 0.1).castShadow = false;
    box(gallery, [0.15, 0.27, 32], [side * 4.92, 0.15, -14], mat.dark, 0.045);
    box(gallery, [0.12, 0.12, 32], [side * 4.92, 3.65, -14], mat.lilac, 0.04);
    for (let z = -.7; z > -29; z -= 3.6) {
      box(gallery, [.028, .72, 2.8], [side * 4.94, 3.95, z], windowGlass, .001);
      for (const offset of [-1.42, 0, 1.42])
        box(gallery, [.07, .84, .055], [side * 4.88, 3.95, z + offset], mat.dark, .001);
      for (const y of [3.54, 4.36])
        box(gallery, [.09, .055, 2.9], [side * 4.88, y, z], mat.dark, .001);
      box(gallery, [.35, .075, 2.94], [side * 4.8, 3.5, z], mat.cream, .001);
    }
    for (let z = 1; z > -29; z -= 3.6) {
      box(gallery, [0.22, 3.62, 0.3], [side * 4.8, 1.85, z], mat.sand, 0.08);
      lamp(
        gallery,
        [side * 3.3, 4.15, z - 0.7],
        "#ffc58b",
        side === -1 && Math.round((1 - z) / 3.6) % 2 === 0 ? 0.7 : 0,
      );
    }
  }
  box(gallery, [10.3, 4.7, 0.3], [0, 2.2, -30], mat.cream, 0.1);
  plaque(gallery, ["LIVING SMALL"], [0, 3.34, -29.76], 4, 0.72, {
    small: "A MUSEUM OF AVAILABLE SPACE",
    titleSize: 76,
    height: 512,
  });
  plaque(
    gallery,
    ["WELCOME TO", "YOUR NEXT BIG STEP"],
    [0, 3.25, 1.4],
    3.5,
    1.05,
    { rotation: Math.PI, small: "MOM RESIDENTIAL SOLUTIONS" },
  );
  rug(gallery, [0, 0.025, -13.5], 1.5, 26, mat.peach);
  // The small route markers provide a continuous path through the exhibition.
  for (let z = 0; z > -23; z -= 2.1) {
    const arrow = new THREE.Group();
    arrow.position.set(0, 0.064, z);
    arrow.rotation.y = Math.PI;
    const a = box(arrow, [0.19, 0.016, 0.07], [-0.06, 0, 0], mat.gold, 0.025);
    a.rotation.y = -0.65;
    const b = box(arrow, [0.19, 0.016, 0.07], [0.06, 0, 0], mat.gold, 0.025);
    b.rotation.y = 0.65;
    gallery.add(arrow);
  }
  bench(gallery, [3.45, 0, -9.4], -0.14);
  bench(gallery, [-3.5, 0, -16.4], 0.13);
  plant(gallery, [-4.05, 0, 0.4], 1.2);
  plant(gallery, [4.1, 0, -19.3], 1.2);
  plant(gallery, [-4.15, 0, -27.8], 1.25);
  // Rectilinear timber ceiling construction, rather than inflated decorative ribs.
  for (let z = 0; z > -30; z -= 5) {
    box(gallery, [9.9, .16, .16], [0, 4.35, z], mat.dark, .008);
    for (const side of [-1,1])
      box(gallery, [.15,.48,.17], [side*4.8,4.12,z], mat.dark,.008);
  }
  const loader = new THREE.TextureLoader();
  const exhibits = [];
  const pictures = [];
  const ids = ["teepee", "car", "shoebox", "storage", "masonjar", "van"];
  const titles = [
    "THE OPEN PLAN",
    "THE MOBILE HOME",
    "THE STARTER BOX",
    "THE LOCKUP SUITE",
    "THE GLASS HOUSE",
    "THE FINAL OFFER",
  ];
  const sublines = [
    "MORE ROOM IN YOUR BUDGET",
    "PARK YOUR FUTURE HERE",
    "THINK INSIDE THE BOX",
    "EVERYTHING YOU NEED. LESS YOU.",
    "CLEARLY A PERFECT FIT",
    "FREE SHRINKING. ASK MOM TODAY.",
  ];
  ids.forEach((id, i) => {
    const g = new THREE.Group();
    const x = i % 2 ? 3.5 : -3.5;
    const z = i === 5 ? -23 : -3 - i * 3.6;
    g.position.set(x, 1.95, z);
    g.rotation.y = x < 0 ? .28 : -.28;
    box(g, [2.67, 1.95, 0.21], [0, 0, -0.015], mat.purple, 0.12);
    box(g, [2.48, 1.76, 0.12], [0, 0, 0.075], mat.gold, 0.08);
    const maps = ["cozy", "horror"].map((state) => {
      const t = loader.load(
        new URL(`../../tv/assets/lilbf-${id}-${state}.jpg`, import.meta.url)
          .href,
      );
      t.colorSpace = THREE.SRGBColorSpace;
      textures.add(t);
      return t;
    });
    const pm = new THREE.MeshBasicMaterial({ map: maps[0] });
    resources.add(pm);
    const pg = new THREE.PlaneGeometry(2.3, 1.58);
    resources.add(pg);
    const photo = new THREE.Mesh(pg, pm);
    photo.position.z = 0.158;
    photo.userData.keepSeparate = true;
    g.add(photo);
    // Brushed thumb marks and little clay rivets make every frame a physical object.
    for (const a of [-1, 1])
      for (const b of [-1, 1])
        ball(g, [a * 1.26, b * 0.88, 0.115], [0.05, 0.046, 0.026], mat.lilac);
    plaque(g, [titles[i]], [0, -1.22, 0.01], 2.5, 0.34, {
      titleSize: 66,
      height: 256,
      small: "",
      bg: "#e9d9be",
    });
    plaque(g, [sublines[i]], [0, 1.2, -0.02], 2.5, 0.38, {
      titleSize: 52,
      height: 256,
      bg: "#53627a",
      fg: "#ffe7bc",
      accent: "#aab9c6",
    });
    {
      box(g, [0.14, 1.3, 0.14], [-0.91, -1.30, -0.08], mat.dark, 0.04);
      box(g, [0.14, 1.3, 0.14], [0.91, -1.30, -0.08], mat.dark, 0.04);
    }
    box(g,[2.25,.07,.66],[0,-1.915,0],mat.dark,.015);
    gallery.add(g);
    pictures.push({ pm, maps });
    exhibits.push({ id, group: g, position: new THREE.Vector3(x, 1.95, z), inspectionPosition: new THREE.Vector3(-1.65, 1.05, -23) });
    box(g,[.055,.52,.10],[0,1.01,-.10],mat.dark,.009);
    box(g,[.55,.055,.10],[1.38,1.2,-.08],mat.dark,.008);
    plaque(g,[`0${i+1}`],[1.61,1.2,0],.46,.46,{titleSize:102,height:256,width:256});
  });
  // The last display remains before the field with a clear path beneath the table.
  const anchors = openingAnchors(THREE);
  const tablePosition = anchors.table.clone();
  const boxPosition = anchors.box.clone();
  const table = new THREE.Group();
  table.position.copy(tablePosition);
  gallery.add(table);
  box(table, [3.65, 0.22, 2.15], [0, 0.94, 0], mat.peach, 0.15);
  const tableWood=material("#956941",{surface:"wood"});
  const edgeWood=material("#bd865a",{surface:"wood"});
  for (const x of [-1.4, 1.4])
    for (const z of [-0.74, 0.74])
      lathe(table,[[0,0],[.095,0],[.115,.025],[.105,.1],[.077,.14],[.079,.42],
        [.11,.49],[.113,.53],[.084,.6],[.105,.78],[.115,.83],[0,.83]], [x,.005,z],tableWood,32);
  for(const z of [-.78,.78]) {
    box(table,[2.95,.16,.12],[0,.77,z],tableWood,.032);
    tube(table,[[-1.42,.849,z],[0,.846,z],[1.42,.849,z]],.013,edgeWood);
  }
  for(const x of [-1.48,1.48]) box(table,[.12,.16,1.48],[x,.77,0],tableWood,.032);
  box(table, [3.12, 0.12, 0.15], [0, 0.32, -0.72], mat.dark, 0.045);
  const destinationBox = new THREE.Group();
  destinationBox.name = 'under-table-destination-box';
  destinationBox.position.set(0,-1.06,-26);
  gallery.add(destinationBox);
  // Open box: no top mesh, and its nearest rim is lower for a legible entrance.
  box(destinationBox, [1.25, 0.09, 1.05], [0, 1.105, 0], mat.sand, 0.04);
  box(destinationBox, [1.25, 0.39, 0.08], [0, 1.33, -0.5], mat.sand, 0.045);
  box(destinationBox, [0.085, 0.38, 0.98], [-0.6, 1.33, 0], mat.sand, 0.045);
  box(destinationBox, [0.085, 0.38, 0.98], [0.6, 1.33, 0], mat.sand, 0.045);
  box(destinationBox, [1.25, 0.22, 0.09], [0, 1.245, 0.5], mat.sand, 0.045);
  const leftFlap = box(
    destinationBox,
    [0.42, 0.07, 0.95],
    [-0.8, 1.54, 0],
    mat.sand,
    0.035,
  );
  leftFlap.rotation.z = -0.38;
  const rightFlap = box(
    destinationBox,
    [0.42, 0.07, 0.95],
    [0.8, 1.54, 0],
    mat.sand,
    0.035,
  );
  rightFlap.rotation.z = 0.38;
  const backFlap = box(
    destinationBox,
    [1.19, 0.07, 0.39],
    [0, 1.52, -0.71],
    mat.sand,
    0.035,
  );
  backFlap.rotation.x = 0.35;
  // Fold scores, exposed corrugation and a patched corner describe cardboard.
  const cardboardEdge=material("#a87b4b",{surface:"paper"});
  tube(destinationBox,[[-.57,1.5,-.5],[0,1.505,-.503],[.57,1.5,-.5]],.009,cardboardEdge);
  for(const x of [-.603,.603]) tube(destinationBox,[[x,1.495,-.46],[x,1.497,0],[x,1.493,.45]],.009,cardboardEdge);
  for(let i=0;i<18;i++) {
    const x=-.56+i*.065;
    tube(destinationBox,[[x,1.356,.47],[x+.014,1.36,.5],[x+.028,1.356,.529]],.0038,cardboardEdge);
  }
  const patch=box(destinationBox,[.18,.11,.003],[.44,1.245,.548],material("#d7b886",{surface:"paper"}),.001);
  patch.rotation.z=-.12;

  const boxLadder = new THREE.Group();boxLadder.name='retired-destination-box-side-ladder';boxLadder.visible=false;
  gallery.add(boxLadder);
  for(const x of [-.18,.18])tube(boxLadder,[[x,.015,-25.30],[x,.48,-25.475]],.014,mat.gold);
  for(let i=0;i<5;i++){const t=(i+.5)/5;const p=anchors.rungAt(t);tube(boxLadder,[[-.19,p.y,p.z],[.19,p.y,p.z]],.02,edgeWood)}
  plaque(destinationBox,['JUMP IN'],[0,1.245,.552],.83,.14,{titleSize:72,width:1024,height:256});
  const preview = new THREE.Group();preview.name='nested-jar-cup-preview';
  preview.position.set(-.12,.105,-26.08);gallery.add(preview);
  const miniGlass=material('#bad8d5',{surface:'glass',transparent:true,opacity:.23,depthWrite:false,side:THREE.DoubleSide});
  lathe(preview,[[0,0],[.11,0],[.12,.015],[.12,.20],[.096,.23],[.096,.28],[.087,.28],[.087,.235],[.11,.20],[.11,.02],[0,.02]],[0,0,0],miniGlass,36);
  const cup=lathe(preview,[[0,0],[.039,0],[.043,.012],[.044,.105],[.038,.11],[.035,.018],[0,.018]],[0,.02,0],tableWood,28);
  for(let i=0;i<3;i++){const pencil=cylinder(preview,.004,.14,[Math.cos(i*2.1)*.018,.108,Math.sin(i*2.1)*.018],i%2?mat.gold:mat.purple);}
  bookStack(table, [1.22, 1.1, -0.1], 3);
  // Clip-board on the table leaves its middle and foreground free for the theft.
  box(table, [0.6, 0.06, 0.7], [-1.22, 1.085, -0.1], mat.cream, 0.025, -0.13);
  const form=cloth(table,[-1.22,1.12,-.1],.49,.56,material("#efdfc8",{surface:"paper"}),.018,2);
  form.rotation.y=-.13;
  box(table,[.18,.026,.055],[-1.25,1.146,-.37],mat.dark,.012,-.13);
  tube(table,[[-1.33,1.17,-.395],[-1.33,1.19,-.34],[-1.16,1.19,-.34],[-1.16,1.17,-.395]],.008,mat.gold);
  for(let i=0;i<4;i++) tube(table,[[-1.38,1.143,-.19+i*.064],[-1.1,1.145,-.225+i*.064]],.0028,mat.sand);
  const fieldKit={box,tube,material,
    own(value){(value.isTexture?textures:resources).add(value);return value},
    keepSeparate(object){object.userData.keepSeparate=true;movingObjects.add(object);return object},
    animate(update,objects=[]){roomAnimations.push(update);objects.forEach(o=>{o.userData.keepSeparate=true;movingObjects.add(o)})}
  };
  const energy=createEnergySystem(THREE,fieldKit);
  const field=new THREE.Group();field.name='residential-compression-field';field.position.copy(tablePosition);gallery.add(field);
  for(const x of [-2.55,2.55])box(field,[.075,3.5,.075],[x,1.75,1.45],mat.gold,.012);
  box(field,[5.17,.075,.075],[0,3.5,1.45],mat.gold,.012);
  energy.surface(field,5.05,3.43,[0,1.76,1.45]);
  energy.surface(field,3.0,3.43,[-2.55,1.76,-.05],[0,Math.PI/2,0]);
  energy.surface(field,3.0,3.43,[2.55,1.76,-.05],[0,Math.PI/2,0]);
  energy.surface(field,5.05,3.0,[0,3.5,-.05],[Math.PI/2,0,0]);
  const generator=energy.generator(gallery,[3.5,0,-25.8],1.5);
  const pedestal=new THREE.Group();pedestal.name='super-small-micro-shrinker-display';pedestal.position.copy(anchors.pedestal);gallery.add(pedestal);
  box(pedestal,[.76,.12,.7],[0,.89,0],mat.cream,.02);
  for(const x of [-.25,.25])box(pedestal,[.065,.83,.065],[x,.415,0],tableWood,.008);
  energy.generator(pedestal,[0,.95,0],.24);
  plaque(pedestal,['SUPER SMALL','MICRO SHRINKER'],[0,.7,.36],.65,.2,{titleSize:62,width:1024,height:256});
  for(const side of [-1,1]){
    const x=side*3.1;box(gallery,[.06,1.7,.06],[x,.85,-24.1],mat.gold,.009);
    box(gallery,[.55,.055,.5],[x,.03,-24.1],mat.dark,.015);
    plaque(gallery,side<0?['KEEP HANDS','OUTSIDE FIELD']:['SIZE CHANGES','MAY PERSIST'],[x,1.7,-24.08],1.4,.65,{bg:'#ffd36e',accent:'#695039',titleSize:73});
  }
  plaque(field,['RESIDENTIAL','COMPRESSION FIELD'],[0,3.14,1.50],2.7,.67,{bg:'#7a2fc4',fg:'#ffe7bc',accent:'#a970e3',titleSize:62});
  box(field,[.055,.32,.08],[0,3.46,1.48],mat.gold,.007);
  const fieldLight=new THREE.PointLight('#a55bed',2,6,1.8);fieldLight.position.set(0,2.2,-.2);field.add(fieldLight);
  // Every interior is authored independently; this kit keeps their clay style,
  // geometry ownership and lifecycle consistent with the gallery.
  const kit = {
    mat,
    palette,
    material,
    box,
    ball,
    tube,
    cylinder,
    lathe,
    ceramicCup,
    bowl,
    cloth,
    plaque,
    lamp,
    floor,
    rug,
    bench,
    plant,
    bookStack,
    pillow,
    emissivePurple,
    emissiveGold,
    resources,
    own(resource) {
      (resource.isTexture ? textures : resources).add(resource);
      return resource;
    },
    mesh(
      parent,
      geometry,
      meshMaterial,
      pos = [0, 0, 0],
      rotation = [0, 0, 0],
    ) {
      resources.add(geometry);
      scaleSurfaceUV(geometry);
      const mesh = new THREE.Mesh(geometry, meshMaterial);
      mesh.position.set(...pos);
      mesh.rotation.set(...rotation);
      mesh.castShadow = mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    },
    keepSeparate(object) {
      object.userData.keepSeparate = true;
      movingObjects.add(object);
      return object;
    },
    animate(update, objects = []) {
      roomAnimations.push(update);
      objects.forEach((object) => {
        object.userData.keepSeparate = true;
        movingObjects.add(object);
      });
    },
  };
  const interiors = [buildInteriorsA(THREE, kit), buildInteriorsB(THREE, kit)];
  for(const [x,z,words] of [[-5.8,-9.4,'MOM FICTIONAL AD: MOM KNOWS WHAT SIZE YOU NEED.'],[5.8,-16.1,'MOM FICTIONAL AD: A SMALLER YOU. A BETTER FIT.']]){
    const poster=new THREE.Group();poster.name='gallery-MOM-campaign-support';
    poster.position.set(x,2.3,z);poster.rotation.y=x<0?Math.PI/2:-Math.PI/2;gallery.add(poster);
    for(const side of [-.75,.75])box(poster,[.06,2.3,.06],[side,-1.15,-.1],mat.dark,.01);
    box(poster,[1.9,.08,.52],[0,-2.26,-.1],mat.dark,.015);
    plaque(poster,[words],[0,0,0],2.4,1.1);
  }
  const rooms = Object.assign({}, ...interiors.map((part) => part.rooms));
  const roomMetadata = Object.assign(
    {},
    ...interiors.map((part) => part.metadata),
  );
  const roomOrder = [
    "boxRoom",
    "jarRoom",
    "pencilRoom",
    "matchRoom",
    "spoolRoom",
    "fiberRoom",
    "atomicRoom",
  ];
  for (const id of roomOrder) {
    if (!rooms[id] || !roomMetadata[id]) {
      throw new Error(`Missing authored interior or route metadata: ${id}`);
    }
    rooms[id].name ||= id;
    roomMetadata[id].next=roomOrder[roomOrder.indexOf(id)+1]||null;
  }
  furnishHomes(THREE, kit, rooms, roomMetadata, roomOrder);
  rebuildObjectWorlds(THREE, kit, rooms, roomMetadata);
  // A hand-pinched clay trail follows the actual walking spline, including
  // the museum aisle. Instancing keeps each complete trail to one draw call.
  const crumbGeometry=kit.own(new THREE.IcosahedronGeometry(1,1));
  const crumbMaterial=material('#8546b4',{roughness:.98});
  function breadcrumbTrail(parent,points,data) {
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),false,'centripetal');
    curve.arcLengthDivisions=500;curve.updateArcLengths();
    const count=Math.ceil(curve.getLength()/.58)+1;
    const crumbs=new THREE.InstancedMesh(crumbGeometry,crumbMaterial,count);
    crumbs.name='boyfriend-clay-breadcrumb-trail';crumbs.userData.keepSeparate=true;
    crumbs.receiveShadow=true;const dummy=new THREE.Object3D(),trail=[];
    for(let i=0;i<count;i++){
      const u=i/(count-1),p=curve.getPointAt(u),t=curve.getTangentAt(u);
      p.add(new THREE.Vector3(-t.z,0,t.x).multiplyScalar(.19+Math.sin(i*2.4)*.07));
      p.y+=.045+(data?.floorHeight?.(p.x,p.z)||0);dummy.position.copy(p);dummy.rotation.set(0,i*1.7,.08*Math.sin(i));
      dummy.scale.set(.055+(i%3)*.011,.025+(i%2)*.008,.065+(i%4)*.005);
      dummy.updateMatrix();crumbs.setMatrixAt(i,dummy.matrix);trail.push(p.toArray());
    }
    crumbs.instanceMatrix.needsUpdate=true;parent.add(crumbs);
    if(data)data.breadcrumbTrail=trail;
  }
  breadcrumbTrail(gallery,[[0,0,1],[0,0,-10],[0,0,-21.5],[0,0,-23.7]]);
  for(const id of roomOrder)breadcrumbTrail(rooms[id],roomMetadata[id].path,roomMetadata[id]);
  let relativeScale=1/24;
  for(const id of roomOrder){roomMetadata[id].scaleToMuseum=relativeScale;roomMetadata[id].scaleRatio=id==='boxRoom'?1/24:.13;relativeScale*=.13;}
  const heights={boxRoom:3.6,jarRoom:7.1,pencilRoom:9.5,matchRoom:3.45,spoolRoom:6.2,fiberRoom:4.3,dustRoom:3.7};
  for(const id of roomOrder.filter(id=>id!=='atomicRoom')){
    energy.overhead(rooms[id],roomMetadata[id].path,id==='jarRoom'||id==='pencilRoom'?18:10,heights[id]);
    energy.portal(rooms[id],roomMetadata[id],id);
  }
  function mergeStaticMeshes(root, excluded = new Set()) {
    // Preserve texture-swapping photos, animated orbit trees and the field.
    // Bake every other local transform into one mesh per material/shadow setup.
    root.updateMatrixWorld(true);
    const inverseRoot = root.matrixWorld.clone().invert();
    const buckets = new Map();
    function collect(node) {
      if (excluded.has(node)) return;
      if (
        node.isMesh &&
        !node.userData.keepSeparate &&
        !node.material.transparent &&
        !Array.isArray(node.material)
      ) {
        const key = `${node.material.uuid}:${node.castShadow}:${node.receiveShadow}:${node.renderOrder}`;
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(node);
      }
      node.children.forEach(collect);
    }
    collect(root);
    for (const nodes of buckets.values()) {
      if (nodes.length < 2) continue;
      const chunks = nodes.map((mesh) => {
        const g = mesh.geometry.index
          ? mesh.geometry.toNonIndexed()
          : mesh.geometry.clone();
        g.applyMatrix4(
          new THREE.Matrix4().multiplyMatrices(inverseRoot, mesh.matrixWorld),
        );
        return g;
      });
      const count = chunks.reduce((n, g) => n + g.attributes.position.count, 0);
      const geometry = new THREE.BufferGeometry();
      for (const [name, size] of [
        ["position", 3],
        ["normal", 3],
        ["uv", 2],
      ]) {
        const array = new Float32Array(count * size);
        let offset = 0;
        for (const g of chunks) {
          const attr = g.attributes[name];
          if (attr) array.set(attr.array, offset);
          offset += g.attributes.position.count * size;
        }
        geometry.setAttribute(name, new THREE.BufferAttribute(array, size));
      }
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
      resources.add(geometry);
      const first = nodes[0];
      const merged = new THREE.Mesh(geometry, first.material);
      merged.name = `clay-static-${first.material.uuid.slice(0, 8)}`;
      merged.castShadow = first.castShadow;
      merged.receiveShadow = first.receiveShadow;
      merged.renderOrder = first.renderOrder;
      nodes.forEach((node) => {
        node.parent.remove(node);
      });
      chunks.forEach((g) => g.dispose());
      root.add(merged);
    }
  }
  // Exhibits remain Groups with untouched photo meshes and published positions.
  // Their clay parts may be baked into the gallery because they never animate.
  mergeStaticMeshes(field);
  for(const object of [destinationBox,boxLadder,preview,pedestal,generator]) mergeStaticMeshes(object);
  mergeStaticMeshes(gallery, new Set([field,destinationBox,boxLadder,preview,pedestal,generator]));
  // A whole threshold object may scale during entry. Bake its static parts in
  // its own coordinates first, keeping the object Group and opening aligned.
  const thresholdObjects = new Set(
    Object.values(roomMetadata)
      .map((data) => data.portal?.object)
      .filter(Boolean),
  );
  thresholdObjects.forEach((object) => {
    const nestedExclusions = new Set(
      [...movingObjects].filter((node) => node !== object),
    );
    mergeStaticMeshes(object, nestedExclusions);
  });
  roomOrder.forEach((id) => mergeStaticMeshes(rooms[id], movingObjects));
  return {
    gallery,
    ...rooms,
    rooms,
    roomMetadata,
    roomOrder,
    exhibits,
    tablePosition,
    boxPosition,
    opening: anchors,
    destinationBox,
    boxLadder,
    energy,
    field,
    update(time) {
      const t = Number.isFinite(time) ? time : 0;
      roomAnimations.forEach((update) => update(t));
      interiors.forEach((part) => part.update?.(t));

    },
    setReturned(value) {
      pictures.forEach(({ pm, maps }) => {
        pm.map = maps[value ? 1 : 0];
        pm.needsUpdate = true;
      });
    },
    dispose() {
      interiors.forEach((part) => part.dispose?.());
      textures.forEach((t) => t.dispose());
      resources.forEach((r) => r.dispose());
    },
  };
}

export function createMagnifier(THREE, { metal: recovered = false } = {}) {
  // Both borrowed and recovered devices share the canonical MOM hardware.
  // The historical metal:true option selects the recovered orange glass state.
  const metal = true;
  const group = new THREE.Group();
  group.name = recovered ? "recovered-metal-magnifier" : "borrowed-MOM-metal-magnifier";
  const resources = new Set();
  const material = (options) => {
    const m = new THREE.MeshStandardMaterial(options);
    resources.add(m);
    return m;
  };
  const makeTexture = (canvas) => {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    resources.add(t);
    return t;
  };
  let steelTexture;
  if (metal) {
    // Palette and hardware reproduce the user's canonical MOM Inc portal frame.
    // Reference: myr5-work/armie-ending/tv/assets/armie-intro/lab.js (quilt frame),
    // and myr5-work/release5/modules/portal/portal.css (.portal-frame).
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 256;
    const ctx = c.getContext("2d");
    const gr = ctx.createLinearGradient(0, 0, 128, 256);
    [
      [0, "#9a8498"],
      [0.26, "#6a586c"],
      [0.52, "#55465c"],
      [0.78, "#43364a"],
      [1, "#7a6478"],
    ].forEach(([n, color]) => gr.addColorStop(n, color));
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, 128, 256);
    for (let x = 0; x < 128; x++) {
      ctx.fillStyle = `rgba(255,255,255,${0.015 + 0.035 * (1 + Math.sin(x * 12.89))})`;
      ctx.fillRect(x, 0, 1, 256);
    }
    steelTexture = makeTexture(c);
  }
  const frameMat = material(
    metal
      ? {
          map: steelTexture,
          metalness: 0.55,
          roughness: 0.4,
          emissive: "#3a2c40",
          emissiveIntensity: 0.5,
        }
      : { color: "#7a2fc4", metalness: 0, roughness: 0.83 },
  );
  const edgeMat = material(
    metal
      ? { color: "#c6c5b9", metalness: 0.8, roughness: 0.25 }
      : { color: "#a970e3", metalness: 0, roughness: 0.8 },
  );
  const darkMat = material({
    color: metal ? "#343039" : "#502077",
    metalness: metal ? 0.6 : 0,
    roughness: 0.7,
  });
  function bar(w, h, d, x, y, z, mat) {
    const g = sculptedBoxGeometry(THREE, w, h, d, .018, 0);
    resources.add(g);
    const mesh = new THREE.Mesh(g, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    group.add(mesh);
    return mesh;
  }
  for (const side of [-1, 1]) {
    bar(0.48, 0.052, 0.07, 0, side * 0.214, 0, frameMat);
    bar(0.052, 0.43, 0.07, side * 0.214, 0, 0, frameMat);
    if (metal) {
      bar(0.397, 0.008, 0.008, 0, side * 0.192, 0.037, edgeMat);
      bar(0.008, 0.382, 0.008, side * 0.192, 0, 0.037, edgeMat);
    }
  }
  const paneMat = recovered
    ? new THREE.MeshBasicMaterial({
        color: "#ff9c23",
        toneMapped: false,
        transparent: true,
        opacity: 0.92,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    : new THREE.MeshPhysicalMaterial({
        color: "#d9b6fa",
        transparent: true,
        opacity: 0.12,
        transmission: 0.05,
        roughness: 0.12,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
  resources.add(paneMat);
  const pg = new THREE.PlaneGeometry(0.376, 0.376);
  resources.add(pg);
  const pane = new THREE.Mesh(pg, paneMat);
  pane.position.z = 0.007;
  pane.name = "magnifier-pane";
  pane.renderOrder = 3;
  group.add(pane);
  for (const x of [-0.212, 0.212])
    for (const y of [-0.212, 0.212]) {
      if (metal) {
        const wg = new THREE.CylinderGeometry(0.014, 0.014, 0.006, 16);
        resources.add(wg);
        const washer = new THREE.Mesh(wg, darkMat);
        washer.rotation.x = Math.PI / 2;
        washer.position.set(x, y, 0.038);
        group.add(washer);
        const bg = new THREE.CylinderGeometry(0.01, 0.01, 0.008, 6);
        resources.add(bg);
        const bolt = new THREE.Mesh(bg, edgeMat);
        bolt.rotation.x = Math.PI / 2;
        bolt.position.set(x, y, 0.043);
        group.add(bolt);
      } else {
        const sg = new THREE.SphereGeometry(0.012, 10, 8);
        resources.add(sg);
        const s = new THREE.Mesh(sg, edgeMat);
        s.position.set(x, y, 0.04);
        s.scale.z = 0.35;
        group.add(s);
      }
    }
  if (!metal) {
    bar(0.044, 0.11, 0.052, 0.17, -0.28, 0, frameMat);
    bar(0.041, 0.018, 0.016, 0.175, -0.202, 0.047, edgeMat);
    bar(0.041, 0.018, 0.016, 0.175, -0.166, 0.047, darkMat);
    bar(0.022, 0.018, 0.012, -0.17, -0.214, 0.045, edgeMat);
  } else {
    const c = document.createElement("canvas");
    c.width = 6;
    c.height = 1;
    const ctx = c.getContext("2d");
    ["#ff5f1f", "#ffff33", "#39ff14", "#1f51ff", "#b026ff", "#ff10f0"].forEach(
      (color, i) => {
        ctx.fillStyle = color;
        ctx.fillRect(i, 0, 1, 1);
      },
    );
    const energy = makeTexture(c);
    energy.magFilter = THREE.NearestFilter;
    energy.wrapS = THREE.RepeatWrapping;
    const energyMat = new THREE.MeshBasicMaterial({ map: energy });
    resources.add(energyMat);
    for (const side of [-1, 1])
      for (const vertical of [false, true]) {
        const eg = new THREE.PlaneGeometry(0.408, 0.006);
        resources.add(eg);
        const uv = eg.attributes.uv;
        for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * 3.8);
        const seam = new THREE.Mesh(eg, energyMat);
        seam.position.set(
          vertical ? side * 0.214 : 0,
          vertical ? 0 : side * 0.214,
          0.041,
        );
        if (vertical) seam.rotation.z = Math.PI / 2;
        group.add(seam);
      }
    const nc = document.createElement("canvas");
    nc.width = 512;
    nc.height = 88;
    const nctx = nc.getContext("2d");
    const ng = nctx.createLinearGradient(0, 0, 0, 88);
    ng.addColorStop(0, "#ae99a5");
    ng.addColorStop(0.48, "#806b7c");
    ng.addColorStop(1, "#5f4c5f");
    nctx.fillStyle = ng;
    nctx.fillRect(0, 0, 512, 88);
    // User correction: an engraved MOM logo, without the generic INC plaque.
    // Paired highlight and shadow contours read as lettering cut into the metal.
    nctx.font = "900 74px Arial, sans-serif";
    nctx.textAlign = "center";
    nctx.textBaseline = "middle";
    nctx.lineJoin = "round";
    nctx.lineWidth = 5;
    nctx.strokeStyle = "#d5bdce";
    nctx.strokeText("MOM", 256, 47);
    nctx.strokeStyle = "#39283e";
    nctx.strokeText("MOM", 256, 42);
    nctx.fillStyle = "#59405e";
    nctx.fillText("MOM", 256, 43);
    const nm = new THREE.MeshBasicMaterial({ map: makeTexture(nc) });
    resources.add(nm);
    bar(0.139, 0.032, 0.008, 0, 0.214, 0.041, darkMat);
    const ngGeo = new THREE.PlaneGeometry(0.132, 0.026);
    resources.add(ngGeo);
    const nameplate = new THREE.Mesh(ngGeo, nm);
    nameplate.name = "engraved-MOM-logo";
    nameplate.position.set(0, 0.214, 0.047);
    group.add(nameplate);
    for (const [x, color] of [
      [-0.096, "#39ff14"],
      [0.096, "#b026ff"],
    ]) {
      const lm = new THREE.MeshBasicMaterial({ color });
      resources.add(lm);
      bar(0.007, 0.007, 0.007, x, 0.214, 0.046, lm);
    }
    if (recovered) {
      const glow = new THREE.PointLight("#ff8f1c", 0.8, 3, 1.7);
      glow.position.z = 0.09;
      group.add(glow);
    }
  }
  group.userData.dispose = () => resources.forEach((r) => r.dispose());
  return group;
}
