// 눈싸움 손맛 측정(월드개발, 2026-11-17 5차·6차): 기본 화면(시안 B) 두 화면(PC '하나' 던짐 · '둘' 맞음, PHONE=1이면 둘은 휴대폰 390×844·CPU 1/4)을 눈싸움 마당에 마주 세운다.
//  6차(맞음 = 눈덩이가 지나가는 순간 자리): 서버는 sb(길)·sbh(맞음)를 따로 보낸다. ⑥ 던진 뒤 바로 옆으로 비키는 상대 5번 → 맞힌 수(피하기)
//  - LAG_MS(기본 80)만큼 이 화면의 WebSocket 보내기·받기를 늦춰 실제 인터넷 왕복(약 0.16초)을 흉내 낸다(LAG_MS=0이면 이 맥 그대로).
//  ① 누른 뒤 눈덩이가 화면에 보이기까지(ms) ② 가만히 선 상대에게 자동 조준 5번 → 맞힌 수 ③ 옆으로 걷는 상대 5번 → 맞힌 수,
//  ④ 떨어지는 순간 던진 사람 화면에서 눈덩이 끝과 상대 몸의 거리(맞았는데 멀리 있거나, 몸에 닿았는데 안 맞은 것) ⑤ 맞은 쪽 반응(움찔·밀림·화면 눈)
//   node scripts/measure-snowfight-feel.mjs → artifacts/christmas-snowfight/feel-<LABEL>.json
import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {startServer} from '../server/multi-server.mjs';
import {SNOWBALL_YARD} from '../src/christmas/layout.js';

