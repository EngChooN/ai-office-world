// 허브 캡처·검사(시간대 3개 전체 화면). 사용: BASE_URL=http://127.0.0.1:5312 node scripts/capture-hub.mjs
// 11-17 허브 개선 뒤: 4칸(등산·흡연장·크리스마스·다음 체험), 서버 고르기·체험 들어가기 점검은 scripts/verify-hub.mjs
import {chromium} from '@playwright/test';
import {mkdirSync} from 'node:fs';
const dir=process.env.OUT??'artifacts/hub-2026-11-08';mkdirSync(dir,{recursive:true});
const base=process.env.BASE_URL??'http://127.0.0.1:5312';
const DEV={port:{viewport:{width:390,height:844},touch:true},land:{viewport:{width:844,height:390},touch:true},pc:{viewport:{width:1920,height:1080}}};
const browser=await chromium.launch({channel:'chrome',headless:true});
const bad=[];
for(const [d,o] of Object.entries(DEV))for(const t of ['day','dusk','night']){
 const ctx=await browser.newContext({...o,hasTouch:!!o.touch,isMobile:!!o.touch});const page=await ctx.newPage();
 const errs=[];page.on('pageerror',e=>errs.push(String(e)));page.on('console',m=>m.type()==='error'&&errs.push(m.text()));
 if(t==='day')await page.addInitScript(()=>localStorage.setItem('gwanak-summits',JSON.stringify({gwanak:{first:'2026-11-06',count:2,bestSec:7000,last:'2026-11-07'}})));
 await page.goto(`${base}/?hubtime=${t}`,{waitUntil:'networkidle'});
 const r=await page.evaluate(()=>({cards:document.querySelectorAll('[id^="hub-"]').length,small:[...document.querySelectorAll('.hb-card,.hb-place,.hb-go,.hb-btn')].map(e=>e.getBoundingClientRect()).filter(r=>r.height<43.5).length,
  overflow:document.documentElement.scrollWidth>innerWidth+1,sh:document.documentElement.scrollHeight,ih:innerHeight}));
 if(r.cards!==4||r.small||r.overflow||errs.length)bad.push({d,t,r,errs});
 console.log(d,t,JSON.stringify(r));
 await page.screenshot({path:`${dir}/hub-${d}-${t}.png`,fullPage:true});await ctx.close();
}
await browser.close();
if(bad.length){console.log('문제',JSON.stringify(bad,null,1));process.exit(1);}console.log('OK');
