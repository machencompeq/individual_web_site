// CI 煙霧測試：用真的瀏覽器打開網站，確認沒有 JS 錯誤、3D 有載入、手機版不會橫向捲動。
// 用法：node tools/smoke.mjs [網站目錄=.] [截圖輸出目錄=screenshots]
import http from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const root = process.argv[2] || '.';
const shots = process.argv[3] || 'screenshots';
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.glb': 'model/gltf-binary', '.mp4': 'video/mp4', '.pdf': 'application/pdf', '.cpp': 'text/plain; charset=utf-8' };

const server = http.createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  const file = path.endsWith('/') ? path + 'index.html' : path;
  try {
    const body = await readFile(join(root, file));
    res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end('not found'); }
}).listen(0);
const base = `http://127.0.0.1:${server.address().port}/`;
await mkdir(shots, { recursive: true });

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
let failed = false;
const check = (ok, msg) => { console.log(`${ok ? '✓' : '✗'} ${msg}`); if (!ok) failed = true; };

for (const [name, viewport] of [['desktop', { width: 1366, height: 860 }], ['phone', { width: 390, height: 844 }]]) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('requestfailed', r => { if (r.url().startsWith(base)) errors.push('request failed: ' + r.url()); });
  await page.goto(base, { waitUntil: 'networkidle' });

  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  check(sw <= viewport.width, `[${name}] no horizontal scroll (${sw}px)`);

  const before = Number(await page.textContent('#jumpCount'));
  await page.click('#jumper', { force: true });
  check(Number(await page.textContent('#jumpCount')) === before + 1, `[${name}] hero jump counter works`);

  await page.locator('#toybox').scrollIntoViewIfNeeded();
  const toys = await page.waitForFunction(() => window.__toys && window.__toys() > 10, null, { timeout: 10000 }).then(() => true, () => false);
  check(toys, `[${name}] physics toy box spawned toys`);

  await page.locator('#deckNext').scrollIntoViewIfNeeded();
  await page.click('#deckNext');
  await page.waitForTimeout(400);
  check((await page.textContent('#deckCount')).trim() === '2 / 10', `[${name}] photo deck advances`);

  await page.locator('#flips').scrollIntoViewIfNeeded();
  await page.click('[data-filter="cert"]');
  const visible = await page.$$eval('#flips .flip:not([hidden])', els => els.length);
  check(visible === 4, `[${name}] award filter shows 4 certificates`);
  await page.click('#flips .flip:not([hidden]) .flip-in');
  await page.waitForTimeout(700);
  await page.click('#flips .flip.on .flip-zoom');
  check(await page.isVisible('#lightbox'), `[${name}] flip card + lightbox work`);
  await page.keyboard.press('Escape');

  await page.locator('#projects').scrollIntoViewIfNeeded();
  const has3d = await page.waitForSelector('#panel-tree .stage.is-3d', { timeout: 20000 }).then(() => true, () => false);
  check(has3d, `[${name}] 3D model (Blender .glb) loaded`);
  await page.click('#tab-heap');
  const lines = await page.waitForFunction(() => document.querySelectorAll('#panel-heap .ln').length, null, { timeout: 10000 })
    .then(h => h.jsonValue(), () => 0);
  check(lines > 100, `[${name}] code viewer loaded heap.cpp (${lines} lines)`);

  check(errors.length === 0, `[${name}] no console errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(shots, `${name}.png`) });
  await page.close();
}

await browser.close();
server.close();
process.exit(failed ? 1 : 0);
