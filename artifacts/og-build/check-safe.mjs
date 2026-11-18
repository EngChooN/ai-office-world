import { chromium } from 'playwright';
import path from 'node:path';
const ROOT = process.argv[2];
const b = await chromium.launch(); const p = await b.newPage();
await p.goto('file://' + path.join(ROOT, 'docs/공유미리보기/공유카드-시안-v1.html'));
const r = await p.evaluate(() => {
  const out = {};
  for (const id of ['hub','hiking','smoking','christmas']) {
    let card = CARDS[id]();
    if (id === 'hub') card = card.replace('<svg x="688"', '<svg x="613"').replace('<svg x="838"', '<svg x="763"').replace('<svg x="985"', '<svg x="910"');
    const host = document.createElement('div'); host.style.cssText='position:absolute;left:0;top:0;width:1200px;height:630px';
    host.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">${card}</svg>`;
    document.body.prepend(host);
    const root = host.firstChild.getBoundingClientRect();
    const box = (els) => { let a=[1e9,1e9,-1e9,-1e9]; for (const e of els){const q=e.getBoundingClientRect(); a=[Math.min(a[0],q.left-root.left),Math.min(a[1],q.top-root.top),Math.max(a[2],q.right-root.left),Math.max(a[3],q.bottom-root.top)];} return a.map(Math.round); };
    const dds = [...host.querySelectorAll('svg svg[viewBox="0 0 120 150"]')].map(s => [...s.children].slice(1)); // 그림자 제외
    const texts = [...host.querySelectorAll(':scope > svg > text, :scope > svg > g > g > text, :scope > svg > g > rect')];
    out[id] = { dongdong: box(dds.flat()), text: box([...host.firstChild.querySelectorAll(':scope > text'), ...host.firstChild.querySelectorAll(':scope > g > rect[rx="30"]')]) };
    host.remove();
  }
  return out;
});
console.log(JSON.stringify(r, null, 1)); await b.close();
