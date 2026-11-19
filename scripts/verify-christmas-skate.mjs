// 스케이트 A안 실제 게임 측정(월드개발, 2026-11-19): 서버(MULTI_PORT 8796)·vite(PORT 5198)를 이 스크립트가 띄우고 끝나면 닫는다.
// PC '하나'(1920×1080, 키보드) + 휴대폰 '둘'(390×844, 터치 조이스틱) 같은 방. 매 프레임 기록(rAF)으로 잰다.
//  ① PC: 최고 속도·90%까지·손 떼면 미끄러진 거리, 반대 누르기 제동 거리, 벽 비비기(벽 쪽 비스듬히 3초), 문 앞 감속
//  ② 휴대폰: 조이스틱 앞으로 최고 속도·미끄러짐, 8방향을 45°씩 돌릴 때 몸 도는 빠르기(°/s)
//  ③ 다른 사람 화면(둘)에서 하나의 자세(밀기·활주·멈추기)가 움직임만으로 보임 ④ 링크 밖 걷기 속도 그대로 · 페이지 오류 0
//   node scripts/verify-christmas-skate.mjs → artifacts/christmas-skate/report.json, *.png
import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {startServer} from '../server/multi-server.mjs';
import {RINK} from '../src/christmas/festive-layout.js';
import {WALK_SPEED} from '../src/lounge/avatar.js';

const dir='artifacts/christmas-skate',multiPort=Number(process.env.MULTI_PORT??8796),room='눈마을-2';mkdirSync(dir,{recursive:true});
const {createServer}=await import('vite');const port=Number(process.env.PORT??5198);
const vite=await createServer({server:{port,host:'127.0.0.1',strictPort:true,hmr:false,watch:null},logLevel:'warn'});await vite.listen();
const pageUrl=`http://127.0.0.1:${port}`,wsUrl=`ws://127.0.0.1:${multiPort}`;
const srv=startServer({PORT:String(multiPort),HOST:'127.0.0.1',DATA_DIR:`${dir}/data`},{quiet:true});await srv.ready;
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const out={at:new Date().toISOString(),design:{top:2.39,t90:1.57,glide:2.22,brake:.81},measured:{},checks:{},errors:[]};let fail=false;
const check=(name,ok,detail={})=>{out.checks[name]={ok:!!ok,...detail};if(!ok)fail=true;console.log(ok?'통과':'실패',name,JSON.stringify(detail).slice(0,300));};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const near=(v,want,tol=.1)=>Math.abs(v-want)<=want*tol;
async function open(name,vp){
 const mobile=vp.width<900;
 const ctx=await browser.newContext({viewport:vp,deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});
 await ctx.addInitScript(()=>{localStorage.clear();localStorage.setItem('xmas-world:v1',JSON.stringify({look:{outfit:'santa'},wardrobe:[],tip:true,zones:['fight','snowman','sled','fire']}));});
 const p=await ctx.newPage();p.label=name;p.mobile=mobile;p.ctx=ctx;
 p.on('pageerror',e=>out.errors.push(`${name}: ${e.message}`));
 p.on('console',m=>{if(m.type()==='error'&&!/WebSocket connection|favicon|ERR_CONNECTION_REFUSED|Failed to load resource/.test(m.text()))out.errors.push(`${name}: ${m.text()}`);});
 await p.goto(`${pageUrl}/christmas/?capture=1&multi=${encodeURIComponent(room)}&server=${encodeURIComponent(wsUrl)}&name=${encodeURIComponent(name)}`);
 await p.waitForFunction(()=>window.xmas?.multi?.state==='online',null,{timeout:120000});
 // 매 프레임 기록
 await p.evaluate(()=>{window.__sk=[];const t0=performance.now();const f=()=>{const x=window.xmas,r=x.rink.status();window.__sk.push({t:(performance.now()-t0)/1000,x:x.player.x,z:x.player.z,h:x.player.heading,v:r.v,pose:r.pose,inside:r.inside,remotes:r.remotes});requestAnimationFrame(f);};requestAnimationFrame(f);});
 return p;
}
const mark=p=>p.evaluate(()=>window.__sk.length);
const logFrom=(p,i)=>p.evaluate(i=>window.__sk.slice(i),i);
// 링크 안 (x,z)에 몸 방향 h로 세움(들어가기 단추를 눌러 안에 있음 상태로 만든 뒤 자리만 옮김)
async function placeIn(p,x,z,h){await p.evaluate(([x,z,h])=>{const X=window.xmas;X.rink.goTo();X.doAction('rk:in');X.player.place(x,z,h);X.cam.yaw=h;},[x,z,h]);await sleep(400);}
// 기록에서: 최고 속도, 90% 시각, 손 뗀 시점부터 멈출 때까지 거리
function accelGlide(log,tRelease){
 const press=log.filter(s=>s.t<tRelease),t0=press.find(s=>s.v>0)?.t??press[0].t,top=Math.max(...press.map(s=>s.v));
 const t90=(press.find(s=>s.v>=top*.9)?.t??NaN)-t0;
 const rel=log.find(s=>s.t>=tRelease),stop=log.find(s=>s.t>rel.t&&s.v===0)??log.at(-1);
 return {top:+top.toFixed(2),t90:+t90.toFixed(2),glide:+Math.hypot(stop.x-rel.x,stop.z-rel.z).toFixed(2),glideT:+(stop.t-rel.t).toFixed(2),vAtRelease:+rel.v.toFixed(2)};
}
const W=Math.PI/2,E=-Math.PI/2; // 서쪽(−x)·동쪽(+x)을 보는 heading
const laneZ=RINK.z+3.6,eastX=RINK.x+RINK.w/2-.6;

