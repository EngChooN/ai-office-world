// 크리스마스 4명 썰매 경주·카메라·눈싸움 직접 겨냥 점검(월드개발, 2026-11-18, 설계 v2 §2·§3·§4 완료 기준).
// 서버(MULTI_PORT 8794)·vite(PORT 5202)를 이 스크립트가 띄우고 끝나면 닫는다. 브라우저: PC 1920×1080 '하나'·'셋', 휴대폰 390×844 '둘'·'넷', 구경꾼 PC '구경'.
//  ① 마을 「썰매 경주」 판에서 「경주 열기」 → 연 사람은 출발대 1번 줄로, 마을 사람(PC·휴대폰) 화면에 참가 카드 → 「참가」(카드·5초 뒤 배지) → 4줄이 차면 바로 3·2·1
//  ② 4대가 같이 달림(점검용 자동 조종이 줄을 지킴): 출발 직선·좁은 길·헤어핀에서 4대 위치 촬영(구경꾼 화면) + 겹침 수(앞뒤 1.3m 안·옆 0.56m 안) 0
//  ③ 4명 결승 → 네 화면 결과 순위가 같음
//  ④ 2명: 출발대에서 열기 → 휴대폰 카드 「참가」 → 연 사람 「지금 출발」 → 3·2·1
//  ⑤ 썰매 카메라: 곧은 길에서 좌우로 꿈틀대며 탈 때 카메라 방향 변화(프레임마다)·길 방향과 차이 — PC·휴대폰 촬영
//  ⑥ 눈싸움(휴대폰): 조이스틱 옆걸음 + ❄️ 끌어 30° 돌려 던짐 → 착탄 = 미리보기 고리 0.3m 안 / 마당 안에서 걷기만 하면 카메라 방향 그대로 / ✕ 위에서 떼면 취소 /
//     톡 = 고리로 바로 / PC 휠 = 거리 ±1m / 단추·✕가 겹치거나 화면 밖으로 안 나감(PC 1920×1080·390×844·844×390)
//   node scripts/verify-christmas-race4.mjs → artifacts/christmas-race4/*.png, report.json(실패가 있으면 종료 코드 1). PART=race,two,cam,fight 로 일부만.
import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {startServer} from '../server/multi-server.mjs';
import * as L from '../src/christmas/layout.js';
import {RACE_BOARD} from '../src/christmas/sled-play.js';
import {TURN_SPANS} from '../src/christmas/sled-course.js';

const dir=process.env.OUT_DIR??'artifacts/christmas-race4',multiPort=Number(process.env.MULTI_PORT??8794),room='눈마을-3';mkdirSync(dir,{recursive:true});
const PARTS=new Set((process.env.PART??'race,two,cam,fight').split(','));
const {createServer}=await import('vite');const port=Number(process.env.PORT??5202);
const vite=await createServer({server:{port,host:'127.0.0.1',strictPort:true,hmr:false,watch:null},logLevel:'warn'});await vite.listen();
const pageUrl=`http://127.0.0.1:${port}`,wsUrl=`ws://127.0.0.1:${multiPort}`;
const srv=startServer({PORT:String(multiPort),HOST:'127.0.0.1',DATA_DIR:`${dir}/data`},{quiet:true});await srv.ready;
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const out={at:new Date().toISOString(),checks:{},errors:[],measure:{}};let fail=false;
const check=(name,ok,detail={})=>{out.checks[name]={ok:!!ok,...detail};if(!ok)fail=true;console.log(ok?'통과':'실패',name,JSON.stringify(detail).slice(0,400));};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const until=async(fn,ms=15000,step=120)=>{const end=Date.now()+ms;while(Date.now()<end){try{if(await fn())return true;}catch{}await sleep(step);}return false;};
async function open(name,vp){
 const mobile=vp.width<900||vp.height<500;
 const ctx=await browser.newContext({viewport:vp,deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});
 await ctx.addInitScript(()=>{localStorage.clear();localStorage.setItem('xmas-world:v1',JSON.stringify({look:{outfit:'santa'},wardrobe:[],tip:true,zones:['fight','sled','snowman','fire']}));});
 const p=await ctx.newPage();p.label=name;p.mobile=mobile;
 p.on('pageerror',e=>out.errors.push(`${name}: ${e.message}`));
 p.on('console',m=>{if(m.type()==='error'&&!/WebSocket connection|favicon|ERR_CONNECTION_REFUSED|Failed to load resource/.test(m.text()))out.errors.push(`${name}: ${m.text()}`);});
 await p.goto(`${pageUrl}/christmas/?capture=1&multi=${encodeURIComponent(room)}&server=${encodeURIComponent(wsUrl)}&name=${encodeURIComponent(name)}`);
 await p.waitForFunction(()=>window.xmas?.multi?.state==='online',null,{timeout:120000});
 return p;
}
const st=p=>p.evaluate(()=>window.xmas.status());
const tp=(p,x,z,h=0)=>p.evaluate(([x,z,h])=>window.xmas.teleport(x,z,h),[x,z,h]);
async function press(p,id){const sel=`.xh-acts [data-act="${id}"]`;await p.waitForSelector(sel,{timeout:6000});if(p.mobile)await p.tap(sel);else await p.click(sel);}
const tapSel=(p,sel)=>p.mobile?p.tap(sel):p.click(sel);
const shot=(p,n)=>p.screenshot({path:`${dir}/${n}.png`});
const sledOf=p=>p.evaluate(()=>{const s=window.xmas.sled,r=s.ride;return {mode:s.mode,lane:s.status().lane,s:r?.s??null,off:r?.off??null,race:s.status().race,result:s.status().result};});

