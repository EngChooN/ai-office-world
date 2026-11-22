// 남산 5단계 콘텐츠 점검(월드개발 11-20). vite 개발 서버를 이 스크립트가 띄운다(함께 걷기는 브라우저 창끼리 = 서버 없음).
//  pc    PC 1280×800: 그림 4곳(약수·물확 2·돌탑·자물쇠) 「서 있을 곳」에서 줄·동작, 디딤 띠로 걸어 들어가기, 이정표·정상석·스탬프함 F,
//        쌍안경 이름표(관악산), 자물쇠 걸기·다시 열어도 그대로, 야경 벤치 앉기·차·일어나기, 버스 기다리기→타기→정상에서 내리기·건너뛰기
//  phone 휴대폰 세로 390×844(터치): 6단계 공통 화면·기능 스위치, 큰 도장 누르기로 약수, 자물쇠 카드, 벤치, 쌍안경 ✕ 내리기(44px)
//  land  휴대폰 가로 844×390(터치): 자물쇠 카드·할 일 칩이 화면 안·겹침 없음
//  multi 두 창 같은 방(서버 없음): 자물쇠는 「이 기기에만」(11-22부터 서버 저장 — 서버 두 창 점검은 scripts/namsan/verify-namsan-locks.mjs), 버스 탄 사람이 act p:sit·x:bus로 보임
//   node scripts/verify-namsan-content.mjs → artifacts/namsan-step5/(사진·report.json). 실패가 있으면 종료 코드 1. PART=pc,phone 처럼 일부만.
import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';

const dir=process.env.OUT??'artifacts/namsan-step5';mkdirSync(dir,{recursive:true});
const PART=(process.env.PART??'pc,phone,land,multi').split(',');
const {createServer}=await import('vite');const port=Number(process.env.PORT??5336);
const vite=await createServer({server:{port,host:'127.0.0.1',strictPort:true},logLevel:'warn'});await vite.listen();
const URL0=`http://127.0.0.1:${port}/hiking/namsan/`;
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const out={at:new Date().toISOString(),checks:[],errors:[]};
const check=(name,pass,detail={})=>{out.checks.push({name,pass:!!pass,detail});console.log(pass?'✔':'✘',name,JSON.stringify(detail).slice(0,260));};
const sl=ms=>new Promise(r=>setTimeout(r,ms));
const SKIP=/WebSocket|favicon|net::ERR|Failed to load resource|open-meteo/;
async function open(label,{viewport={width:1280,height:800},touch=false,query='time=13:00&weather=clear',ctx=null,clear=true}={}){
 ctx??=await browser.newContext({viewport,isMobile:touch,hasTouch:touch});
 if(clear)await ctx.addInitScript(()=>{if(!sessionStorage.getItem('__c')){localStorage.clear();sessionStorage.setItem('__c','1');}});
 const p=await ctx.newPage();p.on('pageerror',e=>out.errors.push(`${label}: ${e.message}`));p.on('console',m=>{if(m.type()==='error'&&!SKIP.test(m.text()))out.errors.push(`${label}: ${m.text().slice(0,200)}`);});
 await p.goto(`${URL0}?${query}`);await p.waitForFunction(()=>window.namsan?.started,null,{timeout:180000});await sl(600);return p;}
