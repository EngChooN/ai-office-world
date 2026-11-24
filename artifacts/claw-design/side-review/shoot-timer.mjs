// 11-24 월드디자인 검토 ①: 타이머 옆에서 보기 + 화면 위 작은 숫자(돌아가는 중). 타이머 3은 3초 뒤 숫자가 흐려지는지(기계와 같게)
//  node artifacts/claw-design/side-review/shoot-timer.mjs [pc|portrait] → side-review/timer/*.png
import {chromium} from '@playwright/test';import {mkdirSync} from 'node:fs';
const SIZE=process.argv[2]??'pc',VP=SIZE==='portrait'?[390,844,true]:[1280,720,false];
const OUT='artifacts/claw-design/side-review/timer';mkdirSync(OUT,{recursive:true});
const {createServer}=await import('vite');const port=Number(process.env.PORT??5435);
const vite=await createServer({server:{port,host:'127.0.0.1',strictPort:true},logLevel:'warn'});await vite.listen();
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const sl=ms=>new Promise(r=>setTimeout(r,ms));const errs=[];let fails=0;
const ctx=await browser.newContext({viewport:{width:VP[0],height:VP[1]},deviceScaleFactor:1,isMobile:VP[2],hasTouch:VP[2]});
await ctx.addInitScript(()=>{if(!sessionStorage.getItem('__k')){localStorage.clear();sessionStorage.setItem('__k','1');}localStorage.setItem('aoworld:settings:v1',JSON.stringify({sound:false,volume:.7,music:true,hubTime:'auto'}));});
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.goto(`http://127.0.0.1:${port}/claw/`);await p.waitForFunction(()=>window.claw&&window.claw.fps>0,null,{timeout:180000});
await p.evaluate(()=>{claw.setCoins(30);claw.seen(true);});
const tn=()=>p.evaluate(()=>{const e=document.querySelector('.kh-tnum');return {shown:!!e&&!e.hidden,text:e?.textContent.trim(),state:e?.dataset.state,machine:claw.play.status().timer?.text};});
for(const [i,id] of [[11,'timer-2'],[12,'timer-3']]){
 await p.evaluate(n=>claw.goMachine(n),i);await sl(1100);
 await (await p.waitForSelector('.kh-big[data-act=play]',{state:'visible'})).click();await sl(900);
 const front=await tn();
 await (await p.waitForSelector('.kh-todo[data-act=side]',{state:'visible'})).click();await sl(1200);
 const b=await p.waitForSelector('.kh-big',{state:'visible'});const r=await b.boundingBox();await p.mouse.click(r.x+r.width/2,r.y+r.height/2); // 시작
 await sl(id==='timer-3'?3800:1600);const run=await tn();await p.screenshot({path:`${OUT}/${SIZE}-${id}-run.png`});
 const ok=!front.shown&&run.shown&&run.text===run.machine&&(id==='timer-3'?run.state==='dim':run.state==='run');if(!ok)fails++;
 console.log(ok?'✓':'✖',id,'정면 숨김',!front.shown,'옆 숫자',run);
 await p.mouse.click(r.x+r.width/2,r.y+r.height/2);await sl(600);const stop=await tn();console.log('  멈춤 뒤',stop);
 await sl(4000);await p.evaluate(()=>claw.play.quit?.());await sl(800);
 if(await p.evaluate(()=>claw.play.mode)!=='idle'){await p.evaluate(()=>{const b=[...document.querySelectorAll('.kh-card .kh-btn')].find(b=>/그만/.test(b.textContent));b?.click();});await sl(800);}
}
console.log(errs.length?errs:'페이지 오류 0',`실패 ${fails}`);await browser.close();await vite.close();process.exit(fails||errs.length?1:0);
