import {chromium,devices} from '@playwright/test';
const base=process.env.BASE_URL??'http://127.0.0.1:5420/hiking/';
const b=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const ctx=await b.newContext({...devices['iPhone 13'],deviceScaleFactor:2});
await ctx.addInitScript(()=>{localStorage.setItem('gwanak-sound-enabled','false');});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(base+'?start=gate&time=11:00&weather=clear&quality=low');
await p.waitForFunction(()=>window.hiking?.started&&window.hiking?.landscape().ready&&!hiking.rendering().compiling,null,{timeout:600000});
await p.waitForTimeout(800);
for(const id of ['spring','stamp-2']){
 const ok=await p.evaluate(id=>hiking.jumpNear(id,{back:3,face:true,along:0}),id);await p.waitForTimeout(900);
 const r=await p.evaluate(()=>({view:hiking.interaction().view,pills:document.querySelectorAll('.ix-pill').length,wrapHidden:document.querySelector('.ix-pill-wrap')?.hidden,wrapParent:document.querySelector('.ix-pill-wrap')?.parentElement?.className,todo:[...document.querySelectorAll('[data-uf=todo]')].map(e=>e.className+'|'+e.textContent.trim().slice(0,20)),snap:hiking.snapshot().s}));
 console.log(id,ok,JSON.stringify(r).slice(0,900));
}
await p.screenshot({path:'artifacts/merge-baseline/step3/fix/probe-ix-mobile.png'});
console.log('errs',errs);await b.close();
