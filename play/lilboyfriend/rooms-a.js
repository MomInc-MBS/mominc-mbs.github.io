/* Hand-authored domestic container interiors. No timers or scene ownership. */
export function buildInteriorsA(THREE, k) {
  const {
    mat,
    material,
    box,
    ball,
    tube,
    cylinder,
    plaque,
    lamp,
    rug,
    plant,
    bookStack,
    pillow,
    mesh,
    own,
    keepSeparate,
  } = k;
  const { ceramicCup, bowl, cloth, lathe } = k;
  const crockery = material("#dfcaae", {surface:"ceramic"});
  const glazedPlum = material("#784b91", {surface:"ceramic"});
  const rooms = {},
    metadata = {};
  const paper = material("#c99d65", { surface: "paper" });
  const cupWall = material("#c99d65", {
    side: THREE.DoubleSide,
    surface: "wood",
  });
  const paperLight = material("#e4c595", { surface: "paper" });
  const orange = material("#ca7644");
  const wood = material("#b98b55", { side: THREE.DoubleSide, surface: "wood" });
  const graphite = material("#43354b");
  const red = material("#c06e6a");
  const glass = material("#b0d1c3", {
    transparent: true,
    opacity: 0.1,
    roughness: 0.12,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const glassEdge = material("#8bb9a5", { roughness: 0.55 });
  const paleGlass = material("#d3e9c6", {
    transparent: true,
    opacity: 0.15,
    roughness: 0.7,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  function group(parent, pos = [0, 0, 0], rot = 0) {
    const g = new THREE.Group();
    g.position.set(...pos);
    g.rotation.y = rot;
    if (parent) parent.add(g);
    return g;
  }
  function polygonFloor(parent, points, color) {
    const shape = new THREE.Shape();
    points.forEach(([x, z], i) =>
      i ? shape.lineTo(x, -z) : shape.moveTo(x, -z),
    );
    shape.closePath();
    const floor = mesh(
      parent,
      new THREE.ExtrudeGeometry(shape, {
        depth: 0.23,
        bevelEnabled: true,
        bevelThickness: 0.035,
        bevelSize: 0.04,
        bevelSegments: 4,
        steps: 1,
      }),
      color,
      [0, -0.24, 0],
      [-Math.PI / 2, 0, 0],
    );
    floor.receiveShadow = true;
    return floor;
  }
  function wall(parent, points, heights, color, thickness = 0.25) {
    for (let i = 0; i < points.length - 1; i++) {
      const [x, z] = points[i],
        [xx, zz] = points[i + 1],
        h = Array.isArray(heights) ? heights[i] : heights;
      box(
        parent,
        [thickness, h, Math.hypot(xx - x, zz - z) + 0.13],
        [(x + xx) / 2, h / 2 - 0.03, (z + zz) / 2],
        color,
        0.11,
        Math.atan2(xx - x, zz - z),
      );
      box(
        parent,
        [thickness + 0.035, 0.17, Math.hypot(xx - x, zz - z)],
        [(x + xx) / 2, 0.14, (z + zz) / 2],
        mat.dark,
        0.04,
        Math.atan2(xx - x, zz - z),
      );
    }
  }
  function ring(parent, radius, y, centerZ, color, thick = 0.15) {
    const pts = Array.from({ length: 65 }, (_, i) => {
      const a = (i / 64) * Math.PI * 2;
      return [Math.sin(a) * radius, y, centerZ + Math.cos(a) * radius];
    });
    return tube(parent, pts, thick, color, true);
  }
  function roundFloor(parent, r = 9.5, centerZ = -8, color = mat.sand) {
    const f = cylinder(parent, r, 0.28, [0, -0.18, centerZ], color);
    f.receiveShadow = true;
    // The rear exit occupies a little ledge beyond the vessel's circular base.
    box(parent, [3.8, 0.24, 3.9], [0, -0.15, -18.4], color, 0.16);
  }
  function curvedShell(parent, r, h, centerZ, color, edge, wooden = false) {
    if(wooden) {
      lathe(parent,[[r-.08,.06],[r+.14,.12],[r+.22,.35],[r+.22,h-.22],
        [r+.14,h],[r-.02,h+.06],[r-.025,h-.08],[r-.025,.4],[r-.08,.06]],
        [0,0,centerZ],color,96);
      return;
    }
    // Thick heel, straight body, rounded shoulder and narrower threaded neck.
    const profile=[[r-.16,.06],[r,.12],[r+.12,.4],[r+.12,h-4.8],
      [r+.04,h-4.1],[r-.26,h-3.35],[r-1.1,h-2.7],[r-1.8,h-2.4],
      [r-1.9,h-2.1],[r-1.9,h-.1],[r-2.08,h],[r-2.25,h-.1],[r-2.25,h-2.15],
      [r-2.14,h-2.44],[r-1.12,h-2.92],[r-.32,h-3.6],[r-.2,h-4.25],[r-.2,.44],[r-.16,.06]];
    const glassMesh=mesh(parent,new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),96,.16,Math.PI*2-.32),color,[0,0,centerZ]);
    glassMesh.castShadow=false;
    // Glass continues above the chipped entrance: the break is a real lower opening.
    const upperProfile=[[r+.12,2.8],...profile.slice(3,-2),[r-.2,2.8]];
    const lip=mesh(parent,new THREE.LatheGeometry(upperProfile.map(p=>new THREE.Vector2(...p)),12,-.16,.32),color,[0,0,centerZ]);lip.castShadow=false;
    ring(parent,r-2.1,h,centerZ,color,.085);
    for(let y=h-1.8;y<h-.15;y+=.24) ring(parent,r-1.97,y,centerZ,color,.08);
    for(const side of [-1,1])tube(parent,[[side*1.83,.06,centerZ+r-.16],[side*1.69,.63,centerZ+r-.15],
      [side*1.95,1.24,centerZ+r-.18],[side*1.73,2.08,centerZ+r-.15],[side*1.83,2.8,centerZ+r-.16]],.045,edge);
    return;
  }
  function chair(parent, pos, rot = 0, color = mat.peach, scale = 1) {
    const c = group(parent, pos, rot);
    c.scale.setScalar(scale);
    box(c, [0.67, 0.13, 0.65], [0, 0.58, 0], color, 0.07);
    for(const x of [-.235,0,.235]) box(c,[.13,.6,.085],[x,.97,-.28],color,.035,x*.09);
    tube(c,[[-.29,1.24,-.28],[0,1.3,-.286],[.29,1.24,-.28]],.042,color);
    pillow(c,[0,.686,.025],.82,color);
    for (const x of [-0.24, 0.24])
      for (const z of [-0.23, 0.23])
        box(c, [0.09, 0.57, 0.09], [x, 0.28, z], mat.dark, 0.03);
    return c;
  }
  function table(
    parent,
    pos,
    size = [1.3, 0.12, 1.0],
    height = 0.95,
    color = mat.peach,
  ) {
    const t = group(parent, pos);
    box(t, size, [0, height, 0], color, 0.08);
    for (const x of [-size[0] * 0.38, size[0] * 0.38])
      for (const z of [-size[2] * 0.36, size[2] * 0.36])
        box(t, [0.12, height, 0.12], [x, height / 2, z], mat.dark, 0.045);
    return t;
  }
  function mug(parent, pos, color = mat.cream, scale = 1) {
    return ceramicCup(parent, pos, color === mat.cream ? crockery : color, scale * .55);
  }
  function kettle(parent, pos, scale = 1) {
    const g = group(parent, pos);
    g.scale.setScalar(scale);
    lathe(g, [[0,0],[.14,0],[.19,.026],[.235,.1],[.247,.23],[.224,.33],[.172,.4],[0,.4]], [0,0,0], glazedPlum);
    cylinder(g, 0.17, 0.07, [0, 0.43, 0], mat.lilac);
    ball(g, [0, 0.49, 0], [0.045, 0.055, 0.045], mat.dark);
    tube(
      g,
      [
        [-0.17, 0.24, 0],
        [-0.28, 0.39, 0],
        [-0.32, 0.44, 0],
      ],
      0.064,
      mat.purple,
    );
    tube(
      g,
      [
        [0.13, 0.36, 0],
        [0.36, 0.46, 0],
        [0.38, 0.12, 0],
        [0.16, 0.1, 0],
      ],
      0.036,
      mat.dark,
    );
    return g;
  }
  function shoes(parent, pos) {
    for (const x of [-0.15, 0.15]) {
      ball(parent, [pos[0] + x, 0.105, pos[2]], [0.12, 0.1, 0.25], mat.dark);
      box(
        parent,
        [0.13, 0.02, 0.12],
        [pos[0] + x, 0.18, pos[2] - 0.05],
        mat.cream,
        0.02,
      );
    }
  }
  function markers(parent, path) {
    // Small paper route stitches sit underfoot without forming an artificial rail.
    path.slice(1, -1).forEach(([x, y, z]) => {
      box(parent, [0.16, 0.016, 0.3], [x, 0.025, z], mat.lilac, 0.025);
    });
  }
  function register(id, room, label, scale, path, portal, entryLook) {
    room.name = id;
    rooms[id] = room;
    metadata[id] = {
      label,
      scale,
      path,
      entry: [0, 0, 1],
      exit: [0, 0, -17],
      entryLook,
      portal,
    };
    markers(room, path);
  }
  function ad(parent, words, pos, w = 2.4, h = 0.8, opts = {}) {
    const support=group(parent,pos,opts.rotation||0);
    box(support,[w+.06,h+.06,.07],[0,0,-.06],mat.dark,.025);
    if(pos[1]>h*.55) {
      for(const x of [-w*.32,w*.32])box(support,[.055,pos[1]-h*.45,.065],[x,-(pos[1]+h*.45)/2,-.085],mat.dark,.015);
      box(support,[w*.82,.08,.42],[0,-pos[1]+.04,-.1],mat.dark,.025);
    }
    return plaque(support, words, [0,0,0], w, h, {
      bg:"#e4c595",fg:"#4e3650",accent:"#865aaa",titleSize:64,...opts,rotation:0,
    });
  }

  function pencil(parent, pos, r = 0.65, h = 6, color = mat.gold, rot = 0) {
    const p = group(parent, pos, rot);
    mesh(p, new THREE.CylinderGeometry(r, r, h, 6, 1), color, [0, h / 2, 0]);
    mesh(p, new THREE.CylinderGeometry(0, r, h * 0.2, 6, 1), paperLight, [
      0,
      h + h * 0.1,
      0,
    ]);
    mesh(p, new THREE.CylinderGeometry(0, r * 0.27, h * 0.07, 6, 1), graphite, [
      0,
      h + h * 0.205,
      0,
    ]);
    cylinder(p, r * 1.02, 0.32, [0, 0.2, 0], mat.lilac);
    return p;
  }
  function brokenJar(parent, pos) {
    const j = keepSeparate(group(parent, pos));
    j.name = "next-cracked-jar";
    const jarGlass=material("#bad4d9",{surface:"glass", transparent:true,
      opacity:.22, roughness:.12, side:THREE.DoubleSide, depthWrite:false});
    const profile=[[1.52,.035],[1.68,.07],[1.72,.2],[1.72,2.95],
      [1.67,3.17],[1.42,3.37],[1.25,3.45],[1.25,3.85],
      [1.16,3.88],[1.15,3.46],[1.37,3.31],[1.6,3.1],[1.61,.21],[1.52,.035]];
    mesh(j,new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),72,.58,Math.PI*2-1.16),jarGlass).castShadow=false;
    const upper=[[1.72,2.35],...profile.slice(3,-2),[1.61,2.35]];
    mesh(j,new THREE.LatheGeometry(upper.map(p=>new THREE.Vector2(...p)),16,-.58,1.16),jarGlass).castShadow=false;
    for(const y of [3.52,3.64,3.76])ring(j,1.25,y,0,jarGlass,.035);
    for(const side of [-1,1]) {
      const points=[[side*.94,.035,1.43],[side*.86,.6,1.46],[side*1.01,1.11,1.4],
        [side*.9,1.65,1.43],[side*.94,2.35,1.43]];
      tube(j,points,.016,jarGlass);
      const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(.46,.05);shape.lineTo(.12,.35);shape.closePath();
      const shard=mesh(j,new THREE.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:false}),jarGlass,[side*1.95,.04,1.32],[-Math.PI/2,0,side*.5]);
      shard.castShadow=false;
    }
    // A fine curved specular strip is glass; it is not an opaque structural bar.
    const shine=material("#e7f8ff",{surface:"glass",transparent:true,opacity:.25,depthWrite:false});
    mesh(j,new THREE.CylinderGeometry(1.72,1.72,2.7,48,1,true,1.1,.08),shine,[0,1.52,0]).castShadow=false;
    const preview=pencilCup(j,[0,0,-.28]);preview.scale.setScalar(.22);
    ad(j, ["JAR SWEET JAR"], [0, 2.6, 1.65], 1.65, 0.37, {
      titleSize: 66,
      height: 256,
    });
    return j;
  }
  function pencilCup(parent, pos) {
    const c = keepSeparate(group(parent, pos));
    c.name = "next-pencil-cup";
    mesh(
      c,
      new THREE.CylinderGeometry(1.7, 1.53, 3.6, 40, 1, true),
      wood,
      [0, 1.8, 0],
    );
    cylinder(c, 1.56, 0.16, [0, 0.08, 0], paperLight);
    ring(c, 1.7, 3.6, 0, paperLight, 0.13);
    [
      [-0.7, 0, -0.85],
      [0.65, 0, -0.8],
      [0, 0, -1.05],
    ].forEach((p, i) =>
      pencil(
        c,
        p,
        0.23,
        4.3 + i * 0.46,
        i === 1 ? mat.lilac : mat.gold,
        i * 0.4,
      ),
    );
    for (const side of [-1, 1])
      tube(
        c,
        [
          [side * 0.43, 0.05, 2.55],
          [side * 0.43, 3.8, 1.75],
        ],
        0.075,
        mat.dark,
      );
    for (let i = 0; i < 9; i++) {
      const y = 0.21 + i * 0.42,
        z = 2.55 - (y / 3.8) * 0.8;
      box(c, [0.94, 0.09, 0.14], [0, y, z], paperLight, 0.035);
    }
    // The rear inner ladder makes the descent legible from above the mouth.
    for (const side of [-1, 1])
      tube(
        c,
        [
          [side * 0.32, 0.15, 1.45],
          [side * 0.32, 3.68, 1.55],
        ],
        0.046,
        mat.dark,
      );
    for (let i = 0; i < 8; i++)
      box(
        c,
        [0.73, 0.06, 0.1],
        [0, 0.25 + i * 0.45, 1.45 + i * 0.014],
        paperLight,
        0.025,
      );
    return c;
  }
  function voiceRecorder(parent, pos) {
    const m = keepSeparate(group(parent, pos));
    m.name = "next-electronic-voice-recorder";
    const shell=material("#353545",{surface:"metal"}), grille=material("#9ba5ae",{surface:"metal"});
    const dark=material("#0a101b"), screen=material("#80c9c0",{emissive:"#285e65",emissiveIntensity:.45});
    // Rounded perimeter and rear leave a genuine hollow cavity behind the grille.
    box(m,[3.35,.2,4],[0,.1,-.55],shell,.095);
    box(m,[3.35,.2,4],[0,1.42,-.55],shell,.095);
    for(const x of [-1.56,1.56])box(m,[.22,1.38,4],[x,.76,-.55],shell,.09);
    box(m,[3.16,1.35,.18],[0,.75,-2.47],shell,.08);
    const face=new THREE.Shape();face.moveTo(-1.45,.2);face.lineTo(1.45,.2);face.lineTo(1.45,1.31);face.lineTo(-1.45,1.31);face.closePath();
    for(let row=0;row<4;row++)for(let col=0;col<11;col++) {
      const x=(col-5)*.245,y=.34+row*.25;
      if(Math.hypot(x,y-.7)<.49)continue;
      const hole=new THREE.Path();hole.absarc(x,y,.065,0,Math.PI*2,true);face.holes.push(hole);
    }
    const entry=new THREE.Path();entry.absarc(0,.7,.36,0,Math.PI*2,true);face.holes.push(entry);
    const panel=mesh(m,new THREE.ExtrudeGeometry(face,{depth:.18,bevelEnabled:true,bevelSize:.018,bevelThickness:.018,bevelSegments:3,curveSegments:20}),grille,[0,0,1.3]);
    panel.name="perforated-recorder-grille-with-entry";
    // An open tube gives the selected microphone hole a visible interior wall.
    mesh(m,new THREE.CylinderGeometry(.36,.36,.62,32,1,true),grille,[0,.7,1.08],[Math.PI/2,0,0]);
    box(m,[2.92,1.1,.08],[0,.75,-2.33],dark,.025);
    box(m,[1.77,.04,1.1],[0,1.535,-1.33],dark,.08);
    box(m,[1.52,.018,.82],[0,1.565,-1.33],screen,.035);
    for(let i=0;i<12;i++)box(m,[.035,.015,.17+Math.sin(i*2)*.12],[-.64+i*.116,1.58,-1.33],dark,.006);
    for(const [x,c] of [[-.85,red],[0,grille],[.85,grille]])cylinder(m,.17,.07,[x,1.56,.15],c);
    const label=plaque(m,["VOICE RECORDER"],[0,1.535,-.43],2.1,.24,{titleSize:48,bg:"#353545",fg:"#d8e1e4"});
    label.rotation.x=-Math.PI/2;
    m.userData.aperture={center:[0,.7,1.39],radius:.36,depth:.62};
    return m;
  }
  function spool(parent, pos) {
    const s=keepSeparate(group(parent,pos));s.name="next-electrical-coil";
    const enamel=material("#ae5d32",{surface:"metal"}),bobbin=material("#32344a");
    mesh(s,new THREE.CylinderGeometry(.51,.51,2.8,32,1,true),bobbin,[0,0,0],[Math.PI/2,0,0]);
    for(const z of [-1.25,1.25])mesh(s,new THREE.RingGeometry(.51,1.15,48),bobbin,[0,0,z]);
    const turns=[];for(let i=0;i<=640;i++){const t=i/640,a=t*Math.PI*2*22;turns.push([Math.sin(a)*1.04,Math.cos(a)*1.04,-1.18+t*2.36]);}
    tube(s,turns,.052,enamel);
    for(const side of [-1,1]) {
      box(s,[.25,.3,.8],[side*.87,-.91,0],bobbin,.05);
      tube(s,[[side*.86,-.87,0],[side*1.27,-.95,0],[side*1.6,-.95,.7]],.06,enamel);
    }
    const ramp=box(parent,[.75,.12,1.5],[0,.37,-17.3],bobbin,.055);ramp.rotation.x=.4;
    return s;
  }
  function spongeBed(parent,pos) {
    const bed=group(parent,pos);bed.name="cut-sponge-bed";
    const sponge=material("#d7c779",{surface:"cork"});
    box(bed,[2.2,.55,3],[0,.36,0],sponge,.06);
    box(bed,[2.2,.16,3],[0,.12,0],material("#71917b"),.035);
    for(let i=0;i<30;i++)ball(bed,[(i%10)*.21-.95,.2+Math.floor(i/10)*.16,1.49],[.035,.032,.013],mat.dark);
    box(bed,[2.17,.08,1.8],[0,.69,.4],mat.lilac,.04);pillow(bed,[0,.75,-.92],1.8,mat.peach);
    cloth(bed,[.14,.72,.5],1.8,1.8,mat.lilac,0,5);
    return bed;
  }

  // THE STARTER BOX: a genuinely folded, narrowing polygon, with two detours.
  {
    const r = group();
    const outline = [
      [-4.5, 2],
      [4, 2],
      [5, -8],
      [2.5, -21.4],
      [-3.8, -21.4],
      [-5.5, -5],
    ];
    polygonFloor(r, outline, paperLight);
    wall(
      r,
      [
        [-4.5, 2],
        [-5.5, -5],
        [-3.8, -21.4],
      ],
      [5.3, 4.3],
      paper,
    );
    wall(
      r,
      [
        [4, 2],
        [5, -8],
        [2.5, -21.4],
      ],
      [5.1, 3.9],
      paper,
    );
    wall(
      r,
      [
        [-3.8, -21.4],
        [2.5, -21.4],
      ],
      3.8,
      paper,
    );
    // Lifted front flap and inward rear folds replace a flat hallway ceiling.
    const flap = box(
      r,
      [8.8, 0.18, 5.5],
      [-0.15, 5.25, -0.5],
      paperLight,
      0.08,
    );
    flap.rotation.z = -0.12;
    flap.rotation.x = 0.17;
    const fold = box(r, [7.4, 0.18, 9.5], [-0.2, 4.55, -15], paper, 0.08);
    fold.rotation.x = -0.12;
    fold.rotation.z = 0.1;
    spongeBed(r,[.6,0,-4.1]);
    const brace=group(r,[-4.58,0,-7]);brace.name="matchstick-bracing-wall";
    for(let i=0;i<10;i++) {
      const z=-i*.42;
      box(brace,[.15,2.8,.15],[0,1.4,z],paperLight,.025);
      ball(brace,[0,2.87,z],[.15,.2,.15],red);
    }
    tube(brace,[[0,.3,.1],[0,2.4,-3.9]],.075,paperLight);
    for(let i=0;i<3;i++) {
      box(r,[1.15,.52,1.5],[3.2,.3+i*.52,-3.2],paperLight,.045);
      ad(r,["PAPER PACKET"],[3.2,.3+i*.52,-2.43],.85,.19,{titleSize:36});
    }
    ad(r, ["ONE ROOM.", "INFINITE POTENTIAL."], [-4.85, 2.6, -6.5], 2.4, 0.9, {
      rotation: Math.PI / 2,
    });
    ad(r, ["YOUR NEXT HOME", "IS ALREADY HERE"], [3.7, 2.6, -12.1], 2.6, 0.95, {
      rotation: -Math.PI / 2,
    });
    ad(r, ["THE STARTER BOX"], [0, 3.22, -19.78], 3.2, 0.52, {
      small: "MOM RESIDENTIAL SOLUTIONS",
      titleSize: 68,
    });
    const object = brokenJar(r, [0, 0, -19.2]);
    register(
      "boxRoom",
      r,
      "CARDBOARD BOX",
      "1 : 24",
      [
        [0, 0, 1],
        [-1.8, 0, -2.5],
        [-2.2, 0, -5.5],
        [1.8, 0, -8.5],
        [2.1, 0, -11.5],
        [0, 0, -14.5],
        [0, 0, -17],
      ],
      {
        kind: "broken-glass",
        object,
        target: [0, 0.22, -18.3],
        approach: [0, 0.52, -17.3],
        look: [0, 0.35, -19.6],
        caption: "A missing piece of glass. A smaller way in.",
        duration: 3.5,
      },
      [-1, 1.55, -3],
    );
  }

  // THE GLASS HOUSE: circular, cloudy, privacy-free; the cup ladder is physical.
  {
    const r = group();
    const glassBase=material("#c3dadc", {surface:"glass", transparent:true,
      opacity:.3, roughness:.12, clearcoat:1, depthWrite:false});
    roundFloor(r, 11.5, -10, glassBase);
    curvedShell(r, 11.5, 25.8, -10, glass, glassEdge);
    for (let i = 0; i < 8; i++) {
      const a = ((i + 0.5) / 8) * Math.PI * 2;
      ball(
        r,
        [Math.sin(a) * 10.8, 2.1, -10 + Math.cos(a) * 10.8],
        [0.15, 2.2, 0.45],
        paleGlass,
      );
    }
    const seed=group(r,[0,0,-6]);seed.name="seed-shell-sleeping-nook";
    const shell=material("#946748",{surface:"wood"});
    lathe(seed,[[0,0],[.7,.02],[1.15,.25],[1.28,.65],[1.1,.9],[1.02,.85],[1.15,.61],[1.02,.3],[.65,.15],[0,.15]],[0,0,0],shell,36);
    seed.scale.set(1,1,1.8);box(seed,[1.25,.13,1.65],[0,.25,0],paperLight,.08);
    const foil=material("#b9bbbe",{surface:"metal"});
    for(const pos of [[7.1,0,-7],[-6,0,-9],[5.5,0,-12.5]]) {
      const f=group(r,pos);f.name="folded-foil-fragment";
      box(f,[1.35,.06,1.1],[0,.7,0],foil,.02);
      for(const x of [-.53,.53])box(f,[.08,.7,1.1],[x,.35,0],foil,.015);
      ball(f,[0,.84,0],[.19,.16,.19],glazedPlum);
    }
    box(r,[2.4,.09,1.5],[-7,.08,-3.8],material("#baa482",{surface:"paper"}),.035,.35);
    for(let i=0;i<7;i++)ball(r,[-5.8+i*.22,.16,-3.8],[.065,.065,.065],glazedPlum);
    ad(r,["PRIVACY, REDUCED."],[-6,2.3,-8.83],1.75,.7,{rotation:.4});
    ad(r,["A CLEARER FUTURE.","A SMALLER YOU."],[-6.6,3,-14],3,1,{rotation:.75});
    ad(r,["WHY KEEP SPACE","YOU COULD GIVE BACK?"],[6.8,3.2,-13.5],3,1,{rotation:-.8});
    const object = pencilCup(r, [0, 0, -19.2]);
    register(
      "jarRoom",
      r,
      "GLASS JAR",
      "A HOME WITHIN A HOME",
      [
        [0, 0, 1],
        [-2.8, 0, -2],
        [-3.5, 0, -6],
        [-2.3, 0, -9],
        [2.5, 0, -12],
        [2.2, 0, -14.5],
        [0, 0, -17],
      ],
      {
        kind: "ladder-over-rim",
        object,
        ladder: {
          centerZ: -19.2,
          bottomOffset: 2.55,
          topOffset: 1.75,
          height: 3.8,
        },
        target: [0, 4.25, -19.2],
        approach: [0, 4.1, -18.3],
        look: [0, 1.2, -19.4],
        caption: "The ladder continues over the rim and down inside.",
        duration: 4.8,
      },
      [-2.8, 1.55, -2],
    );
  }

  // THE PRODUCTIVE HOME: a crescent around giant pencils, open to daylight.
  {
    const r = group();
    roundFloor(r, 12, -10, wood);
    curvedShell(r, 12, 20.8, -10, cupWall, paperLight, true);
    for (const [p, rad, h, c] of [
      [[0, 0, -6], 1.05, 28.1, mat.gold],
      [[-1.65, 0, -7.5], 0.85, 30, mat.lilac],
      [[1.25, 0, -4.2], 0.7, 26.3, orange],
    ])
      pencil(r, p, rad, h, c, 0.2);
    const eraser=material("#db99a6",{surface:"rubber"});
    box(r,[2.8,.65,1.25],[-4.2,.36,-3.5],eraser,.14);
    for(let i=0;i<4;i++)box(r,[.025,.04,1.27],[-5.1+i*.58,.7,-3.5],paperLight,.012);
    for(const [x,z] of [[6.5,-10],[-4.7,-12],[-4,-10]]) {
      const shaving=group(r,[x,0,z]);shaving.name="curled-pencil-shaving";
      lathe(shaving,[[1.15,0],[1.3,.18],[.98,.48],[.58,.72],[.4,1.02],[.44,1.04],[.64,.73],[1.04,.51],[1.36,.19],[1.2,0]],[0,0,0],paperLight,40);
      shaving.rotation.z=.12;
      tube(shaving,[[1.2,.08,0],[1.03,.5,0],[.6,.74,0],[.42,1,0]],.045,orange);
    }
    for(let i=0;i<5;i++)mesh(r,new THREE.CylinderGeometry(.18,.24,1.3,6),graphite,[-5.8+i*.48,.2,-9],[0,0,Math.PI/2]);
    ad(
      r,
      ["PRODUCTIVE RESIDENTS", "REQUIRE LESS ROOM"],
      [5.55, 3.7, -14.3],
      3.6,
      1.15,
      { rotation: -0.8 },
    );
    ad(r, ["THE PRODUCTIVE HOME"], [-5.1, 3.4, -14.8], 3.1, 0.58, {
      rotation: 0.8,
      titleSize: 62,
    });
    const object = voiceRecorder(r, [0, 0, -19]);
    register(
      "pencilRoom",
      r,
      "PENCIL CUP",
      "SMALLER STILL",
      [
        [0, 0, 1],
        [3, 0, -2],
        [4, 0, -6],
        [3.8, 0, -10],
        [1.8, 0, -13],
        [0, 0, -15],
        [0, 0, -17],
      ],
      {
        kind: "recorder-grille",
        object,
        target: [0, 0.7, -18.12],
        approach: [0, 0.7, -17.15],
        look: [0, 0.7, -20.4],
        caption: "A perforated microphone grille. Enter the dark hole.",
        duration: 3.4,
      },
      [3, 1.55, -2],
    );
  }

  // THE FLEXIBLE ADDRESS: a stepped tray, giant matches and a sagging sleeve.
  {
    const r = group();
    const outline = [
      [-4, 2],
      [3.5, 2],
      [3.5, -5],
      [4.8, -5],
      [4.8, -12.85],
      [2.4, -12.85],
      [2.4, -21.1],
      [-4, -21.1],
    ];
    polygonFloor(r, outline, material("#426d5b",{surface:"rubber"}));
    wall(
      r,
      [
        [-4, 2],
        [-4, -21.1],
      ],
      4.25,
      material("#7f909b",{surface:"metal"}),
    );
    wall(
      r,
      [
        [3.5, 2],
        [3.5, -5],
        [4.8, -5],
        [4.8, -12.85],
        [2.4, -12.85],
        [2.4, -21.1],
      ],
      [4.4, 4.4, 3.85, 3.65, 3.1],
      material("#7f909b",{surface:"metal"}),
    );
    wall(
      r,
      [
        [-4, -21.1],
        [2.4, -21.1],
      ],
      3.1,
      material("#7f909b",{surface:"metal"}),
    );
    for (const [size, pos, rot] of [
      [[7.6, 0.17, 7], [0, 4.25, -6.3], 0.06],
      [[8.6, 0.17, 7.5], [0.4, 3.7, -11.5], -0.045],
      [[6.9, 0.17, 6.3], [-0.7, 3.16, -17.3], 0.045],
    ]) {
      const roof = box(r, size, pos, material("#677a86",{surface:"metal"}), 0.075);
      roof.rotation.z = rot;
    }
    const copper=material("#b66e3c",{surface:"metal"}),pcb=material("#406e61"),steel=material("#85939c",{surface:"metal"});
    for(let i=0;i<12;i++)tube(r,[[-3.7,.025,-1-i*1.5],[-1.9,.025,-1-i*1.5],[-1.9,.025,-1.4-i*1.5],[3.3,.025,-1.4-i*1.5]],.035,copper);
    for(const [x,z] of [[-3,-8.2],[3.8,-6.4],[-3,-15.2]]) {
      const chip=group(r,[x,0,z]);chip.name="integrated-circuit-shelter";
      box(chip,[1.25,.65,2.0],[0,.35,0],mat.dark,.045);
      for(const side of [-1,1])for(let i=0;i<7;i++)tube(chip,[[side*.63,.3,-.8+i*.26],[side*.86,.22,-.8+i*.26],[side*.86,.025,-.8+i*.26]],.028,steel);
    }
    for(const [x,z] of [[-3.7,-3],[4,-11],[-3.4,-17]]) {
      cylinder(r,.48,1.55,[x,.8,z],steel);cylinder(r,.49,.04,[x,1.59,z],mat.dark);
      tube(r,[[x-.16,1.63,z],[x+.16,1.63,z]],.018,steel);
    }
    const bracket=group(r,[-3.1,0,-12]);box(bracket,[1.35,.1,.8],[0,.8,0],steel,.035);
    for(const x of [-.6,.6])box(bracket,[.12,.8,.8],[x,.4,0],steel,.025);
    ad(r,["YOUR ADDRESS","IS A CIRCUIT."],[-3.73,2.5,-14.1],3.1,.95,{rotation:Math.PI/2});
    ad(r,["RESIDENTIAL","COMPRESSION UNIT"],[4.58,2.6,-8.5],3.7,1.15,{rotation:-Math.PI/2});
    const object = spool(r, [0, 1.2, -19.1]);
    register(
      "matchRoom",
      r,
      "RECORDER INTERIOR",
      "ROOM TO REDUCE",
      [
        [0, 0, 1],
        [-2, 0, -2.8],
        [-2, 0, -5],
        [2.4, 0, -8],
        [2.4, 0, -11],
        [-1.4, 0, -13.5],
        [0, 0, -15.5],
        [0, 0, -17],
      ],
      {
        kind: "spool-bore",
        object,
        target: [0, 1.2, -19.1],
        approach: [0, 1.65, -17.9],
        look: [0, 1.2, -20.5],
        caption: "The hollow center is the only room left.",
        duration: 3.5,
      },
      [-2, 1.55, -3],
    );
  }
  return { rooms, metadata };
}