let A,B;
try{
 A=await open('하나',{width:1920,height:1080});
 B=await open('둘',{width:390,height:844});
 const idA=await A.evaluate(()=>window.xmas.multi.id);
 // ── ① PC 직진 가속 + 손 떼기(남쪽 줄을 서쪽으로)
 await placeIn(A,eastX,laneZ,W);
 let i0=await mark(A),bi0=await mark(B);
 await A.keyboard.down('KeyW');await sleep(3000);const tRel=(await A.evaluate(()=>window.__sk.at(-1).t));await A.keyboard.up('KeyW');await sleep(3000);
 const pc=accelGlide(await logFrom(A,i0),tRel);out.measured.pc=pc;
 check('PC 최고 속도 ≈ 2.39m/s(±10%, 3초 누름)',near(pc.top,2.39),pc);
 check('PC 90%까지 ≈ 1.57초(±10%)',near(pc.t90,1.57),pc);
 check('PC 손 떼면 ≈ 2.22m 미끄러짐(±10%)',near(pc.glide,2.22,.12),pc);
 const bLog=await logFrom(B,bi0),seenB=new Set(bLog.flatMap(s=>s.remotes.filter(r=>r.id===idA).map(r=>r.pose)));
 out.measured.remotePosesRun=[...seenB];
 check('다른 사람(둘) 화면: 하나의 밀기·활주가 움직임만으로 보임',seenB.has('push')&&(seenB.has('glide2')||seenB.has('glide1')),{seen:[...seenB]});
 await A.evaluate(()=>{const x=window.xmas,c=x.cam;c.yaw=-2.2;c.pitch=.32;c.dist=6;});
 // ── 제동: 최고 속도 근처에서 반대(S)
 await placeIn(A,eastX,laneZ,W);
 await A.keyboard.down('KeyW');await sleep(2800);await A.keyboard.up('KeyW');
 i0=await mark(A);bi0=await mark(B);
 await A.keyboard.down('KeyS');await sleep(1200);await A.keyboard.up('KeyS');
 {const L=await logFrom(A,i0),s0=L[0],stopI=L.findIndex(s=>s.v<.31),far=Math.max(...L.slice(0,stopI>0?stopI:L.length).map(s=>Math.hypot(s.x-s0.x,s.z-s0.z)));
  const poses=new Set(L.map(s=>s.pose));out.measured.brake={v0:+s0.v.toFixed(2),dist:+far.toFixed(2),poses:[...poses]};
  check('PC 반대로 누르면 ≈ 0.81m 안에 멈춤(±15%)·멈추기 자세',far<=.81*1.15&&far>=.81*.6&&poses.has('brake'),out.measured.brake);
  const bb=await logFrom(B,bi0),sb=new Set(bb.flatMap(s=>s.remotes.filter(r=>r.id===idA).map(r=>r.pose)));out.measured.remotePosesBrake=[...sb];
  check('다른 사람(둘) 화면: 하나의 멈추기 자세도 보임',sb.has('brake'),{seen:[...sb]});}
 // ── 벽 비비기: 남쪽 벽 바로 앞에서 서쪽+남쪽(W+A, 카메라가 서쪽을 볼 때 A = 남쪽) 3초
 await placeIn(A,eastX,RINK.z+RINK.d/2-.5,W);
 i0=await mark(A);
 await A.evaluate(()=>{window.__lockCam=setInterval(()=>{window.xmas.cam.yaw=Math.PI/2;},16);});
 await A.keyboard.down('KeyW');await A.keyboard.down('KeyA');await sleep(3000);await A.keyboard.up('KeyA');await A.keyboard.up('KeyW');
 await A.evaluate(()=>clearInterval(window.__lockCam));
 {const L=await logFrom(A,i0),last=L.filter(s=>s.t>=L.at(-1).t-1),vAvg=last.reduce((a,s)=>a+s.v,0)/last.length,zMax=Math.max(...L.map(s=>s.z)),dx=L[0].x-L.at(-1).x;
  const wallZ=RINK.z+RINK.d/2-.3;out.measured.wall={vLast1s:+vAvg.toFixed(2),xTravel:+dx.toFixed(2),zMax:+zMax.toFixed(2),wallZ:+wallZ.toFixed(2),poses:[...new Set(L.map(s=>s.pose))]};
  check('벽 비비기: 튕기지 않고 벽 따라 계속 미끄러짐(마지막 1초 평균 1m/s 넘음·울타리 안)',vAvg>1&&dx>3&&zMax<=wallZ+1e-6,out.measured.wall);}
 // ── 문 앞 감속: 섬 동쪽에서 문 쪽(동쪽)으로 계속 밀기
 await placeIn(A,RINK.island.x+RINK.island.r+.6,RINK.z,E);
 i0=await mark(A);await A.keyboard.down('KeyW');await sleep(3500);await A.keyboard.up('KeyW');await sleep(800);
 {const L=await logFrom(A,i0),g=RINK.gate.inside,d=s=>Math.hypot(s.x-g.x,s.z-g.z);
  const before=Math.max(...L.filter(s=>d(s)>1.8).map(s=>s.v)),inZone=L.filter(s=>d(s)<1.2),maxIn=Math.max(...inZone.map(s=>s.v));
  const actions=await A.evaluate(()=>window.xmas.status().actions);
  out.measured.gate={maxBeforeZone:+before.toFixed(2),maxWithin1_2m:+maxIn.toFixed(2),walk:WALK_SPEED,actions};
  check('문 앞 감속: 문 안쪽 1.2m 안 속도 ≤ 걷기 속도 + 0.1, 「나가기」 단추 뜸',inZone.length>0&&maxIn<=WALK_SPEED+.1&&actions.includes('rk:out'),out.measured.gate);}
 await A.evaluate(()=>{const x=window.xmas,c=x.cam;c.yaw=-1.2;c.pitch=.35;c.dist=8;});await sleep(300);await A.screenshot({path:`${dir}/pc-rink.png`});

 // ── ② 휴대폰 조이스틱
 const cdp=await B.ctx.newCDPSession(B),VW=390,VH=844,sx=Math.round(VW*.25),sy=Math.round(VH*.72);
 const tp=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts});
 await placeIn(B,eastX,laneZ,W);
 i0=await mark(B);
 await tp('touchStart',[{x:sx,y:sy,id:1}]);await sleep(80);await tp('touchMove',[{x:sx,y:sy-60,id:1}]);await sleep(3000);
 const tRelB=await B.evaluate(()=>window.__sk.at(-1).t);await tp('touchEnd',[]);await sleep(3000);
 const mob=accelGlide(await logFrom(B,i0),tRelB);out.measured.mobile=mob;
 check('휴대폰 조이스틱 최고 속도 ≈ 2.39m/s(±10%)',near(mob.top,2.39),mob);
 check('휴대폰 손 떼면 ≈ 2.22m 미끄러짐(±12%)',near(mob.glide,2.22,.12),mob);
 // 8방향: 섬 둘레를 돌듯 앞 → 앞왼 → 왼 → … 45°씩 0.5초마다 바꿈. 카메라는 고정(돌기만 잼)
 await placeIn(B,RINK.x+3.5,RINK.z+3.3,W);
 await B.evaluate(()=>{window.__lockCam=setInterval(()=>{window.xmas.cam.yaw=Math.PI/2;},16);});
 i0=await mark(B);
 await tp('touchStart',[{x:sx,y:sy,id:1}]);await sleep(60);
 const dirs=[[0,-60],[-42,-42],[-60,0],[-42,42],[0,60],[42,42],[60,0],[42,-42],[0,-60]];
 for(const [dx,dy] of dirs){await tp('touchMove',[{x:sx+dx,y:sy+dy,id:1}]);await sleep(500);}
 await tp('touchEnd',[]);await sleep(400);await B.evaluate(()=>clearInterval(window.__lockCam));
 {const L=(await logFrom(B,i0)).filter(s=>s.inside);let maxRate=0,maxStep=0;
  // 느릴 때(0.5m/s 아래)는 시안대로 제자리에서 빨리 돎 → 0.5m/s 넘을 때만 커브 빠르기를 잼(시안 최대 300°/s)
  let fast=0,frames=0;
  for(let k=1;k<L.length;k++){const dt=L[k].t-L[k-1].t;if(dt<=.008)continue;frames++;const d=Math.abs(Math.atan2(Math.sin(L[k].h-L[k-1].h),Math.cos(L[k].h-L[k-1].h)))*180/Math.PI;
   maxStep=Math.max(maxStep,d);if(L[k-1].v>=.5){fast++;maxRate=Math.max(maxRate,d/dt);}}
  out.measured.stick8={maxTurnDegPerSecWhenMoving:Math.round(maxRate),maxTurnPerFrameDeg:+maxStep.toFixed(1),framesMoving:fast,frames,poses:[...new Set(L.map(s=>s.pose))]};
  check('휴대폰 8방향: 움직이는 동안 몸은 300°/s 이하로만 돎(커브, ±10%)',fast>30&&maxRate<=330,out.measured.stick8);}
 await B.evaluate(()=>{const x=window.xmas,c=x.cam;c.yaw=-1.6;c.pitch=.3;c.dist=6;});await sleep(300);await B.screenshot({path:`${dir}/mobile-rink.png`});

 // ── ④ 링크 밖 걷기 속도 그대로(스케이트 규칙이 링크 밖에 안 닿음)
 await A.evaluate(()=>{const X=window.xmas;X.rink.act('rk:out');X.player.place(0,14,0);X.cam.yaw=0;});await sleep(400);
 i0=await mark(A);await A.keyboard.down('KeyW');await sleep(1500);await A.keyboard.up('KeyW');
 {const L=(await logFrom(A,i0)),a=L[Math.floor(L.length*.3)],b=L[Math.floor(L.length*.8)],v=Math.hypot(b.x-a.x,b.z-a.z)/(b.t-a.t);
  out.measured.plazaWalk=+v.toFixed(2);check('링크 밖 걷기 속도 = 1.37m/s(±5%), 링크 상태 아님',Math.abs(v-WALK_SPEED)<WALK_SPEED*.05&&L.every(s=>!s.inside),{v:+v.toFixed(2)});}
 check('페이지 오류 0',out.errors.length===0,{errors:out.errors.slice(0,5)});
}catch(e){fail=true;out.errors.push(String(e?.stack??e));console.error(e);}
finally{
 writeFileSync(`${dir}/report.json`,JSON.stringify(out,null,1));
 await browser.close();await vite.close();await srv.close?.();
 console.log(fail?'\n실패 있음':'\n모두 통과',`→ ${dir}/report.json`);process.exit(fail?1:0);
}
