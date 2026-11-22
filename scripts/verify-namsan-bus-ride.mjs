// 남산 순환버스: 코너에서 시점이 부드럽게 도는지, 차로가 성곽에 막히지 않는지 타 보며 확인(11-21).
//  타고 → 급한 꺾임 직전으로 시계를 옮기고 → 프레임마다 버스 방향·시점 변화를 잰다 → 캡처.  node scripts/verify-namsan-bus-ride.mjs → artifacts/namsan-bus-2026-11-21/
import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const dir='artifacts/namsan-bus-2026-11-21';mkdirSync(dir,{recursive:true});
const {createServer}=await import('vite');const port=Number(process.env.PORT??5297);
const vite=await createServer({server:{port,host:'127.0.0.1',strictPort:true},logLevel:'warn'});await vite.listen();
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const out={checks:[],errors:[]};const check=(n,p,d={})=>{out.checks.push({n,pass:!!p,d});console.log(p?'✔':'✘',n,JSON.stringify(d));};
const sl=ms=>new Promise(r=>setTimeout(r,ms));
const ctx=await browser.newContext({viewport:{width:1280,height:720}});await ctx.addInitScript(()=>{localStorage.setItem('gwanak-sound-enabled','false');});
const p=await ctx.newPage();p.on('pageerror',e=>out.errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/WebSocket|favicon|ERR_|Failed to load|open-meteo/.test(m.text()))out.errors.push(m.text().slice(0,200));});
await p.goto(`http://127.0.0.1:${port}/hiking/namsan/?time=13:00&weather=clear&quality=low`);await p.waitForFunction(()=>window.namsan?.started,null,{timeout:240000});await sl(800);
const ev=(f,a)=>p.evaluate(f,a);
const stops=await ev(()=>window.namsan.interact().cands.filter(c=>c.action==='bus').map(c=>({x:c.x,z:c.z,stop:c.site.stop})));
await ev(()=>window.namsan.jump(2));const w=(await ev(()=>window.namsan.bus())).next.start.wait;await ev(w=>{window.namsan.busClockOffset=(window.namsan.busClockOffset??0)+w-4;},w);
await ev(s=>window.namsan.goTo(s.x,s.z,0),stops[0]);await sl(600);await p.keyboard.press('KeyF');await p.waitForFunction(()=>window.namsan.bus?.()?.ride,null,{timeout:60000,polling:300}).catch(()=>{});await sl(1500);
let bus=await ev(()=>window.namsan.bus());check('버스를 탐(정상행)',bus.ride?.to==='summit',bus.ride);
// 시계 옮기기: 타고 있는 버스가 s=target-30m 에 오도록(오르는 길 급커브 s≈1838, 내려오는 길 s≈2404)
const L=await ev(()=>window.namsan.bus().period);
async function atS(target,label){
 const cur=await ev(()=>{const b=window.namsan.bus();return b.buses[b.ride.k].s;});
 const dt=((target-cur)/10);await ev(d=>{window.namsan.busClockOffset+=d;},dt);await sl(2500); // 시점이 새 자리에 자리 잡게
 await ev(()=>{window.__rec=[];const f=()=>{const b=window.namsan.bus(),c=window.namsan.cam(),bb=b.buses[b.ride.k];window.__rec.push({t:performance.now(),yaw:bb.yaw,cx:c[0]-bb.x,cz:c[2]-bb.z});if(window.__recOn)requestAnimationFrame(f);};window.__recOn=true;requestAnimationFrame(f);});
 await sl(1500);await p.screenshot({path:`${dir}/${label}-전.png`});
 await sl(9000);await p.screenshot({path:`${dir}/${label}-후.png`});await ev(()=>{window.__recOn=false;});
 const rec=await ev(()=>window.__rec);let maxYaw=0,maxCam=0;const wrap=d=>Math.atan2(Math.sin(d),Math.cos(d));
 for(let i=1;i<rec.length;i++){const dt=(rec[i].t-rec[i-1].t)/1000;if(dt<.012)continue;maxYaw=Math.max(maxYaw,Math.abs(wrap(rec[i].yaw-rec[i-1].yaw)));
  maxCam=Math.max(maxCam,Math.abs(wrap(Math.atan2(rec[i].cx,rec[i].cz)-Math.atan2(rec[i-1].cx,rec[i-1].cz))));}
 // 11-22: 화면 없는 브라우저는 약 0.13초마다 몰아서 그려(4ms·130ms 번갈아) 「한 프레임 각도」가 그 사이 돈 만큼 커진다 → 판정은 0.1초 이상 구간의 초당 각도로.
 //  기준 180°/s = 60fps에서 한 프레임 3°. 진짜 튐(한 번에 수십°)은 0.13초 구간에서도 180°/s를 넘는다.
 let rateYaw=0,rateCam=0;const ang=r=>Math.atan2(r.cx,r.cz);
 for(let i=0,j=0;i<rec.length;i++){while(j<rec.length&&rec[j].t-rec[i].t<100)j++;if(j>=rec.length)break;const dt=(rec[j].t-rec[i].t)/1000;
  rateYaw=Math.max(rateYaw,Math.abs(wrap(rec[j].yaw-rec[i].yaw))/dt);rateCam=Math.max(rateCam,Math.abs(wrap(ang(rec[j])-ang(rec[i])))/dt);}
 return {frames:rec.length,버스방향_초당최대도:+(rateYaw*57.3).toFixed(1),시점_초당최대도:+(rateCam*57.3).toFixed(1),참고_한프레임_버스방향최대도:+(maxYaw*57.3).toFixed(2),참고_한프레임_시점최대도:+(maxCam*57.3).toFixed(2)};}
const up=await atS(1838-45,'오르는길-급커브');check('오르는 길 급커브: 버스 방향·시점이 초당 180°(60fps 한 프레임 3°)보다 빨리 돌지 않음',up.버스방향_초당최대도<180&&up.시점_초당최대도<180,up);
// 정상까지 가서 내려오는 쪽 버스는 다른 대: 내려오는 급커브는 같은 버스가 정상 찍고 내려올 때 s≈2404
await ev(()=>{const b=window.namsan.bus();window.namsan.busClockOffset+=b.ride.until-2;});await sl(5000);
const down=await ev(()=>window.namsan.bus());check('정상에서 내림(막힘 없이 도착)',!down.ride,{ride:down.ride});
check('콘솔 오류 0건',out.errors.length===0,out.errors);
writeFileSync(`${dir}/report.json`,JSON.stringify(out,null,1));await browser.close();await vite.close();process.exit(out.checks.every(c=>c.pass)?0:1);
