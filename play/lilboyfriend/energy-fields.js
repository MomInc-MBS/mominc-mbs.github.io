// MOM's shared hardware and animated compression boundary.
export function createEnergySystem(T, k) {
  const {own, box, tube, material, animate, keepSeparate} = k;
  const logo=own(new T.TextureLoader().load(new URL('../../tv/assets/mom-inc-mark.png',import.meta.url).href));
  logo.colorSpace=T.SRGBColorSpace;
  const badge=own(new T.MeshBasicMaterial({map:logo,transparent:true,side:T.DoubleSide,depthWrite:false}));
  const gold=material('#edbd52',{surface:'metal',metalness:.82,roughness:.22});
  const purple=material('#6439a2',{roughness:.36});
  const fieldMaterial=own(new T.ShaderMaterial({
    uniforms:{time:{value:0},motion:{value:1}},transparent:true,depthWrite:false,side:T.DoubleSide,
    vertexShader:`varying vec2 fieldUV; varying vec3 localPos;
      void main(){fieldUV=uv;localPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform float time;uniform float motion;varying vec2 fieldUV;varying vec3 localPos;
      void main(){vec2 p=fieldUV;float t=time*motion;
        float wave=sin(p.x*32.+p.y*15.-t*2.6)+sin(p.y*41.-p.x*10.+t*1.8);
        float arc=pow(max(0.,1.-abs(wave)*2.8),5.);
        float sweep=pow(.5+.5*sin(p.y*23.+sin(p.x*12.+t)*2.-t*3.),15.);
        float cells=pow(max(0.,sin(p.x*110.+sin(p.y*48.)*.4)*sin(p.y*85.+t)),32.);
        float edge=pow(1.-min(min(p.x,1.-p.x),min(p.y,1.-p.y))*2.,9.);
        vec3 c=mix(vec3(.31,.08,.62),vec3(.82,.49,1.),clamp(arc+sweep+edge,0.,1.));
        gl_FragColor=vec4(c,.045+arc*.14+sweep*.19+edge*.22+cells*.34);
        #include <colorspace_fragment>
      }`
  }));
  animate(t=>{fieldMaterial.uniforms.time.value=t;fieldMaterial.uniforms.motion.value=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches ? .15 : 1});
  function surface(parent,width,height,pos,rotation=[0,0,0],name='purple-compression-boundary') {
    const geo=own(new T.PlaneGeometry(width,height,1,1)),m=new T.Mesh(geo,fieldMaterial);
    m.name=name;m.position.set(...pos);m.rotation.set(...rotation);m.renderOrder=2;m.userData.visualOnly=true;
    parent.add(m);keepSeparate(m);return m;
  }
  function generator(parent,pos,scale=1) {
    const g=new T.Group();g.name='MOM-face-micro-shrinker';g.position.set(...pos);g.scale.setScalar(scale);parent.add(g);
    box(g,[.58,.47,.36],[0,.235,0],purple,.035);
    box(g,[.46,.31,.01],[0,.25,.188],material('#f1e1bd'),.009);
    const face=new T.Mesh(own(new T.PlaneGeometry(.4,.29)),badge);face.position.set(0,.25,.196);g.add(face);
    for(const x of [-.38,.38]){box(g,[.036,.93,.045],[x,.47,0],gold,.005);box(g,[.15,.05,.17],[x,.045,0],gold,.008)}
    box(g,[.8,.035,.045],[0,.93,0],gold,.004);
    surface(g,.72,.84,[0,.49,.01]);
    tube(g,[[.26,.09,0],[.55,.035,-.14],[.65,.035,-.4]],.014,purple);
    return g;
  }
  function overhead(parent,path,width=10,height=5) {
    // A curved field ribbon follows the room instead of covering it with a flat roof.
    const pos=[],uv=[],index=[];
    for(let i=0;i<path.length;i++){
      const p=path[i];pos.push(p[0]-width/2,height,p[2],p[0],height+.5,p[2],p[0]+width/2,height,p[2]);
      uv.push(0,i/(path.length-1),.5,i/(path.length-1),1,i/(path.length-1));
      if(i<path.length-1)for(let a=0;a<2;a++){const n=i*3+a;index.push(n,n+3,n+1,n+1,n+3,n+4)}
    }
    const geo=own(new T.BufferGeometry());geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(index);geo.computeVertexNormals();
    const m=new T.Mesh(geo,fieldMaterial);m.name='overhead-purple-energy';m.renderOrder=2;m.userData.visualOnly=true;parent.add(m);keepSeparate(m);
    return m;
  }
  function portal(parent,metadata,id) {
    const p=metadata.portal,approach=p.approach||p.target,look=p.look||p.target;
    const center=[approach[0],.0,approach[2]+.65];
    const g=new T.Group();g.name='MOM-'+id+'-threshold';g.position.set(...center);g.rotation.y=Math.atan2(look[0]-center[0],look[2]-center[2])+Math.PI;parent.add(g);
    // Hardware stays outside the walk corridor; energy spans the opening.
    generator(g,[-1.5,0,0],.65);
    for(const x of [-1.02,1.02])box(g,[.045,2.9,.055],[x,1.45,0],gold,.006);
    box(g,[2.09,.045,.055],[0,2.9,0],gold,.005);
    surface(g,2,2.85,[0,1.47,0]);
    metadata.energyBoundary=g;
    return g;
  }
  return {surface,generator,overhead,portal,fieldMaterial};
}
