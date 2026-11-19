import {chromium,webkit} from '@playwright/test';
const base=process.env.BASE??'https://engchoon.github.io/ai-office-world',TAG=process.env.TAG??'live';
const b=await webkit.launch();
for(const [w,h] of [[360,640],[390,844],[430,932]])for(const id of ['gwanak','namsan']){
const ctx=await b.newContext({viewport:{width:w,height:h},isMobile:true,hasTouch:true,deviceScaleFactor:2});await ctx.addInitScript(()=>localStorage.clear());
const p=await ctx.newPage();await p.goto(base+'/hiking/?pick=on&server='+encodeURIComponent('ws://127.0.0.1:9'));
await p.waitForSelector(`[data-pk-free="${id}"]`);await p.waitForTimeout(1200);
for(let i=0;i<3;i++){await p.tap(`[data-pk-free="${id}"]`);await p.waitForTimeout(500);if(await p.$eval('.pk-free',e=>!e.hidden).catch(()=>false))break;}
const r=await p.evaluate(()=>{const f=document.querySelector('.fs-pick'),q=f.getBoundingClientRect();const bs=[...f.querySelectorAll('button')].map(b=>b.getBoundingClientRect()).filter(x=>x.width);return {sheet:[Math.round(q.top),Math.round(q.bottom)],scroll:[f.scrollHeight,f.clientHeight],below:bs.filter(x=>x.bottom>innerHeight).length,n:bs.length};});
console.log(w,h,id,JSON.stringify(r));await p.screenshot({path:`/tmp/pkfree-${TAG}-${w}-${id}.png`});await ctx.close();}
await b.close();
