// 공유 미리보기 이미지 만들기 (시안 v1 그대로). 저장소 코드 아님 — 산출물 만들기용.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const ROOT = process.argv[2];
const OUT = path.join(ROOT, 'public/og');
fs.mkdirSync(OUT, { recursive: true });
const src = 'file://' + path.join(ROOT, 'docs/공유미리보기/공유카드-시안-v1.html');
const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
await page.goto(src);
await page.evaluate(() => document.fonts.ready);
const ids = ['hub', 'hiking', 'smoking', 'christmas'];
const data = await page.evaluate((ids) => {
  const o = {};
  for (const id of ids) o[id] = { card: CARDS[id](), icon: ICON[id](180) };
  return o;
}, ids);
const shot = await browser.newPage({ deviceScaleFactor: 1 });
for (const id of ids) {
  // 공유 카드 1200×630
  let card = data[id].card;
  // 허브: 산타 동동이 방울·손이 오른쪽 안전 영역(x≤1140)을 넘어 셋 다 왼쪽으로 75px
  if (id === 'hub') card = card.replace('<svg x="688"', '<svg x="613"').replace('<svg x="838"', '<svg x="763"').replace('<svg x="985"', '<svg x="910"');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">${card}</svg>`;
  await shot.setViewportSize({ width: 1200, height: 630 });
  await shot.setContent(`<html><body style="margin:0;background:#000">${svg}</body></html>`);
  await shot.evaluate(() => document.fonts.ready);
  await shot.screenshot({ path: path.join(OUT, `og-${id}.png`), clip: { x: 0, y: 0, width: 1200, height: 630 } });
  // 홈 화면 아이콘 180 — 둥근 모서리 없이 꽉 채움
  const icon = data[id].icon.replace(/<svg width="180" height="180"/, '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"')
    .replace(/(<rect width="(?:180|32)" height="(?:180|32)") rx="\d+"/, '$1');
  await shot.setViewportSize({ width: 180, height: 180 });
  await shot.setContent(`<html><body style="margin:0;background:#000">${icon}</body></html>`);
  await shot.screenshot({ path: path.join(OUT, `icon-${id}-180.png`), clip: { x: 0, y: 0, width: 180, height: 180 } });
  // 탭 아이콘 SVG (허브는 public/favicon.svg 그대로)
  if (id !== 'hub') {
    const fav = data[id].icon.replace(/<svg width="180" height="180"/, '<svg xmlns="http://www.w3.org/2000/svg"');
    fs.writeFileSync(path.join(OUT, `favicon-${id}.svg`), fav + '\n');
  }
}
await browser.close();
for (const f of fs.readdirSync(OUT).sort()) console.log(f, fs.statSync(path.join(OUT, f)).size);
