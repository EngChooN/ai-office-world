// 인사하기·자동 걷기 창 현재 모습 캡처·측정(2026-11-18, 시안용). 코드 수정 없음.
import {chromium} from '@playwright/test';
import {writeFileSync} from 'node:fs';
import {startServer} from '../../server/multi-server.mjs';
const dir='artifacts/greet-popup';
const multiPort=8797,port=5209;
const {createServer}=await import('vite');
const vite=await createServer({server:{port,host:'127.0.0.1',strictPort:true},logLevel:'warn'});await vite.listen();
const pageUrl=`http://127.0.0.1:${port}`,wsUrl=`ws://127.0.0.1:${multiPort}`;
const srv=startServer({PORT:String(multiPort),HOST:'127.0.0.1',DATA_DIR:`${dir}/data-capture`},{quiet:true});await srv.ready;
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const out={};
async function open(name,room,{viewport,mobile}){
 const ctx=await browser.newContext({viewport,deviceScaleFactor:mobile?2:1,hasTouch:mobile,isMobile:mobile});
 await ctx.addInitScript(()=>localStorage.setItem('gwanak-sound-enabled','false'));
 const p=await ctx.newPage();p.ctx=ctx;
 await p.goto(`${pageUrl}/hiking/?multi=${encodeURIComponent(room)}&server=${encodeURIComponent(wsUrl)}&name=${encodeURIComponent(name)}&start=entrance&time=13:00&weather=clear&quality=balanced`);
 await p.waitForFunction(()=>window.hiking?.started,null,{timeout:240000});
 await p.waitForFunction(()=>window.hiking.multi?.()?.status==='online',null,{timeout:60000,polling:200});
 return p;
}
const cmd=(p,id,value)=>p.evaluate(([id,value])=>window.dispatchEvent(new CustomEvent('hiking:command',{detail:{id,value}})),[id,value]);
const stand=(p,pos)=>p.evaluate(pos=>window.hiking.multiApi.teleport({zone:'plaza',...pos}),pos);
// 화면에 보이는 UI 상자(도장·꼬리표·알약·마커)
const measure=p=>p.evaluate(()=>{
 const vis=e=>{if(!e||e.hidden)return null;const r=e.getBoundingClientRect();if(!r.width||!r.height)return null;const cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0)return null;return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)};};
 const W=innerWidth,H=innerHeight;
 return {W,H,stamp:vis(document.getElementById('auto')),stampMode:document.getElementById('auto')?.dataset.mode,ctx:vis(document.querySelector('.nb-ctx')),ctxText:document.querySelector('.nb-ctx')?.innerText,
  markers:[...document.querySelectorAll('.ix-marker')].map(vis).filter(Boolean),
  me:window.hiking.multi().roster?.[0]};
});
async function run(label,vp,shots){
 const A=await open('하늘',`캡처-${label}`,vp),B=await open('바다',`캡처-${label}`,vp);await sleep(2500);
 await cmd(A,'view');await cmd(A,'view');
 const r=await B.evaluate(()=>window.hiking.multi().roster[0]);const a=r?{x:r.x,z:r.z,heading:r.heading}:null;
 const base=a??{x:0,z:0,heading:0};
 out[label]={base};
 const put=async(d,ang=0.25)=>{const fx=-Math.sin(base.heading),fz=-Math.cos(base.heading),sx=-fz,sz=fx;
  const bx=base.x+fx*d*Math.cos(ang)+sx*d*Math.sin(ang),bz=base.z+fz*d*Math.cos(ang)+sz*d*Math.sin(ang);
  await stand(B,{x:bx,z:bz,heading:Math.atan2(-(base.x-bx),-(base.z-bz))});await sleep(1800);};
 await stand(A,base);
 // 혼자(20m)
 await put(20);out[label].alone=await measure(A);await A.screenshot({path:`${dir}/${label}-alone.png`});
 // 거리별로 뜨는지
 out[label].byDist={};
 for(const d of [6,5,4.5,3.8,3,2]){await put(d);const m=await measure(A);out[label].byDist[d]={mode:m.stampMode,ctx:!!m.ctx};}
 await put(3.0);out[label].near=await measure(A);await A.screenshot({path:`${dir}/${label}-near.png`});
 // 다시 멀어지기: 5·6·7m
 out[label].leave={};for(const d of [5,6,7]){await put(d);const m=await measure(A);out[label].leave[d]=m.stampMode;}
 // 자동 걷기 중 상대가 3m 앞
 await put(3.0);await cmd(A,'auto');await sleep(700);out[label].auto=await measure(A);await A.screenshot({path:`${dir}/${label}-auto.png`});
 // 동행(같이 등산하기) 맺고 둘 다 자동 걷기 6초 뒤
 await cmd(A,'auto');await sleep(400);await put(2.5);
 const bid=await A.evaluate(()=>window.hiking.multi().roster[0].id);
 await A.evaluate(id=>window.dispatchEvent(new CustomEvent('hiking:pair-offer',{detail:{to:id}})),bid);await sleep(1500);
 await B.evaluate(()=>window.dispatchEvent(new CustomEvent('hiking:pair-accept')));await sleep(1500);
 await cmd(A,'auto');await cmd(B,'auto');
 out[label].pairWalk=[];
 for(let i=0;i<6;i++){await sleep(1500);const m=await measure(A);out[label].pairWalk.push({mode:m.stampMode,ctx:!!m.ctx,dist:m.me?Math.hypot(m.me.x-(await A.evaluate(()=>0)),0):null});}
 out[label].pair=await measure(A);await A.screenshot({path:`${dir}/${label}-pair.png`});
 await A.ctx.close();await B.ctx.close();
}
const only=process.argv[2];
if(!only||only==='pc')await run('pc',{viewport:{width:1440,height:900},mobile:false});
if(only==='land')await run('land',{viewport:{width:844,height:390},mobile:true});
if(!only||only==='mobile')await run('mobile',{viewport:{width:390,height:844},mobile:true});
writeFileSync(`${dir}/measure-${only||'all'}.json`,JSON.stringify(out,null,1));
console.log(JSON.stringify(out,null,1));
await browser.close();await vite.close();srv.close?.();process.exit(0);
