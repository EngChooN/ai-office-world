// 11-23 월드디자인 검토 ③: 봉 집게가 옆 카메라 쪽 끝에 왔을 때 모습. 오른쪽 옆 = → 끝까지 누른 뒤(집게가 오른쪽 끝), 왼쪽 옆 = 처음 자리
//  node artifacts/claw-design/side-review/shoot-near.mjs [pc|portrait] → side-review/front/*.png
import {chromium} from '@playwright/test';import {mkdirSync} from 'node:fs';
const SIZE=process.argv[2]??'pc',VP=SIZE==='portrait'?[390,844,true]:[1280,720,false];
const OUT='artifacts/claw-design/side-review/front';mkdirSync(OUT,{recursive:true});
const {createServer}=await import('vite');const port=Number(process.env.PORT??5433);
const vite=await createServer({server:{port,host:'127.0.0.1',strictPort:true},logLevel:'warn'});await vite.listen();
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const sl=ms=>new Promise(r=>setTimeout(r,ms));const errs=[];
const ctx=await browser.newContext({viewport:{width:VP[0],height:VP[1]},deviceScaleFactor:1,isMobile:VP[2],hasTouch:VP[2]});
await ctx.addInitScript(()=>{if(!sessionStorage.getItem('__k')){localStorage.clear();sessionStorage.setItem('__k','1');}localStorage.setItem('aoworld:settings:v1',JSON.stringify({sound:false,volume:.7,music:true,hubTime:'auto'}));});
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.goto(`http://127.0.0.1:${port}/claw/`);await p.waitForFunction(()=>window.claw&&window.claw.fps>0,null,{timeout:180000});
await p.evaluate(()=>{claw.setCoins(30);claw.seen(true);});
const hold=async(ms)=>{const b=await p.waitForSelector('.kh-big',{state:'visible'});const r=await b.boundingBox();await p.mouse.move(r.x+r.width/2,r.y+r.height/2);await p.mouse.down();await sl(ms);await p.mouse.up();};
for(const i of [7,9]){const id=['','','','','','','','bridge-2','','bridge-4'][i];
 await p.evaluate(n=>claw.goMachine(n),i);await sl(1100);
 await (await p.waitForSelector('.kh-big[data-act=play]',{state:'visible'})).click();await sl(900);
 await sl(800);await p.screenshot({path:`${OUT}/${SIZE}-${id}-front.png`});continue;
 await (await p.waitForSelector('.kh-todo[data-act=flip]',{state:'visible'})).click();await sl(1300); // 왼쪽 옆: 처음 자리
 await p.screenshot({path:`${OUT}/${SIZE}-${id}-left-start.png`});
 await (await p.waitForSelector('.kh-todo[data-act=flip]',{state:'visible'})).click();await sl(300);
 await hold(4000);await sl(1200);  // → 끝까지(누르기 제한 안)
 await p.screenshot({path:`${OUT}/${SIZE}-${id}-right-end.png`});
 console.log(id,await p.evaluate(()=>claw.play.status().claw));
 await p.evaluate(()=>claw.play.quit?.());await sl(800);
}
console.log(errs.length?errs:'페이지 오류 0');await browser.close();await vite.close();process.exit(0);