const ev=(p,f,a)=>p.evaluate(f,a);
const view=p=>ev(p,()=>window.namsan.status().interact.view);
const face=(p,x,z)=>ev(p,([x,z])=>{const s=window.namsan.status();window.namsan.goTo(s.x,s.z,Math.atan2(-(x-s.x),-(z-s.z)));},[x,z]);
const shot=(p,n)=>p.screenshot({path:`${dir}/${n}.png`});
// 칩·단추가 화면 안·44px 이상·서로 안 겹치는지
async function layout(p){return ev(p,()=>{const r=[...document.querySelectorAll('.nb-ctx:not([hidden]),#auto,.nb-chip,.ns-lockcard:not([hidden]) button')].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').map(e=>{const b=e.getBoundingClientRect();return {c:e.id||e.className,l:b.left,t:b.top,r:b.right,b:b.bottom,w:b.width,h:b.height};});
 const W=innerWidth,H=innerHeight,inside=r.every(b=>b.l>=-.5&&b.t>=-.5&&b.r<=W+.5&&b.b<=H+.5),small=r.filter(b=>b.h<43.5).map(b=>b.c||'색 단추');
 let overlap=[];for(let i=0;i<r.length;i++)for(let j=i+1;j<r.length;j++){const a=r[i],b=r[j];if(a.l<b.r-1&&b.l<a.r-1&&a.t<b.b-1&&b.t<a.b-1)overlap.push(`${a.c}×${b.c}`);}
 return {n:r.length,inside,small,overlap};});}

