// 남산 구현·연결 점검(월드개발 11-19). vite 개발 서버와 함께 걷기 서버를 이 스크립트가 직접 띄운다(공개 서버에는 붙지 않음).
//  A 산 고르기(휴대폰 세로): 남산 카드 글·그림 → 「오르기」 → /hiking/namsan/ 으로 넘어가 출발
//  B PC 1920×1080: 출발·자동 걷기·키보드 걷기·큰 계단·쉼터·정상 도착(완등 카드·스탬프 4)·도심 다 받은 뒤 성능
//  C 휴대폰 세로 390×844·가로 844×390(터치): 조이스틱 끌기로 걷기·큰 단추 자동 걷기·정상 도착·성능·메모리
//  E 공통 입장 흐름: 허브에서 고른 서버 → 산 고르기 → 남산이면 입장 창 없이 남산 방(관악산 지난 선택은 그대로)
//  D 함께 걷기 두 사람: 공용 입장 창에 「남산 1서버」 → 고르면 남산 방(hiking:남산), 서로 보임·채팅 왕복, 관악산 방 사람과 섞이지 않음
//   node scripts/verify-namsan-game.mjs  → artifacts/namsan-game/(사진·report.json). 실패가 있으면 종료 코드 1.
//   PART=pick,pc,phone,multi 로 일부만. PAGE_URL=http://127.0.0.1:5173 이면 떠 있는 개발 서버를 씀.
import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {startServer} from '../server/multi-server.mjs';

const dir='artifacts/namsan-game';mkdirSync(dir,{recursive:true});
const PART=(process.env.PART??'pick,pc,phone,entry,multi').split(',');
let vite=null,pageUrl=process.env.PAGE_URL;
if(!pageUrl){const {createServer}=await import('vite');const port=Number(process.env.PORT??5293);vite=await createServer({server:{port,host:'127.0.0.1',strictPort:true},logLevel:'warn'});await vite.listen();pageUrl=`http://127.0.0.1:${port}`;}
const multiPort=Number(process.env.MULTI_PORT??8841),wsUrl=`ws://127.0.0.1:${multiPort}`;
let srv=null;
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const out={at:new Date().toISOString(),pageUrl,checks:[],metrics:{},errors:[]};
const check=(name,pass,detail={})=>{out.checks.push({name,pass:!!pass,detail});console.log(pass?'✔':'✘',name,JSON.stringify(detail).slice(0,300));};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const SKIP_ERR=/WebSocket connection|favicon|net::ERR|Failed to load resource|open-meteo/;
async function open({viewport={width:1920,height:1080},touch=false,label,url}){
 const ctx=await browser.newContext({viewport,deviceScaleFactor:1,isMobile:touch,hasTouch:touch});
 await ctx.addInitScript(()=>{if(!sessionStorage.getItem('__ns_init')){localStorage.clear();sessionStorage.setItem('__ns_init','1');}localStorage.setItem('gwanak-sound-enabled','false');window.__ev=[];for(const t of ['hiking:chat'])addEventListener(t,e=>window.__ev.push({type:t,...e.detail}));});
 const p=await ctx.newPage();p.label=label;
 p.on('pageerror',e=>out.errors.push(`${label}: ${e.message}`));
 p.on('console',m=>{if(m.type()==='error'&&!SKIP_ERR.test(m.text()))out.errors.push(`${label}: ${m.text().slice(0,300)}`);});
 if(url)await p.goto(url);
 return p;
}
const started=p=>p.waitForFunction(()=>window.namsan?.started,null,{timeout:180000});
const status=p=>p.evaluate(()=>window.namsan.status());
const shot=(p,name)=>p.screenshot({path:`${dir}/${name}.png`});
const Q='time=13:00&weather=clear';
async function autoUntil(p,pred,ms){const t0=Date.now();await p.evaluate(()=>window.namsan.setAuto(true));while(Date.now()-t0<ms){const s=await status(p);if(pred(s))return s;await sleep(500);}return status(p);}
async function perf(p,label){
 await p.waitForFunction(()=>window.namsan.cityDone,null,{timeout:180000}).catch(()=>{});
 await sleep(4500);const s=await status(p);
 const mem=await p.evaluate(async()=>{try{const m=await performance.measureUserAgentSpecificMemory?.();return m?Math.round(m.bytes/1048576):null;}catch{return null;}});
 out.metrics[label]={...s.metrics,jsHeapMB:s.memory?.usedMB??null,uaMemoryMB:mem};return out.metrics[label];
}

