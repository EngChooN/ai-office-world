// 받쳐 든 손 인형이 기계 옆을 지날 때 기계에 겹치는지(11-25 월드공통개발). node artifacts/carry-pose-check/probe.mjs
import {createRequire} from 'node:module';
const ROOT=new URL('../..',import.meta.url).pathname.replace(/\/$/,'');const req=createRequire(ROOT+'/package.json');
const pw=await import(req.resolve('@playwright/test'));const chromium=pw.chromium??pw.default.chromium;
const {createServer}=await import(req.resolve('vite'));
const vite=await createServer({root:ROOT,configFile:ROOT+'/vite.config.js',cacheDir:'/tmp/carry-p/.vite',server:{port:5427,host:'127.0.0.1',strictPort:true,hmr:false,watch:null},logLevel:'warn'});await vite.listen();
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const DEX={squirrel:{n:2,first:'2026-11-24',machine:'claw-1'},'box-cat':{n:1,first:'2026-11-24',machine:'bridge-2'},'dongdong-office':{n:1,first:'2026-11-24',machine:'claw-5'},
 'dongdong-santa':{n:1,first:'2026-11-25',machine:'key-1'},'big-haechi':{n:1,first:'2026-11-25',machine:'timer-3'}};
const clawSave=JSON.stringify({coins:30,lastGrant:'2099-01-01',coinV:3,plays:9,wins:5,dex:DEX,pity:{},seen:Object.fromEntries(['claw-1','claw-2','claw-3','claw-4','claw-5','claw-6','bridge-1','bridge-2','bridge-3','bridge-4','timer-1','timer-2','timer-3','key-1','key-2','key-3'].map(k=>[k,true])),log:[],seenTip:true,mach:{}});
const HAND=process.env.HAND||'squirrel';
const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
await ctx.addInitScript(`if(!sessionStorage.getItem('__k')){localStorage.clear();localStorage.setItem('claw-world:v1',${JSON.stringify(clawSave)});localStorage.setItem('aoworld:carry:v1',JSON.stringify({hand:'${HAND}',back:null}));sessionStorage.setItem('__k','1');}`);
const p=await ctx.newPage();p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('http://127.0.0.1:5427/claw/?serverpick=off');await p.waitForFunction(()=>window.claw&&window.claw.fps>0&&window.__carry?.list().some(c=>c.shown.hand),null,{timeout:180000});
const res=await p.evaluate(async(process_fix)=>{
 const T=window.claw.shop.constructor;const U=claw.shop.userData,R=.22,fr=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 const me=()=>__carry.list().find(c=>c.shown.hand);
 // 기계 그림 상자(세계 좌표)
 const boxes=[];claw.shop.updateMatrixWorld(true);
 for(const c of U.colliders){if(c.r!==undefined)continue;boxes.push(c);}
 const out=[];let worst=null,tested=0;
 for(const c of boxes){
  // 옆면에서 0.6m 떨어진 빈 자리에서 출발해, 옆면 쪽으로 비스듬히 붙으며 나란히 걸음(기계에 붙어 지나가기). 걷는 동안 가장 깊이 파고든 값
  const sides=[['x0',-1,0],['x1',1,0],['z0',0,-1],['z1',0,1]];
  for(const [nm,nx,nz] of sides)for(const t of [.2,.5,.8])for(const dir of [1,-1]){
   const ex=nx<0?c.x0:nx>0?c.x1:c.x0+(c.x1-c.x0)*t,ez=nz<0?c.z0:nz>0?c.z1:c.z0+(c.z1-c.z0)*t;
   let px=ex+nx*.6,pz=ez+nz*.6;{const g0=claw.collide(px,pz);if(Math.hypot(g0.x-px,g0.z-pz)>.01)continue;}
   const tx=nz?dir:0,tz=nx?dir:0,mx=tx-nx*.45,mz=tz-nz*.45,L=Math.hypot(mx,mz),dx=mx/L,dz=mz/L,heading=Math.atan2(-dx,-dz);
   claw.player.place(px,pz,heading);await fr();await fr();
   if(claw.handPen(px,pz,heading)>.01)continue; // 출발 자리부터 인형이 겹치면 뺌
   tested++;let maxPen=0,at=null;
   for(let k=0;k<45;k++){
    let g=process_fix?claw.collide(px+dx*.04,pz+dz*.04,heading):claw.collide(px+dx*.04,pz+dz*.04);
    if(process_fix){const pen=claw.handPen(g.x,g.z,heading);if(pen>.01&&pen>=claw.handPen(px,pz,heading)-1e-4)g={x:px,z:pz};}
    px=g.x;pz=g.z;claw.player.place(px,pz,heading);await fr();
    const b=me()?.boxes.hand;if(!b)continue;
    let pen=0;for(const o of boxes){const ox=Math.min(b.max[0],o.x1)-Math.max(b.min[0],o.x0),oz=Math.min(b.max[2],o.z1)-Math.max(b.min[2],o.z0);if(ox>0&&oz>0)pen=Math.max(pen,Math.min(ox,oz));}
    if(pen>maxPen){maxPen=pen;at={x:px,z:pz,heading};}
   }
   const r={id:c.id,side:nm,dir,pen:+maxPen.toFixed(3)};
   if(maxPen>0)out.push(r);if(!worst||maxPen>worst.pen)worst={...r,...at};
  }
 }
 return {n:boxes.length,hits:out.length,worst,ring:claw.handRing,ids:[...new Set(out.map(o=>o.id))].slice(0,40),top:out.sort((a,b)=>b.pen-a.pen).slice(0,12).map(o=>JSON.stringify(o)),over3:out.filter(o=>o.pen>.03).length,tested:tested};
},!!process.env.FIX);
console.log(JSON.stringify(res,null,1));
if(res.worst){await p.evaluate(w=>claw.player.place(w.x,w.z,w.heading),res.worst);await new Promise(r=>setTimeout(r,800));await p.screenshot({path:ROOT+`/artifacts/carry-pose-check/worst-${HAND}${process.env.FIX?'-fix':''}.png`});}
await browser.close();await vite.close();
