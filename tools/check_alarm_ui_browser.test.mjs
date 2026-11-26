// Real-browser walk of apps/alarm/ui/demo.html at 390x844: NO-PROSE audit on every panel + evidence screenshots.
// node --test tools/check_alarm_ui_browser.test.mjs   (Playwright from PLAYWRIGHT_PKG, default D:/Repos/myr5-e2e; screenshots to ALARM_UI_SHOTS)
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {createReadStream, statSync, mkdirSync} from 'node:fs';
import {join, extname, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let chromium = null;
try { ({chromium} = createRequire(process.env.PLAYWRIGHT_PKG || 'D:/Repos/myr5-e2e/package.json')('playwright')); } catch (e) {}
const SHOTS = process.env.ALARM_UI_SHOTS || join(tmpdir(), 'alarm-ui-shots');
const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.json': 'application/json'};

// In-page audit: visible text outside inputs must be digits/time/date/%/math/tile values; no tooltips, no validation bubbles, names on every control.
function audit() {
  const OK = /^[\d\s:/.,%+\-−×÷=<>±·]*$/;
  const hiddenUp = el => { for (let e = el; e && e !== document.documentElement; e = e.parentElement) { if (e.classList?.contains('vh')) return 'vh'; if (e.hasAttribute?.('data-user')) return 'user'; } return null; };
  const shown = el => { const r = el.getBoundingClientRect(); return r.width >= 2 && r.height >= 2 && (!el.checkVisibility || el.checkVisibility({opacityProperty: true, visibilityProperty: true})); };
  const rgb = s => (s.match(/[\d.]+/g) || [0, 0, 0, 0]).map(Number);
  const lum = ([r, g, b]) => { const f = c => (c /= 255) <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };
  const bgOf = el => { for (let e = el; e; e = e.parentElement) { const c = rgb(getComputedStyle(e).backgroundColor); if ((c[3] ?? 1) >= .85) return c; } return [18, 8, 31]; };
  const opac = el => { let o = 1; for (let e = el; e; e = e.parentElement) o *= +getComputedStyle(e).opacity; return o; };
  const out = {prose: [], contrast: [], titles: [], svgText: 0, forms: 0, placeholders: [], unnamed: [], small: []};
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode());) {
    const t = n.nodeValue.trim(), p = n.parentElement; if (!t || !p || p.closest('script,style,option,select,textarea,title')) continue;
    const hu = hiddenUp(p); if (hu || !shown(p)) continue;
    if (!OK.test(t)) out.prose.push(t.slice(0, 40));
    if (p.closest('[disabled],[aria-disabled=true]')) continue;
    const cs = getComputedStyle(p), fg = rgb(cs.color), bg = bgOf(p), o = opac(p), mix = fg.slice(0, 3).map((c, i) => c * o + bg[i] * (1 - o));
    const big = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.6 && +cs.fontWeight >= 700), r = ratio(mix, bg);
    if (r < (big ? 3 : 4.5)) out.contrast.push(`${t.slice(0, 12)} ${r.toFixed(2)}`);
  }
  out.titles = [...document.querySelectorAll('body [title]')].map(e => e.outerHTML.slice(0, 60));
  out.svgText = document.querySelectorAll('svg title, svg text, svg desc').length;
  out.forms = document.querySelectorAll('form:not([novalidate]), [required], [pattern]').length;
  out.placeholders = [...document.querySelectorAll('[placeholder]')].map(e => e.placeholder).filter(p => !['Title', 'URL', 'Code', 'Note'].includes(p));
  const ctl = [...document.querySelectorAll('button, input:not([type=file]), select, [role=switch], [role=spinbutton], [role=radio], [role=tab]')].filter(e => shown(e) && !hiddenUp(e));
  out.unnamed = ctl.filter(e => !(e.getAttribute('aria-label') || e.labels?.length || e.getAttribute('aria-labelledby'))).map(e => e.outerHTML.slice(0, 80));
  out.small = ctl.filter(e => !e.closest('.chal')).map(e => [e, e.getBoundingClientRect()]).filter(([, r]) => r.width < 47.5 || r.height < 47.5).map(([e, r]) => `${e.className || e.tagName} ${r.width | 0}x${r.height | 0}`);
  return out;
}

