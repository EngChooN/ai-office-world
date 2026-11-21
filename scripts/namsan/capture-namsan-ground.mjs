// 남산 바닥 풀·나무 확인 촬영(월드아트 11-21): node scripts/namsan/capture-namsan-ground.mjs [폴더] [s,…]
// 떠 있는 개발 서버(BASE_URL 기본 http://127.0.0.1:5173)의 실제 게임 /hiking/namsan/ 을 PC 1920×1080·휴대폰 390×844(터치)로 찍는다.
// 결과: artifacts/<폴더>/<pc|phone>-s<거리>.png, 풀 통계·오류는 표준 출력.
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
const [dir='namsan-ground',spots='150,330,560']=process.argv.slice(2);
const out=`artifacts/${dir}`;mkdirSync(out,{recursive:true});
const base=process.env.BASE_URL??'http://127.0.0.1:5173';
const only=(process.env.ONLY??'pc,phone').split(',');
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
for(const [tag,w,h,touch] of [['pc',1920,1080,false],['phone',390,844,true]]){
 if(!only.includes(tag))continue;
 const ctx=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:touch?2:1,isMobile:touch,hasTouch:touch});
 await ctx.addInitScript(()=>{localStorage.setItem('gwanak-sound-enabled','false');});
 const p=await ctx.newPage(),logs=[];
 p.on('pageerror',e=>logs.push('pageerror: '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/WebSocket|favicon|open-meteo|net::ERR/.test(m.text()))logs.push(m.text().slice(0,200));});
 await p.goto(`${base}/hiking/namsan/?time=13:00&weather=clear&season=summer`);
 await p.waitForFunction(()=>window.namsan?.started,null,{timeout:180000});
 for(const s of spots.split(',')){
  await p.evaluate(s=>window.namsan.jump(+s),s);await p.waitForTimeout(+(process.env.SETTLE??3500));
  await p.screenshot({path:`${out}/${tag}-s${s}.png`});
  console.log(tag,s,JSON.stringify(await p.evaluate(()=>window.namsan.status?.().s)));
 }
 console.log(tag,logs.length?[...new Set(logs)].join('\n'):'오류 0건');
 await ctx.close();
}
await browser.close();
