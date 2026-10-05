import { EXHIBITS } from "./content.js?objects=12";

// Household castoffs become furniture; microscopic homes use material fragments.
export function furnishHomes(THREE, kit, rooms, metadata, order) {
  const { box, ball, cylinder, tube, plaque, material, mesh, keepSeparate } =
    kit;
  const { ceramicCup, cloth, pillow, lathe } = kit;
  const cream = material("#eed8ac"),
    purple = material("#873db9"),
    cork = material("#ad7950", { surface: "cork" });
  const paper = material("#eee0c8", { surface: "paper" }),
    silver = material("#b6adb8", { surface: "metal" }),
    pink = material("#d683a4");
  const ceramic = material("#eed8ac", { surface: "ceramic" });
  const graphite = material("#514459"),
    amber = material("#e6b055");
  function group(parent, x = 0, y = 0, z = 0) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    parent.add(g);
    return g;
  }
  function cap(g, x, y, z, r = 0.65) {
    cylinder(g, r, 0.16, [x, y, z], purple);
    cylinder(g, r * 0.85, 0.035, [x, y + 0.1, z], cream);
    for(const radius of [r*.7,r*.9]) tube(g,
      Array.from({length:33},(_,i)=>{const a=i/32*Math.PI*2;return [x+Math.sin(a)*radius,y+.122,z+Math.cos(a)*radius];}),
      .009,purple,true);
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI) / 8;
      box(
        g,
        [0.055, 0.14, 0.055],
        [x + Math.sin(a) * r, y, z + Math.cos(a) * r],
        cream,
        0.01,
      );
    }
  }
  const themes = [
    ["BOTTLE-CAP TABLE / PAPER-PACKET STORAGE","boxRoom"],
    ["SEAL-FRAGMENT TABLE / BEAD FITTINGS","jarRoom"],
    ["ERASER SEAT / GRAPHITE SUPPORT","pencilRoom"],
    ["CHASSIS BRACKET / IC SHELTER","matchRoom"],
    ["CONTACT TABLE / SOLDER BENCH","spoolRoom"],
    ["DIELECTRIC RIB / INSULATION SHELTER","fiberRoom"],
    ["CLEAVAGE PLANE / CRYSTAL FLAKE","dustRoom"],
    ["MOLECULAR BENCH / FILAMENT SUPPORT","atomicRoom"],
  ];
  order.forEach((id,i)=> {
    const p=metadata[id].path[2],before=metadata[id].path[1],after=metadata[id].path[3];
    const forward=new THREE.Vector3(after[0]-before[0],0,after[2]-before[2]).normalize();
    const right=new THREE.Vector3(-forward.z,0,forward.x);
    const anchor=new THREE.Vector3(...p).addScaledVector(right,id==="boxRoom"?-1.95:1.95);
    const home=group(rooms[id],anchor.x,0,anchor.z);home.name=`${id}-scale-furnishings`;
    home.rotation.y=Math.atan2(-forward.x,-forward.z);
    const table=group(home);
    if(id==="boxRoom") {
      cap(table,0,1,0);cylinder(table,.23,.85,[0,.47,0],cork);
      box(home,[1.25,.4,.7],[0,.24,-1.55],paper,.04);
      tube(home,[[0,.49,-1.8],[.15,.5,-2.05],[.25,.5,-2.2]],.018,cream);
      box(home,[.22,.03,.18],[.25,.51,-2.2],purple,.02);
    } else if(id==="jarRoom") {
      // A thin seal fragment folded into a stand; translucent beads fit its seams.
      box(table,[1.25,.035,.88],[0,1,0],silver,.01);
      for(const x of [-.48,.48])box(table,[.055,.96,.85],[x,.5,0],silver,.01);
      for(const x of [-.5,.5])ball(home,[x,.18,-1.55],[.2,.18,.2],purple);
      lathe(home,[[0,0],[.48,.02],[.68,.21],[.7,.5],[.65,.55],[.6,.24],[.43,.13],[0,.13]],[0,0,-1.55],cork,32);
    } else if(id==="pencilRoom") {
      box(table,[1.25,.11,.85],[0,1,0],graphite,.02);
      for(const x of [-.42,.42])mesh(table,new THREE.CylinderGeometry(.11,.13,.98,6),graphite,[x,.5,0]);
      box(home,[1.5,.45,.8],[0,.27,-1.55],pink,.1);
      for(let j=0;j<3;j++)box(home,[.02,.025,.81],[-.5+j*.5,.51,-1.55],cream,.004);
    } else if(id==="matchRoom") {
      box(table,[1.2,.1,.9],[0,1,0],silver,.025);
      for(const x of [-.5,.5])box(table,[.08,.98,.9],[x,.5,0],silver,.02);
      box(home,[1.2,.42,.72],[0,.24,-.6],graphite,.03);
      for(const side of [-1,1])for(let j=0;j<5;j++)tube(home,[[side*.6,.3,-.9+j*.14],[side*.8,.15,-.9+j*.14],[side*.8,.02,-.9+j*.14]],.025,silver);
    } else if(id==="spoolRoom") {
      const copper=material("#be7844",{surface:"metal"});
      box(table,[1.12,.08,.84],[0,1,0],copper,.02);
      box(table,[.26,.98,.5],[0,.5,0],graphite,.025);
      for(const x of [-.4,.4])ball(home,[x,.28,-1.55],[.28,.26,.34],silver);
      tube(home,[[-.55,.53,-1.55],[0,.55,-1.55],[.55,.53,-1.55]],.1,copper);
    } else if(id==="fiberRoom") {
      const dielectric=material("#98b8a1",{surface:"rubber"});
      box(table,[1.16,.13,.85],[0,1,0],dielectric,.07);
      box(table,[.42,.95,.68],[0,.5,0],dielectric,.05);
      lathe(home,[[.75,0],[.78,.15],[.68,.65],[.5,.82],[.44,.77],[.6,.6],[.68,.13],[.66,0]],[0,0,-.45],pink,32);
      for(const x of [-.7,.7])tube(home,[[x,.05,-.45],[x*.8,.5,-.45],[x*.5,.76,-.45]],.028,dielectric);
    } else if(id==="dustRoom") {
      const crystal=material("#bd98c2",{surface:"mineral"});
      mesh(table,new THREE.IcosahedronGeometry(.74,0),crystal,[0,.96,0],[0,.4,0]).scale.set(1,.17,.8);
      mesh(table,new THREE.OctahedronGeometry(.55,0),silver,[0,.46,0]).scale.set(.55,1,.65);
      mesh(home,new THREE.IcosahedronGeometry(.75,0),pink,[0,.24,-1.55],[.2,.3,0]).scale.set(1,.3,.7);
      for(let j=0;j<4;j++)mesh(home,new THREE.OctahedronGeometry(.18,0),crystal,[.5,.2+j*.19,-1.7]);
    } else if(id==="atomicRoom") {
      for(const x of [-.4,.4]) {
        ball(table,[x,.85,0],[.29,.2,.3],pink);
        tube(table,[[x,0,0],[x,.8,0]],.055,purple);
      }
      tube(table,[[-.55,1,0],[0,1.05,0],[.55,1,0]],.12,cream);
      for(let j=0;j<3;j++) {
        ball(home,[j*.32-.32,.42,-1.55],[.23,.2,.25],amber);
        tube(home,[[j*.32-.32,.08,-1.55],[j*.32-.32,.42,-1.55]],.035,purple);
      }
      tube(home,[[-.4,.5,-1.55],[0,.55,-1.55],[.4,.5,-1.55]],.065,pink);
    }
    // A paper corner visibly pokes out beneath the welcome mug.
    const originalIndex = themes.findIndex(theme => theme[1] === id);
    const ex = EXHIBITS[originalIndex % EXHIBITS.length];
    const noteLines = ex.body.match(/.{1,42}(?:\s|$)/g) || [ex.body];
    const card = plaque(
      home,
      [ex.title, ...noteLines.map((line) => line.trim())],
      [0, 1.12, 0.08],
      1.0,
      0.68,
      { back: paper, bg: "#eee0c8", width: 1024, height: 1024, titleSize: 54 },
    );
    card.rotation.x = -Math.PI / 2;
    const mug = keepSeparate(group(home, 0, 1.22, -0.1));
    mug.name = "mom-inc-welcome-mug";
    ceramicCup(mug, [0,0,0], ceramic, 1, true);
    box(home,[.82,.24,.06],[0,.68,.58],graphite,.02);
    for(const x of [-.3,.3])box(home,[.04,.62,.05],[x,.34,.55],graphite,.01);
    plaque(
      home,
      ["WELCOME HOME", "A GIFT FROM MOM INC"],
      [0, .68, .61],
      .8,
      .22,
      { titleSize: 52, back: graphite },
    );
    rooms[id].updateMatrixWorld(true);
    metadata[id].welcome = {
      position: home.localToWorld(new THREE.Vector3(0, 1.25, 0)).toArray(),
      mug,
      baseY: mug.position.y,
      exhibit: ex.id,
      theme: themes.find(theme => theme[1] === id)[0],
    };
  });
}
