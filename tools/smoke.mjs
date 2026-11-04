// CI 煙霧測試：用真的瀏覽器操作 MingAn OS（桌機 + 手機），確認開機、視窗、/ 指令、終端機、3D、相簿、獎狀、一般模式都正常，且沒有 JS 錯誤。
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
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  const phone = name === 'phone';
  const tag = `[${name}]`;

  // 開機畫面：會出現，按鍵可以跳過
  check(await page.isVisible('#boot'), `${tag} boot screen shows`);
  await page.waitForTimeout(600);
  await page.keyboard.press('Enter');
  await page.waitForSelector('#boot', { state: 'hidden', timeout: 5000 });
  check(true, `${tag} boot screen can be skipped`);
  await page.waitForLoadState('networkidle');

  check(await page.getAttribute('html', 'data-theme') === 'xp', `${tag} default desktop is XP`);
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  check(sw <= viewport.width, `${tag} no horizontal scroll (${sw}px)`);
  if (!phone) check(await page.isVisible('.win[data-win="about"]') && await page.isVisible('.win[data-win="terminal"]'), `${tag} about + terminal open on start`);

  // 桌面圖示打開相簿
  if (phone) await page.click('.icon[data-app="album"]'); else await page.dblclick('.icon[data-app="album"]');
  check(await page.isVisible('.win[data-win="album"]'), `${tag} desktop icon opens album window`);
  await page.click('.win[data-win="album"] [data-dir="1"]');
  check((await page.textContent('.win[data-win="album"] .viewer-cap')).includes('(2/'), `${tag} album next photo`);

  // / 指令列
  await page.keyboard.press('Escape');
  if (phone) await page.click('.taskbar .slash'); else await page.keyboard.press('/');
  check(await page.isVisible('#palette'), `${tag} "/" opens command palette`);
  await page.fill('#palIn', 'the');
  check((await page.textContent('#palList')).includes('/theme'), `${tag} palette suggests /theme`);
  await page.fill('#palIn', '/theme hacker');
  await page.press('#palIn', 'Enter');
  check(await page.getAttribute('html', 'data-theme') === 'hacker', `${tag} /theme hacker switches desktop`);

  // 用 / 打開作品，3D 與程式碼
  if (phone) await page.click('.taskbar .slash'); else await page.keyboard.press('/');
  await page.fill('#palIn', '/open projects');
  await page.press('#palIn', 'Enter');
  check(await page.isVisible('.win[data-win="projects"]'), `${tag} /open projects opens window`);
  const has3d = await page.waitForSelector('.win[data-win="projects"] .stage.is-3d', { timeout: 20000 }).then(() => true, () => false);
  check(has3d, `${tag} Blender 3D model loaded in window`);
  await page.click('.win[data-win="projects"] [data-tab="heap"]');
  const lines = await page.waitForFunction(() => document.querySelectorAll('.win[data-win="projects"] [data-panel="heap"] .ln').length, null, { timeout: 10000 })
    .then(h => h.jsonValue(), () => 0);
  check(lines > 100, `${tag} code viewer loaded heap.cpp (${lines} lines)`);

  // 終端機
  await page.evaluate(() => window.__os.openApp('terminal'));
  await page.fill('.win[data-win="terminal"] input', 'whoami');
  await page.press('.win[data-win="terminal"] input', 'Enter');
  check((await page.textContent('.win[data-win="terminal"] .term-out')).includes('Ming-An Chen'), `${tag} terminal runs whoami`);
  await page.fill('.win[data-win="terminal"] input', '/theme mac');
  await page.press('.win[data-win="terminal"] input', 'Enter');
  check(await page.getAttribute('html', 'data-theme') === 'mac', `${tag} terminal accepts /theme mac`);

  // 獎狀資料夾
  await page.evaluate(() => window.__os.openApp('awards'));
  await page.click('.win[data-win="awards"] .file');
  check(await page.isVisible('.win[data-win="awards"] .award-detail'), `${tag} award file opens detail`);

  // 視窗關閉
  await page.click('.win[data-win="awards"] .c-close');
  check(!(await page.$('.win[data-win="awards"]')), `${tag} window closes`);

  // 一般模式
  await page.evaluate(() => window.__os.execute('/cv'));
  check(await page.isVisible('#cv'), `${tag} /cv opens normal resume mode`);
  await page.keyboard.press('Escape');
  check(!(await page.isVisible('#cv')), `${tag} Escape returns to desktop`);

  // 桌面寵物
  await page.evaluate(() => window.__os.execute('/close'));
  await page.click('#pet', { force: true });
  check(await page.$eval('#pet', el => el.classList.contains('jump')), `${tag} desktop pet jumps`);

  const sw2 = await page.evaluate(() => document.documentElement.scrollWidth);
  check(sw2 <= viewport.width, `${tag} still no horizontal scroll (${sw2}px)`);
  check(errors.length === 0, `${tag} no console errors${errors.length ? ': ' + errors.join(' | ') : ''}`);

  await page.evaluate(() => { window.__os.setTheme('xp'); window.__os.openApp('about'); });
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(shots, `${name}.png`) });
  await page.close();
}

await browser.close();
server.close();
process.exit(failed ? 1 : 0);
