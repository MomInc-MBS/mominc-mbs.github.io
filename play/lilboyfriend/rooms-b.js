import { ROOM_COPY } from "./room-copy.js?objects=12";

// Authored microscopic homes. The shared kit owns all geometry and textures.
export function buildInteriorsB(THREE, kit) {
  const {
    mat,
    material,
    mesh,
    box,
    ball,
    tube,
    cylinder,
    plaque,
    animate,
  } = kit;
  const rooms = {},
    metadata = {};
  const pearl = material("#dbd9d5");
  const shadow = material("#413144");
  const seam = material("#9f71b7", {
    emissive: "#7e469a",
    emissiveIntensity: 0.16,
  });
  const paths = {
    spoolRoom: [
      [0, 0, 1],
      [3.3, 0, -2],
      [4.2, 0, -6],
      [4.2, 0, -10],
      [3.1, 0, -13],
      [0, 0, -15.5],
      [0, 0, -17],
    ],
    fiberRoom: [
      [0, 0, 1],
      [-2.2, 0, -2.5],
      [-2.5, 0, -5.5],
      [2, 0, -9],
      [2.2, 0, -12],
      [0, 0, -15],
      [0, 0, -17],
    ],
    dustRoom: [
      [0, 0, 1],
      [1.8, 0, -2.5],
      [2.4, 0, -5.5],
      [-1.8, 0, -9],
      [-2, 0, -12],
      [0, 0, -14.5],
      [0, 0, -17],
    ],
    atomicRoom: [
      [0, 0, 1],
      [-1.3, 0, -2.8],
      [1.6, 0, -6.5],
      [-1.1, 0, -10],
      [0, 0, -12.3],
      [0, 0, -13],
      [0, 0, -17],
    ],
  };
  function group(id, label, scale) {
    const g = new THREE.Group();
    g.name = id;
    rooms[id] = g;
    metadata[id] = {
      label,
      scale,
      path: paths[id],
      entry: [0, 0, 1],
      exit: [0, 0, -17],
    };
    return g;
  }
  function polygon(parent, points, m, y = -0.23, depth = 0.23) {
    const s = new THREE.Shape();
    points.forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z)));
    s.closePath();
    return mesh(
      parent,
      new THREE.ExtrudeGeometry(s, {
        depth,
        bevelEnabled: true,
        bevelSegments: 4,
        steps: 1,
        bevelSize: 0.07,
        bevelThickness: 0.045,
      }),
      m,
      [0, y, 0],
      [-Math.PI / 2, 0, 0],
    );
  }
  function ovalPoints(cx, cz, rx, rz, count = 48) {
    return Array.from({ length: count }, (_, i) => {
      const a = (i / count) * Math.PI * 2;
      return [cx + Math.sin(a) * rx, cz + Math.cos(a) * rz];
    });
  }
  function face(parent, points, m) {
    const p = [];
    for (let i = 1; i < points.length - 1; i++)
      p.push(...points[0], ...points[i], ...points[i + 1]);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    geometry.computeVertexNormals();
    return mesh(parent, geometry, m);
  }
  function poster(
    parent,
    lines,
    pos,
    w = 2.2,
    h = 0.7,
    rotation = 0,
    opts = {},
  ) {
    const source = Array.isArray(lines) ? lines : [lines];
    const isAd = source.some((line) => /^MOM FICTIONAL AD:/i.test(line));
    const wrap = (text, max = 22) => {
      const result = [];
      let line = "";
      for (const word of text.split(/\s+/)) {
        if (line && `${line} ${word}`.length > max) {
          result.push(line);
          line = word;
        } else line = line ? `${line} ${word}` : word;
      }
      if (line) result.push(line);
      return result;
    };
    const copy = source.flatMap((line) =>
      wrap(line.replace(/^MOM FICTIONAL AD:\s*/i, "")),
    );

    const labelGroup=new THREE.Group();
    labelGroup.position.set(...pos);labelGroup.rotation.y=rotation;parent.add(labelGroup);
    const height=isAd?1.2:h,y=Math.max(.1,pos[1]);
    const support=parent.name==="atomicRoom"?material("#a775c6",{emissive:"#6e4191",emissiveIntensity:.2}):parent.name==="dustRoom"?material("#a79aae",{surface:"stone"}):material("#657083",{roughness:.75,metalness:.2});
    box(labelGroup,[w+.12,height+.12,.09],[0,0,-.065],support,.025);
    for(const x of [-w*.35,w*.35]){
      box(labelGroup,[.07,y,.10],[x,-y*.5,-.09],support,.015);
      box(labelGroup,[.44,.08,.46],[x,-y+.04,-.09],support,.025);
    }
    return plaque(labelGroup,copy,[0,0,.006],w,height,{
      titleSize:70,height:256,bg:"#e5d4bb",fg:"#59384f",accent:"#865484",
      ...opts,small:isAd?"MOM Â· FICTIONAL AD":opts.small
    });
  }
  function routeMarks(parent, id, floorHeight = () => 0) {
    const curve = new THREE.CatmullRomCurve3(
      paths[id].map((p) => new THREE.Vector3(...p)),
      false,
      "centripetal",
    );
    for (let u = 0.04; u < 0.9; u += 0.085) {
      const p = curve.getPointAt(u),
        v = curve.getTangentAt(u);
      const g = new THREE.Group();
      g.position.set(p.x, 0.045 + floorHeight(p.x, p.z), p.z);
      g.rotation.y = Math.atan2(-v.x, -v.z);
      parent.add(g);
      box(g, [0.15, 0.022, 0.07], [-0.045, 0, 0], mat.lilac, 0.018, -0.6);
      box(g, [0.15, 0.022, 0.07], [0.045, 0, 0], mat.lilac, 0.018, 0.6);
    }
  }
  function physicalPortal(id, next, kind, target, caption, duration = 4.4) {
    metadata[id].next = next;
    metadata[id].portal = {
      kind,
      target,
      approach: [0, 1.55, -16.65],
      look: target,
      caption,
      duration,
    };
  }


  // Coil and wiring bay: molded bobbin, enamel copper winding, anchored solder joints.
  {
    const g=group("spoolRoom","COIL AND WIRING BAY","INSIDE THE RECORDER");
    const copper=material("#bc6338",{surface:"metal",metalness:.7,roughness:.3});
    const enamel=material("#a74125",{surface:"metal",metalness:.4,roughness:.24});
    const dielectric=material("#334052",{roughness:.7});
    const solder=material("#bac6ce",{surface:"metal",metalness:.8,roughness:.3});
    polygon(g,ovalPoints(0,-9.5,6.65,11.5),dielectric);
    cylinder(g,2.6,4.85,[0,2.35,-8],dielectric);
    cylinder(g,2.98,.24,[0,.18,-8],dielectric);
    cylinder(g,2.95,.22,[0,4.77,-8],dielectric);
    for(let layer=0;layer<15;layer++)for(const side of [0,1]){
      const pts=Array.from({length:49},(_,i)=>{
        const a=(side?Math.PI+.22:.22)+(Math.PI-.44)*i/48;
        return [Math.sin(a)*6.62,.24+layer*.3,-9.5+Math.cos(a)*11.46];
      });
      tube(g,pts,.14,layer%4===0?copper:enamel);
    }
    for(const z of [-2,-5,-12,-15]){
      tube(g,[[-5.7,4.7,z],[-3,5,z],[0,5.2,z],[3,5,z],[5.7,4.7,z]],.16,dielectric);
      for(const x of [-5.5,5.5])box(g,[.45,.28,.58],[x,4.52,z],dielectric,.03);
    }
    for(let i=0;i<4;i++){
      const z=-3-i*3.4;
      box(g,[1.2,.13,.65],[-4.75,.14,z],solder,.03);
      cylinder(g,.2,.32,[-4.75,.33,z],copper);
      tube(g,[[-4.75,.46,z],[-5.25,.42,z-.6],[-5.15,.2,z-1.9]],.065,enamel);
      box(g,[.5,.27,.32],[-5.15,.16,z-1.5],dielectric,.03);
    }
    poster(g,[ROOM_COPY.spoolRoom.ad],[-4.5,2.2,-10.7],2.6,1.2,.65);
    // Hollow cut cable: open cylinder surfaces and annular cut faces, no central cap.
    const portal=new THREE.Group();portal.name="cut-cable-aperture";portal.position.set(0,0,-19.15);
    g.add(portal);kit.keepSeparate(portal);
    const jacket=material("#4d5867",{side:THREE.DoubleSide}),dark=material("#202938",{side:THREE.DoubleSide});
    for(const [r,m] of [[1.24,jacket],[1,dark]])
      mesh(portal,new THREE.CylinderGeometry(r,r,2.4,40,1,true),m,[0,.85,-.05],[Math.PI/2,0,0]);
    for(const z of [1.15,-1.25])mesh(portal,new THREE.RingGeometry(1,1.24,40),jacket,[0,.85,z]);
    const jackets=["#bd505d","#4980b7","#d3af49"].map(c=>material(c));
    for(let i=0;i<12;i++){
      const a=i/12*Math.PI*2,x=Math.sin(a)*1.12,y=.85+Math.cos(a)*1.12;
      tube(portal,[[x,y,-1.2],[x,y,.7],[x,y,1.17]],.09,jackets[i%3]);
      tube(portal,[[x,y,1.17],[x*1.16,.85+(y-.85)*1.12,1.4],[x*1.25,.85+(y-.85)*1.24,1.62]],.03,copper);
    }
    box(portal,[3.1,.14,2.7],[0,-.22,-.05],dielectric,.05);
    for(const x of [-1.4,1.4])box(portal,[.18,.9,.3],[x,.3,-.4],solder,.03);
    routeMarks(g,"spoolRoom");
    physicalPortal("spoolRoom","fiberRoom","split-fiber",[0,.32,-18.8],"Enter the real hollow bore of the cut cable.",3.5);
    Object.assign(metadata.spoolRoom.portal,{approach:[0,.65,-17.8],look:[0,.4,-20],object:portal,aperture:{radius:1,centerY:.85}});
    metadata.spoolRoom.entryLook=[3.3,1.55,-2];
    metadata.spoolRoom.relativeScale=1/24;
  }

  // Cable: open swept insulation and distinct continuous metal conductors.
  {
    const g=group("fiberRoom","CABLE INTERIOR","BETWEEN METALLIC CONDUCTORS");
    const insulation=material("#313a4e",{side:THREE.DoubleSide,roughness:.8});
    const core=material("#c68148",{surface:"metal",metalness:.8,roughness:.28});
    const colors=["#b95561","#4c7fb9","#c7b45c"].map(c=>material(c,{roughness:.6}));
    const curve=new THREE.CatmullRomCurve3(paths.fiberRoom.map(p=>new THREE.Vector3(...p)),false,"centripetal");
    const centers=Array.from({length:49},(_,i)=>curve.getPoint(i/48));centers.push(new THREE.Vector3(0,0,-20.6));
    polygon(g,[...centers.map(p=>[p.x-4.3,p.z]),...[...centers].reverse().map(p=>[p.x+4.3,p.z])],insulation);
    const positions=[];
    for(let i=0;i<centers.length-1;i++)for(let j=0;j<32;j++){
      const a=j/32*Math.PI*2,b=(j+1)/32*Math.PI*2;
      const point=(c,t)=>[c.x+Math.sin(t)*5,3.1+Math.cos(t)*3,c.z];
      const q=[point(centers[i],a),point(centers[i+1],a),point(centers[i+1],b),point(centers[i],b)];
      positions.push(...q[0],...q[1],...q[2],...q[0],...q[2],...q[3]);
    }
    const shell=new THREE.BufferGeometry();shell.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));shell.computeVertexNormals();
    mesh(g,shell,insulation).name="hollow-cut-insulation";
    for(let k=0;k<3;k++){
      const offset=k===0?-3.9:k===1?3.9:0,y=k===2?5.1:2.2;
      const pts=centers.map(p=>[p.x+offset,y,p.z]);
      tube(g,pts,.62,colors[k]);tube(g,pts.map(p=>[p[0],p[1]+.63,p[2]]),.13,core);
      for(let j=0;j<5;j++){
        const a=j/5*Math.PI*2,e=pts[pts.length-1],sx=e[0]+Math.sin(a)*.22,sy=e[1]+Math.cos(a)*.22;
        tube(g,[[sx,sy,e[2]],[sx+Math.sin(a)*.16,sy+Math.cos(a)*.16,e[2]-.35],[sx+Math.sin(a)*.3,sy+Math.cos(a)*.3,e[2]-.65]],.035,core);
      }
    }
    for(let i=4;i<centers.length-2;i+=8){
      const p=centers[i],ring=Array.from({length:33},(_,j)=>{const a=-2.55+j/32*5.1;return[p.x+Math.sin(a)*4.92,3.1+Math.cos(a)*2.96,p.z]});
      tube(g,ring,.085,insulation);
    }
    poster(g,[ROOM_COPY.fiberRoom.ad],[2.4,2.5,-3.4],2.4,1,-1.45);
    const portal=new THREE.Group();portal.position.set(0,0,-19.15);portal.name="exposed-copper-conductor-atomic-entrance";
    g.add(portal);kit.keepSeparate(portal);
    // A cut conductor's copper strands surround a genuine open bore.
    // The visitor descends directly into the conductor's atomic structure.
    const cutCopper=material('#d58a57',{surface:'metal',metalness:.8,roughness:.35});
    const oxidized=material('#578879',{surface:'metal',metalness:.35,roughness:.85});
    for(let i=0;i<12;i++){
      const a=i/12*Math.PI*2,x=Math.sin(a)*1.08,y=.95+Math.cos(a)*1.08;
      tube(portal,[[x,y,.75],[x*.96,.95+(y-.95)*.96,0],[x*.94,.95+(y-.95)*.94,-1.45]],.135,i%4===0?oxidized:cutCopper);
      mesh(portal,new THREE.CircleGeometry(.135,10),cutCopper,[x,y,.76]);
    }
    mesh(portal,new THREE.CylinderGeometry(1.31,1.31,2.3,36,1,true),colors[2],[0,.95,-.35],[Math.PI/2,0,0]);
    mesh(portal,new THREE.RingGeometry(1.19,1.31,36),colors[2],[0,.95,.79]);
    box(portal,[2.7,.24,1.8],[0,-.1,-.2],insulation,.02);
    routeMarks(g,"fiberRoom");
    physicalPortal("fiberRoom","atomicRoom","conductor-bore",[0,.62,-18.9],"Follow the exposed copper strands directly into their atomic structure.",4.1);
    Object.assign(metadata.fiberRoom.portal,{approach:[0,.85,-17.7],look:[0,.7,-20],object:portal,aperture:{radius:.91,centerY:.95}});
    metadata.fiberRoom.entryLook=[-2.2,1.55,-2.5];metadata.fiberRoom.relativeScale=1/28;
  }

  // Dust: unequal sloping facets, an inhabited pocket, and actual exposed fissures.
  {
    const g = group("dustRoom", "THE MINIMUM HOME", "SMALLER THAN DUST");
    const outline = [
      [-2.5, 2],
      [3.2, 1],
      [4.8, -5],
      [2.8, -10],
      [4, -15],
      [1, -20],
      [-3.5, -18],
      [-4.7, -9],
    ];
    polygon(g, outline, pearl);
    const shellMats = [
      material("#afa9a0", { side: THREE.DoubleSide, surface: "stone" }),
      material("#918b9c", { side: THREE.DoubleSide, surface: "stone" }),
      material("#c5bba8", { side: THREE.DoubleSide, surface: "stone" }),
    ];
    const heights = [4.25, 4.7, 4.1, 3.6, 4.1, 3.8, 4.6, 4.5];
    const top = outline.map(([x, z], i) => [x * 0.92, heights[i], z]);
    for (let i = 0; i < outline.length; i++) {
      const j = (i + 1) % outline.length,
        a = outline[i],
        b = outline[j];
      if (i === 0 || i === 4 || i === 5) continue; // the entry and rear lattice are true gaps
      const mid = [
        (a[0] + b[0]) * 0.51,
        heights[i] * 0.52,
        (a[1] + b[1]) * 0.5,
      ];
      face(
        g,
        [[a[0], -0.01, a[1]], [b[0], -0.01, b[1]], mid],
        shellMats[i % 3],
      );
      face(g, [[b[0], -0.01, b[1]], top[j], mid], shellMats[(i + 1) % 3]);
      face(g, [top[j], top[i], mid], shellMats[(i + 2) % 3]);
      face(g, [top[i], [a[0], -0.01, a[1]], mid], shellMats[i % 3]);
      tube(
        g,
        [[a[0] * 0.99, 0.17, a[1]], [mid[0], mid[1] - 0.03, mid[2]], top[j]],
        0.026,
        seam,
      );
    }
    // A fractured low vault made from large, visibly sloped roof facets.
    const ridge = [
      [0.2, 4.7, 0.4],
      [-0.8, 4.15, -4.5],
      [1, 3.65, -9],
      [0.1, 4.2, -14],
      [0, 3.5, -19.5],
    ];
    face(g, [top[0], top[1], ridge[1], ridge[0]], shellMats[2]);
    face(g, [top[1], top[2], ridge[2], ridge[1]], shellMats[1]);
    face(g, [top[2], top[3], top[4], ridge[3], ridge[2]], shellMats[0]);
    face(g, [top[7], top[0], ridge[0], ridge[1]], shellMats[1]);
    face(g, [top[6], top[7], ridge[1], ridge[2], ridge[3]], shellMats[2]);
    face(g, [top[4], top[5], ridge[4], ridge[3]], shellMats[1]);
    face(g, [top[5], top[6], ridge[3], ridge[4]], shellMats[0]);
    tube(g, ridge, 0.075, seam);

    // Cleavage fragments provide shelters at mineral scale.
    for(const [x,z,h] of [[-3.15,-4.5,.8],[3.1,-8.5,1.1],[-3.35,-13.6,.7]]){
      const fragment=mesh(g,new THREE.OctahedronGeometry(1,0),shellMats[2],[x,h*.45,z],[.25,.35,.12]);
      fragment.scale.set(1.15,h,.75);fragment.name="mineral-cleavage-shelter";
    }
    poster(g,[ROOM_COPY.dustRoom.ad],[-4.05,2.1,-10.5],2.3,1,1.45);
    // An inclusion: several translucent irregular facets surround a split lattice.
    const crystal = material("#bbd1d5", {
      transparent: true,
      opacity: 0.47,
      roughness: 0.7,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const portal = new THREE.Group();
    portal.position.set(0, 0, -19.05);
    g.add(portal);
    kit.keepSeparate(portal);
    for (const [x, y, z, s] of [
      [-1.02, 1.2, 0, 0.9],
      [1.04, 1.0, -0.1, 0.82],
      [-0.48, 2.23, -0.22, 0.66],
      [0.62, 2.3, -0.25, 0.68],
      [0, 0.2, -0.24, 0.55],
    ]) {
      const o = mesh(
        portal,
        new THREE.OctahedronGeometry(s, 0),
        crystal,
        [x, y, z],
        [0.17, x * 0.7, 0.27],
      );
      o.scale.z = 0.72;
    }
    const lattice = [
      [-0.6, 0.37, 0.4],
      [-0.75, 1.16, 0.15],
      [-0.41, 1.88, 0.13],
      [0.48, 1.96, 0.15],
      [0.75, 1.13, 0.14],
      [0.56, 0.36, 0.4],
    ];
    for (let i = 0; i < lattice.length; i++) {
      ball(portal, lattice[i], [0.15, 0.14, 0.15], pearl);
      if (i !== 2 && i !== 5)
        tube(
          portal,
          [lattice[i], lattice[(i + 1) % lattice.length]],
          0.045,
          seam,
        );
    }
    // Three fissure tips surround the opening without joining across it.
    tube(
      portal,
      [
        [-1.15, 0.2, 0.18],
        [-0.69, 0.55, 0.42],
        [-0.58, 1.04, 0.43],
      ],
      0.055,
      shadow,
    );
    tube(
      portal,
      [
        [1.21, 0.34, 0.08],
        [0.72, 0.69, 0.38],
        [0.55, 1.07, 0.42],
      ],
      0.055,
      shadow,
    );
    tube(
      portal,
      [
        [0.16, 2.75, -0.1],
        [-0.13, 2.14, 0.17],
        [0, 1.77, 0.43],
      ],
      0.052,
      shadow,
    );
    routeMarks(g, "dustRoom");
    physicalPortal(
      "dustRoom",
      "atomicRoom",
      "crystal-split",
      [0, 1.2, -18.8],
      "Inside the grain, a crystal inclusion has split along its lattice.",
      3.8,
    );
    Object.assign(metadata.dustRoom.portal, {
      approach: [0, 1.1, -17.8],
      look: [0, 1.2, -20],
    });
    metadata.dustRoom.portal.object = portal;
    metadata.dustRoom.entryLook = [1.8, 1.55, -2.5];
  }

  // Atomic bloom: open tactile islands and filaments, with no room walls or ceiling.
  {
    const g = group("atomicRoom", "THE LAST LITTLE WORLD", "ATOMIC SCALE");
    const violet = material("#8e42b4", {
      emissive: "#60277d",
      emissiveIntensity: 0.17,
    });
    const pink = material("#d551aa", {
      emissive: "#9d3171",
      emissiveIntensity: 0.13,
    });
    const teal = material("#49aab5", {
      emissive: "#237782",
      emissiveIntensity: 0.16,
    });
    const yellow = material("#d9d16d", {
      emissive: "#7b742f",
      emissiveIntensity: 0.12,
    });
    const colors = [violet, pink, teal, yellow];
    const probability = colors.map(m => material(m.color.clone(), {
      transparent: true, opacity: .08, depthWrite: false, side: THREE.DoubleSide,
      emissive: m.color.clone(), emissiveIntensity: .3,
    }));
    const curve = new THREE.CatmullRomCurve3(
      paths.atomicRoom.map((p) => new THREE.Vector3(...p)),
      false,
      "centripetal",
    );
    const pts = Array.from({ length: 50 }, (_, i) => curve.getPoint(i / 49));
    pts.push(new THREE.Vector3(0, 0, -20));
    polygon(
      g,
      [
        ...pts.map((p) => [p.x - 2.35, p.z]),
        ...[...pts].reverse().map((p) => [p.x + 2.35, p.z]),
      ],
      violet,
      -0.275,
      0.23,
    );
    // Hand-smoothed overlapping pads read as a continuous floor, never a jumping course.
    const padSpecs = [
      [-2.4, -1, 2.4, 2.8, 2],
      [2.9, -5.3, 2.8, 2.7, 1],
      [-3.7, -9.5, 2.7, 3.1, 3],
      [2.7, -13.6, 2.6, 2.8, 2],
      [0, -17.8, 3.35, 3.1, 0],
    ];
    padSpecs.forEach(([x, z, rx, rz, c], i) => {
      // Distinct shallow elevations prevent coplanar triangles where lobes overlap.
      const surface = 0.025 + i * 0.0175;
      polygon(
        g,
        ovalPoints(x, z, rx, rz, 32),
        colors[c],
        surface - 0.235,
        0.19,
      );
      tube(
        g,
        ovalPoints(x, z, rx * 0.95, rz * 0.95, 40).map(([a, b]) => [
          a,
          surface + 0.005,
          b,
        ]),
        0.035,
        colors[(c + 1) % 4],
        true,
      );
    });
    // Domestic objects end here; the preserved welcome gift is the last familiar artifact.
    // Three depth layers of clusters keep the horizon open around the final frame.
    const clusterPositions = [
      [-7, 2, -4, 2.3],
      [8, 3, -8, 2.7],
      [-8, 4, -14, 3.3],
      [8, 2.7, -19, 3.7],
      [-13, 6, -26, 5.5],
      [15, 8, -34, 7],
      [-18, 12, -44, 8.5],
      [1, 11, -33, 4.8],
    ];
    clusterPositions.forEach(([x, y, z, s], i) => {
      const cluster = new THREE.Group();
      cluster.position.set(x, y, z);
      g.add(cluster);
      for (let j = 0; j < 7; j++) {
        const a = (j / 7) * Math.PI * 2,
          r = s * 0.65;
        ball(
          cluster,
          [Math.sin(a) * r, Math.cos(a) * r * 0.74, Math.sin(a * 2) * r * 0.42],
          [s * 0.65, s * 0.55, s * 0.7],
          probability[(i + j) % 4],
        );
      }
      // Only distant clouds breathe; the tactile route stays absolutely stable.
      if (i > 3)
        animate(
          (t) => {
            cluster.rotation.y = Math.sin(t * 0.035 + i) * 0.08;
          },
          [cluster],
        );
    });
    // Slow drifting soft filaments, huge enough to extend well beyond the old room boundary.
    for (let i = 0; i < 6; i++) {
      const filament = new THREE.Group();
      filament.position.set(0, 5.6 + i * 0.75, -13 - i * 3);
      g.add(filament);
      const arc = Array.from({ length: 48 }, (_, j) => {
        const a = (j / 47) * Math.PI * 1.65 + 0.35;
        return [
          Math.cos(a) * (8 + i * 1.3),
          Math.sin(a) * (2.3 + i * 0.25),
          Math.sin(a * 0.7) * 4,
        ];
      });
      tube(filament, arc, 0.075 + i * 0.015, colors[i % 4]);
      for (const j of [6, 21, 35])
        ball(filament, arc[j], [0.3, 0.26, 0.3], colors[(i + 1) % 4]);
      animate(
        (t) => {
          filament.rotation.y = Math.sin(t * 0.045 + i * 0.7) * 0.055;
        },
        [filament],
      );
    }
    // Curved clay panels carry diminishing fragments; the final four meters are quiet.
    poster(g, ["LESS."], [-4.1, 2.4, -3.8], 2.25, 1.0, 0.45, {
      bg: "#87b2b7",
      fg: "#4b345c",
      accent: "#674c82",
      titleSize: 110,
    });
    poster(g, ["LESS."], [4.6, 2.7, -8.4], 2.9, 1.3, -0.6, {
      bg: "#c69ab7",
      fg: "#552e61",
      accent: "#876084",
      titleSize: 110,
    });
    poster(g, ["ENOUGH."], [-5.15, 2.6, -11.25], 3.6, 1.1, 0.32, {
      bg: "#dbd39b",
      fg: "#51465c",
      accent: "#8b7b99",
      titleSize: 106,
    });
    // Modest cradle for the root-owned metal magnifier at (0,1.5,-17).
    cylinder(g, 0.54, 0.17, [0, 0.1, -17], violet);
    cylinder(g, 0.28, 0.86, [0, 0.61, -17], teal, 0.22);
    box(g, [0.56, 0.15, 0.24], [0, 1.11, -17], violet, 0.09);
    for (const x of [-0.19, 0.19])
      tube(
        g,
        [
          [x, 1.14, -17],
          [x, 1.31, -17.015],
          [x, 1.35, -16.94],
        ],
        0.035,
        teal,
      );
    // A tiny warm light supports the glass without constructing a second orange portal.
    const glow = new THREE.PointLight("#f8ad60", 0.36, 4, 1.7);
    glow.position.set(0, 1.6, -16.9);
    g.add(glow);
    metadata.atomicRoom.floorHeight = (x, z) =>
      padSpecs.reduce(
        (height, [cx, cz, rx, rz], i) =>
          ((x - cx) / rx) ** 2 + ((z - cz) / rz) ** 2 < 1
            ? Math.max(height, 0.025 + i * 0.0175)
            : height,
        0,
      );
    routeMarks(g, "atomicRoom", metadata.atomicRoom.floorHeight);
    metadata.atomicRoom.entryLook = [-0.8, 1.55, -2.5];
    metadata.atomicRoom.contact = [0, 1.55, -16.15];
    metadata.atomicRoom.portal = {
      kind: "orange-glass",
      target: [0, 1.5, -17],
      approach: [0, 1.55, -16.15],
      look: [0, 1.5, -17],
      caption: "Touch the orange glass.",
      duration: 0,
    };
    metadata.atomicRoom.magnifierPosition = [0, 1.5, -17];
    // Very slow hue variation is restrained and never flashes.
    const original = colors.map((m) => m.color.clone());
    animate((t) =>
      colors.forEach((m, i) => {
        m.color
          .copy(original[i])
          .offsetHSL(Math.sin(t * 0.028 + i) * 0.016, 0, 0);
      }),
    );
  }
  return { rooms, metadata };
}


