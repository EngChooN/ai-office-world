// 세 체험 공통 입장 흐름 점검(월드개발, 2026-11-19 입장 흐름 정리): 서버(MULTI_PORT 8798)·vite(PORT 5206)를 이 스크립트가 띄우고 끝나면 닫는다.
// 실제 사용자처럼 보이게 navigator.webdriver = false, 서버 주소는 공개 파일(multi-server.json)을 가로채 이 서버로 준다(주소창에 ?server 없음).
//  ① 주소로 처음: 등산은 산 고르기 → 공용 입장 창, 흡연장·크리스마스는 공용 입장 창 바로. 창이 한 번만 뜨고 고르면 그 서버에 들어감
//  ② 다시 방문(새로고침): 산 고르기·입장 창 없이 지난 서버로 바로
//  ③ 허브에서 이름·서버를 고르고 들어가기: 게임에서 산 고르기·입장 창 없이 그 서버로, 이름도 그대로
//  ④ 입장 화면 크기: 가로 667×375·812×375·915×412, 세로 390×844에서 잘리거나 겹치지 않음(넘치면 스크롤로 닿음) → 사진
//   node scripts/verify-entry-flow.mjs → artifacts/entry-flow/report.json, *.png   (PART=flow,layout 로 일부만)
import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {startServer} from '../server/multi-server.mjs';

const dir='artifacts/entry-flow',multiPort=Number(process.env.MULTI_PORT??8798);mkdirSync(dir,{recursive:true});
const PARTS=new Set((process.env.PART??'flow,layout').split(','));
const {createServer}=await import('vite');const port=Number(process.env.PORT??5206);
const vite=await createServer({server:{port,host:'127.0.0.1',strictPort:true,hmr:false,watch:null},logLevel:'warn'});await vite.listen();
const pageUrl=`http://127.0.0.1:${port}`,wsUrl=`ws://127.0.0.1:${multiPort}`;
const srv=startServer({PORT:String(multiPort),HOST:'127.0.0.1',DATA_DIR:`${dir}/data`,ALLOWED_ORIGINS:pageUrl},{quiet:true});await srv.ready;
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const out={at:new Date().toISOString(),checks:{},layout:{},errors:[]};let fail=false;
const check=(name,ok,detail={})=>{out.checks[name]={ok:!!ok,...detail};if(!ok)fail=true;console.log(ok?'통과':'실패',name,JSON.stringify(detail).slice(0,260));};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const until=async(fn,ms=20000,step=150)=>{const end=Date.now()+ms;while(Date.now()<end){try{if(await fn())return true;}catch{}await sleep(step);}return false;};
const GAMES=[{exp:'hiking',path:'/hiking/'},{exp:'smoking',path:'/smoking/'},{exp:'christmas',path:'/christmas/'}];
const health=async()=>(await fetch(`http://127.0.0.1:${multiPort}/health`)).json();
const count=async(exp,id)=>(await health()).servers?.[exp]?.find(s=>String(s.id)===id)?.count??0;
// 이 화면이 들어가 있는 방(서버 id)·이름·상태
const joinedOf=(p,exp)=>p.evaluate(()=>{const h=window.hiking?.multi?.();if(h)return {room:h.room,name:h.name,st:h.status};
 const x=window.xmas?.multi;if(x)return {room:x.room,name:x.name,st:x.state};
 const l=window.lounge?.multi;if(l){const s=l.status?.()??{};return {room:l.room??s.room,name:l.name??s.name,st:l.state??s.state};}return null;}).then(j=>j&&{...j,server:j.room?(String(j.room).match(/-(\d+)$/)?.[1]??'1'):null}); // 1서버 방은 끝 번호 없이(예전 방 키 그대로, 11-13)

async function newCtx(vp){
 const mobile=vp.width<1000;
 const ctx=await browser.newContext({viewport:vp,deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});
 await ctx.addInitScript(()=>{Object.defineProperty(Navigator.prototype,'webdriver',{get:()=>false});
  try{localStorage.setItem('gwanak-sound-enabled','false');localStorage.setItem('lounge.age',JSON.stringify({y:1990,ok:true,at:Date.now()}));}catch{}}); // 흡연장 19세 확인은 따로(법적 안내, 이 점검 밖)
 await ctx.route('**/multi-server.json*',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({state:'on',url:wsUrl})}));
 ctx.on('page',p=>{p.on('pageerror',e=>out.errors.push(`${p.url()}: ${e.message}`));});
 return ctx;
}
// 화면에 보이는 입장 화면들(산 고르기·공용 입장 창·흡연장 로비 카드)
const screens=p=>p.evaluate(()=>{const vis=el=>!!el&&!el.hidden&&getComputedStyle(el).display!=='none'&&el.getBoundingClientRect().width>0;
 const sp=[...document.querySelectorAll('.sp-wrap')].find(vis);
 return {mountain:vis(document.getElementById('mountain-pick'))&&!document.getElementById('mountain-pick').classList.contains('leaving'),entry:!!sp,mode:sp?.dataset.mode??null,lobby:vis(document.querySelector('.lg-sheet #lg-nick'))};});