const LAG=Number(process.env.LAG_MS??80),LABEL=process.env.LABEL??'now';
const dir='artifacts/christmas-snowfight',multiPort=Number(process.env.MULTI_PORT??8798),room='눈마을-2';mkdirSync(dir,{recursive:true});
const {createServer}=await import('vite');const port=Number(process.env.PORT??5192);
const vite=await createServer({server:{port,host:'127.0.0.1',strictPort:true,hmr:false,watch:null},logLevel:'warn'});await vite.listen();
const pageUrl=`http://127.0.0.1:${port}`,wsUrl=`ws://127.0.0.1:${multiPort}`;
const srv=startServer({PORT:String(multiPort),HOST:'127.0.0.1',DATA_DIR:`${dir}/data`},{quiet:true});await srv.ready;
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const out={at:new Date().toISOString(),lag:LAG,label:LABEL,errors:[]};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const PHONE=process.env.PHONE==='1';
async function open(name,phone=false){
 const ctx=await browser.newContext(phone?{viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}:{viewport:{width:1280,height:800}});
 await ctx.addInitScript(lag=>{localStorage.clear();localStorage.setItem('xmas-world:v1',JSON.stringify({look:{outfit:'santa'},wardrobe:[],tip:true,zones:['fight','snowman','sled','fire']}));
  window.__sb=[];const W=window.WebSocket;
  window.WebSocket=class extends W{constructor(...a){super(...a);const add=this.addEventListener.bind(this);
    // 받기 늦추기: message 듣는 쪽을 감싼다
    this.addEventListener=(t,f,o)=>t==='message'&&lag?add(t,e=>setTimeout(()=>f.call(this,{data:e.data}),lag),o):add(t,f,o);
    add('message',e=>{try{const m=JSON.parse(e.data);if(m.t==='sb'||m.t==='sbh')setTimeout(()=>window.__sb.push({...m,at:performance.now()}),lag);}catch{}});}
   set onmessage(f){this.addEventListener('message',f);}
   send(d){if(lag)setTimeout(()=>{try{super.send(d);}catch{}},lag);else super.send(d);}};},LAG);
 const p=await ctx.newPage();p.on('pageerror',e=>out.errors.push(`${name}: ${e.message}`));
 if(phone){const cdp=await ctx.newCDPSession(p);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});}
 await p.goto(`${pageUrl}/christmas/?capture=1${phone?'&mobile=1':''}&multi=${encodeURIComponent(room)}&server=${encodeURIComponent(wsUrl)}&name=${encodeURIComponent(name)}`);
 await p.waitForFunction(()=>window.xmas?.multi?.state==='online',null,{timeout:120000});return p;
}
const Y=SNOWBALL_YARD,ax=Y.x,az=Y.z+4,bx=Y.x,bz=Y.z-3; // 7m 마주 봄(눈벽을 비킨 줄)
try{
 const A=await open('하나'),B=await open('둘',PHONE);out.phone=PHONE;
 const idB=await B.evaluate(()=>window.xmas.multi.id);
 await A.evaluate(([x,z])=>window.xmas.teleport(x,z,0),[ax,az]);await B.evaluate(([x,z])=>window.xmas.teleport(x,z,Math.PI),[bx,bz]);
 await sleep(2500);
 async function volley(label,move){
  const r={label,throws:0,hits:0,showMs:[],gapAtLand:[],ghost:0,miss:0};
  for(let k=0;k<5;k++){
   await A.evaluate(()=>window.xmas.snowfight.resetAmmo?.());
   if(move==='walk'){await B.keyboard.down(k%2?'KeyA':'KeyD');await sleep(350);}
   const n0=await A.evaluate(()=>window.__sb.length);
   const t0=await A.evaluate(()=>{const t=performance.now();window.__t0=t;window.xmas.snowfight.auto();return t;});
   // 피하기: 던지는 것을 보고(0.15초 뒤, 사람 반응) 옆으로 걷기 시작
   const b0=await B.evaluate(()=>({x:window.xmas.player.x,z:window.xmas.player.z}));
   if(move==='dodge'){await sleep(150);await B.keyboard.down(k%2?'KeyA':'KeyD');}
   // 눈덩이가 보이기까지
   const show=await A.evaluate(()=>new Promise(res=>{const s=window.__t0,f=()=>{if(window.xmas.snowfight.status().flying>0)return res(performance.now()-s);if(performance.now()-s>2000)return res(-1);requestAnimationFrame(f);};f();}));
   r.showMs.push(Math.round(show));r.throws++;
   // 떨어질 때: 던진 화면에서 눈덩이 끝과 B 몸 사이
   const land=await A.evaluate(id=>new Promise(res=>{const s=performance.now(),f=()=>{const st=window.xmas.snowfight.status();if(st.flying===0||performance.now()-s>3000){const h=window.xmas.multi.headOf(id);const p=h?.avatar?.root.position;const last=st.lastLand;res({p:p?{x:p.x,z:p.z}:null,last});return;}requestAnimationFrame(f);};f();}),idB);
   const b1=await B.evaluate(()=>({x:window.xmas.player.x,z:window.xmas.player.z}));(r.side??=[]).push(+Math.hypot(b1.x-b0.x,b1.z-b0.z).toFixed(2));
   if(move){await B.keyboard.up('KeyA');await B.keyboard.up('KeyD');await B.evaluate(([x,z])=>window.xmas.teleport(x,z,Math.PI),[bx,bz]);await sleep(400);}
   await sleep(LAG*2+300);
   const got=(await A.evaluate(()=>window.__sb)).slice(n0),sb0=got.find(m=>m.t==='sb'),sh=got.find(m=>m.t==='sbh'&&(sb0?.k==null||m.k===sb0.k)),sb=sh??sb0;
   const hit=(sh??sb0)?.hit===idB;if(hit)r.hits++;
   if(sb&&land.p){const e=land.last??{x:sb.tx,z:sb.tz},g=Math.hypot(e.x-land.p.x,e.z-land.p.z); // 화면에 떨어진 자리(없으면 서버 끝점) ↔ 상대 몸
   r.gapAtLand.push(+g.toFixed(2));if(hit&&g>.8)r.ghost++;if(!hit&&g<.35)r.miss++;}
   await sleep(900);
  }
  return r;
 }
 out.still=await volley('가만히 선 상대',false);console.log(JSON.stringify(out.still));
 out.moving=await volley('옆으로 걷는 상대','walk');console.log(JSON.stringify(out.moving));
 out.dodge=await volley('던진 뒤 비키는 상대','dodge');console.log(JSON.stringify(out.dodge));
 // 맞은 쪽 반응(같은 사람이 10초에 5번 넘게 맞히면 연출을 줄이므로 10.5초 쉬고)
 await sleep(10500);
 await A.evaluate(()=>window.xmas.snowfight.resetAmmo?.());
 await B.evaluate(()=>{window.__hitLog=[];const x=window.xmas,p0={x:x.player.x,z:x.player.z};window.__p0=p0;});
 await A.evaluate(()=>window.xmas.snowfight.auto());await sleep(1500+LAG*2);
 out.react=await B.evaluate(()=>{const x=window.xmas,s=x.snowfight.status();const last=window.__sb.at(-1);return {soft:!!last?.soft,hitMe:last?.hit===x.multi.id,pushed:+Math.hypot(x.player.x-window.__p0.x,x.player.z-window.__p0.z).toFixed(2),splat:document.querySelector('.xs-splat,.xf-splat,[data-splat]')?1:0,covers:s.covers,stun:s.stun};});
 console.log(JSON.stringify(out.react));
}catch(e){out.error=String(e.stack??e).slice(0,600);console.log(out.error);}
writeFileSync(`${dir}/feel-${LABEL}.json`,JSON.stringify(out,null,1));
console.log('errors',out.errors.length);
await browser.close();await vite.close();await srv.close?.();process.exit(0);
