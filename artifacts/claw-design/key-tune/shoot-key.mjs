// 열쇠 1 성공 장면 찍기: 희귀 칸(1,1) 구멍 가장자리(+0.05·+0.03칸, 구멍 0.06 안)에 꽂음 → 밀어 넣는 중·들어간 뒤. 휴대폰 세로·PC
// node artifacts/claw-design/key-tune/shoot-key.mjs <태그>
import {chromium} from '@playwright/test';import {mkdirSync} from 'node:fs';
const tag=process.argv[2]??'now',OUT='artifacts/claw-design/key-tune/shots';mkdirSync(OUT,{recursive:true});
const {createServer}=await import('vite');const port=5413;const vite=await createServer({server:{port,host:'127.0.0.1',strictPort:true},logLevel:'warn'});await vite.listen();
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const sl=ms=>new Promise(r=>setTimeout(r,ms));
const SIZES={portrait:[390,844,true],pc:[1280,720,false]};
const errs=[],res={};
for(const [name,[w,h,touch]] of Object.entries(SIZES)){
 const ctx=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:touch?2:1,hasTouch:touch,isMobile:touch});const p=await ctx.newPage();
 p.on('pageerror',e=>errs.push(`${name}: ${e.message}`));
 await p.goto(`http://127.0.0.1:${port}/claw/?serverpick=off`);await p.waitForFunction(()=>window.claw?.status,null,{timeout:60000});await sl(2500);
 await p.evaluate(()=>{claw.seen(true);claw.setCoins(30);claw.goMachine(13);});await sl(900);
 await p.click('.kh-small[data-act=play]');await p.waitForFunction(()=>claw.play.mode==='play',null,{timeout:8000});await sl(1500);
 await p.evaluate(()=>{claw.play.bigDown();claw.play.keyTo(1.55,-.3);claw.play.bigUp();});await sl(500);
 await p.evaluate(()=>{claw.play.bigDown();claw.play.keyTo(1.55,1.75);claw.play.bigUp();});   // 누르는 중엔 계속 올라가므로 옮기고 바로 뗌
 await p.screenshot({path:`${OUT}/${tag}-${name}-1aim.png`});await sl(150);
 await p.screenshot({path:`${OUT}/${tag}-${name}-2push.png`});await sl(450);
 await p.screenshot({path:`${OUT}/${tag}-${name}-3in.png`});
 res[name]=await p.evaluate(()=>claw.status().play?.result?.key??claw.status().play?.result);
 await ctx.close();
}
console.log(JSON.stringify({errs,res}));await browser.close();await vite.close();
