// 조작 화면 찍기: node artifacts/claw-design/travel/shoot.mjs <태그>  (기계 6 = 집게 6, 6 = 봉 1). 휴대폰 세로·PC
import {chromium} from '@playwright/test';import {mkdirSync} from 'node:fs';
const tag=process.argv[2]??'now',OUT='artifacts/claw-design/travel/shots';mkdirSync(OUT,{recursive:true});
const {createServer}=await import('vite');const port=5412;const vite=await createServer({server:{port,host:'127.0.0.1',strictPort:true},logLevel:'warn'});await vite.listen();
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const sl=ms=>new Promise(r=>setTimeout(r,ms));
const SIZES={portrait:[390,844,true],pc:[1280,720,false]};
const errs=[];
for(const [name,[w,h,touch]] of Object.entries(SIZES)){
 const ctx=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:touch?2:1,hasTouch:touch,isMobile:touch});const p=await ctx.newPage();
 p.on('pageerror',e=>errs.push(`${name}: ${e.message}`));
 await p.goto(`http://127.0.0.1:${port}/claw/?serverpick=off`);await p.waitForFunction(()=>window.claw?.status,null,{timeout:60000});await sl(2500);
 await p.evaluate(()=>{claw.seen(true);claw.setCoins(30);});
 for(const [i,label] of [[5,'claw6'],[6,'bridge1'],[9,'bridge4']]){
  await p.evaluate(i=>claw.goMachine(i),i);await sl(900);
  await p.click('.kh-small[data-act=play]');await p.waitForFunction(()=>claw.play.mode==='play',null,{timeout:8000});await sl(1500);
  if(label.startsWith('bridge'))await p.evaluate(()=>claw.play.aim(.1,-.05));else await p.evaluate(()=>claw.play.aim(.15,-.1));await sl(1200);
  await p.screenshot({path:`${OUT}/${tag}-${name}-${label}.png`});
  if(label!=='bridge4'){await p.click('.kh-todo[data-act=side]');await sl(1500);await p.screenshot({path:`${OUT}/${tag}-${name}-${label}-side.png`});await p.click('.kh-todo[data-act=side]');await sl(600);}
  // 결과까지
  await p.keyboard.press('Space').catch(()=>{});await p.evaluate(()=>document.querySelector('.kh-big.kh-bar')?.click());
  await p.waitForFunction(()=>claw.play.mode==='result',null,{timeout:40000}).catch(()=>{});await sl(400);
  await p.evaluate(()=>document.querySelector('.kh-card [data-c=stop]')?.click());await sl(600);
 }
 await ctx.close();
}
console.log(JSON.stringify({errs}));await browser.close();await vite.close();