if(PART.includes('pc')){
 const p=await open('pc');const S=await ev(p,()=>window.namsan.spots());
 check('pc: 그림 4종 자리 5곳(약수 1·물확 2·돌탑·자물쇠)·야경 벤치 2·디딤 띠',S.spots.length===5&&S.benches.length===2&&S.pads.length>=1,{spots:S.spots.map(s=>s.id),pads:S.pads.map(p=>p.id)});
 // 디딤 띠로 실제로 걸어 들어가기(물확 1): 띠 시작(길)에서 서 있을 곳 쪽으로 W
 const pad=S.pads.find(x=>x.id==='dip-1'),d1=S.spots.find(s=>s.id==='dip-1');
 if(pad){await ev(p,pad=>window.namsan.goTo(pad.ax,pad.az,Math.atan2(-(pad.bx-pad.ax),-(pad.bz-pad.az))),pad);await sl(300);
  await p.keyboard.down('KeyW');await sl(2600);await p.keyboard.up('KeyW');await sl(400);const s=await ev(p,()=>window.namsan.status());
  check('pc: 길에서 물확 디딤돌까지 걸어 들어감',Math.hypot(s.x-d1.x,s.z-d1.z)<1.2,{d:+Math.hypot(s.x-d1.x,s.z-d1.z).toFixed(2)});}
 const want={'spring-1':'약수 한 모금','dip-1':'손 담그기','dip-2':'손 담그기','cairn-summit':'돌 올리기','locks-summit':'사랑의 자물쇠 걸기'};
 for(const sp of S.spots){await ev(p,sp=>window.namsan.goTo(sp.x,sp.z,sp.face+Math.PI),sp);await sl(700);const v=await view(p);
  check(`pc: ${sp.id} 서 있을 곳에서 「${want[sp.id]}」`,v?.rows?.[0]?.label===want[sp.id],{rows:v?.rows?.map(r=>r.label)});
  {const bigWant={'spring-1':'마시기','dip-1':'담그기','cairn-summit':'올리기','locks-summit':'걸기'}[sp.id];if(bigWant){const bt=await ev(p,()=>document.querySelector('#auto span')?.textContent.trim());check(`pc: ${sp.id} 큰 단추가 「${bigWant}」`,bt===bigWant,{big:bt});}}
  if(['spring-1','dip-1','cairn-summit'].includes(sp.id)){const before=await ev(p,()=>window.namsan.status().interact.progress);await p.keyboard.press('KeyF');await sl(900);await shot(p,`pc-act-${sp.id}`);await sl(3000);
   const after=await ev(p,()=>window.namsan.status().interact);const k={'spring-1':'drinks','dip-1':'dips','cairn-summit':'stones'}[sp.id];
   check(`pc: ${sp.id} 동작이 끝나고 기록`,after.progress[k]===before[k]+1,{[k]:after.progress[k]});}}
 // 이정표 4 · 정상석 · 스탬프함 4
 for(const it of S.items.filter(i=>i.kind==='sign')){await ev(p,it=>{const s=window.namsan.status();},it);
  const sv=it.n===4?1030:it.n===1?14:it.n===2?400:800;await ev(p,s=>window.namsan.jump(s),sv);await face(p,it.x,it.z);await sl(500);
  let v=await view(p);if(v?.rows?.[0]?.label!=='이정표 읽기'){const ok=await ev(p,it=>{for(const [dx,dz] of [[1.5,0],[-1.5,0],[0,1.5],[0,-1.5],[1,1],[-1,-1],[2.2,0],[-2.2,0]])if(window.namsan.goTo(it.x+dx,it.z+dz))return true;return false;},it);await face(p,it.x,it.z);await sl(500);v=await view(p);}
  check(`pc: 이정표 ${it.n} 「이정표 읽기」`,v?.rows?.[0]?.label==='이정표 읽기',{rows:v?.rows?.map(r=>r.label)});
  if(it.n===4){await p.keyboard.press('KeyF');await sl(500);const b=await ev(p,()=>({open:!document.querySelector('.ix-board').hidden,title:document.querySelector('.ix-board h2')?.textContent,pages:document.querySelectorAll('.ix-dots i').length}));
   check('pc: 이정표 4 F → 안내판 2쪽',b.open&&b.pages===2,b);await shot(p,'pc-sign4-board');await p.keyboard.press('KeyF');await sl(300);
   check('pc: F로 안내판 닫힘',await ev(p,()=>document.querySelector('.ix-board').hidden));}}
 const stone=S.items.find(i=>i.kind==='summit-stone');await ev(p,()=>window.namsan.jump(1060));
 await ev(p,it=>{for(const [dx,dz] of [[1.6,0],[-1.6,0],[0,1.6],[0,-1.6],[1.2,1.2],[-1.2,-1.2]])if(window.namsan.goTo(it.x+dx,it.z+dz))return true;return false;},stone);await face(p,stone.x,stone.z);await sl(600);
 let v=await view(p);check('pc: 정상석 「정상석 확인 · 정상 인증」',v?.rows?.[0]?.label==='정상석 확인 · 정상 인증',{rows:v?.rows?.map(r=>r.label)});
 await p.keyboard.press('KeyF');await sl(500);const cert=await ev(p,()=>({c:window.namsan.status().interact.progress.certifiedAt,stamps:window.namsan.status().stamps,title:document.querySelector('.ix-board h2')?.textContent}));
 const tt=await ev(p,()=>({ix:document.querySelector('.ix-toast')?.textContent??'',shown:document.querySelector('.ix-toast')?.hidden===false,n:document.querySelectorAll('.ix-toast:not([hidden]),.ns-toast:not([hidden])').length}));check('pc: 정상석 알림 하나에 정상 인증·스탬프',/정상 인증/.test(tt.ix)&&/스탬프/.test(tt.ix)&&tt.shown&&tt.n===1,tt);
 check('pc: 정상석 F → 정상 인증·정상 스탬프·안내판',!!cert.c&&cert.stamps.includes(4)&&/265m/.test(cert.title??''),cert);await shot(p,'pc-summit-stone');await p.keyboard.press('Escape');await sl(300);
 // 쌍안경: 정상에서 관악산 쪽
 await ev(p,()=>window.namsan.jump(1060));const lk=S.spots.find(s=>s.id==='locks-summit');await ev(p,lk=>window.namsan.goTo(lk.x,lk.z,0),lk);
 const gw=await ev(p,()=>{const s=window.namsan.status();return s;});
 await p.keyboard.press('KeyB');await sl(1200);
 // 관악산 방위로 몸 돌리기: 40°씩 돌다가 방위 띠에 관악산이 보이면 그 차이만큼 맞춘다
 for(let i=0;i<12;i++){const t=await ev(p,()=>window.namsan.interact().bino?.tape?.find(t=>t.short==='관악산')??null);
  if(t){await ev(p,d=>{const s=window.namsan.status(),b=window.namsan.interact().bino.bearing+d;window.namsan.goTo(s.x,s.z,-b*Math.PI/180);},t.delta);await sl(500);if(Math.abs(t.delta)<1)break;continue;}
  await ev(p,()=>{const s=window.namsan.status(),b=window.namsan.interact().bino.bearing+40;window.namsan.goTo(s.x,s.z,-b*Math.PI/180);});await sl(400);}
 const bino=await ev(p,()=>window.namsan.status().interact.bino);check('pc: 쌍안경 정상에서 관악산 이름표',bino?.labels?.includes('관악산'),bino);await shot(p,'pc-bino-gwanak');
 await p.keyboard.press('Escape');await sl(400);check('pc: Esc로 쌍안경 내림',await ev(p,()=>window.namsan.status().gadget==='none'));
 // 자물쇠: 걸기 → 다시 열기
 await ev(p,lk=>window.namsan.goTo(lk.x,lk.z,lk.face+Math.PI),lk);await sl(600);await p.keyboard.press('KeyF');await sl(500);
 await sl(900);const av=await ev(p,()=>({v:window.namsan.lockAimView(),cam:window.namsan.cam()}));check('pc: 자물쇠 카드 동안 카메라가 걸 자리 보이는 곳(aimView)',av.v&&Math.hypot(av.cam[0]-av.v.p[0],av.cam[1]-av.v.p[1],av.cam[2]-av.v.p[2])<.3,av);
 await p.click('.ns-lock-colors button[data-c="4"]');await p.click('.ns-lock-shape button[data-h="1"]');await shot(p,'pc-lock-card');await p.click('[data-lk="hang"]');await sl(700);await shot(p,'pc-lock-hang');await sl(1600);
 const L1=await ev(p,()=>window.namsan.locks());check('pc: 자물쇠 걸림·저장(파랑 하트, 혼자 걷기 = 이 기기에만, 가짜 자물쇠 없음)',L1.local.length===1&&L1.local[0].c===4&&L1.local[0].h===1&&L1.count.filled===1&&L1.conn==='solo',L1);
 await p.reload();await p.waitForFunction(()=>window.namsan?.started,null,{timeout:180000});const L2=await ev(p,()=>window.namsan.locks());
 check('pc: 다시 들어와도 내 자물쇠 그대로',L2.local.length===1&&L2.count.filled===1,{local:L2.local,count:L2.count});
 // 야경 벤치(밤)
 await p.goto(`${URL0}?time=20:30&weather=clear`);await p.waitForFunction(()=>window.namsan?.started,null,{timeout:180000});await sl(500);
 const b0=S.benches[0];await ev(p,b=>window.namsan.goTo(b.x+Math.sin(b.yaw)*.8,b.z+Math.cos(b.yaw)*.8,b.yaw),b0);await sl(700);v=await view(p);
 check('pc: 벤치 앞 「벤치에 앉기」',v?.rows?.[0]?.label==='벤치에 앉기',{rows:v?.rows?.map(r=>r.label)});
 await p.keyboard.press('KeyF');await sl(1400);let seat=await ev(p,()=>window.namsan.seat());check('pc: 벤치에 앉음(좌판 높이)',seat?.pose==='sit'&&seat.sitLinear>.99,seat);await shot(p,'pc-bench-night');
 await p.keyboard.press('KeyT');await sl(800);seat=await ev(p,()=>window.namsan.seat());check('pc: 차 마시기',seat?.pose==='tea',seat);await sl(3000);
 seat=await ev(p,()=>window.namsan.seat());check('pc: 차 다 마시면 다시 앉음',seat?.pose==='sit',seat);
 await p.keyboard.down('KeyS');await sl(300);await p.keyboard.up('KeyS');seat=await ev(p,()=>window.namsan.seat());check('pc: 걸으면 일어남',seat===null);
 await ev(p,()=>{if(window.namsan.status().summitOpen)document.getElementById('summit')?.close();});await sl(300);
 // 버스: 백범광장 → 정상
 const stops=await ev(p,()=>window.namsan.interact().cands.filter(c=>c.action==='bus').map(c=>({x:c.x,z:c.z,stop:c.site.stop})));
 await ev(p,()=>window.namsan.jump(2));const w=(await ev(p,()=>window.namsan.bus())).next.start.wait;await ev(p,w=>{window.namsan.busClockOffset=(window.namsan.busClockOffset??0)+w-4;},w);
 await ev(p,s=>window.namsan.goTo(s.x,s.z,0),stops[0]);await sl(600);v=await view(p);check('pc: 정류장 「순환버스 타기」·다음 버스 시간',v?.rows?.[0]?.label==='순환버스 타기'&&/다음 버스 0:0\d/.test(v.rows[0].sub),{row:v?.rows?.[0]});
 await p.keyboard.press('KeyF');await sl(500);v=await view(p);check('pc: 기다리는 동안 「기다리지 않고 바로 가기」',v?.rows?.[0]?.label==='기다리지 않고 바로 가기',{row:v?.rows?.[0]});
 await sl(13500);let bus=await ev(p,()=>window.namsan.bus());check('pc: 버스가 서면 탐(정상행)',bus.ride?.to==='summit',bus.ride);
 await sl(14000);await shot(p,'pc-bus-ride');const s0=await ev(p,()=>window.namsan.status());check('pc: 타고 가며 내 자리가 버스와 같이 움직임',Math.hypot(s0.x-stops[0].x,s0.z-stops[0].z)>15,{d:+Math.hypot(s0.x-stops[0].x,s0.z-stops[0].z).toFixed(1)});
 bus=await ev(p,()=>window.namsan.bus());await ev(p,u=>{window.namsan.busClockOffset+=u-2;},bus.ride.until);await sl(4500);
 const s1=await ev(p,()=>({st:window.namsan.status(),bus:window.namsan.bus()}));check('pc: 정상 정류장에서 내림',!s1.bus.ride&&Math.hypot(s1.st.x-stops[1].x,s1.st.z-stops[1].z)<1,{x:s1.st.x,z:s1.st.z});await shot(p,'pc-bus-summit');
 // 정상 → 백범광장: 정류장에서 타기(서 있는 버스가 있으면 바로 탐, 없으면 기다리다 「바로 가기」) → 건너뛰기(R)
 await face(p,stops[1].x,stops[1].z);await sl(400);await p.keyboard.press('KeyF');await sl(500);
 const r2=await ev(p,()=>window.namsan.bus());if(!r2.ride){await p.keyboard.press('KeyF');}else{await shot(p,'pc-bus-down-ride');await p.keyboard.press('KeyR');}await sl(600);
 const s2=await ev(p,()=>window.namsan.status());check('pc: 정상에서 버스 → 건너뛰기/바로 가기로 백범광장',Math.hypot(s2.x-stops[0].x,s2.z-stops[0].z)<1,{rode:!!r2.ride,x:s2.x,z:s2.z});
 await p.context().close();
}

