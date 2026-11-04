// CI 檢查：index.html 引用的本地檔案都要存在，且大小合理。
// 用法：node tools/check-site.mjs [輸出目錄=.]
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2] || '.';
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const refs = new Set();
for (const m of html.matchAll(/(?:src|href|data-full|data-src|data-model|poster)="([^"]+)"/g)) {
  const u = m[1];
  if (/^(https?:|mailto:|tel:|#|data:)/.test(u)) continue;
  refs.add(u.replace(/^\.\//, '').split('#')[0]);
}

let fail = 0;
const MAX = 15 * 1024 * 1024;
for (const r of [...refs].sort()) {
  const p = join(dir, r);
  if (!existsSync(p)) { console.error(`✗ missing  ${r}`); fail++; continue; }
  const size = statSync(p).size;
  if (size > MAX) { console.error(`✗ too big  ${r} (${(size / 1048576).toFixed(1)} MB)`); fail++; continue; }
  console.log(`✓ ${(size / 1024).toFixed(0).padStart(6)} KB  ${r}`);
}
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
const dup = ids.filter((v, i) => ids.indexOf(v) !== i);
if (dup.length) { console.error('✗ duplicate ids:', dup.join(', ')); fail++; }
for (const m of html.matchAll(/href="#([^"]+)"/g)) {
  if (!ids.includes(m[1]) && !/^i-/.test(m[1])) { console.error(`✗ broken anchor #${m[1]}`); fail++; }
}
console.log(`\n${refs.size} local files referenced, ${fail} problem(s).`);
process.exit(fail ? 1 : 0);
