// 아이콘 교체 점검: 허브·등산·흡연장·크리스마스를 PC(1920×1080)·휴대폰(390×844)으로 찍고,
// 콘솔 오류·아이콘 CSS 적용(--ic-point)·화면에 붙은 아이콘 수를 확인한다. PROBE=1이면 왼쪽 아래에 부품 견본을 띄운다.
// 개발 서버를 먼저 띄운다: BASE_URL=http://127.0.0.1:5188 node scripts/capture-icons.mjs → artifacts/icons-2026-11-16/
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:5173', OUT = 'artifacts/icons-2026-11-16';
mkdirSync(OUT, { recursive: true });
const PAGES = [
  ['hub', '/', 'hub'], ['hiking', '/hiking/?serverpick=off', 'hiking'],
  ['smoking', '/smoking/?serverpick=off', 'smoking'], ['christmas', '/christmas/?serverpick=off', 'christmas'],
];
const VIEWS = [['pc', 1920, 1080, false], ['mobile', 390, 844, true]];
const browser = await chromium.launch();
const report = [];
for (const [name, path, exp] of PAGES) for (const [view, w, h, mobile] of VIEWS) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(BASE + path, { waitUntil: 'load' });
  await page.waitForTimeout(name === 'hub' ? 1500 : 9000);
  const r = await page.evaluate(async probe => {
    const mod = await import('/src/icons/icon.js');
    const box = document.createElement('div');
    box.id = 'ic-probe';
    box.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:99999;background:#fbf3df;color:#4a3618;padding:6px;border-radius:6px;display:flex;gap:8px;align-items:center;font:13px sans-serif';
    box.innerHTML = mod.icon('c-settings', { size: 'm', label: '설정' }) + mod.iconText('x-gift', '보내기') + mod.icon('c-sound', { size: 's', off: true }) + mod.iconText('c-enter', '들어가기', { after: true });
    if (probe) document.body.append(box);
    const ic = box.querySelector('.ic');
    const out = {
      exp: document.documentElement.dataset.icExp ?? null,
      point: getComputedStyle(document.documentElement).getPropertyValue('--ic-point').trim(),
      probeEmoji: box.querySelectorAll('.ic-emoji').length, probeSvg: box.querySelectorAll('svg.ic').length,
      svgOnPage: document.querySelectorAll('svg.ic').length, emojiOnPage: document.querySelectorAll('.ic-emoji').length,
      brokenUse: [...document.querySelectorAll('svg.ic')].filter(s => { const r = s.getBoundingClientRect(); return r.width > 0 && r.height === 0; }).length,
    };
    return out;
  }, !!process.env.PROBE);
  await page.screenshot({ path: `${OUT}/${name}-${view}.png` });
  report.push({ name, view, expected: exp, ...r, errors });
  await page.close();
}
await browser.close();
writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 1));
for (const r of report) console.log(r.name, r.view, 'exp=' + r.exp, 'point=' + r.point, `화면 아이콘 svg ${r.svgOnPage}·이모지대신 ${r.emojiOnPage}`, 'errors', r.errors.length, r.errors.slice(0, 2).join(' | '));
