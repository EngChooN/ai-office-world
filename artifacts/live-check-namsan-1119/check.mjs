// 11-19 남산 배포 뒤 실제 주소 확인: 산 고르기 카드(관악산 1시간 37분·남산), /hiking/namsan/ 열림·정상 도착, 관악산 정상 도착, 출처 문구.
// 공개 멀티 서버에 시험 사람이 들어가지 않게 server=닫힌 이 맥 주소로 둔다.
import {chromium} from '@playwright/test';
const dir='artifacts/live-check-namsan-1119',base='https://engchoon.github.io/ai-office-world',SRV='server='+encodeURIComponent('ws://127.0.0.1:9'),Q='time=13:00&weather=clear';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal','--disable-features=LocalNetworkAccessChecks,PrivateNetworkAccessRespectPreflightResults']});
const out={at:new Date().toISOString(),checks:[],errors:[]};const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const check=(n,pass,d={})=>{out.checks.push({n,pass:!!pass,d});console.log(pass?'✔':'✘',n,JSON.stringify(d).slice(0,240));};
const SKIP=/WebSocket|favicon|net::ERR|Failed to load resource|open-meteo/;
async function open(label,url,vp={width:1920,height:1080}){const m=vp.width<900;const ctx=await browser.newContext({viewport:vp,isMobile:m,hasTouch:m});
 await ctx.addInitScript(()=>{if(!sessionStorage.getItem('__i')){localStorage.clear();sessionStorage.setItem('__i','1');}localStorage.setItem('gwanak-sound-enabled','false');});
 const p=await ctx.newPage();p.on('pageerror',e=>out.errors.push(`${label}: ${e.message}`));p.on('console',x=>{if(x.type()==='error'&&!SKIP.test(x.text()))out.errors.push(`${label}: ${x.text().slice(0,200)}`);});
 await p.goto(url,{waitUntil:'domcontentloaded',timeout:120000});return p;}
try{
 // 산 고르기 카드
 const pk=await open('pick',`${base}/hiking/?pick=on&dev=off&${Q}&${SRV}`,{width:390,height:844});
 await pk.waitForSelector('#mountain-pick [data-mountain="namsan"]',{timeout:90000});
 const cards=await pk.evaluate(()=>Object.fromEntries([...document.querySelectorAll('#mountain-pick .pk-card')].map(c=>[c.dataset.mountain,c.textContent.replace(/\s+/g,' ')])));
 check('관악산 카드 1시간 37분',cards.gwanak?.includes('1시간 37분')&&!cards.gwanak.includes('2시간 30분'),{g:cards.gwanak?.slice(0,160)});
 check('남산 카드 있음(30분)',cards.namsan?.includes('남산')&&cards.namsan.includes('30분'),{});
 await pk.screenshot({path:`${dir}/live-pick.png`});
 const help=await pk.evaluate(()=>document.getElementById('help')?.textContent??'');
 check('관악산 도움말 Copernicus 정해진 문구',help.includes('produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved'),{});
 // 남산 페이지 → 정상
 const ns=await open('namsan',`${base}/hiking/namsan/?${Q}&${SRV}`);
 await ns.waitForFunction(()=>window.namsan?.started,null,{timeout:180000});
 check('/hiking/namsan/ 열림',true,{url:ns.url()});
 const line=await ns.evaluate(()=>document.getElementById('source-line')?.textContent);check('남산 화면 출처 줄(OSM 한 번)',line?.includes('WorldDEM-30')&&line.split('OpenStreetMap').length===2,{line});
 await ns.evaluate(()=>window.namsan.jump(1035));await ns.evaluate(()=>window.namsan.setAuto(true));
 let s;for(let i=0;i<120;i++){s=await ns.evaluate(()=>window.namsan.status());if(s.summitOpen)break;await sleep(500);}
 check('남산 정상 도착(완등 카드)',s.summitOpen,{s:s.s,stamps:s.stamps});await sleep(800);await ns.screenshot({path:`${dir}/live-namsan-summit.png`});
 // 관악산 → 정상
 const gw=await open('gwanak',`${base}/hiking/?pick=off&start=summit&${Q}&${SRV}`);
 await gw.waitForFunction(()=>window.hiking?.started===true,null,{timeout:300000}).catch(async()=>{await gw.click('#mountain-pick [data-mountain=gwanak] [data-pk-go]').catch(()=>{});await gw.waitForFunction(()=>window.hiking?.started===true,null,{timeout:300000});});
 check('/hiking/ 관악산 열림',true,{});
 await sleep(1500);
 let real=false;for(let k=0;k<20&&!real;k++){await gw.keyboard.down('KeyW');await sleep(700);await gw.keyboard.up('KeyW');real=await gw.evaluate(()=>document.getElementById('summit').open);}
 check('관악산 정상 도착 창 열림',real,{});await sleep(1200);await gw.screenshot({path:`${dir}/live-gwanak-summit.png`});
}catch(e){check('실행 오류',false,{e:String(e).slice(0,300)});}
check('페이지 오류 없음',!out.errors.length,{errors:out.errors.slice(0,5)});
const {writeFileSync}=await import('node:fs');writeFileSync(`${dir}/report.json`,JSON.stringify(out,null,1));
await browser.close();process.exit(out.checks.every(c=>c.pass)?0:1);