// ── A 산 고르기 → 남산 ──
if(PART.includes('pick')){
 const p=await open({viewport:{width:390,height:844},touch:true,label:'pick',url:`${pageUrl}/hiking/?pick=on&dev=off&${Q}`}); // 개발 버전 끄기 = 사용자와 같은 카드 글·잠김
 await p.waitForSelector('#mountain-pick [data-mountain="namsan"]',{timeout:60000});
 const card=await p.$eval('#mountain-pick [data-mountain="namsan"]',el=>({text:el.innerText.replace(/\s+/g,' '),tower:!!el.querySelector('svg.pk-art'),go:!!el.querySelector('[data-pk-go="namsan"]'),overflow:el.scrollWidth>el.clientWidth+1}));
 for(const t of ['남산','265 m','백범광장 → 남산 정상','1.1 km','30분','4곳','쉬움','남산 정상에서 도장을 받아요','밤 전망 추천'])check(`카드 글: ${t}`,card.text.includes(t),{});
 check('카드 가로 넘침 없음',!card.overflow);
 const gw=await p.$eval('#mountain-pick [data-mountain="gwanak"]',el=>el.innerText.replace(/\s+/g,' '));
 check('관악산 카드 문구 그대로(연주대)',gw.includes('연주대에서 도장을 받아요')&&gw.includes('632 m'),{gw:gw.slice(0,120)});
 check('「다음 산 준비 중」 칸 없어짐',!(await p.$('.pk-soon')));
 await p.$eval('#mountain-pick [data-mountain="namsan"]',el=>el.scrollIntoView({block:'center'}));await sleep(400);await shot(p,'A-pick-phone-namsan-card');
 // 산 고르기 카드는 날씨·시각을 받으면 다시 그려진다 — 그 순간 누르면 클릭이 빠질 수 있어 세 번까지 다시 누른다(관악산 카드도 같음)
 for(let i=0;i<3;i++){await p.click('[data-pk-free="namsan"]');if(await p.waitForFunction(()=>!document.querySelector('.pk-toast')?.hidden,null,{timeout:2000}).then(()=>true,()=>false))break;}
 const lock=await p.$eval('.pk-toast',el=>el.hidden?'':el.textContent).catch(e=>'ERR '+e.message);
 const panel=await p.$eval('.pk-free',el=>el.hidden?'':el.innerText).catch(()=>'');
 check('남산 자유 설정 잠김 알림 = 남산 정상 문구',lock.includes('남산 정상에서 완등 도장을 받으면 열려요')&&!panel,{lock});
 await p.click('[data-pk-go="namsan"]');
 await p.waitForURL(/\/hiking\/namsan\//,{timeout:30000});await started(p);
 const s=await status(p);check('「오르기」 → 남산 페이지에서 출발',s.started&&s.s<10,{url:p.url(),s:s.s});
 await p.context().close();
 // 넓은 화면 산 고르기(두 카드)
 const p2=await open({viewport:{width:1440,height:900},label:'pick-pc',url:`${pageUrl}/hiking/?pick=on&time=20:00&weather=clear`});
 await p2.waitForSelector('#mountain-pick [data-mountain="namsan"]');await sleep(600);await shot(p2,'A-pick-pc-night');
 await p2.click('[data-pk-free="namsan"]');await sleep(400);const panel2=await p2.$eval('.pk-free',el=>el.hidden?'':el.innerText).catch(()=>'');
 check('남산 자유 설정(열림): 출발 지점 칸 없이 날씨·시간·계절 + 이대로 오르기',panel2.includes('날씨')&&panel2.includes('이대로 오르기')&&!panel2.includes('출발 지점'),{panel:panel2.replace(/\s+/g,' ').slice(0,160)});
 await shot(p2,'A-pick-pc-namsan-free');await p2.context().close();
}

// ── B PC ──
if(PART.includes('pc')){
 const p=await open({label:'pc',url:`${pageUrl}/hiking/namsan/?${Q}`});
 await started(p);await sleep(1500);
 let s0=await status(p);await shot(p,'B-pc-start');
 await p.keyboard.down('KeyW');await sleep(2500);await p.keyboard.up('KeyW');
 let s1=await status(p);check('PC 키보드 W로 걷기',Math.hypot(s1.x-s0.x,s1.z-s0.z)>1.5,{moved:Math.hypot(s1.x-s0.x,s1.z-s0.z).toFixed(2)});
 await p.evaluate(()=>window.namsan.jump(2));
 s1=await autoUntil(p,s=>s.s>12,15000);check('PC 자동 걷기로 코스를 따라감',s1.s>12,{s:s1.s});
 await p.evaluate(()=>window.namsan.jump(430));
 const y0=(await status(p)).y;let sawStairs=false;for(let i=0;i<16;i++){await p.evaluate(()=>window.namsan.setAuto(true));await sleep(500);if((await status(p)).stairs)sawStairs=true;}
 s1=await status(p);check('큰 계단을 올라감(계단 위·높이 오름)',sawStairs&&s1.y>y0+1,{y0,y:s1.y,s:s1.s});
 await shot(p,'B-pc-stairs');
 await p.evaluate(()=>window.namsan.jump(770));await sleep(1200);await shot(p,'B-pc-rest');
 await p.evaluate(()=>window.namsan.jump(1035));
 s1=await autoUntil(p,s=>s.summitOpen,60000);
 check('PC 정상 도착: 완등 카드',s1.summitOpen&&s1.done,{s:s1.s,stamps:s1.stamps});
 check('정상 스탬프(塔) 찍힘',s1.stamps.includes(4),{stamps:s1.stamps});
 await sleep(800);await shot(p,'B-pc-summit-card');
 await p.evaluate(()=>document.getElementById('summit')?.close());await sleep(300);
 await p.keyboard.down('KeyA');await sleep(1500);await p.keyboard.up('KeyA');
 const s2=await status(p);check('정상 광장 자유 이동',Math.hypot(s2.x-s1.x,s2.z-s1.z)>.8,{});
 await p.evaluate(()=>{window.namsan.cameraOverride=null;});await shot(p,'B-pc-summit');
 const m=await perf(p,'pc-summit');check('PC 성능 기록(도심 포함)',m&&m.fps>0,m);
 await p.click('.uf-menu-btn');await sleep(300);await p.click('[data-uf-tab="map"]').catch(()=>{});await sleep(300);await shot(p,'B-pc-menu-map');
 const inv=await p.$('.uf-invite');check('☰ 메뉴: 친구 부르기·지도 탭',!!inv);
 await p.context().close();
}

// ── C 휴대폰 ──
if(PART.includes('phone')){
 for(const [w,h,tag] of [[390,844,'portrait'],[844,390,'landscape']]){
  const p=await open({viewport:{width:w,height:h},touch:true,label:`phone-${tag}`,url:`${pageUrl}/hiking/namsan/?${Q}`});
  await started(p);await sleep(1500);
  const s0=await status(p);
  // 조이스틱: 왼쪽 아래를 손가락으로 누르고 위로 끈다(CDP 터치 → pointer 이벤트)
  const cdp=await p.context().newCDPSession(p),x=Math.round(w*.25),y=Math.round(h*.78);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  for(let i=1;i<=6;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-i*10}]});await sleep(40);}
  await sleep(2200);await shot(p,`C-phone-${tag}-joystick`);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  const s1=await status(p);check(`휴대폰 ${tag} 조이스틱으로 걷기`,Math.hypot(s1.x-s0.x,s1.z-s0.z)>1,{moved:Math.hypot(s1.x-s0.x,s1.z-s0.z).toFixed(2)});
  const big=await p.$('#auto');const bb=await big.boundingBox();
  check(`휴대폰 ${tag} 큰 단추 손가락 크기·화면 안`,bb&&bb.width>=44&&bb.x+bb.width<=w&&bb.y+bb.height<=h,bb);
  await p.evaluate(()=>window.namsan.jump(840));
  await p.touchscreen.tap(bb.x+bb.width/2,bb.y+bb.height/2);await sleep(2500);
  const s2=await status(p);check(`휴대폰 ${tag} 큰 단추로 자동 걷기(마지막 계단)`,s2.auto&&s2.s>841,{s:s2.s,auto:s2.auto});
  await shot(p,`C-phone-${tag}-stairs`);
  if(tag==='portrait'){
   await p.evaluate(()=>window.namsan.jump(1035));const s3=await autoUntil(p,s=>s.summitOpen,60000);
   check('휴대폰 정상 도착',s3.summitOpen,{s:s3.s});await sleep(600);await shot(p,'C-phone-portrait-summit-card');
   await p.evaluate(()=>document.getElementById('summit')?.close());
   const m=await perf(p,'phone-portrait-summit');check('휴대폰 성능 기록(도심 포함)',m&&m.fps>0,m);
   await shot(p,'C-phone-portrait-summit');
  }
  await p.context().close();
 }
}

