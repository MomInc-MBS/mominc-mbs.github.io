// Builds apps/releases.json + apps/releases.json.sig (the suite release manifest, see D:/outputs/moms-suite-1125/CONTRACT.md).
//   node tools/build_releases.mjs [--root DIR] [--out DIR] [--key PEM] [--pub SPKI_B64]
// APK entries: the highest-versionCode APK in download/<dir>/ for the app's package, read with aapt2 + apksigner. Fails if none exists,
//   if a file apps.json points at is missing, or if the .sha256 sidecar disagrees. PWA entries: the pack hash (tv/game-packs/app-<id>.json,
//   a git-blob revision per file) so any changed file changes the version. Signature: base64 DER ECDSA P-256/SHA-256 over the exact bytes.
// The private key is only ever read from its own path (default below); nothing here copies, prints or stores it.
// Unchanged content leaves both files untouched (ECDSA signatures are not deterministic, so re-signing would just make noise).
import {createHash, createPublicKey, sign, verify} from 'node:crypto';
import {existsSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const ROOT = resolve(arg('root', join(dirname(fileURLToPath(import.meta.url)), '..')));
const OUT = resolve(arg('out', join(ROOT, 'apps')));
const KEY = arg('key', process.env.MOM_RELEASE_KEY || 'C:/Users/ianmy/.mom-release/release-signing-key.pem');
const PUB = arg('pub', 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEcBUWrysCdm9LWngf7q++NDkA0aBfDbwlmxtIji5el+RTKaLsh0eyf0p9lq2mJJRRYbQQnerFWc5O03dbRb+OPg==');
const SITE = 'https://mominc.online';
const COACH = JSON.parse(readFileSync(join(ROOT, 'apps/apps.json'), 'utf8')).apps.find(a => a.id === 'coach');   // MYR5 Simple: pending until /apps/coach/ exists

// Native apps. `dir` holds every published APK of the app (old files stay for old URLs); `ref` is the apps.json record that points at it.
const APKS = [
  {id: 'alarm', pkg: 'com.mominc.alarm2048', dir: 'download/alarm', notes: "MOM's: 2048 Reminder."},
  {id: 'lilboyfriend', pkg: 'com.mominc.littleboyfriend', dir: 'download/lilboyfriend', notes: "MOM's: Little Boyfriend LIVE."},
];
const PWAS = ['fuel', 'jump', 'misinformation', 'hand', 'alarm', 'corgi'];   // apps/<id>/ shells, content version = their pack
const fail = m => { console.error('build_releases: ' + m); process.exit(1); };

function tool(name) {
  const homes = [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT, process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Android/Sdk'), 'D:/Tools/Android'].filter(Boolean);
  for (const h of homes) {
    const bt = join(h, 'build-tools');
    if (!existsSync(bt)) continue;
    for (const v of readdirSync(bt).sort().reverse()) if (existsSync(join(bt, v, name + '.exe')) || existsSync(join(bt, v, name))) return join(bt, v);
  }
  fail(`Android build-tools (${name}) not found; set ANDROID_HOME`);
}
const java = () => [process.env.JAVA_HOME && join(process.env.JAVA_HOME, 'bin/java.exe'), 'C:/Tools/jdk-21/bin/java.exe'].find(p => p && existsSync(p)) || 'java';

function inspect(file) {
  const bt = tool('aapt2');
  const badge = execFileSync(join(bt, 'aapt2.exe'), ['dump', 'badging', file], {encoding: 'utf8', maxBuffer: 1 << 26});
  const head = /package: name='([^']+)' versionCode='(\d+)' versionName='([^']+)'/.exec(badge);
  const min = /minSdkVersion:'(\d+)'/.exec(badge);
  if (!head || !min) fail(`${file}: aapt2 could not read package/version/minSdk`);
  const certs = execFileSync(java(), ['-jar', join(bt, 'lib/apksigner.jar'), 'verify', '--print-certs', file], {encoding: 'utf8'});
  const signers = [...certs.matchAll(/Signer #\d+ certificate SHA-256 digest: ([0-9a-f]{64})/g)].map(m => m[1]);
  if (signers.length !== 1) fail(`${file}: expected exactly one signer, saw ${signers.length}`);
  return {package: head[1], versionCode: Number(head[2]), versionName: head[3], minSdk: Number(min[1]), signerSha256: signers[0]};
}

function apkEntry({id, pkg, dir, notes}) {
  const d = join(ROOT, dir);
  if (!existsSync(d)) fail(`${id}: ${dir} is missing`);
  const found = readdirSync(d).filter(f => f.endsWith('.apk')).map(f => ({f, ...inspect(join(d, f))})).filter(a => a.package === pkg);
  if (!found.length) fail(`${id}: no APK for ${pkg} in ${dir}`);
  const best = found.sort((a, b) => b.versionCode - a.versionCode)[0];
  const bytes = readFileSync(join(d, best.f));
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const sidecar = join(d, best.f + '.sha256');
  if (!existsSync(sidecar)) fail(`${id}: ${best.f}.sha256 is missing`);
  if (readFileSync(sidecar, 'utf8').trim().split(/\s+/)[0] !== sha256) fail(`${id}: ${best.f}.sha256 does not match the APK bytes`);
  return {id, platform: 'android', channel: 'stable', package: pkg, versionCode: best.versionCode, versionName: best.versionName, minSdk: best.minSdk,
    url: `${SITE}/${dir}/${best.f}`, sha256, signerSha256: best.signerSha256, size: bytes.length, notes: `${notes} Version ${best.versionName}.`};
}

// Files apps.json points at must exist even when they are not the newest (a dangling catalog link is a broken download).
function checkCatalog() {
  const apps = JSON.parse(readFileSync(join(ROOT, 'apps/apps.json'), 'utf8')).apps;
  for (const a of apps) for (const k of ['apk', 'href']) {
    const p = a.type === 'apk' && typeof a[k] === 'string' && !a[k].startsWith('http') ? a[k].replace(/^\//, '') : null;
    if (p && p.endsWith('.apk') && !existsSync(join(ROOT, p))) fail(`apps.json ${a.id}.${k} points at missing ${p}`);
  }
}

const normalized = f => readFileSync(f, 'utf8').replaceAll('\r', '');
const pwaEntry = id => {
  const pack = join(ROOT, 'tv/game-packs', `app-${id}.json`);
  if (!existsSync(pack)) fail(`${id}: ${pack} missing (run tools/gen_game_packs.py)`);
  return {id, platform: 'pwa', channel: 'stable', version: createHash('sha256').update(normalized(pack)).digest('hex').slice(0, 12), url: `${SITE}/apps/${id}/`, notes: 'Content version = the app pack hash; installed copies update themselves.'};
};
// Self-contained PWAs with their own stamped sw.js (VERSION = content hash): Little Boyfriend, and Coach MYR5 once /apps/coach/ is dropped in.
function swPwa(id, dir, url) {
  const sw = join(ROOT, dir, 'sw.js');
  const v = existsSync(sw) && /const (?:VERSION = '|SHELL='myr5-coach-shell-)([0-9a-f]+)'/.exec(normalized(sw))?.[1];
  if (!v) fail(`${dir}/sw.js has no stamped VERSION`);
  return {id, platform: 'pwa', channel: 'stable', version: v, url, notes: 'Content version = the service worker stamp.'};
}
const lbPwa = () => swPwa('lilboyfriend', 'little-boyfriend/app', `${SITE}/little-boyfriend/app/`);

checkCatalog();
const apps = [...APKS.map(apkEntry), ...PWAS.map(pwaEntry), lbPwa(), ...(COACH?.status === 'ready' ? [swPwa('coach', 'apps/coach', SITE + COACH.href)] : [])];

const jsonPath = join(OUT, 'releases.json'), sigPath = join(OUT, 'releases.json.sig');
let updated = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
if (existsSync(jsonPath) && existsSync(sigPath)) {
  const old = JSON.parse(readFileSync(jsonPath, 'utf8'));
  if (JSON.stringify(old.apps) === JSON.stringify(apps)) { console.log('releases.json unchanged'); process.exit(0); }
}
const bytes = Buffer.from(JSON.stringify({schema: 1, updated, apps}, null, 2) + '\n');
if (!existsSync(KEY)) fail(`signing key not found at ${KEY}`);
const signature = sign('sha256', bytes, readFileSync(KEY));
if (!verify('sha256', bytes, createPublicKey({key: Buffer.from(PUB, 'base64'), format: 'der', type: 'spki'}), signature)) fail('signature does not verify against the contract public key');
writeFileSync(jsonPath, bytes); writeFileSync(sigPath, signature.toString('base64'));
console.log(`releases.json: ${apps.length} entries (${apps.filter(a => a.platform === 'android').map(a => a.id + ' ' + a.versionName).join(', ')}), signed and verified`);
