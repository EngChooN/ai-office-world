// 관악산·남산 나란히 촬영(월드개발 11-19 이식): 낮/밤 × 1인칭/3인칭, PC·휴대폰. TAG=before|after
import {chromium} from '@playwright/test';
const TAG=process.env.TAG??'before',base=process.env.PAGE_URL??'http://127.0.0.1:5173',dir='artifacts/namsan-port';
const ONLY=(process.env.ONLY??'gwanak,namsan').split(','),TIMES=(process.env.TIMES??'21:30').split(','),VPS=(process.env.VPS??'pc,phone').split(',');
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));const errors=[];
const VP={pc:{width:1920,height:1080},phone:{width:390,height:844}};
for(const vpn of VPS)for(const mt of ONLY)for(const time of TIMES){
 const vp=VP[vpn],m=vpn==='phone';const ctx=await browser.newContext({viewport:vp,isMobile:m,hasTouch:m});
 await ctx.addInitScript(()=>{localStorage.clear();localStorage.setItem('gwanak-sound-enabled','false');});
 const p=await ctx.newPage();p.on('pageerror',e=>errors.push(`${mt}: ${e.message}`));
 const q=`time=${time}&weather=clear&server=off`;
 await p.goto(mt==='gwanak'?`${base}/hiking/?pick=off&start=entrance&${q}`:`${base}/hiking/namsan/?${q}`);
 await p.waitForFunction(()=>(window.hiking?.started===true)||window.namsan?.started,null,{timeout:240000});
 await sleep(5000);
 const t=time.replace(':','');
 await p.screenshot({path:`${dir}/${TAG}-${vpn}-${mt}-${t}-third.png`});
 await p.keyboard.press('KeyV');await sleep(2500);
 await p.screenshot({path:`${dir}/${TAG}-${vpn}-${mt}-${t}-first.png`});
 await ctx.close();
}
console.log('errors',JSON.stringify(errors));await browser.close();
