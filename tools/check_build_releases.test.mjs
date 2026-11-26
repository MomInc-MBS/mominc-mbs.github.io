// Release manifest tool: real APK facts, a verifiable signature, and a hard failure when a referenced APK is missing.
// Run: node --test tools/check_build_releases.test.mjs   (needs the Android build-tools; uses a throwaway key, never the release key)
import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync, createHash, verify} from 'node:crypto';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const tool = new URL('./build_releases.mjs', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const dir = mkdtempSync(join(tmpdir(), 'rel-'));
const {privateKey, publicKey} = generateKeyPairSync('ec', {namedCurve: 'prime256v1'});
const keyFile = join(dir, 'k.pem'); writeFileSync(keyFile, privateKey.export({type: 'pkcs8', format: 'pem'}));
const pub = publicKey.export({type: 'spki', format: 'der'}).toString('base64');
const run = (...a) => spawnSync(process.execPath, [tool, '--key', keyFile, '--pub', pub, ...a], {encoding: 'utf8'});

test('manifest matches the real APKs and verifies against the public key', () => {
  const out = join(dir, 'out'); mkdirSync(out);
  const r = run('--out', out); assert.equal(r.status, 0, r.stderr);
  const bytes = readFileSync(join(out, 'releases.json')), m = JSON.parse(bytes);
  assert.ok(verify('sha256', bytes, publicKey, Buffer.from(readFileSync(join(out, 'releases.json.sig'), 'utf8'), 'base64')));
  assert.equal(verify('sha256', Buffer.concat([bytes, Buffer.from(' ')]), publicKey, Buffer.from(readFileSync(join(out, 'releases.json.sig'), 'utf8'), 'base64')), false);   // any edit breaks it
  const apk = id => m.apps.find(a => a.id === id && a.platform === 'android');
  for (const id of ['alarm', 'lilboyfriend']) {
    const a = apk(id), file = new URL('../' + new URL(a.url).pathname, import.meta.url);
    assert.equal(a.sha256, createHash('sha256').update(readFileSync(file)).digest('hex'));
    assert.equal(a.size, readFileSync(file).length); assert.match(a.signerSha256, /^[0-9a-f]{64}$/); assert.ok(a.versionCode > 0 && a.minSdk > 0);
  }
  assert.equal(apk('alarm').package, 'com.mominc.alarm2048');
  assert.equal(m.apps.filter(a => a.platform === 'pwa').every(a => a.version && a.url.startsWith('https://mominc.online/')), true);
  assert.equal(run('--out', out).stdout.trim(), 'releases.json unchanged');          // same inputs: no re-sign noise
});

test('a missing APK fails the build and writes nothing', () => {
  const root = join(dir, 'root'); mkdirSync(join(root, 'apps'), {recursive: true}); mkdirSync(join(root, 'download/alarm'), {recursive: true});
  writeFileSync(join(root, 'apps/apps.json'), '{"apps":[]}');
  const out = join(dir, 'out2'); mkdirSync(out);
  const r = run('--root', root, '--out', out);
  assert.notEqual(r.status, 0); assert.match(r.stderr, /no APK for com\.mominc\.alarm2048/);
  assert.throws(() => readFileSync(join(out, 'releases.json')));
});

test('coach is a self-contained PWA at /apps/coach/: ready link, release entry, no pack or root-worker involvement', () => {
  const rd = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
  const c = JSON.parse(rd('apps/apps.json')).apps.find(a => a.id === 'coach'), e = JSON.parse(rd('apps/releases.json')).apps.find(a => a.id === 'coach');
  assert.equal(c.status, 'ready'); assert.equal(c.href, '/apps/coach/');
  assert.equal(e.platform, 'pwa'); assert.equal(e.url, 'https://mominc.online/apps/coach/'); assert.match(e.version, /^[0-9a-f]+$/);
  assert.equal(JSON.parse(rd('apps/coach/manifest.webmanifest')).name, "MOM's: Coach MYR5");
  assert.match(rd('apps/coach/sw.js'), /scope|\/apps\/coach\//);
  assert.equal(rd('game-assets-sw.js').includes('/apps/coach'), false);   // the root worker never claims it
  assert.equal(readdirSync(new URL('../tv/game-packs/', import.meta.url)).some(f => rd('tv/game-packs/' + f).includes('/apps/coach/')), false);
});
