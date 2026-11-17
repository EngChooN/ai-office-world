// 온라인 크리스마스 놀이 점검(월드개발, 2026-11-16 2차): 서버(MULTI_PORT 8792)·vite(PORT 5198)를 이 스크립트가 띄우고 끝나면 닫는다.
// 브라우저 2개(PC 1920×1080 '하나', 휴대폰 390×844 '둘') + 봇. 실제 단추 누르기·키보드 걷기로 확인한다.
//  ① 선물: 하나 → 둘(사람 고르기·아이템·카드·보내기를 눌러서) → 둘 알림·📬·카드 열기·입어 보기 → 둘 모자가 하나 화면에도 / 광장 모두에게 → 모두의 카드 판
//  ② 모닥불: 「앉기」 → 빈 자리로 걸어가 앉음, 봇이 앉은 자리는 피함, 손 녹이기가 상대 화면에 보임, 걷기 입력이면 일어남
//  ③ 눈사람: 눈덩이 만들기 → W로 밀면 커지고 상대 화면에도 → 두 번째 눈덩이 올리기 → 꾸미기(눈·코) → 완성 → 전시가 두 화면에
//  ④ 눈싸움: 하나 F로 던지면 둘이 맞음(두 화면 모두 눈투성이), 둘(휴대폰)은 ❄️ 단추 짧게 = 자동 조준으로 하나를 맞힘, 마당 밖이면 안 던져짐
//  ⑤ 눈썰매: 하나 타기 → 둘 「둘이 타기」 → 하나 [같이 타요] → 출발 → 둘 화면에서 하나 썰매가 내려감 → 도착하면 내림, 휴대폰 ◀ ▶ 단추
//  ⑥ 휴대폰 단추 44px 이상·화면 안, 페이지 오류 0, 서버가 꺼져도 화면이 깨지지 않음
//  ⑧ 캐럴(11-16 3차): PC·휴대폰에서 실제 클릭·탭 뒤 캐럴이 흘려 받기로 나옴(두 화면 같은 곡), 🎵 창 지금 곡·소리 출처 8곡, 캐럴 끄기·🔊 끄기면 멈추고 받기도 떼어짐, 모닥불에 앉으면 줄어듦, 곡 넘김
//   node scripts/verify-christmas-play.mjs → artifacts/christmas-play/*.png, report.json (실패가 있으면 종료 코드 1). PART=gift,fire,… 로 일부만.
import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {startServer} from '../server/multi-server.mjs';
import * as L from '../src/christmas/layout.js';

const dir='artifacts/christmas-play',multiPort=Number(process.env.MULTI_PORT??8792),room='눈마을-2';mkdirSync(dir,{recursive:true});
const PARTS=new Set((process.env.PART??'gift,fire,snowman,fight,sled,carol,offline').split(','));
const {createServer}=await import('vite');const port=Number(process.env.PORT??5198);
const vite=await createServer({server:{port,host:'127.0.0.1',strictPort:true},logLevel:'warn'});await vite.listen();
const pageUrl=`http://127.0.0.1:${port}`,wsUrl=`ws://127.0.0.1:${multiPort}`;
let srv=startServer({PORT:String(multiPort),HOST:'127.0.0.1',DATA_DIR:`${dir}/data`},{quiet:true});await srv.ready;
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const out={at:new Date().toISOString(),checks:{},errors:[]};let fail=false;
const check=(name,ok,detail={})=>{out.checks[name]={ok:!!ok,...detail};if(!ok)fail=true;console.log(ok?'통과':'실패',name,JSON.stringify(detail).slice(0,300));};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const until=async(fn,ms=15000,step=120)=>{const end=Date.now()+ms;while(Date.now()<end){try{if(await fn())return true;}catch{}await sleep(step);}return false;};

