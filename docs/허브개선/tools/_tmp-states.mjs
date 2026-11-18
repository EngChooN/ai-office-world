import {chromium} from '@playwright/test';import {pathToFileURL} from 'node:url';
const b=await chromium.launch({channel:'chrome',headless:true});
for(const f of ['A','B','C']){const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:1});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto(pathToFileURL(`docs/허브개선/시안-${f}.html`).href);
for(const m of ['checking','off']){await p.click(`.demo-seg [data-mode=${m}]`);await p.waitForTimeout(150);await p.screenshot({path:`artifacts/hub-improve/${f}-${m}.png`});}
await p.click('.demo-seg [data-mode=on]');await p.click('.js-settings');await p.waitForTimeout(150);await p.screenshot({path:`artifacts/hub-improve/${f}-settings.png`});
await p.keyboard.press('Escape');await p.click('.js-sound');const pressed=await p.getAttribute('.js-sound','aria-pressed');
await p.click('.js-about');await p.waitForTimeout(100);await p.screenshot({path:`artifacts/hub-improve/${f}-about.png`});
console.log(f,'sound',pressed,errs.join('|')||'오류 없음');await ctx.close();}
await b.close();
