// 크리스마스 광장 동시 인원 측정(월드개발, 2026-11-17): 기본 화면(시안 B, 11-17부터 기본) 광장에 가짜 접속자(Node WebSocket 봇)를 채우고 한 화면을 잰다.
//  - 서버 정원은 MAX_PER_ROOM_CHRISTMAS=30으로 띄운다(11-17부터 코드 기본값도 30).
//  - 인원 N(나 포함) = 1·20·30. 봇 N−1명: 회전목마 7자리(act.mg 1~7)·아이스링크 8명(얼음 위에서 돎)·눈싸움 마당 6명(1.5초마다 던짐)·나머지는 광장을 걸음. 모두 10Hz 위치.
//  - 화면 2종: PC 1920×1080 · 휴대폰 흉내 390×844(배율 2, 터치, CPU 1/4 속도). 화면마다 8초 동안 프레임·그리기 횟수·삼각형·받은 바이트·메모리.
//  - 놀이 확인(30명): 화면이 회전목마 8번째 자리에 앉음 → 9번째 봇은 ride:no · 링크 들어가기 · 오류 0.
//   node scripts/measure-christmas-crowd.mjs → artifacts/christmas-crowd/report.json, *.png
import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {startServer} from '../server/multi-server.mjs';
import {CAROUSEL,CAROUSEL_SEATS,RINK,inRink} from '../src/christmas/festive-layout.js';
import {SNOWBALL_YARD,SPAWN} from '../src/christmas/layout.js';

const dir='artifacts/christmas-crowd',multiPort=Number(process.env.MULTI_PORT??8796),room='눈마을-2';mkdirSync(dir,{recursive:true});
const SIZES=(process.env.SIZES??'1,20,30').split(',').map(Number);
const {createServer}=await import('vite');const port=Number(process.env.PORT??5194);
const vite=await createServer({server:{port,host:'127.0.0.1',strictPort:true,hmr:false,watch:null},logLevel:'warn'});await vite.listen(); // hmr·watch 끔: 측정 중 다른 직원이 파일을 고쳐도 페이지가 다시 열리지 않게
const pageUrl=`http://127.0.0.1:${port}`,wsUrl=`ws://127.0.0.1:${multiPort}`;
const srv=startServer({PORT:String(multiPort),HOST:'127.0.0.1',DATA_DIR:`${dir}/data`,MAX_PER_ROOM_CHRISTMAS:'30'},{quiet:true});await srv.ready;
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const out={at:new Date().toISOString(),runs:[],checks:{},errors:[]};let fail=false;
const check=(name,ok,detail={})=>{out.checks[name]={ok:!!ok,...detail};if(!ok)fail=true;console.log(ok?'통과':'실패',name,JSON.stringify(detail).slice(0,300));};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const until=async(fn,ms=15000,step=150)=>{const end=Date.now()+ms;while(Date.now()<end){try{if(await fn())return true;}catch{}await sleep(step);}return false;};

