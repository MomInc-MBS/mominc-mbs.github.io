/* War Room ammunition. Tier numbers belong to the merge engine; power is never currency. */
(() => {
  'use strict';
  const tiers = [
    ['Pellet', 0xb7c6ca], ['Cartridge', 0xd0aa61], ['Shell', 0xe58c56],
    ['Heavy slug', 0xe7cc83], ['Grenade', 0x93c866], ['Rocket', 0xef985e],
    ['Missile', 0xf16b77], ['Plasma cell', 0x5ce8ec], ['Rail charge', 0x839dff],
    ['Antimatter core', 0xd585ff], ['Singularity seed', 0xfd78c3], ['Reality breaker', 0xc3ffe9]
  ];
  const power = tier => 2 ** (tier - 1);
  const tierInfo = tier => {
    const index = Math.max(0, Math.min(tiers.length - 1, tier - 1));
    return {name: tiers[index][0] + (tier > 12 ? ' Mk ' + (tier - 11) : ''), color: tiers[index][1], power: power(tier)};
  };
  let materials;
  function model(tier, T) {
    if (!materials) {
      materials = {
        steel: new T.MeshStandardMaterial({color:0x8cabb6, metalness:.7, roughness:.3}),
        brass: new T.MeshStandardMaterial({color:0xd0aa61, metalness:.65, roughness:.32}),
        dark: new T.MeshStandardMaterial({color:0x132b37, metalness:.45, roughness:.5}),
        colors: tiers.map(([,color], i) => new T.MeshStandardMaterial({color, metalness:.4, roughness:.3, emissive:color, emissiveIntensity:i >= 7 ? .65 : .08}))
      };
    }
    const n = Math.min(tier, 12), group = new T.Group(), accent = materials.colors[n - 1];
    group.name = 'ammo-' + tier;
    const add = (geometry, material, x=0, y=0, z=0) => {
      const mesh = new T.Mesh(geometry, material);
      mesh.position.set(x,y,z); mesh.castShadow = true; group.add(mesh); return mesh;
    };
    const ball = (r, material, y) => add(new T.SphereGeometry(r,12,8),material,0,y,0);
    const tube = (r,h,material,y) => add(new T.CylinderGeometry(r,r,h,12),material,0,y,0);
    const ring = (r,y,tilt=0) => {
      const mesh = add(new T.TorusGeometry(r,.018,6,24),accent,0,y,0);
      mesh.rotation.x = Math.PI/2 + tilt; return mesh;
    };
    if (n === 1) ball(.065,materials.steel,.07);
    else if (n <= 4) {
      const r = [.0,.0,.065,.10,.11][n], h = [.0,.0,.19,.25,.34][n];
      tube(r,h,n === 3 ? accent : materials.brass,h/2);
      tube(r+.015,.025,materials.steel,.025);
      add(new T.ConeGeometry(r,.09,12),n === 4 ? accent : materials.steel,0,h+.045);
      if (n === 4) ring(.12,h*.55);
    } else if (n === 5) {
      ball(.16,accent,.17); tube(.06,.10,materials.steel,.35);
      add(new T.BoxGeometry(.08,.24,.045),materials.dark,.115,.27,0); ring(.17,.17);
    } else if (n <= 7) {
      const h = n === 6 ? .32 : .43, r = n === 6 ? .095 : .12;
      tube(r,h,n === 6 ? materials.steel : materials.dark,h/2+.06);
      add(new T.ConeGeometry(r,.16,12),accent,0,h+.14);
      for (let i=0;i<4;i++) {
        const fin = add(new T.BoxGeometry(.08,.16,.035),accent,Math.cos(i*Math.PI/2)*r,.10,Math.sin(i*Math.PI/2)*r);
        fin.rotation.y = -i*Math.PI/2;
      }
      tube(r*.65,.055,accent,.03);
    } else if (n === 8) {
      tube(.14,.40,accent,.24); tube(.18,.07,materials.dark,.055); tube(.18,.07,materials.steel,.455);
      for (const x of [-.15,.15]) add(new T.BoxGeometry(.035,.4,.05),materials.steel,x,.25,0);
      ring(.22,.26);
    } else if (n === 9) {
      const core = add(new T.ConeGeometry(.13,.5,6),accent,0,.32); core.rotation.y = Math.PI/6;
      tube(.16,.1,materials.dark,.06); ring(.20,.20); ring(.25,.36);
    } else {
      ball(n === 10 ? .15 : .18,n === 11 ? materials.dark : accent,.30);
      ring(.25,.30,.65); ring(.29,.30,-.65);
      if (n >= 11) {
        const orbit = ring(.32,.30); orbit.rotation.y = Math.PI/3;
        for (let i=0;i<(n === 12 ? 6 : 3);i++) {
          const angle = i*Math.PI*2/(n === 12 ? 6 : 3);
          const shard = add(new T.ConeGeometry(.045,.14,4),accent,Math.cos(angle)*.27,.30,Math.sin(angle)*.27);
          shard.rotation.z = Math.PI/2; shard.rotation.y = -angle;
        }
      }
      if (n === 12) {tube(.045,.62,materials.steel,.31); ball(.065,accent,.67);}
    }
    return group;
  }
  function label(canvas, tier) {
    canvas.width = 320; canvas.height = 128;
    const ctx = canvas.getContext('2d'), info = tierInfo(tier);
    ctx.clearRect(0,0,320,128); ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.strokeStyle='#071b26'; ctx.fillStyle='#e3fff3'; ctx.lineWidth=7;
    ctx.font='bold 48px monospace';
    ctx.strokeText('+'+info.power.toLocaleString(),160,40); ctx.fillText('+'+info.power.toLocaleString(),160,40);
    let size=28; ctx.font=`bold ${size}px monospace`;
    while(ctx.measureText(info.name.toUpperCase()).width>304&&size>16)ctx.font=`bold ${--size}px monospace`;
    ctx.strokeText(info.name.toUpperCase(),160,96); ctx.fillText(info.name.toUpperCase(),160,96);
  }
  // The non-WebGL renderer uses the same names, colours and power as the 3D board.
  function draw2D(scene,tier,x,y,size) {
    const g=scene.graphics,info=tierInfo(tier),r=size*(.08+Math.min(tier,12)*.012);
    g.fillStyle(info.color,1);
    if(tier===1||tier>=10)g.fillCircle(x,y,r);
    else {g.fillRoundedRect(x-r/2,y-r,r,2*r,3);g.fillTriangle(x-r/2,y-r,x+r/2,y-r,x,y-r*1.5);}
    if(tier>=8){g.lineStyle(2,info.color,.9);g.strokeCircle(x,y,r+5);if(tier>=10)g.strokeCircle(x,y,r+10);}
    const text=scene.add.text(x,y+size*.48,info.name,{fontSize:'14px',color:'#e3fff3',fontFamily:'monospace'}).setOrigin(.5,1);
    scene.valueTexts.push(text);
  }
  function showEnding(scene,won) {
    if(document.querySelector('.war-result'))return;
    const panel=document.createElement('section');panel.className='war-result';
    panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','war-result-title');
    const card=document.createElement('div'),title=document.createElement('h1'),score=document.createElement('p'),detail=document.createElement('p'),actions=document.createElement('nav');
    title.id='war-result-title';title.textContent=won?'REALITY BREAKER ONLINE':'AMMO BAY FULL';
    score.textContent='FIREPOWER +'+Number(scene.scoreText.getData('score')||0).toLocaleString();
    const best=tierInfo(Math.max(...scene.board.flat()));
    detail.textContent=won?'You built the impossible. Keep merging to push it further.':'Highest ammo: '+best.name+'. Start a new run to build higher.';
    const back=document.createElement('a');back.href='/tv/?ch=goon';back.target='_top';back.textContent='Return to Goon';
    const reset=document.createElement('button');reset.type='button';reset.textContent='New ammo run';reset.onclick=()=>location.reload();
    actions.append(back,reset);
    if(won){const keep=document.createElement('button');keep.type='button';keep.textContent='Keep merging';keep.onclick=()=>{panel.remove();scene.input.enabled=true;scene.startHintTimer();};actions.append(keep);}
    card.append(title,score,detail,actions);panel.append(card);document.body.append(panel);scene.input.enabled=false;back.focus();
    panel.addEventListener('keydown',event=>{
      if(event.key!=='Tab')return;
      const controls=[...actions.children],first=controls[0],last=controls.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    });
  }
  window.GalaAmmo={tiers,tierInfo,power,model,label,draw2D,showEnding};
})();
