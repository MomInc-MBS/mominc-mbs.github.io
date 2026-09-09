from playwright.sync_api import sync_playwright
with sync_playwright() as pw:
 b=pw.chromium.launch();p=b.new_page();p.goto('http://127.0.0.1:8898/gala/');p.wait_for_function('window.GalaAvatar')
 result=p.evaluate('''()=>{const hashes=new Set();for(let i=0;i<40;i++){const look=structuredClone(GalaAvatar.defaultLook);look.parts.back=i;const c=document.createElement('canvas');GalaAvatar.draw(c,look);hashes.add(c.toDataURL());if(i>=30){const ctx=c.getContext('2d');for(const x of [7,57]){let cyan=0;for(let y=30;y<69;y++){const d=ctx.getImageData(x,y,1,1).data;if(d[0]===136&&d[1]===228&&d[2]===217&&d[3]===255)cyan++;}if(cyan>5)throw Error('Cyan box remains');}}}return hashes.size;}''')
 assert result==40,result;print('PASS cyan box removed from all ten affected variants; forty back accessories remain distinct');b.close()
