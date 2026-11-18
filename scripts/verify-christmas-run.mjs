// 크리스마스 휴대폰 세로 「달리기」 단추 점검(월드개발, 2026-11-18).
//  ① 360×640·390×844·430×932(안전 영역 없음·노치 흉내 위 47/아래 34px)에서 광장·눈썰매 출발대·눈싸움 마당·하늘 썰매 정류장·하늘 썰매 탄 중
//     보이는 단추끼리 겹침 0, 달리기 단추 누르는 칸 44px 이상, 달리기 단추가 조이스틱 그림(손가락 댄 자리, 기본 자리 포함)과 안 겹침
//  ② 조이스틱으로 걷는 중(손가락 1 누른 채) 달리기 톡 → 바로 달림(속도 1.6배), 다시 톡 → 걷기 / 누르고 있기 → 누르는 동안만 달림
//  ③ PC Shift: 누르는 동안 달림, 떼면 걷기(단추 켜짐과 별개)
//   node scripts/verify-christmas-run.mjs [before|after] → artifacts/christmas-run/<태그>-*.png, report-<태그>.json
import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {startServer} from '../server/multi-server.mjs';
import * as L from '../src/christmas/layout.js';
import {REINDEER_STATION} from '../src/christmas/festive-layout.js';
import {RACE_BOARD} from '../src/christmas/sled-play.js';
const tag=process.argv[2]??'after',PARTS=new Set((process.env.PART??'layout,walk,pc').split(',')),dir='artifacts/christmas-run';mkdirSync(dir,{recursive:true});
const multiPort=Number(process.env.MULTI_PORT??8799),port=Number(process.env.PORT??5211),room='눈마을-달리기';
const {createServer}=await import('vite');
const vite=await createServer({server:{port,host:'127.0.0.1',strictPort:true,hmr:false,watch:null},logLevel:'warn'});await vite.listen();
const pageUrl=`http://127.0.0.1:${port}`,wsUrl=`ws://127.0.0.1:${multiPort}`;
const srv=startServer({PORT:String(multiPort),HOST:'127.0.0.1',DATA_DIR:`${dir}/data`},{quiet:true});await srv.ready;
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const out={tag,checks:{},errors:[],layouts:{}};let fail=false;
const check=(name,ok,detail={})=>{out.checks[name]={ok:!!ok,...detail};if(!ok)fail=true;console.log(ok?'통과':'실패',name,JSON.stringify(detail).slice(0,300));};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const until=async(fn,ms=15000,step=120)=>{const end=Date.now()+ms;while(Date.now()<end){try{if(await fn())return true;}catch{}await sleep(step);}return false;};
async function open(name,vp,{notch=false,mobile=true}={}){
 const ctx=await browser.newContext({viewport:vp,deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});
 await ctx.addInitScript(([notch])=>{localStorage.clear();localStorage.setItem('xmas-world:v1',JSON.stringify({look:{outfit:'santa'},wardrobe:[],tip:true,zones:['fight','sled','snowman','fire']}));
  if(notch)addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent='*{--st:47px!important;--sb:34px!important}';document.head.append(s);});},[notch]);
 const p=await ctx.newPage();p.ctx=ctx;
 p.on('pageerror',e=>out.errors.push(`${name}: ${e.message}`));
 await p.goto(`${pageUrl}/christmas/?capture=1&multi=${encodeURIComponent(room)}&server=${encodeURIComponent(wsUrl)}&name=${encodeURIComponent(name)}`);
 await p.waitForFunction(()=>window.xmas?.multi?.state==='online',null,{timeout:120000});await sleep(800);
 return p;
}
// 보이는 누를 수 있는 것 모두(단추·링크·role=button)
const layout=p=>p.evaluate(()=>{
 const vis=e=>{if(e.closest('[hidden]'))return null;const r=e.getBoundingClientRect();if(r.width<2||r.height<2)return null;let n=e;while(n&&n!==document.documentElement){const cs=getComputedStyle(n);if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity<.05)return null;n=n.parentElement;}
  const cs=getComputedStyle(e);if(cs.pointerEvents==='none')return null;if(r.right<0||r.bottom<0||r.left>innerWidth||r.top>innerHeight)return null;return r;};
 const name=e=>(e.getAttribute('aria-label')||e.innerText||e.className||e.tagName).replace(/\s+/g,' ').trim().slice(0,24);
 const items=[...document.querySelectorAll('button,a[href],[role=button]')].map(e=>{const r=vis(e);return r&&{n:name(e),c:String(e.className).slice(0,30),x:Math.round(r.left),y:Math.round(r.top),w:Math.round(r.width),h:Math.round(r.height)};}).filter(Boolean);
 // 안쪽 단추(카드 안 단추)는 그 카드와 겹쳐도 됨 → 서로 조상·자손이면 뺌
 return {W:innerWidth,H:innerHeight,items,html:document.documentElement.className};
});
const ov=(a,b)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
function overlaps(l){const res=[];const it=l.items;for(let i=0;i<it.length;i++)for(let j=i+1;j<it.length;j++){const a=it[i],b=it[j];const o=ov(a,b);if(o>4&&!(a.x<=b.x&&a.y<=b.y&&a.x+a.w>=b.x+b.w&&a.y+a.h>=b.y+b.h)&&!(b.x<=a.x&&b.y<=a.y&&b.x+b.w>=a.x+a.w&&b.y+b.h>=a.y+a.h))res.push(`${a.n}|${b.n}:${Math.round(o)}`);}return res;}
// 조이스틱 기본 자리: 왼쪽 아래 엄지 자리(왼쪽 22%, 아래 26%)에 손가락을 대면 생기는 원(반지름 STICK.radius+여백)
const stickRect=async p=>p.evaluate(async()=>{const {STICK,clampStickBase}=await import('/src/joystick.js');const b=clampStickBase(innerWidth*.22,innerHeight*.78,innerWidth,innerHeight);const r=STICK.radius+10;return {x:b.x-r,y:b.y-r,w:2*r,h:2*r};});
const runBtn=l=>l.items.find(i=>/xt-run/.test(i.c));
const place=(p,x,z,h=0)=>p.evaluate(([x,z,h])=>{window.xmas.player.place(x,z,h);window.xmas.cam.yaw=h;},[x,z,h]);
const SIZES=[[360,640],[390,844],[430,932]];
for(const [w,h] of PARTS.has('layout')?SIZES:[])for(const notch of [false,true]){
 const key=`${w}x${h}${notch?'-notch':''}`;const p=await open(`폰${w}`,{width:w,height:h},{notch});
 const spots=[['plaza',0,10,0]];
 // 자리: 썰매 출발대·눈싸움 마당·하늘 썰매 정류장(layout·festive-layout 값)
 spots.push(['sledDeck',L.SLED_RUN.deck.x+1,L.SLED_RUN.deck.z,L.SLED_RUN.deck.heading]);
 spots.push(['raceBoard',RACE_BOARD.x,RACE_BOARD.z+2,0]);
 spots.push(['fight',L.SNOWBALL_YARD.x,L.SNOWBALL_YARD.z,0]);
 spots.push(['campfire',L.CAMPFIRE.x,L.CAMPFIRE.z+3.2,0]);
 spots.push(['mailbox',L.MAILBOX.stand.x,L.MAILBOX.stand.z,L.MAILBOX.heading]);
 if(REINDEER_STATION)spots.push(['skyStation',REINDEER_STATION.x+1.5,REINDEER_STATION.z+1.5,0]);
 out.layouts[key]={};
 for(const [label,x,z,hd] of spots){
  await place(p,x,z,hd);await sleep(900);const l=await layout(p),run=runBtn(l),stick=await stickRect(p),o=overlaps(l);
  out.layouts[key][label]={overlaps:o,run,items:l.items.length,html:l.html};
  check(`${key} ${label}: 단추 겹침 0`,!o.length,{o});
  if(run){check(`${key} ${label}: 달리기 44px 이상·조이스틱과 안 겹침`,run.w>=44&&run.h>=44&&!ov(run,stick),{run,stick});}
  if(['plaza','skyStation','fight'].includes(label))await p.screenshot({path:`${dir}/${tag}-${key}-${label}.png`});
 }
 // 하늘 썰매 탄 중
 await place(p,REINDEER_STATION.x+1.5,REINDEER_STATION.z+1.5,0);await sleep(500);
 const rode=await p.evaluate(async()=>{const s=window.xmas.sky;if(!s?.enabled)return 'off';s.act('hs:board');await new Promise(r=>setTimeout(r,2500));return s.riding?'ride':'no:'+s.status().mode;});
 if(rode==='ride'){await sleep(900);const l=await layout(p),o=overlaps(l),run=runBtn(l);check(`${key} 하늘 썰매 탄 중: 단추 겹침 0`,!o.length,{o,run});await p.screenshot({path:`${dir}/${tag}-${key}-sky.png`});
  const fly=await p.evaluate(async()=>{const s=window.xmas.sky;s.act('hs:up');await new Promise(r=>setTimeout(r,4000));return s.status().mode;});
  {const l=await layout(p),o=overlaps(l),run=runBtn(l);check(`${key} 하늘 썰매 나는 중(${fly}): 단추 겹침 0`,fly==='fly'&&!o.length,{o,run});await p.screenshot({path:`${dir}/${tag}-${key}-fly.png`});}
  await p.evaluate(()=>window.xmas.sky.stop());}
 else out.layouts[key].skyRide=rode;
 await p.ctx.close();
}
// ② 걷는 중 달리기(390×844)
if(PARTS.has('walk')){
 const p=await open('걷기',{width:390,height:844});await place(p,0,14,0);await sleep(500);
 const spd=async()=>{const a=await p.evaluate(()=>({x:window.xmas.player.x,z:window.xmas.player.z}));await sleep(500);const b=await p.evaluate(()=>({x:window.xmas.player.x,z:window.xmas.player.z}));return Math.hypot(b.x-a.x,b.z-a.z)/.5;};
 const cdp=await p.ctx.newCDPSession(p);const W=390,H=844,sx=Math.round(W*.25),sy=Math.round(H*.72);
 const run=await p.evaluate(()=>{const r=document.querySelector('.xt-run').getBoundingClientRect();return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)};});
 const tp=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts});
 await p.evaluate(()=>{window.__runlog=[];const b=document.querySelector('.xt-run');for(const t of ['pointerdown','pointerup','pointercancel','lostpointercapture','click'])b.addEventListener(t,e=>window.__runlog.push(t+':'+e.pointerId+':'+(window.xmas.travel?.ui.run)));});
 const stickPt={x:sx,y:sy,id:1},stickUp={x:sx,y:sy-60,id:1},runPt={...run,id:2};
 await tp('touchStart',[stickPt]);await sleep(80);await tp('touchMove',[stickUp]);await sleep(700);
 const walk=await spd();
 await tp('touchStart',[stickUp,runPt]);await sleep(60);await tp('touchEnd',[runPt]);await sleep(600);
 const runTap=await spd(),onAfterTap=await p.evaluate(()=>window.xmas.travel?.ui.run);
 check('걷는 중 달리기 톡 → 바로 달림',runTap>walk*1.4&&onAfterTap===true,{walk:+walk.toFixed(2),run:+runTap.toFixed(2),on:onAfterTap});
 await tp('touchStart',[stickUp,runPt]);await sleep(60);await tp('touchEnd',[runPt]);await sleep(600);
 const back=await spd();check('다시 톡 → 걷기',back<walk*1.15,{walk:+walk.toFixed(2),now:+back.toFixed(2)});
 // 누르고 있기: 누르는 동안 달리고 떼면 원래(꺼짐)로
 await tp('touchStart',[stickUp,runPt]);await sleep(400);const hold=await spd();await tp('touchEnd',[runPt]);await sleep(600);const after=await spd();
 check('걷는 중 달리기 누르고 있기 → 누르는 동안 달림, 떼면 걷기',hold>walk*1.4&&after<walk*1.15,{walk:+walk.toFixed(2),hold:+hold.toFixed(2),after:+after.toFixed(2)});
 out.runlog=await p.evaluate(()=>window.__runlog);console.log('runlog',out.runlog.join(' '));
 await tp('touchEnd',[]);await p.screenshot({path:`${dir}/${tag}-walk-run.png`});await p.ctx.close();
}
// ③ PC Shift
if(PARTS.has('pc')){
 const p=await open('피씨',{width:1440,height:900},{mobile:false});await place(p,0,14,0);await p.click('canvas',{position:{x:700,y:300}}).catch(()=>{});
 const spd=async()=>{const a=await p.evaluate(()=>({x:window.xmas.player.x,z:window.xmas.player.z}));await sleep(500);const b=await p.evaluate(()=>({x:window.xmas.player.x,z:window.xmas.player.z}));return Math.hypot(b.x-a.x,b.z-a.z)/.5;};
 await p.keyboard.down('KeyW');await sleep(600);const walk=await spd();await p.keyboard.down('ShiftLeft');await sleep(400);const run=await spd();await p.keyboard.up('ShiftLeft');await sleep(400);const back=await spd();await p.keyboard.up('KeyW');
 check('PC 걷다가 Shift 누르면 달리고 떼면 걷기',run>walk*1.4&&back<walk*1.15,{walk:+walk.toFixed(2),run:+run.toFixed(2),back:+back.toFixed(2)});
 await p.ctx.close();
}
writeFileSync(`${dir}/report-${tag}.json`,JSON.stringify(out,null,1));
console.log(fail?'실패 있음':'모두 통과',out.errors.slice(0,5));
await browser.close();await vite.close();srv.close?.();process.exit(fail?1:0);
