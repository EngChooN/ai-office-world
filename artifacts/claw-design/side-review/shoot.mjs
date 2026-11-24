// 월드디자인 옆보기 검토: 봉·열쇠에서 조작 중(→ 놓고 ↑ 누르는 중·내려가는 중) 옆 시점 촬영
//  node artifacts/claw-design/side-review/shoot.mjs [pc|portrait]
import {chromium} from '@playwright/test';import {mkdirSync} from 'node:fs';
const SIZE=process.argv[2]??'pc',VP=SIZE==='portrait'?[390,844,true]:[1280,720,false];
const OUT='artifacts/claw-design/side-review/shots';mkdirSync(OUT,{recursive:true});
const {createServer}=await import('vite');const port=Number(process.env.PORT??5431);
const vite=await createServer({server:{port,host:'127.0.0.1',strictPort:true},logLevel:'warn'});await vite.listen();
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const sl=ms=>new Promise(r=>setTimeout(r,ms));const errs=[];
const ctx=await browser.newContext({viewport:{width:VP[0],height:VP[1]},deviceScaleFactor:1,isMobile:VP[2],hasTouch:VP[2]});
await ctx.addInitScript(()=>{if(!sessionStorage.getItem('__k')){localStorage.clear();sessionStorage.setItem('__k','1');}localStorage.setItem('aoworld:settings:v1',JSON.stringify({sound:false,volume:.7,music:true,hubTime:'auto'}));});
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.goto(`http://127.0.0.1:${port}/claw/`);await p.waitForFunction(()=>window.claw&&window.claw.fps>0,null,{timeout:180000});
await p.evaluate(()=>{claw.setCoins(30);claw.seen(true);});
const hold=async(ms)=>{const b=await p.waitForSelector('.kh-big',{state:'visible'});const r=await b.boundingBox();await p.mouse.move(r.x+r.width/2,r.y+r.height/2);await p.mouse.down();await sl(ms);return async()=>{await p.mouse.up();};};
for(const [i,id,a,b] of [[7,'bridge-2',900,1300],[14,'key-2',900,900]]){
 await p.reload();await p.waitForFunction(()=>window.claw&&window.claw.fps>0,null,{timeout:180000});await p.evaluate(()=>{claw.setCoins(30);claw.seen(true);});await p.evaluate(n=>claw.goMachine(n),i);await sl(1100);
 await (await p.waitForSelector('.kh-big[data-act=play]',{state:'visible'})).click();await sl(900);
 await (await p.waitForSelector('.kh-todo[data-act=side]',{state:'visible'})).click();await sl(1000);
 let up=await hold(a);await up();await sl(500);
 up=await hold(b);await p.screenshot({path:`${OUT}/${SIZE}-${id}-hold2.png`});await up();
 await sl(1500);await p.screenshot({path:`${OUT}/${SIZE}-${id}-after.png`});
 console.log(id,await p.evaluate(()=>({mode:claw.play.mode,sub:claw.play.sub})));
 await sl(6000);
 await p.evaluate(()=>{document.querySelector('.kh-quit')?.click();});await sl(300);await p.evaluate(()=>{const b=[...document.querySelectorAll('.kh-card .kh-btn')].find(b=>/그만/.test(b.textContent));b?.click();});await sl(800);
 if(await p.evaluate(()=>claw.play.mode)!=='idle'){await p.evaluate(()=>claw.play.quit?.());await sl(500);}
}
console.log(errs.length?errs:'페이지 오류 0');await browser.close();await vite.close();process.exit(0);