test('alarm settings UI: wordless audit + evidence in a real browser', {skip: !chromium && 'playwright not installed', timeout: 240_000}, async () => {
  mkdirSync(SHOTS, {recursive: true});
  const srv = http.createServer((q, r) => {
    const f = join(ROOT, decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/\.\./g, ''));
    try { if (!statSync(f).isFile()) throw 0; } catch { r.writeHead(404); return r.end(); }
    r.writeHead(200, {'content-type': TYPES[extname(f)] || 'application/octet-stream', 'cache-control': 'no-store'}); createReadStream(f).pipe(r);
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${srv.address().port}/apps/alarm/ui/demo.html`;
  const browser = await chromium.launch({channel: process.env.PW_CHANNEL || 'msedge', headless: true});
  const fails = [];
  const ctxOpts = {viewport: {width: 390, height: 844}, deviceScaleFactor: 2, hasTouch: false, locale: 'en-US', timezoneId: 'America/Los_Angeles'};
  const open = async (q = '') => {
    const ctx = await browser.newContext(ctxOpts), page = await ctx.newPage(), errs = [];
    await page.addInitScript(() => { window.__raf = 0; const r = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = cb => { window.__raf++; return r(cb); }; });
    page.on('pageerror', e => errs.push(String(e))); page.on('dialog', d => { fails.push('dialog: ' + d.message()); d.dismiss(); });
    await page.goto(base + q); await page.waitForSelector('.rem'); await page.waitForTimeout(500);
    return {ctx, page, errs};
  };
  const check = async (page, name) => {
    const a = await page.evaluate(audit);
    for (const [k, v] of Object.entries(a)) if (Array.isArray(v) ? v.length : v) fails.push(`${name}: ${k} ${JSON.stringify(v).slice(0, 300)}`);
  };
  const shot = (page, name) => page.screenshot({path: join(SHOTS, name + '.png')});
  const k = (page, key) => page.locator(`[data-k="${key}"]`).first();
  const calls = page => page.evaluate(() => window.__adapter.calls.map(c => c.name));
  try {
    // ---- idle: list, reaction mid-animation, every rail panel, edit flow ----
    {
      const {ctx, page, errs} = await open();
      await check(page, 'list'); await shot(page, '01-list');
      await page.waitForTimeout(600); const raf0 = await page.evaluate(() => window.__raf); await page.waitForTimeout(1000);
      assert.equal(await page.evaluate(() => window.__raf), raf0, 'idle face does no frame work');
      await page.evaluate(() => window.__ui.face.react('concern')); await page.waitForTimeout(190); await shot(page, '02-reaction-concern-mid');
      await k(page, 'open:r_laundry').click(); await page.waitForTimeout(300);
      await check(page, 'edit-weekly'); await shot(page, '03-edit-clock-weekly');
      await page.locator('.ms-panel').evaluate(p => p.scrollTo(0, 99999)); await page.waitForTimeout(150); await shot(page, '04-edit-clock-bottom');
      await page.locator('.ms-panel').evaluate(p => p.scrollTo(0, 0));
      for (const kind of ['once', 'dates', 'interval']) { await k(page, 'kind:' + kind).click(); await page.waitForTimeout(150); await check(page, 'edit-' + kind); await shot(page, '05-edit-' + kind); }
      await k(page, 'kind:weekly').click();
      // keyboard wheel: ArrowUp increments the hour, preview dates follow
      await k(page, 'hh').focus(); await page.keyboard.press('ArrowUp'); await page.waitForTimeout(100);
      assert.equal(await k(page, 'hh').getAttribute('aria-valuenow'), '8', 'hour wheel increments by keyboard');
      await page.locator('.wk-c').nth(1).click(); await page.waitForTimeout(100);
      assert.ok(await page.locator('.up-c').count() >= 3, 'upcoming dates shown');
      await k(page, 'tab:sound').click(); await page.waitForTimeout(250); await check(page, 'sound'); await shot(page, '06-panel-sound');
      await k(page, 'aud').click(); await page.waitForTimeout(140); await shot(page, '07-reaction-tilt-audition');
      assert.ok((await calls(page)).includes('audition'), 'audition only on explicit tap');
      await k(page, 'aud').click();
      assert.ok((await calls(page)).includes('stopAudition'), 'square stops the audition');
      await page.locator('.ms-panel').evaluate(p => p.scrollTo(0, 99999)); await page.waitForTimeout(100); await shot(page, '08-panel-sound-bottom');
      await k(page, 'tab:screen').click(); await page.waitForTimeout(200); await check(page, 'screen'); await shot(page, '09-panel-screen');
      await k(page, 'tab:challenge').click(); await k(page, 'extra:math').click(); await k(page, 'try').click(); await page.waitForTimeout(150);
      await check(page, 'challenge-math'); await shot(page, '10-panel-challenge-math');
      const eq = await page.locator('.chal-eq span').innerText(); const [a, , b, op, c] = eq.replace('=', '').trim().split(' ');
      const ans = String(op === '+' ? a * b + +c : a * b - c);
      for (const d of ans) await page.locator(`.chal-keys [data-d="${d}"]`).click();
      await page.locator('.chal-keys [data-d="ok"]').click(); assert.equal(await page.locator('.chal[data-solved]').count(), 1, 'math challenge solvable');
      await k(page, 'extra:pattern').click(); await k(page, 'try').click(); await page.waitForTimeout(100); await check(page, 'challenge-pattern'); await shot(page, '11-panel-challenge-pattern');
      await k(page, 'extra:qr').click(); await page.waitForTimeout(100); await check(page, 'challenge-qr');
      await k(page, 'tab:devices').click(); await page.waitForTimeout(150); await check(page, 'devices'); await shot(page, '12-panel-devices');
      await k(page, 'cap:push').click(); await page.waitForTimeout(450);
      assert.ok((await calls(page)).includes('request'), 'permission key requests that capability');
      // silent preview: no save / audition / scheduling while previewing
      const before = (await calls(page)).length;
      await k(page, 'pv').click(); await page.waitForTimeout(400); await check(page, 'preview'); await shot(page, '13-preview-silent');
      await page.waitForTimeout(1800); await k(page, 'pvstop').click();
      const during = (await calls(page)).slice(before).filter(n => !['list', 'capabilities', 'history'].includes(n));
      assert.deepEqual(during, [], 'preview never calls the adapter');
      await k(page, 'tab:clock').click(); await k(page, 'del').click(); await page.waitForTimeout(100); await check(page, 'delete-confirm'); await shot(page, '14-delete-confirm');
      await k(page, 'delno').click();
      await k(page, 'save').click(); await page.waitForSelector('.rem'); await page.waitForTimeout(120); await shot(page, '15-saved-nod');
      const saved = await page.evaluate(() => window.__adapter.calls.filter(c => c.name === 'save').at(-1).args[0]);
      assert.equal(saved.confirmed.rev, saved.rev, 'arm = confirmed.rev equals rev');
      // new reminder: explicit sound pick required before arming
      const saves0 = (await calls(page)).filter(n => n === 'save').length;
      await k(page, 'add').click(); await page.waitForTimeout(150); await check(page, 'new'); await shot(page, '16-new-needs-sound');
      await k(page, 'save').click({force: true}); await page.waitForTimeout(200);
      assert.equal(await page.locator('[data-k="tab:sound"]').getAttribute('aria-selected'), 'true', 'arming without a sound goes to the sound pick');
      assert.equal((await calls(page)).filter(n => n === 'save').length, saves0, 'no save without a sound');
      await shot(page, '17-new-sound-required');
      await k(page, 'snd:train-horn').click(); await k(page, 'tab:clock').click(); await k(page, 'title').fill('Trash night');
      await k(page, 'save').click(); await page.waitForTimeout(500);
      assert.equal(await page.locator('.rem').count(), 4, 'new reminder armed');
      // invalid value: outlined field + warning triangle, concern reaction, no fake success
      await k(page, 'open:r_pills').click(); await k(page, 'tab:devices').click(); await k(page, 'url').fill('http://lamp.local/hook');
      await k(page, 'save').click(); await page.waitForTimeout(450);
      assert.equal(await page.locator('[data-field="webhook"].bad .errw').count(), 1, 'invalid URL marked');
      assert.equal(await k(page, 'url').getAttribute('aria-invalid'), 'true');
      await check(page, 'invalid'); await shot(page, '31-invalid-field');
      await k(page, 'url').fill(''); await k(page, 'back').click();
      await k(page, 'tab:history').click(); await page.waitForSelector('.hist'); await check(page, 'history'); await shot(page, '18-panel-history');
      await k(page, 'tab:prefs').click(); await page.waitForTimeout(500); await check(page, 'prefs'); await shot(page, '19-panel-prefs');
      await k(page, 'upd').click(); await page.waitForTimeout(300); await shot(page, '20-update-ring'); await page.waitForTimeout(1500); await check(page, 'update');
      const dl = page.waitForEvent('download'); await k(page, 'exp').click(); await dl; await page.waitForTimeout(200);
      await page.locator('input[type=file]').setInputFiles({name: 'x.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({reminders: [{time: '06:00'}]}))});
      await page.waitForTimeout(700); await check(page, 'import'); await shot(page, '21-export-import');
      assert.ok(errs.length === 0, 'no page errors: ' + errs.join(' | '));
      await ctx.close();
    }
    // ---- stages 1..4: face states + lock/unlock ----
    for (const s of [1, 2, 3, 4]) {
      const {ctx, page, errs} = await open('?stage=' + s);
      const snap = await page.evaluate(() => window.__adapter.snapshot());
      assert.equal(snap.emotion, ['happy', 'upset', 'furious', 'furious'][s - 1]);
      assert.equal(await page.locator('.ms-stop').isVisible(), true, 'emergency stop shown while active');
      assert.equal(await page.locator('.ms-top .lk.open').count(), s === 4 ? 1 : 0, 'unlock only at stage 4');
      await page.waitForTimeout(400); await check(page, 'stage' + s); await shot(page, `2${1 + s}-stage${s}`);
      assert.ok(errs.length === 0, errs.join());
      await ctx.close();
    }
    // ---- locked Settings-Off: countdown digits, tap = glance only; emergency hold ----
    {
      const {ctx, page} = await open('?locked=1');
      const lock = page.locator('.rem .lockbtn').first(); await lock.waitFor();
      const t1 = await lock.locator('.cd').innerText(); assert.match(t1, /^\d{2}:\d{2}:\d{2}$/);
      await lock.click(); await page.waitForTimeout(1100);
      assert.ok(!(await calls(page)).includes('setEnabled'), 'locked off: tapping only glances');
      assert.notEqual(await lock.locator('.cd').innerText(), t1, 'countdown is live');
      await check(page, 'locked'); await shot(page, '26-locked-off-countdown');
      const box = await page.locator('.ms-stop').boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.waitForTimeout(1500);
      await shot(page, '27-emergency-hold-mid'); await page.mouse.up(); await page.waitForTimeout(200);
      assert.ok(!(await calls(page)).includes('emergencyStop'), 'released early: no stop');
      await page.mouse.down(); await page.waitForTimeout(3300); await page.mouse.up(); await page.waitForTimeout(300);
      assert.ok((await calls(page)).includes('emergencyStop'), '3 s hold stops');
      assert.equal(await page.locator('.ms-stop').isVisible(), false); await shot(page, '28-after-emergency');
      await ctx.close();
    }
    // ---- reduced motion + high contrast ----
    for (const [q, name] of [['?rm=1&stage=3&sync=1', '29-reduced-motion'], ['?hc=1&stage=2', '30-high-contrast']]) {
      const {ctx, page} = await open(q);
      await check(page, name); await shot(page, name);
      await k(page, 'open:r_pills').click(); await page.waitForTimeout(200); await check(page, name + '-edit'); await shot(page, name + '-edit');
      await ctx.close();
    }
  } finally { await browser.close(); srv.close(); }
  assert.deepEqual(fails, [], fails.join('\n'));
});
