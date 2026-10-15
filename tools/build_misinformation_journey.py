"""Original cut-paper scenery for Ian's twenty-stop escape route. No external art."""
from pathlib import Path
from html import escape

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'play/misinformation/assets/journey'
OUT.mkdir(parents=True, exist_ok=True)

def rect(x,y,w,h,c,r=0): return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{c}"/>'
def path(d,c,s='none',sw=3): return f'<path d="{d}" fill="{c}" stroke="{s}" stroke-width="{sw}" stroke-linejoin="round"/>'
def ellipse(x,y,rx,ry,c): return f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{c}"/>'
def text(x,y,t,size=18,c='#f0dbb0'): return f'<text x="{x}" y="{y}" fill="{c}" font-family="monospace" font-size="{size}" font-weight="bold">{escape(t)}</text>'
def group(body,transform): return f'<g transform="{transform}">{body}</g>'
gold='#dfae54'; cream='#e8d9b7'; orange='#c65f30'; purple='#805b91'; ink='#292431'; teal='#6d9b98'; pink='#c38a94'
def desk(x=80,y=420,scale=1):
    return group(path('M0 0 L470 -12 505 24 25 42Z',orange)+rect(32,35,23,145,ink)+rect(440,24,24,150,ink)+path('M175 -15 L227 -107 283 -10Z',gold)+path('M227 -107 L283 -10 227 -30Z','#9d7338')+rect(60,-80,73,58,teal)+rect(89,-22,10,13,cream),f'translate({x} {y}) scale({scale})')
def planet(x,y,r,c=teal):return ellipse(x,y,r,r,c)+path(f'M{x-r*.8} {y-r*.1} Q{x} {y-r*.9} {x+r*.8} {y-r*.1} Q{x} {y+r*.5} {x-r*.8} {y-r*.1}',purple)
def stars():return ''.join(path(f'M{x} {y-6} L{x+2} {y-1} {x+7} {y} {x+2} {y+2} {x} {y+7} {x-2} {y+2} {x-6} {y} {x-2} {y-1}Z',cream) for x,y in [(55,102),(524,85),(443,170),(86,305),(575,330),(235,165),(185,65),(332,290),(510,520),(115,540)])
def cloud(x,y,s=1):return group(path('M0 25 Q-20 0 10 -5 Q10 -40 48 -30 Q72 -55 92 -19 Q132 -24 137 8 Q160 35 125 40 L15 43Z',cream),f'translate({x} {y}) scale({s})')
def building(x,y,w,h,c):return rect(x,y,w,h,c)+''.join(rect(x+14+i*24,y+24+j*35,10,17,gold) for i in range(max(1,int((w-20)/24))) for j in range(max(1,int((h-40)/35))))
def satellite(x,y,s=1):return group(rect(-20,-25,40,50,cream)+rect(-100,-22,65,45,teal)+rect(35,-22,65,45,teal)+path('M-35 0 H-20 M20 0 H35 M0 -25 L16 -57', 'none',gold,6)+ellipse(17,-58,7,7,orange),f'translate({x} {y}) rotate(-18) scale({s})')
def rock(x,y,s=1,c=purple):return group(path('M-42 -10 L-13 -38 25 -30 45 8 19 40 -25 28Z',c)+path('M-13 -38 L-5 4 19 40 25 -30Z','#493d58')+ellipse(-20,1,8,6,'#a68f9b'),f'translate({x} {y}) scale({s})')
def crane(x,y,s=1):return group(path('M-65 20 L-20 -80 4 -5 80 -60 36 25 0 44 -15 18 -54 35Z',cream)+path('M-20 -80 L4 -5 0 44 -15 18Z',gold)+path('M0 44 L36 25 80 -60 4 -5Z',pink),f'translate({x} {y}) scale({s})')

