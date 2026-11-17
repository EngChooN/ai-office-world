// 흡연장 상호작용 단추 전부 누르기 + 같이 피우기 맞추기 점검(2026-11-17, docs/변경기록-2026-11-17-흡연장-상호작용-수정.md).
// 진짜 멀티 서버(node server/multi-server.mjs, 따로 띄운 프로세스)와 vite를 이 스크립트가 띄운다(운영 서버 8787·5174·5188은 안 씀).
//  1) A = PC 1920×1080(마우스), B = 휴대폰 390×844(터치)가 같은 옥상(옥상-1)에 들어와 「상황」 단추로 상황을 실제로 고른다(<html data-scene>이 생긴 상태 — 11-17 고장 조건).
//  2) A가 화면 단추를 하나씩 누르고(꺼내기·담배 고르기·불·꾹 들이마시기·묘기·재 털기·꽁초·인사·채팅·자판기·한 모금·캔 버리기·벤치·일어나기·난간·떨어지기·옷·재떨이로·소리·설정·수첩·상황)
//     A 자기 화면이 바뀌는지 + B 화면에서 A가 같게 보이는지 본다. 이어서 B가 휴대폰 단추(⋯ 안 인사 포함)를 탭하고 A 화면에서 본다.
//  3) 같은 벤치 같은 칸을 A·B가 동시에 누름 → 한 사람만 그 칸(서버 판정), 두 화면이 같은지.
//  4) 나중에 온 C(휴대폰)가 A·B의 지금 상태(자세·캔·담배 종류·불·옷)를 그대로 보는지.
//  5) 키보드 단축키(PC)도 누른다: Space·F 꾹, R·N·T, 1~4, B, G, E, C, Enter.
//   node scripts/verify-lounge-interact.mjs   (PORT=vite 포트 기본 5233, MULTI_PORT=서버 포트 기본 8833)
//   → artifacts/lounge-interact/report.json · pc.png · phone.png · late.png. 하나라도 실패하면 종료 코드 1.
import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

const OUT=resolve('artifacts/lounge-interact');mkdirSync(OUT,{recursive:true});
const port=Number(process.env.PORT??5233),multiPort=Number(process.env.MULTI_PORT??8833);
if([5174,5188,8787].includes(port)||[5174,5188,8787].includes(multiPort))throw new Error('운영·다른 작업 포트(5174·5188·8787)는 쓰지 않습니다');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

// ── 서버(따로 프로세스)·vite
const srv=spawn(process.execPath,['server/multi-server.mjs'],{env:{...process.env,PORT:String(multiPort),HOST:'127.0.0.1',DATA_DIR:`${OUT}/data`},stdio:['ignore','pipe','pipe']});
let srvLog='';srv.stdout.on('data',d=>{srvLog+=d;});srv.stderr.on('data',d=>{srvLog+=d;});
for(let i=0;i<50&&!/start/.test(srvLog);i++)await sleep(100);
if(!/start/.test(srvLog))throw new Error('멀티 서버가 안 떴어요:\n'+srvLog);
const {createServer}=await import('vite');
const vite=await createServer({server:{port,host:'127.0.0.1',strictPort:true},logLevel:'warn'});await vite.listen();
const pageUrl=`http://127.0.0.1:${port}`,wsUrl=`ws://127.0.0.1:${multiPort}`;
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const report={at:new Date().toISOString(),pageUrl,wsUrl,rows:[],errors:[]};let failed=0;
const row=(who,button,mine,seen,note='')=>{const ok=mine!==false&&seen!==false;if(!ok)failed++;report.rows.push({who,button,mine,seen,note,ok});
 console.log(`${ok?'○':'✕'} [${who}] ${button.padEnd(16)} 내 화면:${mine===null?'-':mine?'됨':'안 됨'} 상대 화면:${seen===null?'-(각자 화면)':seen?'같음':'다름'}${note?' — '+note:''}`);};