function bot(name,{x=0,z=6,h=0,act=null}={}){
 const ws=new WebSocket(wsUrl),b={name,ws,got:[],id:null,x,z,h};let seq=0,timer=null;
 ws.onopen=()=>ws.send(JSON.stringify({t:'hello',exp:'christmas',room,name}));
 ws.onmessage=e=>{const m=JSON.parse(e.data);b.got.push(m);
  if(m.t==='welcome'){b.id=m.id;if(act)ws.send(JSON.stringify({t:'act',a:act}));b.pos(4);timer=setInterval(()=>b.pos(),100);b.j=setInterval(()=>ws.send(JSON.stringify({t:'j'})),3000);}};
 b.pos=(f=0)=>{seq=(seq+1)&0xffff;ws.send(JSON.stringify({t:'s',q:seq,z:0,x:+b.x.toFixed(2),y:+b.z.toFixed(2),h:b.h,v:0,f}));};
 b.send=m=>ws.send(JSON.stringify(m));
 b.close=()=>{clearInterval(timer);clearInterval(b.j);try{ws.close();}catch{}};
 return b;
}
async function open(name,vp,{look=null,wardrobe=[]}={}){
 const mobile=vp.width<900;
 const ctx=await browser.newContext({viewport:vp,deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});
 await ctx.addInitScript(([look,wardrobe])=>{localStorage.clear();localStorage.setItem('xmas-world:v1',JSON.stringify({look:look??{outfit:'santa'},wardrobe,tip:true,zones:[]}));},[look,wardrobe]);
 const p=await ctx.newPage();p.label=name;p.mobile=mobile;
 p.on('pageerror',e=>out.errors.push(`${name}: ${e.message}`));
 p.on('console',m=>{if(m.type()==='error'&&!/WebSocket connection|favicon|ERR_CONNECTION_REFUSED|Failed to load resource/.test(m.text()))out.errors.push(`${name}: ${m.text()}`);});
 await p.goto(`${pageUrl}/christmas/?capture=1&multi=${encodeURIComponent(room)}&server=${encodeURIComponent(wsUrl)}&name=${encodeURIComponent(name)}`);
 await p.waitForFunction(()=>window.xmas?.multi?.state==='online',null,{timeout:120000});
 return p;
}
const st=p=>p.evaluate(()=>window.xmas.status());
const tp=(p,x,z,h=0)=>p.evaluate(([x,z,h])=>window.xmas.teleport(x,z,h),[x,z,h]);
// 행동 단추를 실제로 누른다(휴대폰은 tap)
async function press(p,id){const sel=`.xh-acts [data-act="${id}"]`;await p.waitForSelector(sel,{timeout:5000});if(p.mobile)await p.tap(sel);else await p.click(sel);}
const idOf=p=>p.evaluate(()=>window.xmas.multi.id);
const shot=(p,n)=>p.screenshot({path:`${dir}/${n}.png`});

