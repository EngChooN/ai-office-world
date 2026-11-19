// 접속 유도 1단계 화면 점검(월드개발, 2026-11-19): 서버(MULTI_PORT 8799)·vite(PORT 5207)를 이 스크립트가 띄우고 끝나면 닫는다.
// 실제 사용자처럼 navigator.webdriver = false, 서버 주소는 공개 파일(multi-server.json)을 가로채 이 서버로 준다. 휴대폰 세로 390×844 기준.
//  zero   ④ 허브 위 띠·카드, 공용 입장 창이 0명일 때 「첫 번째로 들어가 보세요」, 1명 이상이면 숫자
//  slow   ② 첫 /health가 4초 넘게 걸려도 빨간 「서버에 연결할 수 없어요」 없이 확인 중 → 서버 목록. 서버가 진짜 꺼졌으면 실패 화면
//  invite ① ☰ 메뉴 맨 위 「친구 부르기」(세 체험) → 공유 창에 지금 서버 주소. 받은 주소로 들어온 사람이 같은 서버. 공유가 없는 PC는 복사
//  spot   ③ 크리스마스 ?spot=sled·fight·rink·tree·sky → 그 시설 앞, 다른 사람 화면에도 같은 자리
//   node scripts/verify-growth-stage1.mjs → artifacts/growth-stage1/report.json, *.png   (PART=zero,slow,invite,spot 로 일부만)
import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {startServer} from '../server/multi-server.mjs';
import {travelSpots} from '../src/christmas/travel.js';

const dir='artifacts/growth-stage1',multiPort=Number(process.env.MULTI_PORT??8799);mkdirSync(dir,{recursive:true});
const PARTS=new Set((process.env.PART??'zero,slow,invite,spot').split(','));
const {createServer}=await import('vite');const port=Number(process.env.PORT??5207);
const vite=await createServer({server:{port,host:'127.0.0.1',strictPort:true,hmr:false,watch:null},logLevel:'warn'});await vite.listen();
const pageUrl=`http://127.0.0.1:${port}`,wsUrl=`ws://127.0.0.1:${multiPort}`;
const srv=startServer({PORT:String(multiPort),HOST:'127.0.0.1',DATA_DIR:`${dir}/data`,ALLOWED_ORIGINS:pageUrl},{quiet:true});await srv.ready;
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const out={at:new Date().toISOString(),checks:{},errors:[]};let fail=false;
const check=(name,ok,detail={})=>{out.checks[name]={ok:!!ok,...detail};if(!ok)fail=true;console.log(ok?'통과':'실패',name,JSON.stringify(detail).slice(0,300));};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const until=async(fn,ms=20000,step=150)=>{const end=Date.now()+ms;while(Date.now()<end){try{if(await fn())return true;}catch{}await sleep(step);}return false;};
const PHONE={width:390,height:844};

// healthDelay: 첫 /health 요청만 늦춤(ms), healthDown: /health를 늘 실패, share: 공유 창이 있는 기기(받은 값을 window.__shared에)
async function newCtx(vp=PHONE,{healthDelay=0,healthDown=false,share=true}={}){
 const mobile=vp.width<1000;
 const ctx=await browser.newContext({viewport:vp,deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});
 await ctx.addInitScript(({share})=>{Object.defineProperty(Navigator.prototype,'webdriver',{get:()=>false});
  try{localStorage.setItem('gwanak-sound-enabled','false');localStorage.setItem('lounge.age',JSON.stringify({y:1990,ok:true,at:Date.now()}));}catch{}
  window.__shared=[];window.__copied=[];
  if(share)Object.defineProperty(Navigator.prototype,'share',{configurable:true,value:async d=>{window.__shared.push(d);}});
  else Object.defineProperty(Navigator.prototype,'share',{configurable:true,value:undefined});
  try{Object.defineProperty(Navigator.prototype,'clipboard',{configurable:true,get:()=>({writeText:async s=>{window.__copied.push(s);}})});}catch{}
 },{share});
 await ctx.route('**/multi-server.json*',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({state:'on',url:wsUrl})}));
 if(healthDelay||healthDown){let n=0;await ctx.route(`http://127.0.0.1:${multiPort}/health*`,async r=>{
  if(healthDown)return r.abort('connectionrefused');
  if(n++===0)await sleep(healthDelay);
  try{await r.continue();}catch{}});}
 ctx.on('page',p=>{p.on('pageerror',e=>out.errors.push(`${p.url()}: ${e.message}`));});
 return ctx;
}
const entryOpen=p=>p.evaluate(()=>{const w=[...document.querySelectorAll('.sp-wrap')].find(el=>!el.hidden);return w?{net:w.dataset.net,text:w.querySelector('.sp-card')?.innerText??''}:null;});
const goEntry=async(p,path)=>{await p.goto(pageUrl+path);if(path.startsWith('/hiking/')){await p.waitForSelector('[data-pk-go]',{timeout:90000});await p.click('[data-pk-go]');}
 return until(async()=>!!(await entryOpen(p)),90000);};