let A,B,C,D,E;
try{
 [A,B,C,D]=await Promise.all([open('하나',{width:1920,height:1080}),open('둘',{width:390,height:844}),open('셋',{width:1920,height:1080}),open('넷',{width:390,height:844})]);
 const all=[A,B,C,D];
 await until(async()=>(await st(A)).multi.people.length>=3,15000);

 // ── ① 마을 판에서 열기 → 카드로 참가 → 4명이면 바로 출발
 if(PARTS.has('race')){
  E=await open('구경',{width:1920,height:1080});
  const plaza=[[2,8],[5,10],[-4,9]];
  await tp(A,RACE_BOARD.x+1,RACE_BOARD.z+1.2,RACE_BOARD.heading);for(const [p,[x,z]] of [[B,plaza[0]],[C,plaza[1]],[D,plaza[2]]])await tp(p,x,z,0);
  await tp(E,-20,10,0);await sleep(1500);
  const a0=(await st(A)).actions;check('① 마을 「썰매 경주」 판 앞 단추: 경주 열기',a0.includes('sled:village'),{a0});
  await shot(A,'pc-village-board');
  await press(A,'sled:village');
  const opened=await until(async()=>{const s=await sledOf(A);return s.mode==='ready'&&s.race?.ph==='wait'&&s.race.n===1;},6000);
  const sa=await st(A);check('① 열면 연 사람은 출발대 줄로 바로(케이블카 없이)·모집 중 1/4',opened&&Math.hypot(sa.player.x-L.SLED_RUN.deck.x,sa.player.z-L.SLED_RUN.deck.z)<5,{sled:sa.sled.race,p:{x:sa.player.x,z:sa.player.z}});
  const cards=await until(async()=>{for(const p of [B,C,D])if(!await p.evaluate(()=>!document.querySelector('.xl-note').hidden))return false;return true;},4000);
  const txt=await B.evaluate(()=>document.querySelector('.xl-note p').textContent);
  check('① 마을 사람(PC·휴대폰) 화면에 참가 카드 「○○님이 썰매 경주를 열었어요 · n/4 · 초」',cards&&/하나님이 썰매 경주를 열었어요 · 1\/4 · \d+초/.test(txt),{txt});
  // 카드는 5초만 보이므로 위치 재기·참가를 먼저 하고, 촬영은 그 사이 한 장씩(촬영이 느리면 카드가 닫힘)
  // 카드 단추가 화면 안·44px 이상·다른 단추와 안 겹침
  for(const p of [B,C]){const g=await p.evaluate(()=>{const r=e=>e.getBoundingClientRect(),n=document.querySelector('.xl-note'),ok=n.querySelector('[data-x="race-join"]'),others=[...document.querySelectorAll('.xh-tr button,.xh-acts button,.xt-run')].filter(e=>e.offsetParent!==null).map(r);
    const R=r(n),O=r(ok),hit=others.filter(q=>!(q.right<=R.left||q.left>=R.right||q.bottom<=R.top||q.top>=R.bottom)),t=document.querySelector('.xh-toast'),T=t&&!t.hidden&&!t.classList.contains('out')?r(t):null;if(T&&!(T.right<=R.left||T.left>=R.right||T.bottom<=R.top||T.top>=R.bottom))hit.push(T);return {R:[R.left,R.top,R.right,R.bottom].map(Math.round),btn:[O.width,O.height].map(Math.round),inView:R.left>=0&&R.right<=innerWidth&&R.top>=0,hit:hit.length};});
   check(`① 참가 카드 화면 안·단추 44px 이상·겹침 없음(${p.label})`,g.inView&&g.btn[1]>=44&&g.hit===0,g);}
  await shot(B,'mobile-race-card');await tapSel(B,'.xl-note [data-x="race-join"]');await shot(C,'pc-race-card');await tapSel(C,'.xl-note [data-x="race-join"]');
  const two=await until(async()=>(await sledOf(A)).race?.n===3,8000);check('① 카드 「참가」 → 출발대 빈 줄로 바로(휴대폰·PC)',two,{race:(await sledOf(A)).race,b:(await sledOf(B)).mode,c:(await sledOf(C)).mode});
  // 넷은 5초 넘게 기다려 배지로 참가
  await sleep(5600);const badge=await D.evaluate(()=>({card:!document.querySelector('.xl-note').hidden,badge:!document.querySelector('.xl-badge').hidden,t:document.querySelector('.xl-badge b').textContent}));
  const bg=await D.evaluate(()=>{const R=document.querySelector('.xl-badge').getBoundingClientRect(),others=[...document.querySelectorAll('.xh-tr button,.xh-top button,.xh-acts button,.xt-run')].filter(e=>e.offsetParent!==null).map(e=>e.getBoundingClientRect());
   return {inView:R.left>=0&&R.top>=0&&R.right<=innerWidth,h:Math.round(R.height),hit:others.filter(q=>!(q.right<=R.left||q.left>=R.right||q.bottom<=R.top||q.top>=R.bottom)).length};});
  check('① 5초 뒤 카드는 닫히고 지도 단추 옆 배지(n/4 · 남은 초)·화면 안·단추와 안 겹침',!badge.card&&badge.badge&&/3\/4 · \d+/.test(badge.t)&&bg.inView&&bg.h>=44&&bg.hit===0,{...badge,...bg});
  await shot(D,'mobile-race-badge');
  await shot(A,'pc-race-wait');
  const chips=await A.evaluate(()=>[...document.querySelectorAll('.xl .xg-bar .xl-chip')].map(e=>e.textContent));check('① 모집 중 위 띠에 참가자 이름 칩(줄 색)',chips.length===3,{chips});
  for(const p of all)await p.evaluate(()=>{window.xmas.sled.autopilot=true;});
  await tapSel(D,'.xl-badge');
  const counting=await until(async()=>{const r=(await sledOf(A)).race;return r&&r.n===4&&(r.ph==='count'||r.ph==='run');},8000);
  check('① 4명이 차면 모집 시간을 기다리지 않고 바로 3·2·1',counting,{race:(await sledOf(A)).race});
  const lanes=await Promise.all(all.map(sledOf));check('① 네 사람 줄 1~4가 모두 다름',new Set(lanes.map(x=>x.lane)).size===4,{lanes:lanes.map(x=>x.lane)});
  await until(async()=>(await sledOf(A)).mode==='ride',6000);
  // ② 4대 위치(겹침) — 구간마다 구경꾼 화면
  const course=await A.evaluate(()=>{const c=window.xmas.sled.course;const tr=c.plan.turns.map((k,i)=>({k,i}));return {seed:c.seed,code:c.code,narrow:c.narrows[0]?.s0??null,hair:tr.filter(t=>t.k==='hairpin').map(t=>t.i),finish:c.finish};});
  const hairS=await A.evaluate(i=>{const c=window.xmas.sled.course;return c.sOfU(i.u0);},TURN_SPANS[course.hair[0]]);
  const spots=[{name:'start',s:6},{name:'narrow',s:course.narrow},{name:'hairpin',s:hairS}].filter(x=>x.s!=null).sort((a,b)=>a.s-b.s);
  let overlap=0,samples=0,maxSpread=0;const pairsAt={},overlapAt=[];
  const viewAt=async(s)=>E.evaluate(s=>{const c=window.xmas.sled.course,q=c.xz(s,0),nx=-Math.sin(q.th),nz=Math.cos(q.th),h=c.profileH(s);
   // 구경꾼: 길 한쪽 가장자리 밖에 서고, 카메라는 반대쪽(길 위 하늘)에서 구경꾼 쪽을 내려다봄 → 길과 4대가 화면 가운데
   const W=c.widthAt(s)/2+.7,x=q.x-nx*W,z=q.z-nz*W;window.xmas.teleport(x,z,Math.atan2(nx,nz));const cam=window.xmas.cam;cam.max=18;cam.dist=15;cam.pitch=1.12;return {x,z,h};},s);
  let next=0;const t0=Date.now();
  while(next<spots.length&&Date.now()-t0<120000){
   const ss=await Promise.all(all.map(sledOf));if(ss.some(x=>x.mode!=='ride')){out.measure.loopExit={why:'mode',modes:ss.map(x=>[x.mode,x.s]),next,t:Date.now()-t0};break;}
   samples++;for(let i=0;i<4;i++)for(let j=i+1;j<4;j++){const a=ss[i],b=ss[j];if(Math.abs(a.s-b.s)<1.3&&Math.abs(a.off-b.off)<.56){overlap++;if(overlapAt.length<12)overlapAt.push([a.lane,b.lane,+a.s.toFixed(1),+a.off.toFixed(2),+b.s.toFixed(1),+b.off.toFixed(2)]);}}
   const lead=Math.max(...ss.map(x=>x.s)),tail=Math.min(...ss.map(x=>x.s));maxSpread=Math.max(maxSpread,lead-tail);
   const sp=spots[next];
   if(lead>=sp.s-14&&!sp.placed){await viewAt(sp.s);sp.placed=true;}
   // 평균이 닿거나, 선두가 6m 지나면 찍음(결승 가까운 좁은 길이면 평균이 닿기 전에 선두가 결승함)
   if(sp.placed&&((ss.reduce((a,x)=>a+x.s,0)/4)>=sp.s-1||lead>=sp.s+6)){await E.evaluate(()=>window.xmas.sled.status());await shot(E,`race4-${sp.name}`);pairsAt[sp.name]=ss.map(x=>({s:+x.s.toFixed(1),off:+x.off.toFixed(2),lane:x.lane}));next++;}
   await sleep(120);}
  out.measure.race4={course,samples,overlap,overlapAt,maxSpread:+maxSpread.toFixed(1),pairsAt};
  check('② 4대가 같이 달리는 동안 겹침 0(앞뒤 1.3m·옆 0.56m 안에 두 썰매 없음)',samples>50&&overlap===0,{samples,overlap,overlapAt});
  check('② 출발 직선·좁은 길·헤어핀에서 4대 촬영',Object.keys(pairsAt).length===spots.length,{pairsAt,spots,exit:out.measure.loopExit??null,t:Date.now()-t0});
  await shot(A,'pc-race4-ride');await shot(B,'mobile-race4-ride');
  // ③ 결승 → 네 화면 순위 같음
  const fin=await until(async()=>{for(const p of all){const s=await sledOf(p);if(!(s.race?.ph==='done'&&s.result))return false;}return true;},150000,400);
  await sleep(800);
  const ranks=await Promise.all(all.map(p=>p.evaluate(()=>[...document.querySelectorAll('.xl .xg-rows li')].map(li=>li.textContent.replace(/\s+/g,' ').trim()))));
  check('③ 4명 결승 → 네 화면 결과 순위가 같음(4줄)',fin&&ranks.every(r=>r.length===4&&JSON.stringify(r.map(x=>x.split(' ').slice(0,2).join(' ')))===JSON.stringify(ranks[0].map(x=>x.split(' ').slice(0,2).join(' ')))),{ranks});
  await shot(A,'pc-race4-result');await shot(B,'mobile-race4-result');
  const re=await A.evaluate(()=>!!document.querySelector('.xl .xg-card [data-pick="rematch"]'));check('③ 연 사람 결과 창에 「같은 사람과 한 번 더」',re);
  for(const p of all){await p.evaluate(()=>{window.xmas.sled.autopilot=false;window.xmas.sled.act('sled:off');});}
  await E.context().close();E=null;await sleep(1500);
 }

 // ── ④ 2명: 출발대에서 열고 휴대폰 카드로 참가 → 「지금 출발」
 if(PARTS.has('two')){
  const d=L.SLED_RUN.deck;await tp(A,d.x-.6,d.z,-Math.PI/2);await tp(B,4,8,0);await sleep(1500);
  await press(A,'sled:board');await sleep(600);
  const alone=(await st(A)).actions;check('④ 출발대에 앉으면 「경주 열기」(다른 사람이 마을에 있어도)',alone.includes('sled:race'),{alone,dbg:await A.evaluate(()=>({race:window.xmas.sled.race&&{ph:window.xmas.sled.race.ph,id:window.xmas.sled.race.id},joined:window.xmas.multi?.joined,state:window.xmas.multi?.state}))});
  // 「출발! 5→4」 숫자가 바뀌는 사이에 누르고 떼도 눌려야 함(단추를 통째로 다시 그리면 눌림이 사라지던 결함)
  {const sel='.xh-acts [data-act="sled:race"]';await A.waitForSelector(sel,{timeout:6000});const b=await A.$eval(sel,e=>{const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};});
   const l0=await A.$eval('.xh-acts [data-act="sled:go"]',e=>e.textContent);await A.mouse.move(b.x,b.y);await A.mouse.down();await sleep(1150);
   const l1=await A.$eval('.xh-acts [data-act="sled:go"]',e=>e.textContent);await A.mouse.up();
   const ok=await until(async()=>(await sledOf(A)).race?.ph==='wait',5000);check('④ 「출발!」 숫자가 바뀌는 동안 누르고 떼도 「경주 열기」가 눌림',ok&&l0!==l1,{l0,l1});}
  await until(async()=>!(await st(A)).actions.includes('sled:race'),2000); // 단추 줄은 다음 프레임에 바뀜
  const noGo=(await st(A)).actions;check('④ 혼자일 때는 「지금 출발」이 없음(2명부터)',!noGo.includes('sled:go'),{noGo,dbg:await A.evaluate(()=>({race:window.xmas.sled.status().race,mode:window.xmas.sled.mode,toast:document.querySelector('.xh-toast')?.textContent}))});
  await B.waitForSelector('.xl-note:not([hidden])',{timeout:5000});await B.tap('.xl-note [data-x="race-join"]');
  const two=await until(async()=>(await st(A)).actions.includes('sled:go'),6000);
  const lab=await A.evaluate(()=>document.querySelector('.xh-acts [data-act="sled:go"]')?.textContent??'');
  check('④ 2명이 되면 연 사람에게 「지금 출발」',two&&/지금 출발/.test(lab),{lab});
  await shot(A,'pc-race2-go');
  await press(A,'sled:go');
  const go=await until(async()=>(await sledOf(A)).mode==='ride'&&(await sledOf(B)).mode==='ride',8000);check('④ 「지금 출발」 → 두 화면 3·2·1 뒤 출발',go);
  for(const p of [A,B])await p.evaluate(()=>window.xmas.sled.act('sled:off'));await sleep(1200);
 }

 // ── ⑤ 썰매 카메라: 곧은 길에서 좌우로 꿈틀(A/D 0.5초마다) → 카메라 방향 변화 측정
 if(PARTS.has('cam')){
  for(const [p,name] of [[A,'pc'],[B,'mobile']]){
   const d=L.SLED_RUN.deck;await tp(p,d.x-.6,d.z+(name==='pc'?0:1),-Math.PI/2);await sleep(900);
   await press(p,'sled:board');await sleep(500);await press(p,'sled:go');
   await until(async()=>(await sledOf(p)).mode==='ride',6000);await sleep(1800);
   // 꿈틀: 0.25초 오른쪽 → 0.5초마다 바꿈, 3초 동안 프레임마다 카메라 yaw·길 방향 기록
   const m=await p.evaluate(async()=>{const s=window.xmas.sled,cam=window.xmas.cam,rows=[];let side=1,last=performance.now(),flip=performance.now()+250;
    const key=k=>dispatchEvent(new KeyboardEvent('keydown',{code:k})),up=k=>dispatchEvent(new KeyboardEvent('keyup',{code:k}));
    const camYaw=()=>{const c=s.camera();return c?.yaw;};
    key('KeyD');const t0=performance.now();
    await new Promise(res=>{const f=()=>{const now=performance.now();if(now>flip){up(side>0?'KeyD':'KeyA');side=-side;key(side>0?'KeyD':'KeyA');flip=now+500;}
      const r=s.ride;if(r){const c=r.course,th=c.at(r.s).th,k=Math.abs(c.at(r.s).k)+Math.abs(c.at(r.s+8).k);rows.push({yaw:cam.yaw,want:camYaw(),path:Math.atan2(-Math.cos(th),-Math.sin(th)),k,psi:r.psi,off:r.off});}
      if(now-t0<3000)requestAnimationFrame(f);else{up('KeyD');up('KeyA');res();}};requestAnimationFrame(f);});
    const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a)),deg=a=>Math.abs(wrap(a))*180/Math.PI;
    const straight=rows.filter(x=>x.k<1e-4);let step=0,diff=0,psi=0;for(let i=1;i<straight.length;i++){step=Math.max(step,deg(straight[i].yaw-straight[i-1].yaw));}
    for(const x of straight){diff=Math.max(diff,deg(x.yaw-x.path));psi=Math.max(psi,deg(x.psi));}
    return {frames:rows.length,straight:straight.length,maxStepDeg:+step.toFixed(4),maxPathDiffDeg:+diff.toFixed(3),maxSledAngleDeg:+psi.toFixed(1)};});
   await shot(p,`${name}-sled-cam`);
   out.measure[`cam-${name}`]=m;
   check(`⑤ 썰매 카메라(${name}): 곧은 길 꿈틀 중 프레임마다 방향 변화 0.05° 이하·길 방향과 0.3° 안(썰매는 좌우로 돌아도)`,m.straight>30&&m.maxStepDeg<=.05&&m.maxPathDiffDeg<=.3&&m.maxSledAngleDeg>5,m);
   await p.evaluate(()=>window.xmas.sled.act('sled:off'));await sleep(600);}
 }

 // ── ⑥ 눈싸움 직접 겨냥(휴대폰 둘·PC 하나)
 if(PARTS.has('fight')){
  const Y=L.SNOWBALL_YARD;
  await tp(A,Y.x-3,Y.z-2,-Math.PI/2);await tp(B,Y.x+1,Y.z+3,Math.PI/2);await sleep(1500);
  // 걷기만 할 때 카메라 방향 그대로(PC: D 옆걸음 1초, 휴대폰: 조이스틱 옆으로)
  const y0=(await st(A)).fight.camYaw;await A.keyboard.down('KeyW');await A.keyboard.down('KeyD');await sleep(1000);await A.keyboard.up('KeyD');await A.keyboard.up('KeyW');await sleep(200);
  const y1=(await st(A)).fight.camYaw;const pa=(await st(A)).player;
  check('⑥ 마당 안에서 걷기만 하면 카메라 방향 그대로(PC 대각선 걷기 1초)',Math.abs(y1-y0)<1e-3,{y0,y1});
  check('⑥ 몸은 조준 방향(카메라 방향)을 봄',Math.abs(Math.atan2(Math.sin(pa.heading-y1),Math.cos(pa.heading-y1)))<.05,{heading:pa.heading,y1});
  // PC 휠 = 거리 ±1m
  const d0=(await st(A)).fight.aimDist;await A.mouse.move(960,540);await A.mouse.wheel(0,-120);await sleep(200);const d1=(await st(A)).fight.aimDist;
  check('⑥ PC 휠 = 가운데 고리 거리 +1m(4~14m)',d1===d0+1,{d0,d1});
  await A.mouse.wheel(0,120);await sleep(200);
  check('⑥ 마당 안 늘 연한 고리(겨눈 자리)',(await st(A)).fight.ring&&(await st(A)).fight.idle,{idle:(await st(A)).fight.idle});
  await shot(A,'pc-fight-ring');
  // 휴대폰: 조이스틱 옆걸음(왼쪽 아래 누르고 오른쪽으로) + ❄️ 끌어 오른쪽 86px(30°) → 떼기 직전 미리보기 고리와 착탄 비교
  const yb0=(await st(B)).fight.camYaw;
  // 실제 두 손가락 터치(CDP): 1번 = 조이스틱, 2번 = ❄️
  const cdp=await B.context().newCDPSession(B);const touch=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map(([x,y,id])=>({x,y,id,radiusX:6,radiusY:6,force:1}))});
  const g=await B.evaluate(()=>{const r=document.querySelector('.xh-acts [data-act="sb:throw"]').getBoundingClientRect();return {bx:r.x+r.width/2,by:r.y+r.height/2,jx:innerWidth*.2,jy:innerHeight*.72};});
  // 미리보기 선이 사람에 닿으면 맞은 자리(sbh), 아니면 길 끝(sb)과 비교(서버는 길을 먼저, 맞음은 지나갈 때)
  await B.evaluate(()=>{window.__sb=null;window.__sbh=null;window.xmas.net.on(m=>{const me=window.xmas.multi.id;if(m.t==='sb'&&m.id===me&&!window.__sb)window.__sb=m;if(m.t==='sbh'&&m.id===me&&!window.__sbh)window.__sbh=m;});});
  await touch('touchStart',[[g.jx,g.jy,1]]);for(let k=1;k<=5;k++){await touch('touchMove',[[g.jx+10*k,g.jy,1]]);await sleep(16);}
  await sleep(500);const yawWalk=(await st(B)).fight.camYaw;const walked=(await st(B)).player;
  await touch('touchStart',[[g.jx+50,g.jy,1],[g.bx,g.by,2]]);
  for(let k=1;k<=10;k++){await touch('touchMove',[[g.jx+50,g.jy,1],[g.bx+8.6*k,g.by,2]]);await sleep(30);}
  await sleep(250);const s2=(await st(B)).fight,s2dbg=s2;
  await touch('touchEnd',[[g.jx+50,g.jy,1]]);await sleep(60);await touch('touchEnd',[]);
  await until(()=>B.evaluate(hit=>hit?!!window.__sbh:!!window.__sb,!!s2.aim?.hit),2500);
  const res={yawWalk,yaw:s2.camYaw,aim:s2.aim,sb:await B.evaluate(hit=>hit?window.__sbh:window.__sb,!!s2.aim?.hit),moved:Math.hypot(walked.x-(L.SNOWBALL_YARD.x+1),walked.z-(L.SNOWBALL_YARD.z+3))};
  const turned=(res.yawWalk-res.yaw)*180/Math.PI;
  const land=res.sb&&res.aim?Math.hypot(res.sb.tx-res.aim.tx,res.sb.tz-res.aim.tz):null;
  out.measure.mobileThrow={turnedDeg:+turned.toFixed(1),landDiff:land!=null?+land.toFixed(3):null,walkYawChange:+((res.yawWalk-yb0)*180/Math.PI).toFixed(3),aim:res.aim,inYard:s2dbg.inYard,ammo:s2dbg.ammo,stun:s2dbg.stun,pack:s2dbg.packing,sb:!!res.sb};
  check('⑥ 휴대폰 조이스틱 옆걸음 중에는 카메라 방향 그대로',res.moved>.5&&Math.abs(res.yawWalk-yb0)<1e-3,{yb0,yawWalk:res.yawWalk,moved:+res.moved.toFixed(2)});
  check('⑥ 휴대폰 옆걸음 + ❄️ 끌어 30° 돌림 → 착탄이 미리보기 고리 0.3m 안',Math.abs(turned-30.1)<1.5&&land!=null&&land<=.3,out.measure.mobileThrow);
  await sleep(1200);
  // ✕ 위에서 떼면 취소(눈덩이 안 씀) + ✕ 화면 안·겹침 없음
  const cancel=await B.evaluate(async()=>{const b=document.querySelector('.xh-acts [data-act="sb:throw"]'),r=b.getBoundingClientRect(),bx=r.x+r.width/2,by=r.y+r.height/2;
   const pe=(t,x,y)=>b.dispatchEvent(new PointerEvent(t,{bubbles:true,pointerId:51,pointerType:'touch',clientX:x,clientY:y}));
   let sent=0;window.xmas.net.on(m=>{if(m.t==='sb'&&m.id===window.xmas.multi.id)sent++;});
   pe('pointerdown',bx,by);for(let k=1;k<=6;k++){pe('pointermove',bx-85*k/6,by-85*k/6);await new Promise(r=>setTimeout(r,40));}
   const x=document.querySelector('.xf-cancel'),xr=x.getBoundingClientRect(),shown=!x.hidden,over=x.classList.contains('over');
   const acts=[...document.querySelectorAll('.xh-acts button,.xh-tr button')].filter(e=>e.offsetParent!==null).map(e=>e.getBoundingClientRect());
   const hit=acts.filter(q=>!(q.right<=xr.left||q.left>=xr.right||q.bottom<=xr.top||q.top>=xr.bottom)).length;
   window.__cx=true;pe('pointerup',bx-85,by-85);await new Promise(r=>setTimeout(r,700));
   return {shown,over,size:Math.round(xr.width),inView:xr.left>=0&&xr.top>=0&&xr.right<=innerWidth&&xr.bottom<=innerHeight,hit,sent};});
  await shot(B,'mobile-fight-cancel-after');
  check('⑥ 끌다가 ✕(56px) 위에서 떼면 취소 — 눈덩이를 보내지 않음, ✕는 화면 안·단추와 안 겹침',cancel.shown&&cancel.over&&cancel.size===56&&cancel.inView&&cancel.hit===0&&cancel.sent===0,cancel);
  // 톡 = 지금 고리로 바로
  await sleep(900);const tap=await B.evaluate(async()=>{const ring=window.xmas.snowfight.status().idle;let sb=null;window.xmas.net.on(m=>{if(m.t==='sb'&&m.id===window.xmas.multi.id&&!sb)sb=m;});
   const b=document.querySelector('.xh-acts [data-act="sb:throw"]'),r=b.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;
   b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:61,pointerType:'touch',clientX:x,clientY:y}));await new Promise(r=>setTimeout(r,80));
   b.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:61,pointerType:'touch',clientX:x+3,clientY:y}));
   const t=performance.now();while(!sb&&performance.now()-t<2500)await new Promise(r=>setTimeout(r,50));return {ring,sb};});
  const tapD=tap.sb&&tap.ring?Math.hypot(tap.sb.tx-tap.ring.tx,tap.sb.tz-tap.ring.tz):null;
  check('⑥ 휴대폰 ❄️ 톡 = 지금 고리 자리로 바로(0.3m 안)',tapD!=null&&tapD<=.3,{tapD,ring:tap.ring});
  // 끌며 조준 중 화면
  await B.evaluate(()=>{const b=document.querySelector('.xh-acts [data-act="sb:throw"]'),r=b.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:71,pointerType:'touch',clientX:x,clientY:y}));b.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerId:71,pointerType:'touch',clientX:x+40,clientY:y-30}));});
  await sleep(500);await shot(B,'mobile-fight-drag');
  await B.evaluate(()=>{const b=document.querySelector('.xh-acts [data-act="sb:throw"]');b.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:71,pointerType:'touch'}));});
  // 화면 크기 3가지에서 눈싸움 단추가 화면 안·서로 안 겹침
  for(const [w,h,name] of [[1920,1080,'pc'],[390,844,'portrait'],[844,390,'landscape']]){
   const p=name==='pc'?A:B;if(name!=='pc')await p.setViewportSize({width:w,height:h});await sleep(700);
   const g=await p.evaluate(()=>{const els=[...document.querySelectorAll('.xh-acts button,.xh-tr button,.xt-run,.xf-ammo')].filter(e=>e.offsetParent!==null&&!e.hidden).map(e=>({c:e.className.split(' ')[0]+(e.dataset.act?':'+e.dataset.act:''),r:e.getBoundingClientRect()}));
    const out=els.filter(e=>e.r.left<0||e.r.top<0||e.r.right>innerWidth+.5||e.r.bottom>innerHeight+.5).map(e=>e.c);const hit=[];
    for(let i=0;i<els.length;i++)for(let j=i+1;j<els.length;j++){const a=els[i].r,b=els[j].r;if(!(a.right<=b.left+.5||a.left>=b.right-.5||a.bottom<=b.top+.5||a.top>=b.bottom-.5))hit.push(els[i].c+'×'+els[j].c);}
    const thr=document.querySelector('.xh-acts [data-act="sb:throw"]')?.getBoundingClientRect();return {n:els.length,out,hit,throwW:thr?Math.round(thr.width):0};});
   await shot(p,`fight-${name}`);
   check(`⑥ 눈싸움 단추 화면 안·겹침 없음(${w}×${h})`,g.out.length===0&&g.hit.length===0&&g.throwW>=44,g);}
  await B.setViewportSize({width:390,height:844});
 }
 check('페이지 오류 0',out.errors.length===0,{errors:out.errors.slice(0,6)});
}catch(e){console.error(e);out.errors.push(String(e?.stack??e));fail=true;}
finally{
 writeFileSync(`${dir}/report.json`,JSON.stringify(out,null,1));
 for(const p of [A,B,C,D,E])await p?.context().close().catch(()=>{});
 await browser.close();await vite.close();await srv.close?.();
 console.log(fail?'실패 있음':'모두 통과',`→ ${dir}/report.json`);process.exit(fail?1:0);
}
