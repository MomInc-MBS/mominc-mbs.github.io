"""Browser regression checks for the home preview and the real standalone game route.

Uses the actual main-site paths; all game records stay in the test browser.
Documented fallback only: prefer the shared T3 browser while it is available.
Do not run this standalone driver concurrently with collaborative browser QA.
Fallback run: python tools/check_misinformation_ui.py http://127.0.0.1:5190
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

def answer(page, correct=True, tier=5):
    choice = page.evaluate("""async tier=>{const {subjects,questions}=await import('./catalog.js');
        const s=JSON.parse(localStorage.getItem('mom-misinformation-flight-v1'));
        const q=questions.find(q=>q.id===s.question);
        const subject=subjects.find(s=>s.id===q.answers.find(a=>a.tier===tier).id);
        return {name:subject.name,classification:subject.classification};}""", tier)
    page.locator("#answer").fill(choice["name"])
    page.locator("#answer-form button[type=submit]").click()
    expected = choice["classification"]
    if not correct:
        expected = "claim" if expected == "event" else "event"
    page.locator(f"button[data-choice='{expected}']").click()
    return state(page)


def journey_frame(page):
    return page.evaluate("""async()=>{
      const scene=document.querySelector('#space-scene');
      const background=getComputedStyle(scene.querySelector('.space-art')).backgroundImage;
      const matched=background.match(/url\\([\"']?([^\"')]+)[\"']?\\)/);
      if(!matched||!matched[1].includes('/journey/'))throw Error('Journey artwork is not bound to this location');
      const image=new Image();image.src=matched[1];await image.decode();
      return {level:Number(scene.dataset.level),title:document.querySelector('#location-title').textContent,
        image:matched[1],loaded:image.naturalWidth>0};
    }""")

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
        page.wait_for_function("!document.documentElement.hasAttribute('data-game-loading')", timeout=180000)
    except Exception:
        page.screenshot(path=str(OUT / "loading-failure.png"))
        print(page.locator("body").inner_text()[:1500], flush=True)
        print(page.evaluate("({scripts:[...document.scripts].map(s=>({src:s.src,type:s.type})),loader:!!window.MBS_LOAD})"), flush=True)
        raise
    expect(page.locator("button[data-action='launch']")).to_be_visible()
    expect(page.locator("#screen .preflight")).to_contain_text("35s")
    catalog=page.evaluate("""async()=>{const {subjects,questions}=await import('./catalog.js');return {
      subjects:subjects.length,questions:questions.length,
      commonMajority:questions.every(q=>q.answers.filter(a=>a.tier===0).length>q.answers.length/2),
      minPrompts:Math.min(...subjects.map(s=>questions.filter(q=>q.answers.some(a=>a.id===s.id)).length))};}""")
    assert catalog["subjects"]>=204 and catalog["questions"]>=160 and catalog["commonMajority"] and catalog["minPrompts"]>=10
    record("Reviewed bank has at least 204 answers, broad pools and common-answer majorities",**catalog)
    assert page.locator(".depth-chart li").count() == 20
    assert page.locator("#route-list li").count() == 20
    itinerary=page.evaluate("""async()=>{const {LEVELS,ANSWER_TIME_MS}=await import('./engine.js');
      return {names:LEVELS.map(l=>l.name),answerTime:ANSWER_TIME_MS};}""")
    assert len(itinerary["names"])==20 and itinerary["answerTime"]==35000
    assert page.locator("#route-list li").count()==len(itinerary["names"])
    for index,name in enumerate(itinerary["names"]):
        expect(page.locator("#route-list li").nth(index)).to_contain_text(name)
    page.wait_for_function("[...document.querySelectorAll('.saucer img')].every(e=>e.complete&&e.naturalWidth>0)")
    record("Actual preview link opens dedicated play menu and loader completes")
    page.locator("button[data-action='scoreboard']").click()
    expect(page.locator("#screen")).to_contain_text("THIS BROWSER ONLY")
    page.locator("button[data-action='scoreboard-back']").click()
    page.locator("button[data-action='launch']").click()
    # A short rejected answer stays local, avoiding an external hosted-judge call.
    before=state(page)
    assert before["remaining"]==35000
    page.locator("#answer").fill("?")
    page.locator("#answer-form button[type=submit]").click()
    after=state(page)
    assert after["phase"] == "answer" and after["hits"] == 0 and after["deadline"] == before["deadline"]
    record("Invalid answer retries without damage or a fresh timer")
    initial=journey_frame(page)
    assert initial["level"]==0 and initial["title"]==itinerary["names"][0] and initial["loaded"]
    levels={initial["level"]}
    artwork={initial["image"]}
    winning_questions=[]
    for i in range(20):
        winning_questions.append(state(page)["question"])
        after=answer(page,tier=0)
        frame=journey_frame(page)
        assert frame["loaded"] and frame["title"]==itinerary["names"][frame["level"]]
        assert after["distance"]==(i+1)*5000
        assert frame["level"]==min(i+1,19)
        levels.add(frame["level"])
        artwork.add(frame["image"])
        if after["phase"] == "escaped":
            break
        page.locator("button[data-action='next']").click()
    assert after["phase"] == "escaped" and after["distance"] == 100000 and after["score"] == 200
    assert after["rounds"]==20 and after["pristine"] is False
    assert len(levels)==20 and len(artwork)==20
    assert len(set(winning_questions))==20
    page.locator("#space-scene").screenshot(path=str(OUT / "mothership-desk.png"))
    record("Twenty common correct answers escape through all twenty distinct paper locations", levels=sorted(levels))
    page.locator("button[data-action='scoreboard']").click()
    expect(page.locator("#screen")).to_contain_text("ESCAPED")
    page.reload(wait_until="domcontentloaded")
    page.wait_for_function("!document.documentElement.hasAttribute('data-game-loading')", timeout=120000)
    saved=page.evaluate("k=>JSON.parse(localStorage.getItem(k)).runs", SCORES)
    assert len(saved)==1 and saved[0]["outcome"]=="escaped" and saved[0]["pristine"] is False and saved[0]["score"]==200
    record("Ordinary escaped run persists and reload does not duplicate its scoreboard row")
    page.locator("button[data-action='restart']").click()
    page.locator("button[data-action='launch']").click()
    for i in range(14):
        after=answer(page,tier=5)
        if i<13:
            assert after["phase"]=="result"
            page.locator("button[data-action='next']").click()
    assert after["phase"]=="escaped" and after["distance"]==100000 and after["score"]==1400 and after["rounds"]==14
    record("Rarest correct answers escape faster in fourteen transmissions")
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
    assert page.locator("#screen tbody tr").count()==3
    page.locator("#terminal").screenshot(path=str(OUT / "mobile-scoreboard.png"))
    record("Mobile play menu and scoreboard fit 390px; ordinary escape, rare escape and recall saved")
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
    page.locator("button[data-action='next']").click()
    recovered=answer(page,tier=0)
    assert recovered["phase"]=="result" and recovered["distance"]==5000 and recovered["hits"]==0 and recovered["rounds"]==2
    expect(page.locator("button[data-action='next']")).to_contain_text("CONTINUE ESCAPE")
    record("Expired timer skips once without damage and the next common answer resumes escape")
    page.locator("button[data-action='next']").click()
    legacy_deadline=page.evaluate("""k=>{const s=JSON.parse(localStorage.getItem(k));delete s.progressionVersion;
      s.deadline=Date.now()+10000;s.remaining=10000;sessionStorage.setItem('__qa_restore',JSON.stringify(s));return s.deadline;}""",RUN)
    page.reload(wait_until="domcontentloaded")
    page.wait_for_function("!document.documentElement.hasAttribute('data-game-loading')", timeout=120000)
    migrated=state(page)
    assert migrated["progressionVersion"]==2 and migrated["deadline"]==legacy_deadline+10000
    page.reload(wait_until="domcontentloaded")
    page.wait_for_function("!document.documentElement.hasAttribute('data-game-loading')", timeout=120000)
    assert state(page)["deadline"]==migrated["deadline"]
    record("Legacy active naming saves gain the extra ten seconds exactly once")
    for phase in ("dead","escaped"):
        page.evaluate("([k,phase])=>{const s=JSON.parse(localStorage.getItem(k));s.phase=phase;s.hits=2;s.distance=95000;s.pristine=false;sessionStorage.setItem('__qa_restore',JSON.stringify(s));}",[RUN,phase])
        page.reload(wait_until="domcontentloaded")
        page.wait_for_function("!document.documentElement.hasAttribute('data-game-loading')", timeout=120000)
        expect(page.locator("button[data-action='launch']")).to_be_visible()
        assert state(page)["phase"]=="ready"
    record("Malformed terminal saves recover to the play menu without trapping the loader")
    # Restarts should not reset the browser's transmission rotation.
    page.set_viewport_size({"width":390,"height":844})
    openings=[]
    for i in range(8):
        page.locator("button[data-action='launch']").click()
        openings.append(state(page)["question"])
        if i<7:
            page.locator("#restart").click()
    assert len(set(openings))==8
    pools=page.evaluate("""async ids=>{const {questions}=await import('./catalog.js');return ids.map(id=>questions.find(q=>q.id===id).poolId);}""",openings)
    assert len(set(pools))==8
    record("Eight fresh runs rotate both wording and accepted-answer scopes")
    def frame():
        return page.evaluate("""()=>({player:parseFloat(document.querySelector('#rocket').style.bottom),
          mini:parseFloat(document.querySelector('#mobile-chase').style.getPropertyValue('--mini-player-x')),
          ordinal:Number(document.querySelector('#mobile-chase').dataset.motionOrdinal)})""")
    previous=frame()
    after=answer(page,tier=0)
    current=frame()
    assert after["distance"]==5000 and after["score"]==10 and current["player"]>previous["player"] and current["mini"]>previous["mini"]
    page.wait_for_function("()=>{const r=document.querySelector('#mobile-chase').getBoundingClientRect(),t=document.querySelector('#terminal').getBoundingClientRect();return r.top>=-1&&r.bottom<innerHeight&&r.height>90&&t.top>=r.bottom+6&&t.top<innerHeight/2;}")
    page.screenshot(path=str(OUT/"mobile-chase-answer.png"))
    previous=current
    page.locator("button[data-action='next']").click()
    after=answer(page,False,tier=0)
    current=frame()
    assert after["distance"]==5000 and after["score"]==10 and after["hits"]==1 and current["mini"]>previous["mini"]
    previous=current
    page.locator("button[data-action='next']").click()
    page.locator("button[data-action='skip']").click()
    current=frame()
    assert state(page)["distance"]==5000 and state(page)["hits"]==1 and current["mini"]>previous["mini"] and current["ordinal"]==3
    page.reload(wait_until="domcontentloaded")
    page.wait_for_function("!document.documentElement.hasAttribute('data-game-loading')", timeout=120000)
    assert frame()==current
    assert not page.locator("#mobile-chase").evaluate("e=>e.classList.contains('flight-step')")
    record("Common answer, miss and pass each move orange closer; mobile chase stays visible and reload-stable")
    page.emulate_media(reduced_motion="reduce")
    page.locator("button[data-action='next']").click()
    after=answer(page,tier=0)
    assert frame()["mini"]>current["mini"]
    assert not page.locator("#mobile-chase").evaluate("e=>e.classList.contains('flight-step')")
    assert not page.evaluate("document.documentElement.scrollWidth>innerWidth")
    record("Reduced motion keeps chase progress visible without animated pulses")
    home.set_viewport_size({"width":390,"height":844})
    preview.screenshot(path=str(OUT / "main-preview-mobile.png"))
    record("Main MOM home preview remains usable at phone width")
    browser.close()

(OUT / "report.json").write_text(json.dumps({"base":BASE,"checks":results},indent=2),encoding="utf-8")
print(json.dumps({"checks_passed":len(results),"artifacts":str(OUT)}),flush=True)