if(PART.includes('phone')){
 const p=await open('phone',{viewport:{width:390,height:844},touch:true});const S=await ev(p,()=>window.namsan.spots());
 // 6단계: 관악산과 같은 화면 조각·수첩 HUD, 기능 스위치로 남산에 없는 자리는 숨김
 const ui=await ev(p,()=>{const vis=sel=>{const e=document.querySelector(sel);return !!e&&!!e.getClientRects().length&&getComputedStyle(e).display!=='none';};const v=document.querySelector('#view').getBoundingClientRect();
  return {mountain:document.documentElement.dataset.mountain,title:document.title,pill:document.querySelector('.hk-pill-t')?.textContent,view:vis('#view')&&!!document.querySelector('.hk-topl #view'),viewH:v.height,auto:vis('#auto'),menu:vis('.uf-menu-btn'),
   phone:vis('#phone'),sit:vis('#sit'),stamina:vis('.nb-stam'),stretchOff:document.querySelector('#stretch')?.hasAttribute('data-feature-off'),seal:document.querySelector('[data-mt=sealName]')?.textContent};});
 check('phone: 공통 화면(진행 알약 「정상 …」(세로는 짧은 글, 11-21)·시점 칩·도장·☰)',ui.mountain==='namsan'&&/^정상 \d/.test(ui.pill??'')&&ui.view&&ui.auto&&ui.menu,ui);
 check('phone: 휴대폰 카메라 보임(11-21 추가), 기능 스위치로 숨김(땅에 앉기·스테미너·스트레칭), 정상 도장 글 = 남산',ui.phone&&!ui.sit&&!ui.stamina&&ui.stretchOff&&ui.seal==='남산',ui);
 const sp=S.spots.find(s=>s.id==='spring-1');await ev(p,sp=>window.namsan.goTo(sp.x,sp.z,sp.face+Math.PI),sp);await sl(800);
 let L=await layout(p);check('phone: 할 일 칩·단추 화면 안·44px·안 겹침',L.inside&&!L.small.length&&!L.overlap.length,L);await shot(p,'phone-spring-chip');
 await p.tap('#auto');await sl(4000);check('phone: 큰 단추 누르기로 약수',(await ev(p,()=>window.namsan.status().interact.progress.drinks))===1);
 const lk=S.spots.find(s=>s.id==='locks-summit');await ev(p,lk=>window.namsan.goTo(lk.x,lk.z,lk.face+Math.PI),lk);await sl(700);await p.tap('#auto');await sl(500);
 L=await layout(p);check('phone: 자물쇠 카드 단추 화면 안·44px·안 겹침',L.inside&&!L.small.length&&!L.overlap.length,L);await shot(p,'phone-lock-card');
 await p.tap('.ns-lock-colors button[data-c="1"]');await p.tap('[data-lk="hang"]');await sl(700);check('phone: 자물쇠 걸기',(await ev(p,()=>window.namsan.locks().local.length))===1);
 const b0=S.benches[1];await ev(p,b=>window.namsan.goTo(b.x+Math.sin(b.yaw)*.8,b.z+Math.cos(b.yaw)*.8,b.yaw),b0);await sl(700);await p.tap('#auto');await sl(1300);
 check('phone: 벤치 앉기',(await ev(p,()=>window.namsan.seat()?.pose))==='sit');
 L=await layout(p);check('phone: 앉은 동안 칩(차·일어나기) 화면 안·안 겹침',L.inside&&!L.overlap.length,L);await shot(p,'phone-bench');
 
 await ev(p,()=>window.dispatchEvent(new CustomEvent('hiking:command',{detail:{id:'sit'}})));await sl(300);
 const keys=await ev(p,()=>[...document.querySelectorAll('.nb-ctx kbd,#auto kbd,.ix-toast,.hk-topl kbd')].filter(e=>e.getClientRects().length&&getComputedStyle(e).display!=='none').map(e=>e.tagName==='KBD'?'kbd':/\([A-Z]\)/.test(e.textContent)?e.textContent:null).filter(Boolean));check('phone: 키보드 글자 안 보임(카드·알림)',!keys.length,{keys});
 await p.tap('#binoculars');await sl(1200);const close=await ev(p,()=>{const b=document.querySelector('#gadget-ui .chip-close');const r=b?.getBoundingClientRect();return r?{w:r.width,h:r.height,in:r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,text:b.textContent}:null;});
 check('phone: 쌍안경 「✕ 내리기」 44px·화면 안',close&&close.h>=44&&close.in,close);await shot(p,'phone-bino');
 await p.tap('#gadget-ui .chip-close');await sl(400);check('phone: ✕ 내리기로 내림',(await ev(p,()=>window.namsan.status().gadget))==='none');
 await p.context().close();
}