scenes=[]
scenes.append(('office','Office','#65918a',rect(0,430,640,290,'#466b67')+rect(55,95,180,230,cream)+rect(68,108,154,203,teal)+path('M145 108 V310 M69 206 H222','none',cream,8)+rect(410,110,160,100,cream)+text(427,146,'MOM INC.',24,ink)+text(429,180,'STAY HERE',14,ink)+desk()))
scenes.append(('vents','Ceiling Vents','#57626b',path('M-30 470 L165 190 390 166 700 30 700 210 460 310 260 335 80 600Z','#929d9a')+path('M0 470 L190 245 420 230 660 120','none',ink,9)+''.join(path(f'M{x} {y} l70 83','none',ink,5) for x,y in [(90,358),(146,285),(267,219),(342,199),(462,150),(538,116)])+rect(410,470,160,110,ink)+''.join(rect(425,482+i*18,130,7,teal) for i in range(5))))
scenes.append(('stairwell','Propaganda Stairwell','#8d716d',path('M-20 620 H125 V555 H210 V490 H295 V425 H380 V360 H465 V295 H550 V230 H660 V720 H-20Z',cream)+path('M0 525 L600 72','none',ink,12)+''.join(rect(85+i*150,140+i*20,112,150,purple)+text(95+i*150,180+i*20,'OBEY',22)+text(95+i*150,210+i*20,'MOM',22) for i in range(3))))
scenes.append(('rooftops','Rooftop and Billboards','#718b9a',planet(540,125,48,cream)+building(0,380,135,340,ink)+building(165,460,185,260,'#4d4a5d')+building(390,340,250,380,'#51415d')+path('M355 338 V245 M570 338 V245','none',gold,9)+rect(315,125,300,127,orange)+text(335,170,'MOM SEES',28)+text(335,208,'POTENTIAL.',28)))
scenes.append(('clouds','Sky of Paper Clouds','#7caaa9',cloud(25,420,1.9)+cloud(355,190,1.7)+cloud(70,75,1.3)+cloud(320,520,2)+path('M250 720 L292 0 314 0 286 720Z',gold)))
scenes.append(('elevator','Space Elevator','#344c67',planet(320,800,360,teal)+path('M280 720 L305 -30 330 -30 360 720Z',cream)+path('M316 720 V0','none',gold,7)+rect(250,260,135,100,orange)+rect(270,275,95,42,ink)+satellite(490,130,.8)))
scenes.append(('junkyard','Satellite Junkyard','#302b46',satellite(170,160,1.2)+satellite(460,380,1.35)+rock(150,530,.8)+path('M430 0 L380 80 421 122 365 218 440 184 470 255 505 160 468 115 530 20Z',cream)+path('M430 0 L410 79 450 125 402 194 440 184 470 255 478 160 448 117 500 20Z',pink)))
scenes.append(('port18','MOM Port 18','#302840',planet(510,115,70,purple)+path('M30 400 L600 300 640 380 90 510Z',cream)+rect(130,220,380,150,purple)+path('M173 370 V270 H460 V370','none',gold,17)+text(220,252,'MOM PORT',27)+text(264,331,'18',64)+satellite(90,120,.6)))
scenes.append(('cafeteria','Moon Cafeteria Colony','#4f455e',ellipse(320,700,530,280,'#b1ad9c')+path('M50 480 Q80 80 555 460Z',teal)+path('M50 480 Q80 80 555 460Z','none',cream,12)+rect(140,350,300,160,cream)+rect(155,365,270,65,purple)+text(175,404,'MOON CAFETERIA',23)+rect(120,470,360,20,orange)+rect(180,490,15,80,ink)+rect(410,490,15,80,ink)+ellipse(300,455,24,7,gold)))
scenes.append(('fold','The Fold','#d8b694',path('M0 0 H640 L320 350Z',purple)+path('M0 720 H640 L320 350Z',teal)+path('M0 0 L320 350 0 720Z',ink)+path('M640 0 L320 350 640 720Z',cream)+path('M-30 360 L320 350 670 360','none',gold,8)+crane(165,170,.8)+group(crane(165,170,.8),'translate(640 720) rotate(180)')+path('M285 480 L320 425 350 480 M320 425 V550','none',orange,12)))
scenes.append(('origami','Origami','#c0989a',path('M0 570 L200 390 350 560 490 325 640 520 V720 H0Z',purple)+crane(180,220,1.5)+crane(455,420,1.1)+crane(460,80,.6)))
scenes.append(('gym','Asteroid Gym Belt','#322e4a',rock(100,210,1.8)+rock(500,440,2)+rock(220,570,1.1)+path('M150 340 L470 250','none',gold,14)+group(rect(-25,-60,50,120,orange)+rect(-35,-42,70,84,cream),'translate(175 333) rotate(-16)')+group(rect(-25,-60,50,120,orange)+rect(-35,-42,70,84,cream),'translate(445 257) rotate(-16)')+text(260,140,'NO DAYS OFF',23)))
scenes.append(('wormhole','Wormhole Highway','#25213e',''.join(f'<ellipse cx="{320+i*10}" cy="{340-i*18}" rx="{280-i*35}" ry="{315-i*39}" fill="none" stroke="{[purple,teal,gold,orange,cream][i%5]}" stroke-width="22"/>' for i in range(7))+path('M240 720 L362 235 430 720Z',ink)+path('M330 720 L362 235','none',gold,7)))
scenes.append(('flatland','Flatland','#c9b89b',path('M-10 520 H650','none',ink,12)+path('M30 520 L140 300 250 520Z',orange)+rect(300,290,150,230,teal)+ellipse(535,430,70,90,purple)+path('M80 520 V690 M380 520 V690 M535 520 V690','none',ink,2)+text(145,175,'DEPTH NOT FOUND',26,ink)))
scenes.append(('mirror','Mirror Office','#365b63',path('M300 -20 L355 -20 340 740 300 740Z',cream)+desk(-90,390,.7)+group(desk(-90,390,.7),'translate(640 0) scale(-1 1)')+path('M323 0 L310 220 340 350 306 490 321 720','none',gold,8)+ellipse(160,160,65,65,purple)+ellipse(480,160,65,65,orange)))
patches=''.join(path(f'M{x} {y} l145 -6 -8 158 -138 -6Z',[purple,teal,orange,pink,gold][(i+j)%5])+path(f'M{x+8} {y+10} l125 -4 -8 132 -116 -6Z','none',cream,2) for i,x in enumerate([-30,125,280,435,590]) for j,y in enumerate([-30,135,300,465,630]))
scenes.append(('quilt','Quilt Dimension','#967985',patches+path('M0 610 Q300 100 640 440','none',ink,16)+path('M0 610 Q300 100 640 440','none',gold,6)))
scenes.append(('cable','Data Cable','#232a3d',''.join(path(f'M{-80+i*75} 740 Q{690-i*70} 390 {60+i*75} -40','none',[teal,purple,orange,gold][i%4],24) for i in range(8))+rect(220,260,210,155,cream)+rect(244,280,162,85,ink)+''.join(rect(250+i*24,365,12,75,gold) for i in range(6))+text(269,330,'MOM://',23,teal)))
scenes.append(('nursery','Nebula Nursery','#624968',ellipse(150,300,210,170,purple)+ellipse(485,455,235,215,teal)+cloud(225,160,1.8)+path('M70 180 L520 220','none',gold,7)+''.join(path(f'M{x} {y-95} V{y}','none',cream,3)+planet(x,y,26,[orange,gold,teal][i%3]) for i,(x,y) in enumerate([(125,280),(250,350),(390,305),(500,390)]))+rect(180,500,290,25,cream)+path('M200 525 V625 M450 525 V625','none',cream,14)))
scenes.append(('edge','Edge of the Page','#2a263a',path('M0 0 H480 L470 100 495 190 462 300 490 420 455 535 480 720 H0Z',cream)+path('M455 0 L445 120 465 260 441 430 460 570 445 720','none',gold,3)+path('M640 60 L514 130 461 200 390 310 Q365 342 385 355 Q407 370 430 335 L480 278 450 370 Q440 405 462 410 Q490 414 501 377 L530 305 554 248 640 220Z',pink)+path('M359 365 L465 215 480 226 375 378 350 394Z',orange)+path('M350 394 L359 365 375 378Z',ink)+crane(160,430,1.2)))
scenes.append(('mothership','MOM\'s Mothership Desk','#251e38',planet(510,140,85,purple)+''.join(ellipse(340,340,260-i*43,220-i*35,'none')+f'<ellipse cx="340" cy="340" rx="{260-i*43}" ry="{220-i*35}" fill="none" stroke="{[teal,purple,gold][i%3]}" stroke-width="5"/>' for i in range(4))+desk(0,450,1.2)+ellipse(283,285,70,44,cream)+ellipse(283,285,24,36,purple)+ellipse(283,285,11,28,ink)+text(166,610,'WELCOME BACK.',30)))

for number,(slug,title,bg,body) in enumerate(scenes,1):
    # A single deterministic paper material unifies every stop and both existing saucers.
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 720" role="img" aria-label="{escape(title,quote=True)}">
<defs><filter id="paper"><feTurbulence type="fractalNoise" baseFrequency=".65" numOctaves="3" seed="18" result="noise"/><feColorMatrix in="noise" type="saturate" values="0"/><feBlend in="SourceGraphic" mode="multiply"/></filter><filter id="cut"><feDropShadow dx="3" dy="6" stdDeviation="1.5" flood-color="#171321" flood-opacity=".26"/></filter></defs>
{rect(0,0,640,720,bg)}<g opacity=".55">{stars() if number>=6 else ''}</g><g filter="url(#cut)">{body}</g><rect width="640" height="720" fill="{cream}" opacity=".1" filter="url(#paper)"/></svg>'''
    (OUT/f'{number:02d}-{slug}.svg').write_bytes(svg.encode('utf-8'))
print(f'Wrote {len(scenes)} original paper scenes to {OUT}')
