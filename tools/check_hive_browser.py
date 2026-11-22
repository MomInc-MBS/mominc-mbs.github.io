"""Existing Playwright browser checks, extended for empirical pilot views.

Run against a local static server: HIVE_BASE=http://127.0.0.1:8877 python tools/check_hive_browser.py
Requires the already installed Playwright test environment. No model/agent needed.
"""
import json
import os
import hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

base=os.environ.get('HIVE_BASE','http://127.0.0.1:8877')
out=Path(os.environ.get('HIVE_QA_DIR','.qa/hive-empirical'));out.mkdir(parents=True,exist_ok=True)
manifest=json.loads(Path('hive/build-manifest.json').read_text())
errors,failed=[],[]
views={'STATUS':'Implementation Status','RUNS':'Experiment Registry','CAPABILITIES':'Capability Registry',
       'LEARNING':'Learning Progress','LEDGER':'Decision Ledger','GAPS':'Known Gaps','RELEASES':'Change / Release History',
       'PROTOTYPE':'Autonomous local prototype — v0.1',
       'CONTROLLER':'Adaptive verified controller — v0.2',
       'V03':'HIVE v0.3 foundation — 21 November 2026',
       'INTEGRATION':'HIVE v0.3.0.dev3 integration report',
       'READINESS':'HIVE v0.3.0.dev4 readiness report',
       'WORKING':'Video mission engineering alpha'}

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    ctx=browser.new_context(viewport={'width':1440,'height':1000},permissions=['clipboard-read','clipboard-write'],reduced_motion='reduce')
    page=ctx.new_page()
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('requestfailed',lambda r:failed.append(r.url+' '+str(r.failure)))
    assert page.goto(base+'/hive/').status==200
    expect(page.locator('.implementation-update')).to_contain_text('v0.3.0.dev4 ENGINEERING')
    expect(page.locator('.implementation-update')).to_contain_text('zero new model calls')
    expect(page.locator('.implementation-update')).to_contain_text('RESEARCH UNTESTED')
    expect(page.locator('.implementation-update')).to_contain_text('historical inventory candidate failed')
    page.locator('.implementation-update').scroll_into_view_if_needed()
    page.screenshot(path=str(out/'home-desktop.png'))
    page.locator('.implementation-update').get_by_role('link',name='Read the readiness report',exact=True).click()
    expect(page.locator('.prose h1')).to_have_text(views['READINESS'])
    readiness_publication=json.loads(Path('hive/implementation/readiness-dev4-publication.json').read_text())
    expect(page.locator('.prose')).to_contain_text(readiness_publication['status'])
    readiness_download=ctx.request.get(base+'/hive/'+readiness_publication['download'])
    assert readiness_download.status==200
    assert hashlib.sha256(readiness_download.body()).hexdigest()==readiness_publication['download_sha256']
    page.screenshot(path=str(out/'readiness-desktop.png'))
    page.goto(base+'/hive/search/?q=v0.3.0.dev4')
    expect(page.locator('#results a[href="/hive/notes/READINESS/"]')).to_have_count(1)
    page.goto(base+'/hive/graph/?focus=READINESS')
    expect(page.locator('#graph-selection h2')).to_have_text(views['READINESS'])
    page.goto(base+'/hive/')
    page.locator('.implementation-update').get_by_role('link',name='Implementation status',exact=True).click()
    expect(page.locator('.prose h1')).to_have_text('Implementation Status')
    for key,title in views.items():
        assert page.goto(base+'/hive/notes/'+key+'/').status==200
        expect(page.locator('.prose h1')).to_have_text(title)
        expect(page.locator('.prose')).to_contain_text('Level A is not accepted' if key=='WORKING' else 'Last verified:')
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),key
    page.goto(base+'/hive/notes/INTEGRATION/')
    expect(page.locator('.prose')).to_contain_text('Independent Terra acceptance is recorded')
    expect(page.locator('.prose')).to_contain_text('6 local requests')
    expect(page.locator('.prose')).to_contain_text('768 reserved generated tokens')
    expect(page.locator('.rendered-diagram svg')).to_have_count(1,timeout=20000)
    integration_publication=json.loads(Path('hive/implementation/integration-dev3-publication.json').read_text())
    integration_download=ctx.request.get(base+'/hive/'+integration_publication['download'])
    assert integration_download.status==200
    assert hashlib.sha256(integration_download.body()).hexdigest()==integration_publication['download_sha256']
    measured_download=ctx.request.get(base+'/hive/'+integration_publication['measured_source_download'])
    assert measured_download.status==200
    assert hashlib.sha256(measured_download.body()).hexdigest()==integration_publication['measured_source_download_sha256']
    page.screenshot(path=str(out/'integration-desktop.png'))
    page.locator('.rendered-diagram').scroll_into_view_if_needed()
    page.screenshot(path=str(out/'integration-diagram-desktop.png'))
    page.goto(base+'/hive/search/?q=v0.3.0.dev3')
    expect(page.locator('#results a[href="/hive/notes/INTEGRATION/"]')).to_have_count(1)
    page.goto(base+'/hive/graph/?focus=INTEGRATION')
    expect(page.locator('#graph-selection h2')).to_have_text(views['INTEGRATION'])
    page.goto(base+'/hive/notes/WORKING/')
    expect(page.locator('.prose')).to_contain_text('17 generated tokens')
    expect(page.locator('.prose')).to_contain_text('235 tests')
    expect(page.locator('.prose')).to_contain_text('2 Windows symlink skips')
    working_publication=json.loads(Path('hive/implementation/working-prototype-dev2-publication.json').read_text())
    working_download=ctx.request.get(base+'/hive/'+working_publication['download'])
    assert working_download.status==200
    assert hashlib.sha256(working_download.body()).hexdigest()==working_publication['download_sha256']
    page.screenshot(path=str(out/'working-desktop.png'))
    page.goto(base+'/hive/search/?q=video%20mission%20engineering')
    expect(page.locator('#results a[href="/hive/notes/WORKING/"]')).to_have_count(1)
    page.goto(base+'/hive/graph/?focus=WORKING')
    expect(page.locator('#graph-selection h2')).to_have_text(views['WORKING'])
    page.goto(base+'/hive/notes/CONTROLLER/')
    expect(page.locator('.prose')).to_contain_text('Repeated validation')
    adaptive_publication=json.loads(Path('hive/implementation/adaptive-v021-publication.json').read_text())
    adaptive_download=ctx.request.get(base+'/hive/'+adaptive_publication['download'])
    assert adaptive_download.status==200
    assert hashlib.sha256(adaptive_download.body()).hexdigest()==adaptive_publication['download_sha256']
    page.screenshot(path=str(out/'controller-desktop.png'))
    page.goto(base+'/hive/notes/V03/')
    expect(page.locator('.prose')).to_contain_text('1,008 generated tokens')
    expect(page.locator('.prose')).to_contain_text('E1 cannot freeze or run yet')
    v03_publication=json.loads(Path('hive/implementation/v03-foundation-publication.json').read_text())
    v03_download=ctx.request.get(base+'/hive/'+v03_publication['download'])
    assert v03_download.status==200
    assert hashlib.sha256(v03_download.body()).hexdigest()==v03_publication['download_sha256']
    expect(page.locator('.prose img')).to_have_count(1)
    assert page.locator('.prose img').evaluate('(el)=>el.complete && el.naturalWidth>0')
    page.screenshot(path=str(out/'v03-desktop.png'))
    page.goto(base+'/hive/notes/PROTOTYPE/')
    expect(page.locator('.prose')).to_contain_text('Learned candidate QUARANTINED')
    expect(page.locator('.prose table')).to_contain_text('23/24')
    page.screenshot(path=str(out/'prototype-desktop.png'))
    publication=json.loads(Path('hive/implementation/autonomous-v01-publication.json').read_text())
    download=ctx.request.get(base+'/hive/'+publication['download'])
    assert download.status==200
    assert hashlib.sha256(download.body()).hexdigest()==publication['download_sha256']
    instructions_url=base+'/hive/implementation/autonomous-v01/README.md'
    instructions_response=ctx.request.get(instructions_url)
    assert instructions_response.status==200
    assert hashlib.sha256(instructions_response.body()).hexdigest()==publication['snapshot_files']['README.md']
    # Markdown may render inline or download depending on the server's MIME
    # headers. Verify the observed user action and exact content in either case.
    instruction_downloads=[]
    page.on('download',lambda download:instruction_downloads.append(download))
    page.get_by_role('link',name='Run instructions',exact=True).click()
    if instruction_downloads:
        instructions=Path(instruction_downloads[0].path()).read_bytes()
        assert hashlib.sha256(instructions).hexdigest()==publication['snapshot_files']['README.md']
        # Exclude this navigation abort only after verifying downloaded bytes.
        download_abort=instructions_url+' net::ERR_ABORTED'
        failed[:]=[failure for failure in failed if failure!=download_abort]
    else:
        expect(page).to_have_url(instructions_url)
        expect(page.locator('body')).to_contain_text('HIVE local prototype')
    page.goto(base+'/hive/search/?q=autonomous%20local%20prototype')
    expect(page.locator('#results a[href="/hive/notes/PROTOTYPE/"]')).to_have_count(1)
    page.goto(base+'/hive/graph/?focus=PROTOTYPE')
    expect(page.locator('#graph-selection h2')).to_have_text(views['PROTOTYPE'])
    expect(page.locator('#graph-pages')).to_contain_text('STATUS')
    page.goto(base+'/hive/notes/LEARNING/')
    expect(page.locator('.prose')).to_contain_text('Compounding learning has not been demonstrated')
    expect(page.locator('.prose img')).to_have_count(1)
    assert page.locator('.prose img').evaluate('(el)=>el.complete && el.naturalWidth>0')
    page.locator('.prose img').scroll_into_view_if_needed()
    page.screenshot(path=str(out/'learning-desktop.png'))
    page.goto(base+'/hive/notes/GAPPLAN/')
    expect(page.locator('.rendered-diagram svg')).to_have_count(1,timeout=20000)
    expect(page.locator('.rendered-formula .katex')).to_have_count(5,timeout=20000)
    assert page.locator('.katex-error').count()==0
    # Existing research navigation, source fidelity and rendering remain operational.
    for key,diagrams in [('FRAMEWORK',2),('MAP',1),('ROADMAP',1),('B04',1),('original-HIVE_v0_1_Training_and_Build_Plan',2)]:
        page.goto(base+'/hive/notes/'+key+'/')
        expect(page.locator('.rendered-diagram svg')).to_have_count(diagrams,timeout=20000)
    page.goto(base+'/hive/notes/ADAPTIVE/')
    expect(page.locator('.rendered-formula .katex')).to_have_count(2,timeout=20000)
    expect(page.locator('.rendered-diagram svg')).to_have_count(1,timeout=20000)
    assert page.locator('#source-gaps li').count()==5
    page.goto(base+'/hive/notes/CODER/')
    expect(page.locator('.prose')).to_contain_text('0.4')
    page.locator('.copy-link').click()
    expect(page.locator('#toast')).to_have_text('Reference copied')
    assert '0.4' in page.evaluate('navigator.clipboard.readText()')
    page.goto(base+'/hive/search/?q=empirical%20pilot')
    expect(page.locator('#results a[href="/hive/notes/STATUS/"]')).to_have_count(1)
    page.get_by_role('button',name='Clear filters',exact=True).click()
    expect(page.locator('#results .result')).to_have_count(manifest['counts']['research_pages'])
    page.goto(base+'/hive/graph/?focus=STATUS')
    expect(page.locator('#graph-selection h2')).to_have_text('Implementation Status')
    expect(page.locator('#graph-pages')).to_contain_text('RUNS')
    page.get_by_role('button',name='Show full graph',exact=True).click()
    expect(page.locator('#research-graph circle')).to_have_count(manifest['counts']['research_pages'])
    expect(page.locator('#research-graph line')).to_have_count(manifest['counts']['graph_edges'])
    for width in (1024,900,390,320):
        page.set_viewport_size({'width':width,'height':844})
        for path in ['/hive/']+['/hive/notes/'+key+'/' for key in views]+['/hive/notes/GAPPLAN/','/hive/notes/ADAPTIVE/','/hive/graph/?focus=STATUS']:
            page.goto(base+path)
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),(width,path)
            if path=='/hive/notes/INTEGRATION/':
                expect(page.locator('.diagram-view svg')).to_have_count(1,timeout=20000)
                assert page.locator('.diagram-view').evaluate('(el) => el.scrollWidth <= el.clientWidth'),width
        if width==390:
            page.goto(base+'/hive/')
            page.get_by_role('button',name='Open navigation',exact=True).click()
            page.locator('#mobile-nav').get_by_role('link',name='Implementation status',exact=True).click()
            expect(page.locator('.prose h1')).to_have_text('Implementation Status')
            page.screenshot(path=str(out/'status-mobile.png'))
            page.goto(base+'/hive/notes/LEARNING/')
            page.locator('.prose img').scroll_into_view_if_needed()
            page.screenshot(path=str(out/'learning-mobile.png'))
            page.goto(base+'/hive/notes/PROTOTYPE/')
            page.screenshot(path=str(out/'prototype-mobile.png'))
            page.goto(base+'/hive/notes/V03/')
            page.screenshot(path=str(out/'v03-mobile.png'))
            page.goto(base+'/hive/notes/WORKING/')
            page.screenshot(path=str(out/'working-mobile.png'))
            page.goto(base+'/hive/notes/READINESS/')
            page.screenshot(path=str(out/'readiness-mobile.png'))
            page.goto(base+'/hive/notes/INTEGRATION/')
            page.locator('.rendered-diagram').scroll_into_view_if_needed()
            page.screenshot(path=str(out/'integration-diagram-mobile.png'))
    plain=browser.new_context(java_script_enabled=False)
    note=plain.new_page()
    for key in views:
        note.goto(base+'/hive/notes/'+key+'/')
        expect(note.locator('.prose h1')).to_have_text(views[key])
    plain.close();ctx.close();browser.close()
assert not errors,errors
assert not failed,failed
report=dict(ok=True,base=base,views=list(views),widths=[1440,1024,900,390,320],physical_phone=False,
            no_javascript=True,search_graph=True,existing_diagrams=7,adaptive_diagram=True,adaptive_equations=2,
            prototype_download_digest=True,prototype_search_graph=True,adaptive_download_digest=True,
            v03_download_digest=True,v03_chart_loaded=True,working_download_digest=True,working_search_graph=True,
            integration_download_digest=True,measured_source_download_digest=True,integration_search_graph=True,
            readiness_download_digest=True,readiness_search_graph=True,
            page_errors=errors,failed_requests=failed)
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
