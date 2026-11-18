// 넓힌 광장 달리기·바로가기 지도 점검(월드개발, 2026-11-17 5차): 서버(MULTI_PORT 8797)·vite(PORT 5193)를 이 스크립트가 띄우고 끝나면 닫는다.
// 기본 화면(11-17부터 시안 B, 주소 옵션 없음) PC '하나' 1920×1080 + 휴대폰 '둘' 390×844 + 예전 화면(?look=classic) PC '셋'.
//  ① 달리기: PC Shift = 걷기 × TRAVEL.runMul, 상대 화면에 달리는 몸 · 휴대폰 「달리기」 단추 켜기/끄기 · 링크·회전목마·모닥불에서 자동 해제(단추 흐림)
//  ② 지도: 단추로 열기·핀 10개·다른 사람 점 · 놀이 자리 9곳 이동(그 자리 단추가 뜸 + 상대 화면·서버도 그 자리) · 타는 중이면 먼저 내리고 이동
//  ③ 달리기로 들어가도 놀이 판정 그대로(모닥불 앉기·눈싸움 마당 던지기 서버 수락) · ④ 시안 없는 화면에는 단추 없음 · 페이지 오류 0
//   node scripts/verify-christmas-travel.mjs → artifacts/christmas-travel/*.png, report.json
import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {startServer} from '../server/multi-server.mjs';
import {TRAVEL} from '../src/christmas/travel.js';
import {WALK_SPEED} from '../src/lounge/avatar.js';

