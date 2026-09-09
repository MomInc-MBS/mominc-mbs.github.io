/* Original 64 × 96 layered pixel sprites. No external character art or game rules. */
(()=>{'use strict';
const sections=[
 ['body','Body','A silhouette from somewhere very far away.',['Zorbian','Vexling','Orryx','Mollu','Krell','Nymbi','Quorlan','Xelith','Dravox','Ulumi']],
 ['skin','Skin','Ten tones of otherworldly complexion.',['Nebula lilac','Reactor mint','Solar coral','Lunar porcelain','Void indigo','Comet gold','Plasma rose','Tidal teal','Martian ochre','Ghost ice']],
 ['face','Face','Make an unforgettable first impression.',['Vela gaze','Solo orb','Triune sight','Obsidian visor','Quasar quartet','Mothkin eyes','Ziggy grin','Mollu blush','Starborn mask','Oracle six']],
 ['hair','Hair','Coiffed, grown, or very carefully hatched.',['Vex wave','Quasar crest','Nebula bob','Orbital knots','Plasma cascade','Spore crown','Void slick','Comet braid','Prism spikes','Lunar fringe']],
 ['facial','Facial details','Whiskers, frills, and social signals.',['Vela bare','Zor whiskers','Krell beard','Mollu frill','Oracle dots','Quor tendrils','Vex moustache','Dravox jaw','Nymbi veil','Ulumi sparkle']],
 ['headwear','Headwear','MOM can spot good headwear across a galaxy.',['Vela circlet','Orryx crown','Quasar halo','Nymbi veil','Krell cap','Xelith horns','Mollu fascinator','Dravox helm','Orbital rings','Comet antennae']],
 ['neck','Neckwear','The smallest, most unreasonable finishing touch.',['Zor cravat','Vela bow','Orryx pearls','Quasar ruff','Mollu scarf','Krell collar','Xelith pendant','Nymbi ribbon','Dravox chain','Ulumi choker']],
 ['torso','Formalwear','Alien eveningwear. Excellent tailoring.',['Vex tuxedo','Mollu gown','Orryx brocade','Quasar jumpsuit','Nymbi corset','Krell robe','Xelith doublet','Dravox tailcoat','Ulumi wrap','Zor sequin suit']],
 ['shoulders','Shoulders','A little room for dramatic entrances.',['Vela epaulettes','Quor petals','Krell spikes','Nymbi puffs','Orryx mantle','Vex wings','Dravox plates','Mollu fronds','Xelith orbitals','Ulumi cape']],
 ['arms','Sleeves','Ten ways to wave at someone important.',['Vela silk','Quasar flares','Krell cuffs','Mollu lace','Orryx stripes','Vex sheer','Dravox panels','Nymbi bells','Xelith rings','Ulumi ribbons']],
 ['hands','Gloves','Keep your hands where MOM can see them.',['Vela gloves','Krell talons','Orryx cuffs','Quasar mesh','Mollu mitts','Vex rings','Dravox gauntlets','Nymbi ruffles','Xelith claws','Ulumi glow']],
 ['legs','Lower half','Trousers, trains, and several extra possibilities.',['Vex trousers','Mollu bell skirt','Orryx pleats','Quasar split','Nymbi bubble','Krell drape','Xelith stripes','Dravox breeches','Ulumi train','Zor shimmer']],
 ['feet','Footwear','For the marble floors of an alien palace.',['Vela slippers','Krell platforms','Orryx curltoes','Quasar boots','Mollu petals','Vex heels','Dravox greaves','Nymbi clouds','Xelith skates','Ulumi moonsteps']],
 ['held','Held accessory','An arrival accessory, not a combat loadout.',['Vela flute','Orryx fan','Quasar clutch','Mollu bouquet','Krell cane','Nymbi lantern','Vex invitation','Dravox orb','Xelith parasol','Ulumi familiar']],
 ['back','Back accessory','Make leaving the room just as interesting.',['Vela ribbons','Orryx cape','Quasar fins','Mollu spores','Krell spines','Nymbi wings','Vex sash','Dravox coils','Xelith satellites','Ulumi starlight']],
 ['base','Display base','A tiny piece of the palace to call your own.',['Vela marble','Orryx dais','Quasar moon','Mollu garden','Krell obsidian','Nymbi cloud','Vex carpet','Dravox grille','Xelith crystal','Ulumi orbit']],
 ['pet','Pet','A companion dressed for the same questionable occasion.',['No companion','Mollu pup','Vex moth','Orryx beetle','Quasar cat','Nymbi jelly','Krell lizard','Xelith puff','Dravox bot','Ulumi sprout']]
].map(([id,label,note,names])=>({id,label,note,names:[...names,...names.map(n=>'Xyrr '+(n==='No companion'?'slug':n)),...names.map(n=>'Auv '+(n==='No companion'?'slug':n)),...names.map(n=>'Oth '+(n==='No companion'?'slug':n))]}));
const dyes=['#9762b6','#bd476e','#467f9e','#4b9478','#d39d46','#485aa0','#d17e52','#c7adba','#5f596d','#83b8b6'];
const skin=['#b18fc8','#80ba98','#d78989','#ddd3c5','#7371ae','#c6a55e','#ce84b6','#67a5a6','#b77857','#a5c8d8'];
const defaultLook={schema:'mominc-avatar',version:1,name:'Velora of the Ninth Moon',dye:0,parts:Object.fromEntries(sections.map(s=>[s.id,0]))};
function normalize(raw){if(!raw||raw.schema!=='mominc-avatar'||raw.version!==1||!raw.parts)throw Error('Choose a MOM Inc avatar file.');const n={schema:'mominc-avatar',version:1,name:typeof raw.name==='string'?raw.name.trim().slice(0,32):'',dye:raw.dye,parts:{}};if(!Number.isInteger(n.dye)||n.dye<0||n.dye>9)throw Error('This look has an unknown silk colour.');for(const s of sections){let v=raw.parts[s.id]??(s.id==='pet'?0:undefined);if(!Number.isInteger(v)||v<0||v>=s.names.length)throw Error('This look has an unknown wardrobe piece.');n.parts[s.id]=v;}return n;}
function tone(hex,amount){let n=parseInt(hex.slice(1),16);return '#'+[n>>16,n>>8&255,n&255].map(v=>Math.max(0,Math.min(255,v+amount)).toString(16).padStart(2,'0')).join('');}
function draw(canvas,look,{base=true}={}){
 canvas.width=64;canvas.height=96;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;const original=look.parts,p=Object.fromEntries(Object.entries(original).map(([k,v])=>[k,v%10])),group=key=>Math.floor((original[key]||0)/10),S=tone(skin[p.skin],group('skin')*14- (group('skin')===3?60:0)),D=tone(S,-37),L=tone(S,35),F=dyes[look.dye],H=tone(F,42),B=tone(F,-40),gold='#e6c880',ink='#21172e',white='#fbebce';
 const rect=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
 const poly=(points,col,line=ink)=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x+.5,y+.5):c.moveTo(x+.5,y+.5));c.closePath();c.fillStyle=col;c.fill();if(line){c.strokeStyle=line;c.lineWidth=1;c.stroke();}};
 const dot=(x,y,col=gold)=>rect(x,y,1,1,col);
 const gem=(x,y,col=gold)=>{poly([[x,y-2],[x+2,y],[x,y+2],[x-2,y]],col);dot(x,y-1,white);};
 const box=(x,y,w,h,col)=>{rect(x,y,w,h,ink);rect(x+1,y+1,w-2,h-2,col);};
 // Each base has its own silhouette and surface pattern.
 if(base){const i=p.base;poly([[13-i%3,87],[22,84],[43,84],[52+i%3,88],[45,93],[20,93]],i===6?'#913f58':i===4?'#383341':i===5?'#aea6c9':'#756580');for(let x=18;x<48;x+=3){rect(x,89,2,2,i%2?gold:'#bca7bd');if(i===3||i===9)gem(x,84-(x%3),i===3?'#81b791':H);}if(i===1)rect(18,85,29,2,gold);if(i===2)box(20,87,5,3,'#a4a0bd');if(i===7)for(let x=18;x<49;x+=4)rect(x,86,1,6,ink);if(i===8)for(let x=16;x<49;x+=8)poly([[x,88],[x+2,79],[x+5,88]],'#8db9d0');}
 // Back accessories, behind the body and all clothes.
 switch(p.back){case 0:poly([[23,37],[17,69],[21,73],[28,39]],H);poly([[39,38],[44,73],[47,69],[42,37]],B);break;
 case 1:poly([[23,35],[14,79],[48,79],[41,35]],B);for(let x=20;x<47;x+=7)rect(x,55,1,20,F);break;
 case 2:for(const x of [14,43])poly([[x+6,38],[x,24],[x-3,62],[x+9,55]],H);break;
 case 3:for(let i=0;i<6;i++){rect(15+i*7,29+i%2*7,1,35,B);box(12+i*7,27+i%2*7,7,5,H);}break;
 case 4:for(let i=0;i<5;i++){poly([[21,36+i*7],[11,31+i*8],[19,43+i*6]],gold);poly([[43,36+i*7],[53,31+i*8],[45,43+i*6]],gold);}break;
 case 5:poly([[24,42],[8,28],[6,47],[15,61],[25,53]],H);poly([[40,42],[56,28],[58,47],[49,61],[39,53]],H);break;
 case 6:poly([[21,37],[13,61],[22,77],[20,58],[28,37]],gold);break;
 case 7:for(let y=38;y<76;y+=7){box(12,y,10,5,B);box(42,y,10,5,H);}break;
 case 8:for(const [x,y] of [[10,32],[52,35],[8,61],[55,63]]){gem(x,y,H);rect(x-4,y,9,1,gold);}break;
 case 9:for(let i=0;i<16;i++)gem(7+(i*17)%51,24+(i*13)%53,i%2?gold:H);break;}
 // Alien body silhouettes: ears, horns, tails, and differing frames.
 const width=[0,-2,3,2,4,-1,1,-3,3,0][p.body];
 if(p.body===3||p.body===7)poly([[40,65],[51,69],[51,76],[46,78],[44,73],[41,72]],S);
 if(p.body===6)for(let i=0;i<3;i++)poly([[27+i*5,73],[22+i*7,84],[25+i*7,86],[32+i*3,74]],S);
 poly([[25-width,34],[39+width,34],[42+width,48],[38+width,65],[26-width,65],[22-width,48]],S);rect(29,30,7,8,D);
 box(24-width,63,7+width,18,S);box(34,63,7+width,18,D);
 poly([[23-width,36],[18-width,39],[16-width,58],[22-width,59],[26-width,43]],S);poly([[41+width,36],[46+width,39],[48+width,58],[42+width,59],[38+width,43]],D);
 if([1,4,8].includes(p.body)){poly([[23,21],[15,16],[18,28],[25,29]],S);poly([[40,21],[48,16],[45,28],[39,29]],D);}
 if(p.body===2||p.body===9){rect(25,8,2,10,D);rect(37,8,2,10,S);gem(25,8,H);gem(38,8,H);}
 poly([[25,14],[38,14],[42,18],[42,28],[37,34],[27,34],[22,28],[22,19]],S);rect(24,18,2,9,L);rect(39,20,2,9,D);rect(28,32,9,2,D);
 if(p.body===5){poly([[22,23],[16,25],[22,28]],L);poly([[42,23],[48,25],[42,28]],D);}
 if(p.body===8){rect(24,15,3,3,gold);rect(37,15,3,3,gold);}
 if(p.body===9)for(const x of [24,29,35,40])dot(x,29,H);
 // Lower clothing: distinct hems and cut.
 let leg=p.legs;
 if([1,2,4,5,8].includes(leg)){let flare=[0,7,4,0,8,3,0,0,10,0][leg];poly([[25-width,57],[39+width,57],[42+flare,79],[22-flare,79]],leg===5?B:F);for(let x=23-flare;x<43+flare;x+=4)rect(x,68,1,10,leg===2?gold:B);rect(22-flare,78,20+flare*2,2,H);if(leg===4){rect(19,65,27,6,H);rect(22,73,20,3,B);}if(leg===8)poly([[39,65],[54,82],[43,81]],H);}
 else{box(24-width,58,8+width,21,F);box(34,58,8+width,21,B);if(leg===3){rect(25,70,5,8,S);rect(35,70,5,8,S);}if(leg===6)for(let y=61;y<78;y+=3){rect(25-width,y,6+width,1,gold);rect(35,y,6+width,1,gold);}if(leg===7){rect(22-width,59,10+width,9,H);rect(34,59,10+width,9,H);}if(leg===9)for(let i=0;i<10;i++)dot(25+(i*7)%15,60+i*2,gold);}
 // Shoes each alter toe/height/surface, always visible below hems.
 for(const [x,flip] of [[23-width,false],[34,true]]){let i=p.feet;box(x,78-(i===3||i===6?5:0),9+width,6+(i===3||i===6?5:0),i===7?'#cfbddf':i===9?L:B);rect(x,83,9+width,i===1?3:1,gold);if(i===2)poly([[x,81],[x-3,77],[x-4,84],[x+4,84]],H);if(i===4)for(let z=0;z<3;z++)gem(x+z*3,79,H);if(i===5)rect(x+6,84,2,2,gold);if(i===8){rect(x-2,84,13,1,'#bdd3df');rect(x,85,2,1,'#bdd3df');}if(i===0)dot(x+3,80,gold);if(i===6)rect(x+3,75,2,8,gold);}
 // Torso cuts and embroidery.
 let t=p.torso;poly([[24-width,36],[39+width,36],[41+width,57],[38,62],[26,62],[22-width,57]],F);
 rect(24-width,40,2,16,H);rect(38+width,41,2,17,B);rect(25-width,58,14+width*2,2,gold);
 if(t===0||t===7){poly([[26,36],[32,49],[38,36]],white);poly([[23,36],[29,36],[32,50],[26,46]],B);poly([[41,36],[35,36],[32,50],[38,46]],B);for(let y=50;y<58;y+=3)dot(32,y,gold);if(t===7){poly([[24,57],[19,74],[28,64]],B);poly([[39,57],[45,74],[36,64]],B);}}
 if(t===1){poly([[24,36],[31,42],[40,36],[39,56],[25,56]],H);rect(29,44,6,12,F);}
 if(t===2)for(let y=39;y<57;y+=5)for(let x=26;x<39;x+=5)gem(x,y,gold);
 if(t===3){rect(30,36,4,22,B);for(let y=40;y<55;y+=4)rect(31,y,2,2,gold);}
 if(t===4){rect(27,42,10,14,B);for(let y=43;y<55;y+=3){rect(29,y,6,1,gold);dot(28,y-1,white);}}
 if(t===5){poly([[26,36],[36,37],[25,58],[23,51]],H);rect(32,48,2,10,gold);}
 if(t===6){rect(25,38,14,3,H);rect(25,43,14,3,B);rect(30,36,3,22,gold);}
 if(t===8){poly([[23,39],[40,53],[39,58],[23,43]],H);poly([[38,36],[40,40],[25,56],[23,52]],B);}
 if(t===9)for(let i=0;i<30;i++)dot(25+(i*7)%14,38+(i*11)%19,i%2?gold:H);
 // Sleeves and gloves.
 for(const side of [-1,1]){let x=side<0?18-width:41+width,i=p.arms;box(x,39,6,18,i===5?S:F);rect(x,40,1,14,H);if(i===1||i===7)poly([[x,46],[x+5,46],[x+8,56],[x-3,56]],H);if(i===2||i===6)box(x-1,50,8,5,B);if(i===6){box(x-1,43,8,5,gold);rect(x+2,49,2,5,H);}if(i===7){rect(x-2,54,10,3,gold);rect(x-1,48,8,3,B);}if(i===3)for(let y=42;y<55;y+=3){rect(x,y,6,1,white);dot(x+3,y+1,B);}if(i===4||i===8)for(let y=40;y<55;y+=4)rect(x-1,y,8,2,i===4?B:gold);if(i===9)poly([[x,42],[x-3,65],[x+2,60],[x+5,42]],H);
 let h=p.hands;box(x,56,6,7,[1,5,8].includes(h)?S:h===9?L:B);if(h===1||h===8)for(let z=0;z<3;z++)rect(x+z*2,62,1,h===8?4:2,gold);if(h===2||h===6)box(x-1,54,8,4,gold);if(h===6){rect(x+1,58,4,3,gold);rect(x+2,61,2,2,H);}if(h===3)for(let y=57;y<62;y+=2)rect(x+1,y,4,1,H);if(h===4)rect(x-1,58,8,4,H);if(h===5)gem(x+3,59,gold);if(h===7)for(let z=0;z<4;z++)rect(x-1+z*2,54-z%2,1,4,white);if(h===9)gem(x+2,59,white);}
 // Shoulder forms.
 for(const side of [-1,1]){let x=side<0?18-width:40+width,i=p.shoulders;switch(i){case 0:box(x,36,7,4,gold);rect(x,40,1,4,gold);break;case 1:for(let z=0;z<3;z++)poly([[x+3,35],[x-2+z*3,31],[x+z*3,41]],H);break;case 2:poly([[x,39],[x,30],[x+3,35],[x+6,29],[x+7,40]],gold);break;case 3:poly([[x-2,37],[x,33],[x+6,33],[x+9,37],[x+6,43],[x,43]],H);break;case 4:box(x-1,35,9,7,B);rect(x,37,7,1,gold);break;case 5:poly([[x+3,39],[x-5*side,29],[x+8,34],[x+5,43]],H);break;case 6:box(x-1,35,9,8,B);gem(x+3,38,gold);break;case 7:for(let z=0;z<3;z++)poly([[x+3,35],[x-3+z*4,45],[x+z*3,46]],H);break;case 8:rect(x-2,35,11,2,gold);rect(x-1,40,10,1,gold);break;case 9:poly([[x,34],[x+7,34],[x+9,50],[x-3,49]],B);rect(x,35,6,2,gold);}}
 // Neck accessories are independent of the outfit.
 let n=p.neck;switch(n){case 0:poly([[29,35],[34,35],[35,43],[31,45],[29,41]],white);break;case 1:poly([[26,34],[32,36],[38,34],[38,40],[32,37],[26,40]],gold);break;case 2:for(let x=26;x<40;x+=3)box(x,35+Math.abs(32-x)*-.3,2,2,white);break;case 3:for(let x=25;x<40;x+=2)rect(x,33+(x%3),2,6,white);break;case 4:rect(27,34,12,4,H);rect(34,37,4,12,H);break;case 5:box(26,33,13,6,B);gem(32,35);break;case 6:rect(28,35,1,4,gold);rect(36,35,1,4,gold);gem(32,40);break;case 7:rect(28,34,10,2,H);poly([[31,36],[27,46],[31,44],[33,36]],H);break;case 8:for(let x=26;x<40;x+=2)rect(x,35+Math.floor((6-Math.abs(32-x))/2),2,2,gold);break;case 9:rect(27,33,11,2,gold);gem(32,34,H);}
 // Face features.
 let f=p.face;const eye=(x,y,w=3)=>{box(x,y,w+2,4,white);rect(x+2,y+1,1,2,ink);};
 if(f===1){box(26,21,12,7,white);box(30,22,5,5,'#926299');dot(31,23,white);}else if(f===3){box(24,21,16,5,ink);rect(25,22,13,1,H);}else if(f===5){poly([[24,20],[29,22],[29,27],[24,25]],ink);poly([[39,20],[34,22],[34,27],[39,25]],ink);dot(25,22,white);dot(36,22,white);}else if(f===8){poly([[24,20],[32,22],[40,20],[38,28],[26,28]],gold);rect(26,23,3,2,ink);rect(35,23,3,2,ink);}else{eye(25,22);eye(34,22);if(f===2)eye(29,17);if(f===4){eye(25,17,2);eye(35,17,2);}if(f===9)for(const [x,y] of [[26,17],[34,17],[26,27],[34,27]])eye(x,y,1);}
 rect(29,29,f===6?8:5,1,ink);if(f===6){rect(30,30,6,1,white);rect(31,31,4,1,ink);}if(f===7){rect(24,27,3,1,'#df8b9b');rect(38,27,3,1,'#df8b9b');}
 // Facial ornament; zero is deliberately bare.
 let a=p.facial;if(a===1)for(const y of [27,29]){rect(19,y,7,1,gold);rect(39,y,7,1,gold);}if(a===2)poly([[26,30],[38,30],[36,37],[31,39],[27,35]],B);if(a===3)for(let x=24;x<41;x+=3)poly([[x,29],[x+1,36],[x+3,30]],H);if(a===4)for(const [x,y] of [[24,20],[40,20],[25,28],[39,28]])gem(x,y,H);if(a===5){poly([[28,29],[26,39],[29,36],[30,30]],D);poly([[35,29],[39,39],[36,36],[33,30]],D);}if(a===6){rect(26,28,12,2,B);rect(24,27,3,2,B);rect(38,27,3,2,B);}if(a===7){box(24,28,3,5,gold);box(38,28,3,5,gold);rect(27,32,11,1,gold);}if(a===8)poly([[24,27],[40,27],[37,35],[27,35]],H);if(a===9){gem(24,28,white);gem(40,28,white);}
 // Ten different hairstyles with different silhouettes.
 switch(p.hair){case 0:poly([[22,20],[23,14],[29,11],[39,13],[42,18],[35,17],[28,15]],B);rect(25,14,9,1,H);break;case 1:poly([[29,18],[28,7],[32,9],[36,6],[35,18]],H);rect(31,9,2,8,B);break;case 2:poly([[22,16],[27,12],[38,13],[42,17],[44,31],[39,32],[39,18],[26,18],[25,32],[20,29]],B);rect(22,19,2,10,H);break;case 3:box(18,10,9,9,B);box(37,10,9,9,B);rect(25,14,14,3,B);gem(22,12,H);gem(41,12,H);break;case 4:poly([[24,16],[28,11],[40,13],[43,21],[46,43],[39,39],[38,19],[30,16]],H);rect(42,22,1,17,B);break;case 5:poly([[19,17],[21,12],[27,9],[38,10],[44,15],[44,18]],H);for(const x of [23,29,37,41])box(x,12+x%3,3,2,white);break;case 6:poly([[23,17],[26,12],[39,12],[41,16],[29,15]],B);rect(28,13,10,1,H);break;case 7:rect(24,13,16,4,B);for(let y=17;y<48;y+=4){box(40,y,4,4,H);dot(42,y+1,gold);}break;case 8:poly([[21,19],[22,9],[28,14],[31,6],[35,13],[41,8],[42,19]],H);rect(29,14,6,2,B);break;case 9:poly([[22,17],[25,12],[38,12],[42,17],[38,22],[35,17],[29,21],[27,17],[23,22]],B);rect(26,14,12,1,H);}
 // Headwear.
 let h=p.headwear;if(h===0){rect(23,16,18,1,gold);gem(32,16);}if(h===1)poly([[22,16],[22,9],[27,13],[32,7],[37,13],[42,9],[41,16]],gold);if(h===2){rect(22,6,20,1,gold);rect(20,7,2,2,gold);rect(42,7,2,2,gold);rect(22,9,20,1,gold);}if(h===3){poly([[20,16],[22,10],[41,10],[47,40],[42,37],[38,14],[25,14],[20,35]],'#a89eb4');rect(24,11,15,2,white);}if(h===4){box(24,7,15,8,B);rect(20,14,25,2,gold);}if(h===5){poly([[23,16],[18,7],[21,6],[27,16]],gold);poly([[37,16],[43,5],[45,8],[41,17]],gold);}if(h===6){poly([[37,15],[42,4],[46,5],[41,16]],H);gem(41,15);}if(h===7){poly([[22,17],[24,9],[39,9],[43,17],[40,21],[38,14],[26,14],[24,21]],gold);gem(32,10,H);}if(h===8){rect(18,13,29,1,gold);rect(21,10,23,1,H);gem(44,13);}if(h===9){rect(25,6,1,9,gold);rect(38,4,1,11,gold);gem(25,5,H);gem(38,3,H);}
 // Party props replace weapons entirely.
 switch(p.held){case 0:box(48+width,47,5,8,'#c4bdcf');rect(50+width,55,1,8,gold);rect(48+width,63,5,1,gold);rect(49+width,49,3,3,H);break;case 1:poly([[48,59],[43,46],[49,40],[58,45],[60,53]],H);for(let i=0;i<4;i++)poly([[48,59],[45+i*4,44+i%2]],gold);break;case 2:box(46,56,13,9,H);rect(47,59,11,1,gold);gem(53,59);break;case 3:poly([[49,63],[45,47],[56,47],[51,63]],'#548267');for(const [x,y] of [[45,45],[51,42],[57,46],[49,49]])gem(x,y,H);break;case 4:rect(51,47,2,36,gold);box(47,45,7,3,gold);break;case 5:rect(51,47,1,6,gold);box(47,53,10,13,B);rect(49,56,6,7,gold);gem(52,59,white);break;case 6:box(47,53,12,9,white);rect(49,55,7,1,B);gem(53,59,H);break;case 7:box(48,47,9,9,H);gem(52,51,white);rect(50,56,5,2,gold);break;case 8:rect(52,29,1,35,gold);poly([[40,33],[43,25],[52,22],[62,29],[63,33]],H);rect(42,32,20,1,gold);break;case 9:poly([[48,48],[48,43],[51,46],[56,44],[59,48],[57,55],[50,54]],S);dot(51,49,ink);dot(56,49,ink);rect(51,55,1,4,gold);rect(56,55,1,4,gold);}
 // Three additional collections give every part new cuts or surface details.
 for(const section of sections){const g=group(section.id);if(!g||['skin','pet'].includes(section.id))continue;const accent=g===1?gold:g===2?white:'#88e4d9';const shift=(original[section.id]%10)%3;
 switch(section.id){
 case 'body':for(const x of [18-width,45+width]){if(g===1)poly([[x,23],[x-3,17],[x+2,19],[x+3,28]],S);if(g===2)box(x-2,24,5,6,D);if(g===3)for(let y=22;y<32;y+=3)gem(x,y,accent);}break;
 case 'face':if(g===1){rect(25,19,5,1,accent);rect(35,19,5,1,accent);}if(g===2){gem(31,26,accent);rect(26,28,3,1,accent);}if(g===3){rect(23,23,1,7,accent);rect(41,23,1,7,accent);}break;
 case 'hair':for(let x=24;x<42;x+=5){if(g===1)poly([[x,15],[x+1,9-shift],[x+3,15]],H);if(g===2)box(x,14,3,3,accent);if(g===3)rect(x,11,1,9,accent);}break;
 case 'facial':if(g===1){rect(26,31,3,4,accent);rect(36,31,3,4,accent);}if(g===2)poly([[27,32],[32,39],[37,32]],H);if(g===3)for(const x of [22,27,37,42])gem(x,31,accent);break;
 case 'headwear':if(g===1){rect(17,12,30,1,accent);gem(20,11,accent);}if(g===2){poly([[40,13],[49,3],[50,12]],H);gem(43,13,accent);}if(g===3){rect(20,4,24,1,accent);for(const x of [20,32,43])gem(x,3,accent);}break;
 case 'neck':if(g===1)box(30,37,5,6,accent);if(g===2){rect(26,37,2,9,accent);rect(37,37,2,9,accent);}if(g===3)for(let x=26;x<40;x+=3)gem(x,36,accent);break;
 case 'torso':for(let y=44;y<57;y+=3){if(g===1)rect(25,y,14,1,accent);if(g===2){dot(27,y,accent);dot(36,y+1,accent);}if(g===3)gem(32,y,accent);}break;
 case 'shoulders':for(const x of [18-width,42+width]){if(g===1)for(let k=0;k<3;k++)rect(x+k*2,39,1,6,accent);if(g===2)poly([[x-3,38],[x,29],[x+5,39]],H);if(g===3){rect(x-4,33,11,1,accent);gem(x,35,accent);}}break;
 case 'arms':for(const x of [19-width,42+width]){if(g===1)rect(x,44,2,10,accent);if(g===2)poly([[x,43],[x-4,54],[x+4,54]],B);if(g===3)for(let y=44;y<55;y+=4)gem(x+1,y,accent);}break;
 case 'hands':for(const x of [19-width,42+width]){if(g===1)gem(x+2,58,accent);if(g===2)for(let k=0;k<3;k++)rect(x+k*2,62,1,4,accent);if(g===3)box(x-1,58,7,3,accent);}break;
 case 'legs':for(const x of [26,36]){if(g===1)rect(x,65,1,12,accent);if(g===2)for(let y=65;y<77;y+=3)rect(x-1,y,4,1,accent);if(g===3)poly([[x,64],[x-3,76],[x+4,74]],H);}break;
 case 'feet':for(const x of [23-width,34]){if(g===1)rect(x-1,83,12,2,accent);if(g===2)poly([[x,80],[x-3,76],[x-5,83],[x+3,83]],H);if(g===3)gem(x+4,81,accent);}break;
 case 'held':if(g===1){rect(48,58,12,1,accent);gem(59,58,accent);}if(g===2)poly([[51,61],[57,71],[55,61]],H);if(g===3)for(const [x,y] of [[45,45],[59,48],[58,62]])gem(x,y,accent);break;
 case 'back':if(g===1){poly([[16,40],[8,62],[14,69]],H);poly([[48,40],[56,62],[50,69]],H);}if(g===2)for(const x of [12,52])for(let y=40;y<74;y+=8)gem(x,y,accent);if(g===3){for(const [x,y] of [[13,31],[51,31],[10,43],[54,43]])gem(x,y,accent);}break;
 case 'base':if(base){if(g===1)rect(18,92,29,2,accent);if(g===2)for(let x=15;x<52;x+=6)gem(x,91,accent);if(g===3){rect(12,94,41,1,accent);rect(10,91,2,3,accent);rect(53,91,2,3,accent);}}break;
 }}
 // Forty companion choices, including an empty slot, are part of the saved avatar recipe.
 if(original.pet){const k=p.pet,g=group('pet'),fur=[H,S,gold,'#90bca2','#d99bae','#ad9ac8','#81a891','#b1accb','#9caabb','#83b587'][k],x=9,y=k===2?67:79;
 if(k===0){poly([[x-6,y+5],[x-3,y],[x+3,y-1],[x+8,y+5]],fur);rect(x+6,y-3,1,4,fur);dot(x+6,y-3,white);}
 if([1,4,6].includes(k)){box(x-5,y-3,11,8,fur);box(x+3,y-7,7,7,fur);rect(x-4,y+5,2,3,fur);rect(x+3,y+5,2,3,fur);poly([[x+3,y-7],[x+3,y-11],[x+6,y-7]],fur);poly([[x+7,y-7],[x+10,y-11],[x+10,y-6]],fur);dot(x+7,y-4,ink);if(k===6)poly([[x-5,y],[x-11,y-4],[x-8,y+3]],fur);else rect(x-7,y-4,2,7,fur);if(k===4)rect(x+8,y-2,5,1,white);}
 if(k===2){poly([[x,y],[x-9,y-8],[x-9,y+6],[x,y+2]],fur);poly([[x+2,y],[x+10,y-8],[x+10,y+6],[x+2,y+2]],fur);box(x,y-3,3,10,B);gem(x-5,y-1,gold);gem(x+7,y-1,gold);}
 if(k===3){box(x-5,y-6,12,11,fur);rect(x,y-5,1,9,B);for(let z=0;z<3;z++){rect(x-8,y-4+z*4,3,1,gold);rect(x+7,y-4+z*4,3,1,gold);}box(x-2,y-9,5,4,B);dot(x-1,y-8,white);dot(x+1,y-8,white);}
 if(k===5){poly([[x-6,y],[x-6,y-6],[x-2,y-10],[x+4,y-10],[x+8,y-5],[x+8,y]],fur);for(let z=0;z<4;z++)rect(x-4+z*3,y,1,7-z%2*3,fur);dot(x-1,y-5,ink);dot(x+4,y-5,ink);}
 if(k===7){poly([[x-7,y-2],[x-9,y-5],[x-5,y-6],[x-3,y-10],[x,y-7],[x+5,y-10],[x+6,y-6],[x+9,y-3],[x+6,y+4],[x-5,y+4]],fur);box(x-3,y-4,3,3,white);box(x+2,y-4,3,3,white);}
 if(k===8){box(x-6,y-10,13,12,fur);box(x-3,y-7,7,3,B);dot(x-2,y-6,white);dot(x+2,y-6,white);box(x-5,y+2,3,4,B);box(x+3,y+2,3,4,B);rect(x,y-14,1,4,gold);gem(x,y-14,H);}
 if(k===9){box(x-4,y-5,10,10,'#956e55');rect(x,y-15,2,11,fur);poly([[x,y-10],[x-7,y-15],[x-6,y-8]],fur);poly([[x+2,y-12],[x+8,y-17],[x+8,y-10]],fur);dot(x-1,y-2,white);dot(x+3,y-2,white);}
 rect(x-3,y,8,1,gold);gem(x+1,y+1,gold);
 if(g===1){poly([[x-5,y-8],[x-5,y-13],[x,y-10],[x+4,y-14],[x+6,y-8]],gold);}
 if(g===2){poly([[x-6,y],[x-12,y-6],[x-11,y+4]],H);poly([[x+6,y],[x+12,y-6],[x+11,y+4]],H);}
 if(g===3){for(const [xx,yy] of [[x-9,y-10],[x+10,y-8],[x,y-17]])gem(xx,yy,'#88e4d9');rect(x-5,y-7,10,1,'#88e4d9');}
 }

}
window.GalaAvatar={sections,dyes,defaultLook,normalize,draw};
})();
