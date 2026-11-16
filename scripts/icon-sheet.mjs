// 아이콘 확인 시트: public/icons → artifacts/icons/sheet-pc.png, sheet-mobile.png, silhouette.png
// 실행: node scripts/icon-sheet.mjs
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = path.resolve(import.meta.dirname, '..');
const IC = path.join(ROOT, 'public/icons');
const OUT = path.join(ROOT, 'artifacts/icons');
fs.mkdirSync(OUT, { recursive: true });
const index = JSON.parse(fs.readFileSync(path.join(IC, 'index.json'), 'utf8'));
const sprite = fs.readFileSync(path.join(IC, 'sprite.svg'), 'utf8');
const css = fs.readFileSync(path.join(IC, 'icons.css'), 'utf8');
const GN = { common: '공통', christmas: '크리스마스', hiking: '등산', smoking: '흡연장' };
const THEME = { common: '', christmas: 'ic-christmas', hiking: 'ic-hiking', smoking: 'ic-smoking' };
const use = (n, c = 'ic-m', extra = '') => `<svg class="ic ${c} ${extra}"><use href="#ic-${n}"/></svg>`;
const groups = [...new Set(index.map((i) => i.group))];

function pc() {
  return groups.map((g) => {
    const items = index.filter((i) => i.group === g);
    const cells = items.map((i) => `<div class="cell"><div class="big">${use(i.name, 'ic-xl')}</div>
      <div class="row">${['ic-xs', 'ic-s', 'ic-m', 'ic-l'].map((c) => use(i.name, c)).join('')}</div>
      <div class="row night ic-night ${THEME[g]}">${use(i.name, 'ic-s')}${use(i.name, 'ic-m')}</div>
      <div class="row on">${use(i.name, 'ic-m')}</div>
      <b>${i.name}</b></div>`).join('');
    return `<h2>${GN[g]} ${items.length}개</h2><div class="grid ${THEME[g]}">${cells}</div>`;
  }).join('');
}
function mobile() {
  return groups.map((g) => {
    const items = index.filter((i) => i.group === g);
    return `<h2>${GN[g]} — 휴대폰 실제 크기(44px 단추 / 18px)</h2><div class="mgrid ${THEME[g]}">${items.map((i) =>
      `<div class="m"><span class="btn">${use(i.name, 'ic-m')}</span><span class="tag">${use(i.name, 'ic-xs')}${use(i.name, 'ic-s')}</span><i>${i.name.replace(/^[a-z]-/, '')}</i></div>`).join('')}</div>`;
  }).join('');
}
function silhouette() {
  return groups.map((g) => `<h2>${GN[g]} — 22px 실루엣</h2><div class="sil">${index.filter((i) => i.group === g && !i.off).map((i) =>
    `<div>${use(i.name, 'ic-m')}<i>${i.name.replace(/^[a-z]-/, '')}</i></div>`).join('')}</div>`).join('');
}
const page = (bodyHtml, w) => `<!doctype html><meta charset="utf-8"><style>${css}
body{margin:0;padding:20px;background:#fbf3df;font:12px/1.3 -apple-system,'Apple SD Gothic Neo',sans-serif;color:#4a3618;width:${w - 40}px}
h1{font-size:20px;margin:0 0 4px}h2{font-size:15px;margin:18px 0 8px;border-bottom:2px solid #4a3618}
.grid{display:grid;grid-template-columns:repeat(8,1fr);gap:8px}
.cell{background:#fffaf0;border:1px solid #e3d3b0;border-radius:8px;padding:6px;display:flex;flex-direction:column;align-items:center;gap:4px}
.cell b{font-weight:600;font-size:10.5px}.row{display:flex;gap:6px;align-items:center;padding:2px 6px;border-radius:6px}
.night{background:#2b2418;color:#f1e4c4}.night .ic{color:#f1e4c4}
.on{background:var(--ic-point)}.on .ic{color:var(--ic-paper);--ic-point:rgba(255,255,255,.28)}
.mgrid{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}
.m{display:flex;flex-direction:column;align-items:center;gap:2px}.m i{font-style:normal;font-size:9px;text-align:center;word-break:break-all}
.btn{width:44px;height:44px;border-radius:50%;background:#fffaf0;border:2px solid #4a3618;display:grid;place-items:center;box-shadow:0 2px 0 #4a3618}
.tag{display:flex;gap:3px}
.sil{display:grid;grid-template-columns:repeat(12,1fr);gap:6px}.sil div{display:flex;flex-direction:column;align-items:center}
.sil .ic{color:#000;--ic-point:#000;--ic-ok:#000;--ic-mid:#000;--ic-low:#000;--ic-on:#000;--ic-paper:#000}.sil i{font-style:normal;font-size:9px}
</style><body>${sprite}${bodyHtml}`;

const b = await chromium.launch();
for (const [name, html, w, dpr] of [
  ['sheet-pc', `<h1>제작 아이콘 확인 시트 — 큰 그림 · 14/18/22/28px · 밤 · 켜짐</h1>${pc()}`, 1400, 1],
  ['sheet-mobile', `<h1>휴대폰 크기</h1>${mobile()}`, 390, 3],
  ['silhouette', `<h1>실루엣 대조판</h1>${silhouette()}`, 1000, 2],
]) {
  const p = await b.newPage({ viewport: { width: w, height: 800 }, deviceScaleFactor: dpr });
  await p.setContent(page(html, w));
  await p.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
  fs.writeFileSync(path.join(OUT, `${name}.html`), page(html, w));
  await p.close();
}
await b.close();
console.log('ok');
