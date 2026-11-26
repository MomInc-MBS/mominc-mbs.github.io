// Endless Corgi flashlight check: the beam must clearly light the hall walls, and the room must stay dark without it.
// Run: node tools/check_corgi_flashlight.mjs   (needs `playwright` resolvable, or PLAYWRIGHT_PATH=<.../playwright/index.mjs>)
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import {fileURLToPath, pathToFileURL} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const {chromium} = await import(process.env.PLAYWRIGHT_PATH ? pathToFileURL(process.env.PLAYWRIGHT_PATH).href : 'playwright');
const HARNESS = `<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/apps/shell.css><link rel=stylesheet href=/apps/corgi/app.css>
<section id=stage><div id=host></div></section><script type=module>import {mountCorgi} from '/apps/corgi/app.mjs'; await mountCorgi(document.getElementById('host'), {endless:true});</script>`;
const types = {'.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.png': 'image/png'};
const server = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  if (u === '/__h.html') return r.writeHead(200, {'content-type': 'text/html'}).end(HARNESS);
  const f = path.join(root, u);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return r.writeHead(404).end();
  r.writeHead(200, {'content-type': types[path.extname(f)] || 'application/octet-stream'}).end(fs.readFileSync(f));
}).listen(0);
const b = await chromium.launch({args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
const p = await (await b.newContext({viewport: {width: 390, height: 844}, hasTouch: true, isMobile: true})).newPage();
await p.goto(`http://localhost:${server.address().port}/__h.html`);
await p.waitForSelector('#ccFlashBtn'); await p.waitForTimeout(4000);
// mean luminance (0-255) of the left and right wall bands, from a screenshot decoded in-page
const walls = async png => p.evaluate(async b64 => {
  const bmp = await createImageBitmap(await (await fetch('data:image/png;base64,' + b64)).blob());
  const c = new OffscreenCanvas(bmp.width, bmp.height), g = c.getContext('2d'); g.drawImage(bmp, 0, 0);
  const mean = (x, y, w, h) => { const d = g.getImageData(x, y, w, h).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += .2126 * d[i] + .7152 * d[i + 1] + .0722 * d[i + 2]; return s / (d.length / 4); };
  return (mean(15, 230, 85, 270) + mean(290, 230, 85, 270)) / 2;
}, png.toString('base64'));
const off = await walls(await p.screenshot());
await p.tap('#ccFlashBtn'); await p.waitForTimeout(1500);
if (await p.getAttribute('#ccFlashBtn', 'aria-pressed') !== 'true') throw new Error('flashlight button did not turn on');
const on = await walls(await p.screenshot());
await b.close(); server.close();
const gain = on / off;
console.log(`walls off ${off.toFixed(1)} on ${on.toFixed(1)} gain x${gain.toFixed(2)}`);
const fails = [];
if (off > 20) fails.push(`room not dark enough with flashlight off (${off.toFixed(1)} > 20)`);
if (gain < 3.5) fails.push(`beam gain ${gain.toFixed(2)} < 3.5`);
if (on < 40) fails.push(`beam-lit wall luminance ${on.toFixed(1)} < 40`);
if (fails.length) { console.error('FAIL: ' + fails.join('; ')); process.exit(1); }
console.log('PASS');
