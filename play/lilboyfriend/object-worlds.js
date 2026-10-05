// Scale cues and object construction. Every detail stays outside the authored walk curve.
export function rebuildObjectWorlds(T, k, rooms, metadata) {
  const {box, mesh, tube, cylinder, material, own, lathe, animate}=k;
  const v=(x,y,z)=>new T.Vector3(x,y,z);
  const paper=material('#dcc6a2',{surface:'paper'}), cut=material('#98714d',{surface:'paper'});
  const cream=material('#f3e6cd',{surface:'paper'}), ink=material('#4b5369');
  const silver=material('#adbcc8',{surface:'metal',metalness:.6,roughness:.35});
  const tape=material('#d1b382',{surface:'paper',transparent:true,opacity:.72,depthWrite:false});
  const paleWood=material('#d4b888',{surface:'wood'});
  const fiber=material('#b3a082',{surface:'paper'});
  function group(parent,name,pos=[0,0,0]) {const g=new T.Group();g.name=name;g.position.set(...pos);parent.add(g);return g;}
  function label(parent,words,pos,w,h,rot=0,color='#574e4a',bg='#e6d2b3') {
    const c=document.createElement('canvas');c.width=1024;c.height=512;
    const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,1024,512);
    ctx.fillStyle=color;ctx.strokeStyle=color;ctx.lineWidth=5;
    ctx.strokeRect(28,28,968,456);ctx.textAlign='center';ctx.textBaseline='middle';
    words.forEach((word,i)=>{ctx.font=`${i===0?'700':'400'} ${words.length>2?74:100}px sans-serif`;ctx.fillText(word,512,(i+.5)*440/words.length+36,910)});
    const map=own(new T.CanvasTexture(c));map.colorSpace=T.SRGBColorSpace;
    const mat=own(new T.MeshBasicMaterial({map,side:T.DoubleSide}));
    return mesh(parent,new T.PlaneGeometry(w,h),mat,pos,[0,rot,0]);
  }
  function plate(parent,points,mat) {
    const g=new T.BufferGeometry(),positions=[],indices=[];
    points.forEach(p=>positions.push(...p));for(let i=1;i<points.length-1;i++)indices.push(0,i,i+1);
    g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();
    return mesh(parent,g,mat);
  }
  function loop(parent,radius,y,z,mat,r=.025,rx=radius) {
    return tube(parent,Array.from({length:81},(_,i)=>{const a=i/80*Math.PI*2;return [Math.sin(a)*rx,y,z+Math.cos(a)*radius]}),r,mat,true);
  }
  function arc(parent,r,centerZ,y,a0,a1,mat,thick=.045) {
    return tube(parent,Array.from({length:65},(_,i)=>{const a=a0+(a1-a0)*i/64;return [Math.sin(a)*r,y,centerZ+Math.cos(a)*r]}),thick,mat);
  }
  function clip(parent,pos,scale=1,rot=0) {
    const g=group(parent,'bent-steel-paperclip',pos);g.scale.setScalar(scale);g.rotation.y=rot;
    tube(g,[[-.25,0,.45],[-.25,0,-.48],[-.2,0,-.68],[0,0,-.77],[.24,0,-.64],[.29,0,-.44],
      [.29,0,.51],[.2,0,.69],[-.04,0,.7],[-.18,0,.54],[-.18,0,-.33],[-.1,0,-.49],[.06,0,-.49],[.14,0,-.35],[.14,0,.38]],.025,silver);
    return g;
  }
  function corrugatedEdge(parent,a,b,h) {
    const length=Math.hypot(b[0]-a[0],b[1]-a[1]),g=group(parent,'exposed-cardboard-flutes',[(a[0]+b[0])/2,h,(a[1]+b[1])/2]);
    g.rotation.y=Math.atan2(b[0]-a[0],b[1]-a[1]);
    for(const x of [-.11,.11]) box(g,[.018,.16,length],[x,0,0],cream,.001);
    const wave=Array.from({length:Math.ceil(length*11)+1},(_,i)=>[Math.sin(i*Math.PI)*.075+.035*Math.cos(i*Math.PI),.005,-length/2+i*length/Math.ceil(length*11)]);
    tube(g,wave,.014,cut);
  }
  // BOX: cut cardboard laminations, packing print, crease seams, adhesive and loose fibers.
  {
    const g=rooms.boxRoom;
    const couch=g.getObjectByName('tea-packet-seat');
    if(couch) {
      couch.clear();
      box(couch,[2.22,.35,.88],[0,.38,0],cream,.03);
      const folded=box(couch,[2.22,.57,.16],[0,.79,-.36],cream,.02);folded.rotation.x=-.08;
      for(const x of [-1.06,1.06]) {
        tube(couch,[[x,.22,.41],[x,.58,.41],[x,.56,-.39],[x,1.02,-.4]],.012,cut);
        for(let z=-.36;z<.38;z+=.08)box(couch,[.13,.011,.04],[x,.563,z],paper,.001);
      }
      const pouch=label(couch,['MOM','CHAMOMILE'],[0,.566,.02],1.15,.5,0,'#6f6e58','#ede5cf');pouch.rotation.x=-Math.PI/2;
      tube(couch,[[.65,.55,.33],[.76,.2,.42],[.85,.075,.45]],.012,fiber);
      const tag=label(couch,['MOM TEA'],[.85,.065,.43],.24,.15);tag.rotation.x=-Math.PI/2;
    }
    for(const [a,b,h] of [[[-4.5,2],[-5.5,-5],5.25],[[-5.5,-5],[-3.8,-21.4],4.25],[[4,2],[5,-8],5.05],[[5,-8],[2.5,-21.4],3.86]])corrugatedEdge(g,a,b,h);
    for(const [x,z,y,angle] of [[-5.13,-8.3,1.65,.105],[4.08,-12.5,1.7,-.18]]) {
      const seam=group(g,'fold-and-taped-cardboard-seam',[x,y,z]);seam.rotation.y=angle;
      box(seam,[.012,3.1,.035],[0,0,0],cut,.001);
      const patch=box(seam,[.018,.45,1.1],[x<0?.045:-.045,.35,0],tape,.001);patch.rotation.x=.09;
    }
    label(g,['MOM RESIDENTIAL','HANDLE WITH CARE','THIS SIDE UP ↑'],[-4.7,2.4,-10.5],3.0,1.65,Math.PI/2);
    label(g,['24 × SMALLER','PACKED FOR YOU'],[3.82,2.6,-12.6],2.5,1.1,-Math.PI/2);
    const shipping=group(g,'discarded-shipping-label',[-3.1,.016,-14.6]);
    const sheet=label(shipping,['MOM / 024','RESIDENTIAL DELIVERY'],[0,0,0],1.7,1);sheet.rotation.x=-Math.PI/2;
    for(let i=0;i<28;i++)box(shipping,[.012+.003*(i%3),.003,.25],[-.68+i*.047,.006,.19],ink,.001);
    clip(g,[-3.4,.08,-9.8],1.8,.4);
    for(let i=0;i<16;i++)tube(g,[[-4.17, .11, -13-i*.21],[-4.02,.16,-13.05-i*.21],[-3.95,.1,-13.14-i*.21]],.008,fiber);
  }
  // JAR: actual glass thickness and curved light, with giant objects outside the vessel.
  {
    const g=rooms.jarRoom;
    const glass=own(new T.MeshPhysicalMaterial({color:'#bbd5da',transparent:true,opacity:.12,
      roughness:.12,metalness:0,side:T.DoubleSide,depthWrite:false,clearcoat:1}));
    const shine=own(new T.MeshBasicMaterial({color:'#eefcff',transparent:true,opacity:.15,side:T.DoubleSide,depthWrite:false}));
    const profile=[[11.12,.055],[11.3,.1],[11.45,.21],[11.54,.38],[11.55,.52]];
    mesh(g,new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),96,.17,Math.PI*2-.34),glass,[0,0,-10]).castShadow=false;
    for(const side of [-1,1]) {
      const a=side<0?4.18:1.04;
      const band=mesh(g,new T.CylinderGeometry(11.47,11.47,4.85,72,1,true,a,.065),shine,[0,2.95,-10]);band.castShadow=false;band.renderOrder=3;
      const band2=mesh(g,new T.CylinderGeometry(11.45,11.45,4.9,72,1,true,a+.1,.024),shine,[0,2.95,-10]);band2.castShadow=false;
    }
    for(let y=5.45;y<5.8;y+=.11)arc(g,11.38,-10,y,.17,Math.PI*2-.17,glass,.045);
    // Exterior is a tabletop at normal human scale relative to this now-enormous jar.
    const outside=group(g,'giant-tabletop-beyond-glass');
    const desktop=box(outside,[78,.24,78],[0,-.39,-10],paleWood,.001);desktop.receiveShadow=true;
    const mug=group(outside,'enormous-mug-outside-jar',[-21,0,-13]);
    lathe(mug,[[0,0],[5.2,0],[5.5,.3],[5.7,14],[5.7,14.3],[5.1,14.3],[5.1,.75],[0,.75]],[0,0,0],material('#e3ded2',{surface:'ceramic'}),72);
    tube(mug,[[5.5,11,0],[9,11,0],[10,7,0],[9,3,0],[5.5,3,0]],.7,cream);
    label(mug,['MOM','COFFEE'],[0,8,5.72],6,4);

    const pencil=group(outside,'giant-pencil-outside-jar',[19,1.1,2]);pencil.rotation.z=-Math.PI/2;pencil.rotation.y=.4;
    mesh(pencil,new T.CylinderGeometry(.8,.8,23,6),material('#cda54d'),[0,12,0]);
    mesh(pencil,new T.ConeGeometry(.8,3,6),paleWood,[0,25,0]);
    mesh(pencil,new T.ConeGeometry(.23,1,6),ink,[0,26.8,0]);
    label(g,['MASON','WIDE MOUTH'],[-9.72,3,-15.9],4.1,1.8,1.0,'#b9d0d0','#a1bfc1');
    // Convex droplets cling to the inner surface, well outside the furniture and route.
    const droplets=own(new T.SphereGeometry(1,12,8));
    const beads=new T.InstancedMesh(droplets,glass,36);const dummy=new T.Object3D();
    for(let i=0;i<36;i++){const a=.55+i*.147,y=.55+(i*1.37)%4.55;dummy.position.set(Math.sin(a)*11.35,y,-10+Math.cos(a)*11.35);dummy.scale.set(.08+(i%4)*.018,.11+(i%3)*.025,.055);dummy.lookAt(0,y,-10);dummy.updateMatrix();beads.setMatrixAt(i,dummy.matrix)}
    beads.instanceMatrix.needsUpdate=true;beads.castShadow=false;g.add(beads);
    metadata.jarRoom.background='#d5dfe2';
  }
  // PENCIL CUP: a turned wooden vessel, lacquered pencils, crimped ferrules and shavings.
  {
    const g=rooms.pencilRoom;
    for(const [x,z,r,h,color] of [[0,-6,1.05,28.1,'#d4b352'],[-1.65,-7.5,.85,30,'#779f9a'],[1.25,-4.2,.7,26.3,'#cf8560']]) {
      const lacquer=material(color); const p=group(g,'pencil-manufacturing-details',[x,0,z]);
      cylinder(p,r*1.028,.66,[0,.34,0],silver);
      for(let y=.1;y<.68;y+=.11)loop(p,r*1.035,y,0,silver,.018);
      cylinder(p,r*.96,.3,[0,.04,0],material('#cda29e',{surface:'felt'}));
      label(p,['MOM • No. 2','HB / GRAPHITE'],[0,4,r+.008],r*1.1,1.65,0,'#514d44',color);
      for(let side=0;side<6;side++) {
        const a=side*Math.PI/3+.2;
        tube(p,[[Math.sin(a)*r*.99,.8,Math.cos(a)*r*.99],[Math.sin(a)*r*.99,h-.04,Math.cos(a)*r*.99]],.007,cream);
      }
      // Lacquer's worn lower edge, not a new obstacle.
      for(let side=0;side<3;side++){const a=side*2.1;tube(p,[[Math.sin(a)*r,.82,Math.cos(a)*r],[Math.sin(a)*r,.97,Math.cos(a)*r]],.025,paleWood)}
    }

    for(let i=0;i<9;i++) {
      const shave=group(g,'curled-pencil-shaving',[6.9+(i%3)*.25,.08,-12.5+i*.24]);shave.rotation.y=i*.7;
      const path=Array.from({length:25},(_,j)=>{const a=j/24*Math.PI*2.7,r=.17+j*.005;return [Math.cos(a)*r,.03+j*.012,Math.sin(a)*r]});
      tube(shave,path,.036,paleWood);tube(shave,path.map(p=>[p[0]*1.13,p[1],p[2]*1.13]),.009,material(i%2?'#8b647a':'#d4ad5e'));
    }
    label(g,['TURNED BEECH','DESK ORGANIZER'],[-10.5,3.9,-14.4],3.4,1.4,1.15);
    metadata.pencilRoom.background='#dfe6df';
  }

  // Electronic construction belongs to authored recorder/coil/cable rooms.
  metadata.matchRoom.background='#263b38';
  metadata.spoolRoom.background='#273041';
  metadata.fiberRoom.background='#202c40';
  // WIRE MICROENVIRONMENT: the bore has a manufactured, used material history.
  // All detail is attached to the sides/top, leaving the entire walk curve clear.
  {
    const g=rooms.fiberRoom,route=new T.CatmullRomCurve3(metadata.fiberRoom.path.map(p=>new T.Vector3(...p)),false,'centripetal');
    const copper=material('#c88c60',{surface:'metal',metalness:.77,roughness:.34});
    const oxide=material('#527e72',{surface:'metal',metalness:.25,roughness:.97});
    const dielectric=material('#667284',{roughness:.93});
    const rubber=material('#1d2737',{surface:'rubber'});
    for(const side of [-1,1])for(let strand=0;strand<5;strand++){
      const angle=strand*.62;
      const points=Array.from({length:53},(_,i)=>{
        const u=i/52,p=route.getPoint(u),twist=u*Math.PI*2.6+angle;
        return [p.x+side*3.9+Math.sin(twist)*.30,2.83+Math.cos(twist)*.12,p.z];
      });
      tube(g,points,.023,copper).name='fine-twisted-copper-strand';
    }
    // Cross-section ribs expose alternating insulation layers above head height.
    for(let i=0;i<11;i++){
      const p=route.getPointAt(.04+i*.086);
      const points=Array.from({length:31},(_,j)=>{const a=-1.95+j/30*3.9;return [p.x+Math.sin(a)*4.88,3.1+Math.cos(a)*2.86,p.z]});
      tube(g,points,.036,i%3===0?dielectric:rubber).name='dielectric-lamination-rib';
    }
    function instances(name,geometry,mat,count,place){
      own(geometry);const object=new T.InstancedMesh(geometry,mat,count),dummy=new T.Object3D();
      object.name=name;object.userData.keepSeparate=true;object.receiveShadow=true;
      for(let i=0;i<count;i++){place(dummy,i);dummy.updateMatrix();object.setMatrixAt(i,dummy.matrix);}
      object.instanceMatrix.needsUpdate=true;g.add(object);return object;
    }
    instances('anchored-solder-beads',new T.SphereGeometry(1,10,6),silver,54,(d,i)=>{
      const p=route.getPointAt(.06+(i%27)/27*.85),side=i<27?-1:1;
      d.position.set(p.x+side*(3.45+(i%3)*.07),.11+(i%4)*.075,p.z);
      d.scale.set(.08+(i%3)*.025,.05+(i%4)*.012,.09+(i%2)*.03);
    });
    instances('copper-oxidation-islands',new T.IcosahedronGeometry(1,0),oxide,110,(d,i)=>{
      const p=route.getPointAt(.02+(i%55)/55*.96),side=i<55?-1:1;
      d.position.set(p.x+side*3.89,2.78+(i%5)*.035,p.z);d.rotation.set(i*.8,i*.37,.2);
      d.scale.set(.11+(i%4)*.026,.009,.18+(i%3)*.045);
    });
    instances('dielectric-flakes-and-copper-filings',new T.TetrahedronGeometry(1,0),dielectric,84,(d,i)=>{
      const p=route.getPointAt(.03+(i%42)/42*.9),side=i<42?-1:1;
      d.position.set(p.x+side*(3.05+(i%5)*.15),.043,p.z);d.rotation.set(0,i*1.9,.2);
      d.scale.set(.04+(i%4)*.02,.021,.08+(i%3)*.027);
    });
    for(const [u,side] of [[.16,-1],[.38,1],[.60,-1],[.82,1]]){
      const p=route.getPointAt(u);
      const print=label(g,['MOM ELECTRIC / 24 AWG','PVC 80 C  /  300 V','UL STYLE 1007'],[0,0,0],2.9,.8,0,'#bbc0be','#313a4e');
      print.name='printed-insulation-specification';
      // Follow the same swept curved jacket as the cable shell, just inside it.
      // A flat sign intersects the bend and disappears behind the insulation.
      const wallCenters=Array.from({length:49},(_,i)=>route.getPoint(i/48));
      const curved=own(new T.PlaneGeometry(2.9,.8,24,8)),vertices=curved.attributes.position;
      for(let j=0;j<vertices.count;j++){
        const z=p.z+side*vertices.getX(j),y=3.65+vertices.getY(j);
        let cx=wallCenters.at(-1).x;
        for(let n=0;n<wallCenters.length-1;n++){
          const a=wallCenters[n],b=wallCenters[n+1];
          if(z<=a.z&&z>=b.z){cx=a.x+(b.x-a.x)*(z-a.z)/(b.z-a.z);break;}
        }
        const radius=5*Math.sqrt(Math.max(0,1-((y-3.1)/3)**2))-.07;
        vertices.setXYZ(j,cx+side*radius,y,z);
      }
      curved.computeVertexNormals();print.geometry.dispose();print.geometry=curved;
      const seam=group(g,'severed-dielectric-edge',[p.x+side*3.82,.06,p.z]);
      for(let layer=0;layer<3;layer++)box(seam,[.37,.016,.65],[0,layer*.021,0],layer%2?rubber:dielectric,.005);
      tube(seam,[[0,.08,.28],[side*.22,.1,.10],[side*.28,.13,-.16]],.023,copper);
    }
    metadata.fiberRoom.microenvironment={strands:10,solderBeads:54,oxidationIslands:110,dielectricFlakes:84,printedInsulation:4};
  }
  // DUST: crystal inclusions, mineral veins, layered fracture faces and embedded pollen.
  {
    const g=rooms.dustRoom;
    const mineral=material('#d6c7b1',{surface:'stone',side:T.DoubleSide}), pale=material('#b8cbd0',{surface:'stone',side:T.DoubleSide});
    for(const [x,z,size,rot] of [[-3.55,-3.5,.4,.4],[4.0,-6,.5,-.3],[-4.05,-10,.6,.2],[2.8,-14,.5,.8]]) {
      const crystal=group(g,'embedded-mineral-cleavage',[x,.2,z]);crystal.rotation.y=rot;
      for(let i=0;i<5;i++){const c=mesh(crystal,new T.OctahedronGeometry(size,0),i%2?mineral:pale,[(i%3)*size*.36,size*.5+i*.12,Math.floor(i/3)*size*.4],[.2+i*.18,i*.6,.1]);c.scale.set(.6,1.6,.7)}
    }
    for(const [x,z,side] of [[-3.95,-8,-1],[3.1,-12,1]]) {
      const vein=group(g,'mineral-fracture-layers',[x,0,z]);
      for(let i=0;i<5;i++)tube(vein,[[0,.18+i*.24,-1.4],[side*.12,.4+i*.24,-.65],[side*.02,.32+i*.24,0],[side*.17,.52+i*.24,1.1]],.018,mineral);
    }
    const pollen=group(g,'embedded-pollen-grain',[-3.4,2.9,-15]);
    const pollenMat=material('#c9ab66',{surface:'stone'});
    mesh(pollen,new T.IcosahedronGeometry(.46,2),pollenMat);
    for(let i=0;i<24;i++){const a=i*2.39996,y=1-2*(i+.5)/24,r=Math.sqrt(1-y*y);const p=v(Math.cos(a)*r,y,Math.sin(a)*r).multiplyScalar(.45);const spine=mesh(pollen,new T.ConeGeometry(.042,.14,5),pollenMat,p.toArray());spine.quaternion.setFromUnitVectors(v(0,1,0),p.clone().normalize())}
    metadata.dustRoom.background='#8c8296';
  }
  // ATOMIC: interference sheets, a molecular lattice and orbital probability clouds.
  {
    const g=rooms.atomicRoom;
    const glow=own(new T.MeshBasicMaterial({color:'#74dce1',transparent:true,opacity:.13,side:T.DoubleSide,depthWrite:false}));
    for(let layer=0;layer<6;layer++) {
      const geom=new T.PlaneGeometry(48+layer*12,34+layer*8,32,24),p=geom.attributes.position;
      for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);p.setZ(i,Math.sin(x*.46+layer)*.7+Math.cos(y*.57-layer)*.6)}
      geom.computeVertexNormals();const sheet=mesh(g,geom,glow,[0,5.6+layer*.65,-16-layer*4],[Math.PI/2,.17*layer,0]);sheet.castShadow=false;
      animate(t=>{sheet.position.y=5.6+layer*.65+Math.sin(t*.13+layer)*.12},[sheet]);
    }
    const bonds=[],nodes=[];
    for(let side=0;side<2;side++)for(let row=0;row<8;row++)for(let col=0;col<4;col++) {
      const x=(side?1:-1)*(5.2+col*1.4+(row%2)*.7),y=1.1+col*.8,z=-2-row*2;
      nodes.push([x,y,z]);bonds.push(x,y,z,x+(side?1:-1)*1.4,y+.8,z,x,y,z,x+(side?1:-1)*.7,y,z-2);
    }
    const lines=own(new T.BufferGeometry());lines.setAttribute('position',new T.Float32BufferAttribute(bonds,3));
    const lineMat=own(new T.LineBasicMaterial({color:'#71cbd3',transparent:true,opacity:.35}));g.add(new T.LineSegments(lines,lineMat));
    const nodeGeo=own(new T.IcosahedronGeometry(.085,1));const nodeMat=own(new T.MeshBasicMaterial({color:'#bcecf0'}));
    const atoms=new T.InstancedMesh(nodeGeo,nodeMat,nodes.length),dummy=new T.Object3D();nodes.forEach((p,i)=>{dummy.position.set(...p);dummy.updateMatrix();atoms.setMatrixAt(i,dummy.matrix)});atoms.instanceMatrix.needsUpdate=true;g.add(atoms);
    const pointPositions=[],pointColors=[];
    for(let i=0;i<1800;i++) {
      const a=i*2.39996,cluster=i%9,r=1.0+Math.sqrt((i*.618)%1)*2.7,theta=(i*.754)%1*Math.PI*2;
      const x=(cluster%2?-1:1)*(7+cluster*3)+Math.cos(a)*r,y=3.1+Math.sin(theta)*r,z=-5-cluster*9+Math.sin(a)*r;
      pointPositions.push(x,y,z);const color=new T.Color(cluster%2?'#e4a5e8':'#8ccedc');pointColors.push(color.r,color.g,color.b);
    }
    const cloudGeo=own(new T.BufferGeometry());cloudGeo.setAttribute('position',new T.Float32BufferAttribute(pointPositions,3));cloudGeo.setAttribute('color',new T.Float32BufferAttribute(pointColors,3));
    const cloudMat=own(new T.PointsMaterial({size:.052,vertexColors:true,transparent:true,opacity:.52,depthWrite:false}));const cloud=new T.Points(cloudGeo,cloudMat);g.add(cloud);
    animate(t=>{cloud.rotation.y=Math.sin(t*.035)*.025},[cloud]);

    // Foreground molecules frame the route; remote orbital shells make it feel immense.
    const palette=['#74dce1','#d97dd9','#ddd26c','#9479ef'];
    const landmarkNodes=[],landmarkBonds=[];
    for(const [x,y,z,r] of [[-4.5,2.1,-2,1.25],[5.4,2.6,-6,1.6],[-5,2.7,-11,1.7]]){
      for(let i=0;i<6;i++){
        const a=i*Math.PI/3,b=(i+1)*Math.PI/3;
        const p=[x+Math.cos(a)*r,y+Math.sin(a)*r,z+Math.sin(a*2)*.35];
        const q=[x+Math.cos(b)*r,y+Math.sin(b)*r,z+Math.sin(b*2)*.35];
        landmarkNodes.push(p);landmarkBonds.push(...p,...q);
      }
    }
    const fgGeo=own(new T.IcosahedronGeometry(.27,1)),fgMat=own(new T.MeshBasicMaterial({color:'#c993eb'}));
    const foreground=new T.InstancedMesh(fgGeo,fgMat,landmarkNodes.length);
    landmarkNodes.forEach((p,i)=>{dummy.position.set(...p);dummy.scale.setScalar(1);dummy.updateMatrix();foreground.setMatrixAt(i,dummy.matrix)});
    foreground.instanceMatrix.needsUpdate=true;foreground.name='foreground-molecular-landmarks';g.add(foreground);
    const fgBondGeo=own(new T.BufferGeometry());fgBondGeo.setAttribute('position',new T.Float32BufferAttribute(landmarkBonds,3));
    g.add(new T.LineSegments(fgBondGeo,own(new T.LineBasicMaterial({color:'#7cc9db',transparent:true,opacity:.7}))));
    const far=group(g,'remote-orbital-landscape');
    const orbitGeo=own(new T.TorusGeometry(1,.012,6,96));
    const orbitMaterials=palette.map(color=>own(new T.MeshBasicMaterial({color,transparent:true,opacity:.42,depthWrite:false})));
    for(let i=0;i<12;i++){
      const orbit=new T.Mesh(orbitGeo,orbitMaterials[i%4]);
      orbit.position.set((i%2?-1:1)*(15+i*2.5),13+i*2,-44-i*7);
      orbit.rotation.set(.4+i*.27,.3+i*.29,.6+i*.43);
      orbit.scale.set(14+i*2.6,10+i*2.1,16+i*2);orbit.castShadow=false;far.add(orbit);
    }
    animate(t=>{far.rotation.y=Math.sin(t*.013)*.012},[far]);
    metadata.atomicRoom.background='#111831';
    metadata.atomicRoom.visualDepth=132;

  }
}
