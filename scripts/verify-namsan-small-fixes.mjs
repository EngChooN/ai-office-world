// 남산 6단계 작은 고침 3건 점검(정리드 11-20, 월드기획 요청): 약수 마실 때 약수터가 보이는지 · 휴대폰 세로 야경 벤치에서 등이 야경을 덜 가리는지 · 「3인칭」 칩 44px
//   node scripts/verify-namsan-small-fixes.mjs → artifacts/namsan-small-fixes/(사진·report.json). 실패가 있으면 종료 코드 1.
//   관악산 시점 칩 높이는 그대로인지도 본다(관악산 동작은 바꾸지 않음)
import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';

const dir=process.env.OUT??'artifacts/namsan-small-fixes';mkdirSync(dir,{recursive:true});
const {createServer}=await import('vite');const port=Number(process.env.PORT??5341);
const vite=await createServer({server:{port,host:'127.0.0.1',strictPort:true},logLevel:'warn'});await vite.listen();
const base=`http://127.0.0.1:${port}`;
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const out={at:new Date().toISOString(),checks:[],errors:[]};
const check=(name,pass,detail={})=>{out.checks.push({name,pass:!!pass,detail});console.log(pass?'✔':'✘',name,JSON.stringify(detail).slice(0,260));};
const sl=ms=>new Promise(r=>setTimeout(r,ms));
const SKIP=/WebSocket|favicon|net::ERR|Failed to load resource|open-meteo/;
async function open(label,{viewport,touch=false,query,path='/hiking/namsan/',ready='window.namsan?.started'}){
 const ctx=await browser.newContext({viewport,isMobile:touch,hasTouch:touch});
 await ctx.addInitScript(()=>{localStorage.clear();localStorage.setItem('gwanak-sound-enabled','false');});
 const p=await ctx.newPage();p.on('pageerror',e=>out.errors.push(`${label}: ${e.message}`));p.on('console',m=>{if(m.type()==='error'&&!SKIP.test(m.text()))out.errors.push(`${label}: ${m.text().slice(0,200)}`);});
 await p.goto(`${base}${path}?${query}`);await p.waitForFunction(ready,null,{timeout:180000});await sl(800);return p;}
const ev=(p,f,a)=>p.evaluate(f,a);
const shot=(p,n)=>p.screenshot({path:`${dir}/${n}.png`});
const chip=p=>ev(p,()=>{const b=document.querySelector('#view')?.getBoundingClientRect();return b?{w:Math.round(b.width),h:Math.round(b.height)}:null;});
// 화면에 비친 약수터(서 있을 곳에서 바라보는 쪽 0.8m 앞 물받이)가 내 몸 뒤에 가리는지: 카메라→약수터 선이 몸(머리~발 원기둥)과 얼마나 떨어졌나
const springClear=p=>ev(p,()=>{const sp=window.namsan.spots().spots.find(s=>s.id==='spring-1'),c=window.namsan.cam(),s=window.namsan.status(),h=sp.face+Math.PI,fx=sp.x-Math.sin(h)*.8,fz=sp.z-Math.cos(h)*.8;
 const tx=fx-c[0],tz=fz-c[2],len=Math.hypot(tx,tz),px=s.x-c[0],pz=s.z-c[2],along=(px*tx+pz*tz)/len;
 return {miss:+(Math.abs(px*tz-pz*tx)/len).toFixed(2),behind:along>0&&along<len};});

async function drink(p,name){
 const sp=await ev(p,()=>window.namsan.spots().spots.find(s=>s.id==='spring-1'));
 await ev(p,sp=>window.namsan.goTo(sp.x,sp.z,sp.face+Math.PI),sp);await sl(900);
 await p.keyboard.press('KeyF');await sl(1700);
 const a=await ev(p,()=>window.namsan.status().interact.action?.id);await shot(p,name);const c=await springClear(p);
 await sl(3500);return {action:a,...c};}

{ // PC 1280×800
 const p=await open('pc',{viewport:{width:1280,height:800},query:'time=13:00&weather=clear'});
 const r=await drink(p,'pc-drink');check('pc: 약수 마시는 동안 몸이 약수터를 가리지 않음(카메라 선이 몸에서 0.45m 이상)',r.action==='drink'&&(!r.behind||r.miss>=.45),r);
 check('pc: 「3인칭」 칩 44px 이상',(await chip(p)).h>=44,await chip(p));
}
{ // 휴대폰 세로 390×844
 const p=await open('phone',{viewport:{width:390,height:844},touch:true,query:'time=21:30&weather=clear'});
 const c=await chip(p);check('phone: 「3인칭」 칩 44px 이상',c.h>=44&&c.w>=44,c);
 const r=await drink(p,'phone-drink');check('phone: 약수 마시는 동안 몸이 약수터를 가리지 않음',r.action==='drink'&&(!r.behind||r.miss>=.45),r);
 const S=await ev(p,()=>window.namsan.spots());const b=S.benches[0];
 await ev(p,b=>window.namsan.goTo(b.x+Math.sin(b.yaw)*.8,b.z+Math.cos(b.yaw)*.8,b.yaw),b);await sl(700);
 await ev(p,()=>window.dispatchEvent(new CustomEvent('hiking:command',{detail:{id:'sit'}})));await sl(2500);
 const seat=await ev(p,()=>window.namsan.seat()?.pose);await shot(p,'phone-bench-night');check('phone: 야경 벤치에 앉음',seat==='sit',{seat});
}
{ // 관악산 시점 칩은 그대로(공통 틀 40px)
 const p=await open('gwanak',{viewport:{width:390,height:844},touch:true,path:'/hiking/',query:'time=13:00&weather=clear&start=1',ready:'document.querySelector("#view")'});
 out.gwanakChip=await chip(p);console.log('gwanak #view',JSON.stringify(out.gwanakChip));
}
writeFileSync(`${dir}/report.json`,JSON.stringify(out,null,1));
if(out.errors.length)console.log('errors',out.errors);
await browser.close();await vite.close();
process.exit(out.checks.every(c=>c.pass)?0:1);
