// 기계 종류별 「👁 옆에서 보기」 촬영·확인(월드개발, 2026-11-23 대표 지적): 양옆에 이웃이 있는 가운데 기계를 오른쪽·왼쪽 옆에서.
//  node artifacts/claw-design/pass-through/shoot-side.mjs [pc|portrait] → artifacts/claw-design/pass-through/side/*.png + side.json
// 확인: 칩으로 옆 시점이 됨, 카메라와 기계 사이 옆 기계는 숨김(보는 기계는 보임), 정면으로 돌아가면 다시 보임
import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const SIZE=process.argv[2]??'pc',VP=SIZE==='portrait'?[390,844,true]:[1280,720,false];
const OUT='artifacts/claw-design/pass-through/side';mkdirSync(OUT,{recursive:true});
const {createServer}=await import('vite');const port=Number(process.env.PORT??5398);
const vite=await createServer({server:{port,host:'127.0.0.1',strictPort:true},logLevel:'warn'});await vite.listen();
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const sl=ms=>new Promise(r=>setTimeout(r,ms));
const TARGETS=[[2,'claw-3'],[7,'bridge-2'],[11,'timer-2'],[14,'key-2']];
const out=[],errs=[];let fails=0;
const ctx=await browser.newContext({viewport:{width:VP[0],height:VP[1]},deviceScaleFactor:1,isMobile:VP[2],hasTouch:VP[2]});
await ctx.addInitScript(()=>{if(!sessionStorage.getItem('__k')){localStorage.clear();sessionStorage.setItem('__k','1');}localStorage.setItem('aoworld:settings:v1',JSON.stringify({sound:false,volume:.7,music:true,hubTime:'auto'}));});
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.goto(`http://127.0.0.1:${port}/claw/`);await p.waitForFunction(()=>window.claw&&window.claw.fps>0,null,{timeout:180000});
await p.evaluate(()=>{claw.setCoins(30);claw.seen(true);});
const vis=()=>p.evaluate(()=>claw.shop.userData.machines.map(M=>M.group.visible));
for(const [i,id] of TARGETS){
 await p.evaluate(n=>claw.goMachine(n),i);await sl(1100);
 await (await p.waitForSelector('.kh-big[data-act=play]',{state:'visible'})).click();await sl(900);
 const front=await vis();
 const chip=await p.$('.kh-todo[data-act=side]');const has=!!chip&&await chip.isVisible();
 if(!has){fails++;out.push({id,side:false});console.log('✖',id,'옆에서 보기 칩 없음');}
 else{
  await chip.click();await sl(1200);const right=await vis();await p.screenshot({path:`${OUT}/${SIZE}-${id}-right.png`});
  await (await p.waitForSelector('.kh-todo[data-act=flip]',{state:'visible'})).click();await sl(1200);const left=await vis();await p.screenshot({path:`${OUT}/${SIZE}-${id}-left.png`});
  await (await p.waitForSelector('.kh-todo[data-act=side]',{state:'visible'})).click();await sl(900);const back=await vis();
  const hidR=right.map((v,j)=>v?null:j).filter(v=>v!==null),hidL=left.map((v,j)=>v?null:j).filter(v=>v!==null);
  const pass=front.every(Boolean)&&right[i]&&left[i]&&hidR.length>0&&hidL.length>0&&back.every(Boolean);
  if(!pass)fails++;
  out.push({id,side:true,hiddenRight:hidR,hiddenLeft:hidL,restored:back.every(Boolean),pass});console.log(pass?'✓':'✖',id,'오른쪽 옆 숨김',hidR,'왼쪽 옆 숨김',hidL,'정면 복귀',back.every(Boolean));
 }
 // 판 끝내기(✕ → 그만두기)
 await p.evaluate(()=>{document.querySelector('.kh-quit')?.click();});await sl(300);await p.evaluate(()=>{const b=[...document.querySelectorAll('.kh-card .kh-btn')].find(b=>/그만/.test(b.textContent));b?.click();});await sl(800);
 if(await p.evaluate(()=>claw.play.mode)!=='idle'){await p.evaluate(()=>claw.play.quit?.());await sl(500);}
}
writeFileSync(`${OUT}/side-${SIZE}.json`,JSON.stringify({at:new Date().toISOString(),SIZE,out,errs,fails},null,1));
console.log(errs.length?errs:'페이지 오류 0',`실패 ${fails}`);
await browser.close();await vite.close();
process.exit(fails||errs.length?1:0);