// 일정 시간 동안 입장 화면이 한 번이라도 보였는지
async function watch(p,ms){const seen={mountain:false,entry:false,lobby:false};const end=Date.now()+ms;while(Date.now()<end){try{const s=await screens(p);for(const k of Object.keys(seen))seen[k]||=s[k];}catch{}await sleep(150);}return seen;}

if(PARTS.has('flow'))for(const g of GAMES){
 const ctx=await newCtx({width:1280,height:800}),p=await ctx.newPage();
 // ① 주소로 처음
 await p.goto(pageUrl+g.path);
 if(g.exp==='hiking'){
  const m=await until(async()=>(await screens(p)).mountain,60000);check(`${g.exp} ① 처음: 산 고르기가 보임`,m);
  await p.click('[data-pk-go]');
 }
 const e1=await until(async()=>(await screens(p)).entry,90000);
 const s1=await screens(p);check(`${g.exp} ① 처음: 공용 입장 창(전체 화면) 한 번, 로비 카드 없음`,e1&&s1.mode==='entry'&&!s1.lobby,s1);
 const name=`길손${g.exp.slice(0,2)}`;
 await p.fill('.sp-wrap:not([hidden]) .sp-name input',name);
 await until(async()=>p.evaluate(()=>!document.querySelector('.sp-wrap:not([hidden]) [data-sp-server="1"]')?.disabled),20000);
 const before=await count(g.exp,'1');
 await p.click('.sp-wrap:not([hidden]) [data-sp-server="1"]');
 check(`${g.exp} ① 고르면 1서버에 들어감`,await until(async()=>(await count(g.exp,'1'))>before,60000),{count:await count(g.exp,'1')});
 const again=await watch(p,2500);check(`${g.exp} ① 고른 뒤 입장 창이 다시 안 뜸`,!again.entry&&!again.mountain&&!again.lobby,again);
 // ② 다시 방문
 const c1=await count(g.exp,'1');
 await p.reload();
 const seen=await watch(p,g.exp==='hiking'?25000:15000);
 check(`${g.exp} ② 다시 방문: 산 고르기·입장 창·로비 없이 바로`,!seen.mountain&&!seen.entry&&!seen.lobby,seen);
 check(`${g.exp} ② 다시 방문: 지난 서버(1서버)에 들어가 있음·이름 그대로`,await until(async()=>{const j=await joinedOf(p,g.exp);return j?.server==='1'&&j.st==='online'&&j.name===name;},30000),{j:await joinedOf(p,g.exp)});
 await ctx.close();await sleep(1500);
}
// ③ 허브 → 게임
if(PARTS.has('flow'))for(const g of GAMES){
 const ctx=await newCtx({width:390,height:844}),p=await ctx.newPage(); // 대표가 쓰는 휴대폰 세로(허브 카드 목록)
 await p.goto(pageUrl+'/');await p.waitForSelector('#hub [data-open]');
 const name=`허브${g.exp.slice(0,2)}`;
 await p.click('[data-a=settings]');await p.fill('input[name=hb-name]',name);await p.click('[data-a=settings-close]');
 await p.click(`[data-open=${g.exp}]`);
 await until(async()=>p.evaluate(()=>!!document.querySelector('.hb-panel [data-srv="2"]:not([disabled])')),20000);
 await p.click('.hb-panel [data-srv="2"]');
 await p.waitForSelector('.hb-panel .hb-go[data-enter=server][data-server="2"]',{timeout:10000});
 const before=await count(g.exp,'2');
 await Promise.all([p.waitForNavigation({timeout:60000}),p.click('.hb-panel .hb-go[data-enter=server]')]);
 const seen=await watch(p,g.exp==='hiking'?25000:15000);
 check(`${g.exp} ③ 허브 → 게임: 산 고르기·입장 창·로비 없음`,!seen.mountain&&!seen.entry&&!seen.lobby,seen);
 check(`${g.exp} ③ 허브에서 고른 2서버에 들어감`,await until(async()=>(await count(g.exp,'2'))>before,40000),{count:await count(g.exp,'2')});
 check(`${g.exp} ③ 허브에서 정한 이름 그대로`,await until(async()=>(await joinedOf(p,g.exp))?.name===name,20000),{j:await joinedOf(p,g.exp)});
 await ctx.close();await sleep(1500);
}
// ④ 입장 화면 크기
const SIZES=[[667,375],[812,375],[915,412],[390,844]];
async function layoutOf(p,sel){
 return p.evaluate(sel=>{const root=document.querySelector(sel);if(!root)return null;
  const W=innerWidth,H=innerHeight,items=[...root.querySelectorAll('button,input,a,.sp-row,.pk-card')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(el).visibility!=='hidden';});
  // 스크롤 상자(넘치면 굴려서 닿는지)
  const scroller=el=>{for(let e=el.parentElement;e&&e!==document.documentElement;e=e.parentElement){const s=getComputedStyle(e);if(/(auto|scroll)/.test(s.overflowY+s.overflowX)&&(e.scrollHeight>e.clientHeight+1||e.scrollWidth>e.clientWidth+1))return e;}return null;};
  const bad=[],tiny=[];
  for(const el of items){const r=el.getBoundingClientRect(),inView=r.left>=-1&&r.top>=-1&&r.right<=W+1&&r.bottom<=H+1;
   if(!inView&&!scroller(el))bad.push({c:el.className||el.tagName,t:(el.textContent||el.name||'').trim().slice(0,16),r:[Math.round(r.left),Math.round(r.top),Math.round(r.right),Math.round(r.bottom)]});
   if((el.matches('button,input,a'))&&(r.height<40||r.width<40)&&!el.closest('.sp-row'))tiny.push({c:el.className,h:Math.round(r.height),w:Math.round(r.width)});}
  // 겹침: 누를 것끼리 4px 넘게 겹치면(안에 든 것 제외)
  const btn=items.filter(el=>el.matches('button,input,a'));const over=[];
  for(let i=0;i<btn.length;i++)for(let j=i+1;j<btn.length;j++){const a=btn[i],b=btn[j];if(a.contains(b)||b.contains(a))continue;const A=a.getBoundingClientRect(),B=b.getBoundingClientRect();
   const ox=Math.min(A.right,B.right)-Math.max(A.left,B.left),oy=Math.min(A.bottom,B.bottom)-Math.max(A.top,B.top);if(ox>4&&oy>4)over.push([(a.className||a.tagName).slice(0,20),(b.className||b.tagName).slice(0,20)]);}
  const docScroll=document.scrollingElement.scrollHeight>H+1;
  return {cut:bad,tiny,overlap:over,docScroll,items:items.length};},sel);
}
if(PARTS.has('layout'))for(const [w,h] of SIZES)for(const g of GAMES){
 const ctx=await newCtx({width:w,height:h}),p=await ctx.newPage();const tag=`${g.exp}-${w}x${h}`;
 await p.goto(pageUrl+g.path);
 if(g.exp==='hiking'){
  if(await until(async()=>(await screens(p)).mountain,60000)){await sleep(600);const L=await layoutOf(p,'#mountain-pick');out.layout[`${tag}-mountain`]=L;
   await p.screenshot({path:`${dir}/${tag}-mountain.png`});
   check(`④ ${tag} 산 고르기: 잘림·겹침 없음`,L&&!L.cut.length&&!L.overlap.length,{cut:L?.cut.slice(0,3),overlap:L?.overlap.slice(0,3)});
   await p.click('[data-pk-go]');}
 }
 if(await until(async()=>(await screens(p)).entry,90000)){await sleep(900);const L=await layoutOf(p,'.sp-wrap:not([hidden])');out.layout[`${tag}-entry`]=L;
  await p.screenshot({path:`${dir}/${tag}-entry.png`});
  check(`④ ${tag} 공용 입장 창: 잘림·겹침 없음`,L&&!L.cut.length&&!L.overlap.length,{cut:L?.cut.slice(0,3),overlap:L?.overlap.slice(0,3),tiny:L?.tiny.slice(0,3)});}
 else check(`④ ${tag} 공용 입장 창이 뜸`,false);
 await ctx.close();
}
check('페이지 오류 0',out.errors.length===0,{errors:out.errors.slice(0,5)});
writeFileSync(`${dir}/report.json`,JSON.stringify(out,null,1));
await browser.close();await vite.close();await srv.close?.();
console.log(fail?'\n실패 있음':'\n모두 통과',`→ ${dir}/report.json`);process.exit(fail?1:0);