async function open(name,{touch=false}={}){
 const ctx=await browser.newContext({viewport:touch?{width:390,height:844}:{width:1920,height:1080},deviceScaleFactor:1,hasTouch:touch,isMobile:touch});
 await ctx.addInitScript(([nick])=>{
  if(!sessionStorage.getItem('__i')){sessionStorage.setItem('__i','1');localStorage.setItem('online-smoking',JSON.stringify({nickname:nick,seenIntro:true,muted:true,quitDate:'2026-11-01',outfit:'shirt'}));}
  window.__emotes=[];addEventListener('lounge:remote-emote',e=>window.__emotes.push(e.detail));
 },[name]);
 const p=await ctx.newPage();p.nm=name;p.touch=touch;p.ctx=ctx;
 p.on('pageerror',e=>report.errors.push(`${name}: ${e.message}`));
 p.on('console',m=>{if(m.type()==='error'&&!/WebSocket|favicon|ERR_CONNECTION|Failed to load/.test(m.text()))report.errors.push(`${name}: ${m.text()}`);});
 // capture=1: 사진에 3D 화면이 늘 담기게(preserveDrawingBuffer). 이 옵션이면 상황 창이 저절로 안 떠서 「상황」 단추로 직접 연다
 await p.goto(`${pageUrl}/smoking/?multi=${encodeURIComponent('옥상-1')}&server=${encodeURIComponent(wsUrl)}&name=${encodeURIComponent(name)}&capture=1`);
 await p.waitForFunction(()=>!!window.lounge,null,{timeout:180000});
 await p.waitForFunction(()=>window.lounge.multi.state==='online',null,{timeout:60000,polling:200});
 return p;
}
const press=async(p,sel,{timeout=4000}={})=>{const loc=p.locator(sel).first();await loc.waitFor({state:'visible',timeout});if(p.touch)await loc.tap({timeout});else await loc.click({timeout});};
const tryPress=(p,sel,o)=>press(p,sel,o).then(()=>true,e=>{console.log('   못 누름',sel,e.message.split('\n')[0].slice(0,120));return false;});
const until=(p,fn,arg,ms=8000)=>p.waitForFunction(fn,arg,{timeout:ms,polling:100}).then(()=>true,()=>false);
const myId=p=>p.evaluate(()=>window.lounge.multi.id);
// viewer 화면에서 그 사람(id)의 모습이 cond를 만족할 때까지
const seenBy=(viewer,id,cond,ms=8000)=>until(viewer,([id,c])=>{const r=window.lounge.multi.status().people.find(x=>x.id===id);return !!r&&new Function('r',`return ${c}`)(r);},[id,cond],ms);
// 꾹 누르기(PC 마우스 / 휴대폰 터치)
async function hold(p,sel,ms=1100){
 const box=await p.locator(sel).first().boundingBox();if(!box)return false;const x=box.x+box.width/2,y=box.y+box.height/2;
 if(p.touch){const cdp=await p.ctx.newCDPSession(p);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await sleep(ms);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
 else{await p.mouse.move(x,y);await p.mouse.down();await sleep(ms);await p.mouse.up();}
 return true;
}
// 대상 위 표시를 누르기 좋게: 서 있게 하고 대상 쪽으로 카메라를 돌린다(누르기는 진짜 클릭·탭)
async function aim(p,k,{x=null,z=null}={}){
 await p.evaluate(([k,x,z])=>{const L=window.lounge,sp=L.rooftop.spots,b=L.rooftop.bounds;L.spots.stand();
  if(x!==null)L.teleport(x,z,0);else if(k==='rail')L.teleport(.6,b.minZ+2.2,0);
  const pl=L.player,t=k==='vending'?sp.vending:k==='bench'?sp.benches[0].seat??sp.benches[0]:{x:pl.x,z:b.minZ};
  L.setCam({yaw:Math.atan2(-(t.x-pl.x),-(t.z-pl.z)),pitch:.35});},[k,x,z]);
 await sleep(1200);
}
const state=p=>p.evaluate(()=>{const L=window.lounge,sm=L.smoker.status();return {stage:document.querySelector('.lg-dock .smoke')?.dataset.stage,smoke:sm.state,lit:sm.lit,kind:sm.kind,trick:sm.trick,pose:L.spots.pose,can:L.spots.status().can,outfit:L.player.outfit,x:L.player.x,z:L.player.z,time:L.timeState.mode,scene:document.documentElement.dataset.scene??null};});

try{
 const A=await open('대표PC'),B=await open('손님폰',{touch:true});
 // 처음 뜬 상황 고르기를 실제로 고른다 → <html data-scene>
 for(const [p,sc] of [[A,'evening'],[B,'lunch']]){
  const ok=await tryPress(p,'[data-sp=scene]',{timeout:15000})&&await tryPress(p,`.sp-panel:not([hidden]) [data-scene=${sc}]`,{timeout:5000});
  row(p.nm,'상황 고르기(입장)',ok&&await until(p,s=>document.documentElement.dataset.scene===s,sc,3000),null);
 }
 await until(A,()=>window.lounge.multi.status().people.length>=1,null,20000);await until(B,()=>window.lounge.multi.status().people.length>=1,null,20000);
 const ida=await myId(A),idb=await myId(B);
 const seenA=(cond,ms)=>seenBy(B,ida,cond,ms),seenB=(cond,ms)=>seenBy(A,idb,cond,ms);

 // ── A(PC)가 단추를 하나씩
 await A.evaluate(()=>window.lounge.teleport(0,1.5,0));await sleep(800);
 row(A.nm,'소리',await tryPress(A,'[data-a=snd]')&&await until(A,()=>window.lounge.ctx.profile.muted===false,null,2000),null);await tryPress(A,'[data-a=snd]');
 row(A.nm,'설정 열기·닫기',await tryPress(A,'[data-a=set]')&&await tryPress(A,'.lg-modal [data-a=close]')&&await until(A,()=>document.querySelector('.lg-modal').hidden,null,2000),null);
 row(A.nm,'수첩 접기·펴기',await tryPress(A,'[data-a=fold]')&&await until(A,()=>document.querySelector('.lg-note').classList.contains('folded'),null,2000)&&await tryPress(A,'[data-a=fold]'),null);
 row(A.nm,'상황 단추(다시)',await tryPress(A,'[data-sp=scene]')&&await until(A,()=>!document.querySelector('.sp-panel').hidden,null,2000)&&await tryPress(A,'.sp-panel [data-sp=close]'),null,'상황·시간은 각자 화면 설정');
 row(A.nm,'꺼내기·그만두기',await tryPress(A,'[data-a=take]')&&await tryPress(A,'[data-a=cancel]')&&await until(A,()=>document.querySelector('.lg-dock .smoke').dataset.stage==='idle',null,2000),null);
 await tryPress(A,'[data-a=take]');
 const kindOk=await tryPress(A,'[data-a=kind][data-k=cigar]')&&await until(A,()=>window.lounge.smoker.status().kind==='cigar'&&window.lounge.smoker.status().state!=='idle',null,3000);
 row(A.nm,'담배 고르기(시가)',kindOk,await seenA("r.smoke!=='idle'&&r.smoke!==null&&r.kind==='cigar'"));
 row(A.nm,'불',await tryPress(A,'[data-a=light]')&&await until(A,()=>window.lounge.smoker.status().lit,null,6000),await seenA('r.lit===true',10000));
 await until(A,()=>window.lounge.smoker.status().state==='smoking',null,8000);
 const held=await hold(A,'[data-a=draw]');
 row(A.nm,'꾹 들이마시기',held&&await until(A,()=>['exhale','smoking'].includes(window.lounge.smoker.status().state),null,4000),await seenA("['inhale','exhale'].includes(r.smoke)",6000));
 await until(A,()=>window.lounge.smoker.status().state==='smoking',null,8000);
 await tryPress(A,'[data-a=tricks]');
 row(A.nm,'묘기 코로',await tryPress(A,'[data-a=trick][data-k=nose]')&&await until(A,()=>window.lounge.smoker.status().trick==='nose',null,8000),await seenA("r.trick==='nose'",10000));
 await until(A,()=>window.lounge.smoker.status().state==='smoking',null,10000);
 row(A.nm,'묘기 링',await tryPress(A,'[data-a=trick][data-k=ring]')&&await until(A,()=>window.lounge.smoker.status().trick==='ring',null,8000),await seenA("r.trick==='ring'",10000));
 await until(A,()=>window.lounge.smoker.status().state==='smoking',null,10000);
 await tryPress(A,'[data-a=tricks]'); // 묘기 닫기
 row(A.nm,'재 털기',await tryPress(A,'[data-a=flick]')&&await until(A,()=>window.lounge.smoker.status().state==='flick',null,3000),await seenA("r.smoke==='flick'",6000));
 const ew0=await B.evaluate(()=>window.__emotes.length);
 for(const k of ['wave','wave','sigh','stretch'])await tryPress(A,`[data-a=emote][data-k=${k}]`);
 row(A.nm,'인사·한숨·기지개(4번)',await until(A,()=>document.querySelectorAll('.lg-bub').length>0,null,2000),await until(B,n=>window.__emotes.length>=n+4,ew0,6000),'같은 인사 두 번도 상대에게 두 번');
 await A.fill('.lg-form input','다들 안녕');await tryPress(A,'.lg-form [type=submit]');
 row(A.nm,'채팅 보내기',true,await until(B,()=>[...document.querySelectorAll('.lg-log p')].some(p=>p.textContent.includes('다들 안녕')),null,6000));
 // 자판기·캔
 await aim(A,'vending');
 row(A.nm,'자판기(캔커피)',await tryPress(A,'.sp-mark[data-k="vending:0"]')&&await until(A,()=>window.lounge.spots.status().can.held,null,20000),await seenA("r.act?.can===2&&r.can==='held'",8000));
 const sip0=await A.evaluate(()=>window.lounge.spots.status().can.sips);await until(A,()=>!window.lounge.spots.status().can.sipping,null,6000);
 const sipAct0=await B.evaluate(id=>window.lounge.multi.status().people.find(x=>x.id===id)?.act?.sip??0,ida);
 row(A.nm,'한 모금',await tryPress(A,'[data-sp=sip]')&&await until(A,()=>window.lounge.spots.status().can.sipping,null,2000),await seenA(`(r.act?.sip??0)>${sipAct0}`,6000));
 // 담배 버리기(캔을 든 채로)
 await until(A,()=>['smoking','finished'].includes(window.lounge.smoker.status().state),null,10000);
 row(A.nm,'꽁초 버리기',await tryPress(A,'[data-a=drop]')&&await until(A,()=>window.lounge.smoker.status().state==='idle',null,8000),await seenA("r.smoke==='idle'||r.lit===false",10000));
 row(A.nm,'캔 버리기',await tryPress(A,'[data-sp=dropCan]')&&await until(A,()=>!window.lounge.spots.status().can.held,null,2000),await seenA("r.act?.can===0&&r.can==='none'",6000));
 // 벤치·일어나기
 await aim(A,'bench');
 row(A.nm,'벤치 걸터앉기',await tryPress(A,'.sp-mark[data-k="bench:0"]')&&await until(A,()=>window.lounge.spots.pose==='sit',null,25000),await seenA("r.pose==='sit'&&r.act?.b===0",8000));
 row(A.nm,'일어나기',await tryPress(A,'[data-sp=stand]')&&await until(A,()=>window.lounge.spots.pose==='stand',null,3000),await seenA("r.pose==='stand'",6000));
 // 난간·떨어지기
 await aim(A,'rail');
 row(A.nm,'난간에 기대기',await tryPress(A,'.sp-mark[data-k="rail:0"]')&&await until(A,()=>window.lounge.spots.pose==='lean',null,20000),await seenA("r.pose==='lean'&&Number.isInteger(r.act?.lx)",8000));
 row(A.nm,'난간에서 떨어지기',await tryPress(A,'[data-sp=stand]')&&await until(A,()=>window.lounge.spots.pose==='stand',null,3000),await seenA("r.pose==='stand'",6000));
 // 옷 바꾸기(설정 창)
 await tryPress(A,'[data-a=set]');
 row(A.nm,'옷 바꾸기(정장)',await tryPress(A,'.lg-modal [data-o=suit]')&&await until(A,()=>window.lounge.player.outfit==='suit',null,2000),await seenA("r.outfit==='suit'&&r.act?.o==='suit'",8000));
 await tryPress(A,'.lg-modal [data-a=close]');
 // 재떨이로 걷기
 const p0=await state(A);
 row(A.nm,'재떨이로',await tryPress(A,'[data-a=ashtray]')&&await until(A,([x,z])=>Math.hypot(window.lounge.player.x-x,window.lounge.player.z-z)>.5,[p0.x,p0.z],6000),await seenA(`Math.hypot((r.x??0)-(${p0.x}),(r.z??0)-(${p0.z}))>.5`,8000));
 await sleep(2500);

 // ── B(휴대폰)가 탭
 await B.evaluate(()=>window.lounge.teleport(-1.5,1.5,0));await sleep(800);
 row(B.nm,'채팅 열기',await tryPress(B,'[data-a=chat]')&&await until(B,()=>document.querySelector('.lg-chat').classList.contains('open'),null,2000),null);
 await B.fill('.lg-form input','폰에서 왔어요');await tryPress(B,'.lg-form [type=submit]');
 row(B.nm,'채팅 보내기',true,await until(A,()=>[...document.querySelectorAll('.lg-log p')].some(p=>p.textContent.includes('폰에서 왔어요')),null,6000));
 await tryPress(B,'[data-a=take]');
 row(B.nm,'꺼내기→멘솔',await tryPress(B,'[data-a=kind][data-k=menthol]')&&await until(B,()=>window.lounge.smoker.status().kind==='menthol',null,3000),await seenB("r.kind==='menthol'&&r.smoke!=='idle'"));
 row(B.nm,'불',await tryPress(B,'[data-a=light]')&&await until(B,()=>window.lounge.smoker.status().lit,null,6000),await seenB('r.lit===true',10000));
 await until(B,()=>window.lounge.smoker.status().state==='smoking',null,8000);
 row(B.nm,'꾹 들이마시기(터치)',await hold(B,'[data-a=draw]')&&await until(B,()=>['exhale','smoking'].includes(window.lounge.smoker.status().state),null,4000),await seenB("['inhale','exhale'].includes(r.smoke)",6000));
 await until(B,()=>window.lounge.smoker.status().state==='smoking',null,10000);
 await tryPress(B,'[data-a=tricks]');
 row(B.nm,'묘기 프렌치',await tryPress(B,'[data-a=trick][data-k=french]')&&await until(B,()=>window.lounge.smoker.status().trick==='french',null,8000),await seenB("r.trick==='french'",10000));
 await until(B,()=>window.lounge.smoker.status().state==='smoking',null,10000);await tryPress(B,'[data-a=tricks]');
 row(B.nm,'재 털기',await tryPress(B,'[data-a=flick]')&&await until(B,()=>window.lounge.smoker.status().state==='flick',null,3000),await seenB("r.smoke==='flick'",6000));
 const ea0=await A.evaluate(()=>window.__emotes.length);
 row(B.nm,'⋯ 더 보기',await tryPress(B,'[data-a=more]')&&await until(B,()=>document.querySelector('.lg-dock .tools').classList.contains('open'),null,2000),null);
 await tryPress(B,'[data-a=emote][data-k=wave]');await tryPress(B,'[data-a=emote][data-k=wave]');
 row(B.nm,'인사 두 번',true,await until(A,n=>window.__emotes.length>=n+2,ea0,6000));
 await aim(B,'vending');
 row(B.nm,'자판기(캔커피)',await tryPress(B,'.sp-mark[data-k="vending:0"]')&&await until(B,()=>window.lounge.spots.status().can.held,null,20000),await seenB("r.act?.can===2",8000));
 await aim(B,'bench');
 row(B.nm,'벤치 걸터앉기',await tryPress(B,'.sp-mark[data-k="bench:0"]')&&await until(B,()=>window.lounge.spots.pose==='sit',null,25000),await seenB("r.pose==='sit'",8000));
 // 휴대폰 화면 사진: B는 앉아 캔·담배, A는 멀리 서 있음
 row(B.nm,'일어나기',await tryPress(B,'[data-sp=stand]')&&await until(B,()=>window.lounge.spots.pose==='stand',null,3000),await seenB("r.pose==='stand'",6000));

 // ── 같은 좌판을 동시에
 await A.evaluate(()=>{const L=window.lounge,s=L.rooftop.spots.benches[0].seat;L.spots.stand();L.teleport(s.x+.9,s.z+.9,0);});
 await B.evaluate(()=>{const L=window.lounge,s=L.rooftop.spots.benches[0].seat;L.spots.stand();L.teleport(s.x-.9,s.z+.9,0);});
 await sleep(1500);
 // 서로 상대 자리를 아직 모르는 '같은 순간'을 만든다: 두 화면에서 같은 칸(0번)을 바로 차지(spots.go와 같은 begin)
 await Promise.all([A,B].map(p=>p.evaluate(()=>{const L=window.lounge;window.__orig={s:L.multi.seatTaken,o:L.multi.occupied};L.multi.seatTaken=()=>false;L.multi.occupied=()=>false;L.spots.go('bench',0);})));
 await sleep(6000);
 const sa=await A.evaluate(()=>({me:window.lounge.spots.act(),notice:window.lounge.spots.status().notice})),sb=await B.evaluate(()=>({me:window.lounge.spots.act(),notice:window.lounge.spots.status().notice}));
 const key=a=>a.p==='sit'?`${a.b}:${a.s??0}`:null;
 const clash=key(sa.me)&&key(sa.me)===key(sb.me);
 const viewAB=await B.evaluate(id=>window.lounge.multi.status().people.find(x=>x.id===id)?.act,ida),viewBA=await A.evaluate(id=>window.lounge.multi.status().people.find(x=>x.id===id)?.act,idb);
 const same=key(viewAB??{})===key(sa.me)&&key(viewBA??{})===key(sb.me);
 row('둘 다','같은 좌판 동시',!clash,same,`A ${key(sa.me)??'서 있음'} · B ${key(sb.me)??'서 있음'}${sa.notice?.includes('다른 사람')||sb.notice?.includes('다른 사람')?' · 늦은 사람에게 안내':''}`);
 await Promise.all([A,B].map(p=>p.evaluate(()=>{const m=window.lounge.multi;m.seatTaken=window.__orig.s;m.occupied=window.__orig.o;})));

 // A를 앉혀 두고 시가에 불, 캔 든 채로 → PC 사진·나중에 온 C
 await A.evaluate(()=>{const L=window.lounge;if(L.spots.pose!=='sit'){L.spots.stand();L.spots.go('bench',1);}});
 await until(A,()=>window.lounge.spots.pose==='sit',null,25000);
 await tryPress(A,'[data-a=take]');await tryPress(A,'[data-a=kind][data-k=cigar]');await tryPress(A,'[data-a=light]');await until(A,()=>window.lounge.smoker.status().lit,null,8000);
 await A.evaluate(()=>window.lounge.spots.coffee());await until(A,()=>window.lounge.spots.status().can.held||window.lounge.spots.pose!=='sit',null,20000);
 if(await A.evaluate(()=>window.lounge.spots.pose!=='sit')){await A.evaluate(()=>window.lounge.spots.go('bench',1));await until(A,()=>window.lounge.spots.pose==='sit',null,25000);}
 // 사진: 둘 다 옥상 가운데에 마주 서서(담배·캔 든 채) 서로의 화면에 보이게. B가 인사하면 PC 화면에 B 머리 위 말풍선, A가 인사하면 휴대폰 화면에 A 말풍선
 await A.evaluate(()=>{const L=window.lounge,sp=L.rooftop.spots.spawn;L.spots.stand();L.teleport(sp.x,sp.z-.4,0);});
 await B.evaluate(()=>{const L=window.lounge,sp=L.rooftop.spots.spawn;L.spots.stand();L.teleport(sp.x+.5,sp.z-2.9,Math.PI);});
 await sleep(1500);
 for(const [P,id,shot,d] of [[A,idb,'pc.png',3.4],[B,ida,'phone.png',3.6]]){
  await P.bringToFront();await sleep(1500); // 뒤에 있던 창은 그리기가 멈춰 있다가 앞으로 오면 밀린 카메라 움직임이 돈다 — 다 돈 뒤에 사진 카메라를 놓는다
  await P.evaluate(([id,d])=>{const L=window.lounge,me=L.player,o=L.multi.status().people.find(x=>x.id===id);if(o?.x!=null)L.setCam({yaw:Math.atan2(-(o.x-me.x),-(o.z-me.z)),pitch:.22,dist:d});},[id,d]);
  await (P===A?B:A).evaluate(()=>document.querySelector('[data-a=emote][data-k=wave]')?.click());
  await sleep(1600);await P.screenshot({path:`${OUT}/${shot}`});
 }

 // ── 나중에 온 C
 const C=await open('나중폰',{touch:true});
 const sA=await state(A),sB=await state(B);
 const cA=await seenBy(C,ida,`r.pose==='${sA.pose}'&&r.lit===${sA.lit}&&r.kind==='${sA.kind}'&&r.outfit==='${sA.outfit}'&&r.can===${JSON.stringify(sA.can.held?'held':'none')}`,15000);
 const cB=await seenBy(C,idb,`r.pose==='${sB.pose}'&&r.lit===${sB.lit}&&r.kind==='${sB.kind}'&&r.can===${JSON.stringify(sB.can.held?'held':'none')}`,15000);
 row(C.nm,'나중 입장: A 지금 모습',null,cA,`A ${sA.pose}·${sA.kind}·불 ${sA.lit}·캔 ${sA.can.held}·${sA.outfit}`);
 row(C.nm,'나중 입장: B 지금 모습',null,cB,`B ${sB.pose}·${sB.kind}·불 ${sB.lit}·캔 ${sB.can.held}`);
 await C.bringToFront();await sleep(1000);
 await C.evaluate(id=>{const L=window.lounge,me=L.player,o=L.multi.status().people.find(x=>x.id===id);if(o?.x!=null)L.setCam({yaw:Math.atan2(-(o.x-me.x),-(o.z-me.z)),pitch:.3});},ida);
 await sleep(1500);await C.screenshot({path:`${OUT}/late.png`});

 // ── PC 단축키(같은 기능의 화면 단추는 위에서 눌렀음)
 await A.evaluate(()=>{const L=window.lounge;L.spots.stand();L.smoker.dispose?.();L.spots.dropCan();L.teleport(0,1.5,0);});await until(A,()=>window.lounge.smoker.status().state==='idle',null,8000);
 const key2=async(k,ms=80)=>{await A.keyboard.down(k);await sleep(ms);await A.keyboard.up(k);};
 await key2('Digit2');row(A.nm,'키 2(독한 맛)',await until(A,()=>window.lounge.smoker.status().kind==='strong'&&window.lounge.smoker.status().state!=='idle',null,3000),await seenA("r.kind==='strong'",6000));
 await key2('KeyF');row(A.nm,'키 F(불)',await until(A,()=>window.lounge.smoker.status().lit,null,6000),await seenA('r.lit===true',8000));
 await until(A,()=>window.lounge.smoker.status().state==='smoking',null,8000);
 await key2('Space',1000);row(A.nm,'키 Space 꾹',await until(A,()=>['exhale','smoking'].includes(window.lounge.smoker.status().state),null,3000),null);
 await until(A,()=>window.lounge.smoker.status().state==='smoking',null,10000);
 await key2('KeyT');row(A.nm,'키 T(프렌치)',await until(A,()=>window.lounge.smoker.status().trick==='french',null,8000),await seenA("r.trick==='french'",10000));
 await until(A,()=>window.lounge.smoker.status().state==='smoking',null,10000);
 await key2('KeyN');row(A.nm,'키 N(코로)',await until(A,()=>window.lounge.smoker.status().trick==='nose',null,8000),null);
 await until(A,()=>window.lounge.smoker.status().state==='smoking',null,10000);
 await key2('KeyR');row(A.nm,'키 R(링)',await until(A,()=>window.lounge.smoker.status().trick==='ring',null,8000),null);
 const errBefore=report.errors.length;await key2('KeyB');await key2('KeyG');await sleep(300);
 row(A.nm,'키 B·G(NPC 없음)',report.errors.length===errBefore,null,'NPC를 안 부른 옥상: 할 일 없음·오류 없음');
 await aim(A,'vending',{x:null});await A.evaluate(()=>{const L=window.lounge,v=L.rooftop.spots.vending;L.teleport(v.x,v.z+1,Math.PI);});await sleep(600);
 await key2('KeyE');row(A.nm,'키 E(가까운 할 일)',await until(A,()=>window.lounge.spots.status().can.dropping||window.lounge.spots.status().can.held,null,8000),await seenA('r.act?.can>=1',8000));
 await until(A,()=>window.lounge.spots.status().can.held&&!window.lounge.spots.status().can.sipping,null,8000);
 await key2('KeyC');row(A.nm,'키 C(한 모금)',await until(A,()=>window.lounge.spots.status().can.sipping,null,3000),null);
 await A.locator('canvas').first().click({position:{x:960,y:500}}).catch(()=>{});await key2('Enter');row(A.nm,'키 Enter(채팅 칸)',await until(A,()=>document.activeElement?.matches?.('.lg-form input'),null,2000),null);

 await C.ctx.close();await A.ctx.close();await B.ctx.close();
}catch(e){failed++;report.errors.push('스크립트: '+(e.stack??e.message));console.error(e);}
finally{
 report.failed=failed;report.serverLog=srvLog.split('\n').slice(-20);
 writeFileSync(`${OUT}/report.json`,JSON.stringify(report,null,1));
 await browser.close().catch(()=>{});await vite.close().catch(()=>{});srv.kill();
}
const errs=report.errors.filter(e=>!/스크립트/.test(e));
console.log(`\n실패 ${failed} · 페이지 오류 ${errs.length}${errs.length?'\n'+errs.slice(0,8).join('\n'):''}\n→ ${OUT}/report.json, pc.png, phone.png, late.png`);
process.exit(failed||errs.length?1:0);
