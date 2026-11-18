import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
const ROOT = process.argv[2]; const OG = 'file://' + path.join(ROOT, 'public/og/');
const ids = ['hub','hiking','smoking','christmas'];
const safe = `<svg style="position:absolute;inset:0" viewBox="0 0 1200 630"><rect x="0" y="0" width="1200" height="30" fill="rgba(220,40,40,.35)"/><rect x="0" y="600" width="1200" height="30" fill="rgba(220,40,40,.35)"/><rect x="60" y="30" width="1080" height="570" fill="none" stroke="rgba(220,40,40,.9)" stroke-width="4"/></svg>`;
const html = `<html><body style="margin:0;padding:16px;background:#f3e6c8;font:13px sans-serif;width:1240px">
${ids.map(id=>`<div style="display:flex;gap:14px;align-items:flex-end;margin-bottom:14px">
<div style="position:relative;width:600px;height:315px;flex:none"><img src="${OG}og-${id}.png" style="width:600px;display:block">${safe}</div>
<div>240<br><img src="${OG}og-${id}.png" style="width:240px;display:block"></div>
<div>120<br><img src="${OG}og-${id}.png" style="width:120px;display:block"></div>
<div>180<br><img src="${OG}icon-${id}-180.png" style="width:120px;display:block;border-radius:26px"></div>
<div>32<br><img src="${OG}${id==='hub'?'../favicon.svg':`favicon-${id}.svg`}" style="width:32px;display:block"></div>
<div>16<br><img src="${OG}${id==='hub'?'../favicon.svg':`favicon-${id}.svg`}" style="width:16px;display:block"></div>
</div>`).join('')}</body></html>`;
const b = await chromium.launch(); const p = await b.newPage({ viewport:{width:1272,height:800}, deviceScaleFactor:1 });
const f = path.join(ROOT,'artifacts/og-build/sheet.html'); fs.writeFileSync(f, html); await p.goto('file://' + f); await p.waitForTimeout(400);
await p.screenshot({ path: path.join(ROOT,'artifacts/og-build/sheet.png'), fullPage:true }); await b.close();
