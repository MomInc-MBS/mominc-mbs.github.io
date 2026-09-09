from playwright.sync_api import sync_playwright
with sync_playwright() as pw:
 b=pw.chromium.launch();c=b.new_context(viewport={'width':960,'height':640},record_video_dir='tools/preview-recordings',record_video_size={'width':960,'height':640});p=c.new_page();p.goto('http://127.0.0.1:8898/tv/games/goon/');p.wait_for_selector('canvas');p.wait_for_timeout(4000);p.screenshot(path='tv/assets/goon-game-still.png');print(p.locator('body').inner_text()[:1800],flush=True)
 for key in ['ArrowLeft','ArrowDown','ArrowRight','ArrowUp']*3:p.keyboard.press(key);p.wait_for_timeout(500)
 v=p.video;c.close();v.save_as('tv/assets/goon-preview.webm');b.close()
