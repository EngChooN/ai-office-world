// 4단계 진단용(동행 점검 ① 이름표 누름). verify-pair-walk.mjs 앞부분 복사
// 같이 등산하기(동행) 두 브라우저 확인(2026-11-08 기획서 A).
// 로컬 함께 걷기 서버(MULTI_PORT, 기본 8791)와 vite(PORT, 기본 5201)를 이 스크립트가 띄우고, 서로 다른 브라우저 컨텍스트 2개(A 산타는곰·B 바위다람쥐)로 붙는다.
//  ① 이름표 누르기 → 고르기 카드, 👥 목록
//  ② 거절 → "○○님이 지금은 어렵대요", 60초 재제안 막기(화면·서버 둘 다)
//  ③ 30초 만료(저절로 거절)
//  ④ 제안 → 수락 → 동행 칩, 겹친 자리에서 밀어내기, 자동 걷기 나란히(두 몸 거리 0.8m 이상·길 밖으로 안 감·서버 순간이동 거부 0)
//  ⑤ 동행 끝내기  ⑥ 끊김: 다시 이어 붙기(resume) · 60초 유예 뒤 해제
// 캡처: 세로 390×844·가로 844×390·PC 1920×1080에서 제안 카드·기다리는 중 칩·동행 칩·목록·고르기 카드, 동행 칩 낮·노을·밤.
//   node scripts/verify-pair-walk.mjs   → artifacts/pair-walk-2026-11-08/ (캡처·report.json). 실패가 있으면 종료 코드 1. 4분쯤 걸림(30초·60초 규칙을 실제 시간으로 기다림).
import {waitChunks} from '../../../scripts/lib/chunk-wait.mjs';
import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {startServer} from '../../../server/multi-server.mjs';
import {route,sample,isStairs} from '../../../src/route.js';
// 좌우 시험 자리: 40m 동안 길 폭 1.8m 이상·계단 아님(앞뒤 시험은 출발 자리 ?start=demo의 계단 구간)
const WIDE_S=(()=>{for(let s=600;s<route.length-300;s+=5){let ok=true;for(let t=s;t<=s+40;t++){const p=sample(t);if(!(p.width>=1.8)||isStairs(p.material)){ok=false;break;}}if(ok)return s;}return null;})();

const dir='artifacts/pair-walk-2026-11-08',multiPort=Number(process.env.MULTI_PORT??8791),room='동행시험';mkdirSync(dir,{recursive:true});
let vite=null,pageUrl=process.env.PAGE_URL;
if(!pageUrl){const {createServer}=await import('vite');const port=Number(process.env.PORT??5201);vite=await createServer({server:{port,host:'127.0.0.1',strictPort:true,hmr:false},logLevel:'warn'});await vite.listen();pageUrl=`http://127.0.0.1:${port}`;}
const srv=startServer({PORT:String(multiPort),HOST:'127.0.0.1',DATA_DIR:`${dir}/data`},{quiet:true});await srv.ready;
const wsUrl=`ws://127.0.0.1:${multiPort}`;
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const out={at:new Date().toISOString(),pageUrl,wsUrl,room,steps:[],errors:[],result:{},samples:[]},log=(k,v={})=>{out.steps.push({k,...v,t:Date.now()});console.log(k,JSON.stringify(v).slice(0,300));};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let fail=false;
const check=(name,ok,detail={})=>{out.result[name]={ok:!!ok,...detail};log(`${ok?'통과':'실패'} ${name}`,detail);if(!ok)fail=true;return ok;};