if(PART.includes('land')){
 const p=await open('land',{viewport:{width:844,height:390},touch:true});const S=await ev(p,()=>window.namsan.spots());
 const lk=S.spots.find(s=>s.id==='locks-summit');await ev(p,lk=>window.namsan.goTo(lk.x,lk.z,lk.face+Math.PI),lk);await sl(700);
 let L=await layout(p);check('land: 자물쇠 칩 화면 안·안 겹침',L.inside&&!L.overlap.length,L);await p.tap('#auto');await sl(500);
 L=await layout(p);check('land: 자물쇠 카드 화면 안·안 겹침',L.inside&&!L.overlap.length,L);await shot(p,'land-lock-card');
 const sp=S.spots.find(s=>s.id==='cairn-summit');await ev(p,()=>document.querySelector('[data-lk="close"]')?.click());await ev(p,sp=>window.namsan.goTo(sp.x,sp.z,sp.face+Math.PI),sp);await sl(700);
 L=await layout(p);check('land: 돌탑 칩 화면 안·안 겹침',L.inside&&!L.overlap.length,L);await shot(p,'land-cairn');
 await p.context().close();
}

if(PART.includes('multi')){
 const ctx=await browser.newContext({viewport:{width:1100,height:700}});
 const A=await open('multiA',{ctx,query:'multi=남산-1&server=off&name=가&time=13:00',clear:false}),B=await open('multiB',{ctx,query:'multi=남산-1&server=off&name=나&time=13:00',clear:false});
 const S=await ev(A,()=>window.namsan.spots()),lk=S.spots.find(s=>s.id==='locks-summit');
 await ev(A,lk=>window.namsan.goTo(lk.x+.6,lk.z,lk.face+Math.PI),lk);await ev(B,lk=>window.namsan.goTo(lk.x-.6,lk.z,lk.face+Math.PI),lk);await sl(4000);
 const before=await ev(B,()=>window.namsan.locks().count.filled);
 await ev(A,()=>window.namsan.lockCard({c:2,h:1,hang:true}));await sl(2000);const bl=await ev(B,()=>window.namsan.locks());
 check('multi: 서버 없는 창끼리 방에서는 A 자물쇠가 「이 기기에만」 — B 화면에 안 걸림(11-22 서버 저장으로 바뀜, 서버 두 창은 namsan/verify-namsan-locks.mjs)',bl.count.filled===before&&bl.conn==='offline'&&(await ev(A,()=>window.namsan.locks().local.length))===1,{before,after:bl.count.filled,conn:bl.conn});await shot(B,'multi-lock-B');
 const stops=await ev(A,()=>window.namsan.interact().cands.filter(c=>c.action==='bus').map(c=>({x:c.x,z:c.z})));
 const w=(await ev(A,()=>window.namsan.bus())).next.start.wait;for(const q of [A,B])await ev(q,w=>{window.namsan.busClockOffset=w-2;},w);
 await ev(A,s=>window.namsan.goTo(s.x,s.z,0),stops[0]);await ev(B,s=>window.namsan.goTo(s.x+2,s.z+3,0),stops[0]);await sl(700);await A.keyboard.press('KeyF');await sl(14000);
 const ra=await ev(B,()=>window.namsan.multi()?.roster?.[0]?.act);check('multi: 버스 탄 A가 B에게 앉음·버스로 보임',ra?.p==='sit'&&ra?.x==='bus',ra);
 await ctx.close();
}

out.errors=[...new Set(out.errors)];check('콘솔·페이지 오류 0건',out.errors.length===0,{errors:out.errors.slice(0,5)});
writeFileSync(`${dir}/report.json`,JSON.stringify(out,null,1));
const fail=out.checks.filter(c=>!c.pass);console.log(`\n${out.checks.length-fail.length}/${out.checks.length} 통과`);
await browser.close();await vite.close();process.exit(fail.length?1:0);
