"""Browser regression checks for the home preview and the real standalone game route.

Uses the actual main-site paths; all game records stay in the test browser.
Run: python tools/check_misinformation_ui.py http://127.0.0.1:5190
"""
import json
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:5190"
OUT = Path(__file__).resolve().parents[1] / ".qa/misinformation"
OUT.mkdir(parents=True, exist_ok=True)
RUN = "mom-misinformation-flight-v1"
SCORES = "mom-misinformation-scores-v1"
results = []

def record(name, **details):
    results.append(dict(check=name, passed=True, **details))
    print("PASS", name, flush=True)

def state(page):
    return page.evaluate("k=>JSON.parse(localStorage.getItem(k))", RUN)

def answer(page, correct=True):
    choice = page.evaluate("""async()=>{const {subjects,questions}=await import('./catalog.js');
        const s=JSON.parse(localStorage.getItem('mom-misinformation-flight-v1'));
        const q=questions.find(q=>q.id===s.question);
        const subject=subjects.find(s=>s.id===q.answers.find(a=>a.tier===5).id);
        return {name:subject.name,classification:subject.classification};}""")
    page.locator("#answer").fill(choice["name"])
    page.locator("#answer-form button[type=submit]").click()
    expected = choice["classification"]
    if not correct:
        expected = "claim" if expected == "event" else "event"
    page.locator(f"button[data-choice='{expected}']").click()
    return state(page)

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width":1280,"height":900})
    home = context.new_page()
    home.goto(BASE + "/tv/?ch=mominc", wait_until="domcontentloaded")
    home.wait_for_selector(".mi-misinformation", state="attached")
    if home.locator(".tv").get_attribute("data-state") != "on":
        home.get_by_role("button", name="Power", exact=True).click()
    home.wait_for_function("document.querySelector('.tv').dataset.state==='on'")
    preview = home.get_by_role("link", name="Play MOM's Misinformation Machine", exact=True)
    expect(preview).to_be_visible()
    assert home.locator("article#mi > :first-child").get_attribute("class").find("mi-misinformation") >= 0
    home.wait_for_function("[...document.querySelectorAll('.mi-misinformation img')].every(e=>e.complete&&e.naturalWidth>0)")
    preview.screenshot(path=str(OUT / "main-preview-desktop.png"))
    record("Home preview is first, visible after Power, and both saucers load")
    with context.expect_page() as opened:
        preview.click()
    page = opened.value
    # Install saved-state fixtures after the old page's pagehide save, before app startup.
    page.add_init_script("""(()=>{const fixture=sessionStorage.getItem('__qa_restore');
      if(fixture){sessionStorage.removeItem('__qa_restore');localStorage.setItem('mom-misinformation-flight-v1',fixture);}})();""")
    page.wait_for_url("**/play/misinformation/")
    try:
        page.wait_for_function("!document.documentElement.hasAttribute('data-game-loading')", timeout=60000)
    except Exception:
        page.screenshot(path=str(OUT / "loading-failure.png"))
        print(page.locator("body").inner_text()[:1500], flush=True)
        print(page.evaluate("({scripts:[...document.scripts].map(s=>({src:s.src,type:s.type})),loader:!!window.MBS_LOAD})"), flush=True)
        raise
    expect(page.locator("button[data-action='launch']")).to_be_visible()
    assert page.locator(".depth-chart li").count() == 8
    page.wait_for_function("[...document.querySelectorAll('.saucer img')].every(e=>e.complete&&e.naturalWidth>0)")
    record("Actual preview link opens dedicated play menu and loader completes")
    page.locator("button[data-action='scoreboard']").click()
    expect(page.locator("#screen")).to_contain_text("THIS BROWSER ONLY")
    page.locator("button[data-action='scoreboard-back']").click()
    page.locator("button[data-action='launch']").click()
    # A rejected answer must keep the same naming phase and preserve the deadline.
    before=state(page)
    page.locator("#answer").fill("not-an-archive-answer")
    page.locator("#answer-form button[type=submit]").click()
    after=state(page)
    assert after["phase"] == "answer" and after["hits"] == 0 and after["deadline"] == before["deadline"]
    record("Invalid answer retries without damage or a fresh timer")
    layers=set()
    for i in range(20):
        after=answer(page)
        layers.add(page.locator("#space-scene").get_attribute("data-layer"))
        if after["phase"] == "escaped":
            break
        page.locator("button[data-action='next']").click()
    assert after["phase"] == "escaped" and after["distance"] == 100000 and after["score"] == 2000
    assert len(layers) == 8
    page.locator("#space-scene").screenshot(path=str(OUT / "sci-fi-station.png"))
    record("Twenty highest-tier answers dock; all eight art and chart layers appear", layers=sorted(layers))
    page.locator("button[data-action='scoreboard']").click()
    expect(page.locator("#screen")).to_contain_text("ESCAPED")
    page.reload(wait_until="domcontentloaded")
    page.wait_for_function("!document.documentElement.hasAttribute('data-game-loading')", timeout=120000)
    saved=page.evaluate("k=>JSON.parse(localStorage.getItem(k)).runs", SCORES)
    assert len(saved)==1 and saved[0]["outcome"]=="escaped"
    record("Escaped run persists and reload does not duplicate its scoreboard row")
    page.locator("button[data-action='restart']").click()
    page.locator("button[data-action='launch']").click()
    for i in range(3):
        after=answer(page,False)
        assert after["hits"]==i+1
        if i<2:
            page.locator("button[data-action='next']").click()
    assert after["phase"]=="dead" and after["score"]==0
    record("Third wrong classification recalls the flight and wrong answers earn no propulsion")
    page.locator("button[data-action='restart']").click()
    assert state(page)["distance"]==0 and state(page)["hits"]==0
    page.set_viewport_size({"width":390,"height":844})
    page.locator("#space-scene").scroll_into_view_if_needed()
    page.screenshot(path=str(OUT / "mobile-play-menu.png"), full_page=True)
    assert not page.evaluate("document.documentElement.scrollWidth>innerWidth")
    page.locator("button[data-action='scoreboard']").click()
    assert not page.evaluate("document.documentElement.scrollWidth>innerWidth")
    assert page.locator("#screen tbody tr").count()==2
    page.locator("#terminal").screenshot(path=str(OUT / "mobile-scoreboard.png"))
    record("Mobile play menu and scoreboard fit 390px; both final outcomes saved")
    page.locator("button[data-action='scoreboard-back']").click()
    for width in (320,430):
        page.set_viewport_size({"width":width,"height":844})
        assert not page.evaluate("document.documentElement.scrollWidth>innerWidth")
        page.locator("button[data-action='scoreboard']").click()
        assert not page.evaluate("document.documentElement.scrollWidth>innerWidth")
        page.locator("button[data-action='scoreboard-back']").click()
    page.locator("#archive-toggle").click()
    page.locator("#archive-search").fill("MKULTRA")
    expect(page.locator("#archive-list")).to_contain_text("MKULTRA")
    assert page.locator("#archive-list details").count() >= 1
    assert page.locator("#archive-list a.source-link").first.get_attribute("href").startswith("https://")
    page.locator("#archive-close").click()
    record("Archive search exposes evidence links; menu fits 320px and 430px")
    page.locator("button[data-action='launch']").click()
    page.evaluate("k=>{const s=JSON.parse(localStorage.getItem(k));s.deadline=Date.now()-1000;sessionStorage.setItem('__qa_restore',JSON.stringify(s));}", RUN)
    page.reload(wait_until="domcontentloaded")
    page.wait_for_function("!document.documentElement.hasAttribute('data-game-loading')", timeout=120000)
    page.wait_for_function("k=>JSON.parse(localStorage.getItem(k)).phase==='result'", arg=RUN)
    expired=state(page)
    assert expired["pristine"] is False and expired["hits"]==0 and expired["rounds"]==1
    record("Reloading an expired naming timer skips once and removes docking clearance")
    for phase in ("dead","escaped"):
        page.evaluate("([k,phase])=>{const s=JSON.parse(localStorage.getItem(k));s.phase=phase;s.hits=2;s.distance=95000;s.pristine=false;sessionStorage.setItem('__qa_restore',JSON.stringify(s));}",[RUN,phase])
        page.reload(wait_until="domcontentloaded")
        page.wait_for_function("!document.documentElement.hasAttribute('data-game-loading')", timeout=120000)
        expect(page.locator("button[data-action='launch']")).to_be_visible()
        assert state(page)["phase"]=="ready"
    record("Malformed terminal saves recover to the play menu without trapping the loader")
    home.set_viewport_size({"width":390,"height":844})
    preview.screenshot(path=str(OUT / "main-preview-mobile.png"))
    record("Main MOM home preview remains usable at phone width")
    browser.close()

(OUT / "report.json").write_text(json.dumps({"base":BASE,"checks":results},indent=2),encoding="utf-8")
print(json.dumps({"checks_passed":len(results),"artifacts":str(OUT)}),flush=True)
