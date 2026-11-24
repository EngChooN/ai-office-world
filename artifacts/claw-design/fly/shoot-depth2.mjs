// (11-24 깊이 2차 사본: 결과를 fly/shots에) 봉 1~4 하강 최저점 촬영(11-24 깊이). node shoot-depth.mjs <뿌리> <before|after> [port] → depth/shots/<이름>-bridge-N.png
// 겨눔 = 상자 가운데에서 긴 쪽 반 길이 60% + 폭 쪽 반 폭 70%(보통 판처럼 가장자리 — 발 하나가 상자 윗면에 닿음), 「집게 조이기 시작」 0.3초 뒤
import {chromium} from '@playwright/test';import {mkdirSync} from 'node:fs';
const [root,name,PORT='5461']=process.argv.slice(2);process.chdir(root);
const OUT=root+'/artifacts/claw-design/fly/shots';mkdirSync(OUT,{recursive:true});
const {createServer}=await import('/Users/pc-2311001/gwanak-hiking/node_modules/vite/dist/node/index.js');const port=+PORT;
const vite=await createServer({root,server:{port,host:'127.0.0.1',strictPort:true},logLevel:'warn'});await vite.listen();
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const sl=ms=>new Promise(r=>setTimeout(r,ms));const errs=[];
const ctx=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
await ctx.addInitScript(()=>{if(!sessionStorage.getItem('__k')){localStorage.clear();sessionStorage.setItem('__k','1');}localStorage.setItem('aoworld:settings:v1',JSON.stringify({sound:false,volume:.7,music:true,hubTime:'auto'}));});
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.goto(`http://127.0.0.1:${port}/claw/`);await p.waitForFunction(()=>window.claw&&window.claw.fps>0,null,{timeout:180000});
await p.evaluate(()=>{claw.setCoins(30);claw.seen(true);});
const press=async()=>{const b=await (await p.waitForSelector('.kh-big',{state:'visible'})).boundingBox();await p.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.mouse.down();await sl(60);await p.mouse.up();};
const start=async i=>{await p.evaluate(n=>claw.goMachine(n),i);await sl(1100);await (await p.waitForSelector('.kh-big[data-act=play]',{state:'visible'})).click();await sl(400);
 if(await p.evaluate(()=>claw.hud.card==='rules'))await (await p.waitForSelector('.kh-card [data-c=go]',{state:'visible'})).click();await sl(800);};
const endPlay=async()=>{for(let t=0;t<60&&await p.evaluate(()=>claw.play.mode)!=='idle';t++){await sl(250);await p.evaluate(()=>{const b=[...document.querySelectorAll('.kh-card .kh-btn')].find(b=>/그만/.test(b.textContent));b?.click();});}};
const res=[];
for(const i of [6,7,8,9]){await start(i);
 const aim=await p.evaluate(i=>{const b=claw.play.rig(i).bsim,c=b.center(),Q=b.P,ax=[Q.x[3]-Q.x[2],Q.z[3]-Q.z[2]],l=Math.hypot(...ax),hl=1.1*.6,hw=.8*.7,u=[ax[0]/l,ax[1]/l],v=[-u[1],u[0]];claw.play.aim((c[0]+u[0]*hl+v[0]*hw)*.1,(c[2]+u[1]*hl+v[1]*hw)*.1);return c;},i);
 await sl(200);await press();let low=null;
 for(let t=0;t<600;t++){await sl(20);const s=await p.evaluate(i=>{const b=claw.play.rig(i).bsim;return {st:b.claw.state,drop:b.clawPose().drop};},i);
  if(s.st==='close'){await sl(300);low=await p.evaluate(i=>claw.play.rig(i).bsim.clawPose().drop,i);await p.screenshot({path:`${OUT}/${name}-bridge-${i-5}.png`});break;}}
 res.push({machine:`bridge-${i-5}`,drop_cm:low==null?null:+(low*100).toFixed(1)});await endPlay();}
console.log(JSON.stringify(res),errs.length?errs:'페이지 오류 0');await browser.close();await vite.close();process.exit(0);