function recorder(){
 window.__wsIn=[];window.__notes=[];window.__pairState=null;
 const W=window.WebSocket;window.WebSocket=class extends W{constructor(...a){super(...a);this.addEventListener('message',e=>{try{const m=JSON.parse(e.data);if(typeof m.t==='string'&&m.t.startsWith('pair:'))window.__wsIn.push(m);}catch{}});}};
 addEventListener('hiking:pair-note',e=>window.__notes.push({...e.detail,at:Date.now()}));
 addEventListener('hiking:pair-state',e=>{window.__pairState=e.detail;});
 addEventListener('hiking:state',e=>{window.__off=e.detail?.offTrail;});
}
async function open(name){
 const ctx=await browser.newContext({viewport:{width:1280,height:760},deviceScaleFactor:1});
 await ctx.addInitScript(()=>{localStorage.clear();localStorage.setItem('gwanak-sound-enabled','false');});
 await ctx.addInitScript(recorder);
 const p=await ctx.newPage();p.label=name;p.ctx=ctx;
 p.on('pageerror',e=>out.errors.push(`${name}: ${e.message}`));
 p.on('console',m=>{if(m.type()==='error'&&!/WebSocket connection|favicon|ERR_CONNECTION/.test(m.text()))out.errors.push(`${name}: ${m.text()}`);});
 await p.goto(`${pageUrl}/hiking/?multi=${encodeURIComponent(room)}&name=${encodeURIComponent(name)}&server=${encodeURIComponent(wsUrl)}&start=demo&time=13:00&weather=clear&quality=balanced`);
 await p.waitForFunction(()=>window.hiking?.started&&window.hiking?.multi?.()?.status==='online',null,{timeout:180000});
 return p;
}
const diag=p=>p.evaluate(()=>({pwBtn:!!document.querySelector('.pw-btn'),pwBtnHidden:document.querySelector('.pw-btn')?.hidden,pick:document.querySelector('.pw-pick')?.hidden,offer:document.querySelector('.pw-offer')?.hidden,chip:document.querySelector('.pw-chip')?.hidden,notes:window.__notes?.slice(-4),pairState:window.__pairState,pair:hiking.multi()?.pair,status:hiking.multi()?.status,top:(()=>{const t=document.querySelector('.multi-tag[data-kind=name] .multi-tag-name');if(!t)return null;const r=t.getBoundingClientRect();const e=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return e?`${e.tagName}.${e.className}`:null;})()}));
const waitFor=(p,fn,arg,ms=15000)=>p.waitForFunction(fn,arg,{timeout:ms,polling:100}).catch(async e=>{try{log(`진단 ${p.label}`,await diag(p));}catch{}throw e;});
const shot=async(p,name)=>{await p.screenshot({path:`${dir}/${name}.png`});out.steps.push({k:'캡처',name});};
const VIEWS=[['세로',390,844],['가로',844,390],['PC',1920,1080]];
async function shots3(p,name){for(const [label,w,h] of VIEWS){await p.setViewportSize({width:w,height:h});await sleep(500);await shot(p,`${name}-${label}-${w}x${h}`);}await p.setViewportSize({width:1280,height:760});await sleep(200);}
const id=p=>p.evaluate(()=>hiking.multi().id);
const notes=p=>p.evaluate(()=>window.__notes);
const pairOf=p=>p.evaluate(()=>hiking.multi().pair);
const pos=p=>p.evaluate(()=>({...hiking.position(),off:!!window.__off}));
const fire=(p,type,detail)=>p.evaluate(([t,d])=>dispatchEvent(new CustomEvent(t,d===undefined?undefined:{detail:d})),[type,detail]);
const lastNote=async(p,code)=>(await notes(p)).filter(n=>!code||n.code===code).at(-1)??null;

const A=await open('산타는곰'),B=await open('바위다람쥐');
try{
 await waitFor(A,()=>hiking.multi().roster.length>=1,null,30000);await waitFor(B,()=>hiking.multi().roster.length>=1,null,30000);
 const idA=await id(A),idB=await id(B);log('접속',{idA,idB});
 // 둘 다 같은 자리(545m 구간)에서 시작한다. ①을 위해 B를 4m 앞에 둔다.
 const pa=await pos(A);log('A 자리',pa);
 // A는 3인칭(1인칭에서는 오르막 4m 앞 이름표가 화면 위로 벗어날 수 있음), B는 1인칭 그대로.
 await A.click('#view');
 await B.evaluate(s=>hiking.multiApi.teleport({zone:'route',s,lateral:0}),pa.s+5);await sleep(1500);

 // ── ① 이름표 → 고르기 카드, 👥 목록
 await waitFor(A,()=>[...document.querySelectorAll('.multi-tag[data-kind=name]')].some(t=>t.style.display!=='none'&&t.textContent.includes('바위다람쥐')&&(r=>r.top>0&&r.bottom<innerHeight)(t.getBoundingClientRect())),null,15000).catch(async e=>{log('이름표 진단',await A.evaluate(()=>({roster:hiking.multi().roster,tags:[...document.querySelectorAll('.multi-tag')].map(t=>({kind:t.dataset.kind,display:t.style.display,text:t.textContent,tr:t.style.transform})),me:hiking.position(),pair:hiking.multi().pair})));log('B 자리',await pos(B));throw e;});
 const tagBox=await A.evaluate(()=>{const t=[...document.querySelectorAll('.multi-tag[data-kind=name]')].find(t=>t.style.display!=='none'&&t.textContent.includes('바위다람쥐'));const r=t.querySelector('.multi-tag-name').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,w:r.width,h:r.height};});
 log('클릭 전 greet',await A.evaluate(()=>hiking.multiApi.greet()));
 log('tagBox',tagBox);
 log('맨 위 요소',{top:await A.evaluate(({x,y})=>{const e=document.elementFromPoint(x,y);return e?e.tagName+'.'+e.className+' / '+(e.parentElement?.className||''):null;},tagBox)});
 await A.mouse.click(tagBox.x,tagBox.y);await sleep(800);
 log('클릭 뒤 greet',await A.evaluate(()=>({g:hiking.multiApi.greet(),card:!document.querySelector('.gr-card')?.hidden,pick:!document.querySelector('.pw-pick')?.hidden,auto:hiking.snapshot().auto})));
}catch(e){log('오류',{m:e.message});}
await browser.close();await vite?.close();process.exit(0);
