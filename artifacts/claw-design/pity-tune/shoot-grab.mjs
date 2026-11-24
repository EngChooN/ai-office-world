// 11-24 집게 키움 확인 촬영: ① 집게 기계 — 더미에서 가장 큰 인형(특별·희귀)을 겨눠 들려 올라가는 순간(들릴 때까지 최대 10판)
//  ② 봉 기계 — 상자 가운데를 겨눠 두 발이 상자 양옆으로 내려가 조이는 순간. node shoot-grab.mjs [pc|portrait] → pity-tune/grab/*.png
import {chromium} from '@playwright/test';import {mkdirSync} from 'node:fs';
const SIZE=process.argv[2]??'pc',VP=SIZE==='portrait'?[390,844,true]:[1280,720,false];
const OUT='artifacts/claw-design/pity-tune/grab';mkdirSync(OUT,{recursive:true});
const {createServer}=await import('vite');const port=Number(process.env.PORT??5441);
const vite=await createServer({server:{port,host:'127.0.0.1',strictPort:true},logLevel:'warn'});await vite.listen();
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const sl=ms=>new Promise(r=>setTimeout(r,ms));const errs=[];
const ctx=await browser.newContext({viewport:{width:VP[0],height:VP[1]},deviceScaleFactor:1,isMobile:VP[2],hasTouch:VP[2]});
await ctx.addInitScript(()=>{if(!sessionStorage.getItem('__k')){localStorage.clear();sessionStorage.setItem('__k','1');}localStorage.setItem('aoworld:settings:v1',JSON.stringify({sound:false,volume:.7,music:true,hubTime:'auto'}));});
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.goto(`http://127.0.0.1:${port}/claw/`);await p.waitForFunction(()=>window.claw&&window.claw.fps>0,null,{timeout:180000});
await p.evaluate(()=>{claw.setCoins(30);claw.seen(true);});
const press=async()=>{const b=await (await p.waitForSelector('.kh-big',{state:'visible'})).boundingBox();await p.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.mouse.down();await sl(60);await p.mouse.up();};
const start=async i=>{await p.evaluate(n=>claw.goMachine(n),i);await sl(1100);await (await p.waitForSelector('.kh-big[data-act=play]',{state:'visible'})).click();await sl(400);
 if(await p.evaluate(()=>claw.hud.card==='rules'))await (await p.waitForSelector('.kh-card [data-c=go]',{state:'visible'})).click();await sl(800);};
const endPlay=async()=>{for(let t=0;t<60&&await p.evaluate(()=>claw.play.mode)!=='idle';t++){await sl(250);await p.evaluate(()=>{const b=[...document.querySelectorAll('.kh-card .kh-btn')].find(b=>/그만/.test(b.textContent));b?.click();});}};
// ① 집게 기계: 가장 큰 인형
let got=null;
for(let k=0;k<10&&!got;k++){await start(2);
 const tgt=await p.evaluate(()=>{const sim=claw.play.sim(claw.play.machine),S={common:1,uncommon:2,rare:3,special:4};const r=i=>claw.catalog?.find?.(c=>c.id===sim.dolls[i].id)?.rarity;
  const live=sim.dolls.map((d,i)=>i).filter(i=>!sim.dolls[i].gone&&!sim.dolls[i].won);const big=live.sort((a,b)=>sim.dolls[b].br-sim.dolls[a].br)[0],D=sim.dolls[big];claw.play.aim(D.cx*.1,D.cz*.1);return {di:big,id:D.id,br:+D.br.toFixed(2)};});
 await sl(150);await press();let closeShot=false;
 for(let t=0;t<400;t++){await sl(25);const s=await p.evaluate(di=>{const sim=claw.play.sim(claw.play.machine);return {st:sim.claw.state,lifted:sim.dolls[di].lifted};},tgt.di);
  if(s.st==='close'&&!closeShot){await sl(700);await p.screenshot({path:`${OUT}/${SIZE}-claw-big-close-try.png`});closeShot=true;}
  if(s.st==='lift'&&s.lifted){await p.screenshot({path:`${OUT}/${SIZE}-claw-big-lift.png`});got=tgt;break;}if(s.st==='done'||s.st==='carry')break;}
 if(got){const fs=await import('node:fs');fs.renameSync(`${OUT}/${SIZE}-claw-big-close-try.png`,`${OUT}/${SIZE}-claw-big-close.png`);}
 console.log('집게 판',k+1,tgt,got?'들림 ✓':'못 들림');await endPlay();}
// ② 봉 기계: 상자 가운데, 조이는 중
await start(6);await p.evaluate(()=>{const b=claw.play.rig(6).bsim,c=b.center();claw.play.aim(c[0]*.1,c[2]*.1);});await sl(150);await press();
for(let t=0;t<400;t++){await sl(25);const s=await p.evaluate(()=>claw.play.status().claw?.state);if(s==='close'){await sl(600);await p.screenshot({path:`${OUT}/${SIZE}-bridge-close.png`});break;}}
for(let t=0;t<400;t++){await sl(25);const s=await p.evaluate(()=>claw.play.status().claw?.state);if(s==='lift'){await sl(500);await p.screenshot({path:`${OUT}/${SIZE}-bridge-lift.png`});break;}}
await endPlay();
console.log(errs.length?errs:'페이지 오류 0');await browser.close();await vite.close();process.exit(0);