const joinServer=async(p,id)=>{await until(async()=>p.evaluate(id=>!document.querySelector(`.sp-wrap:not([hidden]) [data-sp-server="${id}"]`)?.disabled,id),30000);await p.click(`.sp-wrap:not([hidden]) [data-sp-server="${id}"]`);};
const roomOf=p=>p.evaluate(()=>{const h=window.hiking?.multi?.();if(h)return {room:h.room,st:h.status};const x=window.xmas?.multi;if(x)return {room:x.room,st:x.state};
 const l=window.lounge?.multi;if(l){const s=l.status?.()??{};return {room:l.room??s.room,st:l.state??s.state};}return null;});
const health=async()=>(await fetch(`http://127.0.0.1:${multiPort}/health`)).json();

// ── ④ 0명
if(PARTS.has('zero')){
 const ctx=await newCtx(),p=await ctx.newPage();
 await p.goto(pageUrl+'/');await p.waitForSelector('#hub [data-open]');
 await until(async()=>p.evaluate(()=>!document.querySelector('[data-live=online] .hb-st-wait')),15000);
 const hub=await p.evaluate(()=>({top:document.querySelector('[data-live=online]')?.innerText.trim(),topHtml:document.querySelector('[data-live=online]')?.innerHTML??'',topVisible:getComputedStyle(document.querySelector('[data-live=online]')).visibility!=='hidden',cards:[...document.querySelectorAll('[data-live=st]')].map(e=>e.innerText.trim()),all:document.body.innerText}));
 await p.screenshot({path:`${dir}/zero-hub-390.png`});
 check('④ 허브 0명(휴대폰): 위 띠는 「0명」 대신 숨김(카드가 「첫 번째로 들어가 보세요」)',!hub.topVisible&&hub.topHtml.includes('첫 번째로 들어가 보세요'),{top:hub.top,visible:hub.topVisible});
 check('④ 허브 0명: 카드에 「0명」·「아무도 없어요」 없음',!/아무도 없어요/.test(hub.all)&&!/(^|\s)0명/.test(hub.top)&&hub.cards.length>0&&hub.cards.every(c=>c==='첫 번째로 들어가 보세요'),{cards:hub.cards});
 {const pc=await (await newCtx({width:1280,height:800})).newPage();await pc.goto(pageUrl+'/');await pc.waitForSelector('#hub [data-live=online]');
  await until(async()=>pc.evaluate(()=>!document.querySelector('[data-live=online] .hb-st-wait')),15000);
  const t=await pc.evaluate(()=>document.querySelector('[data-live=online]')?.innerText.trim());await pc.screenshot({path:`${dir}/zero-hub-pc.png`});
  check('④ 허브 0명(PC): 위 띠 「첫 번째로 들어가 보세요」',t==='첫 번째로 들어가 보세요',{top:t});await pc.context().close();}
 await goEntry(p,'/christmas/');
 await until(async()=>(await entryOpen(p))?.net==='ok',20000);await sleep(400);
 const e=await entryOpen(p);await p.screenshot({path:`${dir}/zero-entry-christmas-390.png`});
 check('④ 입장 창 0명: 「첫 번째로 들어가 보세요」, 「지금 접속 0명」 없음',/첫 번째로 들어가 보세요/.test(e.text)&&!/지금 접속\s*0/.test(e.text),{text:e.text.slice(0,120)});
 // 1명 들어온 뒤: 숫자
 const q=await (await newCtx()).newPage();await goEntry(q,'/christmas/');await joinServer(q,'1');
 await until(async()=>(await health()).servers?.christmas?.[0]?.count>=1,30000);
 await p.goto(pageUrl+'/');await p.waitForSelector('#hub [data-open]');
 const one=await until(async()=>/1명/.test(await p.evaluate(()=>document.querySelector('[data-live=online]')?.innerText??'')),15000);
 check('④ 1명 이상이면 허브 위 띠에 숫자(1명 지금 접속 중)',one,{top:await p.evaluate(()=>document.querySelector('[data-live=online]')?.innerText.trim())});
 await p.screenshot({path:`${dir}/one-hub-390.png`});
 await q.context().close();await ctx.close();await sleep(1200);
}
// ── ② 느린 첫 확인
if(PARTS.has('slow')){
 const ctx=await newCtx(PHONE,{healthDelay:5500}),p=await ctx.newPage();
 await goEntry(p,'/christmas/');
 const seen=[];const end=Date.now()+16000;let shot=false;
 while(Date.now()<end){const e=await entryOpen(p).catch(()=>null);if(e){seen.push(e.net);if(!shot&&/확인하고 있어요/.test(e.text)){await p.screenshot({path:`${dir}/slow-checking-christmas-390.png`});shot=true;}
  if(e.net==='ok')break;}await sleep(250);}
 const e=await entryOpen(p);await p.screenshot({path:`${dir}/slow-after-christmas-390.png`});
 check('② 첫 확인이 5.5초 걸려도 빨간 실패 화면이 한 번도 안 보임',!seen.includes('error'),{seen:[...new Set(seen)]});
 check('② 그동안 「서버를 확인하고 있어요」 안내',shot);
 check('② 다시 받아서 서버 목록이 보임',e?.net==='ok'&&/눈마을 광장 1서버/.test(e.text),{net:e?.net});
 await ctx.close();
 const c2=await newCtx(PHONE,{healthDown:true}),p2=await c2.newPage();await goEntry(p2,'/christmas/');
 const down=await until(async()=>(await entryOpen(p2))?.net==='error',20000);
 check('② 서버가 진짜 꺼졌으면 지금처럼 「서버에 연결할 수 없어요」',down&&/서버에 연결할 수 없어요/.test((await entryOpen(p2)).text));
 await p2.screenshot({path:`${dir}/down-christmas-390.png`});await c2.close();
}
// ── ① 친구 부르기
// 흡연장은 처음 들어오면 상황 고르기로 메뉴가 저절로 열려 있다(spots.js askScene) → 열려 있으면 그대로
const openInvite=async p=>{if(!(await p.evaluate(()=>document.querySelector('.uf-sheet')?.hidden===false)))await p.click('.uf-menu-btn');await p.waitForSelector('.uf-sheet:not([hidden]) .uf-invite',{timeout:10000});};
if(PARTS.has('invite'))for(const g of [{exp:'christmas',path:'/christmas/',srv:'2',room:'눈마을-2'},{exp:'smoking',path:'/smoking/',srv:'3',room:'옥상-3'},{exp:'hiking',path:'/hiking/',srv:'2',room:'관악산-2'}]){
 const ctx=await newCtx(),p=await ctx.newPage();
 await goEntry(p,g.path);await joinServer(p,g.srv);
 await until(async()=>(await roomOf(p))?.st==='online',60000);
 await until(async()=>p.evaluate(()=>!!document.querySelector('.uf-menu-btn')),60000);await sleep(800);
 await openInvite(p);
 const sub=await p.evaluate(()=>document.querySelector('.uf-invite small')?.innerText);
 await p.screenshot({path:`${dir}/invite-menu-${g.exp}-390.png`});
 const box=await p.evaluate(()=>{const r=document.querySelector('.uf-invite').getBoundingClientRect();return {h:Math.round(r.height),top:Math.round(r.top),bottom:Math.round(r.bottom),H:innerHeight};});
 check(`① ${g.exp} 메뉴 맨 위 「친구 부르기」(48px 이상·화면 안)`,box.h>=48&&box.top>=0&&box.bottom<=box.H,{box,sub});
 await p.click('.uf-invite');
 await until(async()=>(await p.evaluate(()=>window.__shared.length))>0,5000);
 const sh=(await p.evaluate(()=>window.__shared))[0];const u=sh?new URL(sh.url):null;
 check(`① ${g.exp} 공유 창에 지금 서버 주소(${g.room})·꼬리표, 이름·서버 주소 없음`,u&&u.pathname.endsWith(g.path)&&u.searchParams.get('multi')===g.room&&u.searchParams.get('utm_source')==='invite'&&!u.searchParams.has('server')&&!u.searchParams.has('name'),{url:sh?.url,text:sh?.text});
 // 받은 사람: 그 주소로 들어오면 같은 서버
 const before=(await health()).servers?.[g.exp]?.find(s=>s.id===g.srv)?.count??0;
 const c2=await newCtx(),q=await c2.newPage();await q.goto(sh.url);
 if(g.exp==='hiking'){await q.waitForSelector('[data-pk-go]',{timeout:90000});await q.click('[data-pk-go]');}
 const same=await until(async()=>((await health()).servers?.[g.exp]?.find(s=>s.id===g.srv)?.count??0)>before,90000);
 check(`① ${g.exp} 받은 주소로 들어온 사람이 같은 서버(${g.srv}서버)`,same,{count:(await health()).servers?.[g.exp]});
 await c2.close();await ctx.close();await sleep(1200);
}
if(PARTS.has('invite')){ // 혼자 하기 + 공유 창이 없는 PC: 체험 주소만 복사
 const ctx=await newCtx({width:1280,height:800},{share:false}),p=await ctx.newPage();
 await goEntry(p,'/christmas/');await p.click('.sp-wrap:not([hidden]) .sp-solo');
 await until(async()=>p.evaluate(()=>!!document.querySelector('.uf-menu-btn')),60000);await sleep(600);
 await openInvite(p);await p.click('.uf-invite');
 await until(async()=>(await p.evaluate(()=>window.__copied.length))>0,5000);
 const c=(await p.evaluate(()=>window.__copied))[0]??'',url=c.split(' ').pop(),sub=await p.evaluate(()=>document.querySelector('.uf-invite small')?.innerText);
 await p.screenshot({path:`${dir}/invite-copied-christmas-pc.png`});
 check('① 혼자 하기 중·공유 창 없는 PC: ?multi 없이 체험 주소를 복사하고 「복사했어요」',url.includes('/christmas/?utm_source=invite')&&!url.includes('multi=')&&/복사했어요/.test(sub),{copied:c,sub});
 await ctx.close();
}
// ── ③ 장면 바로가기
if(PARTS.has('spot')){
 const spots=travelSpots({carousel:true,rink:true,sky:true});
 for(const id of ['sled','fight','rink','tree','sky']){
  const s=spots.find(x=>x.id===id),ctx=await newCtx(),p=await ctx.newPage();
  await goEntry(p,`/christmas/?spot=${id}`);await p.click('.sp-wrap:not([hidden]) .sp-solo');
  await until(async()=>p.evaluate(()=>!!window.xmas?.status),60000);await sleep(1500);
  const me=(await p.evaluate(()=>window.xmas.status().player));const d=Math.hypot(me.x-s.x,me.z-s.z);
  if(id==='sled'||id==='rink')await p.screenshot({path:`${dir}/spot-${id}-390.png`});
  check(`③ ?spot=${id} → ${s.label} 앞(1m 안)`,d<1,{me,want:{x:s.x,z:s.z},d:+d.toFixed(2)});
  await ctx.close();
 }
 // 다른 사람 화면에도 같은 자리: A는 ?spot=sled&multi=눈마을-3, B는 같은 서버
 const s=spots.find(x=>x.id==='sled');
 const ca=await newCtx(),a=await ca.newPage();await a.goto(`${pageUrl}/christmas/?spot=sled&multi=눈마을-3`);
 await until(async()=>(await roomOf(a))?.st==='online',60000);
 const cb=await newCtx(),b=await cb.newPage();await b.goto(`${pageUrl}/christmas/?multi=눈마을-3`);
 await until(async()=>(await roomOf(b))?.st==='online',60000);
 const ok=await until(async()=>{const ps=await b.evaluate(()=>window.xmas.multi.people().map(p=>p.sample));return ps.some(q=>q&&Math.hypot(q.x-s.x,q.z-s.z)<1.5);},30000);
 check('③ 다른 사람 화면에도 썰매 출발대 앞에 보임',ok,{people:await b.evaluate(()=>window.xmas.multi.people().map(p=>p.sample&&{x:+p.sample.x.toFixed(1),z:+p.sample.z.toFixed(1)}))});
 await ca.close();await cb.close();
}
check('페이지 오류 0',out.errors.length===0,{errors:out.errors.slice(0,5)});
writeFileSync(`${dir}/report.json`,JSON.stringify(out,null,1));
await browser.close();await vite.close();await srv.close?.();
console.log(fail?'\n실패 있음':'\n모두 통과',`→ ${dir}/report.json`);process.exit(fail?1:0);
