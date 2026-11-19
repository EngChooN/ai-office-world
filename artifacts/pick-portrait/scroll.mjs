import {chromium} from '@playwright/test';
const b=await chromium.launch({channel:'chrome',headless:true});
for(const [w,h] of [[360,640],[390,844],[430,932]]){
const ctx=await b.newContext({viewport:{width:w,height:h},isMobile:true,hasTouch:true,deviceScaleFactor:2});await ctx.addInitScript(()=>localStorage.clear());
const p=await ctx.newPage();await p.goto(''+(process.env.BASE??'https://engchoon.github.io/ai-office-world')+'/hiking/?pick=on&dev=off&server='+encodeURIComponent('ws://127.0.0.1:9'));
await p.waitForSelector('[data-pk-go="namsan"]');await p.waitForTimeout(1200);
const cdp=await ctx.newCDPSession(p);
for(let k=0;k<3;k++){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:w/2,y:h*.8}]});for(let i=1;i<=10;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:w/2,y:h*.8-i*h*.05}]});await p.waitForTimeout(16);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(600);}
const r=await p.evaluate(()=>{const root=document.getElementById('mountain-pick');const g=document.querySelector('[data-pk-go="namsan"]').getBoundingClientRect();return {scrollTop:root.scrollTop,max:root.scrollHeight-root.clientHeight,btnBottom:Math.round(g.bottom),vh:innerHeight,sub:document.querySelector('.pk-sub')?.textContent};});
console.log(w,h,JSON.stringify(r));await p.screenshot({path:`/tmp/pk-scroll-${process.env.TAG??'live'}-${w}.png`});await ctx.close();}
await b.close();