const dir='artifacts/christmas-travel',multiPort=Number(process.env.MULTI_PORT??8797),room='눈마을-3';mkdirSync(dir,{recursive:true});
const {createServer}=await import('vite');const port=Number(process.env.PORT??5193);
const vite=await createServer({server:{port,host:'127.0.0.1',strictPort:true,hmr:false,watch:null},logLevel:'warn'});await vite.listen();
const pageUrl=`http://127.0.0.1:${port}`,wsUrl=`ws://127.0.0.1:${multiPort}`;
const srv=startServer({PORT:String(multiPort),HOST:'127.0.0.1',DATA_DIR:`${dir}/data`},{quiet:true});await srv.ready;
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const out={at:new Date().toISOString(),checks:{},errors:[]};let fail=false;
const check=(name,ok,detail={})=>{out.checks[name]={ok:!!ok,...detail};if(!ok)fail=true;console.log(ok?'통과':'실패',name,JSON.stringify(detail).slice(0,300));};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const until=async(fn,ms=15000,step=120)=>{const end=Date.now()+ms;while(Date.now()<end){try{if(await fn())return true;}catch{}await sleep(step);}return false;};
async function open(name,vp,look=null){
 const mobile=vp.width<900;
 const ctx=await browser.newContext({viewport:vp,deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});
 await ctx.addInitScript(()=>{localStorage.clear();localStorage.setItem('xmas-world:v1',JSON.stringify({look:{outfit:'santa'},wardrobe:[],tip:true,zones:['fight','snowman','sled','fire']}));});
 const p=await ctx.newPage();p.label=name;p.mobile=mobile;
 p.on('pageerror',e=>out.errors.push(`${name}: ${e.message}`));
 p.on('console',m=>{if(m.type()==='error'&&!/WebSocket connection|favicon|ERR_CONNECTION_REFUSED|Failed to load resource/.test(m.text()))out.errors.push(`${name}: ${m.text()}`);});
 await p.goto(`${pageUrl}/christmas/?capture=1&multi=${encodeURIComponent(room)}&server=${encodeURIComponent(wsUrl)}&name=${encodeURIComponent(name)}${look?`&look=${look}`:''}`);
 await p.waitForFunction(()=>window.xmas?.multi?.state==='online',null,{timeout:120000});
 return p;
}
const st=p=>p.evaluate(()=>window.xmas.status());
const tap=async(p,sel)=>{await p.waitForSelector(sel,{state:'visible',timeout:5000});if(p.mobile)await p.tap(sel);else await p.click(sel);};
const shot=(p,n)=>p.screenshot({path:`${dir}/${n}.png`});
// 그 자리 앞에서 떠야 하는 단추
const EXPECT={tree:'tree:deco',fire:'fire:sit',mailbox:'gift:send',snowman:'snow:make',fight:'sb:pack',carousel:'mg:ride',rink:'rk:in',gondola:'gd:up',sled:'sled:board'};
let A,B,C;
try{
 A=await open('하나',{width:1920,height:1080});B=await open('둘',{width:390,height:844});
 const idA=(await st(A)).multi.id;
 await until(async()=>(await st(A)).multi.people.length>=1&&(await st(B)).multi.people.length>=1,15000);
 // ① 달리기 — PC Shift
 {const s0=await st(A);check('PC: 달리기 단추·지도 단추가 있음',!!s0.travel&&await A.$('.xt-run')&&await A.$('.xt-map-btn'),{travel:s0.travel});}
 await A.evaluate(()=>{const x=window.xmas;x.teleport(0,12,0);x.cam.yaw=0;});await sleep(300);
 async function speedOf(p,keys){await p.keyboard.down('KeyW');for(const k of keys)await p.keyboard.down(k);await sleep(500);
  const a=await p.evaluate(()=>({x:window.xmas.player.x,z:window.xmas.player.z,t:performance.now()}));await sleep(1000);
  const b=await p.evaluate(()=>({x:window.xmas.player.x,z:window.xmas.player.z,t:performance.now(),run:window.xmas.player.running}));
  for(const k of keys)await p.keyboard.up(k);await p.keyboard.up('KeyW');return {v:Math.hypot(b.x-a.x,b.z-a.z)/((b.t-a.t)/1000),run:b.run};}
 const walk=await speedOf(A,[]);await A.evaluate(()=>window.xmas.teleport(0,12,0));await sleep(200);
 // 상대 화면에서 달리는 몸: 달리는 동안 B 화면 A 몸 running
 await A.keyboard.down('KeyW');await A.keyboard.down('ShiftLeft');
 const seenRun=await until(()=>B.evaluate(id=>!!window.xmas.multi.headOf(id)?.avatar?.running,idA),4000,100);
 await A.keyboard.up('ShiftLeft');await A.keyboard.up('KeyW');
 await A.evaluate(()=>window.xmas.teleport(0,12,0));await sleep(200);
 const run=await speedOf(A,['ShiftLeft']);
 check('PC Shift 달리기 = 걷기 × 약 '+TRAVEL.runMul,run.run&&Math.abs(run.v/walk.v-TRAVEL.runMul)<.12&&Math.abs(walk.v-WALK_SPEED)<.15,{walk:+walk.v.toFixed(2),run:+run.v.toFixed(2),ratio:+(run.v/walk.v).toFixed(2)});
 check('상대(휴대폰) 화면에 달리는 몸',seenRun);
 // 휴대폰 「달리기」 단추
 await B.evaluate(()=>{const x=window.xmas;x.teleport(0,12,0);x.cam.yaw=0;});await sleep(300);
 await tap(B,'.xt-run');await sleep(150);
 {const s=await st(B);check('휴대폰 「달리기」 누르면 켜짐',s.travel.run&&await B.$eval('.xt-run',e=>e.getAttribute('aria-pressed'))==='true',{t:s.travel});}
 const runB=await speedOf(B,[]);check('휴대폰 달리기 켠 채 걸으면 달림',runB.run&&runB.v>WALK_SPEED*1.4,{v:+runB.v.toFixed(2)});
 await B.evaluate(()=>window.xmas.teleport(0,12,0));await sleep(300);await shot(B,'mobile-run');
 // 자동 해제: 링크·회전목마·모닥불
 await B.evaluate(()=>{window.xmas.rink.goTo();window.xmas.doAction('rk:in');});await sleep(400);
 {const s=await st(B);check('링크에 들어가면 달리기 자동 해제(단추 흐림)',s.rink.inside&&!s.travel.run&&s.travel.runBlocked,{t:s.travel});}
 await B.evaluate(()=>window.xmas.doAction('rk:out'));await sleep(400);
 {const s=await st(B);check('나오면 다시 켤 수 있음(꺼진 채)',!s.travel.runBlocked&&!s.travel.run,{t:s.travel});}
 await tap(B,'.xt-run');await B.evaluate(()=>{window.xmas.carousel.goTo();window.xmas.doAction('mg:ride');});await sleep(400);
 {const s=await st(B);check('회전목마 타면 달리기 자동 해제',s.carousel.riding&&!s.travel.run&&s.travel.runBlocked,{t:s.travel});}
 await B.evaluate(()=>window.xmas.doAction('mg:off'));await sleep(300);
 await A.keyboard.down('ShiftLeft');await A.evaluate(()=>{const x=window.xmas;x.travelTo('fire');});await sleep(1000);
 {const s=await st(A);check('Shift로 달리던 채 모닥불 앞 → 「앉기」 그대로',s.actions.includes('fire:sit'),{a:s.actions});}
 await A.evaluate(()=>window.xmas.doAction('fire:sit'));await until(async()=>(await st(A)).fire.sitting,5000);
 {const s=await st(A);check('달리기 눌린 채 앉으면 달리기 막힘',s.player.sitting&&s.travel.runBlocked,{t:s.travel,p:s.player});}
 await A.keyboard.up('ShiftLeft');
 // ② 지도
 await tap(B,'.xt-map-btn');await sleep(500);
 {const s=await st(B);check('휴대폰: 지도 단추 → 지도 창·핀 11개(하늘 썰매 포함)·다른 사람 점',s.travel.open&&s.travel.pins.length===11&&s.travel.pins.includes('sky')&&s.travel.dots>=1,{t:s.travel});}
 await shot(B,'mobile-map');
 // 앉아 있는 A가 지도에서 트리로 → 먼저 일어나고 이동
 await tap(A,'.xt-map-btn');await sleep(400);await shot(A,'pc-map');
 await tap(A,'.xt-pin[data-go="tree"]');await sleep(1100);
 {const s=await st(A);check('앉아 있다가 지도로 가면 먼저 일어나서 트리 앞',!s.player.sitting&&s.actions.includes('tree:deco')&&!s.travel.open,{p:s.player,a:s.actions});}
 // 놀이 자리 9곳 이동(PC는 핀 클릭, 휴대폰은 핀 탭) + 상대 화면에서도 그 자리
 const spots=await A.evaluate(()=>window.xmas.travel.spots.map(s=>({id:s.id,x:s.x,z:s.z})));
 for(const [i,sp] of spots.filter(s=>EXPECT[s.id]).entries()){
  const p=i%2?B:A,q=p===A?B:A,id=(await st(p)).multi.id;
  await sleep(TRAVEL.gapMs+100);
  if(!(await st(p)).travel.open)await tap(p,'.xt-map-btn');await sleep(250);await tap(p,`.xt-pin[data-go="${sp.id}"]`);
  const arrived=await until(async()=>{const s=await st(p);return Math.hypot(s.player.x-sp.x,s.player.z-sp.z)<.8&&s.actions.includes(EXPECT[sp.id]);},4000);
  const s=await st(p);
  const seen=await until(()=>q.evaluate(([id,x,z])=>{const r=window.xmas.multi.people().find(o=>o.id===id);return r?.sample&&Math.hypot(r.sample.x-x,r.sample.z-z)<1.5;},[id,s.player.x,s.player.z]),5000);
  check(`${p.label}: 지도 → ${sp.id} 앞(「${EXPECT[sp.id]}」 단추) · 상대·서버도 그 자리`,arrived&&seen,{p:s.player,a:s.actions,seen});
  if(sp.id==='fight'){ // 달려 들어간 눈싸움 마당에서 던지기가 서버에 받아들여짐
   const a0=(await p.evaluate(()=>window.xmas.snowfight.status())).ammo;
   await p.evaluate(()=>window.xmas.doAction('sb:pack'));await sleep(1400);
   const got=await p.evaluate(()=>window.xmas.snowfight.status());
   check(`${p.label}: 눈싸움 마당에서 눈 뭉치기(마당 판정 그대로)`,got.inYard&&got.ammo>=Math.min(a0+1,3),{a0,ammo:got.ammo,inYard:got.inYard});
  }
 }
 // 타는 중 → 먼저 내리고 이동: 회전목마
 await sleep(TRAVEL.gapMs+100);await A.evaluate(()=>{window.xmas.carousel.goTo();window.xmas.doAction('mg:ride');});await sleep(400);
 await A.evaluate(()=>window.xmas.travelTo('entrance'));await sleep(1000);
 {const s=await st(A);check('회전목마 타던 중 지도 → 내리고 입구로',!s.carousel.riding&&s.player.z>15,{c:s.carousel,p:s.player});}
 await sleep(TRAVEL.gapMs+100);await A.evaluate(()=>{window.xmas.rink.goTo();window.xmas.doAction('rk:in');});await sleep(300);
 await A.evaluate(()=>window.xmas.travelTo('tree'));await sleep(1000);
 {const s=await st(A);check('링크 안에서 지도 → 링크 나오고 트리 앞(얼음 아님)',!s.rink.inside&&!s.rink.onIce&&s.actions.includes('tree:deco'),{r:s.rink});}
 // ④ 시안 없는 화면
 C=await open('셋',{width:1280,height:800},'classic');
 {const s=await st(C);check('시안 없는 화면: 달리기·지도 단추 없음',!s.travel&&!(await C.$('.xt-run'))&&!(await C.$('.xt-map-btn')),{t:s.travel});}
}catch(e){check('예외 없음',false,{e:String(e.stack??e).slice(0,500)});}
check('페이지 오류 0',out.errors.length===0,{errors:out.errors.slice(0,5)});
writeFileSync(`${dir}/report.json`,JSON.stringify(out,null,1));
await browser.close();await vite.close();await srv.close?.();
process.exit(fail?1:0);