// 봇 역할: 회전목마(자리 수 −1명, mg 1~), 링크 8명, 눈싸움 6명, 나머지 광장 걷기(자리 수는 festive-layout.js)
// FIGHT_ALL=1: 모두 눈싸움 마당에서 0.9초마다 던짐(30명 동시 눈덩이), 재는 화면도 마당 안
const FIGHT_ALL=process.env.FIGHT_ALL==='1',THROW_MS=FIGHT_ALL?900:1500;
const MG=Math.min(CAROUSEL_SEATS.length-1,12),ROLE=i=>FIGHT_ALL?'fight':i<MG?'carousel':i<MG+8?'rink':i<MG+14?'fight':'walk';
function bot(i){
 const ws=new WebSocket(wsUrl),b={i,ws,got:[],id:null,full:false,role:ROLE(i),bytes:0,msgs:0};
 let t=i*.7,seq=0,timer=null,thrower=null;
 const send=m=>{if(ws.readyState===1)ws.send(JSON.stringify(m));};
 const where=()=>{
  switch(b.role){
   case 'carousel':{const a=CAROUSEL.step.a+(i+1)*.6;return {x:CAROUSEL.x+Math.sin(a)*1.5,z:CAROUSEL.z+Math.cos(a)*1.5,h:0,v:0};}
   case 'rink':{const a=t*.5+i,rx=RINK.w/2-1.2,rz=RINK.d/2-1;return {x:RINK.x+Math.sin(a)*rx*(.6+.4*(i%2)),z:RINK.z+Math.cos(a)*rz*(.6+.4*(i%2)),h:a+Math.PI/2,v:1.5};}
   case 'fight':{const Y=SNOWBALL_YARD,a=t*.3+i,r=FIGHT_ALL?.15+(i%5)*.07:.3;return {x:Y.x+Math.sin(a)*Y.w*r,z:Y.z+Math.cos(a)*Y.d*r,h:a,v:1};}
   default:{const a=t*.2+i,r=5+i%6*1.8;return {x:Math.sin(a)*r,z:4+Math.cos(a)*r*.7,h:a+Math.PI/2,v:1.4};}
  }};
 ws.onopen=()=>send({t:'hello',exp:'christmas',room,name:`봇${i}`});
 ws.onmessage=e=>{b.bytes+=e.data.length;b.msgs++;const m=JSON.parse(e.data);b.got.push(m.t);if(b.got.length>200)b.got.shift();
  if(m.t==='welcome'){b.id=m.id;
   send({t:'act',a:{o:['santa','sweater','elf'][i%3],hat:['','santa','antlers','beanie'][i%4],sc:i%2,d:0,...(b.role==='carousel'?{mg:i+1}:{})}});
   const pos=()=>{const p=where();seq=(seq+1)&0xffff;send({t:'s',q:seq,z:0,x:+p.x.toFixed(2),y:+p.z.toFixed(2),h:+p.h.toFixed(2),v:p.v,f:0});};
   pos();timer=setInterval(()=>{t+=.1;pos();},100);
   b.j=setInterval(()=>send({t:'j'}),3000);
   if(b.role==='fight')thrower=setInterval(()=>{const p=where();send({t:'sb:throw',x:p.x,z:p.z,dx:Math.sin(t+i),dz:Math.cos(t+i),d:8});},THROW_MS);}
  if(m.t==='full')b.full=true;};
 b.close=()=>{clearInterval(timer);clearInterval(b.j);clearInterval(thrower);try{ws.close();}catch{}};
 b.send=send;
 return b;
}
async function open(name,vp,{mobile=false}={}){
 const ctx=await browser.newContext({viewport:vp,deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});
 await ctx.addInitScript(()=>{localStorage.clear();localStorage.setItem('xmas-world:v1',JSON.stringify({look:{outfit:'santa'},wardrobe:[],tip:true,zones:['fight','snowman','sled','fire']}));
  // 받은·보낸 바이트(이 화면의 WebSocket)
  const W=window.WebSocket;window.__net={rx:0,tx:0,msgs:0};
  window.WebSocket=class extends W{constructor(...a){super(...a);this.addEventListener('message',e=>{window.__net.rx+=e.data.length??e.data.byteLength??0;window.__net.msgs++;});}send(d){window.__net.tx+=d.length??d.byteLength??0;super.send(d);}};});
 const p=await ctx.newPage();p.ctx=ctx;p.mobile=mobile;
 p.on('pageerror',e=>out.errors.push(`${name}: ${e.message}`));
 p.on('console',m=>{if(m.type()==='error'&&!/WebSocket connection|favicon|ERR_CONNECTION_REFUSED|Failed to load resource/.test(m.text()))out.errors.push(`${name}: ${m.text()}`);});
 if(mobile){const cdp=await ctx.newCDPSession(p);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});}
 await p.goto(`${pageUrl}/christmas/?capture=1&multi=${encodeURIComponent(room)}&server=${encodeURIComponent(wsUrl)}&name=${encodeURIComponent(name)}`);
 await p.waitForFunction(()=>window.xmas?.multi?.state==='online',null,{timeout:180000});
 return p;
}
const st=p=>p.evaluate(()=>window.xmas.status());
async function sample(p,secs=8){
 await p.evaluate(()=>{window.__net.rx=0;window.__net.tx=0;window.__net.msgs=0;window.__t0=performance.now();});
 const fps=[],calls=[],tris=[];
 for(let k=0;k<secs;k++){await sleep(1000);const s=await p.evaluate(()=>({fps:window.xmas.fps,calls:window.xmas.status().calls,tris:window.xmas.status().tris}));fps.push(s.fps);calls.push(s.calls);tris.push(s.tris);}
 const net=await p.evaluate(()=>({...window.__net,secs:(performance.now()-window.__t0)/1000,heap:performance.memory?.usedJSHeapSize??0}));
 const s=await st(p),bodies=s.multi.people.filter(x=>x.shown).reduce((o,x)=>(o[x.body]=(o[x.body]??0)+1,o),{});
 const avg=a=>+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1);
 return {fpsAvg:avg(fps),fpsMin:+Math.min(...fps).toFixed(1),calls:Math.max(...calls),tris:Math.max(...tris),shown:s.multi.people.filter(x=>x.shown).length,bodies,
  rxKBps:+(net.rx/1024/net.secs).toFixed(1),rxMsgPs:+(net.msgs/net.secs).toFixed(0),txKBps:+(net.tx/1024/net.secs).toFixed(2),heapMB:+(net.heap/1048576).toFixed(0)};
}