// ── E 공통 입장 흐름: 허브에서 서버를 골라 등산 → 산 고르기에서 남산 → 입장 창 없이 남산 방으로(실제 사용자처럼 webdriver=false) ──
if(PART.includes('entry')){
 srv??=startServer({PORT:String(multiPort),HOST:'127.0.0.1',DATA_DIR:`${dir}/data`},{quiet:true});await srv.ready;
 const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await ctx.addInitScript(()=>{Object.defineProperty(Navigator.prototype,'webdriver',{get:()=>false});if(!sessionStorage.getItem('__ns_init')){localStorage.clear();sessionStorage.setItem('__ns_init','1');}});
 const p=await ctx.newPage();p.on('pageerror',e=>out.errors.push(`entry: ${e.message}`));
 await p.goto(`${pageUrl}/?server=${encodeURIComponent(wsUrl)}`);   // 허브
 await p.evaluate(()=>sessionStorage.setItem('aoworld:hub-pick',JSON.stringify({exp:'hiking',server:'2',at:Date.now()})));  // 허브에서 「관악산 2서버」를 골랐다고 둠(handoff.js 모양)
 await p.goto(`${pageUrl}/hiking/?server=${encodeURIComponent(wsUrl)}&${Q}`);
 await p.waitForSelector('[data-pk-go="namsan"]',{timeout:60000});await p.click('[data-pk-go="namsan"]');
 await p.waitForURL(/\/hiking\/namsan\//);await started(p);
 await p.waitForFunction(()=>window.namsan.multi()?.status==='online'||window.namsan.multi()?.room,null,{timeout:60000}).catch(()=>{});await sleep(1500);
 const info=await p.evaluate(()=>({m:window.namsan.multi(),win:[...document.querySelectorAll('.sp-card')].some(e=>e.offsetParent!==null)}));
 check('허브 선택 → 산 고르기 → 남산: 입장 창 없이 남산 방',/^남산/.test(info.m?.room??'')&&!info.win,{room:info.m?.room,window:info.win});
 const last=await p.evaluate(()=>localStorage.getItem('aoworld:entry:v1'));
 check('남산 입장이 관악산 「지난 선택」을 바꾸지 않음',!last||!/"hiking":\{"server":"1"/.test(last),{last});
 await shot(p,'E-entry-hub-to-namsan');await ctx.close();
}

// ── D 함께 걷기 ──
if(PART.includes('multi')){
 srv??=startServer({PORT:String(multiPort),HOST:'127.0.0.1',DATA_DIR:`${dir}/data`},{quiet:true});await srv.ready;
 const health=async()=>(await fetch(`http://127.0.0.1:${multiPort}/health`)).json();
 const url=`${pageUrl}/hiking/namsan/?${Q}&serverpick=on&server=${encodeURIComponent(wsUrl)}`;
 const A=await open({viewport:{width:1280,height:800},label:'A',url});
 await A.waitForSelector('[data-sp-server]',{timeout:120000});await sleep(1500);
 const rows=await A.$$eval('[data-sp-server]',els=>els.map(e=>e.innerText.replace(/\s+/g,' ')));
 check('입장 창에 남산 서버 한 줄(인원 0명)',rows.length===1&&rows[0].includes('남산 서버')&&/0 \/ 30명/.test(rows[0]),{rows});
 await shot(A,'D-entry-window');
 await A.click('[data-sp-server="1"]');await started(A);
 const B=await open({viewport:{width:390,height:844},touch:true,label:'B',url});
 await B.waitForSelector('[data-sp-server]',{timeout:120000});await sleep(800);await B.click('[data-sp-server="1"]');await started(B);
 await A.waitForFunction(()=>window.namsan.multi()?.roster?.length>=1,null,{timeout:60000}).catch(()=>{});
 await B.waitForFunction(()=>window.namsan.multi()?.roster?.length>=1,null,{timeout:60000}).catch(()=>{});
 const ia=await A.evaluate(()=>window.namsan.multi()),ib=await B.evaluate(()=>window.namsan.multi());
 check('두 사람이 남산 방에 들어감',/^남산/.test(ia?.room)&&ia?.room===ib?.room,{a:ia?.room,b:ib?.room});
 check('서로 보임(명단)',ia?.roster?.length===1&&ib?.roster?.length===1,{a:ia?.roster?.length,b:ib?.roster?.length});
 const h=await health();check('서버 방 이름 hiking:남산(서버 코드·목록 그대로)',JSON.stringify(h).includes('"hiking"')&&h.clients>=2,{clients:h.clients,servers:h.servers?.hiking?.map(s=>s.count)});
 // B를 A 앞 6m로 옮겨 A 화면에 보이게
 await A.evaluate(()=>window.namsan.jump(60));await B.evaluate(()=>window.namsan.jump(66));await sleep(2500);
 const near=await A.evaluate(()=>{const m=window.namsan.multi(),me=window.namsan.status();const o=m.roster[0];return {d:Math.hypot(o.x-me.x,o.z-me.z)};});
 check('다른 사람 위치가 따라옴(6m 앞)',near.d<10,near);
 await A.evaluate(()=>window.dispatchEvent(new CustomEvent('hiking:chat-send',{detail:{text:'남산 정상에서 만나요'}})));
 await B.waitForFunction(()=>window.__ev.some(e=>e.type==='hiking:chat'&&e.text==='남산 정상에서 만나요'),null,{timeout:15000}).catch(()=>{});
 const got=await B.evaluate(()=>window.__ev.filter(e=>e.type==='hiking:chat').map(e=>e.text));
 check('채팅 왕복(A → B)',got.includes('남산 정상에서 만나요'),{got});
 // 함께 걷기 판 「이름표」 단추: 누르면 꺼지고 다시 누르면 켜짐(11-19 결함 수정)
 const tagBtn=async()=>{await A.evaluate(()=>[...document.querySelectorAll('.multi-btn')].find(b=>b.textContent.startsWith('이름표')).click());await sleep(300);return A.evaluate(()=>window.hiking.multiApi.tagsOn);};
 const t1=await tagBtn(),t2=await tagBtn();check('함께 걷기 판 「이름표」 단추가 켜고 끔',t1===false&&t2===true,{t1,t2});
 const credit=await A.$eval('#source-line',el=>el.textContent);check('화면 출처 줄에 날씨 출처(Open-Meteo CC BY 4.0)',credit.includes('Open-Meteo.com (CC BY 4.0)'),{credit});
 await sleep(800);await shot(A,'D-pc-sees-other-chat');await shot(B,'D-phone-sees-other');
 // 관악산 방 사람은 남산 사람을 보지 않음
 const C=await open({viewport:{width:1000,height:700},label:'C-gwanak',url:`${pageUrl}/hiking/?multi=${encodeURIComponent('관악산-1')}&server=${encodeURIComponent(wsUrl)}&${Q}&start=entrance`});
 await C.waitForFunction(()=>window.hiking?.started&&window.hiking?.multi?.(),null,{timeout:180000});await sleep(4000);
 await C.waitForFunction(()=>typeof window.hiking?.multi==='function'&&window.hiking.multi(),null,{timeout:60000}).catch(()=>{});   // 함께 걷기가 붙는 사이 window.hiking이 바뀌는 순간을 피함
 const ic=await C.evaluate(()=>window.hiking?.multi?.()??null);
 check('관악산 방과 섞이지 않음',(ic?.roster?.length??0)===0&&(await A.evaluate(()=>window.namsan.multi().roster.length))===1,{gwanakRoster:ic?.roster?.length,room:ic?.room});
 out.metrics.multiHealth=await health();
 for(const p of [A,B,C])await p.context().close();
}

out.errors=[...new Set(out.errors)];
check('페이지 오류 0',out.errors.length===0,{errors:out.errors.slice(0,8)});
writeFileSync(`${dir}/report.json`,JSON.stringify(out,null,1));
const fail=out.checks.filter(c=>!c.pass);console.log(`\n${out.checks.length-fail.length}/${out.checks.length} 통과`);
await browser.close();await vite?.close();await srv?.close?.();
process.exit(fail.length?1:0);