let A,B;const bots=[];
try{
 A=await open('하나',{width:1920,height:1080},{look:{outfit:'elf'}});
 B=await open('둘',{width:390,height:844},{look:{outfit:'sweater'}});
 const aId=await idOf(A),bId=await idOf(B);
 await until(async()=>(await st(A)).multi.people.some(p=>p.name==='둘')&&(await st(B)).multi.people.some(p=>p.name==='하나'),20000);

 // ── ① 선물
 if(PARTS.has('gift')){
  await tp(A,L.MAILBOX.stand.x,L.MAILBOX.stand.z,-Math.PI/2);await tp(B,L.MAILBOX.stand.x-1.2,L.MAILBOX.stand.z+1,-Math.PI/2);await sleep(1200);
  const acts=(await st(A)).actions;check('① 우체통 옆 단추: 🎁 선물 보내기·📬 받은 선물',acts[0]==='gift:send'&&acts.includes('gift:inbox'),{acts});
  await press(A,'gift:send');await A.waitForSelector('.xg-sheet:not([hidden]) [data-to]');
  await A.click(`.xg-sheet [data-to="${bId}"]`);await A.click('.xg-sheet [data-item="antlers"]');await A.click('.xg-sheet [data-card="snowman"]');
  await A.fill('.xg-sheet textarea','둘님 메리 크리스마스!');await A.click('.xg-sheet [data-g="next"]');
  await shot(A,'pc-gift-confirm');
  await A.click('.xg-sheet [data-g="send"]');
  const got=await until(async()=>(await st(B)).gifts.inbox===1,8000);
  const toast=await B.evaluate(()=>!document.querySelector('.xg-toast').hidden&&document.querySelector('.xg-toast').textContent);
  check('① 둘이 선물을 받음(알림·📬 숫자)',got&&/하나님에게서 선물이 왔어요/.test(toast||''),{toast,badge:await B.evaluate(()=>document.querySelector('[data-x=inbox] .xh-badge').textContent)});
  const aMsg=await A.evaluate(()=>document.querySelector('.xh-toast').textContent);check('① 하나 화면 "둘에게 선물을 보냈어요"',/둘에게 선물을 보냈어요/.test(aMsg),{aMsg});
  await B.tap('.xg-toast [data-open]');await B.waitForSelector('.xg-open:not([hidden])');await sleep(1300);await shot(B,'mobile-gift-card');
  const card=await B.evaluate(()=>document.querySelector('.xg-open .xg-msg')?.textContent);check('① 카드를 열면 보낸 사람 글이 보임',card==='둘님 메리 크리스마스!',{card});
  await B.tap('.xg-open [data-use]');await sleep(800);
  const sb=await st(B);check('① 입어 보기 → 순록 머리띠를 쓰고 이 기기 옷장에 남음',sb.player.look.hat==='antlers'&&(await B.evaluate(()=>JSON.parse(localStorage.getItem('xmas-world:v1')).wardrobe)).includes('antlers'),{look:sb.player.look});
  const seen=await until(async()=>(await st(A)).multi.people.find(p=>p.name==='둘')?.look?.hat==='antlers',6000);check('① 하나 화면에도 둘의 머리띠가 보임',seen);
  // 같은 사람에게 5분 안 또 → 안내
  await press(A,'gift:send');await A.click(`.xg-sheet [data-to="${bId}"]`);await A.click('.xg-sheet [data-item="cocoa"]');await A.click('.xg-sheet [data-preset="1"]');await A.click('.xg-sheet [data-g="next"]');await A.click('.xg-sheet [data-g="send"]');await sleep(600);
  const lim=await A.evaluate(()=>document.querySelector('.xh-toast').textContent);check('① 같은 사람에게 5분에 하나 → 남은 시간 안내',/같은 사람에게는 5분에 하나만.*뒤/.test(lim),{lim});
  await A.click('.xg-sheet [data-g="close"]');
  // 광장 모두에게 → 모두의 카드
  await B.tap('.xh-acts [data-act="gift:send"]');await B.waitForSelector('.xg-sheet:not([hidden]) [data-to="*"]');await shot(B,'mobile-gift-who');
  await B.tap('.xg-sheet [data-to="*"]');await B.tap('.xg-sheet [data-item="sticker"]');await B.tap('.xg-sheet [data-preset="0"]');await B.tap('.xg-sheet [data-g="next"]');await B.tap('.xg-sheet [data-g="send"]');
  const board=await until(async()=>(await st(A)).gifts.board===1,6000);
  const cards=await A.evaluate(()=>window.xmas.village.cardBoard.cards.filter(c=>c.visible).length);
  check('① 광장 모두에게 → 하나 화면 모두의 카드 판에 1장',board&&cards===1,{cards});
  await tp(A,L.CARD_BOARD.x-1.3,L.CARD_BOARD.z-.9,-Math.PI/2);await sleep(600);await press(A,'gift:board');await sleep(400);
  const listed=await A.evaluate(()=>document.querySelectorAll('.xg-inbox:not([hidden]) [data-open]').length);check('① 모두의 카드 판 단추 → 카드 목록',listed===1,{listed});
  await A.evaluate(()=>window.xmas.gifts.closeAll());
 }

 // ── ② 모닥불
 if(PARTS.has('fire')){
  const seats=L.campfireSeats(),botSeat=seats[0];
  const fb=bot('불멍봇',{x:botSeat.x,z:botSeat.z,h:botSeat.heading,act:{o:'santa',st:1}});bots.push(fb);
  // 하나는 자리 0(봇 자리) 바로 앞에서 앉기
  await tp(A,botSeat.x+Math.sin(botSeat.heading)*1.3,botSeat.z+Math.cos(botSeat.heading)*1.3,botSeat.heading);await sleep(1500);
  const a0=(await st(A)).actions;check('② 모닥불 옆 단추: 🔥 앉기',a0[0]==='fire:sit',{a0});
  await press(A,'fire:sit');
  const sat=await until(async()=>(await st(A)).fire.sitting,8000);await sleep(500);const sa=await st(A);
  check('② 빈 자리로 걸어가 앉음(봇이 앉은 자리 0은 피함)',sat&&sa.fire.seat!==0&&sa.player.sitting,{seat:sa.fire.seat,y:sa.player.y});
  check('② 앉으면 단추: 🙌 손 녹이기·일어나기',sa.actions[0]==='fire:warm'&&sa.actions.includes('fire:stand'),{acts:sa.actions});
  await tp(B,L.CAMPFIRE.x+.5,L.CAMPFIRE.z+4.6,Math.PI);await sleep(1500);
  const seenSit=await until(()=>B.evaluate(id=>window.xmas.multi.poserOf(id)?.sitting||window.xmas.multi.people().find(p=>p.id===id)?.act?.st>0,aId),6000);
  check('② 둘 화면에서 하나가 앉아 있음(act.st·자세)',seenSit);
  await press(A,'fire:warm');
  const warm=await until(()=>B.evaluate(id=>window.xmas.multi.people().find(p=>p.id===id)?.act?.wm===1,aId),4000);check('② 손 녹이기가 상대에게 보임(act.wm)',warm);
  await sleep(500);await shot(A,'pc-campfire-sit');await shot(B,'mobile-campfire-see');
  const fg=(await st(A)).audio;check('② 모닥불 소리 크기(앉음)가 0보다 큼',fg.unlocked?fg.fireGain>0:true,{fireGain:fg.fireGain,unlocked:fg.unlocked});
  await A.keyboard.down('KeyS');await sleep(500);await A.keyboard.up('KeyS');
  check('② 걷기 입력이면 바로 일어남',!(await st(A)).fire.sitting);
  fb.close();
 }

 // ── ③ 눈사람
 if(PARTS.has('snowman')){
  const Y=L.SNOWMAN_YARD;
  await tp(A,Y.x-4,Y.z,-Math.PI/2);await sleep(1600);
  const a0=(await st(A)).actions;check('③ 눈사람 마당 단추: ⛄ 눈덩이 만들기',a0.includes('snow:make'),{a0});
  await press(A,'snow:make');
  const made=await until(async()=>(await st(A)).snowman.balls.length===1,4000);const b0=(await st(A)).snowman.balls[0];
  check('③ 눈덩이가 생김',made,{b0});
  // 동쪽(+x)을 보고 W로 4초 밀기
  await A.evaluate(()=>{const x=window.xmas;x.cam.yaw=-Math.PI/2;});
  await A.keyboard.down('KeyW');await sleep(4500);await A.keyboard.up('KeyW');await sleep(500);
  const b1=(await st(A)).snowman.balls[0];
  check('③ 밀면 굴러가며 커짐',b1&&b1.x>b0.x+2&&b1.r[0]>b0.r[0]+.08,{b0,b1});
  const seenB=await until(async()=>{const bb=(await st(B)).snowman.balls[0];return bb&&Math.abs(bb.x-b1.x)<.4&&Math.abs(bb.r[0]-b1.r[0])<.05;},5000);
  check('③ 둘 화면에도 같은 자리·크기',seenB,{b:(await st(B)).snowman.balls[0]});
  // 더 키운다(되돌아 밀기)
  await A.evaluate(()=>{const x=window.xmas,b=x.snowman.status().balls[0];x.teleport(b.x+b.r[0]+.5,b.z,Math.PI/2);x.cam.yaw=Math.PI/2;});
  await A.keyboard.down('KeyW');await sleep(4200);await A.keyboard.up('KeyW');await sleep(400);
  const big=(await st(A)).snowman.balls[0];
  // 두 번째(작은) 눈덩이를 큰 눈덩이 옆에 만들고 올리기
  await A.evaluate(()=>{const x=window.xmas,b=x.snowman.status().balls[0];x.teleport(b.x,b.z+b.r[0]+.75,0);});await sleep(700);
  await A.evaluate(()=>window.xmas.doAction('snow:make'));await until(async()=>(await st(A)).snowman.balls.length===2,4000);await sleep(400);
  const a1=(await st(A)).actions;check('③ 작은 눈덩이 옆: ⬆ 올리기 단추',a1.includes('snow:stack'),{a1,big:big?.r});
  await press(A,'snow:stack');
  const stacked=await until(async()=>{const bs=(await st(A)).snowman.balls;return bs.length===1&&bs[0].r.length===2;},4000);check('③ 올리기 → 2단 눈사람',stacked,{balls:(await st(A)).snowman.balls});
  await sleep(500);const a2=(await st(A)).actions;check('③ 쌓은 눈사람 옆: 🎨 꾸미기',a2.includes('snow:deco'),{a2});
  await press(A,'snow:deco');await A.waitForSelector('.xs-deco:not([hidden])');
  const doneOff=await A.evaluate(()=>document.querySelector('.xs-done').disabled);
  await A.click('.xs-deco [data-part="eyes"]');await sleep(500);await A.click('.xs-deco [data-part="nose"]');await sleep(400);await A.click('.xs-deco [data-part="scarf"]');
  await until(()=>A.evaluate(()=>!document.querySelector('.xs-done').disabled),4000);await shot(A,'pc-snowman-deco');
  check('③ 눈·코를 붙여야 완성 단추가 켜짐',doneOff&&await A.evaluate(()=>!document.querySelector('.xs-done').disabled));
  await A.click('.xs-done');
  const shown=await until(async()=>(await st(A)).snowman.display.some(Boolean)&&(await st(B)).snowman.display.some(Boolean),5000);
  const dA=(await st(A)).snowman.display.find(Boolean);check('③ 완성 → 트리 앞 전시(두 화면), 이름판에 하나',shown&&dA.names.includes('하나')&&dA.parts.includes('eyes'),{dA});
  await A.evaluate(()=>{const s=window.xmas.village.display[0];window.xmas.teleport(s.x*0.6,s.z*0.6+3,Math.PI*0.9);window.xmas.cam.yaw=Math.PI*0.9;});await sleep(1500);await shot(A,'pc-snowman-display');
 }

 // ── ④ 눈싸움
 if(PARTS.has('fight')){
  const Y=L.SNOWBALL_YARD;
  await tp(A,Y.x-2,Y.z+4.5,-Math.PI/2);await tp(B,Y.x+3,Y.z+4.5,Math.PI/2);await sleep(1800);
  const a0=(await st(A)).actions;check('④ 눈싸움 마당 단추: ❄️ 던지기·🤲 눈 뭉치기·웅크리기',a0[0]==='sb:throw'&&a0.includes('sb:pack')&&a0.includes('sb:crouch'),{a0});
  const ammo0=(await st(A)).fight.ammo;
  // 11-17 조준: F를 누르는 동안 점선·고리·게이지(0.1초 안), 떼면 던짐. 착탄 = 미리보기 고리(0.3m 안)
  await A.keyboard.down('KeyF');await sleep(100);const pv=await st(A);
  check('④ F 누름 0.1초 안 점선 포물선·착탄 고리·힘 게이지',pv.fight.aim?.dots&&pv.fight.aim?.ring&&await A.evaluate(()=>!document.querySelector('.xf-gauge').hidden),{aim:pv.fight.aim});
  await sleep(150);const pv2=(await st(A)).fight.aim;await shot(A,'pc-snowball-aim');
  const sbWait=A.evaluate(()=>new Promise(r=>{const f=window.xmas.net;f.on(m=>{if(m.t==='sb')r(m);});}));
  await A.keyboard.up('KeyF');const sbm=await Promise.race([sbWait,sleep(3000).then(()=>null)]);
  check('④ 떼면 실제 착탄 = 미리보기 고리 안(0.3m)',sbm&&pv2&&Math.hypot(sbm.tx-pv2.tx,sbm.tz-pv2.tz)<=.3+.42,{pv2,sb:sbm,aId,after:(await st(A)).fight});
  check('④ 고리가 사람 위면 빨강·과녁(조준 대상 = 둘)',pv2?.hit===bId||pv2?.target===bId,{pv2});
  const hitB=await until(async()=>(await st(B)).fight.covers[bId]>=1&&(await st(A)).fight.covers[bId]>=1,4000);
  check('④ 하나 F → 둘이 맞음(두 화면 모두 눈투성이)',hitB,{covA:(await st(A)).fight.covers,covB:(await st(B)).fight.covers});
  check('④ 손 눈덩이 3 → 2',ammo0===3&&(await st(A)).fight.ammo===2);
  await shot(B,'mobile-snowball-hit');
  await sleep(900);await B.tap('.xh-acts [data-act="sb:throw"]');
  const hitA=await until(async()=>(await st(A)).fight.covers[aId]>=1,4000);check('④ 둘(휴대폰) ❄️ 짧게 = 자동 조준으로 하나를 맞힘',hitA,{cov:(await st(A)).fight.covers});
  await sleep(300);await shot(A,'pc-snowball-hit');
  // 휴대폰 ❄️ 길게 누르고 위로 끌기 = 카메라가 보는 쪽으로 조준해 던짐(바닥 조준 고리)
  await sleep(900);const thrown0=(await st(B)).fight.ammo;
  const aim=await B.evaluate(async()=>{const b=document.querySelector('.xh-acts [data-act="sb:throw"]'),r=b.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,ev=(t,dx,dy)=>b.dispatchEvent(new PointerEvent(t,{bubbles:true,pointerId:9,pointerType:'touch',clientX:x+dx,clientY:y+dy}));
   ev('pointerdown',0,0);await new Promise(r=>setTimeout(r,320));ev('pointermove',0,-60);await new Promise(r=>setTimeout(r,120));ev('pointermove',0,-110);await new Promise(r=>setTimeout(r,200));
   const ring=window.xmas.snowfight.status();const aiming=b.classList.contains('aiming');ev('pointerup',0,-110);return {aiming,ring};});
  await sleep(300);check('④ 휴대폰 ❄️ 길게 누르고 끌기 → 조준 뒤 던짐',aim.aiming&&(await st(B)).fight.ammo===thrown0-1,{aim,ammo:(await st(B)).fight.ammo,thrown0});
  // 휴대폰 조준 중 화면(❄️ 누른 채 끌기)
  await B.evaluate(()=>{const b=document.querySelector('.xh-acts [data-act="sb:throw"]'),r=b.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:11,pointerType:'touch',clientX:x,clientY:y}));b.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerId:11,pointerType:'touch',clientX:x-8,clientY:y-70}));});
  await sleep(700);const mv=(await st(B)).fight.aim;await shot(B,'mobile-snowball-aim');
  check('④ 휴대폰 ❄️ 누른 채 끌기 → 점선·고리(캐릭터 앞 월드에)',mv?.dots&&mv?.ring,{mv});
  await B.evaluate(()=>{const b=document.querySelector('.xh-acts [data-act="sb:throw"]');b.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:11,pointerType:'touch'}));});
  // 웅크리기: 단추를 누르는 동안 act.cr=1
  await A.evaluate(()=>{const b=document.querySelector('.xh-acts [data-act="sb:crouch"]');b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:3,pointerType:'mouse',button:0}));});
  await sleep(500);const cr=await st(A);
  await A.evaluate(()=>{const b=document.querySelector('.xh-acts [data-act="sb:crouch"]');b.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:3,pointerType:'mouse',button:0}));});
  check('④ 웅크리기 단추(누르는 동안) → act.cr 1·자세 웅크림',cr.act.cr===1&&cr.player.arms==='crouch',{act:cr.act,arms:cr.player.arms});
  // 눈 뭉치기
  await press(A,'sb:pack');await sleep(1300);check('④ 눈 뭉치기(1초) → 손 눈덩이 +1',(await st(A)).fight.ammo===3,{ammo:(await st(A)).fight.ammo});
  // 마당 밖은 못 던짐
  await tp(A,L.CAMPFIRE.x+3,L.CAMPFIRE.z,0);await sleep(600);const n0=(await st(A)).fight.flying;
  await A.keyboard.press('KeyF');await sleep(400);check('④ 마당 밖에서는 F를 눌러도 안 던져짐(모닥불 쪽 안전)',!(await st(A)).actions.includes('sb:throw')&&(await st(A)).fight.flying===n0);
 }

 // ── ⑤ 눈썰매
 if(PARTS.has('sled')){
  const d=L.SLED_RUN.deck;
  await tp(A,d.x,d.z+2,Math.PI);await tp(B,d.x+1.5,d.z+2.2,Math.PI);await sleep(1800);
  const a0=(await st(A)).actions;check('⑤ 출발대 단추: 🛷 타기',a0[0]==='sled:board',{a0});
  await press(A,'sled:board');await sleep(800);
  const sa=await st(A);check('⑤ 타기 → 썰매에 앉아 기다림(줄 1~3)',sa.sled.mode==='ready'&&sa.sled.lane>=1&&sa.player.sitting,{sled:sa.sled});
  await until(async()=>(await st(B)).actions.includes('sled:ask'),4000);
  await B.tap('.xh-acts [data-act="sled:ask"]');
  await A.waitForSelector('.xl-ask:not([hidden])',{timeout:4000});await shot(A,'pc-sled-ask');await A.click('.xl-ask [data-l="ok"]');
  const back=await until(async()=>(await st(B)).sled.mode==='back',4000);check('⑤ 둘이 타기 → 앞사람 수락 → 둘이 뒷자리',back,{b:(await st(B)).sled});
  await press(A,'sled:go');
  const riding=await until(async()=>(await st(A)).sled.mode==='ride',6000);check('⑤ 출발! → 3·2·1 뒤 내려감',riding);
  await sleep(600);
  const steer=await B.evaluate(()=>{const e=document.querySelector('.xl-steer');return e&&!e.hidden;});
  const bSteer=await A.evaluate(()=>{const e=document.querySelector('.xl-steer');return e&&!e.hidden;});
  await sleep(1200);await shot(A,'pc-sled-ride');await shot(B,'mobile-sled-back');
  const selfA=(await st(A)).player,pA=(await st(B)).multi.people.find(p=>p.name==='하나'),bSelf=(await st(B)).player;
  check('⑤ 둘 화면에서 하나 썰매가 길을 따라 내려감(둘도 뒷자리로 같이)',pA&&pA.z>d.z+4&&Math.abs(bSelf.z-pA.z)<1.5,{pA:{x:pA?.x,z:pA?.z},selfA:{x:selfA.x,z:selfA.z},bSelf:{x:bSelf.x,z:bSelf.z},sledA:(await st(A)).sled});
  check('⑤ 앞사람 화면에 ◀ ▶ 조종 단추',bSteer,{steer});
  const ended=await until(async()=>(await st(A)).sled.mode==='none'&&(await st(B)).sled.mode==='none',20000);await sleep(500);
  const sa2=await st(A);check('⑤ 멈춤 구역 도착 → 둘 다 내림, 「⬆ 언덕 위로」',ended&&sa2.actions.includes('sled:up'),{acts:sa2.actions,p:sa2.player});
  // 휴대폰 혼자 타기: ◀ ▶ 단추가 보이고 누르면 옆으로
  await press(A,'sled:up');await sleep(600);
  await tp(B,d.x,d.z+2,Math.PI);await sleep(900);await B.tap('.xh-acts [data-act="sled:board"]');await sleep(500);await B.tap('.xh-acts [data-act="sled:go"]');
  await until(async()=>(await st(B)).sled.mode==='ride',6000);
  const box=await B.evaluate(()=>{const r=document.querySelector('.xl-steer [data-steer="1"]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,w:r.width,h:r.height};});
  const off0=(await st(B)).sled.s;await B.touchscreen.tap(box.x,box.y);
  await B.evaluate(b=>{const el=document.elementFromPoint(b.x,b.y);el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:7}));},box);await sleep(700);
  await B.evaluate(b=>{const el=document.elementFromPoint(b.x,b.y);el.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:7}));},box);
  check('⑤ 휴대폰 ▶ 단추(88px)로 조종',box.w>=64&&(await st(B)).sled.s>off0,{box});
  await until(async()=>(await st(B)).sled.mode==='none',20000);
 }

 // ── ⑥ 휴대폰 단추 크기·화면 안
 {await tp(B,L.MAILBOX.stand.x,L.MAILBOX.stand.z,-Math.PI/2);await sleep(900);
  const r=await B.evaluate(()=>[...document.querySelectorAll('.xh-acts button,.xh-tr button,.hc-btn')].filter(b=>b.offsetParent).map(b=>{const r=b.getBoundingClientRect();return {c:b.className,w:Math.round(r.width),h:Math.round(r.height),in:r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight};}));
  check('⑥ 휴대폰 단추가 모두 44px 이상·화면 안',r.length>=4&&r.every(b=>b.w>=44&&b.h>=44&&b.in),{r});
  await shot(B,'mobile-mailbox-actions');
  await B.setViewportSize({width:844,height:390});await sleep(900);await shot(B,'mobile-landscape-mailbox');
  const r2=await B.evaluate(()=>[...document.querySelectorAll('.xh-acts button,.xh-tr button')].filter(b=>b.offsetParent).map(b=>{const r=b.getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;}));
  check('⑥ 휴대폰 가로에서도 단추가 화면 안',r2.length&&r2.every(Boolean));
  await B.setViewportSize({width:390,height:844});}

 // ── 캐럴
 if(PARTS.has('carol')){
  const cs=p=>p.evaluate(()=>({...window.xmas.audio.carolNow(),lv:window.xmas.audio.levels(),stat:window.xmas.audio.stats.carol,muted:window.xmas.audio.muted}));
  const tapAt=async(p,sel)=>{if(p.mobile)await p.tap(sel);else await p.click(sel);};
  // 아직 아무 입력도 없었던 경우를 대비해 화면을 한 번 누른다(실제 사용자처럼)
  for(const p of [A,B]){const v=p.viewportSize();if(p.mobile)await p.touchscreen.tap(v.width/2,v.height*.45);else await p.mouse.click(v.width/2,v.height*.45);}
  for(const [p,n] of [[A,'PC'],[B,'휴대폰']]){
   const ok=await until(async()=>{const c=await cs(p);return c.state==='playing'&&c.paused===false&&c.time>0.5;},25000);
   const c1=await cs(p);await sleep(1500);const c2=await cs(p);
   check(`⑧ ${n}: 캐럴이 나옴(재생 중·시간 흐름·소리 크기)`,ok&&c2.time>c1.time&&c2.lv.carol>-60&&c2.lv.master>-70,{title:c2.title,time:c2.time,carolDb:+c2.lv.carol.toFixed(1),masterDb:+c2.lv.master.toFixed(1)});
  }
  const [ia,ib]=[(await cs(A)).index,(await cs(B)).index];
  check('⑧ 두 화면이 같은 곡(같은 시계)',ia===ib&&ia>=0,{ia,ib});
  // 흘려 받기: 캐럴 파일은 fetch·통째로 풀기가 아니라 <audio>가 받음
  const kinds=await A.evaluate(()=>[...new Set(performance.getEntriesByType('resource').filter(e=>e.name.includes('/sounds/christmas/carol/')).map(e=>e.initiatorType))]);
  check('⑧ 캐럴은 <audio>로 흘려 받음(fetch 아님)',!kinds.includes('fetch')&&!kinds.includes('xmlhttprequest'),{kinds});
  // 🎵 창: 지금 곡·소리 출처
  for(const [p,n,f] of [[A,'PC','pc-carol-sheet'],[B,'휴대폰','mobile-carol-sheet']]){
   await tapAt(p,'.xh-tr [data-x=music]');await sleep(700);
   const v=await p.evaluate(()=>{const s=document.querySelector('[data-sheet=music]');return {open:!s.hidden,now:s.querySelector('[data-carol-now]').textContent,items:[...s.querySelectorAll('.xh-credits li')].map(li=>li.querySelector('b').textContent),links:[...s.querySelectorAll('.xh-credits a')].map(a=>a.href),inView:(()=>{const r=s.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+1;})()};});
   const c=await cs(p);
   check(`⑧ ${n}: 🎵 창에 지금 곡과 소리 출처(캐럴 8곡+바람·직접 만든 소리)`,v.open&&v.now.includes(c.title)&&v.items.length===10&&v.links.length===8&&v.links.every(h=>h.startsWith('https://commons.wikimedia.org/wiki/File:'))&&v.inView,{now:v.now,n:v.items.length});
   await shot(p,f);
   // 캐럴 끄기 → 멈춤·재생기 떼어짐 → 켜기
   await tapAt(p,'[data-sheet=music] [data-x=carol]');await sleep(600);
   const off=await cs(p);
   const pressed=await p.evaluate(()=>document.querySelector('[data-sheet=music] [data-x=carol]').getAttribute('aria-pressed'));
   check(`⑧ ${n}: 캐럴 끄기 → 멈추고 받기를 뗌`,off.state==='off'&&off.index===-1&&pressed==='false'&&!(await p.evaluate(()=>!!window.xmas.audio.carolDeck)),{state:off.state,pressed});
   if(n==='PC')await shot(p,'pc-carol-off');
   await tapAt(p,'[data-sheet=music] [data-x=carol]');
   const back=await until(async()=>{const c=await cs(p);return c.state==='playing'&&c.paused===false;},15000);
   check(`⑧ ${n}: 캐럴 다시 켜기 → 다시 나옴`,back,{state:(await cs(p)).state});
   await tapAt(p,'[data-sheet=music] [data-x=sheet-close]');await sleep(300);
   // 🔊 끄기 → 캐럴도 멈추고 전체 소리 0 → 켜기
   await tapAt(p,'.xh-tr [data-x=sound]');await sleep(900);
   const m=await cs(p);
   check(`⑧ ${n}: 🔊 끄기 → 캐럴도 꺼짐(받기 멈춤·소리 0)`,m.muted&&m.state==='off'&&!(m.lv.master>-90),{state:m.state,masterDb:m.lv.master});
   await tapAt(p,'.xh-tr [data-x=sound]');
   const on=await until(async()=>{const c=await cs(p);return !c.muted&&c.state==='playing'&&c.paused===false;},15000);
   check(`⑧ ${n}: 🔊 켜기 → 캐럴이 다시 나옴`,on);
  }
  // 저장: 캐럴 끔은 다시 들어와도 유지되는 이 기기 설정
  const saved=await B.evaluate(()=>JSON.parse(localStorage.getItem('xmas-world:v1')).carol);
  check('⑧ 캐럴 켜기/끄기는 이 기기에 저장',saved===true,{saved});
  // 음량 맞춤: 평소 CAROL_LEVEL, 모닥불에 앉으면 줄어듦(장작 소리 우선)
  await tp(A,L.MAILBOX.stand.x,L.MAILBOX.stand.z,0);await sleep(1200);
  const far=await cs(A);
  {const st3=L.campfireSeats()[3];await tp(A,st3.x+Math.sin(st3.heading)*1.3,st3.z+Math.cos(st3.heading)*1.3,st3.heading);}await sleep(1500);
  await press(A,'fire:sit');await until(async()=>(await st(A)).fire.sitting,10000);await sleep(1500);
  const sit=await cs(A),fg=(await st(A)).audio.fireGain;
  check('⑧ 모닥불에 앉으면 캐럴이 작아지고 장작 소리가 커짐',sit.stat.level<far.stat.level&&fg>.3,{far:far.stat.level,sit:sit.stat.level,fireGain:fg,carolDbFar:+far.lv.carol.toFixed(1),carolDbSit:+sit.lv.carol.toFixed(1)});
  await shot(A,'pc-carol-campfire');
  await A.keyboard.down('KeyS');await sleep(400);await A.keyboard.up('KeyS');await sleep(400);
  // 곡 넘김: 곡 끝(무음 앞) 3초 전으로 옮기면 다음 곡으로 겹쳐 넘어감
  const before=(await cs(A)).index;
  await A.evaluate(()=>window.xmas.audio.carolDeck.seekNearEnd(3));
  const moved=await until(async()=>{const c=await cs(A);return c.index!==before&&c.state==='playing';},12000);
  const after=await cs(A);await sleep(1500);const after2=await cs(A);
  check('⑧ 곡이 끝나면 다음 곡으로 이어짐(뒤 무음 건너뜀)',moved&&after2.time>after.time,{before,after:after2.index,title:after2.title});
 }
 // ── 서버가 꺼짐
 if(PARTS.has('offline')){
  await srv.close();
  await until(async()=>['reconnecting','offline'].includes((await st(A)).multi.state),15000);
  await tp(A,L.MAILBOX.stand.x,L.MAILBOX.stand.z,-Math.PI/2);await sleep(800);
  const r=await A.evaluate(()=>window.xmas.net.send({t:'sb:throw',x:0,z:0,dx:1,dz:0,d:5}));
  await tp(A,L.SNOWMAN_YARD.x-3,L.SNOWMAN_YARD.z,0);await sleep(500);
  await A.evaluate(()=>window.xmas.doAction('snow:make'));await sleep(300);
  const t=await A.evaluate(()=>document.querySelector('.xh-toast').textContent);
  check('⑦ 서버가 꺼지면 놀이 요청은 보내지 않고 "연결이 돌아오면 다시 눌러 주세요"',r===false&&/연결이 돌아오면/.test(t),{t,state:(await st(A)).multi.state});
  const disp=(await st(A)).snowman.display.filter(Boolean).length;
  check('⑦ 끊겨도 전시 눈사람은 마지막 모습 그대로',!PARTS.has('snowman')||disp>=1,{disp});
  await shot(A,'pc-offline');
 }
 check('페이지 오류 없음',out.errors.length===0,{errors:out.errors.slice(0,8)});
}catch(e){console.error(e);out.errors.push(String(e?.stack??e));fail=true;}
finally{
 for(const b of bots)b.close();
 writeFileSync(`${dir}/report.json`,JSON.stringify(out,null,1));
 await browser.close();await vite.close();try{await srv.close();}catch{}
 console.log(fail?'── 실패 있음':'── 모두 통과',Object.values(out.checks).filter(c=>c.ok).length,'/',Object.keys(out.checks).length);
 process.exit(fail?1:0);
}
