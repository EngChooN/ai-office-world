// 뽑기별 「조임 → 올라감」 장면 촬영(월드개발, 2026-11-23 통과 수정). vite 개발 서버를 직접 띄움, PC 1280×720 정면.
//  node artifacts/claw-design/pass-through/shoot-lift.mjs → artifacts/claw-design/pass-through/shots/*.png + shots.json
// 집게 1(인형) = 가장 위 인형 겨눔, 봉 1~4 = 상자 한쪽 긴 모서리(집게 한 발이 상자 위·한 발이 바깥) 겨눔. 올라가기 시작하고 0.35초 뒤 한 장.
import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const OUT='artifacts/claw-design/pass-through/shots';mkdirSync(OUT,{recursive:true});
const {createServer}=await import('vite');const port=Number(process.env.PORT??5397);
const vite=await createServer({server:{port,host:'127.0.0.1',strictPort:true},logLevel:'warn'});await vite.listen();
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const sl=ms=>new Promise(r=>setTimeout(r,ms));
const TARGETS=[[0,'claw-1','집게1'],[6,'bridge-1','봉1'],[7,'bridge-2','봉2'],[8,'bridge-3','봉3'],[9,'bridge-4','봉4']];
const out=[];let errs=[];
for(const [i,id,name] of TARGETS){
 const ctx=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
 await ctx.addInitScript(()=>{if(!sessionStorage.getItem('__k')){localStorage.clear();sessionStorage.setItem('__k','1');}localStorage.setItem('aoworld:settings:v1',JSON.stringify({sound:false,volume:.7,music:true,hubTime:'auto'}));});
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(`${name}: ${e.message}`));
 await p.goto(`http://127.0.0.1:${port}/claw/`);await p.waitForFunction(()=>window.claw&&window.claw.fps>0,null,{timeout:180000});
 await p.evaluate(()=>claw.setCoins(30));
 await p.evaluate(n=>claw.goMachine(n),i);await sl(1200);
 await (await p.waitForSelector('.kh-big[data-act=play]',{state:'visible'})).click();await sl(400);
 if(await p.evaluate(()=>claw.hud.card==='rules')){await (await p.waitForSelector('.kh-card [data-c=go]',{state:'visible'})).click();}
 await sl(900);
 if(id.startsWith('claw')){await p.evaluate(()=>claw.aim(0));await sl(150);await (await p.waitForSelector('.kh-big[data-act=press]',{state:'visible'})).click();}
 else{
  // 상자 가운데(기계 m) + 폭 쪽 0.055m·길이 쪽 0.06m: 한 발이 상자 긴 모서리 위, 다른 발은 바깥
  await p.evaluate(n=>{const b=claw.play.rig(n).bsim,c=b.center();claw.play.aim(c[0]*.1+.055,c[2]*.1+.06);},i);await sl(150);
  const b=await (await p.waitForSelector('.kh-big',{state:'visible'})).boundingBox();await p.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.mouse.down();await sl(60);await p.mouse.up();}
 let shot=false,lift0=0;
 for(let t=0;t<400&&!shot;t++){await sl(25);const s=await p.evaluate(()=>claw.play.status().claw?.state);
  if(s==='lift'&&!lift0)lift0=Date.now();
  if(lift0&&Date.now()-lift0>350){await p.screenshot({path:`${OUT}/${id}-lift.png`});shot=true;}}
 const info=await p.evaluate(n=>{const r=claw.play.rig(n);return r.bsim?{support:+r.bsim.support().toFixed(3),tilt:+r.bsim.tilt().toFixed(1),y:+r.bsim.center()[1].toFixed(2)}:{left:r.sim.left()};},i);
 out.push({id,name,shot,info});console.log(id,shot,JSON.stringify(info));
 await ctx.close();
}
writeFileSync(`${OUT}/shots.json`,JSON.stringify({at:new Date().toISOString(),out,errs},null,1));
console.log(errs.length?errs:'페이지 오류 0');
await browser.close();await vite.close();
