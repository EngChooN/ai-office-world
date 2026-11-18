// 하늘 썰매 점검(월드개발, 2026-11-18): 서버(MULTI_PORT 8797)·vite(PORT 5197)를 이 스크립트가 띄우고 끝나면 닫는다.
// 기본 화면(시안 B) 브라우저 2개: PC '하나' 1920×1080 · 휴대폰 '둘' 390×844(터치).
//  ① 정류장 원 안 「하늘 썰매 타기」 → 좌석에 앉음(act.hs 1) · 정류장 썰매는 2초 숨었다 다시 나타남
//  ② 땅 달리기(W) → 날아오르기 → 땅 위 6m 비행(act.hs 3) · Space로 오름 · 별 흔적이 생김 · 범위(38m·z≥−26)를 넘지 않음
//  ③ 둘 화면에서 하나의 썰매가 같은 자리·높이(위치 메시지 a칸)로 보이고 별 흔적도 생김
//  ④ 내려앉기 → 땅(act.hs 1) · 못 내리는 곳(눈싸움 마당) 위에서는 가까운 땅으로 · 내리기 → 썰매 옆에 섬, 빈 썰매는 정류장으로
//  ⑤ 휴대폰: 단추로 타기 · ▲ 누르는 동안 오름 · 「빨리」 단추 · 가로 화면 겹침 없음
//  ⑥ 다른 놀이와: 회전목마 타는 중이면 못 탐 · 타는 동안 다른 시설 단추 없음 · 지도 이동이면 썰매를 돌려보내고 감 · 서버가 하늘의 사람을 눈덩이 판정에서 뺌
//  ⑦ 페이지 오류 0
//   node scripts/verify-christmas-sky.mjs → artifacts/christmas-sky/*.png, report.json
import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {startServer} from '../server/multi-server.mjs';
import {REINDEER_STATION} from '../src/christmas/festive-layout.js';
import {SNOWBALL_YARD} from '../src/christmas/layout.js';

const dir='artifacts/christmas-sky',multiPort=Number(process.env.MULTI_PORT??8797),room='눈마을-2';mkdirSync(dir,{recursive:true});
const {createServer}=await import('vite');const port=Number(process.env.PORT??5197);
const vite=await createServer({server:{port,host:'127.0.0.1',strictPort:true,hmr:false,watch:null},logLevel:'warn'});await vite.listen();
const pageUrl=`http://127.0.0.1:${port}`,wsUrl=`ws://127.0.0.1:${multiPort}`;
const srv=startServer({PORT:String(multiPort),HOST:'127.0.0.1',DATA_DIR:`${dir}/data`},{quiet:true});await srv.ready;
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const out={at:new Date().toISOString(),checks:{},errors:[]};let fail=false;
const check=(name,ok,detail={})=>{out.checks[name]={ok:!!ok,...detail};if(!ok)fail=true;console.log(ok?'통과':'실패',name,JSON.stringify(detail).slice(0,300));};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const until=async(fn,ms=15000,step=120)=>{const end=Date.now()+ms;while(Date.now()<end){try{if(await fn())return true;}catch{}await sleep(step);}return false;};
async function open(name,vp){
 const mobile=vp.width<900;
 const ctx=await browser.newContext({viewport:vp,deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});
 await ctx.addInitScript(()=>{localStorage.clear();localStorage.setItem('xmas-world:v1',JSON.stringify({look:{outfit:'santa'},wardrobe:[],tip:true,zones:['fight','snowman','sled','fire']}));});
 const p=await ctx.newPage();p.label=name;p.mobile=mobile;
 p.on('pageerror',e=>out.errors.push(`${name}: ${e.message}`));
 p.on('console',m=>{if(m.type()==='error'&&!/WebSocket connection|favicon|ERR_CONNECTION_REFUSED|Failed to load resource/.test(m.text()))out.errors.push(`${name}: ${m.text()}`);});
 await p.goto(`${pageUrl}/christmas/?capture=1&multi=${encodeURIComponent(room)}&server=${encodeURIComponent(wsUrl)}&name=${encodeURIComponent(name)}`);
 await p.waitForFunction(()=>window.xmas?.multi?.state==='online',null,{timeout:120000});
 return p;
}
const st=p=>p.evaluate(()=>window.xmas.status());
const sky=p=>p.evaluate(()=>window.xmas.sky.status());
async function press(p,id){const sel=`.xh-acts [data-act="${id}"]`;await p.waitForSelector(sel,{timeout:6000});if(p.mobile)await p.tap(sel);else await p.click(sel);}
const shot=(p,n)=>p.screenshot({path:`${dir}/${n}.png`});
// 상대(id) 썰매가 이 화면에 그려진 자리·높이
const remoteOf=(p,id)=>p.evaluate(id=>{const x=window.xmas,at=x.sky.skyAt(id),pp=x.multi.people().find(q=>q.id===id);return at?{x:+at.x.toFixed(2),z:+at.z.toFixed(2),y:+at.y.toFixed(2),seated:at.seated,hs:pp?.act?.hs??0,alt:pp?.sample?.alt??null}:{none:1,hs:pp?.act?.hs??0};},id);
async function hold(p,key,ms){await p.keyboard.down(key);await sleep(ms);await p.keyboard.up(key);}

