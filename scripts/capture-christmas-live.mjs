// 배포된 크리스마스 광장 확인 촬영(월드개발, 2026-11-17 6차): 공개 주소를 PC 1920×1080·휴대폰 390×844로 열어 기본 화면(시안 B)인지·오류 0인지 보고 찍는다.
// 서버 고르기는 건너뛰고(?serverpick=off) 혼자 둘러보기로 연다(공개 멀티 서버에 붙지 않음).
//   node scripts/capture-christmas-live.mjs → artifacts/christmas-live/pc.png, phone.png, report.json
import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const URL_=process.env.LIVE_URL??'https://engchoon.github.io/ai-office-world/christmas/',dir='artifacts/christmas-live';mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const out={url:URL_,at:new Date().toISOString(),shots:{}};
for(const [name,opt] of [['pc',{viewport:{width:1920,height:1080}}],['phone',{viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}]]){
 const ctx=await browser.newContext(opt),p=await ctx.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.goto(`${URL_}?serverpick=off&t=${Date.now()}`);
 await p.waitForFunction(()=>window.xmas?.status,null,{timeout:120000});
 await p.evaluate(()=>window.xmas.teleport(0,12,0));await p.waitForTimeout(4000);
 const st=await p.evaluate(()=>({plaza:window.xmas.village?.festive?22:null,run:!!document.querySelector('.xt-run'),map:!!document.querySelector('.xt-map-btn'),fps:window.xmas.status().fps,max:window.xmas.multi.status().max}));
 await p.screenshot({path:`${dir}/${name}.png`});
 out.shots[name]={...st,errors};console.log(name,JSON.stringify(out.shots[name]));await ctx.close();
}
writeFileSync(`${dir}/report.json`,JSON.stringify(out,null,1));
await browser.close();