let bots=[];
const fill=async n=>{while(bots.length<n){bots.push(bot(bots.length));await sleep(30);}while(bots.length>n)bots.pop().close();
 await until(()=>bots.every(b=>b.id||b.full),20000);};
try{
 for(const [label,vp,mobile] of [['PC',{width:1920,height:1080},false],['휴대폰',{width:390,height:844},true]]){
  bots.forEach(b=>b.close());bots=[];await sleep(800);
  const p=await open(label==='PC'?'재는PC':'재는폰',vp,{mobile});
  for(const n of SIZES){
   await fill(n-1);
   await until(async()=>(await st(p)).multi.people.filter(x=>x.shown).length>=n-1,40000);
   // 광장 입구(출현 자리)에서 광장 쪽을 봄 + 넓게 보는 시점
   const at=FIGHT_ALL?[SNOWBALL_YARD.x+SNOWBALL_YARD.w/2-1.5,SNOWBALL_YARD.z,Math.PI/2]:[SPAWN.x,SPAWN.z,0];
   await p.evaluate(([x,z,h])=>{window.xmas.teleport(x,z,h);Object.assign(window.xmas.cam,{dist:9,pitch:.42,yaw:h});},at);
   await sleep(2500);
   if(process.env.PROFILE&&mobile){const cdp=await p.ctx.newCDPSession(p);await cdp.send('Profiler.enable');await cdp.send('Profiler.start');await sleep(4000);const {profile}=await cdp.send('Profiler.stop');
    const self=new Map(),byId=new Map(profile.nodes.map(n=>[n.id,n]));const dt=profile.timeDeltas;let tot=0;
    profile.samples.forEach((id,i)=>{const n=byId.get(id),f=n.callFrame,k=`${f.functionName||'(익명)'} ${f.url.split('/').slice(-2).join('/')}:${f.lineNumber}`;self.set(k,(self.get(k)??0)+(dt[i]??0));tot+=dt[i]??0;});
    console.log('PROFILE',JSON.stringify([...self].sort((a,b)=>b[1]-a[1]).slice(0,22).map(([k,v])=>[k,+(v/tot*100).toFixed(1)])));}
   const r={screen:label,people:n,...(FIGHT_ALL?{mode:'눈싸움 전원'}:{}),...await sample(p)};out.runs.push(r);console.log(JSON.stringify(r));
   if(n===Math.max(...SIZES))await p.screenshot({path:`${dir}/${mobile?'mobile':'pc'}-${n}${FIGHT_ALL?'-fight':''}.png`});
  }
  // 놀이 확인(가장 큰 인원): 회전목마 빈 자리에 앉음 · 같은 자리를 고른 다른 사람은 ride:no · 남은 자리를 봇이 다 채우면 「다 찼어요」 · 링크
  if(label==='PC'&&Math.max(...SIZES)>=9&&!FIGHT_ALL){
   await p.evaluate(()=>window.xmas.carousel.goTo());await sleep(400);
   await p.evaluate(()=>window.xmas.doAction('mg:ride'));await sleep(1200);
   const s=await st(p),mine=s.carousel.seat;check('30명: 회전목마 빈 자리에 앉음(다른 사람 자리와 안 겹침)',s.carousel.riding&&!s.carousel.taken.includes(mine),{seat:mine,taken:s.carousel.taken});
   // 자리가 많으면 걷는 봇이 없을 수 있어 회전목마가 아닌 봇을 씀
   const extra=bots.find(b=>b.role==='walk')??bots.find(b=>b.role!=='carousel');extra.got.length=0;extra.send({t:'act',a:{o:'santa',mg:mine+1}});
   check('30명: 같은 자리 고른 다른 사람은 ride:no',await until(()=>extra.got.includes('ride:no'),5000));
   await p.evaluate(()=>window.xmas.doAction('mg:off'));await sleep(1000); // 서버가 내 자리를 비운 뒤
   // 남은 빈 자리를 회전목마가 아닌 봇들이 채움 → 화면에서 타기 = 「다 찼어요」
   const free=[...Array(CAROUSEL_SEATS.length).keys()].filter(k=>!s.carousel.taken.includes(k)),fillers=bots.filter(b=>b.role!=='carousel').slice(0,free.length);
   fillers.forEach((b,i)=>b.send({t:'act',a:{o:'elf',mg:free[i]+1}}));
   await until(async()=>(await st(p)).carousel.taken.length>=CAROUSEL_SEATS.length,6000);
   await p.evaluate(()=>window.xmas.carousel.goTo());await sleep(300);await p.evaluate(()=>window.xmas.doAction('mg:ride'));await sleep(300);
   {const s2=await st(p);check('30명: 자리가 다 차면 화면에서 타기 → 「다 찼어요」(안 탐)',!s2.carousel.riding&&s2.carousel.taken.length>=CAROUSEL_SEATS.length,{taken:s2.carousel.taken.length});}
   fillers.forEach(b=>b.send({t:'act',a:{o:'elf',mg:0}}));await p.evaluate(()=>window.xmas.doAction('mg:off'));await sleep(400);
   await p.evaluate(()=>{window.xmas.rink.goTo();window.xmas.doAction('rk:in');});await sleep(600);
   const s3=await st(p);check('30명: 링크 들어가기(봇 8명이 얼음 위)',s3.rink.inside&&s3.rink.onIce,{rink:s3.rink});
   await p.evaluate(()=>{const c=window.xmas.cam;c.yaw=-Math.PI/2;c.pitch=.45;c.dist=8;});await sleep(800);await p.screenshot({path:`${dir}/pc-rink-30.png`});
   await p.evaluate(()=>window.xmas.doAction('rk:out'));
  }
  await p.ctx.close();
 }
 check('봇 접속 모두 성공(정원 안)',bots.every(b=>b.id),{full:bots.filter(b=>b.full).length});
 const rx=bots.filter(b=>b.id).map(b=>b.bytes);out.botRx=rx.length?{avgKB:+(rx.reduce((a,b)=>a+b,0)/rx.length/1024).toFixed(0)}:null;
}catch(e){check('예외 없음',false,{e:String(e.stack??e).slice(0,500)});}
check('페이지 오류 0',out.errors.length===0,{errors:out.errors.slice(0,5)});
writeFileSync(`${dir}/report${FIGHT_ALL?'-fight':''}.json`,JSON.stringify(out,null,1));
bots.forEach(b=>b.close());await browser.close();await vite.close();await srv.close?.();
process.exit(fail?1:0);