let A,B;
try{
 A=await open('하나',{width:1920,height:1080});
 B=await open('둘',{width:390,height:844});
 const idA=await A.evaluate(()=>window.xmas.multi.id),idB=await B.evaluate(()=>window.xmas.multi.id);
 check('시안 B에 하늘 썰매가 있음',await A.evaluate(()=>window.xmas.sky.enabled&&!!window.xmas.village.festive?.skySleigh));
 // ── ① 타기
 check('정류장 밖에서는 타기 단추 없음',!(await st(A)).actions.includes('hs:board'));
 await A.evaluate(()=>{window.xmas.sky.goTo();window.xmas.cam.yaw=window.xmas.player.heading;});
 check('정류장 원 안 「하늘 썰매 타기」',await until(async()=>(await st(A)).actions.includes('hs:board'),3000));
 await press(A,'hs:board');
 check('타는 0.6초 동안 정류장 썰매가 숨음',(await sky(A)).waiting===false);
 await sleep(900);
 let s=await sky(A);check('좌석에 앉음(act.hs 1)',s.mode==='ground'&&s.seated&&(await st(A)).act.hs===1,s);
 check('땅에서 단추: 날아오르기·내리기·만세',JSON.stringify((await st(A)).actions)===JSON.stringify(['hs:up','hs:off','hs:cheer']),{actions:(await st(A)).actions});
 await sleep(1500);check('2초 뒤 정류장 썰매 다시 나타남',(await sky(A)).waiting===true);
 await shot(A,'pc-1-board');
 // ── ② 정류장에서 바로 날아오르기(앞 13m가 비어 있어야 함)
 const dim=await A.evaluate(()=>!!document.querySelector('.xh-acts [data-act="hs:up"][data-dim]'));
 check('정류장에서 바로 날아오를 수 있음(단추가 흐리지 않음)',!dim,(await sky(A)).takeoff);
 await press(A,'hs:up');
 await until(async()=>(await sky(A)).mode==='takeoff',2000);
 s=await sky(A);check('날아오르기 시작(act.hs 2)',s.mode==='takeoff'&&(await st(A)).act.hs===2,{s,dim});
 await sleep(1300);await shot(A,'pc-2-takeoff');
 check('2.7초 안에 땅 위 6m 비행(act.hs 3)',await until(async()=>{const q=await sky(A);return q.mode==='fly'&&Math.abs(q.alt-6)<.3;},3000),await sky(A));
 // Space로 오름
 const a0=(await sky(A)).alt;await hold(A,'Space',2000);const a1=(await sky(A)).alt;
 check('Space를 누르는 동안 오름(2.5m/s)',a1-a0>3.5&&a1-a0<6,{a0,a1});
 await hold(A,'Space',6000);check('20m보다 높이 못 올라감',(await sky(A)).alt<=20.001,{alt:(await sky(A)).alt});
 await hold(A,'KeyC',2400);
 // 비행 앞으로 + 별
 await A.evaluate(()=>window.xmas.cam.yaw=window.xmas.sky.team.heading);await A.keyboard.down('KeyW');await sleep(1800);
 s=await sky(A);check('하늘을 날 때 별 흔적이 생김',s.stars>5,{stars:s.stars});
 await shot(A,'pc-3-fly');
 await A.keyboard.up('KeyW');
 // ── ③ 둘 화면에서 하나의 썰매
 const okRemote=await until(async()=>{const r=await remoteOf(B,idA);return r.hs===3&&r.y>5;},8000);
 const rB=await remoteOf(B,idA);s=await sky(A);
 check('둘 화면: 하나의 썰매가 하늘에 보임(높이 a칸)',okRemote&&Math.abs(rB.x-s.x)<2.5&&Math.abs(rB.z-s.z)<2.5,{rB,me:{x:s.x,z:s.z,y:s.y,alt:s.alt}});
 check('둘 화면: 받은 높이와 내 높이 차이 1m 안',rB.alt!==null&&Math.abs(rB.alt-s.alt)<1.2,{alt:rB.alt,mine:s.alt});
 const starsB=(await sky(B)).stars;check('둘 화면에도 하나의 별 흔적',starsB>0,{starsB});
 await B.evaluate(id=>{const x=window.xmas,at=x.sky.skyAt(id);if(!at)return;const dx=at.x-x.player.x,dz=at.z-x.player.z;x.cam.yaw=Math.atan2(-dx,-dz);x.cam.pitch=-.08;x.cam.dist=3.2;},idA);
 await sleep(700);await shot(B,'mobile-1-sees-pc-flying');
 // 범위: 바깥쪽으로 계속 날아도 38m 원 안
 await A.evaluate(()=>{const x=window.xmas,t=x.sky.team;x.cam.yaw=Math.atan2(t.x,t.z)+Math.PI;});
 await A.keyboard.down('KeyW');await A.keyboard.down('ShiftLeft');let maxR=0,near=false;
 for(let i=0;i<30;i++){await sleep(200);const q=await sky(A);maxR=Math.max(maxR,Math.hypot(q.x,q.z));near=near||q.near;}
 await A.keyboard.up('KeyW');await A.keyboard.up('ShiftLeft');
 check('범위 끝에서 안쪽으로 휨(38m 원 안 + 썰매 길이)',maxR<38+2.6&&near,{maxR:+maxR.toFixed(2),near});
 check('「광장 끝이에요」 칩 또는 고도 칩이 보임',await A.evaluate(()=>!document.querySelector('.xs-alt').hidden));
 // ── ④ 못 내리는 곳(눈싸움 마당) 위에서 내려앉기 → 가까운 땅
 // 마당 위로 데려감(점검용: 앞 지점을 옮김)
 await A.evaluate(([x,z])=>{const xm=window.xmas;xm.sky.debugMove(x,z);},[SNOWBALL_YARD.x,SNOWBALL_YARD.z]);
 await sleep(400);
 const overYard=await sky(A);
 await press(A,'hs:land');
 const landed=await until(async()=>(await sky(A)).mode==='ground',9000);
 s=await sky(A);
 const inYard=Math.abs(s.x-SNOWBALL_YARD.x)<=SNOWBALL_YARD.w/2&&Math.abs(s.z-SNOWBALL_YARD.z)<=SNOWBALL_YARD.d/2;
 check('눈싸움 마당 위에서 내려앉으면 마당 밖 땅으로',landed&&!inYard&&(await st(A)).act.hs===1,{overYard:{x:overYard.x,z:overYard.z},s});
 await shot(A,'pc-4-landed');
 // 땅 달리기(광장 바닥, 카메라 기준 앞으로)
 await A.evaluate(()=>{const x=window.xmas;x.sky.debugMove(-6,8);x.cam.yaw=x.sky.team.heading;});await sleep(300);
 const g0=await sky(A);await hold(A,'KeyW',1600);await sleep(300);
 const g1=await sky(A);const run=Math.hypot(g1.x-g0.x,g1.z-g0.z);check('땅에서 앞으로 달림(3.6m/s 안팎)',run>3&&run<8&&g1.mode==='ground',{run:+run.toFixed(2)});
 // 뒤로 가는 입력 = 크게 돌아섬(뒤로 미끄러지지 않음)
 const h0=(await sky(A)).heading;await hold(A,'KeyS',1500);const h1=await sky(A);
 check('뒤 입력이면 돌아섬(뒤로 안 감)',Math.abs(Math.atan2(Math.sin(h1.heading-h0),Math.cos(h1.heading-h0)))>1,{h0,h1:h1.heading});
 // 막힌 쪽(트리)을 보고 있으면 날아오르기 단추가 흐림
 await A.evaluate(()=>window.xmas.sky.debugMove(0,9,0));await sleep(300);
 check('앞이 막히면(트리) 날아오르기 단추가 흐림',await until(()=>A.evaluate(()=>!!document.querySelector('.xh-acts [data-act="hs:up"][data-dim]')),2000),(await sky(A)).takeoff);
 check('둘 화면: 하나가 땅에 내려옴',await until(async()=>(await remoteOf(B,idA)).hs===1,4000));
 // 내리기
 await press(A,'hs:off');await sleep(700);s=await sky(A);const P=await st(A);
 check('내리면 썰매 옆에 서고 act.hs 0',s.mode==='none'&&P.act.hs===0&&!P.player.sitting,{s,act:P.act});
 check('빈 썰매는 정류장으로 날아가 사라짐(1.5초)',await until(async()=>(await sky(A)).homing===0,3000));
 check('둘 화면: 하나의 썰매가 사라짐',await until(async()=>(await sky(B)).remotes===0,5000));
 // ── ⑤ 휴대폰
 await B.evaluate(()=>window.xmas.sky.goTo());await sleep(300);
 await press(B,'hs:board');await sleep(900);
 check('휴대폰: 단추로 타기',(await sky(B)).mode==='ground');
 await shot(B,'mobile-2-ground');
 check('휴대폰: 「달리기」 단추가 「빨리」로',await B.evaluate(()=>document.querySelector('.xt-run span')?.textContent==='빨리'));
 await B.evaluate(()=>{const x=window.xmas;x.cam.yaw=x.sky.team.heading;});
 await press(B,'hs:up');
 check('휴대폰: 날아오름',await until(async()=>(await sky(B)).mode==='fly',4000));
 check('휴대폰: ▲▼ 단추 보임',await B.evaluate(()=>!document.querySelector('.xs-pads').hidden));
 const ub=await B.evaluate(()=>{const r=document.querySelector('.xs-up').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};});
 const b0=(await sky(B)).alt;
 await B.evaluate(()=>{const b=document.querySelector('.xs-up');b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:7,pointerType:'touch'}));});
 await sleep(1500);
 await B.evaluate(()=>{const b=document.querySelector('.xs-up');b.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:7,pointerType:'touch'}));});
 const b1=(await sky(B)).alt;check('휴대폰: ▲ 누르는 동안 오름',b1-b0>2.5,{b0,b1,ub});
 // 겹침: ▲▼·행동 단추·빨리 단추 사각형이 서로 겹치지 않음
 const overlap=async p=>p.evaluate(()=>{const els=[...document.querySelectorAll('.xs-pads button,.xh-acts button,.xt-run,.xs-alt,.xh-place,.xh-tree')].filter(e=>e.offsetParent!==null&&getComputedStyle(e).display!=='none');const R=els.map(e=>({c:e.className,r:e.getBoundingClientRect()}));const bad=[];
  for(let i=0;i<R.length;i++)for(let j=i+1;j<R.length;j++){const a=R[i].r,b=R[j].r;if(a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1)bad.push([R[i].c,R[j].c]);}
  const off=R.filter(o=>o.r.top<0||o.r.bottom>innerHeight||o.r.left<0||o.r.right>innerWidth).map(o=>o.c);return {n:R.length,bad,off};});
 let ov=await overlap(B);check('휴대폰 세로: 비행 단추 겹침·화면 밖 없음',!ov.bad.length&&!ov.off.length,ov);
 await shot(B,'mobile-3-fly');
 await B.setViewportSize({width:844,height:390});await sleep(700);
 ov=await overlap(B);check('휴대폰 가로: 비행 단추 겹침·화면 밖 없음',!ov.bad.length&&!ov.off.length,ov);
 await shot(B,'mobile-4-fly-landscape');
 await B.setViewportSize({width:390,height:844});await sleep(400);
 ov=await overlap(A);check('PC: 단추 겹침 없음',!ov.bad.length,ov);
 // ⑥ 다른 놀이와: 타는 동안 다른 시설 단추 없음 + 하늘에서 내리기(Q) = 내려앉고 바로 내림
 await press(B,'hs:off');
 check('휴대폰: 하늘에서 「내리기」 = 내려앉고 내림',await until(async()=>(await sky(B)).mode==='none',9000),await sky(B));
 // 회전목마 타는 중이면 못 탐
 await A.evaluate(()=>{window.xmas.carousel.goTo();});await sleep(300);await A.evaluate(()=>window.xmas.doAction('mg:ride'));await sleep(200);
 await A.evaluate(()=>window.xmas.sky.goTo());
 const deny=await A.evaluate(()=>window.xmas.sky.act('hs:board'));
 check('회전목마 타는 중에는 하늘 썰매를 못 탐',deny===false&&(await sky(A)).mode==='none');
 await A.evaluate(()=>window.xmas.doAction('mg:off'));await sleep(200);
 // 언덕 썰매 출발대 앞 / 케이블카 앞에서 타는 중이면 그 시설 단추가 없음
 await A.evaluate(()=>window.xmas.sky.goTo());await sleep(300);await A.evaluate(()=>window.xmas.doAction('hs:board'));await sleep(900);
 await A.evaluate(()=>{const x=window.xmas;x.sky.debugMove(20.5,-19);});await sleep(400);
 check('타는 동안 케이블카 단추 없음',!(await st(A)).actions.some(a=>a.startsWith('gd:')),{actions:(await st(A)).actions});
 // 지도 이동 = 썰매 돌려보내고 감
 await sleep(1400);
 const went=await A.evaluate(()=>window.xmas.travelTo('tree'));await sleep(800);
 s=await sky(A);const pt=await st(A);
 check('지도 이동이면 썰매를 돌려보내고 그 장소로',went&&s.mode==='none'&&pt.act.hs===0&&Math.hypot(pt.player.x,pt.player.z)<8,{went,s:s.mode,p:pt.player});
 // 지도 핀 「하늘 썰매」 → 정류장 원 안(타기 단추)
 await sleep(1400);await A.evaluate(()=>window.xmas.travelTo('sky'));await sleep(1500);
 check('지도 「하늘 썰매」 핀으로 가면 정류장 원 안',(await sky(A)).station&&(await st(A)).actions.includes('hs:board'));
 // 서버: 하늘의 사람은 눈덩이에 안 맞음 — 단위 시험(tests/christmas-sky.test.mjs)에서 room-play로 확인
 // ⑦ 오류
 check('페이지 오류 0',out.errors.length===0,{errors:out.errors.slice(0,5)});
}catch(e){out.errors.push(String(e?.stack??e));check('실행 오류 없음',false,{e:String(e).slice(0,300)});}
finally{
 writeFileSync(`${dir}/report.json`,JSON.stringify(out,null,1));
 await browser.close();await srv.close?.();await vite.close();
 console.log(fail?'\n실패 있음':'\n모두 통과');process.exit(fail?1:0);
}
